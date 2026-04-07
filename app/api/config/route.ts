import { createServerClient } from '@/lib/supabase/server';

export async function GET() {
  const supabase = createServerClient();
  const { data } = await supabase.from('app_settings').select('key, value');

  const map: Record<string, unknown> = {};
  for (const row of data ?? []) {
    map[row.key] = row.value;
  }

  return Response.json({
    chatMaxTurns: typeof map['chat_max_turns'] === 'number' ? map['chat_max_turns'] : 6,
  });
}
