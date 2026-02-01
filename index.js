import express from 'express';
import { rateLimit } from 'express-rate-limit';
import { GoogleGenerativeAI } from "@google/generative-ai";
import { Connection } from "@solana/web3.js";

const app = express();
const PORT = process.env.PORT || 3000;
const MY_WALLET = process.env.MY_WALLET;

// 1. Connection with 2026 Stable RPC
const solanaConnection = new Connection("https://api.mainnet-beta.solana.com", "confirmed");
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// 2. THE BOUNCER: Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  limit: 5, 
  message: { error: "402 Payment Required", message: "Pay 0.001 SOL to unlock Alpha." }
});

// 3. THE RESILIENT ENGINE (Retries + Fallback)
async function getAlphaSignal(token) {
  const models = ["gemini-2.0-flash", "gemini-1.5-flash"]; 
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
        if (error.message.includes('503') || error.message.includes('429')) {
          await new Promise(res => setTimeout(res, 2000));
        } else {
          break; 
        }
      }
    }
  }
  throw lastError;
}

app.get('/hype-check', limiter, async (req, res) => {
  const token = req.query.q || "Solana";
  const txHash = req.query.hash;

  // --- NEW: SIGNATURE SIZE VALIDATION ---
  if (!txHash) {
    return res.status(402).json({
      status: "PAYMENT_REQUIRED",
      destination: MY_WALLET,
      instruction: `Send 0.001 SOL to ${MY_WALLET} and retry with &hash=TX_ID`
    });
  }

  // Solana signatures are 87-88 characters in Base58. 
  // This block prevents the "WrongSize" error.
  if (txHash.length < 80 || txHash.length > 95) {
    return res.status(400).json({
      error: "Invalid Transaction Hash",
      message: "The signature provided is the wrong size. Use the Transaction ID, not a wallet address."
    });
  }

  try {
    // 1. Check Blockchain
    const tx = await solanaConnection.getParsedTransaction(txHash, { maxSupportedTransactionVersion: 0 });
    if (!tx) return res.status(404).json({ error: "Transaction not found. Wait 10s for the chain to sync." });

    // 2. Get AI Signal with Fallback Logic
    const { text, modelUsed } = await getAlphaSignal(token);

    res.json({
      status: "SUCCESS",
      asset: token.toUpperCase(),
      verdict: text.trim(),
      engine: modelUsed,
      verified: true
    });

  } catch (error) {
    console.error("Critical Error:", error.message);
    res.status(500).json({ error: "All AI models are currently busy. Try again in 5 minutes." });
  }
});

app.get('/', (req, res) => res.send('Solana Oracle v3.7 [FALLBACK + VALIDATION ENABLED]'));
app.listen(PORT, '0.0.0.0');
