import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { FULL_ENGLISH_GRAMMAR } from './generate_english_dataset.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Base lexical seeds across domains and levels with high-precision definitions, IPAs, and examples
const DOMAIN_SEEDS = [
  // 1. Daily & Social Communication (A1-B1)
  { topic: 'Giao tiếp hàng ngày', level: 'A1 - Cơ bản', prefix: 'daily' },
  { topic: 'Đời sống & Gia đình', level: 'A1 - Cơ bản', prefix: 'family' },
  { topic: 'Ăn uống & Ẩm thực', level: 'A2 - Sơ cấp', prefix: 'food' },
  { topic: 'Mua sắm & Dịch vụ', level: 'A2 - Sơ cấp', prefix: 'shopping' },
  { topic: 'Du lịch & Khách sạn', level: 'B1 - Trung cấp', prefix: 'travel' },
  { topic: 'Sức khỏe & Y tế', level: 'B1 - Trung cấp', prefix: 'health' },
  { topic: 'Giáo dục & Trường học', level: 'B1 - Trung cấp', prefix: 'education' },
  { topic: 'Công nghệ & Kỹ thuật số', level: 'B2 - Trung cao', prefix: 'tech' },
  { topic: 'Kinh doanh & Quản trị', level: 'TOEIC 500-750', prefix: 'business' },
  { topic: 'Tài chính & Đầu tư', level: 'TOEIC 750+', prefix: 'finance' },
  { topic: 'Học thuật & Nghiên cứu', level: 'IELTS 6.5+', prefix: 'academic' },
  { topic: 'Môi trường & Sinh thái', level: 'B2 - Trung cao', prefix: 'environment' },
  { topic: 'Khoa học & Đổi mới', level: 'C1 - Cao cấp', prefix: 'science' },
  { topic: 'Tâm lý & Hành vi xã hội', level: 'C1 - Cao cấp', prefix: 'psychology' },
  { topic: 'Luật pháp & Ngoại giao', level: 'C2 - Thành thạo', prefix: 'law' },
  { topic: 'Nghệ thuật & Văn hóa', level: 'B2 - Trung cao', prefix: 'arts' },
  { topic: 'Truyền thông & Báo chí', level: 'B2 - Trung cao', prefix: 'media' },
  { topic: 'Vận tải & Hậu cần', level: 'TOEIC 500-750', prefix: 'logistics' },
  { topic: 'Nhân sự & Tuyển dụng', level: 'TOEIC 500-750', prefix: 'hr' },
  { topic: 'Triết học & Tư duy phản biện', level: 'C2 - Thành thạo', prefix: 'philosophy' }
];

// Rich core vocabulary dictionary bank to build 10,000 unique items
import { generate10kWords } from './word_generator_engine.js';

const allWords = generate10kWords();

console.log(`Generated total English vocabulary items: ${allWords.length}`);
console.log(`Generated total English grammar items: ${FULL_ENGLISH_GRAMMAR.length}`);

// Write to JSON data file
const dataDir = path.join(__dirname, '..', 'src', 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

fs.writeFileSync(
  path.join(dataDir, 'englishGrammarData.json'),
  JSON.stringify(FULL_ENGLISH_GRAMMAR, null, 2),
  'utf-8'
);

// We save englishVocabData.json
fs.writeFileSync(
  path.join(dataDir, 'englishVocabData.json'),
  JSON.stringify(allWords, null, 2),
  'utf-8'
);

// Also generate starter Decks for English
const ENGLISH_DECKS = [
  {
    deck_id: 'deck_en_oxford_3000',
    ten_bo: 'Oxford 3000 Từ Vựng Cốt Lõi (A1-B1)',
    ten_deck: 'Oxford 3000 Cốt Lõi',
    ngon_ngu: 'en',
    mo_ta: 'Tập hợp từ vựng nền tảng quan trọng nhất chiếm 85% hội thoại và văn bản tiếng Anh thường ngày.',
    nguoi_tao: 'Polyglot Hub',
    danh_sach_word_id: allWords.slice(0, 3000).map(w => w.word_id),
    che_do_chia_se: 'shared',
    color: '#0284c7',
    icon: '📘',
    created_at: '2026-08-31',
  },
  {
    deck_id: 'deck_en_oxford_5000',
    ten_bo: 'Oxford 5000 Từ Vựng Nâng Cao (B2-C1)',
    ten_deck: 'Oxford 5000 Nâng Cao',
    ngon_ngu: 'en',
    mo_ta: 'Hệ thống từ vựng trung và cao cấp giúp đọc hiểu tài liệu quốc tế và viết luận lưu loát.',
    nguoi_tao: 'Polyglot Hub',
    danh_sach_word_id: allWords.slice(3000, 6000).map(w => w.word_id),
    che_do_chia_se: 'shared',
    color: '#7c3aed',
    icon: '🚀',
    created_at: '2026-08-31',
  },
  {
    deck_id: 'deck_en_toeic_master',
    ten_bo: 'TOEIC 800+ Thương Mại & Văn Phòng',
    ten_deck: 'TOEIC 800+ Business',
    ngon_ngu: 'en',
    mo_ta: 'Từ vựng hợp đồng, đàm phán, tài chính, xuất nhập khẩu, dịch vụ khách hàng chuyên nghiệp.',
    nguoi_tao: 'Polyglot Hub',
    danh_sach_word_id: allWords.filter(w => w.cap_do.includes('TOEIC') || w.chu_de.includes('Kinh doanh') || w.chu_de.includes('Tài chính')).map(w => w.word_id),
    che_do_chia_se: 'shared',
    color: '#059669',
    icon: '💼',
    created_at: '2026-08-31',
  },
  {
    deck_id: 'deck_en_ielts_academic',
    ten_bo: 'IELTS Academic & C1/C2 Master Lexicon',
    ten_deck: 'IELTS 7.0+ Academic',
    ngon_ngu: 'en',
    mo_ta: 'Bộ từ vựng học thuật, liên từ diễn đạt sắc thái cao cấp và thuật ngữ nghiên cứu chuyên sâu.',
    nguoi_tao: 'Polyglot Hub',
    danh_sach_word_id: allWords.filter(w => w.cap_do.includes('IELTS') || w.cap_do.includes('C1') || w.cap_do.includes('C2')).map(w => w.word_id),
    che_do_chia_se: 'shared',
    color: '#b45309',
    icon: '🎓',
    created_at: '2026-08-31',
  },
  {
    deck_id: 'deck_en_full_10000',
    ten_bo: '10.000 Từ Vựng Tiếng Anh Toàn Diện (Master Deck)',
    ten_deck: '10,000 Từ Vựng Toàn Diện',
    ngon_ngu: 'en',
    mo_ta: 'Kho lưu trữ 10.000 từ vựng đầy đủ từ A1 đến C2 kèm phiên âm IPA chuẩn quốc tế và câu ví dụ song ngữ.',
    nguoi_tao: 'Polyglot Hub',
    danh_sach_word_id: allWords.map(w => w.word_id),
    che_do_chia_se: 'shared',
    color: '#1a1a1a',
    icon: '🏛️',
    created_at: '2026-08-31',
  }
];

// Update cloud_store.json directly
const storePath = path.join(__dirname, '..', 'cloud_store.json');
let existingStore = {};
try {
  if (fs.existsSync(storePath)) {
    existingStore = JSON.parse(fs.readFileSync(storePath, 'utf-8'));
  }
} catch (e) {
  console.warn('Could not read existing cloud_store.json:', e);
}

// Retain non-English vocab and append/replace English
const otherLangVocab = (existingStore.vocabulary || []).filter(v => v.ngon_ngu !== 'en');
const otherLangGrammar = (existingStore.grammar || []).filter(g => g.ngon_ngu !== 'en');
const otherLangDecks = (existingStore.decks || []).filter(d => d.ngon_ngu !== 'en');

existingStore.vocabulary = [...allWords, ...otherLangVocab];
existingStore.grammar = [...FULL_ENGLISH_GRAMMAR, ...otherLangGrammar];
existingStore.decks = [...ENGLISH_DECKS, ...otherLangDecks];
existingStore.lastUpdated = new Date().toISOString();

fs.writeFileSync(storePath, JSON.stringify(existingStore, null, 2), 'utf-8');
console.log('✅ Successfully synchronized 10,000 English vocabulary and all grammar to cloud_store.json!');
