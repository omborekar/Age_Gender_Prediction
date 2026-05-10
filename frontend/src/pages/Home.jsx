import React, { useState, useRef } from 'react';
import CameraView     from '../components/CameraView';
import PredictionCard from '../components/PredictionCard';
import Loader         from '../components/Loader';
import { getPrediction } from '../services/api';
import { Brain, ChevronDown, ChevronUp, History, X, Cpu, Database } from 'lucide-react';

const MAX_HISTORY = 6;

const Home = ({ onStatus }) => {
  const [prediction, setPrediction]     = useState(null);
  const [loading,    setLoading]        = useState(false);
  const [error,      setError]          = useState(null);
  const [liveMode,   setLiveMode]       = useState(false);
  const [history,    setHistory]        = useState([]);
  const [showHist,   setShowHist]       = useState(false);
  const [faceStatus, setFaceStatus]     = useState(null); // null | true | false
  const busyRef = useRef(false);

  const handleCapture = async (imageSrc) => {
    if (busyRef.current) return;
    busyRef.current = true;

    if (!liveMode) { setLoading(true); setPrediction(null); }
    setError(null);

    try {
      const blob = await fetch(imageSrc).then(r => r.blob());
      const data = await getPrediction(blob);

      setPrediction(data);
      setFaceStatus(data.face_detected ?? null);
      onStatus?.({ modelOnline: !data.mock, faceDetection: data.face_detected !== undefined });

      setHistory(h => [
        { ...data, ts: new Date().toLocaleTimeString() },
        ...h,
      ].slice(0, MAX_HISTORY));

    } catch (e) {
      console.error(e);
      if (!liveMode)
        setError('Cannot reach the backend. Make sure the Python server is running on port 8000.');
    } finally {
      setLoading(false);
      busyRef.current = false;
    }
  };

  return (
    <main className="min-h-screen flex flex-col items-center pt-24 pb-20 px-4 gap-14">

      {/* ── Hero ─────────────────────────────────────────────── */}
      <section className="text-center max-w-lg">
        <p className="mono text-[10px] text-cyan/50 tracking-[0.5em] uppercase mb-3">
          AI · Biometric · Decoding
        </p>
        <h1 className="text-[clamp(3rem,10vw,5.5rem)] font-black leading-[0.9] tracking-[-0.05em] gradient-title">
          NEURAL<br />DECODE
        </h1>
        <p className="mt-5 text-white/35 text-sm leading-relaxed">
          Haar-cascade face detection → 96 × 96 crop → Phase-1 CNN → instant prediction.
        </p>

        {/* Mode toggle */}
        <div className="flex items-center justify-center gap-4 mt-8">
          <span className={`mono text-[10px] uppercase tracking-[0.2em] transition-opacity ${liveMode ? 'opacity-30 text-white/50' : 'text-white/80'}`}>
            Manual
          </span>
          <button
            className={`toggle ${liveMode ? 'on' : ''}`}
            onClick={() => setLiveMode(v => !v)}
            aria-label="Toggle live mode"
          >
            <div className="toggle-knob" />
          </button>
          <span className={`mono text-[10px] uppercase tracking-[0.2em] transition-opacity ${!liveMode ? 'opacity-30 text-white/50' : 'text-cyan'}`}>
            Live
          </span>
        </div>
      </section>

      {/* ── Main grid ────────────────────────────────────────── */}
      <section className="w-full max-w-[1200px] grid grid-cols-1 xl:grid-cols-[640px_1fr] gap-8 items-start">

        {/* Camera column */}
        <CameraView
          onCapture={handleCapture}
          isProcessing={loading}
          liveMode={liveMode}
          lastFaceDetected={faceStatus}
        />

        {/* Results column */}
        <div className="flex flex-col gap-5">

          {/* Loading */}
          {loading && !liveMode && (
            <div className="glass neon-card">
              <Loader />
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="glass neon-card p-5 border border-red-500/25 animate-fade-up">
              <div className="flex gap-3">
                <div className="w-9 h-9 rounded-xl bg-red-500/10 flex-shrink-0 flex items-center justify-center">
                  <X className="w-4 h-4 text-red-400" />
                </div>
                <div>
                  <p className="font-bold text-red-400 text-xs uppercase tracking-wider mb-1">Connection Error</p>
                  <p className="text-white/35 text-xs leading-relaxed">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Prediction */}
          {prediction && (
            <PredictionCard
              prediction={prediction}
              isMock={prediction.mock}
              faceDetected={faceStatus}
            />
          )}

          {/* Idle placeholder */}
          {!loading && !prediction && !error && (
            <div className="glass neon-card p-10 flex flex-col items-center text-center gap-5 animate-fade-up">
              <div className="w-16 h-16 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center">
                <Brain className="w-7 h-7 text-white/12" />
              </div>
              <div className="space-y-1.5">
                <p className="mono text-[10px] text-white/20 uppercase tracking-[0.3em]">Awaiting Subject</p>
                <p className="mono text-[9px] text-white/12 tracking-wider">position face · press capture</p>
              </div>
              {/* Pipeline visual */}
              <div className="w-full pt-2 border-t border-white/[0.04]">
                <div className="flex items-center justify-center gap-1 flex-wrap">
                  {['Webcam', '→', 'Detect', '→', 'Crop', '→', '96×96', '→', 'Predict'].map((s, i) => (
                    <span key={i} className={`mono text-[8px] uppercase tracking-wider
                      ${s === '→' ? 'text-white/15' : 'text-cyan/30 px-2 py-0.5 rounded border border-cyan/[0.08] bg-cyan/[0.03]'}`}>
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* History */}
          {history.length > 0 && (
            <div className="glass neon-card overflow-hidden animate-fade-up">
              <button
                onClick={() => setShowHist(v => !v)}
                className="w-full flex items-center justify-between px-5 py-3.5
                           text-white/35 hover:text-white/60 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <History className="w-4 h-4" />
                  <span className="mono text-[10px] uppercase tracking-[0.2em]">
                    History ({history.length})
                  </span>
                </div>
                {showHist ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>

              {showHist && (
                <div className="border-t border-white/[0.05] divide-y divide-white/[0.04]">
                  {history.map((h, i) => (
                    <div key={i} className="flex items-center justify-between px-5 py-2.5 hover:bg-white/[0.02] transition-colors">
                      <div className="flex items-center gap-4">
                        <span className={`mono text-xs font-bold ${h.gender === 'Male' ? 'text-cyan' : 'text-pink-400'}`}>
                          {h.gender}
                        </span>
                        <span className="mono text-xs text-white/50">{Math.round(h.age)} yr</span>
                        <span className="mono text-[9px] text-white/25">{Math.round(h.gender_confidence * 100)}%</span>
                        {h.face_detected !== undefined && (
                          <span className={`mono text-[8px] ${h.face_detected ? 'text-cyan/40' : 'text-white/20'}`}>
                            {h.face_detected ? '⬡ face' : '⬡ full'}
                          </span>
                        )}
                      </div>
                      <span className="mono text-[9px] text-white/20">{h.ts}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Model metadata */}
          <div className="opacity-25 hover:opacity-60 transition-opacity duration-500">
            <div className="grid grid-cols-2 gap-x-6 gap-y-1.5">
              {[
                [Cpu,      'Backbone',  'MobileNetV2'],
                [Database, 'Dataset',   'UTKFace 24k'],
                [Brain,    'Input',     '96 × 96 px'],
                [Brain,    'Outputs',   'Gender + Age'],
              ].map(([Icon, k, v]) => (
                <div key={k} className="flex items-center gap-2">
                  <Icon className="w-3 h-3 text-white/20 flex-shrink-0" />
                  <span className="mono text-[9px] text-white/30 leading-relaxed">
                    <span className="text-white/15">{k}: </span>{v}
                  </span>
                </div>
              ))}
            </div>
          </div>

        </div>
      </section>
    </main>
  );
};

export default Home;
