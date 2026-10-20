/**
 * src/agent/types.ts
 * Hợp đồng dữ liệu và các kiểu cho Hệ thống Gia sư AI (Tutor Agent).
 * Đây là nguồn chuẩn mực cho intent, action, tier và context trao đổi giữa client và server.
 */

export type ActionTier = 'T0' | 'T1' | 'T2';

export type GameModeId =
  | 'flashcard'
  | 'multiple_choice'
  | 'matching'
  | 'fill_blank'
  | 'scramble'
  | 'picture_guess'
  | 'hangman'
  | 'typing';

export type SupportedLanguage = 'en' | 'ko' | 'zh';

export type NavTarget =
  | 'dashboard'
  | 'levels'
  | 'dictionary'
  | 'vocabulary'
  | 'grammar'
  | 'games'
  | 'mocktest'
  | 'aichat'
  | 'stroke'
  | 'numbers'
  | 'sheets';

export type ActionId =
  // T0 - Điều hướng & Đọc an toàn (One-click execution)
  | 'navigate'
  | 'open_game'
  | 'open_vocabulary'
  | 'open_grammar'
  | 'open_dictionary'
  | 'open_numbers'
  | 'open_stroke'
  | 'open_mocktest'
  | 'open_levels'
  | 'open_settings_hub'
  | 'set_language'
  | 'show_study_summary'
  // T1 - Ghi dữ liệu có thể hoàn tác (Bắt buộc xác nhận trước khi ghi)
  | 'add_vocabulary'
  | 'toggle_today_flashcard'
  | 'set_level'
  // T2 - Hành động nguy hiểm / Phá hủy / Đồng bộ toàn phần (AI KHÔNG BAO GIỜ tự thực thi)
  | 'danger_zone_guidance';

export interface ActionParamSchema {
  navigate: { nav: NavTarget };
  open_game: {
    mode: GameModeId;
    deckId?: string;
    limit?: number | string;
    topic?: string;
    lesson?: string;
    status?: string;
  };
  open_vocabulary: {
    level?: string;
    search?: string;
    topic?: string;
    limit?: number | string;
  };
  open_grammar: { level?: string };
  open_dictionary: { query?: string }; // Lưu ý: chỉ điều hướng, không kích hoạt tự động lookup
  open_numbers: {};
  open_stroke: {};
  open_mocktest: {};
  open_levels: {};
  open_settings_hub: { tab?: 'database' | 'sheets' | 'sync' | 'backup' };
  set_language: { language: SupportedLanguage };
  show_study_summary: {};
  add_vocabulary: {
    tu: string;
    nghia: string;
    phien_am?: string;
    tu_loai?: string;
    vi_du?: string;
    vi_du_dich?: string;
    cap_do?: string;
    bai_hoc?: string;
    ngon_ngu?: SupportedLanguage;
  };
  toggle_today_flashcard: {
    wordId?: string;
    word?: string;
  };
  set_level: {
    language: SupportedLanguage;
    level: string;
  };
  danger_zone_guidance: {
    dangerType: 'clear_all' | 'reset_retention' | 'clean_duplicates' | 'overwrite_cloud';
    message: string;
    destinationNav: NavTarget;
  };
}

export type AgentAction = {
  [K in ActionId]: {
    id: string;
    actionId: K;
    tier: ActionTier;
    label: string;
    description: string;
    params: ActionParamSchema[K];
    status?: 'pending' | 'confirmed' | 'cancelled' | 'executed' | 'failed';
    error?: string;
  };
}[ActionId];

/**
 * Tóm tắt ngữ cảnh từ AppContext phía client gửi lên máy chủ.
 * Giúp Gia sư AI nắm bắt trạng thái thực tế mà không cần truyền toàn bộ dữ liệu từ điển/từ vựng nặng nề.
 */
export interface ClientAppContextSummary {
  currentNav: string;
  currentLanguage: SupportedLanguage;
  userLevel?: string;
  todayReviewsCount: number;
  totalWordsCount: number;
  streakDays?: number;
  availableDecks: Array<{ id: string; name: string }>;
  availableGameModes: GameModeId[];
  availableLevels: string[];
}

export interface TutorAgentRequestBody {
  messages: Array<{
    role?: 'user' | 'assistant' | 'model';
    sender?: 'user' | 'ai';
    content?: string;
    text?: string;
    image?: string;
    image_url?: string;
  }>;
  imageBase64?: string;
  imageMime?: string;
  responseLength?: 'short' | 'long';
  appContext?: ClientAppContextSummary;
  customApiKey?: string;
  customApiKey2?: string;
  turn?: number;
}

export interface SuggestedVocabItem {
  word: string;
  meaning: string;
  phonetic?: string;
  type?: string;
  bai_hoc?: string;
  nghia_tieng_han?: string;
  nghia_tieng_anh?: string;
  example?: string;
  exampleVi?: string;
}

export interface TutorAgentResponseBody {
  reply: string;
  actions: AgentAction[];
  suggestedWords: SuggestedVocabItem[];
  tutorInfo?: {
    id: string;
    name: string;
    model: string;
    turn: number;
    activeKeyName?: string;
    activeKeyIndex?: number;
    totalKeys?: number;
    failedOver?: boolean;
  };
  isAgentMode: boolean;
  rawActionCount?: number;
}
