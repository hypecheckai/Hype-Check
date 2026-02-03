import os
import requests
from flask import Flask

app = Flask(__name__)

def send_email_via_brevo(subject, body):
    """Sends an email using the Brevo API to bypass Render's SMTP block."""
    api_key = os.environ.get("BREVO_API_KEY")
    sender_email = os.environ.get("SENDER_EMAIL")
    
    if not api_key or not sender_email:
        return "Missing API Key or Sender Email in Environment Variables."

    url = "https://api.brevo.com/v3/smtp/email"
    
    headers = {
        "accept": "application/json",
        "content-type": "application/json",
        "api-key": api_key
    }
    
    payload = {
        "sender": {"email": sender_email, "name": "Hype Bot"},
        "to": [{"email": sender_email}],  # Sending to yourself to trigger Make/Zapier
        "subject": subject,
        "textContent": body
    }

    try:
        response = requests.post(url, json=payload, headers=headers)
        if response.status_code == 201:
            print("✅ Email sent successfully via Brevo!")
            return True
        else:
            print(f"❌ Brevo Error: {response.status_code} - {response.text}")
            return False
    except Exception as e:
        print(f"❌ Connection Error: {str(e)}")
        return False

@app.route('/trigger-bot')
def trigger():
    # 1. Your Solana Alpha Logic goes here
    # (For now, we are testing the delivery)
    report_title = "🚀 Solana Alpha Report"
    report_body = "$SOL is looking bullish! This is a test from your Render bot."

    # 2. Try to send the report
    success = send_email_via_brevo(report_title, report_body)

    if success:
        return "Bot Triggered Successfully! Check your Gmail.", 200
    else:
        return "Bot Triggered, but Email Failed. Check Render Logs.", 500

if __name__ == "__main__":
    # Render uses the PORT environment variable automatically
    port = int(os.environ.get("PORT", 10000))
    app.run(host='0.0.0.0', port=port)
