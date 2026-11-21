import React from 'react';
import {
  ArrowLeftRight,
  Gamepad2,
  Lamp,
  Music,
  Scissors,
  Trash2,
  Upload,
} from 'lucide-react';
import {
  CategoryPhotoEntry,
  CraftSubcategory,
  IllustrationTheme,
} from '../types/eco';
import {THEME_3D_IMAGE} from './EcoIllustrations';

export interface CraftCategoryConfig {
  id: CraftSubcategory;
  label: string;
  shortDesc: string;
  colorScheme: 'green' | 'blue';
  theme: IllustrationTheme;
  Icon: React.ComponentType<{className?: string}>;
}

export const CRAFT_CATEGORIES: CraftCategoryConfig[] = [
  {
    id: 'artesanato',
    label: 'Artesanato',
    shortDesc: 'Cestos, hortas PET, costura criativa e utilitários manuais.',
    colorScheme: 'green',
    theme: 'craft-artesanato',
    Icon: Scissors,
  },
  {
    id: 'jogos-brinquedos',
    label: 'Jogos e Brinquedos',
    shortDesc: 'Boliche, tabuleiros, robôs de lata e brinquedos educativos.',
    colorScheme: 'blue',
    theme: 'craft-jogos',
    Icon: Gamepad2,
  },
  {
    id: 'decoracao',
    label: 'Decoração',
    shortDesc: 'Luminárias, terrários de vidro e organizadores de ambiente.',
    colorScheme: 'green',
    theme: 'craft-decoracao',
    Icon: Lamp,
  },
  {
    id: 'instrumentos',
    label: 'Instrumentos',
    shortDesc: 'Violões de papelão, pandeiros de tampinha e chocalhos PET.',
    colorScheme: 'blue',
    theme: 'craft-instrumentos',
    Icon: Music,
  },
];

interface CreativeCategoriesStripProps {
  selectedCraft: CraftSubcategory | null;
  onSelectCraft: (craft: CraftSubcategory | null) => void;
  onOpenUploadForCraft: (craft: CraftSubcategory) => void;
  onOpenBeforeAfter: (craft?: CraftSubcategory) => void;
  categoryPhotos: CategoryPhotoEntry[];
  currentUserId?: string;
  onDeleteCategoryPhoto: (photoId: string) => void;
  beforeAfterCount: number;
}

export const CreativeCategoriesStrip: React.FC<CreativeCategoriesStripProps> = ({
  selectedCraft,
  onSelectCraft,
  onOpenUploadForCraft,
  onOpenBeforeAfter,
  categoryPhotos,
  currentUserId,
  onDeleteCategoryPhoto,
  beforeAfterCount,
}) => {
  const activeCategoryConfig = selectedCraft
    ? CRAFT_CATEGORIES.find((c) => c.id === selectedCraft) || null
    : null;

  const visiblePhotos = selectedCraft
    ? categoryPhotos.filter((p) => p.craftCategory === selectedCraft)
    : categoryPhotos;

  return (
    <section
      className="eco-card rounded-3xl p-5 sm:p-6 space-y-5"
      aria-label="Categorias criativas com sucatas"
    >
      {/* Header + Dedicated Before & After Window Trigger */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-base sm:text-lg font-extrabold tracking-tight text-[#0b1c30]">
            O que criar com sucatas (Visual 3D)
          </h2>
          <p className="mt-0.5 text-xs sm:text-sm text-[#3d4a42]">
            Escolha uma categoria para ver inspirações e enviar fotos do que você fez com esse material.
          </p>
        </div>

        <button
          type="button"
          onClick={() => onOpenBeforeAfter(selectedCraft || undefined)}
          className="inline-flex min-h-[42px] items-center gap-2 rounded-full bg-gradient-to-r from-[#006948] to-[#0284c7] px-4 py-2 text-xs font-bold text-white shadow-[0_6px_18px_rgba(2,132,199,0.22)] hover:opacity-95 whitespace-nowrap shrink-0 transition-transform active:scale-[0.98]"
        >
          <ArrowLeftRight className="h-4 w-4" aria-hidden="true" />
          <span>Antes e Depois</span>
          <span className="tabular-nums opacity-90">({beforeAfterCount})</span>
        </button>
      </div>

      {/* 4 Intuitive Blue & Green Category Cards with Embedded Upload Buttons */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        {CRAFT_CATEGORIES.map((cat) => {
          const isSelected = selectedCraft === cat.id;
          const isGreen = cat.colorScheme === 'green';
          const countForCat = categoryPhotos.filter(
            (p) => p.craftCategory === cat.id,
          ).length;

          const activeCardClasses = isGreen
            ? 'border-[#006948] bg-[#e6f7f1]/70 shadow-[0_10px_24px_rgba(0,105,72,0.12)]'
            : 'border-[#006398] bg-[#e0f2fe]/70 shadow-[0_10px_24px_rgba(0,99,152,0.12)]';

          const inactiveCardClasses =
            'border-[#bccac0]/45 bg-[#f8f9ff] hover:border-[#0284c7]/45 hover:bg-white';

          const primaryBtnClasses = isGreen
            ? 'bg-[#006948] hover:bg-[#005238] text-white'
            : 'bg-[#006398] hover:bg-[#004f7a] text-white';

          const uploadBtnClasses = isGreen
            ? 'bg-white text-[#006948] border border-[#006948]/25 hover:bg-[#e6f7f1]'
            : 'bg-white text-[#006398] border border-[#006398]/25 hover:bg-[#e0f2fe]';

          return (
            <div
              key={cat.id}
              className={`rounded-2xl border p-3.5 transition-all duration-150 ${
                isSelected ? activeCardClasses : inactiveCardClasses
              }`}
            >
              <div className="flex items-start gap-3">
                <button
                  type="button"
                  onClick={() => onSelectCraft(isSelected ? null : cat.id)}
                  className="relative h-20 w-24 shrink-0 overflow-hidden rounded-xl border border-[#bccac0]/30 bg-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0284c7]"
                  aria-label={`Filtrar categoria ${cat.label}`}
                >
                  <img
                    src={THEME_3D_IMAGE[cat.theme]}
                    alt={`Exemplo em 3D de ${cat.label}`}
                    referrerPolicy="no-referrer"
                    className="h-full w-full object-cover"
                  />
                </button>

                <div className="min-w-0 flex-1">
                  <button
                    type="button"
                    onClick={() => onSelectCraft(isSelected ? null : cat.id)}
                    className="flex w-full items-center justify-between gap-2 text-left"
                  >
                    <span className="flex items-center gap-1.5 text-sm font-extrabold text-[#0b1c30] truncate">
                      <cat.Icon
                        className={`h-4 w-4 shrink-0 ${
                          isGreen ? 'text-[#006948]' : 'text-[#006398]'
                        }`}
                        aria-hidden="true"
                      />
                      <span className="truncate">{cat.label}</span>
                    </span>
                    <span className="text-[11px] font-semibold text-[#6d7a72] tabular-nums shrink-0">
                      {countForCat} {countForCat === 1 ? 'foto' : 'fotos'}
                    </span>
                  </button>

                  <p className="mt-1 text-xs text-[#3d4a42] leading-snug line-clamp-2">
                    {cat.shortDesc}
                  </p>

                  {/* Intuitive Blue/Green Action & Upload Buttons per Category */}
                  <div className="mt-2.5 flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => onSelectCraft(isSelected ? null : cat.id)}
                      className={`inline-flex min-h-[34px] items-center justify-center rounded-full px-3 py-1 text-xs font-bold whitespace-nowrap shrink-0 transition-colors ${primaryBtnClasses}`}
                    >
                      {isSelected ? 'Selecionada' : `Ver ${cat.label}`}
                    </button>

                    <button
                      type="button"
                      onClick={() => onOpenUploadForCraft(cat.id)}
                      className={`inline-flex min-h-[34px] items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold whitespace-nowrap shrink-0 transition-colors ${uploadBtnClasses}`}
                    >
                      <Upload className="h-3.5 w-3.5" aria-hidden="true" />
                      <span>Enviar foto</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Category Photo Showcase (Real Uploaded Photos by Users) */}
      <div className="pt-3 border-t border-[#bccac0]/35">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <div>
            <h3 className="text-sm font-bold text-[#0b1c30]">
              {activeCategoryConfig
                ? `Galeria real de ${activeCategoryConfig.label}`
                : 'Fotos enviadas pela comunidade por categoria'}
            </h3>
            <p className="text-xs text-[#6d7a72]">
              {visiblePhotos.length === 0
                ? 'Nenhuma foto real enviada ainda nesta seleção.'
                : `${visiblePhotos.length} ${
                    visiblePhotos.length === 1
                      ? 'foto enviada por membro cadastrado'
                      : 'fotos enviadas por membros cadastrados'
                  }`}
            </p>
          </div>

          <div className="flex items-center gap-2">
            {selectedCraft && (
              <button
                type="button"
                onClick={() => onSelectCraft(null)}
                className="min-h-[34px] rounded-full bg-[#eff4ff] px-3 text-xs font-semibold text-[#006398] hover:bg-[#dce9ff] whitespace-nowrap"
              >
                Todas categorias
              </button>
            )}
            <button
              type="button"
              onClick={() =>
                onOpenUploadForCraft(selectedCraft || 'artesanato')
              }
              className="inline-flex min-h-[34px] items-center gap-1.5 rounded-full bg-[#006948] px-3.5 text-xs font-bold text-white hover:bg-[#005238] whitespace-nowrap"
            >
              <Upload className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Enviar foto</span>
            </button>
          </div>
        </div>

        {visiblePhotos.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[#bccac0]/60 bg-[#f8f9ff] p-4 text-center">
            <p className="text-xs text-[#3d4a42]">
              Envie a primeira foto real do que pode ser feito em{' '}
              <span className="font-bold text-[#0b1c30]">
                {activeCategoryConfig ? activeCategoryConfig.label : 'qualquer categoria'}
              </span>{' '}
              usando o botão de upload acima.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {visiblePhotos.map((photo) => {
              const catLabel =
                CRAFT_CATEGORIES.find((c) => c.id === photo.craftCategory)
                  ?.label || photo.craftCategory;
              const canRemove =
                !photo.userId ||
                (currentUserId && photo.userId === currentUserId);
              return (
                <div
                  key={photo.id}
                  className="overflow-hidden rounded-2xl border border-[#bccac0]/40 bg-white"
                >
                  <div className="relative h-36 bg-[#eff4ff]">
                    <img
                      src={photo.imageUrl}
                      alt={photo.title}
                      referrerPolicy="no-referrer"
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div className="p-3">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-xs font-bold text-[#0b1c30] line-clamp-1">
                        {photo.title}
                      </p>
                      {canRemove && (
                        <button
                          type="button"
                          onClick={() => onDeleteCategoryPhoto(photo.id)}
                          aria-label={`Remover foto ${photo.title}`}
                          className="text-[#6d7a72] hover:text-[#ba1a1a] shrink-0"
                        >
                          <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                        </button>
                      )}
                    </div>
                    <p className="mt-1 text-[11px] text-[#6d7a72] truncate">
                      {catLabel} · {photo.material}
                    </p>
                    <p className="mt-0.5 text-[11px] font-medium text-[#006948] truncate">
                      Por {photo.authorName} · {photo.authorNeighborhood}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
};
