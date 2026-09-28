import React, { useState, useMemo } from 'react';
import type { Routine, RoutineTemplate, Category } from '../../types/routine';

interface ExploreViewProps {
  userRoutines: Routine[];
  categories: Category[];
  onAddRoutine: (routineData: Omit<Routine, 'id' | 'createdAt' | 'order'>) => void;
  onOpenAddModal: () => void;
}

// Preset Curated Routine Templates
const CURATED_TEMPLATES: RoutineTemplate[] = [
  {
    id: 'tmpl-stretch',
    title: '하루 10분 바른 자세 스트레칭',
    desc: '목, 어깨 뭉친 근육을 부드럽게 이완하는 힐링 스트레칭',
    category: '건강 습관',
    categoryId: 'cat-health',
    emoji: '🧘',
    timeOfDay: 'morning',
    durationMinutes: 10,
    xp: 50,
    tag: '10분',
    practitionerCount: 8420,
  },
  {
    id: 'tmpl-planning',
    title: '핵심 업무 3가지 선정 및 데일리 플래닝',
    desc: '오늘 하루 가장 중요한 일 3가지를 명확히 정의하고 집중하기',
    category: '자기계발',
    categoryId: 'cat-growth',
    emoji: '📝',
    timeOfDay: 'morning',
    durationMinutes: 15,
    xp: 60,
    tag: '15분',
    practitionerCount: 12190,
  },
  {
    id: 'tmpl-screen-free',
    title: '취침 전 스마트폰 멀리하기 & 감사 일기',
    desc: '수면의 질을 높이고 오늘 하루 감사했던 3가지 기록하기',
    category: '취침 웰니스',
    categoryId: 'cat-mind',
    emoji: '🌙',
    timeOfDay: 'night',
    durationMinutes: 10,
    xp: 40,
    tag: '10분',
    practitionerCount: 6750,
  },
  {
    id: 'tmpl-water-2l',
    title: '매일 500ml 텀블러 4번 비우기 (2L 수분 충전)',
    desc: '맑은 정신과 신체 순환을 돕는 필수 수분 섭취 루틴',
    category: '건강 습관',
    categoryId: 'cat-health',
    emoji: '💧',
    timeOfDay: 'anytime',
    durationMinutes: 5,
    xp: 50,
    tag: '500ml',
    practitionerCount: 19800,
  },
  {
    id: 'tmpl-reading',
    title: '아침 독서 15분 & 생각 노트 기록',
    desc: '하루의 시작을 깊이 있는 지적 자극과 인사이트로 열기',
    category: '자기계발',
    categoryId: 'cat-growth',
    emoji: '📖',
    timeOfDay: 'morning',
    durationMinutes: 15,
    xp: 50,
    tag: '15분',
    practitionerCount: 14500,
  },
  {
    id: 'tmpl-walk',
    title: '점심 식후 햇살 받으며 15분 산책',
    desc: '식곤증을 날리고 세로토닌을 충전하는 리프레시 걷기',
    category: '건강 습관',
    categoryId: 'cat-health',
    emoji: '👟',
    timeOfDay: 'afternoon',
    durationMinutes: 15,
    xp: 45,
    tag: '15분',
    practitionerCount: 7890,
  },
];

// Featured Starter Pack
const FEATURED_PACK = {
  id: 'pack-miracle-morning',
  title: '갓생러를 위한 미라클 모닝 스타터 팩',
  badge: '30일 챌린지',
  desc: '기상 직후 1시간을 나를 위한 온전한 몰입으로 채우는 3단계 모닝 패키지',
  totalDuration: '30분',
  totalXp: 120,
  routines: [
    {
      title: '기상 직후 미온수 한 잔 (500ml)',
      emoji: '💧',
      duration: '5분',
      timeOfDay: 'morning' as const,
      categoryId: 'cat-health',
      xp: 40,
      tag: '500ml',
    },
    {
      title: '5분 가벼운 전신 스트레칭',
      emoji: '🧘',
      duration: '10분',
      timeOfDay: 'morning' as const,
      categoryId: 'cat-health',
      xp: 40,
      tag: '10분',
    },
    {
      title: '긍정 확언 & 모닝 저널 3문장 작성',
      emoji: '📖',
      duration: '15분',
      timeOfDay: 'morning' as const,
      categoryId: 'cat-mind',
      xp: 40,
      tag: '15분',
    },
  ],
};

const CATEGORY_ITEMS = [
  { id: 'all', label: '전체 추천', emoji: '⭐' },
  { id: 'morning', label: '미라클 모닝', emoji: '🌅' },
  { id: 'study', label: '자기계발', emoji: '📚' },
  { id: 'health', label: '헬스 & 운동', emoji: '💪' },
  { id: 'mindfulness', label: '마음챙김', emoji: '🧘' },
  { id: 'night', label: '취침 웰니스', emoji: '🌙' },
];

export const ExploreView: React.FC<ExploreViewProps> = ({
  userRoutines,
  categories,
  onAddRoutine,
  onOpenAddModal,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'all' | string>('all');
  const [packAdded, setPackAdded] = useState(false);

  // Check if a routine is already added by title
  const isRoutineAdded = (title: string) => {
    return userRoutines.some((r) => r.title.trim().toLowerCase() === title.trim().toLowerCase());
  };

  const handleAddTemplate = (tmpl: RoutineTemplate) => {
    if (isRoutineAdded(tmpl.title)) return;

    onAddRoutine({
      title: tmpl.title,
      emoji: tmpl.emoji,
      categoryId: tmpl.categoryId || categories[0]?.id || 'cat-life',
      timeOfDay: tmpl.timeOfDay,
      repeatType: 'daily',
      xp: tmpl.xp,
      tag: tmpl.tag,
    });
  };

  const handleAddPack = () => {
    FEATURED_PACK.routines.forEach((r) => {
      if (!isRoutineAdded(r.title)) {
        onAddRoutine({
          title: r.title,
          emoji: r.emoji,
          categoryId: r.categoryId || categories[0]?.id || 'cat-life',
          timeOfDay: r.timeOfDay,
          repeatType: 'daily',
          xp: r.xp,
          tag: r.tag,
        });
      }
    });
    setPackAdded(true);
    setTimeout(() => setPackAdded(false), 3000);
  };

  // Filter templates
  const filteredTemplates = useMemo(() => {
    return CURATED_TEMPLATES.filter((item) => {
      const matchesSearch =
        searchQuery === '' ||
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.desc.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.category.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCat =
        selectedCategory === 'all' ||
        (selectedCategory === 'morning' && item.timeOfDay === 'morning') ||
        (selectedCategory === 'study' && item.categoryId === 'cat-growth') ||
        (selectedCategory === 'health' && item.categoryId === 'cat-health') ||
        (selectedCategory === 'mindfulness' && item.categoryId === 'cat-mind') ||
        (selectedCategory === 'night' && item.timeOfDay === 'night');

      return matchesSearch && matchesCat;
    });
  }, [searchQuery, selectedCategory]);

  return (
    <div className="flex flex-col w-full pb-8 select-none">
      {/* Search Input Area */}
      <div className="pt-1">
        <div className="relative w-full">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-blue-600">
            <span className="material-symbols-outlined text-[22px]">search</span>
          </div>
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="루틴, 키워드, 목표 검색 (예: 미라클 모닝, 홈트)"
            className="w-full h-12 pl-11 pr-10 bg-white rounded-xl text-[14.5px] font-medium text-slate-900 placeholder:text-slate-400 shadow-2xs border border-slate-200/90 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
              title="검색어 지우기"
            >
              <span className="material-symbols-outlined text-[18px]">cancel</span>
            </button>
          )}
        </div>
      </div>

      {/* Category Grid (3x2 No-Clipping Layout: All 6 visible immediately without sliding!) */}
      <div className="grid grid-cols-3 gap-2 mt-2.5">
        {CATEGORY_ITEMS.map((cat) => {
          const isSelected = selectedCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`h-10 px-2 rounded-xl text-[13.5px] font-bold transition-all active:scale-95 flex items-center justify-center gap-1.5 ${
                isSelected
                  ? 'bg-[#1d4ed8] text-white shadow-xs font-black'
                  : 'bg-white text-slate-700 hover:bg-blue-50/70 border border-slate-200/90'
              }`}
            >
              <span className="text-[15px] leading-none">{cat.emoji}</span>
              <span className="truncate leading-none">{cat.label}</span>
            </button>
          );
        })}
      </div>

      {/* Featured Routine Pack Card */}
      <div className="mt-3.5">
        <div className="relative w-full rounded-2xl overflow-hidden bg-white shadow-2xs border border-slate-200/90">
          {/* Card Top Accent Banner */}
          <div className="bg-gradient-to-r from-[#1d4ed8] via-[#2563eb] to-[#3b82f6] p-4 text-white">
            <div className="flex items-center justify-between gap-2">
              <span className="px-2.5 py-1 rounded-full bg-white/20 backdrop-blur-md text-white text-[11.5px] font-black flex items-center gap-1 border border-white/25">
                <span className="material-symbols-outlined text-[14px]">bolt</span>
                {FEATURED_PACK.badge}
              </span>
              <span className="px-2.5 py-1 rounded-full bg-amber-400 text-slate-950 text-[11.5px] font-black flex items-center gap-1 shadow-xs">
                ⭐ 모어해빗 추천 팩
              </span>
            </div>
            <h3 className="text-[17px] font-black text-white mt-2.5 leading-snug">
              {FEATURED_PACK.title}
            </h3>
            <p className="text-[13px] text-blue-100 mt-1 font-medium leading-relaxed">
              {FEATURED_PACK.desc}
            </p>
          </div>

          {/* Pack Details */}
          <div className="p-4 flex flex-col gap-3">
            {/* Routine Steps Pill Summary */}
            <div className="flex flex-col gap-2">
              <span className="text-[12px] font-bold text-slate-500">포함된 3단계 루틴</span>
              <div className="grid grid-cols-1 gap-1.5">
                {FEATURED_PACK.routines.map((r, i) => (
                  <div
                    key={i}
                    className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between gap-2"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-[18px] leading-none">{r.emoji}</span>
                      <span className="text-[13.5px] font-bold text-slate-800 truncate">
                        {r.title}
                      </span>
                    </div>
                    <span className="text-[12px] font-extrabold text-blue-700 bg-blue-100/70 px-2 py-0.5 rounded-md shrink-0">
                      {r.duration}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={handleAddPack}
              className={`w-full h-12 rounded-xl text-[14.5px] font-black flex items-center justify-center gap-2 active:scale-98 transition-all shadow-xs ${
                packAdded
                  ? 'bg-emerald-600 text-white'
                  : 'bg-[#1d4ed8] hover:bg-[#1e40af] text-white shadow-blue-500/20'
              }`}
            >
              <span className="material-symbols-outlined text-[19px]">
                {packAdded ? 'check_circle' : 'library_add'}
              </span>
              <span>
                {packAdded
                  ? '모닝 스타터 팩 담기 완료! 🎉'
                  : `이 팩 한 번에 담기 (+${FEATURED_PACK.totalXp} XP)`}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Routine Cards Section Header */}
      <div className="flex items-center justify-between mt-6 mb-2.5 px-0.5">
        <div className="flex items-center gap-1.5">
          <h3 className="text-[17px] font-black text-[#0f2e7a] tracking-tight">
            추천 루틴 템플릿
          </h3>
          <span className="text-[12px] font-black text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full">
            {filteredTemplates.length}개
          </span>
        </div>
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="text-[12.5px] font-bold text-slate-500 hover:text-blue-600"
          >
            검색 초기화
          </button>
        )}
      </div>

      {/* Curated Routine List Feed */}
      <div className="flex flex-col gap-3">
        {filteredTemplates.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 border border-slate-200/90 text-center flex flex-col items-center justify-center">
            <span className="text-3xl mb-2">🔍</span>
            <p className="text-[15px] font-bold text-slate-800">일치하는 추천 루틴이 없어요</p>
            <p className="text-[13px] text-slate-500 mt-1">다른 검색어나 카테고리를 선택해보세요.</p>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('all');
              }}
              className="mt-4 px-4 py-2 rounded-xl bg-blue-50 text-blue-700 text-[13px] font-bold hover:bg-blue-100 transition-colors"
            >
              전체 루틴 보기
            </button>
          </div>
        ) : (
          filteredTemplates.map((template) => {
            const added = isRoutineAdded(template.title);

            return (
              <div
                key={template.id}
                className="bg-white rounded-2xl p-4 shadow-2xs flex flex-col gap-3 transition-all border border-slate-200/90 hover:border-blue-300"
              >
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-blue-50/80 border border-blue-100/70 flex items-center justify-center text-2xl shrink-0 select-none">
                    {template.emoji}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="px-2 py-0.5 rounded-md bg-blue-50 text-primary font-bold text-[11.5px]">
                        {template.category}
                      </span>
                      <span className="text-[11.5px] text-slate-500 flex items-center gap-0.5 font-medium">
                        <span className="material-symbols-outlined text-[13px]">people</span>
                        {template.practitionerCount.toLocaleString()}명 실천 중
                      </span>
                    </div>
                    <h4 className="text-[16px] font-extrabold text-slate-900 mt-1 leading-snug">
                      {template.title}
                    </h4>
                    <p className="text-[13px] text-slate-600 leading-relaxed mt-0.5">
                      {template.desc}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2.5 border-t border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1 text-[13px] font-medium text-slate-600">
                      <span className="material-symbols-outlined text-[16px] text-slate-400">
                        schedule
                      </span>
                      <span>{template.durationMinutes}분</span>
                    </div>
                    <div className="flex items-center gap-1 text-[13px] text-blue-700 font-extrabold">
                      <span className="material-symbols-outlined text-[16px] text-blue-700">
                        bolt
                      </span>
                      <span>+{template.xp}XP</span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleAddTemplate(template)}
                    disabled={added}
                    className={`h-9 px-4 rounded-xl text-[13.5px] font-bold flex items-center gap-1 active:scale-95 transition-all ${
                      added
                        ? 'bg-slate-100 text-slate-400 font-semibold border border-slate-200 cursor-default'
                        : 'bg-blue-50 hover:bg-[#1d4ed8] hover:text-white text-primary border border-blue-200 font-bold'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[16px]">
                      {added ? 'check' : 'add'}
                    </span>
                    <span>{added ? '담김 ✓' : '루틴에 추가'}</span>
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Custom Routine Creator Banner */}
      <div className="mt-7 mb-4">
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-50/90 to-indigo-50/90 p-5 shadow-2xs flex flex-col gap-3.5 border border-blue-200/80">
          <div className="flex items-center justify-between">
            <div className="w-12 h-12 rounded-2xl bg-[#1d4ed8] flex items-center justify-center text-white shadow-xs">
              <span className="material-symbols-outlined text-[26px]">edit_calendar</span>
            </div>
            <span className="px-3 py-1 rounded-full bg-white text-blue-700 border border-blue-200 text-[12px] font-black">
              자유도 100%
            </span>
          </div>

          <div>
            <h4 className="text-[17px] font-black text-[#0f2e7a]">
              직접 나만의 커스텀 루틴 만들기
            </h4>
            <p className="text-[13.5px] text-slate-600 mt-1 leading-relaxed">
              원하는 시간, 요일, 주기까지 내 일상에 딱 맞게 자유롭게 설계해보세요.
            </p>
          </div>

          <button
            onClick={onOpenAddModal}
            className="w-full h-12 rounded-xl bg-[#1d4ed8] hover:bg-[#1e40af] text-white text-[15px] font-black flex items-center justify-center gap-2 active:scale-98 transition-all shadow-xs"
          >
            <span className="material-symbols-outlined text-[20px]">add_circle</span>
            <span>새 커스텀 루틴 만들기</span>
          </button>
        </div>
      </div>
    </div>
  );
};
