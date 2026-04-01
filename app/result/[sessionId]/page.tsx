import { createServerClient } from '@/lib/supabase/server';
import { ResultCard } from '@/components/result/ResultCard';
import type { SessionRow, ResultJson } from '@/types';

interface PageProps {
  params: Promise<{ sessionId: string }>;
}

export default async function ResultPage({ params }: PageProps) {
  const { sessionId } = await params;
  const supabase = createServerClient();

  const { data, error } = await supabase
    .from('sessions')
    .select('*')
    .eq('id', sessionId)
    .single();

  if (error || !data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen px-4 relative z-10">
        <div className="text-center">
          <p className="text-4xl mb-4">🌑</p>
          <p className="text-lg" style={{ color: '#e0c898' }}>결과를 찾을 수 없습니다</p>
          <p className="text-sm mt-2" style={{ color: '#8a8a9a' }}>링크가 만료되었거나 잘못된 주소입니다.</p>
        </div>
      </div>
    );
  }

  const session = data as SessionRow;

  if (!session.result) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen px-4 relative z-10">
        <div className="text-center">
          <p className="text-4xl mb-4">⏳</p>
          <p className="text-lg" style={{ color: '#e0c898' }}>분석 결과가 아직 준비되지 않았습니다</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-4 py-12 relative z-10">
      <div className="max-w-lg mx-auto">
        <ResultCard
          result={session.result as ResultJson}
          sessionId={sessionId}
          nickname={session.nickname}
        />
      </div>
    </div>
  );
}
