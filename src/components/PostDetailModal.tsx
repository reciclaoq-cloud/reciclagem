import React, {useState} from 'react';
import {
  Bookmark,
  Check,
  CheckCircle2,
  Copy,
  Heart,
  Send,
  Trash2,
  X,
} from 'lucide-react';
import {BeforeAfterEntry, EcoPost} from '../types/eco';
import {EcoIllustration} from './EcoIllustrations';

interface PostDetailModalProps {
  post: EcoPost | null;
  linkedBeforeAfter?: BeforeAfterEntry;
  canDelete?: boolean;
  onClose: () => void;
  onToggleLike: (postId: string) => void;
  onToggleVerify: (postId: string) => void;
  onToggleSave: (postId: string) => void;
  onAddComment: (postId: string, content: string) => void;
  onDeletePost?: (postId: string) => void;
}

export const PostDetailModal: React.FC<PostDetailModalProps> = ({
  post,
  linkedBeforeAfter,
  canDelete = false,
  onClose,
  onToggleLike,
  onToggleVerify,
  onToggleSave,
  onAddComment,
  onDeletePost,
}) => {
  const [commentText, setCommentText] = useState('');
  const [checkedMaterials, setCheckedMaterials] = useState<number[]>([]);
  const [copied, setCopied] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  if (!post) return null;

  const beforeImg = post.beforeImageUrl || linkedBeforeAfter?.beforeImageUrl;
  const afterImg = post.customImageUrl || linkedBeforeAfter?.afterImageUrl;
  const hasBeforeAfterPair = Boolean(beforeImg && afterImg);

  const handleCopyTip = async () => {
    const text = [
      `${post.title} (${post.material})`,
      post.summary,
      '',
      'Materiais:',
      ...post.materialsNeeded.map((m) => `- ${m}`),
      '',
      'Passo a passo:',
      ...post.steps.map((s, idx) => `${idx + 1}. ${s}`),
    ].join('\n');

    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  const toggleMaterialCheck = (index: number) => {
    setCheckedMaterials((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index],
    );
  };

  const handleSubmitComment = (event: React.FormEvent) => {
    event.preventDefault();
    const trimmed = commentText.trim();
    if (!trimmed) return;
    onAddComment(post.id, trimmed);
    setCommentText('');
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-[#0b1c30]/45 backdrop-blur-sm p-0 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="detail-modal-title"
      onClick={onClose}
    >
      <div
        className="relative max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-t-3xl sm:rounded-3xl bg-white p-5 sm:p-7 shadow-[0_20px_50px_rgba(11,28,48,0.2)]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Bar */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#e5eeff] text-xs font-bold text-[#006398]"
              aria-hidden="true"
            >
              {post.authorInitials}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold text-[#0b1c30] truncate">
                {post.authorName}{' '}
                <span className="font-normal text-[#6d7a72]">{post.authorHandle}</span>
              </p>
              <p className="text-xs text-[#6d7a72]">
                {post.authorNeighborhood} · {post.createdAt} · {post.material}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar detalhes"
            className="flex min-h-[40px] min-w-[40px] shrink-0 items-center justify-center rounded-full bg-[#eff4ff] text-[#3d4a42] hover:bg-[#dce9ff] hover:text-[#0b1c30]"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        <h2
          id="detail-modal-title"
          className="mt-4 text-xl sm:text-2xl font-extrabold tracking-tight text-[#0b1c30] text-balance"
        >
          {post.title}
        </h2>
        <p className="mt-2 text-sm sm:text-[15px] leading-relaxed text-[#3d4a42]">
          {post.summary}
        </p>

        <div className="mt-4">
          {hasBeforeAfterPair ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="overflow-hidden rounded-2xl border border-[#006398]/25 bg-[#f1f5f9]">
                <div className="bg-[#e0f2fe] px-3 py-1.5 text-[11px] font-extrabold text-[#006398]">
                  1. ANTES · Material / Sucata
                </div>
                <div className="flex h-64 items-center justify-center p-2">
                  <img
                    src={beforeImg}
                    alt={`Antes: ${post.title}`}
                    referrerPolicy="no-referrer"
                    className="max-h-full max-w-full object-contain rounded-lg"
                  />
                </div>
              </div>
              <div className="overflow-hidden rounded-2xl border border-[#006948]/25 bg-[#f1f5f9]">
                <div className="bg-[#d1fae5] px-3 py-1.5 text-[11px] font-extrabold text-[#006948]">
                  2. DEPOIS · Peça pronta
                </div>
                <div className="flex h-64 items-center justify-center p-2">
                  <img
                    src={afterImg}
                    alt={`Depois: ${post.title}`}
                    referrerPolicy="no-referrer"
                    className="max-h-full max-w-full object-contain rounded-lg"
                  />
                </div>
              </div>
            </div>
          ) : (
            <EcoIllustration
              theme={post.illustration}
              customImageUrl={post.customImageUrl || beforeImg}
              alt={post.title}
              className={
                post.customImageUrl || beforeImg
                  ? 'w-full'
                  : 'h-56 sm:h-64 w-full'
              }
            />
          )}
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-semibold text-[#3d4a42] tabular-nums">
          <span>Tempo estimado: {post.estimatedTime}</span>
          {post.difficulty && (
            <>
              <span aria-hidden="true">·</span>
              <span>Nível: {post.difficulty}</span>
            </>
          )}
          <span aria-hidden="true">·</span>
          <span className="text-[#006948]">
            ~{post.wasteAvoidedKg.toFixed(2).replace('.', ',')} kg de resíduo desviado
          </span>
        </div>

        {/* Materials Checklist */}
        <div className="mt-6 pt-5 border-t border-[#bccac0]/35">
          <h3 className="text-sm font-bold text-[#0b1c30] mb-3">
            Materiais necessários (toque para marcar)
          </h3>
          <ul className="space-y-1.5">
            {post.materialsNeeded.map((mat, index) => {
              const checked = checkedMaterials.includes(index);
              return (
                <li key={mat}>
                  <button
                    type="button"
                    onClick={() => toggleMaterialCheck(index)}
                    className="flex w-full min-h-[38px] items-center gap-3 rounded-xl px-2 py-1.5 text-left text-sm hover:bg-[#f8f9ff]"
                  >
                    <span
                      className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-colors ${
                        checked
                          ? 'border-[#10b981] bg-[#10b981] text-white'
                          : 'border-[#bccac0] bg-white'
                      }`}
                    >
                      {checked && <Check className="h-3.5 w-3.5" aria-hidden="true" />}
                    </span>
                    <span className={checked ? 'text-[#6d7a72] line-through' : 'text-[#3d4a42]'}>
                      {mat}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>

        {/* Step-by-Step Instructions */}
        <div className="mt-6 pt-5 border-t border-[#bccac0]/35">
          <h3 className="text-sm font-bold text-[#0b1c30] mb-3">
            Passo a passo prático
          </h3>
          <ol className="space-y-3">
            {post.steps.map((step, index) => (
              <li key={step} className="flex items-start gap-3 text-sm leading-relaxed text-[#3d4a42]">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#e6f7f1] text-xs font-bold text-[#006948] tabular-nums mt-0.5">
                  {index + 1}
                </span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
        </div>

        {/* Quick Actions */}
        <div className="mt-6 pt-4 border-t border-[#bccac0]/35 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => onToggleLike(post.id)}
            className={`inline-flex min-h-[40px] items-center gap-1.5 rounded-full px-4 py-2 text-xs font-bold transition-colors ${
              post.likedByMe
                ? 'bg-[#e6f7f1] text-[#006948]'
                : 'bg-[#eff4ff] text-[#3d4a42] hover:bg-[#dce9ff]'
            }`}
          >
            <Heart
              className="h-4 w-4"
              fill={post.likedByMe ? 'currentColor' : 'none'}
              aria-hidden="true"
            />
            <span className="tabular-nums">Apoiar ({post.likes})</span>
          </button>

          <button
            type="button"
            onClick={() => onToggleVerify(post.id)}
            className={`inline-flex min-h-[40px] items-center gap-1.5 rounded-full px-4 py-2 text-xs font-bold transition-colors ${
              post.verifiedByMe
                ? 'bg-[#e0f2fe] text-[#006398]'
                : 'bg-[#eff4ff] text-[#3d4a42] hover:bg-[#dce9ff]'
            }`}
          >
            <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
            <span className="tabular-nums">Funcionou aqui ({post.verifiedCount})</span>
          </button>

          <button
            type="button"
            onClick={() => onToggleSave(post.id)}
            className={`inline-flex min-h-[40px] items-center gap-1.5 rounded-full px-4 py-2 text-xs font-bold transition-colors ${
              post.savedByMe
                ? 'bg-[#e6f7f1] text-[#006948]'
                : 'bg-[#eff4ff] text-[#3d4a42] hover:bg-[#dce9ff]'
            }`}
          >
            <Bookmark
              className="h-4 w-4"
              fill={post.savedByMe ? 'currentColor' : 'none'}
              aria-hidden="true"
            />
            <span>{post.savedByMe ? 'Salvo' : 'Salvar'}</span>
          </button>

          <button
            type="button"
            onClick={handleCopyTip}
            className="inline-flex min-h-[40px] items-center gap-1.5 rounded-full bg-[#eff4ff] px-4 py-2 text-xs font-bold text-[#006398] hover:bg-[#dce9ff] transition-colors"
          >
            {copied ? (
              <>
                <Check className="h-4 w-4 text-[#059669]" aria-hidden="true" />
                <span>Resumo copiado</span>
              </>
            ) : (
              <>
                <Copy className="h-4 w-4" aria-hidden="true" />
                <span>Copiar dica</span>
              </>
            )}
          </button>

          {canDelete && onDeletePost && (
            <div className="ml-auto flex items-center gap-1.5">
              {confirmingDelete ? (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      onDeletePost(post.id);
                      setConfirmingDelete(false);
                      onClose();
                    }}
                    className="min-h-[38px] rounded-full bg-[#ba1a1a] px-3.5 text-xs font-bold text-white"
                  >
                    Confirmar exclusão
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmingDelete(false)}
                    className="min-h-[38px] rounded-full bg-[#eff4ff] px-3 text-xs font-semibold text-[#3d4a42]"
                  >
                    Cancelar
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmingDelete(true)}
                  className="inline-flex min-h-[40px] items-center gap-1.5 rounded-full bg-[#ffdad6]/70 px-3.5 py-2 text-xs font-bold text-[#93000a] hover:bg-[#ffdad6] transition-colors"
                >
                  <Trash2 className="h-4 w-4" aria-hidden="true" />
                  <span>Excluir</span>
                </button>
              )}
            </div>
          )}
        </div>

        {/* Comments Section */}
        <div className="mt-6 pt-5 border-t border-[#bccac0]/35">
          <h3 className="text-sm font-bold text-[#0b1c30] mb-3 tabular-nums">
            Comentários da comunidade ({post.comments.length})
          </h3>

          {post.comments.length === 0 ? (
            <p className="text-xs text-[#6d7a72] mb-4">
              Ainda não há comentários. Compartilhe uma adaptação ou dúvida sobre esta prática.
            </p>
          ) : (
            <div className="space-y-3 mb-4">
              {post.comments.map((comment) => (
                <div
                  key={comment.id}
                  className="rounded-2xl bg-[#f8f9ff] p-3.5 border border-[#bccac0]/25"
                >
                  <div className="flex items-center justify-between gap-2 text-xs">
                    <span className="font-bold text-[#0b1c30]">
                      {comment.authorName}{' '}
                      <span className="font-normal text-[#6d7a72]">
                        · {comment.authorRole}
                      </span>
                    </span>
                    <span className="text-[#6d7a72]">{comment.createdAt}</span>
                  </div>
                  <p className="mt-1.5 text-sm text-[#3d4a42] leading-relaxed">
                    {comment.content}
                  </p>
                </div>
              ))}
            </div>
          )}

          <form onSubmit={handleSubmitComment} className="flex items-center gap-2">
            <input
              type="text"
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Escreva uma dica complementar ou dúvida..."
              className="min-h-[44px] flex-1 rounded-full border border-[#e2e8f0] bg-[#f8fafc] px-4 text-sm text-[#0b1c30] placeholder:text-[#6d7a72] focus:border-[#0ea5e9] focus:bg-white focus:outline-none focus:ring-3 focus:ring-[#0ea5e9]/15"
            />
            <button
              type="submit"
              disabled={!commentText.trim()}
              aria-label="Enviar comentário"
              className="eco-cta-gradient inline-flex min-h-[44px] items-center gap-1.5 rounded-full px-4 text-xs font-bold text-white disabled:opacity-45 whitespace-nowrap shrink-0"
            >
              <Send className="h-4 w-4" aria-hidden="true" />
              <span>Enviar</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
