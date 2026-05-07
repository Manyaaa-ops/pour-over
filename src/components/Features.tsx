"use client";

import { motion } from "framer-motion";

const features = [
  {
    title: "Better Rhythm",
    description: "Master the timing and flow control that creates perfect latte art patterns.",
    number: "01",
  },
  {
    title: "Cleaner Shapes",
    description: "Sharper hearts, smoother rosettas. Every movement refined to precision.",
    number: "02",
  },
  {
    title: "Real Feedback",
    description: "Know exactly what changed. Clear insights after every session.",
    number: "03",
  },
  {
    title: "Built For Teams",
    description: "Train staff consistently. Quality across your entire coffee shop.",
    number: "04",
  },
];

export default function Features() {
  return (
    <section id="method" className="py-24 px-6 bg-ivory">
      <div className="mx-auto max-w-7xl">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <p className="text-latte text-sm uppercase tracking-[0.25em] mb-4">
            The Method
          </p>
          <h2 className="text-4xl md:text-5xl font-display text-espresso">
            Technique becomes art
          </h2>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.5 }}
              className="group p-8 rounded-2xl bg-cream hover:shadow-lg transition-all duration-300"
            >
              <div className="text-xs text-warm-gold mb-4 font-mono">
                {feature.number}
              </div>
              <h3 className="text-xl font-medium text-espresso mb-3">
                {feature.title}
              </h3>
              <p className="text-espresso/60 text-sm leading-relaxed">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}