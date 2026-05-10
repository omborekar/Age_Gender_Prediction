import React from 'react';

const Loader = () => (
  <div className="flex flex-col items-center justify-center py-12 gap-6">
    {/* Nested spinner */}
    <div className="relative w-20 h-20">
      {/* Outer glow ring */}
      <div className="absolute inset-0 rounded-full border border-cyan/10" />
      {/* Ring 1 */}
      <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-cyan animate-spin"
           style={{ animationDuration: '1s' }} />
      {/* Ring 2 */}
      <div className="absolute inset-[6px] rounded-full border-2 border-transparent border-b-purple animate-spin"
           style={{ animationDuration: '1.5s', animationDirection: 'reverse' }} />
      {/* Ring 3 */}
      <div className="absolute inset-3 rounded-full border border-transparent border-t-cyan/40 animate-spin"
           style={{ animationDuration: '0.8s' }} />
      {/* Core */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-3 h-3 rounded-full bg-cyan" style={{ boxShadow: '0 0 12px #00f2ff, 0 0 24px #00f2ff66' }} />
      </div>
    </div>

    <div className="text-center space-y-1">
      <p className="mono text-[10px] text-cyan tracking-[0.5em] uppercase animate-pulse">
        Decoding Biometrics
      </p>
      <p className="mono text-[9px] text-white/20 tracking-widest italic">
        running inference…
      </p>
    </div>
  </div>
);

export default Loader;
