import React, {useEffect, useRef, useState} from 'react';
import {
  ArrowLeftRight,
  Database,
  Plus,
  Search,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import {
  BeforeAfterEntry,
  CraftSubcategory,
  MaterialType,
} from '../types/eco';
import {CRAFT_CATEGORIES} from './CreativeCategoriesStrip';
import {compressImageFile} from '../utils/imageUpload';

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
  onRequireAuth: () => void;
  onClose: () => void;
  onAddEntry: (entry: BeforeAfterEntry) => void;
  onDeleteEntry: (entryId: string) => void;
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
  onRequireAuth,
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
  const [errorMsg, setErrorMsg] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const [sliderValues, setSliderValues] = useState<Record<string, number>>({});

  const beforeRef = useRef<HTMLInputElement>(null);
  const afterRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setFilterCraft(initialCraft || 'all');
      if (initialCraft) setCraftCategory(initialCraft);
      setErrorMsg('');
    }
  }, [isOpen, initialCraft]);

  if (!isOpen) return null;

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      onRequireAuth();
      return;
    }
    if (!beforeImageUrl || !afterImageUrl) {
      setErrorMsg('Envie as duas fotos: Antes (sucata) e Depois (peça pronta).');
      return;
    }
    if (!title.trim()) {
      setErrorMsg('Informe o título da transformação.');
      return;
    }

    const newEntry: BeforeAfterEntry = {
      id: `ba-${Date.now()}`,
      userId: currentUser.id,
      authorName: currentUser.name,
      authorHandle: `@${currentUser.name.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 14) || 'reciclaoq'}`,
      authorNeighborhood: currentUser.neighborhood,
      authorInitials: currentUser.initials,
      craftCategory,
      material,
      title: title.trim(),
      description:
        description.trim() ||
        `Transformação de ${material} registrada pela comunidade.`,
      beforeImageUrl,
      afterImageUrl,
      createdAt: 'Agora mesmo',
    };

    onAddEntry(newEntry);
    setTitle('');
    setDescription('');
    setBeforeImageUrl('');
    setAfterImageUrl('');
    setErrorMsg('');
    setShowAddForm(false);
  };

  const filteredEntries = entries.filter((entry) => {
    if (filterCraft !== 'all' && entry.craftCategory !== filterCraft) {
      return false;
    }
    if (searchTerm.trim()) {
      const q = searchTerm.trim().toLowerCase();
      const hay = `${entry.title} ${entry.description} ${entry.material} ${entry.authorName}`.toLowerCase();
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
              <span>Banco de Dados Visual · Antes e Depois</span>
            </div>
            <h2
              id="before-after-modal-title"
              className="mt-1 text-xl sm:text-2xl font-extrabold tracking-tight text-[#0b1c30]"
            >
              Transformações reais da comunidade
            </h2>
            <p className="mt-0.5 text-xs sm:text-sm text-[#3d4a42]">
              Compare a sucata original (Antes) com o resultado final (Depois) enviado por usuários reais.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                if (!currentUser) {
                  onRequireAuth();
                  return;
                }
                setShowAddForm((prev) => !prev);
              }}
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

        {/* Registration Form for Before & After */}
        {showAddForm && (
          <form
            onSubmit={handleSubmit}
            className="mt-5 rounded-3xl border border-[#0284c7]/25 bg-white p-5 space-y-4"
          >
            <h3 className="text-sm font-extrabold text-[#0b1c30]">
              Novo registro no banco de dados Antes e Depois
            </h3>

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
                  Título da transformação
                </label>
                <input
                  id="ba-title"
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ex.: Garrafas PET viraram vasos pendentes"
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
                O que foi feito (opcional)
              </label>
              <input
                id="ba-desc"
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Ex.: Cortei, lixei as bordas e fixei com barbante de algodão."
                className="min-h-[42px] w-full rounded-2xl border border-[#e2e8f0] bg-[#f8fafc] px-3.5 text-sm text-[#0b1c30]"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="rounded-2xl border border-[#006398]/25 bg-[#eff4ff]/55 p-3.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-extrabold text-[#006398]">
                    1. ANTES (Sucata original)
                  </span>
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
                    className="inline-flex min-h-[34px] items-center gap-1 rounded-full bg-[#006398] px-3 text-xs font-bold text-white"
                  >
                    <Upload className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>{beforeImageUrl ? 'Trocar' : 'Enviar Antes'}</span>
                  </button>
                </div>
                {beforeImageUrl && (
                  <img
                    src={beforeImageUrl}
                    alt="Prévia Antes"
                    className="mt-2.5 h-36 w-full rounded-xl object-cover"
                  />
                )}
              </div>

              <div className="rounded-2xl border border-[#006948]/25 bg-[#e6f7f1]/55 p-3.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-extrabold text-[#006948]">
                    2. DEPOIS (Peça pronta)
                  </span>
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
                    className="inline-flex min-h-[34px] items-center gap-1 rounded-full bg-[#006948] px-3 text-xs font-bold text-white"
                  >
                    <Upload className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>{afterImageUrl ? 'Trocar' : 'Enviar Depois'}</span>
                  </button>
                </div>
                {afterImageUrl && (
                  <img
                    src={afterImageUrl}
                    alt="Prévia Depois"
                    className="mt-2.5 h-36 w-full rounded-xl object-cover"
                  />
                )}
              </div>
            </div>

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
                disabled={isProcessing}
                className="eco-cta-gradient min-h-[40px] rounded-full px-5 text-xs font-bold text-white"
              >
                Salvar no Antes e Depois
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

        {/* Entries List */}
        <div className="mt-5 space-y-4">
          {filteredEntries.length === 0 ? (
            <div className="rounded-3xl bg-white p-8 text-center border border-[#bccac0]/35">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#e0f2fe] text-[#006398]">
                <ArrowLeftRight className="h-5 w-5" aria-hidden="true" />
              </div>
              <h3 className="mt-3 text-base font-bold text-[#0b1c30]">
                Nenhum registro encontrado no Antes e Depois
              </h3>
              <p className="mt-1 text-xs sm:text-sm text-[#3d4a42] max-w-md mx-auto">
                Esta janela funciona como banco de dados real da comunidade. Somente registros enviados por usuários cadastrados aparecem aqui.
              </p>
              <button
                type="button"
                onClick={() => {
                  if (!currentUser) {
                    onRequireAuth();
                    return;
                  }
                  setShowAddForm(true);
                }}
                className="mt-4 inline-flex min-h-[40px] items-center gap-2 rounded-full bg-[#006948] px-5 text-xs font-bold text-white"
              >
                <Plus className="h-4 w-4" aria-hidden="true" />
                <span>Registrar primeiro Antes e Depois</span>
              </button>
            </div>
          ) : (
            filteredEntries.map((entry) => {
              const splitPct = sliderValues[entry.id] ?? 50;
              const catLabel =
                CRAFT_CATEGORIES.find((c) => c.id === entry.craftCategory)
                  ?.label || entry.craftCategory;
              const canDelete = Boolean(
                currentUser &&
                  (!entry.userId ||
                    (currentUser.id && entry.userId === currentUser.id)),
              );

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
                          {entry.authorName} · {entry.authorNeighborhood} ·{' '}
                          {catLabel} · {entry.material} · {entry.createdAt}
                        </p>
                      </div>
                    </div>

                    {canDelete && (
                      <button
                        type="button"
                        onClick={() => onDeleteEntry(entry.id)}
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

                  {/* Side-by-side Comparison */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="overflow-hidden rounded-2xl border border-[#006398]/25 bg-[#eff4ff]">
                      <div className="px-3 py-1.5 text-[11px] font-extrabold text-[#006398] bg-[#e0f2fe]">
                        ANTES · Sucata / Material original
                      </div>
                      <img
                        src={entry.beforeImageUrl}
                        alt={`Antes: ${entry.title}`}
                        className="h-48 w-full object-cover"
                      />
                    </div>

                    <div className="overflow-hidden rounded-2xl border border-[#006948]/25 bg-[#e6f7f1]">
                      <div className="px-3 py-1.5 text-[11px] font-extrabold text-[#006948] bg-[#d1fae5]">
                        DEPOIS · Resultado transformado
                      </div>
                      <img
                        src={entry.afterImageUrl}
                        alt={`Depois: ${entry.title}`}
                        className="h-48 w-full object-cover"
                      />
                    </div>
                  </div>

                  {/* Interactive Reveal Slider */}
                  <div className="rounded-2xl bg-[#f8f9ff] p-3 border border-[#bccac0]/30">
                    <div className="flex items-center justify-between text-[11px] font-bold text-[#3d4a42] mb-2">
                      <span className="text-[#006398]">Comparador interativo: Antes</span>
                      <span className="tabular-nums text-[#6d7a72]">
                        {splitPct}% Depois
                      </span>
                      <span className="text-[#006948]">Depois</span>
                    </div>
                    <div className="relative h-44 w-full overflow-hidden rounded-xl bg-white">
                      <img
                        src={entry.beforeImageUrl}
                        alt=""
                        className="absolute inset-0 h-full w-full object-cover"
                      />
                      <div
                        className="absolute inset-0 overflow-hidden"
                        style={{clipPath: `inset(0 0 0 ${100 - splitPct}%)`}}
                      >
                        <img
                          src={entry.afterImageUrl}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <div
                        className="pointer-events-none absolute top-0 bottom-0 w-0.5 bg-white shadow-[0_0_8px_rgba(11,28,48,0.6)]"
                        style={{left: `${100 - splitPct}%`}}
                      />
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={splitPct}
                      onChange={(e) =>
                        setSliderValues((prev) => ({
                          ...prev,
                          [entry.id]: Number(e.target.value),
                        }))
                      }
                      aria-label={`Comparar antes e depois de ${entry.title}`}
                      className="mt-2.5 w-full accent-[#006948]"
                    />
                  </div>
                </article>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
