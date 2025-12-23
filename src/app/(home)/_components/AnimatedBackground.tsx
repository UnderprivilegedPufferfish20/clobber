import FloatingElement from "./FloatingElement";

const AnimatedBackground = () => {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Floating orbs */}
      <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute top-3/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
      <div className="absolute bottom-1/4 left-1/3 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl animate-pulse delay-2000"></div>
      
      <div className="absolute inset-0 overflow-hidden">
        <FloatingElement delay={0}>
          <div className="absolute top-20 left-10 w-72 h-72 bg-indigo-500/15 rounded-full blur-3xl" />
        </FloatingElement>
        <FloatingElement delay={2}>
          <div className="absolute top-40 right-20 w-96 h-96 bg-purple-500/15 rounded-full blur-3xl" />
        </FloatingElement>
        <FloatingElement delay={4}>
          <div className="absolute bottom-16 left-1/3 w-80 h-80 bg-indigo-400/15 rounded-full blur-3xl" />
        </FloatingElement>

        {/* orbiting specs light */}
        <div className="absolute left-[-120px] top-1/3 h-[240px] w-[240px] rounded-full border border-indigo-500/20">
          <span className="block h-2 w-2 rounded-full bg-indigo-400 shadow-[0_0_10px_2px_rgba(99,102,241,0.8)] animate-orbit" />
        </div>
      </div>

      {/* Floating particles */}
      {[...Array(20)].map((_, i) => (
        <div
          key={i}
          className="absolute w-2 h-2 bg-indigo-400/30 rounded-full animate-float"
          style={{
            left: `${5}%`,
            top: `${12}%`,
            animationDelay: `${44}s`,
            animationDuration: `${12}s`
          }}
        ></div>
      ))}
      
      {/* Grid pattern */}
      <div className="absolute inset-0 bg-gradient-to-br from-transparent via-indigo-500/5 to-transparent">
        <div className="absolute inset-0" style={{
          backgroundImage: `
            linear-gradient(rgba(99, 102, 241, 0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(99, 102, 241, 0.1) 1px, transparent 1px)
          `,
          backgroundSize: '100px 100px',
        }}></div>
      </div>
    </div>
  );
};

export default AnimatedBackground;