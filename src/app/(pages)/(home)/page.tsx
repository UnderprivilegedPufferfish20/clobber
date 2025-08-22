'use client';

import { useState } from 'react';
import {
  CloudIcon,
  SparklesIcon,
  BookOpenIcon,
  ArrowRightIcon,
  ZapIcon,
  VideoIcon,
  GaugeIcon,
  LayersIcon,
  CodeIcon,
  DownloadIcon,
  ChartBarIcon,
  DatabaseIcon,
  EyeIcon,
  GitBranchIcon,
  ServerIcon,
  UsersIcon,
  ShieldCheck,
  Sparkles,
  Zap
} from 'lucide-react'
import Logo from '@/components/Logo';
import SignInButton from './_components/SignIn';
import SignUpButton from './_components/SignUp';
import AnimatedBackground from './_components/AnimatedBackground';
import DropdownMenu from './_components/DropdownMenu';
import { useAuth } from '@/components/providers/AuthProvider';
import { motion } from 'framer-motion'


export default function HomePage() {
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

  const features = [
    {
      title: "One-String Connection",
      description: "Connect to any database with a single connection string. AI automatically detects and configures the optimal ORM settings.",
      icon: <ServerIcon className="w-8 h-8" />
    },
    {
      title: "AI-Generated Insights",
      description: "Get intelligent suggestions for query optimization, indexing, and performance improvements based on your usage patterns.",
      icon: <SparklesIcon className="w-8 h-8" />
    },
    {
      title: "Branching",
      description: "Create instant database branches for testing, development, or experimentation without affecting your production data.",
      icon: <GitBranchIcon className="w-8 h-8" />
    },
    {
      title: "Monitoring & Analytics",
      description: "Real-time performance monitoring with AI-powered anomaly detection and predictive analytics.",
      icon: <EyeIcon className="w-8 h-8" />
    },
    {
      title: "Collaboration Tools",
      description: "Share queries, insights, and database changes with your team with fine-grained access controls.",
      icon: <UsersIcon className="w-8 h-8" />
    },
    {
      title: "AI Restructuring",
      description: "Automatically optimize your database schema based on usage patterns with AI-powered restructuring suggestions.",
      icon: <DatabaseIcon className="w-8 h-8" />
    },
    {
      title: "AI-Powered Pipelines",
      description: "Build intelligent ETL pipelines with natural language instructions and automated data transformation.",
      icon: <ChartBarIcon className="w-8 h-8" />
    },
    {
      title: "Instant Deployment",
      description: "Deploy your database changes with confidence using AI-generated migration scripts and rollback protection.",
      icon: <ZapIcon className="w-8 h-8" />
    }
  ];

  const items = [
    {
      icon: <ShieldCheck className="w-5 h-5" />,
      title: "Performance Optimization",
      desc: "AI identifies and fixes slow queries automatically",
    },
    {
      icon: <Sparkles className="w-5 h-5" />,
      title: "Smart Indexing",
      desc: "Creates optimal indexes based on real query patterns",
    },
    {
      icon: <Zap className="w-5 h-5" />,
      title: "Predictive Scaling",
      desc: "Anticipates load and scales resources proactively",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 text-white relative">
      {/* Animated Background */}
      <AnimatedBackground />
      
      {/* Custom CSS for animations */}
      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); opacity: 0.4; }
          50% { transform: translateY(-20px) rotate(180deg); opacity: 0.8; }
        }
        @keyframes grid-move {
          0% { transform: translate(0, 0); }
          100% { transform: translate(100px, 100px); }
        }
        .animate-float {
          animation: float var(--duration, 8s) ease-in-out infinite;
        }
      `}</style>

      {/* Header */}
      <header className="container mx-auto px-4 py-6 flex justify-between items-center relative z-10">
        <Logo iconSize={36}/>
        <nav className="hidden md:flex space-x-8">
          <DropdownMenu
            title="Features"
            isOpen={activeDropdown === 'features'}
            onToggle={() => setActiveDropdown(activeDropdown === 'features' ? null : 'features')}
          >
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-indigo-400 mb-4">Core Features</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-start space-x-3">
                  <DatabaseIcon className="w-5 h-5 text-indigo-400 mt-1" />
                  <div>
                    <h4 className="font-medium">AI Optimization</h4>
                    <p className="text-sm text-slate-400">Smart query tuning</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <GitBranchIcon className="w-5 h-5 text-purple-400 mt-1" />
                  <div>
                    <h4 className="font-medium">Database Branching</h4>
                    <p className="text-sm text-slate-400">Zero-downtime testing</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <GaugeIcon className="w-5 h-5 text-green-400 mt-1" />
                  <div>
                    <h4 className="font-medium">Real-time Monitoring</h4>
                    <p className="text-sm text-slate-400">Performance insights</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <LayersIcon className="w-5 h-5 text-yellow-400 mt-1" />
                  <div>
                    <h4 className="font-medium">Schema Migration</h4>
                    <p className="text-sm text-slate-400">Automated updates</p>
                  </div>
                </div>
              </div>
              <div className="pt-4 border-t border-slate-700">
                <button className="flex items-center text-indigo-400 hover:text-indigo-300">
                  View all features <ArrowRightIcon className="w-4 h-4 ml-2" />
                </button>
              </div>
            </div>
          </DropdownMenu>

          <DropdownMenu
            title="Pricing"
            isOpen={activeDropdown === 'pricing'}
            onToggle={() => setActiveDropdown(activeDropdown === 'pricing' ? null : 'pricing')}
          >
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-indigo-400 mb-4">Choose Your Plan</h3>
              <div className="space-y-3">
                <div className="bg-slate-700/50 rounded-lg p-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <h4 className="font-medium">Starter</h4>
                      <p className="text-sm text-slate-400">Perfect for small projects</p>
                    </div>
                    <div className="text-right">
                      <span className="text-2xl font-bold">Free</span>
                    </div>
                  </div>
                </div>
                <div className="bg-indigo-500/20 rounded-lg p-4 border border-indigo-500/50">
                  <div className="flex justify-between items-center">
                    <div>
                      <h4 className="font-medium">Professional</h4>
                      <p className="text-sm text-slate-400">For growing teams</p>
                    </div>
                    <div className="text-right">
                      <span className="text-2xl font-bold">$29</span>
                      <span className="text-slate-400">/mo</span>
                    </div>
                  </div>
                </div>
                <div className="bg-slate-700/50 rounded-lg p-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <h4 className="font-medium">Enterprise</h4>
                      <p className="text-sm text-slate-400">Custom solutions</p>
                    </div>
                    <div className="text-right">
                      <span className="text-lg font-medium">Custom</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="pt-4 border-t border-slate-700">
                <button className="flex items-center text-indigo-400 hover:text-indigo-300">
                  Compare all plans <ArrowRightIcon className="w-4 h-4 ml-2" />
                </button>
              </div>
            </div>
          </DropdownMenu>

          <DropdownMenu
            title="Documentation"
            isOpen={activeDropdown === 'documentation'}
            onToggle={() => setActiveDropdown(activeDropdown === 'documentation' ? null : 'documentation')}
          >
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-indigo-400 mb-4">Developer Resources</h3>
              <div className="space-y-3">
                <div className="flex items-center space-x-3 p-2 rounded-lg hover:bg-slate-700/50 cursor-pointer">
                  <BookOpenIcon className="w-5 h-5 text-blue-400" />
                  <div>
                    <h4 className="font-medium">Getting Started</h4>
                    <p className="text-sm text-slate-400">Quick setup guide</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3 p-2 rounded-lg hover:bg-slate-700/50 cursor-pointer">
                  <CodeIcon className="w-5 h-5 text-green-400" />
                  <div>
                    <h4 className="font-medium">API Reference</h4>
                    <p className="text-sm text-slate-400">Complete API docs</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3 p-2 rounded-lg hover:bg-slate-700/50 cursor-pointer">
                  <VideoIcon className="w-5 h-5 text-purple-400" />
                  <div>
                    <h4 className="font-medium">Video Tutorials</h4>
                    <p className="text-sm text-slate-400">Step-by-step guides</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3 p-2 rounded-lg hover:bg-slate-700/50 cursor-pointer">
                  <DownloadIcon className="w-5 h-5 text-yellow-400" />
                  <div>
                    <h4 className="font-medium">SDK Downloads</h4>
                    <p className="text-sm text-slate-400">All languages</p>
                  </div>
                </div>
              </div>
              <div className="pt-4 border-t border-slate-700">
                <button className="flex items-center text-indigo-400 hover:text-indigo-300">
                  Browse all docs <ArrowRightIcon className="w-4 h-4 ml-2" />
                </button>
              </div>
            </div>
          </DropdownMenu>

          <DropdownMenu
            title="Blog"
            isOpen={activeDropdown === 'blog'}
            onToggle={() => setActiveDropdown(activeDropdown === 'blog' ? null : 'blog')}
          >
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-indigo-400 mb-4">Latest Articles</h3>
              <div className="space-y-3">
                <div className="p-3 rounded-lg hover:bg-slate-700/50 cursor-pointer">
                  <h4 className="font-medium text-sm">AI-Driven Database Optimization</h4>
                  <p className="text-xs text-slate-400 mt-1">Learn how AI can automatically optimize your queries</p>
                  <span className="text-xs text-indigo-400">2 days ago</span>
                </div>
                <div className="p-3 rounded-lg hover:bg-slate-700/50 cursor-pointer">
                  <h4 className="font-medium text-sm">Zero-Downtime Migrations</h4>
                  <p className="text-xs text-slate-400 mt-1">Best practices for seamless database updates</p>
                  <span className="text-xs text-indigo-400">1 week ago</span>
                </div>
                <div className="p-3 rounded-lg hover:bg-slate-700/50 cursor-pointer">
                  <h4 className="font-medium text-sm">Database Security in 2025</h4>
                  <p className="text-xs text-slate-400 mt-1">Essential security patterns for modern databases</p>
                  <span className="text-xs text-indigo-400">2 weeks ago</span>
                </div>
              </div>
              <div className="pt-4 border-t border-slate-700">
                <button className="flex items-center text-indigo-400 hover:text-indigo-300">
                  Read all articles <ArrowRightIcon className="w-4 h-4 ml-2" />
                </button>
              </div>
            </div>
          </DropdownMenu>
        </nav>
        <div className="flex space-x-4">
          <SignInButton />
          <SignUpButton />
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16 md:py-24 flex flex-col items-center text-center relative z-5">
        <h1 className="text-4xl md:text-6xl font-bold max-w-3xl leading-tight">
          The Intelligent Database Management System
        </h1>
        <p className="mt-6 text-xl text-slate-300 max-w-2xl">
          Leverage AI to optimize, monitor, and collaborate on your databases with unprecedented ease and intelligence.
        </p>
        <div className="mt-16 bg-slate-800/80 backdrop-blur-md p-6 rounded-2xl max-w-4xl w-full text-left border border-slate-700/50">
          <div className="flex items-center space-x-2 text-slate-400 mb-4">
            <CloudIcon className="w-5 h-5" />
            <span>Connection String</span>
          </div>
          <code className="bg-slate-900/80 p-4 rounded-lg block">
            <span className="text-green-400">neura</span>
            <span className="text-white">://</span>
            <span className="text-yellow-300">username</span>
            <span className="text-white">:</span>
            <span className="text-yellow-300">password</span>
            <span className="text-white">@</span>
            <span className="text-cyan-300">database-system</span>
            <span className="text-white">/</span>
            <span className="text-purple-300">database-name</span>
          </code>
          <p className="mt-4 text-slate-400 text-sm">
            One connection string to rule all your databases. AI automatically detects and configures the optimal settings.
          </p>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-16 relative z-10">
        {/* Header */}
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-3xl md:text-4xl font-bold">
            Powerful AI-Powered Features
          </h2>
          <p className="mt-4 text-xl text-slate-300 max-w-2xl mx-auto">
            Everything you need to manage your databases efficiently and intelligently
          </p>
        </motion.div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              className="relative group bg-slate-800/80 backdrop-blur-md border border-slate-700/50 p-6 rounded-2xl cursor-pointer overflow-hidden"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              whileHover={{ scale: 1.05, rotate: 0.5 }}
              transition={{ type: "spring", stiffness: 200, damping: 15 }}
            >
              {/* Glow Border on Hover */}
              <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-r from-indigo-500 via-indigo-700 to-indigo-600 blur-xl"></div>

              {/* Content */}
              <div className="relative z-10">
                <motion.div
                  className="text-indigo-400 mb-4"
                  whileHover={{ rotate: 5, scale: 1.1 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  {feature.icon}
                </motion.div>
                <h3 className="text-xl font-semibold mb-2 text-white">
                  {feature.title}
                </h3>
                <p className="text-slate-400">{feature.description}</p>
              </div>

              {/* Decorative Gradient Shapes */}
              <div className="absolute -top-10 -right-10 w-40 h-40 bg-pink-500/10 rounded-full blur-3xl group-hover:scale-110 transition-transform duration-700"></div>
              <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-indigo-500/10 rounded-full blur-3xl group-hover:scale-110 transition-transform duration-700"></div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Demo Section */}
      <section className="container mx-auto px-4 py-20 relative z-10">
        {/* Soft radial glow background (indigo theme) */}
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute left-1/2 top-0 -translate-x-1/2 h-72 w-[60rem] rounded-full bg-indigo-500/10 blur-3xl" />
          <div className="absolute left-1/3 bottom-0 h-64 w-[40rem] rounded-full bg-indigo-500/5 blur-3xl" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* Left: Headline + Timeline */}
          <motion.div
            className="lg:col-span-5 flex flex-col justify-center"
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
              <span className="bg-gradient-to-r from-indigo-400 to-indigo-200 bg-clip-text text-transparent">
                AI-Generated Insights
              </span>{" "}
              in Action
            </h2>
            <p className="mt-4 text-slate-300/90 leading-relaxed">
              Watch NeuraDB analyze performance and surface precise, actionable fixes—without the manual sleuthing.
            </p>

            {/* Timeline (less crowded, more visual) */}
            <ol className="mt-10 space-y-6 relative">
              {/* vertical line */}
              <span className="absolute left-4 top-0 h-full w-px bg-gradient-to-b from-indigo-500/60 via-indigo-500/20 to-transparent" />
              {items.map((it, i) => (
                <motion.li
                  key={it.title}
                  className="relative pl-14"
                  initial={{ opacity: 0, x: -12 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.35, delay: i * 0.06 }}
                >
                  {/* Node */}
                  <span className="absolute left-0 top-0">
                    <span className="relative grid place-items-center h-8 w-8 rounded-full bg-indigo-600/20 ring-1 ring-indigo-500/40">
                      <span className="absolute inset-0 rounded-full animate-ping bg-indigo-500/20" />
                      <span className="relative text-indigo-200">{it.icon}</span>
                    </span>
                  </span>

                  <h3 className="font-semibold text-white">{it.title}</h3>
                  <p className="text-slate-400">{it.desc}</p>
                </motion.li>
              ))}
            </ol>
          </motion.div>

          {/* Right: Live Insight Console */}
          <motion.div
            className="lg:col-span-7"
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            <div className="relative group rounded-2xl border border-slate-700/50 bg-slate-900/60 backdrop-blur-xl overflow-hidden">
              {/* Glow on hover */}
              <div className="absolute -inset-1 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-r from-indigo-500/20 via-indigo-400/10 to-transparent blur-xl" />
              {/* Header strip */}
              <div className="relative z-10 flex items-center justify-between px-6 py-4 border-b border-slate-800/60 bg-slate-900/60">
                <div className="text-sm text-slate-300/80">AI Recommendation</div>
                <span className="inline-flex items-center gap-2 text-xs rounded-full px-2.5 py-1 bg-indigo-600/20 text-indigo-200 ring-1 ring-indigo-500/40">
                  <Sparkles className="w-3.5 h-3.5" />
                  Live
                </span>
              </div>

              {/* Body */}
              <div className="relative z-10 p-6">
                {/* “Console” style insight card */}
                <motion.div
                  className="rounded-xl border border-slate-800 bg-slate-900/60 p-4"
                  initial={{ opacity: 0, y: 8 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: 0.1 }}
                >
                  <h4 className="font-medium text-white">Query Optimization Opportunity</h4>
                  <p className="text-sm text-slate-300/90 mt-1">
                    The <span className="text-indigo-300/90 font-medium">users</span> query is scanning{" "}
                    <span className="text-indigo-300/90 font-medium">95%</span> of the table. Add an index on{" "}
                    <code className="rounded bg-slate-800/80 px-1 py-0.5 text-indigo-200">company_id</code> to reduce scan to{" "}
                    <span className="text-indigo-300/90 font-medium">~5%</span>.
                  </p>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <button className="text-xs rounded-lg bg-indigo-600 px-3 py-1.5 text-white hover:bg-indigo-500 transition-colors">
                      Apply Fix
                    </button>
                    <button className="text-xs rounded-lg bg-slate-800 px-3 py-1.5 text-slate-200 hover:bg-slate-700 transition-colors">
                      See Details
                    </button>
                  </div>
                </motion.div>

                {/* KPIs with animated bars (indigo scheme) */}
                <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <KPI
                    label="Query Speed"
                    before="2.4s"
                    after="0.2s"
                    pct={12} // width percentage after optimization (visual)
                  />
                  <KPI
                    label="CPU Usage"
                    before="85%"
                    after="12%"
                    pct={18}
                  />
                  <KPI
                    label="Memory Usage"
                    before="1.2GB"
                    after="0.3GB"
                    pct={25}
                  />
                </div>

                {/* Subtle “AI pulse” orb for flair */}
                <div className="mt-8 flex items-center gap-3">
                  <span className="relative inline-flex h-3.5 w-3.5">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-indigo-500/40" />
                    <span className="relative inline-flex h-3.5 w-3.5 rounded-full bg-indigo-500" />
                  </span>
                  <p className="text-sm text-slate-400">
                    Monitoring query patterns in real time to suggest index updates.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-24 text-center relative z-10">
        <h2 className="text-3xl md:text-4xl font-bold mb-6">Ready to Transform Your Database Management?</h2>
        <p className="text-xl text-slate-300 max-w-2xl mx-auto mb-10">
          Join thousands of developers who use NeuraDB to manage their databases intelligently
        </p>
        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <button className="px-8 py-3 bg-indigo-600 rounded-lg text-lg font-medium hover:bg-indigo-700 transition-colors">
            Get Started for Free
          </button>
          <button className="px-8 py-3 bg-slate-700 rounded-lg text-lg font-medium hover:bg-slate-600 transition-colors">
            Talk to Sales
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-700 py-12 relative z-10">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <SparklesIcon className="h-6 w-6 text-indigo-400" />
                <span className="text-xl font-bold">NeuraDB</span>
              </div>
              <p className="text-slate-400">
                The intelligent database management system powered by AI.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Product</h3>
              <ul className="space-y-2 text-slate-400">
                <li><a href="#" className="hover:text-white transition-colors">Features</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Pricing</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Use Cases</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Integrations</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Resources</h3>
              <ul className="space-y-2 text-slate-400">
                <li><a href="#" className="hover:text-white transition-colors">Documentation</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Community</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Support</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Company</h3>
              <ul className="space-y-2 text-slate-400">
                <li><a href="#" className="hover:text-white transition-colors">About</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Careers</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Legal</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-slate-700 mt-8 pt-8 text-center text-slate-500">
            <p>© {new Date().getFullYear()} NeuraDB. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

function KPI({
  label,
  before,
  after,
  pct,
}: {
  label: string;
  before: string;
  after: string;
  pct: number; // target bar width percentage
}) {
  return (
    <motion.div
      className="rounded-xl border border-slate-800/70 bg-slate-900/50 p-4"
      initial={{ opacity: 0, y: 8 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.35 }}
    >
      <div className="flex items-center justify-between text-sm mb-2">
        <span className="text-slate-300">{label}</span>
        <span className="text-slate-400">
          {before} <span className="text-slate-500">→</span>{" "}
          <span className="text-indigo-200 font-medium">{after}</span>
        </span>
      </div>
      <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
        <motion.div
          className="h-2 rounded-full bg-gradient-to-r from-indigo-600 to-indigo-400"
          initial={{ width: "0%" }}
          whileInView={{ width: `${pct}%` }}
          viewport={{ once: true }}
          transition={{ duration: 1, delay: 0.15 }}
        />
      </div>
    </motion.div>
  );
}