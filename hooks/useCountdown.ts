'use client';

import { useEffect, useRef, useState } from 'react';

export function useCountdown(
  duration: number,
  onExpire: () => void,
  canExpire: boolean, // false = 타이머가 0이 되어도 onExpire 호출 안 함 (retry 모드)
  resetKey: number,   // 값이 바뀌면 타이머 리셋
) {
  const [timeLeft, setTimeLeft] = useState(duration);
  const expiredRef = useRef(false);

  useEffect(() => {
    setTimeLeft(duration);
    expiredRef.current = false;
  }, [resetKey, duration]);

  useEffect(() => {
    if (timeLeft <= 0) {
      if (canExpire && !expiredRef.current) {
        expiredRef.current = true;
        onExpire();
      }
      return;
    }
    const id = setInterval(() => {
      setTimeLeft((t) => Math.max(0, t - 0.1));
    }, 100);
    return () => clearInterval(id);
  }, [timeLeft, canExpire, onExpire]);

  return timeLeft;
}
