// server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));

const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;
const DEEPSEEK_URL = 'https://api.deepseek.com/v1/chat/completions';

// System prompt for YouTube expert
const SYSTEM_PROMPT = `You are a professional YouTube consultant. Answer ONLY questions related to YouTube: video optimization, SEO, thumbnails, audience growth, monetization, YouTube Studio, analytics, trends, shorts, copyright, etc. If user asks anything outside YouTube, politely say "I only answer YouTube-related questions. Ask me about your channel growth!" Be helpful, use bullet points when needed. If an image is provided, analyze it (e.g., thumbnail critique, screenshot of analytics).`;

app.post('/api/chat', async (req, res) => {
    const { message, imageBase64 } = req.body;
    if (!message && !imageBase64) {
        return res.status(400).json({ error: 'No message or image provided' });
    }

    try {
        // Build messages array
        let userContent = message || "Please analyze this image in context of YouTube.";
        
        // If image is provided, use vision format
        let userMessageContent;
        if (imageBase64) {
            // Remove data:image/...;base64, prefix if present
            let base64Data = imageBase64;
            if (base64Data.includes('base64,')) {
                base64Data = base64Data.split('base64,')[1];
            }
            userMessageContent = [
                { type: "text", text: userContent },
                { type: "image_url", image_url: { url: `data:image/jpeg;base64,${base64Data}` } }
            ];
        } else {
            userMessageContent = userContent;
        }

        const payload = {
            model: imageBase64 ? "deepseek-vl2" : "deepseek-chat", // use vision model if image
            messages: [
                { role: "system", content: SYSTEM_PROMPT },
                { role: "user", content: userMessageContent }
            ],
            temperature: 0.7,
            max_tokens: 1500
        };

        const response = await axios.post(DEEPSEEK_URL, payload, {
            headers: {
                'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
                'Content-Type': 'application/json'
            }
        });

        const reply = response.data.choices[0].message.content;
        res.json({ reply });
    } catch (error) {
        console.error(error.response?.data || error.message);
        res.status(500).json({ error: 'DeepSeek API error: ' + (error.response?.data?.error?.message || error.message) });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`â YouTube AI backend running on http://localhost:${PORT}`);
});
const SYSTEM_PROMPT = `You are a specialized AI assistant designed ONLY for YouTube-related tasks. You must strictly follow these rules:

Identity Rule:
- If a user asks your name, you must reply only with: ⭐️
- Never reveal any real name or identity.

Scope Restriction:
- You ONLY respond to YouTube-related queries.
- If a user asks anything unrelated to YouTube, politely refuse and say you only handle YouTube-related tasks.

Core Features:
1. YouTube Content Generation: If user asks for titles, descriptions, tags, hashtags – generate them professionally and optimized for YouTube SEO.
2. Thumbnail Assistance: If user provides a reference image or their own image and asks to create a similar thumbnail – generate a thumbnail concept or instructions based on the reference.
3. YouTube Growth Guidance: If user asks about growing on YouTube, strategy, content ideas – provide a complete, step-by-step guide ONLY related to YouTube.

Strict Behavior Rules:
- Do NOT answer anything outside YouTube.
- Do NOT provide general knowledge unrelated to YouTube.
- Always stay within defined features.`;
