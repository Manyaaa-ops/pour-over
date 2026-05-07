from fastapi import APIRouter, HTTPException, Header, Request
from pydantic import BaseModel
from typing import Optional, Dict
import uuid
import os
import json
import datetime
import razorpay

router = APIRouter()

USERS_FILE = "users.json"
PAYMENTS_FILE = "payments.json"
HISTORY_FILE = "history.json"
DRILLS_FILE = "drills.json"
TEAMS_FILE = "teams.json"

FREE_CREDITS = 200
CREDIT_COST = 50

# Load config
RAZORPAY_KEY_ID = ""
RAZORPAY_KEY_SECRET = ""
UPI_ID = "pour-over@upi"
HAS_RAZORPAY = False

try:
    from config import (
        RAZORPAY_KEY_ID as _KEY_ID,
        RAZORPAY_KEY_SECRET as _KEY_SECRET,
        UPI_ID as _UPI_ID,
    )
    if _KEY_ID and _KEY_SECRET and _KEY_ID.startswith("rzp_"):
        RAZORPAY_KEY_ID = _KEY_ID
        RAZORPAY_KEY_SECRET = _KEY_SECRET
        UPI_ID = _UPI_ID if _UPI_ID != "yourname@upi" else "pour-over@upi"
        HAS_RAZORPAY = True
except Exception as e:
    print(f"Config load error: {e}")

# Initialize Razorpay client if configured
if HAS_RAZORPAY:
    rzp = razorpay.Client(auth=(RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET))
else:
    rzp = None

# One-time credit packs (in INR)
PAID_PACKAGES = [
    {"id": 0, "credits": 50, "price": 99, "name": "Starter Pack"},
    {"id": 1, "credits": 150, "price": 249, "name": "Pro Pack"},
    {"id": 2, "credits": 500, "price": 699, "name": "Barista Pack"},
    {"id": 3, "credits": 1000, "price": 1299, "name": "Master Pack"},
]

# Monthly subscriptions (in INR) - $29/$79/$249 approximated
SUBSCRIPTIONS = [
    {"id": "starter", "name": "Starter", "price": 999, "period": "month", "features": ["5 analyses/month", "Basic feedback", "Progress tracking"]},
    {"id": "studio", "name": "Studio", "price": 2499, "period": "month", "features": ["Unlimited analyses", "Advanced feedback", "Priority support", "Early features"]},
    {"id": "house", "name": "House", "price": 7999, "period": "month", "features": ["Everything in Studio", "10 team members", "Team dashboards", "Custom training"]},
]

# Get subscriptions
@router.get("/subscriptions")
async def get_subscriptions():
    """Get available subscription plans."""
    return {"subscriptions": SUBSCRIPTIONS}

def load_users():
    if os.path.exists(USERS_FILE):
        with open(USERS_FILE, 'r') as f:
            return json.load(f)
    return {}

def save_users(users):
    with open(USERS_FILE, 'w') as f:
        json.dump(users, f)

def load_history():
    if os.path.exists(HISTORY_FILE):
        with open(HISTORY_FILE, 'r') as f:
            return json.load(f)
    return {}

def save_history(history):
    with open(HISTORY_FILE, 'w') as f:
        json.dump(history, f)

def load_drills():
    return {
        "heart": {
            "name": "Heart Pour",
            "description": "Master the basic heart shape",
            "steps": [
                "Pour from 3-4 inches above cup",
                "Pour milk in center, let foam rise",
                "Lower pitcher and push through",
                "Stop when heart shape forms"
            ],
            "tips": "Keep wrist steady, pour at consistent speed"
        },
        "rosetta": {
            "name": "Rosetta Pour",
            "description": "Create the classic fern pattern",
            "steps": [
                "Start at back of cup",
                "Move pitcher side-to-side",
                "Work from back to front",
                "Drag to create leaf layers"
            ],
            "tips": "Quick, light movements work best"
        },
        "tulip": {
            "name": "Tulip Pour",
            "description": "Stack multiple hearts",
            "steps": [
                "Pour first heart in center",
                "Lift pitcher, pour again",
                "Repeat before foam sinks",
                "Create stacked tulip shape"
            ],
            "tips": "Lift quickly before foam settles"
        },
        "control": {
            "name": "Flow Control",
            "description": "Master steady pouring",
            "steps": [
                "Pour at consistent height",
                "Maintain steady flow rate",
                "No sudden movements",
                "Complete pour in one motion"
            ],
            "tips": "Practice at arm's length first"
        }
    }

def load_teams():
    if os.path.exists(TEAMS_FILE):
        with open(TEAMS_FILE, 'r') as f:
            return json.load(f)
    return {}

def load_payments():
    if os.path.exists(PAYMENTS_FILE):
        with open(PAYMENTS_FILE, 'r') as f:
            return json.load(f)
    return {}

def save_payments(payments):
    with open(PAYMENTS_FILE, 'w') as f:
        json.dump(payments, f)

class UserCreate(BaseModel):
    email: str
    password: str
    name: str

class UserLogin(BaseModel):
    email: str
    password: str

class OTPSend(BaseModel):
    email: str

class OTPVerify(BaseModel):
    email: str
    otp: str

class PaymentInit(BaseModel):
    package_id: int
    user_id: str

class PaymentVerify(BaseModel):
    payment_id: str
    razorpay_payment_id: Optional[str] = None
    razorpay_signature: Optional[str] = None

@router.post("/payment/create-order")
async def create_payment_order(payment: PaymentInit):
    """Create Razorpay payment order and return payment link."""
    package = PAID_PACKAGES[payment.package_id]
    
    try:
        # Create order in Razorpay
        order = rzp.order.create({
            "amount": package["price"] * 100,  # Razorpay uses paise
            "currency": "INR",
            "receipt": f"pay_{uuid.uuid4().hex[:8]}",
            "notes": {
                "user_id": payment.user_id,
                "package_id": payment.package_id,
                "credits": package["credits"]
            }
        })
        
        # Create payment link
        payment_link = rzp.payment_link.create({
            "amount": package["price"] * 100,
            "currency": "INR",
            "accept_partial": False,
            "description": f"{package['name']} - {package['credits']} credits",
            "notes": {
                "user_id": payment.user_id,
                "package_id": payment.package_id,
                "credits": package["credits"]
            },
            "callback_url": f"http://localhost:3000/payment/success?payment_id={order['id']}",
            "callback_method": "get"
        })
        
        # Save payment record
        payments = load_payments()
        payments[order["id"]] = {
            "package_id": payment.package_id,
            "user_id": payment.user_id,
            "credits": package["credits"],
            "amount": package["price"],
            "razorpay_order_id": order["id"],
            "payment_link": payment_link["short_url"],
            "status": "pending"
        }
        save_payments(payments)
        
        return {
            "success": True,
            "order_id": order["id"],
            "payment_link": payment_link["short_url"],
            "credits": package["credits"],
            "amount": package["price"],
            "name": package["name"]
        }
        
    except Exception as e:
        # Fallback to manual UPI if Razorpay fails
        payment_id = f"pay_{uuid.uuid4().hex[:12]}"
        payments = load_payments()
        payments[payment_id] = {
            "package_id": payment.package_id,
            "user_id": payment.user_id,
            "credits": package["credits"],
            "amount": package["price"],
            "status": "pending",
            "fallback": True
        }
        save_payments(payments)
        
        return {
            "success": True,
            "order_id": payment_id,
            "payment_link": None,
            "fallback": True,
            "upi_id": UPI_ID,
            "credits": package["credits"],
            "amount": package["price"],
            "name": package["name"],
            "instructions": f"Pay ₹{package['price']} to UPI ID {UPI_ID} with note {payment_id}"
        }

@router.post("/payment/webhook")
async def razorpay_webhook(request: Request):
    """Handle Razorpay webhook for payment confirmation."""
    try:
        payload = await request.body()
        webhook_body = json.loads(payload)
        
        # Verify webhook signature (in production, validate razorpay_signature)
        event = webhook_body.get("event")
        payment_id = webhook_body.get("payload", {}).get("payment", {}).get("entity", {}).get("order_id")
        
        if event == "payment_link.paid" and payment_id:
            payments = load_payments()
            if payment_id in payments:
                payments[payment_id]["status"] = "completed"
                save_payments(payments)
                
                # Add credits to user
                user_id = payments[payment_id].get("user_id")
                credits = payments[payment_id].get("credits", 0)
                
                users = load_users()
                if user_id in users:
                    users[user_id]["credits"] = users[user_id].get("credits", 0) + credits
                    save_users(users)
                
                return {"success": True}
        
        return {"success": True}
    except Exception as e:
        return {"success": False, "error": str(e)}

@router.post("/payment/verify")
async def verify_payment(verify: PaymentVerify):
    """Verify payment and add credits (for manual verification)."""
    payment_id = verify.payment_id
    payments = load_payments()
    
    if payment_id not in payments:
        raise HTTPException(status_code=404, detail="Payment not found")
    
    payment = payments[payment_id]
    
    if payment["status"] == "completed":
        return {"success": True, "message": "Payment already verified"}
    
    # Mark as completed
    payment["status"] = "completed"
    if verify.razorpay_payment_id:
        payment["razorpay_payment_id"] = verify.razorpay_payment_id
    payments[payment_id] = payment
    save_payments(payments)
    
    # Add credits to user
    user_id = payment.get("user_id")
    credits = payment.get("credits", 0)
    
    users = load_users()
    if user_id in users:
        users[user_id]["credits"] = users[user_id].get("credits", 0) + credits
        save_users(users)
    
    return {
        "success": True,
        "credits_added": credits,
        "message": f"{credits} credits added successfully!"
    }

@router.get("/payment/status/{payment_id}")
async def check_payment_status(payment_id: str):
    """Check payment status."""
    payments = load_payments()
    
    if payment_id not in payments:
        return {"status": "not_found"}
    
    payment = payments[payment_id]
    return {"status": payment["status"], "credits": payment.get("credits", 0)}
    payments[payment_id] = {
        "package_id": payment.package_id,
        "user_id": payment.user_id,
        "credits": package["credits"],
        "amount": package["price"],
        "status": "pending"
    }
    save_payments(payments)
    
    return {
        "payment_id": payment_id,
        "credits": package["credits"],
        "amount": package["price"],
        "qr_code": f"PAY{package['price']}",
        "upi_id": UPI_ID,
        "instructions": f"Pay ₹{package['price']} to UPI ID {UPI_ID} with payment note {payment_id}"
    }

@router.post("/payment/verify")
async def verify_payment(payment_id: str):
    """Verify and complete payment."""
    payments = load_payments()
    
    if payment_id not in payments:
        raise HTTPException(status_code=404, detail="Payment not found")
    
    payment = payments[payment_id]
    
    if payment["status"] == "completed":
        return {"success": True, "message": "Payment already verified"}
    
    payment["status"] = "completed"
    payments[payment_id] = payment
    save_payments(payments)
    
    if payment.get("user_id"):
        users = load_users()
        if payment["user_id"] in users:
            users[payment["user_id"]]["credits"] = (
                users[payment["user_id"]].get("credits", 0) + payment["credits"]
            )
            save_users(users)
    
    return {
        "success": True,
        "credits_added": payment["credits"],
        "message": f"{payment['credits']} credits added successfully!"
    }

@router.get("/me")
async def get_current_user(authorization: Optional[str] = Header(None)):
    """Get current user info."""
    if not authorization:
        return {
            "guest": True,
            "credits": FREE_CREDITS,
            "message": f"Guest user with {FREE_CREDITS} free credits"
        }
    
    user_id = authorization.replace("Bearer ", "").replace("tok_", "")
    users = load_users()
    
    if user_id in users:
        return {
            "guest": False,
            "user_id": user_id,
            "email": users[user_id]["email"],
            "name": users[user_id]["name"],
            "credits": users[user_id].get("credits", 0)
        }
    
    return {
        "guest": True,
        "credits": FREE_CREDITS
    }

@router.get("/history")
async def get_user_history(authorization: Optional[str] = Header(None)):
    """Get user's analysis history."""
    history = load_history()
    
    if not authorization:
        return {"history": [], "summary": get_history_summary([])}
    
    user_id = authorization.replace("Bearer ", "").replace("tok_", "")
    user_history = history.get(user_id, [])
    return {
        "history": user_history,
        "summary": get_history_summary(user_history)
    }

def get_history_summary(user_history):
    if not user_history:
        return {
            "total_analyses": 0,
            "avg_score": 0,
            "best_design": None,
            "improvement": 0
        }
    
    scores = [h.get("score", 0) for h in user_history]
    avg = sum(scores) / len(scores) if scores else 0
    
    designs = [h.get("design", "Unknown") for h in user_history]
    most_common = max(set(designs), key=designs.count) if designs else "Unknown"
    
    first_score = scores[0] if scores else 0
    last_score = scores[-1] if scores else 0
    improvement = last_score - first_score
    
    return {
        "total_analyses": len(user_history),
        "avg_score": round(avg, 1),
        "best_design": most_common,
        "improvement": improvement,
        "recent_scores": scores[-10:]
    }

@router.post("/history/add")
async def add_to_history(
    analysis_data: dict,
    authorization: Optional[str] = Header(None)
):
    """Add analysis to user history."""
    if not authorization:
        return {"success": False, "message": "Login to save progress"}
    
    user_id = authorization.replace("Bearer ", "").replace("tok_", "")
    history = load_history()
    
    if user_id not in history:
        history[user_id] = []
    
    history[user_id].append({
        "video_id": analysis_data.get("video_id"),
        "score": analysis_data.get("overall_score"),
        "technique_score": analysis_data.get("technique_score"),
        "consistency_score": analysis_data.get("consistency_score"),
        "latte_art_score": analysis_data.get("latte_art_score"),
        "design": analysis_data.get("design", "Unknown"),
        "timestamp": str(uuid.uuid4())[:8]
    })
    
    history[user_id] = history[user_id][-50:]
    save_history(history)
    
    return {"success": True}

@router.get("/drills")
async def get_drills():
    """Get training drills."""
    drills = load_drills()
    return {"drills": drills}

@router.get("/drills/{drill_type}")
async def get_drill(drill_type: str):
    """Get specific drill."""
    drills = load_drills()
    if drill_type in drills:
        return drills[drill_type]
    return {"error": "Drill not found"}

@router.get("/teams")
async def get_teams():
    """Get all teams."""
    return {"teams": load_teams()}

@router.post("/teams/create")
async def create_team(
    name: str,
    authorization: Optional[str] = Header(None)
):
    """Create a new team."""
    if not authorization:
        return {"error": "Login required"}
    
    user_id = authorization.replace("Bearer ", "").replace("tok_", "")
    teams = load_teams()
    
    team_id = f"team_{uuid.uuid4().hex[:6]}"
    teams[team_id] = {
        "name": name,
        "owner": user_id,
        "members": [user_id],
        "created_at": str(uuid.uuid4())[:8]
    }
    
    return {"team_id": team_id, "team": teams[team_id]}

@router.post("/teams/{team_id}/join")
async def join_team(
    team_id: str,
    authorization: Optional[str] = Header(None)
):
    """Join a team."""
    if not authorization:
        return {"error": "Login required"}
    
    user_id = authorization.replace("Bearer ", "").replace("tok_", "")
    teams = load_teams()
    
    if team_id not in teams:
        return {"error": "Team not found"}
    
    if user_id not in teams[team_id]["members"]:
        teams[team_id]["members"].append(user_id)
    
    return {"success": True, "team": teams[team_id]}

@router.get("/teams/{team_id}/members")
async def get_team_members(team_id: str):
    """Get team members with their scores and progress."""
    teams = load_teams()
    history = load_history()
    
    if team_id not in teams:
        return {"error": "Team not found"}
    
    members_data = []
    for member_id in teams[team_id]["members"]:
        member_history = history.get(member_id, [])
        scores = [h.get("score", 0) for h in member_history]
        avg_score = sum(scores) / len(scores) if scores else 0
        latest_score = scores[-1] if scores else 0
        
        # Check certification
        is_certified = avg_score >= 75 and len(member_history) >= 10
        
        members_data.append({
            "member_id": member_id,
            "analyses": len(member_history),
            "avg_score": round(avg_score, 1),
            "latest_score": round(latest_score, 1),
            "is_certified": is_certified,
            "recent_designs": [h.get("design", "Unknown") for h in member_history[-5:]]
        })
    
    # Sort by average score
    members_data.sort(key=lambda x: x["avg_score"], reverse=True)
    
    return {"team": teams[team_id], "members": members_data}

@router.post("/teams/{team_id}/assign")
async def assign_training(
    team_id: str,
    drill: str,
    target: int = 10,
    authorization: Optional[str] = Header(None)
):
    """Assign training drill to team members."""
    if not authorization:
        return {"error": "Login required"}
    
    teams = load_teams()
    if team_id not in teams:
        return {"error": "Team not found"}
    
    # Store assignment
    assignments_file = "assignments.json"
    assignments = {}
    if os.path.exists(assignments_file):
        with open(assignments_file, 'r') as f:
            assignments = json.load(f)
    
    import datetime
    assignment_id = f"assign_{uuid.uuid4().hex[:8]}"
    assignments[assignment_id] = {
        "team_id": team_id,
        "drill": drill,
        "target": target,
        "assigned_at": str(datetime.datetime.now()),
        "status": "active"
    }
    
    with open(assignments_file, 'w') as f:
        json.dump(assignments, f)
    
    return {"success": True, "assignment_id": assignment_id}

@router.get("/teams/{team_id}/leaderboard")
async def get_leaderboard(team_id: str):
    """Get team leaderboard sorted by scores."""
    teams = load_teams()
    history = load_history()
    
    if team_id not in teams:
        return {"error": "Team not found"}
    
    leaderboard = []
    for member_id in teams[team_id]["members"]:
        member_history = history.get(member_id, [])
        scores = [h.get("score", 0) for h in member_history]
        
        if scores:
            avg = sum(scores) / len(scores)
            latest = scores[-1]
            improvement = scores[-1] - scores[0] if len(scores) > 1 else 0
            
            leaderboard.append({
                "rank": 0,
                "member_id": member_id,
                "avg_score": round(avg, 1),
                "latest_score": round(latest, 1),
                "improvement": round(improvement, 1),
                "total_analyses": len(scores)
            })
    
    # Sort and assign ranks
    leaderboard.sort(key=lambda x: x["avg_score"], reverse=True)
    for i, m in enumerate(leaderboard):
        m["rank"] = i + 1
    
    return {"leaderboard": leaderboard}

@router.get("/teams/{team_id}/stats")
async def get_team_stats(team_id: str):
    """Get team productivity statistics."""
    teams = load_teams()
    history = load_history()
    
    if team_id not in teams:
        return {"error": "Team not found"}
    
    total_analyses = 0
    certified_members = 0
    avg_score = 0
    all_scores = []
    
    for member_id in teams[team_id]["members"]:
        member_history = history.get(member_id, [])
        total_analyses += len(member_history)
        
        scores = [h.get("score", 0) for h in member_history]
        all_scores.extend(scores)
        
        if scores and sum(scores)/len(scores) >= 75 and len(scores) >= 10:
            certified_members += 1
    
    avg_score = sum(all_scores)/len(all_scores) if all_scores else 0
    
    return {
        "total_analyses": total_analyses,
        "team_size": len(teams[team_id]["members"]),
        "certified_members": certified_members,
        "avg_score": round(avg_score, 1),
        "ready_to_serve": certified_members
    }