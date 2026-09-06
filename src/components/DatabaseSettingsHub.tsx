import React, { useState } from 'react';
import { SupabaseSettings } from './SupabaseSettings';
import { GoogleSheetsSettings } from './GoogleSheetsSettings';
import { Database, FileSpreadsheet, Sparkles, Layers } from 'lucide-react';

export const DatabaseSettingsHub: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'supabase' | 'sheets'>('supabase');

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
              Supabase PostgreSQL &amp; Google Sheets
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-serif font-black tracking-tight text-[#1A1A1A]">
            Quản Lý Cơ Sở Dữ Liệu
          </h1>
          <p className="text-xs font-mono uppercase tracking-widest text-stone-600 mt-2 max-w-2xl">
            Lựa chọn kho lưu trữ dữ liệu từ vựng, ngữ pháp và tiến độ học tập cá nhân vĩnh viễn trên Cloud.
          </p>
        </div>
      </div>

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
