import React from 'react';
import {
  ArrowUpRight,
  Bookmark,
  CheckCircle2,
  Heart,
  MapPin,
  MessageCircle,
} from 'lucide-react';
import {EcoPost, MaterialType, PostCategory} from '../types/eco';
import {EcoIllustration} from './EcoIllustrations';

interface PostCardProps {
  post: EcoPost;
  onToggleLike: (postId: string) => void;
  onToggleVerify: (postId: string) => void;
  onToggleSave: (postId: string) => void;
  onOpenDetail: (post: EcoPost) => void;
  onLocateBin: (material: Exclude<MaterialType, MaterialType.ALL>) => void;
}

const CATEGORY_LABEL: Record<Exclude<PostCategory, PostCategory.ALL>, string> = {
  [PostCategory.RECYCLING]: 'Reciclagem Prática',
  [PostCategory.ZERO_WASTE]: 'Zero Desperdício',
  [PostCategory.SCRAP_ART]: 'Arte com Sucata',
};

export const PostCard: React.FC<PostCardProps> = ({
  post,
  onToggleLike,
  onToggleVerify,
  onToggleSave,
  onOpenDetail,
  onLocateBin,
}) => {
  const wasteLabel = post.wasteAvoidedKg.toFixed(2).replace('.', ',');

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

      {/* Visual Thumbnail */}
      <button
        type="button"
        onClick={() => onOpenDetail(post)}
        className="mt-4 block w-full text-left rounded-2xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0284c7]"
        aria-label={`Abrir tutorial completo: ${post.title}`}
      >
        <EcoIllustration
          theme={post.illustration}
          customImageUrl={post.customImageUrl}
          alt={post.title}
          className="h-52 sm:h-60 w-full transition-transform duration-200 hover:scale-[1.008]"
        />
      </button>

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
