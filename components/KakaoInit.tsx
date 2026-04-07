'use client';

import Script from 'next/script';

export function KakaoInit() {
    return (
        <Script
            src="https://t1.kakaocdn.net/kakao_js_sdk/2.7.4/kakao.min.js"
            integrity="sha384-TiCUE00h649CAMonG018J2ujOgDKW/kVWlChEuu4jK2vxfAAD0eZxzCKakxg55G4"
            crossOrigin="anonymous"
            strategy="lazyOnload"
            onLoad={() => {
                const key = process.env.NEXT_PUBLIC_KAKAO_APP_KEY;
                if (key && window.Kakao && !window.Kakao.isInitialized()) {
                    window.Kakao.init(key);
                }
            }}
        />
    );
}
