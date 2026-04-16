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
  const onExpireRef = useRef(onExpire);
  onExpireRef.current = onExpire;

  useEffect(() => {
    setTimeLeft(duration);
    expiredRef.current = false;
  }, [resetKey, duration]);

  useEffect(() => {
    if (timeLeft <= 0) {
      if (canExpire && !expiredRef.current) {
        expiredRef.current = true;
        onExpireRef.current();
      }
      return;
    }
    const id = setInterval(() => {
      setTimeLeft((t) => Math.max(0, t - 0.1));
    }, 100);
    return () => clearInterval(id);
  }, [timeLeft, canExpire]); // onExpire 제거: onExpire 참조 변경이 effect 재실행을 유발하지 않도록

  return timeLeft;
}
