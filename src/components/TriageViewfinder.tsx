import React, {useEffect, useRef, useState} from 'react';
import {
  AlertTriangle,
  Camera,
  CheckCircle2,
  MapPin,
  Palette,
  ScanLine,
  Sparkles,
  Upload,
  VideoOff,
  XCircle,
} from 'lucide-react';
import {DROP_OFF_POINTS, TRIAGE_CATALOG} from '../data/ecoSeedData';
import {MaterialType, TriageMaterialItem} from '../types/eco';
import {EcoIllustration} from './EcoIllustrations';
import {compressImageFile} from '../utils/imageUpload';
import {analyzeTriageWithAI} from '../services/ecoRepository';

interface TriageViewfinderProps {
  onCreatePostWithMaterial: (item: TriageMaterialItem) => void;
  onOpenDropOffMap: (
    material: Exclude<MaterialType, MaterialType.ALL>,
    pointId?: string,
  ) => void;
}

export const TriageViewfinder: React.FC<TriageViewfinderProps> = ({
  onCreatePostWithMaterial,
  onOpenDropOffMap,
}) => {
  const [selectedItem, setSelectedItem] = useState<TriageMaterialItem>(
    TRIAGE_CATALOG[0],
  );
  const [uploadedPreview, setUploadedPreview] = useState<string | null>(null);
  const [uploadedName, setUploadedName] = useState<string>('');
  const [showPhotoInViewer, setShowPhotoInViewer] = useState<boolean>(true);
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [isAnalyzingAi, setIsAnalyzingAi] = useState<boolean>(false);
  const [aiResultLabel, setAiResultLabel] = useState<string>('');
  const [aiQuickTip, setAiQuickTip] = useState<string>('');
  const [cameraActive, setCameraActive] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string>('');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraCaptureInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const detailsRef = useRef<HTMLElement>(null);

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  };

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  const triggerLockAnimation = () => {
    setIsScanning(true);
    window.setTimeout(() => setIsScanning(false), 550);
  };

  const handleSelectItem = (
    item: TriageMaterialItem,
    opts?: {fromUserClick?: boolean},
  ) => {
    setSelectedItem(item);
    triggerLockAnimation();
    if (opts?.fromUserClick && uploadedPreview) {
      setShowPhotoInViewer(false);
    }
    if (opts?.fromUserClick && detailsRef.current) {
      detailsRef.current.scrollIntoView({behavior: 'smooth', block: 'nearest'});
    }
  };

  const identifyImageWithAI = async (dataUrl: string, fileName?: string) => {
    setIsAnalyzingAi(true);
    setAiResultLabel('');
    setAiQuickTip('');
    try {
      const result = await analyzeTriageWithAI(dataUrl);
      const found =
        TRIAGE_CATALOG.find((item) => item.id === result.catalogId) ||
        TRIAGE_CATALOG[0];
      setSelectedItem(found);
      setAiResultLabel(result.detectedLabel);
      setAiQuickTip(result.quickTip);
      triggerLockAnimation();
    } catch {
      if (fileName) {
        const lower = fileName.toLowerCase();
        const matched = TRIAGE_CATALOG.find((item) => {
          if (
            lower.includes('pet') ||
            lower.includes('garrafa') ||
            lower.includes('plast')
          ) {
            return item.id === 'tr-pet';
          }
          if (lower.includes('lata') || lower.includes('alumin')) {
            return item.id === 'tr-alu';
          }
          if (lower.includes('vidro') || lower.includes('pote')) {
            return item.id === 'tr-glass';
          }
          if (lower.includes('caixa') || lower.includes('papel')) {
            return item.id === 'tr-cardboard';
          }
          if (
            lower.includes('cafe') ||
            lower.includes('casca') ||
            lower.includes('organ')
          ) {
            return item.id === 'tr-organic';
          }
          return false;
        });
        if (matched) setSelectedItem(matched);
      }
    } finally {
      setIsAnalyzingAi(false);
    }
  };

  const handleToggleCamera = async () => {
    if (cameraActive) {
      stopCamera();
      return;
    }
    setCameraError('');
    if (!navigator.mediaDevices?.getUserMedia) {
      cameraCaptureInputRef.current?.click();
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {facingMode: 'environment'},
        audio: false,
      });
      streamRef.current = stream;
      setCameraActive(true);
      setUploadedPreview(null);
      setShowPhotoInViewer(true);
      triggerLockAnimation();
      window.setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      }, 60);
    } catch {
      setCameraError(
        'Não foi possível abrir a câmera ao vivo neste navegador. Use o botão abaixo para abrir a câmera do aparelho ou escolher uma foto.',
      );
    }
  };

  const handleCaptureCameraFrame = () => {
    const video = videoRef.current;
    if (!video || video.videoWidth === 0 || video.videoHeight === 0) {
      return;
    }
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
    stopCamera();
    setUploadedPreview(dataUrl);
    setUploadedName('Captura da câmera');
    setShowPhotoInViewer(true);
    void identifyImageWithAI(dataUrl);
  };

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    stopCamera();
    setCameraError('');

    try {
      const compressed = await compressImageFile(file);
      setUploadedName(file.name);
      setUploadedPreview(compressed);
      setShowPhotoInViewer(true);
      triggerLockAnimation();
      void identifyImageWithAI(compressed, file.name);
    } catch (err) {
      setCameraError(
        err instanceof Error ? err.message : 'Erro ao carregar a imagem.',
      );
    } finally {
      event.target.value = '';
    }
  };

  const nearestPoint =
    DROP_OFF_POINTS.find((p) => p.id === selectedItem.nearestDropOffId) ||
    DROP_OFF_POINTS[0];

  const isRecyclable = selectedItem.recyclable === 'Reciclável';
  const isCompostable = selectedItem.recyclable === 'Compostável';

  return (
    <div className="space-y-6">
      <section className="eco-card rounded-3xl p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-[#0b1c30]">
              Scanner & Guia de Triagem
            </h1>
            <p className="mt-1 text-sm text-[#3d4a42]">
              Use a câmera, envie uma foto ou selecione um material abaixo para conferir classificação, preparo e descarte.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={(e) => void handleFileChange(e)}
              className="hidden"
              id="triage-photo-upload"
            />
            <input
              ref={cameraCaptureInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={(e) => void handleFileChange(e)}
              className="hidden"
              id="triage-camera-capture"
            />
            <button
              type="button"
              onClick={() => void handleToggleCamera()}
              className={`inline-flex min-h-[40px] items-center gap-1.5 rounded-full px-3.5 py-2 text-xs font-bold whitespace-nowrap shrink-0 transition-colors ${
                cameraActive
                  ? 'bg-[#ba1a1a] text-white'
                  : 'bg-[#eff4ff] text-[#006398] hover:bg-[#dce9ff]'
              }`}
            >
              {cameraActive ? (
                <>
                  <VideoOff className="h-4 w-4" aria-hidden="true" />
                  <span>Parar câmera</span>
                </>
              ) : (
                <>
                  <Camera className="h-4 w-4" aria-hidden="true" />
                  <span>Usar câmera</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex min-h-[40px] items-center gap-1.5 rounded-full bg-[#e0f2fe] px-3.5 py-2 text-xs font-bold text-[#0284c7] hover:bg-[#cce5ff] whitespace-nowrap shrink-0 transition-colors"
            >
              <Upload className="h-4 w-4" aria-hidden="true" />
              <span>Enviar foto</span>
            </button>
          </div>
        </div>

        {cameraError && (
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-2xl bg-[#fef3c7] px-4 py-2.5 text-xs font-semibold text-[#92400e]">
            <span>{cameraError}</span>
            <button
              type="button"
              onClick={() => cameraCaptureInputRef.current?.click()}
              className="inline-flex min-h-[34px] items-center gap-1.5 rounded-full bg-[#006398] px-3.5 text-xs font-bold text-white hover:bg-[#004f7a]"
            >
              <Camera className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Abrir câmera do aparelho</span>
            </button>
          </div>
        )}

        {/* Ecological Glass Scanner Viewfinder Frame */}
        <div className="relative overflow-hidden rounded-3xl bg-[#0b1c30] p-3 sm:p-4">
          <div className="relative overflow-hidden rounded-2xl bg-[#0f243d]">
            {cameraActive ? (
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="h-72 sm:h-80 w-full object-cover bg-[#0b1c30]"
              />
            ) : (
              <EcoIllustration
                theme={selectedItem.illustration}
                customImageUrl={
                  showPhotoInViewer && uploadedPreview
                    ? uploadedPreview
                    : undefined
                }
                alt={selectedItem.name}
                className={
                  showPhotoInViewer && uploadedPreview
                    ? 'min-h-[270px] sm:min-h-[320px] w-full'
                    : 'h-68 sm:h-80 w-full'
                }
              />
            )}

            {/* Translucent dark perimeter scrim */}
            <div
              className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#0b1c30]/80 via-transparent to-[#0b1c30]/35"
              aria-hidden="true"
            />

            {/* Top Floating Glass Material Grade + Capture / Scan Button */}
            <div className="absolute inset-x-3.5 top-3.5 flex flex-wrap items-center justify-between gap-2">
              <span className="eco-glass rounded-full px-3 py-1.5 text-[11px] font-bold text-[#0b1c30] shadow-sm">
                {isAnalyzingAi
                  ? 'Identificando material com IA...'
                  : aiResultLabel
                    ? `IA detectou: ${aiResultLabel}`
                    : selectedItem.materialGrade}
              </span>

              {cameraActive ? (
                <button
                  type="button"
                  onClick={handleCaptureCameraFrame}
                  className="inline-flex items-center gap-1.5 rounded-full bg-[#10b981] px-3.5 py-1.5 text-xs font-bold text-white shadow-md hover:bg-[#059669] transition-colors"
                >
                  <Camera className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>Capturar e identificar</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    if (uploadedPreview) {
                      void identifyImageWithAI(uploadedPreview, uploadedName);
                    } else {
                      triggerLockAnimation();
                    }
                  }}
                  disabled={isAnalyzingAi}
                  className="inline-flex items-center gap-1.5 rounded-full bg-[#10b981] px-3 py-1.5 text-[11px] font-bold text-white shadow-md hover:bg-[#059669] transition-colors disabled:opacity-60"
                >
                  <ScanLine className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>
                    {isAnalyzingAi
                      ? 'Analisando...'
                      : uploadedPreview
                        ? 'Reanalisar foto com IA'
                        : isScanning
                          ? 'Analisando...'
                          : 'Recalibrar foco'}
                  </span>
                </button>
              )}
            </div>

            {/* Dynamic Targeting Reticle Bracket */}
            <div
              className={`pointer-events-none absolute inset-x-10 inset-y-12 sm:inset-x-16 sm:inset-y-14 transition-transform duration-300 ${
                isScanning || isAnalyzingAi ? 'scale-[0.9]' : 'scale-100'
              }`}
              aria-hidden="true"
            >
              <span className="absolute top-0 left-0 h-8 w-8 rounded-tl-xl border-t-3 border-l-3 border-[#10b981] shadow-[0_0_12px_rgba(16,185,129,0.75)]" />
              <span className="absolute top-0 right-0 h-8 w-8 rounded-tr-xl border-t-3 border-r-3 border-[#10b981] shadow-[0_0_12px_rgba(16,185,129,0.75)]" />
              <span className="absolute bottom-0 left-0 h-8 w-8 rounded-bl-xl border-b-3 border-l-3 border-[#10b981] shadow-[0_0_12px_rgba(16,185,129,0.75)]" />
              <span className="absolute bottom-0 right-0 h-8 w-8 rounded-br-xl border-b-3 border-r-3 border-[#10b981] shadow-[0_0_12px_rgba(16,185,129,0.75)]" />
            </div>

            {/* Floating Glass Identification Plate */}
            <div className="mt-2 sm:mt-0 sm:absolute sm:inset-x-3.5 sm:bottom-3.5 eco-glass rounded-2xl p-3.5 sm:p-4 shadow-lg">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold text-[#3d4a42]">
                    {selectedItem.material}
                    {uploadedName ? ` · Foto: ${uploadedName}` : ''}
                  </p>
                  <h2 className="text-sm sm:text-base font-extrabold text-[#0b1c30] truncate">
                    {selectedItem.name}
                  </h2>
                </div>

                <div className="flex items-center gap-1.5 text-xs font-bold shrink-0">
                  {isRecyclable ? (
                    <CheckCircle2 className="h-4 w-4 text-[#059669]" aria-hidden="true" />
                  ) : isCompostable ? (
                    <Sparkles className="h-4 w-4 text-[#15803d]" aria-hidden="true" />
                  ) : (
                    <XCircle className="h-4 w-4 text-[#ba1a1a]" aria-hidden="true" />
                  )}
                  <span
                    style={{color: selectedItem.binColor}}
                    className="whitespace-nowrap"
                  >
                    {selectedItem.recyclable} · {selectedItem.binLabel}
                  </span>
                </div>
              </div>

              {aiQuickTip && (
                <p className="mt-2 rounded-xl bg-[#e6f7f1]/90 px-3 py-1.5 text-xs font-medium text-[#006948]">
                  Dica da IA: {aiQuickTip}
                </p>
              )}

              {/* Nearest Drop-off Locator Shortcut inside Glass Tag */}
              <div className="mt-2.5 pt-2.5 border-t border-[#0b1c30]/10 flex flex-wrap items-center justify-between gap-2 text-xs">
                <span className="text-[#3d4a42] truncate">
                  Ponto mais próximo:{' '}
                  <strong className="text-[#0b1c30]">{nearestPoint.name}</strong>{' '}
                  ({nearestPoint.distanceKm})
                </span>
                <button
                  type="button"
                  onClick={() =>
                    onOpenDropOffMap(selectedItem.material, nearestPoint.id)
                  }
                  className="inline-flex items-center gap-1 font-bold text-[#006398] hover:underline whitespace-nowrap shrink-0"
                >
                  <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>Ver no mapa</span>
                </button>
              </div>
            </div>
          </div>

          {uploadedPreview && (
            <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2 px-1 text-xs text-[#eaf1ff]">
              <span>
                {isAnalyzingAi
                  ? 'Analisando a foto enviada...'
                  : `Material selecionado: ${selectedItem.material}. Toque em qualquer material abaixo para ajustar manualmente.`}
              </span>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setShowPhotoInViewer((prev) => !prev)}
                  className="font-semibold text-[#93c5fd] hover:underline whitespace-nowrap"
                >
                  {showPhotoInViewer ? 'Ver cena 3D' : 'Mostrar minha foto'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setUploadedPreview(null);
                    setUploadedName('');
                    setAiResultLabel('');
                    setAiQuickTip('');
                    setShowPhotoInViewer(true);
                  }}
                  className="font-semibold text-[#68dba9] hover:underline whitespace-nowrap"
                >
                  Limpar foto
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Material Selector Grid (Fully Interactive) */}
        <div className="mt-5">
          <p className="text-xs font-semibold text-[#6d7a72] mb-2.5">
            Selecionar material para inspecionar e ver orientações abaixo:
          </p>
          <div className="flex flex-wrap gap-2">
            {TRIAGE_CATALOG.map((item) => {
              const active = item.id === selectedItem.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  aria-pressed={active}
                  onClick={() => handleSelectItem(item, {fromUserClick: true})}
                  className={`rounded-full px-3.5 py-2 text-xs font-semibold whitespace-nowrap shrink-0 transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0284c7] ${
                    active
                      ? 'bg-[#006948] text-white shadow-xs'
                      : 'bg-[#eff4ff] text-[#3d4a42] hover:bg-[#dce9ff]'
                  }`}
                >
                  {item.material}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* Triage Guidance Breakdown */}
      <section
        ref={detailsRef}
        className="eco-card rounded-3xl p-5 sm:p-6 divide-y divide-[#bccac0]/30"
      >
        <div className="pb-4">
          <h3 className="flex items-center gap-2 text-sm font-bold text-[#006948]">
            <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
            <span>Preparo e limpeza antes do descarte ({selectedItem.material})</span>
          </h3>
          <p className="mt-1.5 text-sm leading-relaxed text-[#3d4a42]">
            {selectedItem.cleanlinessTip}
          </p>
        </div>

        <div className="py-4">
          <h3 className="flex items-center gap-2 text-sm font-bold text-[#006398]">
            <Palette className="h-4 w-4" aria-hidden="true" />
            <span>Ideia rápida de arte com sucata</span>
          </h3>
          <p className="mt-1.5 text-sm leading-relaxed text-[#3d4a42]">
            {selectedItem.scrapArtIdea}
          </p>
          <button
            type="button"
            onClick={() => onCreatePostWithMaterial(selectedItem)}
            className="mt-3 inline-flex min-h-[40px] items-center gap-2 rounded-full bg-[#e0f2fe] px-4 py-2 text-xs font-bold text-[#0284c7] hover:bg-[#cce5ff] transition-colors"
          >
            <span>Compartilhar ideia com {selectedItem.material}</span>
          </button>
        </div>

        <div className="pt-4">
          <h3 className="flex items-center gap-2 text-sm font-bold text-[#ba1a1a]">
            <AlertTriangle className="h-4 w-4" aria-hidden="true" />
            <span>Erro comum a evitar</span>
          </h3>
          <p className="mt-1.5 text-sm leading-relaxed text-[#3d4a42]">
            {selectedItem.commonMistake}
          </p>
        </div>
      </section>
    </div>
  );
};
