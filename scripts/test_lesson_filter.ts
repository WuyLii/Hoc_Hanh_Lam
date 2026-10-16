import { normalizeLesson, isLessonMatch, buildLessonIndex, filterWords } from '../src/utils/lessonFilter';
import { VocabularyItem } from '../src/types';

function assert(condition: boolean, msg: string) {
  if (!condition) {
    console.error(`❌ FAIL: ${msg}`);
    process.exit(1);
  } else {
    console.log(`✅ PASS: ${msg}`);
  }
}

console.log('--- TEST 1: normalizeLesson ---');
const nfdBai1 = 'Ba\u0300i 1'; // NFD decomposed
const nfcBai1 = 'Bài 1';      // NFC precomposed

assert(normalizeLesson('Bài 1').key === 'lesson_1', 'Bài 1 key should be lesson_1');
assert(normalizeLesson('Bài 01').key === 'lesson_1', 'Bài 01 key should be lesson_1');
assert(normalizeLesson('bài 1 ').key === 'lesson_1', 'bài 1 (lowercase, trailing space) key should be lesson_1');
assert(normalizeLesson('Bai 1').key === 'lesson_1', 'Bai 1 (no accent) key should be lesson_1');
assert(normalizeLesson('Bài 1: Chào hỏi').key === 'lesson_1', 'Bài 1: Chào hỏi key should be lesson_1');
assert(normalizeLesson('Bài 1. Chào hỏi').key === 'lesson_1', 'Bài 1. Chào hỏi key should be lesson_1');
assert(normalizeLesson('Bài 1- Giới thiệu').key === 'lesson_1', 'Bài 1- Giới thiệu key should be lesson_1');
assert(normalizeLesson('Bài 1) Gia đình').key === 'lesson_1', 'Bài 1) Gia đình key should be lesson_1');
assert(normalizeLesson('Bài 1（Chào hỏi）').key === 'lesson_1', 'Bài 1 full-width brackets key should be lesson_1');
assert(normalizeLesson('Unit 01: Greetings').key === 'lesson_1', 'Unit 01: Greetings key should be lesson_1');
assert(normalizeLesson('Lesson 1').key === 'lesson_1', 'Lesson 1 key should be lesson_1');
assert(normalizeLesson('第1课').key === 'lesson_1', '第1课 key should be lesson_1');
assert(normalizeLesson('제1과').key === 'lesson_1', '제1과 key should be lesson_1');
assert(normalizeLesson(nfdBai1).key === normalizeLesson(nfcBai1).key, 'NFD and NFC should produce same key');

assert(normalizeLesson('Bài 12').key === 'lesson_12', 'Bài 12 key should be lesson_12');
assert(normalizeLesson('Bài 1').key !== normalizeLesson('Bài 12').key, 'Bài 1 and Bài 12 must NOT have same key');

assert(normalizeLesson('').key === 'none', 'Empty string key must be none');
assert(normalizeLesson('   ').key === 'none', 'Whitespace key must be none');
assert(normalizeLesson(null).key === 'none', 'null key must be none');
assert(normalizeLesson(undefined).key === 'none', 'undefined key must be none');
assert(normalizeLesson('none').key === 'none', 'none string key must be none');

console.log('--- TEST 2: isLessonMatch ---');
assert(isLessonMatch('Bài 01', 'Bài 1') === true, 'Bài 01 matches Bài 1');
assert(isLessonMatch('bài 1 ', 'Bài 1') === true, 'bài 1 matches Bài 1');
assert(isLessonMatch('Bài 1: Chào hỏi', 'Bài 1') === true, 'Bài 1: Chào hỏi matches Bài 1');
assert(isLessonMatch('Bài 1. Chào hỏi', 'Bài 1') === true, 'Bài 1. Chào hỏi matches Bài 1');
assert(isLessonMatch('Bai 1', 'Bài 1') === true, 'Bai 1 matches Bài 1');
assert(isLessonMatch('Bài 12', 'Bài 1') === false, 'Bài 12 DOES NOT match Bài 1');
assert(isLessonMatch('', 'Bài 1') === false, 'Empty string DOES NOT match Bài 1');
assert(isLessonMatch(null, 'Bài 1') === false, 'null DOES NOT match Bài 1');
assert(isLessonMatch(undefined, 'Bài 1') === false, 'undefined DOES NOT match Bài 1');
assert(isLessonMatch(nfdBai1, nfcBai1) === true, 'NFD matches NFC');

console.log('--- TEST 3: buildLessonIndex ---');
const mockWords: VocabularyItem[] = [
  { word_id: 'w1', tu: 'one', nghia: 'một', loai_tu: 'Số', cap_do: 'A1', chu_de: 'Số', bai_hoc: 'Bài 1', phien_am: '', vi_du: '', vi_du_dich: '', times_reviewed: 0, times_correct: 0, srs_box: 0, srs_interval: 1, srs_ease: 2.5, ngon_ngu: 'en' },
  { word_id: 'w2', tu: 'two', nghia: 'hai', loai_tu: 'Số', cap_do: 'A1', chu_de: 'Số', bai_hoc: 'Bài 01: Số đếm', phien_am: '', vi_du: '', vi_du_dich: '', times_reviewed: 0, times_correct: 0, srs_box: 0, srs_interval: 1, srs_ease: 2.5, ngon_ngu: 'en' },
  { word_id: 'w3', tu: 'three', nghia: 'ba', loai_tu: 'Số', cap_do: 'A1', chu_de: 'Số', bai_hoc: 'Bài 2', phien_am: '', vi_du: '', vi_du_dich: '', times_reviewed: 0, times_correct: 0, srs_box: 0, srs_interval: 1, srs_ease: 2.5, ngon_ngu: 'en' },
  { word_id: 'w4', tu: 'four', nghia: 'bốn', loai_tu: 'Số', cap_do: 'A1', chu_de: 'Số', bai_hoc: '', phien_am: '', vi_du: '', vi_du_dich: '', times_reviewed: 0, times_correct: 0, srs_box: 0, srs_interval: 1, srs_ease: 2.5, ngon_ngu: 'en' },
  { word_id: 'w5', tu: 'five', nghia: 'năm', loai_tu: 'Số', cap_do: 'A1', chu_de: 'Số', bai_hoc: 'Từ vựng du lịch', phien_am: '', vi_du: '', vi_du_dich: '', times_reviewed: 0, times_correct: 0, srs_box: 0, srs_interval: 1, srs_ease: 2.5, ngon_ngu: 'en' },
] as unknown as VocabularyItem[];

const index = buildLessonIndex(mockWords);
console.log('Index result:', JSON.stringify(index, null, 2));
assert(index.length === 4, 'Should aggregate w1 and w2 into one lesson, total 4 lessons');
const l1 = index.find((i) => i.key === 'lesson_1');
assert(Boolean(l1 && l1.count === 2 && l1.wordIds.includes('w1') && l1.wordIds.includes('w2')), 'lesson_1 has 2 words (w1, w2)');
const lNone = index.find((i) => i.key === 'none');
assert(Boolean(lNone && lNone.count === 1 && lNone.wordIds.includes('w4')), 'Empty word is in none group');

console.log('--- TEST 4: filterWords ---');
const filteredL1 = filterWords(mockWords, { selectedLesson: 'lesson_1' });
assert(filteredL1.length === 2, 'Filtering by lesson_1 returns 2 words');

const filteredL1ByLabel = filterWords(mockWords, { selectedLesson: 'Bài 1' });
assert(filteredL1ByLabel.length === 2, 'Filtering by "Bài 1" returns 2 words');

const filteredNone = filterWords(mockWords, { selectedLesson: 'none' });
assert(filteredNone.length === 1 && filteredNone[0].word_id === 'w4', 'Filtering by none returns w4');

const filteredAll = filterWords(mockWords, { selectedLesson: 'ALL' });
assert(filteredAll.length === 5, 'Filtering by ALL returns all 5 words');

console.log('\n🎉 ALL TESTS PASSED SUCCESSFULLY!\n');
