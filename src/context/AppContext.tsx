import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  UserProfile,
  VocabularyItem,
  Deck,
  GrammarItem,
  ReviewSession,
  MockTestRecord,
  ListeningExercise,
  ProgressRecord,
  JournalEntry,
  NotificationItem,
  ChatConversation,
  LanguageCode,
  GoogleSheetsConfig,
} from '../types';
import {
  INITIAL_USERS,
  INITIAL_VOCABULARY,
  INITIAL_GRAMMAR,
  INITIAL_DECKS,
  INITIAL_LISTENING_EXERCISES,
} from '../data/seedData';
import { calculateNextSRS, RecallQuality } from '../services/srsEngine';
import { GoogleSheetsService, SheetsPayload } from '../services/googleSheetsService';

interface AppContextType {
  currentUser: UserProfile;
  currentLanguage: LanguageCode;
  setCurrentLanguage: (lang: LanguageCode) => void;
  updateUser: (user: Partial<UserProfile>) => void;

  vocabulary: VocabularyItem[];
  currentLangVocabulary: VocabularyItem[];
  addVocabulary: (item: Partial<VocabularyItem>) => VocabularyItem;
  updateVocabulary: (item: VocabularyItem) => void;
  deleteVocabulary: (wordId: string) => void;
  batchAddVocabulary: (items: Partial<VocabularyItem>[]) => number;
  recordSRSRating: (wordId: string, rating: RecallQuality) => void;

  decks: Deck[];
  currentLangDecks: Deck[];
  addDeck: (deck: Partial<Deck>) => Deck;
  updateDeck: (deck: Deck) => void;
  deleteDeck: (deckId: string) => void;

  grammar: GrammarItem[];
  currentLangGrammar: GrammarItem[];
  addGrammar: (item: Partial<GrammarItem>) => GrammarItem;
  updateGrammar: (item: GrammarItem) => void;
  deleteGrammar: (grammarId: string) => void;
  batchAddGrammar: (items: Partial<GrammarItem>[]) => number;

  reviewSessions: ReviewSession[];
  addReviewSession: (session: Omit<ReviewSession, 'session_id'>) => void;

  mockTests: MockTestRecord[];
  addMockTestRecord: (test: MockTestRecord) => void;

  listeningExercises: ListeningExercise[];
  currentLangListening: ListeningExercise[];
  addListeningExercise: (ex: ListeningExercise) => void;

  progressLogs: ProgressRecord[];
  addStudyTime: (minutes: number, score?: number) => void;

  journalEntries: JournalEntry[];
  addJournalEntry: (entry: Omit<JournalEntry, 'entry_id' | 'created_at'>) => JournalEntry;

  notifications: NotificationItem[];
  addNotification: (noti: Omit<NotificationItem, 'noti_id'>) => void;
  markNotificationRead: (notiId: string) => void;

  chatHistory: ChatConversation[];
  saveChatConversation: (conv: ChatConversation) => void;

  sheetsConfig: GoogleSheetsConfig;
  updateSheetsConfig: (config: Partial<GoogleSheetsConfig>) => void;
  syncGoogleSheets: () => Promise<{ success: boolean; message: string }>;
  pullGoogleSheets: () => Promise<{ success: boolean; message: string }>;
  isSyncing: boolean;

  activeNav: string;
  setActiveNav: (nav: string) => void;
  selectedDeckId: string | null;
  setSelectedDeckId: (id: string | null) => void;
  selectedGameMode: string | null;
  setSelectedGameMode: (mode: string | null) => void;
  selectedLevelFilter: string | null;
  setSelectedLevelFilter: (lvl: string | null) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const LOCAL_STORAGE_PREFIX = 'polyglot_hub_v1_';

function loadFromStorage<T>(key: string, fallback: T): T {
  try {
    const item = localStorage.getItem(LOCAL_STORAGE_PREFIX + key);
    return item ? JSON.parse(item) : fallback;
  } catch (e) {
    console.error(`Error loading ${key} from localStorage`, e);
    return fallback;
  }
}

function saveToStorage<T>(key: string, value: T): void {
  try {
    localStorage.setItem(LOCAL_STORAGE_PREFIX + key, JSON.stringify(value));
  } catch (e) {
    console.error(`Error saving ${key} to localStorage`, e);
  }
}

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // One-time absolute zero state reset
  useEffect(() => {
    const hasReset = localStorage.getItem('polyglot_hub_zero_state_v5');
    if (!hasReset) {
      localStorage.removeItem(LOCAL_STORAGE_PREFIX + 'vocabulary');
      localStorage.removeItem(LOCAL_STORAGE_PREFIX + 'decks');
      localStorage.removeItem(LOCAL_STORAGE_PREFIX + 'grammar');
      localStorage.removeItem(LOCAL_STORAGE_PREFIX + 'review_sessions');
      localStorage.removeItem(LOCAL_STORAGE_PREFIX + 'mock_tests');
      localStorage.removeItem(LOCAL_STORAGE_PREFIX + 'listening');
      localStorage.removeItem(LOCAL_STORAGE_PREFIX + 'progress_logs');
      localStorage.removeItem(LOCAL_STORAGE_PREFIX + 'journal');
      localStorage.removeItem(LOCAL_STORAGE_PREFIX + 'chat_history');
      localStorage.removeItem(LOCAL_STORAGE_PREFIX + 'notifications');
      localStorage.removeItem(LOCAL_STORAGE_PREFIX + 'current_user');
      localStorage.setItem('polyglot_hub_zero_state_v5', 'true');
    }
  }, []);

  const [currentUser, setCurrentUser] = useState<UserProfile>(() =>
    loadFromStorage('current_user', {
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
    })
  );
  const [currentLanguage, setCurrentLanguage] = useState<LanguageCode>(() =>
    loadFromStorage('current_lang', 'en')
  );

  const [vocabulary, setVocabulary] = useState<VocabularyItem[]>(() =>
    loadFromStorage('vocabulary', [])
  );
  const [decks, setDecks] = useState<Deck[]>(() =>
    loadFromStorage('decks', [])
  );
  const [grammar, setGrammar] = useState<GrammarItem[]>(() =>
    loadFromStorage('grammar', [])
  );
  const [reviewSessions, setReviewSessions] = useState<ReviewSession[]>(() =>
    loadFromStorage('review_sessions', [])
  );
  const [mockTests, setMockTests] = useState<MockTestRecord[]>(() =>
    loadFromStorage('mock_tests', [])
  );
  const [listeningExercises, setListeningExercises] = useState<ListeningExercise[]>(() =>
    loadFromStorage('listening', [])
  );
  const [progressLogs, setProgressLogs] = useState<ProgressRecord[]>(() =>
    loadFromStorage('progress_logs', [])
  );
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>(() =>
    loadFromStorage('journal', [])
  );
  const [notifications, setNotifications] = useState<NotificationItem[]>(() =>
    loadFromStorage('notifications', [])
  );
  const [chatHistory, setChatHistory] = useState<ChatConversation[]>(() =>
    loadFromStorage('chat_history', [])
  );
  const [sheetsConfig, setSheetsConfig] = useState<GoogleSheetsConfig>(() =>
    loadFromStorage('sheets_config', {
      scriptUrl: '',
      spreadsheetId: '',
      autoSync: false,
    })
  );

  const [activeNav, setActiveNav] = useState<string>('dashboard');
  const [selectedDeckId, setSelectedDeckId] = useState<string | null>(null);
  const [selectedGameMode, setSelectedGameMode] = useState<string | null>(null);
  const [selectedLevelFilter, setSelectedLevelFilter] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  // Cross-tab synchronization via storage event listener
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (!e.key || !e.key.startsWith(LOCAL_STORAGE_PREFIX)) return;
      const key = e.key.replace(LOCAL_STORAGE_PREFIX, '');
      try {
        if (!e.newValue) return;
        const parsed = JSON.parse(e.newValue);
        if (key === 'vocabulary') setVocabulary(parsed);
        else if (key === 'decks') setDecks(parsed);
        else if (key === 'grammar') setGrammar(parsed);
        else if (key === 'review_sessions') setReviewSessions(parsed);
        else if (key === 'mock_tests') setMockTests(parsed);
        else if (key === 'listening') setListeningExercises(parsed);
        else if (key === 'progress_logs') setProgressLogs(parsed);
        else if (key === 'journal') setJournalEntries(parsed);
        else if (key === 'notifications') setNotifications(parsed);
        else if (key === 'chat_history') setChatHistory(parsed);
        else if (key === 'current_user') setCurrentUser(parsed);
        else if (key === 'current_lang') setCurrentLanguage(parsed);
        else if (key === 'sheets_config') setSheetsConfig(parsed);
      } catch (err) {
        console.error('Error syncing storage across tabs:', err);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Sync to local storage
  useEffect(() => saveToStorage('current_user', currentUser), [currentUser]);
  useEffect(() => saveToStorage('current_lang', currentLanguage), [currentLanguage]);
  useEffect(() => saveToStorage('vocabulary', vocabulary), [vocabulary]);
  useEffect(() => saveToStorage('decks', decks), [decks]);
  useEffect(() => saveToStorage('grammar', grammar), [grammar]);
  useEffect(() => saveToStorage('review_sessions', reviewSessions), [reviewSessions]);
  useEffect(() => saveToStorage('mock_tests', mockTests), [mockTests]);
  useEffect(() => saveToStorage('listening', listeningExercises), [listeningExercises]);
  useEffect(() => saveToStorage('progress_logs', progressLogs), [progressLogs]);
  useEffect(() => saveToStorage('journal', journalEntries), [journalEntries]);
  useEffect(() => saveToStorage('notifications', notifications), [notifications]);
  useEffect(() => saveToStorage('chat_history', chatHistory), [chatHistory]);
  useEffect(() => saveToStorage('sheets_config', sheetsConfig), [sheetsConfig]);

  // Language filtered items
  const currentLangVocabulary = vocabulary.filter((w) => w.ngon_ngu === currentLanguage);
  const currentLangDecks = decks.filter((d) => d.ngon_ngu === currentLanguage);
  const currentLangGrammar = grammar.filter((g) => g.ngon_ngu === currentLanguage);
  const currentLangListening = listeningExercises.filter((l) => l.ngon_ngu === currentLanguage);

  const updateUser = (updatedProps: Partial<UserProfile>) => {
    setCurrentUser((prev) => ({ ...prev, ...updatedProps }));
  };

  // Vocabulary Operations
  const addVocabulary = (item: Partial<VocabularyItem>): VocabularyItem => {
    const newWord: VocabularyItem = {
      word_id: `w_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      tu: item.tu || '',
      nghia: item.nghia || '',
      phien_am: item.phien_am || '',
      loai_tu: item.loai_tu || 'Từ vựng',
      vi_du: item.vi_du || '',
      vi_du_dich: item.vi_du_dich || '',
      audio_url: item.audio_url,
      hinh_url: item.hinh_url,
      ngon_ngu: item.ngon_ngu || currentLanguage,
      chu_de: item.chu_de || 'Tổng hợp',
      cap_do: item.cap_do || 'Cơ bản',
      nguon_goc: item.nguon_goc || 'Tự thêm',
      srs_box: 0,
      srs_next_review: new Date().toISOString(),
      srs_interval: 0,
      srs_ease: 2.5,
      times_reviewed: 0,
      times_correct: 0,
      user_id: currentUser.user_id,
      created_at: new Date().toISOString().split('T')[0],
    };

    setVocabulary((prev) => [newWord, ...prev]);

    // Give points
    updateUser({ total_points: (currentUser.total_points || 0) + 10 });
    return newWord;
  };

  const updateVocabulary = (item: VocabularyItem) => {
    setVocabulary((prev) => prev.map((w) => (w.word_id === item.word_id ? item : w)));
  };

  const deleteVocabulary = (wordId: string) => {
    setVocabulary((prev) => prev.filter((w) => w.word_id !== wordId));
  };

  const batchAddVocabulary = (items: Partial<VocabularyItem>[]): number => {
    let count = 0;
    const newItems: VocabularyItem[] = [];

    items.forEach((item) => {
      if (!item.tu || !item.nghia) return;
      newItems.push({
        word_id: `w_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
        tu: item.tu.trim(),
        nghia: item.nghia.trim(),
        phien_am: item.phien_am || '',
        loai_tu: item.loai_tu || 'Từ vựng',
        vi_du: item.vi_du || '',
        vi_du_dich: item.vi_du_dich || '',
        audio_url: item.audio_url,
        hinh_url: item.hinh_url,
        ngon_ngu: item.ngon_ngu || currentLanguage,
        chu_de: item.chu_de || 'Nhập file',
        cap_do: item.cap_do || 'Tổng hợp',
        nguon_goc: item.nguon_goc || 'Import CSV/Excel',
        srs_box: 0,
        srs_next_review: new Date().toISOString(),
        srs_interval: 0,
        srs_ease: 2.5,
        times_reviewed: 0,
        times_correct: 0,
        user_id: currentUser.user_id,
        created_at: new Date().toISOString().split('T')[0],
      });
      count++;
    });

    if (newItems.length > 0) {
      setVocabulary((prev) => [...newItems, ...prev]);
      updateUser({ total_points: (currentUser.total_points || 0) + count * 5 });
    }
    return count;
  };

  const recordSRSRating = (wordId: string, rating: RecallQuality) => {
    const targetWord = vocabulary.find((w) => w.word_id === wordId);
    if (!targetWord) return;

    const srsUpdate = calculateNextSRS(targetWord, rating);
    const updatedWord: VocabularyItem = {
      ...targetWord,
      ...srsUpdate,
      last_reviewed: new Date().toISOString(),
    };

    updateVocabulary(updatedWord);

    // Add points for studying
    const pts = rating === 'easy' ? 15 : rating === 'good' ? 10 : rating === 'hard' ? 5 : 2;
    updateUser({ total_points: (currentUser.total_points || 0) + pts });
  };

  // Deck operations
  const addDeck = (deck: Partial<Deck>): Deck => {
    const newDeck: Deck = {
      deck_id: `deck_${Date.now()}`,
      ten_bo: deck.ten_bo || 'Bộ từ mới',
      ngon_ngu: deck.ngon_ngu || currentLanguage,
      mo_ta: deck.mo_ta || '',
      nguoi_tao: currentUser.user_id,
      danh_sach_word_id: deck.danh_sach_word_id || [],
      che_do_chia_se: deck.che_do_chia_se || 'shared',
      color: deck.color || 'from-indigo-500 to-purple-600',
      icon: deck.icon || '📚',
      created_at: new Date().toISOString().split('T')[0],
    };
    setDecks((prev) => [newDeck, ...prev]);
    return newDeck;
  };

  const updateDeck = (deck: Deck) => {
    setDecks((prev) => prev.map((d) => (d.deck_id === deck.deck_id ? deck : d)));
  };

  const deleteDeck = (deckId: string) => {
    setDecks((prev) => prev.filter((d) => d.deck_id !== deckId));
  };

  // Grammar operations
  const addGrammar = (item: Partial<GrammarItem>): GrammarItem => {
    const newGr: GrammarItem = {
      grammar_id: `gr_${Date.now()}`,
      cau_truc: item.cau_truc || '',
      giai_thich: item.giai_thich || '',
      vi_du: item.vi_du || '',
      vi_du_dich: item.vi_du_dich || '',
      ngon_ngu: item.ngon_ngu || currentLanguage,
      cap_do: item.cap_do || 'Cơ bản',
      ghi_chu: item.ghi_chu || '',
      tags: item.tags || ['Ngữ pháp'],
      user_id: currentUser.user_id,
      created_at: new Date().toISOString().split('T')[0],
    };
    setGrammar((prev) => [newGr, ...prev]);
    return newGr;
  };

  const updateGrammar = (item: GrammarItem) => {
    setGrammar((prev) => prev.map((g) => (g.grammar_id === item.grammar_id ? item : g)));
  };

  const deleteGrammar = (grammarId: string) => {
    setGrammar((prev) => prev.filter((g) => g.grammar_id !== grammarId));
  };

  const batchAddGrammar = (items: Partial<GrammarItem>[]): number => {
    let count = 0;
    const newItems: GrammarItem[] = [];

    items.forEach((item) => {
      if (!item.cau_truc || !item.giai_thich) return;
      newItems.push({
        grammar_id: `gr_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
        cau_truc: item.cau_truc.trim(),
        giai_thich: item.giai_thich.trim(),
        vi_du: item.vi_du || '',
        vi_du_dich: item.vi_du_dich || '',
        ngon_ngu: item.ngon_ngu || currentLanguage,
        cap_do: item.cap_do || 'Cơ bản',
        ghi_chu: item.ghi_chu || '',
        tags: item.tags && item.tags.length > 0 ? item.tags : ['Sách giáo khoa'],
        user_id: currentUser.user_id,
        created_at: new Date().toISOString().split('T')[0],
      });
      count++;
    });

    if (newItems.length > 0) {
      setGrammar((prev) => [...newItems, ...prev]);
      updateUser({ total_points: (currentUser.total_points || 0) + count * 8 });
    }
    return count;
  };

  // Review sessions & mock tests
  const addReviewSession = (session: Omit<ReviewSession, 'session_id'>) => {
    const newSession: ReviewSession = {
      ...session,
      session_id: `session_${Date.now()}`,
    };
    setReviewSessions((prev) => [newSession, ...prev]);
    updateUser({ total_points: (currentUser.total_points || 0) + session.diem });
  };

  const addMockTestRecord = (test: MockTestRecord) => {
    setMockTests((prev) => [test, ...prev]);
    const earnedPoints = Math.round((test.diem_so / (test.tong_diem || 100)) * 100);
    updateUser({ total_points: (currentUser.total_points || 0) + earnedPoints });
  };

  const addListeningExercise = (ex: ListeningExercise) => {
    setListeningExercises((prev) => [ex, ...prev]);
  };

  const addStudyTime = (minutes: number, score: number = 0) => {
    const today = new Date().toISOString().split('T')[0];
    setProgressLogs((prev) => {
      const existing = prev.find((p) => p.user_id === currentUser.user_id && p.ngay === today && p.ngon_ngu === currentLanguage);
      if (existing) {
        return prev.map((p) =>
          p === existing
            ? {
                ...p,
                thoi_gian_hoc_phut: p.thoi_gian_hoc_phut + minutes,
                score_earned: p.score_earned + score,
              }
            : p
        );
      } else {
        return [
          {
            user_id: currentUser.user_id,
            ngon_ngu: currentLanguage,
            ngay: today,
            so_tu_moi: 0,
            streak: currentUser.streak || 1,
            thoi_gian_hoc_phut: minutes,
            score_earned: score,
          },
          ...prev,
        ];
      }
    });
  };

  const addJournalEntry = (entry: Omit<JournalEntry, 'entry_id' | 'created_at'>): JournalEntry => {
    const newEntry: JournalEntry = {
      ...entry,
      entry_id: `journal_${Date.now()}`,
      created_at: new Date().toISOString(),
    };
    setJournalEntries((prev) => [newEntry, ...prev]);
    updateUser({ total_points: (currentUser.total_points || 0) + 50 });
    return newEntry;
  };

  const addNotification = (noti: Omit<NotificationItem, 'noti_id'>) => {
    const newNoti: NotificationItem = {
      ...noti,
      noti_id: `noti_${Date.now()}`,
    };
    setNotifications((prev) => [newNoti, ...prev]);
  };

  const markNotificationRead = (notiId: string) => {
    setNotifications((prev) => prev.map((n) => (n.noti_id === notiId ? { ...n, da_doc: true } : n)));
  };

  const saveChatConversation = (conv: ChatConversation) => {
    setChatHistory((prev) => {
      const idx = prev.findIndex((c) => c.chat_id === conv.chat_id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = conv;
        return next;
      }
      return [conv, ...prev];
    });
  };

  const updateSheetsConfig = (cfg: Partial<GoogleSheetsConfig>) => {
    setSheetsConfig((prev) => ({ ...prev, ...cfg }));
  };

  // Google Sheets Push & Pull
  const syncGoogleSheets = async (): Promise<{ success: boolean; message: string }> => {
    if (!sheetsConfig.scriptUrl) {
      return { success: false, message: 'Vui lòng nhập URL Google Apps Script trong phần Cài đặt đồng bộ' };
    }

    setIsSyncing(true);
    try {
      const payload: SheetsPayload = {
        users: [currentUser],
        vocabulary,
        decks,
        grammar,
        reviewSessions,
        tests: mockTests,
        listening: listeningExercises,
        progress: progressLogs,
        journal: journalEntries,
        notifications,
        chatHistory,
      };

      const result = await GoogleSheetsService.syncToGoogleSheets(sheetsConfig.scriptUrl, payload);
      setSheetsConfig((prev) => ({ ...prev, lastSyncedAt: new Date().toISOString() }));
      return result;
    } catch (e: any) {
      return { success: false, message: e.message || 'Lỗi khi đồng bộ lên Google Sheets' };
    } finally {
      setIsSyncing(false);
    }
  };

  const pullGoogleSheets = async (): Promise<{ success: boolean; message: string }> => {
    if (!sheetsConfig.scriptUrl) {
      return { success: false, message: 'Vui lòng nhập URL Google Apps Script' };
    }

    setIsSyncing(true);
    try {
      const data = await GoogleSheetsService.pullFromGoogleSheets(sheetsConfig.scriptUrl);
      if (data) {
        const vocab = data.vocabulary || data.Vocabulary;
        if (Array.isArray(vocab)) setVocabulary(vocab);

        const gram = data.grammar || data.Grammar;
        if (Array.isArray(gram)) setGrammar(gram);

        const dks = data.decks || data.Decks;
        if (Array.isArray(dks)) setDecks(dks);

        const usr = data.users || data.Users;
        if (Array.isArray(usr) && usr.length > 0) setCurrentUser(usr[0]);

        const rev = data.reviewSessions || data.ReviewSessions;
        if (Array.isArray(rev)) setReviewSessions(rev);

        const tsts = data.tests || data.Tests;
        if (Array.isArray(tsts)) setMockTests(tsts);

        const lst = data.listening || data.Listening;
        if (Array.isArray(lst)) setListeningExercises(lst);

        const prg = data.progress || data.Progress;
        if (Array.isArray(prg)) setProgressLogs(prg);

        const jrn = data.journal || data.Journal;
        if (Array.isArray(jrn)) setJournalEntries(jrn);

        const notis = data.notifications || data.Notifications;
        if (Array.isArray(notis)) setNotifications(notis);

        const chats = data.chatHistory || data.ChatHistory;
        if (Array.isArray(chats)) setChatHistory(chats);

        setSheetsConfig((prev) => ({ ...prev, lastSyncedAt: new Date().toISOString() }));
        return { success: true, message: 'Đã tải toàn bộ dữ liệu mới nhất từ Google Sheets về thành công!' };
      }
      return { success: false, message: 'Không có dữ liệu trả về từ Google Sheets' };
    } catch (e: any) {
      return { success: false, message: e.message || 'Lỗi khi tải dữ liệu từ Google Sheets' };
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <AppContext.Provider
      value={{
        currentUser,
        currentLanguage,
        setCurrentLanguage,
        updateUser,

        vocabulary,
        currentLangVocabulary,
        addVocabulary,
        updateVocabulary,
        deleteVocabulary,
        batchAddVocabulary,
        recordSRSRating,

        decks,
        currentLangDecks,
        addDeck,
        updateDeck,
        deleteDeck,

        grammar,
        currentLangGrammar,
        addGrammar,
        updateGrammar,
        deleteGrammar,
        batchAddGrammar,

        reviewSessions,
        addReviewSession,

        mockTests,
        addMockTestRecord,

        listeningExercises,
        currentLangListening,
        addListeningExercise,

        progressLogs,
        addStudyTime,

        journalEntries,
        addJournalEntry,

        notifications,
        addNotification,
        markNotificationRead,

        chatHistory,
        saveChatConversation,

        sheetsConfig,
        updateSheetsConfig,
        syncGoogleSheets,
        pullGoogleSheets,
        isSyncing,

        activeNav,
        setActiveNav,
        selectedDeckId,
        setSelectedDeckId,
        selectedGameMode,
        setSelectedGameMode,
        selectedLevelFilter,
        setSelectedLevelFilter,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
