'use client';

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Navbar from "@/components/Navbar";

interface User {
  guest_id?: string;
  user_id?: string;
  email?: string;
  name?: string;
  credits: number;
  guest?: boolean;
}

interface Package {
  id: number;
  credits: number;
  price: number;
  name: string;
}

const LOGIN_MODES = {
  LOGIN: "login",
  REGISTER: "register",
  OTP: "otp",
  PAYMENT: "payment"
} as const;

const metricExplanations = {
  technique: "How smooth and controlled your pour motion is. Higher = more consistent wrist movement.",
  consistency: "How steady your flow rate stayed throughout the pour. Higher = more even speed.",
  latte_art: "The overall quality of your latte art pattern - contrast, symmetry & detail.",
  control: "How steady your hand was during the pour. Fewer unnecessary movements = better.",
  contrast: "How well the white (cream) and brown (espresso) colors stand out from each other.",
  symmetry: "How balanced and centered your pattern looks. 100 = perfectly centered.",
  complexity: "Detail level in your pattern. More intricate = higher score.",
};

interface AnalysisResult {
  video_id: string;
  filename: string;
  scores: {
    overall_score: number;
    technique_score: number;
    consistency_score: number;
    latte_art_score: number;
    control_score: number;
  };
  feedback: string[];
  motion_analysis: {
    duration_seconds: number;
    movement_count: number;
    avg_flow: number;
    max_flow: number;
  };
  latte_art_analysis: {
    contrast_score: number;
    symmetry_score: number;
    pattern_complexity: number;
  };
  latte_art_design: {
    design: string;
    technique: string;
    description: string;
  };
  specific_corrections: {
    corrections: Array<{issue: string; fix: string; visual_tip: string}>;
    recommended_drills: string[];
    weakest_area: string;
    quality_level: string;
    can_serve_customers: boolean;
  };
  object_detections: Array<{
    class: string;
    confidence: number;
    bbox: number[];
  }>;
  detection_frames: string[];
}

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [videoId, setVideoId] = useState("");
  const [dragActive, setDragActive] = useState(false);
  const [activeTab, setActiveTab] = useState<"scores" | "design" | "objects" | "motion">("scores");
  const [user, setUser] = useState<User>({ credits: 200, guest: true });
  const [showLogin, setShowLogin] = useState(false);
  const [loginMode, setLoginMode] = useState<typeof LOGIN_MODES[keyof typeof LOGIN_MODES]>(LOGIN_MODES.LOGIN);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [otp, setOtp] = useState("");
  const [packages, setPackages] = useState<Package[]>([]);
  const [selectedPackage, setSelectedPackage] = useState<Package | null>(null);
  const [loginError, setLoginError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchUser();
    fetchPackages();
  }, []);

  const fetchUser = async () => {
    try {
      const res = await fetch("http://localhost:8000/api/v1/auth/me");
      const data = await res.json();
      setUser(data);
    } catch (e) {
      console.error("User fetch error:", e);
    }
  };

  const fetchPackages = async () => {
    try {
      const res = await fetch("http://localhost:8000/api/v1/auth/packages");
      const data = await res.json();
      setPackages(data.packages || []);
    } catch (e) {
      console.error("Packages fetch error:", e);
    }
  };

  const handleLogin = async () => {
    setLoginError("");
    try {
      const res = await fetch("http://localhost:8000/api/v1/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });
      
      if (res.ok) {
        const data = await res.json();
        setUser({ ...data, guest: false });
        setShowLogin(false);
      } else {
        setLoginError("Invalid credentials");
      }
    } catch (e) {
      setLoginError("Login failed. Try again.");
    }
  };

  const handleRegister = async () => {
    setLoginError("");
    try {
      const res = await fetch("http://localhost:8000/api/v1/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, name })
      });
      
      if (res.ok) {
        const data = await res.json();
        setUser({ ...data, guest: false });
        setShowLogin(false);
      } else {
        const data = await res.json();
        setLoginError(data.detail || "Registration failed");
      }
    } catch (e) {
      setLoginError("Registration failed. Try again.");
    }
  };

  const handleSendOTP = async () => {
    setLoginError("");
    try {
      const res = await fetch("http://localhost:8000/api/v1/auth/otp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email })
      });
      
      if (res.ok) {
        setLoginMode(LOGIN_MODES.OTP);
      } else {
        setLoginError("Email not found");
      }
    } catch (e) {
      setLoginError("Failed to send OTP");
    }
  };

  const handleVerifyOTP = async () => {
    setLoginError("");
    try {
      const res = await fetch("http://localhost:8000/api/v1/auth/otp/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp })
      });
      
      if (res.ok) {
        const data = await res.json();
        setUser({ ...data, guest: false });
        setShowLogin(false);
      } else {
        setLoginError("Invalid OTP");
      }
    } catch (e) {
      setLoginError("Verification failed");
    }
  };

  const handlePaymentInit = async (pkg: Package) => {
    setSelectedPackage(pkg);
    setLoginMode(LOGIN_MODES.PAYMENT);
  };

  const handlePayment = async () => {
    setLoginError("");
    try {
      const res = await fetch("http://localhost:8000/api/v1/auth/payment/init", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          package_id: packages.findIndex(p => p.id === selectedPackage?.id),
          user_id: user.user_id
        })
      });
      
      if (res.ok) {
        const data = await res.json();
        alert(`Payment Instructions:\n\nAmount: ₹${data.amount}\nUPI ID: ${data.upi_id}\nNote: ${data.payment_id}\n\nAfter payment, credits will be added automatically!`);
        setLoginMode(LOGIN_MODES.LOGIN);
        setSelectedPackage(null);
      }
    } catch (e) {
      setLoginError("Payment failed");
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const selectedFile = e.dataTransfer.files[0];
      if (selectedFile.type.startsWith("video/")) {
        setFile(selectedFile);
        setResult(null);
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setResult(null);
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    if (user.credits < 1 && user.guest) {
      alert("No credits left! Login to get more credits or purchase a pack.");
      setShowLogin(true);
      return;
    }
    
    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    
    try {
      const response = await fetch("http://localhost:8000/api/v1/analysis/upload", {
        method: "POST",
        body: formData,
      });
      
      if (response.ok) {
        const data = await response.json();
        setResult(data);
        setVideoId(data.video_id);
        
        if (user.guest) {
          setUser({ ...user, credits: user.credits - 1 });
        }
      } else if (response.status === 402) {
        alert("Credits exhausted! Purchase more credits to continue.");
        setShowLogin(true);
      } else {
        alert("Analysis failed. Please try again.");
      }
    } catch (error) {
      console.error("Upload error:", error);
      alert("Could not connect to server.");
    } finally {
      setUploading(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-amber-600";
    return "text-red-500";
  };

  const getScoreBg = (score: number) => {
    if (score >= 80) return "bg-green-100";
    if (score >= 60) return "bg-amber-100";
    return "bg-red-100";
  };

  const getProgressWidth = (score: number) => Math.min(100, Math.max(0, score));

  return (
    <main className="min-h-screen bg-cream">
      <Navbar />
      
      <AnimatePresence>
        {showLogin && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowLogin(false)}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="bg-cream rounded-3xl p-8 max-w-md w-full"
              onClick={e => e.stopPropagation()}
            >
              {loginMode === LOGIN_MODES.PAYMENT && selectedPackage ? (
                <>
                  <h2 className="text-2xl font-display text-espresso mb-4 text-center">
                    Buy Credits
                  </h2>
                  <div className="bg-warm-gold/10 rounded-xl p-4 mb-6">
                    <p className="text-center text-lg font-medium text-espresso">
                      {selectedPackage.credits} Credits = ₹{selectedPackage.price}
                    </p>
                  </div>
                  <div className="space-y-3 mb-6">
                    <p className="text-sm text-espresso/70">Payment Options:</p>
                    <button
                      onClick={handlePayment}
                      className="w-full py-3 bg-espresso text-cream rounded-full font-medium hover:bg-espresso/90"
                    >
                      Pay with UPI / Google Pay
                    </button>
                    <p className="text-xs text-espresso/50 text-center">
                      Other payment methods coming soon
                    </p>
                  </div>
                </>
              ) : loginMode === LOGIN_MODES.OTP ? (
                <>
                  <h2 className="text-2xl font-display text-espresso mb-4 text-center">
                    Enter OTP
                  </h2>
                  <p className="text-sm text-espresso/60 mb-4 text-center">
                    OTP sent to {email}
                  </p>
                  <input
                    type="text"
                    value={otp}
                    onChange={e => setOtp(e.target.value)}
                    placeholder="Enter 6-digit OTP"
                    className="w-full px-4 py-3 rounded-full border border-espresso/20 bg-white focus:outline-none focus:border-warm-gold mb-4 text-center text-lg tracking-widest"
                    maxLength={6}
                  />
                  <button
                    onClick={handleVerifyOTP}
                    className="w-full py-3 bg-espresso text-cream rounded-full font-medium mb-4"
                  >
                    Verify & Login
                  </button>
                </>
              ) : (
                <>
                  <h2 className="text-2xl font-display text-espresso mb-2 text-center">
                    {loginMode === LOGIN_MODES.REGISTER ? "Create Account" : "Welcome Back"}
                  </h2>
                  <p className="text-sm text-espresso/60 mb-6 text-center">
                    {loginMode === LOGIN_MODES.REGISTER 
                      ? "Sign up for 200 FREE credits!" 
                      : "Login to save your progress"}
                  </p>
                  
                  {loginMode === LOGIN_MODES.REGISTER && (
                    <input
                      type="text"
                      value={name}
                      onChange={e => setName(e.target.value)}
                      placeholder="Your name"
                      className="w-full px-4 py-3 rounded-full border border-espresso/20 bg-white focus:outline-none focus:border-warm-gold mb-3"
                    />
                  )}
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="Email"
                    className="w-full px-4 py-3 rounded-full border border-espresso/20 bg-white focus:outline-none focus:border-warm-gold mb-3"
                  />
                  <input
                    type="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Password"
                    className="w-full px-4 py-3 rounded-full border border-espresso/20 bg-white focus:outline-none focus:border-warm-gold mb-4"
                  />
                  
                  {loginError && (
                    <p className="text-red-500 text-sm mb-3 text-center">{loginError}</p>
                  )}
                  
                  <button
                    onClick={loginMode === LOGIN_MODES.REGISTER ? handleRegister : handleLogin}
                    className="w-full py-3 bg-espresso text-cream rounded-full font-medium mb-4"
                  >
                    {loginMode === LOGIN_MODES.REGISTER ? "Sign Up (Free 200 Credits)" : "Login"}
                  </button>
                  
                  <div className="text-center space-y-2">
                    {loginMode === LOGIN_MODES.LOGIN && (
                      <>
                        <button
                          onClick={handleSendOTP}
                          className="text-sm text-warm-gold hover:underline"
                        >
                          Login with Email OTP
                        </button>
                        <br />
                        <button
                          onClick={() => setLoginMode(LOGIN_MODES.REGISTER)}
                          className="text-sm text-espresso/60 hover:text-espresso"
                        >
                          New here? Sign up for FREE credits
                        </button>
                      </>
                    )}
                    {loginMode === LOGIN_MODES.REGISTER && (
                      <button
                        onClick={() => setLoginMode(LOGIN_MODES.LOGIN)}
                        className="text-sm text-espresso/60 hover:text-espresso"
                      >
                        Already have account? Login
                      </button>
                    )}
                  </div>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col md:flex-row justify-between items-center mb-8"
          >
            <div>
              <h1 className="text-4xl md:text-5xl font-display text-espresso">
                Analyze Your Pour
              </h1>
              <p className="text-espresso/60 text-lg">
                Upload a video and get AI-powered feedback
              </p>
            </div>
            <div className="flex items-center gap-4 mt-4 md:mt-0">
              <div className="flex items-center gap-2 bg-warm-gold/10 px-4 py-2 rounded-full">
                <span className="text-warm-gold">🪙</span>
                <span className="font-medium text-espresso">{user.credits}</span>
                <span className="text-espresso/60 text-sm">credits</span>
              </div>
              <button
                onClick={() => setShowLogin(true)}
                className="px-4 py-2 bg-espresso text-cream rounded-full text-sm"
              >
                {user.guest ? "Login / Sign Up" : user.name || "Account"}
              </button>
            </div>
          </motion.div>

          <div className="glass-card rounded-3xl p-8 md:p-12 mb-8">
            <div
              className={`border-2 border-dashed rounded-2xl p-12 text-center transition-all ${
                dragActive
                  ? "border-warm-gold bg-warm-gold/5"
                  : "border-latite/30 hover:border-warm-gold/50"
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              {file ? (
                <div className="space-y-4">
                  <div className="text-4xl">🎬</div>
                  <p className="text-espresso font-medium">{file.name}</p>
                  <p className="text-espresso/50 text-sm">
                    {(file.size / (1024 * 1024)).toFixed(2)} MB
                  </p>
                  <p className="text-sm text-espresso/60">
                    Uses 1 credit {user.guest ? "- login to save progress" : ""}
                  </p>
                  <button
                    onClick={() => { setFile(null); setResult(null); }}
                    className="text-sm text-red-500 hover:text-red-600"
                  >
                    Remove file
                  </button>
                </div>
              ) : (
                <>
                  <div className="text-5xl mb-4">☕</div>
                  <p className="text-espresso mb-2">
                    Drag and drop your pour video here
                  </p>
                  <p className="text-espresso/40 text-sm mb-6">
                    or click to browse (MP4, MOV, AVI)
                  </p>
                  <input
                    ref={inputRef}
                    type="file"
                    accept="video/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <button
                    onClick={() => inputRef.current?.click()}
                    className="btn-secondary"
                  >
                    Choose File
                  </button>
                </>
              )}
            </div>

            <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={handleUpload}
                disabled={!file || uploading}
                className={`btn-primary ${(!file || uploading) ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                {uploading ? "Analyzing..." : "Analyze Pour (50 Credits)"}
              </button>
            </div>
          </div>

          <AnimatePresence>
            {result && (
              <motion.div
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="glass-card rounded-3xl p-8 md:p-12"
              >
                <div className="flex flex-col md:flex-row gap-8 mb-8">
                  <div className="flex-1">
                    <div className="text-center mb-6">
                      <p className="text-espresso/50 text-sm mb-2">Video ID</p>
                      <p className="font-mono text-sm text-espresso">{result.video_id}</p>
                    </div>
                    
                    <div className="text-center p-8 rounded-2xl bg-gradient-to-br from-espresso to-espresso-light">
                      <p className="text-7xl font-display text-cream mb-2">
                        {result.scores.overall_score}
                      </p>
                      <p className="text-cream/70 text-sm">Overall Score</p>
                    </div>
                  </div>

                  <div className="flex-1 space-y-4">
                    {[
                      { key: "technique", label: "Technique", score: result.scores.technique_score },
                      { key: "consistency", label: "Consistency", score: result.scores.consistency_score },
                      { key: "latte_art", label: "Latte Art", score: result.scores.latte_art_score },
                      { key: "control", label: "Control", score: result.scores.control_score },
                    ].map((item) => (
                      <div key={item.key} className="p-4 rounded-xl bg-white">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm font-medium text-espresso">{item.label}</span>
                          <span className={`text-xl font-bold ${getScoreColor(item.score)}`}>
                            {item.score}
                          </span>
                        </div>
                        <div className="h-2 bg-espresso/10 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${getProgressWidth(item.score)}%` }}
                            transition={{ duration: 0.8, delay: 0.2 }}
                            className={`h-full rounded-full ${
                              item.score >= 80 ? "bg-green-500" :
                              item.score >= 60 ? "bg-amber-500" : "bg-red-500"
                            }`}
                          />
                        </div>
                        <p className="text-xs text-espresso/50 mt-2">
                          {metricExplanations[item.key as keyof typeof metricExplanations]}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex gap-2 mb-6">
                  {(["scores", "design", "objects", "motion"] as const).map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                        activeTab === tab
                          ? "bg-espresso text-cream"
                          : "bg-espresso/10 text-espresso hover:bg-espresso/20"
                      }`}
                    >
                      {tab === "scores" ? "📊 Scores" : 
                       tab === "design" ? "🎨 Design" :
                       tab === "objects" ? "🔍 Objects" : "🎬 Motion"}
                    </button>
                  ))}
                </div>

                {activeTab === "scores" && (
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="p-6 rounded-2xl bg-espresso/5">
                      <h4 className="font-medium text-espresso mb-4">📍 Motion Analysis</h4>
                      <div className="space-y-3 text-sm">
                        <div className="flex justify-between">
                          <span className="text-espresso/60">Duration</span>
                          <span className="text-espresso font-medium">{result.motion_analysis.duration_seconds}s</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-espresso/60">Movements</span>
                          <span className="text-espresso font-medium">{result.motion_analysis.movement_count}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-espresso/60">Avg Flow Speed</span>
                          <span className="text-espresso font-medium">{result.motion_analysis.avg_flow}</span>
                        </div>
                        <p className="text-xs text-espresso/50 pt-2 border-t border-espresso/10">
                          Flow speed measures how fast you pour. Lower is usually better for control.
                        </p>
                      </div>
                    </div>
                    
                    <div className="p-6 rounded-2xl bg-espresso/5">
                      <h4 className="font-medium text-espresso mb-4">🎨 Latte Art Quality</h4>
                      <div className="space-y-3 text-sm">
                        <div className="flex justify-between">
                          <span className="text-espresso/60">Contrast</span>
                          <span className="text-espresso font-medium">{result.latte_art_analysis.contrast_score}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-espresso/60">Symmetry</span>
                          <span className="text-espresso font-medium">{result.latte_art_analysis.symmetry_score}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-espresso/60">Complexity</span>
                          <span className="text-espresso font-medium">{result.latte_art_analysis.pattern_complexity}</span>
                        </div>
                        <p className="text-xs text-espresso/50 pt-2 border-t border-espresso/10">
                          {metricExplanations.contrast}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === "design" && (
                  <div className="space-y-6">
                    <div className="text-center p-8 rounded-2xl bg-gradient-to-br from-warm-gold/20 to-warm-gold/5 border border-warm-gold/30">
                      <div className="text-6xl mb-4">
                        {result.latte_art_design?.design === "Heart" ? "❤️" :
                         result.latte_art_design?.design === "Rosetta" ? "🌿" :
                         result.latte_art_design?.design === "Tulip" ? "🌷" :
                         result.latte_art_design?.design === "Swan" ? "🦢" :
                         result.latte_art_design?.design === "Waves" ? "🌊" :
                         "☕"}
                      </div>
                      <h3 className="text-2xl font-display text-espresso mb-2">
                        {result.latte_art_design?.design || "Unknown"}
                      </h3>
                      <p className="text-sm text-espresso/60 mb-4">
                        {result.latte_art_design?.description || "No clear pattern detected"}
                      </p>
                      <div className="inline-block px-4 py-2 bg-warm-gold/20 rounded-full">
                        <span className="text-sm font-medium text-espresso">
                          Technique: {result.latte_art_design?.technique || "Unknown"}
                        </span>
                      </div>
                    </div>
                    
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="p-4 rounded-xl bg-white">
                        <h5 className="font-medium text-espresso mb-3">💡 Design Info</h5>
                        <ul className="space-y-2 text-sm text-espresso/70">
                          <li>• <strong>Heart</strong> - Classic beginner design</li>
                          <li>• <strong>Rosetta</strong> - Fern-like pattern</li>
                          <li>• <strong>Tulip</strong> - Stacked hearts</li>
                          <li>• <strong>Swan</strong> - Advanced with neck</li>
                          <li>• <strong>Waves</strong> - Horizontal patterns</li>
                        </ul>
                      </div>
                      <div className="p-4 rounded-xl bg-white">
                        <h5 className="font-medium text-espresso mb-3">🔧 Techniques</h5>
                        <ul className="space-y-2 text-sm text-espresso/70">
                          <li>• <strong>Free Pouring</strong> - Standard pour</li>
                          <li>• <strong>Etching</strong> - Tool drawing</li>
                          <li>• <strong>Stenciling</strong> - Powder templates</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === "objects" && result.detection_frames && result.detection_frames.length > 0 && (
                  <div className="space-y-4">
                    <h4 className="font-medium text-espresso">🔍 Real-Time Object Detection</h4>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                      {result.detection_frames.slice(0, 5).map((frame, i) => (
                        <div key={i} className="rounded-xl overflow-hidden bg-espresso/5">
                          <img 
                            src={`data:image/jpeg;base64,${frame}`}
                            alt={`Frame ${i + 1}`}
                            className="w-full h-auto"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {activeTab === "motion" && (
                  <div className="space-y-4">
                    <h4 className="font-medium text-espresso">📽️ Pour Motion Analysis</h4>
                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="p-6 rounded-2xl bg-white">
                        <h5 className="text-sm font-medium text-espresso mb-3">What we measure:</h5>
                        <ul className="space-y-2 text-sm text-espresso/70">
                          <li>• <strong>Flow magnitude</strong> - Speed of milk poured</li>
                          <li>• <strong>Movement count</strong> - Number of pour phases</li>
                          <li>• <strong>Frame-by-frame</strong> - Changes between frames</li>
                        </ul>
                      </div>
                      <div className="p-6 rounded-2xl bg-white">
                        <h5 className="text-sm font-medium text-espresso mb-3">Tips for better score:</h5>
                        <ul className="space-y-2 text-sm text-espresso/70">
                          <li>• Pour from close range (2-3 inches)</li>
                          <li>• Keep steady hand throughout</li>
                          <li>• Pour in center of cup</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                )}

                <div className="mt-8 p-6 rounded-2xl bg-warm-gold/10">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-medium text-espresso">💡 Specific Corrections</h4>
                    {result.specific_corrections && (
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                        result.specific_corrections.can_serve_customers 
                          ? "bg-green-100 text-green-700" 
                          : "bg-amber-100 text-amber-700"
                      }`}>
                        {result.specific_corrections.quality_level || "Learning"}
                      </span>
                    )}
                  </div>
                  
                  {result.specific_corrections?.corrections?.map((correction, i) => (
                    <div key={i} className="mb-4 p-4 bg-white rounded-xl">
                      <p className="font-medium text-espresso mb-1">{correction.issue}</p>
                      <p className="text-sm text-espresso/80 mb-2">{correction.fix}</p>
                      <p className="text-xs text-warm-gold font-medium">💡 {correction.visual_tip}</p>
                    </div>
                  ))}
                  
                  {result.specific_corrections?.recommended_drills && result.specific_corrections.recommended_drills.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-warm-gold/20">
                      <p className="text-sm font-medium text-espresso mb-2">🎯 Recommended Drills:</p>
                      <div className="flex flex-wrap gap-2">
                        {result.specific_corrections.recommended_drills.map((drill, i) => (
                          <span key={i} className="px-3 py-1 bg-espresso text-cream rounded-full text-xs">
                            {drill.charAt(0).toUpperCase() + drill.slice(1)}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {result.specific_corrections?.can_serve_customers && (
                    <div className="mt-4 p-3 bg-green-100 rounded-xl text-center">
                      <p className="text-green-700 font-medium">🎉 Ready to serve customers!</p>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </section>
    </main>
  );
}