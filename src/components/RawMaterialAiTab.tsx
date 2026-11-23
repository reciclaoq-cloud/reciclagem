import React, {useRef, useState} from 'react';
import {
  Camera,
  CheckCircle2,
  Clock,
  Database,
  Lightbulb,
  ListOrdered,
  Send,
  Sparkles,
  Upload,
} from 'lucide-react';
import {
  BeforeAfterEntry,
  BeforeAfterSuggestion,
  CraftSubcategory,
  MaterialType,
} from '../types/eco';
import {CRAFT_CATEGORIES} from './CreativeCategoriesStrip';
import {compressImageFile} from '../utils/imageUpload';
import {analyzeBeforeAfterWithAI} from '../services/ecoRepository';

interface RawMaterialAiTabProps {
  currentUser: {
    id?: string;
    name: string;
    neighborhood: string;
    initials: string;
  } | null;
  onSaveToBeforeAfter: (entry: BeforeAfterEntry) => Promise<void> | void;
  onPublishSuggestionAsPost: (params: {
    title: string;
    summary: string;
    material: Exclude<MaterialType, MaterialType.ALL>;
    craftCategory: CraftSubcategory;
    materialsNeeded: string[];
    steps: string[];
    beforeImageUrl: string;
  }) => void;
}

const MATERIAL_OPTIONS: Array<Exclude<MaterialType, MaterialType.ALL>> = [
  MaterialType.PET,
  MaterialType.ALUMINUM,
  MaterialType.GLASS,
  MaterialType.CARDBOARD,
  MaterialType.ORGANIC,
  MaterialType.TEXTILE,
];

export const RawMaterialAiTab: React.FC<RawMaterialAiTabProps> = ({
  currentUser,
  onSaveToBeforeAfter,
  onPublishSuggestionAsPost,
}) => {
  const [craftChoice, setCraftChoice] = useState<CraftSubcategory | 'auto'>(
    'auto',
  );
  const [material, setMaterial] = useState<
    Exclude<MaterialType, MaterialType.ALL>
  >(MaterialType.PET);
  const [notes, setNotes] = useState('');
  const [rawImageUrl, setRawImageUrl] = useState('');
  const [afterImageUrl, setAfterImageUrl] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSavingDb, setIsSavingDb] = useState(false);
  const [savedNotice, setSavedNotice] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const [identifiedMaterial, setIdentifiedMaterial] = useState('');
  const [preparationTip, setPreparationTip] = useState('');
  const [suggestions, setSuggestions] = useState<BeforeAfterSuggestion[]>([]);
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [fallbackSteps, setFallbackSteps] = useState<string[]>([]);

  const fileRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);
  const afterRef = useRef<HTMLInputElement>(null);

  const runAnalysis = async (
    imageUrl: string,
    selectedCategory: CraftSubcategory | 'auto' = craftChoice,
    selectedMaterial: Exclude<MaterialType, MaterialType.ALL> = material,
  ) => {
    if (!imageUrl) {
      setErrorMsg('Envie ou tire uma foto do material bruto primeiro.');
      return;
    }
    setIsAnalyzing(true);
    setErrorMsg('');
    setSavedNotice('');
    try {
      const result = await analyzeBeforeAfterWithAI({
        imageDataUrl: imageUrl,
        material: selectedMaterial,
        craftCategory: selectedCategory,
        description: notes.trim(),
      });
      setIdentifiedMaterial(result.identifiedMaterial);
      setPreparationTip(result.preparationTip);
      setSuggestions(result.suggestions.slice(0, 3));
      setFallbackSteps(result.steps);
      setSelectedIdx(0);
    } catch (err) {
      setErrorMsg(
        err instanceof Error
          ? err.message
          : 'Erro ao consultar a IA para reutilização do material.',
      );
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSelectRawFile = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setErrorMsg('');
    setSavedNotice('');
    try {
      const compressed = await compressImageFile(file);
      setRawImageUrl(compressed);
      void runAnalysis(compressed, craftChoice, material);
    } catch (err) {
      setErrorMsg(
        err instanceof Error ? err.message : 'Erro ao processar imagem.',
      );
    } finally {
      e.target.value = '';
    }
  };

  const handleSelectAfterFile = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const compressed = await compressImageFile(file);
      setAfterImageUrl(compressed);
    } catch (err) {
      setErrorMsg(
        err instanceof Error ? err.message : 'Erro ao processar imagem.',
      );
    } finally {
      e.target.value = '';
    }
  };

  const activeSuggestion = suggestions[selectedIdx];
  const activeSteps =
    (activeSuggestion?.steps && activeSuggestion.steps.length > 0
      ? activeSuggestion.steps
      : fallbackSteps) || [];

  const handleSaveEntry = async () => {
    if (!rawImageUrl || suggestions.length === 0) return;
    setIsSavingDb(true);
    setErrorMsg('');
    try {
      const authorName = currentUser?.name || 'Banco IA ReciclaOQ';
      const resolvedCraft: CraftSubcategory =
        activeSuggestion?.suggestedCategory ||
        (craftChoice !== 'auto' ? craftChoice : 'artesanato');
      const entry: BeforeAfterEntry = {
        id: `ba-${Date.now()}`,
        userId: currentUser?.id,
        authorName,
        authorHandle: `@${authorName.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 14) || 'reciclaoq'}`,
        authorNeighborhood: currentUser?.neighborhood || 'Santo André, SP',
        authorInitials: currentUser?.initials || 'IA',
        craftCategory: resolvedCraft,
        material,
        title:
          activeSuggestion?.title || `Reutilização com ${identifiedMaterial}`,
        description:
          identifiedMaterial ||
          activeSuggestion?.summary ||
          `Ideias da IA para reutilizar ${material}.`,
        beforeImageUrl: rawImageUrl,
        afterImageUrl: afterImageUrl || undefined,
        steps: activeSteps,
        suggestions: suggestions.slice(0, 3),
        createdAt: 'Agora mesmo',
      };
      await onSaveToBeforeAfter(entry);
      setSavedNotice('Salvo no banco de dados Antes e Depois!');
    } finally {
      setIsSavingDb(false);
    }
  };

  return (
    <div className="space-y-5">
      <section className="eco-card rounded-3xl p-5 sm:p-6 space-y-5">
        <div>
          <div className="inline-flex items-center gap-1.5 rounded-full bg-[#e6f7f1] px-3 py-1 text-xs font-extrabold text-[#006948]">
            <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Reutilização de Material Bruto com IA</span>
          </div>
          <h1 className="mt-2 text-xl sm:text-2xl font-extrabold tracking-tight text-[#0b1c30]">
            O que fazer com este material bruto?
          </h1>
          <p className="mt-1 text-sm text-[#3d4a42] leading-relaxed">
            Envie a foto da sucata ou material bruto para a IA identificar o resíduo, sugerir 3 peças criativas e gerar o passo a passo completo.
          </p>
        </div>

        {/* Category + Material Hint */}
        <div className="space-y-3">
          <div>
            <span className="block text-xs font-semibold text-[#3d4a42] mb-2">
              Categoria desejada para as sugestões
            </span>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setCraftChoice('auto')}
                className={`min-h-[38px] rounded-full px-3.5 text-xs font-bold transition-colors ${
                  craftChoice === 'auto'
                    ? 'bg-[#0b1c30] text-white'
                    : 'bg-[#eff4ff] text-[#3d4a42] hover:bg-[#dce9ff]'
                }`}
              >
                Automático (IA escolhe)
              </button>
              {CRAFT_CATEGORIES.map((cat) => {
                const active = craftChoice === cat.id;
                const isGreen = cat.colorScheme === 'green';
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setCraftChoice(cat.id)}
                    className={`min-h-[38px] rounded-full px-3.5 text-xs font-bold transition-colors ${
                      active
                        ? isGreen
                          ? 'bg-[#006948] text-white'
                          : 'bg-[#006398] text-white'
                        : 'bg-[#eff4ff] text-[#3d4a42] hover:bg-[#dce9ff]'
                    }`}
                  >
                    {cat.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label
                htmlFor="ai-raw-material"
                className="block text-xs font-semibold text-[#3d4a42] mb-1"
              >
                Tipo principal de material
              </label>
              <select
                id="ai-raw-material"
                value={material}
                onChange={(e) =>
                  setMaterial(
                    e.target.value as Exclude<MaterialType, MaterialType.ALL>,
                  )
                }
                className="min-h-[42px] w-full rounded-2xl border border-[#e2e8f0] bg-[#f8fafc] px-3 text-sm text-[#0b1c30]"
              >
                {MATERIAL_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="ai-raw-notes"
                className="block text-xs font-semibold text-[#3d4a42] mb-1"
              >
                Detalhes opcionais (quantidade, tamanho)
              </label>
              <input
                id="ai-raw-notes"
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Ex.: 2 caixas de papelão e tampinhas coloridas"
                className="min-h-[42px] w-full rounded-2xl border border-[#e2e8f0] bg-[#f8fafc] px-3.5 text-sm text-[#0b1c30]"
              />
            </div>
          </div>
        </div>

        {/* Upload Dropzone */}
        <div className="rounded-3xl border-2 border-dashed border-[#0284c7]/35 bg-[#f8f9ff] p-5 text-center space-y-3">
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            onChange={(e) => void handleSelectRawFile(e)}
            className="hidden"
          />
          <input
            ref={cameraRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={(e) => void handleSelectRawFile(e)}
            className="hidden"
          />

          {rawImageUrl ? (
            <div className="space-y-3">
              <div className="flex h-64 items-center justify-center overflow-hidden rounded-2xl border border-[#bccac0]/40 bg-[#f1f5f9] p-2">
                <img
                  src={rawImageUrl}
                  alt="Material bruto enviado para análise da IA"
                  className="max-h-full max-w-full object-contain rounded-xl"
                />
              </div>
              <div className="flex flex-wrap items-center justify-center gap-2">
                <button
                  type="button"
                  disabled={isAnalyzing}
                  onClick={() => void runAnalysis(rawImageUrl, craftChoice, material)}
                  className="eco-cta-gradient inline-flex min-h-[40px] items-center gap-1.5 rounded-full px-5 text-xs font-bold text-white disabled:opacity-60"
                >
                  <Sparkles className="h-4 w-4" aria-hidden="true" />
                  <span>
                    {isAnalyzing
                      ? 'Analisando material...'
                      : 'Gerar novas 3 sugestões com IA'}
                  </span>
                </button>
                <button
                  type="button"
                  disabled={isAnalyzing}
                  onClick={() => fileRef.current?.click()}
                  className="inline-flex min-h-[40px] items-center gap-1.5 rounded-full bg-white border border-[#bccac0]/50 px-4 text-xs font-bold text-[#006398] hover:bg-[#eff4ff]"
                >
                  <Upload className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>Trocar foto</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="py-3 space-y-3">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#e0f2fe] text-[#006398]">
                <Sparkles className="h-6 w-6" aria-hidden="true" />
              </div>
              <div>
                <p className="text-sm font-bold text-[#0b1c30]">
                  Envie a foto do material bruto para a IA analisar
                </p>
                <p className="mt-0.5 text-xs text-[#3d4a42]">
                  Garrafas, latas, papelão, potes de vidro, tampinhas ou tecidos.
                </p>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-2.5">
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="eco-cta-gradient inline-flex min-h-[42px] items-center gap-2 rounded-full px-5 text-xs font-bold text-white"
                >
                  <Upload className="h-4 w-4" aria-hidden="true" />
                  <span>Enviar foto do material</span>
                </button>
                <button
                  type="button"
                  onClick={() => cameraRef.current?.click()}
                  className="inline-flex min-h-[42px] items-center gap-2 rounded-full bg-white border border-[#006398]/30 px-4 text-xs font-bold text-[#006398] hover:bg-[#e0f2fe]"
                >
                  <Camera className="h-4 w-4" aria-hidden="true" />
                  <span>Tirar foto agora</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {isAnalyzing && (
          <div className="rounded-2xl bg-[#eff4ff] p-4 text-xs font-semibold text-[#006398] flex items-center gap-2.5">
            <Sparkles className="h-4 w-4 animate-pulse shrink-0" aria-hidden="true" />
            <span>
              A IA está identificando o material bruto e preparando 3 sugestões de peças com passo a passo...
            </span>
          </div>
        )}

        {errorMsg && (
          <div className="rounded-2xl bg-[#ffdad6]/70 px-4 py-3 text-xs font-semibold text-[#93000a]">
            {errorMsg}
          </div>
        )}
      </section>

      {/* AI Results Section */}
      {suggestions.length > 0 && (
        <section className="eco-card rounded-3xl p-5 sm:p-6 space-y-5">
          <div className="rounded-2xl bg-[#e6f7f1]/75 border border-[#006948]/20 p-4 space-y-1.5">
            <p className="flex items-center gap-1.5 text-xs font-extrabold text-[#006948]">
              <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
              <span>Material bruto identificado: {identifiedMaterial}</span>
            </p>
            {preparationTip && (
              <p className="text-xs text-[#3d4a42] leading-relaxed">
                <strong>Preparo seguro:</strong> {preparationTip}
              </p>
            )}
          </div>

          <div className="space-y-2.5">
            <p className="flex items-center gap-1.5 text-sm font-extrabold text-[#0b1c30]">
              <Lightbulb className="h-4 w-4 text-[#006398]" aria-hidden="true" />
              <span>3 Sugestões da IA para reutilizar este material (toque para ver o passo a passo)</span>
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {suggestions.map((sug, idx) => {
                const selected = selectedIdx === idx;
                const catLabel =
                  CRAFT_CATEGORIES.find((c) => c.id === sug.suggestedCategory)
                    ?.label || 'Arte com Sucata';
                return (
                  <button
                    key={`${sug.title}-${idx}`}
                    type="button"
                    onClick={() => setSelectedIdx(idx)}
                    className={`rounded-2xl border p-3.5 text-left transition-all ${
                      selected
                        ? 'border-[#006948] bg-[#e6f7f1] shadow-xs'
                        : 'border-[#bccac0]/40 bg-white hover:border-[#0284c7]'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1 text-[10px] font-bold uppercase tracking-wide text-[#006398]">
                      <span>Sugestão {idx + 1} · {catLabel}</span>
                      <span className="inline-flex items-center gap-1 text-[#3d4a42]">
                        <Clock className="h-3 w-3" aria-hidden="true" />
                        {sug.estimatedTime}
                      </span>
                    </div>
                    <p className="mt-1.5 text-xs font-extrabold text-[#0b1c30]">
                      {sug.title}
                    </p>
                    <p className="mt-1 text-[11px] text-[#3d4a42] leading-snug">
                      {sug.summary}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {activeSuggestion?.extraMaterials &&
            activeSuggestion.extraMaterials.length > 0 && (
              <div className="rounded-2xl bg-[#f8f9ff] p-4 border border-[#bccac0]/35">
                <p className="text-xs font-extrabold text-[#006398] mb-2">
                  Materiais extras recomendados:
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {activeSuggestion.extraMaterials.map((item, i) => (
                    <span
                      key={i}
                      className="rounded-full bg-white border border-[#bccac0]/40 px-3 py-1 text-xs font-medium text-[#3d4a42]"
                    >
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            )}

          {activeSteps.length > 0 && (
            <div className="rounded-2xl bg-[#f8f9ff] p-4 border border-[#bccac0]/35">
              <p className="flex items-center gap-1.5 text-xs font-extrabold text-[#006948] mb-2.5">
                <ListOrdered className="h-4 w-4" aria-hidden="true" />
                <span>
                  Passo a passo: {activeSuggestion?.title || 'Como fazer'}
                </span>
              </p>
              <ol className="space-y-2">
                {activeSteps.map((step, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-2.5 text-xs sm:text-[13px] text-[#3d4a42]"
                  >
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#d1fae5] text-[11px] font-bold text-[#006948]">
                      {i + 1}
                    </span>
                    <span className="leading-relaxed">{step}</span>
                  </li>
                ))}
              </ol>
            </div>
          )}

          {/* Optional Finished Photo + Save / Publish Actions */}
          <div className="pt-2 border-t border-[#bccac0]/30 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl bg-[#eff4ff] px-4 py-3">
              <span className="text-xs text-[#3d4a42]">
                {afterImageUrl
                  ? 'Foto da peça pronta anexada (aparecerá como Depois).'
                  : 'Opcional: se já fez a peça, anexe a foto do Depois antes de salvar.'}
              </span>
              <input
                ref={afterRef}
                type="file"
                accept="image/*"
                onChange={(e) => void handleSelectAfterFile(e)}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => afterRef.current?.click()}
                className="inline-flex min-h-[34px] items-center gap-1.5 rounded-full bg-white px-3.5 text-xs font-bold text-[#006398] hover:bg-[#dce9ff]"
              >
                <Upload className="h-3.5 w-3.5" aria-hidden="true" />
                <span>{afterImageUrl ? 'Trocar peça pronta' : 'Anexar peça pronta'}</span>
              </button>
            </div>

            {savedNotice && (
              <p className="text-xs font-bold text-[#006948]">{savedNotice}</p>
            )}

            <div className="flex flex-wrap items-center justify-end gap-2">
              <button
                type="button"
                disabled={isSavingDb}
                onClick={() => void handleSaveEntry()}
                className="inline-flex min-h-[42px] items-center gap-1.5 rounded-full bg-[#e0f2fe] px-4 text-xs font-bold text-[#006398] hover:bg-[#cce5ff] disabled:opacity-60"
              >
                <Database className="h-4 w-4" aria-hidden="true" />
                <span>{isSavingDb ? 'Salvando...' : 'Salvar no Antes e Depois'}</span>
              </button>

              <button
                type="button"
                onClick={() =>
                  onPublishSuggestionAsPost({
                    title: activeSuggestion?.title || `Projeto com ${material}`,
                    summary: `${activeSuggestion?.summary || ''} Material identificado: ${identifiedMaterial}.`.trim(),
                    material,
                    craftCategory:
                      activeSuggestion?.suggestedCategory ||
                      (craftChoice !== 'auto' ? craftChoice : 'artesanato'),
                    materialsNeeded: activeSuggestion?.extraMaterials || [
                      identifiedMaterial || material,
                    ],
                    steps: activeSteps,
                    beforeImageUrl: rawImageUrl,
                  })
                }
                className="eco-cta-gradient inline-flex min-h-[42px] items-center gap-1.5 rounded-full px-5 text-xs font-bold text-white"
              >
                <Send className="h-4 w-4" aria-hidden="true" />
                <span>Publicar sugestão na Comunidade</span>
              </button>
            </div>
          </div>
        </section>
      )}
    </div>
  );
};
