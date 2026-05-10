import React, { useState } from 'react';
import Header from './components/Header';
import Home   from './pages/Home';

function App() {
  const [status, setStatus] = useState({ modelOnline: null, faceDetection: null });

  return (
    <div style={{ backgroundColor: '#07070f', minHeight: '100dvh', color: '#e2e8f0', position: 'relative' }}>

      {/* Ambient blobs */}
      <div aria-hidden="true" style={{ position: 'fixed', inset: 0, pointerEvents: 'none', overflow: 'hidden', zIndex: 0 }}>
        <div style={{
          position: 'absolute', top: '-20%', left: '-15%',
          width: '55vw', height: '55vw', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(0,242,255,0.06) 0%, transparent 70%)',
          filter: 'blur(60px)',
        }} />
        <div style={{
          position: 'absolute', bottom: '-20%', right: '-15%',
          width: '55vw', height: '55vw', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(124,58,237,0.05) 0%, transparent 70%)',
          filter: 'blur(60px)',
        }} />
        {/* Dot grid */}
        <div style={{
          position: 'absolute', inset: 0, opacity: 0.018,
          backgroundImage:
            'radial-gradient(circle, rgba(255,255,255,0.8) 1px, transparent 1px)',
          backgroundSize: '32px 32px',
        }} />
      </div>

      <div style={{ position: 'relative', zIndex: 1 }}>
        <Header
          modelOnline={status.modelOnline}
          faceDetection={status.faceDetection}
        />
        <Home onStatus={setStatus} />
      </div>
    </div>
  );
}

export default App;
