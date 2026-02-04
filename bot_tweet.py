import smtplib
import requests
from email.message import EmailMessage
from flask import Flask

app = Flask(__name__)

# --- CONFIGURATION ---
# 1. Paste your Make Mailhook email here
MAKE_MAILHOOK_URL = "Nmfi8v8dfm1nmotnm64tng1i6xco4w1l@hook.us2.make.com"

# 2. Your Gmail details
SENDER_EMAIL = "pablo26002@gmail.com"
APP_PASSWORD = "obmgzjtsvwajbszt" # The 16-character code from Google

def get_solana_report():
    ""
    This is where your bot gathers the 'Alpha' data. 
    (Keep your existing logic for scraping or API calls here)
    """
    return "Solana Alpha Report: $SOL looking bullish. Top tokens: $JUP, $PYTH."

def send_to_make(report_text):
    """Sends the report as an email to your Make.com Mailhook."""
    msg = EmailMessage()
    msg.set_content(report_text)
    msg['Subject'] = "New Solana Alpha Report"
    msg['From'] = SENDER_EMAIL
    msg['To'] = MAKE_MAILHOOK_URL

    try:
        with smtplib.SMTP_SSL('smtp.gmail.com', 465) as smtp:
            smtp.login(SENDER_EMAIL, APP_PASSWORD)
            smtp.send_message(msg)
        return True
    except Exception as e:
        print(f"Error sending email: {e}")
        return False

@app.route('/trigger-bot')
def trigger():
    report = get_solana_report()
    success = send_to_make(report)
    if success:
        return "✅ Success! Report sent to Make.com. Check X in a few seconds.", 200
    else:
        return "❌ Failed to send report. Check Render logs.", 500

if __name__ == "__main__":
    app.run(host='0.0.0.0', port=10000)
