# FINAL_INSTRUCTION.md

# Pour-Over AI ☕🤖  
### Complete Build Instruction Document

---

# Project Name

**Pour-Over AI**

---

# Core Idea

Pour-Over AI is an AI-powered platform for baristas, coffee beginners, and coffee shops to learn and improve latte art using Computer Vision.

Users can upload a pouring video or use live camera mode.  
The system analyzes:

- Cup tilt  
- Pitcher angle  
- Milk flow speed  
- Wrist movement  
- Foam spread  
- Final pattern quality  

Then gives real-time coaching and improvement feedback.

It acts like a **personal AI coffee trainer**.

---

# Main Goal

Build a premium startup-level website + working AI backend that helps users create latte art designs such as:

- Heart  
- Rosetta  
- Tulip  
- Swan  
- Custom patterns  

---

# AI Agent Role

The AI Agent must behave like a professional barista coach.

It should:

## Observe

Analyze video or live camera feed.

## Detect

Identify:

- Cup position  
- Pitcher position  
- Milk stream path  
- Hand motion  
- Foam layer  
- Final pattern  

## Evaluate

Compare with professional pouring patterns.

## Guide

Give instant suggestions like:

- Tilt cup more  
- Pour lower  
- Slow down flow  
- Start wiggle now  
- Finish earlier  

## Score

Return:

- Pour Score  
- Pattern Accuracy  
- Foam Quality  
- Smoothness Score  
- Improvement Suggestions  

---

# How To Build It

---

# Frontend

Build a premium futuristic website using:

- React.js / Next.js  
- Tailwind CSS  
- Framer Motion  
- GSAP (optional)  

## Frontend Pages

### Home Page

- Hero section  
- Features  
- Dashboard preview  
- Pricing  
- Testimonials  
- CTA  

### Login / Signup

### User Dashboard

### Upload Video Page

### Coffee Shop Team Dashboard

---

# Frontend Theme

Use:

- Luxury coffee aesthetic  
- Anti-gravity floating visuals  
- Flowing espresso + cream background  
- Floating 3D mug while scrolling  
- Glassmorphism cards  
- Smooth animations  

Color Palette:

- Espresso Brown  
- Cream White  
- Warm Beige  
- Deep Black  

---

# Backend

Use:

- FastAPI (Recommended)  
or  
- Node.js

Backend must handle:

- Authentication  
- Upload videos  
- Run AI model  
- Store results  
- Dashboard APIs  
- Subscription system  

---

# AI System

Use:

- Python  
- YOLOv8  
- OpenCV  
- NumPy  

---

# What AI Must Detect

Train model to detect:

- Cup  
- Pitcher  
- Hand  
- Milk stream  
- Foam region  
- Latte art result  

---

# AI Workflow

```txt
1. User uploads video
2. Extract frames
3. Detect objects using YOLOv8
4. Track motion using OpenCV
5. Compare with ideal latte art motions
6. Generate score
7. Return tips to dashboard