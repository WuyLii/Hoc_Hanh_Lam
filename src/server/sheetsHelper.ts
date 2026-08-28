export function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let insideQuote = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (insideQuote && line[i + 1] === '"') {
        current += '"';
        i++; // skip escaped quote
      } else {
        insideQuote = !insideQuote;
      }
    } else if (char === ',' && !insideQuote) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

export function parseCsv(csvText: string): Record<string, string>[] {
  if (!csvText) return [];
  // Strip BOM if present
  const cleanText = csvText.replace(/^\uFEFF/, '');
  const lines = cleanText.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length < 2) return [];

  const rawHeaders = parseCsvLine(lines[0]);
  const headers = rawHeaders.map((h) => h.replace(/^\uFEFF/, '').trim());
  const items: Record<string, string>[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseCsvLine(lines[i]);
    const obj: Record<string, string> = {};
    headers.forEach((h, idx) => {
      const key = normalizeKey(h);
      const val = values[idx] || '';
      obj[key] = val;
      obj[h] = val;
      obj[`col_${idx}`] = val;
    });
    // Positional fallback if tu & nghia are missing but row has at least 2 non-empty values
    if (!obj.tu && !obj.nghia && !obj.cau_truc && values.length >= 2) {
      if (values[0] && values[1]) {
        obj.tu = values[0];
        obj.nghia = values[1];
        if (values[2]) obj.phien_am = values[2];
        if (values[3]) obj.vi_du = values[3];
      }
    }
    items.push(obj);
  }

  return items;
}

export function normalizeKey(header: string): string {
  if (!header) return '';
  const clean = header.replace(/^\uFEFF/, '').trim();
  const h = clean.toLowerCase();

  if (h === 'id' || h === 'word_id' || h === 'grammar_id' || h === 'user_id' || h === 'deck_id' || h === 'stt' || h === 'no') return 'id';
  if (h === 'từ' || h === 'tu' || h === 'word' || h === 'term' || h === 'từ vựng' || h === 'tu_vung' || h === 'vocab' || h === 'vocabulary' || h === 'chữ' || h === 'chu' || h === 'kanji' || h === 'hangul' || h === 'hanzi' || h === 'khái niệm' || h === 'từ mới') return 'tu';
  if (h === 'nghĩa' || h === 'nghia' || h === 'meaning' || h === 'definition' || h === 'dịch' || h === 'dich' || h === 'nghĩa tiếng việt' || h === 'nghia_tieng_viet' || h === 'dịch nghĩa' || h === 'dich_nghia' || h === 'nghĩa việt') return 'nghia';
  if (h === 'phiên âm' || h === 'phien_am' || h === 'pronunciation' || h === 'pinyin' || h === 'romaja' || h === 'ipa' || h === 'đọc' || h === 'doc' || h === 'phát âm' || h === 'phat_am') return 'phien_am';
  if (h === 'loại từ' || h === 'loai_tu' || h === 'part_of_speech' || h === 'type' || h === 'loại' || h === 'loai' || h === 'pos') return 'loai_tu';
  if (h === 'chủ đề' || h === 'chu_de' || h === 'topic' || h === 'category' || h === 'bài' || h === 'bai' || h === 'lesson' || h === 'chủ điểm' || h === 'chu_diem') return 'chu_de';
  if (h === 'cấp độ' || h === 'cap_do' || h === 'level' || h === 'trình độ' || h === 'trinh_do' || h === 'hsk' || h === 'topik' || h === 'cefr') return 'cap_do';
  if (h === 'ví dụ' || h === 'vi_du' || h === 'example' || h === 'câu ví dụ' || h === 'cau_vi_du' || h === 'sentence') return 'vi_du';
  if (h === 'ví dụ (dịch)' || h === 'vi_du_dich' || h === 'ví dụ dịch' || h === 'example_translation' || h === 'dịch ví dụ' || h === 'dich_vi_du' || h === 'câu dịch') return 'vi_du_dich';
  if (h === 'ngôn ngữ' || h === 'ngon_ngu' || h === 'language' || h === 'lang') return 'ngon_ngu';
  if (h === 'srs_box' || h === 'srs box' || h === 'srs' || h === 'box') return 'srs_box';
  if (h === 'cấu trúc' || h === 'cau_truc' || h === 'grammar' || h === 'structure' || h === 'ngữ pháp' || h === 'ngu_phap') return 'cau_truc';
  if (h === 'giải thích' || h === 'giai_thich' || h === 'explanation' || h === 'ý nghĩa' || h === 'y_nghia') return 'giai_thich';
  if (h === 'công thức' || h === 'cong_thuc' || h === 'formula') return 'cong_thuc';
  if (h === 'ghi chú' || h === 'ghi_chu' || h === 'note' || h === 'notes') return 'ghi_chu';
  if (h === 'tên' || h === 'ten' || h === 'name' || h === 'title' || h === 'tên bộ' || h === 'ten_bo') return 'ten';
  return h.replace(/[^a-z0-9_]/g, '_');
}

export function extractSpreadsheetId(urlOrId: string): string {
  if (!urlOrId) return '';
  const match = urlOrId.trim().match(/\/d\/([a-zA-Z0-9-_]+)/);
  if (match && match[1]) return match[1];
  return urlOrId.trim();
}

export async function fetchPublicSpreadsheet(urlOrId: string) {
  const id = extractSpreadsheetId(urlOrId);
  if (!id) {
    throw new Error('Đường dẫn hoặc ID Google Sheets không hợp lệ');
  }

  const resultData: {
    vocabulary: any[];
    grammar: any[];
    decks: any[];
    users?: any[];
  } = {
    vocabulary: [],
    grammar: [],
    decks: [],
  };

  const sheetsToTry = [
    { name: 'Vocabulary', param: 'sheet=Vocabulary' },
    { name: 'Grammar', param: 'sheet=Grammar' },
    { name: 'Decks', param: 'sheet=Decks' },
    { name: 'Từ vựng', param: 'sheet=T%E1%BB%AB%20v%E1%BB%B1ng' },
    { name: 'Ngữ pháp', param: 'sheet=Ng%E1%BB%AF%20ph%C3%A1p' },
    { name: 'Sheet1', param: 'sheet=Sheet1' },
    { name: 'Default', param: 'gid=0' },
  ];

  let fetchedAny = false;

  for (const sheetConfig of sheetsToTry) {
    const csvUrl = `https://docs.google.com/spreadsheets/d/${id}/export?format=csv&${sheetConfig.param}`;
    try {
      const resp = await fetch(csvUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
      });

      if (resp.ok) {
        const text = await resp.text();
        if (text && !text.toLowerCase().includes('<!doctype html>')) {
          const rows = parseCsv(text);
          if (rows.length > 0) {
            fetchedAny = true;
            // Categorize items
            rows.forEach((row, idx) => {
              const wordText = row.tu || row.word || row['từ'];
              const meanText = row.nghia || row.meaning || row['nghĩa'];
              const structText = row.cau_truc || row.structure || row['cấu trúc'];
              const expText = row.giai_thich || row.explanation || row['giải thích'];

              if (wordText || meanText) {
                resultData.vocabulary.push({
                  word_id: row.id || `w_sheet_${idx}_${Date.now()}`,
                  tu: wordText || '',
                  nghia: meanText || '',
                  phien_am: row.phien_am || '',
                  loai_tu: row.loai_tu || 'Từ vựng',
                  chu_de: row.chu_de || 'Đồng bộ Sheets',
                  cap_do: row.cap_do || 'Cơ bản',
                  vi_du: row.vi_du || '',
                  vi_du_dich: row.vi_du_dich || '',
                  ngon_ngu: row.ngon_ngu || 'en',
                  srs_box: Number(row.srs_box) || 0,
                  nguon_goc: 'Google Sheets (Auto Sync)',
                  created_at: new Date().toISOString().split('T')[0],
                });
              } else if (structText || expText) {
                resultData.grammar.push({
                  grammar_id: row.id || `gr_sheet_${idx}_${Date.now()}`,
                  cau_truc: structText || '',
                  giai_thich: expText || '',
                  cong_thuc: row.cong_thuc || '',
                  vi_du: row.vi_du || '',
                  vi_du_dich: row.vi_du_dich || '',
                  ngon_ngu: row.ngon_ngu || 'en',
                  cap_do: row.cap_do || 'Cơ bản',
                  ghi_chu: row.ghi_chu || '',
                  created_at: new Date().toISOString().split('T')[0],
                });
              } else if (row.ten) {
                resultData.decks.push({
                  deck_id: row.id || `deck_sheet_${idx}_${Date.now()}`,
                  ten_bo: row.ten || 'Bộ từ vựng',
                  ngon_ngu: row.ngon_ngu || 'en',
                  mo_ta: row.mo_ta || '',
                  created_at: new Date().toISOString().split('T')[0],
                });
              }
            });
          }
        }
      }
    } catch (e) {
      // ignore single tab error
    }
  }

  if (!fetchedAny && resultData.vocabulary.length === 0 && resultData.grammar.length === 0) {
    // Try gviz endpoint as secondary fallback
    const gvizUrl = `https://docs.google.com/spreadsheets/d/${id}/gviz/tq?tqx=out:csv`;
    try {
      const resp = await fetch(gvizUrl);
      if (resp.ok) {
        const text = await resp.text();
        if (text && !text.toLowerCase().includes('<!doctype html>')) {
          const rows = parseCsv(text);
          rows.forEach((row, idx) => {
            const wordText = row.tu || row.word || row['từ'];
            const meanText = row.nghia || row.meaning || row['nghĩa'];
            if (wordText || meanText) {
              resultData.vocabulary.push({
                word_id: row.id || `w_gviz_${idx}_${Date.now()}`,
                tu: wordText || '',
                nghia: meanText || '',
                phien_am: row.phien_am || '',
                loai_tu: row.loai_tu || 'Từ vựng',
                chu_de: row.chu_de || 'Đồng bộ Sheets',
                cap_do: row.cap_do || 'Cơ bản',
                vi_du: row.vi_du || '',
                vi_du_dich: row.vi_du_dich || '',
                ngon_ngu: row.ngon_ngu || 'en',
                srs_box: Number(row.srs_box) || 0,
                nguon_goc: 'Google Sheets (Auto Sync)',
                created_at: new Date().toISOString().split('T')[0],
              });
            }
          });
        }
      }
    } catch (e) {
      // ignore
    }
  }

  return {
    status: 'success',
    spreadsheetId: id,
    data: resultData,
  };
}
