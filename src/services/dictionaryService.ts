import { DictionaryResult, DictionaryHistoryItem, LanguageCode } from '../types';

const HISTORY_KEY = 'hochanhlam_dictionary_history_v3';
const CACHE_KEY = 'hochanhlam_dictionary_cache_v3';

// In-memory & Persistent cache for fast repeat lookups
const memoryCache = new Map<string, DictionaryResult>();

function loadPersistentCache() {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        parsed.forEach(([key, val]) => memoryCache.set(key, val));
      }
    }
  } catch (_) {}
}

loadPersistentCache();

function savePersistentCache() {
  try {
    const entries = Array.from(memoryCache.entries()).slice(-100);
    localStorage.setItem(CACHE_KEY, JSON.stringify(entries));
  } catch (_) {}
}

function getCacheKey(query: string, language: LanguageCode): string {
  return `${language}:${query.trim().toLowerCase()}`;
}

export async function lookupDictionaryApi(
  query: string,
  language: LanguageCode,
  mode: 'auto' | 'target_to_vi' | 'vi_to_target' = 'auto',
  forceRefresh = false
): Promise<DictionaryResult> {
  const cacheKey = getCacheKey(query, language);
  if (!forceRefresh && memoryCache.has(cacheKey)) {
    const cached = memoryCache.get(cacheKey)!;
    return {
      ...cached,
      fromCache: true,
    };
  }

  // Resilient fetch with retries & timeout
  const maxAttempts = 2;
  let lastError: any = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 25000); // 25s timeout

    try {
      const response = await fetch('/api/gemini/dictionary-lookup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, language, mode, forceRefresh }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const msg = errorData.error || `Lỗi kết nối từ điển (${response.status})`;
        throw new Error(msg);
      }

      const result: DictionaryResult = await response.json();
      if (result && result.found) {
        memoryCache.set(cacheKey, result);
        // Also cache by resulting word
        if (result.word) {
          memoryCache.set(getCacheKey(result.word, language), result);
        }
        savePersistentCache();
      }

      return result;
    } catch (err: any) {
      clearTimeout(timeoutId);
      lastError = err;

      // If aborted by timeout
      if (err?.name === 'AbortError') {
        lastError = new Error('Quá trình tra cứu mất quá nhiều thời gian. Vui lòng bấm thử lại!');
      }

      // If network fetch failed (e.g. TypeError: Failed to fetch)
      if (err?.message?.includes('Failed to fetch') || err?.message?.includes('NetworkError') || err?.name === 'TypeError') {
        lastError = new Error('Không thể kết nối đến máy chủ từ điển. Đang thử kết nối lại...');
      }

      // If this is the first attempt, wait briefly and retry
      if (attempt < maxAttempts) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }
  }

  // If all attempts failed, check if we have any cached partial result
  if (memoryCache.has(cacheKey)) {
    return {
      ...memoryCache.get(cacheKey)!,
      fromCache: true,
    };
  }

  // Throw clear friendly error
  const finalMessage = lastError?.message || 'Không thể tra từ điển lúc này. Vui lòng thử lại sau ít giây!';
  throw new Error(
    finalMessage.includes('Failed to fetch')
      ? 'Không thể kết nối đến máy chủ từ điển. Vui lòng kiểm tra đường truyền mạng hoặc thử lại!'
      : finalMessage
  );
}

export function getDictionaryHistory(): DictionaryHistoryItem[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to load dictionary history:', e);
    return [];
  }
}

export function saveDictionaryHistory(item: Omit<DictionaryHistoryItem, 'id' | 'timestamp'>): DictionaryHistoryItem[] {
  try {
    const current = getDictionaryHistory();
    const filtered = current.filter(
      (h) => !(h.language === item.language && h.query.toLowerCase() === item.query.toLowerCase())
    );

    const newItem: DictionaryHistoryItem = {
      ...item,
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
    };

    const updated = [newItem, ...filtered].slice(0, 50); // Keep last 50
    localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
    return updated;
  } catch (e) {
    console.error('Failed to save dictionary history:', e);
    return [];
  }
}

export function toggleStarHistoryItem(id: string): DictionaryHistoryItem[] {
  try {
    const current = getDictionaryHistory();
    const updated = current.map((item) =>
      item.id === id ? { ...item, isStarred: !item.isStarred } : item
    );
    localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
    return updated;
  } catch (e) {
    console.error('Failed to toggle star:', e);
    return [];
  }
}

export function removeHistoryItem(id: string): DictionaryHistoryItem[] {
  try {
    const current = getDictionaryHistory();
    const updated = current.filter((item) => item.id !== id);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
    return updated;
  } catch (e) {
    console.error('Failed to remove history item:', e);
    return [];
  }
}

export function clearDictionaryHistory(): void {
  try {
    localStorage.removeItem(HISTORY_KEY);
  } catch (e) {
    console.error('Failed to clear dictionary history:', e);
  }
}
