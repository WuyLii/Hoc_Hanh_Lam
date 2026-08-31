import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { GoogleSheetsService } from '../services/googleSheetsService';
import {
  FileSpreadsheet,
  Copy,
  Check,
  RefreshCw,
  Download,
  Upload,
  AlertCircle,
} from 'lucide-react';

export const GoogleSheetsSettings: React.FC = () => {
  const {
    sheetsConfig,
    updateSheetsConfig,
    syncGoogleSheets,
    pullGoogleSheets,
    isSyncing,
    vocabulary,
  } = useApp();

  const [scriptUrlInput, setScriptUrlInput] = useState(sheetsConfig.scriptUrl || '');
  const [sheetUrlInput, setSheetUrlInput] = useState(
    sheetsConfig.spreadsheetUrlOrId ||
      'https://docs.google.com/spreadsheets/d/1Zx6Mne01gn-FwXxei9Nn-Otcivo_WAueId6eesR23sY/edit?gid=0#gid=0'
  );
  const [autoSyncEnabled, setAutoSyncEnabled] = useState(sheetsConfig.autoSync !== false);
  const [hasCopiedCode, setHasCopiedCode] = useState(false);
  const [syncFeedback, setSyncFeedback] = useState<{ success: boolean; message: string } | null>(null);

  const appsScriptCode = GoogleSheetsService.generateAppsScriptCode();

  const handleCopyCode = () => {
    navigator.clipboard.writeText(appsScriptCode);
    setHasCopiedCode(true);
    setTimeout(() => setHasCopiedCode(false), 2500);
  };

  const handleSaveConfig = () => {
    updateSheetsConfig({
      scriptUrl: scriptUrlInput.trim(),
      spreadsheetUrlOrId: sheetUrlInput.trim(),
      autoSync: autoSyncEnabled,
      syncIntervalHours: 24,
    });
    setSyncFeedback({
      success: true,
      message: '✅ Đã lưu cấu hình tự động đồng bộ Google Sheets thành công!',
    });
  };

  const handleTestSync = async () => {
    handleSaveConfig();
    setSyncFeedback(null);
    const res = await syncGoogleSheets();
    setSyncFeedback(res);
  };

  const handleTestPull = async () => {
    handleSaveConfig();
    setSyncFeedback(null);
    const res = await pullGoogleSheets();
    setSyncFeedback(res);
  };

  const handleExportFullBackup = () => {
    GoogleSheetsService.exportToCSV('SaoLuu_HocHanhLam_GoogleSheets', vocabulary);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-16">
      {/* Editorial Header */}
      <div className="p-8 bg-white border-2 border-[#1A1A1A] editorial-shadow flex flex-col md:flex-row items-start md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="bg-[#1A1A1A] text-[#F9F7F2] text-[10px] font-mono font-bold uppercase px-2.5 py-0.5">
              Cơ sở dữ liệu đám mây
            </span>
            <span className="text-xs font-serif italic text-stone-600">
              Học hành lắm & Google Sheets Database
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-serif font-black tracking-tight text-[#1A1A1A]">
            Kết nối Google Sheets làm CSDL
          </h1>
          <p className="text-xs font-mono uppercase tracking-widest text-stone-600 mt-2 max-w-2xl">
            Sử dụng Google Sheets làm kho lưu trữ vĩnh viễn cho toàn bộ từ vựng, ngữ pháp và dữ liệu học tập cá nhân của bạn.
          </p>
        </div>
      </div>

      {/* Sync Status Banner */}
      {syncFeedback && (
        <div
          className={`p-4 border-2 text-xs font-mono flex items-center gap-2 animate-in fade-in ${
            syncFeedback.success
              ? 'bg-emerald-50 border-emerald-800 text-emerald-900'
              : 'bg-rose-50 border-rose-800 text-rose-900'
          }`}
        >
          {syncFeedback.success ? (
            <Check className="w-4 h-4 shrink-0 text-emerald-800" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-800" />
          )}
          <span>{syncFeedback.message}</span>
        </div>
      )}

      {/* Detailed Step-by-Step Guide */}
      <div className="p-6 sm:p-8 bg-amber-50/70 border-2 border-[#1A1A1A] editorial-shadow-sm space-y-4">
        <h2 className="text-sm font-mono font-black uppercase tracking-wider text-[#1A1A1A] flex items-center gap-2 border-b border-amber-800/30 pb-3">
          <FileSpreadsheet className="w-5 h-5 text-amber-800" />
          <span>📖 Hướng dẫn chi tiết 5 bước thiết lập Google Apps Script làm CSDL</span>
        </h2>

        <div className="space-y-3 text-xs sm:text-sm font-serif text-stone-800 leading-relaxed">
          <div className="flex items-start gap-3 bg-white p-3.5 border border-[#1A1A1A]/30">
            <span className="w-6 h-6 rounded-full bg-[#1A1A1A] text-white font-mono text-xs flex items-center justify-center shrink-0 font-bold">1</span>
            <div>
              <strong>Tạo Google Sheets mới:</strong> Truy cập <a href="https://sheets.google.com" target="_blank" rel="noreferrer" className="text-blue-700 underline font-mono">sheets.google.com</a>, tạo một bảng tính mới và đặt tên (ví dụ: <em>CSDL_HocHanhLam</em>).
            </div>
          </div>

          <div className="flex items-start gap-3 bg-white p-3.5 border border-[#1A1A1A]/30">
            <span className="w-6 h-6 rounded-full bg-[#1A1A1A] text-white font-mono text-xs flex items-center justify-center shrink-0 font-bold">2</span>
            <div>
              <strong>Mở trình soạn thảo Apps Script:</strong> Trên thanh menu Google Sheets, chọn <strong>Tiện ích mở rộng (Extensions)</strong> &gt; <strong>Apps Script</strong>.
            </div>
          </div>

          <div className="flex items-start gap-3 bg-white p-3.5 border border-[#1A1A1A]/30">
            <span className="w-6 h-6 rounded-full bg-[#1A1A1A] text-white font-mono text-xs flex items-center justify-center shrink-0 font-bold">3</span>
            <div>
              <strong>Dán mã nguồn Backend:</strong> Xóa toàn bộ mã mặc định trong tệp <code className="bg-stone-100 px-1 font-mono text-xs text-red-700">Code.gs</code>, sau đó bấm nút <strong>"Sao chép mã nguồn"</strong> ở Bước 2 bên dưới và dán vào. Nhấn <strong>Lưu (Ctrl + S)</strong>.
            </div>
          </div>

          <div className="flex items-start gap-3 bg-white p-3.5 border border-[#1A1A1A]/30">
            <span className="w-6 h-6 rounded-full bg-[#1A1A1A] text-white font-mono text-xs flex items-center justify-center shrink-0 font-bold">4</span>
            <div>
              <strong>Triển khai Web App (Deploy):</strong>
              <ul className="list-disc pl-5 mt-1 space-y-1 text-stone-700">
                <li>Bấm góc trên bên phải: <strong>Triển khai (Deploy)</strong> &gt; <strong>Triển khai mới (New deployment)</strong>.</li>
                <li>Chọn loại cấu hình (Select type): Biểu đồ / Ứng dụng web (<strong>Web app</strong>).</li>
                <li>Mô tả: <code className="bg-stone-100 px-1">HocHanhLam Backend v1</code></li>
                <li>Thực thi dưới dạng (Execute as): <strong>Tôi (Me)</strong></li>
                <li>Ai có quyền truy cập (Who has access): <strong>Bất kỳ ai (Anyone)</strong> &lt;— <em>Rất quan trọng để ứng dụng web gọi được!</em></li>
                <li>Bấm <strong>Triển khai (Deploy)</strong>, cấp quyền tài khoản Google (Advanced &gt; Go to Untitled project).</li>
              </ul>
            </div>
          </div>

          <div className="flex items-start gap-3 bg-white p-3.5 border border-[#1A1A1A]/30">
            <span className="w-6 h-6 rounded-full bg-[#1A1A1A] text-white font-mono text-xs flex items-center justify-center shrink-0 font-bold">5</span>
            <div>
              <strong>Kết nối vào ứng dụng:</strong> Sao chép đường dẫn <strong>URL ứng dụng web (Web app URL)</strong> có dạng <code className="bg-stone-100 text-xs font-mono text-blue-800">https://script.google.com/macros/s/.../exec</code> và dán vào ô bên dưới. Bấm <strong>Lưu đường dẫn URL</strong> là hoàn tất! Giờ đây bạn có thể Đẩy (Push) hoặc Kéo (Pull) dữ liệu đồng bộ tức thì.
            </div>
          </div>
        </div>
      </div>

      {/* Web App & Google Sheet URL Configuration */}
      <div className="p-6 sm:p-8 bg-white border-2 border-[#1A1A1A] editorial-shadow space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-[#1A1A1A] pb-4 gap-4">
          <div>
            <h2 className="text-sm font-mono font-bold uppercase tracking-widest text-[#1A1A1A]">
              🔗 Cấu hình Đồng bộ Google Sheets
            </h2>
            <p className="text-xs font-serif text-stone-600 mt-0.5">
              Tự động cập nhật dữ liệu từ Google Sheets định kỳ sau mỗi 24 giờ (1 ngày)
            </p>
          </div>

          <div className="flex items-center gap-3 bg-[#F9F7F2] px-3.5 py-2 border border-[#1A1A1A]">
            <span className="text-xs font-mono font-bold text-[#1A1A1A]">TỰ ĐỘNG ĐỒNG BỘ (24H):</span>
            <button
              onClick={() => setAutoSyncEnabled(!autoSyncEnabled)}
              className={`px-3 py-1 text-xs font-mono font-bold uppercase transition border ${
                autoSyncEnabled ? 'bg-emerald-800 text-white border-emerald-900' : 'bg-stone-200 text-stone-700 border-stone-400'
              }`}
            >
              {autoSyncEnabled ? 'ĐÃ BẬT (24H)' : 'TẮT'}
            </button>
          </div>
        </div>

        {/* Status Badge */}
        <div className="p-4 bg-amber-50 border border-amber-800/40 text-xs font-mono flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-stone-800">
            <RefreshCw className={`w-4 h-4 text-amber-900 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>
              <strong>LẦN ĐỒNG BỘ GẦN NHẤT:</strong>{' '}
              {sheetsConfig.lastSyncedAt
                ? new Date(sheetsConfig.lastSyncedAt).toLocaleString('vi-VN')
                : 'Chưa đồng bộ (Sẽ tự động chạy sau 24h)'}
            </span>
          </div>

          <button
            onClick={handleTestPull}
            disabled={isSyncing}
            className="flex items-center gap-1.5 px-4 py-1.5 bg-[#1A1A1A] text-white hover:bg-stone-800 disabled:opacity-50 text-xs font-mono font-bold uppercase"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{isSyncing ? 'ĐANG ĐỒNG BỘ...' : 'ĐỒNG BỘ NGAY'}</span>
          </button>
        </div>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-mono font-bold uppercase text-stone-800 flex items-center justify-between">
              <span>Đường dẫn tệp Google Sheets (Spreadsheet URL / ID)</span>
              <span className="text-[10px] text-emerald-800 bg-emerald-100 px-2 py-0.5 border border-emerald-300">
                Được ưu tiên để đọc tự động
              </span>
            </label>
            <input
              type="text"
              placeholder="https://docs.google.com/spreadsheets/d/1Zx6Mne01gn-FwXxei9Nn-Otcivo_WAueId6eesR23sY/edit"
              value={sheetUrlInput}
              onChange={(e) => setSheetUrlInput(e.target.value)}
              className="w-full p-3 bg-[#F9F7F2] border border-[#1A1A1A] text-xs font-mono text-[#1A1A1A] focus:bg-white focus:outline-none"
            />
            <p className="text-[11px] font-serif text-stone-500">
              * Lưu ý: Đảm bảo tệp Google Sheets được chia sẻ ở chế độ <strong>"Bất kỳ ai có đường liên kết đều có thể xem"</strong>.
            </p>
          </div>

          <div className="space-y-1.5 pt-2">
            <label className="text-xs font-mono font-bold uppercase text-stone-800">
              URL Google Apps Script Web App (Tùy chọn cho tính năng Đẩy 2 chiều Push/Pull)
            </label>
            <input
              type="url"
              placeholder="https://script.google.com/macros/s/.../exec"
              value={scriptUrlInput}
              onChange={(e) => setScriptUrlInput(e.target.value)}
              className="w-full p-3 bg-[#F9F7F2] border border-[#1A1A1A] text-xs font-mono text-[#1A1A1A] focus:bg-white focus:outline-none"
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-[#1A1A1A]/20">
          <button
            onClick={handleSaveConfig}
            className="px-5 py-2.5 border-2 border-[#1A1A1A] bg-[#1A1A1A] text-[#F9F7F2] hover:bg-stone-800 text-xs font-mono font-bold uppercase tracking-wider"
          >
            LƯU CẤU HÌNH ĐỒNG BỘ
          </button>

          <button
            onClick={handleTestPull}
            disabled={isSyncing}
            className="flex items-center gap-2 px-5 py-2.5 border border-[#1A1A1A] bg-white hover:bg-stone-100 disabled:opacity-50 text-xs font-mono font-bold uppercase text-[#1A1A1A]"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>KÉO DỮ LIỆU TỪ SHEETS (PULL)</span>
          </button>

          {scriptUrlInput && (
            <button
              onClick={handleTestSync}
              disabled={isSyncing}
              className="flex items-center gap-2 px-5 py-2.5 border border-[#1A1A1A] bg-white hover:bg-stone-100 disabled:opacity-50 text-xs font-mono font-bold uppercase text-[#1A1A1A]"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>ĐẨY DỮ LIỆU LÊN SHEETS (PUSH)</span>
            </button>
          )}

          <button
            onClick={handleExportFullBackup}
            className="flex items-center gap-2 px-5 py-2.5 border border-[#1A1A1A] bg-[#F9F7F2] hover:bg-[#1A1A1A] hover:text-white text-xs font-mono font-bold uppercase text-[#1A1A1A]"
          >
            <Download className="w-3.5 h-3.5" />
            <span>XUẤT FILE CSV DỰ PHÒNG</span>
          </button>
        </div>
      </div>

      {/* Step 2: Code generator */}
      <div className="p-6 sm:p-8 bg-[#F9F7F2] border-2 border-[#1A1A1A] editorial-shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-[#1A1A1A] pb-3">
          <h2 className="text-xs font-mono font-bold uppercase tracking-widest text-[#1A1A1A]">
            Mã nguồn Google Apps Script Backend (Sao chép để dán vào Apps Script)
          </h2>
          <button
            onClick={handleCopyCode}
            className="flex items-center gap-1.5 px-3 py-1.5 border border-[#1A1A1A] bg-white hover:bg-[#1A1A1A] hover:text-white text-xs font-mono font-bold uppercase transition"
          >
            {hasCopiedCode ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{hasCopiedCode ? 'ĐÃ SAO CHÉP' : 'SAO CHÉP MÃ NGUỒN'}</span>
          </button>
        </div>

        <pre className="p-4 bg-white border border-[#1A1A1A] text-[11px] font-mono text-[#1A1A1A] overflow-x-auto max-h-72">
          {appsScriptCode}
        </pre>
      </div>
    </div>
  );
};
