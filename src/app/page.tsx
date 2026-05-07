import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import Features from "@/components/Features";
import HowItWorks from "@/components/HowItWorks";
import DashboardPreview from "@/components/DashboardPreview";
import Pricing from "@/components/Pricing";
import CTA from "@/components/CTA";
import Footer from "@/components/Footer";
import LiquidBackground from "@/components/LiquidBackground";

export default function Home() {
  return (
    <main className="min-h-screen bg-off-white">
      <LiquidBackground />
      <Navbar />
      <Hero />
      <Features />
      <HowItWorks />
      <DashboardPreview />
      <Pricing />
      <CTA />
      <Footer />
    </main>
  );
}