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
}

/**
 * Intelligent matcher for vocabulary items.
 * STRICTLY focused on:
 * 1. Word (tu)
 * 2. Word meaning (nghia)
 *
 * DOES NOT match against examples (vi_du), example translations (vi_du_dich),
 * notes, tags, or any other fields.
 */
export function matchVocabulary(
  item: VocabularyItem,
  query: string,
  scope: VocabSearchScope = 'both'
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
  const wordNoSpaceTone = wordTone.replace(/\s+/g, '');

  const meaningRaw = (item.nghia || '').trim().toLowerCase();
  const meaningTone = removeVietnameseTones(meaningRaw);
  const meaningNoSpace = meaningTone.replace(/\s+/g, '');

  // Helper: check if query matches word
  const checkWordMatch = (): number => {
    if (!wordRaw) return 0;
    if (wordRaw === qRaw || wordTone === qTone) return 100; // Exact match
    if (wordRaw.startsWith(qRaw) || wordTone.startsWith(qTone)) return 85; // Starts with
    if (wordRaw.includes(qRaw) || wordTone.includes(qTone)) return 70; // Substring
    if (qNoSpace && (wordNoSpace.includes(qNoSpace) || wordNoSpaceTone.includes(qNoSpaceTone))) return 65; // No-space match
    return 0;
  };

  // Helper: check if query matches meaning
  const checkMeaningMatch = (): number => {
    if (!meaningRaw) return 0;
    if (meaningRaw === qRaw || meaningTone === qTone) return 90; // Exact match
    if (meaningRaw.startsWith(qRaw) || meaningTone.startsWith(qTone)) return 75; // Starts with
    if (meaningRaw.includes(qRaw) || meaningTone.includes(qTone)) return 55; // Substring
    if (qNoSpaceTone && meaningNoSpace.includes(qNoSpaceTone)) return 50; // No-space match
    return 0;
  };

  // Scope: 'word' (Chỉ từ)
  if (scope === 'word') {
    const score = checkWordMatch();
    return { matches: score > 0, score };
  }

  // Scope: 'meaning' (Chỉ nghĩa của từ)
  if (scope === 'meaning') {
    const score = checkMeaningMatch();
    return { matches: score > 0, score };
  }

  // Scope: 'both' (Từ HOẶC Nghĩa của từ - CHỈ 2 trường này)
  let score = 0;
  const wordScore = checkWordMatch();
  const meaningScore = checkMeaningMatch();

  score = Math.max(wordScore, meaningScore);

  // Multi-token match across word and meaning only
  if (score === 0 && tokens.length > 1) {
    const combinedTone = `${wordTone} ${meaningTone}`;
    const allTokensMatch = tokens.every((token) => combinedTone.includes(token));
    if (allTokensMatch) {
      score = 40;
    }
  }

  return {
    matches: score > 0,
    score,
  };
}

/**
 * Intelligent matcher for grammar rules.
 * STRICTLY focused on:
 * 1. Grammar structure (cau_truc)
 * 2. Grammar explanation / meaning (giai_thich)
 *
 * DOES NOT match against examples (vi_du), example translations (vi_du_dich),
 * notes (ghi_chu), tags, or level.
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
  const explainNoSpace = explainTone.replace(/\s+/g, '');

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

  // 4. Explanation / meaning of grammar contains query
  if (explainRaw === qRaw || explainTone === qTone) {
    score = Math.max(score, 90);
  } else if (explainRaw.startsWith(qRaw) || explainTone.startsWith(qTone)) {
    score = Math.max(score, 70);
  } else if (explainRaw.includes(qRaw) || explainTone.includes(qTone) || (qNoSpaceTone && explainNoSpace.includes(qNoSpaceTone))) {
    score = Math.max(score, 55);
  }

  // 5. Multi-token match across structure and explanation ONLY
  if (score === 0 && tokens.length > 1) {
    const combined = `${structTone} ${structClean} ${explainTone}`;
    const allMatch = tokens.every((token) => combined.includes(token));
    if (allMatch) {
      score = 35;
    }
  }

  return {
    matches: score > 0,
    score,
  };
}
