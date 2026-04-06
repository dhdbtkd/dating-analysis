-- 6개 지표 확장: 신뢰, 자기개방성, 갈등 건강도, 관계 자존감 추가
ALTER TABLE sessions
  ADD COLUMN IF NOT EXISTS score_trust          numeric(4,2),
  ADD COLUMN IF NOT EXISTS score_self_disclosure numeric(4,2),
  ADD COLUMN IF NOT EXISTS score_conflict        numeric(4,2),
  ADD COLUMN IF NOT EXISTS score_rel_self_esteem numeric(4,2);
