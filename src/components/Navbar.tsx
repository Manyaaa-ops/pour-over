"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import LoginModal from "./LoginModal";

const navLinks = [
  { name: "Upload", href: "/upload" },
  { name: "History", href: "/history" },
  { name: "Drills", href: "/drills" },
  { name: "Tutorials", href: "/tutorials" },
  { name: "Teams", href: "/teams" },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const stored = localStorage.getItem("pourover_user");
    if (stored) setUser(JSON.parse(stored));
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <motion.nav
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      className={`fixed top-0 left-0 right-0 z-50 px-6 py-5 transition-all duration-500 ${
        scrolled
          ? "bg-cream/95 backdrop-blur-xl shadow-sm"
          : "bg-transparent"
      }`}
    >
      <div className="mx-auto max-w-7xl flex items-center justify-between">
        <Link
          href="/"
          className="text-2xl font-medium tracking-tight text-espresso hover:opacity-80 transition-opacity"
        >
          Pour-Over
        </Link>

        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <Link
              key={link.name}
              href={link.href}
              className="text-sm text-espresso/70 hover:text-espresso transition-colors"
            >
              {link.name}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-4">
          {user ? (
            <Link href="/upload" className="btn-primary text-sm">
              Analyze Pour
            </Link>
          ) : (
            <button onClick={() => setShowLogin(true)} className="btn-primary text-sm">
              Login / Sign Up
            </button>
          )}
        </div>

        <LoginModal isOpen={showLogin} onClose={() => setShowLogin(false)} />
      </div>
    </motion.nav>
  );
}