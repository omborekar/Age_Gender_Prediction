import React from 'react';

/* slim top bar – fixed */
const Header = ({ modelOnline, faceDetection }) => (
  <header className="fixed top-0 inset-x-0 z-50 h-14 flex items-center justify-between px-6
                     border-b border-white/[0.05] bg-bg/80 backdrop-blur-2xl">

    {/* Brand */}
    <div className="flex items-center gap-3">
      <div className="w-8 h-8 rounded-xl flex items-center justify-center
                      bg-cyan/10 border border-cyan/25 neon-cyan">
        <span className="mono text-cyan font-bold text-sm">Δ</span>
      </div>
      <div className="leading-tight">
        <span className="font-black text-white text-sm tracking-[0.12em]">AURA</span>
        <span className="font-black text-cyan text-sm tracking-[0.12em]">_AI</span>
        <p className="mono text-[9px] text-white/25 tracking-[0.25em] uppercase">Neural Vision v2</p>
      </div>
    </div>

    {/* Pills */}
    <div className="hidden sm:flex items-center gap-2">
      <Pill active={modelOnline} label="Model" />
      <Pill active={faceDetection} label="Face-Det" />
    </div>

    {/* Status dot */}
    <div className="flex items-center gap-2">
      <span className={`w-1.5 h-1.5 rounded-full ${modelOnline ? 'bg-cyan animate-pulse' : 'bg-yellow-400 animate-pulse'}`} />
      <span className="mono text-[10px] text-white/40 uppercase tracking-[0.2em]">
        {modelOnline === null ? 'Connecting…' : modelOnline ? 'Online' : 'Mock Mode'}
      </span>
    </div>
  </header>
);

const Pill = ({ active, label }) => (
  <span className={`mono text-[9px] px-3 py-1 rounded-full uppercase tracking-wider border transition-all
    ${active
      ? 'border-cyan/40 text-cyan bg-cyan/[0.08]'
      : active === false
      ? 'border-yellow-400/40 text-yellow-400/70 bg-yellow-400/[0.06]'
      : 'border-white/10 text-white/25 bg-white/[0.03]'}`}>
    {label}
  </span>
);

export default Header;
