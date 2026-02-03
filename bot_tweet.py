import os
import requests
import smtplib
from email.message import EmailMessage

# --- CONFIGURATION (YOUR INFO HERE) ---
GMAIL_USER = "pablo26002@gmail.com"
GMAIL_APP_PASS = "obmg zjts vwaj bszt" # Paste your 16-character code here
MAILHOOK = "3prg8vxc39i78auppwtbmeb8ozcrno6k@hook.us2.make.com"
MY_SOL_WALLET = "59N8hT6FsrKdmrJPE9B9aWZXUaWM4AS5jxH9JBxNZyWD" 

def fetch_sol_alpha():
    try:
        # Fetching price, 24h change, and volume for 'Whale' detection
        url = "https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd&include_24hr_vol=true&include_24hr_change=true"
        data = requests.get(url).json()['solana']
        price = round(data['usd'], 2)
        change = round(data['usd_24h_change'], 2)
        vol = data['usd_24h_vol']
        
        # Whale Alert logic: If 24h volume > $3 Billion
        status = "🐋 WHALE ALERT" if vol > 3000000000 else "📈 MARKET ALPHA"
        score = int(50 + (change * 2))
        return score, price, change, status
    except:
        return 75, "Live", 0, "📈 MARKET ALPHA"

def send_tweet():
    score, price, change, status = fetch_sol_alpha()
    emoji = "🚀" if change > 0 else "📉"
    
    # THE REVENUE-MAXIMIZING CONTENT
    content = (
        f"{status}\n\n"
        f"$SOL Sentiment: {score}/100 {emoji}\n"
        f"Price: ${price} ({change}%)\n\n"
        f"🔗 Live Dashboard: https://hypecheckai.github.io\n"
        f"💰 Trade & Swap: https://jup.ag/swap/USDC-SOL\n"
        f"☕ Support: {MY_SOL_WALLET}"
    )

    msg = EmailMessage()
    msg.set_content(content)
    msg['Subject'] = "HypeCheck Alpha"
    msg['From'] = GMAIL_USER
    msg['To'] = MAILHOOK

    try:
        with smtplib.SMTP("smtp.gmail.com", 587) as server:
            server.starttls()
            server.login(GMAIL_USER, GMAIL_APP_PASS)
            server.send_message(msg)
        print("✅ Success: Tweet dispatched to bridge!")
    except Exception as e:
        print(f"❌ Connection Error: {e}")

if __name__ == "__main__":
    send_tweet()
