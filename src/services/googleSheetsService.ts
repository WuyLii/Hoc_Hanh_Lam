export interface SheetsPayload {
  users: any[];
  vocabulary: any[];
  decks: any[];
  grammar: any[];
  reviewSessions: any[];
  tests: any[];
  listening: any[];
  progress: any[];
  journal: any[];
  notifications: any[];
  chatHistory: any[];
}

export class GoogleSheetsService {
  /**
   * Generates the Google Apps Script code to deploy on script.google.com
   */
  public static generateAppsScriptCode(): string {
    return `/**
 * Google Apps Script Backend cho Học hành lắm (CSDL Google Sheets)
 * 
 * Hướng dẫn cài đặt nhanh:
 * 1. Mở một Google Sheets mới tại sheets.google.com
 * 2. Vào Tiện ích mở rộng (Extensions) > Apps Script
 * 3. Dán toàn bộ mã nguồn này vào trình soạn thảo (thay thế Code.gs) và Lưu lại
 * 4. Nhấn nút "Triển khai" (Deploy) > "Triển khai mới" (New deployment)
 * 5. Chọn loại: Ứng dụng web (Web app)
 * 6. Mục 'Ai có quyền truy cập' (Who has access): Chọn "Bất kỳ ai" (Anyone)
 * 7. Nhấn "Triển khai" và sao chép URL ứng dụng web dán vào ứng dụng "Học hành lắm"!
 */

const DEFAULT_HEADERS = {
  Vocabulary: ['ID', 'Từ', 'Nghĩa', 'Phiên âm', 'Loại từ', 'Chủ đề', 'Cấp độ', 'Ví dụ', 'Ví dụ (dịch)', 'Ngôn ngữ', 'srs_box'],
  Grammar: ['ID', 'Cấu trúc', 'Giải thích', 'Công thức', 'Ví dụ', 'Ví dụ (dịch)', 'Ngôn ngữ', 'Cấp độ', 'Ghi chú'],
  Users: ['ID', 'Tên', 'Ngôn ngữ học', 'Cấp độ', 'Mục tiêu', 'Ngày tham gia'],
  Decks: ['ID', 'Tên bộ', 'Ngôn ngữ', 'Mô tả'],
  ReviewSessions: ['ID', 'User ID', 'Loại game', 'Thời gian bắt đầu', 'Thời gian kết thúc', 'Số câu đúng', 'Số câu sai', 'Điểm'],
  Tests: ['ID', 'User ID', 'Loại đề', 'Ngày làm', 'Điểm số'],
  Listening: ['ID', 'Audio URL', 'Transcript', 'Loại bài tập', 'Kết quả'],
  Progress: ['User ID', 'Ngôn ngữ', 'Ngày', 'Số từ mới', 'Streak', 'Thời gian học (phút)']
};

function normalizeKey(header) {
  if (!header) return '';
  var h = header.toString().trim().toLowerCase();
  if (h === 'id' || h === 'word_id' || h === 'grammar_id' || h === 'user_id' || h === 'deck_id') return 'id';
  if (h === 'từ' || h === 'tu') return 'tu';
  if (h === 'nghĩa' || h === 'nghia') return 'nghia';
  if (h === 'phiên âm' || h === 'phien_am') return 'phien_am';
  if (h === 'loại từ' || h === 'loai_tu') return 'loai_tu';
  if (h === 'chủ đề' || h === 'chu_de') return 'chu_de';
  if (h === 'cấp độ' || h === 'cap_do') return 'cap_do';
  if (h === 'ví dụ' || h === 'vi_du') return 'vi_du';
  if (h === 'ví dụ (dịch)' || h === 'vi_du_dich' || h === 'ví dụ dịch') return 'vi_du_dich';
  if (h === 'ngôn ngữ' || h === 'ngon_ngu') return 'ngon_ngu';
  if (h === 'srs_box' || h === 'srs box') return 'srs_box';
  if (h === 'cấu trúc' || h === 'cau_truc') return 'cau_truc';
  if (h === 'giải thích' || h === 'giai_thich') return 'giai_thich';
  if (h === 'công thức' || h === 'cong_thuc') return 'cong_thuc';
  if (h === 'ghi chú' || h === 'ghi_chu') return 'ghi_chu';
  if (h === 'tên' || h === 'ten') return 'ten';
  return h.replace(/[^a-z0-9_]/g, '_');
}

function getItemValue(item, headerName) {
  var key = normalizeKey(headerName);
  var val = undefined;
  if (key === 'id') val = item.id || item.word_id || item.grammar_id || item.user_id || item.deck_id;
  else if (key === 'tu') val = item.tu;
  else if (key === 'nghia') val = item.nghia;
  else if (key === 'phien_am') val = item.phien_am;
  else if (key === 'loai_tu') val = item.loai_tu;
  else if (key === 'chu_de') val = item.chu_de;
  else if (key === 'cap_do') val = item.cap_do;
  else if (key === 'vi_du') val = item.vi_du;
  else if (key === 'vi_du_dich') val = item.vi_du_dich;
  else if (key === 'ngon_ngu') val = item.ngon_ngu;
  else if (key === 'srs_box') val = item.srs_box;
  else if (key === 'cau_truc') val = item.cau_truc;
  else if (key === 'giai_thich') val = item.giai_thich;
  else if (key === 'cong_thuc') val = item.cong_thuc;
  else if (key === 'ghi_chu') val = item.ghi_chu;
  else if (key === 'ten') val = item.ten || item.name;
  else {
    val = item[headerName] !== undefined ? item[headerName] : item[key];
  }
  return val !== undefined && val !== null ? val : '';
}

function doGet(e) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    ensureAllTabs(ss);
    
    const result = {};
    for (const tabName in DEFAULT_HEADERS) {
      const sheet = ss.getSheetByName(tabName);
      if (!sheet || sheet.getLastRow() <= 1) {
        result[tabName.charAt(0).toLowerCase() + tabName.slice(1)] = [];
        continue;
      }
      const data = sheet.getDataRange().getValues();
      const headers = data[0];
      const rows = [];
      for (let i = 1; i < data.length; i++) {
        const rowObj = {};
        for (let j = 0; j < headers.length; j++) {
          var headerName = headers[j];
          var cellVal = data[i][j];
          var propKey = normalizeKey(headerName);
          if (propKey === 'id') rowObj.id = cellVal;
          if (propKey === 'tu') rowObj.tu = cellVal;
          if (propKey === 'nghia') rowObj.nghia = cellVal;
          if (propKey === 'phien_am') rowObj.phien_am = cellVal;
          if (propKey === 'loai_tu') rowObj.loai_tu = cellVal;
          if (propKey === 'chu_de') rowObj.chu_de = cellVal;
          if (propKey === 'cap_do') rowObj.cap_do = cellVal;
          if (propKey === 'vi_du') rowObj.vi_du = cellVal;
          if (propKey === 'vi_du_dich') rowObj.vi_du_dich = cellVal;
          if (propKey === 'ngon_ngu') rowObj.ngon_ngu = cellVal;
          if (propKey === 'srs_box') rowObj.srs_box = Number(cellVal) || 0;
          if (propKey === 'cau_truc') rowObj.cau_truc = cellVal;
          if (propKey === 'giai_thich') rowObj.giai_thich = cellVal;
          if (propKey === 'cong_thuc') rowObj.cong_thuc = cellVal;
          if (propKey === 'ghi_chu') rowObj.ghi_chu = cellVal;
          if (propKey === 'ten') rowObj.ten = cellVal;
          rowObj[propKey] = cellVal;
        }
        rows.push(rowObj);
      }
      result[tabName.charAt(0).toLowerCase() + tabName.slice(1)] = rows;
    }
    
    return ContentService.createTextOutput(JSON.stringify({ status: 'success', data: result }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doPost(e) {
  try {
    const contents = JSON.parse(e.postData.contents);
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    ensureAllTabs(ss);
    
    const tabMapping = {
      vocabulary: 'Vocabulary',
      grammar: 'Grammar',
      users: 'Users',
      decks: 'Decks',
      reviewSessions: 'ReviewSessions',
      tests: 'Tests',
      listening: 'Listening',
      progress: 'Progress'
    };
    
    for (const key in tabMapping) {
      const tabName = tabMapping[key];
      const items = contents[key];
      if (Array.isArray(items)) {
        const sheet = ss.getSheetByName(tabName) || ss.insertSheet(tabName);
        
        var headers = DEFAULT_HEADERS[tabName];
        if (sheet.getLastRow() > 0) {
          var firstRow = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
          if (firstRow && firstRow[0] !== '') {
            headers = firstRow;
          }
        } else {
          sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
          sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold').setBackground('#E8F0FE');
          sheet.setFrozenRows(1);
        }
        
        const lastRow = sheet.getLastRow();
        if (lastRow > 1) {
          sheet.getRange(2, 1, lastRow - 1, headers.length).clearContent();
        }
        
        if (items.length > 0) {
          const rows = items.map(item => {
            return headers.map(h => {
              var val = getItemValue(item, h);
              if (typeof val === 'object') return JSON.stringify(val);
              return val !== undefined && val !== null ? val : '';
            });
          });
          
          sheet.getRange(2, 1, rows.length, headers.length).setValues(rows);
        }
      }
    }
    
    return ContentService.createTextOutput(JSON.stringify({ status: 'success', message: 'Đồng bộ Google Sheets thành công!' }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function ensureAllTabs(ss) {
  for (const tabName in DEFAULT_HEADERS) {
    let sheet = ss.getSheetByName(tabName);
    if (!sheet) {
      sheet = ss.insertSheet(tabName);
      const headers = DEFAULT_HEADERS[tabName];
      sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
      sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold').setBackground('#E8F0FE');
      sheet.setFrozenRows(1);
    }
  }
}`;
  }

  /**
   * Sync local data with Google Sheets
   */
  public static async syncToGoogleSheets(scriptUrl: string, payload: SheetsPayload): Promise<{ success: boolean; message: string }> {
    if (!scriptUrl || !scriptUrl.startsWith('https://script.google.com/')) {
      throw new Error('URL Google Apps Script không hợp lệ');
    }

    const response = await fetch(scriptUrl, {
      method: 'POST',
      mode: 'cors',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: JSON.stringify(payload),
    });

    const resJson = await response.json();
    if (resJson.status === 'success') {
      return { success: true, message: resJson.message || 'Đồng bộ thành công!' };
    } else {
      throw new Error(resJson.message || 'Lỗi đồng bộ từ Google Sheets');
    }
  }

  /**
   * Pull data from Google Sheets (Apps Script or Public Sheet URL)
   */
  public static async pullFromGoogleSheets(scriptUrlOrSheetUrl: string): Promise<any> {
    if (!scriptUrlOrSheetUrl) {
      throw new Error('Vui lòng nhập URL Google Sheets hoặc Web App Script URL');
    }

    if (scriptUrlOrSheetUrl.includes('docs.google.com/spreadsheets') || !scriptUrlOrSheetUrl.startsWith('https://script.google.com/')) {
      return GoogleSheetsService.fetchPublicSheets(scriptUrlOrSheetUrl);
    }

    const response = await fetch(scriptUrlOrSheetUrl, {
      method: 'GET',
      mode: 'cors',
    });

    const resJson = await response.json();
    if (resJson.status === 'success' && resJson.data) {
      return resJson.data;
    } else {
      throw new Error(resJson.message || 'Không thể đọc dữ liệu Google Sheets');
    }
  }

  /**
   * Direct fetch from public / shared Google Sheet URL
   */
  public static async fetchPublicSheets(urlOrId: string): Promise<any> {
    const resp = await fetch('/api/sheets/fetch-public', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ urlOrId }),
    });
    const json = await resp.json();
    if (!resp.ok) {
      throw new Error(json.error || 'Lỗi khi kết nối Google Sheets');
    }
    return json.data;
  }

  /**
   * Export array of objects to CSV download
   */
  public static exportToCSV(filename: string, rows: Record<string, any>[]): void {
    if (!rows || !rows.length) {
      alert('Không có dữ liệu để xuất file CSV.');
      return;
    }

    const headers = Object.keys(rows[0]);
    const csvContent = [
      headers.join(','),
      ...rows.map((row) =>
        headers
          .map((fieldName) => {
            let val = row[fieldName];
            if (val === undefined || val === null) val = '';
            if (typeof val === 'object') val = JSON.stringify(val);
            const strVal = String(val).replace(/"/g, '""');
            return `"${strVal}"`;
          })
          .join(',')
      ),
    ].join('\r\n');

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  /**
   * Parse CSV string into array of objects
   */
  public static parseCSV(csvText: string): Record<string, string>[] {
    const lines = csvText.split(/\r?\n/).filter((l) => l.trim().length > 0);
    if (lines.length < 2) return [];

    const parseLine = (line: string): string[] => {
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
    };

    const headers = parseLine(lines[0]);
    const items: Record<string, string>[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = parseLine(lines[i]);
      const obj: Record<string, string> = {};
      headers.forEach((h, idx) => {
        obj[h] = values[idx] || '';
      });
      items.push(obj);
    }

    return items;
  }
}
