import React, { useRef, useEffect } from 'react';
import { ShieldCheck, User, Calendar, ScanFace, Zap, AlertCircle } from 'lucide-react';

/* Animated number */
const Num = ({ val, dec = 0, suffix = '' }) => {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    const to = parseFloat(val), dur = 650, t0 = performance.now();
    const go = (now) => {
      const p = Math.min((now - t0) / dur, 1);
      const e = 1 - (1 - p) ** 3;
      el.textContent = (to * e).toFixed(dec) + suffix;
      if (p < 1) requestAnimationFrame(go);
    };
    requestAnimationFrame(go);
  }, [val, dec, suffix]);
  return <span ref={ref}>0{suffix}</span>;
};

/* Confidence bar */
const Bar = ({ value }) => {
  const pct = Math.round(value * 100);
  const col = pct >= 80 ? '#4ade80' : pct >= 60 ? '#fb923c' : '#f87171';
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
        <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', fontFamily: 'JetBrains Mono, monospace', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Confidence</span>
        <span style={{ fontSize: 13, fontWeight: 700, color: col }}><Num val={pct} suffix="%" /></span>
      </div>
      <div className="conf-bar-track">
        <div className="conf-bar-fill" style={{ '--w': `${pct}%`, width: `${pct}%`, background: `linear-gradient(90deg, ${col}66, ${col})`, boxShadow: `0 0 8px ${col}55` }} />
      </div>
    </div>
  );
};

/* Age bracket */
const bracket = (a) =>
  a < 13 ? 'Child' : a < 20 ? 'Teenager' : a < 30 ? 'Young Adult' : a < 45 ? 'Adult' : a < 60 ? 'Middle-aged' : 'Senior';

export default function PredictionCard({ data }) {
  if (!data) return null;
  const { gender, gender_confidence, age, face_detected, mock } = data;
  const male = gender === 'Male';

  return (
    <div className="card slide-in" style={{ padding: 0, overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: 9, background: 'rgba(74,222,128,0.1)', border: '1px solid rgba(74,222,128,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ShieldCheck size={16} color="#4ade80" />
          </div>
          <div>
            <p style={{ fontWeight: 700, fontSize: 13, letterSpacing: '0.08em', color: '#e2e8f0' }}>PREDICTION RESULT</p>
            <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', fontFamily: 'JetBrains Mono, monospace' }}>Phase-1 CNN · UTKFace</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          {mock && <Badge label="MOCK" color="#fb923c" />}
          {face_detected !== undefined && (
            <Badge
              icon={<ScanFace size={10} />}
              label={face_detected ? 'Face OK' : 'Full Frame'}
              color={face_detected ? '#4ade80' : '#fb923c'}
            />
          )}
          <Badge icon={<Zap size={10} />} label="Live" color="#818cf8" pulse />
        </div>
      </div>

      {/* Stats */}
      <div style={{ padding: 20, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        {/* Gender */}
        <div className="card-inner" style={{ padding: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
            <User size={12} color="rgba(255,255,255,0.25)" />
            <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', fontFamily: 'JetBrains Mono, monospace', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Gender</span>
          </div>
          <p style={{ fontSize: 28, fontWeight: 900, color: male ? '#4ade80' : '#f472b6', lineHeight: 1, marginBottom: 6 }}>{gender}</p>
          <div style={{ height: 2, width: 28, borderRadius: 2, background: male ? '#4ade80' : '#f472b6', boxShadow: `0 0 8px ${male ? '#4ade80' : '#f472b6'}` }} />
        </div>

        {/* Age */}
        <div className="card-inner" style={{ padding: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
            <Calendar size={12} color="rgba(255,255,255,0.25)" />
            <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', fontFamily: 'JetBrains Mono, monospace', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Age</span>
          </div>
          <p style={{ fontSize: 28, fontWeight: 900, color: '#e2e8f0', lineHeight: 1, marginBottom: 4 }}>
            <Num val={Math.round(age)} /> <span style={{ fontSize: 13, fontWeight: 400, color: 'rgba(255,255,255,0.3)' }}>yr</span>
          </p>
          <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', fontFamily: 'JetBrains Mono, monospace' }}>{bracket(age)}</p>
        </div>
      </div>

      {/* Bar */}
      <div style={{ paddingInline: 20, paddingBottom: 20 }}>
        <Bar value={gender_confidence} />
      </div>

      {/* Footer */}
      <div style={{ padding: '10px 20px', borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.15)', fontFamily: 'JetBrains Mono, monospace' }}>best_model_phase1.keras</span>
        <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.15)', fontFamily: 'JetBrains Mono, monospace' }}>{new Date().toLocaleTimeString()}</span>
      </div>
    </div>
  );
}

const Badge = ({ icon, label, color, pulse = false }) => (
  <span style={{
    display: 'inline-flex', alignItems: 'center', gap: 4,
    padding: '3px 8px', borderRadius: 6,
    fontSize: 9, fontFamily: 'JetBrains Mono, monospace', textTransform: 'uppercase', letterSpacing: '0.1em',
    color, border: `1px solid ${color}44`, background: `${color}11`,
    animation: pulse ? 'none' : undefined,
  }}>
    {icon}{label}
  </span>
);
