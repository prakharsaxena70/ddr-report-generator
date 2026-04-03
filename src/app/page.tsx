"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  ChevronDown, 
  ExternalLink, 
  MessageCircle, 
  ArrowRight,
  CheckCircle2,
  Zap,
  BarChart3,
  Users,
  ShieldCheck,
  Globe,
  Sparkles,
  Crown,
  Database,
  LineChart,
  FileSpreadsheet,
  BrainCircuit,
  ChevronRight,
} from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen w-full bg-[#0f1117] font-sans selection:bg-indigo-500/30 overflow-y-auto">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 bg-[#0f1117]/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="relative">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 via-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                <span className="text-white text-lg font-black">B</span>
              </div>
              <div className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 bg-gradient-to-r from-amber-400 to-orange-500 rounded-full flex items-center justify-center">
                <Sparkles className="w-2 h-2 text-white" />
              </div>
            </div>
            <span className="text-white font-black text-xl tracking-tight">DataBrix</span>
          </Link>

          <div className="hidden md:flex items-center gap-8">
            <Link href="#features" className="text-sm font-medium text-slate-400 hover:text-white transition-colors">Features</Link>
            <Link href="#how-it-works" className="text-sm font-medium text-slate-400 hover:text-white transition-colors">How It Works</Link>
            <Link href="#pricing" className="text-sm font-medium text-slate-400 hover:text-white transition-colors">Pricing</Link>
          </div>

          <div className="flex items-center gap-3">
            <Link href="/auth/login">
              <Button variant="ghost" className="text-slate-400 hover:text-white font-medium">Sign In</Button>
            </Link>
            <Link href="/auth/register">
              <Button className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-400 hover:to-indigo-500 text-white font-bold shadow-lg shadow-indigo-500/25">
                Get Started <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative min-h-screen pt-32 pb-20">
        {/* Background Effects */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-blue-500/10 rounded-full blur-[120px]" />
          <div className="absolute bottom-1/4 right-1/4 w-[700px] h-[700px] bg-indigo-500/10 rounded-full blur-[120px]" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[900px] bg-violet-500/5 rounded-full blur-[150px]" />
        </div>

        {/* Grid Pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:60px_60px]" />

        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="text-center max-w-4xl mx-auto">
            <Badge className="mb-6 bg-indigo-500/10 text-indigo-400 border-indigo-500/20 hover:bg-indigo-500/20 px-4 py-1.5 text-xs font-bold uppercase tracking-wider">
              <Sparkles className="w-3 h-3 mr-1.5" /> AI-Powered Data Intelligence
            </Badge>
            
            <h1 className="text-5xl md:text-7xl font-black text-white tracking-tight mb-6 leading-tight">
              Transform Data into
              <span className="block bg-gradient-to-r from-blue-400 via-indigo-400 to-violet-400 bg-clip-text text-transparent">
                Strategic Intelligence
              </span>
            </h1>
            
            <p className="text-lg md:text-xl text-slate-400 mb-10 max-w-2xl mx-auto leading-relaxed">
              Upload your data and let DataBrix AI uncover insights, create stunning visualizations, and generate actionable recommendations in seconds.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/auth/register">
                <Button size="lg" className="h-14 px-8 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-400 hover:to-indigo-500 text-white font-bold text-lg rounded-xl shadow-xl shadow-indigo-500/25 transition-all hover:shadow-indigo-500/40 hover:scale-105">
                  Start Free Trial <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="/app">
                <Button size="lg" variant="outline" className="h-14 px-8 bg-white/10 border-white/20 text-white hover:bg-white/20 font-bold text-lg rounded-xl backdrop-blur-sm">
                </Button>
              </Link>
            </div>

            {/* Social Proof */}
            <div className="mt-16 flex items-center justify-center gap-8 text-slate-500">
              <div className="flex items-center gap-2">
                <div className="flex -space-x-2">
                  {[1,2,3,4].map(i => (
                    <div key={i} className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 border-2 border-[#0f1117]" />
                  ))}
                </div>
                <span className="text-sm font-medium">10,000+ analysts</span>
              </div>
              <div className="h-4 w-px bg-white/10" />
              <div className="flex items-center gap-1">
                {[1,2,3,4,5].map(i => (
                  <Sparkles key={i} className="h-4 w-4 text-amber-400 fill-amber-400" />
                ))}
                <span className="text-sm font-medium ml-2">4.9/5 rating</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 relative">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-white/5 text-slate-400 border-white/10 px-4 py-1.5 text-xs font-bold uppercase tracking-wider">Features</Badge>
            <h2 className="text-3xl md:text-5xl font-black text-white mb-4">Everything you need</h2>
            <p className="text-slate-400 text-lg max-w-2xl mx-auto">Powerful AI tools to analyze, visualize, and understand your data</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: BrainCircuit, title: "AI Analysis", desc: "Advanced AI algorithms analyze your data and extract meaningful insights automatically" },
              { icon: BarChart3, title: "Smart Visualizations", desc: "Generate beautiful, interactive charts and graphs with a single click" },
              { icon: FileSpreadsheet, title: "Multi-Format Support", desc: "Import data from CSV, Excel, PDF, and even images with OCR technology" },
              { icon: Database, title: "Data Integration", desc: "Connect multiple data sources and merge them seamlessly" },
              { icon: ShieldCheck, title: "Enterprise Security", desc: "Bank-grade encryption and compliance with data protection regulations" },
              { icon: LineChart, title: "Predictive Analytics", desc: "Forecast trends and predict outcomes using machine learning models" },
            ].map((feature, idx) => (
              <div key={idx} className="group p-6 bg-white/5 border border-white/5 rounded-2xl hover:bg-white/[0.07] hover:border-indigo-500/20 transition-all">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500/20 to-indigo-600/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <feature.icon className="h-6 w-6 text-indigo-400" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">{feature.title}</h3>
                <p className="text-sm text-slate-400 leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-24 border-y border-white/5 bg-white/[0.02]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-white/5 text-slate-400 border-white/10 px-4 py-1.5 text-xs font-bold uppercase tracking-wider">How It Works</Badge>
            <h2 className="text-3xl md:text-5xl font-black text-white mb-4">Three simple steps</h2>
            <p className="text-slate-400 text-lg max-w-2xl mx-auto">From raw data to actionable insights in minutes</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { step: "01", title: "Upload Data", desc: "Import your CSV, Excel, PDF, or image files securely" },
              { step: "02", title: "AI Analysis", desc: "Our AI analyzes patterns, trends, and generates insights" },
              { step: "03", title: "Get Results", desc: "Receive visualizations, reports, and recommendations" },
            ].map((item, idx) => (
              <div key={idx} className="relative">
                <div className="text-6xl font-black text-white/5 mb-4">{item.step}</div>
                <h3 className="text-xl font-bold text-white mb-2">{item.title}</h3>
                <p className="text-slate-400">{item.desc}</p>
                {idx < 2 && (
                  <div className="hidden md:block absolute top-8 right-0 transform translate-x-1/2">
                    <ChevronRight className="h-8 w-8 text-slate-700" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-white/5 text-slate-400 border-white/10 px-4 py-1.5 text-xs font-bold uppercase tracking-wider">Pricing</Badge>
            <h2 className="text-3xl md:text-5xl font-black text-white mb-4">Simple, transparent pricing</h2>
            <p className="text-slate-400 text-lg max-w-2xl mx-auto">Choose the plan that fits your needs</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Starter */}
            <div className="p-8 bg-white/5 border border-white/10 rounded-2xl">
              <h3 className="text-xl font-bold text-white mb-2">Starter</h3>
              <div className="flex items-baseline gap-1 mb-6">
                <span className="text-4xl font-black text-white">Free</span>
              </div>
              <ul className="space-y-4 mb-8">
                {["5 analyses per day", "100MB storage", "Basic visualizations", "Community support"].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-slate-400">
                    <CheckCircle2 className="h-5 w-5 text-emerald-400" /> {item}
                  </li>
                ))}
              </ul>
              <Button variant="outline" className="w-full border-white/10 text-slate-300 hover:bg-white/5 hover:text-white">Get Started</Button>
            </div>

            {/* Pro */}
            <div className="p-8 bg-gradient-to-br from-indigo-600/20 to-violet-600/20 border border-indigo-500/20 rounded-2xl relative">
              <Badge className="absolute top-4 right-4 bg-gradient-to-r from-amber-400 to-orange-500 text-white border-0">
                <Crown className="w-3 h-3 mr-1" /> Popular
              </Badge>
              <h3 className="text-xl font-bold text-white mb-2">Pro</h3>
              <div className="flex items-baseline gap-1 mb-6">
                <span className="text-4xl font-black text-white">$20</span>
                <span className="text-slate-400">/month</span>
              </div>
              <ul className="space-y-4 mb-8">
                {["Unlimited analyses", "10GB storage", "Advanced AI models", "Priority support", "Custom exports"].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-slate-300">
                    <CheckCircle2 className="h-5 w-5 text-indigo-400" /> {item}
                  </li>
                ))}
              </ul>
              <Button className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-400 hover:to-indigo-500 text-white font-bold shadow-lg shadow-indigo-500/25">
                Upgrade to Pro
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 border-t border-white/5">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-3xl md:text-5xl font-black text-white mb-6">Ready to transform your data?</h2>
          <p className="text-slate-400 text-lg mb-8 max-w-2xl mx-auto">Join thousands of analysts who use DataBrix to make better decisions</p>
          <Link href="/auth/register">
            <Button size="lg" className="h-14 px-10 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-400 hover:to-indigo-500 text-white font-bold text-lg rounded-xl shadow-xl shadow-indigo-500/25">
              Get Started Free <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-white/5 bg-[#0a0b10]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                <span className="text-white text-sm font-black">B</span>
              </div>
              <span className="text-white font-bold">DataBrix</span>
            </div>
            <p className="text-slate-500 text-sm">© 2026 DataBrix. All rights reserved.</p>
            <div className="flex items-center gap-6">
              <Link href="#" className="text-slate-500 hover:text-white text-sm transition-colors">Privacy</Link>
              <Link href="#" className="text-slate-500 hover:text-white text-sm transition-colors">Terms</Link>
              <Link href="#" className="text-slate-500 hover:text-white text-sm transition-colors">Contact</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
