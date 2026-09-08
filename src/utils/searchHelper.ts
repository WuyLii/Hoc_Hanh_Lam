import { VocabularyItem, GrammarItem } from '../types';

/**
 * Remove Vietnamese accents and diacritics
 * (e.g., 'học tập' -> 'hoc tap', 'động từ' -> 'dong tu')
 */
export function removeVietnameseTones(str: string): string {
  if (!str) return '';
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D');
}

/**
 * Normalize search string: lowercase, trim, remove tone marks and punctuation
 */
export function normalizeSearchString(str: string): string {
  if (!str) return '';
  return removeVietnameseTones(str.toLowerCase().trim());
}

/**
 * Strip grammar formatting characters like '~', '-', '(', ')', brackets, extra spaces
 * to enable flexible syntax matching (e.g. '-(으)ㄹ 수 있다' matches 'ㄹ 수 있다', '을 수 있다', 'ㄹ수있다')
 */
export function normalizeGrammarSyntax(syntax: string): string {
  if (!syntax) return '';
  return syntax
    .toLowerCase()
    .replace(/[~–—\-()[\]{}«»"'/\\.,:;]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export type VocabSearchScope = 'all' | 'word' | 'meaning' | 'hanviet';

export interface SearchMatchResult {
  matches: boolean;
  score: number;
}

/**
 * Intelligent matcher for vocabulary items
 * Supports:
 * - Search with or without Vietnamese diacritics ('an' matches 'ăn', 'uong' matches 'uống')
 * - Search by original word (Korean, English, Chinese), meaning, phonetic, Hán Việt, example sentences
 * - No-space matching ('hocbai' matches 'học bài', '고싶다' matches '고 싶다')
 * - Multi-token matching ('an sang' matches item containing both 'ăn' and 'sáng')
 * - Relevance scoring to rank direct hits first
 */
export function matchVocabulary(
  item: VocabularyItem,
  query: string,
  scope: VocabSearchScope = 'all'
): SearchMatchResult {
  const qRaw = query.trim().toLowerCase();
  if (!qRaw) return { matches: true, score: 0 };

  const qTone = removeVietnameseTones(qRaw);
  const qNoSpace = qRaw.replace(/\s+/g, '');
  const qNoSpaceTone = qTone.replace(/\s+/g, '');
  const tokens = qTone.split(/\s+/).filter(Boolean);

  const wordRaw = (item.tu || '').trim().toLowerCase();
  const wordTone = removeVietnameseTones(wordRaw);
  const wordNoSpace = wordRaw.replace(/\s+/g, '');

  const meaningRaw = (item.nghia || '').trim().toLowerCase();
  const meaningTone = removeVietnameseTones(meaningRaw);
  const meaningNoSpace = meaningTone.replace(/\s+/g, '');

  const phoneticRaw = (item.phien_am || '').trim().toLowerCase();
  const phoneticTone = removeVietnameseTones(phoneticRaw);

  const hanVietRaw = (item.nghia_tieng_han || item.phien_am_tieng_han || '').trim().toLowerCase();
  const hanVietTone = removeVietnameseTones(hanVietRaw);

  const englishRaw = (item.nghia_tieng_anh || '').trim().toLowerCase();

  const exampleRaw = `${item.vi_du || ''} ${item.vi_du_dich || ''}`.toLowerCase();
  const exampleTone = removeVietnameseTones(exampleRaw);

  const metadataRaw = `${item.chu_de || ''} ${item.cap_do || ''} ${item.loai_tu || ''} ${item.nguon_goc || ''}`.toLowerCase();
  const metadataTone = removeVietnameseTones(metadataRaw);

  // Field-targeted matching
  if (scope === 'word') {
    if (wordRaw === qRaw || wordTone === qTone) return { matches: true, score: 100 };
    if (wordRaw.startsWith(qRaw) || wordTone.startsWith(qTone)) return { matches: true, score: 80 };
    if (wordRaw.includes(qRaw) || wordTone.includes(qTone) || wordNoSpace.includes(qNoSpaceTone)) return { matches: true, score: 60 };
    return { matches: false, score: 0 };
  }

  if (scope === 'meaning') {
    if (meaningRaw === qRaw || meaningTone === qTone) return { matches: true, score: 90 };
    if (meaningRaw.startsWith(qRaw) || meaningTone.startsWith(qTone)) return { matches: true, score: 70 };
    if (meaningRaw.includes(qRaw) || meaningTone.includes(qTone) || meaningNoSpace.includes(qNoSpaceTone)) return { matches: true, score: 50 };
    return { matches: false, score: 0 };
  }

  if (scope === 'hanviet') {
    if (hanVietRaw.includes(qRaw) || hanVietTone.includes(qTone)) return { matches: true, score: 60 };
    return { matches: false, score: 0 };
  }

  // Scope: 'all'
  let score = 0;

  // 1. Exact match on word
  if (wordRaw === qRaw || wordTone === qTone) {
    score = Math.max(score, 100);
  }
  // 2. Word starts with query
  else if (wordRaw.startsWith(qRaw) || wordTone.startsWith(qTone)) {
    score = Math.max(score, 85);
  }
  // 3. Word contains query
  else if (wordRaw.includes(qRaw) || wordTone.includes(qTone) || (qNoSpace && wordNoSpace.includes(qNoSpace))) {
    score = Math.max(score, 70);
  }

  // 4. Meaning matches
  if (meaningRaw === qRaw || meaningTone === qTone) {
    score = Math.max(score, 90);
  } else if (meaningRaw.startsWith(qRaw) || meaningTone.startsWith(qTone)) {
    score = Math.max(score, 65);
  } else if (meaningRaw.includes(qRaw) || meaningTone.includes(qTone) || (qNoSpaceTone && meaningNoSpace.includes(qNoSpaceTone))) {
    score = Math.max(score, 50);
  }

  // 5. Han Viet / Phonetic matches
  if (hanVietRaw.includes(qRaw) || hanVietTone.includes(qTone)) {
    score = Math.max(score, 45);
  }
  if (phoneticRaw.includes(qRaw) || phoneticTone.includes(qTone)) {
    score = Math.max(score, 40);
  }
  if (englishRaw && (englishRaw === qRaw || englishRaw.includes(qRaw))) {
    score = Math.max(score, 38);
  }

  // 6. Example sentences matches
  if (exampleRaw.includes(qRaw) || exampleTone.includes(qTone)) {
    score = Math.max(score, 25);
  }

  // 7. Metadata (topic, level, part of speech) matches
  if (metadataRaw.includes(qRaw) || metadataTone.includes(qTone)) {
    score = Math.max(score, 20);
  }

  // 8. Multi-token match: Every token in query must match at least one field
  if (score === 0 && tokens.length > 1) {
    const combinedTone = `${wordTone} ${meaningTone} ${phoneticTone} ${hanVietTone} ${englishRaw} ${exampleTone} ${metadataTone}`;
    const allTokensMatch = tokens.every((token) => combinedTone.includes(token));
    if (allTokensMatch) {
      score = 30;
    }
  }

  return {
    matches: score > 0,
    score,
  };
}

/**
 * Intelligent matcher for grammar rules
 * Supports:
 * - Grammar symbol tolerance (~고 싶다, -고 싶다, 고 싶다, 고싶다)
 * - Vietnamese diacritic insensitivity (ngu phap, cau truc, dong tu, tinh tu)
 * - Brackets variation matching (e.g. '-(으)ㄹ 수 있다' matches 'ㄹ 수 있다', '을 수 있다')
 * - Multi-token search across structure, explanation, examples, tags, notes
 */
export function matchGrammar(
  item: GrammarItem,
  query: string
): SearchMatchResult {
  const qRaw = query.trim().toLowerCase();
  if (!qRaw) return { matches: true, score: 0 };

  const qTone = removeVietnameseTones(qRaw);
  const qClean = normalizeGrammarSyntax(qRaw);
  const qNoSpace = qRaw.replace(/\s+/g, '');
  const qNoSpaceTone = qTone.replace(/\s+/g, '');
  const tokens = qTone.split(/\s+/).filter(Boolean);

  const structRaw = (item.cau_truc || '').trim().toLowerCase();
  const structClean = normalizeGrammarSyntax(structRaw);
  const structTone = removeVietnameseTones(structRaw);
  const structNoSpace = structRaw.replace(/[~–—\-()[\]{}«»"'/\\.,:;\s]/g, '');

  const explainRaw = (item.giai_thich || '').trim().toLowerCase();
  const explainTone = removeVietnameseTones(explainRaw);

  const exampleRaw = `${item.vi_du || ''} ${item.vi_du_dich || ''}`.toLowerCase();
  const exampleTone = removeVietnameseTones(exampleRaw);

  const tagsRaw = (item.tags || []).join(' ').toLowerCase();
  const tagsTone = removeVietnameseTones(tagsRaw);

  const notesRaw = (item.ghi_chu || '').toLowerCase();
  const notesTone = removeVietnameseTones(notesRaw);

  const levelRaw = (item.cap_do || '').toLowerCase();

  let score = 0;

  // 1. Structure exact or symbol-cleaned match
  if (structRaw === qRaw || structClean === qClean || structTone === qTone) {
    score = Math.max(score, 100);
  }
  // 2. Structure starts with query
  else if (structRaw.startsWith(qRaw) || structClean.startsWith(qClean) || structTone.startsWith(qTone)) {
    score = Math.max(score, 85);
  }
  // 3. Structure contains query (or no-symbol no-space variant)
  else if (
    structRaw.includes(qRaw) ||
    structClean.includes(qClean) ||
    structTone.includes(qTone) ||
    (qNoSpace && structNoSpace.includes(qNoSpace.replace(/[~–—\-()[\]{}«»"'/\\.,:;]/g, '')))
  ) {
    score = Math.max(score, 75);
  }

  // 4. Explanation contains query
  if (explainRaw === qRaw || explainTone === qTone) {
    score = Math.max(score, 90);
  } else if (explainRaw.includes(qRaw) || explainTone.includes(qTone) || (qNoSpaceTone && explainTone.replace(/\s+/g, '').includes(qNoSpaceTone))) {
    score = Math.max(score, 55);
  }

  // 5. Examples contain query
  if (exampleRaw.includes(qRaw) || exampleTone.includes(qTone)) {
    score = Math.max(score, 40);
  }

  // 6. Tags & Notes contain query
  if (tagsRaw.includes(qRaw) || tagsTone.includes(qTone)) {
    score = Math.max(score, 35);
  }
  if (notesRaw.includes(qRaw) || notesTone.includes(qTone) || levelRaw.includes(qRaw)) {
    score = Math.max(score, 25);
  }

  // 7. Multi-token match across all fields
  if (score === 0 && tokens.length > 1) {
    const combined = `${structTone} ${structClean} ${explainTone} ${exampleTone} ${tagsTone} ${notesTone} ${levelRaw}`;
    const allMatch = tokens.every((token) => combined.includes(token));
    if (allMatch) {
      score = 30;
    }
  }

  return {
    matches: score > 0,
    score,
  };
}
