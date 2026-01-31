import express from 'express';
import { GoogleGenerativeAI } from "@google/generative-ai";

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize Gemini with the API Key you'll get in Step 2
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

app.get('/hype-check', async (req, res) => {
  const token = req.query.token || "Solana";

  try {
    // We use the "Flash" model because it's the fastest in 2026
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    
    const prompt = `Perform a high-speed sentiment scan for the crypto token ${token}. 
    Provide a 1-sentence summary of the current social media hype level.`;
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // The "Paywall" Response
    res.status(402).json({
      status: "Payment Required",
      token: token.toUpperCase(),
      hype_preview: text.trim(),
      cost: "0.05 USDC",
      wallet: "59N8hT6FsrKdmrJPE9B9aWZXUaWM4AS5jxH9JBxNZyWD",
      instruction: "Send payment to the wallet above to unlock the Deep-Scan Hype Report."
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Oracle connection lost. Try again." });
  }
});

// Health check for UptimeRobot
app.get('/', (req, res) => res.send('Solana Hype Oracle: Online'));

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Oracle is live on port ${PORT}`);
});
