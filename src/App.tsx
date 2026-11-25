import React, {useEffect, useMemo, useRef, useState} from 'react';
import {
  ArrowLeftRight,
  ArrowUpDown,
  ScanSearch,
  Search,
  Sparkles,
  X,
} from 'lucide-react';
import {
  DROP_OFF_POINTS,
  INITIAL_CHALLENGES,
  INITIAL_HABITS,
  INITIAL_POSTS,
} from './data/ecoSeedData';
import {
  BeforeAfterEntry,
  CategoryPhotoEntry,
  CraftSubcategory,
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
import {
  CRAFT_CATEGORIES,
  CreativeCategoriesStrip,
} from './components/CreativeCategoriesStrip';
import {CategoryPhotoUploadModal} from './components/CategoryPhotoUploadModal';
import {BeforeAfterModal} from './components/BeforeAfterModal';
import {RawMaterialAiTab} from './components/RawMaterialAiTab';
import {ImageZoomModal, ZoomModalData} from './components/ImageZoomModal';
import {isSupabaseConfigured, supabase} from './lib/supabase';
import {
  deleteSupabaseBeforeAfter,
  deleteSupabaseCategoryPhoto,
  deleteSupabasePost,
  fetchSupabaseBeforeAfter,
  fetchSupabaseCategoryPhotos,
  fetchSupabaseChallenges,
  fetchSupabaseHabits,
  fetchSupabasePostInteractions,
  fetchSupabasePosts,
  insertSupabaseBeforeAfter,
  insertSupabaseCategoryPhoto,
  insertSupabaseComment,
  insertSupabasePost,
  signOutSupabase,
  updateSupabasePostCounters,
  updateSupabaseProfile,
  upsertSupabaseChallengeProgress,
  upsertSupabaseHabit,
  upsertSupabasePostInteraction,
} from './services/ecoRepository';

export default function App() {
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [posts, setPosts] = useState<EcoPost[]>(() =>
    isSupabaseConfigured ? [] : INITIAL_POSTS,
  );
  const [categoryPhotos, setCategoryPhotos] = useState<CategoryPhotoEntry[]>(
    [],
  );
  const [beforeAfterEntries, setBeforeAfterEntries] = useState<
    BeforeAfterEntry[]
  >([]);
  const [habits, setHabits] = useState<HabitItem[]>(INITIAL_HABITS);
  const [challenges, setChallenges] =
    useState<DailyChallenge[]>(INITIAL_CHALLENGES);
  const [isLoadingData, setIsLoadingData] = useState<boolean>(
    isSupabaseConfigured,
  );
  const [syncError, setSyncError] = useState<string | null>(null);

  const [activeSection, setActiveSection] = useState<NavSection>('feed');
  const [selectedCategory, setSelectedCategory] = useState<PostCategory>(
    PostCategory.ALL,
  );
  const [selectedCraft, setSelectedCraft] = useState<CraftSubcategory | null>(
    null,
  );
  const [selectedMaterial, setSelectedMaterial] = useState<MaterialType>(
    MaterialType.ALL,
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
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
  const [composerPrefillCraft, setComposerPrefillCraft] = useState<
    CraftSubcategory | undefined
  >(undefined);
  const [composerPrefillTitle, setComposerPrefillTitle] = useState<
    string | undefined
  >(undefined);
  const [composerPrefillSummary, setComposerPrefillSummary] = useState<
    string | undefined
  >(undefined);
  const [composerPrefillMaterialsText, setComposerPrefillMaterialsText] =
    useState<string | undefined>(undefined);
  const [composerPrefillStepsText, setComposerPrefillStepsText] = useState<
    string | undefined
  >(undefined);
  const [composerPrefillBeforeImageUrl, setComposerPrefillBeforeImageUrl] =
    useState<string | undefined>(undefined);
  const [uploadModalCraft, setUploadModalCraft] =
    useState<CraftSubcategory | null>(null);
  const [beforeAfterModalState, setBeforeAfterModalState] = useState<{
    isOpen: boolean;
    craft?: CraftSubcategory;
  }>({isOpen: false});
  const [mapModalState, setMapModalState] = useState<{
    isOpen: boolean;
    material: MaterialType;
    pointId?: string;
  }>({isOpen: false, material: MaterialType.ALL});
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [authModalState, setAuthModalState] = useState<{
    isOpen: boolean;
    mode: 'login' | 'register' | 'forgot' | 'reset';
    message?: string;
  }>({isOpen: false, mode: 'login'});
  const [pendingAction, setPendingAction] = useState<
    | null
    | {type: 'composer'}
    | {type: 'upload'; craft: CraftSubcategory}
    | {type: 'beforeAfter'}
  >(null);
  const [zoomModalData, setZoomModalData] = useState<ZoomModalData | null>(
    null,
  );

  useEffect(() => {
    if (!supabase) return;

    const hash = window.location.hash || '';
    const search = window.location.search || '';
    if (
      (hash.includes('error_code=otp_expired') ||
        hash.includes('error=access_denied') ||
        search.includes('error_code=otp_expired')) &&
      (hash.includes('recovery') ||
        hash.includes('otp_expired') ||
        search.includes('otp_expired'))
    ) {
      setAuthModalState({
        isOpen: true,
        mode: 'forgot',
        message:
          'O link de recuperação expirou ou já foi utilizado. Informe seu e-mail para gerar um novo link.',
      });
      window.history.replaceState(null, '', window.location.pathname);
    }

    const {data: authListener} = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setAuthModalState({
          isOpen: true,
          mode: 'reset',
          message: 'Defina sua nova senha abaixo para acessar sua conta.',
        });
        if (window.location.hash || window.location.search.includes('code=')) {
          window.history.replaceState(null, '', window.location.pathname);
        }
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setIsLoadingData(false);
      return;
    }
    let active = true;
    setIsLoadingData(true);

    (async () => {
      const [
        remotePosts,
        remoteCategoryPhotos,
        remoteBeforeAfter,
        remoteHabits,
        remoteInteractions,
        remoteChallenges,
      ] = await Promise.all([
        fetchSupabasePosts(),
        fetchSupabaseCategoryPhotos(),
        fetchSupabaseBeforeAfter(),
        currentUser?.id
          ? fetchSupabaseHabits(currentUser.id, INITIAL_HABITS)
          : Promise.resolve(null),
        currentUser?.id
          ? fetchSupabasePostInteractions(currentUser.id)
          : Promise.resolve(null),
        currentUser?.id
          ? fetchSupabaseChallenges(currentUser.id, INITIAL_CHALLENGES)
          : Promise.resolve(null),
      ]);
      if (!active) return;

      setSyncError(null);

      const safePhotos = remoteCategoryPhotos || [];
      const safeBeforeAfter = remoteBeforeAfter || [];
      setCategoryPhotos(safePhotos);
      setBeforeAfterEntries(safeBeforeAfter);

      if (remotePosts && remotePosts.length > 0) {
        const hasRemoteReal = remotePosts.some(
          (p) => p.isRealUserPost || Boolean(p.userId),
        );
        const cleanedRemote = hasRemoteReal
          ? remotePosts.filter((p) => p.isRealUserPost || Boolean(p.userId))
          : remotePosts;
        const merged = cleanedRemote.map((post) => {
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
      } else if (safePhotos.length === 0 && safeBeforeAfter.length === 0) {
        setPosts(INITIAL_POSTS);
      } else {
        setPosts([]);
      }

      if (remoteHabits) {
        setHabits(remoteHabits);
      } else if (!currentUser) {
        setHabits(INITIAL_HABITS);
      }
      if (remoteChallenges) {
        setChallenges(remoteChallenges);
      } else if (!currentUser) {
        setChallenges(INITIAL_CHALLENGES);
      }
      setIsLoadingData(false);
    })();

    return () => {
      active = false;
    };
  }, [currentUser]);

  const openAuthModal = (
    mode: 'login' | 'register' = 'login',
    message?: string,
    afterAuth?:
      | {type: 'composer'}
      | {type: 'upload'; craft: CraftSubcategory}
      | {type: 'beforeAfter'},
  ) => {
    setPendingAction(afterAuth || null);
    setAuthModalState({isOpen: true, mode, message});
  };

  const handleAuthSuccess = (user: AuthUser) => {
    setCurrentUser(user);
    setAuthModalState({isOpen: false, mode: 'login'});
    if (pendingAction?.type === 'composer') {
      setIsComposerOpen(true);
    } else if (pendingAction?.type === 'upload') {
      setUploadModalCraft(pendingAction.craft);
    } else if (pendingAction?.type === 'beforeAfter') {
      setBeforeAfterModalState({
        isOpen: true,
        craft: selectedCraft || undefined,
      });
    }
    setPendingAction(null);
  };

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

  const isSeedPost = (postId: string) =>
    INITIAL_POSTS.some((seed) => seed.id === postId);

  const handleToggleLike = (postId: string) => {
    if (!currentUser) {
      openAuthModal(
        'login',
        'Entre ou crie sua conta no Supabase para apoiar publicações.',
      );
      return;
    }
    setPosts((prev) =>
      prev.map((post) => {
        if (post.id !== postId) return post;
        const liked = !post.likedByMe;
        const nextLikes = Math.max(0, post.likes + (liked ? 1 : -1));
        if (!isSeedPost(postId)) {
          void updateSupabasePostCounters(postId, nextLikes, post.verifiedCount);
          void upsertSupabasePostInteraction(currentUser.id, {
            postId,
            liked,
            verified: Boolean(post.verifiedByMe),
            saved: Boolean(post.savedByMe),
          });
        }
        return {
          ...post,
          likedByMe: liked,
          likes: nextLikes,
        };
      }),
    );
  };

  const handleToggleVerify = (postId: string) => {
    if (!currentUser) {
      openAuthModal(
        'login',
        'Entre ou crie sua conta no Supabase para marcar dicas como testadas.',
      );
      return;
    }
    setPosts((prev) =>
      prev.map((post) => {
        if (post.id !== postId) return post;
        const verified = !post.verifiedByMe;
        const nextVerified = Math.max(
          0,
          post.verifiedCount + (verified ? 1 : -1),
        );
        if (!isSeedPost(postId)) {
          void updateSupabasePostCounters(postId, post.likes, nextVerified);
          void upsertSupabasePostInteraction(currentUser.id, {
            postId,
            liked: Boolean(post.likedByMe),
            verified,
            saved: Boolean(post.savedByMe),
          });
        }
        return {
          ...post,
          verifiedByMe: verified,
          verifiedCount: nextVerified,
        };
      }),
    );
  };

  const handleToggleSave = (postId: string) => {
    if (!currentUser) {
      openAuthModal(
        'login',
        'Entre ou crie sua conta no Supabase para salvar publicações no seu perfil.',
      );
      return;
    }
    setPosts((prev) =>
      prev.map((post) => {
        if (post.id !== postId) return post;
        const saved = !post.savedByMe;
        if (!isSeedPost(postId)) {
          void upsertSupabasePostInteraction(currentUser.id, {
            postId,
            liked: Boolean(post.likedByMe),
            verified: Boolean(post.verifiedByMe),
            saved,
          });
        }
        return {...post, savedByMe: saved};
      }),
    );
  };

  const handleAddComment = async (postId: string, content: string) => {
    if (!currentUser) {
      openAuthModal(
        'login',
        'Entre ou crie sua conta para comentar nas publicações da comunidade.',
      );
      return;
    }
    const newComment = {
      id: `comment-${Date.now()}`,
      authorName: currentUser.name,
      authorHandle: `@${currentUser.name.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 14)}`,
      authorRole: currentUser.neighborhood || 'Comunidade',
      createdAt: 'Agora',
      content,
    };
    if (!isSeedPost(postId)) {
      const res = await insertSupabaseComment(postId, newComment, currentUser.id);
      if (!res.ok) {
        setSyncError(
          `Não foi possível salvar o comentário no Supabase: ${res.error || 'erro desconhecido'}`,
        );
        return;
      }
    }

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

  // Enforce: after the first real post with login & password, remove invented seed users
  const handlePublishPost = async (newPost: EcoPost) => {
    if (!currentUser?.id) {
      openAuthModal(
        'login',
        'Entre com sua conta do Supabase para publicar na comunidade.',
        {type: 'composer'},
      );
      return;
    }
    const postWithOwner: EcoPost = {
      ...newPost,
      userId: currentUser.id,
      isRealUserPost: true,
    };
    const res = await insertSupabasePost(postWithOwner, currentUser.id);
    if (!res.ok) {
      setSyncError(
        `Erro ao salvar publicação no Supabase: ${res.error || 'verifique suas políticas RLS e schema.'}`,
      );
      return;
    }
    setSyncError(null);
    setPosts((prev) => {
      const onlyRealPosts = prev.filter(
        (p) => p.isRealUserPost || Boolean(p.userId),
      );
      return [postWithOwner, ...onlyRealPosts];
    });

    if (postWithOwner.beforeImageUrl) {
      const baEntry: BeforeAfterEntry = {
        id: `ba-${Date.now()}`,
        userId: currentUser.id,
        authorName: postWithOwner.authorName,
        authorHandle: postWithOwner.authorHandle,
        authorNeighborhood: postWithOwner.authorNeighborhood,
        authorInitials: postWithOwner.authorInitials,
        craftCategory: postWithOwner.craftSubcategory || 'artesanato',
        material: postWithOwner.material,
        title: postWithOwner.title,
        description: postWithOwner.summary,
        beforeImageUrl: postWithOwner.beforeImageUrl,
        afterImageUrl: postWithOwner.customImageUrl,
        steps: postWithOwner.steps,
        suggestions: [],
        createdAt: 'Agora mesmo',
      };
      void insertSupabaseBeforeAfter(baEntry, currentUser.id).then((baRes) => {
        if (baRes.ok) {
          setBeforeAfterEntries((prev) => [baEntry, ...prev]);
        }
      });
    }

    if (postWithOwner.craftSubcategory) {
      setSelectedCraft(postWithOwner.craftSubcategory);
    }
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

  const handleDeletePost = async (postId: string) => {
    const res = await deleteSupabasePost(postId, currentUser?.id);
    if (!res.ok) {
      setSyncError(
        `Erro ao excluir publicação no Supabase: ${res.error || 'tente novamente.'}`,
      );
      return;
    }
    setPosts((prev) => prev.filter((p) => p.id !== postId));
    setDetailPostId(null);
  };

  const handleSaveCategoryPhoto = async ({
    photo,
    beforeAfter,
  }: {
    photo: CategoryPhotoEntry;
    beforeAfter?: Omit<
      BeforeAfterEntry,
      | 'id'
      | 'userId'
      | 'authorName'
      | 'authorHandle'
      | 'authorNeighborhood'
      | 'authorInitials'
      | 'createdAt'
    >;
  }) => {
    if (!currentUser?.id) return;
    const photoWithOwner: CategoryPhotoEntry = {
      ...photo,
      userId: currentUser.id,
    };
    const photoRes = await insertSupabaseCategoryPhoto(
      photoWithOwner,
      currentUser.id,
    );
    if (!photoRes.ok) {
      setSyncError(
        `Erro ao salvar foto no Supabase: ${photoRes.error || 'tente novamente.'}`,
      );
      return;
    }
    setSyncError(null);
    setCategoryPhotos((prev) => [photoWithOwner, ...prev]);
    setSelectedCraft(photo.craftCategory);

    if (beforeAfter) {
      const entry: BeforeAfterEntry = {
        id: `ba-${Date.now()}`,
        userId: currentUser.id,
        authorName: currentUser.name,
        authorHandle: `@${currentUser.name.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 14) || 'reciclaoq'}`,
        authorNeighborhood: currentUser.neighborhood,
        authorInitials: currentUser.initials,
        ...beforeAfter,
        createdAt: 'Agora mesmo',
      };
      const baRes = await insertSupabaseBeforeAfter(entry, currentUser.id);
      if (!baRes.ok) {
        setSyncError(
          `Foto salva, mas erro ao salvar Antes e Depois no Supabase: ${baRes.error || ''}`,
        );
        return;
      }
      setBeforeAfterEntries((prev) => [entry, ...prev]);
    }
  };

  const handleDeleteCategoryPhoto = async (photoId: string) => {
    const res = await deleteSupabaseCategoryPhoto(photoId, currentUser?.id);
    if (!res.ok) {
      setSyncError(
        `Erro ao excluir foto no Supabase: ${res.error || 'tente novamente.'}`,
      );
      return;
    }
    setCategoryPhotos((prev) => prev.filter((p) => p.id !== photoId));
  };

  const handleAddBeforeAfter = async (entry: BeforeAfterEntry) => {
    const withOwner: BeforeAfterEntry = {
      ...entry,
      userId: currentUser?.id,
    };
    const res = await insertSupabaseBeforeAfter(withOwner, currentUser?.id);
    if (!res.ok) {
      setSyncError(
        `Erro ao registrar Antes e Depois no Supabase: ${res.error || 'tente novamente.'}`,
      );
      return;
    }
    setSyncError(null);
    setBeforeAfterEntries((prev) => [withOwner, ...prev]);
  };

  const handleDeleteBeforeAfter = async (entryId: string) => {
    const res = await deleteSupabaseBeforeAfter(entryId, currentUser?.id);
    if (!res.ok) {
      setSyncError(
        `Erro ao excluir registro no Supabase: ${res.error || 'tente novamente.'}`,
      );
      return;
    }
    setBeforeAfterEntries((prev) => prev.filter((e) => e.id !== entryId));
  };

  const handleToggleHabit = (habitId: string) => {
    if (!currentUser?.id) {
      openAuthModal(
        'login',
        'Entre com sua conta do Supabase para salvar seus hábitos diários.',
      );
      return;
    }
    setHabits((prev) =>
      prev.map((habit) => {
        if (habit.id !== habitId) return habit;
        const nextCompleted = !habit.completed;
        void upsertSupabaseHabit(currentUser.id, habitId, nextCompleted);
        return {...habit, completed: nextCompleted};
      }),
    );
  };

  const handleResetHabits = () => {
    if (!currentUser?.id) {
      openAuthModal(
        'login',
        'Entre com sua conta do Supabase para gerenciar seus hábitos.',
      );
      return;
    }
    setHabits((prev) =>
      prev.map((habit) => {
        void upsertSupabaseHabit(currentUser.id, habit.id, false);
        return {...habit, completed: false};
      }),
    );
  };

  const handleToggleChallengeJoin = (challengeId: string) => {
    if (!currentUser?.id) {
      openAuthModal(
        'login',
        'Entre com sua conta do Supabase para participar dos desafios.',
      );
      return;
    }
    setChallenges((prev) =>
      prev.map((ch) => {
        if (ch.id !== challengeId) return ch;
        const joining = !ch.joined;
        void upsertSupabaseChallengeProgress(
          currentUser.id,
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

  const handleToggleChallengeStep = (
    challengeId: string,
    stepIndex: number,
  ) => {
    if (!currentUser?.id) {
      openAuthModal(
        'login',
        'Entre com sua conta do Supabase para salvar seu progresso nos desafios.',
      );
      return;
    }
    setChallenges((prev) =>
      prev.map((ch) => {
        if (ch.id !== challengeId) return ch;
        const exists = ch.completedSteps.includes(stepIndex);
        const nextSteps = exists
          ? ch.completedSteps.filter((s) => s !== stepIndex)
          : [...ch.completedSteps, stepIndex];
        void upsertSupabaseChallengeProgress(
          currentUser.id,
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
    setComposerPrefillCraft(undefined);
    setComposerPrefillTitle(undefined);
    setComposerPrefillSummary(undefined);
    setComposerPrefillMaterialsText(undefined);
    setComposerPrefillStepsText(undefined);
    setComposerPrefillBeforeImageUrl(undefined);
    if (!currentUser) {
      openAuthModal(
        'login',
        'Entre ou crie sua conta para publicar sua ideia com este material.',
        {type: 'composer'},
      );
      return;
    }
    setIsComposerOpen(true);
  };

  const openComposerFromAiSuggestion = (params: {
    title: string;
    summary: string;
    material: Exclude<MaterialType, MaterialType.ALL>;
    craftCategory: CraftSubcategory;
    materialsNeeded: string[];
    steps: string[];
    beforeImageUrl: string;
  }) => {
    setComposerPrefillMaterial(params.material);
    setComposerPrefillCategory(PostCategory.SCRAP_ART);
    setComposerPrefillCraft(params.craftCategory);
    setComposerPrefillTitle(params.title);
    setComposerPrefillSummary(params.summary);
    setComposerPrefillMaterialsText(params.materialsNeeded.join('\n'));
    setComposerPrefillStepsText(params.steps.join('\n'));
    setComposerPrefillBeforeImageUrl(params.beforeImageUrl);
    if (!currentUser) {
      openAuthModal(
        'login',
        'Entre ou crie sua conta para publicar esta sugestão na comunidade.',
        {type: 'composer'},
      );
      return;
    }
    setIsComposerOpen(true);
  };

  const hasAnyRealUserActivity = useMemo(
    () =>
      posts.some((p) => p.isRealUserPost || Boolean(p.userId)) ||
      categoryPhotos.length > 0 ||
      beforeAfterEntries.length > 0,
    [posts, categoryPhotos, beforeAfterEntries],
  );

  const visibleBasePosts = useMemo(() => {
    if (!hasAnyRealUserActivity) return posts;
    return posts.filter((p) => p.isRealUserPost || Boolean(p.userId));
  }, [posts, hasAnyRealUserActivity]);

  const normalizeSearchText = (value: string) =>
    value
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');

  const internalSearchResults = useMemo(() => {
    const q = normalizeSearchText(searchQuery.trim());
    if (!q) {
      return {
        posts: [] as EcoPost[],
        photos: [] as CategoryPhotoEntry[],
        beforeAfter: [] as BeforeAfterEntry[],
        categories: [] as typeof CRAFT_CATEGORIES,
        total: 0,
      };
    }

    const realPosts = posts.filter((p) => p.isRealUserPost || Boolean(p.userId));
    const matchedPosts = realPosts.filter((post) => {
      const hay = normalizeSearchText(
        [
          post.title,
          post.summary,
          post.material,
          post.category,
          post.craftSubcategory || '',
          post.authorName,
          post.authorNeighborhood,
          ...post.materialsNeeded,
          ...post.steps,
          ...post.comments.map((c) => c.content),
        ].join(' '),
      );
      return hay.includes(q);
    });

    const matchedPhotos = categoryPhotos.filter((photo) => {
      const catLabel =
        CRAFT_CATEGORIES.find((c) => c.id === photo.craftCategory)?.label ||
        photo.craftCategory;
      const hay = normalizeSearchText(
        [
          photo.title,
          photo.material,
          catLabel,
          photo.authorName,
          photo.authorNeighborhood,
          photo.description || '',
          ...(photo.steps || []),
        ].join(' '),
      );
      return hay.includes(q);
    });

    const matchedBeforeAfter = beforeAfterEntries.filter((entry) => {
      const catLabel =
        CRAFT_CATEGORIES.find((c) => c.id === entry.craftCategory)?.label ||
        entry.craftCategory;
      const hay = normalizeSearchText(
        [
          entry.title,
          entry.description,
          entry.material,
          catLabel,
          entry.authorName,
          ...(entry.steps || []),
          ...(entry.suggestions || []).map((s) => `${s.title} ${s.summary}`),
        ].join(' '),
      );
      return hay.includes(q);
    });

    const matchedCategories = CRAFT_CATEGORIES.filter((cat) =>
      normalizeSearchText(`${cat.label} ${cat.shortDesc}`).includes(q),
    );

    return {
      posts: matchedPosts,
      photos: matchedPhotos,
      beforeAfter: matchedBeforeAfter,
      categories: matchedCategories,
      total:
        matchedPosts.length +
        matchedPhotos.length +
        matchedBeforeAfter.length +
        matchedCategories.length,
    };
  }, [searchQuery, posts, categoryPhotos, beforeAfterEntries]);

  const filteredPosts = useMemo(() => {
    const q = normalizeSearchText(searchQuery.trim());

    const list = visibleBasePosts.filter((post) => {
      if (q && !(post.isRealUserPost || Boolean(post.userId))) {
        return false;
      }
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
      if (selectedCraft && post.craftSubcategory !== selectedCraft) {
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
        const hay = normalizeSearchText(
          [
            post.title,
            post.summary,
            post.material,
            post.category,
            post.craftSubcategory || '',
            post.authorName,
            post.authorNeighborhood,
            ...post.materialsNeeded,
            ...post.steps,
            ...post.comments.map((c) => c.content),
          ].join(' '),
        );
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
    visibleBasePosts,
    activeSection,
    selectedCategory,
    selectedCraft,
    selectedMaterial,
    difficultyFilter,
    searchQuery,
    sortBy,
  ]);

  const savedCount = visibleBasePosts.filter((p) => p.savedByMe).length;
  const activeDetailPost =
    visibleBasePosts.find((p) => p.id === detailPostId) || null;

  const userPublishedPosts = visibleBasePosts.filter(
    (p) => p.isRealUserPost || Boolean(p.userId),
  );
  const bonusPoints =
    userPublishedPosts.length * 35 +
    categoryPhotos.length * 20 +
    beforeAfterEntries.length * 40 +
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
  const savedPosts = visibleBasePosts.filter((p) => p.savedByMe);

  const openDropOffMap = (
    material: MaterialType = MaterialType.ALL,
    pointId?: string,
  ) => {
    setMapModalState({isOpen: true, material, pointId});
  };

  const findLinkedBeforeAfter = (post: EcoPost): BeforeAfterEntry | undefined => {
    const cleanTitle = normalizeSearchText(post.title);
    return (
      beforeAfterEntries.find(
        (entry) => normalizeSearchText(entry.title) === cleanTitle,
      ) ||
      beforeAfterEntries.find(
        (entry) =>
          Boolean(post.userId && entry.userId === post.userId) &&
          entry.material === post.material &&
          (!post.craftSubcategory ||
            entry.craftCategory === post.craftSubcategory),
      )
    );
  };

  const openComposerGuarded = () => {
    setComposerPrefillMaterial(undefined);
    setComposerPrefillCategory(
      activeSection === 'scrap-art' ? PostCategory.SCRAP_ART : undefined,
    );
    setComposerPrefillCraft(selectedCraft || undefined);
    setComposerPrefillTitle(undefined);
    setComposerPrefillSummary(undefined);
    setComposerPrefillMaterialsText(undefined);
    setComposerPrefillStepsText(undefined);
    setComposerPrefillBeforeImageUrl(undefined);
    if (!currentUser) {
      openAuthModal(
        'login',
        'Entre ou crie sua conta para publicar dicas e projetos na comunidade.',
        {type: 'composer'},
      );
      return;
    }
    setIsComposerOpen(true);
  };

  return (
    <div className="min-h-screen pb-20 md:pb-12">
      <TopNav
        activeSection={activeSection}
        onSelectSection={handleSelectSection}
        onOpenComposer={openComposerGuarded}
        isLoggedIn={Boolean(currentUser)}
        onOpenAuth={(mode) => openAuthModal(mode)}
      />

      {/* Main 12-column Ecological Glass Container */}
      <main className="mx-auto max-w-[1280px] px-4 md:px-6 lg:px-10 pt-6">
        {syncError && (
          <div
            role="alert"
            className="mb-5 flex items-start justify-between gap-3 rounded-2xl border border-[#f59e0b]/40 bg-[#fffbeb] px-4 py-3 text-xs font-semibold text-[#92400e]"
          >
            <span>{syncError}</span>
            <button
              type="button"
              onClick={() => setSyncError(null)}
              aria-label="Fechar aviso"
              className="shrink-0 rounded-full p-1 hover:bg-[#fef3c7]"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        )}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Community Navigation Pane (Desktop) */}
          <div className="hidden lg:block lg:col-span-3 sticky top-22">
            <LeftSidebar
              activeSection={activeSection}
              onSelectSection={handleSelectSection}
              selectedMaterial={selectedMaterial}
              onSelectMaterial={setSelectedMaterial}
              selectedCraft={selectedCraft}
              onSelectCraft={setSelectedCraft}
              onOpenBeforeAfter={() =>
                setBeforeAfterModalState({
                  isOpen: true,
                  craft: selectedCraft || undefined,
                })
              }
              beforeAfterCount={beforeAfterEntries.length}
              savedCount={savedCount}
              totalPosts={visibleBasePosts.length}
            />
          </div>

          {/* Center Feed / Studio / Viewfinder / Challenges Pane */}
          <div className="lg:col-span-6 space-y-5 min-w-0">
            {(activeSection === 'feed' ||
              activeSection === 'scrap-art' ||
              activeSection === 'saved') && (
              <>
                {/* Editorial Intro + Search + Segmented Category Bar */}
                <section className="eco-card rounded-3xl p-4 sm:p-6">
                  <div className="flex flex-col gap-3">
                    <div className="w-full min-w-0">
                      <h1 className="text-lg sm:text-2xl font-extrabold tracking-tight text-[#0b1c30] leading-snug break-words">
                        {activeSection === 'scrap-art'
                          ? 'Oficina de Arte com Sucata'
                          : activeSection === 'saved'
                            ? 'Suas Dicas e Projetos Salvos'
                            : 'Práticas diárias de reciclagem e reuso'}
                      </h1>
                      <p className="mt-1.5 text-xs sm:text-sm text-[#3d4a42] leading-relaxed break-words">
                        {activeSection === 'scrap-art'
                          ? 'Explore criações em 3D por categoria, envie fotos do que produzir e compare o Antes e Depois.'
                          : activeSection === 'saved'
                            ? 'Consulte rapidamente os tutoriais e hábitos que você guardou para aplicar em casa.'
                            : 'Compartilhe soluções simples de separação, redução de lixo doméstico e arte feita com sucatas.'}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            setBeforeAfterModalState({
                              isOpen: true,
                              craft: selectedCraft || undefined,
                            })
                          }
                          className="inline-flex min-h-[40px] items-center gap-1.5 rounded-full bg-[#e6f7f1] px-3.5 py-2 text-xs font-bold text-[#006948] hover:bg-[#d1fae5] whitespace-nowrap transition-colors"
                        >
                          <ArrowLeftRight className="h-4 w-4" aria-hidden="true" />
                          <span>Antes e Depois</span>
                        </button>

                        {activeSection === 'feed' && (
                          <button
                            type="button"
                            onClick={() => handleSelectSection('triage')}
                            className="inline-flex min-h-[40px] items-center gap-1.5 rounded-full bg-[#e0f2fe] px-3.5 py-2 text-xs font-bold text-[#006398] hover:bg-[#cce5ff] whitespace-nowrap transition-colors"
                          >
                            <ScanSearch className="h-4 w-4" aria-hidden="true" />
                            <span>Escanear material</span>
                          </button>
                        )}
                      </div>

                      {/* Mobile & Tablet Search Symbol Toggle */}
                      <button
                        type="button"
                        onClick={() => {
                          setIsMobileSearchOpen((prev) => {
                            const next = !prev;
                            if (next) {
                              window.setTimeout(() => {
                                searchInputRef.current?.focus();
                              }, 50);
                            } else {
                              setSearchQuery('');
                            }
                            return next;
                          });
                        }}
                        aria-expanded={
                          isMobileSearchOpen || searchQuery.trim().length > 0
                        }
                        aria-label={
                          isMobileSearchOpen
                            ? 'Fechar pesquisa'
                            : 'Pesquisar no site'
                        }
                        className={`lg:hidden flex h-10 w-10 shrink-0 items-center justify-center rounded-full border transition-colors ${
                          isMobileSearchOpen || searchQuery.trim().length > 0
                            ? 'border-[#006948] bg-[#006948] text-white'
                            : 'border-[#e2e8f0] bg-[#f8fafc] text-[#006398] hover:bg-[#e0f2fe]'
                        }`}
                      >
                        {isMobileSearchOpen ? (
                          <X className="h-4 w-4" aria-hidden="true" />
                        ) : (
                          <Search className="h-4 w-4" aria-hidden="true" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Internal Site Search Bar (always visible on desktop, icon-triggered on mobile/tablet) */}
                  <form
                    onSubmit={(e) => e.preventDefault()}
                    className={`mt-3.5 items-center gap-2 ${
                      isMobileSearchOpen || searchQuery.trim().length > 0
                        ? 'flex'
                        : 'hidden lg:flex'
                    }`}
                    role="search"
                  >
                    <div className="relative flex-1 min-w-0">
                      <Search
                        className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6d7a72]"
                        aria-hidden="true"
                      />
                      <input
                        ref={searchInputRef}
                        type="search"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Pesquisar no site por publicações, fotos, materiais..."
                        aria-label="Pesquisar conteúdo publicado por usuários no site"
                        className="min-h-[44px] w-full rounded-full border border-[#e2e8f0] bg-[#f8fafc] pl-11 pr-10 text-sm text-[#0b1c30] placeholder:text-[#6d7a72] transition-all focus:border-[#0ea5e9] focus:bg-white focus:outline-none focus:ring-3 focus:ring-[#0ea5e9]/15"
                      />
                      {searchQuery && (
                        <button
                          type="button"
                          onClick={() => setSearchQuery('')}
                          aria-label="Limpar pesquisa"
                          className="absolute right-2 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-full text-[#6d7a72] hover:bg-[#eff4ff] hover:text-[#0b1c30]"
                        >
                          <X className="h-4 w-4" aria-hidden="true" />
                        </button>
                      )}
                    </div>
                    <button
                      type="submit"
                      aria-label="Buscar"
                      className="inline-flex min-h-[44px] min-w-[44px] shrink-0 items-center justify-center gap-1.5 rounded-full bg-[#006948] px-3 lg:px-4 text-xs font-bold text-white hover:bg-[#005238] transition-colors"
                    >
                      <Search className="h-4 w-4 lg:hidden" aria-hidden="true" />
                      <span className="hidden lg:inline">Buscar</span>
                    </button>
                  </form>

                  {/* Live Internal Search Results (Real User Creations Only) */}
                  {searchQuery.trim().length > 0 && (
                    <div
                      className="mt-3 rounded-2xl border border-[#0284c7]/25 bg-[#f8f9ff] p-3.5 space-y-3"
                      aria-live="polite"
                    >
                      <div className="flex items-center justify-between gap-2 text-xs">
                        <span className="font-extrabold text-[#0b1c30]">
                          Pesquisa interna · {internalSearchResults.total}{' '}
                          {internalSearchResults.total === 1
                            ? 'resultado encontrado'
                            : 'resultados encontrados'}
                        </span>
                        <span className="text-[11px] font-semibold text-[#006398]">
                          Publicações reais de usuários
                        </span>
                      </div>

                      {internalSearchResults.total === 0 ? (
                        <div className="rounded-xl bg-white p-3 text-xs text-[#3d4a42] flex flex-wrap items-center justify-between gap-2">
                          <span>
                            Nenhuma publicação ou foto real de usuário encontrada para{' '}
                            <strong>"{searchQuery.trim()}"</strong>.
                          </span>
                          <button
                            type="button"
                            onClick={openComposerGuarded}
                            className="rounded-full bg-[#006948] px-3 py-1.5 text-[11px] font-bold text-white"
                          >
                            Publicar Dica
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                          {internalSearchResults.posts.length > 0 && (
                            <div className="space-y-1.5">
                              <p className="text-[11px] font-bold uppercase tracking-wide text-[#006948]">
                                Publicações de usuários ({internalSearchResults.posts.length})
                              </p>
                              {internalSearchResults.posts.map((post) => (
                                <button
                                  key={`search-post-${post.id}`}
                                  type="button"
                                  onClick={() => setDetailPostId(post.id)}
                                  className="w-full rounded-xl bg-white p-2.5 text-left border border-[#bccac0]/30 hover:border-[#006948] transition-colors"
                                >
                                  <p className="text-xs font-extrabold text-[#0b1c30] truncate">
                                    {post.title}
                                  </p>
                                  <p className="text-[11px] text-[#6d7a72] truncate">
                                    Por {post.authorName} ({post.authorNeighborhood}) ·{' '}
                                    {post.material}
                                  </p>
                                </button>
                              ))}
                            </div>
                          )}

                          {internalSearchResults.photos.length > 0 && (
                            <div className="space-y-1.5">
                              <p className="text-[11px] font-bold uppercase tracking-wide text-[#006398]">
                                Fotos enviadas nas categorias ({internalSearchResults.photos.length})
                              </p>
                              {internalSearchResults.photos.map((photo) => {
                                const catLabel =
                                  CRAFT_CATEGORIES.find(
                                    (c) => c.id === photo.craftCategory,
                                  )?.label || photo.craftCategory;
                                return (
                                  <button
                                    key={`search-photo-${photo.id}`}
                                    type="button"
                                    onClick={() => {
                                      setSelectedCraft(photo.craftCategory);
                                      setActiveSection('scrap-art');
                                    }}
                                    className="w-full flex items-center gap-2.5 rounded-xl bg-white p-2 text-left border border-[#bccac0]/30 hover:border-[#006398] transition-colors"
                                  >
                                    <img
                                      src={photo.imageUrl}
                                      alt={photo.title}
                                      className="h-10 w-10 rounded-lg object-cover shrink-0"
                                    />
                                    <div className="min-w-0">
                                      <p className="text-xs font-extrabold text-[#0b1c30] truncate">
                                        {photo.title}
                                      </p>
                                      <p className="text-[11px] text-[#6d7a72] truncate">
                                        {catLabel} · {photo.material} · {photo.authorName}
                                      </p>
                                    </div>
                                  </button>
                                );
                              })}
                            </div>
                          )}

                          {internalSearchResults.beforeAfter.length > 0 && (
                            <div className="space-y-1.5">
                              <p className="text-[11px] font-bold uppercase tracking-wide text-[#006948]">
                                Banco Antes e Depois ({internalSearchResults.beforeAfter.length})
                              </p>
                              {internalSearchResults.beforeAfter.map((entry) => (
                                <button
                                  key={`search-ba-${entry.id}`}
                                  type="button"
                                  onClick={() =>
                                    setBeforeAfterModalState({
                                      isOpen: true,
                                      craft: entry.craftCategory,
                                    })
                                  }
                                  className="w-full rounded-xl bg-white p-2.5 text-left border border-[#bccac0]/30 hover:border-[#006948] transition-colors"
                                >
                                  <p className="text-xs font-extrabold text-[#0b1c30] truncate">
                                    {entry.title}
                                  </p>
                                  <p className="text-[11px] text-[#6d7a72] truncate">
                                    {entry.material} · {entry.authorName}
                                  </p>
                                </button>
                              ))}
                            </div>
                          )}

                          {internalSearchResults.categories.length > 0 && (
                            <div className="space-y-1.5">
                              <p className="text-[11px] font-bold uppercase tracking-wide text-[#3d4a42]">
                                Categorias do site
                              </p>
                              <div className="flex flex-wrap gap-1.5">
                                {internalSearchResults.categories.map((cat) => (
                                  <button
                                    key={`search-cat-${cat.id}`}
                                    type="button"
                                    onClick={() => {
                                      setSelectedCraft(cat.id);
                                      setActiveSection('scrap-art');
                                    }}
                                    className="rounded-full bg-white border border-[#bccac0]/40 px-3 py-1.5 text-xs font-bold text-[#006398] hover:border-[#006398]"
                                  >
                                    {cat.label}
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}

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

                {/* 4 Intuitive Blue & Green Craft Categories with 3D Images, Upload & Before/After */}
                {(activeSection === 'feed' || activeSection === 'scrap-art') && (
                  <CreativeCategoriesStrip
                    selectedCraft={selectedCraft}
                    onSelectCraft={setSelectedCraft}
                    onOpenUploadForCraft={(craft) => {
                      if (!currentUser) {
                        openAuthModal(
                          'login',
                          'Entre ou crie sua conta para enviar fotos nesta categoria.',
                          {type: 'upload', craft},
                        );
                        return;
                      }
                      setUploadModalCraft(craft);
                    }}
                    onOpenBeforeAfter={(craft) =>
                      setBeforeAfterModalState({isOpen: true, craft})
                    }
                    categoryPhotos={categoryPhotos}
                    beforeAfterEntries={beforeAfterEntries}
                    currentUserId={currentUser?.id}
                    onDeleteCategoryPhoto={handleDeleteCategoryPhoto}
                    onZoomPhoto={setZoomModalData}
                    beforeAfterCount={beforeAfterEntries.length}
                  />
                )}

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

                {/* Feed List or Loading / Clean Empty State */}
                {isLoadingData && filteredPosts.length === 0 ? (
                  <section className="eco-card rounded-3xl p-8 text-center">
                    <p className="text-sm font-semibold text-[#3d4a42]">
                      Carregando publicações do Supabase...
                    </p>
                  </section>
                ) : filteredPosts.length === 0 ? (
                  <section className="eco-card rounded-3xl p-8 text-center">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#e6f7f1] text-[#006948]">
                      <Sparkles className="h-5 w-5" aria-hidden="true" />
                    </div>
                    <h2 className="mt-3 text-base font-bold text-[#0b1c30]">
                      Nenhuma publicação encontrada para este filtro
                    </h2>
                    <p className="mt-1 text-sm text-[#3d4a42]">
                      Limpe a busca ou publique uma dica prática na comunidade.
                    </p>
                    <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setSearchQuery('');
                          setSelectedCategory(PostCategory.ALL);
                          setSelectedCraft(null);
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
                        onClick={openComposerGuarded}
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
                        linkedBeforeAfter={findLinkedBeforeAfter(post)}
                        onToggleLike={handleToggleLike}
                        onToggleVerify={handleToggleVerify}
                        onToggleSave={handleToggleSave}
                        onOpenDetail={(p) => setDetailPostId(p.id)}
                        onLocateBin={(mat) => openDropOffMap(mat)}
                        onZoomPhoto={setZoomModalData}
                      />
                    ))}
                  </div>
                )}
              </>
            )}

            {activeSection === 'ai-reuse' && (
              <RawMaterialAiTab
                currentUser={currentUser}
                onSaveToBeforeAfter={handleAddBeforeAfter}
                onPublishSuggestionAsPost={openComposerFromAiSuggestion}
              />
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

          {/* Right Personal Impact & Daily Habits Pane */}
          <div className="lg:col-span-3 lg:sticky lg:top-22">
            <RightSidebar
              currentUser={currentUser}
              onLogout={handleLogout}
              onOpenAuth={(mode) => openAuthModal(mode)}
              onOpenProfile={() => setIsProfileOpen(true)}
              habits={habits}
              onToggleHabit={handleToggleHabit}
              onResetHabits={handleResetHabits}
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
              onClick={() => setBeforeAfterModalState({isOpen: true})}
              className="hover:text-[#0b1c30]"
            >
              Antes e Depois
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
        linkedBeforeAfter={
          activeDetailPost ? findLinkedBeforeAfter(activeDetailPost) : undefined
        }
        canDelete={Boolean(
          currentUser &&
            activeDetailPost &&
            ((currentUser.id && activeDetailPost.userId === currentUser.id) ||
              (!activeDetailPost.userId &&
                !INITIAL_POSTS.some((seed) => seed.id === activeDetailPost.id))),
        )}
        onClose={() => setDetailPostId(null)}
        onToggleLike={handleToggleLike}
        onToggleVerify={handleToggleVerify}
        onToggleSave={handleToggleSave}
        onAddComment={handleAddComment}
        onDeletePost={handleDeletePost}
        onZoomPhoto={setZoomModalData}
      />

      <CreatePostModal
        isOpen={isComposerOpen}
        onClose={() => setIsComposerOpen(false)}
        onPublish={handlePublishPost}
        prefillMaterial={composerPrefillMaterial}
        prefillCategory={composerPrefillCategory}
        prefillCraftSubcategory={composerPrefillCraft}
        prefillTitle={composerPrefillTitle}
        prefillSummary={composerPrefillSummary}
        prefillMaterialsText={composerPrefillMaterialsText}
        prefillStepsText={composerPrefillStepsText}
        prefillBeforeImageUrl={composerPrefillBeforeImageUrl}
        defaultAuthorName={currentUser?.name}
        defaultNeighborhood={currentUser?.neighborhood || 'Santo André, SP'}
      />

      <CategoryPhotoUploadModal
        isOpen={Boolean(uploadModalCraft)}
        initialCraft={uploadModalCraft || 'artesanato'}
        authorName={currentUser?.name || 'Membro'}
        authorNeighborhood={currentUser?.neighborhood || 'Santo André, SP'}
        onClose={() => setUploadModalCraft(null)}
        onSavePhoto={handleSaveCategoryPhoto}
      />

      <BeforeAfterModal
        isOpen={beforeAfterModalState.isOpen}
        initialCraft={beforeAfterModalState.craft}
        entries={beforeAfterEntries}
        currentUser={currentUser}
        onClose={() => setBeforeAfterModalState({isOpen: false})}
        onAddEntry={handleAddBeforeAfter}
        onDeleteEntry={handleDeleteBeforeAfter}
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

      {currentUser && (
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
      )}

      {authModalState.isOpen && (
        <LoginScreen
          isModal
          initialMode={authModalState.mode}
          contextMessage={authModalState.message}
          onLogin={handleAuthSuccess}
          onContinueAsGuest={() => {
            setAuthModalState({isOpen: false, mode: 'login'});
            setPendingAction(null);
          }}
        />
      )}

      <ImageZoomModal
        data={zoomModalData}
        onClose={() => setZoomModalData(null)}
      />
    </div>
  );
}
