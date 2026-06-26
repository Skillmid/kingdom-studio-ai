import Features from "@/components/home/Features";
import Hero from "@/components/home/Hero";
import Vision from "@/components/home/Vision";
import Footer from "@/components/layout/Footer";
import Navbar from "@/components/layout/Navbar";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      <Navbar />
      <Hero />
      <Features />
      <Vision />
      <Footer />
    </main>
  );
}