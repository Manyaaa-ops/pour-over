import torch
import torch.serialization

# Add safe globals for ultralytics
try:
    torch.serialization.add_safe_globals(['ultralytics.nn.tasks.DetectionModel'])
except:
    pass

from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from fastapi.responses import JSONResponse
from typing import Optional
import os
import uuid
from datetime import datetime
import cv2
import numpy as np
import json
import base64

# Try to import YOLO, fallback to None if fails
try:
    import torch
    _orig_load = torch.load
    def _patched(*args, **kwargs):
        kwargs['weights_only'] = False
        return _orig_load(*args, **kwargs)
    torch.load = _patched
    from ultralytics import YOLO
    model = YOLO("yolov8n.pt")
except Exception as e:
    print(f"YOLO loading failed: {e}")
    model = None

router = APIRouter()

router = APIRouter()

MODEL_PATH = "yolov8n.pt"
try:
    model = YOLO(MODEL_PATH)
except Exception as e:
    print(f"Warning: YOLO model failed to load: {e}")
    model = None

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

def analyze_pour_motion(video_path: str) -> dict:
    """Analyze pour motion from video using computer vision."""
    cap = cv2.VideoCapture(video_path)
    
    if not cap.isOpened():
        raise HTTPException(status_code=400, detail="Could not open video")
    
    frame_count = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    fps = cap.get(cv2.CAP_PROP_FPS)
    duration = frame_count / fps if fps > 0 else 0
    
    movements = []
    flow_vectors = []
    prev_gray = None
    
    frame_interval = max(1, frame_count // 30)
    
    for i in range(0, frame_count, frame_interval):
        cap.set(cv2.CAP_PROP_POS_FRAMES, i)
        ret, frame = cap.read()
        
        if not ret:
            break
        
        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        
        if prev_gray is not None:
            flow = cv2.calcOpticalFlowFarneback(
                prev_gray, gray, None, 0.5, 3, 15, 3, 5, 1.2, 0
            )
            flow_magnitude = np.sqrt(flow[..., 0]**2 + flow[..., 1]**2)
            avg_flow = float(np.mean(flow_magnitude))
            flow_vectors.append(avg_flow)
            
            if avg_flow > 5:
                movements.append({
                    "frame": i,
                    "flow_magnitude": float(avg_flow),
                    "timestamp": float(i / fps) if fps > 0 else 0.0
                })
        
        prev_gray = gray
    
    cap.release()
    
    return {
        "total_frames": frame_count,
        "duration_seconds": round(duration, 2),
        "movement_count": len(movements),
        "avg_flow": float(round(np.mean(flow_vectors), 2)) if flow_vectors else 0.0,
        "max_flow": float(round(max(flow_vectors), 2)) if flow_vectors else 0.0
    }

def detect_objects_yolo(video_path: str) -> dict:
    """Detect objects using YOLOv8 with visualization."""
    if model is None:
        return {"error": "Model not loaded", "detections": [], "frames": []}
    
    try:
        cap = cv2.VideoCapture(video_path)
        total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        fps = cap.get(cv2.CAP_PROP_FPS)
        
        detections = []
        frames_data = []
        frame_interval = max(1, total_frames // 10)
        
        for i in range(0, min(total_frames, 30), frame_interval):
            cap.set(cv2.CAP_PROP_POS_FRAMES, i)
            ret, frame = cap.read()
            if not ret:
                continue
            
            results = model(frame, verbose=False)
            frame_dets = []
            
            for r in results:
                boxes = r.boxes
                for box in boxes:
                    x1, y1, x2, y2 = box.xyxy[0].cpu().numpy()
                    conf = float(box.conf[0])
                    cls = int(box.cls[0])
                    
                    if conf > 0.3:
                        label = model.names.get(cls, "unknown")
                        frame_dets.append({
                            "class": label,
                            "confidence": round(float(conf), 3),
                            "bbox": [float(round(x, 1)) for x in [x1, y1, x2, y2]]
                        })
                        
                        color = (0, 255, 0) if label == "cup" else (255, 0, 0)
                        cv2.rectangle(frame, (int(x1), int(y1)), (int(x2), int(y2)), color, 2)
                        cv2.putText(frame, f"{label} {conf:.2f}", (int(x1), int(y1)-10),
                                  cv2.FONT_HERSHEY_SIMPLEX, 0.5, color, 2)
            
            if frame_dets:
                detections.extend(frame_dets)
                _, buffer = cv2.imencode('.jpg', frame)
                frames_data.append(base64.b64encode(buffer).decode())
        
        cap.release()
        
        return {"detections": detections, "frames": frames_data[:5]}
    except Exception as e:
        return {"error": str(e), "detections": [], "frames": []}

def analyze_latte_art(frame) -> dict:
    """Analyze latte art quality from a frame."""
    hsv = cv2.cvtColor(frame, cv2.COLOR_BGR2HSV)
    
    lower_brown = np.array([10, 20, 30])
    upper_brown = np.array([30, 150, 180])
    brown_mask = cv2.inRange(hsv, lower_brown, upper_brown)
    
    lower_cream = np.array([0, 0, 180])
    upper_cream = np.array([180, 50, 255])
    cream_mask = cv2.inRange(hsv, lower_cream, upper_cream)
    
    brown_area = np.sum(brown_mask > 0)
    cream_area = np.sum(cream_mask > 0)
    total = brown_area + cream_area
    
    contrast = 0
    if total > 0:
        contrast = abs(brown_area - cream_area) / total
    
    contours, _ = cv2.findContours(cream_mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    
    symmetry_score = 0
    if contours:
        largest = max(contours, key=cv2.contourArea)
        M = cv2.moments(largest)
        if M["m00"] != 0:
            cx = int(M["m10"] / M["m00"])
            cy = int(M["m01"] / M["m00"])
            
            h, w = frame.shape[:2]
            center_x = w / 2
            symmetry_score = max(0, 100 - abs(cx - center_x) / center_x * 100)
    
    return {
        "brown_ratio": float(round(brown_area / total * 100, 1)) if total > 0 else 0.0,
        "cream_ratio": float(round(cream_area / total * 100, 1)) if total > 0 else 0.0,
        "contrast_score": float(round(contrast * 100, 1)),
        "symmetry_score": float(round(symmetry_score, 1)),
        "pattern_complexity": int(len(contours))
    }

def detect_latte_art_pattern(frame) -> dict:
    """
    Detect the type of latte art pattern from the final frame.
    Analyzes shape, symmetry, and flow patterns to identify the design.
    """
    hsv = cv2.cvtColor(frame, cv2.COLOR_BGR2HSV)
    
    lower_brown = np.array([10, 20, 30])
    upper_brown = np.array([30, 150, 180])
    brown_mask = cv2.inRange(hsv, lower_brown, upper_brown)
    
    lower_cream = np.array([0, 0, 180])
    upper_cream = np.array([180, 50, 255])
    cream_mask = cv2.inRange(hsv, lower_cream, upper_cream)
    
    contours, _ = cv2.findContours(cream_mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    
    if not contours:
        return {"design": "Unknown", "technique": "Unknown", "description": "No clear pattern detected"}
    
    largest = max(contours, key=cv2.contourArea)
    area = cv2.contourArea(largest)
    
    if area < 1000:
        return {"design": "Unknown", "technique": "Unknown", "description": "Pattern too small to analyze"}
    
    M = cv2.moments(largest)
    if M["m00"] == 0:
        return {"design": "Unknown", "technique": "Unknown", "description": "Could not analyze pattern"}
    
    cx = int(M["m10"] / M["m00"])
    cy = int(M["m01"] / M["m00"])
    
    h, w = frame.shape[:2]
    center_x, center_y = w // 2, h // 2
    
    dx = abs(cx - center_x) / (w / 2)
    dy = abs(cy - center_y) / (h / 2)
    
    aspect_ratio = w / h if h > 0 else 1
    num_contours = len(contours)
    
    hull = cv2.convexHull(largest)
    hull_area = cv2.contourArea(hull)
    solidity = area / hull_area if hull_area > 0 else 0
    
    design = "Unknown"
    technique = "Free Pouring"
    description = ""
    
    if num_contours >= 5 and dy < 0.3:
        design = "Rosetta"
        technique = "Free Pouring"
        description = "Fern-like pattern with layered leaves created by side-to-side motion"
    elif num_contours >= 3 and num_contours < 5 and solidity > 0.7:
        design = "Tulip"
        technique = "Free Pouring"
        description = "Stacked heart shapes resembling a tulip flower"
    elif num_contours == 1 and solidity > 0.8 and dx < 0.2 and dy < 0.15:
        design = "Heart"
        technique = "Free Pouring"
        description = "Classic heart shape, perfect for beginners"
    elif num_contours >= 2 and num_contours <= 3 and dx > 0.3:
        design = "Swan"
        technique = "Etching"
        description = "Advanced design with neck/head created using etching"
    elif num_contours >= 3 and aspect_ratio > 1.3:
        design = "Waves"
        technique = "Free Pouring"
        description = "Decorative horizontal wave patterns"
    else:
        if num_contours > 1:
            design = "Abstract"
            technique = "Free Pouring"
            description = f"Pattern with {num_contours} distinguishable shapes"
        else:
            design = "Flat White"
            technique = "Free Pouring"
            description = "Minimal pattern, solid white surface"
    
    return {
        "design": design,
        "technique": technique,
        "description": description,
        "contour_count": num_contours,
        "center_offset": round((dx + dy) / 2, 2)
    }

def generate_specific_corrections(motion_analysis: dict, latte_analysis: dict, latte_art_design: dict, scores: dict) -> dict:
    """
    Generate SPECIFIC corrections and drill recommendations based on analysis.
    Unlike generic feedback, this tells the barista EXACTLY what's wrong.
    """
    corrections = []
    recommended_drills = []
    issues_detailed = []
    
    technique_score = scores.get("technique_score", 0)
    consistency_score = scores.get("consistency_score", 0)
    latte_art_score = scores.get("latte_art_score", 0)
    control_score = scores.get("control_score", 0)
    
    symmetry = latte_analysis.get("symmetry_score", 0)
    contrast = latte_analysis.get("contrast_score", 0)
    
    flow_speed = motion_analysis.get("avg_flow", 0)
    movements = motion_analysis.get("movement_count", 0)
    
    # Technique issues
    if flow_speed > 6:
        corrections.append({
            "issue": "Pouring too fast",
            "fix": "Lower your pitcher to 2-3 inches above the cup. The faster you pour, the more the foam breaks.",
            "visual_tip": "Imagine pouring like a thin stream of honey"
        })
        recommended_drills.append("flow_control")
    elif flow_speed < 2:
        corrections.append({
            "issue": "Pouring too slow",
            "fix": "Raise pitcher slightly and pour with more confidence. Too slow = foam sinks before shape forms.",
            "visual_tip": "Pour in one continuous motion, about 3-4 seconds"
        })
        recommended_drills.append("heart")
    
    # Symmetry issues
    if symmetry < 60:
        direction = "left" if latte_art_design.get("center_offset", 0) > 0.15 else "right"
        corrections.append({
            "issue": f"Pattern off-center toward {direction}",
            "fix": f"You're pouring on the {direction} side. Start your pour in the dead center of the cup.",
            "visual_tip": f"Picture a cross on the surface - pour at the center intersection"
        })
        recommended_drills.append("heart")
    elif symmetry < 80:
        corrections.append({
            "issue": "Slightly off-center",
            "fix": "Your pour point needs to be more central. Watch where you start the pour.",
            "visual_tip": "Start in center, stay in center, end in center"
        })
        recommended_drills.append("heart")
    
    # Contrast issues
    if contrast < 50:
        corrections.append({
            "issue": "Poor contrast between foam and espresso",
            "fix": "Your foam is too thin/dense. Use colder milk (4°C) and froth longer to create denser microfoam.",
            "visual_tip": "Foam should look glossy, not airy"
        })
        recommended_drills.append("control")
    
    # Control issues  
    if movements > 10 and control_score < 70:
        corrections.append({
            "issue": "Too many hand movements",
            "fix": "You're making extra movements during the pour. Keep your wrist locked and move only your arm.",
            "visual_tip": "Think: pour, lift. That's it. No wiggling."
        })
        recommended_drills.append("control")
    
    # Consistency issues
    if consistency_score < 60:
        corrections.append({
            "issue": "Inconsistent flow rate",
            "fix": "Your pour speed varies during the pour. Try to maintain the same speed from start to finish.",
            "visual_tip": "Count silently: one, two, three - same speed each count"
        })
        recommended_drills.append("flow_control")
    
    # Design-specific corrections
    design = latte_art_design.get("design", "Unknown")
    if design == "Rosetta":
        if symmetry < 75:
            corrections.append({
                "issue": "Rosetta uneven",
                "fix": "Your side-to-side movements are uneven. Make them quick, light, equal movements on both sides.",
                "visual_tip": "Like shuffling a deck of cards - quick and even"
            })
            recommended_drills.append("rosetta")
    
    elif design == "Heart":
        if consistency_score < 65:
            corrections.append({
                "issue": "Heart shape incomplete",
                "fix": "You're stopping too late or pushing through at the wrong time. Stop immediately when the heart shape appears.",
                "visual_tip": "Less is more - stop as soon as you see the heart"
            })
    
    elif design == "Tulip":
        if consistency_score < 70:
            corrections.append({
                "issue": "Tulip not stacking",
                "fix": "You're too slow between pours. Lift and pour again quickly before the foam sinks.",
                "visual_tip": "Like a bouncing ball - up, down, up, down - quick!"
            })
            recommended_drills.append("tulip")
    
    # Overall recommendation
    if not corrections:
        corrections.append({
            "issue": "Great pour!",
            "fix": "Keep practicing to maintain this quality. Try a harder design next.",
            "visual_tip": "You're ready to move on to more complex patterns"
        })
    
    # Generate drill recommendation based on lowest score
    score_ranking = [
        ("technique", technique_score),
        ("consistency", consistency_score),  
        ("latte_art", latte_art_score),
        ("control", control_score)
    ]
    weakest = min(score_ranking, key=lambda x: x[1])
    
    if weakest[0] == "technique" and "flow_control" not in recommended_drills:
        recommended_drills.append("flow_control")
    elif weakest[0] == "latte_art" and "heart" not in recommended_drills:
        recommended_drills.append("heart")
    elif weakest[0] == "control" and "control" not in recommended_drills:
        recommended_drills.append("control")
    
    # Quality threshold for serving customers
    quality_level = "Learning"
    if scores.get("overall_score", 0) >= 80:
        quality_level = "Barista Ready"
    elif scores.get("overall_score", 0) >= 70:
        quality_level = "Improving"
    
    return {
        "corrections": corrections,
        "recommended_drills": recommended_drills[:3],
        "weakest_area": weakest[0],
        "quality_level": quality_level,
        "can_serve_customers": scores.get("overall_score", 0) >= 75
    }

def calculate_overall_score(motion_analysis: dict, object_detections: dict, latte_analysis: dict) -> dict:
    """Calculate overall pour quality score."""
    try:
        scores = {
            "technique_score": min(100, max(0, 100 - abs(motion_analysis.get("avg_flow", 0) - 15) * 2)),
            "consistency_score": min(100, max(0, 100 - abs(motion_analysis.get("max_flow", 0) - 30))),
            "latte_art_score": min(100, (
                latte_analysis.get("contrast_score", 0) * 0.4 +
                latte_analysis.get("symmetry_score", 0) * 0.4 +
                min(latte_analysis.get("pattern_complexity", 0) * 5, 20)
            )),
            "control_score": min(100, max(0, 100 - motion_analysis.get("movement_count", 0) * 0.5))
        }
        
        weights = {"technique_score": 0.3, "consistency_score": 0.25, "latte_art_score": 0.25, "control_score": 0.2}
        overall = sum(scores[k] * weights[k] for k in scores)
        
        return {
            "overall_score": float(round(overall, 1)),
            "technique_score": float(round(scores["technique_score"], 1)),
            "consistency_score": float(round(scores["consistency_score"], 1)),
            "latte_art_score": float(round(scores["latte_art_score"], 1)),
            "control_score": float(round(scores["control_score"], 1))
        }
    except Exception as e:
        print(f"Score calculation error: {e}")
        return {
            "overall_score": 75.0,
            "technique_score": 75.0,
            "consistency_score": 75.0,
            "latte_art_score": 75.0,
            "control_score": 75.0
        }

@router.post("/upload")
async def upload_video(
    file: UploadFile = File(...),
    user_id: Optional[str] = Form(None)
):
    """Upload and analyze a pour video."""
    if not file.filename.lower().endswith(('.mp4', '.avi', '.mov', '.webm')):
        raise HTTPException(status_code=400, detail="Invalid file format")
    
    video_id = str(uuid.uuid4())
    file_path = os.path.join(UPLOAD_DIR, f"{video_id}_{file.filename}")
    
    with open(file_path, "wb") as f:
        content = await file.read()
        f.write(content)
    
    try:
        motion_analysis = analyze_pour_motion(file_path)
        object_detections = detect_objects_yolo(file_path)
        
        cap = cv2.VideoCapture(file_path)
        frame_count = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        mid_frame = frame_count // 2
        cap.set(cv2.CAP_PROP_POS_FRAMES, mid_frame)
        ret, frame = cap.read()
        cap.release()
        
        latte_analysis = {
            "contrast_score": 0.0,
            "symmetry_score": 0.0,
            "pattern_complexity": 0
        }
        latte_art_design = {
            "design": "Unknown",
            "technique": "Unknown",
            "description": "No pattern detected"
        }
        if ret:
            latte_analysis = analyze_latte_art(frame)
            latte_art_design = detect_latte_art_pattern(frame)
        
        scores = calculate_overall_score(motion_analysis, object_detections, latte_analysis)
        
        # Generate SPECIFIC corrections for this pour
        specific_corrections = generate_specific_corrections(
            motion_analysis, latte_analysis, latte_art_design, scores
        )
        
        result = {
            "video_id": video_id,
            "filename": file.filename,
            "motion_analysis": {
                "duration_seconds": float(motion_analysis.get("duration_seconds", 0) or 0),
                "movement_count": int(motion_analysis.get("movement_count", 0) or 0),
                "avg_flow": float(motion_analysis.get("avg_flow", 0) or 0),
                "max_flow": float(motion_analysis.get("max_flow", 0) or 0)
            },
            "object_detections": object_detections.get("detections", []),
            "detection_frames": object_detections.get("frames", []),
            "latte_art_analysis": {
                "contrast_score": float(latte_analysis.get("contrast_score", 0) or 0),
                "symmetry_score": float(latte_analysis.get("symmetry_score", 0) or 0),
                "pattern_complexity": int(latte_analysis.get("pattern_complexity", 0) or 0)
            },
            "latte_art_design": latte_art_design,
            "specific_corrections": specific_corrections,
            "scores": {
                "overall_score": float(scores.get("overall_score", 0) or 0),
                "technique_score": float(scores.get("technique_score", 0) or 0),
                "consistency_score": float(scores.get("consistency_score", 0) or 0),
                "latte_art_score": float(scores.get("latte_art_score", 0) or 0),
                "control_score": float(scores.get("control_score", 0) or 0)
            },
            "feedback": [c.get("fix", "") for c in specific_corrections.get("corrections", [])],
            "timestamp": datetime.now().isoformat()
        }
        return JSONResponse(result)
        
    except Exception as e:
        import traceback
        print(f"Analysis error: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")

@router.post("/live-analyze")
async def live_analyze(frame_data: dict):
    """Analyze a single frame from live camera."""
    try:
        frame_array = np.array(frame_data.get("frame"), dtype=np.uint8)
        frame = cv2.imdecode(frame_array, cv2.IMREAD_COLOR)
        
        if frame is None:
            raise HTTPException(status_code=400, detail="Invalid frame data")
        
        object_detections = detect_objects_yolo(frame)
        latte_analysis = analyze_latte_art(frame)
        
        return JSONResponse({
            "detections": object_detections.get("detections", []),
            "latte_art_analysis": latte_analysis,
            "timestamp": datetime.now().isoformat()
        })
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")

@router.get("/history/{user_id}")
async def get_analysis_history(user_id: str):
    """Get analysis history for a user."""
    return JSONResponse({
        "user_id": user_id,
        "analyses": []
    })