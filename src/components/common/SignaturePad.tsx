import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Pen, Type, Upload, Eraser, Check, X } from 'lucide-react';

type SignatureMode = 'draw' | 'type' | 'upload';

interface SignaturePadProps {
  value?: string;
  onChange: (dataUrl: string) => void;
  onClear: () => void;
  className?: string;
}

const FONTS = [
  "'Dancing Script', cursive",
  "'Great Vibes', cursive",
  "'Caveat', cursive",
  "'Satisfy', cursive",
];

const SignaturePad: React.FC<SignaturePadProps> = ({ value, onChange, onClear, className = '' }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [mode, setMode] = useState<SignatureMode>('draw');
  const [isDrawing, setIsDrawing] = useState(false);
  const [typedName, setTypedName] = useState('');
  const [selectedFont, setSelectedFont] = useState(0);
  const [hasContent, setHasContent] = useState(!!value);

  // Load Google Fonts for typed signatures
  useEffect(() => {
    const link = document.createElement('link');
    link.href = 'https://fonts.googleapis.com/css2?family=Caveat:wght@600&family=Dancing+Script:wght@600&family=Great+Vibes&family=Satisfy&display=swap';
    link.rel = 'stylesheet';
    if (!document.querySelector(`link[href="${link.href}"]`)) {
      document.head.appendChild(link);
    }
  }, []);

  const getCtx = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    return { canvas, ctx };
  }, []);

  const clearCanvas = useCallback(() => {
    const cc = getCtx();
    if (!cc) return;
    cc.ctx.clearRect(0, 0, cc.canvas.width, cc.canvas.height);
    setHasContent(false);
  }, [getCtx]);

  // Drawing handlers
  const getPos = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    if ('touches' in e) {
      const t = e.touches[0];
      return { x: (t.clientX - rect.left) * scaleX, y: (t.clientY - rect.top) * scaleY };
    }
    return { x: (e.clientX - rect.left) * scaleX, y: (e.clientY - rect.top) * scaleY };
  };

  const startDraw = (e: React.MouseEvent | React.TouchEvent) => {
    if (mode !== 'draw') return;
    e.preventDefault();
    const cc = getCtx();
    if (!cc) return;
    setIsDrawing(true);
    const pos = getPos(e);
    cc.ctx.beginPath();
    cc.ctx.moveTo(pos.x, pos.y);
    cc.ctx.strokeStyle = '#1E3A5F';
    cc.ctx.lineWidth = 2.5;
    cc.ctx.lineCap = 'round';
    cc.ctx.lineJoin = 'round';
  };

  const moveDraw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing || mode !== 'draw') return;
    e.preventDefault();
    const cc = getCtx();
    if (!cc) return;
    const pos = getPos(e);
    cc.ctx.lineTo(pos.x, pos.y);
    cc.ctx.stroke();
    setHasContent(true);
  };

  const endDraw = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
  };

  // Type signature on canvas
  useEffect(() => {
    if (mode !== 'type' || !typedName) return;
    const cc = getCtx();
    if (!cc) return;
    cc.ctx.clearRect(0, 0, cc.canvas.width, cc.canvas.height);
    cc.ctx.fillStyle = '#1E3A5F';
    cc.ctx.font = `36px ${FONTS[selectedFont]}`;
    cc.ctx.textAlign = 'center';
    cc.ctx.textBaseline = 'middle';
    cc.ctx.fillText(typedName, cc.canvas.width / 2, cc.canvas.height / 2);
    setHasContent(true);
  }, [mode, typedName, selectedFont, getCtx]);

  const handleSave = () => {
    const canvas = canvasRef.current;
    if (!canvas || !hasContent) return;
    const dataUrl = canvas.toDataURL('image/png');
    onChange(dataUrl);
  };

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      return;
    }

    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      const img = new Image();
      img.onload = () => {
        const cc = getCtx();
        if (!cc) return;
        cc.ctx.clearRect(0, 0, cc.canvas.width, cc.canvas.height);
        const scale = Math.min(cc.canvas.width / img.width, cc.canvas.height / img.height) * 0.8;
        const w = img.width * scale;
        const h = img.height * scale;
        cc.ctx.drawImage(img, (cc.canvas.width - w) / 2, (cc.canvas.height - h) / 2, w, h);
        setHasContent(true);
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  };

  const handleClear = () => {
    clearCanvas();
    setTypedName('');
    onClear();
  };

  return (
    <div className={`rounded-xl border border-slate-200 bg-white overflow-hidden ${className}`}>
      {/* Mode Switcher */}
      <div className="flex border-b border-slate-100">
        {([
          { mode: 'draw' as SignatureMode, icon: Pen, label: 'Draw' },
          { mode: 'type' as SignatureMode, icon: Type, label: 'Type' },
          { mode: 'upload' as SignatureMode, icon: Upload, label: 'Upload' },
        ]).map(m => (
          <button
            key={m.mode}
            onClick={() => { setMode(m.mode); clearCanvas(); }}
            className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors ${
              mode === m.mode
                ? 'bg-[#1E3A5F] text-white'
                : 'text-slate-500 hover:bg-slate-50'
            }`}
          >
            <m.icon className="w-4 h-4" />
            {m.label}
          </button>
        ))}
      </div>

      {/* Canvas Area */}
      <div className="relative p-4">
        {value && !hasContent ? (
          <div className="flex flex-col items-center justify-center h-[150px]">
            <img src={value} alt="Signature" className="max-h-[120px] max-w-full object-contain" />
            <p className="text-xs text-slate-400 mt-2">Current signature</p>
          </div>
        ) : (
          <>
            <canvas
              ref={canvasRef}
              width={500}
              height={150}
              className="w-full border border-dashed border-slate-200 rounded-lg bg-slate-50/50 cursor-crosshair touch-none"
              style={{ height: '150px' }}
              onMouseDown={startDraw}
              onMouseMove={moveDraw}
              onMouseUp={endDraw}
              onMouseLeave={endDraw}
              onTouchStart={startDraw}
              onTouchMove={moveDraw}
              onTouchEnd={endDraw}
            />
            {!hasContent && mode === 'draw' && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <p className="text-sm text-slate-300 mt-4">Draw your signature here</p>
              </div>
            )}
          </>
        )}

        {/* Typed signature input */}
        {mode === 'type' && (
          <div className="mt-3 space-y-2">
            <Input
              value={typedName}
              onChange={e => setTypedName(e.target.value)}
              placeholder="Type your full name"
              className="text-center text-lg"
            />
            <div className="flex gap-2 justify-center">
              {FONTS.map((font, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedFont(i)}
                  className={`px-3 py-1 text-sm rounded-lg border ${
                    selectedFont === i
                      ? 'border-[#1E3A5F] bg-[#1E3A5F]/5 text-[#1E3A5F]'
                      : 'border-slate-200 text-slate-500 hover:border-slate-300'
                  }`}
                  style={{ fontFamily: font }}
                >
                  Aa
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Upload input */}
        {mode === 'upload' && (
          <div className="mt-3">
            <label className="flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 border-dashed border-slate-200 hover:border-emerald-400 cursor-pointer transition-colors">
              <Upload className="w-5 h-5 text-slate-400" />
              <span className="text-sm text-slate-500">Click to upload signature image (PNG, JPG, max 2MB)</span>
              <input type="file" accept="image/*" onChange={handleUpload} className="hidden" />
            </label>
          </div>
        )}
      </div>

      {/* IT Act Disclaimer */}
      <div className="px-4 pb-2">
        <p className="text-[10px] text-slate-400 leading-tight">
          Electronic signatures via OkeBill are recognized under Section 5, Information Technology Act, 2000.
          By signing, you confirm this is your authorized signatory mark.
        </p>
      </div>

      {/* Actions */}
      <div className="flex gap-2 p-4 pt-0">
        <Button variant="outline" size="sm" onClick={handleClear} className="gap-1 flex-1">
          <Eraser className="w-3.5 h-3.5" /> Clear
        </Button>
        <Button size="sm" onClick={handleSave} disabled={!hasContent} className="gap-1 flex-1 bg-[#1E3A5F] hover:bg-[#16304d]">
          <Check className="w-3.5 h-3.5" /> Save Signature
        </Button>
      </div>
    </div>
  );
};

export default SignaturePad;
