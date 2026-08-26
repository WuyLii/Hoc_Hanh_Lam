import {
  UserProfile,
  VocabularyItem,
  GrammarItem,
  Deck,
  ListeningExercise,
  RoleplayScenario,
} from '../types';

export const INITIAL_USERS: UserProfile[] = [
  {
    user_id: 'user_1',
    ten: 'Học viên mới',
    avatar: '🎓',
    ngon_ngu_hoc: 'en',
    cap_do: {
      en: 'A1 - Sơ cấp',
      ko: 'TOPIK 1 (Sơ cấp 1)',
      zh: 'HSK 1',
    },
    muc_tieu: {
      en: 'Học từ vựng và kết nối Google Sheets',
      ko: 'Học tiếng Hàn hiệu quả',
      zh: 'Học tiếng Trung thực chiến',
    },
    pin_hash: '1234',
    ngay_tham_gia: new Date().toISOString().split('T')[0],
    daily_target_minutes: 20,
    streak: 0,
    last_active_date: new Date().toISOString().split('T')[0],
    total_points: 0,
  },
];

export const INITIAL_VOCABULARY: VocabularyItem[] = [];

export const INITIAL_GRAMMAR: GrammarItem[] = [];

export const INITIAL_DECKS: Deck[] = [];

export const INITIAL_LISTENING_EXERCISES: ListeningExercise[] = [];

export const INITIAL_MOCK_TESTS = [];

export const INITIAL_ROLEPLAY_SCENARIOS: RoleplayScenario[] = [];
