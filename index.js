import express from 'express';
import { rateLimit } from 'express-rate-limit';
import { GoogleGenerativeAI } from "@google/generative-ai";
import { Connection } from "@solana/web3.js";

const app = express();
const PORT = process.env.PORT || 3000;
const MY_WALLET = process.env.MY_WALLET;

const solanaConnection = new Connection("https://api.mainnet-beta.solana.com", "confirmed");
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// 1. THE BOUNCER: Standard bot protection
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  limit: 5, 
  message: { error: "402 Payment Required", message: "Pay 0.001 SOL to unlock more signals." }
});

// 2. THE RETRY ENGINE: Automatically tries again if Google is busy
async function generateWithRetry(model, prompt, retries = 3, delay = 2000) {
  for (let i = 0; i < retries; i++) {
    try {
      const result = await model.generateContent(prompt);
      return result.response.text();
    } catch (error) {
      // Only retry if it's a server error (500, 503) or rate limit (429)
      const isRetryable = error.message.includes('500') || error.message.includes('503') || error.message.includes('429');
      if (i < retries - 1 && isRetryable) {
        console.log(`Oracle busy, retrying in ${delay}ms... (Attempt ${i + 1})`);
        await new Promise(res => setTimeout(res, delay));
        delay *= 2; // Wait longer each time (Exponential Backoff)
      } else {
        throw error;
      }
    }
  }
}

app.get('/hype-check', limiter, async (req, res) => {
  const token = req.query.q || "Solana";
  const txHash = req.query.hash;

  if (!txHash) {
    return res.status(402).json({
      status: "PAYMENT_REQUIRED",
      price: "0.001 SOL",
      destination: MY_WALLET,
      instruction: `Send 0.001 SOL to ${MY_WALLET} and retry with &hash=YOUR_TX_ID`
    });
  }

  try {
    // Verify Payment
    const tx = await solanaConnection.getParsedTransaction(txHash, { maxSupportedTransactionVersion: 0 });
    if (!tx) return res.status(404).json({ error: "Transaction not found. Wait 10s." });

    // Payment Logic
    const accountKeys = tx.transaction.message.accountKeys.map(ak => ak.pubkey.toString());
    const myIndex = accountKeys.indexOf(MY_WALLET);
    if (myIndex === -1) return res.status(403).json({ error: "Invalid payment destination." });

    // Trigger Gemini 2.0 Flash (The Stable Workhorse)
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    const prompt = `Act as a senior whale analyst. Provide a Hype Score (0-100) and 1-sentence Alpha verdict for ${token}.`;
    
    // Use the Retry Engine
    const text = await generateWithRetry(model, prompt);

    res.json({
      status: "SUCCESS_ALPHA_UNLOCKED",
      asset: token.toUpperCase(),
      verdict: text.trim(),
      verified: true
    });

  } catch (error) {
    console.error("Final Error:", error.message);
    res.status(500).json({ error: "Oracle offline. Google servers are currently overloaded. Try again in 5 minutes." });
  }
});

app.get('/', (req, res) => res.send('Solana Oracle v3.5 [RETRY ENABLED]'));
app.listen(PORT, '0.0.0.0');
