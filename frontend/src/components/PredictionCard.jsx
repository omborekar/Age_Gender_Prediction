import React, { useRef, useEffect } from 'react';
import { User, Calendar, ShieldCheck, ScanFace, Zap } from 'lucide-react';

/* ─── Animated number ──────────────────────────────────────── */
const AnimatedNum = ({ value, decimals = 0, suffix = '' }) => {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const to  = parseFloat(value);
    const dur = 750;
    const t0  = performance.now();
    const tick = (now) => {
      const p  = Math.min((now - t0) / dur, 1);
      const ep = 1 - (1 - p) ** 3; // cubic ease-out
      el.textContent = (to * ep).toFixed(decimals) + suffix;
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [value, decimals, suffix]);
  return <span ref={ref}>0{suffix}</span>;
};

/* ─── Confidence bar ───────────────────────────────────────── */
const ConfBar = ({ value }) => {
  const pct   = Math.round(value * 100);
  const color = pct >= 80 ? '#00f2ff' : pct >= 55 ? '#f59e0b' : '#f43f5e';
  const label = pct >= 80 ? 'High' : pct >= 55 ? 'Medium' : 'Low';

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="mono text-[9px] text-white/30 uppercase tracking-[0.2em]">Confidence</span>
        <div className="flex items-center gap-2">
          <span className="mono text-[9px] uppercase tracking-wider" style={{ color, opacity: 0.7 }}>{label}</span>
          <span className="mono text-sm font-bold" style={{ color }}>
            <AnimatedNum value={pct} suffix="%" />
          </span>
        </div>
      </div>
      <div className="h-1.5 w-full bg-white/[0.06] rounded-full overflow-hidden">
        <div
          className="h-full rounded-full animate-bar"
          style={{
            '--w': `${pct}%`,
            width: `${pct}%`,
            background: `linear-gradient(90deg, ${color}55, ${color})`,
            boxShadow: `0 0 10px ${color}66`,
          }}
        />
      </div>
    </div>
  );
};

/* ─── Data tile ────────────────────────────────────────────── */
const Tile = ({ icon, label, children, accent = '#00f2ff' }) => (
  <div
    className="glass-inset p-4 flex flex-col gap-2 transition-all duration-300 hover:border-cyan/20"
    style={{ borderColor: 'rgba(255,255,255,0.05)' }}
  >
    <div className="flex items-center gap-1.5">
      <span style={{ color: `${accent}88` }}>{icon}</span>
      <span className="mono text-[9px] text-white/30 uppercase tracking-[0.2em]">{label}</span>
    </div>
    {children}
  </div>
);

/* ─── Age bracket helper ───────────────────────────────────── */
const ageBracket = (a) =>
  a < 13 ? 'Child' : a < 18 ? 'Teen' : a < 30 ? 'Young Adult' : a < 50 ? 'Adult' : a < 65 ? 'Middle-aged' : 'Senior';

/* ─── Main card ────────────────────────────────────────────── */
const PredictionCard = ({ prediction, isMock, faceDetected }) => {
  if (!prediction) return null;
  const { gender, gender_confidence, age } = prediction;
  const isMale = gender === 'Male';

  return (
    <div key={`${gender}-${age}`} className="glass neon-cyan w-full animate-fade-up">

      {/* Header bar */}
      <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-white/[0.06]">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-cyan/10 border border-cyan/20 flex items-center justify-center">
            <ShieldCheck className="w-4 h-4 text-cyan" />
          </div>
          <div>
            <p className="font-black text-sm tracking-wider uppercase glow-cyan">Identity_Data</p>
            <p className="mono text-[9px] text-white/25 tracking-widest">Decoded</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {faceDetected !== null && (
            <span className={`mono text-[8px] px-2 py-0.5 rounded-full border uppercase tracking-widest flex items-center gap-1
              ${faceDetected
                ? 'border-cyan/30 text-cyan bg-cyan/[0.07]'
                : 'border-yellow-400/30 text-yellow-400/80 bg-yellow-400/[0.06]'}`}>
              <ScanFace className="w-2.5 h-2.5" />
              {faceDetected ? 'Face OK' : 'Full Frame'}
            </span>
          )}
          {isMock && (
            <span className="mono text-[8px] px-2 py-0.5 rounded-full border border-yellow-400/30 text-yellow-400/80 bg-yellow-400/[0.06] uppercase tracking-widest">
              Mock
            </span>
          )}
          <span className="mono text-[8px] px-2 py-0.5 rounded-full border border-cyan/30 text-cyan bg-cyan/[0.07]
                           uppercase tracking-widest flex items-center gap-1 animate-pulse">
            <Zap className="w-2.5 h-2.5" /> Verified
          </span>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 p-5 pb-4">
        <Tile icon={<User className="w-3 h-3" />} label="Gender"
              accent={isMale ? '#00f2ff' : '#ec4899'}>
          <p className={`text-3xl font-black tracking-tight ${isMale ? 'text-cyan' : 'text-pink-400'}`}>
            {gender}
          </p>
          <div className={`h-px w-8 mt-1 ${isMale ? 'bg-cyan' : 'bg-pink-400'}`}
               style={{ boxShadow: isMale ? '0 0 8px #00f2ff' : '0 0 8px #ec4899' }} />
        </Tile>

        <Tile icon={<Calendar className="w-3 h-3" />} label="Age Estimate">
          <p className="text-3xl font-black text-white animate-count">
            <AnimatedNum value={Math.round(age)} />
            <span className="text-xs font-normal text-white/30 ml-1.5">yr</span>
          </p>
          <p className="mono text-[9px] text-white/25 mt-0.5">{ageBracket(age)}</p>
        </Tile>
      </div>

      {/* Confidence */}
      <div className="px-5 pb-5">
        <ConfBar value={gender_confidence} />
      </div>

      {/* Footer */}
      <div className="flex justify-between px-5 pb-4 pt-3 border-t border-white/[0.05]">
        <span className="mono text-[8px] text-white/15 italic">Phase1.keras · UTKFace</span>
        <span className="mono text-[8px] text-white/15 italic">{new Date().toLocaleTimeString()}</span>
      </div>
    </div>
  );
};

export default PredictionCard;
