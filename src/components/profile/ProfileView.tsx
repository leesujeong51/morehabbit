import React, { useState, useEffect } from 'react';
import type { Routine, RoutineLog, UserProfile, CustomerInquiry } from '../../types/routine';
import { useLanguage, SUPPORTED_LANGUAGES } from '../../utils/i18n';
import { getStoredInquiries, saveStoredInquiries } from '../../utils/storage';

interface ProfileViewProps {
  routines: Routine[];
  logs: RoutineLog[];
  streakCount: number;
  onOpenDataBackupModal: () => void;
  userProfile?: UserProfile;
  onUpdateProfile?: (profile: Partial<UserProfile>) => void;
}

const PRESET_EMOJIS = ['🐨', '🌿', '🔥', '✨', '🌸', '🦁', '🥑', '🚀', '💡', '🧘', '☕', '🏃'];

export const ProfileView: React.FC<ProfileViewProps> = ({
  routines,
  logs,
  streakCount,
  onOpenDataBackupModal,
  userProfile,
  onUpdateProfile,
}) => {
  const { language, setLanguage, t } = useLanguage();
  const currentName = userProfile?.name || 'SJ';
  const currentAvatarEmoji = userProfile?.avatarEmoji || '🐨';
  const currentAvatarUrl = userProfile?.avatarUrl;
  const currentBio = userProfile?.bio || t.common.slogan;

  // Account & App Settings State
  const [isPrivateAccount, setIsPrivateAccount] = useState(() => {
    return localStorage.getItem('morehabbit_is_private') === 'true';
  });
  const [notificationEnabled, setNotificationEnabled] = useState(() => {
    return userProfile ? userProfile.allowNotification : localStorage.getItem('morehabbit_notif_enabled') !== 'false';
  });

  // Full-Page View States (User Request 3: 내정보 모두 풀페이지 형태 UI로 변경, 팝업X)
  const [isProfileEditOpen, setIsProfileEditOpen] = useState(false);
  const [isNotifPageOpen, setIsNotifPageOpen] = useState(false);
  const [isContactPageOpen, setIsContactPageOpen] = useState(false);
  const [isLanguagePageOpen, setIsLanguagePageOpen] = useState(false);
  const [isReviewPageOpen, setIsReviewPageOpen] = useState(false);
  const [isTermsPageOpen, setIsTermsPageOpen] = useState(false);
  const [isPrivacyPageOpen, setIsPrivacyPageOpen] = useState(false);

  // Profile Edit State
  const [editName, setEditName] = useState(currentName);
  const [editEmoji, setEditEmoji] = useState(currentAvatarEmoji);
  const [editAvatarUrl, setEditAvatarUrl] = useState<string | undefined>(currentAvatarUrl);
  const [editBio, setEditBio] = useState(currentBio);

  // Customer Center State
  const [contactTab, setContactTab] = useState<'write' | 'list'>('write');
  const [contactSubject, setContactSubject] = useState('');
  const [contactBody, setContactBody] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactCategory, setContactCategory] = useState('기능 제안');
  const [inquiries, setInquiries] = useState<CustomerInquiry[]>(() => getStoredInquiries());

  // Review State
  const [rating, setRating] = useState(5);
  const [reviewText, setReviewText] = useState('');

  // Toast / Feedback
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  useEffect(() => {
    setEditName(userProfile?.name || 'SJ');
    setEditEmoji(userProfile?.avatarEmoji || '🐨');
    setEditAvatarUrl(userProfile?.avatarUrl);
    setEditBio(userProfile?.bio || t.common.slogan);
  }, [userProfile, t.common.slogan]);

  // Toggle Private Account
  const handleTogglePrivate = () => {
    const nextVal = !isPrivateAccount;
    setIsPrivateAccount(nextVal);
    localStorage.setItem('morehabbit_is_private', String(nextVal));
    showToast(nextVal ? t.profile.toastPrivateOn : t.profile.toastPrivateOff);
  };

  // Toggle Notification
  const handleToggleNotification = () => {
    const nextVal = !notificationEnabled;
    setNotificationEnabled(nextVal);
    localStorage.setItem('morehabbit_notif_enabled', String(nextVal));
    showToast(nextVal ? t.profile.toastNotifOn : t.profile.toastNotifOff);
  };

  // Handle Profile Save
  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editName.trim()) {
      showToast(t.profile.toastNameRequired || '이름(닉네임)을 입력해 주세요.');
      return;
    }

    if (onUpdateProfile) {
      onUpdateProfile({
        name: editName.trim(),
        avatarEmoji: editEmoji,
        avatarUrl: editAvatarUrl,
        bio: editBio.trim(),
      });
    }

    setIsProfileEditOpen(false);
    showToast(t.profile.nameUpdated.replace('{name}', editName.trim()));
  };

  // Handle Image Upload for Avatar
  const handleAvatarFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      showToast(t.profile.toastImageSize || '이미지 용량은 2MB 이하만 지원됩니다.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      setEditAvatarUrl(result);
    };
    reader.readAsDataURL(file);
  };

  // Request Web Browser Notification
  const handleRequestPushPermission = async () => {
    if (!('Notification' in window)) {
      showToast(t.profile.toastNotifUnsupported || '현재 브라우저는 웹 알림을 지원하지 않습니다.');
      return;
    }

    try {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        new Notification('MoreHabit', {
          body: (t.profile.toastNotifWelcome || '반가워요 {name}님! 모어해빗 습관 알림이 활성화되었습니다 ✨').replace('{name}', currentName),
          icon: './icon-192.png',
        });
        showToast(t.profile.toastNotifGranted || '브라우저 알림 권한이 허용되었습니다! 🔔');
      } else {
        showToast(t.profile.toastNotifBlocked || '알림 권한이 차단되어 있습니다.');
      }
    } catch {
      showToast(t.profile.toastNotifError || '알림 권한 요청 중 오류가 발생했습니다.');
    }
  };

  // Submit Inquiry
  const handleSubmitContact = (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactEmail.trim() || !contactEmail.includes('@')) {
      showToast(t.profile.toastEmailRequired || '답변을 받아보실 이메일 주소(Gmail 등)를 정확히 입력해 주세요.');
      return;
    }
    if (!contactSubject.trim() || !contactBody.trim()) {
      showToast(t.profile.toastFieldsRequired || '문의 제목과 내용을 입력해 주세요.');
      return;
    }

    const newInquiry: CustomerInquiry = {
      id: `inquiry-${Date.now()}`,
      category: contactCategory,
      subject: contactSubject.trim(),
      body: contactBody.trim(),
      userEmail: contactEmail.trim(),
      userName: currentName,
      createdAt: new Date().toISOString(),
    };

    const updated = [newInquiry, ...inquiries];
    setInquiries(updated);
    saveStoredInquiries(updated);

    const emailSubjectPrefix = language === 'en' ? 'MoreHabit Support' : language === 'ja' ? 'モアハビット お問い合わせ' : '모어해빗 운영자 문의';
    const authorLabel = language === 'en' ? 'Author' : language === 'ja' ? '投稿者' : '작성자';
    const replyMailLabel = language === 'en' ? 'Reply to' : language === 'ja' ? '返信先' : '답변받을 메일';
    const catLabel = language === 'en' ? 'Category' : language === 'ja' ? '分類' : '분류';

    const mailtoUrl = `mailto:doalabsofficial@gmail.com?subject=${encodeURIComponent(
      `[${emailSubjectPrefix} - ${contactCategory}] ${contactSubject}`
    )}&body=${encodeURIComponent(
      `${authorLabel}: ${currentName}\n${replyMailLabel}: ${contactEmail}\n${catLabel}: ${contactCategory}\n\n${contactBody}`
    )}`;
    window.open(mailtoUrl, '_blank');

    setContactSubject('');
    setContactBody('');
    setContactTab('list');
    showToast(t.profile.toastInquirySubmitted || '문의가 안전하게 접수되었습니다 ✉️');
  };

  // Delete Inquiry
  const handleDeleteInquiry = (id: string) => {
    if (confirm(t.profile.deleteInquiryConfirm || '이 문의 내역을 삭제하시겠습니까?')) {
      const updated = inquiries.filter((item) => item.id !== id);
      setInquiries(updated);
      saveStoredInquiries(updated);
      showToast(t.profile.toastInquiryDeleted || '문의 내역이 삭제되었습니다.');
    }
  };

  // Invite Friend (Copy Link)
  const handleCopyInviteLink = () => {
    const inviteUrl = 'https://morehabbit.app/invite/' + encodeURIComponent(currentName);
    if (navigator.clipboard) {
      navigator.clipboard.writeText(inviteUrl);
    }
    showToast(t.profile.toastInviteCopied);
  };

  // Submit Review
  const handleSubmitReview = (e: React.FormEvent) => {
    e.preventDefault();
    setIsReviewPageOpen(false);
    setReviewText('');
    showToast((t.profile.toastReviewThanks || '{rating}점 소중한 리뷰를 남겨주셔서 감사합니다! ⭐').replace('{rating}', String(rating)));
  };

  // Check Update
  const handleCheckUpdate = () => {
    showToast(t.profile.toastVersionLatest);
  };

  const completedCount = logs.filter((l) => l.completed).length;
  const totalXp = completedCount * 40;

  return (
    <div className="flex flex-col w-full pb-10 gap-space-lg select-none">
      {/* Toast Notification Pill */}
      {toastMessage && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-full bg-slate-900/90 text-white text-xs font-bold shadow-lg backdrop-blur-md flex items-center gap-2 animate-bounce">
          <span>✨</span>
          <span className="break-keep">{toastMessage}</span>
        </div>
      )}

      {/* 1. Account Profile Header Card */}
      <section className="bg-surface-container-lowest rounded-2xl p-5 shadow-[0_4px_24px_-4px_rgba(29,78,216,0.06)] border border-surface-container/70 flex flex-col gap-4">
        <div className="flex items-center gap-4">
          {/* User Avatar */}
          <div
            onClick={() => setIsProfileEditOpen(true)}
            className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#1d4ed8] to-[#3b82f6] text-white flex items-center justify-center font-extrabold text-xl shadow-md border-2 border-white/20 shrink-0 cursor-pointer overflow-hidden relative group"
            title={t.profile.editTitle || '프로필 수정하기'}
          >
            {currentAvatarUrl ? (
              <img src={currentAvatarUrl} alt={currentName} className="w-full h-full object-cover" />
            ) : (
              <span>{currentAvatarEmoji}</span>
            )}
            <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
              <span className="material-symbols-outlined text-white text-[18px]">edit</span>
            </div>
          </div>

          <div className="flex flex-col min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-extrabold text-on-surface tracking-tight truncate">
                {currentName}
              </h2>
              <button
                onClick={() => setIsProfileEditOpen(true)}
                className="p-1 rounded-md text-tertiary hover:text-primary hover:bg-surface-container-low transition cursor-pointer"
                title={t.profile.editTitle || '프로필 및 닉네임 수정'}
              >
                <span className="material-symbols-outlined text-[16px]">edit</span>
              </button>
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-primary-fixed text-primary ml-auto shrink-0 break-keep">
                {t.common.localSaveMode}
              </span>
            </div>
            <span className="text-xs text-tertiary mt-0.5 font-medium truncate break-keep">
              {t.common.offlineReady}
            </span>
            <span className="text-xs text-secondary font-semibold mt-1 break-keep truncate">
              "{currentBio}"
            </span>
          </div>
        </div>

        {/* Quick Stats Summary Grid */}
        <div className="grid grid-cols-3 gap-2 pt-3 border-t border-surface-container/50 text-center">
          <div className="bg-surface-container-low p-2.5 rounded-xl">
            <span className="text-xs font-medium text-tertiary break-keep">{t.profile.myRoutines}</span>
            <div className="text-base font-bold text-primary mt-0.5">
              {routines.filter((r) => !r.archived).length}
            </div>
          </div>
          <div className="bg-surface-container-low p-2.5 rounded-xl">
            <span className="text-xs font-medium text-tertiary break-keep">{t.profile.streakDays}</span>
            <div className="text-base font-bold text-rose-500 mt-0.5">
              {streakCount}
            </div>
          </div>
          <div className="bg-surface-container-low p-2.5 rounded-xl">
            <span className="text-xs font-medium text-tertiary break-keep">{t.profile.totalXp}</span>
            <div className="text-base font-bold text-secondary mt-0.5">
              {totalXp}
            </div>
          </div>
        </div>
      </section>

      {/* 2. Account Preferences & Privacy Section */}
      <section className="bg-surface-container-lowest rounded-2xl p-4 shadow-[0_4px_20px_-2px_rgba(29,78,216,0.05)] border border-surface-container/70 flex flex-col gap-1">
        <h3 className="text-xs font-bold text-tertiary uppercase tracking-wider px-2 py-1 mb-1 break-keep">
          {t.profile.accountSection}
        </h3>

        {/* Profile Edit Row */}
        <button
          onClick={() => setIsProfileEditOpen(true)}
          className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-surface-container-low/60 transition-colors text-left cursor-pointer"
        >
          <div className="flex items-center gap-3 min-w-0 pr-2">
            <div className="w-9 h-9 rounded-xl bg-surface-container flex items-center justify-center text-primary shrink-0">
              <span className="material-symbols-outlined text-[20px]">badge</span>
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-sm font-bold text-on-surface break-keep">{t.profile.editProfile}</span>
              <span className="text-xs text-tertiary break-keep">{t.profile.editProfileDesc}</span>
            </div>
          </div>
          <span className="material-symbols-outlined text-[20px] text-tertiary shrink-0">chevron_right</span>
        </button>

        {/* Private Account Toggle */}
        <div className="flex items-center justify-between p-3 rounded-xl hover:bg-surface-container-low/60 transition-colors">
          <div className="flex items-center gap-3 min-w-0 pr-2">
            <div className="w-9 h-9 rounded-xl bg-surface-container flex items-center justify-center text-primary shrink-0">
              <span className="material-symbols-outlined text-[20px]">
                {isPrivateAccount ? 'lock' : 'lock_open'}
              </span>
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-sm font-bold text-on-surface break-keep">{t.profile.privateAccount}</span>
              <span className="text-xs text-tertiary break-keep">{t.profile.privateAccountDesc}</span>
            </div>
          </div>
          <button
            onClick={handleTogglePrivate}
            className={`w-12 h-7 rounded-full p-1 transition-colors duration-300 flex items-center shrink-0 cursor-pointer ${
              isPrivateAccount ? 'bg-primary justify-end' : 'bg-surface-container-high justify-start'
            }`}
          >
            <div className="w-5 h-5 rounded-full bg-white shadow-xs"></div>
          </button>
        </div>

        {/* Notification Settings Row & Toggle */}
        <div className="flex items-center justify-between p-3 rounded-xl hover:bg-surface-container-low/60 transition-colors">
          <div
            onClick={() => setIsNotifPageOpen(true)}
            className="flex items-center gap-3 min-w-0 pr-2 flex-1 cursor-pointer"
          >
            <div className="w-9 h-9 rounded-xl bg-surface-container flex items-center justify-center text-primary shrink-0">
              <span className="material-symbols-outlined text-[20px]">notifications_active</span>
            </div>
            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-bold text-on-surface break-keep">{t.profile.notifications}</span>
                <span className="px-1.5 py-0.5 rounded-md bg-blue-100 text-blue-700 text-xs font-black">{t.profile.previewExample || '예시보기'}</span>
              </div>
              <span className="text-xs text-tertiary break-keep">{t.profile.notificationsDesc}</span>
            </div>
          </div>
          <button
            onClick={handleToggleNotification}
            className={`w-12 h-7 rounded-full p-1 transition-colors duration-300 flex items-center shrink-0 cursor-pointer ${
              notificationEnabled ? 'bg-primary justify-end' : 'bg-surface-container-high justify-start'
            }`}
          >
            <div className="w-5 h-5 rounded-full bg-white shadow-xs"></div>
          </button>
        </div>

        {/* Language Selection */}
        <button
          onClick={() => setIsLanguagePageOpen(true)}
          className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-surface-container-low/60 transition-colors text-left cursor-pointer"
        >
          <div className="flex items-center gap-3 min-w-0 pr-2">
            <div className="w-9 h-9 rounded-xl bg-surface-container flex items-center justify-center text-primary shrink-0">
              <span className="material-symbols-outlined text-[20px]">translate</span>
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-sm font-bold text-on-surface break-keep">{t.profile.language}</span>
              <span className="text-xs text-primary font-bold break-keep">
                {SUPPORTED_LANGUAGES.find((l) => l.code === language)?.label || '한국어'}
              </span>
            </div>
          </div>
          <span className="material-symbols-outlined text-[20px] text-tertiary shrink-0">chevron_right</span>
        </button>

        {/* Account Data Management */}
        <button
          onClick={onOpenDataBackupModal}
          className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-surface-container-low/60 transition-colors text-left cursor-pointer"
        >
          <div className="flex items-center gap-3 min-w-0 pr-2">
            <div className="w-9 h-9 rounded-xl bg-surface-container flex items-center justify-center text-primary shrink-0">
              <span className="material-symbols-outlined text-[20px]">database</span>
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-sm font-bold text-on-surface break-keep">{t.profile.dataManagement}</span>
              <span className="text-xs text-tertiary break-keep">{t.profile.dataManagementDesc}</span>
            </div>
          </div>
          <span className="material-symbols-outlined text-[20px] text-tertiary shrink-0">chevron_right</span>
        </button>
      </section>

      {/* 3. Community & Support Section */}
      <section className="bg-surface-container-lowest rounded-2xl p-4 shadow-[0_4px_20px_-2px_rgba(29,78,216,0.05)] border border-surface-container/70 flex flex-col gap-1">
        <h3 className="text-xs font-bold text-tertiary uppercase tracking-wider px-2 py-1 mb-1 break-keep">
          {t.profile.supportSection}
        </h3>

        {/* Operator Customer Center */}
        <button
          onClick={() => setIsContactPageOpen(true)}
          className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-surface-container-low/60 transition-colors text-left cursor-pointer"
        >
          <div className="flex items-center gap-3 min-w-0 pr-2">
            <div className="w-9 h-9 rounded-xl bg-surface-container flex items-center justify-center text-primary shrink-0">
              <span className="material-symbols-outlined text-[20px]">support_agent</span>
            </div>
            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-on-surface break-keep">{t.profile.supportContact}</span>
                {inquiries.length > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 text-xs font-black">
                    {inquiries.length}
                  </span>
                )}
              </div>
              <span className="text-xs text-tertiary break-keep">{t.profile.supportContactDesc}</span>
            </div>
          </div>
          <span className="material-symbols-outlined text-[20px] text-tertiary shrink-0">chevron_right</span>
        </button>

        {/* Invite Friend */}
        <button
          onClick={handleCopyInviteLink}
          className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-surface-container-low/60 transition-colors text-left cursor-pointer"
        >
          <div className="flex items-center gap-3 min-w-0 pr-2">
            <div className="w-9 h-9 rounded-xl bg-surface-container flex items-center justify-center text-primary shrink-0">
              <span className="material-symbols-outlined text-[20px]">share</span>
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-sm font-bold text-on-surface break-keep">{t.profile.inviteFriends}</span>
              <span className="text-xs text-tertiary break-keep">{t.profile.inviteFriendsDesc}</span>
            </div>
          </div>
          <span className="material-symbols-outlined text-[20px] text-tertiary shrink-0">content_copy</span>
        </button>

        {/* Leave App Review */}
        <button
          onClick={() => setIsReviewPageOpen(true)}
          className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-surface-container-low/60 transition-colors text-left cursor-pointer"
        >
          <div className="flex items-center gap-3 min-w-0 pr-2">
            <div className="w-9 h-9 rounded-xl bg-surface-container flex items-center justify-center text-amber-500 shrink-0">
              <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                star
              </span>
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-sm font-bold text-on-surface break-keep">{t.profile.rateApp}</span>
              <span className="text-xs text-tertiary break-keep">{t.profile.rateAppDesc}</span>
            </div>
          </div>
          <span className="material-symbols-outlined text-[20px] text-tertiary shrink-0">rate_review</span>
        </button>
      </section>

      {/* 4. App Info & Version Section */}
      <section className="bg-surface-container-lowest rounded-2xl p-4 shadow-[0_4px_20px_-2px_rgba(29,78,216,0.05)] border border-surface-container/70 flex flex-col gap-1">
        <h3 className="text-xs font-bold text-tertiary uppercase tracking-wider px-2 py-1 mb-1 break-keep">
          {t.profile.appInfoSection}
        </h3>

        {/* App Version Row */}
        <div className="flex items-center justify-between p-3 rounded-xl">
          <div className="flex items-center gap-3 min-w-0 pr-2">
            <div className="w-9 h-9 rounded-xl bg-surface-container flex items-center justify-center text-primary shrink-0">
              <span className="material-symbols-outlined text-[20px]">info</span>
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-sm font-bold text-on-surface break-keep">{t.profile.currentVersion}</span>
              <span className="text-xs text-primary font-semibold break-keep">{t.profile.latestVersion}</span>
            </div>
          </div>

          <button
            onClick={handleCheckUpdate}
            className="px-3.5 py-1.5 rounded-xl bg-primary text-white text-xs font-bold hover:bg-blue-700 active:scale-95 transition-all shadow-xs shrink-0 cursor-pointer break-keep"
          >
            {t.profile.updateBtn}
          </button>
        </div>

        {/* Terms of Service */}
        <button
          onClick={() => setIsTermsPageOpen(true)}
          className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-surface-container-low/60 transition-colors text-left cursor-pointer"
        >
          <span className="text-sm font-semibold text-on-surface break-keep">{t.profile.termsOfService}</span>
          <span className="material-symbols-outlined text-[20px] text-tertiary">chevron_right</span>
        </button>

        {/* Privacy Policy */}
        <button
          onClick={() => setIsPrivacyPageOpen(true)}
          className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-surface-container-low/60 transition-colors text-left cursor-pointer"
        >
          <span className="text-sm font-semibold text-on-surface break-keep">{t.profile.privacyPolicy}</span>
          <span className="material-symbols-outlined text-[20px] text-tertiary">chevron_right</span>
        </button>
      </section>

      {/* ============================================================== */}
      {/* FULL PAGE 1: Profile Edit (User Request 3: 팝업X 풀페이지 형태) */}
      {/* ============================================================== */}
      {isProfileEditOpen && (
        <div className="fixed inset-0 z-50 bg-[#f4f7fc] flex flex-col overflow-y-auto select-none animate-fadeIn">
          <header className="sticky top-0 z-20 bg-white/95 backdrop-blur-md border-b border-blue-100/80 px-4 py-3.5 shadow-2xs">
            <div className="max-w-md mx-auto flex items-center justify-between">
              <button
                onClick={() => setIsProfileEditOpen(false)}
                className="flex items-center gap-1.5 text-slate-700 hover:text-blue-700 transition font-bold text-sm cursor-pointer"
              >
                <span className="material-symbols-outlined text-[22px]">arrow_back</span>
                <span>{t.common.back}</span>
              </button>
              <h2 className="text-base font-black text-[#0f2e7a]">
                {t.profile.editProfile}
              </h2>
              <div className="w-16"></div>
            </div>
          </header>

          <main className="flex-1 w-full max-w-md mx-auto p-5 flex flex-col gap-5">
            <form onSubmit={handleSaveProfile} className="bg-white rounded-3xl p-6 border border-blue-100/90 shadow-2xs flex flex-col gap-5">
              {/* Avatar Preview & Selection */}
              <div className="flex flex-col items-center gap-3">
                <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-[#1d4ed8] to-[#3b82f6] text-white flex items-center justify-center font-extrabold text-xl shadow-md border-2 border-white/20 overflow-hidden relative">
                  {editAvatarUrl ? (
                    <img src={editAvatarUrl} alt={editName} className="w-full h-full object-cover" />
                  ) : (
                    <span>{editEmoji}</span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <label className="px-3.5 py-2 rounded-xl bg-blue-50 text-blue-700 border border-blue-200 text-xs font-bold hover:bg-blue-100 cursor-pointer flex items-center gap-1.5 transition">
                    <span className="material-symbols-outlined text-[18px]">upload</span>
                    <span>{t.profile.uploadPhoto || '사진 업로드'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarFileChange}
                      className="hidden"
                    />
                  </label>

                  {editAvatarUrl && (
                    <button
                      type="button"
                      onClick={() => setEditAvatarUrl(undefined)}
                      className="px-3 py-2 rounded-xl bg-slate-100 text-slate-600 text-xs font-medium hover:bg-slate-200 transition"
                    >
                      {t.profile.resetEmoji || '기본 이모지로 복원'}
                    </button>
                  )}
                </div>

                {/* Preset Emoji Row */}
                <div className="flex flex-wrap items-center justify-center gap-2 pt-2 max-w-xs">
                  {PRESET_EMOJIS.map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => {
                        setEditEmoji(emoji);
                        setEditAvatarUrl(undefined);
                      }}
                      className={`w-10 h-10 rounded-2xl text-lg flex items-center justify-center transition cursor-pointer ${
                        editEmoji === emoji && !editAvatarUrl
                          ? 'bg-blue-100 border-2 border-blue-600 scale-110 shadow-xs'
                          : 'bg-slate-50 border border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>

              {/* Nickname Input */}
              <div>
                <label className="text-xs font-bold text-slate-700 mb-1.5 block">
                  {t.profile.nameLabel || '닉네임 / 성함'} <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder={t.profile.namePlaceholder || '표시할 이름을 입력하세요'}
                  maxLength={15}
                  required
                  className="w-full p-3.5 rounded-2xl border border-slate-200 bg-slate-50 text-sm font-semibold text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white"
                />
              </div>

              {/* Bio / Slogan Input */}
              <div>
                <label className="text-xs font-bold text-slate-700 mb-1.5 block">
                  {t.profile.bioLabel || '한 줄 다짐 / 슬로건'}
                </label>
                <input
                  type="text"
                  value={editBio}
                  onChange={(e) => setEditBio(e.target.value)}
                  placeholder={t.profile.bioPlaceholder || '예: 작은 습관이 쌓여 큰 변화를 만든다'}
                  maxLength={40}
                  className="w-full p-3.5 rounded-2xl border border-slate-200 bg-slate-50 text-sm text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white"
                />
              </div>

              {/* Buttons */}
              <div className="flex gap-2.5 pt-3">
                <button
                  type="button"
                  onClick={() => setIsProfileEditOpen(false)}
                  className="flex-1 py-3.5 rounded-2xl text-sm font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition cursor-pointer"
                >
                  {t.common.cancel}
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3.5 rounded-2xl bg-primary text-white text-sm font-bold hover:bg-blue-700 transition cursor-pointer shadow-xs"
                >
                  {t.common.save}
                </button>
              </div>
            </form>
          </main>
        </div>
      )}

      {/* ============================================================== */}
      {/* FULL PAGE 2: Notification Info (User Request 3: 풀페이지 형태) */}
      {/* ============================================================== */}
      {isNotifPageOpen && (
        <div className="fixed inset-0 z-50 bg-[#f4f7fc] flex flex-col overflow-y-auto select-none animate-fadeIn">
          <header className="sticky top-0 z-20 bg-white/95 backdrop-blur-md border-b border-blue-100/80 px-4 py-3.5 shadow-2xs">
            <div className="max-w-md mx-auto flex items-center justify-between">
              <button
                onClick={() => setIsNotifPageOpen(false)}
                className="flex items-center gap-1.5 text-slate-700 hover:text-blue-700 transition font-bold text-sm cursor-pointer"
              >
                <span className="material-symbols-outlined text-[22px]">arrow_back</span>
                <span>{t.common.back}</span>
              </button>
              <h2 className="text-base font-black text-[#0f2e7a]">
                {t.profile.notifications}
              </h2>
              <div className="w-16"></div>
            </div>
          </header>

          <main className="flex-1 w-full max-w-md mx-auto p-5 flex flex-col gap-4">
            <div className="p-4 bg-white border border-blue-100/90 rounded-3xl shadow-2xs flex items-start gap-3">
              <span className="text-lg shrink-0">🔔</span>
              <div className="text-xs text-slate-700 leading-relaxed break-keep">
                {t.profile.notifInfoBanner || '현재 웹 브라우저 알림을 지원하며, 추후 스마트폰 전용 모바일 앱 출시 시 기기 푸시 알림과 완벽히 연동됩니다.'}
              </div>
            </div>

            <button
              onClick={handleRequestPushPermission}
              className="w-full py-4 rounded-2xl bg-primary text-white text-sm font-extrabold flex items-center justify-center gap-2 hover:bg-blue-700 active:scale-98 transition shadow-xs cursor-pointer"
            >
              <span className="material-symbols-outlined text-[20px]">notifications_active</span>
              <span>{t.profile.notifEnableBtn || '브라우저 알림 권한 켜기 / 테스트'}</span>
            </button>

            <h4 className="text-base font-black text-slate-900 mt-2">
              {t.profile.sampleCardTitle || '💌 다정하고 친근한 알림 문구 예시'}
            </h4>

            {/* Morning */}
            <div className="p-4 rounded-3xl bg-white border border-amber-200/90 shadow-2xs flex flex-col gap-1.5">
              <div className="flex items-center gap-2 text-xs font-bold text-amber-800">
                <span>🌅</span>
                <span>{t.profile.sampleMorningTitle || '상쾌한 아침 알림 (07:30)'}</span>
              </div>
              <p className="text-sm text-slate-800 font-medium leading-relaxed break-keep">
                "{t.profile.sampleMorningBody?.replace('{name}', currentName) || `좋은 아침이에요 ${currentName}님! 오늘도 상쾌한 미온수 한 잔과 함께 나를 사랑하는 멋진 하루를 시작해볼까요? 💧✨`}"
              </p>
            </div>

            {/* Afternoon */}
            <div className="p-4 rounded-3xl bg-white border border-emerald-200/90 shadow-2xs flex flex-col gap-1.5">
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-800">
                <span>☀️</span>
                <span>{t.profile.sampleLunchTitle || '활력 충전 점심 알림 (12:30)'}</span>
              </div>
              <p className="text-sm text-slate-800 font-medium leading-relaxed break-keep">
                "{t.profile.sampleLunchBody?.replace('{name}', currentName) || `${currentName}님, 오전 동안 정말 수고 많으셨어요! 가벼운 기지개 스트레칭과 함께 맛있는 점심 식사 챙겨드세요 🥗☀️`}"
              </p>
            </div>

            {/* Evening */}
            <div className="p-4 rounded-3xl bg-white border border-indigo-200/90 shadow-2xs flex flex-col gap-1.5">
              <div className="flex items-center gap-2 text-xs font-bold text-indigo-800">
                <span>🌙</span>
                <span>{t.profile.sampleEveningTitle || '하루 마무리 저녁 알림 (21:30)'}</span>
              </div>
              <p className="text-sm text-slate-800 font-medium leading-relaxed break-keep">
                "{t.profile.sampleEveningBody?.replace('{name}', currentName) || `오늘 하루도 알차게 불꽃을 지킨 ${currentName}님, 정말 자랑스러워요. 오늘을 돌아보고 포근한 밤 맞이하세요 🌙🛌`}"
              </p>
            </div>
          </main>
        </div>
      )}

      {/* ============================================================== */}
      {/* FULL PAGE 3: Customer Support (User Request 3: 풀페이지 형태) */}
      {/* ============================================================== */}
      {isContactPageOpen && (
        <div className="fixed inset-0 z-50 bg-[#f4f7fc] flex flex-col overflow-y-auto select-none animate-fadeIn">
          <header className="sticky top-0 z-20 bg-white/95 backdrop-blur-md border-b border-blue-100/80 px-4 py-3.5 shadow-2xs">
            <div className="max-w-md mx-auto flex items-center justify-between">
              <button
                onClick={() => setIsContactPageOpen(false)}
                className="flex items-center gap-1.5 text-slate-700 hover:text-blue-700 transition font-bold text-sm cursor-pointer"
              >
                <span className="material-symbols-outlined text-[22px]">arrow_back</span>
                <span>{t.common.back}</span>
              </button>
              <h2 className="text-base font-black text-[#0f2e7a]">
                {t.profile.supportContact}
              </h2>
              <div className="w-16"></div>
            </div>
          </header>

          <main className="flex-1 w-full max-w-md mx-auto p-5 flex flex-col gap-4">
            {/* Tabs: 새 문의 작성 vs 내가 남긴 문의 */}
            <div className="flex rounded-2xl bg-slate-200/70 p-1">
              <button
                type="button"
                onClick={() => setContactTab('write')}
                className={`flex-1 py-2.5 text-center rounded-xl text-sm font-bold transition cursor-pointer ${
                  contactTab === 'write' ? 'bg-white text-primary shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {t.profile.tabWriteInquiry || '새 문의 작성하기'}
              </button>
              <button
                type="button"
                onClick={() => setContactTab('list')}
                className={`flex-1 py-2.5 text-center rounded-xl text-sm font-bold transition flex items-center justify-center gap-1 cursor-pointer ${
                  contactTab === 'list' ? 'bg-white text-primary shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span>{t.profile.tabMyInquiries || '내가 남긴 문의'}</span>
                <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 text-xs font-black">
                  {inquiries.length}
                </span>
              </button>
            </div>

            {contactTab === 'write' ? (
              <form onSubmit={handleSubmitContact} className="bg-white rounded-3xl p-5 border border-blue-100/90 shadow-2xs flex flex-col gap-4">
                <div className="p-4 rounded-2xl bg-blue-50/90 border border-blue-200/80 flex flex-col gap-2.5">
                  <div className="flex items-start gap-2.5">
                    <span className="text-lg shrink-0">✉️</span>
                    <p className="text-xs text-blue-950 leading-relaxed break-keep font-medium">
                      {language === 'en'
                        ? 'Have questions or suggestions? We reply within 24 hours via email. Feel free to contact our administration team!'
                        : language === 'ja'
                        ? 'ご意見やお問い合わせは24時間以内にメールにて丁寧にお返事いたします。お気軽にお寄せください！'
                        : '모어해빗에 건의하고 싶은 내용이나 오류는 관리자에게 메일로 편하게 보내주세요. 24시간 내에 친절히 답변드립니다!'}
                    </p>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-blue-200/60 text-xs">
                    <span className="text-slate-600 font-bold">
                      {language === 'en' ? 'Admin Email' : language === 'ja' ? '管理者メール' : '관리자 건의 메일'}
                    </span>
                    <a
                      href="mailto:doalabsofficial@gmail.com"
                      className="font-black text-primary hover:underline flex items-center gap-1 bg-white px-2.5 py-1 rounded-lg border border-blue-200 shadow-2xs"
                    >
                      <span>doalabsofficial@gmail.com</span>
                      <span className="material-symbols-outlined text-[14px]">send</span>
                    </a>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 mb-1 block">
                    {t.profile.emailLabel || '답변받으실 이메일 (Gmail 권장)'} <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="email"
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    placeholder={t.profile.emailPlaceholder || '예: yourname@gmail.com'}
                    required
                    className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:border-blue-600 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 mb-1 block">{t.profile.catLabel || '문의 분류'}</label>
                  <select
                    value={contactCategory}
                    onChange={(e) => setContactCategory(e.target.value)}
                    className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 text-sm font-medium focus:outline-none focus:border-blue-600 focus:bg-white"
                  >
                    <option value="기능 제안">{t.profile.catFeature || '💡 새로운 기능 제안'}</option>
                    <option value="버그 신고">{t.profile.catBug || '🐛 버그 및 오류 신고'}</option>
                    <option value="사용 문의">{t.profile.catUsage || '❓ 사용 방법 및 연동 문의'}</option>
                    <option value="기타">{t.profile.catEtc || '💬 기타 응원 및 의견'}</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 mb-1 block">
                    {t.profile.subjectLabel || '제목'} <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={contactSubject}
                    onChange={(e) => setContactSubject(e.target.value)}
                    placeholder={t.profile.subjectPlaceholder || '문의 제목을 입력하세요'}
                    required
                    className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:border-blue-600 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 mb-1 block">
                    {t.profile.contentLabel || '내용'} <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    rows={5}
                    value={contactBody}
                    onChange={(e) => setContactBody(e.target.value)}
                    placeholder={t.profile.contentPlaceholder || '자세한 오류 상황이나 원하시는 기능을 상세히 적어주시면 빠른 해결에 큰 도움이 됩니다.'}
                    required
                    className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 text-sm resize-none focus:outline-none focus:border-blue-600 focus:bg-white"
                  />
                </div>

                <div className="flex gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsContactPageOpen(false)}
                    className="flex-1 py-3.5 rounded-2xl text-sm font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition cursor-pointer"
                  >
                    {t.common.cancel}
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-3.5 rounded-2xl bg-primary text-white text-sm font-bold hover:bg-blue-700 transition cursor-pointer shadow-xs"
                  >
                    {t.profile.submitInquiryBtn || '운영자에게 문의 접수하기'}
                  </button>
                </div>
              </form>
            ) : (
              <div className="flex flex-col gap-3">
                {inquiries.length === 0 ? (
                  <div className="p-8 text-center bg-white rounded-3xl border border-blue-100 shadow-2xs">
                    <span className="text-xl mb-2 block">📭</span>
                    <p className="text-sm font-bold text-slate-900">{t.profile.emptyInquiries || '남기신 문의 내역이 없습니다'}</p>
                    <p className="text-xs text-slate-500 mt-1">
                      {t.profile.emptyInquiriesSub || '궁금한 점이나 불편한 점이 있다면 언제든 문의를 남겨주세요.'}
                    </p>
                    <button
                      type="button"
                      onClick={() => setContactTab('write')}
                      className="mt-4 px-5 py-2.5 rounded-xl bg-primary text-white text-xs font-bold hover:bg-blue-700 transition"
                    >
                      {t.profile.goToWriteBtn || '새 문의 작성하러 가기'}
                    </button>
                  </div>
                ) : (
                  inquiries.map((inq) => (
                    <div
                      key={inq.id}
                      className="p-4 rounded-3xl bg-white border border-blue-100/90 shadow-2xs flex flex-col gap-2 relative"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-primary text-xs font-extrabold">
                            {inq.category}
                          </span>
                          <span className="text-xs text-slate-400">
                            {new Date(inq.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <button
                          onClick={() => handleDeleteInquiry(inq.id)}
                          className="text-slate-400 hover:text-rose-600 p-1.5 transition cursor-pointer"
                          title={t.common.delete || '문의 내역 삭제'}
                        >
                          <span className="material-symbols-outlined text-[19px]">delete</span>
                        </button>
                      </div>

                      <h4 className="text-sm font-black text-slate-900 leading-snug">
                        {inq.subject}
                      </h4>
                      <p className="text-xs text-slate-600 whitespace-pre-wrap leading-relaxed">
                        {inq.body}
                      </p>

                      <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                        <span>{t.profile.replyEmailLabel?.replace('{email}', inq.userEmail) || `회신 메일: ${inq.userEmail}`}</span>
                        <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 font-bold">
                          {t.profile.statusReviewing || '운영자 검토 중 ⏳'}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </main>
        </div>
      )}

      {/* ============================================================== */}
      {/* FULL PAGE 4: Language Selection (User Request 3: 풀페이지 형태) */}
      {/* ============================================================== */}
      {isLanguagePageOpen && (
        <div className="fixed inset-0 z-50 bg-[#f4f7fc] flex flex-col overflow-y-auto select-none animate-fadeIn">
          <header className="sticky top-0 z-20 bg-white/95 backdrop-blur-md border-b border-blue-100/80 px-4 py-3.5 shadow-2xs">
            <div className="max-w-md mx-auto flex items-center justify-between">
              <button
                onClick={() => setIsLanguagePageOpen(false)}
                className="flex items-center gap-1.5 text-slate-700 hover:text-blue-700 transition font-bold text-sm cursor-pointer"
              >
                <span className="material-symbols-outlined text-[22px]">arrow_back</span>
                <span>{t.common.back}</span>
              </button>
              <h2 className="text-base font-black text-[#0f2e7a]">
                {t.profile.language}
              </h2>
              <div className="w-16"></div>
            </div>
          </header>

          <main className="flex-1 w-full max-w-md mx-auto p-5 flex flex-col gap-3">
            {SUPPORTED_LANGUAGES.map((lang) => (
              <button
                key={lang.code}
                onClick={() => {
                  setLanguage(lang.code);
                  setIsLanguagePageOpen(false);
                  showToast(`${lang.label} - ${t.profile.toastLanguageSet}`);
                }}
                className={`w-full p-4 rounded-3xl border flex items-center justify-between text-left transition-all cursor-pointer ${
                  language === lang.code
                    ? 'border-primary bg-blue-50/80 text-primary font-bold shadow-xs'
                    : 'border-slate-200 bg-white text-slate-900 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-4">
                  <span className="text-xl">{lang.flag}</span>
                  <span className="text-base font-extrabold">{lang.label}</span>
                </div>
                {language === lang.code && (
                  <span className="material-symbols-outlined text-[24px] text-primary">check_circle</span>
                )}
              </button>
            ))}
          </main>
        </div>
      )}

      {/* ============================================================== */}
      {/* FULL PAGE 5: App Review (User Request 3: 풀페이지 형태) */}
      {/* ============================================================== */}
      {isReviewPageOpen && (
        <div className="fixed inset-0 z-50 bg-[#f4f7fc] flex flex-col overflow-y-auto select-none animate-fadeIn">
          <header className="sticky top-0 z-20 bg-white/95 backdrop-blur-md border-b border-blue-100/80 px-4 py-3.5 shadow-2xs">
            <div className="max-w-md mx-auto flex items-center justify-between">
              <button
                onClick={() => setIsReviewPageOpen(false)}
                className="flex items-center gap-1.5 text-slate-700 hover:text-blue-700 transition font-bold text-sm cursor-pointer"
              >
                <span className="material-symbols-outlined text-[22px]">arrow_back</span>
                <span>{t.common.back}</span>
              </button>
              <h2 className="text-base font-black text-[#0f2e7a]">
                {t.profile.rateApp}
              </h2>
              <div className="w-16"></div>
            </div>
          </header>

          <main className="flex-1 w-full max-w-md mx-auto p-5 flex flex-col gap-4">
            <form onSubmit={handleSubmitReview} className="bg-white rounded-3xl p-6 border border-blue-100/90 shadow-2xs flex flex-col gap-5 text-center">
              <p className="text-sm text-slate-600 break-keep font-medium">
                {t.profile.reviewPrompt || '모어해빗 사용 경험은 어떠셨나요? 별점을 선택해 주세요!'}
              </p>
              <div className="flex justify-center gap-3">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    className="text-xl text-amber-400 hover:scale-110 transition cursor-pointer"
                  >
                    {star <= rating ? '★' : '☆'}
                  </button>
                ))}
              </div>
              <textarea
                rows={4}
                value={reviewText}
                onChange={(e) => setReviewText(e.target.value)}
                placeholder={t.profile.reviewPlaceholder || '응원의 한마디나 바라는 점을 남겨주세요!'}
                className="w-full p-3.5 rounded-2xl border border-slate-200 bg-slate-50 text-sm resize-none focus:outline-none focus:border-blue-600 focus:bg-white"
              />
              <div className="flex gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsReviewPageOpen(false)}
                  className="flex-1 py-3.5 rounded-2xl text-sm font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition cursor-pointer"
                >
                  {t.common.cancel}
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3.5 rounded-2xl bg-primary text-white text-sm font-bold hover:bg-blue-700 transition cursor-pointer shadow-xs"
                >
                  {t.profile.submitReviewBtn || '등록하기'}
                </button>
              </div>
            </form>
          </main>
        </div>
      )}

      {/* ============================================================== */}
      {/* FULL PAGE 6: Terms of Service (User Request 3: 풀페이지 형태) */}
      {/* ============================================================== */}
      {isTermsPageOpen && (
        <div className="fixed inset-0 z-50 bg-[#f4f7fc] flex flex-col overflow-y-auto select-none animate-fadeIn">
          <header className="sticky top-0 z-20 bg-white/95 backdrop-blur-md border-b border-blue-100/80 px-4 py-3.5 shadow-2xs">
            <div className="max-w-md mx-auto flex items-center justify-between">
              <button
                onClick={() => setIsTermsPageOpen(false)}
                className="flex items-center gap-1.5 text-slate-700 hover:text-blue-700 transition font-bold text-sm cursor-pointer"
              >
                <span className="material-symbols-outlined text-[22px]">arrow_back</span>
                <span>{t.common.back}</span>
              </button>
              <h2 className="text-base font-black text-[#0f2e7a]">
                {t.profile.termsOfService}
              </h2>
              <div className="w-16"></div>
            </div>
          </header>

          <main className="flex-1 w-full max-w-md mx-auto p-5">
            <div className="bg-white rounded-3xl p-6 border border-blue-100/90 shadow-2xs flex flex-col gap-4 text-sm text-slate-700 leading-relaxed">
              <h3 className="font-extrabold text-base text-slate-900">{t.profile.termsArticle1Title || '제1조 (목적)'}</h3>
              <p>
                {t.profile.termsArticle1Desc || '본 약관은 모어해빗(MoreHabit) 서비스의 이용조건 및 절차, 이용자와 서비스 제공자의 권리, 의무 및 책임사항을 규정함을 목적으로 합니다.'}
              </p>
              <h3 className="font-extrabold text-base text-slate-900 mt-2">{t.profile.termsArticle2Title || '제2조 (이용자의 권리와 의무)'}</h3>
              <p>
                {t.profile.termsArticle2Desc || '이용자는 본인의 습관 관리 및 성장을 목적으로 서비스를 자유롭게 이용할 수 있으며, 타인의 권리를 침해하거나 서비스 운영을 방해하지 않아야 합니다.'}
              </p>
              <h3 className="font-extrabold text-base text-slate-900 mt-2">{t.profile.termsArticle3Title || '제3조 (데이터의 보관)'}</h3>
              <p>
                {t.profile.termsArticle3Desc || '모어해빗은 이용자의 소중한 습관 및 일상 기록을 안전하게 보호하며, 브라우저 로컬 스토리지를 활용하여 안전하고 빠른 데이터 접근을 지원합니다.'}
              </p>
            </div>
          </main>
        </div>
      )}

      {/* ============================================================== */}
      {/* FULL PAGE 7: Privacy Policy (User Request 3: 풀페이지 형태) */}
      {/* ============================================================== */}
      {isPrivacyPageOpen && (
        <div className="fixed inset-0 z-50 bg-[#f4f7fc] flex flex-col overflow-y-auto select-none animate-fadeIn">
          <header className="sticky top-0 z-20 bg-white/95 backdrop-blur-md border-b border-blue-100/80 px-4 py-3.5 shadow-2xs">
            <div className="max-w-md mx-auto flex items-center justify-between">
              <button
                onClick={() => setIsPrivacyPageOpen(false)}
                className="flex items-center gap-1.5 text-slate-700 hover:text-blue-700 transition font-bold text-sm cursor-pointer"
              >
                <span className="material-symbols-outlined text-[22px]">arrow_back</span>
                <span>{t.common.back}</span>
              </button>
              <h2 className="text-base font-black text-[#0f2e7a]">
                {t.profile.privacyPolicy}
              </h2>
              <div className="w-16"></div>
            </div>
          </header>

          <main className="flex-1 w-full max-w-md mx-auto p-5">
            <div className="bg-white rounded-3xl p-6 border border-blue-100/90 shadow-2xs flex flex-col gap-4 text-sm text-slate-700 leading-relaxed">
              <h3 className="font-extrabold text-base text-slate-900">{t.profile.privacyItem1Title || '1. 개인정보의 수집 항목'}</h3>
              <p>{t.profile.privacyItem1Desc || '모어해빗은 서비스 이용을 위해 닉네임, 습관 목록, 달성 로그 등을 사용자 브라우저 내에 저장합니다.'}</p>
              <h3 className="font-extrabold text-base text-slate-900 mt-2">{t.profile.privacyItem2Title || '2. 개인정보의 보유 및 이용 기간'}</h3>
              <p>{t.profile.privacyItem2Desc || '사용자가 데이터를 삭제하거나 초기화하기 전까지 사용자 기기에 안전하게 보관됩니다.'}</p>
              <h3 className="font-extrabold text-base text-slate-900 mt-2">{t.profile.privacyItem3Title || '3. 제3자 제공 금지'}</h3>
              <p>{t.profile.privacyItem3Desc || '모어해빗은 사용자의 어떠한 개인 데이터도 외부 서버나 제3자에게 무단 제공하거나 판매하지 않습니다.'}</p>
            </div>
          </main>
        </div>
      )}
    </div>
  );
};
