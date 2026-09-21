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
import {
  enqueueSyncTask,
  getSyncQueue,
  dequeueSyncTask,
  updateSyncTask,
  getSyncQueueCount,
  SyncQueueItem,
} from '../utils/idbStorage';

export interface SupabaseConfig {
  url: string;
  anonKey: string;
  autoSync: boolean;
}

export interface FailedChunk {
  table: string;
  chunkIndex: number;
  itemCount: number;
  errorCode?: string;
  errorMessage: string;
  items: any[];
  retryCount: number;
}

export const DEFAULT_SUPABASE_URL = 'https://fzdxabrvddjtpnbjvcii.supabase.co';

const STORAGE_KEY = 'hoc_hanh_lam_supabase_config';

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export class SupabaseService {
  private static client: SupabaseClient | null = null;

  public static cleanKey(key: string): string {
    if (!key || typeof key !== 'string') return '';
    return key.replace(/['"\r\n\t ]/g, '').trim();
  }

  public static normalizeUrl(url: string): string {
    if (!url || typeof url !== 'string') return DEFAULT_SUPABASE_URL;
    let trimmed = url.replace(/['"\r\n\t ]/g, '').trim();
    if (!trimmed) return DEFAULT_SUPABASE_URL;
    if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
      trimmed = 'https://' + trimmed;
    }
    return trimmed.replace(/\/+$/, '');
  }

  public static getConfig(): SupabaseConfig {
    // 1. Check localStorage if available in browser
    if (typeof window !== 'undefined' && window.localStorage) {
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
    }

    // 2. Fallback to Vite / Next.js / Process environment variables
    let envUrl = '';
    let envKey = '';

    try {
      if (typeof import.meta !== 'undefined' && import.meta.env) {
        envUrl =
          import.meta.env.VITE_SUPABASE_URL ||
          (import.meta.env as any).NEXT_PUBLIC_SUPABASE_URL ||
          (import.meta.env as any).SUPABASE_URL ||
          '';
        envKey =
          import.meta.env.VITE_SUPABASE_ANON_KEY ||
          (import.meta.env as any).NEXT_PUBLIC_SUPABASE_ANON_KEY ||
          (import.meta.env as any).SUPABASE_ANON_KEY ||
          '';
      }
    } catch {
      // Ignore
    }

    if (!envUrl && typeof process !== 'undefined' && process.env) {
      envUrl =
        process.env.NEXT_PUBLIC_SUPABASE_URL ||
        process.env.VITE_SUPABASE_URL ||
        process.env.SUPABASE_URL ||
        '';
      envKey =
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
        process.env.VITE_SUPABASE_ANON_KEY ||
        process.env.SUPABASE_ANON_KEY ||
        '';
    }

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
      return (
        (parsed.protocol === 'http:' || parsed.protocol === 'https:') &&
        Boolean(parsed.hostname) &&
        parsed.hostname.includes('.')
      );
    } catch {
      return false;
    }
  }

  public static safeCreateClient(url: string, key: string): SupabaseClient | null {
    const normalizedUrl = this.normalizeUrl(url || DEFAULT_SUPABASE_URL);
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
    const normalizedUrl = this.normalizeUrl(config.url);
    const trimmedKey = this.cleanKey(config.anonKey);
    return Boolean(this.isValidUrl(normalizedUrl) && trimmedKey && !trimmedKey.includes('your-anon-key'));
  }

  public static saveConfig(config: SupabaseConfig): void {
    const normalizedConfig = {
      ...config,
      url: this.normalizeUrl(config.url || DEFAULT_SUPABASE_URL),
      anonKey: this.cleanKey(config.anonKey),
    };
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(normalizedConfig));
    }
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
  public static async testConnection(
    customUrl?: string,
    customKey?: string
  ): Promise<{ success: boolean; message: string }> {
    const config = this.getConfig();
    const rawUrl = customUrl !== undefined ? customUrl : config.url;
    const rawKey = customKey !== undefined ? customKey : config.anonKey;

    const url = this.normalizeUrl(rawUrl || DEFAULT_SUPABASE_URL);
    const key = this.cleanKey(rawKey);

    if (!url || !key) {
      return { success: false, message: 'Vui lòng nhập đầy đủ Supabase Anon Key để kết nối.' };
    }

    if (!this.isValidUrl(url)) {
      return { success: false, message: 'Supabase URL không hợp lệ. Vui lòng kiểm tra lại URL dự án.' };
    }

    if (key.length < 30) {
      return {
        success: false,
        message:
          'Khóa Anon Key không hợp lệ hoặc quá ngắn. Anon Key của Supabase là chuỗi JWT dài (bắt đầu bằng "eyJ..."). Vui lòng kiểm tra lại.',
      };
    }

    const tempClient = this.safeCreateClient(url, key);
    if (!tempClient) {
      return {
        success: false,
        message: 'Không thể khởi tạo Supabase Client với thông tin URL và Key đã cung cấp.',
      };
    }

    try {
      const { error, status } = await tempClient.from('vocabulary').select('word_id').limit(1);

      if (error) {
        if (
          status === 401 ||
          error.message?.toLowerCase().includes('api key') ||
          error.message?.toLowerCase().includes('jwt')
        ) {
          return {
            success: false,
            message:
              '❌ Lỗi 401 (Unauthorized): Khóa "Anon API Key" không chính xác hoặc đã bị làm mới trong Supabase. Vui lòng vào Supabase Dashboard > Settings > API và copy lại khóa "anon public" (bắt đầu bằng eyJ...).',
          };
        }
        if (error.code === '42501' || error.message?.toLowerCase().includes('permission denied')) {
          return {
            success: false,
            message:
              '🔒 Lỗi 42501 (Permission Denied): Bảng chưa cấp quyền truy cập hoặc chính sách RLS đang chặn. Vui lòng cập nhật quyền tối thiểu và chính sách RLS trong SQL Editor.',
          };
        }
        if (error.code === '42P01') {
          return {
            success: false,
            message:
              '⚠️ Kết nối Supabase thành công nhưng chưa tạo Bảng (Tables). Vui lòng vào SQL Editor trên Supabase và bấm Run đoạn mã SQL tạo bảng bên dưới.',
          };
        }
        return {
          success: false,
          message: `Lỗi kết nối Supabase (${status || error.code || 'Error'}): ${error.message}`,
        };
      }

      return {
        success: true,
        message: '✅ Kết nối Supabase thành công và đã nhận diện được cấu trúc cơ sở dữ liệu!',
      };
    } catch (err: any) {
      return { success: false, message: `Không thể kết nối Supabase: ${err.message || err}` };
    }
  }

  /**
   * Helper: Paginated query fetcher to bypass PostgREST 1000-row limit
   */
  public static async fetchAllRows<T = any>(
    client: SupabaseClient,
    tableName: string,
    batchSize = 1000
  ): Promise<{ data: T[]; error: any }> {
    const allRows: T[] = [];
    let from = 0;
    let hasMore = true;

    while (hasMore) {
      const to = from + batchSize - 1;
      const { data, error } = await client.from(tableName).select('*').range(from, to);

      if (error) {
        return { data: allRows, error };
      }

      if (data && data.length > 0) {
        allRows.push(...(data as T[]));
        if (data.length < batchSize) {
          hasMore = false;
        } else {
          from += batchSize;
        }
      } else {
        hasMore = false;
      }
    }

    return { data: allRows, error: null };
  }

  /**
   * Run Chunked Batch Upsert with Exponential Backoff Retry (Max 3 attempts, 500ms * attempt)
   */
  public static async runBatchUpsertWithRetry(
    client: SupabaseClient,
    tableName: string,
    items: any[],
    onConflict: string,
    chunkSize = 100,
    maxRetries = 3
  ): Promise<{ success: boolean; failedChunks: FailedChunk[] }> {
    if (!items || items.length === 0) return { success: true, failedChunks: [] };
    const failedChunks: FailedChunk[] = [];

    for (let i = 0; i < items.length; i += chunkSize) {
      const chunk = items.slice(i, i + chunkSize);
      const chunkIndex = Math.floor(i / chunkSize);
      let isChunkSuccess = false;
      let lastError: any = null;
      let attemptsCount = 0;

      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        attemptsCount = attempt;
        const { error } = await client.from(tableName).upsert(chunk, { onConflict });
        if (!error) {
          isChunkSuccess = true;
          break;
        }
        lastError = error;
        if (attempt < maxRetries) {
          // Delay: 500ms * attempt (500ms, 1000ms, 1500ms)
          await delay(500 * attempt);
        }
      }

      if (!isChunkSuccess && lastError) {
        failedChunks.push({
          table: tableName,
          chunkIndex,
          itemCount: chunk.length,
          errorCode: lastError.code,
          errorMessage: lastError.message || String(lastError),
          items: chunk,
          retryCount: attemptsCount,
        });
      }
    }

    return {
      success: failedChunks.length === 0,
      failedChunks,
    };
  }

  /**
   * Upload / Push entire local app data into Supabase (Chunked, Retried & Resilient)
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
  }): Promise<{ success: boolean; message: string; failedChunks?: FailedChunk[] }> {
    const client = this.getClient();
    if (!client) {
      return {
        success: false,
        message: 'Chưa cấu hình Supabase Anon Key. Vui lòng nhập Anon Key trong Cài đặt Supabase.',
      };
    }

    const allFailedChunks: FailedChunk[] = [];

    try {
      // 1. Vocabulary (Chunked 100 with retry)
      if (payload.vocabulary && payload.vocabulary.length > 0) {
        const cleanVocab = payload.vocabulary.map((v) => ({
          ...v,
          last_reviewed: v.last_reviewed ? v.last_reviewed : null,
          srs_next_review: v.srs_next_review || new Date().toISOString(),
          created_at: v.created_at || new Date().toISOString(),
        }));
        const res = await this.runBatchUpsertWithRetry(client, 'vocabulary', cleanVocab, 'word_id', 100, 3);
        if (!res.success) allFailedChunks.push(...res.failedChunks);
      }

      // 2. Grammar (Chunked 100 with retry)
      if (payload.grammar && payload.grammar.length > 0) {
        const res = await this.runBatchUpsertWithRetry(client, 'grammar', payload.grammar, 'grammar_id', 100, 3);
        if (!res.success) allFailedChunks.push(...res.failedChunks);
      }

      // 3. Decks
      if (payload.decks && payload.decks.length > 0) {
        const res = await this.runBatchUpsertWithRetry(client, 'decks', payload.decks, 'deck_id', 100, 3);
        if (!res.success) allFailedChunks.push(...res.failedChunks);
      }

      // 4. User profile
      if (payload.userProfile) {
        const cleanProfile = {
          ...payload.userProfile,
          ngay_tham_gia: payload.userProfile.ngay_tham_gia || new Date().toISOString(),
          last_active_date: payload.userProfile.last_active_date || new Date().toISOString().split('T')[0],
        };
        const { error } = await client.from('user_profiles').upsert([cleanProfile], { onConflict: 'user_id' });
        if (error) {
          allFailedChunks.push({
            table: 'user_profiles',
            chunkIndex: 0,
            itemCount: 1,
            errorCode: error.code,
            errorMessage: error.message,
            items: [cleanProfile],
            retryCount: 1,
          });
        }
      }

      // 5. Review Sessions
      if (payload.reviewSessions && payload.reviewSessions.length > 0) {
        const cleanSessions = payload.reviewSessions.map((s) => ({
          ...s,
          thoi_gian_bat_dau: s.thoi_gian_bat_dau || new Date().toISOString(),
          thoi_gian_ket_thuc: s.thoi_gian_ket_thuc || new Date().toISOString(),
        }));
        const res = await this.runBatchUpsertWithRetry(client, 'review_sessions', cleanSessions, 'session_id', 100, 3);
        if (!res.success) allFailedChunks.push(...res.failedChunks);
      }

      // 6. Mock tests
      if (payload.mockTests && payload.mockTests.length > 0) {
        const cleanTests = payload.mockTests.map((t) => ({
          ...t,
          ngay_lam: t.ngay_lam || new Date().toISOString(),
        }));
        const res = await this.runBatchUpsertWithRetry(client, 'mock_test_records', cleanTests, 'test_id', 100, 3);
        if (!res.success) allFailedChunks.push(...res.failedChunks);
      }

      // 7. Progress records
      if (payload.progressRecords && payload.progressRecords.length > 0) {
        const mappedProgress = payload.progressRecords.map((r) => ({
          id: `${r.user_id}_${r.ngon_ngu}_${r.ngay}`,
          ...r,
          ngay: r.ngay || new Date().toISOString().split('T')[0],
        }));
        const res = await this.runBatchUpsertWithRetry(client, 'progress_records', mappedProgress, 'id', 100, 3);
        if (!res.success) allFailedChunks.push(...res.failedChunks);
      }

      // 8. Journal entries
      if (payload.journalEntries && payload.journalEntries.length > 0) {
        const cleanJournal = payload.journalEntries.map((j) => ({
          ...j,
          ngay: j.ngay || new Date().toISOString(),
        }));
        const res = await this.runBatchUpsertWithRetry(client, 'journal_entries', cleanJournal, 'entry_id', 100, 3);
        if (!res.success) allFailedChunks.push(...res.failedChunks);
      }

      // 9. Chat conversations
      if (payload.chatConversations && payload.chatConversations.length > 0) {
        const res = await this.runBatchUpsertWithRetry(client, 'chat_conversations', payload.chatConversations, 'chat_id', 50, 3);
        if (!res.success) allFailedChunks.push(...res.failedChunks);
      }

      // 10. Notifications
      if (payload.notifications && payload.notifications.length > 0) {
        const cleanNoti = payload.notifications.map((n) => ({
          ...n,
          thoi_gian: n.thoi_gian || new Date().toISOString(),
        }));
        const res = await this.runBatchUpsertWithRetry(client, 'notifications', cleanNoti, 'noti_id', 100, 3);
        if (!res.success) allFailedChunks.push(...res.failedChunks);
      }

      if (allFailedChunks.length > 0) {
        const firstErr = allFailedChunks[0];
        return {
          success: false,
          message: `Có ${allFailedChunks.length} khối dữ liệu không thể đồng bộ sau 3 lần thử (Bảng ${firstErr.table}: ${firstErr.errorMessage})`,
          failedChunks: allFailedChunks,
        };
      }

      return {
        success: true,
        message: `Đã đồng bộ thành công ${payload.vocabulary?.length || 0} từ vựng, ${payload.grammar?.length || 0} ngữ pháp lên Supabase Cloud (${DEFAULT_SUPABASE_URL})!`,
      };
    } catch (err: any) {
      console.error('Supabase Push Error:', err);
      return {
        success: false,
        message: `Lỗi đồng bộ Supabase: ${err?.message || err}`,
        failedChunks: allFailedChunks,
      };
    }
  }

  /**
   * Pull / Fetch all data from Supabase into application (Paginated & Full Dataset)
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
      return {
        success: false,
        message: 'Chưa cấu hình Supabase Anon Key. Vui lòng nhập Anon Key trong Cài đặt Supabase.',
      };
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
        this.fetchAllRows<VocabularyItem>(client, 'vocabulary'),
        this.fetchAllRows<Deck>(client, 'decks'),
        this.fetchAllRows<GrammarItem>(client, 'grammar'),
        this.fetchAllRows<ReviewSession>(client, 'review_sessions'),
        this.fetchAllRows<MockTestRecord>(client, 'mock_test_records'),
        this.fetchAllRows<ProgressRecord>(client, 'progress_records'),
        this.fetchAllRows<JournalEntry>(client, 'journal_entries'),
        this.fetchAllRows<ChatConversation>(client, 'chat_conversations'),
        this.fetchAllRows<NotificationItem>(client, 'notifications'),
      ]);

      // Check critical vocabulary / grammar permissions
      if (vocabRes.error) {
        if (
          vocabRes.error.code === '42501' ||
          vocabRes.error.message?.toLowerCase().includes('permission denied')
        ) {
          return {
            success: false,
            message:
              '🔒 Lỗi 42501 (Permission Denied): Bảng chưa cấp quyền truy cập cho role anon hoặc RLS bị chặn. Vui lòng kiểm tra lại quyền trong SQL Editor.',
          };
        }
        if (vocabRes.error.code === '42P01') {
          return {
            success: false,
            message:
              '⚠️ Bảng "vocabulary" chưa được tạo trên Supabase. Vui lòng vào SQL Editor trên Supabase và bấm Run đoạn mã SQL tạo bảng.',
          };
        }
        if (
          vocabRes.error.message?.toLowerCase().includes('api key') ||
          vocabRes.error.message?.toLowerCase().includes('jwt')
        ) {
          return {
            success: false,
            message:
              '❌ Lỗi 401 (Unauthorized): Khóa "Anon API Key" không chính xác hoặc đã hết hạn. Vui lòng lấy lại Anon Public Key trong Supabase Settings > API.',
          };
        }
        return {
          success: false,
          message: `Lỗi truy vấn bảng từ vựng: ${vocabRes.error.message}`,
        };
      }

      const totalItems =
        (vocabRes.data?.length || 0) + (grammarRes.data?.length || 0) + (decksRes.data?.length || 0);

      return {
        success: true,
        message:
          totalItems > 0
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
   * Drain / Process Offline Sync Queue
   */
  public static async drainSyncQueue(): Promise<{
    processed: number;
    succeeded: number;
    failed: number;
    remaining: number;
    errors: string[];
  }> {
    const client = this.getClient();
    if (!client) {
      const count = await getSyncQueueCount();
      return {
        processed: 0,
        succeeded: 0,
        failed: 0,
        remaining: count,
        errors: ['Supabase chưa được cấu hình'],
      };
    }

    const queue = await getSyncQueue();
    if (queue.length === 0) {
      return { processed: 0, succeeded: 0, failed: 0, remaining: 0, errors: [] };
    }

    let succeeded = 0;
    let failed = 0;
    const errors: string[] = [];

    for (const item of queue) {
      try {
        let error: any = null;
        if (item.type === 'upsert' || item.type === 'batch_upsert') {
          const payload = Array.isArray(item.data) ? item.data : [item.data];
          const res = await client.from(item.table).upsert(payload, {
            onConflict: item.onConflict || undefined,
          });
          error = res.error;
        } else if (item.type === 'delete') {
          const pkField =
            item.table === 'vocabulary'
              ? 'word_id'
              : item.table === 'grammar'
              ? 'grammar_id'
              : 'deck_id';
          const ids = Array.isArray(item.data) ? item.data : [item.data];
          const res = await client.from(item.table).delete().in(pkField, ids);
          error = res.error;
        }

        if (error) {
          failed++;
          item.attempts += 1;
          item.lastError = error.message || String(error);
          await updateSyncTask(item);
          errors.push(`[${item.table}] ${error.message}`);
        } else {
          succeeded++;
          await dequeueSyncTask(item.id);
        }
      } catch (err: any) {
        failed++;
        item.attempts += 1;
        item.lastError = err?.message || String(err);
        await updateSyncTask(item);
        errors.push(`[${item.table}] ${err?.message || err}`);
      }
    }

    const remaining = await getSyncQueueCount();
    return {
      processed: queue.length,
      succeeded,
      failed,
      remaining,
      errors,
    };
  }

  /**
   * Save a single vocabulary item into Supabase (with offline queue fallback)
   */
  public static async saveVocabulary(word: VocabularyItem): Promise<{ success: boolean; error?: string }> {
    const clean = {
      ...word,
      last_reviewed: word.last_reviewed ? word.last_reviewed : null,
      srs_next_review: word.srs_next_review || new Date().toISOString(),
      created_at: word.created_at || new Date().toISOString(),
    };

    const client = this.getClient();
    if (!client) {
      await enqueueSyncTask({
        type: 'upsert',
        table: 'vocabulary',
        data: clean,
        onConflict: 'word_id',
      });
      return { success: false, error: 'Chưa cấu hình Supabase (đã lưu vào hàng đợi offline)' };
    }

    try {
      const { error } = await client.from('vocabulary').upsert([clean], { onConflict: 'word_id' });
      if (error) {
        await enqueueSyncTask({
          type: 'upsert',
          table: 'vocabulary',
          data: clean,
          onConflict: 'word_id',
        });
        return { success: false, error: error.message };
      }
      return { success: true };
    } catch (e: any) {
      await enqueueSyncTask({
        type: 'upsert',
        table: 'vocabulary',
        data: clean,
        onConflict: 'word_id',
      });
      return { success: false, error: e?.message || String(e) };
    }
  }

  /**
   * Save batch vocabulary items into Supabase with retry and offline queue fallback
   */
  public static async saveVocabularyBatch(
    words: VocabularyItem[]
  ): Promise<{ success: boolean; error?: string; count: number; failedChunks?: FailedChunk[] }> {
    if (words.length === 0) return { success: true, count: 0 };
    const cleanVocab = words.map((v) => ({
      ...v,
      last_reviewed: v.last_reviewed ? v.last_reviewed : null,
      srs_next_review: v.srs_next_review || new Date().toISOString(),
      created_at: v.created_at || new Date().toISOString(),
    }));

    const client = this.getClient();
    if (!client) {
      await enqueueSyncTask({
        type: 'batch_upsert',
        table: 'vocabulary',
        data: cleanVocab,
        onConflict: 'word_id',
      });
      return { success: false, error: 'Chưa cấu hình Supabase (đã lưu vào hàng đợi offline)', count: 0 };
    }

    try {
      const res = await this.runBatchUpsertWithRetry(client, 'vocabulary', cleanVocab, 'word_id', 100, 3);
      if (!res.success) {
        for (const chunk of res.failedChunks) {
          await enqueueSyncTask({
            type: 'batch_upsert',
            table: 'vocabulary',
            data: chunk.items,
            onConflict: 'word_id',
          });
        }
        return {
          success: false,
          error: `Thất bại ${res.failedChunks.length} khối (đã chuyển vào hàng đợi offline)`,
          count: words.length - res.failedChunks.reduce((acc, c) => acc + c.itemCount, 0),
          failedChunks: res.failedChunks,
        };
      }
      return { success: true, count: cleanVocab.length };
    } catch (e: any) {
      await enqueueSyncTask({
        type: 'batch_upsert',
        table: 'vocabulary',
        data: cleanVocab,
        onConflict: 'word_id',
      });
      return { success: false, error: e?.message || String(e), count: 0 };
    }
  }

  /**
   * Delete vocabulary item(s) from Supabase
   */
  public static async deleteVocabulary(
    wordIds: string | string[]
  ): Promise<{ success: boolean; message: string }> {
    const ids = Array.isArray(wordIds) ? wordIds : [wordIds];
    if (ids.length === 0) return { success: true, message: 'Không có từ cần xóa' };

    const client = this.getClient();
    if (!client) {
      await enqueueSyncTask({
        type: 'delete',
        table: 'vocabulary',
        data: ids,
      });
      return { success: true, message: 'Đã lưu yêu cầu xóa vào hàng đợi offline' };
    }

    try {
      for (let i = 0; i < ids.length; i += 100) {
        const chunk = ids.slice(i, i + 100);
        const { error } = await client.from('vocabulary').delete().in('word_id', chunk);
        if (error) {
          await enqueueSyncTask({
            type: 'delete',
            table: 'vocabulary',
            data: chunk,
          });
        }
      }
      return { success: true, message: `Đã xóa ${ids.length} từ khỏi Supabase Cloud` };
    } catch (err: any) {
      await enqueueSyncTask({
        type: 'delete',
        table: 'vocabulary',
        data: ids,
      });
      return { success: false, message: err?.message || String(err) };
    }
  }

  /**
   * Save a single grammar item into Supabase
   */
  public static async saveGrammar(grammar: GrammarItem): Promise<{ success: boolean; error?: string }> {
    const client = this.getClient();
    if (!client) {
      await enqueueSyncTask({
        type: 'upsert',
        table: 'grammar',
        data: grammar,
        onConflict: 'grammar_id',
      });
      return { success: false, error: 'Chưa cấu hình Supabase (đã lưu vào hàng đợi offline)' };
    }
    try {
      const { error } = await client.from('grammar').upsert([grammar], { onConflict: 'grammar_id' });
      if (error) {
        await enqueueSyncTask({
          type: 'upsert',
          table: 'grammar',
          data: grammar,
          onConflict: 'grammar_id',
        });
        return { success: false, error: error.message };
      }
      return { success: true };
    } catch (e: any) {
      await enqueueSyncTask({
        type: 'upsert',
        table: 'grammar',
        data: grammar,
        onConflict: 'grammar_id',
      });
      return { success: false, error: e?.message || String(e) };
    }
  }

  /**
   * Save batch grammar items into Supabase
   */
  public static async saveGrammarBatch(
    grammars: GrammarItem[]
  ): Promise<{ success: boolean; error?: string; count: number; failedChunks?: FailedChunk[] }> {
    if (grammars.length === 0) return { success: true, count: 0 };
    const client = this.getClient();
    if (!client) {
      await enqueueSyncTask({
        type: 'batch_upsert',
        table: 'grammar',
        data: grammars,
        onConflict: 'grammar_id',
      });
      return { success: false, error: 'Chưa cấu hình Supabase (đã lưu vào hàng đợi offline)', count: 0 };
    }
    try {
      const res = await this.runBatchUpsertWithRetry(client, 'grammar', grammars, 'grammar_id', 100, 3);
      if (!res.success) {
        for (const chunk of res.failedChunks) {
          await enqueueSyncTask({
            type: 'batch_upsert',
            table: 'grammar',
            data: chunk.items,
            onConflict: 'grammar_id',
          });
        }
        return {
          success: false,
          error: `Thất bại ${res.failedChunks.length} khối (đã lưu vào hàng đợi offline)`,
          count: grammars.length - res.failedChunks.reduce((acc, c) => acc + c.itemCount, 0),
          failedChunks: res.failedChunks,
        };
      }
      return { success: true, count: grammars.length };
    } catch (e: any) {
      await enqueueSyncTask({
        type: 'batch_upsert',
        table: 'grammar',
        data: grammars,
        onConflict: 'grammar_id',
      });
      return { success: false, error: e?.message || String(e), count: 0 };
    }
  }

  /**
   * Delete grammar item(s) from Supabase
   */
  public static async deleteGrammar(
    grammarIds: string | string[]
  ): Promise<{ success: boolean; message: string }> {
    const ids = Array.isArray(grammarIds) ? grammarIds : [grammarIds];
    if (ids.length === 0) return { success: true, message: 'Không có ngữ pháp cần xóa' };

    const client = this.getClient();
    if (!client) {
      await enqueueSyncTask({
        type: 'delete',
        table: 'grammar',
        data: ids,
      });
      return { success: true, message: 'Đã lưu yêu cầu xóa vào hàng đợi offline' };
    }

    try {
      for (let i = 0; i < ids.length; i += 100) {
        const chunk = ids.slice(i, i + 100);
        const { error } = await client.from('grammar').delete().in('grammar_id', chunk);
        if (error) {
          await enqueueSyncTask({
            type: 'delete',
            table: 'grammar',
            data: chunk,
          });
        }
      }
      return { success: true, message: `Đã xóa ${ids.length} ngữ pháp khỏi Supabase Cloud` };
    } catch (err: any) {
      await enqueueSyncTask({
        type: 'delete',
        table: 'grammar',
        data: ids,
      });
      return { success: false, message: err?.message || String(err) };
    }
  }

  /**
   * Save a single deck into Supabase
   */
  public static async saveDeck(deck: Deck): Promise<{ success: boolean; error?: string }> {
    const client = this.getClient();
    if (!client) {
      await enqueueSyncTask({
        type: 'upsert',
        table: 'decks',
        data: deck,
        onConflict: 'deck_id',
      });
      return { success: false, error: 'Chưa cấu hình Supabase (đã lưu vào hàng đợi offline)' };
    }
    try {
      const { error } = await client.from('decks').upsert([deck], { onConflict: 'deck_id' });
      if (error) {
        await enqueueSyncTask({
          type: 'upsert',
          table: 'decks',
          data: deck,
          onConflict: 'deck_id',
        });
        return { success: false, error: error.message };
      }
      return { success: true };
    } catch (e: any) {
      await enqueueSyncTask({
        type: 'upsert',
        table: 'decks',
        data: deck,
        onConflict: 'deck_id',
      });
      return { success: false, error: e?.message || String(e) };
    }
  }

  /**
   * Delete specific decks by their deck_id list from Supabase Cloud
   */
  public static async deleteDecks(deckIds: string[]): Promise<{ success: boolean; message: string }> {
    if (!deckIds || deckIds.length === 0) return { success: true, message: 'Không có bộ thẻ cần xóa' };
    const client = this.getClient();
    if (!client) {
      await enqueueSyncTask({
        type: 'delete',
        table: 'decks',
        data: deckIds,
      });
      return { success: true, message: 'Đã lưu yêu cầu xóa vào hàng đợi offline' };
    }

    try {
      for (let i = 0; i < deckIds.length; i += 100) {
        const chunk = deckIds.slice(i, i + 100);
        const { error } = await client.from('decks').delete().in('deck_id', chunk);
        if (error) {
          await enqueueSyncTask({
            type: 'delete',
            table: 'decks',
            data: chunk,
          });
        }
      }
      return { success: true, message: `Đã xóa ${deckIds.length} bộ thẻ khỏi Supabase Cloud` };
    } catch (err: any) {
      await enqueueSyncTask({
        type: 'delete',
        table: 'decks',
        data: deckIds,
      });
      return { success: false, message: err?.message || String(err) };
    }
  }

  /**
   * Save review session
   */
  public static async saveReviewSession(session: ReviewSession): Promise<{ success: boolean; error?: string }> {
    const clean = {
      ...session,
      thoi_gian_bat_dau: session.thoi_gian_bat_dau || new Date().toISOString(),
      thoi_gian_ket_thuc: session.thoi_gian_ket_thuc || new Date().toISOString(),
    };
    const client = this.getClient();
    if (!client) {
      await enqueueSyncTask({
        type: 'upsert',
        table: 'review_sessions',
        data: clean,
        onConflict: 'session_id',
      });
      return { success: false, error: 'Chưa cấu hình Supabase' };
    }
    try {
      const { error } = await client.from('review_sessions').upsert([clean], { onConflict: 'session_id' });
      if (error) {
        await enqueueSyncTask({
          type: 'upsert',
          table: 'review_sessions',
          data: clean,
          onConflict: 'session_id',
        });
        return { success: false, error: error.message };
      }
      return { success: true };
    } catch (e: any) {
      await enqueueSyncTask({
        type: 'upsert',
        table: 'review_sessions',
        data: clean,
        onConflict: 'session_id',
      });
      return { success: false, error: e?.message || String(e) };
    }
  }

  /**
   * Save mock test record
   */
  public static async saveMockTestRecord(test: MockTestRecord): Promise<{ success: boolean; error?: string }> {
    const clean = {
      ...test,
      ngay_lam: test.ngay_lam || new Date().toISOString(),
    };
    const client = this.getClient();
    if (!client) {
      await enqueueSyncTask({
        type: 'upsert',
        table: 'mock_test_records',
        data: clean,
        onConflict: 'test_id',
      });
      return { success: false, error: 'Chưa cấu hình Supabase' };
    }
    try {
      const { error } = await client.from('mock_test_records').upsert([clean], { onConflict: 'test_id' });
      if (error) {
        await enqueueSyncTask({
          type: 'upsert',
          table: 'mock_test_records',
          data: clean,
          onConflict: 'test_id',
        });
        return { success: false, error: error.message };
      }
      return { success: true };
    } catch (e: any) {
      await enqueueSyncTask({
        type: 'upsert',
        table: 'mock_test_records',
        data: clean,
        onConflict: 'test_id',
      });
      return { success: false, error: e?.message || String(e) };
    }
  }

  /**
   * Save progress record
   */
  public static async saveProgressRecord(record: ProgressRecord): Promise<{ success: boolean; error?: string }> {
    const clean = {
      id: `${record.user_id}_${record.ngon_ngu}_${record.ngay}`,
      ...record,
      ngay: record.ngay || new Date().toISOString().split('T')[0],
    };
    const client = this.getClient();
    if (!client) {
      await enqueueSyncTask({
        type: 'upsert',
        table: 'progress_records',
        data: clean,
        onConflict: 'id',
      });
      return { success: false, error: 'Chưa cấu hình Supabase' };
    }
    try {
      const { error } = await client.from('progress_records').upsert([clean], { onConflict: 'id' });
      if (error) {
        await enqueueSyncTask({
          type: 'upsert',
          table: 'progress_records',
          data: clean,
          onConflict: 'id',
        });
        return { success: false, error: error.message };
      }
      return { success: true };
    } catch (e: any) {
      await enqueueSyncTask({
        type: 'upsert',
        table: 'progress_records',
        data: clean,
        onConflict: 'id',
      });
      return { success: false, error: e?.message || String(e) };
    }
  }

  /**
   * Save journal entry
   */
  public static async saveJournalEntry(entry: JournalEntry): Promise<{ success: boolean; error?: string }> {
    const clean = {
      ...entry,
      ngay: entry.ngay || new Date().toISOString(),
    };
    const client = this.getClient();
    if (!client) {
      await enqueueSyncTask({
        type: 'upsert',
        table: 'journal_entries',
        data: clean,
        onConflict: 'entry_id',
      });
      return { success: false, error: 'Chưa cấu hình Supabase' };
    }
    try {
      const { error } = await client.from('journal_entries').upsert([clean], { onConflict: 'entry_id' });
      if (error) {
        await enqueueSyncTask({
          type: 'upsert',
          table: 'journal_entries',
          data: clean,
          onConflict: 'entry_id',
        });
        return { success: false, error: error.message };
      }
      return { success: true };
    } catch (e: any) {
      await enqueueSyncTask({
        type: 'upsert',
        table: 'journal_entries',
        data: clean,
        onConflict: 'entry_id',
      });
      return { success: false, error: e?.message || String(e) };
    }
  }

  /**
   * Save chat conversation
   */
  public static async saveChatConversation(conv: ChatConversation): Promise<{ success: boolean; error?: string }> {
    const client = this.getClient();
    if (!client) {
      await enqueueSyncTask({
        type: 'upsert',
        table: 'chat_conversations',
        data: conv,
        onConflict: 'chat_id',
      });
      return { success: false, error: 'Chưa cấu hình Supabase' };
    }
    try {
      const { error } = await client.from('chat_conversations').upsert([conv], { onConflict: 'chat_id' });
      if (error) {
        await enqueueSyncTask({
          type: 'upsert',
          table: 'chat_conversations',
          data: conv,
          onConflict: 'chat_id',
        });
        return { success: false, error: error.message };
      }
      return { success: true };
    } catch (e: any) {
      await enqueueSyncTask({
        type: 'upsert',
        table: 'chat_conversations',
        data: conv,
        onConflict: 'chat_id',
      });
      return { success: false, error: e?.message || String(e) };
    }
  }

  /**
   * Save user profile
   */
  public static async saveUserProfile(profile: UserProfile): Promise<{ success: boolean; error?: string }> {
    const clean = {
      ...profile,
      ngay_tham_gia: profile.ngay_tham_gia || new Date().toISOString(),
      last_active_date: profile.last_active_date || new Date().toISOString().split('T')[0],
    };
    const client = this.getClient();
    if (!client) {
      await enqueueSyncTask({
        type: 'upsert',
        table: 'user_profiles',
        data: clean,
        onConflict: 'user_id',
      });
      return { success: false, error: 'Chưa cấu hình Supabase' };
    }
    try {
      const { error } = await client.from('user_profiles').upsert([clean], { onConflict: 'user_id' });
      if (error) {
        await enqueueSyncTask({
          type: 'upsert',
          table: 'user_profiles',
          data: clean,
          onConflict: 'user_id',
        });
        return { success: false, error: error.message };
      }
      return { success: true };
    } catch (e: any) {
      await enqueueSyncTask({
        type: 'upsert',
        table: 'user_profiles',
        data: clean,
        onConflict: 'user_id',
      });
      return { success: false, error: e?.message || String(e) };
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

