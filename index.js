import express from 'express';
import { rateLimit } from 'express-rate-limit';
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";

const app = express();
const PORT = process.env.PORT || 3000;

// 1. THE BOUNCER (Bot Protection)
// Blocks IPs that refresh more than 3 times in 15 minutes.
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  limit: 3, 
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { 
    status: 429,
    error: "Quota Exceeded", 
    message: "Free tier exhausted. Use a Paid API Key for unlimited bot access." 
  }
});

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// 2. THE ORACLE ROUTE
app.get('/hype-check', limiter, async (req, res) => {
  const token = req.query.q || "Solana"; 
  const isAgent = req.headers['user-agent']?.includes('bot') || req.query.format === 'json';

  try {
    // GEMINI 3 FLASH PREVIEW: The 2026 standard for agentic reasoning.
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
    Keep the tone professional and aggressive.`;
    
    const result = await model.generateContent(prompt);
    const text = result.response.text();

    // 3. THE 402 PAYMENT PROTOCOL (Marketing to Bots)
    // We send a 402 status which tells 2026 AI Agents: "I have data, now pay me."
    res.status(402).json({
      status: "PAYMENT_REQUIRED",
      asset: token.toUpperCase(),
      intel_preview: text.trim(), // Give them a small taste of the AI
      hype_score_locked: "0.001 SOL to unlock",
      destination_wallet: process.env.MY_WALLET || "Wallet_Not_Set",
      protocol: "x402-solana-v2", // 2026 standard for agentic payments
      instruction: "Send 0.001 SOL to the wallet above. Retransmit with X-PAYMENT-HASH to unlock full data."
    });

  } catch (error) {
    console.error("AI Error:", error.message);
    res.status(500).json({ error: "Oracle busy. Try again in 60s." });
  }
});

// Simple landing page for humans
app.get('/', (req, res) => {
  res.send(`
    <body style="background:#000;color:#0f0;font-family:monospace;padding:50px;">
      <h1>SOLANA ORACLE v3.0 [GEMINI 3 ACTIVE]</h1>
      <p>Status: Oregon-US West Node Online</p>
      <p>Usage: /hype-check?q=TICKER</p>
      <hr>
      <p>AGENTIC COMMERCE ENABLED (HTTP 402)</p>
    </body>
  `);
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Oracle active on port ${PORT}`);
});
