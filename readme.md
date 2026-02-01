# Solana AI Hype Oracle v3.7
An Agentic-native API for real-time token sentiment.

## Machine Usage
- **Method:** `GET`
- **Protocol:** REST / JSON
- **Settlement:** On-chain via Solana Mainnet
- **Price:** `1,000,000 Lamports` (0.001 SOL)

## Sample Response
```json
{
  "status": "SUCCESS",
  "asset": "BONK",
  "verdict": "Whale accumulation detected. Social volume surging 40%.",
  "engine": "gemini-2.0-flash",
  "verified": true
}
