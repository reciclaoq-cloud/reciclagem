import React, {useEffect, useRef, useState} from 'react';
import {ArrowLeftRight, ImagePlus, Upload, X} from 'lucide-react';
import {
  BeforeAfterEntry,
  CategoryPhotoEntry,
  CraftSubcategory,
  MaterialType,
} from '../types/eco';
import {CRAFT_CATEGORIES} from './CreativeCategoriesStrip';
import {compressImageFile} from '../utils/imageUpload';

interface CategoryPhotoUploadModalProps {
  isOpen: boolean;
  initialCraft: CraftSubcategory;
  authorName: string;
  authorNeighborhood: string;
  onClose: () => void;
  onSavePhoto: (params: {
    photo: CategoryPhotoEntry;
    beforeAfter?: Omit<
      BeforeAfterEntry,
      'id' | 'userId' | 'authorName' | 'authorHandle' | 'authorNeighborhood' | 'authorInitials' | 'createdAt'
    >;
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

export const CategoryPhotoUploadModal: React.FC<
  CategoryPhotoUploadModalProps
> = ({
  isOpen,
  initialCraft,
  authorName,
  authorNeighborhood,
  onClose,
  onSavePhoto,
}) => {
  const [craftCategory, setCraftCategory] =
    useState<CraftSubcategory>(initialCraft);
  const [material, setMaterial] = useState<
    Exclude<MaterialType, MaterialType.ALL>
  >(MaterialType.PET);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [afterImageUrl, setAfterImageUrl] = useState<string>('');
  const [beforeImageUrl, setBeforeImageUrl] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isReading, setIsReading] = useState(false);

  const mainInputRef = useRef<HTMLInputElement>(null);
  const beforeInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setCraftCategory(initialCraft);
      setErrorMsg('');
    }
  }, [isOpen, initialCraft]);

  if (!isOpen) return null;

  const handleFileSelect = async (
    event: React.ChangeEvent<HTMLInputElement>,
    target: 'after' | 'before',
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setIsReading(true);
    setErrorMsg('');
    try {
      const compressed = await compressImageFile(file);
      if (target === 'after') {
        setAfterImageUrl(compressed);
      } else {
        setBeforeImageUrl(compressed);
      }
    } catch (err) {
      setErrorMsg(
        err instanceof Error ? err.message : 'Erro ao processar a foto.',
      );
    } finally {
      setIsReading(false);
    }
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!afterImageUrl) {
      setErrorMsg('Envie a foto do que você produziu com esse material.');
      return;
    }
    if (!title.trim()) {
      setErrorMsg('Dê um título curto para sua criação.');
      return;
    }

    const photo: CategoryPhotoEntry = {
      id: `cat-photo-${Date.now()}`,
      authorName,
      authorNeighborhood,
      craftCategory,
      material,
      title: title.trim(),
      imageUrl: afterImageUrl,
      createdAt: 'Agora mesmo',
    };

    onSavePhoto({
      photo,
      beforeAfter: beforeImageUrl
        ? {
            craftCategory,
            material,
            title: title.trim(),
            description:
              description.trim() ||
              `Transformação de ${material} publicada em ${
                CRAFT_CATEGORIES.find((c) => c.id === craftCategory)?.label ||
                craftCategory
              }.`,
            beforeImageUrl,
            afterImageUrl,
            steps: [],
            suggestions: [],
          }
        : undefined,
    });

    setTitle('');
    setDescription('');
    setAfterImageUrl('');
    setBeforeImageUrl('');
    setErrorMsg('');
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-[#0b1c30]/45 backdrop-blur-sm p-0 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="cat-upload-title"
      onClick={onClose}
    >
      <div
        className="relative max-h-[92vh] w-full max-w-xl overflow-y-auto rounded-t-3xl sm:rounded-3xl bg-white p-5 sm:p-7 shadow-[0_20px_50px_rgba(11,28,48,0.2)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2
              id="cat-upload-title"
              className="text-xl font-extrabold tracking-tight text-[#0b1c30]"
            >
              Enviar foto do que pode ser feito
            </h2>
            <p className="mt-0.5 text-xs text-[#6d7a72]">
              Mostre à comunidade o resultado real feito com material reciclável ou sucata.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar janela de envio"
            className="flex min-h-[40px] min-w-[40px] shrink-0 items-center justify-center rounded-full bg-[#eff4ff] text-[#3d4a42] hover:bg-[#dce9ff]"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div>
            <span className="block text-xs font-semibold text-[#3d4a42] mb-2">
              Categoria da criação
            </span>
            <div className="grid grid-cols-2 gap-2">
              {CRAFT_CATEGORIES.map((cat) => {
                const active = craftCategory === cat.id;
                const isGreen = cat.colorScheme === 'green';
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setCraftCategory(cat.id)}
                    className={`flex min-h-[40px] items-center justify-center gap-2 rounded-full px-3 text-xs font-bold transition-colors ${
                      active
                        ? isGreen
                          ? 'bg-[#006948] text-white'
                          : 'bg-[#006398] text-white'
                        : 'bg-[#eff4ff] text-[#3d4a42] hover:bg-[#dce9ff]'
                    }`}
                  >
                    <cat.Icon className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>{cat.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label
                htmlFor="cat-upload-material"
                className="block text-xs font-semibold text-[#3d4a42] mb-1.5"
              >
                Material reaproveitado
              </label>
              <select
                id="cat-upload-material"
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
                htmlFor="cat-upload-name"
                className="block text-xs font-semibold text-[#3d4a42] mb-1.5"
              >
                Título do objeto criado
              </label>
              <input
                id="cat-upload-name"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex.: Pandeiro com tampinhas"
                className="min-h-[42px] w-full rounded-2xl border border-[#e2e8f0] bg-[#f8fafc] px-3.5 text-sm text-[#0b1c30] focus:border-[#0ea5e9] focus:bg-white focus:outline-none"
              />
            </div>
          </div>

          {/* Main Photo Upload (Result / What can be made) */}
          <div className="rounded-2xl border border-[#006398]/25 bg-[#f8f9ff] p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs font-bold text-[#0b1c30]">
                  Foto da peça pronta (obrigatória)
                </p>
                <p className="text-[11px] text-[#6d7a72]">
                  Mostra o que pode ser feito com esse material.
                </p>
              </div>
              <input
                ref={mainInputRef}
                type="file"
                accept="image/*"
                onChange={(e) => void handleFileSelect(e, 'after')}
                className="hidden"
              />
              <button
                type="button"
                disabled={isReading}
                onClick={() => mainInputRef.current?.click()}
                className="inline-flex min-h-[38px] items-center gap-1.5 rounded-full bg-[#006398] px-4 text-xs font-bold text-white hover:bg-[#004f7a]"
              >
                <Upload className="h-3.5 w-3.5" aria-hidden="true" />
                <span>{afterImageUrl ? 'Trocar foto' : 'Selecionar foto'}</span>
              </button>
            </div>

            {afterImageUrl && (
              <div className="mt-3 flex h-56 items-center justify-center overflow-hidden rounded-xl border border-[#bccac0]/40 bg-[#f1f5f9] p-1.5">
                <img
                  src={afterImageUrl}
                  alt="Prévia da peça pronta"
                  className="max-h-full max-w-full object-contain rounded-lg"
                />
              </div>
            )}
          </div>

          {/* Optional Before Photo to automatically populate Before & After DB */}
          <div className="rounded-2xl border border-[#006948]/25 bg-[#e6f7f1]/45 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="flex items-center gap-1.5 text-xs font-bold text-[#006948]">
                  <ArrowLeftRight className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>Foto do ANTES (opcional — salva no Antes e Depois)</span>
                </p>
                <p className="text-[11px] text-[#3d4a42]">
                  Se enviar a foto da sucata original, a dupla entra direto no banco de dados Antes e Depois.
                </p>
              </div>
              <input
                ref={beforeInputRef}
                type="file"
                accept="image/*"
                onChange={(e) => void handleFileSelect(e, 'before')}
                className="hidden"
              />
              <button
                type="button"
                disabled={isReading}
                onClick={() => beforeInputRef.current?.click()}
                className="inline-flex min-h-[36px] items-center gap-1.5 rounded-full bg-white px-3.5 text-xs font-bold text-[#006948] border border-[#006948]/25 hover:bg-[#e6f7f1]"
              >
                <ImagePlus className="h-3.5 w-3.5" aria-hidden="true" />
                <span>
                  {beforeImageUrl ? 'Trocar ANTES' : 'Anexar ANTES'}
                </span>
              </button>
            </div>

            {beforeImageUrl && (
              <div className="mt-3 space-y-2">
                <div className="flex h-48 items-center justify-center overflow-hidden rounded-xl border border-[#bccac0]/40 bg-[#f1f5f9] p-1.5">
                  <img
                    src={beforeImageUrl}
                    alt="Prévia do material antes"
                    className="max-h-full max-w-full object-contain rounded-lg"
                  />
                </div>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Descreva rapidamente como transformou o material (opcional)"
                  className="min-h-[40px] w-full rounded-xl border border-[#e2e8f0] bg-white px-3 text-xs text-[#0b1c30]"
                />
              </div>
            )}
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
              disabled={isReading}
              className="eco-cta-gradient min-h-[42px] rounded-full px-6 text-xs font-bold text-white disabled:opacity-60"
            >
              {isReading ? 'Processando...' : 'Salvar foto na categoria'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
