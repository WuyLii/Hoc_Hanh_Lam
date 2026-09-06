import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { SupabaseService, SupabaseConfig } from '../services/supabaseService';
import {
  Database,
  Copy,
  Check,
  RefreshCw,
  Download,
  Upload,
  AlertCircle,
  ExternalLink,
  Code2,
  CheckCircle2,
  KeyRound,
  Globe2,
} from 'lucide-react';

export const SupabaseSettings: React.FC = () => {
  const {
    currentUser,
    vocabulary,
    decks,
    grammar,
    reviewSessions,
    mockTests,
    progressLogs,
    journalEntries,
    chatHistory,
    notifications,
    importFromSupabase,
    exportToSupabase,
  } = useApp();

  const [config, setConfig] = useState<SupabaseConfig>(SupabaseService.getConfig());
  const [hasCopiedSql, setHasCopiedSql] = useState(false);
  const [testingConnection, setTestingConnection] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [feedback, setFeedback] = useState<{ success: boolean; message: string } | null>(null);

  // Read raw SQL script content embedded or defined
  const sqlScriptContent = `-- ====================================================================
-- SUPABASE DATABASE SCHEMA CHO ỨNG DỤNG HỌC HÀNH LẮM (MULTILINGUAL LEARNING)
-- ====================================================================
-- Hướng dẫn cài đặt trên Supabase:
-- 1. Truy cập vào dự án Supabase của bạn tại https://supabase.com
-- 2. Chọn mục "SQL Editor" ở thanh menu bên trái.
-- 3. Mở tab "New Query", dán toàn bộ đoạn mã SQL dưới đây và nhấn "Run".
-- ====================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. BẢNG THÔNG TIN NGƯỜI DÙNG
CREATE TABLE IF NOT EXISTS public.user_profiles (
    user_id TEXT PRIMARY KEY,
    ten TEXT NOT NULL DEFAULT 'Học viên',
    avatar TEXT,
    ngon_ngu_hoc TEXT NOT NULL DEFAULT 'ko',
    cap_do JSONB DEFAULT '{"en": "A1 - Cơ bản", "ko": "TOPIK 1 (Sơ cấp 1)", "zh": "HSK 1"}'::jsonb,
    muc_tieu JSONB DEFAULT '{"en": "15 phút/ngày", "ko": "15 phút/ngày", "zh": "15 phút/ngày"}'::jsonb,
    pin_hash TEXT,
    ngay_tham_gia TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    daily_target_minutes INTEGER DEFAULT 15,
    streak INTEGER DEFAULT 0,
    last_active_date DATE DEFAULT CURRENT_DATE,
    total_points INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. BẢNG TỪ VỰNG
CREATE TABLE IF NOT EXISTS public.vocabulary (
    word_id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL DEFAULT 'shared',
    tu TEXT NOT NULL,
    nghia TEXT NOT NULL,
    phien_am TEXT,
    loai_tu TEXT DEFAULT 'Từ vựng',
    vi_du TEXT,
    vi_du_dich TEXT,
    nghia_tieng_han TEXT,
    nghia_tieng_anh TEXT,
    phien_am_tieng_han TEXT,
    audio_url TEXT,
    hinh_url TEXT,
    ngon_ngu TEXT NOT NULL DEFAULT 'ko',
    chu_de TEXT DEFAULT 'Chung',
    cap_do TEXT DEFAULT 'Sơ cấp',
    nguon_goc TEXT DEFAULT 'Hệ thống',
    srs_box INTEGER DEFAULT 0,
    srs_next_review TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    srs_interval INTEGER DEFAULT 1,
    srs_ease REAL DEFAULT 2.5,
    times_reviewed INTEGER DEFAULT 0,
    times_correct INTEGER DEFAULT 0,
    last_reviewed TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. BẢNG BỘ TỪ VỰNG
CREATE TABLE IF NOT EXISTS public.decks (
    deck_id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL DEFAULT 'shared',
    ten_bo TEXT NOT NULL,
    ten_deck TEXT,
    ngon_ngu TEXT NOT NULL DEFAULT 'ko',
    mo_ta TEXT,
    nguoi_tao TEXT DEFAULT 'Hệ thống',
    danh_sach_word_id JSONB DEFAULT '[]'::jsonb,
    che_do_chia_se TEXT DEFAULT 'shared',
    color TEXT,
    icon TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. BẢNG NGỮ PHÁP
CREATE TABLE IF NOT EXISTS public.grammar (
    grammar_id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL DEFAULT 'shared',
    cau_truc TEXT NOT NULL,
    giai_thich TEXT NOT NULL,
    vi_du TEXT,
    vi_du_dich TEXT,
    ngon_ngu TEXT NOT NULL DEFAULT 'ko',
    cap_do TEXT DEFAULT 'Sơ cấp',
    ghi_chu TEXT,
    tags JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. BẢNG PHIÊN ÔN TẬP
CREATE TABLE IF NOT EXISTS public.review_sessions (
    session_id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    loai_game TEXT NOT NULL,
    thoi_gian_bat_dau TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    thoi_gian_ket_thuc TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    so_cau_dung INTEGER DEFAULT 0,
    so_cau_sai INTEGER DEFAULT 0,
    diem INTEGER DEFAULT 0,
    ngon_ngu TEXT DEFAULT 'ko',
    danh_sach_word_id JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. BẢNG LỊCH SỬ THI THỬ
CREATE TABLE IF NOT EXISTS public.mock_test_records (
    test_id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    loai_de TEXT NOT NULL,
    ten_de TEXT,
    ngon_ngu TEXT DEFAULT 'ko',
    cap_do TEXT,
    ngay_lam TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    diem_so INTEGER DEFAULT 0,
    tong_diem INTEGER DEFAULT 100,
    thoi_gian_lam_giay INTEGER DEFAULT 0,
    chi_tiet_cau_tra_loi JSONB DEFAULT '{}'::jsonb,
    feedback TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. BẢNG TIẾN ĐỘ HỌC HÀNG NGÀY
CREATE TABLE IF NOT EXISTS public.progress_records (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    ngon_ngu TEXT NOT NULL DEFAULT 'ko',
    ngay DATE NOT NULL DEFAULT CURRENT_DATE,
    so_tu_moi INTEGER DEFAULT 0,
    streak INTEGER DEFAULT 0,
    thoi_gian_hoc_phut INTEGER DEFAULT 0,
    score_earned INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, ngon_ngu, ngay)
);

-- 8. BẢNG NHẬT KÝ VIẾT AI
CREATE TABLE IF NOT EXISTS public.journal_entries (
    entry_id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    ngon_ngu TEXT NOT NULL DEFAULT 'ko',
    ngay TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    tieu_de TEXT,
    noi_dung TEXT NOT NULL,
    phan_hoi_ai JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 9. BẢNG HỘI THOẠI AI CHAT
CREATE TABLE IF NOT EXISTS public.chat_conversations (
    chat_id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    chu_de TEXT DEFAULT 'Giao tiếp',
    tieu_de TEXT,
    ngon_ngu TEXT NOT NULL DEFAULT 'ko',
    cac_tin_nhan JSONB DEFAULT '[]'::jsonb,
    tu_da_luu JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 10. BẢNG THÔNG BÁO
CREATE TABLE IF NOT EXISTS public.notifications (
    noti_id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    loai TEXT DEFAULT 'srs_due',
    noi_dung TEXT NOT NULL,
    thoi_gian TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    da_doc BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS & POLICIES
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vocabulary ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.decks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grammar ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.review_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mock_test_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.progress_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.journal_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public full access user_profiles" ON public.user_profiles FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public full access vocabulary" ON public.vocabulary FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public full access decks" ON public.decks FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public full access grammar" ON public.grammar FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public full access review_sessions" ON public.review_sessions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public full access mock_test_records" ON public.mock_test_records FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public full access progress_records" ON public.progress_records FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public full access journal_entries" ON public.journal_entries FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public full access chat_conversations" ON public.chat_conversations FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public full access notifications" ON public.notifications FOR ALL USING (true) WITH CHECK (true);
`;

  const handleCopySql = () => {
    navigator.clipboard.writeText(sqlScriptContent);
    setHasCopiedSql(true);
    setTimeout(() => setHasCopiedSql(false), 2500);
  };

  const handleSaveConfig = () => {
    SupabaseService.saveConfig(config);
    setFeedback({
      success: true,
      message: '✅ Đã lưu cấu hình kết nối Supabase thành công!',
    });
  };

  const handleTestConnection = async () => {
    handleSaveConfig();
    setTestingConnection(true);
    setFeedback(null);
    const result = await SupabaseService.testConnection(config.url, config.anonKey);
    setTestingConnection(false);
    setFeedback(result);
  };

  const handlePushToSupabase = async () => {
    handleSaveConfig();
    setIsSyncing(true);
    setFeedback(null);

    const res = await SupabaseService.pushAllData({
      userProfile: currentUser,
      vocabulary,
      decks,
      grammar,
      reviewSessions,
      mockTests,
      progressRecords: progressLogs,
      journalEntries,
      chatConversations: chatHistory,
      notifications,
    });

    setIsSyncing(false);
    setFeedback(res);
  };

  const handlePullFromSupabase = async () => {
    handleSaveConfig();
    setIsSyncing(true);
    setFeedback(null);

    const res = await importFromSupabase();
    setIsSyncing(false);
    setFeedback(res);
  };

  return (
    <div className="space-y-8">
      {/* Configuration Form Card */}
      <div className="bg-[#F9F7F2] border-2 border-[#1A1A1A] p-6 shadow-[4px_4px_0px_0px_#1A1A1A]">
        <h2 className="text-xl font-serif font-bold text-[#1A1A1A] flex items-center gap-2 mb-4">
          <KeyRound className="w-5 h-5 text-emerald-700" />
          <span>Thẻ Cấu hình Kết nối Supabase</span>
        </h2>

        <p className="text-xs font-mono text-stone-600 mb-6">
          Nhập thông tin <strong>Project URL</strong> và <strong>Anon API Key</strong> lấy từ Supabase Dashboard (Settings &gt; API).
        </p>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-mono font-bold uppercase text-[#1A1A1A] mb-1">
              Project URL (Supabase URL)
            </label>
            <div className="relative">
              <Globe2 className="w-4 h-4 absolute left-3 top-3 text-stone-400" />
              <input
                type="text"
                value={config.url}
                onChange={(e) => setConfig({ ...config, url: e.target.value.trim() })}
                placeholder="https://xyzcompany.supabase.co"
                className="w-full pl-9 pr-4 py-2 bg-white border border-[#1A1A1A] font-mono text-xs focus:outline-none focus:ring-2 focus:ring-emerald-600"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-mono font-bold uppercase text-[#1A1A1A] mb-1">
              Anon API Key (public)
            </label>
            <div className="relative">
              <KeyRound className="w-4 h-4 absolute left-3 top-3 text-stone-400" />
              <input
                type="password"
                value={config.anonKey}
                onChange={(e) => setConfig({ ...config, anonKey: e.target.value.trim() })}
                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                className="w-full pl-9 pr-4 py-2 bg-white border border-[#1A1A1A] font-mono text-xs focus:outline-none focus:ring-2 focus:ring-emerald-600"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 pt-2">
            <input
              type="checkbox"
              id="autoSyncCheck"
              checked={config.autoSync}
              onChange={(e) => setConfig({ ...config, autoSync: e.target.checked })}
              className="w-4 h-4 border-stone-800 rounded text-emerald-600 focus:ring-emerald-500"
            />
            <label htmlFor="autoSyncCheck" className="text-xs font-mono text-[#1A1A1A] cursor-pointer">
              Tự động lưu từ vựng &amp; tiến độ lên Supabase Cloud khi có thay đổi
            </label>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap items-center gap-3 pt-4 border-t border-stone-300">
            <button
              onClick={handleSaveConfig}
              className="px-4 py-2 bg-[#1A1A1A] text-white font-mono text-xs font-bold uppercase tracking-wider hover:bg-stone-800 transition shadow-[2px_2px_0px_0px_#000]"
            >
              Lưu Cấu Hình
            </button>

            <button
              onClick={handleTestConnection}
              disabled={testingConnection}
              className="px-4 py-2 bg-emerald-700 text-white font-mono text-xs font-bold uppercase tracking-wider hover:bg-emerald-800 transition flex items-center gap-1.5 shadow-[2px_2px_0px_0px_#000] disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${testingConnection ? 'animate-spin' : ''}`} />
              <span>{testingConnection ? 'Đang kiểm tra...' : 'Kiểm tra Kết nối'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Sync Operations Card */}
      <div className="bg-[#F9F7F2] border-2 border-[#1A1A1A] p-6 shadow-[4px_4px_0px_0px_#1A1A1A]">
        <h2 className="text-xl font-serif font-bold text-[#1A1A1A] flex items-center gap-2 mb-2">
          <Database className="w-5 h-5 text-amber-700" />
          <span>Thao Tác Đồng Bộ Dữ Liệu</span>
        </h2>

        <p className="text-xs font-mono text-stone-600 mb-6">
          Chuyển đổi dữ liệu dễ dàng giữa ứng dụng học web và Cơ sở dữ liệu Supabase của bạn.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white p-4 border border-[#1A1A1A] flex flex-col justify-between space-y-3">
            <div>
              <div className="text-xs font-mono font-bold uppercase text-amber-800 flex items-center gap-1.5 mb-1">
                <Upload className="w-4 h-4" />
                <span>Đẩy dữ liệu lên Supabase</span>
              </div>
              <p className="text-xs text-stone-600">
                Tải toàn bộ từ vựng hiện tại ({vocabulary.length} từ), bài tập, ngữ pháp ({grammar.length} cấu trúc) và tiến độ học từ trình duyệt lên Supabase Cloud.
              </p>
            </div>
            <button
              onClick={handlePushToSupabase}
              disabled={isSyncing}
              className="w-full py-2 bg-amber-600 text-white font-mono text-xs font-bold uppercase hover:bg-amber-700 transition flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Đẩy Dữ Liệu Lên Cloud</span>
            </button>
          </div>

          <div className="bg-white p-4 border border-[#1A1A1A] flex flex-col justify-between space-y-3">
            <div>
              <div className="text-xs font-mono font-bold uppercase text-blue-800 flex items-center gap-1.5 mb-1">
                <Download className="w-4 h-4" />
                <span>Tải dữ liệu từ Supabase về</span>
              </div>
              <p className="text-xs text-stone-600">
                Khôi phục lại dữ liệu học tập cá nhân đã lưu trữ sẵn từ dự án Supabase Cloud về máy tính/điện thoại này.
              </p>
            </div>
            <button
              onClick={handlePullFromSupabase}
              disabled={isSyncing}
              className="w-full py-2 bg-blue-700 text-white font-mono text-xs font-bold uppercase hover:bg-blue-800 transition flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Tải Dữ Liệu Về Web</span>
            </button>
          </div>
        </div>
      </div>

      {/* SQL Setup Script Card */}
      <div className="bg-white border-2 border-[#1A1A1A] p-6 shadow-[4px_4px_0px_0px_#1A1A1A] space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-200 pb-4">
          <div>
            <h2 className="text-xl font-serif font-bold text-[#1A1A1A] flex items-center gap-2">
              <Code2 className="w-5 h-5 text-indigo-700" />
              <span>Mã Nguồn SQL Tạo Bảng (Supabase Schema Script)</span>
            </h2>
            <p className="text-xs font-mono text-stone-600 mt-1">
              Sao chép mã SQL bên dưới và dán vào <strong>SQL Editor</strong> trong Supabase Dashboard để tự động khởi tạo 10 bảng dữ liệu chuẩn.
            </p>
          </div>

          <button
            onClick={handleCopySql}
            className="px-4 py-2.5 bg-indigo-700 text-white font-mono text-xs font-bold uppercase tracking-wider hover:bg-indigo-800 transition flex items-center gap-2 shrink-0 shadow-[2px_2px_0px_0px_#000]"
          >
            {hasCopiedSql ? (
              <>
                <Check className="w-4 h-4 text-emerald-300" />
                <span>Đã Sao Chép!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                <span>Sao Chép Mã SQL</span>
              </>
            )}
          </button>
        </div>

        {/* Step by step guide */}
        <div className="bg-amber-50/60 border border-amber-300 p-4 text-xs font-mono space-y-2 text-stone-800">
          <div className="font-bold uppercase text-amber-900 flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-amber-700" />
            <span>Hướng dẫn 3 bước tạo bảng nhanh trên Supabase:</span>
          </div>
          <ol className="list-decimal list-inside space-y-1 text-stone-700 pl-1">
            <li>
              Đăng nhập vào <a href="https://supabase.com" target="_blank" rel="noreferrer" className="underline font-bold text-amber-900">supabase.com</a> và chọn dự án của bạn.
            </li>
            <li>
              Mở thanh công cụ <strong>SQL Editor</strong> ở cột bên trái &gt; Nhấn <strong>New query</strong>.
            </li>
            <li>
              Dán toàn bộ mã SQL dưới đây vào và bấm <strong>Run</strong> (hoặc nhấn Ctrl+Enter / Cmd+Enter).
            </li>
          </ol>
        </div>

        {/* SQL Code Block */}
        <div className="relative">
          <pre className="p-4 bg-stone-900 text-emerald-400 font-mono text-[11px] overflow-x-auto max-h-80 rounded-none border border-[#1A1A1A] leading-relaxed selection:bg-emerald-800 selection:text-white">
            {sqlScriptContent}
          </pre>
        </div>
      </div>
    </div>
  );
};
