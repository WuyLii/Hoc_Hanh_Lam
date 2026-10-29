import { VocabularyItem, GrammarItem } from '../types/index';

/**
 * Normalizes and removes Vietnamese diacritics / tone marks
 * (e.g. 'học tập' -> 'hoc tap', 'động từ' -> 'dong tu', 'ngủ' -> 'ngu')
 */
export function removeVietnameseTones(str: string): string {
  if (!str) return '';
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[đĐ]/g, (m) => (m === 'đ' ? 'd' : 'D'))
    .trim();
}

const HANGUL_START = 0xac00;
const HANGUL_END = 0xd7a3;
const CHOSUNG = [
  'ㄱ', 'ㄲ', 'ㄴ', 'ㄷ', 'ㄸ', 'ㄹ', 'ㅁ', 'ㅂ', 'ㅃ', 'ㅅ',
  'ㅆ', 'ㅇ', 'ㅈ', 'ㅉ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ'
];

/**
 * Extracts Korean Initial Consonants (Chosung) from Hangul text.
 * E.g., '한국' -> 'ㅎㄱ', '가방' -> 'ㄱㅂ', '학교' -> 'ㅎㄱ'
 */
export function getHangulChosung(str: string): string {
  if (!str) return '';
  let res = '';
  for (let i = 0; i < str.length; i++) {
    const code = str.charCodeAt(i);
    if (code >= HANGUL_START && code <= HANGUL_END) {
      const idx = Math.floor((code - HANGUL_START) / 588);
      res += CHOSUNG[idx];
    } else {
      res += str[i];
    }
  }
  return res;
}

/**
 * Clean and normalize phonetic transcription (Romaja, IPA, Pinyin)
 * Strips brackets `[...]`, `/.../`, hyphens, tone marks and extra whitespace.
 */
export function cleanPhonetic(str: string): string {
  if (!str) return '';
  return str
    .toLowerCase()
    .replace(/[\[\]\/\(\)\-–—]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Tokenizes word meanings into clean distinct semantic phrases.
 * E.g. "đi, bước đi; di chuyển" -> ["đi", "bước đi", "di chuyển"]
 */
export function tokenizeMeaning(meaning: string): string[] {
  if (!meaning) return [];
  return meaning
    .split(/[,;\/\n\r•|]+/)
    .map((t) => t.trim().toLowerCase())
    .filter(Boolean);
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

export type VocabSearchScope = 'both' | 'word' | 'meaning';

export interface SearchMatchResult {
  matches: boolean;
  score: number;
  matchType?: 'exact_word' | 'exact_meaning' | 'word_prefix' | 'word_stem' | 'meaning_token' | 'phonetic' | 'chosung' | 'word_contains' | 'meaning_starts' | 'meaning_contains' | 'multi_token';
}

/**
 * Ultra-intelligent multi-tier scoring matcher for vocabulary.
 * Solves the false-substring bug (e.g. searching "đi" matching "điều kiện" or "điện thoại")
 * by prioritizing exact words, exact tokens, word prefixes, Romaja/Phonetic,
 * Hangul Chosung, and word stems above broad substrings.
 */
export function matchVocabulary(
  item: VocabularyItem,
  query: string,
  scope: VocabSearchScope = 'both'
): SearchMatchResult {
  if (!query || !query.trim()) {
    return { matches: true, score: 0 };
  }

  const qRaw = query.trim().toLowerCase();
  const qTone = removeVietnameseTones(qRaw).toLowerCase();
  const qNoSpace = qRaw.replace(/\s+/g, '');
  const qNoSpaceTone = qTone.replace(/\s+/g, '');

  const wordRaw = (item.tu || '').trim().toLowerCase();
  const wordTone = removeVietnameseTones(wordRaw).toLowerCase();
  const wordNoSpace = wordRaw.replace(/\s+/g, '');
  const wordNoSpaceTone = wordTone.replace(/\s+/g, '');

  const meaningRaw = (item.nghia || '').trim().toLowerCase();
  const meaningTone = removeVietnameseTones(meaningRaw).toLowerCase();
  const meaningTokens = tokenizeMeaning(item.nghia || '');
  const meaningTokensTone = meaningTokens.map((t) => removeVietnameseTones(t).toLowerCase());

  const phoneticRaw = cleanPhonetic(item.phien_am || '');
  const phoneticNoSpace = phoneticRaw.replace(/\s+/g, '');

  const chosungWord = getHangulChosung(wordRaw);

  let wordScore = 0;
  let meaningScore = 0;
  let detectedType: SearchMatchResult['matchType'] = undefined;

  // ==========================================
  // 1. EVALUATE WORD MATCH (Hangul / English / Chinese / Romaja)
  // ==========================================
  if (wordRaw) {
    // 1.1. Exact Match on Word (Hangul / Word itself)
    if (wordRaw === qRaw) {
      wordScore = 2000;
      detectedType = 'exact_word';
    } else if (wordTone === qTone && wordTone.length > 0) {
      wordScore = 1900;
      detectedType = 'exact_word';
    } else if (wordNoSpace === qNoSpace) {
      wordScore = 1850;
      detectedType = 'exact_word';
    }
    // 1.2. Korean Verb Stem Match: e.g. query is "가" and word is "가다", or "먹" -> "먹다", "공부" -> "공부하다"
    else if (
      (wordRaw.endsWith('다') && wordRaw.slice(0, -1) === qRaw) ||
      (wordRaw.endsWith('하다') && wordRaw.slice(0, -2) === qRaw)
    ) {
      wordScore = 1750;
      detectedType = 'word_stem';
    }
    // 1.3. Word Starts With Query
    else if (wordRaw.startsWith(qRaw)) {
      wordScore = 1500;
      detectedType = 'word_prefix';
    } else if (wordTone.startsWith(qTone) && qTone.length >= 2) {
      wordScore = 1400;
      detectedType = 'word_prefix';
    }
    // 1.4. Phonetic / Romaja / Pinyin Match (e.g. query "hakgyo" -> [hak-gyo], "sarang" -> [sa-rang])
    else if (phoneticRaw && (phoneticRaw === qRaw || phoneticNoSpace === qNoSpace)) {
      wordScore = 1350;
      detectedType = 'phonetic';
    } else if (phoneticRaw && (phoneticRaw.startsWith(qRaw) || phoneticNoSpace.startsWith(qNoSpace))) {
      wordScore = 1250;
      detectedType = 'phonetic';
    }
    // 1.5. Hangul Chosung (Initial Consonants) Match (e.g. query "ㅎㄱ" -> "한국")
    else if (chosungWord && (chosungWord === qRaw || chosungWord.startsWith(qRaw))) {
      wordScore = 1200;
      detectedType = 'chosung';
    }
    // 1.6. Word Contains Query as Substring
    else if (wordRaw.includes(qRaw)) {
      wordScore = 1000;
      detectedType = 'word_contains';
    } else if (wordTone.includes(qTone) && qTone.length >= 2) {
      wordScore = 950;
      detectedType = 'word_contains';
    } else if (phoneticRaw && phoneticRaw.includes(qRaw) && qRaw.length >= 3) {
      wordScore = 800;
      detectedType = 'phonetic';
    }
  }

  // ==========================================
  // 2. EVALUATE MEANING MATCH (Vietnamese)
  // ==========================================
  if (meaningRaw) {
    // 2.1. Exact Full Meaning
    if (meaningRaw === qRaw) {
      meaningScore = 1800;
      if (!detectedType) detectedType = 'exact_meaning';
    } else if (meaningTone === qTone) {
      meaningScore = 1700;
      if (!detectedType) detectedType = 'exact_meaning';
    }
    // 2.2. Exact Meaning Token Match (e.g. query "đi", meaning "đi, bước đi" -> token "đi" matches perfectly!)
    else if (meaningTokens.includes(qRaw)) {
      meaningScore = 1600;
      if (!detectedType) detectedType = 'meaning_token';
    } else if (meaningTokensTone.includes(qTone)) {
      meaningScore = 1550;
      if (!detectedType) detectedType = 'meaning_token';
    }
    // 2.3. Meaning Token Starts With Query
    else if (meaningTokens.some((t) => t.startsWith(qRaw))) {
      meaningScore = qRaw.length <= 3 ? 850 : 1300;
      if (!detectedType) detectedType = 'meaning_starts';
    } else if (meaningTokensTone.some((t) => t.startsWith(qTone))) {
      meaningScore = qTone.length <= 3 ? 800 : 1200;
      if (!detectedType) detectedType = 'meaning_starts';
    }
    // 2.4. Whole Word Regex Match in Meaning (boundary-aware \b so "đi" won't match "điều kiện")
    else {
      try {
        const escapedTone = qTone.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const boundaryRegex = new RegExp(`(^|[^a-z0-9à-ỹ])${escapedTone}([^a-z0-9à-ỹ]|$)`, 'i');
        if (boundaryRegex.test(meaningTone)) {
          meaningScore = 1000;
          if (!detectedType) detectedType = 'meaning_contains';
        }
      } catch (_) {}
    }

    // 2.5. Broad Substring match in meaning (only for queries with length >= 2 to avoid single-letter noise)
    if (meaningScore === 0 && qRaw.length >= 2) {
      if (meaningRaw.includes(qRaw)) {
        meaningScore = 400;
        if (!detectedType) detectedType = 'meaning_contains';
      } else if (meaningTone.includes(qTone)) {
        meaningScore = 350;
        if (!detectedType) detectedType = 'meaning_contains';
      } else if (qNoSpaceTone && meaningTone.replace(/\s+/g, '').includes(qNoSpaceTone)) {
        meaningScore = 300;
        if (!detectedType) detectedType = 'meaning_contains';
      }
    }
  }

  // ==========================================
  // 3. CROSS-SCRIPT & SECONDARY FIELDS BOOST
  // ==========================================
  // Han-Viet / English / Korean equivalent fields
  if (item.nghia_tieng_han || item.nghia_tieng_anh || item.phien_am_tieng_han) {
    const hanRaw = (item.nghia_tieng_han || '').toLowerCase();
    const hanTone = removeVietnameseTones(hanRaw);
    const engRaw = (item.nghia_tieng_anh || '').toLowerCase();
    const phienHanRaw = (item.phien_am_tieng_han || '').toLowerCase();
    const phienHanTone = removeVietnameseTones(phienHanRaw);

    if (
      hanRaw === qRaw ||
      hanTone === qTone ||
      engRaw === qRaw ||
      phienHanRaw === qRaw ||
      phienHanTone === qTone
    ) {
      wordScore = Math.max(wordScore, 1400);
      if (!detectedType) detectedType = 'exact_word';
    } else if (
      hanRaw.includes(qRaw) ||
      hanTone.includes(qTone) ||
      engRaw.includes(qRaw) ||
      phienHanTone.includes(qTone)
    ) {
      wordScore = Math.max(wordScore, 700);
    }
  }

  // Multi-token match across all fields (e.g. "bai 1 di dao")
  const tokens = qTone.split(/\s+/).filter(Boolean);
  if (wordScore === 0 && meaningScore === 0 && tokens.length > 1) {
    const combined = `${wordTone} ${meaningTone} ${phoneticRaw} ${removeVietnameseTones(item.bai_hoc || '')} ${removeVietnameseTones(item.chu_de || '')}`.toLowerCase();
    const allMatch = tokens.every((token) => combined.includes(token));
    if (allMatch) {
      meaningScore = 450;
      detectedType = 'multi_token';
    }
  }

  // Scope Filtering
  let finalScore = 0;
  if (scope === 'word') {
    finalScore = wordScore;
  } else if (scope === 'meaning') {
    finalScore = meaningScore;
  } else {
    // Both: Take the maximum score
    finalScore = Math.max(wordScore, meaningScore);
  }

  return {
    matches: finalScore > 0,
    score: finalScore,
    matchType: detectedType,
  };
}

/**
 * Finds the single best matching vocabulary item from a collection.
 * Returns null if no item achieves the minimum confidence threshold.
 */
export function findBestVocabularyMatch(
  words: VocabularyItem[],
  query: string,
  minScore = 700
): { item: VocabularyItem; score: number } | null {
  if (!words || words.length === 0 || !query || !query.trim()) return null;

  let bestItem: VocabularyItem | null = null;
  let bestScore = -1;

  for (const w of words) {
    const res = matchVocabulary(w, query, 'both');
    if (res.matches && res.score > bestScore) {
      bestScore = res.score;
      bestItem = w;
      if (bestScore >= 2000) break; // Perfect match found
    }
  }

  if (bestItem && bestScore >= minScore) {
    return { item: bestItem, score: bestScore };
  }
  return null;
}

/**
 * Intelligent matcher for grammar rules.
 * Strictly focused on:
 * 1. Grammar structure (cau_truc)
 * 2. Grammar explanation / meaning (giai_thich)
 */
export function matchGrammar(
  item: GrammarItem,
  query: string
): SearchMatchResult {
  const qRaw = query.trim().toLowerCase();
  if (!qRaw) return { matches: true, score: 0 };

  const qTone = removeVietnameseTones(qRaw).toLowerCase();
  const qClean = normalizeGrammarSyntax(qRaw);
  const qNoSpace = qRaw.replace(/[~–—\-()[\]{}«»"'/\\.,:;\s]/g, '');
  const tokens = qTone.split(/\s+/).filter(Boolean);

  const structRaw = (item.cau_truc || '').trim().toLowerCase();
  const structClean = normalizeGrammarSyntax(structRaw);
  const structTone = removeVietnameseTones(structRaw).toLowerCase();
  const structNoSpace = structRaw.replace(/[~–—\-()[\]{}«»"'/\\.,:;\s]/g, '');

  const explainRaw = (item.giai_thich || '').trim().toLowerCase();
  const explainTone = removeVietnameseTones(explainRaw).toLowerCase();
  const explainTokens = tokenizeMeaning(item.giai_thich || '');
  const explainTokensTone = explainTokens.map((t) => removeVietnameseTones(t).toLowerCase());

  let score = 0;

  // 1. Structure exact match
  if (structRaw === qRaw || structClean === qClean || structTone === qTone) {
    score = Math.max(score, 2000);
  } else if (structNoSpace === qNoSpace && qNoSpace.length > 0) {
    score = Math.max(score, 1800);
  }
  // 2. Structure starts with query
  else if (structRaw.startsWith(qRaw) || structClean.startsWith(qClean) || structTone.startsWith(qTone)) {
    score = Math.max(score, 1500);
  }
  // 3. Explanation exact or token match
  else if (explainRaw === qRaw || explainTone === qTone) {
    score = Math.max(score, 1400);
  } else if (explainTokens.includes(qRaw) || explainTokensTone.includes(qTone)) {
    score = Math.max(score, 1300);
  }
  // 4. Structure contains query
  else if (
    structRaw.includes(qRaw) ||
    structClean.includes(qClean) ||
    structTone.includes(qTone) ||
    (qNoSpace && structNoSpace.includes(qNoSpace))
  ) {
    score = Math.max(score, 1000);
  }
  // 5. Explanation contains query
  else if (explainRaw.includes(qRaw) || explainTone.includes(qTone)) {
    score = Math.max(score, 600);
  }

  // 6. Multi-token match across structure and explanation
  if (score === 0 && tokens.length > 1) {
    const combined = `${structTone} ${structClean} ${explainTone}`;
    const allMatch = tokens.every((token) => combined.includes(token));
    if (allMatch) {
      score = 450;
    }
  }

  return {
    matches: score > 0,
    score,
  };
}
