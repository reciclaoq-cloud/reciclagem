import React, {useEffect, useRef, useState} from 'react';
import {ImagePlus, X} from 'lucide-react';
import {
  CraftSubcategory,
  EcoPost,
  IllustrationTheme,
  MaterialType,
  PostCategory,
} from '../types/eco';
import {CRAFT_CATEGORIES} from './CreativeCategoriesStrip';
import {compressImageFile} from '../utils/imageUpload';

interface CreatePostModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPublish: (newPost: EcoPost) => void;
  prefillMaterial?: Exclude<MaterialType, MaterialType.ALL>;
  prefillCategory?: Exclude<PostCategory, PostCategory.ALL>;
  prefillCraftSubcategory?: CraftSubcategory;
  defaultAuthorName?: string;
  defaultNeighborhood?: string;
}

const ILLUSTRATION_OPTIONS: Array<{id: IllustrationTheme; label: string}> = [
  {id: 'craft-artesanato', label: '3D · Artesanato com PET'},
  {id: 'craft-jogos', label: '3D · Jogos e Brinquedos'},
  {id: 'craft-decoracao', label: '3D · Decoração Reciclada'},
  {id: 'craft-instrumentos', label: '3D · Instrumentos Musicais'},
  {id: 'compost-bucket', label: '3D · Composteira Doméstica'},
  {id: 'water-rinse', label: '3D · Higienização e Triagem'},
];

const MATERIAL_OPTIONS: Array<Exclude<MaterialType, MaterialType.ALL>> = [
  MaterialType.PET,
  MaterialType.ALUMINUM,
  MaterialType.GLASS,
  MaterialType.CARDBOARD,
  MaterialType.ORGANIC,
  MaterialType.TEXTILE,
];

export const CreatePostModal: React.FC<CreatePostModalProps> = ({
  isOpen,
  onClose,
  onPublish,
  prefillMaterial,
  prefillCategory,
  prefillCraftSubcategory,
  defaultAuthorName,
  defaultNeighborhood,
}) => {
  const [category, setCategory] = useState<Exclude<PostCategory, PostCategory.ALL>>(
    prefillCategory || PostCategory.SCRAP_ART,
  );
  const [craftSubcategory, setCraftSubcategory] = useState<CraftSubcategory>(
    prefillCraftSubcategory || 'artesanato',
  );
  const [material, setMaterial] = useState<Exclude<MaterialType, MaterialType.ALL>>(
    prefillMaterial || MaterialType.PET,
  );
  const [title, setTitle] = useState('');
  const [summary, setSummary] = useState('');
  const [materialsText, setMaterialsText] = useState('');
  const [stepsText, setStepsText] = useState('');
  const [estimatedTime, setEstimatedTime] = useState('20 min');
  const [wasteAvoidedKg, setWasteAvoidedKg] = useState('0.5');
  const [illustration, setIllustration] =
    useState<IllustrationTheme>('craft-artesanato');
  const [customImageUrl, setCustomImageUrl] = useState<string | undefined>(
    undefined,
  );
  const [authorName, setAuthorName] = useState(defaultAuthorName || 'Você');
  const [neighborhood, setNeighborhood] = useState(
    defaultNeighborhood || 'Centro',
  );
  const [errorMsg, setErrorMsg] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (prefillMaterial) setMaterial(prefillMaterial);
    if (prefillCategory) setCategory(prefillCategory);
    if (prefillCraftSubcategory) setCraftSubcategory(prefillCraftSubcategory);
  }, [prefillMaterial, prefillCategory, prefillCraftSubcategory]);

  useEffect(() => {
    if (defaultAuthorName) setAuthorName(defaultAuthorName);
    if (defaultNeighborhood) setNeighborhood(defaultNeighborhood);
  }, [defaultAuthorName, defaultNeighborhood]);

  if (!isOpen) return null;

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const compressed = await compressImageFile(file);
      setCustomImageUrl(compressed);
      setErrorMsg('');
    } catch (err) {
      setErrorMsg(
        err instanceof Error ? err.message : 'Erro ao processar imagem.',
      );
    }
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!title.trim() || !summary.trim()) {
      setErrorMsg(
        'Preencha o título e a descrição prática da sua dica ou projeto.',
      );
      return;
    }

    const parsedMaterials = materialsText
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean);

    const parsedSteps = stepsText
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean);

    const parsedKg = Math.max(0.05, Number.parseFloat(wasteAvoidedKg) || 0.4);
    const cleanName = authorName.trim() || 'Você';
    const initials = cleanName
      .split(' ')
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() || '')
      .join('');

    const newPost: EcoPost = {
      id: `post-${Date.now()}`,
      isRealUserPost: true,
      authorName: cleanName,
      authorHandle: `@${cleanName.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 14) || 'reciclaoq'}`,
      authorNeighborhood: neighborhood.trim() || 'Bairro Sustentável',
      authorInitials: initials || 'RQ',
      createdAt: 'Agora mesmo',
      timestampOrder: Date.now(),
      category,
      craftSubcategory:
        category === PostCategory.SCRAP_ART ? craftSubcategory : undefined,
      material,
      title: title.trim(),
      summary: summary.trim(),
      materialsNeeded:
        parsedMaterials.length > 0
          ? parsedMaterials
          : [`${material} limpo e separado`, 'Ferramentas básicas de casa'],
      steps:
        parsedSteps.length > 0
          ? parsedSteps
          : [
              'Separe e higienize o material utilizando água de reuso.',
              'Aplique a técnica ou montagem descrita e compartilhe o resultado com vizinhos.',
            ],
      estimatedTime: estimatedTime.trim() || '20 min',
      difficulty: 'Fácil',
      wasteAvoidedKg: parsedKg,
      illustration,
      customImageUrl,
      likes: 1,
      likedByMe: true,
      verifiedCount: 1,
      verifiedByMe: true,
      comments: [],
    };

    onPublish(newPost);
    setTitle('');
    setSummary('');
    setMaterialsText('');
    setStepsText('');
    setCustomImageUrl(undefined);
    setErrorMsg('');
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-[#0b1c30]/45 backdrop-blur-sm p-0 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="composer-modal-title"
      onClick={onClose}
    >
      <div
        className="relative max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-t-3xl sm:rounded-3xl bg-white p-5 sm:p-7 shadow-[0_20px_50px_rgba(11,28,48,0.2)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2
              id="composer-modal-title"
              className="text-xl font-extrabold tracking-tight text-[#0b1c30]"
            >
              Compartilhar dica ou arte com sucata
            </h2>
            <p className="mt-0.5 text-xs text-[#6d7a72]">
              Inspire a rede com práticas de reciclagem, redução de desperdício ou criação em 3D.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar formulário"
            className="flex min-h-[40px] min-w-[40px] shrink-0 items-center justify-center rounded-full bg-[#eff4ff] text-[#3d4a42] hover:bg-[#dce9ff]"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          {/* Category Segmented Buttons */}
          <div>
            <span className="block text-xs font-semibold text-[#3d4a42] mb-2">
              Categoria da publicação
            </span>
            <div className="grid grid-cols-3 gap-2">
              {(
                [
                  {id: PostCategory.RECYCLING, label: 'Reciclagem'},
                  {id: PostCategory.ZERO_WASTE, label: 'Zero Desperdício'},
                  {id: PostCategory.SCRAP_ART, label: 'Arte com Sucata'},
                ] satisfies Array<{
                  id: Exclude<PostCategory, PostCategory.ALL>;
                  label: string;
                }>
              ).map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setCategory(cat.id)}
                  className={`min-h-[40px] rounded-full px-3 py-2 text-xs font-bold whitespace-nowrap transition-colors ${
                    category === cat.id
                      ? 'bg-[#006948] text-white'
                      : 'bg-[#eff4ff] text-[#3d4a42] hover:bg-[#dce9ff]'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* 4 Craft Subcategories when Arte com Sucata is selected */}
          {category === PostCategory.SCRAP_ART && (
            <div>
              <span className="block text-xs font-semibold text-[#3d4a42] mb-2">
                Tipo de criação com sucata
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {CRAFT_CATEGORIES.map((sub) => {
                  const active = craftSubcategory === sub.id;
                  const isGreen = sub.colorScheme === 'green';
                  return (
                    <button
                      key={sub.id}
                      type="button"
                      onClick={() => {
                        setCraftSubcategory(sub.id);
                        setIllustration(sub.theme);
                      }}
                      className={`min-h-[38px] rounded-full px-3 py-1.5 text-xs font-bold transition-colors ${
                        active
                          ? isGreen
                            ? 'bg-[#006948] text-white'
                            : 'bg-[#006398] text-white'
                          : 'bg-[#eff4ff] text-[#3d4a42] hover:bg-[#dce9ff]'
                      }`}
                    >
                      {sub.label}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label
                htmlFor="post-material"
                className="block text-xs font-semibold text-[#3d4a42] mb-1.5"
              >
                Material principal
              </label>
              <select
                id="post-material"
                value={material}
                onChange={(e) =>
                  setMaterial(
                    e.target.value as Exclude<MaterialType, MaterialType.ALL>,
                  )
                }
                className="min-h-[42px] w-full rounded-2xl border border-[#e2e8f0] bg-[#f8fafc] px-3.5 text-sm text-[#0b1c30] focus:border-[#0ea5e9] focus:bg-white focus:outline-none focus:ring-3 focus:ring-[#0ea5e9]/15"
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
                htmlFor="post-author"
                className="block text-xs font-semibold text-[#3d4a42] mb-1.5"
              >
                Seu nome e cidade/estado
              </label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  id="post-author"
                  type="text"
                  value={authorName}
                  onChange={(e) => setAuthorName(e.target.value)}
                  placeholder="Nome"
                  className="min-h-[42px] w-full rounded-2xl border border-[#e2e8f0] bg-[#f8fafc] px-3 text-sm text-[#0b1c30] focus:border-[#0ea5e9] focus:bg-white focus:outline-none"
                />
                <input
                  type="text"
                  aria-label="Cidade e Estado"
                  value={neighborhood}
                  onChange={(e) => setNeighborhood(e.target.value)}
                  placeholder="Cidade, UF"
                  className="min-h-[42px] w-full rounded-2xl border border-[#e2e8f0] bg-[#f8fafc] px-3 text-sm text-[#0b1c30] focus:border-[#0ea5e9] focus:bg-white focus:outline-none"
                />
              </div>
            </div>
          </div>

          <div>
            <label
              htmlFor="post-title"
              className="block text-xs font-semibold text-[#3d4a42] mb-1.5"
            >
              Título curto e direto
            </label>
            <input
              id="post-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex.: Porta-temperos com potes de vidro e tampa de bambu"
              className="min-h-[44px] w-full rounded-2xl border border-[#e2e8f0] bg-[#f8fafc] px-4 text-sm text-[#0b1c30] focus:border-[#0ea5e9] focus:bg-white focus:outline-none focus:ring-3 focus:ring-[#0ea5e9]/15"
            />
          </div>

          <div>
            <label
              htmlFor="post-summary"
              className="block text-xs font-semibold text-[#3d4a42] mb-1.5"
            >
              Como funciona na prática
            </label>
            <textarea
              id="post-summary"
              rows={3}
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              placeholder="Explique o ganho ambiental, o truque de limpeza ou como transformou a sucata..."
              className="w-full rounded-2xl border border-[#e2e8f0] bg-[#f8fafc] p-3.5 text-sm text-[#0b1c30] focus:border-[#0ea5e9] focus:bg-white focus:outline-none focus:ring-3 focus:ring-[#0ea5e9]/15"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label
                htmlFor="post-materials"
                className="block text-xs font-semibold text-[#3d4a42] mb-1.5"
              >
                Materiais (um por linha)
              </label>
              <textarea
                id="post-materials"
                rows={3}
                value={materialsText}
                onChange={(e) => setMaterialsText(e.target.value)}
                placeholder={'2 potes de vidro limpos\nBarbante de sisal\nTesoura'}
                className="w-full rounded-2xl border border-[#e2e8f0] bg-[#f8fafc] p-3 text-sm text-[#0b1c30] focus:border-[#0ea5e9] focus:bg-white focus:outline-none"
              />
            </div>

            <div>
              <label
                htmlFor="post-steps"
                className="block text-xs font-semibold text-[#3d4a42] mb-1.5"
              >
                Passo a passo (um por linha)
              </label>
              <textarea
                id="post-steps"
                rows={3}
                value={stepsText}
                onChange={(e) => setStepsText(e.target.value)}
                placeholder={'Lave e retire o rótulo\nEnrole o barbante na borda\nOrganize os temperos'}
                className="w-full rounded-2xl border border-[#e2e8f0] bg-[#f8fafc] p-3 text-sm text-[#0b1c30] focus:border-[#0ea5e9] focus:bg-white focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label
                htmlFor="post-time"
                className="block text-xs font-semibold text-[#3d4a42] mb-1.5"
              >
                Tempo estimado
              </label>
              <input
                id="post-time"
                type="text"
                value={estimatedTime}
                onChange={(e) => setEstimatedTime(e.target.value)}
                className="min-h-[42px] w-full rounded-2xl border border-[#e2e8f0] bg-[#f8fafc] px-3.5 text-sm text-[#0b1c30]"
              />
            </div>

            <div>
              <label
                htmlFor="post-kg"
                className="block text-xs font-semibold text-[#3d4a42] mb-1.5"
              >
                Resíduo poupado (kg)
              </label>
              <input
                id="post-kg"
                type="number"
                step="0.05"
                min="0.05"
                value={wasteAvoidedKg}
                onChange={(e) => setWasteAvoidedKg(e.target.value)}
                className="min-h-[42px] w-full rounded-2xl border border-[#e2e8f0] bg-[#f8fafc] px-3.5 text-sm text-[#0b1c30] tabular-nums"
              />
            </div>

            <div>
              <label
                htmlFor="post-illustration"
                className="block text-xs font-semibold text-[#3d4a42] mb-1.5"
              >
                Cena 3D do cartão
              </label>
              <select
                id="post-illustration"
                value={illustration}
                onChange={(e) =>
                  setIllustration(e.target.value as IllustrationTheme)
                }
                className="min-h-[42px] w-full rounded-2xl border border-[#e2e8f0] bg-[#f8fafc] px-3 text-sm text-[#0b1c30]"
              >
                {ILLUSTRATION_OPTIONS.map((opt) => (
                  <option key={opt.id} value={opt.id}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Optional Local Photo Upload */}
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-[#eff4ff] px-4 py-3">
            <div className="text-xs text-[#3d4a42]">
              {customImageUrl
                ? 'Foto do projeto anexada com sucesso.'
                : 'Opcional: envie uma foto real do seu projeto ou material.'}
            </div>
            <div className="flex items-center gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={(e) => void handlePhotoUpload(e)}
                className="hidden"
              />
              {customImageUrl && (
                <button
                  type="button"
                  onClick={() => setCustomImageUrl(undefined)}
                  className="text-xs font-semibold text-[#ba1a1a] hover:underline"
                >
                  Remover foto
                </button>
              )}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex min-h-[36px] items-center gap-1.5 rounded-full bg-white px-3.5 py-1.5 text-xs font-bold text-[#006398] shadow-xs hover:bg-[#f8f9ff]"
              >
                <ImagePlus className="h-3.5 w-3.5" aria-hidden="true" />
                <span>{customImageUrl ? 'Trocar foto' : 'Anexar foto'}</span>
              </button>
            </div>
          </div>

          {errorMsg && (
            <p className="text-xs font-semibold text-[#ba1a1a]">{errorMsg}</p>
          )}

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="min-h-[42px] rounded-full px-5 text-xs font-bold text-[#3d4a42] hover:bg-[#eff4ff]"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="eco-cta-gradient min-h-[42px] rounded-full px-6 text-xs font-bold text-white transition-transform active:scale-[0.98]"
            >
              Publicar na Comunidade
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
