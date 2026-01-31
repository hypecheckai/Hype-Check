import express from 'express';
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";

const app = express();
const PORT = process.env.PORT || 3000;

// Debug log to confirm Render is seeing your key
console.log("Checking API Key...", process.env.GEMINI_API_KEY ? "Key Found! ✅" : "Key MISSING! ❌");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

app.get('/hype-check', async (req, res) => {
  const token = req.query.token || "Solana";

  try {
    // 2026 Standard: Use Gemini 2.0 Flash
    const model = genAI.getGenerativeModel({ 
      model: "gemini-3-flash-preview",
      // This block prevents the "Oracle connection lost" crash by allowing crypto discussion
      safetySettings: [
        { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
        { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
        { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
        { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
      ],
    });
    
    const prompt = `Perform a high-speed sentiment scan for the crypto token ${token}. Give a 1-sentence summary of the current hype.`;
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    res.status(402).json({
      status: "Payment Required",
      token: token.toUpperCase(),
      hype_preview: text.trim(),
      wallet: process.env.MY_WALLET || "Address_Not_Set",
      instruction: "Send 0.05 USDC to the wallet above to unlock the Deep-Scan report."
    });

  } catch (error) {
    // This logs the SPECIFIC reason it's failing in your Render logs
    console.error("AI Error Details:", error);
    res.status(500).json({ error: "Oracle connection lost. Try again." });
  }
});

app.get('/', (req, res) => res.send('Solana Hype Oracle: Online'));

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Oracle active on port ${PORT}`);
});
