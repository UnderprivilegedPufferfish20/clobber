import { ArrowRight } from "lucide-react";

export default function FeatureCard(props: {  feature:any, delay:any }) {
  const { title, description } = props.feature;

  return (
    <div
      className="group relative rounded-3xl border border-indigo-500/20 bg-white/5 p-6 backdrop-blur shadow-[0_10px_30px_-10px_rgba(79,70,229,0.35)] hover:bg-white/10 transition-all duration-500"
      style={{
        animation: `fadeInUp 700ms ease forwards`,
        animationDelay: `${props.delay}ms`,
        opacity: 0
      }}
    >
      {/* conic glow border on hover */}
      <div
        aria-hidden
        className="pointer-events-none absolute -inset-[1px] rounded-3xl opacity-0 blur-[8px] transition-opacity duration-500 group-hover:opacity-100 bg-[conic-gradient(from_210deg_at_50%_50%,rgba(99,102,241,0.5)_0deg,rgba(99,102,241,0.15)_160deg,transparent_320deg)]"
      />

      {/* floating icon badge */}
      <div className="mb-4 inline-grid place-items-center">
        <div className="grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-600 shadow-[0_0_0_1px_rgba(255,255,255,0.15)_inset,0_18px_40px_-12px_rgba(79,70,229,0.9)] text-white transition-all duration-500 group-hover:scale-110 animate-floaty">
          <props.feature.icon className="h-7 w-7" />
        </div>
      </div>

      <h3 className="text-lg font-semibold tracking-tight text-white">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-indigo-200/85">{description}</p>

      {/* subtle divider */}
      <div className="mt-5 h-px w-full bg-gradient-to-r from-transparent via-indigo-500/30 to-transparent" />

      {/* hover CTA */}
      <div className="mt-4 flex items-center justify-between">
        <span className="text-[12px] text-indigo-300/80">Included in Premium</span>
        <span className="inline-flex items-center gap-1 rounded-lg border border-indigo-400/30 bg-indigo-500/10 px-2.5 py-1 text-[12px] text-indigo-200 transition-all hover:shadow-[0_10px_30px_-10px_rgba(79,70,229,0.8)] cursor-pointer">
          Learn more
          <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
        </span>
      </div>

      {/* extra background blob */}
      <div className="pointer-events-none absolute -top-10 -right-10 h-40 w-40 rounded-full bg-indigo-400/25 blur-2xl animate-blob" />
      
      <style jsx>{`
        @keyframes fadeInUp {
          0% {
            opacity: 0;
            transform: translateY(20px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes floaty {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-6px);
          }
        }
        
        @keyframes blob {
          0%, 100% {
            transform: translate(0, 0) scale(1);
          }
          33% {
            transform: translate(10px, -8px) scale(1.04);
          }
          66% {
            transform: translate(-8px, 6px) scale(0.98);
          }
        }
        
        .animate-floaty {
          animation: floaty 3.6s ease-in-out infinite;
        }
        
        .animate-blob {
          animation: blob 12s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}