import React, {useRef, useState} from 'react';
import {AlertTriangle, CheckCircle2, Palette, Sparkles, Upload, XCircle} from 'lucide-react';
import {TRIAGE_CATALOG} from '../data/ecoSeedData';
import {TriageMaterialItem} from '../types/eco';
import {EcoIllustration} from './EcoIllustrations';

interface TriageViewfinderProps {
  onCreatePostWithMaterial: (item: TriageMaterialItem) => void;
}

export const TriageViewfinder: React.FC<TriageViewfinderProps> = ({
  onCreatePostWithMaterial,
}) => {
  const [selectedItem, setSelectedItem] = useState<TriageMaterialItem>(
    TRIAGE_CATALOG[0],
  );
  const [uploadedPreview, setUploadedPreview] = useState<string | null>(null);
  const [uploadedName, setUploadedName] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

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

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setUploadedPreview(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const isRecyclable = selectedItem.recyclable === 'Reciclável';
  const isCompostable = selectedItem.recyclable === 'Compostável';

  return (
    <div className="space-y-6">
      <section className="eco-card rounded-3xl p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-[#0b1c30]">
              Guia Prático de Triagem
            </h1>
            <p className="mt-1 text-sm text-[#3d4a42]">
              Selecione um resíduo ou envie uma foto local para conferir limpeza, descarte correto e ideias de reuso artístico.
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
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
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex min-h-[40px] items-center gap-2 rounded-full bg-[#e0f2fe] px-4 py-2 text-xs font-bold text-[#0284c7] hover:bg-[#cce5ff] whitespace-nowrap shrink-0 transition-colors"
            >
              <Upload className="h-4 w-4" aria-hidden="true" />
              <span>Testar com foto</span>
            </button>
          </div>
        </div>

        {/* Ecological Glass Viewfinder Frame */}
        <div className="relative overflow-hidden rounded-3xl bg-[#0b1c30] p-3 sm:p-4">
          <div className="relative overflow-hidden rounded-2xl">
            <EcoIllustration
              theme={selectedItem.illustration}
              customImageUrl={uploadedPreview || undefined}
              alt={selectedItem.name}
              className="h-60 sm:h-72 w-full"
            />

            {/* Translucent dark perimeter scrim + targeting corners */}
            <div
              className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#0b1c30]/80 via-[#0b1c30]/10 to-[#0b1c30]/20"
              aria-hidden="true"
            />
            <div className="pointer-events-none absolute inset-5 sm:inset-7" aria-hidden="true">
              <span className="absolute top-0 left-0 h-7 w-7 rounded-tl-xl border-t-3 border-l-3 border-[#10b981]" />
              <span className="absolute top-0 right-0 h-7 w-7 rounded-tr-xl border-t-3 border-r-3 border-[#10b981]" />
              <span className="absolute bottom-0 left-0 h-7 w-7 rounded-bl-xl border-b-3 border-l-3 border-[#10b981]" />
              <span className="absolute bottom-0 right-0 h-7 w-7 rounded-br-xl border-b-3 border-r-3 border-[#10b981]" />
            </div>

            {/* Floating Glass Identification Plate */}
            <div className="absolute inset-x-4 bottom-4 eco-glass rounded-2xl p-4 shadow-lg">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-[#3d4a42]">
                    {selectedItem.material}
                    {uploadedName ? ` · Arquivo: ${uploadedName}` : ''}
                  </p>
                  <h2 className="text-base sm:text-lg font-extrabold text-[#0b1c30] truncate">
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
            </div>
          </div>

          {uploadedPreview && (
            <div className="mt-2.5 flex items-center justify-between px-1 text-xs text-[#eaf1ff]">
              <span>Pré-visualização local carregada. Selecione abaixo a categoria correta para o item da foto.</span>
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
            Materiais frequentes do dia a dia
          </p>
          <div className="flex flex-wrap gap-2">
            {TRIAGE_CATALOG.map((item) => {
              const active = item.id === selectedItem.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setSelectedItem(item)}
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
