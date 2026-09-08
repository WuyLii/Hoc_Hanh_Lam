import { VocabularyItem, GrammarItem, Deck } from '../types';

export function cleanDeduplicateVocab(items: VocabularyItem[]): VocabularyItem[] {
  if (!Array.isArray(items)) return [];
  const map = new Map<string, VocabularyItem>();

  items.forEach((item) => {
    if (!item) return;
    const wordKey = (item.tu || '').trim().toLowerCase();
    const langKey = (item.ngon_ngu || 'ko').trim().toLowerCase();

    if (!wordKey) return;

    // Canonical key uniquely identifies word in language: langKey:wordKey
    const canonicalKey = `${langKey}:${wordKey}`;

    if (!map.has(canonicalKey)) {
      map.set(canonicalKey, {
        ...item,
        tu: (item.tu || '').trim(),
        nghia: (item.nghia || '').trim(),
        word_id: item.word_id || `w_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      });
    } else {
      // Merge properties if duplicate exists, retaining highest SRS and richer fields
      const existing = map.get(canonicalKey)!;
      const existingSrs = existing.srs_box || 0;
      const incomingSrs = item.srs_box || 0;

      const primary = incomingSrs >= existingSrs ? item : existing;
      const secondary = incomingSrs >= existingSrs ? existing : item;

      // Merge meaning if distinct
      let mergedNghia = (existing.nghia || '').trim();
      const incomingNghia = (item.nghia || '').trim();
      if (!mergedNghia) {
        mergedNghia = incomingNghia;
      } else if (incomingNghia && !mergedNghia.toLowerCase().includes(incomingNghia.toLowerCase())) {
        mergedNghia = `${mergedNghia}, ${incomingNghia}`;
      }

      map.set(canonicalKey, {
        ...secondary,
        ...primary,
        word_id: primary.word_id || existing.word_id || item.word_id,
        tu: (primary.tu || existing.tu || '').trim(),
        nghia: mergedNghia,
        phien_am: primary.phien_am || secondary.phien_am || '',
        loai_tu: primary.loai_tu || secondary.loai_tu || 'Từ vựng',
        vi_du: (primary.vi_du && primary.vi_du.length > 5) ? primary.vi_du : (secondary.vi_du || primary.vi_du || ''),
        vi_du_dich: (primary.vi_du_dich && primary.vi_du_dich.length > 3) ? primary.vi_du_dich : (secondary.vi_du_dich || primary.vi_du_dich || ''),
        nghia_tieng_han: primary.nghia_tieng_han || secondary.nghia_tieng_han || '',
        nghia_tieng_anh: primary.nghia_tieng_anh || secondary.nghia_tieng_anh || '',
        phien_am_tieng_han: primary.phien_am_tieng_han || secondary.phien_am_tieng_han || '',
        chu_de: primary.chu_de || secondary.chu_de || 'Tổng hợp',
        cap_do: primary.cap_do || secondary.cap_do || 'Cơ bản',
        srs_box: Math.max(existingSrs, incomingSrs),
        times_reviewed: (existing.times_reviewed || 0) + (item.times_reviewed || 0),
        times_correct: (existing.times_correct || 0) + (item.times_correct || 0),
        last_reviewed: primary.last_reviewed || secondary.last_reviewed || null,
        created_at: existing.created_at || item.created_at || new Date().toISOString(),
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
    const langKey = (item.ngon_ngu || 'ko').trim().toLowerCase();

    if (!structKey) return;

    const canonicalKey = `${langKey}:${structKey}`;

    if (!map.has(canonicalKey)) {
      map.set(canonicalKey, {
        ...item,
        cau_truc: (item.cau_truc || '').trim(),
        grammar_id: item.grammar_id || `g_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      });
    } else {
      const existing = map.get(canonicalKey)!;
      let mergedGiaiThich = (existing.giai_thich || '').trim();
      const incomingGiaiThich = (item.giai_thich || '').trim();
      if (!mergedGiaiThich) {
        mergedGiaiThich = incomingGiaiThich;
      } else if (incomingGiaiThich && !mergedGiaiThich.toLowerCase().includes(incomingGiaiThich.toLowerCase())) {
        mergedGiaiThich = `${mergedGiaiThich}; ${incomingGiaiThich}`;
      }

      map.set(canonicalKey, {
        ...existing,
        ...item,
        grammar_id: existing.grammar_id || item.grammar_id,
        giai_thich: mergedGiaiThich,
        vi_du: item.vi_du || existing.vi_du || '',
        vi_du_dich: item.vi_du_dich || existing.vi_du_dich || '',
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
