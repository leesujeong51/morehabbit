import React, { useState, useEffect } from 'react';
import { Download, Smartphone, X } from 'lucide-react';
import { Modal } from './Modal';

// Interface for BeforeInstallPromptEvent
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

export const InstallAppBanner: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const [isGuideOpen, setIsGuideOpen] = useState(false);

  useEffect(() => {
    // Check if app is already running in standalone mode (already installed)
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;

    if (isStandalone) {
      setIsInstalled(true);
      return;
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === 'accepted') {
        setIsInstalled(true);
      }
      setDeferredPrompt(null);
    } else {
      // If browser doesn't trigger prompt automatically, show step-by-step guide
      setIsGuideOpen(true);
    }
  };

  // If already installed or dismissed, don't show
  if (isInstalled || isDismissed) {
    return null;
  }

  return (
    <>
      <div className="bg-gradient-to-r from-[#1d4ed8] via-[#2563eb] to-[#1e40af] text-white px-4 py-3 rounded-2xl shadow-sm flex items-center justify-between gap-3 mb-3 animate-fadeIn border border-blue-400/30">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center shrink-0 border border-white/25">
            <Smartphone size={20} className="text-white" />
          </div>
          <div className="min-w-0">
            <div className="text-[13px] font-black leading-tight flex items-center gap-1.5">
              <span>스마트폰에 앱으로 설치하기</span>
              <span className="text-[10px] bg-amber-400 text-slate-900 px-1.5 py-0.5 rounded font-black uppercase">
                무료
              </span>
            </div>
            <p className="text-[11.5px] text-blue-100 truncate mt-0.5 font-medium">
              홈 화면에 추가하면 컴퓨터를 꺼도 폰에서 영구 실행돼요
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={handleInstallClick}
            className="flex items-center gap-1 bg-white text-[#1d4ed8] hover:bg-blue-50 px-3.5 py-1.5 rounded-xl text-[12.5px] font-black shadow-xs active:scale-95 transition"
          >
            <Download size={14} strokeWidth={2.5} />
            <span>설치</span>
          </button>
          <button
            onClick={() => setIsDismissed(true)}
            className="p-1 text-white/70 hover:text-white rounded-lg transition"
            aria-label="닫기"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Manual installation guide modal */}
      <Modal isOpen={isGuideOpen} onClose={() => setIsGuideOpen(false)} title="스마트폰에 모어해빗 앱 설치하기">
        <div className="space-y-4 text-[13px] text-slate-700">
          <p className="font-semibold text-slate-800">
            별도의 복잡한 설치 없이 브라우저에서 바로 스마트폰 홈 화면에 진짜 앱으로 추가할 수 있습니다:
          </p>

          {/* Android Chrome Guide */}
          <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80 space-y-2">
            <div className="font-black text-[#0f2e7a] flex items-center gap-1.5 text-[13.5px]">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
              <span>안드로이드 크롬 (Chrome) 브라우저:</span>
            </div>
            <p className="leading-relaxed pl-4 text-slate-600 font-medium">
              1. 브라우저 우측 상단 <strong>점 세 개 (⋮)</strong> 메뉴를 터치합니다.<br />
              2. <strong>[앱 설치]</strong> 또는 <strong>[홈 화면에 추가]</strong>를 누릅니다.<br />
              3. 스마트폰 홈 화면에 <strong>'모어해빗'</strong> 앱 아이콘이 바로 생성됩니다!
            </p>
          </div>

          {/* Samsung Internet Guide */}
          <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80 space-y-2">
            <div className="font-black text-[#0f2e7a] flex items-center gap-1.5 text-[13.5px]">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-600" />
              <span>삼성 인터넷 (Samsung Internet):</span>
            </div>
            <p className="leading-relaxed pl-4 text-slate-600 font-medium">
              1. 하단 또는 상단의 <strong>메뉴 (≡)</strong>를 터치합니다.<br />
              2. <strong>[현재 페이지 추가]</strong> ➡️ <strong>[홈 화면]</strong>을 선택합니다.<br />
              3. 홈 화면에 독립된 앱으로 즉시 설치됩니다!
            </p>
          </div>

          <div className="p-3 bg-blue-50/80 rounded-xl border border-blue-100 text-[12px] text-blue-900 leading-relaxed font-medium">
            💡 <strong>컴퓨터를 꺼도 실행되는 원리:</strong><br />
            설치 시 스마트폰 내부에 모든 앱 파일과 데이터가 영구 저장(오프라인 캐시)되어, 컴퓨터를 끄거나 비행기 모드에서도 언제든 독립된 앱으로 실행됩니다.
          </div>

          <div className="pt-2 flex justify-end">
            <button
              onClick={() => setIsGuideOpen(false)}
              className="px-5 py-2.5 bg-[#1d4ed8] hover:bg-[#1e40af] text-white rounded-xl font-black text-[13px] shadow-xs active:scale-95 transition"
            >
              확인했어요
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
};
