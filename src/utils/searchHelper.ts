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

/**
 * Detects whether a string contains Vietnamese diacritics / tone marks
 * (e.g. "Bạn", "học", "cà phê" -> true; "ban", "hoc", "sarang" -> false)
 */
export function hasDiacritics(str: string): boolean {
  if (!str) return false;
  return /[àáảãạăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđĐ]/.test(str);
}

/**
 * Extracts distinct individual word tokens from text.
 * Handles punctuation, spaces, commas, slashes, brackets, hyphens.
 */
export function extractWords(text: string): string[] {
  if (!text) return [];
  return text
    .normalize('NFC')
    .toLowerCase()
    .split(/[^a-z0-9àáảãạăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđ\uAC00-\uD7AF\u1100-\u11FF\u3130-\u318F\u4E00-\u9FFF]+/)
    .filter(Boolean);
}

export type VocabSearchScope = 'both' | 'word' | 'meaning';

export interface SearchMatchResult {
  matches: boolean;
  score: number;
  matchType?: 'exact_word' | 'exact_meaning' | 'word_prefix' | 'word_stem' | 'meaning_token' | 'phonetic' | 'chosung' | 'word_contains' | 'meaning_starts' | 'meaning_contains' | 'multi_token';
}

/**
 * Ultra-intelligent matcher for vocabulary strictly searching ONLY word (`tu`) and meaning (`nghia`).
 *
 * Rules:
 * 1. Dấu (Diacritics): If query has diacritics (e.g. "Bạn"), match MUST strictly respect accents!
 *    "bạn" will NEVER match "bàn", "bán", "bản", "bảng", "ban".
 * 2. Thứ tự xuất hiện: Multi-word queries match in ANY order (e.g. "thân bạn" matches "người bạn thân").
 * 3. Viết hoa / thường: Case-insensitive everywhere ("Bạn" === "bạn" === "BẠN").
 * 4. Phạm vi: CHỈ tìm từ (`tu`) hoặc nghĩa của từ (`nghia`). Không tìm chủ đề hay ví dụ.
 */
export function matchVocabulary(
  item: VocabularyItem,
  query: string,
  scope: VocabSearchScope = 'both'
): SearchMatchResult {
  if (!query || !query.trim()) {
    return { matches: true, score: 0 };
  }

  // Normalize Unicode NFC and lowercase
  const qClean = query.trim().normalize('NFC').toLowerCase();
  const qHasAccents = hasDiacritics(qClean);
  const qWords = extractWords(qClean);

  if (qWords.length === 0 && qClean.length === 0) {
    return { matches: true, score: 0 };
  }

  const wordRaw = (item.tu || '').trim().normalize('NFC').toLowerCase();
  const wordWords = extractWords(wordRaw);

  const meaningRaw = (item.nghia || '').trim().normalize('NFC').toLowerCase();
  const meaningTokens = tokenizeMeaning(item.nghia || '').map((t) => t.normalize('NFC'));
  const meaningWords = extractWords(meaningRaw);

  let wordScore = 0;
  let meaningScore = 0;
  let detectedType: SearchMatchResult['matchType'] = undefined;

  // ==========================================
  // 1. MATCH ON WORD (item.tu) - ONLY if scope is 'word' or 'both'
  // ==========================================
  if (scope !== 'meaning' && wordRaw) {
    // 1.1. Exact Match on word
    if (wordRaw === qClean) {
      wordScore = 2000;
      detectedType = 'exact_word';
    }
    // 1.2. Verb stem (Korean e.g. "가" -> "가다", "먹" -> "먹다", "공부" -> "공부하다")
    else if (
      (wordRaw.endsWith('다') && wordRaw.slice(0, -1) === qClean) ||
      (wordRaw.endsWith('하다') && wordRaw.slice(0, -2) === qClean)
    ) {
      wordScore = 1750;
      detectedType = 'word_stem';
    }
    // 1.3. Multi-word any-order match on word (e.g. "out go" matches "go out")
    else if (
      qWords.length > 1 &&
      qWords.every((qw) => wordWords.some((ww) => ww === qw || ww.startsWith(qw)))
    ) {
      wordScore = 1700;
      detectedType = 'multi_token';
    }
    // 1.4. Word starts with query
    else if (wordRaw.startsWith(qClean)) {
      wordScore = 1500;
      detectedType = 'word_prefix';
    }
    // 1.5. Hangul Chosung match (e.g. "ㅎㄱ" -> "한국")
    else if (getHangulChosung(wordRaw).startsWith(qClean)) {
      wordScore = 1300;
      detectedType = 'chosung';
    }
    // 1.6. Romaja / Phonetic match on word (e.g. query "chingu" -> phien_am "chin-gu")
    else if (item.phien_am) {
      const phoneticClean = cleanPhonetic(item.phien_am);
      const phoneticWords = extractWords(phoneticClean);
      if (phoneticClean === qClean || phoneticWords.includes(qClean)) {
        wordScore = 1350;
        detectedType = 'phonetic';
      } else if (phoneticClean.startsWith(qClean)) {
        wordScore = 1200;
        detectedType = 'phonetic';
      }
    }
    // 1.7. Word contains query as whole token or substring
    else if (wordWords.includes(qClean)) {
      wordScore = 1200;
      detectedType = 'word_contains';
    } else if (qClean.length >= 2 && wordRaw.includes(qClean)) {
      wordScore = 900;
      detectedType = 'word_contains';
    }
  }

  // ==========================================
  // 2. MATCH ON MEANING (item.nghia) - ONLY if scope is 'meaning' or 'both'
  // ==========================================
  if (scope !== 'word' && meaningRaw) {
    if (qHasAccents) {
      // -------------------------------------------------------------------
      // 2A. ACCENT-SENSITIVE MODE (User typed "Bạn", "học", "cà phê", "đi")
      // Strictly respect diacritics! NEVER match against stripped tones!
      // -------------------------------------------------------------------

      // 2A.1. Exact Full Meaning Match
      if (meaningRaw === qClean) {
        meaningScore = 2000;
        if (!detectedType) detectedType = 'exact_meaning';
      }
      // 2A.2. Exact Meaning Token Match (e.g. "đi, bước đi" -> token "đi" matches)
      else if (meaningTokens.includes(qClean)) {
        meaningScore = 1800;
        if (!detectedType) detectedType = 'meaning_token';
      }
      // 2A.3. Multi-word Order-Invariant Match
      // User typed multiple words with accents, e.g. "thân bạn" or "bạn thân"
      // Every query word must exist in meaningWords, in ANY order!
      else if (
        qWords.length > 1 &&
        qWords.every((qw) => meaningWords.includes(qw))
      ) {
        const isContiguous = meaningRaw.includes(qClean);
        meaningScore = isContiguous ? 1800 : 1650;
        if (!detectedType) detectedType = 'multi_token';
      }
      // 2A.4. Single word exact word token in meaning
      // (e.g. query "bạn" -> meaning "người bạn thân", word "bạn" is an exact word token)
      else if (qWords.length === 1 && meaningWords.includes(qWords[0])) {
        meaningScore = 1600;
        if (!detectedType) detectedType = 'meaning_token';
      }
      // 2A.5. Meaning Token Starts With query at word boundary
      // (e.g. query "bạn" -> meaning token "bạn bè" starts with "bạn ")
      else if (meaningTokens.some((t) => t.startsWith(qClean + ' '))) {
        meaningScore = 1500;
        if (!detectedType) detectedType = 'meaning_starts';
      }
      // 2A.6. Whole-word boundary regex match with exact accents
      else {
        try {
          const escaped = qClean.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          const boundaryRegex = new RegExp(`(^|[^a-z0-9àáảãạăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđ])${escaped}([^a-z0-9àáảãạăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđ]|$)`, 'i');
          if (boundaryRegex.test(meaningRaw)) {
            meaningScore = 1200;
            if (!detectedType) detectedType = 'meaning_contains';
          }
        } catch (_) {}
      }
    } else {
      // -------------------------------------------------------------------
      // 2B. UNACCENTED MODE (User typed "ban", "di", "hoc" without diacritics)
      // -------------------------------------------------------------------
      const qTone = removeVietnameseTones(qClean).toLowerCase();
      const meaningTone = removeVietnameseTones(meaningRaw).toLowerCase();
      const meaningToneWords = extractWords(meaningTone);
      const meaningTokensTone = meaningTokens.map((t) => removeVietnameseTones(t).toLowerCase());

      // 2B.1. Exact Unaccented Full Meaning Match
      if (meaningRaw === qClean) {
        meaningScore = 1900;
        if (!detectedType) detectedType = 'exact_meaning';
      } else if (meaningTone === qTone) {
        meaningScore = 1700;
        if (!detectedType) detectedType = 'exact_meaning';
      }
      // 2B.2. Exact Meaning Token Match (e.g. "ban đêm" for query "ban")
      else if (meaningTokens.includes(qClean)) {
        meaningScore = 1650;
        if (!detectedType) detectedType = 'meaning_token';
      } else if (meaningTokensTone.includes(qTone)) {
        meaningScore = 1500;
        if (!detectedType) detectedType = 'meaning_token';
      }
      // 2B.3. Multi-word Order-Invariant Match (unaccented)
      // e.g. "than ban" matches "nguoi ban than"
      else if (
        qWords.length > 1 &&
        qWords.every((qw) => meaningToneWords.includes(qw))
      ) {
        const isContiguous = meaningTone.includes(qTone);
        meaningScore = isContiguous ? 1550 : 1400;
        if (!detectedType) detectedType = 'multi_token';
      }
      // 2B.4. Single unaccented word token match
      else if (qWords.length === 1 && meaningToneWords.includes(qWords[0])) {
        meaningScore = 1350;
        if (!detectedType) detectedType = 'meaning_token';
      }
      // 2B.5. Token starts with unaccented query at word boundary
      else if (meaningTokensTone.some((t) => t.startsWith(qTone + ' '))) {
        meaningScore = 1200;
        if (!detectedType) detectedType = 'meaning_starts';
      }
      // 2B.6. Whole word boundary match unaccented
      else {
        try {
          const escapedTone = qTone.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          const boundaryRegex = new RegExp(`(^|[^a-z0-9])${escapedTone}([^a-z0-9]|$)`, 'i');
          if (boundaryRegex.test(meaningTone)) {
            meaningScore = 900;
            if (!detectedType) detectedType = 'meaning_contains';
          }
        } catch (_) {}
      }
    }
  }

  // Final score based on requested scope
  let finalScore = 0;
  if (scope === 'word') {
    finalScore = wordScore;
  } else if (scope === 'meaning') {
    finalScore = meaningScore;
  } else {
    // Both: take max
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
