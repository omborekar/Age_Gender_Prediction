import React, { useRef, useCallback, useState, useEffect } from 'react';
import Webcam from 'react-webcam';
import { Camera, RefreshCw, Video, WifiOff } from 'lucide-react';
import { detectFaces } from '../services/api';

const videoConstraints = { width: 640, height: 480, facingMode: 'user' };

export default function CameraView({ onCapture, isProcessing, liveMode }) {
  const webcamRef  = useRef(null);
  const canvasRef  = useRef(null);
  const detectRef  = useRef(null); // interval for face detection
  const [imgSrc,   setImgSrc]   = useState(null);
  const [ready,    setReady]    = useState(false);
  const [camErr,   setCamErr]   = useState(false);
  const [faces,    setFaces]    = useState([]); // [{x,y,w,h} normalised]

  /* ─── Draw green boxes on overlay canvas ─────────────────────── */
  const drawBoxes = useCallback((faceList) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (!faceList.length) return;

    ctx.strokeStyle = '#4ade80';
    ctx.lineWidth   = 2;
    ctx.font        = 'bold 11px "JetBrains Mono", monospace';
    ctx.fillStyle   = '#4ade80';

    faceList.forEach(({ x, y, w, h }) => {
      const rx = x * canvas.width;
      const ry = y * canvas.height;
      const rw = w * canvas.width;
      const rh = h * canvas.height;

      /* Box */
      ctx.strokeRect(rx, ry, rw, rh);

      /* Corner accents */
      const c = 12;
      ctx.lineWidth = 3;
      // top-left
      ctx.beginPath(); ctx.moveTo(rx, ry + c); ctx.lineTo(rx, ry); ctx.lineTo(rx + c, ry); ctx.stroke();
      // top-right
      ctx.beginPath(); ctx.moveTo(rx + rw - c, ry); ctx.lineTo(rx + rw, ry); ctx.lineTo(rx + rw, ry + c); ctx.stroke();
      // bottom-left
      ctx.beginPath(); ctx.moveTo(rx, ry + rh - c); ctx.lineTo(rx, ry + rh); ctx.lineTo(rx + c, ry + rh); ctx.stroke();
      // bottom-right
      ctx.beginPath(); ctx.moveTo(rx + rw - c, ry + rh); ctx.lineTo(rx + rw, ry + rh); ctx.lineTo(rx + rw, ry + rh - c); ctx.stroke();
      ctx.lineWidth = 2;

      /* Label */
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(rx, ry - 18, 66, 18);
      ctx.fillStyle = '#4ade80';
      ctx.fillText('FACE', rx + 4, ry - 4);
    });
  }, []);

  /* ─── Face detection poll (every 600ms when cam is ready) ────── */
  useEffect(() => {
    if (!ready || imgSrc) { setFaces([]); drawBoxes([]); return; }

    const detect = async () => {
      try {
        const wc = webcamRef.current;
        if (!wc) return;
        const src = wc.getScreenshot({ width: 320, height: 240 });
        if (!src) return;
        const blob = await fetch(src).then(r => r.blob());
        const res  = await detectFaces(blob);
        setFaces(res.faces || []);
        drawBoxes(res.faces || []);
      } catch { /* backend might not be up yet */ }
    };

    detectRef.current = setInterval(detect, 600);
    return () => clearInterval(detectRef.current);
  }, [ready, imgSrc, drawBoxes]);

  /* ─── Live capture interval ─────────────────────────────────── */
  const captureFrame = useCallback(() => {
    const wc = webcamRef.current;
    if (!wc) return;
    const src = wc.getScreenshot();
    if (!src) return;
    if (!liveMode) setImgSrc(src);
    onCapture(src);
  }, [onCapture, liveMode]);

  useEffect(() => {
    if (!liveMode) return;
    setImgSrc(null);
    const id = setInterval(captureFrame, 2500);
    return () => clearInterval(id);
  }, [liveMode, captureFrame]);

  const retake = () => { setImgSrc(null); setFaces([]); };

  return (
    <div className="flex flex-col gap-3">
      {/* Viewfinder */}
      <div className="relative rounded-xl overflow-hidden" style={{ width: 400, height: 300, background: '#0c0c14', border: '1px solid rgba(255,255,255,0.1)' }}>

        {!imgSrc && (
          <Webcam
            audio={false}
            ref={webcamRef}
            screenshotFormat="image/jpeg"
            screenshotQuality={0.9}
            videoConstraints={videoConstraints}
            onUserMedia={() => { setReady(true); setCamErr(false); }}
            onUserMediaError={() => { setReady(false); setCamErr(true); }}
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          />
        )}

        {imgSrc && (
          <img src={imgSrc} alt="captured" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
        )}

        {/* Canvas overlay for face boxes */}
        {!imgSrc && (
          <canvas
            ref={canvasRef}
            width={400}
            height={300}
            style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}
          />
        )}

        {/* Top-left status badge */}
        <div style={{ position: 'absolute', top: 8, left: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
          {liveMode ? (
            <span style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '3px 8px', background: 'rgba(0,0,0,0.65)', borderRadius: 6, fontSize: 10, color: '#f43f5e', fontFamily: 'JetBrains Mono, monospace', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              <span style={{ position: 'relative', width: 7, height: 7, borderRadius: '50%', background: '#f43f5e', display: 'inline-block' }}>
                <span className="live-ring" />
              </span>
              Live
            </span>
          ) : ready ? (
            <span style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '3px 8px', background: 'rgba(0,0,0,0.6)', borderRadius: 6, fontSize: 10, color: '#4ade80', fontFamily: 'JetBrains Mono, monospace', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              <Video size={10} /> Cam Ready
            </span>
          ) : null}
        </div>

        {/* Face count badge */}
        {faces.length > 0 && !imgSrc && (
          <div style={{ position: 'absolute', top: 8, right: 8, padding: '3px 8px', background: 'rgba(74,222,128,0.2)', border: '1px solid rgba(74,222,128,0.5)', borderRadius: 6, fontSize: 10, color: '#4ade80', fontFamily: 'JetBrains Mono, monospace' }}>
            {faces.length} face{faces.length > 1 ? 's' : ''}
          </div>
        )}

        {/* Processing overlay */}
        {isProcessing && !liveMode && (
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(12,12,20,0.8)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
            <div style={{ width: 36, height: 36, borderRadius: '50%', border: '2px solid rgba(74,222,128,0.2)', borderTop: '2px solid #4ade80', animation: 'spin 0.9s linear infinite' }} />
            <span style={{ fontSize: 10, color: '#4ade80', fontFamily: 'JetBrains Mono, monospace', textTransform: 'uppercase', letterSpacing: '0.3em' }}>Analyzing…</span>
          </div>
        )}

        {/* Camera error */}
        {camErr && (
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(12,12,20,0.95)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            <WifiOff size={28} color="rgba(255,255,255,0.2)" />
            <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', textAlign: 'center', padding: '0 20px', fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.05em' }}>Camera permission denied</p>
          </div>
        )}

        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>

      {/* Controls */}
      <div style={{ display: 'flex', gap: 8 }}>
        {!liveMode ? (
          !imgSrc ? (
            <button className="btn-capture" onClick={captureFrame} disabled={isProcessing || !ready}>
              <Camera size={15} /> Capture
            </button>
          ) : (
            <button className="btn-secondary" onClick={retake}>
              <RefreshCw size={14} /> Retake
            </button>
          )
        ) : (
          <span style={{ fontSize: 12, color: '#f43f5e', fontFamily: 'JetBrains Mono, monospace', padding: '11px 0', letterSpacing: '0.05em' }}>
            ● Streaming every 2.5s…
          </span>
        )}
      </div>
    </div>
  );
}
