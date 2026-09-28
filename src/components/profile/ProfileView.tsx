import React, { useState } from 'react';
import type { Routine, RoutineLog } from '../../types/routine';
import { Modal } from '../common/Modal';

interface ProfileViewProps {
  routines: Routine[];
  logs: RoutineLog[];
  streakCount: number;
  onOpenDataBackupModal: () => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({
  routines,
  logs,
  streakCount,
  onOpenDataBackupModal,
}) => {
  // Account & App Settings State
  const [isPrivateAccount, setIsPrivateAccount] = useState(() => {
    return localStorage.getItem('morehabbit_is_private') === 'true';
  });
  const [notificationEnabled, setNotificationEnabled] = useState(() => {
    return localStorage.getItem('morehabbit_notif_enabled') !== 'false';
  });
  const [selectedLanguage, setSelectedLanguage] = useState<'ko' | 'en' | 'ja' | 'zh'>(() => {
    return (localStorage.getItem('morehabbit_lang') as any) || 'ko';
  });

  // Modals
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [contactSubject, setContactSubject] = useState('');
  const [contactBody, setContactBody] = useState('');
  const [contactCategory, setContactCategory] = useState('기능 제안');

  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [rating, setRating] = useState(5);
  const [reviewText, setReviewText] = useState('');

  const [isTermsModalOpen, setIsTermsModalOpen] = useState(false);
  const [isPrivacyModalOpen, setIsPrivacyModalOpen] = useState(false);
  const [isLanguageModalOpen, setIsLanguageModalOpen] = useState(false);

  // Toast / Feedback
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Toggle Private Account
  const handleTogglePrivate = () => {
    const nextVal = !isPrivateAccount;
    setIsPrivateAccount(nextVal);
    localStorage.setItem('morehabbit_is_private', String(nextVal));
    showToast(nextVal ? '계정이 비공개로 전환되었습니다.' : '계정이 공개로 전환되었습니다.');
  };

  // Toggle Notification
  const handleToggleNotification = () => {
    const nextVal = !notificationEnabled;
    setNotificationEnabled(nextVal);
    localStorage.setItem('morehabbit_notif_enabled', String(nextVal));
    showToast(nextVal ? '루틴 알림이 켜졌습니다.' : '루틴 알림이 꺼졌습니다.');
  };

  // Invite Friend (Copy Link)
  const handleCopyInviteLink = () => {
    const inviteUrl = 'https://morehabbit.app/invite/SJ-777';
    if (navigator.clipboard) {
      navigator.clipboard.writeText(inviteUrl);
    }
    showToast('초대 링크가 클립보드에 복사되었습니다! 🎉');
  };

  // Submit Contact Form (Opens mailto & shows confirmation)
  const handleSubmitContact = (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactSubject.trim() || !contactBody.trim()) {
      showToast('제목과 내용을 모두 입력해 주세요.');
      return;
    }

    const mailtoUrl = `mailto:support@morehabbit.app?subject=${encodeURIComponent(
      `[모어해빗 문의 - ${contactCategory}] ${contactSubject}`
    )}&body=${encodeURIComponent(
      `안녕하세요, 모어해빗 제작자님.\n\n사용자: SJ (sj@morehabbit.app)\n분류: ${contactCategory}\n\n문의 내용:\n${contactBody}\n\n감사합니다.`
    )}`;

    window.open(mailtoUrl, '_blank');
    setIsContactModalOpen(false);
    setContactSubject('');
    setContactBody('');
    showToast('문의 메일 작성이 완료되었습니다! 제작자에게 발송됩니다 ✉️');
  };

  // Submit Review
  const handleSubmitReview = (e: React.FormEvent) => {
    e.preventDefault();
    setIsReviewModalOpen(false);
    setReviewText('');
    showToast(`${rating}점 리뷰를 남겨주셔서 감사합니다! 더욱 발전하는 모어해빗이 되겠습니다 ⭐`);
  };

  // Check Update
  const handleCheckUpdate = () => {
    showToast('현재 최신 버전(v1.1)을 사용 중입니다 ✨');
  };

  // Logout click
  const handleLogout = () => {
    if (confirm('정말 로그아웃 하시겠습니까? 로컬 데이터는 기기에 안전하게 보존됩니다.')) {
      showToast('로그아웃 되었습니다.');
    }
  };

  const completedCount = logs.filter((l) => l.completed).length;
  const totalXp = completedCount * 40;

  const languages = [
    { code: 'ko', label: '한국어 (Korean)', flag: '🇰🇷' },
    { code: 'en', label: 'English (US)', flag: '🇺🇸' },
    { code: 'ja', label: '日本語 (Japanese)', flag: '🇯🇵' },
    { code: 'zh', label: '简体中文 (Chinese)', flag: '🇨🇳' },
  ];

  return (
    <div className="flex flex-col w-full pb-10 gap-space-lg select-none">
      {/* Toast Notification Notification Pill */}
      {toastMessage && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-full bg-slate-900/90 text-white text-[13px] font-semibold shadow-lg backdrop-blur-md flex items-center gap-2 animate-bounce">
          <span>✨</span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 1. Account Profile Header Card */}
      <section className="bg-surface-container-lowest rounded-2xl p-5 shadow-[0_4px_24px_-4px_rgba(29,78,216,0.06)] border border-surface-container/70 flex flex-col gap-4">
        <div className="flex items-center gap-4">
          {/* SJ Avatar */}
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#1d4ed8] to-[#3b82f6] text-white flex items-center justify-center font-extrabold text-2xl shadow-md border-2 border-white/20 shrink-0">
            SJ
          </div>

          <div className="flex flex-col min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h2 className="text-[19px] font-extrabold text-on-surface tracking-tight">SJ</h2>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-primary-fixed text-primary">
                PRO 회원
              </span>
            </div>
            <span className="text-[13px] text-tertiary mt-0.5 font-medium truncate">
              sj@morehabbit.app
            </span>
            <span className="text-[12px] text-secondary font-semibold mt-1">
              "작은 습관이 모여 만드는 위대한 변화"
            </span>
          </div>
        </div>

        {/* Quick Stats Summary Grid */}
        <div className="grid grid-cols-3 gap-2 pt-3 border-t border-surface-container/50 text-center">
          <div className="bg-surface-container-low p-2.5 rounded-xl">
            <span className="text-[11px] font-medium text-tertiary">내 루틴</span>
            <div className="text-[16px] font-bold text-primary mt-0.5">
              {routines.filter((r) => !r.archived).length}개
            </div>
          </div>
          <div className="bg-surface-container-low p-2.5 rounded-xl">
            <span className="text-[11px] font-medium text-tertiary">연속 달성</span>
            <div className="text-[16px] font-bold text-rose-500 mt-0.5">
              {streakCount}일째
            </div>
          </div>
          <div className="bg-surface-container-low p-2.5 rounded-xl">
            <span className="text-[11px] font-medium text-tertiary">누적 XP</span>
            <div className="text-[16px] font-bold text-secondary mt-0.5">
              {totalXp}XP
            </div>
          </div>
        </div>
      </section>

      {/* 2. Account Preferences & Privacy Section */}
      <section className="bg-surface-container-lowest rounded-2xl p-4 shadow-[0_4px_20px_-2px_rgba(29,78,216,0.05)] border border-surface-container/70 flex flex-col gap-1">
        <h3 className="text-[13px] font-bold text-tertiary uppercase tracking-wider px-2 py-1 mb-1">
          계정 및 개인화 설정
        </h3>

        {/* Private Account Toggle */}
        <div className="flex items-center justify-between p-3 rounded-xl hover:bg-surface-container-low/60 transition-colors">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-surface-container flex items-center justify-center text-primary">
              <span className="material-symbols-outlined text-[20px]">
                {isPrivateAccount ? 'lock' : 'lock_open'}
              </span>
            </div>
            <div className="flex flex-col">
              <span className="text-[15px] font-bold text-on-surface">계정 비공개 여부</span>
              <span className="text-[12px] text-tertiary">내 루틴과 통계를 타인에게 숨깁니다</span>
            </div>
          </div>
          <button
            onClick={handleTogglePrivate}
            className={`w-12 h-7 rounded-full p-1 transition-colors duration-300 flex items-center ${
              isPrivateAccount ? 'bg-primary justify-end' : 'bg-surface-container-high justify-start'
            }`}
          >
            <div className="w-5 h-5 rounded-full bg-white shadow-xs"></div>
          </button>
        </div>

        {/* Notification Settings Toggle */}
        <div className="flex items-center justify-between p-3 rounded-xl hover:bg-surface-container-low/60 transition-colors">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-surface-container flex items-center justify-center text-primary">
              <span className="material-symbols-outlined text-[20px]">notifications_active</span>
            </div>
            <div className="flex flex-col">
              <span className="text-[15px] font-bold text-on-surface">알림 설정</span>
              <span className="text-[12px] text-tertiary">아침/저녁 습관 리마인더 푸시 알림</span>
            </div>
          </div>
          <button
            onClick={handleToggleNotification}
            className={`w-12 h-7 rounded-full p-1 transition-colors duration-300 flex items-center ${
              notificationEnabled ? 'bg-primary justify-end' : 'bg-surface-container-high justify-start'
            }`}
          >
            <div className="w-5 h-5 rounded-full bg-white shadow-xs"></div>
          </button>
        </div>

        {/* Language Selection */}
        <button
          onClick={() => setIsLanguageModalOpen(true)}
          className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-surface-container-low/60 transition-colors text-left"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-surface-container flex items-center justify-center text-primary">
              <span className="material-symbols-outlined text-[20px]">translate</span>
            </div>
            <div className="flex flex-col">
              <span className="text-[15px] font-bold text-on-surface">언어 (Language)</span>
              <span className="text-[12px] text-tertiary">
                {languages.find((l) => l.code === selectedLanguage)?.label || '한국어'}
              </span>
            </div>
          </div>
          <span className="material-symbols-outlined text-[20px] text-tertiary">chevron_right</span>
        </button>

        {/* Account Data Management */}
        <button
          onClick={onOpenDataBackupModal}
          className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-surface-container-low/60 transition-colors text-left"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-surface-container flex items-center justify-center text-primary">
              <span className="material-symbols-outlined text-[20px]">database</span>
            </div>
            <div className="flex flex-col">
              <span className="text-[15px] font-bold text-on-surface">계정 관리 & 데이터 백업</span>
              <span className="text-[12px] text-tertiary">기기 간 데이터 이동, JSON 백업 및 초기화</span>
            </div>
          </div>
          <span className="material-symbols-outlined text-[20px] text-tertiary">chevron_right</span>
        </button>
      </section>

      {/* 3. Community & Support Section */}
      <section className="bg-surface-container-lowest rounded-2xl p-4 shadow-[0_4px_20px_-2px_rgba(29,78,216,0.05)] border border-surface-container/70 flex flex-col gap-1">
        <h3 className="text-[13px] font-bold text-tertiary uppercase tracking-wider px-2 py-1 mb-1">
          지원 및 고객센터
        </h3>

        {/* Customer Center (Contact creator) */}
        <button
          onClick={() => setIsContactModalOpen(true)}
          className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-surface-container-low/60 transition-colors text-left"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-surface-container flex items-center justify-center text-primary">
              <span className="material-symbols-outlined text-[20px]">support_agent</span>
            </div>
            <div className="flex flex-col">
              <span className="text-[15px] font-bold text-on-surface">고객센터 (제작자에게 문의하기)</span>
              <span className="text-[12px] text-tertiary">문의글을 작성하면 제작자 메일로 직접 전송됩니다</span>
            </div>
          </div>
          <span className="material-symbols-outlined text-[20px] text-tertiary">chevron_right</span>
        </button>

        {/* Invite Friend */}
        <button
          onClick={handleCopyInviteLink}
          className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-surface-container-low/60 transition-colors text-left"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-surface-container flex items-center justify-center text-primary">
              <span className="material-symbols-outlined text-[20px]">share</span>
            </div>
            <div className="flex flex-col">
              <span className="text-[15px] font-bold text-on-surface">친구 초대하기</span>
              <span className="text-[12px] text-tertiary">함께 좋은 습관을 만들어갈 친구에게 공유</span>
            </div>
          </div>
          <span className="material-symbols-outlined text-[20px] text-tertiary">content_copy</span>
        </button>

        {/* Leave App Review */}
        <button
          onClick={() => setIsReviewModalOpen(true)}
          className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-surface-container-low/60 transition-colors text-left"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-surface-container flex items-center justify-center text-amber-500">
              <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                star
              </span>
            </div>
            <div className="flex flex-col">
              <span className="text-[15px] font-bold text-on-surface">앱 리뷰 남기기</span>
              <span className="text-[12px] text-tertiary">모어해빗에 소중한 별점과 응원을 남겨주세요</span>
            </div>
          </div>
          <span className="material-symbols-outlined text-[20px] text-tertiary">rate_review</span>
        </button>
      </section>

      {/* 4. App Info & Version Section */}
      <section className="bg-surface-container-lowest rounded-2xl p-4 shadow-[0_4px_20px_-2px_rgba(29,78,216,0.05)] border border-surface-container/70 flex flex-col gap-1">
        <h3 className="text-[13px] font-bold text-tertiary uppercase tracking-wider px-2 py-1 mb-1">
          앱 정보
        </h3>

        {/* App Version Row with Update Button */}
        <div className="flex items-center justify-between p-3 rounded-xl">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-surface-container flex items-center justify-center text-primary">
              <span className="material-symbols-outlined text-[20px]">info</span>
            </div>
            <div className="flex flex-col">
              <span className="text-[15px] font-bold text-on-surface">현재 버전 : 1.1</span>
              <span className="text-[12px] text-primary font-semibold">최신 버전 이용 중</span>
            </div>
          </div>

          <button
            onClick={handleCheckUpdate}
            className="px-3.5 py-1.5 rounded-xl bg-primary text-white text-[13px] font-bold hover:bg-primary-container active:scale-95 transition-all shadow-xs"
          >
            업데이트
          </button>
        </div>

        {/* Terms of Service */}
        <button
          onClick={() => setIsTermsModalOpen(true)}
          className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-surface-container-low/60 transition-colors text-left"
        >
          <span className="text-[14px] font-semibold text-on-surface">이용약관</span>
          <span className="material-symbols-outlined text-[18px] text-tertiary">chevron_right</span>
        </button>

        {/* Privacy Policy */}
        <button
          onClick={() => setIsPrivacyModalOpen(true)}
          className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-surface-container-low/60 transition-colors text-left"
        >
          <span className="text-[14px] font-semibold text-on-surface">개인정보 처리방침</span>
          <span className="material-symbols-outlined text-[18px] text-tertiary">chevron_right</span>
        </button>
      </section>

      {/* 5. Logout Button (약한 색상 작은 포인트 하단에 작게) */}
      <div className="flex justify-center pt-2 pb-4">
        <button
          onClick={handleLogout}
          className="text-[12px] text-slate-400 hover:text-slate-600 underline font-medium transition-colors p-2"
        >
          로그아웃
        </button>
      </div>

      {/* --- MODALS --- */}

      {/* Contact Creator Modal */}
      <Modal
        isOpen={isContactModalOpen}
        onClose={() => setIsContactModalOpen(false)}
        title="고객센터 문의하기"
      >
        <form onSubmit={handleSubmitContact} className="flex flex-col gap-4">
          <p className="text-[13px] text-tertiary leading-relaxed">
            작성하신 문의글은 제작자의 메일(<strong>support@morehabbit.app</strong>)로 바로 전달되며, 빠른 시일 내에 답변 드립니다.
          </p>

          <div>
            <label className="text-[13px] font-bold text-on-surface block mb-1.5">문의 유형</label>
            <div className="grid grid-cols-3 gap-2">
              {['기능 제안', '버그 신고', '기타 문의'].map((cat) => (
                <button
                  type="button"
                  key={cat}
                  onClick={() => setContactCategory(cat)}
                  className={`py-2 text-[13px] font-bold rounded-xl border transition-all ${
                    contactCategory === cat
                      ? 'bg-primary text-white border-primary shadow-xs'
                      : 'bg-surface-container-low text-tertiary border-surface-container hover:bg-surface-container'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-[13px] font-bold text-on-surface block mb-1.5">문의 제목</label>
            <input
              type="text"
              value={contactSubject}
              onChange={(e) => setContactSubject(e.target.value)}
              placeholder="문의하실 핵심 내용을 적어주세요"
              className="w-full px-3.5 py-2.5 rounded-xl bg-surface-container-low border border-surface-container text-[14px] text-on-surface focus:outline-none focus:border-primary"
              required
            />
          </div>

          <div>
            <label className="text-[13px] font-bold text-on-surface block mb-1.5">문의 상세 내용</label>
            <textarea
              value={contactBody}
              onChange={(e) => setContactBody(e.target.value)}
              rows={4}
              placeholder="자세한 상황이나 제안하고 싶은 내용을 자유롭게 작성해 주세요."
              className="w-full px-3.5 py-2.5 rounded-xl bg-surface-container-low border border-surface-container text-[14px] text-on-surface focus:outline-none focus:border-primary resize-none"
              required
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsContactModalOpen(false)}
              className="px-4 py-2.5 rounded-xl text-[14px] font-semibold text-tertiary hover:bg-surface-container transition-colors"
            >
              취소
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-primary text-white text-[14px] font-bold hover:bg-primary-container shadow-xs active:scale-95 transition-all flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-[18px]">send</span>
              <span>문의 메일 보내기</span>
            </button>
          </div>
        </form>
      </Modal>

      {/* Review Modal */}
      <Modal
        isOpen={isReviewModalOpen}
        onClose={() => setIsReviewModalOpen(false)}
        title="모어해빗 리뷰 남기기"
      >
        <form onSubmit={handleSubmitReview} className="flex flex-col items-center gap-4 text-center">
          <div className="w-12 h-12 rounded-2xl bg-amber-100 flex items-center justify-center text-amber-600 text-2xl">
            ⭐
          </div>
          <div>
            <h4 className="text-[16px] font-bold text-on-surface">모어해빗 사용 경험은 어떠셨나요?</h4>
            <p className="text-[13px] text-tertiary mt-1">별점을 클릭하여 평가해 주세요</p>
          </div>

          {/* Star Rating Selector */}
          <div className="flex items-center gap-2 py-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                type="button"
                key={star}
                onClick={() => setRating(star)}
                className="p-1 active:scale-125 transition-transform"
              >
                <span
                  className={`material-symbols-outlined text-[34px] ${
                    rating >= star ? 'text-amber-400' : 'text-slate-300'
                  }`}
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  star
                </span>
              </button>
            ))}
          </div>

          <textarea
            value={reviewText}
            onChange={(e) => setReviewText(e.target.value)}
            rows={3}
            placeholder="제작자에게 전하고 싶은 칭찬이나 피드백을 자유롭게 남겨주세요."
            className="w-full px-3.5 py-2.5 rounded-xl bg-surface-container-low border border-surface-container text-[14px] text-on-surface focus:outline-none focus:border-primary resize-none text-left"
          />

          <div className="flex items-center justify-end gap-2 w-full pt-1">
            <button
              type="button"
              onClick={() => setIsReviewModalOpen(false)}
              className="px-4 py-2.5 rounded-xl text-[14px] font-semibold text-tertiary hover:bg-surface-container transition-colors"
            >
              닫기
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-primary text-white text-[14px] font-bold hover:bg-primary-container shadow-xs active:scale-95 transition-all"
            >
              리뷰 등록하기
            </button>
          </div>
        </form>
      </Modal>

      {/* Language Selection Modal */}
      <Modal
        isOpen={isLanguageModalOpen}
        onClose={() => setIsLanguageModalOpen(false)}
        title="언어 설정 (Language)"
      >
        <div className="flex flex-col gap-2">
          {languages.map((lang) => (
            <button
              key={lang.code}
              onClick={() => {
                setSelectedLanguage(lang.code as any);
                localStorage.setItem('morehabbit_lang', lang.code);
                setIsLanguageModalOpen(false);
                showToast(`언어가 ${lang.label}로 설정되었습니다.`);
              }}
              className={`w-full p-3.5 rounded-xl border flex items-center justify-between text-left transition-all ${
                selectedLanguage === lang.code
                  ? 'border-primary bg-primary-fixed/30 text-primary font-bold shadow-xs'
                  : 'border-surface-container bg-surface-container-lowest text-on-surface hover:bg-surface-container-low'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="text-xl">{lang.flag}</span>
                <span className="text-[15px]">{lang.label}</span>
              </div>
              {selectedLanguage === lang.code && (
                <span className="material-symbols-outlined text-[20px] text-primary">check_circle</span>
              )}
            </button>
          ))}
        </div>
      </Modal>

      {/* Terms of Service Modal */}
      <Modal
        isOpen={isTermsModalOpen}
        onClose={() => setIsTermsModalOpen(false)}
        title="모어해빗 서비스 이용약관"
      >
        <div className="flex flex-col gap-3 text-[13px] text-tertiary leading-relaxed max-h-80 overflow-y-auto pr-1">
          <p className="font-bold text-on-surface">제1조 (목적)</p>
          <p>
            본 약관은 모어해빗(morehabbit) 서비스의 이용조건 및 절차, 이용자와 서비스 제공자의 권리, 의무 및 책임사항을 규정함을 목적으로 합니다.
          </p>
          <p className="font-bold text-on-surface">제2조 (이용자의 권리와 의무)</p>
          <p>
            이용자는 본인의 습관 관리 및 성장을 목적으로 서비스를 자유롭게 이용할 수 있으며, 타인의 권리를 침해하거나 서비스 운영을 방해하지 않아야 합니다.
          </p>
          <p className="font-bold text-on-surface">제3조 (데이터의 보관)</p>
          <p>
            모어해빗은 이용자의 소중한 습관 및 일상 기록을 안전하게 보호하며, 로컬 스토리지를 활용하여 안전하고 빠른 데이터 접근을 지원합니다.
          </p>
        </div>
        <div className="flex justify-end pt-3">
          <button
            onClick={() => setIsTermsModalOpen(false)}
            className="px-4 py-2 rounded-xl bg-primary text-white text-[13px] font-bold"
          >
            확인
          </button>
        </div>
      </Modal>

      {/* Privacy Policy Modal */}
      <Modal
        isOpen={isPrivacyModalOpen}
        onClose={() => setIsPrivacyModalOpen(false)}
        title="개인정보 처리방침"
      >
        <div className="flex flex-col gap-3 text-[13px] text-tertiary leading-relaxed max-h-80 overflow-y-auto pr-1">
          <p className="font-bold text-on-surface">1. 개인정보의 수집 항목</p>
          <p>모어해빗은 서비스 이용을 위해 닉네임, 루틴 목록, 달성 로그, 수면 패턴 기록 등을 사용자 브라우저 내에 저장합니다.</p>
          <p className="font-bold text-on-surface">2. 개인정보의 보유 및 이용 기간</p>
          <p>사용자가 데이터를 삭제하거나 초기화하기 전까지 사용자 기기에 안전하게 보관됩니다.</p>
          <p className="font-bold text-on-surface">3. 제3자 제공 금지</p>
          <p>모어해빗은 사용자의 어떠한 개인 데이터도 외부 서버나 제3자에게 무단 제공하거나 판매하지 않습니다.</p>
        </div>
        <div className="flex justify-end pt-3">
          <button
            onClick={() => setIsPrivacyModalOpen(false)}
            className="px-4 py-2 rounded-xl bg-primary text-white text-[13px] font-bold"
          >
            확인
          </button>
        </div>
      </Modal>
    </div>
  );
};
