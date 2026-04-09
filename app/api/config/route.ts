import { createServerClient } from '@/lib/supabase/server';
import { DEFAULT_SPLASH_CONFIG } from '@/components/screens/SplashScreen';
import { DEFAULT_CHAT_BG_CONFIG } from '@/components/ui/ChatGradientBackground';

export async function GET() {
  const supabase = createServerClient();
  const { data } = await supabase.from('app_settings').select('key, value');

  const map: Record<string, unknown> = {};
  for (const row of data ?? []) {
    map[row.key] = row.value;
  }

  return Response.json({
    chatMaxTurns: typeof map['chat_max_turns'] === 'number' ? map['chat_max_turns'] : 6,
    splashConfig: map['splash_config'] ?? DEFAULT_SPLASH_CONFIG,
    chatBgConfig: map['chat_bg_config'] ?? DEFAULT_CHAT_BG_CONFIG,
  });
}
