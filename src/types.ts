export type DifficultyTier = 'Beginner' | 'Intermediate' | 'Advanced' | 'Hero';

export interface ShaderChallenge {
  prompt: string;
  hint: string;
  solution: string;
}

export interface ShaderTool {
  id: string;
  section: string;
  name: string;
  description: string;
  glsl: string;
  defaultParams: Record<string, number>;
  previewMain: string;
  markdownDoc: string;
  orderIndex: number;
  difficulty: DifficultyTier;
  challenge: ShaderChallenge;
}

export interface Category {
  id: number;
  parent_id: number | null;
  name: string;
  slug: string;
  icon?: string;
  created_at?: string;
}

export interface ShaderPreset {
  id?: number;
  category_id?: number | null;
  name: string;
  description: string;
  glsl_code: string;
  markdown_doc?: string;
  difficulty?: DifficultyTier;
  order_index?: number;
  challenge_json?: string;
  created_at?: string;
}
