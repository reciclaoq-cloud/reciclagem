import React, {useEffect, useState} from 'react';
import {
  ArrowRight,
  Eye,
  EyeOff,
  Leaf,
  Palette,
  Recycle,
  X,
} from 'lucide-react';
import {BrandLogo} from './BrandLogo';
import {isSupabaseConfigured} from '../lib/supabase';
import {signInSupabase, signUpSupabase} from '../services/ecoRepository';

export interface AuthUser {
  id?: string;
  isRealUser?: boolean;
  name: string;
  email: string;
  neighborhood: string;
  initials: string;
}

interface StoredAccount extends AuthUser {
  password: string;
}

interface LoginScreenProps {
  onLogin: (user: AuthUser) => void;
  onContinueAsGuest?: () => void;
  initialMode?: 'login' | 'register';
  contextMessage?: string;
  isModal?: boolean;
}

const ACCOUNTS_STORAGE_KEY = 'reciclaoq_accounts_v1';
let memoryAccountsFallback: StoredAccount[] = [];

function loadAccounts(): StoredAccount[] {
  try {
    const raw = window.localStorage.getItem(ACCOUNTS_STORAGE_KEY);
    if (!raw) return memoryAccountsFallback;
    const parsed = JSON.parse(raw) as StoredAccount[];
    memoryAccountsFallback = parsed;
    return parsed;
  } catch {
    return memoryAccountsFallback;
  }
}

function saveAccounts(accounts: StoredAccount[]) {
  memoryAccountsFallback = accounts;
  try {
    window.localStorage.setItem(ACCOUNTS_STORAGE_KEY, JSON.stringify(accounts));
  } catch {
    // Fallback remains active in memory when iframe storage is restricted
  }
}

function buildInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'RQ';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

export const LoginScreen: React.FC<LoginScreenProps> = ({
  onLogin,
  onContinueAsGuest,
  initialMode = 'login',
  contextMessage,
  isModal = false,
}) => {
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [neighborhood, setNeighborhood] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [infoMsg, setInfoMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setMode(initialMode);
    setErrorMsg('');
    setInfoMsg('');
  }, [initialMode]);

  const handleLoginSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setErrorMsg('');
    setInfoMsg('');
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      setErrorMsg('Informe um e-mail válido para entrar.');
      return;
    }
    if (password.trim().length < (isSupabaseConfigured ? 6 : 4)) {
      setErrorMsg(
        isSupabaseConfigured
          ? 'Digite sua senha (mínimo de 6 caracteres).'
          : 'Digite sua senha (mínimo de 4 caracteres).',
      );
      return;
    }

    if (isSupabaseConfigured) {
      setIsSubmitting(true);
      try {
        const {user, error} = await signInSupabase(cleanEmail, password);
        if (error || !user) {
          setErrorMsg(error || 'Não foi possível entrar.');
          return;
        }
        onLogin({...user, isRealUser: true});
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    const accounts = loadAccounts();
    const existing = accounts.find((acc) => acc.email === cleanEmail);

    if (!existing) {
      setErrorMsg(
        'Conta não encontrada. Clique em "Criar conta" acima para cadastrar seu e-mail e senha.',
      );
      return;
    }

    if (existing.password !== password) {
      setErrorMsg('Senha incorreta para este e-mail.');
      return;
    }

    onLogin({
      id: existing.id || `local-${cleanEmail}`,
      isRealUser: true,
      name: existing.name,
      email: existing.email,
      neighborhood: existing.neighborhood,
      initials: existing.initials,
    });
  };

  const handleRegisterSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setErrorMsg('');
    setInfoMsg('');
    const cleanName = name.trim();
    const cleanNeighborhood = neighborhood.trim() || 'Comunidade Local';
    const cleanEmail = email.trim().toLowerCase();

    if (cleanName.length < 2) {
      setErrorMsg('Informe seu nome para criar o perfil.');
      return;
    }
    if (!cleanEmail || !cleanEmail.includes('@')) {
      setErrorMsg('Informe um e-mail válido.');
      return;
    }
    if (password.trim().length < (isSupabaseConfigured ? 6 : 4)) {
      setErrorMsg(
        isSupabaseConfigured
          ? 'Crie uma senha com pelo menos 6 caracteres.'
          : 'Crie uma senha com pelo menos 4 caracteres.',
      );
      return;
    }

    if (isSupabaseConfigured) {
      setIsSubmitting(true);
      try {
        const result = await signUpSupabase({
          name: cleanName,
          email: cleanEmail,
          password,
          neighborhood: cleanNeighborhood,
        });

        if (result.error) {
          setErrorMsg(result.error);
          return;
        }
        if (result.needsConfirmation) {
          setMode('login');
          setInfoMsg(
            'Cadastro criado! Confirme o link enviado para o seu e-mail e depois faça login (ou desative "Confirm email" no painel do Supabase).',
          );
          return;
        }
        if (result.user) {
          onLogin({...result.user, isRealUser: true});
        }
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    const accounts = loadAccounts();
    if (accounts.some((acc) => acc.email === cleanEmail)) {
      setErrorMsg('Este e-mail já está cadastrado. Use a aba "Entrar".');
      return;
    }

    const newAccount: StoredAccount = {
      id: `local-${cleanEmail}`,
      isRealUser: true,
      name: cleanName,
      email: cleanEmail,
      neighborhood: cleanNeighborhood,
      initials: buildInitials(cleanName),
      password,
    };

    saveAccounts([...accounts, newAccount]);
    onLogin({
      id: newAccount.id,
      isRealUser: true,
      name: newAccount.name,
      email: newAccount.email,
      neighborhood: newAccount.neighborhood,
      initials: newAccount.initials,
    });
  };

  const authCard = (
    <div className="eco-card rounded-3xl p-6 sm:p-8 w-full max-w-md mx-auto bg-white">
      <div className="flex items-start justify-between gap-2 mb-5">
        <div>
          <h2 className="text-xl font-extrabold tracking-tight text-[#0b1c30]">
            {mode === 'login' ? 'Acesse sua conta' : 'Crie seu perfil'}
          </h2>
          <p className="mt-0.5 text-xs text-[#6d7a72]">
            {contextMessage ||
              (mode === 'login'
                ? 'Entre na rede ReciclaOQ para publicar e acompanhar seu impacto.'
                : 'Junte-se à comunidade de sustentabilidade e arte com sucata.')}
          </p>
        </div>

        {isModal && onContinueAsGuest && (
          <button
            type="button"
            onClick={onContinueAsGuest}
            aria-label="Fechar login e continuar visualizando"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#eff4ff] text-[#3d4a42] hover:bg-[#dce9ff]"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        )}
      </div>

      {/* Mode Switcher */}
      <div
        className="grid grid-cols-2 gap-1.5 rounded-full bg-[#eff4ff] p-1 mb-5"
        role="tablist"
        aria-label="Modo de acesso"
      >
        <button
          type="button"
          role="tab"
          aria-selected={mode === 'login'}
          onClick={() => {
            setMode('login');
            setErrorMsg('');
            setInfoMsg('');
          }}
          className={`min-h-[40px] rounded-full text-xs font-bold transition-colors ${
            mode === 'login'
              ? 'bg-[#006948] text-white shadow-xs'
              : 'text-[#3d4a42] hover:text-[#0b1c30]'
          }`}
        >
          Entrar
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={mode === 'register'}
          onClick={() => {
            setMode('register');
            setErrorMsg('');
            setInfoMsg('');
          }}
          className={`min-h-[40px] rounded-full text-xs font-bold transition-colors ${
            mode === 'register'
              ? 'bg-[#006398] text-white shadow-xs'
              : 'text-[#3d4a42] hover:text-[#0b1c30]'
          }`}
        >
          Criar conta
        </button>
      </div>

      {mode === 'login' ? (
        <form onSubmit={handleLoginSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="login-email"
              className="block text-xs font-semibold text-[#3d4a42] mb-1.5"
            >
              E-mail
            </label>
            <input
              id="login-email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="voce@exemplo.com"
              className="min-h-[44px] w-full rounded-full border border-[#e2e8f0] bg-[#f8fafc] px-4 text-sm text-[#0b1c30] placeholder:text-[#6d7a72] focus:border-[#0ea5e9] focus:bg-white focus:outline-none focus:ring-3 focus:ring-[#0ea5e9]/15"
            />
          </div>

          <div>
            <label
              htmlFor="login-password"
              className="block text-xs font-semibold text-[#3d4a42] mb-1.5"
            >
              Senha
            </label>
            <div className="relative">
              <input
                id="login-password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Sua senha"
                className="min-h-[44px] w-full rounded-full border border-[#e2e8f0] bg-[#f8fafc] pl-4 pr-12 text-sm text-[#0b1c30] placeholder:text-[#6d7a72] focus:border-[#0ea5e9] focus:bg-white focus:outline-none focus:ring-3 focus:ring-[#0ea5e9]/15"
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                className="absolute right-2 top-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full text-[#6d7a72] hover:bg-[#eff4ff] hover:text-[#0b1c30]"
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" aria-hidden="true" />
                ) : (
                  <Eye className="h-4 w-4" aria-hidden="true" />
                )}
              </button>
            </div>
          </div>

          {errorMsg && (
            <p className="text-xs font-semibold text-[#ba1a1a]" role="alert">
              {errorMsg}
            </p>
          )}

          {infoMsg && (
            <p className="text-xs font-semibold text-[#006948]" role="status">
              {infoMsg}
            </p>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="eco-cta-gradient flex w-full min-h-[46px] items-center justify-center gap-2 rounded-full px-6 text-sm font-bold text-white transition-transform duration-150 active:scale-[0.98] disabled:opacity-60"
          >
            <span>{isSubmitting ? 'Entrando...' : 'Entrar na rede'}</span>
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </button>
        </form>
      ) : (
        <form onSubmit={handleRegisterSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label
                htmlFor="register-name"
                className="block text-xs font-semibold text-[#3d4a42] mb-1.5"
              >
                Nome
              </label>
              <input
                id="register-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Seu nome"
                className="min-h-[44px] w-full rounded-full border border-[#e2e8f0] bg-[#f8fafc] px-4 text-sm text-[#0b1c30] focus:border-[#0ea5e9] focus:bg-white focus:outline-none"
              />
            </div>
            <div>
              <label
                htmlFor="register-neighborhood"
                className="block text-xs font-semibold text-[#3d4a42] mb-1.5"
              >
                Bairro / Cidade
              </label>
              <input
                id="register-neighborhood"
                type="text"
                value={neighborhood}
                onChange={(e) => setNeighborhood(e.target.value)}
                placeholder="Ex.: Pinheiros, SP"
                className="min-h-[44px] w-full rounded-full border border-[#e2e8f0] bg-[#f8fafc] px-4 text-sm text-[#0b1c30] focus:border-[#0ea5e9] focus:bg-white focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="register-email"
              className="block text-xs font-semibold text-[#3d4a42] mb-1.5"
            >
              E-mail
            </label>
            <input
              id="register-email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="voce@exemplo.com"
              className="min-h-[44px] w-full rounded-full border border-[#e2e8f0] bg-[#f8fafc] px-4 text-sm text-[#0b1c30] focus:border-[#0ea5e9] focus:bg-white focus:outline-none"
            />
          </div>

          <div>
            <label
              htmlFor="register-password"
              className="block text-xs font-semibold text-[#3d4a42] mb-1.5"
            >
              Criar senha ({isSupabaseConfigured ? 'mín. 6 caracteres' : 'mín. 4 caracteres'})
            </label>
            <div className="relative">
              <input
                id="register-password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={
                  isSupabaseConfigured ? 'Mínimo 6 caracteres' : 'Mínimo 4 caracteres'
                }
                className="min-h-[44px] w-full rounded-full border border-[#e2e8f0] bg-[#f8fafc] pl-4 pr-12 text-sm text-[#0b1c30] focus:border-[#0ea5e9] focus:bg-white focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                className="absolute right-2 top-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full text-[#6d7a72] hover:bg-[#eff4ff]"
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" aria-hidden="true" />
                ) : (
                  <Eye className="h-4 w-4" aria-hidden="true" />
                )}
              </button>
            </div>
          </div>

          {errorMsg && (
            <p className="text-xs font-semibold text-[#ba1a1a]" role="alert">
              {errorMsg}
            </p>
          )}

          {infoMsg && (
            <p className="text-xs font-semibold text-[#006948]" role="status">
              {infoMsg}
            </p>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="flex w-full min-h-[46px] items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#006398] to-[#0284c7] px-6 text-sm font-bold text-white shadow-[0_6px_18px_rgba(2,132,199,0.25)] transition-transform duration-150 active:scale-[0.98] disabled:opacity-60"
          >
            <span>
              {isSubmitting ? 'Criando conta...' : 'Criar conta e entrar'}
            </span>
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </button>
        </form>
      )}

      {onContinueAsGuest && (
        <>
          <div className="my-5 border-t border-[#bccac0]/35" />
          <button
            type="button"
            onClick={onContinueAsGuest}
            className="flex w-full min-h-[42px] items-center justify-center rounded-full bg-[#eff4ff] px-4 text-xs font-bold text-[#006398] hover:bg-[#dce9ff] transition-colors"
          >
            Continuar visualizando sem cadastro
          </button>
        </>
      )}
    </div>
  );

  if (isModal) {
    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-[#0b1c30]/50 backdrop-blur-sm p-4"
        role="dialog"
        aria-modal="true"
        aria-label="Entrar ou criar conta"
        onClick={onContinueAsGuest}
      >
        <div className="w-full max-w-md" onClick={(e) => e.stopPropagation()}>
          {authCard}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8 md:px-6 lg:px-10">
      <div className="w-full max-w-[1120px] grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
        <section className="lg:col-span-6 space-y-6 text-center lg:text-left">
          <div className="inline-block lg:block">
            <BrandLogo variant="full" className="lg:mx-0" />
          </div>

          <div className="space-y-3">
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#0b1c30] text-balance leading-[1.15]">
              Recicle melhor, reduza desperdícios e crie{' '}
              <span className="text-[#006948]">arte com sucata</span> todos os dias.
            </h1>
            <p className="text-sm sm:text-base text-[#3d4a42] leading-relaxed max-w-xl mx-auto lg:mx-0">
              Conecte-se com vizinhos e criadores para trocar dicas reais de triagem, hábitos de lixo zero e tutoriais passo a passo de reaproveitamento.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-left">
            <div className="eco-card rounded-2xl p-4">
              <Recycle className="h-5 w-5 text-[#006948]" aria-hidden="true" />
              <p className="mt-2 text-sm font-bold text-[#0b1c30]">
                Triagem correta
              </p>
              <p className="mt-1 text-xs text-[#3d4a42] leading-relaxed">
                Guia prático de limpeza e descarte sem contaminar recicláveis.
              </p>
            </div>

            <div className="eco-card rounded-2xl p-4">
              <Leaf className="h-5 w-5 text-[#059669]" aria-hidden="true" />
              <p className="mt-2 text-sm font-bold text-[#0b1c30]">
                Menos desperdício
              </p>
              <p className="mt-1 text-xs text-[#3d4a42] leading-relaxed">
                Hábitos diários, composteira caseira e reaproveitamento integral.
              </p>
            </div>

            <div className="eco-card rounded-2xl p-4">
              <Palette className="h-5 w-5 text-[#006398]" aria-hidden="true" />
              <p className="mt-2 text-sm font-bold text-[#0b1c30]">
                Arte com sucata
              </p>
              <p className="mt-1 text-xs text-[#3d4a42] leading-relaxed">
                Transforme PET, latas, vidros e papelão em peças úteis em casa.
              </p>
            </div>
          </div>
        </section>

        <section className="lg:col-span-6 lg:flex lg:justify-end">
          {authCard}
        </section>
      </div>
    </div>
  );
};
