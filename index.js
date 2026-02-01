import express from 'express';
import { rateLimit } from 'express-rate-limit';
import { GoogleGenerativeAI } from "@google/generative-ai";
import { Connection } from "@solana/web3.js";

const app = express();
const PORT = process.env.PORT || 3000;
const MY_WALLET = process.env.MY_WALLET;

const solanaConnection = new Connection("https://api.mainnet-beta.solana.com", "confirmed");
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// THE BOUNCER
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  limit: 5, 
  message: { error: "402 Payment Required", message: "Pay 0.001 SOL to unlock Alpha." }
});

// THE RESILIENT ENGINE (Retries + Fallback)
async function getAlphaSignal(token) {
  const models = ["gemini-2.0-flash", "gemini-1.5-flash"]; // Primary then Fallback
  let lastError;

  for (const modelName of models) {
    const model = genAI.getGenerativeModel({ model: modelName });
    const prompt = `Senior Whale Analyst: Analyze ${token}. Provide a Hype Score (0-100) and 1-sentence Alpha verdict.`;

    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        console.log(`Attempting with ${modelName} (Attempt ${attempt + 1})...`);
        const result = await model.generateContent(prompt);
        return { text: result.response.text(), modelUsed: modelName };
      } catch (error) {
        lastError = error;
        // If it's a 503 or 429, wait 2 seconds before retry/fallback
        if (error.message.includes('503') || error.message.includes('429')) {
          await new Promise(res => setTimeout(res, 2000));
        } else {
          break; // If it's a 400 (Bad Prompt), don't bother retrying
        }
      }
    }
  }
  throw lastError;
}

app.get('/hype-check', limiter, async (req, res) => {
  const token = req.query.q || "Solana";
  const txHash = req.query.hash;

  if (!txHash) {
    return res.status(402).json({
      status: "PAYMENT_REQUIRED",
      destination: MY_WALLET,
      instruction: `Send 0.001 SOL to ${MY_WALLET} and retry with &hash=TX_ID`
    });
  }

  try {
    // 1. Check Blockchain
    const tx = await solanaConnection.getParsedTransaction(txHash, { maxSupportedTransactionVersion: 0 });
    if (!tx) return res.status(404).json({ error: "Transaction pending. Wait 10s." });

    // 2. Get AI Signal with Fallback Logic
    const { text, modelUsed } = await getAlphaSignal(token);

    res.json({
      status: "SUCCESS",
      asset: token.toUpperCase(),
      verdict: text.trim(),
      engine: modelUsed, // Show the user which AI answered
      verified: true
    });

  } catch (error) {
    console.error("Critical Error:", error.message);
    res.status(500).json({ error: "All AI models are currently saturated. This is a global Google outage. Please try again in 10 minutes." });
  }
});

app.get('/', (req, res) => res.send('Solana Oracle v3.6 [FALLBACK ENABLED]'));
app.listen(PORT, '0.0.0.0');
