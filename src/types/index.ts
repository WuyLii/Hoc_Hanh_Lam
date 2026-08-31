export type LanguageCode = 'en' | 'ko' | 'zh';

export interface LanguageInfo {
  code: LanguageCode;
  name: string;
  nativeName: string;
  flag: string;
  phoneticLabel: string;
  levels: string[];
  defaultVoiceLang: string;
  description: string;
  examType?: string;
}

export const LANGUAGES: Record<LanguageCode, LanguageInfo> = {
  en: {
    code: 'en',
    name: 'Tiếng Anh',
    nativeName: 'English',
    flag: '🇬🇧',
    phoneticLabel: 'IPA',
    levels: ['A1 - Cơ bản', 'A2 - Sơ cấp', 'B1 - Trung cấp', 'B2 - Trung cao', 'C1 - Cao cấp', 'C2 - Thành thạo', 'TOEIC 500-750', 'TOEIC 750+', 'IELTS 6.5+'],
    defaultVoiceLang: 'en-US',
    description: 'Hệ thống phiên âm IPA chuẩn quốc tế, từ vựng theo CEFR / TOEIC / IELTS.',
    examType: 'TOEIC/IELTS (CEFR)',
  },
  ko: {
    code: 'ko',
    name: 'Tiếng Hàn',
    nativeName: '한국어',
    flag: '🇰🇷',
    phoneticLabel: 'Romaja (Phiên âm)',
    levels: ['TOPIK 1 (Sơ cấp 1)', 'TOPIK 2 (Sơ cấp 2)', 'TOPIK 3 (Trung cấp 1)', 'TOPIK 4 (Trung cấp 2)', 'TOPIK 5 (Cao cấp 1)', 'TOPIK 6 (Cao cấp 2)', 'Giao tiếp hàng ngày'],
    defaultVoiceLang: 'ko-KR',
    description: 'Chữ Hangul kèm Romaja, kính ngữ 존댓말/반말, cấu trúc ngữ pháp TOPIK.',
    examType: 'TOPIK I-II (EPS/NIIED)',
  },
  zh: {
    code: 'zh',
    name: 'Tiếng Trung',
    nativeName: '中文',
    flag: '🇨🇳',
    phoneticLabel: 'Pinyin (Bính âm)',
    levels: ['HSK 1', 'HSK 2', 'HSK 3', 'HSK 4', 'HSK 5', 'HSK 6', 'Khẩu ngữ thường nhật', 'Thương mại'],
    defaultVoiceLang: 'zh-CN',
    description: 'Chữ Hán giản thể/phồn thể, Pinyin có dấu thanh, bộ thủ và mẫu câu HSK.',
    examType: 'HSK 1-6 & HSKK (Hanban)',
  },
};

export interface UserProfile {
  user_id: string;
  ten: string;
  avatar: string;
  ngon_ngu_hoc: LanguageCode;
  cap_do: Record<LanguageCode, string>;
  muc_tieu: Record<LanguageCode, string>;
  pin_hash?: string;
  ngay_tham_gia: string;
  daily_target_minutes: number;
  streak: number;
  last_active_date: string;
  total_points: number;
}

export interface VocabularyItem {
  word_id: string;
  tu: string;
  nghia: string;
  phien_am: string;
  loai_tu: string; // Danh từ, Động từ, Tính từ, Cụm từ, v.v.
  vi_du: string;
  vi_du_dich: string;
  audio_url?: string;
  hinh_url?: string;
  ngon_ngu: LanguageCode;
  chu_de: string;
  cap_do: string;
  nguon_goc?: string; // Sách, Phim, Hội thoại, Nhạc, Báo chí...
  // SRS properties
  srs_box: number; // 0: new, 1..5: learned levels
  srs_next_review: string; // ISO date string
  srs_interval: number; // in days
  srs_ease: number; // default 2.5
  times_reviewed: number;
  times_correct: number;
  last_reviewed?: string;
  user_id: string; // owner or 'shared'
  created_at: string;
}

export interface Deck {
  deck_id: string;
  ten_bo: string;
  ten_deck?: string;
  ngon_ngu: LanguageCode;
  mo_ta: string;
  nguoi_tao: string;
  danh_sach_word_id: string[];
  che_do_chia_se: 'private' | 'shared';
  color?: string;
  icon?: string;
  created_at: string;
}

export interface GrammarItem {
  grammar_id: string;
  cau_truc: string;
  giai_thich: string;
  vi_du: string;
  vi_du_dich: string;
  ngon_ngu: LanguageCode;
  cap_do: string;
  ghi_chu?: string;
  tags: string[];
  user_id: string;
  created_at: string;
}

export type GameMode =
  | 'flashcard'
  | 'multiple_choice'
  | 'matching'
  | 'fill_blank'
  | 'scramble'
  | 'picture_guess'
  | 'hangman'
  | 'typing';

export interface ReviewSession {
  session_id: string;
  user_id: string;
  loai_game: GameMode;
  thoi_gian_bat_dau: string;
  thoi_gian_ket_thuc: string;
  so_cau_dung: number;
  so_cau_sai: number;
  diem: number;
  ngon_ngu?: LanguageCode;
  word_ids_reviewed?: string[];
  danh_sach_word_id?: string[];
}

export interface MockQuestion {
  id: string;
  cau_hoi: string;
  cac_lua_chon: string[];
  dap_an_dung: string;
  giai_thich?: string;
}

export interface MockTestQuestion {
  id: number | string;
  type?: 'multiple_choice' | 'cloze' | 'sentence_order';
  question?: string;
  cau_hoi?: string;
  phoneticOrTranslation?: string;
  options?: string[];
  cac_lua_chon?: string[];
  correctIndex?: number;
  dap_an_dung?: string;
  explanation?: string;
  giai_thich?: string;
  targetWord?: string;
  userSelectedIndex?: number;
}

export interface MockTestRecord {
  test_id: string;
  user_id: string;
  loai_de: string; // TOEIC, TOPIK, HSK, Custom
  ten_de?: string;
  test_title?: string;
  ngon_ngu?: LanguageCode;
  cap_do?: string;
  ngay_lam: string;
  diem_so: number;
  tong_diem: number;
  thoi_gian_lam_giay: number;
  chi_tiet_cau_tra_loi?: Record<string, string>;
  questions?: any[];
  feedback?: string;
}

export interface ListeningExercise {
  listen_id: string;
  ngon_ngu: LanguageCode;
  cap_do: string;
  transcript: string;
  translation?: string;
  dich_nghia?: string;
  tieu_de?: string;
  phien_am?: string;
  loai_bai_tap: 'dictation' | 'choice' | 'reorder';
  audio_url?: string;
  options?: string[];
  cac_lua_chon?: string[];
  dap_an_dung?: string;
  correct_option_index?: number;
  chu_de: string;
}

export interface ProgressRecord {
  user_id: string;
  ngon_ngu: LanguageCode;
  ngay: string; // YYYY-MM-DD
  so_tu_moi: number;
  streak: number;
  thoi_gian_hoc_phut: number;
  score_earned: number;
}

export interface JournalCorrection {
  original: string;
  corrected: string;
  explanation: string;
}

export interface JournalVocabularyUpgrade {
  basic: string;
  advanced: string;
  meaning: string;
}

export interface JournalFeedback {
  score: number;
  summary: string;
  corrections: JournalCorrection[];
  improvedVersion: string;
  vocabularyUpgrades: JournalVocabularyUpgrade[];
  encouragement: string;
}

export interface JournalEntry {
  entry_id: string;
  user_id: string;
  ngon_ngu: LanguageCode;
  ngay: string;
  tieu_de?: string;
  noi_dung: string;
  phan_hoi_ai?: any;
  created_at?: string;
}

export interface NotificationItem {
  noti_id: string;
  user_id: string;
  loai: 'srs_due' | 'streak_risk' | 'test_reminder' | 'milestone';
  noi_dung: string;
  thoi_gian: string;
  da_doc: boolean;
}

export interface ChatMessage {
  id: string;
  sender?: 'user' | 'ai';
  role?: 'user' | 'assistant';
  text?: string;
  content?: string;
  timestamp: string;
  image_url?: string;
  image?: string; // base64
  tutor_info?: {
    id: string;
    name: string;
    model: string;
    turn?: number;
  };
  suggested_words?: { word: string; meaning: string; phonetic?: string }[];
  savedVocabs?: Partial<VocabularyItem>[];
}

export interface ChatConversation {
  chat_id: string;
  user_id: string;
  chu_de: string;
  tieu_de?: string;
  ngon_ngu: LanguageCode;
  cac_tin_nhan?: ChatMessage[];
  messages?: ChatMessage[];
  tu_da_luu?: string[];
  created_at: string;
  updated_at?: string;
}

export interface RoleplayScenario {
  id: string;
  title?: string;
  tieu_de?: string;
  description?: string;
  boi_canh?: string;
  category?: string;
  chu_de?: string;
  icon: string;
  language?: LanguageCode;
  ngon_ngu?: LanguageCode;
  level?: string;
  cap_do?: string;
  aiRole?: string;
  vai_tro_ai?: string;
  userRole?: string;
  vai_tro_nguoi_dung?: string;
  starter_line?: string;
  initialMessage?: string;
  initialTranslation?: string;
  initialPhonetic?: string;
}

export interface RoleplayMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  translation?: string;
  feedback?: string;
  suggested_replies?: string[];
  timestamp: string;
}

export interface GoogleSheetsConfig {
  scriptUrl: string;
  spreadsheetUrlOrId?: string;
  spreadsheetId: string;
  autoSync: boolean;
  syncIntervalHours?: number;
  lastSyncedAt?: string;
}

export interface ExtractedVocabItem {
  tu: string;
  nghia: string;
  phien_am?: string;
  loai_tu?: string;
  unit?: string;
  vi_du?: string;
  vi_du_dich?: string;
  cap_do?: string;
  chu_de?: string;
  selected?: boolean;
}

export interface ExtractedGrammarItem {
  cau_truc: string;
  giai_thich: string;
  cong_thuc?: string;
  unit?: string;
  cap_do?: string;
  vi_du?: string;
  vi_du_dich?: string;
  ghi_chu?: string;
  selected?: boolean;
}

export interface TextbookExtractResult {
  bookTitle: string;
  detectedLanguage: LanguageCode;
  level?: string;
  totalUnits?: number;
  summary?: string;
  unitList?: string[];
  vocabulary: ExtractedVocabItem[];
  grammar: ExtractedGrammarItem[];
}

