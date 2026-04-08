import { createServerClient } from '@/lib/supabase/server';
import { DEFAULT_SPLASH_CONFIG } from '@/components/screens/SplashScreen';
import { HomeClient } from './HomeClient';
import type { SplashConfig } from '@/components/screens/SplashScreen';

export default async function Home() {
  const supabase = createServerClient();
  const { data } = await supabase
    .from('app_settings')
    .select('value')
    .eq('key', 'splash_config')
    .single();

  const initialSplashConfig: SplashConfig = {
    ...DEFAULT_SPLASH_CONFIG,
    ...(data?.value as Partial<SplashConfig> | null ?? {}),
  };

  return <HomeClient initialSplashConfig={initialSplashConfig} />;
}
