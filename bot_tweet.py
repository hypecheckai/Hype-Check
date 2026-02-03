import os
import requests
import smtplib
import threading
from flask import Flask
from email.message import EmailMessage

# --- 1. CONFIGURATION (STRICTLY FOR GMAIL) ---
GMAIL_USER = "pablo26002@gmail.com"
GMAIL_APP_PASS = "obmgzjtsvwajbszt"  # Your 16-character App Password
MAILHOOK = "3prg8vxc39i78auppwtbmeb8ozcrno6k@hook.us2.make.com"
MY_SOL_WALLET = "59N8hT6FsrKdmrJPE9B9aWZXUaWM4AS5jxH9JBxNZyWD" 
REF_LINK = "https://hypecheckai.github.io"

app = Flask(__name__)

# --- 2. THE ALPHA LOGIC ---
def fetch_sol_alpha():
    try:
        url = "https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd&include_24hr_vol=true&include_24hr_change=true"
        data = requests.get(url).json()['solana']
        price = round(data['usd'], 2)
        change = round(data['usd_24h_change'], 2)
        vol = data['usd_24h_vol']
        
        status = "🐋 WHALE ALERT" if vol > 3000000000 else "📈 MARKET ALPHA"
        score = int(50 + (change * 2))
        return score, price, change, status
    except Exception as e:
        print(f"Data Fetch Error: {e}")
        return 75, "Live", 0, "📈 MARKET ALPHA"

def send_tweet():
    """This function handles the actual data processing and email sending."""
    print("Bot is waking up...")
    score, price, change, status = fetch_sol_alpha()
    emoji = "🚀" if change > 0 else "📉"
    
    content = (
        f"{status}\n\n"
        f"$SOL Sentiment: {score}/100 {emoji}\n"
        f"Price: ${price} ({change}%)\n\n"
        f"🔗 Live Dashboard: {REF_LINK}\n"
        f"💰 Trade & Swap: https://jup.ag/swap/USDC-SOL\n"
        f"☕ Support: {MY_SOL_WALLET}"
    )

    msg = EmailMessage()
    msg.set_content(content)
    msg['Subject'] = "HypeCheck Alpha Dispatch"
    msg['From'] = GMAIL_USER
    msg['To'] = MAILHOOK

    try:
        with smtplib.SMTP("smtp.gmail.com", 587) as server:
            server.starttls()
            server.login(GMAIL_USER, GMAIL_APP_PASS)
            server.send_message(msg)
        print("✅ Alpha Report sent to X via Gmail!")
    except Exception as e:
        print(f"❌ Gmail Error: {e}")

# --- 3. THE "DOORBELL" ROUTE ---
@app.route('/')
def home():
    return "HypeCheck AI is Online. Visit /trigger-bot to fire the alpha.", 200

@app.route('/trigger-bot')
def trigger():
    # Use threading so the browser gets a fast 'Success' message 
    # while the bot works in the background.
    threading.Thread(target=send_tweet).start()
    return "Bot Triggered Successfully!", 200

if __name__ == "__main__":
    # Render provides the PORT environment variable automatically
    port = int(os.environ.get("PORT", 5000))
    app.run(host='0.0.0.0', port=port)
