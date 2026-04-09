import { createServerClient } from '@/lib/supabase/server';
import { DEFAULT_SPLASH_CONFIG } from '@/components/screens/SplashScreen';
import { DEFAULT_CHAT_BG_CONFIG } from '@/components/ui/ChatGradientBackground';
import { HomeClient } from './HomeClient';
import type { SplashConfig } from '@/components/screens/SplashScreen';
import type { ChatBgConfig } from '@/components/ui/ChatGradientBackground';

export default async function Home() {
  const supabase = createServerClient();
  const { data } = await supabase
    .from('app_settings')
    .select('key, value');

  const map: Record<string, unknown> = {};
  for (const row of data ?? []) map[row.key] = row.value;

  const initialSplashConfig: SplashConfig = {
    ...DEFAULT_SPLASH_CONFIG,
    ...(map['splash_config'] as Partial<SplashConfig> ?? {}),
  };

  const initialChatBgConfig: ChatBgConfig = {
    ...DEFAULT_CHAT_BG_CONFIG,
    ...(map['chat_bg_config'] as Partial<ChatBgConfig> ?? {}),
  };

  return <HomeClient initialSplashConfig={initialSplashConfig} initialChatBgConfig={initialChatBgConfig} />;
}
