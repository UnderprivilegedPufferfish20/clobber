"use client";

import Loader from "@/components/Loader";
import { Database, Sparkles, Server } from "lucide-react";

export default function loading() {
  return (
    <div className="fullscreen relative flex flex-1 items-center justify-center overflow-hidden bg-indigo-500">
      {/* Background gradients */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-40 -left-40 h-[520px] w-[520px] rounded-full bg-white/15 blur-3xl animate-[float_6s_ease-in-out_infinite]" />
        <div className="absolute -bottom-48 -right-48 h-[620px] w-[620px] rounded-full bg-black/20 blur-3xl animate-[float_7.5s_ease-in-out_infinite]" />
        <div className="absolute inset-0 opacity-25 [background-image:radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.35)_1px,transparent_0)] [background-size:22px_22px]" />
      </div>

      {/* Floating particles */}
      <div className="pointer-events-none absolute inset-0">
        {Array.from({ length: 10 }).map((_, i) => (
          <span
            key={i}
            className="absolute h-2 w-2 rounded-full bg-white/35 blur-[0.5px] animate-[particle_3.8s_ease-in-out_infinite]"
            style={{
              left: `${(i * 9 + 7) % 100}%`,
              top: `${(i * 13 + 11) % 100}%`,
              animationDelay: `${i * 0.25}s`,
            }}
          />
        ))}
      </div>

      {/* Center card */}
      <div className="relative flex flex-col items-center">
        {/* Rotating ring */}
        <div className="relative flex items-center justify-center">
          <div className="absolute h-[260px] w-[260px] rounded-full opacity-70 blur-[1px] animate-spin [animation-duration:2.6s] bg-[conic-gradient(from_180deg,rgba(255,255,255,0.0),rgba(255,255,255,0.75),rgba(255,255,255,0.0))]" />
          <div className="absolute h-[210px] w-[210px] rounded-full bg-white/10 backdrop-blur-md shadow-[0_0_60px_rgba(255,255,255,0.25)]" />
          <div className="relative z-10">
            <Loader sz={168} />
          </div>
        </div>

        {/* Label + icons */}
        <div className="mt-7 flex items-center gap-2 text-white">
          <Database className="h-5 w-5 opacity-90 animate-[bounceSoft_1.6s_ease-in-out_infinite]" />
          <span className="text-lg font-semibold tracking-wide animate-pulse">
            Loading database…
          </span>
          <Server className="h-5 w-5 opacity-90 animate-[bounceSoft_1.6s_ease-in-out_infinite] [animation-delay:0.2s]" />
        </div>

        <div className="mt-2 flex items-center gap-2 text-white/80 text-sm">
          <Sparkles className="h-4 w-4" />
          <span className="animate-[fadeUp_1.4s_ease-in-out_infinite]">
            Spinning up schemas & connections
          </span>
        </div>
      </div>

      {/* Local keyframes (no Tailwind config needed) */}
      <style jsx>{`
        @keyframes float {
          0%,
          100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(18px);
          }
        }
        @keyframes particle {
          0%,
          100% {
            transform: translateY(0px) scale(1);
            opacity: 0.25;
          }
          50% {
            transform: translateY(-16px) scale(1.35);
            opacity: 0.65;
          }
        }
        @keyframes bounceSoft {
          0%,
          100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-5px);
          }
        }
        @keyframes fadeUp {
          0%,
          100% {
            transform: translateY(0px);
            opacity: 0.7;
          }
          50% {
            transform: translateY(-4px);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}
