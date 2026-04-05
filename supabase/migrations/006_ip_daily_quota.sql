-- IP별 일일 분석 요청 횟수 추적
CREATE TABLE IF NOT EXISTS ip_daily_quota (
  ip        TEXT        NOT NULL,
  date      DATE        NOT NULL DEFAULT CURRENT_DATE,
  count     INTEGER     NOT NULL DEFAULT 1,
  PRIMARY KEY (ip, date)
);

CREATE INDEX IF NOT EXISTS idx_ip_daily_quota_date ON ip_daily_quota (date);

-- 원자적으로 quota 확인 + 증가
-- 한도 미만이면 count를 올리고 true 반환
-- 한도 초과면 count를 올리지 않고 false 반환
CREATE OR REPLACE FUNCTION increment_ip_daily_quota(
  p_ip    TEXT,
  p_date  DATE,
  p_limit INTEGER
) RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
DECLARE
  current_count INTEGER;
BEGIN
  INSERT INTO ip_daily_quota (ip, date, count)
  VALUES (p_ip, p_date, 1)
  ON CONFLICT (ip, date) DO UPDATE
    SET count = ip_daily_quota.count + 1
    WHERE ip_daily_quota.count < p_limit
  RETURNING count INTO current_count;

  -- INSERT/UPDATE가 실행됐으면 허용
  IF current_count IS NOT NULL THEN
    RETURN TRUE;
  END IF;

  -- WHERE 조건 불충족 = 이미 한도 초과
  RETURN FALSE;
END;
$$;
