import express from 'express';
import { rateLimit } from 'express-rate-limit';
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";

const app = express();
const PORT = process.env.PORT || 3000;

// THE BOUNCER: 3 requests per 15 mins to keep the "Free" quota alive for real users.
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  limit: 3, 
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { 
    error: "Signal Limit Reached", 
    message: "Free signals exhausted. Send 0.1 SOL to the wallet below to unlock the Premium Telegram Bot." 
  }
});

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

app.get('/hype-check', limiter, async (req, res) => {
  const token = req.query.q || "Solana"; 

  try {
    // UPDATED TO GEMINI 3 FLASH PREVIEW (The 2026 King of Speed)
    const model = genAI.getGenerativeModel({ 
      model: "gemini-3-flash-preview", 
      safetySettings: [
        { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
        { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
      ],
    });
    
    const prompt = `Act as a senior crypto whale analyst. Analyze the 2026 market sentiment for ${token}. 
    Provide: 
    1. A Hype Score (0-100).
    2. A 1-sentence 'Alpha' signal (Buy/Sell/Wait). 
    Tone: Professional, aggressive, and data-driven.`;
    
    const result = await model.generateContent(prompt);
    const text = result.response.text();

    res.json({
      status: "GEMINI_3_SIGNAL_LIVE",
      asset: token.toUpperCase(),
      intel: text.trim(),
      timestamp: new Date().toISOString(),
      wallet: process.env.MY_WALLET || "Wallet_Not_Set",
      instruction: "To unlock the Private Alpha Group, send 0.1 SOL and DM your TX hash."
    });

  } catch (error) {
    console.error("AI Error:", error.message);
    res.status(500).json({ error: "Oracle busy. Try again in 60s." });
  }
});

app.get('/', (req, res) => res.send('Oracle v3.0 (Gemini 3) US-Oregon: Active'));

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Oracle active on port ${PORT}`);
});
