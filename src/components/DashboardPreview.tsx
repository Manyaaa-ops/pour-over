"use client";

import { motion } from "framer-motion";

const metrics = [
  { label: "Pour Quality", value: "92%", change: "+8%" },
  { label: "Flow Control", value: "87%", change: "+5%" },
  { label: "Symmetry", value: "94%", change: "+12%" },
  { label: "Texture", value: "89%", change: "+3%" },
  { label: "Progress", value: "78%", change: "+15%" },
];

export default function DashboardPreview() {
  return (
    <section className="py-32 px-6 bg-cream">
      <div className="mx-auto max-w-7xl">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <p className="text-latte text-sm uppercase tracking-[0.2em] mb-4">
            Dashboard
          </p>
          <h2 className="text-4xl md:text-5xl font-medium text-espresso">
            Know exactly where you stand
          </h2>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2, duration: 0.8 }}
          className="max-w-4xl mx-auto"
        >
          <div className="p-8 md:p-12 rounded-3xl bg-white shadow-2xl">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
              {metrics.map((metric, i) => (
                <motion.div
                  key={metric.label}
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.3 + i * 0.1 }}
                  className="text-center"
                >
                  <div className="text-3xl md:text-4xl font-medium text-espresso mb-2">
                    {metric.value}
                  </div>
                  <div className="text-xs text-espresso/50 uppercase tracking-wider mb-2">
                    {metric.label}
                  </div>
                  <div className="inline-block px-2 py-1 rounded-full bg-latte/30 text-xs text-espresso">
                    {metric.change}
                  </div>
                </motion.div>
              ))}
            </div>

            <div className="mt-12 pt-8 border-t border-espresso/10">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm text-espresso/60">Weekly Progress</span>
                <span className="text-sm text-espresso font-medium">+23%</span>
              </div>
              <div className="h-3 bg-latte/30 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  whileInView={{ width: "78%" }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.6, duration: 1 }}
                  className="h-full bg-gradient-to-r from-espresso to-warm-gold rounded-full"
                />
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}