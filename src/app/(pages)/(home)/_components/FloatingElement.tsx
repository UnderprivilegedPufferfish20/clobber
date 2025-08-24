'use client'

import React from 'react'

const FloatingElement = ({ children, delay = 0 }: { children: React.ReactNode, delay: number }) => {
  return (
    <div 
      className="animate-pulse"
      style={{
        animation: `float 6s ease-in-out infinite`,
        animationDelay: `${delay}s`
      }}
    >
      {children}
      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(3deg); }
        }
      `}</style>
    </div>
  );
};

export default FloatingElement