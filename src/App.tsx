import React, {useEffect, useMemo, useState} from 'react';
import {ArrowUpDown, ScanSearch, Search, Sparkles, X} from 'lucide-react';
import {
  DROP_OFF_POINTS,
  INITIAL_CHALLENGES,
  INITIAL_HABITS,
  INITIAL_POSTS,
} from './data/ecoSeedData';
import {
  DailyChallenge,
  EcoPost,
  HabitItem,
  MaterialType,
  NavSection,
  PostCategory,
  TriageMaterialItem,
} from './types/eco';
import {TopNav} from './components/TopNav';
import {LeftSidebar} from './components/LeftSidebar';
import {RightSidebar} from './components/RightSidebar';
import {PostCard} from './components/PostCard';
import {TriageViewfinder} from './components/TriageViewfinder';
import {ChallengesView} from './components/ChallengesView';
import {PostDetailModal} from './components/PostDetailModal';
import {CreatePostModal} from './components/CreatePostModal';
import {MobileBottomNav} from './components/MobileBottomNav';
import {AuthUser, LoginScreen} from './components/LoginScreen';
import {EcopontosMapModal} from './components/EcopontosMapModal';
import {ProfileModal} from './components/ProfileModal';
import {isSupabaseConfigured} from './lib/supabase';
import {
  deleteSupabasePost,
  fetchSupabaseChallenges,
  fetchSupabaseHabits,
  fetchSupabasePostInteractions,
  fetchSupabasePosts,
  insertSupabaseComment,
  insertSupabasePost,
  signOutSupabase,
  updateSupabasePostCounters,
  updateSupabaseProfile,
  upsertSupabaseChallengeProgress,
  upsertSupabaseHabit,
  upsertSupabasePostInteraction,
} from './services/ecoRepository';

const STORAGE_KEYS = {
  POSTS: 'reciclaoq_posts_v1',
  HABITS: 'reciclaoq_habits_v1',
  CHALLENGES: 'reciclaoq_challenges_v1',
};

function loadStored<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export default function App() {
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [posts, setPosts] = useState<EcoPost[]>(() =>
    loadStored<EcoPost[]>(STORAGE_KEYS.POSTS, INITIAL_POSTS),
  );
  const [habits, setHabits] = useState<HabitItem[]>(() =>
    loadStored<HabitItem[]>(STORAGE_KEYS.HABITS, INITIAL_HABITS),
  );
  const [challenges, setChallenges] = useState<DailyChallenge[]>(() =>
    loadStored<DailyChallenge[]>(STORAGE_KEYS.CHALLENGES, INITIAL_CHALLENGES),
  );

  const [activeSection, setActiveSection] = useState<NavSection>('feed');
  const [selectedCategory, setSelectedCategory] = useState<PostCategory>(
    PostCategory.ALL,
  );
  const [selectedMaterial, setSelectedMaterial] = useState<MaterialType>(
    MaterialType.ALL,
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'recent' | 'popular'>('recent');
  const [difficultyFilter, setDifficultyFilter] = useState<
    'todas' | 'Fácil' | 'Intermediário'
  >('todas');

  const [detailPostId, setDetailPostId] = useState<string | null>(null);
  const [isComposerOpen, setIsComposerOpen] = useState(false);
  const [composerPrefillMaterial, setComposerPrefillMaterial] = useState<
    Exclude<MaterialType, MaterialType.ALL> | undefined
  >(undefined);
  const [composerPrefillCategory, setComposerPrefillCategory] = useState<
    Exclude<PostCategory, PostCategory.ALL> | undefined
  >(undefined);
  const [mapModalState, setMapModalState] = useState<{
    isOpen: boolean;
    material: MaterialType;
    pointId?: string;
  }>({isOpen: false, material: MaterialType.ALL});
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEYS.POSTS, JSON.stringify(posts));
    } catch {
      // Ignore storage quota errors
    }
  }, [posts]);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEYS.HABITS, JSON.stringify(habits));
    } catch {
      // Ignore storage quota errors
    }
  }, [habits]);

  useEffect(() => {
    try {
      window.localStorage.setItem(
        STORAGE_KEYS.CHALLENGES,
        JSON.stringify(challenges),
      );
    } catch {
      // Ignore storage quota errors
    }
  }, [challenges]);

  useEffect(() => {
    if (!currentUser || !isSupabaseConfigured) return;
    let active = true;

    (async () => {
      const [remotePosts, remoteHabits, remoteInteractions, remoteChallenges] =
        await Promise.all([
          fetchSupabasePosts(),
          fetchSupabaseHabits(currentUser.id, INITIAL_HABITS),
          fetchSupabasePostInteractions(currentUser.id),
          fetchSupabaseChallenges(currentUser.id, INITIAL_CHALLENGES),
        ]);
      if (!active) return;

      if (remotePosts && remotePosts.length > 0) {
        const merged = remotePosts.map((post) => {
          const interaction = remoteInteractions?.get(post.id);
          return interaction
            ? {
                ...post,
                likedByMe: interaction.liked,
                verifiedByMe: interaction.verified,
                savedByMe: interaction.saved,
              }
            : post;
        });
        setPosts(merged);
      } else if (remoteInteractions && remoteInteractions.size > 0) {
        setPosts((prev) =>
          prev.map((post) => {
            const interaction = remoteInteractions.get(post.id);
            return interaction
              ? {
                  ...post,
                  likedByMe: interaction.liked,
                  verifiedByMe: interaction.verified,
                  savedByMe: interaction.saved,
                }
              : post;
          }),
        );
      }
      if (remoteHabits) {
        setHabits(remoteHabits);
      }
      if (remoteChallenges) {
        setChallenges(remoteChallenges);
      }
    })();

    return () => {
      active = false;
    };
  }, [currentUser]);

  const handleLogout = () => {
    void signOutSupabase();
    setCurrentUser(null);
  };

  const handleUpdateUser = (updated: AuthUser) => {
    setCurrentUser(updated);
    void updateSupabaseProfile(updated);
  };

  const handleSelectSection = (section: NavSection) => {
    setActiveSection(section);
    if (section === 'scrap-art') {
      setSelectedCategory(PostCategory.SCRAP_ART);
    } else if (section === 'feed') {
      setSelectedCategory(PostCategory.ALL);
    }
    window.scrollTo({top: 0, behavior: 'smooth'});
  };

  const handleToggleLike = (postId: string) => {
    setPosts((prev) =>
      prev.map((post) => {
        if (post.id !== postId) return post;
        const liked = !post.likedByMe;
        const nextLikes = Math.max(0, post.likes + (liked ? 1 : -1));
        void updateSupabasePostCounters(postId, nextLikes, post.verifiedCount);
        void upsertSupabasePostInteraction(currentUser?.id, {
          postId,
          liked,
          verified: Boolean(post.verifiedByMe),
          saved: Boolean(post.savedByMe),
        });
        return {
          ...post,
          likedByMe: liked,
          likes: nextLikes,
        };
      }),
    );
  };

  const handleToggleVerify = (postId: string) => {
    setPosts((prev) =>
      prev.map((post) => {
        if (post.id !== postId) return post;
        const verified = !post.verifiedByMe;
        const nextVerified = Math.max(
          0,
          post.verifiedCount + (verified ? 1 : -1),
        );
        void updateSupabasePostCounters(postId, post.likes, nextVerified);
        void upsertSupabasePostInteraction(currentUser?.id, {
          postId,
          liked: Boolean(post.likedByMe),
          verified,
          saved: Boolean(post.savedByMe),
        });
        return {
          ...post,
          verifiedByMe: verified,
          verifiedCount: nextVerified,
        };
      }),
    );
  };

  const handleToggleSave = (postId: string) => {
    setPosts((prev) =>
      prev.map((post) => {
        if (post.id !== postId) return post;
        const saved = !post.savedByMe;
        void upsertSupabasePostInteraction(currentUser?.id, {
          postId,
          liked: Boolean(post.likedByMe),
          verified: Boolean(post.verifiedByMe),
          saved,
        });
        return {...post, savedByMe: saved};
      }),
    );
  };

  const handleAddComment = (postId: string, content: string) => {
    const newComment = {
      id: `comment-${Date.now()}`,
      authorName: currentUser?.name || 'Você',
      authorHandle: `@${(currentUser?.name || 'reciclaoq').toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 14)}`,
      authorRole: currentUser?.neighborhood || 'Comunidade',
      createdAt: 'Agora',
      content,
    };
    void insertSupabaseComment(postId, newComment, currentUser?.id);

    setPosts((prev) =>
      prev.map((post) => {
        if (post.id !== postId) return post;
        return {
          ...post,
          comments: [...post.comments, newComment],
        };
      }),
    );
  };

  const handlePublishPost = (newPost: EcoPost) => {
    const postWithOwner: EcoPost = {
      ...newPost,
      userId: currentUser?.id,
    };
    void insertSupabasePost(postWithOwner, currentUser?.id);
    setPosts((prev) => [postWithOwner, ...prev]);
    setActiveSection(
      postWithOwner.category === PostCategory.SCRAP_ART ? 'scrap-art' : 'feed',
    );
    setSelectedCategory(
      postWithOwner.category === PostCategory.SCRAP_ART
        ? PostCategory.SCRAP_ART
        : PostCategory.ALL,
    );
    setSelectedMaterial(MaterialType.ALL);
  };

  const handleDeletePost = (postId: string) => {
    void deleteSupabasePost(postId, currentUser?.id);
    setPosts((prev) => prev.filter((p) => p.id !== postId));
    setDetailPostId(null);
  };

  const handleToggleHabit = (habitId: string) => {
    setHabits((prev) =>
      prev.map((habit) => {
        if (habit.id !== habitId) return habit;
        const nextCompleted = !habit.completed;
        void upsertSupabaseHabit(currentUser?.id, habitId, nextCompleted);
        return {...habit, completed: nextCompleted};
      }),
    );
  };

  const handleResetHabits = () => {
    setHabits((prev) =>
      prev.map((habit) => {
        void upsertSupabaseHabit(currentUser?.id, habit.id, false);
        return {...habit, completed: false};
      }),
    );
  };

  const handleToggleChallengeJoin = (challengeId: string) => {
    setChallenges((prev) =>
      prev.map((ch) => {
        if (ch.id !== challengeId) return ch;
        const joining = !ch.joined;
        void upsertSupabaseChallengeProgress(
          currentUser?.id,
          challengeId,
          joining,
          ch.completedSteps,
        );
        return {
          ...ch,
          joined: joining,
          currentParticipants: ch.currentParticipants + (joining ? 1 : -1),
        };
      }),
    );
  };

  const handleToggleChallengeStep = (challengeId: string, stepIndex: number) => {
    setChallenges((prev) =>
      prev.map((ch) => {
        if (ch.id !== challengeId) return ch;
        const exists = ch.completedSteps.includes(stepIndex);
        const nextSteps = exists
          ? ch.completedSteps.filter((s) => s !== stepIndex)
          : [...ch.completedSteps, stepIndex];
        void upsertSupabaseChallengeProgress(
          currentUser?.id,
          challengeId,
          true,
          nextSteps,
        );
        return {
          ...ch,
          joined: true,
          completedSteps: nextSteps,
        };
      }),
    );
  };

  const openComposerWithMaterial = (item: TriageMaterialItem) => {
    setComposerPrefillMaterial(item.material);
    setComposerPrefillCategory(PostCategory.SCRAP_ART);
    setIsComposerOpen(true);
  };

  const filteredPosts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    const list = posts.filter((post) => {
      if (activeSection === 'saved' && !post.savedByMe) return false;
      if (
        activeSection === 'scrap-art' &&
        post.category !== PostCategory.SCRAP_ART
      ) {
        return false;
      }
      if (
        activeSection === 'feed' &&
        selectedCategory !== PostCategory.ALL &&
        post.category !== selectedCategory
      ) {
        return false;
      }
      if (
        selectedMaterial !== MaterialType.ALL &&
        post.material !== selectedMaterial
      ) {
        return false;
      }
      if (
        activeSection === 'scrap-art' &&
        difficultyFilter !== 'todas' &&
        post.difficulty !== difficultyFilter
      ) {
        return false;
      }
      if (q) {
        const hay = [
          post.title,
          post.summary,
          post.material,
          post.authorName,
          post.authorNeighborhood,
          ...post.materialsNeeded,
        ]
          .join(' ')
          .toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });

    return [...list].sort((a, b) => {
      if (sortBy === 'popular') {
        return b.likes + b.verifiedCount - (a.likes + a.verifiedCount);
      }
      return b.timestampOrder - a.timestampOrder;
    });
  }, [
    posts,
    activeSection,
    selectedCategory,
    selectedMaterial,
    difficultyFilter,
    searchQuery,
    sortBy,
  ]);

  const savedCount = posts.filter((p) => p.savedByMe).length;
  const activeDetailPost = posts.find((p) => p.id === detailPostId) || null;

  const userPublishedPosts = posts.filter(
    (p) => !INITIAL_POSTS.some((seed) => seed.id === p.id),
  );
  const bonusPoints =
    userPublishedPosts.length * 35 +
    challenges.reduce((sum, ch) => sum + ch.completedSteps.length * 15, 0);
  const bonusKg = userPublishedPosts.reduce(
    (sum, p) => sum + p.wasteAvoidedKg,
    0,
  );

  const completedHabits = habits.filter((h) => h.completed);
  const habitPoints = completedHabits.reduce((sum, h) => sum + h.points, 0);
  const habitKg = completedHabits.reduce((sum, h) => sum + h.kgSaved, 0);
  const totalUserPoints = 140 + habitPoints + bonusPoints;
  const totalUserKg = 3.4 + habitKg + bonusKg;
  const savedPosts = posts.filter((p) => p.savedByMe);

  const openDropOffMap = (
    material: MaterialType = MaterialType.ALL,
    pointId?: string,
  ) => {
    setMapModalState({isOpen: true, material, pointId});
  };

  if (!currentUser) {
    return <LoginScreen onLogin={setCurrentUser} />;
  }

  return (
    <div className="min-h-screen pb-20 md:pb-12">
      <TopNav
        activeSection={activeSection}
        onSelectSection={handleSelectSection}
        onOpenComposer={() => {
          setComposerPrefillMaterial(undefined);
          setComposerPrefillCategory(
            activeSection === 'scrap-art' ? PostCategory.SCRAP_ART : undefined,
          );
          setIsComposerOpen(true);
        }}
      />

      {/* Main 12-column Ecological Glass Container */}
      <main className="mx-auto max-w-[1280px] px-4 md:px-6 lg:px-10 pt-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Community Navigation Pane (Desktop) */}
          <div className="hidden lg:block lg:col-span-3 sticky top-22">
            <LeftSidebar
              activeSection={activeSection}
              onSelectSection={handleSelectSection}
              selectedMaterial={selectedMaterial}
              onSelectMaterial={setSelectedMaterial}
              savedCount={savedCount}
              totalPosts={posts.length}
            />
          </div>

          {/* Center Feed / Studio / Viewfinder / Challenges Pane */}
          <div className="lg:col-span-6 space-y-5 min-w-0">
            {(activeSection === 'feed' ||
              activeSection === 'scrap-art' ||
              activeSection === 'saved') && (
              <>
                {/* Editorial Intro + Search + Segmented Category Bar */}
                <section className="eco-card rounded-3xl p-5 sm:p-6">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-[#0b1c30] text-balance">
                        {activeSection === 'scrap-art'
                          ? 'Oficina de Arte com Sucata'
                          : activeSection === 'saved'
                            ? 'Suas Dicas e Projetos Salvos'
                            : 'Práticas diárias de reciclagem e reuso'}
                      </h1>
                      <p className="mt-1 text-sm text-[#3d4a42] leading-relaxed">
                        {activeSection === 'scrap-art'
                          ? 'Projetos criativos da comunidade para transformar garrafas, latas, vidros e papelão em objetos úteis.'
                          : activeSection === 'saved'
                            ? 'Consulte rapidamente os tutoriais e hábitos que você guardou para aplicar em casa.'
                            : 'Compartilhe soluções simples de separação, redução de lixo doméstico e arte feita com sucatas.'}
                      </p>
                    </div>

                    {activeSection === 'feed' && (
                      <button
                        type="button"
                        onClick={() => handleSelectSection('triage')}
                        className="inline-flex min-h-[40px] items-center gap-1.5 rounded-full bg-[#e0f2fe] px-3.5 py-2 text-xs font-bold text-[#006398] hover:bg-[#cce5ff] whitespace-nowrap shrink-0 transition-colors"
                      >
                        <ScanSearch className="h-4 w-4" aria-hidden="true" />
                        <span>Escanear material</span>
                      </button>
                    )}
                  </div>

                  {/* Pill Search Bar */}
                  <div className="mt-4 relative">
                    <Search
                      className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6d7a72]"
                      aria-hidden="true"
                    />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Buscar por garrafa PET, composteira, lata, papelão..."
                      aria-label="Buscar dicas e projetos"
                      className="min-h-[44px] w-full rounded-full border border-[#e2e8f0] bg-[#f8fafc] pl-11 pr-11 text-sm text-[#0b1c30] placeholder:text-[#6d7a72] transition-all focus:border-[#0ea5e9] focus:bg-white focus:outline-none focus:ring-3 focus:ring-[#0ea5e9]/15"
                    />
                    {searchQuery && (
                      <button
                        type="button"
                        onClick={() => setSearchQuery('')}
                        aria-label="Limpar busca"
                        className="absolute right-2 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-full text-[#6d7a72] hover:bg-[#eff4ff] hover:text-[#0b1c30]"
                      >
                        <X className="h-4 w-4" aria-hidden="true" />
                      </button>
                    )}
                  </div>

                  {/* Category Segmented Controls + Sort */}
                  <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                    {activeSection === 'feed' ? (
                      <div
                        className="flex flex-wrap items-center gap-1.5"
                        role="group"
                        aria-label="Filtrar por categoria"
                      >
                        {[
                          {id: PostCategory.ALL, label: 'Todos'},
                          {id: PostCategory.RECYCLING, label: 'Reciclagem'},
                          {id: PostCategory.ZERO_WASTE, label: 'Zero Desperdício'},
                          {id: PostCategory.SCRAP_ART, label: 'Arte com Sucata'},
                        ].map((tab) => {
                          const active = selectedCategory === tab.id;
                          return (
                            <button
                              key={tab.id}
                              type="button"
                              onClick={() => setSelectedCategory(tab.id)}
                              className={`min-h-[38px] rounded-full px-3.5 py-1.5 text-xs font-bold whitespace-nowrap shrink-0 transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0284c7] ${
                                active
                                  ? 'bg-[#006948] text-white'
                                  : 'bg-[#eff4ff] text-[#3d4a42] hover:bg-[#dce9ff]'
                              }`}
                            >
                              {tab.label}
                            </button>
                          );
                        })}
                      </div>
                    ) : activeSection === 'scrap-art' ? (
                      <div
                        className="flex flex-wrap items-center gap-1.5"
                        role="group"
                        aria-label="Filtrar por dificuldade"
                      >
                        {(
                          [
                            {id: 'todas', label: 'Todas'},
                            {id: 'Fácil', label: 'Fácil'},
                            {id: 'Intermediário', label: 'Intermediário'},
                          ] as const
                        ).map((diff) => {
                          const active = difficultyFilter === diff.id;
                          return (
                            <button
                              key={diff.id}
                              type="button"
                              onClick={() => setDifficultyFilter(diff.id)}
                              className={`min-h-[38px] rounded-full px-3.5 py-1.5 text-xs font-bold whitespace-nowrap shrink-0 transition-colors duration-150 ${
                                active
                                  ? 'bg-[#006948] text-white'
                                  : 'bg-[#eff4ff] text-[#3d4a42] hover:bg-[#dce9ff]'
                              }`}
                            >
                              {diff.label}
                            </button>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-xs font-semibold text-[#6d7a72] tabular-nums">
                        {filteredPosts.length}{' '}
                        {filteredPosts.length === 1
                          ? 'publicação encontrada'
                          : 'publicações encontradas'}
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={() =>
                        setSortBy((prev) =>
                          prev === 'recent' ? 'popular' : 'recent',
                        )
                      }
                      className="inline-flex min-h-[38px] items-center gap-1.5 rounded-full bg-[#eff4ff] px-3.5 py-1.5 text-xs font-semibold text-[#006398] hover:bg-[#dce9ff] whitespace-nowrap shrink-0"
                    >
                      <ArrowUpDown className="h-3.5 w-3.5" aria-hidden="true" />
                      <span>
                        {sortBy === 'recent' ? 'Mais recentes' : 'Mais apoiados'}
                      </span>
                    </button>
                  </div>

                  {/* Mobile / Tablet Material Filter Strip */}
                  <div className="mt-3 flex lg:hidden items-center gap-1.5 overflow-x-auto pb-1">
                    {[
                      MaterialType.ALL,
                      MaterialType.PET,
                      MaterialType.ALUMINUM,
                      MaterialType.GLASS,
                      MaterialType.CARDBOARD,
                      MaterialType.ORGANIC,
                    ].map((mat) => {
                      const active = selectedMaterial === mat;
                      return (
                        <button
                          key={mat}
                          type="button"
                          onClick={() => setSelectedMaterial(mat)}
                          className={`min-h-[36px] rounded-full px-3 py-1 text-xs font-semibold whitespace-nowrap shrink-0 transition-colors ${
                            active
                              ? 'bg-[#006398] text-white'
                              : 'bg-[#f8fafc] text-[#3d4a42] border border-[#e2e8f0]'
                          }`}
                        >
                          {mat === MaterialType.ALL ? 'Todos os materiais' : mat}
                        </button>
                      );
                    })}
                  </div>
                </section>

                {/* Active Material Filter Notice */}
                {selectedMaterial !== MaterialType.ALL && (
                  <div className="flex items-center justify-between rounded-2xl bg-[#e0f2fe]/70 px-4 py-2.5 text-xs font-semibold text-[#004b73]">
                    <span>
                      Filtrando publicações com material: {selectedMaterial}
                    </span>
                    <button
                      type="button"
                      onClick={() => setSelectedMaterial(MaterialType.ALL)}
                      className="font-bold text-[#006398] hover:underline whitespace-nowrap ml-3"
                    >
                      Mostrar todos
                    </button>
                  </div>
                )}

                {/* Feed List or Clean Empty State */}
                {filteredPosts.length === 0 ? (
                  <section className="eco-card rounded-3xl p-8 text-center">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#e6f7f1] text-[#006948]">
                      <Sparkles className="h-5 w-5" aria-hidden="true" />
                    </div>
                    <h2 className="mt-3 text-base font-bold text-[#0b1c30]">
                      Nenhuma publicação encontrada para este filtro
                    </h2>
                    <p className="mt-1 text-sm text-[#3d4a42]">
                      Limpe a busca ou compartilhe a primeira dica prática com este material.
                    </p>
                    <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setSearchQuery('');
                          setSelectedCategory(PostCategory.ALL);
                          setSelectedMaterial(MaterialType.ALL);
                          if (activeSection === 'saved') {
                            setActiveSection('feed');
                          }
                        }}
                        className="min-h-[40px] rounded-full bg-[#eff4ff] px-4 py-2 text-xs font-bold text-[#006398] hover:bg-[#dce9ff]"
                      >
                        Limpar filtros
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsComposerOpen(true)}
                        className="eco-cta-gradient min-h-[40px] rounded-full px-4 py-2 text-xs font-bold text-white"
                      >
                        Publicar Dica
                      </button>
                    </div>
                  </section>
                ) : (
                  <div className="space-y-5">
                    {filteredPosts.map((post) => (
                      <PostCard
                        key={post.id}
                        post={post}
                        onToggleLike={handleToggleLike}
                        onToggleVerify={handleToggleVerify}
                        onToggleSave={handleToggleSave}
                        onOpenDetail={(p) => setDetailPostId(p.id)}
                        onLocateBin={(mat) => openDropOffMap(mat)}
                      />
                    ))}
                  </div>
                )}
              </>
            )}

            {activeSection === 'triage' && (
              <TriageViewfinder
                onCreatePostWithMaterial={openComposerWithMaterial}
                onOpenDropOffMap={(mat, pointId) =>
                  openDropOffMap(mat, pointId)
                }
              />
            )}

            {activeSection === 'challenges' && (
              <ChallengesView
                challenges={challenges}
                onToggleJoin={handleToggleChallengeJoin}
                onToggleStep={handleToggleChallengeStep}
              />
            )}
          </div>

          {/* Right Personal Impact & Collection Points Pane */}
          <div className="lg:col-span-3 lg:sticky lg:top-22">
            <RightSidebar
              currentUser={currentUser}
              onLogout={handleLogout}
              onOpenProfile={() => setIsProfileOpen(true)}
              habits={habits}
              onToggleHabit={handleToggleHabit}
              onResetHabits={handleResetHabits}
              dropOffPoints={DROP_OFF_POINTS}
              selectedMaterial={selectedMaterial}
              onOpenDropOffMap={(mat, pointId) =>
                openDropOffMap(mat || MaterialType.ALL, pointId)
              }
              bonusPoints={bonusPoints}
              bonusKg={bonusKg}
            />
          </div>
        </div>

        {/* Clean Community Footer */}
        <footer className="mt-10 border-t border-[#bccac0]/40 pt-6 pb-4 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#6d7a72]">
          <p className="font-medium">
            ReciclaOQ · Rede comunitária de reciclagem, lixo zero e arte com sucata.
          </p>
          <div className="flex flex-wrap items-center gap-5 font-semibold">
            <button
              type="button"
              onClick={() => handleSelectSection('feed')}
              className="hover:text-[#0b1c30]"
            >
              Comunidade
            </button>
            <button
              type="button"
              onClick={() => handleSelectSection('scrap-art')}
              className="hover:text-[#0b1c30]"
            >
              Arte com Sucata
            </button>
            <button
              type="button"
              onClick={() => handleSelectSection('triage')}
              className="hover:text-[#0b1c30]"
            >
              Scanner de Triagem
            </button>
            <button
              type="button"
              onClick={() => openDropOffMap(MaterialType.ALL)}
              className="hover:text-[#0b1c30]"
            >
              Mapa de Ecopontos
            </button>
          </div>
        </footer>
      </main>

      <MobileBottomNav
        activeSection={activeSection}
        onSelectSection={handleSelectSection}
      />

      <PostDetailModal
        post={activeDetailPost}
        canDelete={Boolean(
          activeDetailPost &&
            ((currentUser.id && activeDetailPost.userId === currentUser.id) ||
              !INITIAL_POSTS.some((seed) => seed.id === activeDetailPost.id)),
        )}
        onClose={() => setDetailPostId(null)}
        onToggleLike={handleToggleLike}
        onToggleVerify={handleToggleVerify}
        onToggleSave={handleToggleSave}
        onAddComment={handleAddComment}
        onDeletePost={handleDeletePost}
      />

      <CreatePostModal
        isOpen={isComposerOpen}
        onClose={() => setIsComposerOpen(false)}
        onPublish={handlePublishPost}
        prefillMaterial={composerPrefillMaterial}
        prefillCategory={composerPrefillCategory}
        defaultAuthorName={currentUser.name}
        defaultNeighborhood={currentUser.neighborhood}
      />

      <EcopontosMapModal
        isOpen={mapModalState.isOpen}
        onClose={() =>
          setMapModalState((prev) => ({...prev, isOpen: false}))
        }
        dropOffPoints={DROP_OFF_POINTS}
        initialMaterial={mapModalState.material}
        initialPointId={mapModalState.pointId}
        onFilterFeedByMaterial={(mat) => {
          setSelectedMaterial(mat);
          setActiveSection('feed');
        }}
      />

      <ProfileModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        currentUser={currentUser}
        onUpdateUser={handleUpdateUser}
        onLogout={handleLogout}
        totalPoints={totalUserPoints}
        totalKg={totalUserKg}
        completedHabitsCount={completedHabits.length}
        totalHabitsCount={habits.length}
        userPosts={userPublishedPosts}
        savedPosts={savedPosts}
        onOpenPost={(p) => setDetailPostId(p.id)}
      />
    </div>
  );
}
