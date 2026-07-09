import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowRight,
  ShieldCheck,
  Zap,
  Globe,
  Calendar,
  Languages,
  WifiOff,
  CreditCard,
  FileCheck,
  CheckCircle2,
  ChevronDown,
  Menu,
  X,
  Package,
  ShoppingCart,
  BarChart3,
  Users,
  Lock,
  Settings,
  AlertTriangle,
  TrendingUp,
  Bell,
  FileText,
  RotateCcw,
  Printer,
  Eye,
  UserPlus,
  DollarSign,
  Clock,
  Database,
  Layers,
  Truck,
  Search,
} from "lucide-react";

const LandingPage = () => {
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState(null);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);
  const toggleFaq = (index) => setOpenFaq(openFaq === index ? null : index);

  const scrollTo = (id) => {
    setMobileMenuOpen(false);
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-white font-sans text-slate-800 antialiased">
      {/* ═══════════════════════════════════════════ */}
      {/* NAVIGATION                                  */}
      {/* ═══════════════════════════════════════════ */}
      <nav
        className={`fixed top-0 w-full z-50 transition-all duration-300 ${
          scrolled
            ? "bg-white/95 backdrop-blur-md shadow-sm border-b border-slate-100"
            : "bg-transparent"
        }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div
              className="flex items-center gap-2.5 cursor-pointer"
              onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>
              <div className="w-9 h-9 bg-gradient-to-br from-teal-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-md">
                <ShieldCheck className="text-white w-5 h-5" />
              </div>
              <span className="text-xl font-extrabold text-slate-900 tracking-tight">
                PharmaCare
              </span>
            </div>

            <div className="hidden md:flex items-center gap-8">
              <button
                onClick={() => scrollTo("features")}
                className="text-sm font-medium text-slate-600 hover:text-teal-600 transition">
                Features
              </button>
              <button
                onClick={() => scrollTo("how-it-works")}
                className="text-sm font-medium text-slate-600 hover:text-teal-600 transition">
                How It Works
              </button>
              <button
                onClick={() => scrollTo("pricing")}
                className="text-sm font-medium text-slate-600 hover:text-teal-600 transition">
                Pricing
              </button>
              <button
                onClick={() => scrollTo("faq")}
                className="text-sm font-medium text-slate-600 hover:text-teal-600 transition">
                FAQ
              </button>
            </div>

            <div className="hidden md:flex items-center gap-3">
              <button
                onClick={() => navigate("/login")}
                className="text-slate-700 font-medium hover:text-teal-600 px-4 py-2 transition">
                Log In
              </button>
              <button
                onClick={() => navigate("/signup")}
                className="bg-teal-600 hover:bg-teal-700 text-white px-5 py-2.5 rounded-full text-sm font-semibold transition shadow-lg shadow-teal-600/25 active:scale-95">
                Start Free Trial
              </button>
            </div>

            <button
              className="md:hidden p-2 text-slate-600"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
              {mobileMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-t border-slate-100 shadow-xl px-4 py-5 space-y-3">
            <button
              onClick={() => scrollTo("features")}
              className="block w-full text-left text-slate-700 font-medium py-2">
              Features
            </button>
            <button
              onClick={() => scrollTo("how-it-works")}
              className="block w-full text-left text-slate-700 font-medium py-2">
              How It Works
            </button>
            <button
              onClick={() => scrollTo("pricing")}
              className="block w-full text-left text-slate-700 font-medium py-2">
              Pricing
            </button>
            <button
              onClick={() => scrollTo("faq")}
              className="block w-full text-left text-slate-700 font-medium py-2">
              FAQ
            </button>
            <hr className="border-slate-100" />
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                navigate("/login");
              }}
              className="block w-full text-left text-slate-700 font-medium py-2">
              Log In
            </button>
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                navigate("/signup");
              }}
              className="w-full bg-teal-600 text-white py-3 rounded-xl font-semibold active:scale-95 transition">
              Start Free Trial
            </button>
          </div>
        )}
      </nav>

      {/* ═══════════════════════════════════════════ */}
      {/* EFDA URGENCY BANNER                         */}
      {/* ═══════════════════════════════════════════ */}
      <div className="pt-16 bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 text-white py-2.5 text-center text-sm font-semibold tracking-wide">
        ⚠️ EFDA Traceability Mandate Deadline: June 3, 2026 — Get compliant in
        under 5 minutes
      </div>

      {/* ═══════════════════════════════════════════ */}
      {/* HERO SECTION                                */}
      {/* ═══════════════════════════════════════════ */}
      <section className="relative overflow-hidden bg-gradient-to-b from-slate-50 via-white to-white pt-16 pb-24 lg:pt-24 lg:pb-32">
        {/* Decorative Elements */}
        <div className="absolute top-20 left-10 w-72 h-72 bg-teal-100 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse"></div>{" "}
        <div
          className="absolute bottom-10 right-10 w-96 h-96 bg-emerald-100 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"
          style={{ animationDelay: "2s" }}></div>
        <div
          className="absolute top-40 right-1/4 w-48 h-48 bg-cyan-100 rounded-full mix-blend-multiply filter blur-3xl opacity-25 animate-pulse"
          style={{ animationDelay: "4s" }}></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-teal-50 text-teal-700 text-xs font-bold tracking-widest uppercase mb-8 border border-teal-200/60">
            <span className="w-2 h-2 bg-teal-500 rounded-full animate-pulse"></span>
            Built for Ethiopia &bull; 100% ETB &bull; Offline-First
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black text-slate-900 tracking-tight mb-6 leading-[1.08]">
            Your Pharmacy Deserves
            <br />
            <span className="bg-gradient-to-r from-teal-600 via-emerald-600 to-teal-500 bg-clip-text text-transparent">
              Better Than Excel
            </span>
          </h1>

          <p className="text-lg sm:text-xl text-slate-500 max-w-2xl mx-auto mb-10 leading-relaxed font-medium">
            The complete pharmacy operating system that eliminates expired
            stock, automates Telebirr payments, and keeps you EFDA-compliant —
            even when the internet goes down.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
            <button
              onClick={() => navigate("/signup")}
              className="group bg-teal-600 hover:bg-teal-700 text-white px-8 py-4 rounded-full text-lg font-bold transition-all shadow-xl shadow-teal-600/30 hover:shadow-teal-600/40 flex items-center justify-center gap-2 active:scale-95">
              Start 14-Day Free Trial
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
            <button
              onClick={() => navigate("/login")}
              className="bg-white hover:bg-slate-50 text-slate-800 px-8 py-4 rounded-full text-lg font-semibold border-2 border-slate-200 hover:border-slate-300 transition-all flex items-center justify-center gap-2 active:scale-95">
              Log In to Dashboard
            </button>
          </div>

          <p className="text-sm text-slate-400 font-medium">
            No credit card required &bull; Setup in 5 minutes &bull; Cancel
            anytime
          </p>

          {/* Trust Logos Strip */}
          <div className="mt-16 pt-8 border-t border-slate-100">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-6">
              Trusted by pharmacies across Ethiopia
            </p>
            <div className="flex flex-wrap justify-center items-center gap-x-12 gap-y-4 text-slate-300 font-bold text-lg">
              <span className="hover:text-slate-500 transition cursor-default">
                Addis Ababa
              </span>
              <span className="text-slate-200">•</span>
              <span className="hover:text-slate-500 transition cursor-default">
                Hawassa
              </span>{" "}
              <span className="text-slate-200">•</span>
              <span className="hover:text-slate-500 transition cursor-default">
                Bahir Dar
              </span>
              <span className="text-slate-200">•</span>
              <span className="hover:text-slate-500 transition cursor-default">
                Adama
              </span>
              <span className="text-slate-200">•</span>
              <span className="hover:text-slate-500 transition cursor-default">
                Dire Dawa
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════ */}
      {/* STATS BAR                                   */}
      {/* ═══════════════════════════════════════════ */}
      <section className="py-12 bg-white border-y border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              {
                value: "20%+",
                label: "Less Expired Stock",
                icon: TrendingUp,
                color: "text-emerald-600 bg-emerald-50",
              },
              {
                value: "99.9%",
                label: "System Uptime",
                icon: Zap,
                color: "text-amber-600 bg-amber-50",
              },
              {
                value: "< 5min",
                label: "Setup Time",
                icon: Clock,
                color: "text-blue-600 bg-blue-50",
              },
              {
                value: "2026",
                label: "EFDA Ready",
                icon: FileCheck,
                color: "text-teal-600 bg-teal-50",
              },
            ].map((stat, i) => (
              <div key={i} className="p-4 group">
                <div
                  className={`w-12 h-12 ${stat.color} rounded-xl flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform`}>
                  <stat.icon className="w-6 h-6" />
                </div>
                <div className="text-3xl font-black text-slate-900 mb-1">
                  {stat.value}
                </div>
                <div className="text-sm text-slate-500 font-medium">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════ */}
      {/* PROBLEM → SOLUTION CARDS                    */}
      {/* ═══════════════════════════════════════════ */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <p className="text-sm font-bold text-teal-600 uppercase tracking-widest mb-3">
              The Problem We Solve
            </p>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 mb-4">
              Paper Ledgers Are Costing You Millions
            </h2>
            <p className="text-lg text-slate-500 max-w-2xl mx-auto">
              40% of Ethiopian pharmacies report significant financial losses
              from expired or missing stock. It's not your fault — it's your
              tools.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                stat: "20%+",
                statLabel: "of inventory expires unsold",
                title: "Smart FEFO Expiry Engine",
                desc: "Automatically prioritizes the sale of medicines expiring soonest. Get alerts at 90, 60, and 30 days. Never throw away profit again.",
                icon: AlertTriangle,
                iconBg: "bg-red-50 text-red-500",
              },
              {
                stat: "60%",
                statLabel: "stock fluctuation from bad data",
                title: "Real-Time Inventory Sync",
                desc: "Every scan, sale, return, and disposal is logged instantly with full audit trails. Know exactly what you have, down to the batch number.",
                icon: Database,
                iconBg: "bg-blue-50 text-blue-500",
              },
              {
                stat: "June '26",
                statLabel: "EFDA traceability deadline",
                title: "One-Click Compliance",
                desc: "Pre-built audit logs, TIN breakdowns, VAT/TOT receipts, and batch traceability reports. Be inspection-ready in seconds, not days.",
                icon: FileCheck,
                iconBg: "bg-emerald-50 text-emerald-500",
              },
            ].map((item, i) => (
              <div
                key={i}
                className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 hover:shadow-xl hover:border-teal-200 transition-all duration-300 group">
                <div className="mb-6">
                  <span className="text-4xl font-black text-slate-900">
                    {item.stat}
                  </span>
                  <p className="text-sm text-slate-400 font-medium mt-1">
                    {item.statLabel}
                  </p>
                </div>
                <div
                  className={`w-12 h-12 ${item.iconBg} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                  <item.icon className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">
                  {item.title}
                </h3>
                <p className="text-slate-500 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════ */}
      {/* FEATURE CATEGORIES OVERVIEW                 */}
      {/* ═══════════════════════════════════════════ */}
      <section id="features" className="py-20 bg-white">
        {" "}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <p className="text-sm font-bold text-teal-600 uppercase tracking-widest mb-3">
              Complete Pharmacy OS
            </p>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 mb-4">
              Everything You Need. Nothing You Don't.
            </h2>
            <p className="text-lg text-slate-500 max-w-2xl mx-auto">
              Six powerful modules working together to run your pharmacy like a
              precision machine.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: Package,
                color: "from-teal-500 to-emerald-600",
                title: "Inventory & Medicine Management",
                features: [
                  "Batch-level FEFO tracking",
                  "Real-time stock status (In Stock, Low, Out)",
                  "Medicine-supplier linking",
                  "Complete audit trails with user attribution",
                ],
              },
              {
                icon: ShoppingCart,
                color: "from-blue-500 to-cyan-600",
                title: "Point of Sale & Checkout",
                features: [
                  "Telebirr, CBE Birr, Cash & Bank Transfer",
                  "Automated refunds with stock restoration",
                  "Professional printable receipts",
                  "Lightning-fast checkout flow",
                ],
              },
              {
                icon: ShieldCheck,
                color: "from-emerald-500 to-green-600",
                title: "Compliance & Expiration",
                features: [
                  "Dedicated expiration dashboard",
                  "Formal disposal workflow",
                  "Automated push notifications",
                  "EFDA audit-ready reports",
                ],
              },
              {
                icon: BarChart3,
                color: "from-violet-500 to-purple-600",
                title: "Analytics & Intelligence",
                features: [
                  "Real profit = Revenue − Batch Cost",
                  "Top-selling medicine reports",
                  "Payment method breakdown",
                  "One-click PDF export",
                ],
              },
              {
                icon: Users,
                color: "from-orange-500 to-amber-600",
                title: "Team Management & Security",
                features: [
                  "Role-based access control (RBAC)",
                  "Secure staff onboarding & offboarding",
                  "Auto-generated passwords",
                  "Masked emails for data privacy",
                ],
              },
              {
                icon: Globe,
                color: "from-pink-500 to-rose-600",
                title: "Localization & Configuration",
                features: [
                  "English & Amharic (አማርኛ) toggle",
                  "Ethiopian Calendar support",
                  "Multi-currency (ETB, USD, EUR)",
                  "Customizable alert thresholds",
                ],
              },
            ].map((category, i) => (
              <div
                key={i}
                className="group p-6 rounded-2xl border border-slate-100 hover:border-slate-200 hover:shadow-lg transition-all duration-300 bg-white">
                <div
                  className={`w-14 h-14 bg-gradient-to-br ${category.color} rounded-2xl flex items-center justify-center mb-5 shadow-lg group-hover:scale-110 transition-transform`}>
                  <category.icon className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-4">
                  {category.title}
                </h3>
                <ul className="space-y-3">
                  {category.features.map((feat, j) => (
                    <li
                      key={j}
                      className="flex items-start gap-3 text-sm text-slate-600">
                      <CheckCircle2 className="w-4 h-4 text-teal-500 mt-0.5 flex-shrink-0" />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>{" "}
      </section>

      {/* ═══════════════════════════════════════════ */}
      {/* DEEP DIVE: INVENTORY                        */}
      {/* ═══════════════════════════════════════════ */}
      <section id="how-it-works" className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-teal-50 text-teal-700 text-xs font-bold uppercase tracking-widest mb-6 border border-teal-100">
                <Package className="w-3.5 h-3.5" /> Inventory Engine
              </div>
              <h2 className="text-3xl sm:text-4xl font-black text-slate-900 mb-6 leading-tight">
                Know Every Pill.
                <br />
                Down to the Batch.
              </h2>
              <p className="text-lg text-slate-500 mb-8 leading-relaxed">
                Stop guessing what's on your shelves. PharmaCare tracks every
                medicine from arrival to sale with surgical precision.
              </p>
              <div className="space-y-5">
                {[
                  {
                    icon: Layers,
                    title: "Batch-Level FEFO Allocation",
                    desc: "Automatically sells the soonest-expiring batch first. No more expired stock sitting on shelves while newer inventory gets sold.",
                  },
                  {
                    icon: Eye,
                    title: "Real-Time Stock Indicators",
                    desc: "Instant visual status for every SKU — In Stock, Low, or Out. Eliminate missed sales from surprise stockouts.",
                  },
                  {
                    icon: Truck,
                    title: "Medicine-Supplier Linking",
                    desc: "Know exactly which vendor supplies each product. Reordering becomes a one-click process.",
                  },
                  {
                    icon: Search,
                    title: "Full Audit Trail",
                    desc: "Every stock movement logged with user attribution. Sales, refunds, disposals, arrivals — total accountability.",
                  },
                ].map((item, i) => (
                  <div key={i} className="flex gap-4">
                    <div className="w-10 h-10 bg-teal-100 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5">
                      <item.icon className="w-5 h-5 text-teal-600" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 mb-1">
                        {item.title}
                      </h4>
                      <p className="text-sm text-slate-500 leading-relaxed">
                        {item.desc}
                      </p>{" "}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Visual Feature Representation */}
            <div className="space-y-4">
              {[
                {
                  status: "In Stock",
                  color: "bg-emerald-500",
                  items: "Paracetamol 500mg — Batch #A2024-01",
                  count: "1,240 units",
                  expiry: "Exp: 2027-03",
                },
                {
                  status: "Low Stock",
                  color: "bg-amber-500",
                  items: "Amoxicillin 250mg — Batch #B2024-15",
                  count: "23 units",
                  expiry: "Exp: 2026-08",
                },
                {
                  status: "Expiring Soon",
                  color: "bg-red-500",
                  items: "Ibuprofen 400mg — Batch #C2023-42",
                  count: "180 units",
                  expiry: "Exp: 2026-07 ⚠️",
                },
                {
                  status: "Out of Stock",
                  color: "bg-slate-400",
                  items: "Metformin 850mg — Batch #D2024-08",
                  count: "0 units",
                  expiry: "Reorder from KAL Pharma",
                },
              ].map((row, i) => (
                <div
                  key={i}
                  className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span
                        className={`w-2.5 h-2.5 ${row.color} rounded-full`}></span>
                      <span className="text-xs font-bold uppercase tracking-wide text-slate-500">
                        {row.status}
                      </span>
                    </div>
                    <span className="text-xs font-mono text-slate-400">
                      {row.expiry}
                    </span>
                  </div>
                  <p className="font-semibold text-slate-800 text-sm">
                    {row.items}
                  </p>
                  <p className="text-xs text-slate-400 mt-1">{row.count}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════ */}
      {/* DEEP DIVE: POS & PAYMENTS                   */}
      {/* ═══════════════════════════════════════════ */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Visual */}
            <div className="order-2 lg:order-1">
              <div className="bg-slate-900 rounded-2xl p-6 shadow-2xl">
                <div className="bg-slate-800 rounded-xl p-4 mb-4">
                  <p className="text-xs text-slate-400 font-mono mb-3">
                    RECEIPT — PHARMACARE POS
                  </p>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between text-slate-300">
                      <span>Paracetamol 500mg × 2</span>
                      <span>40.00 ETB</span>
                    </div>
                    <div className="flex justify-between text-slate-300">
                      <span>Amoxicillin 250mg × 1</span>
                      <span>85.00 ETB</span>{" "}
                    </div>
                    <div className="flex justify-between text-slate-300">
                      <span>Vitamin C 1000mg × 1</span>
                      <span>35.00 ETB</span>
                    </div>
                    <hr className="border-slate-700 my-2" />
                    <div className="flex justify-between text-white font-bold">
                      <span>Subtotal</span>
                      <span>160.00 ETB</span>
                    </div>
                    <div className="flex justify-between text-slate-400 text-xs">
                      <span>VAT (15%)</span>
                      <span>24.00 ETB</span>
                    </div>
                    <div className="flex justify-between text-teal-400 font-bold text-lg mt-2">
                      <span>Total</span>
                      <span>184.00 ETB</span>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {["Telebirr", "CBE Birr", "Cash", "Bank Transfer"].map(
                    (method, i) => (
                      <div
                        key={i}
                        className={`p-3 rounded-xl text-center text-sm font-semibold transition ${
                          i === 0
                            ? "bg-teal-600 text-white"
                            : "bg-slate-800 text-slate-400"
                        }`}>
                        {method}
                      </div>
                    ),
                  )}
                </div>
              </div>
            </div>

            {/* Copy */}
            <div className="order-1 lg:order-2">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 text-blue-700 text-xs font-bold uppercase tracking-widest mb-6 border border-blue-100">
                <CreditCard className="w-3.5 h-3.5" /> Point of Sale
              </div>
              <h2 className="text-3xl sm:text-4xl font-black text-slate-900 mb-6 leading-tight">
                Checkout That Works
                <br />
                the Way Ethiopia Pays
              </h2>
              <p className="text-lg text-slate-500 mb-8 leading-relaxed">
                Accept Telebirr, CBE Birr, cash, and bank transfers natively. No
                awkward workarounds. No foreign payment gateways.
              </p>
              <div className="space-y-5">
                {[
                  {
                    icon: CreditCard,
                    title: "Localized Payments",
                    desc: "Telebirr, CBE Birr, Cash, and Bank Transfer built directly into the POS. Match how your customers actually pay.",
                  },
                  {
                    icon: RotateCcw,
                    title: "Smart Refunds",
                    desc: "Process returns in one click. Stock is automatically restored to the correct batch. Inventory stays accurate.",
                  },
                  {
                    icon: Printer,
                    title: "Professional Receipts",
                    desc: "Print clean, formatted receipts with VAT/TOT breakdowns, TIN numbers, and your pharmacy branding.",
                  },
                ].map((item, i) => (
                  <div key={i} className="flex gap-4">
                    {" "}
                    <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5">
                      <item.icon className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 mb-1">
                        {item.title}
                      </h4>
                      <p className="text-sm text-slate-500 leading-relaxed">
                        {item.desc}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════ */}
      {/* DEEP DIVE: ANALYTICS                        */}
      {/* ═══════════════════════════════════════════ */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-violet-50 text-violet-700 text-xs font-bold uppercase tracking-widest mb-6 border border-violet-100">
                <BarChart3 className="w-3.5 h-3.5" /> Analytics
              </div>
              <h2 className="text-3xl sm:text-4xl font-black text-slate-900 mb-6 leading-tight">
                See Your Real Profit.
                <br />
                Not Just Revenue.
              </h2>
              <p className="text-lg text-slate-500 mb-8 leading-relaxed">
                Most systems show you top-line sales. PharmaCare subtracts the
                exact batch cost to reveal what you actually earned.
              </p>
              <div className="space-y-5">
                {[
                  {
                    icon: DollarSign,
                    title: "Real Profit Calculation",
                    desc: "Revenue minus specific batch cost. See the true margin on every medicine, not just vanity metrics.",
                  },
                  {
                    icon: TrendingUp,
                    title: "Top-Sellers & Payment Breakdown",
                    desc: "Know which medicines drive profit and how customers prefer to pay. Make smarter purchasing decisions.",
                  },
                  {
                    icon: FileText,
                    title: "One-Click PDF Reports",
                    desc: "Generate professional reports for tax season, accounting, and business planning in seconds.",
                  },
                  {
                    icon: Calendar,
                    title: "Flexible Timeframe Filtering",
                    desc: "Analyze daily, weekly, monthly, or custom periods. Spot trends and compare performance over time.",
                  },
                ].map((item, i) => (
                  <div key={i} className="flex gap-4">
                    <div className="w-10 h-10 bg-violet-100 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5">
                      <item.icon className="w-5 h-5 text-violet-600" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 mb-1">
                        {item.title}
                      </h4>
                      <p className="text-sm text-slate-500 leading-relaxed">
                        {item.desc}
                      </p>
                    </div>
                  </div>
                ))}{" "}
              </div>
            </div>

            {/* Visual */}
            <div className="space-y-4">
              <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">
                  Monthly Profit Overview
                </p>
                <div className="flex items-end gap-2 h-32">
                  {[40, 55, 35, 70, 60, 85, 75, 90, 65, 80, 95, 88].map(
                    (h, i) => (
                      <div
                        key={i}
                        className="flex-1 bg-gradient-to-t from-teal-500 to-emerald-400 rounded-t-md transition-all hover:from-teal-600 hover:to-emerald-500"
                        style={{ height: `${h}%` }}></div>
                    ),
                  )}
                </div>
                <div className="flex justify-between mt-2 text-xs text-slate-400">
                  <span>Jan</span>
                  <span>Mar</span>
                  <span>Jun</span>
                  <span>Sep</span>
                  <span>Dec</span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
                  <p className="text-xs text-slate-400 font-medium mb-1">
                    Real Profit
                  </p>
                  <p className="text-2xl font-black text-emerald-600">
                    +127,400
                  </p>
                  <p className="text-xs text-slate-400">ETB this month</p>
                </div>
                <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
                  <p className="text-xs text-slate-400 font-medium mb-1">
                    Expired Loss
                  </p>
                  <p className="text-2xl font-black text-red-500">-3,200</p>
                  <p className="text-xs text-emerald-500 font-semibold">
                    ↓ 78% from last quarter
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════ */}
      {/* LOCALIZATION & OFFLINE                      */}
      {/* ═══════════════════════════════════════════ */}
      <section className="py-20 bg-slate-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <p className="text-sm font-bold text-teal-400 uppercase tracking-widest mb-3">
              Built for Ethiopia
            </p>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black mb-4">
              Local Reality. Global Standards.
            </h2>
            <p className="text-lg text-slate-400 max-w-2xl mx-auto">
              We didn't adapt foreign software. We built from scratch for
              Ethiopian pharmacies, Ethiopian payments, and Ethiopian
              infrastructure.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: WifiOff,
                title: "Offline-First",
                desc: "Scan, sell, and manage stock during power outages. Auto-syncs when connectivity returns.",
              },
              {
                icon: Languages,
                title: "አማርኛ & English",
                desc: "Instant language toggle per user role. Pharmacists use English, clerks use Amharic.",
              },
              {
                icon: Calendar,
                title: "Ethiopian Calendar",
                desc: "Native E.C. dates, local time formatting, and fiscal year reporting built in.",
              },
              {
                icon: CreditCard,
                title: "Telebirr Native",
                desc: "QR payments, subscription billing, and reconciliation in ETB. Zero forex risk.",
              },
              {
                icon: FileCheck,
                title: "EFDA Compliant",
                desc: "Batch traceability, disposal workflows, and audit logs for Proclamation 1263/2021.",
              },
              {
                icon: Lock,
                title: "Data Privacy",
                desc: "End-to-end encryption compliant with Proclamation 1321/2024. Your data stays yours.",
              },
              {
                icon: Bell,
                title: "Push Notifications",
                desc: "Real-time browser alerts for low stock, expiring batches, and completed sales.",
              },
              {
                icon: DollarSign,
                title: "Multi-Currency",
                desc: "Support for ETB, USD, and EUR for pharmacies dealing with international suppliers.",
              },
            ].map((feat, i) => (
              <div
                key={i}
                className="group p-6 rounded-2xl bg-slate-800/50 border border-slate-700 hover:border-teal-500/50 hover:bg-slate-800 transition-all duration-300">
                <div className="w-12 h-12 bg-teal-500/10 rounded-xl flex items-center justify-center mb-4 group-hover:bg-teal-500/20 transition">
                  <feat.icon className="w-6 h-6 text-teal-400" />
                </div>
                <h3 className="text-lg font-bold mb-2">{feat.title}</h3>
                <p className="text-sm text-slate-400 leading-relaxed">
                  {feat.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════ */}
      {/* TEAM & SECURITY                             */}
      {/* ═══════════════════════════════════════════ */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <p className="text-sm font-bold text-teal-600 uppercase tracking-widest mb-3">
              Team Management
            </p>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 mb-4">
              Right Access. Right People. Zero Risk.
            </h2>
            <p className="text-lg text-slate-500 max-w-2xl mx-auto">
              Cashiers see the POS. Managers see reports. Owners see everything.
              Protect your data and prevent internal loss.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {[
              {
                role: "Cashier",
                access: ["POS Screen", "Process Sales", "View Own Receipts"],
                blocked: [
                  "Financial Reports",
                  "Inventory Settings",
                  "Staff Management",
                ],
                color: "border-blue-200 bg-blue-50/30",
              },
              {
                role: "Manager",
                access: [
                  "POS Screen",
                  "Inventory Management",
                  "Financial Reports",
                  "Supplier Orders",
                ],
                blocked: ["System Settings", "Staff Onboarding"],
                color: "border-violet-200 bg-violet-50/30",
              },
              {
                role: "Admin / Owner",
                access: [
                  "Full System Access",
                  "Staff Management",
                  "System Configuration",
                  "All Reports & Audit Logs",
                ],
                blocked: [],
                color: "border-teal-200 bg-teal-50/30",
              },
            ].map((tier, i) => (
              <div key={i} className={`p-6 rounded-2xl border-2 ${tier.color}`}>
                <h3 className="text-lg font-bold text-slate-900 mb-4">
                  {tier.role}
                </h3>
                <div className="space-y-2 mb-4">
                  {tier.access.map((item, j) => (
                    <div
                      key={j}
                      className="flex items-center gap-2 text-sm text-slate-700">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                      {item}
                    </div>
                  ))}
                </div>
                {tier.blocked.length > 0 && (
                  <div className="pt-4 border-t border-slate-200 space-y-2">
                    {tier.blocked.map((item, j) => (
                      <div
                        key={j}
                        className="flex items-center gap-2 text-sm text-slate-400">
                        <X className="w-4 h-4 flex-shrink-0" />
                        {item}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════ */}
      {/* PRICING                                     */}
      {/* ═══════════════════════════════════════════ */}
      <section id="pricing" className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <p className="text-sm font-bold text-teal-600 uppercase tracking-widest mb-3">
              Simple Pricing
            </p>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 mb-4">
              Transparent ETB Pricing
            </h2>
            <p className="text-lg text-slate-500 max-w-2xl mx-auto">
              No USD pegging. No hidden fees. No surprises. Designed for
              pharmacy margins.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {[
              {
                name: "Starter",
                price: "1,500",
                period: "/mo",
                yearly: "15,000 ETB/yr",
                desc: "Perfect for single-branch community pharmacies.",
                features: [
                  "Up to 500 SKUs",
                  "1 Branch",
                  "3 Users",
                  "Basic Expiry Alerts",
                  "EFDA Compliance Reports",
                  "Offline Mode",
                ],
                popular: false,
              },
              {
                name: "Growth",
                price: "3,000",
                period: "/mo",
                yearly: "28,000 ETB/yr",
                desc: "For growing pharmacies with multiple staff.",
                features: [
                  "Up to 2,000 SKUs",
                  "2 Branches",
                  "5 Users",
                  "Telebirr Auto-Sync",
                  "Demand Forecasting",
                  "Priority Support",
                  "PDF Report Export",
                ],
                popular: true,
              },
              {
                name: "Business",
                price: "5,000",
                period: "/mo",
                yearly: "42,000 ETB/yr",
                desc: "For chains and wholesalers who need unlimited scale.",
                features: [
                  "Unlimited SKUs",
                  "Unlimited Branches",
                  "Unlimited Users",
                  "API Access",
                  "Custom Integrations",
                  "Dedicated Account Manager",
                  "Advanced Analytics",
                ],
                popular: false,
              },
            ].map((tier, i) => (
              <div
                key={i}
                className={`relative p-8 rounded-2xl border-2 transition-all duration-300 ${
                  tier.popular
                    ? "border-teal-500 bg-white shadow-2xl shadow-teal-100 scale-105"
                    : "border-slate-200 bg-white hover:border-slate-300 hover:shadow-lg"
                }`}>
                {tier.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-teal-500 to-emerald-600 text-white text-xs font-bold px-4 py-1.5 rounded-full shadow-lg">
                    MOST POPULAR
                  </div>
                )}
                <h3 className="text-xl font-bold text-slate-900 mb-1">
                  {tier.name}
                </h3>
                <p className="text-sm text-slate-400 mb-4">{tier.desc}</p>
                <div className="flex items-baseline gap-1 mb-1">
                  <span className="text-4xl font-black text-slate-900">
                    {tier.price}
                  </span>
                  <span className="text-slate-400 font-medium">
                    ETB{tier.period}
                  </span>
                </div>
                <p className="text-xs text-teal-600 font-semibold mb-6">
                  {tier.yearly} (save 17%)
                </p>
                <ul className="space-y-3 mb-8">
                  {tier.features.map((feat, j) => (
                    <li
                      key={j}
                      className="flex items-center gap-3 text-sm text-slate-600">
                      <CheckCircle2 className="w-4 h-4 text-teal-500 flex-shrink-0" />
                      {feat}
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => navigate("/signup")}
                  className={`w-full py-3.5 rounded-xl font-bold transition active:scale-95 ${
                    tier.popular
                      ? "bg-teal-600 hover:bg-teal-700 text-white shadow-lg shadow-teal-600/25"
                      : "bg-slate-100 hover:bg-slate-200 text-slate-900"
                  }`}>
                  Start Free Trial
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════ */}
      {/* FAQ                                         */}
      {/* ═══════════════════════════════════════════ */}
      <section id="faq" className="py-20 bg-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <p className="text-sm font-bold text-teal-600 uppercase tracking-widest mb-3">
              FAQ
            </p>
            <h2 className="text-3xl font-black text-slate-900">
              Common Questions
            </h2>
          </div>
          <div className="space-y-3">
            {[
              {
                q: "Does it really work without internet?",
                a: "Yes. Our offline-first architecture caches all inventory, POS, and prescription data locally on your device. When your connection returns, everything syncs securely to the cloud in the background. No data is ever lost.",
              },
              {
                q: "Is it compliant with the June 2026 EFDA mandate?",
                a: "Absolutely. We provide batch-level traceability, formal disposal workflows, and audit-ready reports that align with Proclamation 1263/2021. You'll be inspection-ready months before the deadline.",
              },
              {
                q: "Can I print invoices in the Ethiopian Calendar?",
                a: "Yes. All receipts, reports, and expiry dates support both Gregorian and Ethiopian calendars, including local time formatting, out of the box.",
              },
              {
                q: "What payment methods do you support?",
                a: "Subscriptions and in-store POS payments integrate directly with Telebirr and CBE Birr. We also support cash and bank transfers. All billing is in ETB — zero forex risk.",
              },
              {
                q: "Do I need to buy new hardware?",
                a: "PharmaCare works with standard Bluetooth barcode scanners and USB thermal printers widely available in Addis Ababa. No proprietary hardware required.",
              },
              {
                q: "How does role-based access control work?",
                a: "You assign each staff member a role (Cashier, Manager, Admin). Cashiers only see the POS screen. Managers access inventory and reports. Admins have full system control. Every action is logged with user attribution.",
              },
              {
                q: "What happens to my data if I cancel?",
                a: "Your data belongs to you. You can export everything as PDF or CSV at any time. After cancellation, your data is retained for 30 days before secure deletion, per Proclamation 1321/2024.",
              },
            ].map((faq, i) => (
              <div
                key={i}
                className="bg-slate-50 border border-slate-100 rounded-xl overflow-hidden hover:border-slate-200 transition">
                <button
                  onClick={() => toggleFaq(i)}
                  className="w-full px-6 py-5 text-left flex justify-between items-center font-semibold text-slate-900 hover:bg-slate-100/50 transition">
                  {faq.q}
                  <ChevronDown
                    className={`w-5 h-5 text-teal-600 transition-transform duration-300 flex-shrink-0 ml-4 ${
                      openFaq === i ? "rotate-180" : ""
                    }`}
                  />
                </button>
                {openFaq === i && (
                  <div className="px-6 pb-5 text-slate-500 leading-relaxed border-t border-slate-100 pt-4">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════ */}
      {/* FINAL CTA                                   */}
      {/* ═══════════════════════════════════════════ */}
      <section className="py-24 bg-linear-to-br from-teal-600 via-teal-700 to-emerald-800 text-white relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full">
          <div className="absolute top-10 left-10 w-64 h-64 bg-white/5 rounded-full blur-3xl"></div>
          <div className="absolute bottom-10 right-10 w-80 h-80 bg-white/5 rounded-full blur-3xl"></div>
        </div>
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black mb-6 leading-tight">
            Ready to Run Your Pharmacy
            <br />
            Like a Modern Business?
          </h2>
          <p className="text-lg text-teal-100 mb-10 max-w-2xl mx-auto leading-relaxed">
            {" "}
            Join hundreds of Ethiopian pharmacies already eliminating waste,
            preventing stockouts, and staying ahead of EFDA regulations. Setup
            takes less than 5 minutes.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-6">
            <button
              onClick={() => navigate("/signup")}
              className="group bg-white text-teal-700 px-8 py-4 rounded-full text-lg font-bold hover:bg-slate-100 transition shadow-xl active:scale-95 flex items-center justify-center gap-2">
              Get Started Free
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
            <button
              onClick={() => navigate("/login")}
              className="bg-teal-600/50 text-white border-2 border-teal-400/30 px-8 py-4 rounded-full text-lg font-semibold hover:bg-teal-600/70 transition active:scale-95">
              Log In to Dashboard
            </button>
          </div>
          <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-teal-200">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4" /> No credit card required
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4" /> 14-day free trial
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4" /> Cancel anytime
            </span>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════ */}
      {/* FOOTER                                      */}
      {/* ═══════════════════════════════════════════ */}
      <footer className="bg-slate-900 text-slate-400 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-10 mb-12">
            <div>
              <div className="flex items-center gap-2.5 mb-4">
                <div className="w-9 h-9 bg-gradient-to-br from-teal-500 to-emerald-600 rounded-xl flex items-center justify-center">
                  <ShieldCheck className="text-white w-5 h-5" />
                </div>
                <span className="text-white font-bold text-xl">PharmaCare</span>
              </div>
              <p className="text-sm leading-relaxed mb-4">
                Ethiopia's first offline-ready pharmacy operating system. Built
                locally, for local realities.
              </p>
              <p className="text-xs text-slate-500">
                Compliant with EFDA Proclamation 1263/2021 & Data Protection
                Proclamation 1321/2024.
              </p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">
                Product
              </h4>
              <ul className="space-y-2.5 text-sm">
                <li>
                  <button
                    onClick={() => scrollTo("features")}
                    className="hover:text-teal-400 transition">
                    Features
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => scrollTo("pricing")}
                    className="hover:text-teal-400 transition">
                    Pricing
                  </button>
                </li>{" "}
                <li>
                  <button
                    onClick={() => scrollTo("faq")}
                    className="hover:text-teal-400 transition">
                    FAQ
                  </button>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">
                Company
              </h4>
              <ul className="space-y-2.5 text-sm">
                <li>
                  <a href="#" className="hover:text-teal-400 transition">
                    About
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-teal-400 transition">
                    Blog
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-teal-400 transition">
                    Partners
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-teal-400 transition">
                    Contact
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">
                Legal
              </h4>
              <ul className="space-y-2.5 text-sm">
                <li>
                  <a href="#" className="hover:text-teal-400 transition">
                    Privacy Policy
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-teal-400 transition">
                    Terms of Service
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-teal-400 transition">
                    Data Security
                  </a>
                </li>
              </ul>
            </div>
          </div>
          <div className="pt-8 border-t border-slate-800 flex flex-col sm:flex-row justify-between items-center gap-4 text-sm">
            <p>
              &copy; {new Date().getFullYear()} PharmaCare Ethiopia. All rights
              reserved.
            </p>
            <p className="text-slate-500">
              Made with purpose in Addis Ababa 🇪🇹
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
