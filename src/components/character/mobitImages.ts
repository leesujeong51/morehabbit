// MoreHabit 공식 거북이 캐릭터 모빗(Mobit) 이미지 — 원본 캐릭터 시트에서 추출 (src/assets/mobit)
// 빌드 시 JS 안에 data URL로 내장되므로(vite.config assetsInlineLimit) 배포 방식과 무관하게 항상 표시됨
const files = import.meta.glob<string>('../../assets/mobit/*.webp', { eager: true, import: 'default' });
const img = (name: string) => files[`../../assets/mobit/${name}.webp`];

const base = {
  default: img('default'),
  cheer: img('cheer'),
  star_reach: img('star_reach'),
  excited: img('excited'),
  success: img('success'),
  rest: img('rest'),
  thinking: img('thinking'),
  sad: img('sad'),
  comfort: img('comfort'),
  surprised: img('surprised'),
  focus: img('focus'),
  water: img('water'),
  exercise: img('exercise'),
  reading: img('reading'),
  sleep: img('sleep'),
  medicine: img('medicine'),
  stroll: img('stroll'),
  victory: img('victory'),
  streak: img('streak'),
  done: img('done'),
  memo: img('memo'),
  heart: img('heart'),
};

// 기존 mood 키 호환용 별칭
export const MOBIT_IMAGES = {
  ...base,
  happy: base.default,
  joy: base.cheer,
  wink: base.cheer,
  encourage: base.comfort,
  proud: base.success,
  celebration: base.victory,
  goal: base.victory,
  challenge: base.victory,
  pomodoro: base.focus,
  walking: base.exercise,
  card_done: base.done,
  card_cheer: base.cheer,
  app_icon: base.default,
  icon: base.default,
  icon_face: base.default,
  slogan: base.rest,
};
