// Core modules and configuration
const express = require('express');
const cookieParser = require('cookie-parser');
require('dotenv').config();
const cors = require('cors');
const mongoose = require('mongoose');
const axios = require("axios");
const jwt = require('jsonwebtoken');

// User-related modules
const instruction = require('./prompt/instruction.js');
const userRoutes = require('./routes/userRoutes');
const User = require('./models/usermodel');
const scrapeBooking = require('./scraper/booking'); // <-- Add this import

// LLM Response Schema and Model (for storing/updating per-user LLM response)
 

// App setup
const app = express();
app.use(express.json());
app.use(cookieParser());
app.use(cors({
    origin: 'http://localhost:5173',
    methods: ['GET', 'POST'],
    credentials: true,
}));

// MongoDB connection
const MongoDB = process.env.Mongodb_Url;
mongoose.connect(MongoDB, {})
    .then(() => {
        console.log("MongoDB connected successfully");
    }).catch(err => {
        console.error("MongoDB connection error:", err);
        process.exit(1);
    });

// LLM API key
const key = process.env.Gemini_Api;

// LLM endpoint
app.post("/askllm", async (req, res) => {
    try {
        // Content-Type and body validation
        if (!req.is('application/json')) {
            return res.status(415).json({ error: "Content-Type must be application/json" });
        }
        if (!req.body || typeof req.body !== 'object') {
            return res.status(400).json({ error: "Request body is missing or invalid." });
        }
        const userprompt = req.body.prompt;
        if (!userprompt) {
            return res.status(400).json({ error: "Missing prompt in request body." });
        }

        // Identify user
        let userId = null;
        let firstLlmResponse = null;
        const authHeader = req.headers.Authorization||req.headers.authorization;
        if (authHeader && authHeader.startsWith('Bearer ')) {
            const token = authHeader.split(' ')[1];
            try {
                const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
                userId = decoded.id;
                console.log("User verified. User ID from token:", userId);
                // Try to get the user's first LLM response from user collection
                const llmDoc = await User.findById(userId);
                if (llmDoc) {
                    firstLlmResponse = llmDoc.llmResponse; 
                }
            } catch (err) {
                console.log("User not verified. Invalid or expired token.");
                // Ignore token errors, don't block LLM response
            }
        } else {
            console.log("No Authorization header or Bearer token found.");
        }

        // Prepare prompt: if firstLlmResponse exists, combine it with new user input
        let combinedPrompt;
        if (firstLlmResponse) {
            combinedPrompt = instruction.getInstructionPrompt(
                "Previous LLM response:\n" + JSON.stringify(firstLlmResponse) +
                "\n\nUser input:\n" + userprompt
            );
        } else {
            combinedPrompt = instruction.getInstructionPrompt(userprompt);
        }

        // Call LLM API
        const response = await axios.post(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${key}`,
            {
                contents: [{ parts: [{ text: combinedPrompt }] }]
            },
            {
                headers: {
                    'Content-Type': 'application/json'
                }
            }
        );

        // Extract and parse LLM response
        let llmResponse1 = response.data.candidates?.[0]?.content?.parts?.[0]?.text || '';
        llmResponse1 = llmResponse1.replace(/```json|```/g, '').trim();

        let llmJson;
        try {
            llmJson = JSON.parse(llmResponse1);
        } catch {
            // Add reply property for frontend compatibility
            return res.json({ response: llmResponse1, reply: llmResponse1 });
        }

        req.app.locals.llmOutput = llmJson;
        console.log(req.app.locals.llmOutput);

        // Save or update LLMResponse for this user
        if (userId) {
            await User.updateOne(
                { _id: userId },
                { $set: { llmResponse: llmJson } },
                { upsert: true }
            );
        }
        else {
            // If userId is not available, you can choose to save the response in a different way or ignore it.
            console.log("User ID not found, skipping LLM response storage.");
        }
        
        // Check for check-in and check-out dates in the LLM response JSON
        const checkIn = llmJson?.checkIn;
        const checkOut = llmJson?.checkOut;
        const location = llmJson?.location;
        const filter = llmJson?.filter || 10000;

        if (!checkIn || !checkOut || checkIn === "" || checkOut === "") {
            // Add reply property for frontend compatibility
            return res.json({ response: "Please provide check in date and check out date for booking", reply: "Please provide check in date and check out date for booking" });
        }

        // Scraper integration: Only run if userId and required fields exist
        if (userId && location && checkIn && checkOut) {
            try {
                const hotels = await scrapeBooking({ userId, UserModel: User });
                // Optionally store hotels in user doc
                await User.updateOne(
                    { _id: userId },
                    { $set: { lastHotels: hotels } },
                    { upsert: true }
                );
                return res.json({
                    ...llmJson,
                    reply: "Here are some hotels I found for you.",
                    hotels: hotels.map(hotel => ({
                        name: hotel.name,
                        price: hotel.price,
                        link: hotel.link
                    })),
                });
            } catch (scrapeErr) {
                console.error("Scraper error:", scrapeErr);
                return res.json({
                    ...llmJson,
                    reply: "Could not fetch hotels at this time.",
                    hotels: []
                });
            }
        }

        // Add reply property for frontend compatibility
      

    } catch (error) {
        console.error(error?.response?.data || error.message || error);
        res.status(500).json({ error: 'An error occurred while processing your request.' });
    }
});

// User routes
app.use('/user', userRoutes);

// Start server
app.listen(5001, () => {
    console.log("Server running on port 5001");
});