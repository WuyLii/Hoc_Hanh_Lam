-- ====================================================================
-- SUPABASE DATABASE SCHEMA CHO ỨNG DỤNG HỌC HÀNH LẮM (MULTILINGUAL LEARNING)
-- ====================================================================
-- Hướng dẫn cài đặt trên Supabase:
-- 1. Truy cập vào dự án Supabase của bạn tại https://supabase.com
-- 2. Chọn mục "SQL Editor" ở thanh menu bên trái.
-- 3. Mở tab "New Query", dán toàn bộ đoạn mã SQL dưới đây và nhấn "Run".
-- ====================================================================

-- Kích hoạt tiện ích mở rộng UUID (nếu chưa có)
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

-- 5. BẢNG PHIÊN ÔN TẬP / LỊCH SỬ GAME (review_sessions)
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

-- ====================================================================
-- CHỈ MỤC (INDEXES) TỐI ƯU TỐC ĐỘ TRUY VẤN
-- ====================================================================
CREATE INDEX IF NOT EXISTS idx_vocabulary_user_lang ON public.vocabulary(user_id, ngon_ngu);
CREATE INDEX IF NOT EXISTS idx_vocabulary_srs_next ON public.vocabulary(srs_next_review);
CREATE INDEX IF NOT EXISTS idx_grammar_user_lang ON public.grammar(user_id, ngon_ngu);
CREATE INDEX IF NOT EXISTS idx_decks_lang ON public.decks(ngon_ngu);
CREATE INDEX IF NOT EXISTS idx_review_sessions_user ON public.review_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_progress_user_date ON public.progress_records(user_id, ngay);
CREATE INDEX IF NOT EXISTS idx_journal_user ON public.journal_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_user ON public.chat_conversations(user_id);

-- ====================================================================
-- BẢO MẬT VÀ PHÂN QUYỀN TRUY CẬP (CHO PHÉP SELECT, INSERT, UPDATE, DELETE TỪ WEB)
-- ====================================================================
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO anon, authenticated, service_role;

ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;

-- Tắt RLS để ứng dụng web có thể tự do thêm, sửa, xóa dữ liệu qua public Anon Key
ALTER TABLE IF EXISTS public.user_profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.vocabulary DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.decks DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.grammar DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.review_sessions DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.mock_test_records DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.progress_records DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.journal_entries DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.chat_conversations DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.notifications DISABLE ROW LEVEL SECURITY;

-- HOÀN TẤT SCHEMA!
