"use client";

import { motion } from "framer-motion";

const testimonials = [
  {
    quote: "We cut training time in half. New baristas are pulling consistent hearts within weeks, not months.",
    author: "Marcus Chen",
    role: "Head Roaster, Onyx Coffee Lab",
  },
  {
    quote: "My pours finally became consistent. After years of guessing, I finally understand what I'm doing wrong.",
    author: "Sarah Mitchell",
    role: "Freelance Barista",
  },
  {
    quote: "It feels like having a senior barista beside you. The feedback is specific, actionable, and actually makes sense.",
    author: "James Wright",
    role: "Owner, Daily Grind",
  },
];

export default function Testimonials() {
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
            Testimonials
          </p>
          <h2 className="text-4xl md:text-5xl font-medium">
            From the community
          </h2>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, i) => (
            <motion.div
              key={testimonial.author}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15, duration: 0.6 }}
              className="p-8 rounded-3xl bg-cream/5 border border-cream/10"
            >
              <div className="text-4xl text-warm-gold mb-6">&#8220;</div>
              <p className="text-cream/80 text-lg leading-relaxed mb-8">
                {testimonial.quote}
              </p>
              <div>
                <div className="font-medium text-cream">{testimonial.author}</div>
                <div className="text-sm text-cream/50">{testimonial.role}</div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}