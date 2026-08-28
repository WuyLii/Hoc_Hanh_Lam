import { VocabularyItem, GrammarItem, Deck } from '../types';

export function cleanDeduplicateVocab(items: VocabularyItem[]): VocabularyItem[] {
  if (!Array.isArray(items)) return [];
  const map = new Map<string, VocabularyItem>();

  items.forEach((item) => {
    if (!item) return;
    const wordKey = (item.tu || '').trim().toLowerCase();
    const meaningKey = (item.nghia || '').trim().toLowerCase();
    const langKey = (item.ngon_ngu || 'ko').trim().toLowerCase();

    if (!wordKey) return;

    // Canonical key combines language, word, and meaning
    const canonicalKey = `${langKey}:${wordKey}:${meaningKey}`;

    if (!map.has(canonicalKey)) {
      map.set(canonicalKey, {
        ...item,
        tu: (item.tu || '').trim(),
        nghia: (item.nghia || '').trim(),
        word_id: item.word_id || `w_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      });
    } else {
      // Merge properties if duplicate exists, retaining SRS stats if higher
      const existing = map.get(canonicalKey)!;
      map.set(canonicalKey, {
        ...existing,
        ...item,
        word_id: existing.word_id || item.word_id,
        phien_am: item.phien_am || existing.phien_am || '',
        loai_tu: item.loai_tu || existing.loai_tu || 'Từ vựng',
        vi_du: item.vi_du || existing.vi_du || '',
        vi_du_dich: item.vi_du_dich || existing.vi_du_dich || '',
        chu_de: item.chu_de || existing.chu_de || 'Tổng hợp',
        cap_do: item.cap_do || existing.cap_do || 'Cơ bản',
        srs_box: Math.max(existing.srs_box || 0, item.srs_box || 0),
        times_reviewed: (existing.times_reviewed || 0) + (item.times_reviewed || 0),
      });
    }
  });

  return Array.from(map.values());
}

export function cleanDeduplicateGrammar(items: GrammarItem[]): GrammarItem[] {
  if (!Array.isArray(items)) return [];
  const map = new Map<string, GrammarItem>();

  items.forEach((item) => {
    if (!item) return;
    const structKey = (item.cau_truc || '').trim().toLowerCase();
    const meaningKey = (item.giai_thich || '').trim().toLowerCase();
    const langKey = (item.ngon_ngu || 'ko').trim().toLowerCase();

    if (!structKey) return;

    const canonicalKey = `${langKey}:${structKey}:${meaningKey}`;

    if (!map.has(canonicalKey)) {
      map.set(canonicalKey, {
        ...item,
        cau_truc: (item.cau_truc || '').trim(),
        grammar_id: item.grammar_id || `g_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      });
    } else {
      const existing = map.get(canonicalKey)!;
      map.set(canonicalKey, {
        ...existing,
        ...item,
        grammar_id: existing.grammar_id || item.grammar_id,
      });
    }
  });

  return Array.from(map.values());
}

export function cleanDeduplicateDecks(items: Deck[]): Deck[] {
  if (!Array.isArray(items)) return [];
  const map = new Map<string, Deck>();

  items.forEach((d) => {
    if (!d) return;
    const nameKey = (d.ten_bo || '').trim().toLowerCase();
    const langKey = (d.ngon_ngu || 'ko').trim().toLowerCase();
    const key = d.deck_id || `${langKey}:${nameKey}`;
    if (!map.has(key)) {
      map.set(key, d);
    }
  });

  return Array.from(map.values());
}
