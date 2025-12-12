'use client';

import { useEffect, useState } from 'react';
import { InfinityIcon, Sparkles, ArrowRight, ShieldCheck, Zap, Cpu, Gauge, BarChart3, Boxes, Database, GitBranch, Headphones, ServerCog, TestTube, Check, Shield, Users, Quote, LucideIcon, Clock, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { redirect } from 'next/navigation';
import Chip from './_components/Chip';
import FeatureCard from './features/_components/FeatureCard';
import { PlansRecord, Feature, Plan } from '@/lib/types';
import { HomepageAdditionalFeatures, HomepageFeatures, HomepageStats, PricePlans } from '@/lib/constants';

const typedPlans: PlansRecord = PricePlans; // Assuming plans matches this structure
const typedFeatures: Feature[] = HomepageFeatures; // Assuming FEATURES matches Feature[]

export default function HomePage() {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');

  const currentPlan: Plan = typedPlans[billingCycle];

  return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-[unchanged-background] text-white">
      {/* Hero Section - Clear, compelling, with headline, subheadline, CTA, and quick benefits */}
      <section className="relative z-10 container mx-auto px-6 py-20 md:py-32 text-center">
        <div className="max-w-4xl mx-auto">
          <Badge className="mb-6 bg-indigo-500/20 text-indigo-200 border-indigo-400/30 px-4 py-2 text-sm font-medium inline-flex items-center">
            <Sparkles className="w-4 h-4 mr-2" />
            #1 AI-Powered Database Platform
          </Badge>

          <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-white to-indigo-200 bg-clip-text text-transparent leading-tight">
            AI-Driven Database
            <br />
            <span className="text-indigo-300">for Lightning-Fast Development</span>
          </h1>

          <p className="text-xl text-indigo-100/80 mb-8 leading-relaxed max-w-2xl mx-auto">
            Solve complex data challenges effortlessly with AI-powered automation, unlimited scaling, and seamless integrations. Accelerate your workflow and focus on innovation while we handle the heavy lifting.
          </p>

          {/* CTAs - Optimized for low friction */}
          <div className="flex gap-4 justify-center items-center mb-8 flex-wrap">
            <Button
              onClick={() => redirect('/api/auth/google')}
              size="lg"
              className="bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white font-semibold px-8 py-4 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-[1.03] active:scale-100 transition-all duration-300 relative overflow-hidden group"
            >
              <span className="relative z-10 flex items-center">
                Start Free Trial
                <ArrowRight className="ml-2 w-5 h-5" />
              </span>
              <span className="pointer-events-none absolute inset-0 translate-x-[-120%] group-hover:translate-x-[120%] transition-transform duration-700 ease-out bg-gradient-to-r from-transparent via-white/25 to-transparent" />
            </Button>
            <Button
              onClick={() => redirect('/pricing')}
              size="lg"
              variant="outline"
              className="border-indigo-400/50 text-indigo-200 hover:bg-indigo-500/10 font-semibold px-8 py-4 rounded-xl transition-all duration-300"
            >
              View Pricing
            </Button>
          </div>

          {/* Quick Benefit Chips - Benefit-focused */}
          <div id="features" className="flex flex-wrap items-center justify-center gap-3">
            <Chip icon={<Zap className="h-4 w-4" />}>Save Hours on Queries</Chip>
            <Chip icon={<ShieldCheck className="h-4 w-4" />}>Secure Data Everywhere</Chip>
            <Chip icon={<Cpu className="h-4 w-4" />}>AI-Optimized Performance</Chip>
            <Chip icon={<Gauge className="h-4 w-4" />}>Scale Without Limits</Chip>
          </div>
        </div>
      </section>

      {/* Features Section - Benefit-driven, with smooth intro from value prop */}
      <section className="relative z-10 container mx-auto px-6 py-16 md:py-24">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-4 text-white">Key Features That Drive Results</h2>
          <p className="text-indigo-200/80 max-w-2xl mx-auto">Discover how our tools transform your development process, from automated schemas to real-time analytics.</p>
        </div>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {typedFeatures.map((f: Feature, i: number) => (
            <FeatureCard key={i} feature={f} delay={i * 70} />
          ))}
        </div>
      </section>

      {/* Social Proof Section - Added for trust-building, smooth transition from features */}
      <section id="testimonials" className="relative z-10 container mx-auto px-6 py-16 md:py-24">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-4 text-white">Trusted by Developers Worldwide</h2>
          <p className="text-indigo-200/80 max-w-2xl mx-auto">Join thousands of teams who rely on our platform for reliable, AI-enhanced database solutions.</p>
        </div>

        {/* Customer Logos - Placeholder */}
        <div className="flex flex-wrap justify-center gap-8 mb-16">
          <div className="flex items-center gap-2"><Users className="h-8 w-8 text-indigo-300" /> Company A</div>
          <div className="flex items-center gap-2"><Users className="h-8 w-8 text-indigo-300" /> Company B</div>
          <div className="flex items-center gap-2"><Users className="h-8 w-8 text-indigo-300" /> Company C</div>
        </div>

        {/* Testimonials - Placeholder cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            { name: 'Jane Doe', role: 'CTO, TechCorp', quote: 'This platform cut our deployment time in half!' },
            { name: 'John Smith', role: 'Developer, Innovate Ltd', quote: 'AI features are a game-changer for our team.' },
            { name: 'Alex Johnson', role: 'Engineer, ScaleUp', quote: 'Unlimited resources mean no more bottlenecks.' },
          ].map((t, i) => (
            <div key={i} className="p-6 rounded-xl bg-indigo-900/20 border border-indigo-500/20 shadow-lg">
              <Quote className="h-6 w-6 text-indigo-300 mb-4" />
              <p className="text-indigo-100 mb-4">{t.quote}</p>
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-full bg-indigo-500/50" />
                <div>
                  <p className="font-semibold">{t.name}</p>
                  <p className="text-sm text-indigo-300">{t.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

    <div className="min-h-screen relative overflow-hidden">
      {/* Background Elements */}

      <section id="pricing" className="relative z-10 container mx-auto px-6 py-16 md:py-24">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-indigo-500/20 backdrop-blur-sm border border-indigo-500/30 rounded-full px-4 py-2 mb-6">
            <Star className="w-4 h-4 text-indigo-400" />
            <span className="text-indigo-300 text-sm font-medium">Set Price Plan</span>
          </div>
          <h2 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-br from-white via-indigo-100 to-indigo-300 bg-clip-text text-transparent">
            Simple Pricing,
            <br />
            <span className="text-indigo-300">Unlimited Potential</span>
          </h2>
          <p className="text-xl text-indigo-200/80 max-w-3xl mx-auto leading-relaxed">
            One comprehensive plan with everything you need. No hidden fees, no usage limits, no surprises.
          </p>
        </div>

        {/* Stats Bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-16">
          {HomepageStats.map((stat:any, index:any) => (
            <div key={index} className="text-center p-6 bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20">
              <div className="text-3xl font-bold text-white mb-2">{stat.value}</div>
              <div className="text-indigo-300 text-sm font-medium">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Billing Toggle */}
        <div className="flex justify-center mb-12">
          <div className="bg-indigo-900/30 backdrop-blur-sm border border-indigo-500/30 rounded-full p-2">
            <div className="flex gap-2">
              <button
                onClick={() => setBillingCycle('monthly')}
                className={`px-6 py-3 rounded-full text-sm font-medium transition-all duration-300 ${
                  billingCycle === 'monthly'
                    ? 'bg-indigo-500 text-white shadow-lg'
                    : 'text-indigo-300 hover:text-white'
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setBillingCycle('yearly')}
                className={`px-6 py-3 rounded-full text-sm font-medium transition-all duration-300 relative ${
                  billingCycle === 'yearly'
                    ? 'bg-indigo-500 text-white shadow-lg'
                    : 'text-indigo-300 hover:text-white'
                }`}
              >
                Yearly
                <span className="absolute -top-2 -right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full">
                  Save 17%
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Main Pricing Grid */}
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-3 gap-8 items-start">
            
            {/* Left Column - Plan Details */}
            <div className="lg:col-span-1">
              <div className="bg-white/10 backdrop-blur-sm rounded-3xl border border-indigo-500/30 p-8 h-full">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-400 to-indigo-600 flex items-center justify-center shadow-xl">
                    {currentPlan.icon}
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-white">{currentPlan.name}</h3>
                    <p className="text-indigo-300">Perfect for your needs</p>
                  </div>
                </div>
                
                <p className="text-indigo-200/80 text-lg leading-relaxed mb-8">
                  {currentPlan.description}. Get access to all premium features with unlimited usage and priority support.
                </p>

                <div className="space-y-4">
                  <h4 className="text-lg font-semibold text-white flex items-center gap-2">
                    <Clock className="w-5 h-5 text-indigo-400" />
                    What's Included
                  </h4>
                  {currentPlan.features.slice(0, 5).map((feature: any, index:any) => (
                    <div key={index} className="flex items-center gap-3 p-3 bg-white/5 rounded-xl border border-white/10">
                      <div className="flex-shrink-0 w-6 h-6 rounded-full bg-gradient-to-r from-indigo-500 to-indigo-600 flex items-center justify-center">
                        <Check className="w-4 h-4 text-white" />
                      </div>
                      <span className="text-indigo-100 font-medium">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Center Column - Pricing */}
            <div className="lg:col-span-1">
              <div className="bg-gradient-to-br from-indigo-500/20 to-purple-500/20 backdrop-blur-sm rounded-3xl border-2 border-indigo-400 p-8 shadow-2xl relative">
                <div className="text-center pt-4">
                  <div className="mb-8">
                    <div className="flex items-baseline justify-center mb-4">
                      <span className="text-6xl font-bold text-white">${currentPlan.price}</span>
                      <span className="ml-2 text-xl text-indigo-300">
                        {billingCycle === 'monthly' ? '/month' : '/year'}
                      </span>
                    </div>
                    
                    {billingCycle === 'yearly' && currentPlan.originalPrice && (
                      <div className="flex items-center justify-center gap-3">
                        <span className="text-lg text-indigo-400 line-through">
                          ${currentPlan.originalPrice}/year
                        </span>
                        <span className="bg-green-500 text-white px-3 py-1 rounded-full text-sm font-bold">
                          Save ${currentPlan.originalPrice - currentPlan.price}
                        </span>
                      </div>
                    )}
                  </div>

                  <button className="w-full bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white font-semibold py-4 px-8 rounded-2xl text-lg transition-all duration-300 transform hover:scale-105 shadow-xl hover:shadow-indigo-500/50 mb-6">
                    Get Started Now
                  </button>

                  <div className="space-y-3 text-center">
                    <div className="flex items-center justify-center gap-2 text-indigo-200">
                      <Shield className="w-4 h-4 text-green-400" />
                      <span className="text-sm">No credit card required</span>
                    </div>
                    <div className="text-sm text-indigo-300">
                      30-day money back guarantee
                    </div>
                    <div className="text-sm text-indigo-300">
                      Cancel anytime
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - Additional Features */}
            <div className="lg:col-span-1">
              <div className="bg-white/10 backdrop-blur-sm rounded-3xl border border-white/20 p-8 h-full">
                <h4 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                  <Star className="w-5 h-5 text-yellow-400" />
                  Premium Features
                </h4>
                
                <div className="space-y-6 mb-8">
                  {HomepageAdditionalFeatures.map((feature, index) => (
                    <div key={index} className="flex items-start gap-4 p-4 bg-white/5 rounded-xl border border-white/10 hover:bg-white/10 transition-colors">
                      <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                        {feature.icon}
                      </div>
                      <div>
                        <h5 className="font-semibold text-white mb-1">{feature.title}</h5>
                        <p className="text-indigo-200/80 text-sm">{feature.description}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="space-y-4">
                  <h5 className="font-semibold text-indigo-300 text-sm uppercase tracking-wider">Advanced AI Features</h5>
                  {currentPlan.features.slice(5).map((feature:any, index:any) => (
                    <div key={index} className="flex items-center gap-3 p-2 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 rounded-lg border border-indigo-400/20">
                      <div className="w-2 h-2 rounded-full bg-indigo-400"></div>
                      <span className="text-indigo-100 text-sm font-medium">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Section - Bonus Features */}
          <div className="mt-12 grid md:grid-cols-2 gap-6">
            <div className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 backdrop-blur-sm rounded-2xl border border-green-400/30 p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                <h5 className="font-semibold text-green-100">Security & Compliance</h5>
              </div>
              <p className="text-green-200/80 text-sm mb-3">Enterprise-grade security with SSL encryption, daily automated backups, and SOC 2 compliance.</p>
              <div className="text-xs text-green-300 font-medium">✓ SSL Security ✓ Daily Backups ✓ SOC 2 Compliant</div>
            </div>
            
            <div className="bg-gradient-to-r from-blue-500/20 to-cyan-500/20 backdrop-blur-sm rounded-2xl border border-blue-400/30 p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-3 h-3 rounded-sm bg-blue-500"></div>
                <h5 className="font-semibold text-blue-100">Developer Tools</h5>
              </div>
              <p className="text-blue-200/80 text-sm mb-3">Full API access, webhooks, custom integrations, and comprehensive developer documentation.</p>
              <div className="text-xs text-blue-300 font-medium">✓ REST API ✓ Webhooks ✓ SDK Available</div>
            </div>
          </div>
        </div>
      </section>
    </div>

          {/* Value Proposition Section - Smooth transition: Building on the hero's promise */}
      <section className="relative z-10 container mx-auto px-6 py-16 md:py-24 bg-gradient-to-b from-transparent to-indigo-900/10">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-br from-white via-indigo-100 to-indigo-300 bg-clip-text text-transparent">
            Build Smarter, Not Harder
          </h2>
          <p className="text-lg text-indigo-200/80 mb-8 max-w-2xl mx-auto">
            In today's fast-paced world, manual database management slows you down. Our AI-driven platform automates the tedious tasks, so you can deliver features faster and scale with confidence.
          </p>
          <Button
            onClick={() => redirect('/signup')}
            className="group relative inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-[0_10px_30px_-10px_rgba(79,70,229,0.7)] transition-all hover:shadow-[0_20px_60px_-20px_rgba(79,70,229,0.9)] hover:scale-[1.02]"
          >
            Get Started Free
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </Button>
        </div>
      </section>

      {/* Local styles */}
      <style jsx>{`
        @keyframes orbit {
          from { transform: rotate(0deg) translateX(118px) rotate(0deg); }
          to   { transform: rotate(360deg) translateX(118px) rotate(-360deg); }
        }
        .animate-orbit {
          position: absolute;
          top: 50%;
          left: 50%;
          transform-origin: -118px 0;
          animation: orbit 8s linear infinite;
        }
      `}</style>
    </div>
  );
}