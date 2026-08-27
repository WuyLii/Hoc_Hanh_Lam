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
  const lines = csvText.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length < 2) return [];

  const headers = parseCsvLine(lines[0]);
  const items: Record<string, string>[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseCsvLine(lines[i]);
    const obj: Record<string, string> = {};
    headers.forEach((h, idx) => {
      const key = normalizeKey(h);
      obj[key] = values[idx] || '';
      obj[h] = values[idx] || '';
    });
    items.push(obj);
  }

  return items;
}

export function normalizeKey(header: string): string {
  if (!header) return '';
  const h = header.toString().trim().toLowerCase();
  if (h === 'id' || h === 'word_id' || h === 'grammar_id' || h === 'user_id' || h === 'deck_id') return 'id';
  if (h === 'từ' || h === 'tu' || h === 'word' || h === 'term') return 'tu';
  if (h === 'nghĩa' || h === 'nghia' || h === 'meaning' || h === 'definition') return 'nghia';
  if (h === 'phiên âm' || h === 'phien_am' || h === 'pronunciation' || h === 'pinyin' || h === 'romaja' || h === 'ipa') return 'phien_am';
  if (h === 'loại từ' || h === 'loai_tu' || h === 'part_of_speech' || h === 'type') return 'loai_tu';
  if (h === 'chủ đề' || h === 'chu_de' || h === 'topic' || h === 'category') return 'chu_de';
  if (h === 'cấp độ' || h === 'cap_do' || h === 'level') return 'cap_do';
  if (h === 'ví dụ' || h === 'vi_du' || h === 'example') return 'vi_du';
  if (h === 'ví dụ (dịch)' || h === 'vi_du_dich' || h === 'ví dụ dịch' || h === 'example_translation') return 'vi_du_dich';
  if (h === 'ngôn ngữ' || h === 'ngon_ngu' || h === 'language') return 'ngon_ngu';
  if (h === 'srs_box' || h === 'srs box') return 'srs_box';
  if (h === 'cấu trúc' || h === 'cau_truc' || h === 'grammar' || h === 'structure') return 'cau_truc';
  if (h === 'giải thích' || h === 'giai_thich' || h === 'explanation') return 'giai_thich';
  if (h === 'công thức' || h === 'cong_thuc' || h === 'formula') return 'cong_thuc';
  if (h === 'ghi chú' || h === 'ghi_chu' || h === 'note' || h === 'notes') return 'ghi_chu';
  if (h === 'tên' || h === 'ten' || h === 'name' || h === 'title') return 'ten';
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
              if (row.tu || row.nghia) {
                resultData.vocabulary.push({
                  word_id: row.id || `w_sheet_${idx}_${Date.now()}`,
                  tu: row.tu || '',
                  nghia: row.nghia || '',
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
              } else if (row.cau_truc || row.giai_thich) {
                resultData.grammar.push({
                  grammar_id: row.id || `gr_sheet_${idx}_${Date.now()}`,
                  cau_truc: row.cau_truc || '',
                  giai_thich: row.giai_thich || '',
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
            if (row.tu || row.nghia) {
              resultData.vocabulary.push({
                word_id: row.id || `w_gviz_${idx}_${Date.now()}`,
                tu: row.tu || '',
                nghia: row.nghia || '',
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
