import { createServerClient } from '@/lib/supabase/server';

export interface PromptPart {
  key: string;
  label: string;
  content: string;
}

export interface LlmConfig {
  id: string;
  key: string;
  provider: string;
  model: string;
  system_prompt: string;
  prompt_parts: PromptPart[];
  is_active: boolean;
  updated_at: string;
}

// Per-request cache (Next.js server components share nothing between requests)
const cache = new Map<string, { config: LlmConfig; expiresAt: number }>();
const CACHE_TTL_MS = 30 * 1000;

export async function getLlmConfig(key: string): Promise<LlmConfig | null> {
  const now = Date.now();
  const cached = cache.get(key);
  if (cached && cached.expiresAt > now) return cached.config;

  try {
    const supabase = createServerClient();
    const { data, error } = await supabase
      .from('llm_configs')
      .select('*')
      .eq('key', key)
      .eq('is_active', true)
      .single();

    if (error || !data) return null;

    const config = data as LlmConfig;
    cache.set(key, { config, expiresAt: now + CACHE_TTL_MS });
    return config;
  } catch {
    return null;
  }
}

export function assemblePromptParts(parts: PromptPart[]): string {
  return parts.map((p) => p.content).join('\n\n');
}

/** Injects dynamic user context into a system prompt template.
 *  Replaces the `{{user_context}}` placeholder if present. */
export function injectUserContext(template: string, context: string): string {
  return template.replace('{{user_context}}', context);
}
