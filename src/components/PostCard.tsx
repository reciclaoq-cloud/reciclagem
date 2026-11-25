import React from 'react';
import {
  ArrowUpRight,
  Bookmark,
  CheckCircle2,
  Heart,
  MapPin,
  MessageCircle,
  ZoomIn,
} from 'lucide-react';
import {
  BeforeAfterEntry,
  EcoPost,
  MaterialType,
  PostCategory,
} from '../types/eco';
import {EcoIllustration} from './EcoIllustrations';
import {ZoomModalData} from './ImageZoomModal';

interface PostCardProps {
  post: EcoPost;
  linkedBeforeAfter?: BeforeAfterEntry;
  onToggleLike: (postId: string) => void;
  onToggleVerify: (postId: string) => void;
  onToggleSave: (postId: string) => void;
  onOpenDetail: (post: EcoPost) => void;
  onLocateBin: (material: Exclude<MaterialType, MaterialType.ALL>) => void;
  onZoomPhoto?: (data: ZoomModalData) => void;
}

const CATEGORY_LABEL: Record<Exclude<PostCategory, PostCategory.ALL>, string> = {
  [PostCategory.RECYCLING]: 'Reciclagem Prática',
  [PostCategory.ZERO_WASTE]: 'Zero Desperdício',
  [PostCategory.SCRAP_ART]: 'Arte com Sucata',
};

const CRAFT_SUB_LABEL: Record<string, string> = {
  artesanato: 'Artesanato',
  'jogos-brinquedos': 'Jogos e Brinquedos',
  decoracao: 'Decoração',
  instrumentos: 'Instrumentos',
};

export const PostCard: React.FC<PostCardProps> = ({
  post,
  linkedBeforeAfter,
  onToggleLike,
  onToggleVerify,
  onToggleSave,
  onOpenDetail,
  onLocateBin,
  onZoomPhoto,
}) => {
  const wasteLabel = post.wasteAvoidedKg.toFixed(2).replace('.', ',');
  const beforeImg = post.beforeImageUrl || linkedBeforeAfter?.beforeImageUrl;
  const afterImg = post.customImageUrl || linkedBeforeAfter?.afterImageUrl;
  const hasBeforeAfterPair = Boolean(beforeImg && afterImg);
  const singleUploadedImg = !hasBeforeAfterPair
    ? post.customImageUrl || beforeImg
    : undefined;

  const openPhotoZoom = (
    primaryUrl: string,
    primaryLabel?: string,
    secondaryUrl?: string,
    secondaryLabel?: string,
  ) => {
    if (onZoomPhoto) {
      onZoomPhoto({
        imageUrl: primaryUrl,
        primaryLabel,
        secondaryImageUrl: secondaryUrl,
        secondaryLabel,
        title: post.title,
        subtitle: `${CATEGORY_LABEL[post.category]} · ${post.material}`,
        authorLine: `Por ${post.authorName} · ${post.authorNeighborhood}`,
        explanation: post.summary,
        materials: post.materialsNeeded,
        steps: post.steps,
      });
    } else {
      onOpenDetail(post);
    }
  };

  return (
    <article className="eco-card rounded-3xl p-5 sm:p-6 transition-shadow duration-200 hover:shadow-[0_14px_34px_rgba(2,132,199,0.08)]">
      {/* Author Header with unboxed metadata */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#e5eeff] text-xs font-bold text-[#006398]"
            aria-hidden="true"
          >
            {post.authorInitials}
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-x-1.5 text-sm">
              <span className="font-bold text-[#0b1c30] truncate">
                {post.authorName}
              </span>
              <span className="text-[#6d7a72] truncate">{post.authorHandle}</span>
            </div>
            <div className="flex flex-wrap items-center gap-x-1.5 text-xs text-[#6d7a72]">
              <span>{post.authorNeighborhood}</span>
              <span aria-hidden="true">·</span>
              <span>{post.createdAt}</span>
              <span aria-hidden="true">·</span>
              <span className="font-semibold text-[#006948]">
                {CATEGORY_LABEL[post.category]}
              </span>
              {post.craftSubcategory && CRAFT_SUB_LABEL[post.craftSubcategory] && (
                <>
                  <span aria-hidden="true">·</span>
                  <span className="font-semibold text-[#006398]">
                    {CRAFT_SUB_LABEL[post.craftSubcategory]}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => onToggleSave(post.id)}
          aria-pressed={Boolean(post.savedByMe)}
          aria-label={post.savedByMe ? 'Remover dos salvos' : 'Salvar dica'}
          className={`flex min-h-[40px] min-w-[40px] shrink-0 items-center justify-center rounded-full transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0284c7] ${
            post.savedByMe
              ? 'bg-[#e6f7f1] text-[#006948]'
              : 'text-[#6d7a72] hover:bg-[#eff4ff] hover:text-[#0b1c30]'
          }`}
        >
          <Bookmark
            className="h-4 w-4"
            fill={post.savedByMe ? 'currentColor' : 'none'}
            aria-hidden="true"
          />
        </button>
      </div>

      {/* Main Title & Body */}
      <div className="mt-4">
        <button
          type="button"
          onClick={() => onOpenDetail(post)}
          className="text-left group focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0284c7] rounded-lg"
        >
          <h3 className="text-lg sm:text-[19px] font-bold tracking-tight text-[#0b1c30] group-hover:text-[#006948] transition-colors text-balance">
            {post.title}
          </h3>
        </button>
        <p className="mt-2 text-sm sm:text-[15px] leading-relaxed text-[#3d4a42]">
          {post.summary}
        </p>
      </div>

      {/* Visual Thumbnail / Antes e Depois (Uploaded Photos Clickable for Zoom) */}
      <div className="mt-4">
        {hasBeforeAfterPair && beforeImg && afterImg ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={() =>
                openPhotoZoom(
                  beforeImg,
                  '1. Antes · Material',
                  afterImg,
                  '2. Depois · Peça pronta',
                )
              }
              aria-label={`Ampliar foto antes de ${post.title} e ver explicação`}
              className="group overflow-hidden rounded-2xl border border-[#006398]/25 bg-[#f1f5f9] text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0284c7]"
            >
              <div className="flex items-center justify-between bg-[#e0f2fe] px-3 py-1 text-[11px] font-extrabold text-[#006398]">
                <span>1. ANTES · Material</span>
                <span className="inline-flex items-center gap-1 text-[10px] font-bold">
                  <ZoomIn className="h-3 w-3" aria-hidden="true" />
                  <span>Zoom</span>
                </span>
              </div>
              <div className="flex h-52 items-center justify-center p-1.5">
                <img
                  src={beforeImg}
                  alt={`Antes: ${post.title}`}
                  referrerPolicy="no-referrer"
                  className="max-h-full max-w-full object-contain rounded-lg transition-transform duration-200 group-hover:scale-[1.03]"
                />
              </div>
            </button>
            <button
              type="button"
              onClick={() =>
                openPhotoZoom(
                  afterImg,
                  '2. Depois · Peça pronta',
                  beforeImg,
                  '1. Antes · Material',
                )
              }
              aria-label={`Ampliar foto depois de ${post.title} e ver explicação`}
              className="group overflow-hidden rounded-2xl border border-[#006948]/25 bg-[#f1f5f9] text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0284c7]"
            >
              <div className="flex items-center justify-between bg-[#d1fae5] px-3 py-1 text-[11px] font-extrabold text-[#006948]">
                <span>2. DEPOIS · Peça pronta</span>
                <span className="inline-flex items-center gap-1 text-[10px] font-bold">
                  <ZoomIn className="h-3 w-3" aria-hidden="true" />
                  <span>Zoom</span>
                </span>
              </div>
              <div className="flex h-52 items-center justify-center p-1.5">
                <img
                  src={afterImg}
                  alt={`Depois: ${post.title}`}
                  referrerPolicy="no-referrer"
                  className="max-h-full max-w-full object-contain rounded-lg transition-transform duration-200 group-hover:scale-[1.03]"
                />
              </div>
            </button>
          </div>
        ) : singleUploadedImg ? (
          <button
            type="button"
            onClick={() => openPhotoZoom(singleUploadedImg)}
            aria-label={`Ampliar foto de ${post.title} e ver explicação`}
            className="group relative block w-full text-left rounded-2xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0284c7]"
          >
            <EcoIllustration
              theme={post.illustration}
              customImageUrl={singleUploadedImg}
              alt={post.title}
              className="w-full transition-transform duration-200 group-hover:scale-[1.01]"
            />
            <span className="absolute bottom-3 right-3 inline-flex items-center gap-1 rounded-full bg-[#0b1c30]/75 px-3 py-1 text-[11px] font-bold text-white backdrop-blur-sm">
              <ZoomIn className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Ampliar foto</span>
            </span>
          </button>
        ) : (
          <button
            type="button"
            onClick={() => onOpenDetail(post)}
            className="block w-full text-left rounded-2xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0284c7]"
            aria-label={`Abrir tutorial completo: ${post.title}`}
          >
            <EcoIllustration
              theme={post.illustration}
              alt={post.title}
              className="h-52 sm:h-60 w-full transition-transform duration-200 hover:scale-[1.008]"
            />
          </button>
        )}
      </div>

      {/* Unboxed Quantitative Specs Line */}
      <div className="mt-3.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs font-medium text-[#6d7a72] tabular-nums">
        <span className="font-semibold text-[#006398]">{post.material}</span>
        <span aria-hidden="true">·</span>
        <span>Tempo: {post.estimatedTime}</span>
        <span aria-hidden="true">·</span>
        <span>{post.steps.length} passos práticos</span>
        <span aria-hidden="true">·</span>
        <span>~{wasteLabel} kg poupados</span>
      </div>

      {/* Community Interaction Row */}
      <div className="mt-4 pt-3.5 border-t border-[#bccac0]/30 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1 sm:gap-2">
          <button
            type="button"
            onClick={() => onToggleLike(post.id)}
            aria-pressed={Boolean(post.likedByMe)}
            className={`inline-flex min-h-[40px] items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold whitespace-nowrap shrink-0 transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0284c7] ${
              post.likedByMe
                ? 'bg-[#e6f7f1] text-[#006948]'
                : 'text-[#3d4a42] hover:bg-[#eff4ff]'
            }`}
          >
            <Heart
              className="h-4 w-4"
              fill={post.likedByMe ? 'currentColor' : 'none'}
              aria-hidden="true"
            />
            <span className="tabular-nums">{post.likes}</span>
          </button>

          <button
            type="button"
            onClick={() => onOpenDetail(post)}
            className="inline-flex min-h-[40px] items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold text-[#3d4a42] hover:bg-[#eff4ff] whitespace-nowrap shrink-0 transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0284c7]"
          >
            <MessageCircle className="h-4 w-4" aria-hidden="true" />
            <span className="tabular-nums">{post.comments.length}</span>
          </button>

          <button
            type="button"
            onClick={() => onToggleVerify(post.id)}
            aria-pressed={Boolean(post.verifiedByMe)}
            title="Confirmar que esta prática funciona"
            className={`inline-flex min-h-[40px] items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold whitespace-nowrap shrink-0 transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0284c7] ${
              post.verifiedByMe
                ? 'bg-[#e0f2fe] text-[#006398]'
                : 'text-[#3d4a42] hover:bg-[#eff4ff]'
            }`}
          >
            <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
            <span className="tabular-nums">Testado ({post.verifiedCount})</span>
          </button>

          <button
            type="button"
            onClick={() => onLocateBin(post.material)}
            title={`Encontrar ecoponto para ${post.material}`}
            className="inline-flex min-h-[40px] items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold text-[#3d4a42] hover:bg-[#eff4ff] hover:text-[#006398] whitespace-nowrap shrink-0 transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0284c7]"
          >
            <MapPin className="h-4 w-4" aria-hidden="true" />
            <span className="hidden sm:inline">Onde descartar</span>
          </button>
        </div>

        <button
          type="button"
          onClick={() => onOpenDetail(post)}
          className="inline-flex min-h-[40px] items-center gap-1.5 rounded-full bg-[#e0f2fe] px-4 py-2 text-xs font-bold text-[#0284c7] hover:bg-[#cce5ff] whitespace-nowrap shrink-0 transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0284c7]"
        >
          <span>Passo a passo</span>
          <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
        </button>
      </div>
    </article>
  );
};
