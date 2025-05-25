// Core modules and configuration
const express = require("express");
const cookieParser = require("cookie-parser");
require("dotenv").config();
const cors = require("cors");
const mongoose = require("mongoose");
const axios = require("axios");
const jwt = require("jsonwebtoken");
// const { spawn } = require("child_process");

// User-related modules
const instruction = require("./prompt/instruction.js");
const userRoutes = require("./routes/userRoutes");
const User = require("./models/usermodel");
// const scrapeBooking = require("./scraper/booking"); // <-- Add this import

// LLM Response Schema and Model (for storing/updating per-user LLM response)

// App setup
const app = express();
app.use(express.json());
app.use(cookieParser());
app.use(
  cors({
    origin: "http://localhost:5173",
    methods: ["GET", "POST"],
    credentials: true,
  })
);

// MongoDB connection
const MongoDB = process.env.Mongodb_Url;
mongoose
  .connect(MongoDB, {})
  .then(() => {
    console.log("MongoDB connected successfully");
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err);
    process.exit(1);
  });

// LLM API key
const key = process.env.Gemini_Api;

app.post("/askllm", async (req, res) => {
  try {
    // Content-Type and body validation
    if (!req.is("application/json")) {
      return res
        .status(415)
        .json({ error: "Content-Type must be application/json" });
    }
    if (!req.body || typeof req.body !== "object") {
      return res
        .status(400)
        .json({ error: "Request body is missing or invalid." });
    }
    const userprompt = req.body.prompt;
    if (!userprompt) {
      return res.status(400).json({ error: "Missing prompt in request body." });
    }

    // Identify user - uncommenting and fixing the authentication
    let userId = null;
    let firstLlmResponse = null;
    const authHeader = req.headers.Authorization || req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer")) {
      const token = authHeader.split(" ")[1];
      try {
        const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
        userId = decoded.id;
        console.log("User verified. User ID from token:", userId);
        // Try to get the user's first LLM response from user collection
        const user = await User.findById(userId);
        if (user) {
          firstLlmResponse = user.llmResponse;
        }
      } catch (err) {
        console.log(
          "User not verified. Invalid or expired token:",
          err.message
        );
        return res
          .status(401)
          .json({ error: "Invalid or expired authentication token." });
      }
    } else {
      console.log("No Authorization header or Bearer token found.");
      return res.status(401).json({ error: "Authentication token required." });
    }

    // Prepare prompt: if firstLlmResponse exists, combine it with new user input
    let combinedPrompt;
    if (firstLlmResponse) {
      combinedPrompt = instruction.getInstructionPrompt(
        "Previous LLM response:\n" +
          JSON.stringify(firstLlmResponse) +
          "\n\nUser input:\n" +
          userprompt
      );
    } else {
      combinedPrompt = instruction.getInstructionPrompt(userprompt);
    }

    // Call LLM API
    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${key}`,
      {
        contents: [{ parts: [{ text: combinedPrompt }] }],
      },
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    // Extract and parse LLM response
    let llmResponse1 =
      response.data.candidates?.[0]?.content?.parts?.[0]?.text || "";

    // let llmJson;
    // try {
    //   llmJson = JSON.parse(llmResponse1);
    // } catch {
    //   // Add reply property for frontend compatibility
    //   return res.json({ response: llmResponse1, reply: llmResponse1 });
    // }

    // Store the LLM response for debugging
    req.app.locals.llmOutput = llmResponse1;
    console.log(
      "LLM response for user",
      userId,
      ":",
      llmResponse1.substring(0, 200) + "..."
    );

    // Save or update LLMResponse for this user
    await User.findByIdAndUpdate(
      userId,
      { $set: { llmResponse: { text: llmResponse1, timestamp: new Date() } } },
      { new: true }
    );

    const parseAndFormat = (text) => {
      // Parse sections
      const sections = text.split(/\n\s*\n/); // Split by blank lines
      let output = [];

      for (const section of sections) {
        if (!section.trim()) continue;

        // Format each line with proper bullet points
        const lines = section
          .split("\n")
          .map((line) => line.trim())
          .filter((line) => line)
          .map((line) => {
            // Replace * with • if needed
            if (line.startsWith("*")) {
              return "• " + line.substring(1).trim();
            }
            // Already has bullet
            if (line.startsWith("•")) {
              return line;
            }
            return line;
          });

        output.push(lines.join("\n"));
      }

      // Join sections with double newlines
      return output.join("\n\n");
    };

    // Then update your response
    return res.json({
      response: parseAndFormat(llmResponse1),
      reply: parseAndFormat(llmResponse1),
    });
  } catch (error) {
    console.error(
      "Error in /askllm endpoint:",
      error?.response?.data || error.message || error
    );
    res
      .status(500)
      .json({ error: "An error occurred while processing your request." });
  }
});

// User routes
app.use("/user", userRoutes);

// Start server
app.listen(5001, () => {
  console.log("Server running on port 5001");
});
