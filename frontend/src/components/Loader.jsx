import React from 'react';

export default function Loader() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, padding: '40px 20px' }}>
      <div style={{ position: 'relative', width: 52, height: 52 }}>
        <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: '2px solid rgba(74,222,128,0.1)' }} />
        <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: '2px solid transparent', borderTop: '2px solid #4ade80', animation: 'spin 0.9s linear infinite' }} />
        <div style={{ position: 'absolute', inset: 6, borderRadius: '50%', border: '2px solid transparent', borderBottom: '2px solid #818cf8', animation: 'spin 1.4s linear infinite reverse' }} />
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#4ade80', boxShadow: '0 0 10px #4ade80' }} />
        </div>
      </div>
      <div style={{ textAlign: 'center' }}>
        <p style={{ fontSize: 11, fontFamily: 'JetBrains Mono, monospace', color: '#4ade80', textTransform: 'uppercase', letterSpacing: '0.3em' }}>Analyzing…</p>
        <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.2)', marginTop: 4, fontFamily: 'JetBrains Mono, monospace' }}>running inference</p>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
