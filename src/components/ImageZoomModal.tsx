import React, {useEffect, useState} from 'react';
import {
  ListOrdered,
  RotateCcw,
  X,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';

export interface ZoomModalData {
  imageUrl: string;
  secondaryImageUrl?: string;
  secondaryLabel?: string;
  primaryLabel?: string;
  title: string;
  subtitle?: string;
  authorLine?: string;
  explanation?: string;
  materials?: string[];
  steps?: string[];
}

interface ImageZoomModalProps {
  data: ZoomModalData | null;
  onClose: () => void;
}

export const ImageZoomModal: React.FC<ImageZoomModalProps> = ({
  data,
  onClose,
}) => {
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [showingSecondary, setShowingSecondary] = useState(false);

  useEffect(() => {
    setZoomLevel(1);
    setShowingSecondary(false);
  }, [data?.imageUrl, data?.title]);

  useEffect(() => {
    if (!data) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [data, onClose]);

  if (!data) return null;

  const activeUrl =
    showingSecondary && data.secondaryImageUrl
      ? data.secondaryImageUrl
      : data.imageUrl;

  const toggleZoom = () => {
    setZoomLevel((prev) => (prev === 1 ? 1.65 : prev < 2.2 ? 2.25 : 1));
  };

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-[#0b1c30]/80 backdrop-blur-sm p-3 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-label={`Visualização ampliada: ${data.title}`}
      onClick={onClose}
    >
      <div
        className="relative flex max-h-[94vh] w-full max-w-4xl flex-col overflow-hidden rounded-3xl bg-white shadow-[0_24px_64px_rgba(11,28,48,0.4)]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Bar with Zoom Controls */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#bccac0]/35 px-4 py-3 sm:px-6">
          <div className="min-w-0">
            <h2 className="text-sm sm:text-base font-extrabold text-[#0b1c30] truncate">
              {data.title}
            </h2>
            {(data.subtitle || data.authorLine) && (
              <p className="text-[11px] sm:text-xs text-[#6d7a72] truncate">
                {[data.subtitle, data.authorLine].filter(Boolean).join(' · ')}
              </p>
            )}
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => setZoomLevel((z) => Math.max(1, Number((z - 0.5).toFixed(2))))}
              disabled={zoomLevel <= 1}
              aria-label="Diminuir zoom"
              className="flex h-9 w-9 items-center justify-center rounded-full bg-[#eff4ff] text-[#006398] hover:bg-[#dce9ff] disabled:opacity-40"
            >
              <ZoomOut className="h-4 w-4" aria-hidden="true" />
            </button>
            <span className="min-w-[46px] text-center text-xs font-bold text-[#0b1c30] tabular-nums">
              {Math.round(zoomLevel * 100)}%
            </span>
            <button
              type="button"
              onClick={() => setZoomLevel((z) => Math.min(2.5, Number((z + 0.5).toFixed(2))))}
              disabled={zoomLevel >= 2.5}
              aria-label="Aumentar zoom"
              className="flex h-9 w-9 items-center justify-center rounded-full bg-[#eff4ff] text-[#006398] hover:bg-[#dce9ff] disabled:opacity-40"
            >
              <ZoomIn className="h-4 w-4" aria-hidden="true" />
            </button>
            {zoomLevel > 1 && (
              <button
                type="button"
                onClick={() => setZoomLevel(1)}
                aria-label="Redefinir zoom"
                className="flex h-9 w-9 items-center justify-center rounded-full bg-[#eff4ff] text-[#3d4a42] hover:bg-[#dce9ff]"
              >
                <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              aria-label="Fechar zoom"
              className="ml-1 flex h-9 w-9 items-center justify-center rounded-full bg-[#e6f7f1] text-[#006948] hover:bg-[#d1fae5]"
            >
              <X className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>
        </div>

        {/* Scrollable Content: Zoomable Image + Explanation */}
        <div className="overflow-y-auto p-4 sm:p-6 space-y-4">
          {data.secondaryImageUrl && (
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setShowingSecondary(false);
                  setZoomLevel(1);
                }}
                className={`min-h-[34px] rounded-full px-3.5 text-xs font-bold transition-colors ${
                  !showingSecondary
                    ? 'bg-[#006948] text-white'
                    : 'bg-[#eff4ff] text-[#3d4a42] hover:bg-[#dce9ff]'
                }`}
              >
                {data.primaryLabel || 'Peça pronta'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowingSecondary(true);
                  setZoomLevel(1);
                }}
                className={`min-h-[34px] rounded-full px-3.5 text-xs font-bold transition-colors ${
                  showingSecondary
                    ? 'bg-[#006398] text-white'
                    : 'bg-[#eff4ff] text-[#3d4a42] hover:bg-[#dce9ff]'
                }`}
              >
                {data.secondaryLabel || 'Material antes'}
              </button>
            </div>
          )}

          <div
            className={`flex max-h-[58vh] min-h-[260px] items-center justify-center rounded-2xl border border-[#bccac0]/40 bg-[#f1f5f9] p-3 ${
              zoomLevel > 1 ? 'overflow-auto' : 'overflow-hidden'
            }`}
          >
            <img
              src={activeUrl}
              alt={data.title}
              referrerPolicy="no-referrer"
              onClick={toggleZoom}
              title="Toque para alternar o zoom"
              style={{
                transform: `scale(${zoomLevel})`,
                transformOrigin: 'center center',
              }}
              className={`max-h-[52vh] max-w-full object-contain rounded-xl transition-transform duration-200 ${
                zoomLevel > 1 ? 'cursor-zoom-out' : 'cursor-zoom-in'
              }`}
            />
          </div>

          <p className="text-center text-[11px] text-[#6d7a72]">
            Toque na foto ou use os botões + / - acima para ampliar.
          </p>

          {(data.explanation ||
            (data.materials && data.materials.length > 0) ||
            (data.steps && data.steps.length > 0)) && (
            <div className="rounded-2xl bg-[#f8f9ff] border border-[#bccac0]/35 p-4 space-y-3">
              {data.explanation && (
                <div>
                  <p className="text-xs font-extrabold uppercase tracking-wide text-[#006398]">
                    Explicação de como fazer
                  </p>
                  <p className="mt-1 text-sm text-[#3d4a42] leading-relaxed">
                    {data.explanation}
                  </p>
                </div>
              )}

              {data.materials && data.materials.length > 0 && (
                <div>
                  <p className="text-xs font-extrabold text-[#006398] mb-1.5">
                    Materiais utilizados
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {data.materials.map((item, idx) => (
                      <span
                        key={`${item}-${idx}`}
                        className="rounded-full bg-white border border-[#bccac0]/40 px-3 py-1 text-xs font-medium text-[#3d4a42]"
                      >
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {data.steps && data.steps.length > 0 && (
                <div>
                  <p className="flex items-center gap-1.5 text-xs font-extrabold text-[#006948] mb-2">
                    <ListOrdered className="h-4 w-4" aria-hidden="true" />
                    <span>Passo a passo</span>
                  </p>
                  <ol className="space-y-1.5">
                    {data.steps.map((step, i) => (
                      <li
                        key={`${i}-${step.slice(0, 12)}`}
                        className="flex items-start gap-2.5 text-xs sm:text-sm text-[#3d4a42]"
                      >
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#d1fae5] text-[11px] font-bold text-[#006948] mt-0.5">
                          {i + 1}
                        </span>
                        <span className="leading-relaxed">{step}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
