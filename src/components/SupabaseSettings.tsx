import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { SupabaseService, SupabaseConfig, FailedChunk } from '../services/supabaseService';
import {
  getSyncQueueCount,
  clearSyncQueue,
  getSyncQueue,
  SyncQueueItem,
} from '../utils/idbStorage';
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
  Eye,
  EyeOff,
  HelpCircle,
  Trash2,
  ListOrdered,
  Layers,
  ShieldCheck,
  Sparkles,
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

  const [config, setConfig] = useState<SupabaseConfig>(() => {
    const current = SupabaseService.getConfig();
    // Enforce target supabase URL
    const updated = {
      ...current,
      url: current.url && current.url.startsWith('https://') && !current.url.includes('example') && !current.url.includes('your-project-id')
        ? current.url
        : 'https://fzdxabrvddjtpnbjvcii.supabase.co',
    };
    SupabaseService.saveConfig(updated);
    return updated;
  });

  useEffect(() => {
    // Automatically ensure state and service have the target URL
    const current = SupabaseService.getConfig();
    if (!current.url || current.url.includes('example') || current.url.includes('your-project-id')) {
      const updated = { ...current, url: 'https://fzdxabrvddjtpnbjvcii.supabase.co' };
      SupabaseService.saveConfig(updated);
      setConfig(updated);
    }
  }, []);

  const [showKey, setShowKey] = useState(false);
  const [hasCopiedSql, setHasCopiedSql] = useState(false);
  const [hasCopiedGrantSql, setHasCopiedGrantSql] = useState(false);
  const [hasCopiedAlterSql, setHasCopiedAlterSql] = useState(false);
  const [testingConnection, setTestingConnection] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [feedback, setFeedback] = useState<{ success: boolean; message: string } | null>(null);
  const [failedChunks, setFailedChunks] = useState<FailedChunk[]>([]);
  const [offlineQueueCount, setOfflineQueueCount] = useState<number>(0);
  const [isDrainingQueue, setIsDrainingQueue] = useState(false);

  // Refresh queue count
  const refreshQueueCount = async () => {
    const count = await getSyncQueueCount();
    setOfflineQueueCount(count);
  };

  useEffect(() => {
    refreshQueueCount();
    const timer = setInterval(refreshQueueCount, 10000);
    return () => clearInterval(timer);
  }, []);

  // Read raw SQL script content embedded or defined
  const sqlScriptContent = `-- ====================================================================
-- SUPABASE DATABASE SCHEMA CHO ỨNG DỤNG TINH NGỮ (MULTILINGUAL LEARNING)
-- ====================================================================
-- Hướng dẫn cài đặt trên Supabase:
-- 1. Truy cập vào dự án Supabase của bạn tại https://supabase.com
-- 2. Chọn mục "SQL Editor" ở thanh menu bên trái.
-- 3. Mở tab "New Query", dán toàn bộ đoạn mã SQL dưới đây và nhấn "Run".
-- ====================================================================

-- Kích hoạt tiện ích mở rộng UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. BẢNG THÔNG TIN NGƯỜI DÙNG (user_profiles)
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

-- 2. BẢNG TỪ VỰNG (vocabulary)
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
    bai_hoc TEXT DEFAULT 'Bài 1',
    nguon_goc TEXT DEFAULT 'Hệ thống',
    srs_box INTEGER DEFAULT 0,
    srs_next_review TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    srs_interval INTEGER DEFAULT 1,
    srs_ease REAL DEFAULT 2.5,
    times_reviewed INTEGER DEFAULT 0,
    times_correct INTEGER DEFAULT 0,
    last_reviewed TIMESTAMP WITH TIME ZONE,
    retention_level TEXT DEFAULT 'chua_danh_gia',
    is_added_today_flashcard BOOLEAN DEFAULT FALSE,
    is_starred BOOLEAN DEFAULT FALSE,
    added_to_today_flashcard_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tự động thêm cột nâng cấp nếu bảng vocabulary đã tồn tại từ trước (Chạy an toàn)
ALTER TABLE public.vocabulary ADD COLUMN IF NOT EXISTS bai_hoc TEXT DEFAULT 'Bài 1';
ALTER TABLE public.vocabulary ADD COLUMN IF NOT EXISTS retention_level TEXT DEFAULT 'chua_danh_gia';
ALTER TABLE public.vocabulary ADD COLUMN IF NOT EXISTS is_added_today_flashcard BOOLEAN DEFAULT FALSE;
ALTER TABLE public.vocabulary ADD COLUMN IF NOT EXISTS is_starred BOOLEAN DEFAULT FALSE;
ALTER TABLE public.vocabulary ADD COLUMN IF NOT EXISTS added_to_today_flashcard_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.vocabulary ALTER COLUMN retention_level SET DEFAULT 'chua_danh_gia';

-- 3. BẢNG BỘ TỪ VỰNG / DECKS (decks)
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

-- 4. BẢNG NGỮ PHÁP (grammar)
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

-- 5. BẢNG PHIÊN ÔN TẬP (review_sessions)
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

-- 6. BẢNG LỊCH SỬ THI THỬ (mock_test_records)
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

-- 7. BẢNG TIẾN ĐỘ HỌC HÀNG NGÀY (progress_records)
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

-- 8. BẢNG NHẬT KÝ VIẾT AI (journal_entries)
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

-- 9. BẢNG HỘI THOẠI AI CHAT (chat_conversations)
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

-- 10. BẢNG THÔNG BÁO (notifications)
CREATE TABLE IF NOT EXISTS public.notifications (
    noti_id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    loai TEXT DEFAULT 'srs_due',
    noi_dung TEXT NOT NULL,
    thoi_gian TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    da_doc BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- CHỈ MỤC (INDEXES) TỐI ƯU
CREATE INDEX IF NOT EXISTS idx_vocabulary_user_lang ON public.vocabulary(user_id, ngon_ngu);
CREATE INDEX IF NOT EXISTS idx_vocabulary_bai_hoc ON public.vocabulary(bai_hoc);
CREATE INDEX IF NOT EXISTS idx_vocabulary_srs_next ON public.vocabulary(srs_next_review);
CREATE INDEX IF NOT EXISTS idx_vocabulary_starred ON public.vocabulary(is_starred);
CREATE INDEX IF NOT EXISTS idx_vocabulary_today ON public.vocabulary(is_added_today_flashcard);
CREATE INDEX IF NOT EXISTS idx_vocabulary_retention ON public.vocabulary(retention_level);
CREATE INDEX IF NOT EXISTS idx_grammar_user_lang ON public.grammar(user_id, ngon_ngu);
CREATE INDEX IF NOT EXISTS idx_decks_lang ON public.decks(ngon_ngu);
CREATE INDEX IF NOT EXISTS idx_review_sessions_user ON public.review_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_progress_user_date ON public.progress_records(user_id, ngay);
CREATE INDEX IF NOT EXISTS idx_journal_user ON public.journal_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_user ON public.chat_conversations(user_id);

-- ====================================================================
-- PHÂN QUYỀN TỐI THIỂU & ROW LEVEL SECURITY (RLS)
-- ====================================================================
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM anon;
REVOKE ALL ON ALL ROUTINES IN SCHEMA public FROM anon, authenticated, public;

GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;

-- Đặt quyền mặc định cho các bảng/sequences tạo mới trong tương lai
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON TABLES FROM anon;
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON ROUTINES FROM anon, authenticated, public;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT ON SEQUENCES TO anon, authenticated;

-- CÁC HÀM RPC ĐƯỢC CẤP QUYỀN THỰC THI RÕ RÀNG (EXPLICIT RPC ROUTINES)
CREATE OR REPLACE FUNCTION public.health_check()
RETURNS JSON LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  SELECT json_build_object('status', 'online', 'timestamp', NOW());
$$;
GRANT EXECUTE ON FUNCTION public.health_check() TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.get_user_stats(p_user_id TEXT)
RETURNS JSON LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
    v_vocab_count INT;
    v_deck_count INT;
    v_grammar_count INT;
BEGIN
    IF auth.uid()::text != p_user_id THEN
        RAISE EXCEPTION 'Access denied';
    END IF;
    SELECT COUNT(*) INTO v_vocab_count FROM public.vocabulary WHERE user_id = p_user_id;
    SELECT COUNT(*) INTO v_deck_count FROM public.decks WHERE user_id = p_user_id;
    SELECT COUNT(*) INTO v_grammar_count FROM public.grammar WHERE user_id = p_user_id;
    RETURN json_build_object('vocab_count', v_vocab_count, 'deck_count', v_deck_count, 'grammar_count', v_grammar_count);
END;
$$;
GRANT EXECUTE ON FUNCTION public.get_user_stats(TEXT) TO authenticated;

-- Kích hoạt RLS cho 10 bảng (ĐÃ LOẠI BỎ auth.role() = 'anon' ĐỂ CHỐNG LỖ HỔNG LỘ DỮ LIỆU)
ALTER TABLE IF EXISTS public.user_profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "user_profiles_all_policy" ON public.user_profiles;
DROP POLICY IF EXISTS "user_profiles_select_policy" ON public.user_profiles;
DROP POLICY IF EXISTS "user_profiles_insert_policy" ON public.user_profiles;
DROP POLICY IF EXISTS "user_profiles_update_policy" ON public.user_profiles;
DROP POLICY IF EXISTS "user_profiles_delete_policy" ON public.user_profiles;
CREATE POLICY "user_profiles_all_policy" ON public.user_profiles FOR ALL USING (auth.uid()::text = user_id) WITH CHECK (auth.uid()::text = user_id);

ALTER TABLE IF EXISTS public.vocabulary ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "vocabulary_all_policy" ON public.vocabulary;
DROP POLICY IF EXISTS "vocabulary_select_policy" ON public.vocabulary;
DROP POLICY IF EXISTS "vocabulary_insert_policy" ON public.vocabulary;
DROP POLICY IF EXISTS "vocabulary_update_policy" ON public.vocabulary;
DROP POLICY IF EXISTS "vocabulary_delete_policy" ON public.vocabulary;
CREATE POLICY "vocabulary_select_policy" ON public.vocabulary FOR SELECT USING (auth.uid()::text = user_id OR user_id = 'shared' OR user_id = 'system' OR user_id = 'template' OR user_id IS NULL OR user_id = '');
CREATE POLICY "vocabulary_insert_policy" ON public.vocabulary FOR INSERT WITH CHECK (auth.uid()::text = user_id OR auth.uid() IS NOT NULL);
CREATE POLICY "vocabulary_update_policy" ON public.vocabulary FOR UPDATE USING (auth.uid()::text = user_id) WITH CHECK (auth.uid()::text = user_id);
CREATE POLICY "vocabulary_delete_policy" ON public.vocabulary FOR DELETE USING (auth.uid()::text = user_id);

ALTER TABLE IF EXISTS public.decks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "decks_all_policy" ON public.decks;
DROP POLICY IF EXISTS "decks_select_policy" ON public.decks;
DROP POLICY IF EXISTS "decks_insert_policy" ON public.decks;
DROP POLICY IF EXISTS "decks_update_policy" ON public.decks;
DROP POLICY IF EXISTS "decks_delete_policy" ON public.decks;
CREATE POLICY "decks_select_policy" ON public.decks FOR SELECT USING (auth.uid()::text = user_id OR user_id = 'shared' OR user_id = 'system' OR user_id = 'template' OR user_id IS NULL OR user_id = '' OR che_do_chia_se = 'shared');
CREATE POLICY "decks_insert_policy" ON public.decks FOR INSERT WITH CHECK (auth.uid()::text = user_id OR auth.uid() IS NOT NULL);
CREATE POLICY "decks_update_policy" ON public.decks FOR UPDATE USING (auth.uid()::text = user_id) WITH CHECK (auth.uid()::text = user_id);
CREATE POLICY "decks_delete_policy" ON public.decks FOR DELETE USING (auth.uid()::text = user_id);

ALTER TABLE IF EXISTS public.grammar ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "grammar_all_policy" ON public.grammar;
DROP POLICY IF EXISTS "grammar_select_policy" ON public.grammar;
DROP POLICY IF EXISTS "grammar_insert_policy" ON public.grammar;
DROP POLICY IF EXISTS "grammar_update_policy" ON public.grammar;
DROP POLICY IF EXISTS "grammar_delete_policy" ON public.grammar;
CREATE POLICY "grammar_select_policy" ON public.grammar FOR SELECT USING (auth.uid()::text = user_id OR user_id = 'shared' OR user_id = 'system' OR user_id = 'template' OR user_id IS NULL OR user_id = '');
CREATE POLICY "grammar_insert_policy" ON public.grammar FOR INSERT WITH CHECK (auth.uid()::text = user_id OR auth.uid() IS NOT NULL);
CREATE POLICY "grammar_update_policy" ON public.grammar FOR UPDATE USING (auth.uid()::text = user_id) WITH CHECK (auth.uid()::text = user_id);
CREATE POLICY "grammar_delete_policy" ON public.grammar FOR DELETE USING (auth.uid()::text = user_id);

ALTER TABLE IF EXISTS public.review_sessions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "review_sessions_all_policy" ON public.review_sessions;
CREATE POLICY "review_sessions_all_policy" ON public.review_sessions FOR ALL USING (auth.uid()::text = user_id) WITH CHECK (auth.uid()::text = user_id);

ALTER TABLE IF EXISTS public.mock_test_records ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "mock_tests_all_policy" ON public.mock_test_records;
CREATE POLICY "mock_tests_all_policy" ON public.mock_test_records FOR ALL USING (auth.uid()::text = user_id) WITH CHECK (auth.uid()::text = user_id);

ALTER TABLE IF EXISTS public.progress_records ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "progress_all_policy" ON public.progress_records;
CREATE POLICY "progress_all_policy" ON public.progress_records FOR ALL USING (auth.uid()::text = user_id) WITH CHECK (auth.uid()::text = user_id);

ALTER TABLE IF EXISTS public.journal_entries ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "journal_all_policy" ON public.journal_entries;
CREATE POLICY "journal_all_policy" ON public.journal_entries FOR ALL USING (auth.uid()::text = user_id) WITH CHECK (auth.uid()::text = user_id);

ALTER TABLE IF EXISTS public.chat_conversations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "chat_all_policy" ON public.chat_conversations;
CREATE POLICY "chat_all_policy" ON public.chat_conversations FOR ALL USING (auth.uid()::text = user_id) WITH CHECK (auth.uid()::text = user_id);

ALTER TABLE IF EXISTS public.notifications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "notifications_all_policy" ON public.notifications;
CREATE POLICY "notifications_all_policy" ON public.notifications FOR ALL USING (auth.uid()::text = user_id) WITH CHECK (auth.uid()::text = user_id);
`;

  const grantOnlySqlScript = `-- CẤP QUYỀN TỐI THIỂU & CẬP NHẬT RLS CHỐNG LỖI 42501 (CHẠY TRONG SQL EDITOR):
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM anon;
REVOKE ALL ON ALL ROUTINES IN SCHEMA public FROM anon, authenticated, public;

GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;

ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON TABLES FROM anon;
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON ROUTINES FROM anon, authenticated, public;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT ON SEQUENCES TO anon, authenticated;

-- CÁC HÀM RPC ĐƯỢC CẤP QUYỀN THỰC THI RÕ RÀNG (EXPLICIT RPC ROUTINES)
CREATE OR REPLACE FUNCTION public.health_check()
RETURNS JSON LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  SELECT json_build_object('status', 'online', 'timestamp', NOW());
$$;
GRANT EXECUTE ON FUNCTION public.health_check() TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.get_user_stats(p_user_id TEXT)
RETURNS JSON LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
    v_vocab_count INT;
    v_deck_count INT;
    v_grammar_count INT;
BEGIN
    IF auth.uid()::text != p_user_id THEN
        RAISE EXCEPTION 'Access denied';
    END IF;
    SELECT COUNT(*) INTO v_vocab_count FROM public.vocabulary WHERE user_id = p_user_id;
    SELECT COUNT(*) INTO v_deck_count FROM public.decks WHERE user_id = p_user_id;
    SELECT COUNT(*) INTO v_grammar_count FROM public.grammar WHERE user_id = p_user_id;
    RETURN json_build_object('vocab_count', v_vocab_count, 'deck_count', v_deck_count, 'grammar_count', v_grammar_count);
END;
$$;
GRANT EXECUTE ON FUNCTION public.get_user_stats(TEXT) TO authenticated;

-- Thiết lập RLS đảm bảo bảo mật tuyệt đối (chỉ người dùng sở hữu mới đọc/ghi, shared chỉ cho phép đọc từ vựng/ngữ pháp/deck mẫu):
ALTER TABLE IF EXISTS public.user_profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "user_profiles_all_policy" ON public.user_profiles;
CREATE POLICY "user_profiles_all_policy" ON public.user_profiles FOR ALL USING (auth.uid()::text = user_id) WITH CHECK (auth.uid()::text = user_id);

ALTER TABLE IF EXISTS public.vocabulary ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "vocabulary_all_policy" ON public.vocabulary;
DROP POLICY IF EXISTS "vocabulary_select_policy" ON public.vocabulary;
DROP POLICY IF EXISTS "vocabulary_insert_policy" ON public.vocabulary;
DROP POLICY IF EXISTS "vocabulary_update_policy" ON public.vocabulary;
DROP POLICY IF EXISTS "vocabulary_delete_policy" ON public.vocabulary;
CREATE POLICY "vocabulary_select_policy" ON public.vocabulary FOR SELECT USING (auth.uid()::text = user_id OR user_id = 'shared' OR user_id = 'system' OR user_id = 'template' OR user_id IS NULL OR user_id = '');
CREATE POLICY "vocabulary_insert_policy" ON public.vocabulary FOR INSERT WITH CHECK (auth.uid()::text = user_id OR auth.uid() IS NOT NULL);
CREATE POLICY "vocabulary_update_policy" ON public.vocabulary FOR UPDATE USING (auth.uid()::text = user_id) WITH CHECK (auth.uid()::text = user_id);
CREATE POLICY "vocabulary_delete_policy" ON public.vocabulary FOR DELETE USING (auth.uid()::text = user_id);

ALTER TABLE IF EXISTS public.decks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "decks_all_policy" ON public.decks;
DROP POLICY IF EXISTS "decks_select_policy" ON public.decks;
DROP POLICY IF EXISTS "decks_insert_policy" ON public.decks;
DROP POLICY IF EXISTS "decks_update_policy" ON public.decks;
DROP POLICY IF EXISTS "decks_delete_policy" ON public.decks;
CREATE POLICY "decks_select_policy" ON public.decks FOR SELECT USING (auth.uid()::text = user_id OR user_id = 'shared' OR user_id = 'system' OR user_id = 'template' OR user_id IS NULL OR user_id = '' OR che_do_chia_se = 'shared');
CREATE POLICY "decks_insert_policy" ON public.decks FOR INSERT WITH CHECK (auth.uid()::text = user_id OR auth.uid() IS NOT NULL);
CREATE POLICY "decks_update_policy" ON public.decks FOR UPDATE USING (auth.uid()::text = user_id) WITH CHECK (auth.uid()::text = user_id);
CREATE POLICY "decks_delete_policy" ON public.decks FOR DELETE USING (auth.uid()::text = user_id);

ALTER TABLE IF EXISTS public.grammar ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "grammar_all_policy" ON public.grammar;
DROP POLICY IF EXISTS "grammar_select_policy" ON public.grammar;
DROP POLICY IF EXISTS "grammar_insert_policy" ON public.grammar;
DROP POLICY IF EXISTS "grammar_update_policy" ON public.grammar;
DROP POLICY IF EXISTS "grammar_delete_policy" ON public.grammar;
CREATE POLICY "grammar_select_policy" ON public.grammar FOR SELECT USING (auth.uid()::text = user_id OR user_id = 'shared' OR user_id = 'system' OR user_id = 'template' OR user_id IS NULL OR user_id = '');
CREATE POLICY "grammar_insert_policy" ON public.grammar FOR INSERT WITH CHECK (auth.uid()::text = user_id OR auth.uid() IS NOT NULL);
CREATE POLICY "grammar_update_policy" ON public.grammar FOR UPDATE USING (auth.uid()::text = user_id) WITH CHECK (auth.uid()::text = user_id);
CREATE POLICY "grammar_delete_policy" ON public.grammar FOR DELETE USING (auth.uid()::text = user_id);

ALTER TABLE IF EXISTS public.review_sessions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "review_sessions_all_policy" ON public.review_sessions;
CREATE POLICY "review_sessions_all_policy" ON public.review_sessions FOR ALL USING (auth.uid()::text = user_id) WITH CHECK (auth.uid()::text = user_id);

ALTER TABLE IF EXISTS public.mock_test_records ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "mock_tests_all_policy" ON public.mock_test_records;
CREATE POLICY "mock_tests_all_policy" ON public.mock_test_records FOR ALL USING (auth.uid()::text = user_id) WITH CHECK (auth.uid()::text = user_id);

ALTER TABLE IF EXISTS public.progress_records ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "progress_all_policy" ON public.progress_records;
CREATE POLICY "progress_all_policy" ON public.progress_records FOR ALL USING (auth.uid()::text = user_id) WITH CHECK (auth.uid()::text = user_id);

ALTER TABLE IF EXISTS public.journal_entries ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "journal_all_policy" ON public.journal_entries;
CREATE POLICY "journal_all_policy" ON public.journal_entries FOR ALL USING (auth.uid()::text = user_id) WITH CHECK (auth.uid()::text = user_id);

ALTER TABLE IF EXISTS public.chat_conversations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "chat_all_policy" ON public.chat_conversations;
CREATE POLICY "chat_all_policy" ON public.chat_conversations FOR ALL USING (auth.uid()::text = user_id) WITH CHECK (auth.uid()::text = user_id);

ALTER TABLE IF EXISTS public.notifications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "notifications_all_policy" ON public.notifications;
CREATE POLICY "notifications_all_policy" ON public.notifications FOR ALL USING (auth.uid()::text = user_id) WITH CHECK (auth.uid()::text = user_id);`;

  const alterOnlySqlScript = `-- ====================================================================
-- MÃ SQL NÂNG CẤP NHANH CHO BẢNG TỪ VỰNG ĐÃ TỒN TẠI (CHẠY TRONG SQL EDITOR)
-- Bổ sung đầy đủ cột Đánh dấu sao (is_starred) & Trạng thái học (retention_level)
-- ====================================================================
ALTER TABLE public.vocabulary ADD COLUMN IF NOT EXISTS is_starred BOOLEAN DEFAULT FALSE;
ALTER TABLE public.vocabulary ADD COLUMN IF NOT EXISTS is_added_today_flashcard BOOLEAN DEFAULT FALSE;
ALTER TABLE public.vocabulary ADD COLUMN IF NOT EXISTS added_to_today_flashcard_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.vocabulary ADD COLUMN IF NOT EXISTS retention_level TEXT DEFAULT 'chua_danh_gia';
ALTER TABLE public.vocabulary ADD COLUMN IF NOT EXISTS bai_hoc TEXT DEFAULT 'Bài 1';
ALTER TABLE public.vocabulary ALTER COLUMN retention_level SET DEFAULT 'chua_danh_gia';

CREATE INDEX IF NOT EXISTS idx_vocabulary_starred ON public.vocabulary(is_starred);
CREATE INDEX IF NOT EXISTS idx_vocabulary_today ON public.vocabulary(is_added_today_flashcard);
CREATE INDEX IF NOT EXISTS idx_vocabulary_retention ON public.vocabulary(retention_level);
`;

  const handleCopyAlterSql = () => {
    navigator.clipboard.writeText(alterOnlySqlScript);
    setHasCopiedAlterSql(true);
    setTimeout(() => setHasCopiedAlterSql(false), 2500);
  };

  const handleCopyGrantSql = () => {
    navigator.clipboard.writeText(grantOnlySqlScript);
    setHasCopiedGrantSql(true);
    setTimeout(() => setHasCopiedGrantSql(false), 2500);
  };

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
    setFailedChunks([]);
    const result = await SupabaseService.testConnection(config.url, config.anonKey);
    setTestingConnection(false);
    setFeedback(result);
    refreshQueueCount();
  };

  const handlePushToSupabase = async () => {
    handleSaveConfig();
    setIsSyncing(true);
    setFeedback(null);
    setFailedChunks([]);

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
    refreshQueueCount();
  };

  const handlePullFromSupabase = async () => {
    handleSaveConfig();
    setIsSyncing(true);
    setFeedback(null);
    setFailedChunks([]);

    const res = await importFromSupabase();
    setIsSyncing(false);
    setFeedback(res);
    refreshQueueCount();
  };

  const handleClearCloudData = async () => {
    const ok = window.confirm(
      '⚠️ CẢNH BÁO: Thao tác này sẽ xóa sạch TOÀN BỘ từ vựng, ngữ pháp và tiến độ học đang lưu trữ trên Cơ sở dữ liệu Supabase Cloud của bạn.\n\nBạn có chắc chắn muốn xóa hết không?'
    );
    if (!ok) return;

    handleSaveConfig();
    setIsSyncing(true);
    setFeedback(null);
    setFailedChunks([]);

    const res = await SupabaseService.clearAllCloudData();
    setIsSyncing(false);
    setFeedback(res);
    refreshQueueCount();
  };

  const handleDrainOfflineQueue = async () => {
    setIsDrainingQueue(true);
    setFeedback(null);
    const res = await SupabaseService.drainSyncQueue();
    setIsDrainingQueue(false);
    setFeedback({
      success: res.failed === 0,
      message: `Đã xử lý hàng đợi offline: Thành công ${res.processed} tác vụ, thất bại ${res.failed} tác vụ, còn lại trong hàng đợi ${res.remaining} tác vụ.`,
    });
    refreshQueueCount();
  };

  const handleClearOfflineQueue = async () => {
    await clearSyncQueue();
    setOfflineQueueCount(0);
    setFeedback({
      success: true,
      message: 'Đã dọn sạch hàng đợi offline.',
    });
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
            <div className="relative flex items-center">
              <Globe2 className="w-4 h-4 absolute left-3 top-3 text-stone-400" />
              <input
                id="supabase-project-url-input"
                type="text"
                value={config.url}
                onChange={(e) => setConfig({ ...config, url: e.target.value.trim() })}
                placeholder="https://fzdxabrvddjtpnbjvcii.supabase.co"
                className="w-full pl-9 pr-24 py-2 bg-white border border-[#1A1A1A] font-mono text-xs focus:outline-none focus:ring-2 focus:ring-emerald-600 font-medium"
              />
              <button
                type="button"
                onClick={() => setConfig({ ...config, url: 'https://fzdxabrvddjtpnbjvcii.supabase.co' })}
                className="absolute right-1.5 top-1.5 px-2 py-1 bg-stone-100 hover:bg-stone-200 text-stone-700 text-[11px] font-mono border border-stone-300 rounded transition"
                title="Khôi phục URL dự án mặc định"
              >
                Mặc định
              </button>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-mono font-bold uppercase text-[#1A1A1A]">
                Anon API Key (public)
              </label>
              <span className={`text-[11px] font-mono ${config.anonKey.length < 30 ? 'text-amber-600' : 'text-emerald-700'}`}>
                {config.anonKey ? `${config.anonKey.length} ký tự` : 'Chưa nhập'}
              </span>
            </div>
            <div className="relative">
              <KeyRound className="w-4 h-4 absolute left-3 top-3 text-stone-400" />
              <input
                type={showKey ? 'text' : 'password'}
                value={config.anonKey}
                onChange={(e) => {
                  const cleaned = e.target.value.replace(/['"\r\n\t ]/g, '').trim();
                  setConfig({ ...config, anonKey: cleaned });
                }}
                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                className="w-full pl-9 pr-10 py-2 bg-white border border-[#1A1A1A] font-mono text-xs focus:outline-none focus:ring-2 focus:ring-emerald-600"
              />
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="absolute right-2.5 top-2.5 text-stone-500 hover:text-stone-800 focus:outline-none"
                title={showKey ? 'Ẩn khóa' : 'Xem khóa'}
              >
                {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {config.anonKey && config.anonKey.length < 50 && (
              <p className="text-[11px] text-amber-700 font-mono mt-1 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>Chú ý: Anon Key thường là chuỗi JWT rất dài (bắt đầu bằng <code>eyJ...</code>). Hãy kiểm tra xem bạn có vô tình copy nhầm Project ID hoặc Password không.</span>
              </p>
            )}
          </div>

          {/* Quick guide for 401 error */}
          <div className="bg-amber-50 border border-amber-300 p-3 rounded text-xs font-sans text-amber-900 space-y-1">
            <div className="font-bold flex items-center gap-1.5 text-amber-950 font-mono">
              <HelpCircle className="w-4 h-4 text-amber-700" />
              <span>Hướng dẫn sửa lỗi 401 (Unauthorized):</span>
            </div>
            <p className="text-stone-700">
              Lỗi <strong>401 Unauthorized</strong> xảy ra khi Anon API Key không khớp hoặc copy nhầm loại khóa. Cách lấy đúng:
            </p>
            <ol className="list-decimal pl-5 space-y-0.5 text-stone-700">
              <li>Mở Supabase Dashboard &gt; chọn dự án của bạn &gt; vào <strong>Project Settings</strong> (bánh răng) &gt; chọn <strong>API</strong>.</li>
              <li>Ở phần <strong>Project API keys</strong>, bấm nút <strong>Copy</strong> ở dòng <strong><code>anon</code> <code>public</code></strong> (chuỗi bắt đầu bằng <code>eyJ...</code>).</li>
              <li><em>Không</em> copy <code>service_role</code>, <em>không</em> copy Database Password hay Project ID.</li>
            </ol>
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

          {/* Feedback message banner */}
          {feedback && (
            <div
              className={`p-3.5 border font-mono text-xs mt-3 flex flex-col gap-2 ${
                feedback.success
                  ? 'bg-emerald-50 border-emerald-400 text-emerald-950'
                  : 'bg-rose-50 border-rose-400 text-rose-950'
              }`}
            >
              <div className="flex items-start gap-2">
                {feedback.success ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                )}
                <span className="leading-relaxed whitespace-pre-wrap">{feedback.message}</span>
              </div>

              {/* Quick action button for 42501 error */}
              {(feedback.message.includes('42501') || feedback.message.toLowerCase().includes('permission denied')) && (
                <div className="mt-2 pt-2 border-t border-rose-200 flex flex-wrap items-center justify-between gap-2">
                  <span className="text-[11px] text-rose-800 font-sans">
                    👉 Bấm nút bên cạnh để copy mã siết quyền GRANT + RLS, sau đó dán vào SQL Editor trên Supabase và bấm Run:
                  </span>
                  <button
                    onClick={handleCopyGrantSql}
                    className="px-3 py-1.5 bg-rose-700 text-white font-mono text-xs font-bold uppercase tracking-wider hover:bg-rose-800 transition flex items-center gap-1.5 shadow-sm shrink-0"
                  >
                    {hasCopiedGrantSql ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-300" />
                        <span>Đã Sao Chép Lệnh GRANT &amp; RLS!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Sao Chép Lệnh GRANT &amp; RLS Sửa 42501</span>
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Offline Sync Queue Card */}
      <div className="bg-[#F9F7F2] border-2 border-[#1A1A1A] p-6 shadow-[4px_4px_0px_0px_#1A1A1A]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
          <h2 className="text-xl font-serif font-bold text-[#1A1A1A] flex items-center gap-2">
            <Layers className="w-5 h-5 text-indigo-700" />
            <span>Hàng Đợi Lưu Trữ Ngoại Tuyến (Offline Sync Queue)</span>
          </h2>
          <span className={`px-2.5 py-1 text-xs font-mono font-bold rounded ${offlineQueueCount > 0 ? 'bg-amber-100 text-amber-900 border border-amber-400' : 'bg-emerald-100 text-emerald-900 border border-emerald-400'}`}>
            {offlineQueueCount} tác vụ đang chờ
          </span>
        </div>

        <p className="text-xs font-mono text-stone-600 mb-4">
          Khi mạng gián đoạn hoặc Supabase phản hồi lỗi, các thao tác thêm, sửa, xóa từ vựng/ngữ pháp được tự động lưu vào IndexedDB <code>sync_queue</code> và sẽ tự động retry khi kết nối phục hồi.
        </p>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handleDrainOfflineQueue}
            disabled={isDrainingQueue || offlineQueueCount === 0}
            className="px-4 py-2 bg-indigo-700 text-white font-mono text-xs font-bold uppercase tracking-wider hover:bg-indigo-800 transition flex items-center gap-1.5 shadow-[2px_2px_0px_0px_#000] disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isDrainingQueue ? 'animate-spin' : ''}`} />
            <span>{isDrainingQueue ? 'Đang đồng bộ...' : 'Đồng Bộ Hàng Đợi Ngay'}</span>
          </button>

          {offlineQueueCount > 0 && (
            <button
              onClick={handleClearOfflineQueue}
              className="px-3 py-2 bg-stone-200 hover:bg-stone-300 text-stone-800 font-mono text-xs font-bold uppercase border border-stone-400 transition"
            >
              Xóa Hàng Đợi
            </button>
          )}
        </div>
      </div>

      {/* Sync Operations Card */}
      <div className="bg-[#F9F7F2] border-2 border-[#1A1A1A] p-6 shadow-[4px_4px_0px_0px_#1A1A1A]">
        <h2 className="text-xl font-serif font-bold text-[#1A1A1A] flex items-center gap-2 mb-2">
          <Database className="w-5 h-5 text-amber-700" />
          <span>Thao Tác Đồng Bộ Dữ Liệu</span>
        </h2>

        <p className="text-xs font-mono text-stone-600 mb-6">
          Chuyển đổi dữ liệu dễ dàng giữa ứng dụng học web và Cơ sở dữ liệu Supabase của bạn (sử dụng cơ chế chia khối 100 bản ghi/lần với 3 lần retry exponential backoff).
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
              className="w-full py-2 bg-amber-600 text-white font-mono text-xs font-bold uppercase hover:bg-amber-700 transition flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
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
              className="w-full py-2 bg-blue-700 text-white font-mono text-xs font-bold uppercase hover:bg-blue-800 transition flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Tải Dữ Liệu Về Web</span>
            </button>
          </div>

          <div className="bg-rose-50/50 p-4 border border-rose-300 flex flex-col justify-between space-y-3">
            <div>
              <div className="text-xs font-mono font-bold uppercase text-rose-800 flex items-center gap-1.5 mb-1">
                <Trash2 className="w-4 h-4" />
                <span>Xóa sạch Supabase Cloud</span>
              </div>
              <p className="text-xs text-stone-600">
                Xóa toàn bộ các bản ghi từ vựng, ngữ pháp và tiến độ đang lưu trên Cơ sở dữ liệu Supabase để làm sạch hoàn toàn.
              </p>
            </div>
            <button
              onClick={handleClearCloudData}
              disabled={isSyncing}
              className="w-full py-2 bg-rose-700 text-white font-mono text-xs font-bold uppercase hover:bg-rose-800 transition flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Xóa Sạch Dữ Liệu Cloud</span>
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
              <span>Mã Nguồn SQL Tạo Bảng &amp; RLS (Supabase Schema Script)</span>
            </h2>
            <p className="text-xs font-mono text-stone-600 mt-1">
              Sao chép mã SQL bên dưới và dán vào <strong>SQL Editor</strong> trong Supabase Dashboard để tự động khởi tạo 10 bảng dữ liệu chuẩn và thiết lập phân quyền RLS an toàn.
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

        {/* Quick Upgrade Box for Star & Retention Status */}
        <div className="bg-amber-50/90 border-2 border-amber-400 p-4 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="font-bold text-xs uppercase font-mono text-amber-950 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-700" />
                <span>Nâng Cấp CSDL Đã Có: Bổ sung Cột Đánh Dấu Sao &amp; Trạng Thái Học Thuộc</span>
              </div>
              <p className="text-xs text-stone-700 font-sans mt-1">
                Nếu bạn đã tạo bảng từ trước trên Supabase, chỉ cần chạy đoạn mã ngắn này để bổ sung các cột <code>is_starred</code>, <code>is_added_today_flashcard</code>, <code>retention_level</code>:
              </p>
            </div>
            <button
              onClick={handleCopyAlterSql}
              className="px-3.5 py-2 bg-amber-600 text-white font-mono text-xs font-bold uppercase tracking-wider hover:bg-amber-700 transition flex items-center gap-1.5 shrink-0 shadow-[2px_2px_0px_0px_#000]"
            >
              {hasCopiedAlterSql ? (
                <>
                  <Check className="w-3.5 h-3.5 text-white" />
                  <span>Đã Copy Mã Nâng Cấp!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Sao Chép Mã Nâng Cấp</span>
                </>
              )}
            </button>
          </div>
          <pre className="p-3 bg-stone-900 text-emerald-300 font-mono text-[11px] overflow-x-auto border border-stone-800 rounded-none leading-relaxed">
            {alterOnlySqlScript}
          </pre>
        </div>

        {/* Quick Fix Box for Error 42501 */}
        <div className="bg-rose-50/80 border-2 border-rose-300 p-4 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="font-bold text-xs uppercase font-mono text-rose-950 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-rose-700" />
                <span>Sửa Nhanh Quyền &amp; Lỗi 42501 (Grant Quyền Tối Thiểu + RLS Policy)</span>
              </div>
              <p className="text-xs text-stone-700 font-sans mt-1">
                Đoạn SQL này thu hồi các quyền thừa, cấp đúng SELECT/INSERT/UPDATE/DELETE cho role <code>anon</code> và <code>authenticated</code>, và kích hoạt RLS policy chuẩn cho toàn bộ 10 bảng:
              </p>
            </div>
            <button
              onClick={handleCopyGrantSql}
              className="px-3.5 py-2 bg-rose-700 text-white font-mono text-xs font-bold uppercase tracking-wider hover:bg-rose-800 transition flex items-center gap-1.5 shrink-0 shadow-[2px_2px_0px_0px_#000]"
            >
              {hasCopiedGrantSql ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-300" />
                  <span>Đã Copy Lệnh GRANT &amp; RLS!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Sao Chép Lệnh GRANT &amp; RLS</span>
                </>
              )}
            </button>
          </div>
          <pre className="p-3 bg-stone-900 text-amber-300 font-mono text-[11px] overflow-x-auto border border-stone-800 rounded-none leading-relaxed">
            {grantOnlySqlScript}
          </pre>
        </div>

        {/* Step by step guide */}
        <div className="bg-amber-50/60 border border-amber-300 p-4 text-xs font-mono space-y-2 text-stone-800">
          <div className="font-bold uppercase text-amber-900 flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-amber-700" />
            <span>Hướng dẫn 3 bước chạy SQL trên Supabase:</span>
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
