import os
import requests
import smtplib
from email.message import EmailMessage

# --- USER DATA (FILL THESE IN) ---
MAILHOOK = "3prg8vxc39i78auppwtbmeb8ozcrno6k@hook.us2.make.com"
PHANTOM_WALLET = "59N8hT6FsrKdmrJPE9B9aWZXUaWM4AS5jxH9JBxNZyWD"
# Your Referral Link (e.g., Jupiter, Binance, or your own site)
REF_LINK = "https://hypecheckai.github.io" 

def fetch_alpha():
    """Fetches real-time SOL price and volume to create 'Alpha' signals."""
    try:
        # 2026 Public Data Fetch
        url = "https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd&include_24hr_vol=true&include_24hr_change=true"
        data = requests.get(url).json()['solana']
        
        price = round(data['usd'], 2)
        vol = data['usd_24h_vol']
        change = round(data['usd_24h_change'], 2)
        
        # Calculate Hype Score (0-100) based on volatility and volume
        score = int(50 + (change * 1.5))
        score = max(5, min(99, score)) # Keep it realistic
        
        # Add a "Whale Alert" tag if volume is massive
        status = "🐋 WHALE ALERT" if vol > 1000000000 else "📈 MARKET SIGNAL"
        return score, price, change, status
    except:
        return 75, "Syncing", 0, "📈 MARKET SIGNAL"

def send_revenue_tweet():
    score, price, change, status = fetch_alpha()
    
    # Verdict Logic
    emoji = "🚀" if change > 0 else "📉"
    verdict = "BULLISH" if score > 60 else "BEARISH"

    # THE REVENUE-OPTIMIZED TWEET
    # Designed with "Bot-Magnet" formatting (Cashtags & Spacing)
    content = (
        f"{status}\n\n"
        f"$SOL Sentiment: {score}/100 {emoji}\n"
        f"Price: ${price} ({change}%)\n"
        f"Verdict: {verdict}\n\n"
        f"🔗 Get the full Alpha: {REF_LINK}\n"
        f"☕ Tip the Machine: {PHANTOM_WALLET}"
    )

    # Bridge to Make.com via Proton
    msg = EmailMessage()
    msg.set_content(content)
    msg['Subject'] = "HypeCheck Alpha Update"
    msg['From'] = os.environ.get("PROTON_EMAIL")
    msg['To'] = MAILHOOK

    # Sending via Proton Bridge on Render
    try:
        # Standard Proton Bridge local port (1025)
        with smtplib.SMTP('127.0.0.1', 1025) as server:
            server.send_message(msg)
        print("✅ Alpha Signal sent to X Bridge!")
    except Exception as e:
        print(f"❌ Bridge Error: {e}")

if __name__ == "__main__":
    send_revenue_tweet()
