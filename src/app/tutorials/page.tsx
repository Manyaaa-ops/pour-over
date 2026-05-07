"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Navbar from "@/components/Navbar";

const tutorials = [
  {
    id: "heart",
    name: "Heart",
    emoji: "❤️",
    difficulty: "Beginner",
    videoUrl: "https://youtube.com/shorts/AhFB344F54M?si=TivihnEYGTeC75Zm", // Latte art heart tutorial
    steps: [
      "Pour milk from 3-4 inches above the cup",
      "Let the foam rise and create a base circle",
      "Lower the pitcher close to the surface",
      "Push through the center to create the point",
      "Stop immediately when heart shape forms"
    ],
    commonMistakes: [
      "Pouring too fast - go slow and steady",
      "Not lowering pitcher - get close to surface",
      "Stopping too late - stop when shape forms"
    ]
  },
  {
    id: "rosetta",
    name: "Rosetta",
    emoji: "🌿",
    difficulty: "Intermediate",
    videoUrl: "https://youtube.com/shorts/amEmMPG7Uno?si=p9Pe1nguD9LnlZeR", // Rosetta tutorial
    steps: [
      "Start pouring at the back of the cup",
      "Move pitcher side to side quickly",
      "Work from back to front",
      "Lift to create leaf layers",
      "Drag down to finish the stem"
    ],
    commonMistakes: [
      "Too slow - quick light movements",
      "Wrong height - try 3-4 inches",
      "Not enough layers - more side-to-side"
    ]
  },
  {
    id: "tulip",
    name: "Tulip",
    emoji: "🌷",
    difficulty: "Intermediate",
    videoUrl: "https://youtube.com/shorts/Ip8sZmciJxM?si=icPslIG_xvvC65Z5", // Tulip tutorial
    steps: [
      "Pour first heart in center",
      "Lift pitcher BEFORE foam sinks",
      "Pour second heart on top",
      "Repeat quickly 3-4 times",
      "Let shapes stack into tulip"
    ],
    commonMistakes: [
      "Too slow between pours - be quick!",
      "Not enough height - lift higher",
      "Foam sinks - practice timing"
    ]
  },
  {
    id: "swan",
    name: "Swan",
    emoji: "🦢",
    difficulty: "Advanced",
    videoUrl: "https://youtube.com/shorts/zpjzyAPLfkI?si=fZNC2FVEy9rlFDnd", // Swan tutorial
    steps: [
      "Create wide base (body)",
      "Use etching tool for neck",
      "Draw head at front",
      "Add details with tool",
      "Finish with thin lines"
    ],
    commonMistakes: [
      "Base too small - make it wider",
      "Etching too deep - gentle touch",
      "Wrong timing - practice free pour first"
    ]
  }
];

export default function TutorialsPage() {
  const [selected, setSelected] = useState(tutorials[0]);

  const getEmbedUrl = (url: string) => {
    if (!url) return null;
    // Convert YouTube URL to embed URL
    const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&]+)/);
    if (match) {
      return `https://www.youtube.com/embed/${match[1]}`;
    }
    return url;
  };

  const embedUrl = selected.videoUrl ? getEmbedUrl(selected.videoUrl) : null;

  return (
    <main className="min-h-screen bg-cream">
      <Navbar />

      <section className="pt-32 pb-20 px-6">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <h1 className="text-4xl md:text-5xl font-display text-espresso mb-4">
              📚 Latte Art Tutorials
            </h1>
            <p className="text-espresso/60 text-lg">
              Watch and learn each design step by step
            </p>
          </motion.div>

          <div className="flex gap-2 overflow-x-auto pb-4 mb-8">
            {tutorials.map((t) => (
              <button
                key={t.id}
                onClick={() => setSelected(t)}
                className={`flex-shrink-0 px-4 py-2 rounded-full transition-all ${selected.id === t.id
                  ? "bg-espresso text-cream"
                  : "bg-espresso/10 text-espresso"
                  }`}
              >
                <span className="mr-2">{t.emoji}</span>
                {t.name}
              </button>
            ))}
          </div>

          <div className="glass-card rounded-3xl p-8">
            {embedUrl && (
              <div className="mb-8">
                <div className="aspect-video rounded-xl overflow-hidden bg-black">
                  <iframe
                    src={embedUrl}
                    title={selected.name}
                    className="w-full h-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              </div>
            )}

            {!embedUrl && (
              <div className="mb-8 p-8 bg-espresso/5 rounded-xl text-center">
                <div className="text-4xl mb-4">🎥</div>
                <p className="text-espresso/60 mb-2">Video coming soon!</p>
                <p className="text-sm text-espresso/40">
                  Add video URL to tutorials to enable
                </p>
              </div>
            )}

            <div className="flex items-center gap-4 mb-6">
              <span className="text-6xl">{selected.emoji}</span>
              <div>
                <h2 className="text-2xl font-display text-espresso">
                  {selected.name}
                </h2>
                <span className={`text-sm px-2 py-1 rounded-full ${selected.difficulty === "Beginner" ? "bg-green-100 text-green-700" :
                  selected.difficulty === "Intermediate" ? "bg-amber-100 text-amber-700" :
                    "bg-red-100 text-red-700"
                  }`}>
                  {selected.difficulty}
                </span>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h3 className="font-medium text-espresso mb-4">Step by Step:</h3>
                <ol className="space-y-4">
                  {selected.steps.map((step, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <span className="w-6 h-6 bg-warm-gold/20 rounded-full flex items-center justify-center text-sm font-medium text-warm-gold flex-shrink-0">
                        {i + 1}
                      </span>
                      <span className="text-espresso/80 text-sm">{step}</span>
                    </li>
                  ))}
                </ol>
              </div>

              <div>
                <h3 className="font-medium text-espresso mb-4">Common Mistakes:</h3>
                <ul className="space-y-3">
                  {selected.commonMistakes.map((mistake, i) => (
                    <li key={i} className="flex items-start gap-3 text-red-500">
                      <span>⚠️</span>
                      <span className="text-espresso/80 text-sm">{mistake}</span>
                    </li>
                  ))}
                </ul>

                <div className="mt-6 p-4 bg-warm-gold/10 rounded-xl">
                  <h4 className="font-medium text-espresso mb-2">💡 Practice Tips</h4>
                  <ul className="text-sm text-espresso/70 space-y-1">
                    <li>• Practice each design 10+ times</li>
                    <li>• Film yourself to see mistakes</li>
                    <li>• Focus on one design until mastered</li>
                    <li>• Then move to harder designs</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}