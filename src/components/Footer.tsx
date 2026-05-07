"use client";

import { motion } from "framer-motion";

const links = [
  { name: "Story", href: "#story" },
  { name: "Method", href: "#method" },
  { name: "Pricing", href: "#pricing" },
  { name: "Studios", href: "#studios" },
  { name: "Contact", href: "#contact" },
];

export default function Footer() {
  return (
    <footer className="py-12 px-6 bg-cream border-t border-espresso/10">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col md:flex-row items-center justify-between gap-8">
          <motion.a
            href="#"
            className="text-2xl font-medium tracking-tight text-espresso"
            whileHover={{ scale: 1.02 }}
          >
            Pour-Over
          </motion.a>

          <div className="flex items-center gap-8">
            {links.map((link) => (
              <a
                key={link.name}
                href={link.href}
                className="text-sm text-espresso/60 hover:text-espresso transition-colors"
              >
                {link.name}
              </a>
            ))}
          </div>

          <div className="text-sm text-espresso/40">
            © 2026 Pour-Over
          </div>
        </div>
      </div>
    </footer>
  );
}