export enum PostCategory {
  ALL = 'todos',
  RECYCLING = 'reciclagem',
  ZERO_WASTE = 'desperdicio',
  SCRAP_ART = 'arte-sucata',
}

export type CraftSubcategory =
  | 'artesanato'
  | 'jogos-brinquedos'
  | 'decoracao'
  | 'instrumentos';

export enum MaterialType {
  ALL = 'todos',
  PET = 'Plástico PET',
  GLASS = 'Vidro',
  ALUMINUM = 'Alumínio',
  CARDBOARD = 'Papel e Papelão',
  ORGANIC = 'Orgânico',
  TEXTILE = 'Têxtil e Sucata Mista',
}

export type IllustrationTheme =
  | 'pet-planter'
  | 'water-rinse'
  | 'compost-bucket'
  | 'tin-lantern'
  | 'cardboard-organizer'
  | 'kitchen-scraps'
  | 'sorting-guide'
  | 'glass-terrarium'
  | 'craft-artesanato'
  | 'craft-jogos'
  | 'craft-decoracao'
  | 'craft-instrumentos';

export type NavSection =
  | 'feed'
  | 'scrap-art'
  | 'ai-reuse'
  | 'triage'
  | 'challenges'
  | 'saved';

export interface EcoComment {
  id: string;
  authorName: string;
  authorHandle: string;
  authorRole: string;
  createdAt: string;
  content: string;
}

export interface EcoPost {
  id: string;
  userId?: string;
  isRealUserPost?: boolean;
  authorName: string;
  authorHandle: string;
  authorNeighborhood: string;
  authorInitials: string;
  createdAt: string;
  timestampOrder: number;
  category: Exclude<PostCategory, PostCategory.ALL>;
  craftSubcategory?: CraftSubcategory;
  material: Exclude<MaterialType, MaterialType.ALL>;
  title: string;
  summary: string;
  materialsNeeded: string[];
  steps: string[];
  estimatedTime: string;
  difficulty?: 'Fácil' | 'Intermediário';
  wasteAvoidedKg: number;
  illustration: IllustrationTheme;
  customImageUrl?: string;
  beforeImageUrl?: string;
  likes: number;
  likedByMe?: boolean;
  verifiedCount: number;
  verifiedByMe?: boolean;
  savedByMe?: boolean;
  comments: EcoComment[];
}

export interface CategoryPhotoEntry {
  id: string;
  userId?: string;
  authorName: string;
  authorNeighborhood: string;
  craftCategory: CraftSubcategory;
  material: Exclude<MaterialType, MaterialType.ALL>;
  title: string;
  imageUrl: string;
  createdAt: string;
}

export interface BeforeAfterSuggestion {
  title: string;
  difficulty: string;
  estimatedTime: string;
  summary: string;
  suggestedCategory?: CraftSubcategory;
  extraMaterials?: string[];
  steps?: string[];
}

export interface BeforeAfterEntry {
  id: string;
  userId?: string;
  authorName: string;
  authorHandle: string;
  authorNeighborhood: string;
  authorInitials: string;
  craftCategory: CraftSubcategory;
  material: Exclude<MaterialType, MaterialType.ALL>;
  title: string;
  description: string;
  beforeImageUrl: string;
  afterImageUrl?: string;
  steps: string[];
  suggestions: BeforeAfterSuggestion[];
  createdAt: string;
}

export interface HabitItem {
  id: string;
  label: string;
  impactLabel: string;
  points: number;
  kgSaved: number;
  completed: boolean;
}

export interface DropOffPoint {
  id: string;
  name: string;
  district: string;
  address: string;
  distanceKm: string;
  hours: string;
  mapX: number;
  mapY: number;
  acceptedMaterials: Array<Exclude<MaterialType, MaterialType.ALL>>;
}

export interface DailyChallenge {
  id: string;
  title: string;
  description: string;
  category: Exclude<PostCategory, PostCategory.ALL>;
  targetParticipants: number;
  currentParticipants: number;
  joined: boolean;
  rewardPoints: number;
  deadlineLabel: string;
  actionChecklist: string[];
  completedSteps: number[];
}

export interface TriageMaterialItem {
  id: string;
  name: string;
  material: Exclude<MaterialType, MaterialType.ALL>;
  materialGrade: string;
  recyclable: 'Reciclável' | 'Compostável' | 'Rejeito (Não Reciclável)';
  binColor: string;
  binLabel: string;
  nearestDropOffId: string;
  cleanlinessTip: string;
  scrapArtIdea: string;
  commonMistake: string;
  illustration: IllustrationTheme;
}
