/// <reference types="vite/client" />
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import {
  VocabularyItem,
  GrammarItem,
  Deck,
  UserProfile,
  ReviewSession,
  MockTestRecord,
  ProgressRecord,
  JournalEntry,
  ChatConversation,
  NotificationItem,
} from '../types';

export interface SupabaseConfig {
  url: string;
  anonKey: string;
  autoSync: boolean;
}

const STORAGE_KEY = 'hoc_hanh_lam_supabase_config';

export class SupabaseService {
  private static client: SupabaseClient | null = null;

  public static normalizeUrl(url: string): string {
    if (!url || typeof url !== 'string') return '';
    let trimmed = url.trim();
    if (!trimmed) return '';
    if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
      trimmed = 'https://' + trimmed;
    }
    return trimmed;
  }

  public static getConfig(): SupabaseConfig {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return {
          url: this.normalizeUrl(parsed.url || ''),
          anonKey: (parsed.anonKey || '').trim(),
          autoSync: Boolean(parsed.autoSync),
        };
      } catch (e) {
        // Ignore parse error
      }
    }

    // Fallback to environment variables if present
    const envUrl = import.meta.env.VITE_SUPABASE_URL || '';
    const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

    return {
      url: this.normalizeUrl(envUrl),
      anonKey: envKey.trim(),
      autoSync: false,
    };
  }

  public static isValidUrl(urlString: string): boolean {
    if (!urlString || typeof urlString !== 'string') return false;
    const normalized = this.normalizeUrl(urlString);
    if (
      !normalized ||
      normalized.includes('your-project-id') ||
      normalized.includes('your-anon-key') ||
      normalized.includes('example.co')
    ) {
      return false;
    }
    try {
      const parsed = new URL(normalized);
      return (parsed.protocol === 'http:' || parsed.protocol === 'https:') && Boolean(parsed.hostname) && parsed.hostname.includes('.');
    } catch {
      return false;
    }
  }

  public static safeCreateClient(url: string, key: string): SupabaseClient | null {
    const normalizedUrl = this.normalizeUrl(url);
    const trimmedKey = (key || '').trim();

    if (!this.isValidUrl(normalizedUrl) || !trimmedKey || trimmedKey.includes('your-anon-key')) {
      return null;
    }

    try {
      return createClient(normalizedUrl, trimmedKey);
    } catch {
      return null;
    }
  }

  public static isConfigured(): boolean {
    const config = this.getConfig();
    return Boolean(this.safeCreateClient(config.url, config.anonKey));
  }

  public static saveConfig(config: SupabaseConfig): void {
    const normalizedConfig = {
      ...config,
      url: this.normalizeUrl(config.url),
      anonKey: config.anonKey.trim(),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(normalizedConfig));
    this.client = null; // reset client instance
  }

  public static getClient(): SupabaseClient | null {
    if (this.client) return this.client;
    const config = this.getConfig();
    this.client = this.safeCreateClient(config.url, config.anonKey);
    return this.client;
  }

  /**
   * Test if the provided credentials can connect to Supabase
   */
  public static async testConnection(customUrl?: string, customKey?: string): Promise<{ success: boolean; message: string }> {
    const config = this.getConfig();
    const rawUrl = customUrl !== undefined ? customUrl : config.url;
    const rawKey = customKey !== undefined ? customKey : config.anonKey;

    const url = this.normalizeUrl(rawUrl);
    const key = (rawKey || '').trim();

    if (!url || !key) {
      return { success: false, message: 'Vui lòng nhập đầy đủ Supabase URL và Anon Key.' };
    }

    if (!this.isValidUrl(url)) {
      return { success: false, message: 'Supabase URL không hợp lệ. Vui lòng nhập đúng định dạng URL (Ví dụ: https://yourproject.supabase.co).' };
    }

    const tempClient = this.safeCreateClient(url, key);
    if (!tempClient) {
      return { success: false, message: 'Không thể khởi tạo Supabase Client với thông tin URL và Key đã cung cấp.' };
    }

    try {
      const { data, error } = await tempClient.from('vocabulary').select('word_id').limit(1);

      if (error) {
        // If error code is 42P01 (relation does not exist), database is reachable but table is missing
        if (error.code === '42P01') {
          return {
            success: false,
            message: 'Kết nối thành công nhưng chưa tạo Bảng (Tables). Vui lòng chạy đoạn mã SQL tạo bảng trong Supabase SQL Editor.',
          };
        }
        return { success: false, message: `Lỗi kết nối Supabase: ${error.message}` };
      }

      return { success: true, message: 'Kết nối Supabase thành công và đã nhận diện được cấu trúc cơ sở dữ liệu!' };
    } catch (err: any) {
      return { success: false, message: `Không thể kết nối Supabase: ${err.message || err}` };
    }
  }

  /**
   * Upload / Push entire local app data into Supabase
   */
  public static async pushAllData(payload: {
    userProfile: UserProfile;
    vocabulary: VocabularyItem[];
    decks: Deck[];
    grammar: GrammarItem[];
    reviewSessions: ReviewSession[];
    mockTests: MockTestRecord[];
    progressRecords: ProgressRecord[];
    journalEntries: JournalEntry[];
    chatConversations: ChatConversation[];
    notifications: NotificationItem[];
  }): Promise<{ success: boolean; message: string }> {
    const client = this.getClient();
    if (!client) {
      return { success: false, message: 'Chưa cấu hình thông tin Supabase (URL & Anon Key).' };
    }

    try {
      // 1. User profile
      if (payload.userProfile) {
        await client.from('user_profiles').upsert([payload.userProfile], { onConflict: 'user_id' });
      }

      // 2. Vocabulary
      if (payload.vocabulary && payload.vocabulary.length > 0) {
        await client.from('vocabulary').upsert(payload.vocabulary, { onConflict: 'word_id' });
      }

      // 3. Decks
      if (payload.decks && payload.decks.length > 0) {
        await client.from('decks').upsert(payload.decks, { onConflict: 'deck_id' });
      }

      // 4. Grammar
      if (payload.grammar && payload.grammar.length > 0) {
        await client.from('grammar').upsert(payload.grammar, { onConflict: 'grammar_id' });
      }

      // 5. Review Sessions
      if (payload.reviewSessions && payload.reviewSessions.length > 0) {
        await client.from('review_sessions').upsert(payload.reviewSessions, { onConflict: 'session_id' });
      }

      // 6. Mock tests
      if (payload.mockTests && payload.mockTests.length > 0) {
        await client.from('mock_test_records').upsert(payload.mockTests, { onConflict: 'test_id' });
      }

      // 7. Progress records
      if (payload.progressRecords && payload.progressRecords.length > 0) {
        const mappedProgress = payload.progressRecords.map((r, idx) => ({
          id: `${r.user_id}_${r.ngon_ngu}_${r.ngay}`,
          ...r,
        }));
        await client.from('progress_records').upsert(mappedProgress, { onConflict: 'user_id,ngon_ngu,ngay' });
      }

      // 8. Journal entries
      if (payload.journalEntries && payload.journalEntries.length > 0) {
        await client.from('journal_entries').upsert(payload.journalEntries, { onConflict: 'entry_id' });
      }

      // 9. Chat conversations
      if (payload.chatConversations && payload.chatConversations.length > 0) {
        await client.from('chat_conversations').upsert(payload.chatConversations, { onConflict: 'chat_id' });
      }

      // 10. Notifications
      if (payload.notifications && payload.notifications.length > 0) {
        await client.from('notifications').upsert(payload.notifications, { onConflict: 'noti_id' });
      }

      return { success: true, message: 'Đã đồng bộ toàn bộ dữ liệu thành công lên Supabase Cloud!' };
    } catch (err: any) {
      console.error('Supabase Push Error:', err);
      return { success: false, message: `Lỗi đồng bộ Supabase: ${err.message || err}` };
    }
  }

  /**
   * Pull / Fetch all data from Supabase into application
   */
  public static async pullAllData(): Promise<{
    success: boolean;
    data?: {
      userProfile?: UserProfile;
      vocabulary?: VocabularyItem[];
      decks?: Deck[];
      grammar?: GrammarItem[];
      reviewSessions?: ReviewSession[];
      mockTests?: MockTestRecord[];
      progressRecords?: ProgressRecord[];
      journalEntries?: JournalEntry[];
      chatConversations?: ChatConversation[];
      notifications?: NotificationItem[];
    };
    message: string;
  }> {
    const client = this.getClient();
    if (!client) {
      return { success: false, message: 'Chưa cấu hình Supabase URL & Anon Key.' };
    }

    try {
      const [
        profileRes,
        vocabRes,
        decksRes,
        grammarRes,
        reviewsRes,
        testsRes,
        progressRes,
        journalRes,
        chatRes,
        notiRes,
      ] = await Promise.all([
        client.from('user_profiles').select('*').limit(1),
        client.from('vocabulary').select('*'),
        client.from('decks').select('*'),
        client.from('grammar').select('*'),
        client.from('review_sessions').select('*'),
        client.from('mock_test_records').select('*'),
        client.from('progress_records').select('*'),
        client.from('journal_entries').select('*'),
        client.from('chat_conversations').select('*'),
        client.from('notifications').select('*'),
      ]);

      return {
        success: true,
        message: 'Tải dữ liệu từ Supabase thành công!',
        data: {
          userProfile: profileRes.data && profileRes.data.length > 0 ? profileRes.data[0] : undefined,
          vocabulary: vocabRes.data || [],
          decks: decksRes.data || [],
          grammar: grammarRes.data || [],
          reviewSessions: reviewsRes.data || [],
          mockTests: testsRes.data || [],
          progressRecords: progressRes.data || [],
          journalEntries: journalRes.data || [],
          chatConversations: chatRes.data || [],
          notifications: notiRes.data || [],
        },
      };
    } catch (err: any) {
      console.error('Supabase Pull Error:', err);
      return { success: false, message: `Không thể tải dữ liệu từ Supabase: ${err.message || err}` };
    }
  }

  /**
   * Save a single vocabulary item into Supabase
   */
  public static async saveVocabulary(word: VocabularyItem): Promise<boolean> {
    const client = this.getClient();
    if (!client) return false;
    try {
      const { error } = await client.from('vocabulary').upsert([word], { onConflict: 'word_id' });
      if (error) console.error('Supabase saveVocabulary error:', error);
      return !error;
    } catch (e) {
      console.error('Supabase saveVocabulary exception:', e);
      return false;
    }
  }

  /**
   * Delete a vocabulary item from Supabase
   */
  public static async deleteVocabulary(wordId: string): Promise<boolean> {
    const client = this.getClient();
    if (!client) return false;
    try {
      const { error } = await client.from('vocabulary').delete().eq('word_id', wordId);
      return !error;
    } catch (e) {
      return false;
    }
  }

  /**
   * Save a single grammar item into Supabase
   */
  public static async saveGrammar(grammar: GrammarItem): Promise<boolean> {
    const client = this.getClient();
    if (!client) return false;
    try {
      const { error } = await client.from('grammar').upsert([grammar], { onConflict: 'grammar_id' });
      return !error;
    } catch (e) {
      return false;
    }
  }

  /**
   * Delete a grammar item from Supabase
   */
  public static async deleteGrammar(grammarId: string): Promise<boolean> {
    const client = this.getClient();
    if (!client) return false;
    try {
      const { error } = await client.from('grammar').delete().eq('grammar_id', grammarId);
      return !error;
    } catch (e) {
      return false;
    }
  }
}
