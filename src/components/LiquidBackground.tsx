"use client";

import { useEffect, useRef } from "react";

export default function LiquidBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationId: number;
    let time = 0;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const draw = () => {
      time += 0.005;
      
      const gradient = ctx.createRadialGradient(
        canvas.width / 2 + Math.sin(time) * 100,
        canvas.height / 2 + Math.cos(time * 0.7) * 50,
        0,
        canvas.width / 2,
        canvas.height / 2,
        canvas.width * 0.8
      );
      
      gradient.addColorStop(0, "#FFF9F0");
      gradient.addColorStop(0.5, "#FAF7F2");
      gradient.addColorStop(1, "#F5EFE6");
      
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Subtle cream swirls
      for (let i = 0; i < 3; i++) {
        const x = canvas.width * (0.3 + i * 0.2) + Math.sin(time + i) * 50;
        const y = canvas.height * (0.4 + i * 0.15) + Math.cos(time * 0.8 + i) * 30;
        const radius = 150 + Math.sin(time + i) * 20;
        
        const swirl = ctx.createRadialGradient(x, y, 0, x, y, radius);
        swirl.addColorStop(0, "rgba(196, 167, 125, 0.08)");
        swirl.addColorStop(1, "transparent");
        
        ctx.fillStyle = swirl;
        ctx.beginPath();
        ctx.ellipse(x, y, radius, radius * 0.6, 0, 0, Math.PI * 2);
        ctx.fill();
      }

      animationId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 -z-10"
    />
  );
}