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

export const DEFAULT_SUPABASE_URL = 'https://fzdxabrvddjtpnbjvcii.supabase.co';

const STORAGE_KEY = 'hoc_hanh_lam_supabase_config';

export class SupabaseService {
  private static client: SupabaseClient | null = null;

  public static cleanKey(key: string): string {
    if (!key || typeof key !== 'string') return '';
    return key.replace(/['"\r\n\t ]/g, '').trim();
  }

  public static normalizeUrl(url: string): string {
    if (!url || typeof url !== 'string') return '';
    let trimmed = url.replace(/['"\r\n\t ]/g, '').trim();
    if (!trimmed) return '';
    if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
      trimmed = 'https://' + trimmed;
    }
    return trimmed.replace(/\/+$/, '');
  }

  public static getConfig(): SupabaseConfig {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const rawUrl = parsed.url;
        const validUrl =
          rawUrl &&
          !rawUrl.includes('your-project-id') &&
          !rawUrl.includes('example.co') &&
          !rawUrl.includes('xyzcompany')
            ? rawUrl
            : DEFAULT_SUPABASE_URL;

        return {
          url: this.normalizeUrl(validUrl),
          anonKey: this.cleanKey(parsed.anonKey || ''),
          autoSync: Boolean(parsed.autoSync),
        };
      } catch (e) {
        // Ignore parse error
      }
    }

    // Fallback to environment variables if present
    const envUrl = import.meta.env.VITE_SUPABASE_URL || (import.meta.env as any).SUPABASE_URL || DEFAULT_SUPABASE_URL;
    const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY || (import.meta.env as any).SUPABASE_ANON_KEY || '';

    return {
      url: this.normalizeUrl(envUrl || DEFAULT_SUPABASE_URL),
      anonKey: this.cleanKey(envKey),
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
    const trimmedKey = this.cleanKey(key);

    if (!this.isValidUrl(normalizedUrl) || !trimmedKey || trimmedKey.includes('your-anon-key')) {
      return null;
    }

    try {
      return createClient(normalizedUrl, trimmedKey, {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
          detectSessionInUrl: false,
        },
      });
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
      anonKey: this.cleanKey(config.anonKey),
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
    const key = this.cleanKey(rawKey);

    if (!url || !key) {
      return { success: false, message: 'Vui lòng nhập đầy đủ Supabase URL và Anon Key.' };
    }

    if (!this.isValidUrl(url)) {
      return { success: false, message: 'Supabase URL không hợp lệ. Vui lòng nhập đúng định dạng URL (Ví dụ: https://yourproject.supabase.co).' };
    }

    if (key.length < 30) {
      return {
        success: false,
        message: 'Khóa Anon Key không hợp lệ hoặc quá ngắn. Anon Key của Supabase là chuỗi mã hóa dài (thường bắt đầu bằng "eyJ..."). Vui lòng kiểm tra lại.',
      };
    }

    const tempClient = this.safeCreateClient(url, key);
    if (!tempClient) {
      return { success: false, message: 'Không thể khởi tạo Supabase Client với thông tin URL và Key đã cung cấp.' };
    }

    try {
      const { error, status } = await tempClient.from('vocabulary').select('word_id').limit(1);

      if (error) {
        if (status === 401 || error.message?.toLowerCase().includes('api key') || error.message?.toLowerCase().includes('jwt')) {
          return {
            success: false,
            message: '❌ Lỗi 401 (Unauthorized): Khóa "Anon API Key" không chính xác hoặc đã bị làm mới trong Supabase. Vui lòng vào Supabase Dashboard > Settings > API và copy lại khóa "anon public" (bắt đầu bằng eyJ...).',
          };
        }
        if (error.code === '42501' || error.message?.toLowerCase().includes('permission denied')) {
          return {
            success: false,
            message: '🔒 Lỗi 42501 (Permission Denied): Bảng chưa cấp quyền truy cập cho role anon. Vui lòng vào SQL Editor trên Supabase và chạy lệnh: GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;',
          };
        }
        if (error.code === '42P01') {
          return {
            success: false,
            message: '⚠️ Kết nối Supabase thành công nhưng chưa tạo Bảng (Tables). Vui lòng vào SQL Editor trên Supabase và bấm Run đoạn mã SQL tạo bảng.',
          };
        }
        return { success: false, message: `Lỗi kết nối Supabase (${status || error.code || 'Error'}): ${error.message}` };
      }

      return { success: true, message: '✅ Kết nối Supabase thành công và đã nhận diện được cấu trúc cơ sở dữ liệu!' };
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
        const cleanProfile = {
          ...payload.userProfile,
          ngay_tham_gia: payload.userProfile.ngay_tham_gia || new Date().toISOString(),
          last_active_date: payload.userProfile.last_active_date || new Date().toISOString().split('T')[0],
        };
        const { error } = await client.from('user_profiles').upsert([cleanProfile], { onConflict: 'user_id' });
        if (error) throw { table: 'user_profiles', error };
      }

      // 2. Vocabulary
      if (payload.vocabulary && payload.vocabulary.length > 0) {
        const cleanVocab = payload.vocabulary.map((v) => ({
          ...v,
          last_reviewed: v.last_reviewed ? v.last_reviewed : null,
          srs_next_review: v.srs_next_review || new Date().toISOString(),
          created_at: v.created_at || new Date().toISOString(),
        }));
        const { error } = await client.from('vocabulary').upsert(cleanVocab, { onConflict: 'word_id' });
        if (error) throw { table: 'vocabulary', error };
      }

      // 3. Decks
      if (payload.decks && payload.decks.length > 0) {
        const { error } = await client.from('decks').upsert(payload.decks, { onConflict: 'deck_id' });
        if (error) throw { table: 'decks', error };
      }

      // 4. Grammar
      if (payload.grammar && payload.grammar.length > 0) {
        const { error } = await client.from('grammar').upsert(payload.grammar, { onConflict: 'grammar_id' });
        if (error) throw { table: 'grammar', error };
      }

      // 5. Review Sessions
      if (payload.reviewSessions && payload.reviewSessions.length > 0) {
        const cleanSessions = payload.reviewSessions.map((s) => ({
          ...s,
          thoi_gian_bat_dau: s.thoi_gian_bat_dau || new Date().toISOString(),
          thoi_gian_ket_thuc: s.thoi_gian_ket_thuc || new Date().toISOString(),
        }));
        const { error } = await client.from('review_sessions').upsert(cleanSessions, { onConflict: 'session_id' });
        if (error) throw { table: 'review_sessions', error };
      }

      // 6. Mock tests
      if (payload.mockTests && payload.mockTests.length > 0) {
        const cleanTests = payload.mockTests.map((t) => ({
          ...t,
          ngay_lam: t.ngay_lam || new Date().toISOString(),
        }));
        const { error } = await client.from('mock_test_records').upsert(cleanTests, { onConflict: 'test_id' });
        if (error) throw { table: 'mock_test_records', error };
      }

      // 7. Progress records
      if (payload.progressRecords && payload.progressRecords.length > 0) {
        const mappedProgress = payload.progressRecords.map((r) => ({
          id: `${r.user_id}_${r.ngon_ngu}_${r.ngay}`,
          ...r,
          ngay: r.ngay || new Date().toISOString().split('T')[0],
        }));
        const { error } = await client.from('progress_records').upsert(mappedProgress, { onConflict: 'id' });
        if (error) throw { table: 'progress_records', error };
      }

      // 8. Journal entries
      if (payload.journalEntries && payload.journalEntries.length > 0) {
        const cleanJournal = payload.journalEntries.map((j) => ({
          ...j,
          ngay: j.ngay || new Date().toISOString(),
        }));
        const { error } = await client.from('journal_entries').upsert(cleanJournal, { onConflict: 'entry_id' });
        if (error) throw { table: 'journal_entries', error };
      }

      // 9. Chat conversations
      if (payload.chatConversations && payload.chatConversations.length > 0) {
        const { error } = await client.from('chat_conversations').upsert(payload.chatConversations, { onConflict: 'chat_id' });
        if (error) throw { table: 'chat_conversations', error };
      }

      // 10. Notifications
      if (payload.notifications && payload.notifications.length > 0) {
        const cleanNoti = payload.notifications.map((n) => ({
          ...n,
          thoi_gian: n.thoi_gian || new Date().toISOString(),
        }));
        const { error } = await client.from('notifications').upsert(cleanNoti, { onConflict: 'noti_id' });
        if (error) throw { table: 'notifications', error };
      }

      return {
        success: true,
        message: `Đã đồng bộ thành công ${payload.vocabulary?.length || 0} từ vựng, ${payload.grammar?.length || 0} ngữ pháp lên Supabase Cloud!`,
      };
    } catch (err: any) {
      console.error('Supabase Push Error:', err);
      const table = err?.table;
      const errorObj = err?.error || err;
      const status = errorObj?.status || errorObj?.statusCode;
      const message = errorObj?.message || String(err);

      if (status === 401 || message.toLowerCase().includes('api key') || message.toLowerCase().includes('jwt')) {
        return {
          success: false,
          message: '❌ Lỗi 401 (Unauthorized): Khóa "Anon API Key" không chính xác hoặc đã hết hạn. Vui lòng lấy lại Anon Public Key trong Supabase Settings > API.',
        };
      }
      if (errorObj?.code === '42501' || message.toLowerCase().includes('permission denied')) {
        return {
          success: false,
          message: `🔒 Lỗi 42501 (Permission Denied) cho bảng "${table || 'dữ liệu'}": Bảng chưa cấp quyền truy cập (GRANT) cho role anon. Vui lòng vào SQL Editor trên Supabase và chạy lệnh: GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;`,
        };
      }
      if (errorObj?.code === '42P01') {
        return {
          success: false,
          message: `⚠️ Bảng "${table || 'dữ liệu'}" chưa được tạo trên Supabase. Vui lòng chạy đoạn mã SQL tạo bảng trong SQL Editor.`,
        };
      }
      return {
        success: false,
        message: `Lỗi đồng bộ Supabase [Bảng ${table || ''}]: ${message}`,
      };
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

      // Check for table or permission errors
      const errors = [
        vocabRes.error,
        grammarRes.error,
        decksRes.error,
        profileRes.error,
        reviewsRes.error,
        testsRes.error,
        progressRes.error,
        journalRes.error,
        chatRes.error,
        notiRes.error,
      ].filter(Boolean);

      if (errors.length > 0) {
        const firstErr = errors[0];
        if (firstErr?.code === '42501' || firstErr?.message?.toLowerCase().includes('permission denied')) {
          return {
            success: false,
            message: '🔒 Lỗi 42501 (Permission Denied): Bảng chưa cấp quyền truy cập (GRANT) cho role anon. Vui lòng vào SQL Editor trên Supabase và chạy lệnh: GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;',
          };
        }
        if (firstErr?.code === '42P01') {
          return {
            success: false,
            message: '⚠️ Bảng (Table) chưa được tạo trên Supabase. Vui lòng vào SQL Editor trên Supabase và bấm Run đoạn mã SQL tạo bảng.',
          };
        }
        if (firstErr?.message?.toLowerCase().includes('api key') || firstErr?.message?.toLowerCase().includes('jwt')) {
          return {
            success: false,
            message: '❌ Lỗi 401 (Unauthorized): Khóa "Anon API Key" không chính xác hoặc đã hết hạn. Vui lòng lấy lại Anon Public Key trong Supabase Settings > API.',
          };
        }
        return {
          success: false,
          message: `Lỗi Supabase (${firstErr?.code || 'Error'}): ${firstErr?.message || 'Không thể truy vấn bảng dữ liệu'}`,
        };
      }

      const totalItems = (vocabRes.data?.length || 0) + (grammarRes.data?.length || 0) + (decksRes.data?.length || 0);

      return {
        success: true,
        message: totalItems > 0 
          ? `Tải thành công ${vocabRes.data?.length || 0} từ vựng, ${grammarRes.data?.length || 0} ngữ pháp từ Supabase Cloud!`
          : 'Kết nối Supabase thành công nhưng chưa có dữ liệu nào trên Cloud (Hãy bấm "Đẩy Dữ Liệu Lên Cloud" từ trình duyệt đã có từ vựng trước).',
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
   * Delete vocabulary item(s) from Supabase
   */
  public static async deleteVocabulary(
    wordIds: string | string[]
  ): Promise<{ success: boolean; message: string }> {
    const client = this.getClient();
    const ids = Array.isArray(wordIds) ? wordIds : [wordIds];
    if (!client || ids.length === 0) {
      return { success: true, message: 'Không có từ cần xóa' };
    }

    try {
      for (let i = 0; i < ids.length; i += 100) {
        const chunk = ids.slice(i, i + 100);
        const { error } = await client.from('vocabulary').delete().in('word_id', chunk);
        if (error) throw error;
      }
      return { success: true, message: `Đã xóa ${ids.length} từ khỏi Supabase Cloud thành công` };
    } catch (err: any) {
      console.error('Lỗi khi xóa từ vựng khỏi Supabase:', err);
      return { success: false, message: err?.message || String(err) };
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
   * Delete grammar item(s) from Supabase
   */
  public static async deleteGrammar(
    grammarIds: string | string[]
  ): Promise<{ success: boolean; message: string }> {
    const client = this.getClient();
    const ids = Array.isArray(grammarIds) ? grammarIds : [grammarIds];
    if (!client || ids.length === 0) {
      return { success: true, message: 'Không có ngữ pháp cần xóa' };
    }

    try {
      for (let i = 0; i < ids.length; i += 100) {
        const chunk = ids.slice(i, i + 100);
        const { error } = await client.from('grammar').delete().in('grammar_id', chunk);
        if (error) throw error;
      }
      return { success: true, message: `Đã xóa ${ids.length} ngữ pháp khỏi Supabase Cloud` };
    } catch (err: any) {
      console.error('Lỗi khi xóa ngữ pháp khỏi Supabase:', err);
      return { success: false, message: err?.message || String(err) };
    }
  }

  /**
   * Delete specific decks by their deck_id list from Supabase Cloud
   */
  public static async deleteDecks(deckIds: string[]): Promise<{ success: boolean; message: string }> {
    const client = this.getClient();
    if (!client || !deckIds || deckIds.length === 0) {
      return { success: true, message: 'Không có bộ thẻ cần xóa' };
    }

    try {
      for (let i = 0; i < deckIds.length; i += 100) {
        const chunk = deckIds.slice(i, i + 100);
        const { error } = await client.from('decks').delete().in('deck_id', chunk);
        if (error) throw error;
      }
      return { success: true, message: `Đã xóa ${deckIds.length} bộ thẻ khỏi Supabase Cloud` };
    } catch (err: any) {
      console.error('Lỗi khi xóa bộ thẻ khỏi Supabase:', err);
      return { success: false, message: err?.message || String(err) };
    }
  }

  /**
   * Delete / Wipe all application data currently stored in Supabase Cloud
   */
  public static async clearAllCloudData(): Promise<{ success: boolean; message: string }> {
    const client = this.getClient();
    if (!client) {
      return { success: false, message: 'Chưa cấu hình Supabase URL & Anon Key.' };
    }

    const tables = [
      { name: 'vocabulary', pk: 'word_id' },
      { name: 'grammar', pk: 'grammar_id' },
      { name: 'decks', pk: 'deck_id' },
      { name: 'user_profiles', pk: 'user_id' },
      { name: 'review_sessions', pk: 'session_id' },
      { name: 'mock_test_records', pk: 'test_id' },
      { name: 'progress_records', pk: 'id' },
      { name: 'journal_entries', pk: 'entry_id' },
      { name: 'chat_conversations', pk: 'chat_id' },
      { name: 'notifications', pk: 'noti_id' },
    ];

    try {
      for (const t of tables) {
        await client.from(t.name).delete().neq(t.pk, '___nonexistent_id_for_delete_all___');
      }
      return {
        success: true,
        message: 'Đã dọn dẹp và xóa sạch toàn bộ dữ liệu học tập trên Supabase Cloud thành công!',
      };
    } catch (err: any) {
      return {
        success: false,
        message: `Lỗi khi xóa dữ liệu Supabase: ${err.message || err}`,
      };
    }
  }
}
