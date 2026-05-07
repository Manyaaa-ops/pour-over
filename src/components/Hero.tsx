"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import Link from "next/link";

export default function Hero() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"],
  });

  const y = useTransform(scrollYProgress, [0, 1], [0, 100]);
  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);

  return (
    <section
      ref={containerRef}
      className="relative min-h-screen flex items-center justify-center px-6 pt-24 overflow-hidden"
    >
      <div className="absolute inset-0 bg-gradient-to-b from-ivory via-cream to-ivory" />
      
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-20 left-10 w-72 h-72 bg-warm-gold/10 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-latet/10 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 mx-auto max-w-5xl text-center">
        <motion.div style={{ y, opacity }}>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-latte text-sm uppercase tracking-[0.3em] mb-6"
          >
            The Art of Pouring
          </motion.p>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.8 }}
            className="text-6xl md:text-8xl lg:text-9xl font-display text-espresso leading-[0.9]"
          >
            Pour
            <br />
            <span className="italic text-warm-gold">Better</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="mt-8 text-lg md:text-xl text-espresso/60 max-w-xl mx-auto"
          >
            Train your pour with real feedback, better rhythm, and cleaner patterns using AI-powered analysis.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="mt-12 flex flex-col sm:flex-row gap-5 justify-center"
          >
            <Link href="/upload" className="btn-primary">
              Start Practice
            </Link>
            <a href="#method" className="btn-secondary">
              See How It Works
            </a>
          </motion.div>
        </motion.div>
      </div>

      <motion.div
        animate={{ y: [0, 15, 0] }}
        transition={{ repeat: Infinity, duration: 3 }}
        className="absolute bottom-12 left-1/2 -translate-x-1/2"
      >
        <div className="w-8 h-14 border-2 border-espresso/20 rounded-full flex justify-center pt-3">
          <div className="w-1.5 h-4 bg-espresso/30 rounded-full animate-pulse" />
        </div>
      </motion.div>
    </section>
  );
}