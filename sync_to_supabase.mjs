// -*- coding: utf-8 -*-
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://fzdxabrvddjtpnbjvcii.supabase.co';
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_KEY) {
  console.error('ERROR: Missing VITE_SUPABASE_ANON_KEY in environment!');
  process.exit(1);
}

const client = createClient(SUPABASE_URL, SUPABASE_KEY);

async function run() {
  console.log('Connecting to Supabase at:', SUPABASE_URL);

  // 1. Load the 400 TOPIK words
  const rawTopik = fs.readFileSync('src/data/koreanTopikVocabData.json', 'utf-8');
  const topikList = JSON.parse(rawTopik);
  console.log(`Loaded ${topikList.length} TOPIK words to process.`);

  // 2. Fetch all existing Korean words from Supabase table 'vocabulary'
  console.log('Fetching existing Korean words from Supabase...');
  let allKoWords = [];
  let from = 0;
  const pageSize = 1000;
  while (true) {
    const { data, error } = await client
      .from('vocabulary')
      .select('*')
      .eq('ngon_ngu', 'ko')
      .range(from, from + pageSize - 1);

    if (error) {
      console.error('Error fetching Korean words:', error);
      process.exit(1);
    }
    if (!data || data.length === 0) break;
    allKoWords.push(...data);
    if (data.length < pageSize) break;
    from += pageSize;
  }
  console.log(`Retrieved ${allKoWords.length} existing Korean words from Supabase.`);

  // Map by canonical Hangul
  const existingMap = new Map();
  allKoWords.forEach((w) => {
    const key = (w.tu || '').trim().toLowerCase();
    if (key) {
      existingMap.set(key, w);
    }
  });

  const nowIso = new Date().toISOString();
  const wordsToUpsert = [];
  const wordsToInsert = [];
  const finalTopikWordIds = [];

  let matchedCount = 0;
  let newCount = 0;

  for (let i = 0; i < topikList.length; i++) {
    const item = topikList[i];
    const key = (item.tu || '').trim().toLowerCase();

    if (existingMap.has(key)) {
      matchedCount++;
      const existing = existingMap.get(key);
      const wordId = existing.word_id;
      finalTopikWordIds.push(wordId);

      // Preserve existing ratings/history while marking for Flashcards & setting 'Ôn thi topik'
      const updatedWord = {
        ...existing,
        bai_hoc: 'Ôn thi topik',
        is_starred: true,
        is_added_today_flashcard: true,
        added_to_today_flashcard_at: nowIso,
        // Fill in missing details if needed
        phien_am: existing.phien_am || item.phien_am || '',
        loai_tu: existing.loai_tu && existing.loai_tu !== 'Từ vựng' ? existing.loai_tu : (item.loai_tu || 'Từ vựng'),
        vi_du: (existing.vi_du && existing.vi_du.length > 5) ? existing.vi_du : (item.vi_du || ''),
        vi_du_dich: (existing.vi_du_dich && existing.vi_du_dich.length > 3) ? existing.vi_du_dich : (item.vi_du_dich || ''),
        chu_de: existing.chu_de && existing.chu_de !== 'Tổng hợp' ? existing.chu_de : (item.chu_de || 'Tổng hợp'),
        cap_do: existing.cap_do || 'TOPIK 1 (Sơ cấp 1)',
      };
      wordsToUpsert.push(updatedWord);
    } else {
      newCount++;
      const newWordId = item.word_id || `w_topik_${(i + 1).toString().padStart(3, '0')}`;
      finalTopikWordIds.push(newWordId);

      const newWord = {
        word_id: newWordId,
        user_id: 'shared',
        tu: (item.tu || '').trim(),
        nghia: (item.nghia || '').trim(),
        phien_am: item.phien_am || '',
        loai_tu: item.loai_tu || 'Từ vựng',
        vi_du: item.vi_du || '',
        vi_du_dich: item.vi_du_dich || '',
        nghia_tieng_han: '',
        nghia_tieng_anh: '',
        phien_am_tieng_han: '',
        ngon_ngu: 'ko',
        chu_de: item.chu_de || 'Tổng hợp',
        cap_do: 'TOPIK 1 (Sơ cấp 1)',
        bai_hoc: 'Ôn thi topik',
        nguon_goc: 'TOPIK I 400 Từ vựng Ưu Tiên',
        srs_box: 0,
        srs_next_review: nowIso,
        srs_interval: 0,
        srs_ease: 2.5,
        times_reviewed: 0,
        times_correct: 0,
        last_reviewed: null,
        retention_level: 'chua_danh_gia',
        is_added_today_flashcard: true,
        is_starred: true,
        added_to_today_flashcard_at: nowIso,
        created_at: nowIso,
      };
      wordsToInsert.push(newWord);
    }
  }

  console.log(`Matched existing in Supabase: ${matchedCount}`);
  console.log(`New words to insert into Supabase: ${newCount}`);

  // 3. Batch insert new words (chunks of 50)
  if (wordsToInsert.length > 0) {
    console.log(`Inserting ${wordsToInsert.length} new words in chunks...`);
    const chunkSize = 50;
    for (let i = 0; i < wordsToInsert.length; i += chunkSize) {
      const chunk = wordsToInsert.slice(i, i + chunkSize);
      const { error } = await client.from('vocabulary').insert(chunk);
      if (error) {
        console.error(`Error inserting chunk ${i / chunkSize}:`, error);
        throw error;
      }
      console.log(`  Inserted ${Math.min(i + chunkSize, wordsToInsert.length)}/${wordsToInsert.length}`);
    }
  }

  // 4. Batch upsert updated existing words (chunks of 50)
  if (wordsToUpsert.length > 0) {
    console.log(`Updating ${wordsToUpsert.length} existing words in chunks...`);
    const chunkSize = 50;
    for (let i = 0; i < wordsToUpsert.length; i += chunkSize) {
      const chunk = wordsToUpsert.slice(i, i + chunkSize);
      const { error } = await client.from('vocabulary').upsert(chunk, { onConflict: 'word_id' });
      if (error) {
        console.error(`Error updating chunk ${i / chunkSize}:`, error);
        throw error;
      }
      console.log(`  Updated ${Math.min(i + chunkSize, wordsToUpsert.length)}/${wordsToUpsert.length}`);
    }
  }

  // 5. Upsert Deck 'Ôn thi topik' in Supabase table 'decks'
  console.log(`Upserting Deck 'Ôn thi topik' with ${finalTopikWordIds.length} cards...`);
  const deckPayload = {
    deck_id: 'deck_topik_1_400',
    user_id: 'shared',
    ten_bo: 'Ôn thi topik',
    ten_deck: 'Ôn thi topik',
    ngon_ngu: 'ko',
    mo_ta: '400 từ vựng TOPIK I ưu tiên học hàng đầu (kèm đánh dấu Flashcard)',
    nguoi_tao: 'Hệ thống',
    danh_sach_word_id: finalTopikWordIds,
    che_do_chia_se: 'shared',
    color: 'from-amber-500 to-orange-600',
    icon: '🎯',
    created_at: nowIso,
  };

  const { error: deckErr } = await client.from('decks').upsert([deckPayload], { onConflict: 'deck_id' });
  if (deckErr) {
    console.warn('Note: Could not upsert deck in Supabase decks table:', deckErr.message);
  } else {
    console.log('Deck successfully upserted into Supabase!');
  }

  // 6. Verify in Supabase
  console.log('\n--- VERIFYING SUPABASE STATE ---');
  const { count: topikCount, error: vErr } = await client
    .from('vocabulary')
    .select('word_id', { count: 'exact', head: true })
    .eq('bai_hoc', 'Ôn thi topik');
  if (vErr) console.error('Verification error:', vErr);
  else console.log(`Total words with bai_hoc = 'Ôn thi topik' in Supabase: ${topikCount}`);

  const { count: starredCount } = await client
    .from('vocabulary')
    .select('word_id', { count: 'exact', head: true })
    .eq('bai_hoc', 'Ôn thi topik')
    .eq('is_starred', true)
    .eq('is_added_today_flashcard', true);
  console.log(`Total marked/starred TOPIK words in Supabase: ${starredCount}`);

  const { data: deckCheck } = await client
    .from('decks')
    .select('deck_id, ten_bo, danh_sach_word_id')
    .eq('deck_id', 'deck_topik_1_400')
    .single();
  if (deckCheck) {
    console.log(`Deck '${deckCheck.ten_bo}' confirmed with ${deckCheck.danh_sach_word_id?.length} word IDs.`);
  }

  console.log('--- SUPABASE SYNC COMPLETED SUCCESSFULLY ---');
}

run().catch((err) => {
  console.error('Fatal error during Supabase sync:', err);
  process.exit(1);
});
