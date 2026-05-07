"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "https://pour-over.onrender.com";

interface CreditPack {
  id: number;
  credits: number;
  price: number;
  name: string;
}

const packs: CreditPack[] = [
  { id: 0, credits: 50, price: 99, name: "Starter Pack" },
  { id: 1, credits: 150, price: 249, name: "Pro Pack" },
  { id: 2, credits: 500, price: 699, name: "Barista Pack" },
  { id: 3, credits: 1000, price: 1299, name: "Master Pack" },
];

const plans = [
  {
    name: "Starter",
    price: "$29",
    period: "/month",
    description: "For individuals beginning their pour journey",
    features: [
      "5 video analyses per month",
      "Basic feedback & scoring",
      "Progress tracking",
      "Community access",
    ],
    popular: false,
  },
  {
    name: "Studio",
    price: "$79",
    period: "/month",
    description: "For serious baristas ready to master their craft",
    features: [
      "Unlimited video analysis",
      "Advanced technique breakdown",
      "Personalized drill recommendations",
      "Priority support",
      "Early access to new features",
    ],
    popular: true,
  },
  {
    name: "House",
    price: "$249",
    period: "/month",
    description: "For coffee shops training entire teams",
    features: [
      "Everything in Studio",
      "Up to 10 team members",
      "Team progress dashboards",
      "Custom training programs",
      "Dedicated account manager",
      "On-site workshops (quarterly)",
    ],
    popular: false,
  },
];

interface PaymentModalProps {
  onClose: () => void;
}

function PaymentModal({ onClose }: PaymentModalProps) {
  const router = useRouter();
  const [selectedPack, setSelectedPack] = useState<number | null>(null);
  const [paymentData, setPaymentData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [status, setStatus] = useState<"select" | "processing" | "ready" | "success">("select");

  useEffect(() => {
    const stored = localStorage.getItem("pourover_user");
    if (stored) {
      setUser(JSON.parse(stored));
    }
  }, []);

  const handleBuyPack = async (packId: number) => {
    if (!user) return;
    setLoading(true);
    setSelectedPack(packId);

    try {
      const res = await fetch("http://BACKEND_URL/api/v1/auth/payment/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          package_id: packId,
          user_id: user.user_id,
        }),
      });
      const data = await res.json();

      if (data.payment_link && !data.fallback) {
        // Redirect to Razorpay payment page
        window.location.href = data.payment_link;
      } else if (data.fallback) {
        setPaymentData(data);
        setStatus("ready");
      } else {
        // Poll for payment status
        pollPaymentStatus(data.order_id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const pollPaymentStatus = async (orderId: string) => {
    setStatus("processing");
    let attempts = 0;
    const maxAttempts = 30;

    const check = async () => {
      try {
        const res = await fetch(
          `http://BACKEND_URL/api/v1/auth/payment/status/${orderId}`
        );
        const data = await res.json();

        if (data.status === "completed") {
          setStatus("success");
          const pack = packs.find((p) => p.id === selectedPack);
          const updatedUser = {
            ...user,
            credits: user.credits + (pack?.credits || 0),
          };
          localStorage.setItem("pourover_user", JSON.stringify(updatedUser));
          setUser(updatedUser);
        } else if (attempts < maxAttempts) {
          attempts++;
          setTimeout(check, 2000);
        } else {
          setStatus("ready");
          setPaymentData({
            order_id: orderId,
            message: "Payment pending - check manually",
          });
        }
      } catch (err) {
        console.error(err);
      }
    };

    check();
  };

  const checkManualPayment = async () => {
    if (!paymentData?.order_id) return;
    setStatus("processing");

    try {
      const res = await fetch(
        `http://BACKEND_URL/api/v1/auth/payment/status/${paymentData.order_id}`
      );
      const data = await res.json();

      if (data.status === "completed") {
        setStatus("success");
        const pack = packs.find((p) => p.id === selectedPack);
        const updatedUser = {
          ...user,
          credits: user.credits + (pack?.credits || 0),
        };
        localStorage.setItem("pourover_user", JSON.stringify(updatedUser));
        setUser(updatedUser);
      } else {
        alert("Payment not found. Please complete the payment first.");
        setStatus("ready");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const pack = selectedPack !== null ? packs.find((p) => p.id === selectedPack) : null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="glass-card rounded-3xl p-8 w-full max-w-md mx-4"
          onClick={(e) => e.stopPropagation()}
        >
          {!user ? (
            <div className="text-center">
              <div className="text-4xl mb-4">🔐</div>
              <h2 className="text-xl font-display text-espresso mb-2">Login Required</h2>
              <p className="text-espresso/60 mb-6">Please login to purchase credits</p>
              <button onClick={onClose} className="btn-primary w-full">
                Login
              </button>
            </div>
          ) : status === "success" ? (
            <div className="text-center">
              <div className="text-5xl mb-4">🎉</div>
              <h2 className="text-xl font-display text-espresso mb-2">
                Payment Successful!
              </h2>
              <p className="text-espresso/60 mb-4">
                {pack?.credits} credits added to your account
              </p>
              <div className="bg-warm-gold/10 rounded-xl p-4 mb-6">
                <span className="text-warm-gold text-2xl font-medium">
                  {user.credits + (pack?.credits || 0)}
                </span>
                <span className="text-espresso/60 ml-2">credits</span>
              </div>
              <button onClick={onClose} className="btn-primary w-full">
                Done
              </button>
            </div>
          ) : status === "processing" ? (
            <div className="text-center">
              <div className="text-5xl mb-4 animate-pulse">⏳</div>
              <h2 className="text-xl font-display text-espresso mb-2">
                Processing Payment...
              </h2>
              <p className="text-espresso/60 mb-6">
                Please wait while we verify your payment
              </p>
              <div className="animate-spin w-8 h-8 border-2 border-warm-gold border-t-transparent rounded-full mx-auto"></div>
            </div>
          ) : status === "ready" && paymentData?.fallback ? (
            <>
              <h2 className="text-lg font-display text-espresso text-center mb-2">
                Complete Payment
              </h2>

              <div className="bg-cream rounded-xl p-4 mb-4">
                <div className="flex justify-between mb-2">
                  <span className="text-espresso/60">Credits</span>
                  <span className="font-medium">{pack?.credits}</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-espresso/10">
                  <span className="text-espresso/60">Total</span>
                  <span className="font-medium text-warm-gold">
                    ₹{pack?.price}
                  </span>
                </div>
              </div>

              <div className="bg-espresso/5 rounded-xl p-4 mb-4">
                <p className="text-sm text-espresso/70">
                  1. Open your UPI app (GPay, PhonePe, Paytm)<br />
                  2. Pay <strong>₹{pack?.price}</strong> to{" "}
                  <strong>{paymentData.upi_id}</strong>
                  <br />
                  3. Use payment note:{" "}
                  <strong>{paymentData.order_id}</strong>
                  <br />
                  4. Click Check Payment below
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={checkManualPayment}
                  className="btn-primary flex-1"
                >
                  Check Payment
                </button>
                <button onClick={onClose} className="btn-secondary">
                  Cancel
                </button>
              </div>
            </>
          ) : (
            <>
              <h2 className="text-xl font-display text-espresso text-center mb-6">
                Buy Credits
              </h2>
              <div className="space-y-3">
                {packs.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => handleBuyPack(p.id)}
                    disabled={loading}
                    className="w-full flex items-center justify-between p-4 rounded-xl bg-cream hover:bg-warm-gold/20 transition-colors"
                  >
                    <div className="text-left">
                      <div className="font-medium text-espresso">{p.name}</div>
                      <div className="text-sm text-espresso/60">{p.credits} credits</div>
                    </div>
                    <div className="text-warm-gold font-medium">₹{p.price}</div>
                  </button>
                ))}
              </div>
            </>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

export default function Pricing() {
  const [showPayment, setShowPayment] = useState(false);

  return (
    <>
      <section id="pricing" className="py-32 px-6 bg-cream/80">
        <div className="mx-auto max-w-7xl">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-center mb-20"
          >
            <p className="text-latte text-sm uppercase tracking-[0.2em] mb-4">
              Pricing
            </p>
            <h2 className="text-4xl md:text-5xl font-medium text-espresso">
              Pay per analysis or subscribe
            </h2>
            <p className="text-espresso/60 mt-4 max-w-xl mx-auto">
              Buy credits one-time or get unlimited with monthly subscription
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {plans.map((plan, i) => (
              <motion.div
                key={plan.name}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.6 }}
                whileHover={{ y: -8 }}
                className={`relative p-8 rounded-3xl transition-all duration-500 ${
                  plan.popular
                    ? "bg-espresso text-cream shadow-2xl scale-105"
                    : "glass-card hover:shadow-xl"
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-warm-gold text-espresso text-xs uppercase tracking-wider rounded-full">
                    Most Popular
                  </div>
                )}

                <h3
                  className={`text-xl font-medium mb-2 ${
                    plan.popular ? "text-cream" : "text-espresso"
                  }`}
                >
                  {plan.name}
                </h3>

                <div className="flex items-baseline gap-1 mb-4">
                  <span
                    className={`text-4xl font-medium ${
                      plan.popular ? "text-cream" : "text-espresso"
                    }`}
                  >
                    {plan.price}
                  </span>
                  <span
                    className={`text-sm ${
                      plan.popular ? "text-cream/60" : "text-espresso/50"
                    }`}
                  >
                    {plan.period}
                  </span>
                </div>

                <p
                  className={`text-sm mb-8 ${
                    plan.popular ? "text-cream/60" : "text-espresso/60"
                  }`}
                >
                  {plan.description}
                </p>

                <ul className="space-y-4 mb-8">
                  {plan.features.map((feature) => (
                    <li
                      key={feature}
                      className={`flex items-center gap-3 text-sm ${
                        plan.popular ? "text-cream/80" : "text-espresso/70"
                      }`}
                    >
                      <span className="text-warm-gold">✓</span>
                      {feature}
                    </li>
                  ))}
                </ul>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setShowPayment(true)}
                  className={`w-full py-4 rounded-full text-sm font-medium transition-all cursor-pointer ${
                    plan.popular
                      ? "bg-cream text-espresso hover:bg-cream/90"
                      : "bg-espresso text-cream hover:bg-espresso/90"
                  }`}
                >
                  Subscribe {plan.price}/mo
                </motion.button>
              </motion.div>
            ))}
          </div>

          <div className="mt-16 text-center">
            <p className="text-espresso/60 mb-4">Or buy credits one-time:</p>
            <button
              onClick={() => setShowPayment(true)}
              className="btn-secondary"
            >
              Buy Credits
            </button>
          </div>
        </div>
      </section>

      <AnimatePresence>
        {showPayment && <PaymentModal onClose={() => setShowPayment(false)} />}
      </AnimatePresence>
    </>
  );
}