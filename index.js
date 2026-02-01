import express from 'express';
import { rateLimit } from 'express-rate-limit';
import { GoogleGenerativeAI } from "@google/generative-ai";
import { Connection, PublicKey } from "@solana/web3.js";

const app = express();
const PORT = process.env.PORT || 3000;
const MY_WALLET = process.env.MY_WALLET;

// 1. Connect to Solana (Using a 2026 stable RPC)
const solanaConnection = new Connection("https://api.mainnet-beta.solana.com", "confirmed");
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// 2. THE BOUNCER: Limit free checks to 3 every 15 mins to save your quota.
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  limit: 3, 
  message: { error: "402 Payment Required", message: "Pay 0.001 SOL to unlock unlimited signals." }
});

app.get('/hype-check', limiter, async (req, res) => {
  const token = req.query.q || "Solana";
  const txHash = req.query.hash; // Bots must provide this after paying

  // STEP A: If no payment hash is provided, send the bill.
  if (!txHash) {
    return res.status(402).json({
      status: "PAYMENT_REQUIRED",
      asset: token.toUpperCase(),
      price: "0.001 SOL",
      destination: MY_WALLET,
      instruction: `Step 1: Send 0.001 SOL to ${MY_WALLET}. Step 2: Retry this link with &hash=YOUR_TX_ID`
    });
  }

  try {
    // STEP B: Verify the Transaction on the Blockchain
    const tx = await solanaConnection.getParsedTransaction(txHash, { 
        maxSupportedTransactionVersion: 0,
        commitment: "confirmed"
    });

    if (!tx) return res.status(404).json({ error: "Transaction not found. Wait 10s for confirmation." });

    // Verify the money actually reached YOUR wallet
    const postBalances = tx.meta.postBalances;
    const preBalances = tx.meta.preBalances;
    const accountKeys = tx.transaction.message.accountKeys.map(ak => ak.pubkey.toString());
    const myIndex = accountKeys.indexOf(MY_WALLET);

    if (myIndex === -1) return res.status(403).json({ error: "Invalid transaction: Wallet not involved." });

    const amountReceived = (postBalances[myIndex] - preBalances[myIndex]) / 1e9;

    if (amountReceived < 0.001) {
      return res.status(403).json({ error: `Insufficient payment. Expected 0.001, got ${amountReceived.toFixed(4)} SOL.` });
    }

    // STEP C: Payment Confirmed! Release Gemini 3 Alpha.
    const model = genAI.getGenerativeModel({ model: "gemini-3-flash-preview" });
    const prompt = `Senior Whale Analyst: Analyze ${token}. Provide a Hype Score (0-100) and 1-sentence Alpha verdict. Tone: Aggressive/Professional.`;
    
    const result = await model.generateContent(prompt);
    res.json({
      status: "SUCCESS_ALPHA_UNLOCKED",
      asset: token.toUpperCase(),
      verdict: result.response.text().trim(),
      payment_verified: `${amountReceived} SOL`,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error("Verification Error:", error.message);
    res.status(500).json({ error: "Blockchain verification failed. Try again." });
  }
});

app.get('/', (req, res) => res.send('Solana Oracle v3.0: Agentic Economy Ready'));
app.listen(PORT, '0.0.0.0');
