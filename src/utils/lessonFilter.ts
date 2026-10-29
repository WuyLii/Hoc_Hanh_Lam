import { VocabularyItem } from '../types';
import { matchVocabulary } from './searchHelper';

export interface NormalizedLesson {
  key: string;
  number: number | null;
  label: string;
  raw: string;
}

export interface LessonIndexItem {
  key: string;
  number: number | null;
  label: string;
  count: number;
  wordIds: string[];
}

export interface FilterCriteria {
  // Lessons
  lessons?: string[]; // Array of keys, e.g. ['lesson_1', 'lesson_12']
  lessonRange?: [number, number]; // [from, to] inclusive (e.g. [1, 5])
  selectedLesson?: string; // Backward compatibility for single key or label, e.g. 'lesson_1', 'Bài 1', 'ALL'

  // Today / Starred
  todayOnly?: boolean | 'today_only' | 'ALL';

  // Status / Retention
  wordStatus?: string; // 'ALL' | 'due' | 'new' | 'difficult' | 'mastered' | 'chua_danh_gia' | 'chua_thuoc' | 'quen' | 'hoi_nho' | 'nho'

  // Metadata filters
  pos?: string; // 'ALL' or specific
  topic?: string; // 'ALL' or specific
  level?: string; // 'ALL' or specific
  deckId?: string; // 'ALL' or specific
  deckWordIds?: string[]; // IDs belonging to active deck

  // Search
  searchKeyword?: string;

  // Output control
  shuffle?: boolean;
  limit?: number | string; // 'ALL' or number
}

/**
 * Remove Vietnamese and general diacritics for insensitive normalization
 */
function removeDiacritics(str: string): string {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D');
}

/**
 * Normalizes any raw lesson string into a canonical key, number, and human label.
 * Handles NFD/NFC, full-width punctuation, various language prefixes (Bài/Bai/Unit/Lesson/Lección/课/과).
 * Empty or null values become key "none" (Chưa phân bài), NEVER implicitly mapped to Bài 1.
 */
export function normalizeLesson(raw?: string | null): NormalizedLesson {
  if (!raw || typeof raw !== 'string') {
    return {
      key: 'none',
      number: null,
      label: 'Chưa phân bài',
      raw: raw || '',
    };
  }

  // Normalize to standard Unicode NFC and trim
  const cleanRaw = raw.normalize('NFC').trim();
  if (!cleanRaw || cleanRaw.toLowerCase() === 'none') {
    return {
      key: 'none',
      number: null,
      label: 'Chưa phân bài',
      raw: cleanRaw,
    };
  }

  // Handle canonical keys like "lesson_1", "lesson_12"
  if (cleanRaw.toLowerCase().startsWith('lesson_')) {
    const num = parseInt(cleanRaw.replace('lesson_', ''), 10);
    if (!isNaN(num)) {
      return {
        key: cleanRaw.toLowerCase(),
        number: num,
        label: `Bài ${num}`,
        raw: cleanRaw,
      };
    }
  }

  // Convert full-width punctuation and brackets to standard ASCII equivalents
  const standardized = cleanRaw
    .replace(/[\uFF1A\uFF1B]/g, ':') // Full-width colons
    .replace(/[\uFF0D\u2010-\u2015]/g, '-') // Full-width hyphens/dashes
    .replace(/[\uFF0E\u3002]/g, '.') // Full-width periods
    .replace(/[\uFF08\u3010\u3008]/g, '(') // Full-width open brackets
    .replace(/[\uFF09\u3011\u3009]/g, ')') // Full-width close brackets
    .replace(/\uFF0F/g, '/');

  // Strip diacritics for prefix regex matching
  const fold = removeDiacritics(standardized).toLowerCase();

  // 1. CJK Patterns: e.g. "第1课", "第01課", "제1과", "1과", "1课"
  const cjkMatch = standardized.match(/^(?:[第제])?\s*(\d+)\s*(?:[课課과화])\s*[:\-/.()]?\s*(.*)$/iu);
  if (cjkMatch) {
    const num = parseInt(cjkMatch[1], 10);
    let title = (cjkMatch[2] || '').trim();
    if (title.endsWith(')') && !title.includes('(')) {
      title = title.slice(0, -1).trim();
    }
    const label = title ? `Bài ${num}: ${title}` : `Bài ${num}`;
    return {
      key: `lesson_${num}`,
      number: num,
      label,
      raw: cleanRaw,
    };
  }

  // 2. Standard Western/Vietnamese prefixes:
  // "Bài 1", "Bai 01", "Unit 1", "Lesson 1", "Lección 1", "Chương 1", "#1"
  // Delimiters before title: colon, period, dash, parentheses, slash, or space
  const prefixMatch = fold.match(/^(?:(?:bai|unit|lesson|leccion|chuong|chapter|phan|part|session|section)\s*|#\s*)(\d+)(.*)$/i);
  if (prefixMatch) {
    const num = parseInt(prefixMatch[1], 10);
    // Extract title from original standardized string to preserve casing and accents
    const numStr = prefixMatch[1];
    const prefixTitleRegex = new RegExp(`^(?:(?:bai|unit|lesson|leccion|chuong|chapter|phan|part|session|section)\\s*|#\\s*)${numStr}\\s*[:\\-/.()]?\\s*(.*)$`, 'iu');
    const titleMatch = standardized.match(prefixTitleRegex);
    let title = titleMatch && titleMatch[1] ? titleMatch[1].trim() : '';
    if (title.endsWith(')') && !title.includes('(')) {
      title = title.slice(0, -1).trim();
    }
    const label = title ? `Bài ${num}: ${title}` : `Bài ${num}`;
    return {
      key: `lesson_${num}`,
      number: num,
      label,
      raw: cleanRaw,
    };
  }

  // 3. Leading digits (e.g. "1", "01", "1. Chào hỏi", "1: Gia đình", "1 - Mở đầu")
  const leadingDigitsMatch = standardized.match(/^(\d+)(.*)$/);
  if (leadingDigitsMatch) {
    const num = parseInt(leadingDigitsMatch[1], 10);
    let title = (leadingDigitsMatch[2] || '').replace(/^[\s:\-/.()]+/, '').trim();
    if (title.endsWith(')') && !title.includes('(')) {
      title = title.slice(0, -1).trim();
    }
    const label = title ? `Bài ${num}: ${title}` : `Bài ${num}`;
    return {
      key: `lesson_${num}`,
      number: num,
      label,
      raw: cleanRaw,
    };
  }

  // 4. Non-numbered custom lesson (e.g. "Kho từ cá nhân", "Từ vựng IELTS", "Giao tiếp cơ bản")
  const customKey = 'custom_' + removeDiacritics(standardized).toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');

  return {
    key: customKey || 'custom_other',
    number: null,
    label: cleanRaw,
    raw: cleanRaw,
  };
}

/**
 * Builds an aggregated, sorted lesson index from a list of vocabulary items.
 * Groups variations of the same lesson number (e.g. "Bài 1", "Bài 01", "Bài 1: Chào hỏi") under lesson_1.
 */
export function buildLessonIndex(words: VocabularyItem[]): LessonIndexItem[] {
  const map = new Map<string, { number: number | null; label: string; wordIds: string[]; priorityLabelCount: Map<string, number> }>();

  words.forEach((w) => {
    const norm = normalizeLesson(w.bai_hoc);
    const existing = map.get(norm.key);
    if (!existing) {
      const counts = new Map<string, number>();
      counts.set(norm.label, 1);
      map.set(norm.key, {
        number: norm.number,
        label: norm.label,
        wordIds: [w.word_id],
        priorityLabelCount: counts,
      });
    } else {
      existing.wordIds.push(w.word_id);
      const c = (existing.priorityLabelCount.get(norm.label) || 0) + 1;
      existing.priorityLabelCount.set(norm.label, c);
      // Pick the most common or descriptive label
      let maxCount = 0;
      let bestLabel = existing.label;
      existing.priorityLabelCount.forEach((cnt, lbl) => {
        if (cnt > maxCount || (cnt === maxCount && lbl.length > bestLabel.length)) {
          maxCount = cnt;
          bestLabel = lbl;
        }
      });
      existing.label = bestLabel;
    }
  });

  const items: LessonIndexItem[] = Array.from(map.entries()).map(([key, data]) => ({
    key,
    number: data.number,
    label: data.label,
    count: data.wordIds.length,
    wordIds: data.wordIds,
  }));

  // Sort order:
  // 1. Numbered lessons in ascending numerical order (Bài 1, Bài 2, ...)
  // 2. Custom text lessons alphabetically
  // 3. "none" (Chưa phân bài) at the very bottom
  items.sort((a, b) => {
    if (a.key === 'none') return 1;
    if (b.key === 'none') return -1;

    if (a.number !== null && b.number !== null) {
      return a.number - b.number;
    }
    if (a.number !== null) return -1;
    if (b.number !== null) return 1;

    return a.label.localeCompare(b.label, 'vi', { numeric: true });
  });

  return items;
}

/**
 * Single-pass filter for vocabulary items supporting all criteria.
 * Order: Filter -> Shuffle (if requested) -> Limit (if requested).
 */
export function filterWords(words: VocabularyItem[], criteria: FilterCriteria = {}): VocabularyItem[] {
  const {
    lessons,
    lessonRange,
    selectedLesson,
    todayOnly,
    wordStatus,
    pos,
    topic,
    level,
    deckId,
    deckWordIds,
    searchKeyword,
    shuffle = false,
    limit,
  } = criteria;

  // Pre-process lesson filters for fast O(1) checks
  const targetLessonKeys = new Set<string>();
  if (Array.isArray(lessons) && lessons.length > 0 && !lessons.includes('ALL')) {
    lessons.forEach((l) => targetLessonKeys.add(l));
  } else if (selectedLesson && selectedLesson !== 'ALL') {
    // selectedLesson could be a key ('lesson_1') or a raw label ('Bài 1')
    const parsed = normalizeLesson(selectedLesson);
    targetLessonKeys.add(parsed.key);
    // Also add the exact value just in case
    targetLessonKeys.add(selectedLesson);
  }

  const hasLessonFilter = targetLessonKeys.size > 0;
  const hasRangeFilter = Boolean(lessonRange && lessonRange.length === 2 && (lessonRange[0] > 0 || lessonRange[1] > 0));
  const rangeMin = hasRangeFilter && lessonRange ? Math.min(lessonRange[0], lessonRange[1]) : 0;
  const rangeMax = hasRangeFilter && lessonRange ? Math.max(lessonRange[0], lessonRange[1]) : Infinity;

  const isTodayActive = todayOnly === true || todayOnly === 'today_only';
  const hasDeckFilter = deckId && deckId !== 'ALL' && Array.isArray(deckWordIds);
  const deckSet = hasDeckFilter ? new Set(deckWordIds) : null;
  const cleanSearch = searchKeyword ? searchKeyword.trim().toLowerCase() : '';

  const now = new Date();

  // 1. Single-pass Filter
  const filtered = words.filter((w) => {
    // Lesson Filter
    if (hasLessonFilter || hasRangeFilter) {
      const norm = normalizeLesson(w.bai_hoc);

      if (hasLessonFilter) {
        if (!targetLessonKeys.has(norm.key) && !targetLessonKeys.has(w.bai_hoc || '')) {
          return false;
        }
      }

      if (hasRangeFilter) {
        if (norm.number === null || norm.number < rangeMin || norm.number > rangeMax) {
          return false;
        }
      }
    }

    // Today / Starred filter
    if (isTodayActive) {
      const isStarred = Boolean(w.is_added_today_flashcard || (w as any).is_starred);
      if (!isStarred) return false;
    }

    // Word Status / Retention / SRS filter
    if (wordStatus && wordStatus !== 'ALL') {
      const retLevel = w.retention_level || 'chua_danh_gia';
      if (wordStatus === 'due') {
        const isDue = !w.srs_next_review || new Date(w.srs_next_review) <= now || w.srs_box === 0;
        if (!isDue) return false;
      } else if (wordStatus === 'new') {
        if (w.srs_box !== 0 && w.times_reviewed) return false;
      } else if (wordStatus === 'difficult') {
        const isDifficult = (w.times_reviewed > 0 && w.times_correct / w.times_reviewed < 0.6) || w.srs_box <= 1;
        if (!isDifficult) return false;
      } else if (wordStatus === 'mastered') {
        if ((w.srs_box || 0) < 4) return false;
      } else {
        if (retLevel !== wordStatus) return false;
      }
    }

    // Part of speech
    if (pos && pos !== 'ALL' && w.loai_tu !== pos) {
      return false;
    }

    // Topic / Context
    if (topic && topic !== 'ALL' && w.chu_de !== topic) {
      return false;
    }

    // Level
    if (level && level !== 'ALL') {
      const matchesLevel =
        w.cap_do === level ||
        (w.cap_do && (w.cap_do.toLowerCase().includes(level.toLowerCase()) || level.toLowerCase().includes(w.cap_do.toLowerCase())));
      if (!matchesLevel) return false;
    }

    // Deck
    if (deckSet && !deckSet.has(w.word_id)) {
      return false;
    }

    // Search Keyword
    if (cleanSearch) {
      const match = matchVocabulary(w, cleanSearch, 'both');
      if (!match.matches) return false;
      (w as any)._searchScore = match.score;
    }

    return true;
  });

  // 2. Sort by relevance if search query is active, or Shuffle (if requested)
  let result = filtered;
  if (shuffle) {
    result = [...filtered].sort(() => Math.random() - 0.5);
  } else if (cleanSearch) {
    result = [...filtered].sort((a, b) => ((b as any)._searchScore || 0) - ((a as any)._searchScore || 0));
  }

  // 3. Limit (if specified)
  if (limit && limit !== 'ALL') {
    const limNum = typeof limit === 'number' ? limit : parseInt(limit, 10);
    if (!isNaN(limNum) && limNum > 0) {
      result = result.slice(0, limNum);
    }
  }

  return result;
}

/**
 * Backward compatibility wrapper: returns true if wordLesson matches filterLesson.
 */
export function isLessonMatch(wordLesson?: string | null, filterLesson?: string | null): boolean {
  if (!filterLesson || filterLesson === 'ALL') return true;

  const wNorm = normalizeLesson(wordLesson);
  const fNorm = normalizeLesson(filterLesson);

  // Both match same canonical key (e.g. lesson_1 === lesson_1)
  if (wNorm.key === fNorm.key) return true;

  // Direct raw equality
  if ((wordLesson || '').trim().toLowerCase() === filterLesson.trim().toLowerCase()) return true;

  return false;
}
