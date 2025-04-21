//here i will connect my backend with llm and web scrapper
const express =require('express')
require('dotenv').config()
const axios = require("axios")
const app= express();
app.use(express.json());
const instruction =require('./prompt/instruction.js');

//adding llm to backend
key = process.env.Gemini_Api
console.log(key)
app.post("/askllm",
    async (req, res) => {
        try {
            const userprompt = req.body.prompt;
            if (!userprompt) {
                return res.status(400).json({ error: "Missing prompt in request body." });
            }
            
            // Correctly use the instruction function
            const combinedPrompt = instruction.getInstructionPrompt(userprompt);
            
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
            
            // Extract the actual text response from the API
            let llmResponse = response.data.candidates?.[0]?.content?.parts?.[0]?.text || '';

            // Remove Markdown code fences if present
            llmResponse = llmResponse.replace(/```json|```/g, '').trim();

            // Parse as JSON
            let llmJson;
            try {
                llmJson = JSON.parse(llmResponse);
            } catch {
                // If not JSON, show the response and don't store the output
                return res.json({ response: llmResponse });
            }

            // Store only valid JSON response from LLM
            req.app.locals.llmOutput = llmJson;
            console.log(req.app.locals.llmOutput);

            // Check for check-in and check-out dates in the LLM response JSON
            const checkIn = llmJson?.checkIn;
            const checkOut = llmJson?.checkOut;

            if (!checkIn || !checkOut || checkIn === "" || checkOut === "") {
                return res.json({ response: "Please provide check in date and check out date for booking" });
            }

            res.json(llmJson);

        }
        catch (error) {
            console.error(error?.response?.data || error.message || error); // Log error details
            res.status(500).json({ error: 'An error occurred while processing your request.' });
        }
    })
app.listen(5001)