"use client";

import { motion } from "framer-motion";

const steps = [
  {
    number: "01",
    title: "Record a pour",
    description: "Use your phone or camera. Upload a video or go live.",
  },
  {
    number: "02",
    title: "Get clear feedback",
    description: "Our AI analyzes every angle. See exactly what needs work.",
  },
  {
    number: "03",
    title: "Practice again smarter",
    description: "Targeted drills based on your data. Progress measured, not guessed.",
  },
];

export default function HowItWorks() {
  return (
    <section className="py-32 px-6 bg-espresso text-cream">
      <div className="mx-auto max-w-7xl">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center mb-20"
        >
          <p className="text-latte text-sm uppercase tracking-[0.2em] mb-4">
            How It Works
          </p>
          <h2 className="text-4xl md:text-5xl font-medium">
            Three steps to better pours
          </h2>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8">
          {steps.map((step, i) => (
            <motion.div
              key={step.number}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15, duration: 0.6 }}
              className="relative"
            >
              <div className="text-8xl font-serif text-cream/10 absolute -top-4 -left-2">
                {step.number}
              </div>
              <div className="relative pt-12">
                <h3 className="text-2xl font-medium mb-4">{step.title}</h3>
                <p className="text-cream/60 leading-relaxed">{step.description}</p>
              </div>
              {i < steps.length - 1 && (
                <div className="hidden md:block absolute top-1/2 -right-4 w-8 h-px bg-cream/20" />
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}