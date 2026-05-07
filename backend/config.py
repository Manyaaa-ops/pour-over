# Pour-Over AI Configuration
# Copy this file to config.py and fill in your values

# ============================================
# RAZORPAY SETTINGS (Get from https://dashboard.razorpay.com)
# ============================================
RAZORPAY_KEY_ID = "rzp_test_SmRXnGdqIXHPFy"      # e.g., "rzp_test_xxxxxxxx"
RAZORPAY_KEY_SECRET = "97jFnmUlFfMgp926fj04rpOq"  # e.g., "your_key_secret"

# ============================================
# UPI FALLBACK (If Razorpay not configured)
# ============================================
UPI_ID = "yourname@upi"  # Your real UPI ID (e.g., "cafe@gpay" or "john@upi")

# ============================================
# SUBSCRIPTION PLANS (Monthly)
# ============================================
SUBSCRIPTIONS = {
    "starter": {"name": "Starter", "price": 999, "features": ["5 analyses/month", "Basic feedback", "Progress tracking"]},
    "studio": {"name": "Studio", "price": 2499, "features": ["Unlimited analyses", "Advanced feedback", "Priority support"]},
    "house": {"name": "House", "price": 7999, "features": ["Everything in Studio", "10 team members", "Team dashboards"]},
}