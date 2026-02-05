"use client";

import React, { useEffect } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useApp } from "@/hooks/use-app";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, Bot, Goal, BarChart, Wallet, PiggyBank, TrendingUp, PieChart, ShieldCheck, Target } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Logo } from "@/components/logo";
import { placeholderImages } from "@/lib/placeholder-images";

const heroImage = placeholderImages.find((p) => p.id === "hero-image");

const features = [
  {
    icon: <Bot className="h-10 w-10 text-primary" />,
    title: "AI Finance Assistant",
    description: "Chat with our AI to get instant answers about your finances. Ask 'Can I afford this?' and get personalized, real-time advice.",
  },
  {
    icon: <TrendingUp className="h-10 w-10 text-primary" />,
    title: "Real-Time Portfolio Tracker",
    description: "Track your stock investments with live price updates. Monitor gains, losses, and build long-term wealth with actionable insights.",
  },
  {
    icon: <Target className="h-10 w-10 text-primary" />,
    title: "Smart Goal Tracking",
    description: "Set savings goals with smart auto-calculation. Track progress, contribute funds, and visualize your journey to financial milestones.",
  },
  {
    icon: <PieChart className="h-10 w-10 text-primary" />,
    title: "AI Spending Forecast",
    description: "Get AI-powered predictions on your spending patterns. Receive personalized daily limits and proactive suggestions to stay on track.",
  },
];

export default function LandingPage() {
  const { user, profile } = useApp();
  const router = useRouter();
  const [incomeInput, setIncomeInput] = React.useState<string>("");
  const [demoLimit, setDemoLimit] = React.useState<number | null>(null);

  useEffect(() => {
    if (user && profile?.role) {
      router.replace("/dashboard");
    }
  }, [user, profile, router]);

  const calculateQuickLimit = () => {
    const inc = parseFloat(incomeInput);
    if (isNaN(inc)) return;
    // Simple 30% wants / 30 days = daily limit demo
    setDemoLimit((inc * 0.3) / 30);
  };

  if (user !== null && user !== undefined) {
    if (profile?.role) {
      return (
        <div className="flex h-screen items-center justify-center">
          <p>Loading...</p>
        </div>
      );
    }
  }

  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-gradient-to-br from-[#071226] via-[#072b3e] to-[#073d58]">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-white/6 bg-black/20 backdrop-blur supports-[backdrop-filter]:bg-black/20 safe-pt">
        <div className="container mx-auto flex h-16 md:h-20 items-center px-4">
          <Link href="/" className="mr-6 flex items-center space-x-3">
            <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center">
              <Image
                src="/FINMATE.png"
                alt="FinMate"
                width={28}
                height={28}
                className="object-contain"
                priority
              />
            </div>
            <span className="font-bold text-white text-lg tracking-tight">FinMate</span>
          </Link>
          <div className="flex flex-1 items-center justify-end space-x-4">
            <nav className="flex items-center space-x-3">
              <Button variant="ghost" className="text-white hover:text-white hover:bg-white/10" asChild>
                <Link href="/login">Sign In</Link>
              </Button>
              <Button className="bg-[#4ADE80] hover:bg-[#4ADE80]/90 text-black font-semibold shadow-lg shadow-[#4ADE80]/20" asChild>
                <Link href="/signup">Get Started</Link>
              </Button>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Content */}
      <main className="flex-1">
        <section className="container mx-auto px-4 py-16 md:py-24">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              className="space-y-8"
            >
              <h1 className="text-5xl md:text-7xl font-extrabold text-white leading-[1.1]">
                Your AI Money <br />
                <span className="bg-gradient-to-r from-[#4ADE80] to-[#22c55e] bg-clip-text text-transparent">
                  Superpower.
                </span>
              </h1>
              <p className="text-xl text-cyan-100/70 max-w-lg">
                Stop tracking, start growing. FinMate uses AI to turn your spending data into wealth-building insights. Built for India, designed for you.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <Button size="lg" className="bg-[#4ADE80] text-black font-bold h-14 px-8 rounded-xl shadow-xl shadow-green-500/20">
                  <Link href="/signup">Start Free Trial</Link>
                </Button>
                <Button size="lg" variant="outline" className="text-white border-white/20 h-14 px-8 rounded-xl backdrop-blur-sm">
                  <Link href="#features">Explore Features</Link>
                </Button>
              </div>

              {/* Quick Demo Widget */}
              <div className="p-1 rounded-2xl bg-gradient-to-r from-white/10 to-transparent border border-white/10 max-w-sm mt-8 group transition-all hover:border-[#4ADE80]/30">
                <div className="p-4 rounded-[14px] bg-black/40 backdrop-blur-xl">
                  <p className="text-sm font-semibold text-[#4ADE80] mb-3 uppercase tracking-widest">Live Demo</p>
                  <div className="space-y-3">
                    <p className="text-xs text-white/60">Enter your monthly income to see your daily safe spending limit:</p>
                    <div className="flex gap-2">
                      <Input
                        placeholder="e.g. 50000"
                        value={incomeInput}
                        onChange={(e) => setIncomeInput(e.target.value)}
                        className="bg-white/5 border-white/10 h-10 text-white focus:border-[#4ADE80]"
                      />
                      <Button onClick={calculateQuickLimit} className="h-10 bg-white/10 hover:bg-white/20 text-white">Calc</Button>
                    </div>
                    {demoLimit !== null && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="pt-2 border-t border-white/10"
                      >
                        <p className="text-xs text-white/50">Your Daily Safe Limit:</p>
                        <p className="text-2xl font-bold text-[#4ADE80]">₹ {demoLimit.toFixed(0)} / day</p>
                      </motion.div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.6 }}
              className="relative hidden md:block"
            >
              <div className="absolute -inset-4 bg-gradient-to-r from-[#4ADE80]/20 to-blue-500/20 blur-[100px] opacity-50" />
              <div className="glass p-1 relative rounded-[2rem] overflow-hidden shadow-2xl border-white/10">
                <div className="bg-black/60 p-8 space-y-6">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-sm text-white/40">Equity Portfolio</p>
                      <p className="text-3xl font-bold text-white mt-1">₹ 2,49,102.50</p>
                    </div>
                    <div className="bg-[#4ADE80]/20 text-[#4ADE80] px-3 py-1 rounded-full text-xs font-bold leading-none">+18.5%</div>
                  </div>
                  <div className="h-24 w-full flex items-end gap-1 px-1">
                    {[40, 60, 45, 75, 55, 90, 65, 80].map((h, i) => (
                      <motion.div
                        key={i}
                        initial={{ height: 0 }}
                        animate={{ height: `${h}%` }}
                        transition={{ delay: 0.5 + (i * 0.1) }}
                        className="flex-1 bg-gradient-to-t from-[#4ADE80] to-[#bbf7d0] rounded-t-sm"
                      />
                    ))}
                  </div>
                  <div className="space-y-3 pt-2">
                    <div className="flex justify-between items-center p-3 rounded-xl bg-white/5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center text-blue-400 font-bold">Z</div>
                        <span className="text-sm text-white/80">Zomato Food</span>
                      </div>
                      <span className="text-sm text-red-400 font-medium">- ₹320</span>
                    </div>
                    <p className="text-[10px] text-white/30 text-center uppercase tracking-[0.2em]">Live Simulation View</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* FEATURES */}
        <section id="features" className="py-24 bg-white/[0.02]">
          <div className="container mx-auto px-4">
            <div className="text-center max-w-3xl mx-auto mb-20 space-y-4">
              <h2 className="text-4xl font-extrabold text-white">Engineered for Smart Money</h2>
              <p className="text-lg text-white/50">Next-gen financial tools that think 10 steps ahead of your spending.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {features.map((feature, i) => (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="group"
                >
                  <Card className="glass h-full bg-white/5 border-white/5 p-8 transition-all hover:bg-white/[0.08] hover:border-[#4ADE80]/40">
                    <div className="mb-6 p-3 w-fit rounded-2xl bg-white/5 transition-colors group-hover:bg-[#4ADE80]/10">
                      {React.cloneElement(feature.icon as React.ReactElement, { className: "h-8 w-8 text-[#4ADE80]" })}
                    </div>
                    <CardTitle className="text-white text-xl mb-3 tracking-wide">{feature.title}</CardTitle>
                    <CardContent className="p-0">
                      <p className="text-white/60 leading-relaxed text-sm">{feature.description}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* TEAM SECTION (Redone with Creative Placeholders) */}
        <section className="py-24">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-4xl font-extrabold text-white mb-4">The Minds Behind FinMate</h2>
            <p className="text-white/50 mb-16">Focused on building the future of Indian wealth tech.</p>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {[
                { name: "GANESH KUMAR T", role: "FULLSTACK DEVELOPER" },
                { name: "VINOTHINI T", role: "FRONTEND DEVELOPER" },
                { name: "PAUL SHERVIN P", role: "UI/UX DEVELOPER" },
                { name: "AMAN SINGH", role: "BACKEND DEVELOPER" },
              ].map((member, i) => (
                <div key={i} className="group flex flex-col items-center">
                  <div className="relative w-60 h-60 mb-8 transition-transform group-hover:scale-105">
                    <div className="absolute inset-0 bg-gradient-to-tr from-[#4ADE80] to-cyan-400 rounded-[3rem] rotate-6 group-hover:rotate-12 transition-transform duration-300 opacity-20" />
                    <div className="absolute inset-0 bg-white/5 backdrop-blur-md rounded-[3rem] border border-white/10 flex items-center justify-center p-8 shadow-2xl">
                      <div className="w-full h-full rounded-[2rem] bg-[#0c1a2b] overflow-hidden relative border border-white/5">
                        <Image
                          src={`/team${i + 1}.jpg`}
                          alt={member.name}
                          fill
                          className="object-contain p-2 transition-transform duration-500 group-hover:scale-110"
                        />
                      </div>
                    </div>
                  </div>
                  <h3 className="text-white font-extrabold text-xl mb-1 tracking-tight">{member.name}</h3>
                  <p className="text-[#4ADE80] text-[11px] uppercase tracking-[0.3em] font-black opacity-80 underline underline-offset-8 decoration-[#4ADE80]/30 mr-1">
                    {member.role}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>


      {/* Footer */}
      <footer className="border-t border-white/6 bg-black/10">
        <div className="container mx-auto flex flex-col items-center justify-between gap-4 py-10 px-4 md:h-24 md:flex-row md:py-0">
          <div className="flex flex-col items-center gap-4 md:flex-row md:gap-2">
            <Logo className="text-[#4ADE80]" />
            <p className="text-center text-sm leading-loose text-cyan-100 md:text-left">
              © {new Date().getFullYear()} FinMate. All rights reserved.
            </p>
          </div>
          <p className="text-center text-sm text-cyan-100/70">Built for a better financial you.</p>
        </div>
      </footer>
    </div>
  );
}
