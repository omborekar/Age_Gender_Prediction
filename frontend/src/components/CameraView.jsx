import React, { useRef, useCallback, useState, useEffect } from 'react';
import Webcam from 'react-webcam';
import { Camera, RefreshCw, Radio, AlertTriangle } from 'lucide-react';

const videoConstraints = { width: 1280, height: 720, facingMode: 'user' };

const CameraView = ({ onCapture, isProcessing, liveMode, lastFaceDetected }) => {
  const webcamRef = useRef(null);
  const [imgSrc,   setImgSrc]   = useState(null);
  const [camReady, setCamReady] = useState(false);
  const [camError, setCamError] = useState(false);

  const capture = useCallback(() => {
    if (!webcamRef.current) return;
    const src = webcamRef.current.getScreenshot({ width: 640, height: 480 });
    if (!src) return;
    if (!liveMode) setImgSrc(src);
    onCapture(src);
  }, [webcamRef, onCapture, liveMode]);

  /* Live mode interval */
  useEffect(() => {
    if (!liveMode) return;
    setImgSrc(null);
    const id = setInterval(capture, 2000);
    return () => clearInterval(id);
  }, [liveMode, capture]);

  const retake = () => setImgSrc(null);

  return (
    <div className="flex flex-col items-center gap-5 w-full">

      {/* ─── Viewfinder container ─── */}
      <div
        className="relative w-full rounded-2xl overflow-hidden glass neon-cyan animate-border"
        style={{ aspectRatio: '16/10', maxWidth: 640 }}
      >
        {/* Feed */}
        {!imgSrc ? (
          <Webcam
            audio={false}
            ref={webcamRef}
            screenshotFormat="image/jpeg"
            screenshotQuality={0.92}
            videoConstraints={videoConstraints}
            onUserMedia={() => { setCamReady(true); setCamError(false); }}
            onUserMediaError={() => { setCamReady(false); setCamError(true); }}
            className="w-full h-full object-cover"
            style={{ filter: 'brightness(0.88) saturate(1.1)' }}
          />
        ) : (
          <img src={imgSrc} alt="captured" className="w-full h-full object-cover" />
        )}

        {/* Scanline */}
        {!imgSrc && camReady && (
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div
              className="animate-scan absolute w-full"
              style={{ height: 2, background: 'linear-gradient(90deg,transparent,#00f2ff,transparent)', boxShadow: '0 0 12px #00f2ff' }}
            />
          </div>
        )}

        {/* Corner brackets */}
        {!imgSrc && camReady && (
          <div className="absolute inset-4 pointer-events-none">
            <div className="viewfinder-corner vc-tl" />
            <div className="viewfinder-corner vc-tr" />
            <div className="viewfinder-corner vc-bl" />
            <div className="viewfinder-corner vc-br" />

            {/* Face frame with badge */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-44 h-56">
              <div className="absolute inset-0 rounded-[50%] border border-cyan/20" />
              {lastFaceDetected !== null && (
                <div className="face-badge">
                  {lastFaceDetected ? 'Face Detected' : 'No Face – Full Frame'}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Top-left rec badge */}
        <div className="absolute top-3 left-4 flex items-center gap-2 pointer-events-none">
          {liveMode
            ? (<><span className="live-dot" /><span className="mono text-[9px] text-white/50 tracking-[0.2em] uppercase ml-2">Live</span></>)
            : camReady
            ? (<><span className="w-2 h-2 rounded-full bg-cyan/60 animate-pulse" /><span className="mono text-[9px] text-white/35 tracking-[0.15em] uppercase ml-1.5">Ready</span></>)
            : null
          }
        </div>

        {/* Bottom-right resolution */}
        {camReady && (
          <div className="absolute bottom-3 right-4 pointer-events-none">
            <span className="mono text-[9px] text-white/25 tracking-wider">1280×720</span>
          </div>
        )}

        {/* Processing overlay */}
        {isProcessing && !liveMode && (
          <div className="absolute inset-0 bg-bg/75 backdrop-blur-sm flex flex-col items-center justify-center gap-4">
            <div className="w-12 h-12 rounded-full border-2 border-cyan/20 relative">
              <div className="absolute inset-0 rounded-full border-2 border-t-cyan border-r-transparent border-b-transparent border-l-transparent animate-spin" />
            </div>
            <span className="mono text-[10px] text-cyan tracking-[0.4em] uppercase">Analyzing…</span>
          </div>
        )}

        {/* Camera error */}
        {camError && (
          <div className="absolute inset-0 bg-bg/90 flex flex-col items-center justify-center gap-3">
            <AlertTriangle className="w-8 h-8 text-yellow-400/60" />
            <p className="mono text-[10px] text-white/30 uppercase tracking-widest text-center px-8">
              Camera access denied<br /><span className="text-white/15">Enable permission in browser settings</span>
            </p>
          </div>
        )}
      </div>

      {/* ─── Controls ─── */}
      <div className="flex gap-3">
        {!liveMode ? (
          !imgSrc
            ? <button className="btn-primary" onClick={capture} disabled={isProcessing || !camReady}>
                <Camera className="w-4 h-4" /> Capture Identity
              </button>
            : <button className="btn-ghost" onClick={retake} disabled={isProcessing}>
                <RefreshCw className="w-4 h-4" /> Retake
              </button>
        ) : (
          <div className="flex items-center gap-3 px-8 py-3 rounded-full
                          border border-cyan/20 bg-cyan/[0.07] mono text-[11px] text-cyan tracking-widest uppercase">
            <Radio className="w-4 h-4 animate-pulse" /> Live Streaming
          </div>
        )}
      </div>
    </div>
  );
};

export default CameraView;
