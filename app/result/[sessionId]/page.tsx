import { createServerClient } from '@/lib/supabase/server';
import { ResultCard } from '@/components/result/ResultCard';
import type { SessionRow, ResultCoreJson, ResultDetailJson, ResultDetailStatus } from '@/types';

interface PageProps {
  params: Promise<{ sessionId: string }>;
  searchParams: Promise<{ coupleId?: string; shared?: string }>;
}

export default async function ResultPage({ params, searchParams }: PageProps) {
  const { sessionId } = await params;
  const { coupleId, shared } = await searchParams;
  const isShared = shared === '1';
  const supabase = createServerClient();

  const { data, error } = await supabase
    .from('sessions')
    .select('*')
    .eq('id', sessionId)
    .single();

  if (error || !data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[100dvh] px-4 relative z-10">
        <div className="text-center">
          <p className="text-3xl mb-4">🌑</p>
          <p className="text-base" style={{ color: '#e0c898' }}>결과를 찾을 수 없습니다</p>
          <p className="text-xs mt-2" style={{ color: '#8a8a9a' }}>링크가 만료되었거나 잘못된 주소입니다.</p>
        </div>
      </div>
    );
  }

  const session = data as SessionRow;

  if (!session.result) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[100dvh] px-4 relative z-10">
        <div className="text-center">
          <p className="text-3xl mb-4">⏳</p>
          <p className="text-base" style={{ color: '#e0c898' }}>분석 결과가 아직 준비되지 않았습니다</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] px-4 py-12 relative z-10">
      <div className="max-w-lg mx-auto">
        <ResultCard
          result={session.result as ResultCoreJson}
          detailResult={session.result_detail as ResultDetailJson | null}
          detailStatus={session.result_detail_status as ResultDetailStatus}
          detailError={session.result_detail_error}
          sessionId={sessionId}
          nickname={session.nickname}
          coupleId={coupleId}
          isShared={isShared}
          scoreTrust={session.score_trust}
          scoreSelfDisclosure={session.score_self_disclosure}
          scoreConflict={session.score_conflict}
          scoreRelSelfEsteem={session.score_rel_self_esteem}
        />
      </div>
    </div>
  );
}
