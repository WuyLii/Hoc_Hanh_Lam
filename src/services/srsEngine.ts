import { VocabularyItem } from '../types';

export type RecallQuality = 'again' | 'hard' | 'good' | 'easy';

/**
 * SuperMemo SM-2 Algorithm Implementation for Spaced Repetition
 */
export function calculateNextSRS(
  item: VocabularyItem,
  rating: RecallQuality
): {
  srs_box: number;
  srs_next_review: string;
  srs_interval: number;
  srs_ease: number;
  times_reviewed: number;
  times_correct: number;
} {
  let { srs_box = 0, srs_interval = 0, srs_ease = 2.5, times_reviewed = 0, times_correct = 0 } = item;

  times_reviewed += 1;

  // Numerical grade: Again=1, Hard=3, Good=4, Easy=5
  let grade = 4;
  if (rating === 'again') grade = 1;
  else if (rating === 'hard') grade = 3;
  else if (rating === 'good') grade = 4;
  else if (rating === 'easy') grade = 5;

  if (grade >= 3) {
    times_correct += 1;
  }

  // Update Ease Factor: EF' = EF + (0.1 - (5 - grade) * (0.08 + (5 - grade) * 0.02))
  srs_ease = srs_ease + (0.1 - (5 - grade) * (0.08 + (5 - grade) * 0.02));
  if (srs_ease < 1.3) srs_ease = 1.3;
  if (srs_ease > 3.0) srs_ease = 3.0;

  // Calculate Interval & Box level
  if (grade < 3) {
    // Reset to beginning on failure
    srs_box = 1;
    srs_interval = 1; // Review tomorrow
  } else {
    // Success
    if (srs_box === 0 || srs_interval === 0) {
      srs_interval = 1;
      srs_box = 1;
    } else if (srs_box === 1) {
      srs_interval = rating === 'easy' ? 4 : 2;
      srs_box = 2;
    } else if (srs_box === 2) {
      srs_interval = rating === 'easy' ? 7 : Math.round(srs_interval * srs_ease);
      srs_box = 3;
    } else {
      let multiplier = srs_ease;
      if (rating === 'easy') multiplier *= 1.3;
      if (rating === 'hard') multiplier *= 0.8;
      srs_interval = Math.max(srs_interval + 1, Math.round(srs_interval * multiplier));
      srs_box = Math.min(5, srs_box + 1);
    }
  }

  // Calculate Next Review Date
  const nextDate = new Date();
  nextDate.setDate(nextDate.getDate() + srs_interval);
  nextDate.setHours(0, 0, 0, 0);

  return {
    srs_box,
    srs_next_review: nextDate.toISOString(),
    srs_interval,
    srs_ease: Number(srs_ease.toFixed(2)),
    times_reviewed,
    times_correct,
  };
}

/**
 * Filter words due for review on or before today
 */
export function getDueWords(words: VocabularyItem[]): VocabularyItem[] {
  const now = new Date();
  now.setHours(23, 59, 59, 999);

  return words.filter((w) => {
    if (!w.srs_next_review) return true; // Brand new word
    const reviewDate = new Date(w.srs_next_review);
    return reviewDate <= now;
  });
}

/**
 * Categorize vocabulary memory retention
 */
export function categorizeRetention(words: VocabularyItem[]) {
  const mastered: VocabularyItem[] = [];
  const learning: VocabularyItem[] = [];
  const difficult: VocabularyItem[] = [];

  words.forEach((w) => {
    const accuracy = w.times_reviewed > 0 ? (w.times_correct / w.times_reviewed) : 0;
    if (w.srs_box >= 4 && accuracy >= 0.75) {
      mastered.push(w);
    } else if (w.srs_ease < 1.8 || (w.times_reviewed >= 3 && accuracy < 0.6)) {
      difficult.push(w);
    } else {
      learning.push(w);
    }
  });

  return {
    mastered,
    learning,
    difficult,
  };
}
