interface KakaoShareLink {
    mobileWebUrl: string;
    webUrl: string;
}

interface KakaoShareContent {
    title: string;
    description?: string;
    imageUrl?: string;
    link: KakaoShareLink;
}

interface KakaoShareButton {
    title: string;
    link: KakaoShareLink;
}

interface KakaoShareFeedParams {
    objectType: 'feed';
    content: KakaoShareContent;
    buttons?: KakaoShareButton[];
}

interface KakaoShare {
    sendDefault(params: KakaoShareFeedParams): void;
}

interface KakaoStatic {
    init(appKey: string): void;
    isInitialized(): boolean;
    Share: KakaoShare;
}

declare global {
    interface Window {
        Kakao: KakaoStatic;
    }
}

export {};
