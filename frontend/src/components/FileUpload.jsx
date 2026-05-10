import React, { useRef, useState } from 'react';
import { Upload, Image as ImageIcon, X } from 'lucide-react';

export default function FileUpload({ onFile, isProcessing }) {
  const inputRef  = useRef(null);
  const [preview, setPreview] = useState(null);
  const [drag,    setDrag]    = useState(false);

  const handle = (file) => {
    if (!file || !file.type.startsWith('image/')) return;
    const url = URL.createObjectURL(file);
    setPreview(url);
    onFile(file);
  };

  const onDrop = (e) => {
    e.preventDefault(); setDrag(false);
    handle(e.dataTransfer.files[0]);
  };

  const clear = () => { setPreview(null); inputRef.current.value = ''; };

  return (
    <div className="flex flex-col gap-3">
      {/* Drop zone */}
      <div
        className={`dropzone ${drag ? 'drag-over' : ''}`}
        style={{ width: 400, height: 300, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, position: 'relative', overflow: 'hidden' }}
        onClick={() => !preview && inputRef.current.click()}
        onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
        onDragLeave={() => setDrag(false)}
        onDrop={onDrop}
      >
        {preview ? (
          <>
            <img src={preview} alt="preview" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
            <button
              onClick={(e) => { e.stopPropagation(); clear(); }}
              style={{ position: 'absolute', top: 8, right: 8, background: 'rgba(0,0,0,0.7)', border: 'none', borderRadius: '50%', width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#fff' }}
            >
              <X size={14} />
            </button>
          </>
        ) : (
          <>
            <div style={{ width: 48, height: 48, borderRadius: 12, background: 'rgba(74,222,128,0.08)', border: '1px solid rgba(74,222,128,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Upload size={22} color="rgba(74,222,128,0.6)" />
            </div>
            <div style={{ textAlign: 'center' }}>
              <p style={{ fontSize: 14, fontWeight: 600, color: 'rgba(255,255,255,0.7)', marginBottom: 4 }}>
                Drop an image or <span style={{ color: '#4ade80', cursor: 'pointer' }}>browse</span>
              </p>
              <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', fontFamily: 'JetBrains Mono, monospace' }}>
                JPG · PNG · WEBP · up to 10MB
              </p>
            </div>
          </>
        )}
      </div>

      <input ref={inputRef} type="file" accept="image/*" style={{ display: 'none' }}
             onChange={e => handle(e.target.files[0])} />

      {/* Analyse button */}
      {preview && (
        <button className="btn-capture" style={{ width: '100%', justifyContent: 'center' }}
                disabled={isProcessing}
                onClick={() => inputRef.current && onFile(null) /* re-trigger handled in parent */}>
          <ImageIcon size={15} /> Analyse Image
        </button>
      )}
    </div>
  );
}
