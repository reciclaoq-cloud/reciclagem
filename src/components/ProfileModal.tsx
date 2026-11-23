import React, {useState} from 'react';
import {Bookmark, CheckCircle2, Leaf, LogOut, X} from 'lucide-react';
import {EcoPost} from '../types/eco';
import {AuthUser} from './LoginScreen';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: AuthUser;
  onUpdateUser: (updated: AuthUser) => void;
  onLogout: () => void;
  totalPoints: number;
  totalKg: number;
  completedHabitsCount: number;
  totalHabitsCount: number;
  userPosts: EcoPost[];
  savedPosts: EcoPost[];
  onOpenPost: (post: EcoPost) => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onUpdateUser,
  onLogout,
  totalPoints,
  totalKg,
  completedHabitsCount,
  totalHabitsCount,
  userPosts,
  savedPosts,
  onOpenPost,
}) => {
  const [name, setName] = useState(currentUser.name);
  const [neighborhood, setNeighborhood] = useState(currentUser.neighborhood);
  const [savedFeedback, setSavedFeedback] = useState(false);

  if (!isOpen) return null;

  const co2SavedKg = (totalKg * 1.65).toFixed(1).replace('.', ',');

  const handleSaveProfile = (event: React.FormEvent) => {
    event.preventDefault();
    const cleanName = name.trim() || currentUser.name;
    const parts = cleanName.split(/\s+/).filter(Boolean);
    const initials =
      parts.length >= 2
        ? `${parts[0][0]}${parts[1][0]}`.toUpperCase()
        : cleanName.slice(0, 2).toUpperCase();

    onUpdateUser({
      ...currentUser,
      name: cleanName,
      neighborhood: neighborhood.trim() || currentUser.neighborhood,
      initials,
    });
    setSavedFeedback(true);
    setTimeout(() => setSavedFeedback(false), 2000);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-[#0b1c30]/45 backdrop-blur-sm p-0 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="profile-modal-title"
      onClick={onClose}
    >
      <div
        className="relative max-h-[92vh] w-full max-w-xl overflow-y-auto rounded-t-3xl sm:rounded-3xl bg-white p-5 sm:p-7 shadow-[0_20px_50px_rgba(11,28,48,0.2)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[#e0f2fe] text-sm font-extrabold text-[#006398]">
              {currentUser.initials}
            </span>
            <div>
              <h2
                id="profile-modal-title"
                className="text-lg font-extrabold text-[#0b1c30]"
              >
                {currentUser.name}
              </h2>
              <p className="text-xs text-[#6d7a72]">
                {currentUser.email} · {currentUser.neighborhood}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar perfil"
            className="flex min-h-[40px] min-w-[40px] items-center justify-center rounded-full bg-[#eff4ff] text-[#3d4a42] hover:bg-[#dce9ff]"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        {/* Impact Summary Strip */}
        <div className="mt-5 grid grid-cols-3 gap-3 rounded-2xl bg-[#f8f9ff] p-4 border border-[#bccac0]/30 text-center tabular-nums">
          <div>
            <p className="text-lg font-extrabold text-[#006948]">
              {totalKg.toFixed(2).replace('.', ',')} kg
            </p>
            <p className="text-[11px] font-medium text-[#6d7a72]">
              Desviados de aterro
            </p>
          </div>
          <div>
            <p className="text-lg font-extrabold text-[#006398]">
              {co2SavedKg} kg
            </p>
            <p className="text-[11px] font-medium text-[#6d7a72]">
              CO₂ estimado evitado
            </p>
          </div>
          <div>
            <p className="text-lg font-extrabold text-[#0b1c30]">
              {totalPoints} pts
            </p>
            <p className="text-[11px] font-medium text-[#6d7a72]">
              {completedHabitsCount}/{totalHabitsCount} hábitos hoje
            </p>
          </div>
        </div>

        {/* Edit Profile Form */}
        <form onSubmit={handleSaveProfile} className="mt-5 space-y-3">
          <p className="text-xs font-bold text-[#0b1c30]">Dados do perfil</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input
              type="text"
              aria-label="Nome de exibição"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Seu nome"
              className="min-h-[42px] rounded-full border border-[#e2e8f0] bg-[#f8fafc] px-4 text-sm text-[#0b1c30] focus:border-[#0ea5e9] focus:bg-white focus:outline-none"
            />
            <input
              type="text"
              aria-label="Cidade e Estado"
              value={neighborhood}
              onChange={(e) => setNeighborhood(e.target.value)}
              placeholder="Cidade, Estado (ex.: Curitiba, PR)"
              className="min-h-[42px] rounded-full border border-[#e2e8f0] bg-[#f8fafc] px-4 text-sm text-[#0b1c30] focus:border-[#0ea5e9] focus:bg-white focus:outline-none"
            />
          </div>

          <div className="flex items-center justify-between gap-3">
            <span className="text-xs font-semibold text-[#006948]">
              {savedFeedback ? 'Perfil atualizado.' : ''}
            </span>
            <button
              type="submit"
              className="min-h-[38px] rounded-full bg-[#e0f2fe] px-4 text-xs font-bold text-[#006398] hover:bg-[#cce5ff]"
            >
              Salvar alterações
            </button>
          </div>
        </form>

        {/* Saved & Published Shortcuts */}
        <div className="mt-5 pt-5 border-t border-[#bccac0]/35 space-y-4">
          <div>
            <p className="flex items-center gap-1.5 text-xs font-bold text-[#0b1c30] mb-2">
              <Leaf className="h-3.5 w-3.5 text-[#006948]" aria-hidden="true" />
              <span>Suas publicações ({userPosts.length})</span>
            </p>
            {userPosts.length === 0 ? (
              <p className="text-xs text-[#6d7a72]">
                Você ainda não publicou dicas nesta conta. Use "Publicar Dica" no topo para compartilhar uma prática!
              </p>
            ) : (
              <ul className="space-y-1.5">
                {userPosts.map((p) => (
                  <li key={p.id}>
                    <button
                      type="button"
                      onClick={() => {
                        onOpenPost(p);
                        onClose();
                      }}
                      className="flex w-full items-center justify-between rounded-xl bg-[#f8f9ff] px-3 py-2 text-left text-xs font-semibold text-[#0b1c30] hover:bg-[#eff4ff]"
                    >
                      <span className="truncate">{p.title}</span>
                      <span className="text-[#006948] shrink-0 ml-2">Abrir</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div>
            <p className="flex items-center gap-1.5 text-xs font-bold text-[#0b1c30] mb-2">
              <Bookmark className="h-3.5 w-3.5 text-[#006398]" aria-hidden="true" />
              <span>Itens salvos ({savedPosts.length})</span>
            </p>
            {savedPosts.length === 0 ? (
              <p className="text-xs text-[#6d7a72]">
                Salve qualquer tutorial ou dica de reciclagem para acessar aqui rapidamente.
              </p>
            ) : (
              <ul className="space-y-1.5">
                {savedPosts.map((p) => (
                  <li key={p.id}>
                    <button
                      type="button"
                      onClick={() => {
                        onOpenPost(p);
                        onClose();
                      }}
                      className="flex w-full items-center justify-between rounded-xl bg-[#f8f9ff] px-3 py-2 text-left text-xs font-semibold text-[#0b1c30] hover:bg-[#eff4ff]"
                    >
                      <span className="truncate">{p.title}</span>
                      <span className="text-[#006398] shrink-0 ml-2">Abrir</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-[#bccac0]/35 flex items-center justify-between">
          <span className="inline-flex items-center gap-1.5 text-xs text-[#3d4a42]">
            <CheckCircle2 className="h-3.5 w-3.5 text-[#10b981]" aria-hidden="true" />
            <span>Conta ativa no ReciclaOQ</span>
          </span>
          <button
            type="button"
            onClick={() => {
              onClose();
              onLogout();
            }}
            className="inline-flex min-h-[38px] items-center gap-1.5 rounded-full bg-[#ffdad6]/60 px-4 text-xs font-bold text-[#93000a] hover:bg-[#ffdad6]"
          >
            <LogOut className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Sair da conta</span>
          </button>
        </div>
      </div>
    </div>
  );
};
