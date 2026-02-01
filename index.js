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

// --- LANDING PAGE (Professional View) ---
app.get('/', (req, res) => {
  res.send(`
    <body style="background:#0a0a0a; color:#00ffa3; font-family:monospace; padding:40px; line-height:1.6;">
      <h1 style="border-bottom: 2px solid #00ffa3; padding-bottom:10px;">⚡ SOLANA AI ORACLE v3.7</h1>
      <p><b>Status:</b> <span style="color:#fff;">OPERATIONAL</span></p>
      <p><b>Active Engines:</b> <span style="color:#fff;">Gemini 2.0 Flash & Gemini 1.5</span></p>
      <hr style="border:0.5px solid #333;">
      
      <h3>🚀 DEVELOPER API GUIDE</h3>
      <p>To integrate your trading bot, use the following endpoint:</p>
      <code style="background:#222; padding:10px; display:block; color:#fff; border-radius:5px;">GET /hype-check?q={TICKER}&hash={TX_ID}</code>
      
      <h3>💰 PRICING</h3>
      <ul>
        <li><b>0.001 SOL</b> per Alpha Signal</li>
        <li><b>Free:</b> Solana ($SOL) analysis is currently open for testing.</li>
      </ul>
      
      <h3>🏦 SETTLEMENT WALLET</h3>
      <code style="background:#222; padding:10px; display:block; color:#fff; border-radius:5px; word-break:break-all;">${MY_WALLET}</code>
      
      <p style="margin-top:40px; font-size:12px; color:#666;">Built for the 2026 Agentic Economy. Powered by Gemini Flash.</p>
    </body>
  `);
});

// --- THE ORACLE LOGIC ---
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

  // VALIDATION: Prevents "WrongSize" error
  if (txHash.length < 80 || txHash.length > 95) {
    return res.status(400).json({
      error: "Invalid Transaction Hash",
      message: "Signature size mismatch. Ensure you send the 88-character Tx ID, not your wallet address."
    });
  }

  try {
    const tx = await solanaConnection.getParsedTransaction(txHash, { maxSupportedTransactionVersion: 0 });
    if (!tx) return res.status(404).json({ error: "Transaction pending. Wait 10s for the block to finalize." });

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
    res.status(500).json({ error: "All AI models are currently saturated. Try again in 5 minutes." });
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Automated Oracle live on ${PORT}`);
});
