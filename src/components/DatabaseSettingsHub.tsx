import React, { useState } from 'react';
import { SupabaseSettings } from './SupabaseSettings';
import { GoogleSheetsSettings } from './GoogleSheetsSettings';
import { useApp } from '../context/AppContext';
import { Database, FileSpreadsheet, Trash2, AlertTriangle, RefreshCw } from 'lucide-react';

export const DatabaseSettingsHub: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'supabase' | 'sheets'>('supabase');
  const { clearAllData } = useApp();
  const [showConfirmClear, setShowConfirmClear] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [clearMessage, setClearMessage] = useState<{ success: boolean; message: string } | null>(null);

  const handleClearAll = async () => {
    setIsClearing(true);
    setClearMessage(null);
    const res = await clearAllData();
    setIsClearing(false);
    setShowConfirmClear(false);
    setClearMessage(res);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-16">
      {/* Editorial Page Header */}
      <div className="p-8 bg-white border-2 border-[#1A1A1A] editorial-shadow flex flex-col md:flex-row items-start md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="bg-[#1A1A1A] text-[#F9F7F2] text-[10px] font-mono font-bold uppercase px-2.5 py-0.5">
              Cơ sở dữ liệu Đám mây
            </span>
            <span className="text-xs font-serif italic text-stone-600">
              Supabase PostgreSQL &amp; Cloud Memory Store
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-serif font-black tracking-tight text-[#1A1A1A]">
            Quản Lý Cơ Sở Dữ Liệu
          </h1>
          <p className="text-xs font-mono uppercase tracking-widest text-stone-600 mt-2 max-w-2xl">
            Cấu hình đồng bộ dữ liệu hoặc quản lý thiết lập lưu trữ đám mây.
          </p>
        </div>

        <button
          onClick={() => setShowConfirmClear(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-mono text-xs font-bold uppercase tracking-wider border-2 border-[#1A1A1A] shadow-[2px_2px_0px_0px_#000] transition"
        >
          <Trash2 className="w-4 h-4" />
          <span>XÓA SẠCH DỮ LIỆU</span>
        </button>
      </div>

      {clearMessage && (
        <div
          className={`p-4 border-2 font-mono text-xs ${
            clearMessage.success ? 'bg-emerald-50 border-emerald-800 text-emerald-900' : 'bg-rose-50 border-rose-800 text-rose-900'
          }`}
        >
          {clearMessage.message}
        </div>
      )}

      {/* Confirmation Modal */}
      {showConfirmClear && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border-4 border-[#1A1A1A] shadow-[8px_8px_0px_0px_#000] max-w-md w-full p-6 space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <AlertTriangle className="w-8 h-8 flex-shrink-0" />
              <h3 className="text-lg font-serif font-black text-[#1A1A1A]">Xác nhận xóa sạch dữ liệu?</h3>
            </div>
            <p className="text-xs font-serif text-stone-700 leading-relaxed">
              Hành động này sẽ <strong>xóa sạch toàn bộ từ vựng, ngữ pháp, lịch sử học tập và nhật ký</strong> đang lưu trên trang web và máy chủ cloud trên mọi trình duyệt.
            </p>
            <div className="flex justify-end gap-3 pt-4 border-t border-stone-200">
              <button
                onClick={() => setShowConfirmClear(false)}
                className="px-4 py-2 border-2 border-[#1A1A1A] bg-white text-stone-800 font-mono text-xs font-bold uppercase hover:bg-stone-100"
              >
                HỦY BỎ
              </button>
              <button
                onClick={handleClearAll}
                disabled={isClearing}
                className="flex items-center gap-2 px-5 py-2 border-2 border-[#1A1A1A] bg-rose-600 text-white font-mono text-xs font-bold uppercase hover:bg-rose-700 disabled:opacity-50"
              >
                {isClearing && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                <span>{isClearing ? 'ĐANG XÓA...' : 'XÓA SẠCH NGAY'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tabs Selector */}
      <div className="flex items-center border-b-2 border-[#1A1A1A] bg-[#F3EFE6] p-1 gap-1">
        <button
          onClick={() => setActiveTab('supabase')}
          className={`flex-1 py-3 px-4 text-xs font-mono font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition border-2 ${
            activeTab === 'supabase'
              ? 'bg-[#1A1A1A] text-white border-[#1A1A1A] shadow-[2px_2px_0px_0px_#000]'
              : 'bg-white text-stone-700 border-transparent hover:bg-stone-100'
          }`}
        >
          <Database className="w-4 h-4 text-emerald-400" />
          <span>CSDL Supabase (PostgreSQL)</span>
          <span className="text-[9px] bg-emerald-500 text-stone-950 font-black px-1.5 py-0.5 rounded ml-1">
            MỚI / KHUYÊN DÙNG
          </span>
        </button>

        <button
          onClick={() => setActiveTab('sheets')}
          className={`flex-1 py-3 px-4 text-xs font-mono font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition border-2 ${
            activeTab === 'sheets'
              ? 'bg-[#1A1A1A] text-white border-[#1A1A1A] shadow-[2px_2px_0px_0px_#000]'
              : 'bg-white text-stone-700 border-transparent hover:bg-stone-100'
          }`}
        >
          <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
          <span>Google Sheets Database</span>
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'supabase' ? <SupabaseSettings /> : <GoogleSheetsSettings />}
    </div>
  );
};
