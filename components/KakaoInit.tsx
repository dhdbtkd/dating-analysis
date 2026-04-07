'use client';

import Script from 'next/script';

export function KakaoInit() {
    return (
        <Script
            src="https://t1.kakaocdn.net/kakao_js_sdk/2.8.0/kakao.min.js"
            strategy="afterInteractive"
            onLoad={() => {
                const key = process.env.NEXT_PUBLIC_KAKAO_APP_KEY;
                if (key && window.Kakao && !window.Kakao.isInitialized()) {
                    window.Kakao.init(key);
                }
            }}
        />
    );
}
