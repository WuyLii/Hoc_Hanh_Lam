import { VocabularyItem, GrammarItem, Deck } from '../types';

/**
 * Normalizes and strips duplicate sub-phrases from word meanings.
 * Eliminates repeating chains like "Vận động, Vận động, Tập luyện thể thao, Vận động..."
 */
export function sanitizeAndDeduplicateMeaning(rawMeaning: string): string {
  if (!rawMeaning || typeof rawMeaning !== 'string') return '';

  // Split on common delimiters: comma, semicolon, slash, newline, bullet, pipe
  const tokens = rawMeaning
    .split(/[,;\/\n\r•|]+/)
    .map((t) => t.trim().replace(/^[-–—\s]+/, '').replace(/[-–—\s]+$/, ''))
    .filter((t) => t.length > 0);

  if (tokens.length === 0) return '';

  const seen = new Set<string>();
  const uniqueList: string[] = [];

  for (const token of tokens) {
    // Normalize string for comparison: lowercase, trim, collapse spaces
    const normalized = token.toLowerCase().replace(/\s+/g, ' ').trim();
    if (!normalized || seen.has(normalized)) continue;

    // Check if identical or subsumed by existing token (e.g. "vận động" vs "vận động")
    const isRedundant = uniqueList.some((existing) => {
      const exNorm = existing.toLowerCase().replace(/\s+/g, ' ').trim();
      return exNorm === normalized;
    });

    if (!isRedundant) {
      seen.add(normalized);
      uniqueList.push(token);
    }
  }

  // Cap at 4 most concise and relevant meanings
  return uniqueList.slice(0, 4).join(', ');
}

/**
 * Merges two meanings safely without ever creating duplicate chains
 */
export function mergeMeanings(meaningA: string, meaningB: string): string {
  const cleanA = sanitizeAndDeduplicateMeaning(meaningA);
  const cleanB = sanitizeAndDeduplicateMeaning(meaningB);
  if (!cleanA) return cleanB;
  if (!cleanB) return cleanA;
  return sanitizeAndDeduplicateMeaning(`${cleanA}, ${cleanB}`);
}

/**
 * Normalizes and deduplicates grammar explanations
 */
export function sanitizeAndDeduplicateGrammarExplanation(raw: string): string {
  if (!raw || typeof raw !== 'string') return '';
  const tokens = raw
    .split(/;\s*|\n+/)
    .map((t) => t.trim())
    .filter((t) => t.length > 0);
  
  if (tokens.length === 0) return '';
  const seen = new Set<string>();
  const uniqueList: string[] = [];

  for (const token of tokens) {
    const norm = token.toLowerCase().replace(/\s+/g, ' ').trim();
    if (!norm || seen.has(norm)) continue;
    seen.add(norm);
    uniqueList.push(token);
  }

  return uniqueList.slice(0, 3).join('; ');
}

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
    const cleanNghia = sanitizeAndDeduplicateMeaning(item.nghia || '');
    const cleanNghiaHan = sanitizeAndDeduplicateMeaning(item.nghia_tieng_han || '');
    const cleanNghiaAnh = sanitizeAndDeduplicateMeaning(item.nghia_tieng_anh || '');

    if (!map.has(canonicalKey)) {
      map.set(canonicalKey, {
        ...item,
        tu: (item.tu || '').trim(),
        nghia: cleanNghia,
        nghia_tieng_han: cleanNghiaHan,
        nghia_tieng_anh: cleanNghiaAnh,
        word_id: item.word_id || `w_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      });
    } else {
      // Merge properties if duplicate exists, retaining highest SRS and richer fields
      const existing = map.get(canonicalKey)!;
      const existingSrs = existing.srs_box || 0;
      const incomingSrs = item.srs_box || 0;

      const primary = incomingSrs >= existingSrs ? item : existing;
      const secondary = incomingSrs >= existingSrs ? existing : item;

      // Smart merge meanings without duplicate loops
      const mergedNghia = mergeMeanings(existing.nghia || '', item.nghia || '');
      const mergedNghiaHan = mergeMeanings(existing.nghia_tieng_han || '', item.nghia_tieng_han || '');
      const mergedNghiaAnh = mergeMeanings(existing.nghia_tieng_anh || '', item.nghia_tieng_anh || '');

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
        nghia_tieng_han: mergedNghiaHan,
        nghia_tieng_anh: mergedNghiaAnh,
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

/**
 * Normalizes grammar structure keys for robust duplicate comparison
 * Example: "-아/어요" -> "아/어요", "V + (으)ㄹ 거예요" -> "v+(으)ㄹ거예요"
 */
export function normalizeGrammarKey(rawStructure: string): string {
  if (!rawStructure || typeof rawStructure !== 'string') return '';
  return rawStructure
    .toLowerCase()
    .replace(/^[-–—~.\s]+/, '')
    .replace(/[-–—~.\s]+$/, '')
    .replace(/\s*\+\s*/g, '+')
    .replace(/\s+/g, ' ')
    .trim();
}

export function cleanDeduplicateGrammar(items: GrammarItem[]): GrammarItem[] {
  if (!Array.isArray(items)) return [];
  const map = new Map<string, GrammarItem>();

  items.forEach((item) => {
    if (!item) return;
    const structKey = normalizeGrammarKey(item.cau_truc || '');
    const langKey = (item.ngon_ngu || 'ko').trim().toLowerCase();

    if (!structKey) return;

    const canonicalKey = `${langKey}:${structKey}`;
    const cleanGiaiThich = sanitizeAndDeduplicateGrammarExplanation(item.giai_thich || '');

    if (!map.has(canonicalKey)) {
      map.set(canonicalKey, {
        ...item,
        cau_truc: (item.cau_truc || '').trim(),
        giai_thich: cleanGiaiThich,
        grammar_id: item.grammar_id || `gr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      });
    } else {
      const existing = map.get(canonicalKey)!;
      const combinedGiaiThich = [existing.giai_thich, item.giai_thich].filter(Boolean).join('; ');
      const mergedGiaiThich = sanitizeAndDeduplicateGrammarExplanation(combinedGiaiThich);
      
      // Preserve richest example & example translation
      const bestExample = (item.vi_du && item.vi_du.length > 5) ? item.vi_du : (existing.vi_du || item.vi_du || '');
      const bestExampleVi = (item.vi_du_dich && item.vi_du_dich.length > 3) ? item.vi_du_dich : (existing.vi_du_dich || item.vi_du_dich || '');
      const mergedTags = Array.from(new Set([...(existing.tags || []), ...(item.tags || [])]));

      map.set(canonicalKey, {
        ...existing,
        ...item,
        grammar_id: existing.grammar_id || item.grammar_id,
        cau_truc: existing.cau_truc.length >= item.cau_truc.length ? existing.cau_truc : item.cau_truc,
        giai_thich: mergedGiaiThich || existing.giai_thich || item.giai_thich,
        vi_du: bestExample,
        vi_du_dich: bestExampleVi,
        tags: mergedTags,
        ghi_chu: existing.ghi_chu || item.ghi_chu || '',
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
