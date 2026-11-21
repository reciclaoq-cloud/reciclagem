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
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [cameraActive, setCameraActive] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string>('');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

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

  const handleSelectItem = (item: TriageMaterialItem) => {
    setSelectedItem(item);
    triggerLockAnimation();
  };

  const handleToggleCamera = async () => {
    if (cameraActive) {
      stopCamera();
      return;
    }
    setCameraError('');
    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraError(
        'Câmera não disponível neste navegador. Use "Testar com foto" ou selecione um material abaixo.',
      );
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
      triggerLockAnimation();
      window.setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      }, 60);
    } catch {
      setCameraError(
        'Permissão de câmera bloqueada ou indisponível. Envie uma foto local ou selecione o material abaixo.',
      );
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    stopCamera();
    setCameraError('');

    const lower = file.name.toLowerCase();
    const matched =
      TRIAGE_CATALOG.find((item) => {
        if (lower.includes('pet') || lower.includes('garrafa') || lower.includes('plast')) {
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
        if (lower.includes('cafe') || lower.includes('casca') || lower.includes('organ')) {
          return item.id === 'tr-organic';
        }
        return false;
      }) || selectedItem;

    setSelectedItem(matched);
    setUploadedName(file.name);
    triggerLockAnimation();

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setUploadedPreview(reader.result);
      }
    };
    reader.readAsDataURL(file);
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
              Aponte a câmera, envie uma foto ou escolha um resíduo para conferir grau do material, limpeza e ecoponto mais próximo.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
              id="triage-photo-upload"
            />
            <button
              type="button"
              onClick={handleToggleCamera}
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
              <span>Testar com foto</span>
            </button>
          </div>
        </div>

        {cameraError && (
          <p className="mb-4 rounded-2xl bg-[#fef3c7] px-4 py-2.5 text-xs font-semibold text-[#92400e]">
            {cameraError}
          </p>
        )}

        {/* Ecological Glass Scanner Viewfinder Frame */}
        <div className="relative overflow-hidden rounded-3xl bg-[#0b1c30] p-3 sm:p-4">
          <div className="relative overflow-hidden rounded-2xl">
            {cameraActive ? (
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="h-68 sm:h-80 w-full object-cover bg-[#0b1c30]"
              />
            ) : (
              <EcoIllustration
                theme={selectedItem.illustration}
                customImageUrl={uploadedPreview || undefined}
                alt={selectedItem.name}
                className="h-68 sm:h-80 w-full"
              />
            )}

            {/* Translucent dark perimeter scrim */}
            <div
              className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#0b1c30]/85 via-[#0b1c30]/10 to-[#0b1c30]/35"
              aria-hidden="true"
            />

            {/* Top Floating Glass Material Grade + Bin Tag */}
            <div className="absolute inset-x-3.5 top-3.5 flex flex-wrap items-center justify-between gap-2">
              <span className="eco-glass rounded-full px-3 py-1.5 text-[11px] font-bold text-[#0b1c30] shadow-sm">
                {selectedItem.materialGrade}
              </span>

              <button
                type="button"
                onClick={triggerLockAnimation}
                className="inline-flex items-center gap-1.5 rounded-full bg-[#10b981] px-3 py-1.5 text-[11px] font-bold text-white shadow-md hover:bg-[#059669] transition-colors"
              >
                <ScanLine className="h-3.5 w-3.5" aria-hidden="true" />
                <span>{isScanning ? 'Analisando...' : 'Recalibrar foco'}</span>
              </button>
            </div>

            {/* Dynamic Targeting Reticle Bracket (#10B981 glowing corner guides) */}
            <div
              className={`pointer-events-none absolute inset-x-10 inset-y-12 sm:inset-x-16 sm:inset-y-14 transition-transform duration-300 ${
                isScanning ? 'scale-[0.88]' : 'scale-100'
              }`}
              aria-hidden="true"
            >
              <span className="absolute top-0 left-0 h-8 w-8 rounded-tl-xl border-t-3 border-l-3 border-[#10b981] shadow-[0_0_12px_rgba(16,185,129,0.75)]" />
              <span className="absolute top-0 right-0 h-8 w-8 rounded-tr-xl border-t-3 border-r-3 border-[#10b981] shadow-[0_0_12px_rgba(16,185,129,0.75)]" />
              <span className="absolute bottom-0 left-0 h-8 w-8 rounded-bl-xl border-b-3 border-l-3 border-[#10b981] shadow-[0_0_12px_rgba(16,185,129,0.75)]" />
              <span className="absolute bottom-0 right-0 h-8 w-8 rounded-br-xl border-b-3 border-r-3 border-[#10b981] shadow-[0_0_12px_rgba(16,185,129,0.75)]" />
            </div>

            {/* Floating Glass Identification Plate */}
            <div className="absolute inset-x-3.5 bottom-3.5 eco-glass rounded-2xl p-3.5 sm:p-4 shadow-lg">
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
            <div className="mt-2.5 flex items-center justify-between px-1 text-xs text-[#eaf1ff]">
              <span>
                Foto local carregada no visor. Selecione abaixo a categoria correspondente para conferir os cuidados.
              </span>
              <button
                type="button"
                onClick={() => {
                  setUploadedPreview(null);
                  setUploadedName('');
                }}
                className="font-semibold text-[#68dba9] hover:underline whitespace-nowrap ml-3"
              >
                Voltar à ilustração
              </button>
            </div>
          )}
        </div>

        {/* Material Selector Grid */}
        <div className="mt-5">
          <p className="text-xs font-semibold text-[#6d7a72] mb-2.5">
            Materiais frequentes para inspecionar
          </p>
          <div className="flex flex-wrap gap-2">
            {TRIAGE_CATALOG.map((item) => {
              const active = item.id === selectedItem.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleSelectItem(item)}
                  className={`rounded-full px-3.5 py-2 text-xs font-semibold whitespace-nowrap shrink-0 transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0284c7] ${
                    active
                      ? 'bg-[#006948] text-white'
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
      <section className="eco-card rounded-3xl p-5 sm:p-6 divide-y divide-[#bccac0]/30">
        <div className="pb-4">
          <h3 className="flex items-center gap-2 text-sm font-bold text-[#006948]">
            <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
            <span>Preparo e limpeza antes do descarte</span>
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
