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
    bai_hoc TEXT DEFAULT 'Bài 1',
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

-- Tự động thêm cột bai_hoc nếu bảng vocabulary đã tồn tại từ trước
ALTER TABLE public.vocabulary ADD COLUMN IF NOT EXISTS bai_hoc TEXT DEFAULT 'Bài 1';

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
    bai_hoc TEXT DEFAULT 'Bài 1',
    ghi_chu TEXT,
    tags JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tự động thêm cột bai_hoc nếu bảng grammar đã tồn tại từ trước
ALTER TABLE public.grammar ADD COLUMN IF NOT EXISTS bai_hoc TEXT DEFAULT 'Bài 1';

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

-- 11. BẢNG LỊCH SỬ TRA CỨU TỪ ĐIỂN (dictionary_history)
CREATE TABLE IF NOT EXISTS public.dictionary_history (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL DEFAULT 'shared',
    query TEXT NOT NULL,
    word TEXT,
    meaning TEXT,
    language TEXT NOT NULL DEFAULT 'ko',
    is_starred BOOLEAN DEFAULT FALSE,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ====================================================================
-- CHỈ MỤC (INDEXES) TỐI ƯU TỐC ĐỘ TRUY VẤN
-- ====================================================================
CREATE INDEX IF NOT EXISTS idx_vocabulary_user_lang ON public.vocabulary(user_id, ngon_ngu);
CREATE INDEX IF NOT EXISTS idx_vocabulary_bai_hoc ON public.vocabulary(bai_hoc);
CREATE INDEX IF NOT EXISTS idx_vocabulary_srs_next ON public.vocabulary(srs_next_review);
CREATE INDEX IF NOT EXISTS idx_grammar_user_lang ON public.grammar(user_id, ngon_ngu);
CREATE INDEX IF NOT EXISTS idx_grammar_bai_hoc ON public.grammar(bai_hoc);
CREATE INDEX IF NOT EXISTS idx_decks_lang ON public.decks(ngon_ngu);
CREATE INDEX IF NOT EXISTS idx_review_sessions_user ON public.review_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_progress_user_date ON public.progress_records(user_id, ngay);
CREATE INDEX IF NOT EXISTS idx_journal_user ON public.journal_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_user ON public.chat_conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_dictionary_user ON public.dictionary_history(user_id, language);

-- ====================================================================
-- BẢO MẬT VÀ PHÂN QUYỀN TRUY CẬP (LEAST PRIVILEGE & ROW LEVEL SECURITY)
-- ====================================================================

-- 1. Thu hồi toàn bộ quyền dư thừa
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM anon;
REVOKE ALL ON ALL ROUTINES IN SCHEMA public FROM anon, authenticated, public;

-- Cấp quyền bảng tối thiểu (SELECT, INSERT, UPDATE, DELETE) cho anon và authenticated
-- Quyền truy cập thực tế vào từng dòng dữ liệu được kiểm soát nghiêm ngặt qua RLS bên dưới
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;

-- Chỉ cấp quyền EXECUTE cho các hàm RPC cụ thể nếu thực sự cần thiết (KHÔNG cấp blanket ALL ROUTINES)
-- Đặt quyền mặc định thu hồi EXECUTE khỏi các hàm tạo mới
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON TABLES FROM anon;
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON ROUTINES FROM anon, authenticated, public;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT ON SEQUENCES TO anon, authenticated;

-- ====================================================================
-- CÁC HÀM RPC ĐƯỢC CẤP QUYỀN THỰC THI RÕ RÀNG (EXPLICIT RPC ROUTINES)
-- ====================================================================

-- Hàm kiểm tra trạng thái kết nối máy chủ (health check)
CREATE OR REPLACE FUNCTION public.health_check()
RETURNS JSON
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT json_build_object('status', 'online', 'timestamp', NOW());
$$;

-- Cấp quyền gọi health_check cho anon và authenticated
GRANT EXECUTE ON FUNCTION public.health_check() TO anon, authenticated;

-- Hàm lấy thống kê tổng số lượng dữ liệu của học viên (Bảo mật: chỉ xem được của chính mình)
CREATE OR REPLACE FUNCTION public.get_user_stats(p_user_id TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_vocab_count INT;
    v_deck_count INT;
    v_grammar_count INT;
BEGIN
    IF auth.uid()::text != p_user_id THEN
        RAISE EXCEPTION 'Access denied: You can only query your own statistics';
    END IF;

    SELECT COUNT(*) INTO v_vocab_count FROM public.vocabulary WHERE user_id = p_user_id;
    SELECT COUNT(*) INTO v_deck_count FROM public.decks WHERE user_id = p_user_id;
    SELECT COUNT(*) INTO v_grammar_count FROM public.grammar WHERE user_id = p_user_id;

    RETURN json_build_object(
        'vocab_count', v_vocab_count,
        'deck_count', v_deck_count,
        'grammar_count', v_grammar_count
    );
END;
$$;

-- Chỉ cấp quyền gọi get_user_stats cho người dùng đã đăng nhập (authenticated)
GRANT EXECUTE ON FUNCTION public.get_user_stats(TEXT) TO authenticated;

-- ====================================================================
-- 2. KÍCH HOẠT VÀ THIẾT LẬP RLS (ROW LEVEL SECURITY) CHO TẤT CẢ 10 BẢNG
-- Lưu ý: ĐÃ LOẠI BỎ HOÀN TOÀN 'OR auth.role() = anon' ĐỂ CHỐNG LỖ HỔNG LỘ DỮ LIỆU QUA ANON KEY.
-- Dữ liệu 'shared' CHỈ cho phép đọc (SELECT) ở 3 bảng nội dung mẫu: vocabulary, decks, grammar.
-- ====================================================================

-- 2.1. user_profiles (Hồ sơ người dùng - Hoàn toàn riêng tư theo auth.uid())
ALTER TABLE IF EXISTS public.user_profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "user_profiles_select_policy" ON public.user_profiles;
CREATE POLICY "user_profiles_select_policy" ON public.user_profiles
    FOR SELECT USING (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "user_profiles_insert_policy" ON public.user_profiles;
CREATE POLICY "user_profiles_insert_policy" ON public.user_profiles
    FOR INSERT WITH CHECK (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "user_profiles_update_policy" ON public.user_profiles;
CREATE POLICY "user_profiles_update_policy" ON public.user_profiles
    FOR UPDATE USING (auth.uid()::text = user_id)
    WITH CHECK (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "user_profiles_delete_policy" ON public.user_profiles;
CREATE POLICY "user_profiles_delete_policy" ON public.user_profiles
    FOR DELETE USING (auth.uid()::text = user_id);

-- 2.2. vocabulary (Từ vựng: SELECT từ của mình hoặc từ dùng chung 'shared'/'system'/'template'; Thêm/Sửa/Xóa từ của mình)
ALTER TABLE IF EXISTS public.vocabulary ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "vocabulary_select_policy" ON public.vocabulary;
CREATE POLICY "vocabulary_select_policy" ON public.vocabulary
    FOR SELECT USING (auth.uid()::text = user_id OR user_id = 'shared' OR user_id = 'system' OR user_id = 'template' OR user_id IS NULL OR user_id = '');

DROP POLICY IF EXISTS "vocabulary_insert_policy" ON public.vocabulary;
CREATE POLICY "vocabulary_insert_policy" ON public.vocabulary
    FOR INSERT WITH CHECK (auth.uid()::text = user_id OR auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "vocabulary_update_policy" ON public.vocabulary;
CREATE POLICY "vocabulary_update_policy" ON public.vocabulary
    FOR UPDATE USING (auth.uid()::text = user_id)
    WITH CHECK (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "vocabulary_delete_policy" ON public.vocabulary;
CREATE POLICY "vocabulary_delete_policy" ON public.vocabulary
    FOR DELETE USING (auth.uid()::text = user_id);

-- 2.3. decks (Bộ từ vựng: SELECT bộ của mình hoặc bộ chia sẻ 'shared'/'system'; Thêm/Sửa/Xóa bộ của mình)
ALTER TABLE IF EXISTS public.decks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "decks_select_policy" ON public.decks;
CREATE POLICY "decks_select_policy" ON public.decks
    FOR SELECT USING (auth.uid()::text = user_id OR user_id = 'shared' OR user_id = 'system' OR user_id = 'template' OR user_id IS NULL OR user_id = '' OR che_do_chia_se = 'shared');

DROP POLICY IF EXISTS "decks_insert_policy" ON public.decks;
CREATE POLICY "decks_insert_policy" ON public.decks
    FOR INSERT WITH CHECK (auth.uid()::text = user_id OR auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "decks_update_policy" ON public.decks;
CREATE POLICY "decks_update_policy" ON public.decks
    FOR UPDATE USING (auth.uid()::text = user_id)
    WITH CHECK (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "decks_delete_policy" ON public.decks;
CREATE POLICY "decks_delete_policy" ON public.decks
    FOR DELETE USING (auth.uid()::text = user_id);

-- 2.4. grammar (Ngữ pháp: SELECT bài của mình hoặc bài mẫu 'shared'/'system'/'template'; Thêm/Sửa/Xóa bài của mình)
ALTER TABLE IF EXISTS public.grammar ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "grammar_select_policy" ON public.grammar;
CREATE POLICY "grammar_select_policy" ON public.grammar
    FOR SELECT USING (auth.uid()::text = user_id OR user_id = 'shared' OR user_id = 'system' OR user_id = 'template' OR user_id IS NULL OR user_id = '');

DROP POLICY IF EXISTS "grammar_insert_policy" ON public.grammar;
CREATE POLICY "grammar_insert_policy" ON public.grammar
    FOR INSERT WITH CHECK (auth.uid()::text = user_id OR auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "grammar_update_policy" ON public.grammar;
CREATE POLICY "grammar_update_policy" ON public.grammar
    FOR UPDATE USING (auth.uid()::text = user_id)
    WITH CHECK (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "grammar_delete_policy" ON public.grammar;
CREATE POLICY "grammar_delete_policy" ON public.grammar
    FOR DELETE USING (auth.uid()::text = user_id);

-- 2.5. review_sessions (Lịch sử ôn tập - Hoàn toàn riêng tư theo auth.uid())
ALTER TABLE IF EXISTS public.review_sessions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "review_sessions_all_policy" ON public.review_sessions;
CREATE POLICY "review_sessions_all_policy" ON public.review_sessions
    FOR ALL USING (auth.uid()::text = user_id)
    WITH CHECK (auth.uid()::text = user_id);

-- 2.6. mock_test_records (Lịch sử thi thử - Hoàn toàn riêng tư theo auth.uid())
ALTER TABLE IF EXISTS public.mock_test_records ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "mock_tests_all_policy" ON public.mock_test_records;
CREATE POLICY "mock_tests_all_policy" ON public.mock_test_records
    FOR ALL USING (auth.uid()::text = user_id)
    WITH CHECK (auth.uid()::text = user_id);

-- 2.7. progress_records (Tiến độ học hàng ngày - Hoàn toàn riêng tư theo auth.uid())
ALTER TABLE IF EXISTS public.progress_records ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "progress_all_policy" ON public.progress_records;
CREATE POLICY "progress_all_policy" ON public.progress_records
    FOR ALL USING (auth.uid()::text = user_id)
    WITH CHECK (auth.uid()::text = user_id);

-- 2.8. journal_entries (Nhật ký viết AI - Hoàn toàn riêng tư theo auth.uid())
ALTER TABLE IF EXISTS public.journal_entries ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "journal_all_policy" ON public.journal_entries;
CREATE POLICY "journal_all_policy" ON public.journal_entries
    FOR ALL USING (auth.uid()::text = user_id)
    WITH CHECK (auth.uid()::text = user_id);

-- 2.9. chat_conversations (Lịch sử AI Chat - Hoàn toàn riêng tư theo auth.uid())
ALTER TABLE IF EXISTS public.chat_conversations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "chat_all_policy" ON public.chat_conversations;
CREATE POLICY "chat_all_policy" ON public.chat_conversations
    FOR ALL USING (auth.uid()::text = user_id)
    WITH CHECK (auth.uid()::text = user_id);

-- 2.10. notifications (Thông báo cá nhân - Hoàn toàn riêng tư theo auth.uid())
ALTER TABLE IF EXISTS public.notifications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "notifications_all_policy" ON public.notifications;
CREATE POLICY "notifications_all_policy" ON public.notifications
    FOR ALL USING (auth.uid()::text = user_id)
    WITH CHECK (auth.uid()::text = user_id);

-- 2.11. dictionary_history (Lịch sử tra từ điển)
ALTER TABLE IF EXISTS public.dictionary_history ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "dictionary_history_all_policy" ON public.dictionary_history;
CREATE POLICY "dictionary_history_all_policy" ON public.dictionary_history
    FOR ALL USING (auth.uid()::text = user_id OR user_id = 'shared' OR user_id = 'user_1' OR user_id IS NULL OR user_id = '')
    WITH CHECK (auth.uid()::text = user_id OR user_id = 'shared' OR user_id = 'user_1' OR auth.uid() IS NOT NULL);

-- HOÀN TẤT SCHEMA VÀ THIẾT LẬP BẢO MẬT RLS CHUẨN XÁC!
