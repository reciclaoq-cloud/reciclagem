import {supabase} from '../lib/supabase';
import {
  BeforeAfterEntry,
  BeforeAfterSuggestion,
  CategoryPhotoEntry,
  CraftSubcategory,
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
  isRealUser?: boolean;
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
  craft_subcategory?: string | null;
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
  before_image_url?: string | null;
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

interface DbCategoryPhotoRow {
  id: string;
  user_id: string | null;
  author_name: string;
  author_neighborhood: string;
  craft_category: string;
  material: string;
  title: string;
  description?: string | null;
  steps?: string[] | null;
  image_url: string;
  created_at: string;
}

interface DbBeforeAfterRow {
  id: string;
  user_id: string | null;
  author_name: string;
  author_handle: string;
  author_neighborhood: string;
  author_initials: string;
  craft_category: string;
  material: string;
  title: string;
  description: string;
  before_image_url: string;
  after_image_url: string | null;
  steps?: string[] | null;
  suggestions?: BeforeAfterSuggestion[] | null;
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

function translateAuthError(message: string, mode: 'login' | 'signup'): string {
  const lower = message.toLowerCase();
  if (lower.includes('invalid path') || lower.includes('request url')) {
    return 'URL do Supabase inválida (VITE_SUPABASE_URL deve conter apenas https://SEU-PROJETO.supabase.co, sem /rest/v1, /auth/v1 ou /dashboard).';
  }
  if (lower.includes('email not confirmed')) {
    return 'E-mail ainda não confirmado. Confira sua caixa de entrada ou desative "Confirm email" no Supabase (Authentication → Providers → Email).';
  }
  if (lower.includes('invalid login credentials')) {
    return 'E-mail ou senha incorretos.';
  }
  if (lower.includes('user already registered') || lower.includes('already been registered')) {
    return 'Este e-mail já está cadastrado. Use a aba "Entrar".';
  }
  if (lower.includes('password') && lower.includes('6')) {
    return 'A senha precisa ter pelo menos 6 caracteres.';
  }
  if (lower.includes('signups not allowed')) {
    return 'Novos cadastros estão desativados no painel do Supabase (Authentication → Providers → Email).';
  }
  if (lower.includes('rate limit')) {
    return 'Muitas tentativas em sequência. Aguarde alguns instantes e tente novamente.';
  }
  if (lower.includes('failed to fetch') || lower.includes('network')) {
    return 'Sem conexão com o servidor Supabase. Verifique VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY.';
  }
  return mode === 'signup'
    ? `Não foi possível criar a conta: ${message}`
    : `Não foi possível entrar: ${message}`;
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
        error: error
          ? translateAuthError(error.message, 'login')
          : 'E-mail ou senha inválidos no Supabase.',
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
        isRealUser: true,
        name,
        email: data.user.email || email,
        neighborhood,
        initials: profile?.initials || buildInitials(name),
      },
      error: null,
    };
  } catch (err) {
    return {
      user: null,
      error:
        err instanceof Error
          ? translateAuthError(err.message, 'login')
          : 'Não foi possível conectar ao Supabase.',
    };
  }
}

export async function signUpSupabase(params: {
  name: string;
  email: string;
  password: string;
  neighborhood: string;
}): Promise<{
  user: RepoUser | null;
  error: string | null;
  needsConfirmation?: boolean;
}> {
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
        error: translateAuthError(error.message, 'signup'),
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
          isRealUser: true,
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
  } catch (err) {
    return {
      user: null,
      error:
        err instanceof Error
          ? translateAuthError(err.message, 'signup')
          : 'Erro ao cadastrar usuário no Supabase.',
    };
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

export async function requestPasswordResetSupabase(
  email: string,
): Promise<{ok: boolean; error: string | null}> {
  if (!supabase) {
    return {
      ok: false,
      error: 'Configure o Supabase para enviar e-mails de recuperação.',
    };
  }
  try {
    const redirectTo =
      typeof window !== 'undefined'
        ? `${window.location.origin}${window.location.pathname}`
        : undefined;
    const {error} = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo,
    });
    if (error) {
      const lower = error.message.toLowerCase();
      if (lower.includes('rate limit') || lower.includes('too many')) {
        return {
          ok: false,
          error:
            'Muitas solicitações seguidas. Aguarde alguns instantes antes de pedir outro link.',
        };
      }
      if (lower.includes('invalid') && lower.includes('email')) {
        return {ok: false, error: 'Informe um endereço de e-mail válido.'};
      }
      return {
        ok: false,
        error: `Não foi possível enviar o e-mail de recuperação: ${error.message}`,
      };
    }
    return {ok: true, error: null};
  } catch (err) {
    return {
      ok: false,
      error:
        err instanceof Error
          ? err.message
          : 'Erro ao solicitar recuperação de senha no Supabase.',
    };
  }
}

export async function updateSupabasePassword(
  newPassword: string,
): Promise<{user: RepoUser | null; error: string | null}> {
  if (!supabase) {
    return {user: null, error: 'Sessão Supabase indisponível.'};
  }
  try {
    const {data, error} = await supabase.auth.updateUser({
      password: newPassword,
    });
    if (error || !data.user) {
      const msg = error?.message || 'Não foi possível redefinir a senha.';
      if (msg.toLowerCase().includes('different from the old password')) {
        return {
          user: null,
          error: 'A nova senha precisa ser diferente da senha anterior.',
        };
      }
      return {user: null, error: msg};
    }

    const {data: profile} = await supabase
      .from('profiles')
      .select('name, neighborhood, initials')
      .eq('id', data.user.id)
      .maybeSingle();

    const email = data.user.email || '';
    const metaName =
      (data.user.user_metadata?.name as string | undefined) ||
      email.split('@')[0] ||
      'Membro';
    const name = profile?.name || metaName;
    const neighborhood =
      profile?.neighborhood ||
      (data.user.user_metadata?.neighborhood as string | undefined) ||
      'Santo André, SP';

    return {
      user: {
        id: data.user.id,
        isRealUser: true,
        name,
        email,
        neighborhood,
        initials: profile?.initials || buildInitials(name),
      },
      error: null,
    };
  } catch (err) {
    return {
      user: null,
      error:
        err instanceof Error
          ? err.message
          : 'Erro ao atualizar a senha no Supabase.',
    };
  }
}

export async function updateSupabaseProfile(
  user: RepoUser,
): Promise<{ok: boolean; error?: string}> {
  if (!supabase || !user.id) {
    return {ok: false, error: 'Sessão Supabase indisponível.'};
  }
  try {
    const {error} = await supabase.from('profiles').upsert({
      id: user.id,
      name: user.name,
      email: user.email,
      neighborhood: user.neighborhood,
      initials: user.initials,
    });
    return error ? {ok: false, error: error.message} : {ok: true};
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Erro ao atualizar perfil.',
    };
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
      isRealUserPost: Boolean(row.user_id),
      authorName: row.author_name,
      authorHandle: row.author_handle,
      authorNeighborhood: row.author_neighborhood,
      authorInitials: row.author_initials,
      createdAt: formatRelativeDate(row.created_at),
      timestampOrder: new Date(row.created_at).getTime() || Date.now(),
      category: row.category as Exclude<PostCategory, PostCategory.ALL>,
      craftSubcategory:
        (row.craft_subcategory as CraftSubcategory | null) || undefined,
      material: row.material as Exclude<MaterialType, MaterialType.ALL>,
      title: row.title,
      summary: row.summary,
      materialsNeeded: row.materials_needed || [],
      steps: row.steps || [],
      estimatedTime: row.estimated_time,
      difficulty: row.difficulty || undefined,
      wasteAvoidedKg: Number(row.waste_avoided_kg) || 0.3,
      illustration: (row.illustration as IllustrationTheme) || 'craft-artesanato',
      customImageUrl: row.custom_image_url || undefined,
      beforeImageUrl: row.before_image_url || undefined,
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
): Promise<{ok: boolean; error?: string}> {
  if (!supabase || !userId) {
    return {ok: false, error: 'Faça login no Supabase para excluir.'};
  }
  try {
    const {error} = await supabase
      .from('eco_posts')
      .delete()
      .eq('id', postId)
      .eq('user_id', userId);
    return error ? {ok: false, error: error.message} : {ok: true};
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Erro ao excluir publicação.',
    };
  }
}

export async function insertSupabasePost(
  post: EcoPost,
  userId?: string,
): Promise<{ok: boolean; error?: string}> {
  if (!supabase || !userId) {
    return {ok: false, error: 'Faça login no Supabase para publicar.'};
  }
  try {
    const basePostPayload = {
      id: post.id,
      user_id: userId,
      author_name: post.authorName,
      author_handle: post.authorHandle,
      author_neighborhood: post.authorNeighborhood,
      author_initials: post.authorInitials,
      category: post.category,
      craft_subcategory: post.craftSubcategory || null,
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
    };

    const fullPostPayload: Record<string, unknown> = post.beforeImageUrl
      ? {...basePostPayload, before_image_url: post.beforeImageUrl}
      : basePostPayload;

    const {error} = await supabase.from('eco_posts').insert(fullPostPayload);

    if (error && post.beforeImageUrl && error.message.includes('before_image_url')) {
      const retry = await supabase.from('eco_posts').insert(basePostPayload);
      return retry.error
        ? {ok: false, error: retry.error.message}
        : {ok: true};
    }

    return error ? {ok: false, error: error.message} : {ok: true};
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Erro ao salvar publicação.',
    };
  }
}

export async function updateSupabasePostCounters(
  postId: string,
  likes: number,
  verifiedCount: number,
): Promise<{ok: boolean; error?: string}> {
  if (!supabase) return {ok: false, error: 'Supabase não configurado.'};
  try {
    const {error} = await supabase
      .from('eco_posts')
      .update({likes, verified_count: verifiedCount})
      .eq('id', postId);
    return error ? {ok: false, error: error.message} : {ok: true};
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Erro ao atualizar contadores.',
    };
  }
}

export async function insertSupabaseComment(
  postId: string,
  comment: EcoComment,
  userId?: string,
): Promise<{ok: boolean; error?: string}> {
  if (!supabase || !userId) {
    return {ok: false, error: 'Faça login no Supabase para comentar.'};
  }
  try {
    const {error} = await supabase.from('eco_comments').insert({
      id: comment.id,
      post_id: postId,
      user_id: userId,
      author_name: comment.authorName,
      author_handle: comment.authorHandle,
      author_role: comment.authorRole,
      content: comment.content,
    });
    return error ? {ok: false, error: error.message} : {ok: true};
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Erro ao salvar comentário.',
    };
  }
}

export async function fetchSupabaseCategoryPhotos(): Promise<
  CategoryPhotoEntry[] | null
> {
  if (!supabase) return null;
  try {
    const {data, error} = await supabase
      .from('category_photos')
      .select('*')
      .order('created_at', {ascending: false});
    if (error || !data) return null;
    return (data as DbCategoryPhotoRow[]).map((row) => ({
      id: row.id,
      userId: row.user_id || undefined,
      authorName: row.author_name,
      authorNeighborhood: row.author_neighborhood,
      craftCategory: row.craft_category as CraftSubcategory,
      material: row.material as Exclude<MaterialType, MaterialType.ALL>,
      title: row.title,
      description: row.description || undefined,
      steps: Array.isArray(row.steps) ? row.steps : undefined,
      imageUrl: row.image_url,
      createdAt: formatRelativeDate(row.created_at),
    }));
  } catch {
    return null;
  }
}

export async function insertSupabaseCategoryPhoto(
  photo: CategoryPhotoEntry,
  userId?: string,
): Promise<{ok: boolean; error?: string}> {
  if (!supabase || !userId) {
    return {ok: false, error: 'Faça login no Supabase para enviar fotos.'};
  }
  try {
    const basePayload = {
      id: photo.id,
      user_id: userId,
      author_name: photo.authorName,
      author_neighborhood: photo.authorNeighborhood,
      craft_category: photo.craftCategory,
      material: photo.material,
      title: photo.title,
      image_url: photo.imageUrl,
    };

    const {error} = await supabase.from('category_photos').insert({
      ...basePayload,
      description: photo.description || '',
      steps: photo.steps || [],
    });

    if (
      error &&
      (error.message.includes('description') || error.message.includes('steps'))
    ) {
      const retry = await supabase.from('category_photos').insert(basePayload);
      return retry.error
        ? {ok: false, error: retry.error.message}
        : {ok: true};
    }

    return error ? {ok: false, error: error.message} : {ok: true};
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Erro ao enviar foto.',
    };
  }
}

export async function deleteSupabaseCategoryPhoto(
  photoId: string,
  userId?: string,
): Promise<{ok: boolean; error?: string}> {
  if (!supabase || !userId) {
    return {ok: false, error: 'Faça login no Supabase para excluir.'};
  }
  try {
    const {error} = await supabase
      .from('category_photos')
      .delete()
      .eq('id', photoId)
      .eq('user_id', userId);
    return error ? {ok: false, error: error.message} : {ok: true};
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Erro ao excluir foto.',
    };
  }
}

export async function fetchSupabaseBeforeAfter(): Promise<
  BeforeAfterEntry[] | null
> {
  if (!supabase) return null;
  try {
    const {data, error} = await supabase
      .from('before_after_entries')
      .select('*')
      .order('created_at', {ascending: false});
    if (error || !data) return null;
    return (data as DbBeforeAfterRow[]).map((row) => ({
      id: row.id,
      userId: row.user_id || undefined,
      authorName: row.author_name,
      authorHandle: row.author_handle,
      authorNeighborhood: row.author_neighborhood,
      authorInitials: row.author_initials,
      craftCategory: row.craft_category as CraftSubcategory,
      material: row.material as Exclude<MaterialType, MaterialType.ALL>,
      title: row.title,
      description: row.description,
      beforeImageUrl: row.before_image_url,
      afterImageUrl: row.after_image_url || undefined,
      steps: Array.isArray(row.steps) ? row.steps : [],
      suggestions: Array.isArray(row.suggestions) ? row.suggestions : [],
      createdAt: formatRelativeDate(row.created_at),
    }));
  } catch {
    return null;
  }
}

export async function insertSupabaseBeforeAfter(
  entry: BeforeAfterEntry,
  userId?: string,
): Promise<{ok: boolean; error?: string}> {
  if (!supabase) {
    return {ok: false, error: 'Banco de dados Supabase não configurado.'};
  }
  try {
    const basePayload = {
      id: entry.id,
      user_id: userId || null,
      author_name: entry.authorName,
      author_handle: entry.authorHandle,
      author_neighborhood: entry.authorNeighborhood,
      author_initials: entry.authorInitials,
      craft_category: entry.craftCategory,
      material: entry.material,
      title: entry.title,
      description: entry.description,
      before_image_url: entry.beforeImageUrl,
      after_image_url: entry.afterImageUrl || '',
    };

    const {error} = await supabase.from('before_after_entries').insert({
      ...basePayload,
      steps: entry.steps || [],
      suggestions: entry.suggestions || [],
    });

    if (
      error &&
      (error.message.includes('steps') || error.message.includes('suggestions'))
    ) {
      const retry = await supabase
        .from('before_after_entries')
        .insert(basePayload);
      return retry.error
        ? {ok: false, error: retry.error.message}
        : {ok: true};
    }

    return error ? {ok: false, error: error.message} : {ok: true};
  } catch (err) {
    return {
      ok: false,
      error:
        err instanceof Error ? err.message : 'Erro ao salvar Antes e Depois.',
    };
  }
}

export async function deleteSupabaseBeforeAfter(
  entryId: string,
  userId?: string,
): Promise<{ok: boolean; error?: string}> {
  if (!supabase) {
    return {ok: false, error: 'Banco de dados Supabase não configurado.'};
  }
  try {
    const query = supabase
      .from('before_after_entries')
      .delete()
      .eq('id', entryId);
    const {error} = userId
      ? await query.eq('user_id', userId)
      : await query.is('user_id', null);
    return error ? {ok: false, error: error.message} : {ok: true};
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Erro ao excluir registro.',
    };
  }
}

export interface BeforeAfterAiResult {
  suggestedTitle: string;
  identifiedMaterial: string;
  preparationTip: string;
  steps: string[];
  suggestions: BeforeAfterSuggestion[];
}

async function prepareAiImageDataUrl(dataUrl: string): Promise<string> {
  if (dataUrl.length < 320_000 || typeof document === 'undefined') {
    return dataUrl;
  }
  return new Promise<string>((resolve) => {
    const img = new Image();
    img.onload = () => {
      const maxDim = 768;
      let {width, height} = img;
      if (width > maxDim || height > maxDim) {
        if (width >= height) {
          height = Math.round((height * maxDim) / width);
          width = maxDim;
        } else {
          width = Math.round((width * maxDim) / height);
          height = maxDim;
        }
      }
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(dataUrl);
        return;
      }
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, width, height);
      try {
        resolve(canvas.toDataURL('image/jpeg', 0.78));
      } catch {
        resolve(dataUrl);
      }
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
}

async function safeReadJsonResponse<T>(
  response: Response,
  fallbackError: string,
): Promise<T> {
  const rawText = await response.text();
  const trimmed = rawText.trim();
  let parsed: (T & {error?: string}) | null = null;
  if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
    try {
      parsed = JSON.parse(trimmed) as T & {error?: string};
    } catch {
      parsed = null;
    }
  }

  const lower = trimmed.toLowerCase();

  if (!response.ok) {
    if (parsed?.error) {
      throw new Error(parsed.error);
    }
    if (
      lower.includes('page could not be found') ||
      lower.includes('page not found')
    ) {
      throw new Error(
        'O servidor de IA não está acessível neste endereço no momento. Recarregue a página ou tente no ambiente principal do aplicativo.',
      );
    }
    if (lower.includes('starting server')) {
      throw new Error(
        'O servidor de IA está iniciando. Aguarde alguns segundos e clique em Tentar novamente.',
      );
    }
    throw new Error(fallbackError);
  }

  if (!parsed) {
    if (lower.includes('starting server')) {
      throw new Error(
        'O servidor de IA está iniciando. Aguarde alguns segundos e clique em Tentar novamente.',
      );
    }
    throw new Error(
      'Resposta inválida do servidor de IA. Tente novamente em alguns segundos.',
    );
  }

  return parsed;
}

export async function analyzeBeforeAfterWithAI(params: {
  imageDataUrl?: string;
  material: string;
  craftCategory: CraftSubcategory | 'auto';
  title?: string;
  description?: string;
  allowTextOnly?: boolean;
}): Promise<BeforeAfterAiResult> {
  const compactImageUrl = params.imageDataUrl
    ? await prepareAiImageDataUrl(params.imageDataUrl)
    : undefined;
  const response = await fetch('/api/before-after-ai', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({
      ...params,
      imageDataUrl: compactImageUrl,
    }),
  });
  const payload = await safeReadJsonResponse<Partial<BeforeAfterAiResult>>(
    response,
    'Não foi possível gerar sugestões com a IA.',
  );
  return {
    suggestedTitle: payload.suggestedTitle || '',
    identifiedMaterial: payload.identifiedMaterial || params.material,
    preparationTip: payload.preparationTip || '',
    steps: Array.isArray(payload.steps) ? payload.steps : [],
    suggestions: Array.isArray(payload.suggestions) ? payload.suggestions : [],
  };
}

export interface TriageAiResult {
  catalogId: string;
  detectedLabel: string;
  quickTip: string;
}

export async function analyzeTriageWithAI(
  imageDataUrl: string,
): Promise<TriageAiResult> {
  const compactImageUrl = await prepareAiImageDataUrl(imageDataUrl);
  const response = await fetch('/api/triage-ai', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({imageDataUrl: compactImageUrl}),
  });
  const payload = await safeReadJsonResponse<Partial<TriageAiResult>>(
    response,
    'Não foi possível identificar o material com a IA.',
  );
  return {
    catalogId: payload.catalogId || 'tr-pet',
    detectedLabel: payload.detectedLabel || 'Material identificado',
    quickTip: payload.quickTip || '',
  };
}

export interface CraftExplainAiResult {
  suggestedTitle: string;
  explanation: string;
  materials: string[];
  steps: string[];
}

export async function explainCraftWithAI(params: {
  imageDataUrl?: string;
  beforeImageUrl?: string;
  title?: string;
  material: string;
  craftCategory?: string;
  notes?: string;
}): Promise<CraftExplainAiResult> {
  const compactMain = params.imageDataUrl
    ? await prepareAiImageDataUrl(params.imageDataUrl)
    : undefined;
  const compactBefore = params.beforeImageUrl
    ? await prepareAiImageDataUrl(params.beforeImageUrl)
    : undefined;
  const response = await fetch('/api/explain-craft-ai', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({
      ...params,
      imageDataUrl: compactMain,
      beforeImageUrl: compactBefore,
    }),
  });
  const payload = await safeReadJsonResponse<Partial<CraftExplainAiResult>>(
    response,
    'Não foi possível gerar a explicação com a IA.',
  );
  return {
    suggestedTitle: payload.suggestedTitle || params.title || '',
    explanation: payload.explanation || '',
    materials: Array.isArray(payload.materials) ? payload.materials : [],
    steps: Array.isArray(payload.steps) ? payload.steps : [],
  };
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
): Promise<{ok: boolean; error?: string}> {
  if (!supabase || !userId) return {ok: false};
  try {
    const {error} = await supabase.from('user_habits').upsert({
      user_id: userId,
      habit_id: habitId,
      completed,
      updated_at: new Date().toISOString(),
    });
    return error ? {ok: false, error: error.message} : {ok: true};
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Erro ao salvar hábito.',
    };
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
): Promise<{ok: boolean; error?: string}> {
  if (!supabase || !userId) return {ok: false};
  try {
    const {error} = await supabase.from('user_post_interactions').upsert({
      user_id: userId,
      post_id: interaction.postId,
      liked: interaction.liked,
      verified: interaction.verified,
      saved: interaction.saved,
      updated_at: new Date().toISOString(),
    });
    return error ? {ok: false, error: error.message} : {ok: true};
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Erro ao salvar interação.',
    };
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
): Promise<{ok: boolean; error?: string}> {
  if (!supabase || !userId) return {ok: false};
  try {
    const {error} = await supabase.from('user_challenge_progress').upsert({
      user_id: userId,
      challenge_id: challengeId,
      joined,
      completed_steps: completedSteps,
      updated_at: new Date().toISOString(),
    });
    return error ? {ok: false, error: error.message} : {ok: true};
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Erro ao salvar desafio.',
    };
  }
}
