import express from 'express';
import { GoogleGenerativeAI } from "@google/generative-ai";

const app = express();
const PORT = process.env.PORT || 3000;

// This will show up in your Render Logs to prove the key is working
console.log("Checking API Key...", process.env.GEMINI_API_KEY ? "Key Found! ✅" : "Key MISSING! ❌");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

app.get('/hype-check', async (req, res) => {
  const token = req.query.token || "Solana";

  try {
    // UPDATED MODEL NAME FOR 2026
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    
    const prompt = `Perform a high-speed sentiment scan for ${token}. Give a 1-sentence hype summary.`;
    
    const result = await model.generateContent(prompt);
    const text = result.response.text();

    res.status(402).json({
      status: "Payment Required",
      token: token.toUpperCase(),
      hype_preview: text.trim(),
      wallet: process.env.MY_WALLET || "Address_Not_Set",
      instruction: "Send 0.05 USDC to unlock the full report."
    });

  } catch (error) {
    console.error("AI Error:", error);
    res.status(500).json({ error: "Oracle connection lost. Try again." });
  }
});

app.get('/', (req, res) => res.send('Oracle is Online. Use /hype-check?token=solana'));

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Oracle active on port ${PORT}`);
});
