import React, {useState} from 'react';
import {
  ArrowRight,
  Eye,
  EyeOff,
  Leaf,
  Palette,
  Recycle,
} from 'lucide-react';
import {BrandLogo} from './BrandLogo';

export interface AuthUser {
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
}

const ACCOUNTS_STORAGE_KEY = 'reciclaoq_accounts_v1';

function loadAccounts(): StoredAccount[] {
  try {
    const raw = window.localStorage.getItem(ACCOUNTS_STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as StoredAccount[];
  } catch {
    return [];
  }
}

function saveAccounts(accounts: StoredAccount[]) {
  try {
    window.localStorage.setItem(ACCOUNTS_STORAGE_KEY, JSON.stringify(accounts));
  } catch {
    // Ignore storage quota errors
  }
}

function buildInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'RQ';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

export const LoginScreen: React.FC<LoginScreenProps> = ({onLogin}) => {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [neighborhood, setNeighborhood] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleLoginSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      setErrorMsg('Informe um e-mail válido para entrar.');
      return;
    }
    if (password.trim().length < 4) {
      setErrorMsg('Digite sua senha (mínimo de 4 caracteres).');
      return;
    }

    const accounts = loadAccounts();
    const existing = accounts.find((acc) => acc.email === cleanEmail);

    if (existing) {
      if (existing.password !== password) {
        setErrorMsg('Senha incorreta para este e-mail.');
        return;
      }
      setErrorMsg('');
      onLogin({
        name: existing.name,
        email: existing.email,
        neighborhood: existing.neighborhood,
        initials: existing.initials,
      });
      return;
    }

    // Allow immediate entry for any new email/password combination in community preview
    const derivedName = cleanEmail
      .split('@')[0]
      .replace(/[._-]+/g, ' ')
      .replace(/\b\w/g, (char) => char.toUpperCase());

    setErrorMsg('');
    onLogin({
      name: derivedName || 'Membro ReciclaOQ',
      email: cleanEmail,
      neighborhood: 'Comunidade Local',
      initials: buildInitials(derivedName || 'RQ'),
    });
  };

  const handleRegisterSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const cleanName = name.trim();
    const cleanNeighborhood = neighborhood.trim() || 'Bairro Sustentável';
    const cleanEmail = email.trim().toLowerCase();

    if (cleanName.length < 2) {
      setErrorMsg('Informe seu nome para criar o perfil.');
      return;
    }
    if (!cleanEmail || !cleanEmail.includes('@')) {
      setErrorMsg('Informe um e-mail válido.');
      return;
    }
    if (password.trim().length < 4) {
      setErrorMsg('Crie uma senha com pelo menos 4 caracteres.');
      return;
    }

    const accounts = loadAccounts();
    if (accounts.some((acc) => acc.email === cleanEmail)) {
      setErrorMsg('Este e-mail já está cadastrado. Use a aba Entrar.');
      return;
    }

    const newAccount: StoredAccount = {
      name: cleanName,
      email: cleanEmail,
      neighborhood: cleanNeighborhood,
      initials: buildInitials(cleanName),
      password,
    };

    saveAccounts([...accounts, newAccount]);
    setErrorMsg('');
    onLogin({
      name: newAccount.name,
      email: newAccount.email,
      neighborhood: newAccount.neighborhood,
      initials: newAccount.initials,
    });
  };

  const handleDemoAccess = () => {
    setErrorMsg('');
    onLogin({
      name: 'Marina Vasconcelos',
      email: 'reciclaoq@gmail.com',
      neighborhood: 'Vila Mariana, SP',
      initials: 'MV',
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8 md:px-6 lg:px-10">
      <div className="w-full max-w-[1120px] grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
        {/* Left Brand & Community Value Column */}
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

        {/* Right Ecological Glass Login Card */}
        <section className="lg:col-span-6">
          <div className="eco-card rounded-3xl p-6 sm:p-8 max-w-md mx-auto lg:ml-auto lg:mr-0">
            <div className="flex items-center justify-between gap-2 mb-6">
              <div>
                <h2 className="text-xl font-extrabold tracking-tight text-[#0b1c30]">
                  {mode === 'login' ? 'Acesse sua conta' : 'Crie seu perfil'}
                </h2>
                <p className="mt-0.5 text-xs text-[#6d7a72]">
                  {mode === 'login'
                    ? 'Entre na rede ReciclaOQ para publicar e acompanhar seu impacto.'
                    : 'Junte-se à comunidade de sustentabilidade e upcycling.'}
                </p>
              </div>
            </div>

            {/* Mode Switcher */}
            <div
              className="grid grid-cols-2 gap-1.5 rounded-full bg-[#eff4ff] p-1 mb-6"
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

                <button
                  type="submit"
                  className="eco-cta-gradient flex w-full min-h-[46px] items-center justify-center gap-2 rounded-full px-6 text-sm font-bold text-white transition-transform duration-150 active:scale-[0.98]"
                >
                  <span>Entrar na rede</span>
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
                    Criar senha
                  </label>
                  <div className="relative">
                    <input
                      id="register-password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="new-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Mínimo 4 caracteres"
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

                <button
                  type="submit"
                  className="flex w-full min-h-[46px] items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#006398] to-[#0284c7] px-6 text-sm font-bold text-white shadow-[0_6px_18px_rgba(2,132,199,0.25)] transition-transform duration-150 active:scale-[0.98]"
                >
                  <span>Criar conta e entrar</span>
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </button>
              </form>
            )}

            <div className="my-5 border-t border-[#bccac0]/35" />

            <button
              type="button"
              onClick={handleDemoAccess}
              className="flex w-full min-h-[42px] items-center justify-center rounded-full bg-[#e0f2fe] px-4 text-xs font-bold text-[#006398] hover:bg-[#cce5ff] transition-colors"
            >
              Entrar rapidamente com conta de demonstração
            </button>
          </div>
        </section>
      </div>
    </div>
  );
};
