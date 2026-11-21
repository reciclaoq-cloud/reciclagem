import {supabase} from '../lib/supabase';
import {
  DailyChallenge,
  EcoComment,
  EcoPost,
  HabitItem,
  IllustrationTheme,
  MaterialType,
  PostCategory,
} from '../types/eco';

export interface RepoUser {
  id?: string;
  name: string;
  email: string;
  neighborhood: string;
  initials: string;
}

interface DbPostRow {
  id: string;
  user_id: string | null;
  author_name: string;
  author_handle: string;
  author_neighborhood: string;
  author_initials: string;
  category: string;
  material: string;
  title: string;
  summary: string;
  materials_needed: string[] | null;
  steps: string[] | null;
  estimated_time: string;
  difficulty: 'Fácil' | 'Intermediário' | null;
  waste_avoided_kg: number;
  illustration: string;
  custom_image_url: string | null;
  likes: number;
  verified_count: number;
  created_at: string;
}

interface DbCommentRow {
  id: string;
  post_id: string;
  author_name: string;
  author_handle: string;
  author_role: string;
  content: string;
  created_at: string;
}

function buildInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'RQ';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

function formatRelativeDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return 'Recentemente';
  const diffMin = Math.floor((Date.now() - date.getTime()) / 60000);
  if (diffMin < 1) return 'Agora mesmo';
  if (diffMin < 60) return `Há ${diffMin} min`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `Há ${diffHours} h`;
  return date.toLocaleDateString('pt-BR');
}

export async function signInSupabase(
  email: string,
  password: string,
): Promise<{user: RepoUser | null; error: string | null}> {
  if (!supabase) return {user: null, error: null};
  try {
    const {data, error} = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error || !data.user) {
      return {
        user: null,
        error: 'E-mail ou senha inválidos no Supabase.',
      };
    }

    const {data: profile} = await supabase
      .from('profiles')
      .select('name, neighborhood, initials')
      .eq('id', data.user.id)
      .maybeSingle();

    const metaName =
      (data.user.user_metadata?.name as string | undefined) ||
      email.split('@')[0];
    const name = profile?.name || metaName;
    const neighborhood =
      profile?.neighborhood ||
      (data.user.user_metadata?.neighborhood as string | undefined) ||
      'Comunidade Local';

    return {
      user: {
        id: data.user.id,
        name,
        email: data.user.email || email,
        neighborhood,
        initials: profile?.initials || buildInitials(name),
      },
      error: null,
    };
  } catch {
    return {user: null, error: 'Não foi possível conectar ao Supabase.'};
  }
}

export async function signUpSupabase(params: {
  name: string;
  email: string;
  password: string;
  neighborhood: string;
}): Promise<{user: RepoUser | null; error: string | null; needsConfirmation?: boolean}> {
  if (!supabase) return {user: null, error: null};
  try {
    const initials = buildInitials(params.name);
    const {data, error} = await supabase.auth.signUp({
      email: params.email,
      password: params.password,
      options: {
        data: {
          name: params.name,
          neighborhood: params.neighborhood,
        },
      },
    });

    if (error) {
      return {
        user: null,
        error: 'Não foi possível criar a conta. Verifique os dados informados.',
      };
    }

    if (data.user && data.session) {
      await supabase.from('profiles').upsert({
        id: data.user.id,
        name: params.name,
        email: params.email,
        neighborhood: params.neighborhood,
        initials,
      });

      return {
        user: {
          id: data.user.id,
          name: params.name,
          email: params.email,
          neighborhood: params.neighborhood,
          initials,
        },
        error: null,
      };
    }

    return {
      user: null,
      error: null,
      needsConfirmation: true,
    };
  } catch {
    return {user: null, error: 'Erro ao cadastrar usuário no Supabase.'};
  }
}

export async function signOutSupabase(): Promise<void> {
  if (!supabase) return;
  try {
    await supabase.auth.signOut();
  } catch {
    // Ignore sign-out errors
  }
}

export async function updateSupabaseProfile(user: RepoUser): Promise<void> {
  if (!supabase || !user.id) return;
  try {
    await supabase.from('profiles').upsert({
      id: user.id,
      name: user.name,
      email: user.email,
      neighborhood: user.neighborhood,
      initials: user.initials,
    });
  } catch {
    // Keep client state resilient
  }
}

export async function fetchSupabasePosts(): Promise<EcoPost[] | null> {
  if (!supabase) return null;
  try {
    const {data: postRows, error: postError} = await supabase
      .from('eco_posts')
      .select('*')
      .order('created_at', {ascending: false});

    if (postError || !postRows) return null;

    const {data: commentRows} = await supabase
      .from('eco_comments')
      .select('*')
      .order('created_at', {ascending: true});

    const commentsByPost = new Map<string, EcoComment[]>();
    (commentRows as DbCommentRow[] | null)?.forEach((c) => {
      const list = commentsByPost.get(c.post_id) || [];
      list.push({
        id: c.id,
        authorName: c.author_name,
        authorHandle: c.author_handle,
        authorRole: c.author_role,
        createdAt: formatRelativeDate(c.created_at),
        content: c.content,
      });
      commentsByPost.set(c.post_id, list);
    });

    return (postRows as DbPostRow[]).map((row) => ({
      id: row.id,
      userId: row.user_id || undefined,
      authorName: row.author_name,
      authorHandle: row.author_handle,
      authorNeighborhood: row.author_neighborhood,
      authorInitials: row.author_initials,
      createdAt: formatRelativeDate(row.created_at),
      timestampOrder: new Date(row.created_at).getTime() || Date.now(),
      category: row.category as Exclude<PostCategory, PostCategory.ALL>,
      material: row.material as Exclude<MaterialType, MaterialType.ALL>,
      title: row.title,
      summary: row.summary,
      materialsNeeded: row.materials_needed || [],
      steps: row.steps || [],
      estimatedTime: row.estimated_time,
      difficulty: row.difficulty || undefined,
      wasteAvoidedKg: Number(row.waste_avoided_kg) || 0.3,
      illustration: (row.illustration as IllustrationTheme) || 'pet-planter',
      customImageUrl: row.custom_image_url || undefined,
      likes: row.likes || 0,
      verifiedCount: row.verified_count || 0,
      comments: commentsByPost.get(row.id) || [],
    }));
  } catch {
    return null;
  }
}

export async function deleteSupabasePost(
  postId: string,
  userId?: string,
): Promise<void> {
  if (!supabase || !userId) return;
  try {
    await supabase
      .from('eco_posts')
      .delete()
      .eq('id', postId)
      .eq('user_id', userId);
  } catch {
    // Keep client state resilient
  }
}

export async function insertSupabasePost(
  post: EcoPost,
  userId?: string,
): Promise<void> {
  if (!supabase || !userId) return;
  try {
    await supabase.from('eco_posts').insert({
      id: post.id,
      user_id: userId,
      author_name: post.authorName,
      author_handle: post.authorHandle,
      author_neighborhood: post.authorNeighborhood,
      author_initials: post.authorInitials,
      category: post.category,
      material: post.material,
      title: post.title,
      summary: post.summary,
      materials_needed: post.materialsNeeded,
      steps: post.steps,
      estimated_time: post.estimatedTime,
      difficulty: post.difficulty || null,
      waste_avoided_kg: post.wasteAvoidedKg,
      illustration: post.illustration,
      custom_image_url: post.customImageUrl || null,
      likes: post.likes,
      verified_count: post.verifiedCount,
    });
  } catch {
    // Keep client state resilient
  }
}

export async function updateSupabasePostCounters(
  postId: string,
  likes: number,
  verifiedCount: number,
): Promise<void> {
  if (!supabase) return;
  try {
    await supabase
      .from('eco_posts')
      .update({likes, verified_count: verifiedCount})
      .eq('id', postId);
  } catch {
    // Keep client state resilient
  }
}

export async function insertSupabaseComment(
  postId: string,
  comment: EcoComment,
  userId?: string,
): Promise<void> {
  if (!supabase || !userId) return;
  try {
    await supabase.from('eco_comments').insert({
      id: comment.id,
      post_id: postId,
      user_id: userId,
      author_name: comment.authorName,
      author_handle: comment.authorHandle,
      author_role: comment.authorRole,
      content: comment.content,
    });
  } catch {
    // Keep client state resilient
  }
}

export async function fetchSupabaseHabits(
  userId: string | undefined,
  baseHabits: HabitItem[],
): Promise<HabitItem[] | null> {
  if (!supabase || !userId) return null;
  try {
    const {data, error} = await supabase
      .from('user_habits')
      .select('habit_id, completed')
      .eq('user_id', userId);
    if (error || !data || data.length === 0) return null;

    const map = new Map<string, boolean>();
    data.forEach((row) => {
      map.set(row.habit_id as string, Boolean(row.completed));
    });
    return baseHabits.map((h) => ({
      ...h,
      completed: map.has(h.id) ? Boolean(map.get(h.id)) : h.completed,
    }));
  } catch {
    return null;
  }
}

export async function upsertSupabaseHabit(
  userId: string | undefined,
  habitId: string,
  completed: boolean,
): Promise<void> {
  if (!supabase || !userId) return;
  try {
    await supabase.from('user_habits').upsert({
      user_id: userId,
      habit_id: habitId,
      completed,
      updated_at: new Date().toISOString(),
    });
  } catch {
    // Keep client state resilient
  }
}

export interface UserPostInteraction {
  postId: string;
  liked: boolean;
  verified: boolean;
  saved: boolean;
}

export async function fetchSupabasePostInteractions(
  userId: string | undefined,
): Promise<Map<string, UserPostInteraction> | null> {
  if (!supabase || !userId) return null;
  try {
    const {data, error} = await supabase
      .from('user_post_interactions')
      .select('post_id, liked, verified, saved')
      .eq('user_id', userId);
    if (error || !data) return null;

    const map = new Map<string, UserPostInteraction>();
    data.forEach((row) => {
      map.set(row.post_id as string, {
        postId: row.post_id as string,
        liked: Boolean(row.liked),
        verified: Boolean(row.verified),
        saved: Boolean(row.saved),
      });
    });
    return map;
  } catch {
    return null;
  }
}

export async function upsertSupabasePostInteraction(
  userId: string | undefined,
  interaction: UserPostInteraction,
): Promise<void> {
  if (!supabase || !userId) return;
  try {
    await supabase.from('user_post_interactions').upsert({
      user_id: userId,
      post_id: interaction.postId,
      liked: interaction.liked,
      verified: interaction.verified,
      saved: interaction.saved,
      updated_at: new Date().toISOString(),
    });
  } catch {
    // Keep client state resilient
  }
}

export async function fetchSupabaseChallenges(
  userId: string | undefined,
  baseChallenges: DailyChallenge[],
): Promise<DailyChallenge[] | null> {
  if (!supabase || !userId) return null;
  try {
    const {data, error} = await supabase
      .from('user_challenge_progress')
      .select('challenge_id, joined, completed_steps')
      .eq('user_id', userId);
    if (error || !data || data.length === 0) return null;

    const map = new Map<string, {joined: boolean; completedSteps: number[]}>();
    data.forEach((row) => {
      map.set(row.challenge_id as string, {
        joined: Boolean(row.joined),
        completedSteps: Array.isArray(row.completed_steps)
          ? (row.completed_steps as number[])
          : [],
      });
    });

    return baseChallenges.map((ch) => {
      const saved = map.get(ch.id);
      if (!saved) return ch;
      return {
        ...ch,
        joined: saved.joined,
        completedSteps: saved.completedSteps,
      };
    });
  } catch {
    return null;
  }
}

export async function upsertSupabaseChallengeProgress(
  userId: string | undefined,
  challengeId: string,
  joined: boolean,
  completedSteps: number[],
): Promise<void> {
  if (!supabase || !userId) return;
  try {
    await supabase.from('user_challenge_progress').upsert({
      user_id: userId,
      challenge_id: challengeId,
      joined,
      completed_steps: completedSteps,
      updated_at: new Date().toISOString(),
    });
  } catch {
    // Keep client state resilient
  }
}
