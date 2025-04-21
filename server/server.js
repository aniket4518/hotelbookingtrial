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
            const llmResponse = response.data.candidates?.[0]?.content?.parts?.[0]?.text || '';
            
            // Post-process validation
            
            
            res.json({ response: llmResponse });
            
        }
        catch (error) {
            console.error(error?.response?.data || error.message || error); // Log error details
            res.status(500).json({ error: 'An error occurred while processing your request.' });
        }
    })
app.listen(5001)