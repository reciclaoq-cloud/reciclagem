import React, {useEffect, useRef, useState} from 'react';
import {
  ArrowLeftRight,
  CheckCircle2,
  Clock,
  Database,
  Lightbulb,
  ListOrdered,
  Plus,
  Search,
  Sparkles,
  Trash2,
  Upload,
  X,
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

interface BeforeAfterModalProps {
  isOpen: boolean;
  initialCraft?: CraftSubcategory;
  entries: BeforeAfterEntry[];
  currentUser: {
    id?: string;
    name: string;
    neighborhood: string;
    initials: string;
  } | null;
  onClose: () => void;
  onAddEntry: (entry: BeforeAfterEntry) => Promise<void> | void;
  onDeleteEntry: (entryId: string) => Promise<void> | void;
}

const MATERIAL_OPTIONS: Array<Exclude<MaterialType, MaterialType.ALL>> = [
  MaterialType.PET,
  MaterialType.ALUMINUM,
  MaterialType.GLASS,
  MaterialType.CARDBOARD,
  MaterialType.ORGANIC,
  MaterialType.TEXTILE,
];

export const BeforeAfterModal: React.FC<BeforeAfterModalProps> = ({
  isOpen,
  initialCraft,
  entries,
  currentUser,
  onClose,
  onAddEntry,
  onDeleteEntry,
}) => {
  const [filterCraft, setFilterCraft] = useState<'all' | CraftSubcategory>(
    initialCraft || 'all',
  );
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);

  const [craftCategory, setCraftCategory] = useState<CraftSubcategory>(
    initialCraft || 'artesanato',
  );
  const [material, setMaterial] = useState<
    Exclude<MaterialType, MaterialType.ALL>
  >(MaterialType.PET);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [beforeImageUrl, setBeforeImageUrl] = useState('');
  const [afterImageUrl, setAfterImageUrl] = useState('');
  const [steps, setSteps] = useState<string[]>([]);
  const [suggestions, setSuggestions] = useState<BeforeAfterSuggestion[]>([]);
  const [selectedFormSuggestionIdx, setSelectedFormSuggestionIdx] =
    useState<number>(0);
  const [identifiedMaterial, setIdentifiedMaterial] = useState('');
  const [isAnalyzingAi, setIsAnalyzingAi] = useState(false);
  const [aiError, setAiError] = useState('');

  const [errorMsg, setErrorMsg] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Per-entry selected suggestion tab when viewing saved records
  const [cardSuggestionIndex, setCardSuggestionIndex] = useState<
    Record<string, number>
  >({});

  const beforeRef = useRef<HTMLInputElement>(null);
  const afterRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setFilterCraft(initialCraft || 'all');
      if (initialCraft) setCraftCategory(initialCraft);
      setErrorMsg('');
      setAiError('');
    }
  }, [isOpen, initialCraft]);

  if (!isOpen) return null;

  const runAiAnalysis = async (
    imageUrl: string,
    targetCategory: CraftSubcategory = craftCategory,
    targetMaterial: Exclude<MaterialType, MaterialType.ALL> = material,
  ) => {
    if (!imageUrl) {
      setAiError('Envie a foto do Antes primeiro para a IA analisar.');
      return;
    }
    setIsAnalyzingAi(true);
    setAiError('');
    try {
      const result = await analyzeBeforeAfterWithAI({
        imageDataUrl: imageUrl,
        material: targetMaterial,
        craftCategory: targetCategory,
        title: title.trim(),
        description: description.trim(),
      });
      setSuggestions(result.suggestions.slice(0, 3));
      setSelectedFormSuggestionIdx(0);
      setSteps(
        result.steps.length > 0
          ? result.steps
          : result.suggestions[0]?.steps || [],
      );
      setIdentifiedMaterial(result.identifiedMaterial);
      if (!title.trim() && result.suggestedTitle) {
        setTitle(result.suggestedTitle);
      }
    } catch (err) {
      setAiError(
        err instanceof Error
          ? err.message
          : 'Erro ao gerar sugestões e passo a passo com a IA.',
      );
    } finally {
      setIsAnalyzingAi(false);
    }
  };

  const handleImagePick = async (
    e: React.ChangeEvent<HTMLInputElement>,
    side: 'before' | 'after',
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsProcessing(true);
    setErrorMsg('');
    try {
      const compressed = await compressImageFile(file);
      if (side === 'before') {
        setBeforeImageUrl(compressed);
        void runAiAnalysis(compressed, craftCategory, material);
      } else {
        setAfterImageUrl(compressed);
      }
    } catch (err) {
      setErrorMsg(
        err instanceof Error ? err.message : 'Erro ao processar imagem.',
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePickFormSuggestion = (idx: number) => {
    setSelectedFormSuggestionIdx(idx);
    const chosen = suggestions[idx];
    if (!chosen) return;
    setTitle(chosen.title);
    if (chosen.steps && chosen.steps.length > 0) {
      setSteps(chosen.steps);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!beforeImageUrl) {
      setErrorMsg(
        'Envie a foto do Antes (material/sucata) — este campo é obrigatório.',
      );
      return;
    }

    const finalTitle =
      title.trim() ||
      suggestions[selectedFormSuggestionIdx]?.title ||
      `Transformação com ${material}`;

    const finalDescription =
      description.trim() ||
      identifiedMaterial ||
      suggestions[selectedFormSuggestionIdx]?.summary ||
      `Guia prático de transformação com ${material}.`;

    const authorName = currentUser?.name || 'Banco IA ReciclaOQ';
    const newEntry: BeforeAfterEntry = {
      id: `ba-${Date.now()}`,
      userId: currentUser?.id,
      authorName,
      authorHandle: `@${authorName.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 14) || 'reciclaoq'}`,
      authorNeighborhood: currentUser?.neighborhood || 'Banco de Dados & IA',
      authorInitials: currentUser?.initials || 'IA',
      craftCategory,
      material,
      title: finalTitle,
      description: finalDescription,
      beforeImageUrl,
      afterImageUrl: afterImageUrl || undefined,
      steps,
      suggestions: suggestions.slice(0, 3),
      createdAt: 'Agora mesmo',
    };

    setIsSaving(true);
    try {
      await onAddEntry(newEntry);
      setTitle('');
      setDescription('');
      setBeforeImageUrl('');
      setAfterImageUrl('');
      setSteps([]);
      setSuggestions([]);
      setIdentifiedMaterial('');
      setErrorMsg('');
      setAiError('');
      setShowAddForm(false);
    } finally {
      setIsSaving(false);
    }
  };

  const filteredEntries = entries.filter((entry) => {
    if (filterCraft !== 'all' && entry.craftCategory !== filterCraft) {
      return false;
    }
    if (searchTerm.trim()) {
      const q = searchTerm.trim().toLowerCase();
      const hay = [
        entry.title,
        entry.description,
        entry.material,
        ...(entry.steps || []),
        ...(entry.suggestions || []).map((s) => `${s.title} ${s.summary}`),
      ]
        .join(' ')
        .toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-[#0b1c30]/50 backdrop-blur-sm p-0 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="before-after-modal-title"
      onClick={onClose}
    >
      <div
        className="relative max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-t-3xl sm:rounded-3xl bg-[#f8f9ff] p-5 sm:p-7 shadow-[0_24px_60px_rgba(11,28,48,0.28)]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-[#006398]">
              <Database className="h-4 w-4" aria-hidden="true" />
              <span>Banco de Dados & IA · Antes e Depois</span>
            </div>
            <h2
              id="before-after-modal-title"
              className="mt-1 text-xl sm:text-2xl font-extrabold tracking-tight text-[#0b1c30]"
            >
              Sugestões de peças e passo a passo
            </h2>
            <p className="mt-0.5 text-xs sm:text-sm text-[#3d4a42]">
              Envie a foto do material (Antes) para a IA identificar a sucata, sugerir 3 peças e montar o passo a passo de como fazer.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowAddForm((prev) => !prev)}
              className="inline-flex min-h-[40px] items-center gap-1.5 rounded-full bg-gradient-to-r from-[#006948] to-[#0284c7] px-4 text-xs font-bold text-white whitespace-nowrap"
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
              <span>
                {showAddForm ? 'Ocultar formulário' : 'Registrar Antes e Depois'}
              </span>
            </button>
            <button
              type="button"
              onClick={onClose}
              aria-label="Fechar janela Antes e Depois"
              className="flex min-h-[40px] min-w-[40px] items-center justify-center rounded-full bg-white text-[#3d4a42] hover:bg-[#dce9ff]"
            >
              <X className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>
        </div>

        {/* Form: Mandatory Before photo, Optional After photo + AI 3 suggestions & step-by-step */}
        {showAddForm && (
          <form
            onSubmit={(e) => void handleSubmit(e)}
            className="mt-5 rounded-3xl border border-[#0284c7]/25 bg-white p-5 space-y-4"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-sm font-extrabold text-[#0b1c30]">
                Analisar sucata com IA e salvar no banco de dados
              </h3>
              <span className="text-[11px] font-semibold text-[#006398]">
                Foto do Antes obrigatória · Peça pronta opcional
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {CRAFT_CATEGORIES.map((cat) => {
                const active = craftCategory === cat.id;
                const isGreen = cat.colorScheme === 'green';
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setCraftCategory(cat.id)}
                    className={`min-h-[38px] rounded-full px-3 text-xs font-bold transition-colors ${
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

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label
                  htmlFor="ba-title"
                  className="block text-xs font-semibold text-[#3d4a42] mb-1"
                >
                  Título da peça (opcional — a IA pode sugerir)
                </label>
                <input
                  id="ba-title"
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ex.: Luminária ou vaso com garrafa PET"
                  className="min-h-[42px] w-full rounded-2xl border border-[#e2e8f0] bg-[#f8fafc] px-3.5 text-sm text-[#0b1c30]"
                />
              </div>

              <div>
                <label
                  htmlFor="ba-material"
                  className="block text-xs font-semibold text-[#3d4a42] mb-1"
                >
                  Material base
                </label>
                <select
                  id="ba-material"
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
            </div>

            <div>
              <label
                htmlFor="ba-desc"
                className="block text-xs font-semibold text-[#3d4a42] mb-1"
              >
                Observações do material ou ideia (opcional)
              </label>
              <input
                id="ba-desc"
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Ex.: Tenho 3 garrafas PET verdes e tampinhas..."
                className="min-h-[42px] w-full rounded-2xl border border-[#e2e8f0] bg-[#f8fafc] px-3.5 text-sm text-[#0b1c30]"
              />
            </div>

            {/* Photos: 1. ANTES (Mandatory) / 2. DEPOIS (Optional) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="rounded-2xl border border-[#006398]/35 bg-[#eff4ff]/65 p-3.5">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <span className="text-xs font-extrabold text-[#006398]">
                      1. ANTES (Obrigatório)
                    </span>
                    <p className="text-[11px] text-[#3d4a42]">
                      Foto do material/sucata para a IA analisar
                    </p>
                  </div>
                  <input
                    ref={beforeRef}
                    type="file"
                    accept="image/*"
                    onChange={(e) => void handleImagePick(e, 'before')}
                    className="hidden"
                  />
                  <button
                    type="button"
                    disabled={isProcessing}
                    onClick={() => beforeRef.current?.click()}
                    className="inline-flex min-h-[34px] shrink-0 items-center gap-1 rounded-full bg-[#006398] px-3 text-xs font-bold text-white"
                  >
                    <Upload className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>{beforeImageUrl ? 'Trocar' : 'Enviar Antes'}</span>
                  </button>
                </div>
                {beforeImageUrl && (
                  <div className="mt-2.5 flex items-center justify-between gap-2 rounded-xl bg-white px-3 py-2 text-xs font-semibold text-[#006398]">
                    <span className="inline-flex items-center gap-1.5">
                      <CheckCircle2 className="h-4 w-4 text-[#059669]" aria-hidden="true" />
                      Foto do Antes carregada para análise da IA
                    </span>
                    <button
                      type="button"
                      disabled={isAnalyzingAi}
                      onClick={() =>
                        void runAiAnalysis(beforeImageUrl, craftCategory, material)
                      }
                      className="inline-flex items-center gap-1 font-bold text-[#006948] hover:underline"
                    >
                      <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
                      <span>{isAnalyzingAi ? 'Gerando...' : 'Gerar com IA'}</span>
                    </button>
                  </div>
                )}
              </div>

              <div className="rounded-2xl border border-[#006948]/25 bg-[#e6f7f1]/55 p-3.5">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <span className="text-xs font-extrabold text-[#006948]">
                      2. DEPOIS · Peça pronta (Opcional)
                    </span>
                    <p className="text-[11px] text-[#3d4a42]">
                      Envie apenas se já tiver a peça finalizada
                    </p>
                  </div>
                  <input
                    ref={afterRef}
                    type="file"
                    accept="image/*"
                    onChange={(e) => void handleImagePick(e, 'after')}
                    className="hidden"
                  />
                  <button
                    type="button"
                    disabled={isProcessing}
                    onClick={() => afterRef.current?.click()}
                    className="inline-flex min-h-[34px] shrink-0 items-center gap-1 rounded-full bg-[#006948] px-3 text-xs font-bold text-white"
                  >
                    <Upload className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>{afterImageUrl ? 'Trocar' : 'Enviar Peça'}</span>
                  </button>
                </div>
                {afterImageUrl && (
                  <div className="mt-2.5 relative">
                    <img
                      src={afterImageUrl}
                      alt="Prévia da peça pronta"
                      className="h-28 w-full rounded-xl object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => setAfterImageUrl('')}
                      className="mt-1 text-[11px] font-semibold text-[#ba1a1a] hover:underline"
                    >
                      Remover foto da peça pronta
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* AI Analysis Preview: 3 Suggestions & Step-by-Step */}
            {isAnalyzingAi && (
              <div className="rounded-2xl bg-[#eff4ff] p-4 text-xs font-semibold text-[#006398] flex items-center gap-2">
                <Sparkles className="h-4 w-4 animate-pulse shrink-0" aria-hidden="true" />
                <span>
                  A IA está analisando a imagem do Antes para criar 3 sugestões de peça e o passo a passo de como fazer...
                </span>
              </div>
            )}

            {aiError && (
              <div className="rounded-2xl bg-[#ffdad6]/60 px-4 py-3 text-xs font-semibold text-[#93000a]">
                {aiError}
              </div>
            )}

            {suggestions.length > 0 && (
              <div className="space-y-3 rounded-2xl border border-[#bccac0]/40 bg-[#f8f9ff] p-4">
                <div className="flex items-center justify-between gap-2">
                  <p className="flex items-center gap-1.5 text-xs font-extrabold text-[#006398]">
                    <Lightbulb className="h-4 w-4" aria-hidden="true" />
                    <span>3 Sugestões da peça geradas pela IA</span>
                  </p>
                  {identifiedMaterial && (
                    <span className="text-[11px] font-medium text-[#3d4a42]">
                      Detectado: {identifiedMaterial}
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
                  {suggestions.map((sug, idx) => {
                    const selected = selectedFormSuggestionIdx === idx;
                    return (
                      <button
                        key={`${sug.title}-${idx}`}
                        type="button"
                        onClick={() => handlePickFormSuggestion(idx)}
                        className={`rounded-2xl border p-3 text-left transition-all ${
                          selected
                            ? 'border-[#006948] bg-[#e6f7f1] shadow-xs'
                            : 'border-[#bccac0]/40 bg-white hover:border-[#0284c7]'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-1 text-[10px] font-bold uppercase tracking-wide text-[#006398]">
                          <span>Sugestão {idx + 1}</span>
                          <span className="inline-flex items-center gap-1 text-[#3d4a42]">
                            <Clock className="h-3 w-3" aria-hidden="true" />
                            {sug.estimatedTime}
                          </span>
                        </div>
                        <p className="mt-1 text-xs font-extrabold text-[#0b1c30]">
                          {sug.title}
                        </p>
                        <p className="mt-1 text-[11px] text-[#3d4a42] leading-snug">
                          {sug.summary}
                        </p>
                      </button>
                    );
                  })}
                </div>

                {steps.length > 0 && (
                  <div className="rounded-2xl bg-white p-3.5 border border-[#bccac0]/35">
                    <p className="flex items-center gap-1.5 text-xs font-extrabold text-[#006948] mb-2">
                      <ListOrdered className="h-4 w-4" aria-hidden="true" />
                      <span>Passo a passo de como fazer</span>
                    </p>
                    <ol className="space-y-1.5">
                      {steps.map((step, i) => (
                        <li
                          key={i}
                          className="flex items-start gap-2 text-xs text-[#3d4a42]"
                        >
                          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#e6f7f1] text-[10px] font-bold text-[#006948]">
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

            {errorMsg && (
              <p className="text-xs font-semibold text-[#ba1a1a]">{errorMsg}</p>
            )}

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="min-h-[40px] rounded-full px-4 text-xs font-bold text-[#3d4a42] hover:bg-[#eff4ff]"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isProcessing || isSaving || isAnalyzingAi}
                className="eco-cta-gradient min-h-[40px] rounded-full px-5 text-xs font-bold text-white disabled:opacity-60"
              >
                {isSaving ? 'Salvando...' : 'Salvar no Banco Antes e Depois'}
              </button>
            </div>
          </form>
        )}

        {/* Filter Bar & Search */}
        <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => setFilterCraft('all')}
              className={`min-h-[36px] rounded-full px-3.5 text-xs font-bold transition-colors ${
                filterCraft === 'all'
                  ? 'bg-[#0b1c30] text-white'
                  : 'bg-white text-[#3d4a42] hover:bg-[#dce9ff]'
              }`}
            >
              Todas ({entries.length})
            </button>
            {CRAFT_CATEGORIES.map((cat) => {
              const active = filterCraft === cat.id;
              const isGreen = cat.colorScheme === 'green';
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setFilterCraft(cat.id)}
                  className={`min-h-[36px] rounded-full px-3.5 text-xs font-bold transition-colors ${
                    active
                      ? isGreen
                        ? 'bg-[#006948] text-white'
                        : 'bg-[#006398] text-white'
                      : 'bg-white text-[#3d4a42] hover:bg-[#dce9ff]'
                  }`}
                >
                  {cat.label}
                </button>
              );
            })}
          </div>

          <div className="relative w-full sm:w-64">
            <Search
              className="pointer-events-none absolute left-3.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#6d7a72]"
              aria-hidden="true"
            />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar no banco..."
              className="min-h-[38px] w-full rounded-full border border-[#e2e8f0] bg-white pl-9 pr-3 text-xs text-[#0b1c30]"
            />
          </div>
        </div>

        {/* Entries List: No raw scrap photo shown — displays optional finished piece, 3 piece suggestions & step-by-step */}
        <div className="mt-5 space-y-4">
          {filteredEntries.length === 0 ? (
            <div className="rounded-3xl bg-white p-8 text-center border border-[#bccac0]/35">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#e0f2fe] text-[#006398]">
                <ArrowLeftRight className="h-5 w-5" aria-hidden="true" />
              </div>
              <h3 className="mt-3 text-base font-bold text-[#0b1c30]">
                Nenhum guia salvo no Antes e Depois
              </h3>
              <p className="mt-1 text-xs sm:text-sm text-[#3d4a42] max-w-md mx-auto">
                Envie a foto do material (Antes) para receber 3 sugestões de peça e o passo a passo completo gerado pela IA e salvar no banco de dados.
              </p>
              <button
                type="button"
                onClick={() => setShowAddForm(true)}
                className="mt-4 inline-flex min-h-[40px] items-center gap-2 rounded-full bg-[#006948] px-5 text-xs font-bold text-white"
              >
                <Plus className="h-4 w-4" aria-hidden="true" />
                <span>Enviar foto do Antes e gerar com IA</span>
              </button>
            </div>
          ) : (
            filteredEntries.map((entry) => {
              const catLabel =
                CRAFT_CATEGORIES.find((c) => c.id === entry.craftCategory)
                  ?.label || entry.craftCategory;
              const entrySuggestions = entry.suggestions || [];
              const selectedSugIdx = cardSuggestionIndex[entry.id] ?? 0;
              const activeSuggestion = entrySuggestions[selectedSugIdx];
              const activeSteps =
                (activeSuggestion?.steps && activeSuggestion.steps.length > 0
                  ? activeSuggestion.steps
                  : entry.steps) || [];

              const canDelete =
                !entry.userId ||
                Boolean(currentUser?.id && entry.userId === currentUser.id);

              return (
                <article
                  key={entry.id}
                  className="rounded-3xl bg-white p-4 sm:p-5 border border-[#bccac0]/35 space-y-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#e0f2fe] text-xs font-bold text-[#006398]">
                        {entry.authorInitials}
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-sm sm:text-base font-extrabold text-[#0b1c30] truncate">
                          {entry.title}
                        </h3>
                        <p className="text-xs text-[#6d7a72] truncate">
                          {catLabel} · {entry.material} · {entry.createdAt}
                        </p>
                      </div>
                    </div>

                    {canDelete && (
                      <button
                        type="button"
                        onClick={() => void onDeleteEntry(entry.id)}
                        aria-label={`Excluir registro ${entry.title}`}
                        className="rounded-full p-2 text-[#6d7a72] hover:bg-[#ffdad6] hover:text-[#93000a]"
                      >
                        <Trash2 className="h-4 w-4" aria-hidden="true" />
                      </button>
                    )}
                  </div>

                  {entry.description && (
                    <p className="text-xs sm:text-sm text-[#3d4a42]">
                      {entry.description}
                    </p>
                  )}

                  {/* Optional finished piece photo only (scrap photo intentionally omitted) */}
                  {entry.afterImageUrl && (
                    <div className="overflow-hidden rounded-2xl border border-[#006948]/25 bg-[#e6f7f1]">
                      <div className="px-3 py-1.5 text-[11px] font-extrabold text-[#006948] bg-[#d1fae5]">
                        PEÇA PRONTA · Resultado final
                      </div>
                      <img
                        src={entry.afterImageUrl}
                        alt={`Peça pronta: ${entry.title}`}
                        className="h-56 w-full object-cover"
                      />
                    </div>
                  )}

                  {/* 3 Piece Suggestions */}
                  {entrySuggestions.length > 0 && (
                    <div className="space-y-2">
                      <p className="flex items-center gap-1.5 text-xs font-extrabold text-[#006398]">
                        <Lightbulb className="h-4 w-4" aria-hidden="true" />
                        <span>3 Sugestões de peça para fazer com este material</span>
                      </p>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
                        {entrySuggestions.slice(0, 3).map((sug, idx) => {
                          const isSelected = selectedSugIdx === idx;
                          return (
                            <button
                              key={`${entry.id}-sug-${idx}`}
                              type="button"
                              onClick={() =>
                                setCardSuggestionIndex((prev) => ({
                                  ...prev,
                                  [entry.id]: idx,
                                }))
                              }
                              className={`rounded-2xl border p-3 text-left transition-colors ${
                                isSelected
                                  ? 'border-[#006948] bg-[#e6f7f1]'
                                  : 'border-[#bccac0]/40 bg-[#f8f9ff] hover:border-[#0284c7]'
                              }`}
                            >
                              <div className="flex items-center justify-between gap-1 text-[10px] font-bold uppercase tracking-wide text-[#006398]">
                                <span>Sugestão {idx + 1}</span>
                                <span className="text-[#3d4a42]">
                                  {sug.difficulty} · {sug.estimatedTime}
                                </span>
                              </div>
                              <p className="mt-1 text-xs font-extrabold text-[#0b1c30]">
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
                  )}

                  {/* Step-by-Step Guide */}
                  {activeSteps.length > 0 && (
                    <div className="rounded-2xl bg-[#f8f9ff] p-4 border border-[#bccac0]/35">
                      <p className="flex items-center gap-1.5 text-xs font-extrabold text-[#006948] mb-2.5">
                        <ListOrdered className="h-4 w-4" aria-hidden="true" />
                        <span>
                          Passo a passo de como fazer
                          {activeSuggestion ? `: ${activeSuggestion.title}` : ''}
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
                </article>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
