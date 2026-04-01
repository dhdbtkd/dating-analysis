import { createServerClient } from '@/lib/supabase/server';
import { CoupleResultCard } from '@/components/couple/CoupleResultCard';
import type { SessionRow, CoupleAnalysis } from '@/types';

interface PageProps {
  params: Promise<{ coupleId: string }>;
}

export default async function CouplePage({ params }: PageProps) {
  const { coupleId } = await params;
  const supabase = createServerClient();

  const { data, error } = await supabase
    .from('couples')
    .select('*, sender:sender_session_id(*), partner:partner_session_id(*)')
    .eq('id', coupleId)
    .single();

  if (error || !data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen px-4 relative z-10">
        <div className="text-center">
          <p className="text-4xl mb-4">🌑</p>
          <p className="text-lg" style={{ color: '#e0c898' }}>커플 결과를 찾을 수 없습니다</p>
        </div>
      </div>
    );
  }

  const session1 = data.sender as SessionRow;
  const session2 = data.partner as SessionRow;

  if (!session1 || !session2) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen px-4 relative z-10">
        <div className="text-center">
          <p className="text-4xl mb-4">⏳</p>
          <p className="text-lg" style={{ color: '#e0c898' }}>파트너의 검사가 아직 완료되지 않았습니다</p>
        </div>
      </div>
    );
  }

  // Get or generate couple analysis
  let analysis = data.couple_analysis as CoupleAnalysis | null;
  if (!analysis) {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/couple/analyze`, {
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
    dynamics: '두 분의 관계 역학을 분석 중입니다.',
    communicationTips: ['서로의 감정을 경청해주세요.', '취약함을 나눠보세요.', '갈등 시 잠시 쉬어가세요.'],
    growthSuggestions: ['서로의 유형을 이해해보세요.', '안전한 대화 공간을 만들어보세요.', '함께 성장하는 활동을 해보세요.'],
    compatibilityNote: '두 분은 서로에게서 배울 점이 많은 조합입니다.',
  };

  return (
    <div className="min-h-screen px-4 py-12 relative z-10">
      <div className="max-w-lg mx-auto">
        <CoupleResultCard session1={session1} session2={session2} analysis={fallbackAnalysis} />
      </div>
    </div>
  );
}
