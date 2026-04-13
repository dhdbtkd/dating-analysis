import { createServerClient } from '@/lib/supabase/server';
import { CoupleResultCard } from '@/components/couple/CoupleResultCard';
import type { SessionRow, CoupleAnalysis } from '@/types';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ coupleId: string }>;
  searchParams: Promise<{ shared?: string }>;
}

export default async function CouplePage({ params, searchParams }: PageProps) {
  const { coupleId } = await params;
  const { shared } = await searchParams;
  const isShared = shared === '1';
  const supabase = createServerClient();

  const { data, error } = await supabase
    .from('couples')
    .select('*, sender:sender_session_id(*), partner:partner_session_id(*)')
    .eq('id', coupleId)
    .single();

  if (error || !data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[100dvh] px-4" style={{ backgroundColor: '#f7f9fb' }}>
        <div className="text-center">
          <p className="text-3xl mb-4">🌑</p>
          <p className="text-base" style={{ color: '#43474e' }}>커플 결과를 찾을 수 없습니다</p>
        </div>
      </div>
    );
  }

  const session1 = data.sender as SessionRow;
  const session2 = data.partner as SessionRow;

  if (!session1 || !session2) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[100dvh] px-4" style={{ backgroundColor: '#f7f9fb' }}>
        <div className="text-center">
          <p className="text-3xl mb-4">⏳</p>
          <p className="text-base" style={{ color: '#43474e' }}>파트너가 아직 완료하지 않았습니다</p>
        </div>
      </div>
    );
  }

  // Get or generate couple analysis
  let analysis = data.couple_analysis as CoupleAnalysis | null;
  if (!analysis) {
    try {
      const res = await fetch(`${process.env.BASE_URL || 'http://localhost:3000'}/api/couple/analyze`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ coupleId }),
      });
      if (res.ok) {
        analysis = await res.json() as CoupleAnalysis;
      }
    } catch {
      // Use fallback
    }
  }

  const fallbackAnalysis: CoupleAnalysis = analysis ?? {
    summary: `${session1.nickname}님과 ${session2.nickname}님의 애착 조합입니다.`,
    conflictPattern: '두 분의 갈등 패턴을 분석 중입니다.',
    eachPersonsCore: [
      { name: session1.nickname, core: '관계에서 안정감을 원합니다.' },
      { name: session2.nickname, core: '관계에서 안정감을 원합니다.' },
    ],
    coupleStrengths: '두 분은 서로에게서 배울 점이 많은 조합입니다.',
    communicationTips: ['서로의 감정을 경청해주세요.', '취약함을 나눠보세요.', '갈등 시 잠시 쉬어가세요.'],
    crisisScript: '지금 나 좀 힘든데, 잠깐 얘기할 수 있어?',
    compatibilityNote: '두 분은 서로에게서 배울 점이 많은 조합입니다.',
  };

  return (
    <div className="min-h-[100dvh] px-4 py-12" style={{ backgroundColor: '#f7f9fb' }}>
      <div className="max-w-lg mx-auto">
        <CoupleResultCard coupleId={coupleId} session1={session1} session2={session2} analysis={fallbackAnalysis} isShared={isShared} />
      </div>
    </div>
  );
}
