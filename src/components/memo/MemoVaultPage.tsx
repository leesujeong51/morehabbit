import React, { useState } from 'react';
import type { IdeaMemo } from '../../types/routine';
import { getStoredMemos, saveStoredMemos } from '../../utils/memoStorage';
import { ConfirmModal } from '../common/ConfirmModal';
import { MobitCharacter } from '../character/MobitCharacter';
import { useLanguage } from '../../utils/i18n';

interface MemoVaultPageProps {
  onBack: () => void;
}

export const MemoVaultPage: React.FC<MemoVaultPageProps> = ({ onBack }) => {
  const { language, t } = useLanguage();
  const [memos, setMemos] = useState<IdeaMemo[]>(() => getStoredMemos());
  const [filterType, setFilterType] = useState<'all' | 'idea' | 'todo' | 'memo'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Editing / Creating State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingMemo, setEditingMemo] = useState<IdeaMemo | null>(null);
  const [formTitle, setFormTitle] = useState('');
  const [formContent, setFormContent] = useState('');
  const [formType, setFormType] = useState<'idea' | 'todo' | 'memo'>('idea');

  // Toast feedback
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2800);
  };

  const persistMemos = (newMemos: IdeaMemo[]) => {
    setMemos(newMemos);
    saveStoredMemos(newMemos);
  };

  const handleOpenCreate = () => {
    setEditingMemo(null);
    setFormTitle('');
    setFormContent('');
    setFormType('idea');
    setIsFormOpen(true);
  };

  const handleOpenEdit = (memo: IdeaMemo) => {
    setEditingMemo(memo);
    setFormTitle(memo.title);
    setFormContent(memo.content);
    setFormType(memo.type);
    setIsFormOpen(true);
  };

  const handleSaveForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim() && !formContent.trim()) {
      showToast(language === 'en' ? 'Please enter a title or content.' : language === 'ja' ? 'タイトルまたは内容を入力してください。' : '제목이나 내용을 입력해 주세요.');
      return;
    }

    if (editingMemo) {
      const updated = memos.map((m) =>
        m.id === editingMemo.id
          ? {
              ...m,
              title: formTitle.trim() || (language === 'en' ? 'Untitled Note' : language === 'ja' ? '無題のメモ' : '제목 없는 메모'),
              content: formContent.trim(),
              type: formType,
              updatedAt: new Date().toISOString(),
            }
          : m
      );
      persistMemos(updated);
      showToast(language === 'en' ? 'Note updated ✨' : language === 'ja' ? 'メモを更新しました ✨' : '메모가 수정되었습니다 ✨');
    } else {
      const newMemo: IdeaMemo = {
        id: `memo-${Date.now()}`,
        title: formTitle.trim() || (language === 'en' ? 'New Idea' : language === 'ja' ? '新しいアイデア' : '새로운 아이디어'),
        content: formContent.trim(),
        type: formType,
        completed: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      persistMemos([newMemo, ...memos]);
      showToast(language === 'en' ? 'Saved to Idea Vault! 💡' : language === 'ja' ? 'アイデア保管庫に保存しました！💡' : '새 메모가 아이디어 창고에 저장되었습니다! 💡');
    }

    setIsFormOpen(false);
  };

  const [memoToDeleteId, setMemoToDeleteId] = useState<string | null>(null);

  const handleDeleteMemo = (id: string) => {
    setMemoToDeleteId(id);
  };

  const handleToggleTodo = (id: string) => {
    const updated = memos.map((m) =>
      m.id === id ? { ...m, completed: !m.completed, updatedAt: new Date().toISOString() } : m
    );
    persistMemos(updated);
  };

  // 1. One-click Copy (수월한 복사 기능)
  const handleCopyMemo = (memo: IdeaMemo) => {
    const textToCopy = `[${memo.title}]\n\n${memo.content}\n\n- MoreHabit`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(textToCopy);
      showToast(language === 'en' ? 'Copied to clipboard! 📋' : language === 'ja' ? 'クリップボードにコピーしました！📋' : '메모가 클립보드에 복사되었습니다! 📋');
    } else {
      const textarea = document.createElement('textarea');
      textarea.value = textToCopy;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      showToast(language === 'en' ? 'Copied to clipboard! 📋' : language === 'ja' ? 'クリップボードにコピーしました！📋' : '메모가 클립보드에 복사되었습니다! 📋');
    }
  };

  // 2. Export to KakaoTalk (카카오톡 내보내기 / 공유)
  const handleExportKakao = (memo: IdeaMemo) => {
    const shareText = `[MoreHabit] ${memo.title}\n\n${memo.content}`;
    if (navigator.share) {
      navigator
        .share({
          title: memo.title,
          text: shareText,
        })
        .catch(() => {});
    } else {
      // Fallback: Copy to clipboard and instruct user
      if (navigator.clipboard) {
        navigator.clipboard.writeText(shareText);
      }
      showToast(language === 'en' ? 'Copied to clipboard! 💬' : language === 'ja' ? 'クリップボードにコピーしました！💬' : '카카오톡 채팅방에 바로 붙여넣을 수 있게 복사되었습니다! 💬');
    }
  };

  // 3. Export to Email (메일 내보내기)
  const handleExportEmail = (memo: IdeaMemo) => {
    const subject = encodeURIComponent(`[MoreHabit] ${memo.title}`);
    const body = encodeURIComponent(
      `-----------------------------\n${memo.title}\n-----------------------------\n${memo.content}\n\n${new Date(memo.createdAt).toLocaleString(language === 'en' ? 'en-US' : language === 'ja' ? 'ja-JP' : 'ko-KR')}`
    );
    window.open(`mailto:?subject=${subject}&body=${body}`, '_blank');
  };

  // 4. PDF Export / Print (PDF 출력 가능)
  const handleExportPdf = (memo: IdeaMemo) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      showToast(language === 'en' ? 'Please allow pop-ups.' : language === 'ja' ? 'ポップアップブロックを解除してください。' : '팝업 차단을 해제해 주세요.');
      return;
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>${memo.title} - 모어해빗 메모 출력</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 40px; color: #1e293b; line-height: 1.6; }
            .header { border-bottom: 2px solid #2563eb; padding-bottom: 12px; margin-bottom: 24px; }
            .badge { display: inline-block; padding: 4px 10px; background: #eff6ff; color: #1d4ed8; border-radius: 999px; font-size: 12px; font-weight: bold; margin-bottom: 8px; }
            h1 { margin: 0; font-size: 22px; color: #0f172a; }
            .date { color: #64748b; font-size: 12px; margin-top: 6px; }
            .content { white-space: pre-wrap; font-size: 14.5px; margin-top: 20px; line-height: 1.8; }
            .footer { margin-top: 50px; padding-top: 15px; border-top: 1px solid #e2e8f0; font-size: 11px; color: #94a3b8; text-align: right; }
            @media print {
              body { padding: 20px; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <span class="badge">${memo.type === 'idea' ? '💡 아이디어' : memo.type === 'todo' ? '✅ 할 일' : '📝 메모'}</span>
            <h1>${memo.title}</h1>
            <div class="date">작성일: ${new Date(memo.createdAt).toLocaleString('ko-KR')}</div>
          </div>
          <div class="content">${memo.content.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</div>
          <div class="footer">모어해빗(MoreHabit) · 작은 습관이 만드는 기적</div>
          <script>
            window.onload = function() {
              window.print();
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  // Filter & Search
  const filteredMemos = memos.filter((m) => {
    const matchesFilter = filterType === 'all' || m.type === filterType;
    const matchesQuery =
      searchQuery === '' ||
      m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.content.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesQuery;
  });

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-20 select-none">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-full bg-slate-900/95 text-white text-xs font-semibold shadow-xl backdrop-blur-md flex items-center gap-2 animate-bounce">
          <span>✨</span>
          <span className="break-keep">{toastMessage}</span>
        </div>
      )}

      {/* Top Sticky Page Header (No cramped popups - pure full-page experience!) */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-lg border-b border-slate-200/80 px-4 py-3.5 shadow-2xs">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 text-slate-600 hover:text-slate-900 font-bold text-sm cursor-pointer"
          >
            <span className="material-symbols-outlined text-[20px]">arrow_back</span>
            <span>{t.common.back}</span>
          </button>

          <h1 className="text-base font-extrabold text-slate-900 flex items-center gap-1.5">
            <span>💡</span>
            <span>{t.profile.memoVault}</span>
          </h1>

          <button
            onClick={handleOpenCreate}
            className="px-3.5 py-1.5 rounded-full bg-primary hover:bg-blue-700 text-white font-black text-xs shadow-xs active:scale-95 transition cursor-pointer"
          >
            + {language === 'en' ? 'New Note' : language === 'ja' ? '新規メモ' : '새 메모'}
          </button>
        </div>
      </header>

      {/* Page Content Body */}
      <main className="max-w-md mx-auto px-4 pt-4 flex flex-col gap-4">
        {/* Intro Banner */}
        <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 text-white p-4 rounded-2xl shadow-md flex items-center justify-between">
          <div>
            <h2 className="text-base font-black leading-tight">
              {language === 'en' ? 'My Ideas & To-Dos Vault' : language === 'ja' ? '思考＆やること保管庫' : '나만의 생각 & 할 일 보관함'}
            </h2>
            <p className="text-xs text-blue-100 mt-1 leading-snug break-keep">
              {language === 'en'
                ? 'Capture inspirations and export via Kakao, Email, and PDF ✨'
                : language === 'ja'
                ? 'ひらめきやタスクを記録し、カカオやメール、PDFで簡単に出力 ✨'
                : '떠오른 영감과 할 일을 적어두고 카톡, 메일, PDF로 손쉽게 내보내세요 ✨'}
            </p>
          </div>
          <span className="text-xl select-none">🗃️</span>
        </div>

        {/* Filter Category Chips */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5">
          {[
            { id: 'all', label: language === 'en' ? 'All' : language === 'ja' ? 'すべて' : '전체 보기', count: memos.length },
            { id: 'idea', label: `💡 ${t.today.todoIdeas}`, count: memos.filter((m) => m.type === 'idea').length },
            { id: 'todo', label: `✅ ${t.today.todoTasks}`, count: memos.filter((m) => m.type === 'todo').length },
            { id: 'memo', label: `📝 ${t.today.todoMemos}`, count: memos.filter((m) => m.type === 'memo').length },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setFilterType(item.id as any)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold shrink-0 transition cursor-pointer ${
                filterType === item.id
                  ? 'bg-slate-900 text-white shadow-xs font-black'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              {item.label} ({item.count})
            </button>
          ))}
        </div>

        {/* Search Bar */}
        <div className="relative w-full">
          <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-[18px] text-slate-400">
            search
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={language === 'en' ? 'Search note title or content...' : language === 'ja' ? 'メモのタイトルまたは内容を検索...' : '메모 제목 또는 내용 검색...'}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white border border-slate-200 text-xs font-medium placeholder:text-slate-400 focus:outline-none focus:border-primary shadow-2xs"
          />
        </div>

        {/* Memo Cards Feed */}
        {filteredMemos.length > 0 ? (
          <div className="flex flex-col gap-3.5">
            {filteredMemos.map((memo) => {
              const isTodo = memo.type === 'todo';
              return (
                <article
                  key={memo.id}
                  className={`bg-white rounded-2xl p-4.5 border transition-all shadow-2xs flex flex-col gap-3 ${
                    isTodo && memo.completed
                      ? 'border-slate-200 bg-slate-50/70 opacity-80'
                      : 'border-slate-200/90 hover:border-blue-200 hover:shadow-xs'
                  }`}
                >
                  {/* Card Header: Type Badge & Action Controls */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-xs font-black px-2.5 py-0.5 rounded-full ${
                          memo.type === 'idea'
                            ? 'bg-amber-100 text-amber-800'
                            : memo.type === 'todo'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {memo.type === 'idea' ? `💡 ${t.today.todoIdeas}` : memo.type === 'todo' ? `✅ ${t.today.todoTasks}` : `📝 ${t.today.todoMemos}`}
                      </span>
                      <span className="text-xs text-slate-400 font-medium">
                        {new Date(memo.createdAt).toLocaleDateString(language === 'en' ? 'en-US' : language === 'ja' ? 'ja-JP' : 'ko-KR', {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleOpenEdit(memo)}
                        className="p-1 rounded-md text-slate-400 hover:text-primary hover:bg-slate-100 transition cursor-pointer"
                        title={t.common.edit}
                      >
                        <span className="material-symbols-outlined text-[16px]">edit</span>
                      </button>
                      <button
                        onClick={() => handleDeleteMemo(memo.id)}
                        className="p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                        title={t.common.delete}
                      >
                        <span className="material-symbols-outlined text-[16px]">delete</span>
                      </button>
                    </div>
                  </div>

                  {/* Title & Checkbox for Todo */}
                  <div className="flex items-start gap-2.5">
                    {isTodo && (
                      <button
                        onClick={() => handleToggleTodo(memo.id)}
                        className={`w-6 h-6 mt-0.5 rounded-lg flex items-center justify-center transition shrink-0 cursor-pointer ${
                          memo.completed
                            ? 'bg-primary text-white shadow-xs'
                            : 'border-2 border-slate-300 bg-white hover:border-primary'
                        }`}
                        title={memo.completed ? (language === 'en' ? 'Undo Complete' : language === 'ja' ? '完了取消' : '완료 취소') : (language === 'en' ? 'Complete Task' : language === 'ja' ? 'タスク完了' : '할 일 완료')}
                      >
                        {memo.completed && (
                          <span className="material-symbols-outlined text-[16px] font-black">check</span>
                        )}
                      </button>
                    )}

                    <h3
                      className={`text-base font-bold text-slate-900 leading-snug break-keep ${
                        isTodo && memo.completed ? 'line-through text-slate-400' : ''
                      }`}
                    >
                      {memo.title}
                    </h3>
                  </div>

                  {/* Content Preview */}
                  {memo.content && (
                    <p
                      className={`text-xs text-slate-600 whitespace-pre-wrap leading-relaxed break-keep pl-0.5 ${
                        isTodo && memo.completed ? 'text-slate-400 line-through' : ''
                      }`}
                    >
                      {memo.content}
                    </p>
                  )}

                  {/* 4 Multi-Export Toolbar (카카오톡, 메일, 복사, PDF) */}
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-1 flex-wrap">
                    <button
                      onClick={() => handleCopyMemo(memo)}
                      className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center gap-1 transition cursor-pointer active:scale-95"
                      title={language === 'en' ? 'Copy to clipboard' : language === 'ja' ? 'クリップボードにコピー' : '클립보드에 원클릭 복사'}
                    >
                      <span className="material-symbols-outlined text-[14px]">content_copy</span>
                      <span>{t.today.menuCopy}</span>
                    </button>

                    <button
                      onClick={() => handleExportKakao(memo)}
                      className="px-2.5 py-1.5 rounded-lg bg-[#FEE500]/80 hover:bg-[#FEE500] text-[#191919] font-black text-xs flex items-center gap-1 transition cursor-pointer active:scale-95 shadow-2xs"
                      title={language === 'en' ? 'Share to Kakao' : language === 'ja' ? 'カカオで共有' : '카카오톡으로 공유 / 내보내기'}
                    >
                      <span>💬</span>
                      <span>{t.today.menuKakao}</span>
                    </button>

                    <button
                      onClick={() => handleExportEmail(memo)}
                      className="px-2.5 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-primary font-bold text-xs flex items-center gap-1 transition cursor-pointer active:scale-95"
                      title={language === 'en' ? 'Send via Email' : language === 'ja' ? 'メールで送信' : '이메일로 작성 및 전송'}
                    >
                      <span className="material-symbols-outlined text-[14px]">mail</span>
                      <span>{t.today.menuEmail}</span>
                    </button>

                    <button
                      onClick={() => handleExportPdf(memo)}
                      className="px-2.5 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs flex items-center gap-1 transition cursor-pointer active:scale-95"
                      title={language === 'en' ? 'Print or save PDF' : language === 'ja' ? 'PDF保存/印刷' : 'PDF로 저장 및 인쇄'}
                    >
                      <span className="material-symbols-outlined text-[14px]">picture_as_pdf</span>
                      <span>{language === 'en' ? 'PDF Print' : language === 'ja' ? 'PDF出力' : 'PDF 출력'}</span>
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="bg-white rounded-3xl p-8 border border-slate-200/80 text-center flex flex-col items-center gap-2.5">
            <div className="w-18 h-18 bg-blue-50/80 rounded-2xl flex items-center justify-center mb-1">
              <MobitCharacter mood="memo" className="w-16 h-16" />
            </div>
            <h3 className="text-base font-black text-slate-800">
              {language === 'en' ? 'No stored notes yet' : language === 'ja' ? '保管されたメモがありません' : '보관된 메모가 없습니다'}
            </h3>
            <p className="text-xs text-slate-500 max-w-xs break-keep leading-relaxed mb-2">
              {language === 'en' ? 'Record new ideas or tasks you want to tackle today freely 💡' : language === 'ja' ? '新しいアイデアや今日やるべきことを自由に記録してみてください 💡' : '새로운 아이디어나 오늘 꼭 해야 할 일 목록을 자유롭게 기록해 보세요 💡'}
            </p>
            <button
              onClick={handleOpenCreate}
              className="px-5 py-2.5 rounded-xl bg-primary hover:bg-blue-700 text-white font-black text-sm shadow-xs cursor-pointer active:scale-95 transition"
            >
              + {language === 'en' ? 'Write First Note' : language === 'ja' ? '最初のメモを作成' : '첫 메모 작성하기'}
            </button>
          </div>
        )}
      </main>

      {/* Full-Page Edit / Create Form View */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 bg-white flex flex-col animate-slideUp overflow-y-auto">
          {/* Form Header */}
          <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-md border-b border-slate-200 px-4 py-3.5 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setIsFormOpen(false)}
              className="text-slate-500 hover:text-slate-800 font-bold text-sm cursor-pointer"
            >
              {t.common.cancel}
            </button>
            <h2 className="text-base font-black text-slate-900">
              {editingMemo ? (language === 'en' ? 'Edit Note' : language === 'ja' ? 'メモを編集' : '메모 수정하기') : (language === 'en' ? 'New Note' : language === 'ja' ? '新しいメモ' : '새 메모 작성')}
            </h2>
            <button
              type="button"
              onClick={handleSaveForm}
              className="px-4 py-1.5 rounded-full bg-primary hover:bg-blue-700 text-white font-black text-xs shadow-xs cursor-pointer"
            >
              {t.common.save}
            </button>
          </div>

          {/* Form Fields Container */}
          <form onSubmit={handleSaveForm} className="max-w-md mx-auto w-full p-4 flex flex-col gap-4">
            {/* Category Selector */}
            <div>
              <label className="text-xs font-bold text-slate-500 block mb-1.5">
                {language === 'en' ? 'Category' : language === 'ja' ? '分類' : '메모 분류'}
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'idea', label: `💡 ${t.today.todoIdeas}` },
                  { id: 'todo', label: `✅ ${t.today.todoTasks}` },
                  { id: 'memo', label: `📝 ${t.today.todoMemos}` },
                ].map((type) => (
                  <button
                    key={type.id}
                    type="button"
                    onClick={() => setFormType(type.id as any)}
                    className={`py-2 rounded-xl text-xs font-bold border transition cursor-pointer ${
                      formType === type.id
                        ? 'bg-blue-50 border-primary text-primary font-black shadow-2xs'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {type.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Title */}
            <div>
              <label className="text-xs font-bold text-slate-500 block mb-1.5">
                {language === 'en' ? 'Title' : language === 'ja' ? 'タイトル' : '제목'}
              </label>
              <input
                type="text"
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                placeholder={language === 'en' ? 'Enter title (e.g. Travel plan, New idea)' : language === 'ja' ? 'タイトルを入力（例：旅行の計画、新アイデア）' : '제목을 입력하세요 (예: 5월 여행 계획, 신규 아이디어)'}
                className="w-full px-3.5 py-3 rounded-xl border border-slate-200 bg-slate-50/50 text-sm font-bold focus:bg-white focus:outline-none focus:border-primary focus:ring-2 focus:ring-blue-100 transition"
              />
            </div>

            {/* Content Textarea */}
            <div className="flex-1 flex flex-col">
              <label className="text-xs font-bold text-slate-500 block mb-1.5">
                {language === 'en' ? 'Details' : language === 'ja' ? '詳細内容' : '상세 내용'}
              </label>
              <textarea
                rows={12}
                value={formContent}
                onChange={(e) => setFormContent(e.target.value)}
                placeholder={language === 'en' ? 'Write down ideas or tasks freely...' : language === 'ja' ? 'アイデアややることの項目を自由に記入してください...' : '자유롭게 아이디어를 적거나 해야 할 일 항목을 번호 매겨 적어보세요...'}
                className="w-full p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 text-sm leading-relaxed focus:bg-white focus:outline-none focus:border-primary focus:ring-2 focus:ring-blue-100 resize-none transition"
              />
            </div>
          </form>
        </div>
      )}

      {/* Safe Delete Confirm Dialog */}
      <ConfirmModal
        isOpen={memoToDeleteId !== null}
        title={t.confirm?.deleteMemoTitle || (language === 'en' ? 'Delete this note?' : language === 'ja' ? 'メモを削除しますか？' : '메모를 삭제할까요?')}
        message={t.confirm?.deleteMemoMessage || (language === 'en' ? 'The selected note will be deleted.' : language === 'ja' ? '選択したメモが削除されます。' : '선택한 메모가 아이디어 창고에서 삭제됩니다.')}
        confirmLabel={t.common.delete}
        cancelLabel={t.common.cancel}
        onCancel={() => setMemoToDeleteId(null)}
        onConfirm={() => {
          if (memoToDeleteId) {
            const updated = memos.filter((m) => m.id !== memoToDeleteId);
            persistMemos(updated);
            setMemoToDeleteId(null);
            showToast(language === 'en' ? 'Note deleted' : language === 'ja' ? 'メモを削除しました' : '메모가 삭제되었습니다.');
          }
        }}
      />
    </div>
  );
};
