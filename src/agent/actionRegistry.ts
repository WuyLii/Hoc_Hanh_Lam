/**
 * src/agent/actionRegistry.ts
 * NGUỒN SỰ THẬT DUY NHẤT (WHITELIST) CHO TẤT CẢ ACTION CỦA TUTOR AGENT.
 *
 * T0: Điều hướng & Đọc an toàn (Một chạm là chạy)
 * T1: Ghi dữ liệu có thể hoàn tác (Bắt buộc xác nhận trước khi ghi)
 * T2: Phá hủy / Đồng bộ nhạy cảm (CẤM AI tự chạy, chỉ hướng dẫn vào Cài đặt)
 */

import {
  ActionId,
  ActionTier,
  AgentAction,
  GameModeId,
  NavTarget,
  SupportedLanguage,
} from './types';

export const VALID_GAME_MODES: GameModeId[] = [
  'flashcard',
  'multiple_choice',
  'matching',
  'fill_blank',
  'scramble',
  'picture_guess',
  'hangman',
  'typing',
];

export const VALID_NAV_TARGETS: NavTarget[] = [
  'dashboard',
  'levels',
  'dictionary',
  'vocabulary',
  'grammar',
  'games',
  'mocktest',
  'aichat',
  'stroke',
  'numbers',
  'sheets',
];

export const VALID_LANGUAGES: SupportedLanguage[] = ['en', 'ko', 'zh'];

export interface ActionDefinition<K extends ActionId = ActionId> {
  id: K;
  tier: ActionTier;
  title: string;
  description: string;
  iconName: string;
  defaultLabel: string;
  validateParams: (params: any) => { valid: boolean; sanitized?: any; error?: string };
  formatLabel: (params: any) => string;
}

export const ACTION_REGISTRY: Record<ActionId, ActionDefinition<any>> = {
  // -------------------------------------------------------------
  // T0: ĐIỀU HƯỚNG VÀ ĐỌC AN TOÀN
  // -------------------------------------------------------------
  navigate: {
    id: 'navigate',
    tier: 'T0',
    title: 'Điều hướng màn hình',
    description: 'Chuyển đổi giao diện người dùng sang phân hệ chức năng tương ứng',
    iconName: 'Compass',
    defaultLabel: 'Chuyển màn hình',
    validateParams: (params: any) => {
      if (!params || typeof params !== 'object') return { valid: false, error: 'Tham số rỗng' };
      const nav = String(params.nav || '').toLowerCase().trim() as NavTarget;
      // Cấm tuyệt đối trỏ tới 'listening' (lỗi đã biết)
      if (nav === ('listening' as any)) {
        return { valid: false, error: 'Mục listening không khả dụng trong hệ thống' };
      }
      if (!VALID_NAV_TARGETS.includes(nav)) {
        return { valid: false, error: `Mục điều hướng không hợp lệ: ${nav}` };
      }
      return { valid: true, sanitized: { nav } };
    },
    formatLabel: (params: any) => {
      const labels: Record<NavTarget, string> = {
        dashboard: 'Về Bảng điều khiển',
        levels: 'Xem Lộ trình & Cấp độ',
        dictionary: 'Mở Đại từ điển Học thuật',
        vocabulary: 'Mở Sổ Từ vựng',
        grammar: 'Mở Sổ Ngữ pháp',
        games: 'Mở Trung tâm Trò chơi',
        mocktest: 'Mở Đề thi Thử nghiệm',
        aichat: 'Khu vực Gia sư AI',
        stroke: 'Mở Bảng Tập viết Nét',
        numbers: 'Mở Bảng Số đếm Đa ngữ',
        sheets: 'Mở Đồng bộ Google Sheets',
      };
      return labels[params.nav as NavTarget] || `Đi đến ${params.nav}`;
    },
  },

  open_game: {
    id: 'open_game',
    tier: 'T0',
    title: 'Mở trò chơi ôn tập',
    description: 'Chuyển sang khu vực Game và khởi động chế độ ôn tập cụ thể với bộ lọc',
    iconName: 'Gamepad2',
    defaultLabel: 'Chơi game ôn tập',
    validateParams: (params: any) => {
      if (!params || typeof params !== 'object') return { valid: false, error: 'Tham số rỗng' };
      let mode = String(params.mode || 'flashcard').toLowerCase().trim() as GameModeId;
      if (!VALID_GAME_MODES.includes(mode)) {
        mode = 'flashcard'; // Fallback an toàn
      }
      const deckId = params.deckId && typeof params.deckId === 'string' ? params.deckId.trim() : undefined;
      const limit = params.limit !== undefined ? String(params.limit).trim() : undefined;
      const topic = params.topic && typeof params.topic === 'string' ? params.topic.trim() : undefined;
      const lesson = params.lesson && typeof params.lesson === 'string' ? params.lesson.trim() : undefined;
      const status = params.status && typeof params.status === 'string' ? params.status.trim() : undefined;
      return { valid: true, sanitized: { mode, deckId, limit, topic, lesson, status } };
    },
    formatLabel: (params: any) => {
      const modeNames: Record<GameModeId, string> = {
        flashcard: 'Lật thẻ Flashcard',
        multiple_choice: 'Trắc nghiệm 4 đáp án',
        matching: 'Nối cặp từ - nghĩa',
        fill_blank: 'Điền từ vào chỗ trống',
        scramble: 'Sắp xếp xáo trộn câu',
        picture_guess: 'Nhìn hình đoán nghĩa',
        hangman: 'Đoán chữ Người treo cổ',
        typing: 'Luyện gõ tốc ký',
      };
      const name = modeNames[params.mode as GameModeId] || 'Trò chơi';
      const details = [];
      if (params.limit) details.push(`${params.limit} từ`);
      if (params.topic) details.push(`chủ đề "${params.topic}"`);
      if (params.lesson) details.push(params.lesson);
      if (params.status) details.push(`trạng thái: ${params.status}`);
      if (details.length > 0) {
        return `Chơi: ${name} (${details.join(', ')})`;
      }
      return `Chơi ngay: ${name}`;
    },
  },

  open_vocabulary: {
    id: 'open_vocabulary',
    tier: 'T0',
    title: 'Mở kho từ vựng',
    description: 'Mở màn hình Quản lý Từ vựng kèm bộ lọc cấp độ, chủ đề hoặc tìm kiếm',
    iconName: 'BookOpen',
    defaultLabel: 'Mở Sổ từ vựng',
    validateParams: (params: any) => {
      const sanitized: any = {};
      if (params?.level && typeof params.level === 'string') {
        sanitized.level = params.level.trim();
      }
      if (params?.search && typeof params.search === 'string') {
        sanitized.search = params.search.trim().slice(0, 100);
      }
      if (params?.topic && typeof params.topic === 'string') {
        sanitized.topic = params.topic.trim();
      }
      if (params?.limit !== undefined) {
        sanitized.limit = String(params.limit);
      }
      return { valid: true, sanitized };
    },
    formatLabel: (params: any) => {
      let label = 'Mở Sổ từ vựng';
      const parts = [];
      if (params?.level) parts.push(`Cấp: ${params.level}`);
      if (params?.topic) parts.push(`Chủ đề: ${params.topic}`);
      if (params?.search) parts.push(`Tìm: "${params.search}"`);
      if (params?.limit) parts.push(`${params.limit} từ`);
      if (parts.length > 0) label += ` (${parts.join(', ')})`;
      return label;
    },
  },

  open_grammar: {
    id: 'open_grammar',
    tier: 'T0',
    title: 'Mở kho ngữ pháp',
    description: 'Mở màn hình Quản lý Ngữ pháp kèm bộ lọc cấp độ',
    iconName: 'GraduationCap',
    defaultLabel: 'Mở Sổ ngữ pháp',
    validateParams: (params: any) => {
      const sanitized: any = {};
      if (params?.level && typeof params.level === 'string') {
        sanitized.level = params.level.trim();
      }
      return { valid: true, sanitized };
    },
    formatLabel: (params: any) => {
      if (params?.level) return `Mở Ngữ pháp (Cấp độ: ${params.level})`;
      return 'Mở Sổ tay Ngữ pháp';
    },
  },

  open_dictionary: {
    id: 'open_dictionary',
    tier: 'T0',
    title: 'Mở đại từ điển',
    description: 'Chuyển sang giao diện Tra từ điển học thuật (không tự động tra để bảo toàn luồng)',
    iconName: 'Search',
    defaultLabel: 'Mở Đại từ điển',
    validateParams: (_params: any) => {
      // Chỉ điều hướng, không gửi từ khóa tra cứu để không chạm luồng từ điển độc lập
      return { valid: true, sanitized: {} };
    },
    formatLabel: (_params: any) => 'Mở Đại từ điển Học thuật',
  },

  open_numbers: {
    id: 'open_numbers',
    tier: 'T0',
    title: 'Mở bảng số đếm',
    description: 'Xem bảng tra cứu số đếm đa ngôn ngữ (Hán-Hàn, Thuần Hàn, v.v.)',
    iconName: 'Hash',
    defaultLabel: 'Mở Bảng số đếm',
    validateParams: () => ({ valid: true, sanitized: {} }),
    formatLabel: () => 'Mở Bảng số đếm Đa ngữ',
  },

  open_stroke: {
    id: 'open_stroke',
    tier: 'T0',
    title: 'Mở bảng tập viết',
    description: 'Xem thứ tự nét viết chữ Hán và bảng chữ cái',
    iconName: 'PenTool',
    defaultLabel: 'Mở Tập viết nét',
    validateParams: () => ({ valid: true, sanitized: {} }),
    formatLabel: () => 'Mở Bảng Tập viết Nét',
  },

  open_mocktest: {
    id: 'open_mocktest',
    tier: 'T0',
    title: 'Mở thi thử',
    description: 'Mở phân hệ Tạo & Làm đề thi thử chuẩn quốc tế',
    iconName: 'FileCheck2',
    defaultLabel: 'Làm đề thi thử',
    validateParams: () => ({ valid: true, sanitized: {} }),
    formatLabel: () => 'Mở Đề thi thử Chuẩn',
  },

  open_levels: {
    id: 'open_levels',
    tier: 'T0',
    title: 'Xem lộ trình cấp độ',
    description: 'Xem thang cấp độ năng lực ngôn ngữ TOPIK / HSK / CEFR',
    iconName: 'Award',
    defaultLabel: 'Xem Lộ trình cấp độ',
    validateParams: () => ({ valid: true, sanitized: {} }),
    formatLabel: () => 'Xem Thang Cấp độ Năng lực',
  },

  open_settings_hub: {
    id: 'open_settings_hub',
    tier: 'T0',
    title: 'Mở trung tâm cài đặt',
    description: 'Chuyển đến màn hình Cài đặt cơ sở dữ liệu, sao lưu và đồng bộ',
    iconName: 'Settings',
    defaultLabel: 'Mở Cài đặt hệ thống',
    validateParams: (params: any) => {
      const tab = params?.tab && ['database', 'sheets', 'sync', 'backup'].includes(params.tab)
        ? params.tab
        : undefined;
      return { valid: true, sanitized: { tab } };
    },
    formatLabel: (_params: any) => 'Mở Cài đặt & Cơ sở dữ liệu',
  },

  set_language: {
    id: 'set_language',
    tier: 'T0',
    title: 'Đổi ngôn ngữ học',
    description: 'Chuyển đổi ngôn ngữ trọng tâm hiện tại (Tiếng Hàn, Tiếng Anh, Tiếng Trung)',
    iconName: 'Languages',
    defaultLabel: 'Đổi ngôn ngữ',
    validateParams: (params: any) => {
      if (!params || typeof params !== 'object') return { valid: false, error: 'Thiếu thông tin ngôn ngữ' };
      const lang = String(params.language || '').toLowerCase().trim() as SupportedLanguage;
      if (!VALID_LANGUAGES.includes(lang)) {
        return { valid: false, error: `Ngôn ngữ không được hỗ trợ: ${lang}` };
      }
      return { valid: true, sanitized: { language: lang } };
    },
    formatLabel: (params: any) => {
      const names: Record<SupportedLanguage, string> = {
        ko: 'Tiếng Hàn (한국어)',
        en: 'Tiếng Anh (English)',
        zh: 'Tiếng Trung (中文)',
      };
      return `Chuyển học sang: ${names[params.language as SupportedLanguage] || params.language}`;
    },
  },

  show_study_summary: {
    id: 'show_study_summary',
    tier: 'T0',
    title: 'Xem tiến độ hôm nay',
    description: 'Xem số từ đến hạn ôn tập SRS và thống kê học tập',
    iconName: 'Sparkles',
    defaultLabel: 'Xem tổng quan hôm nay',
    validateParams: () => ({ valid: true, sanitized: {} }),
    formatLabel: () => 'Xem nhiệm vụ ôn tập hôm nay',
  },

  // -------------------------------------------------------------
  // T1: GHI DỮ LIỆU CÓ THỂ HOÀN TÁC (CẦN XÁC NHẬN)
  // -------------------------------------------------------------
  add_vocabulary: {
    id: 'add_vocabulary',
    tier: 'T1',
    title: 'Lưu từ vựng mới vào Sổ từ',
    description: 'Tạo thẻ từ vựng mới với nghĩa, phiên âm, ví dụ và cấp độ',
    iconName: 'PlusCircle',
    defaultLabel: 'Thêm vào sổ từ',
    validateParams: (params: any) => {
      if (!params || typeof params !== 'object') return { valid: false, error: 'Tham số rỗng' };
      const tu = String(params.tu || '').trim();
      const nghia = String(params.nghia || '').trim();
      if (!tu || !nghia) {
        return { valid: false, error: 'Từ vựng và Nghĩa không được để trống' };
      }
      const sanitized: any = {
        tu: tu.slice(0, 150),
        nghia: nghia.slice(0, 300),
        phien_am: params.phien_am ? String(params.phien_am).trim().slice(0, 100) : '',
        tu_loai: params.tu_loai ? String(params.tu_loai).trim().slice(0, 50) : '',
        vi_du: params.vi_du ? String(params.vi_du).trim().slice(0, 500) : '',
        vi_du_dich: params.vi_du_dich ? String(params.vi_du_dich).trim().slice(0, 500) : '',
        cap_do: params.cap_do ? String(params.cap_do).trim().slice(0, 50) : 'Sơ cấp',
        bai_hoc: params.bai_hoc ? String(params.bai_hoc).trim().slice(0, 100) : '',
      };
      if (params.ngon_ngu && VALID_LANGUAGES.includes(params.ngon_ngu)) {
        sanitized.ngon_ngu = params.ngon_ngu;
      }
      return { valid: true, sanitized };
    },
    formatLabel: (params: any) => `Thêm từ: "${params.tu}" (${params.nghia})`,
  },

  toggle_today_flashcard: {
    id: 'toggle_today_flashcard',
    tier: 'T1',
    title: 'Ghim/Bỏ ghim Flashcard hôm nay',
    description: 'Đánh dấu từ vựng cần ưu tiên ôn tập trong ngày',
    iconName: 'Pin',
    defaultLabel: 'Ghim vào ôn tập hôm nay',
    validateParams: (params: any) => {
      if (!params || (!params.wordId && !params.word)) {
        return { valid: false, error: 'Cần chỉ định mã từ vựng hoặc tên từ' };
      }
      return {
        valid: true,
        sanitized: {
          wordId: params.wordId ? String(params.wordId).trim() : undefined,
          word: params.word ? String(params.word).trim() : undefined,
        },
      };
    },
    formatLabel: (params: any) => `Ghim từ "${params.word || params.wordId}" vào ôn tập`,
  },

  set_level: {
    id: 'set_level',
    tier: 'T1',
    title: 'Cập nhật cấp độ người học',
    description: 'Thay đổi cấp độ mục tiêu hiện tại trong hồ sơ học tập',
    iconName: 'TrendingUp',
    defaultLabel: 'Cập nhật cấp độ',
    validateParams: (params: any) => {
      if (!params || !params.language || !params.level) {
        return { valid: false, error: 'Thiếu ngôn ngữ hoặc cấp độ' };
      }
      const lang = String(params.language).toLowerCase().trim() as SupportedLanguage;
      if (!VALID_LANGUAGES.includes(lang)) {
        return { valid: false, error: 'Ngôn ngữ không hợp lệ' };
      }
      return {
        valid: true,
        sanitized: {
          language: lang,
          level: String(params.level).trim().slice(0, 50),
        },
      };
    },
    formatLabel: (params: any) => `Đặt cấp độ ${params.language.toUpperCase()}: ${params.level}`,
  },

  // -------------------------------------------------------------
  // T2: PHÁ HỦY / ĐỒNG BỘ DỮ LIỆU TOÀN PHẦN (CẤM TỰ ĐỘNG THỰC THI)
  // -------------------------------------------------------------
  danger_zone_guidance: {
    id: 'danger_zone_guidance',
    tier: 'T2',
    title: 'Bảo vệ dữ liệu hệ thống',
    description: 'Chỉ dẫn an toàn đến cài đặt; AI tuyệt đối không bao giờ tự ý xóa hoặc ghi đè',
    iconName: 'ShieldAlert',
    defaultLabel: 'Xem hướng dẫn bảo mật',
    validateParams: (params: any) => {
      const dangerType = params?.dangerType || 'clear_all';
      return {
        valid: true,
        sanitized: {
          dangerType,
          message: params?.message || 'Hành động này ảnh hưởng lớn đến toàn bộ dữ liệu. Bạn hãy tự thao tác thủ công.',
          destinationNav: 'sheets' as NavTarget,
        },
      };
    },
    formatLabel: () => 'Đến Trung tâm Cài đặt & Dữ liệu để thao tác thủ công',
  },
};

/**
 * Hàm kiểm tra và chuẩn hóa một Action nhận được từ model hoặc client.
 */
export function validateAndSanitizeAction(rawAction: any): AgentAction | null {
  if (!rawAction || typeof rawAction !== 'object') return null;

  const actionId = String(rawAction.actionId || '').trim() as ActionId;
  const def = ACTION_REGISTRY[actionId];
  if (!def) {
    console.warn(`[ActionRegistry] Bị từ chối: actionId '${actionId}' không nằm trong whitelist`);
    return null;
  }

  // Chặn T2 giả mạo action T0/T1
  if (def.tier === 'T2' && rawAction.tier !== 'T2') {
    rawAction.tier = 'T2';
  }

  const { valid, sanitized, error } = def.validateParams(rawAction.params || {});
  if (!valid) {
    console.warn(`[ActionRegistry] Tham số của '${actionId}' không hợp lệ:`, error);
    return null;
  }

  const label = rawAction.label && typeof rawAction.label === 'string' && rawAction.label.trim().length > 0
    ? rawAction.label.trim().slice(0, 80)
    : def.formatLabel(sanitized);

  return {
    id: rawAction.id || `act_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    actionId,
    tier: def.tier,
    label,
    description: def.description,
    params: sanitized,
    status: 'pending',
  } as AgentAction;
}

/**
 * Thực thi an toàn một Action phía Client thông qua các hàm có sẵn của AppContext.
 */
export async function executeClientAction(
  action: AgentAction,
  appContext: {
    setActiveNav: (nav: any) => void;
    setSelectedGameMode: (mode: any) => void;
    setSelectedDeckId: (id: any) => void;
    setSelectedLevelFilter: (filter: any) => void;
    setLanguage?: (lang: any) => void;
    setCurrentLanguage?: (lang: any) => void;
    toggleTodayFlashcard: (wordId: any) => void;
    addVocabulary: (word: any) => any;
    updateUser: (user: any) => void;
    currentLanguage: SupportedLanguage;
    vocabulary: any[];
  }
): Promise<{ success: boolean; message: string }> {
  try {
    switch (action.actionId) {
      case 'navigate': {
        const { nav } = action.params;
        if (nav === 'games') {
          // Khi chuyển tới games, không bắt buộc chế độ cụ thể
          appContext.setActiveNav('games');
        } else {
          appContext.setActiveNav(nav);
        }
        return { success: true, message: `Đã chuyển đến ${action.label}` };
      }

      case 'open_game': {
        const { mode, deckId, limit, topic, lesson, status } = action.params as any;
        if (deckId) {
          appContext.setSelectedDeckId(deckId);
        }
        if ((appContext as any).setPendingGameFilters) {
          (appContext as any).setPendingGameFilters({
            mode,
            deckId,
            limit: limit !== undefined ? String(limit) : 'ALL',
            topic: topic || 'ALL',
            lesson: lesson || 'ALL',
            status: status || 'ALL',
          });
        }
        appContext.setSelectedGameMode(mode);
        appContext.setActiveNav('games');
        return { success: true, message: `Đã mở trò chơi ${mode} theo bộ lọc yêu cầu` };
      }

      case 'open_vocabulary': {
        const p = action.params as any;
        if (p.level) {
          appContext.setSelectedLevelFilter(p.level);
        }
        if ((appContext as any).setPendingVocabFilters) {
          (appContext as any).setPendingVocabFilters(p);
        }
        appContext.setActiveNav('vocabulary');
        return { success: true, message: 'Đã mở màn hình Từ vựng theo bộ lọc yêu cầu' };
      }

      case 'open_grammar': {
        if (action.params.level) {
          appContext.setSelectedLevelFilter(action.params.level);
        }
        appContext.setActiveNav('grammar');
        return { success: true, message: 'Đã mở màn hình Ngữ pháp' };
      }

      case 'open_dictionary': {
        // Chỉ điều hướng tới từ điển, TUYỆT ĐỐI không điền từ khóa tra cứu để bảo vệ luồng từ điển độc quyền
        appContext.setActiveNav('dictionary');
        return { success: true, message: 'Đã mở Đại từ điển Học thuật' };
      }

      case 'open_numbers': {
        appContext.setActiveNav('numbers');
        return { success: true, message: 'Đã mở Bảng số đếm' };
      }

      case 'open_stroke': {
        appContext.setActiveNav('stroke');
        return { success: true, message: 'Đã mở Tập viết nét' };
      }

      case 'open_mocktest': {
        appContext.setActiveNav('mocktest');
        return { success: true, message: 'Đã mở phòng Thi thử' };
      }

      case 'open_levels': {
        appContext.setActiveNav('levels');
        return { success: true, message: 'Đã mở Thang cấp độ năng lực' };
      }

      case 'open_settings_hub': {
        appContext.setActiveNav('sheets');
        return { success: true, message: 'Đã mở Trung tâm Cài đặt & Dữ liệu' };
      }

      case 'set_language': {
        if (appContext.setLanguage) {
          appContext.setLanguage(action.params.language);
        } else if (appContext.setCurrentLanguage) {
          appContext.setCurrentLanguage(action.params.language);
        }
        return { success: true, message: `Đã chuyển ngôn ngữ học sang ${action.params.language.toUpperCase()}` };
      }

      case 'show_study_summary': {
        appContext.setActiveNav('dashboard');
        return { success: true, message: 'Đã chuyển về Bảng điều khiển xem tiến độ' };
      }

      case 'add_vocabulary': {
        const p = action.params;
        const newWord = {
          tu: p.tu,
          nghia: p.nghia,
          phien_am: p.phien_am || '',
          tu_loai: p.tu_loai || '',
          vi_du: p.vi_du || '',
          vi_du_dich: p.vi_du_dich || '',
          cap_do: p.cap_do || 'Sơ cấp',
          bai_hoc: p.bai_hoc || '',
          ngon_ngu: p.ngon_ngu || appContext.currentLanguage,
          ghi_chu: 'Thêm bởi Gia sư AI',
          muc_do_thanh_thao: 0,
          ngay_on_tap_tiep_theo: new Date().toISOString(),
          khoang_cach_ngay: 1,
          he_so_de: 2.5,
          so_lan_dung_lien_tiep: 0,
          retention_level: 'chua_danh_gia',
          is_today_flashcard: false,
        };
        await appContext.addVocabulary(newWord);
        return { success: true, message: `Đã thêm từ "${p.tu}" vào sổ từ vựng thành công!` };
      }

      case 'toggle_today_flashcard': {
        let targetId = action.params.wordId;
        if (!targetId && action.params.word) {
          const match = appContext.vocabulary.find(
            (v) => v.tu.toLowerCase().trim() === action.params.word.toLowerCase().trim()
          );
          if (match) targetId = match.id;
        }
        if (targetId) {
          appContext.toggleTodayFlashcard(targetId);
          return { success: true, message: 'Đã cập nhật trạng thái flashcard hôm nay' };
        }
        return { success: false, message: 'Không tìm thấy từ vựng tương ứng trong kho để ghim' };
      }

      case 'set_level': {
        const { language, level } = action.params;
        appContext.updateUser({
          cap_do: {
            [language]: level,
          } as any,
        });
        return { success: true, message: `Đã cập nhật cấp độ ${language.toUpperCase()} thành "${level}"` };
      }

      case 'danger_zone_guidance': {
        appContext.setActiveNav('sheets');
        return {
          success: true,
          message: 'Vì lý do an toàn, các thao tác dữ liệu nhạy cảm cần được thực hiện thủ công tại đây.',
        };
      }

      default:
        return { success: false, message: `Hành động không xác định: ${(action as any).actionId}` };
    }
  } catch (err: any) {
    return { success: false, message: `Thực thi thất bại: ${err?.message || err}` };
  }
}
