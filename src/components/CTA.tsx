"use client";

import { motion } from "framer-motion";

export default function CTA() {
  return (
    <section className="py-32 px-6 bg-cream">
      <div className="mx-auto max-w-4xl text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <h2 className="text-4xl md:text-6xl font-medium text-espresso mb-6">
            Ready to pour with
            <br />
            <span className="italic font-serif text-warm-gold">intention?</span>
          </h2>

          <p className="text-lg text-espresso/60 mb-10 max-w-xl mx-auto">
            Join thousands of baristas who have transformed their pour. Start your practice today.
          </p>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.98 }}
            className="px-10 py-5 bg-espresso text-cream rounded-full text-base font-medium hover:bg-espresso/90 transition-all shadow-xl"
          >
            Begin
          </motion.button>
        </motion.div>
      </div>
    </section>
  );
}