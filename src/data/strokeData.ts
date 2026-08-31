export interface StrokeItem {
  id: string;
  name: string;
  nativeName?: string;
  symbol: string;
  sound?: string;
  desc: string;
  direction?: string;
  exampleChar?: string;
  exampleWord?: string;
}

export interface StrokeOrderRule {
  title: string;
  nativeTitle?: string;
  desc: string;
  examples: { char: string; pinyinOrRomaja?: string; meaning: string; breakdown: string }[];
}

export interface RadicalOrComponent {
  symbol: string;
  name: string;
  pinyinOrRomaja: string;
  strokes: number;
  meaning: string;
  sampleChars: string[];
  tips?: string;
}

export interface PracticeCharacter {
  char: string;
  phonetic: string;
  meaning: string;
  strokeCount: number;
  strokeOrder: string;
  components?: string;
  difficulty: 'Cơ bản' | 'Trung cấp' | 'Nâng cao';
  tags?: string[];
}

/* =========================================================================
 * 1. TIẾNG HÀN (HANGUL - 한글)
 * ========================================================================= */
export const KOREAN_STROKE_RULES: StrokeOrderRule[] = [
  {
    title: '1. Quy tắc từ trên xuống dưới (Top to Bottom)',
    nativeTitle: '위에서 아래로',
    desc: 'Các nét nằm ở phía trên của ký tự hoặc phụ âm/nguyên âm luôn được viết trước nét phía dưới.',
    examples: [
      { char: 'ㄱ', pinyinOrRomaja: 'Giyeok', meaning: 'Nét ngang trên trước → Nét sổ dọc xuống', breakdown: 'Ngang → Sổ' },
      { char: 'ㄷ', pinyinOrRomaja: 'Digeut', meaning: 'Ngang trên → Sổ đứng → Ngang đáy', breakdown: 'Ngang → Sổ → Ngang' },
      { char: 'ㅗ', pinyinOrRomaja: 'O', meaning: 'Nét sổ đứng ngắn ở trên → Nét ngang dài ở dưới', breakdown: 'Sổ ngắn → Ngang dài' },
      { char: 'ㅡ', pinyinOrRomaja: 'Eu', meaning: 'Nét ngang phẳng từ trái sang phải', breakdown: 'Trái sang phải' },
    ],
  },
  {
    title: '2. Quy tắc từ trái sang phải (Left to Right)',
    nativeTitle: '왼쪽에서 오른쪽으로',
    desc: 'Trong một nét đơn hoặc một khối chữ Hangul, nét/thành phần bên trái luôn được viết trước bên phải.',
    examples: [
      { char: 'ㅏ', pinyinOrRomaja: 'A', meaning: 'Nét sổ dọc đứng bên trái → Nét gạch ngang ngắn bên phải', breakdown: 'Sổ đứng → Ngang ngắn' },
      { char: 'ㅓ', pinyinOrRomaja: 'Eo', meaning: 'Nét gạch ngang ngắn bên trái → Nét sổ dọc đứng bên phải', breakdown: 'Ngang ngắn → Sổ đứng' },
      { char: 'ㅐ', pinyinOrRomaja: 'Ae', meaning: 'Viết chữ ㅏ trước → Thêm nét sổ đứng bên phải', breakdown: 'ㅏ → Sổ đứng' },
      { char: '가', pinyinOrRomaja: 'Ga', meaning: 'Khối chữ đứng: Phụ âm ㄱ bên trái → Nguyên âm ㅏ bên phải', breakdown: 'ㄱ → ㅏ' },
    ],
  },
  {
    title: '3. Thứ tự cấu trúc khối âm tiết (Consonant → Vowel → Batchim)',
    nativeTitle: '초성 → 중성 → 종성 (Phụ âm đầu → Nguyên âm giữa → Phụ âm dưới)',
    desc: 'Mỗi khối chữ tiếng Hàn bắt buộc gồm ít nhất 1 Phụ âm đầu (초성) + 1 Nguyên âm (중성). Nếu có Phụ âm dưới (종성 / 받침), luôn viết sau cùng ở đáy.',
    examples: [
      { char: '한', pinyinOrRomaja: 'Han', meaning: 'Chữ "Hàn" trong Hangul: Phụ âm ㅎ → Nguyên âm ㅏ → Batchim ㄴ', breakdown: 'ㅎ → ㅏ → ㄴ' },
      { char: '글', pinyinOrRomaja: 'Geul', meaning: 'Chữ "Tự" trong Hangul: Phụ âm ㄱ → Nguyên âm ㅡ → Batchim ㄹ', breakdown: 'ㄱ → ㅡ → ㄹ' },
      { char: '닭', pinyinOrRomaja: 'Dak (Gà)', meaning: 'Batchim đôi: Viết ㄷ → ㅏ → Batchim đôi ㄺ (ㄹ trước, ㄱ sau)', breakdown: 'ㄷ → ㅏ → ㄹ → ㄱ' },
      { char: '꽃', pinyinOrRomaja: 'Kkot (Hoa)', meaning: 'Phụ âm căng ㄲ → Nguyên âm ㅗ → Batchim ㅊ', breakdown: 'ㄲ → ㅗ → ㅊ' },
    ],
  },
];

export const KOREAN_BASIC_CONSONANTS: RadicalOrComponent[] = [
  { symbol: 'ㄱ', name: 'Giyeok (기역)', pinyinOrRomaja: 'g / k', strokes: 1, meaning: 'Phụ âm gốc lưỡi nâng lên chạm vòm họng mềm', sampleChars: ['가', '구', '국', '김'], tips: 'Viết 1 nét liền: ngang sang phải rồi bẻ góc sổ xuống.' },
  { symbol: 'ㄴ', name: 'Nieun (니은)', pinyinOrRomaja: 'n', strokes: 1, meaning: 'Đầu lưỡi chạm vào nướu răng hàm trên', sampleChars: ['나', '눈', '남', '네'], tips: 'Viết 1 nét liền: sổ xuống rồi bẻ góc ngang sang phải.' },
  { symbol: 'ㄷ', name: 'Digeut (디귿)', pinyinOrRomaja: 'd / t', strokes: 2, meaning: 'Âm bật nướu, nét thêm vào từ chữ ㄴ', sampleChars: ['다', '돈', '달', '두'], tips: 'Nét 1: ngang trên. Nét 2: sổ xuống bẻ ngang dưới.' },
  { symbol: 'ㄹ', name: 'Rieul (리을)', pinyinOrRomaja: 'r / l', strokes: 3, meaning: 'Âm rung lưỡi mềm mại hình sóng nước', sampleChars: ['라', '라면', '로', '리'], tips: 'Nét 1: ngang gập. Nét 2: ngang giữa. Nét 3: sổ bẻ ngang dưới.' },
  { symbol: 'ㅁ', name: 'Mieum (미음)', pinyinOrRomaja: 'm', strokes: 3, meaning: 'Hình dáng đôi môi khép kín khi phát âm', sampleChars: ['마', '물', '문', '모'], tips: 'Nét 1: sổ trái. Nét 2: ngang gập sổ phải. Nét 3: ngang đáy.' },
  { symbol: 'ㅂ', name: 'Bieup (비읍)', pinyinOrRomaja: 'b / p', strokes: 4, meaning: 'Âm bật môi mở rộng từ chữ ㅁ', sampleChars: ['바', '밥', '봄', '비'], tips: 'Nét 1-2: 2 nét sổ dọc song song. Nét 3: ngang giữa. Nét 4: ngang đáy.' },
  { symbol: 'ㅅ', name: 'Siot (시옷)', pinyinOrRomaja: 's', strokes: 2, meaning: 'Hình dáng chiếc răng cửa sắc nhọn', sampleChars: ['사', '산', '소', '새'], tips: 'Nét 1: phẩy nghiêng trái. Nét 2: nét xiên nghiêng phải từ giữa nét 1.' },
  { symbol: 'ㅇ', name: 'Ieung (이응)', pinyinOrRomaja: 'ng / âm câm', strokes: 1, meaning: 'Hình tròn thanh quản mở rộng (Đứng đầu là âm câm, đứng cuối là âm ng)', sampleChars: ['아', '오', '강', '방'], tips: 'Viết 1 nét tròn khép kín theo chiều ngược chiều kim đồng hồ.' },
  { symbol: 'ㅈ', name: 'Jieut (지읒)', pinyinOrRomaja: 'j / ch', strokes: 2, meaning: 'Âm vòm miệng, nét thêm phía trên chữ ㅅ', sampleChars: ['자', '집', '주', '전'], tips: 'Nét 1: ngang gập phẩy trái. Nét 2: xiên nghiêng phải.' },
  { symbol: 'ㅊ', name: 'Chieut (치읓)', pinyinOrRomaja: 'ch (bật hơi)', strokes: 3, meaning: 'Âm bật hơi mạnh từ chữ ㅈ', sampleChars: ['차', '책', '친구', '천'], tips: 'Nét 1: chấm/ngang ngắn trên đỉnh. Nét 2-3: thân chữ ㅈ.' },
  { symbol: 'ㅋ', name: 'Kieuk (키읔)', pinyinOrRomaja: 'k (bật hơi)', strokes: 2, meaning: 'Âm bật hơi mạnh từ chữ ㄱ', sampleChars: ['카', '커피', '코', '키'], tips: 'Nét 1: chữ ㄱ. Nét 2: gạch ngang ngắn ở giữa.' },
  { symbol: 'ㅌ', name: 'Tieut (티읕)', pinyinOrRomaja: 't (bật hơi)', strokes: 3, meaning: 'Âm bật hơi mạnh từ chữ ㄷ', sampleChars: ['타', '토끼', '택시', '태양'], tips: 'Nét 1: ngang trên. Nét 2: ngang giữa. Nét 3: sổ bẻ ngang dưới.' },
  { symbol: 'ㅍ', name: 'Pieup (피읖)', pinyinOrRomaja: 'p (bật hơi)', strokes: 4, meaning: 'Âm bật môi mạnh từ chữ ㅂ', sampleChars: ['파', '포도', '편지', '피자'], tips: 'Nét 1: ngang trên. Nét 2-3: 2 sổ đứng giữa. Nét 4: ngang đáy.' },
  { symbol: 'ㅎ', name: 'Hieut (히읗)', pinyinOrRomaja: 'h', strokes: 3, meaning: 'Hình dáng cổ họng thở ra luồng hơi', sampleChars: ['하', '학교', '한국', '해'], tips: 'Nét 1: chấm/sổ ngắn đỉnh. Nét 2: ngang dài giữa. Nét 3: vòng tròn ㅇ ở đáy.' },
];

export const KOREAN_DOUBLE_CONSONANTS: RadicalOrComponent[] = [
  { symbol: 'ㄲ', name: 'Ssang-giyeok (쌍기역)', pinyinOrRomaja: 'kk (gấp đôi g)', strokes: 2, meaning: 'Phụ âm căng, phát âm nghẹn cứng giọng không bật hơi', sampleChars: ['꿈 (giấc mơ)', '꽃 (hoa)', '끝 (kết thúc)'], tips: 'Viết 2 chữ ㄱ đứng cạnh nhau sát nhau.' },
  { symbol: 'ㄸ', name: 'Ssang-digeut (쌍디귿)', pinyinOrRomaja: 'tt (gấp đôi d)', strokes: 4, meaning: 'Phụ âm căng âm t/d', sampleChars: ['딸기 (dâu tây)', '또 (lại)', '뜨겁다 (nóng)'], tips: 'Viết 2 chữ ㄷ đứng cạnh nhau.' },
  { symbol: 'ㅃ', name: 'Ssang-bieup (쌍비읍)', pinyinOrRomaja: 'pp (gấp đôi b)', strokes: 8, meaning: 'Phụ âm căng âm b/p nén môi', sampleChars: ['빵 (bánh mì)', '빨리 (nhanh lên)', '오빠 (anh trai)'], tips: 'Viết 2 chữ ㅂ đứng cạnh nhau.' },
  { symbol: 'ㅆ', name: 'Ssang-siot (쌍시옷)', pinyinOrRomaja: 'ss (gấp đôi s)', strokes: 4, meaning: 'Phụ âm căng âm s siết răng', sampleChars: ['쌀 (gạo)', '쓰다 (viết/đắng)', '싸다 (rẻ)'], tips: 'Viết 2 chữ ㅅ đứng cạnh nhau.' },
  { symbol: 'ㅉ', name: 'Ssang-jieut (쌍지읒)', pinyinOrRomaja: 'jj (gấp đôi j)', strokes: 4, meaning: 'Phụ âm căng âm j cứng lưỡi', sampleChars: ['짜다 (mặn)', '찌개 (canh/lẩu)', '찍다 (chụp)'], tips: 'Viết 2 chữ ㅈ đứng cạnh nhau.' },
];

export const KOREAN_VOWELS: RadicalOrComponent[] = [
  { symbol: 'ㅏ', name: 'A (아)', pinyinOrRomaja: 'a', strokes: 2, meaning: 'Nguyên âm Dương: Mặt trời mọc ở phía Đông', sampleChars: ['아이', '아버지', '나무'], tips: 'Nét 1: sổ dọc dài. Nét 2: ngang ngắn hướng sang phải.' },
  { symbol: 'ㅑ', name: 'Ya (야)', pinyinOrRomaja: 'ya', strokes: 3, meaning: 'Âm i-a lướt nhanh, 2 tia sáng mặt trời', sampleChars: ['야구', '약속', '이야기'], tips: 'Nét 1: sổ dọc dài. Nét 2-3: 2 nét ngang ngắn sang phải.' },
  { symbol: 'ㅓ', name: 'Eo (어)', pinyinOrRomaja: 'eo (âm ơ/o)', strokes: 2, meaning: 'Nguyên âm Âm: Mặt trời lặn ở phía Tây', sampleChars: ['어머니', '어디', '얼굴'], tips: 'Nét 1: ngang ngắn bên trái. Nét 2: sổ dọc dài bên phải.' },
  { symbol: 'ㅕ', name: 'Yeo (여)', pinyinOrRomaja: 'yeo (âm i-ơ)', strokes: 3, meaning: 'Âm i-eo lướt nhanh', sampleChars: ['여름', '여동생', '여행'], tips: 'Nét 1-2: 2 ngang ngắn bên trái. Nét 3: sổ dọc dài.' },
  { symbol: 'ㅗ', name: 'O (오)', pinyinOrRomaja: 'o (âm ô tròn môi)', strokes: 2, meaning: 'Nguyên âm Dương: Mặt trời nhô lên trên mặt đất', sampleChars: ['오빠', '오늘', '오리'], tips: 'Nét 1: sổ đứng ngắn ở trên. Nét 2: ngang dài ở dưới.' },
  { symbol: 'ㅛ', name: 'Yo (요)', pinyinOrRomaja: 'yo', strokes: 3, meaning: 'Âm i-o lướt nhanh hướng lên trên', sampleChars: ['요리', '요구르트', '화요일'], tips: 'Nét 1-2: 2 sổ đứng ngắn song song. Nét 3: ngang dài đáy.' },
  { symbol: 'ㅜ', name: 'U (우)', pinyinOrRomaja: 'u (âm u chu môi)', strokes: 2, meaning: 'Nguyên âm Âm: Mặt trời chìm xuống dưới lòng đất', sampleChars: ['우유', '우산', '우리'], tips: 'Nét 1: ngang dài ở trên. Nét 2: sổ dọc ngắn ở dưới.' },
  { symbol: 'ㅠ', name: 'Yu (유)', pinyinOrRomaja: 'yu', strokes: 3, meaning: 'Âm i-u lướt nhanh hướng xuống', sampleChars: ['유학', '유리', '휴지'], tips: 'Nét 1: ngang dài ở trên. Nét 2-3: 2 sổ dọc ngắn đi xuống.' },
  { symbol: 'ㅡ', name: 'Eu (으)', pinyinOrRomaja: 'eu (âm ư bẹt môi)', strokes: 1, meaning: 'Nguyên âm Trung tính: Mặt đất phẳng lặng bao la', sampleChars: ['음식', '음악', '은행'], tips: 'Viết 1 nét ngang dài dứt khoát từ trái sang phải.' },
  { symbol: 'ㅣ', name: 'I (이)', pinyinOrRomaja: 'i (âm i)', strokes: 1, meaning: 'Nguyên âm Trung tính: Con người đứng thẳng vững vàng', sampleChars: ['이름', '이야기', '이빨'], tips: 'Viết 1 nét sổ dọc dài từ trên xuống dưới.' },
];

export const KOREAN_COMPOUND_VOWELS: RadicalOrComponent[] = [
  { symbol: 'ㅐ', name: 'Ae (애)', pinyinOrRomaja: 'ae (e)', strokes: 3, meaning: 'Kết hợp giữa ㅏ + ㅣ', sampleChars: ['새 (chim)', '배 (thuyền/bụng)', '애기'], tips: 'Viết chữ ㅏ trước rồi thêm sổ dọc ㅣ bên phải.' },
  { symbol: 'ㅒ', name: 'Yae (얘)', pinyinOrRomaja: 'yae', strokes: 4, meaning: 'Kết hợp giữa ㅑ + ㅣ', sampleChars: ['얘기 (câu chuyện)', '얘들'], tips: 'Viết chữ ㅑ trước rồi thêm sổ dọc ㅣ bên phải.' },
  { symbol: 'ㅔ', name: 'E (에)', pinyinOrRomaja: 'e', strokes: 3, meaning: 'Kết hợp giữa ㅓ + ㅣ', sampleChars: ['네 (vâng)', '제 (của tôi)', '세계'], tips: 'Viết chữ ㅓ trước rồi thêm sổ dọc ㅣ bên phải.' },
  { symbol: 'ㅖ', name: 'Ye (예)', pinyinOrRomaja: 'ye', strokes: 4, meaning: 'Kết hợp giữa ㅕ + ㅣ', sampleChars: ['예쁘다 (đẹp)', '예술', '예의'], tips: 'Viết chữ ㅕ trước rồi thêm sổ dọc ㅣ bên phải.' },
  { symbol: 'ㅘ', name: 'Wa (와)', pinyinOrRomaja: 'wa', strokes: 4, meaning: 'Kết hợp giữa ㅗ + ㅏ', sampleChars: ['과자 (bánh)', '사과 (táo)', '와요'], tips: 'Viết chữ ㅗ ở trên-trái rồi viết ㅏ ở dưới-phải.' },
  { symbol: 'ㅙ', name: 'Wae (왜)', pinyinOrRomaja: 'wae', strokes: 5, meaning: 'Kết hợp giữa ㅗ + ㅐ', sampleChars: ['왜 (tại sao)', '돼지 (con heo)'], tips: 'Viết ㅗ bên trái, tiếp theo viết ㅐ bên phải.' },
  { symbol: 'ㅚ', name: 'Oe (외)', pinyinOrRomaja: 'oe (phát âm we/uê)', strokes: 3, meaning: 'Kết hợp giữa ㅗ + ㅣ', sampleChars: ['외국 (nước ngoài)', '회사 (công ty)'], tips: 'Viết ㅗ trước rồi thêm sổ dọc ㅣ bên phải.' },
  { symbol: 'ㅝ', name: 'Wo (워)', pinyinOrRomaja: 'wo (u-ơ)', strokes: 4, meaning: 'Kết hợp giữa ㅜ + ㅓ', sampleChars: ['월요일 (thứ 2)', '병원 (bệnh viện)'], tips: 'Viết ㅜ trước rồi viết ㅓ bên phải.' },
  { symbol: 'ㅞ', name: 'We (웨)', pinyinOrRomaja: 'we', strokes: 5, meaning: 'Kết hợp giữa ㅜ + ㅔ', sampleChars: ['웨딩 (đám cưới)', '웹사이트'], tips: 'Viết ㅜ trước rồi viết ㅔ bên phải.' },
  { symbol: 'ㅟ', name: 'Wi (위)', pinyinOrRomaja: 'wi (uy)', strokes: 3, meaning: 'Kết hợp giữa ㅜ + ㅣ', sampleChars: ['위 (ở trên/dạ dày)', '귀 (tai)'], tips: 'Viết ㅜ trước rồi thêm sổ dọc ㅣ bên phải.' },
  { symbol: 'ㅢ', name: 'Ui (의)', pinyinOrRomaja: 'ui (ư-i / ê / i)', strokes: 2, meaning: 'Kết hợp giữa ㅡ + ㅣ', sampleChars: ['의사 (bác sĩ)', '의자 (cái ghế)'], tips: 'Ngang ㅡ ở dưới rồi sổ dọc ㅣ ở bên phải.' },
];

export const KOREAN_SAMPLE_PRACTICE: PracticeCharacter[] = [
  { char: '한', phonetic: 'Han', meaning: 'Hàn (Đại Hàn Dân Quốc / Chữ viết)', strokeCount: 7, strokeOrder: 'ㅎ (chấm → ngang → tròn ㅇ) → ㅏ (sổ đứng → ngang) → Batchim ㄴ (sổ bẻ ngang)', components: 'ㅎ + ㅏ + ㄴ', difficulty: 'Cơ bản', tags: ['Từ vựng cốt lõi', 'Hangul'] },
  { char: '글', phonetic: 'Geul', meaning: 'Chữ / Bài viết (Hangul)', strokeCount: 6, strokeOrder: 'ㄱ (ngang gập) → ㅡ (ngang dài) → Batchim ㄹ (ngang gập → ngang → sổ bẻ ngang)', components: 'ㄱ + ㅡ + ㄹ', difficulty: 'Cơ bản', tags: ['Từ vựng cốt lõi'] },
  { char: '사랑', phonetic: 'Sarang', meaning: 'Tình yêu (Love)', strokeCount: 9, strokeOrder: '사: ㅅ (phẩy → xiên) → ㅏ (sổ → ngang). 랑: ㄹ (3 nét) → ㅏ (2 nét) → Batchim ㅇ (1 nét)', components: '사(ㅅ+ㅏ) + 랑(ㄹ+ㅏ+ㅇ)', difficulty: 'Cơ bản', tags: ['Phổ biến', 'Tình cảm'] },
  { char: '학교', phonetic: 'Hak-gyo', meaning: 'Trường học (School)', strokeCount: 11, strokeOrder: '학: ㅎ(3) + ㅏ(2) + ㄱ(1) = 6 nét. 교: ㄱ(1) + ㅛ(3) = 4 nét', components: '학(ㅎ+ㅏ+ㄱ) + 교(ㄱ+ㅛ)', difficulty: 'Trung cấp', tags: ['Đời sống', 'Trường học'] },
  { char: '친구', phonetic: 'Chingu', meaning: 'Bạn bè (Friend)', strokeCount: 8, strokeOrder: '친: ㅊ(3) + ㅣ(1) + ㄴ(1) = 5 nét. 구: ㄱ(1) + ㅜ(2) = 3 nét', components: '친(ㅊ+ㅣ+ㄴ) + 구(ㄱ+ㅜ)', difficulty: 'Cơ bản', tags: ['Giao tiếp'] },
  { char: '감사', phonetic: 'Gamsa', meaning: 'Cảm ơn (Thanks)', strokeCount: 8, strokeOrder: '감: ㄱ(1) + ㅏ(2) + ㅁ(3) = 6 nét. 사: ㅅ(2) + ㅏ(2) = 4 nét', components: '감(ㄱ+ㅏ+ㅁ) + 사(ㅅ+ㅏ)', difficulty: 'Cơ bản', tags: ['Lịch sự'] },
];

/* =========================================================================
 * 2. TIẾNG TRUNG (CHỮ HÁN - 汉字 & 拼音)
 * ========================================================================= */
export const CHINESE_BASIC_STROKES: StrokeItem[] = [
  { id: 'heng', name: 'Nét Ngang (Héng)', nativeName: '横', symbol: '一', desc: 'Viết thẳng từ trái sang phải, hơi vát nhẹ ở đuôi nét', direction: 'Trái → Phải', exampleChar: '一, 二, 三, 十, 大' },
  { id: 'shu', name: 'Nét Sổ (Shù)', nativeName: '竖', symbol: '丨', desc: 'Viết từ trên xuống dưới thẳng đứng vững chãi', direction: 'Trên → Dưới', exampleChar: '十, 中, 申, 木, 门' },
  { id: 'pie', name: 'Nét Phẩy (Piě)', nativeName: '撇', symbol: '丿', desc: 'Viết từ trên lượn cong mềm sang góc dưới bên trái', direction: 'Trên-Phải → Dưới-Trái', exampleChar: '八, 人, 月, 千, 生' },
  { id: 'na', name: 'Nét Mác (Nà)', nativeName: '捺', symbol: '乀', desc: 'Viết từ trên sang góc dưới bên phải với nét chân đậm và đầm', direction: 'Trên-Trái → Dưới-Phải', exampleChar: '人, 大, 天, 木, 入' },
  { id: 'dian', name: 'Nét Chấm (Diǎn)', nativeName: '点', symbol: '丶', desc: 'Nhấn nhẹ như hình giọt nước từ trên xuống góc dưới', direction: 'Trên → Dưới nhấn nhẹ', exampleChar: '六, 文, 字, 主, 心' },
  { id: 'ti', name: 'Nét Hất (Tí)', nativeName: '提', symbol: '𠀁', desc: 'Từ dưới bên trái hất nhanh và nhọn chéo lên trên bên phải', direction: 'Dưới-Trái → Trên-Phải', exampleChar: '地, 打, 江, 冷, 习' },
  { id: 'zhe', name: 'Nét Gập (Béng / Zhé)', nativeName: '折', symbol: '𠃍', desc: 'Nét ngang chuyển hướng gập vuông góc xuống dưới dứt khoát', direction: 'Ngang → Bẻ góc xuống', exampleChar: '口, 日, 四, 田, 几' },
  { id: 'gou', name: 'Nét Móc (Gōu)', nativeName: '钩', symbol: '亅', desc: 'Nét sổ đi xuống rồi móc nhọn chếch lên trên', direction: 'Sổ xuống → Móc nhọn lên', exampleChar: '小, 水, 于, 丁, 寸' },
];

export const CHINESE_COMPOSITE_STROKES: StrokeItem[] = [
  { id: 'hengzhe', name: 'Ngang Gập (Héng Zhé)', nativeName: '横折', symbol: '𠃍', desc: 'Viết nét ngang rồi chuyển hướng gập thẳng đứng xuống', exampleChar: '口, 日, 田, 四' },
  { id: 'hengzhegou', name: 'Ngang Gập Móc (Héng Zhé Gōu)', nativeName: '横折钩', symbol: '𠃌', desc: 'Ngang sang phải, gập xuống rồi móc nhọn sang trái', exampleChar: '月, 门, 同, 司' },
  { id: 'shuzhe', name: 'Sổ Gập (Shù Zhé)', nativeName: '竖折', symbol: '𠃊', desc: 'Sổ thẳng xuống rồi bẻ góc ngang sang phải', exampleChar: '山, 区, 画, 医' },
  { id: 'shuwangou', name: 'Sổ Cong Móc (Shù Wān Gōu)', nativeName: '竖弯钩', symbol: '乚', desc: 'Sổ xuống lượn cong đáy rồi móc thẳng lên trên (Nét chữ L)', exampleChar: '七, 儿, 也, 元, 光' },
  { id: 'piezhe', name: 'Phẩy Gập (Piě Zhé)', nativeName: '撇折', symbol: '𠃋', desc: 'Phẩy nghiêng trái rồi gập hất chéo lên bên phải', exampleChar: '云, 去, 东, 经' },
  { id: 'xiegou', name: 'Tà Câu / Nét Nghiêng Móc (Xié Gōu)', nativeName: '斜钩', symbol: '㇂', desc: 'Nét cong nghiêng dài từ trên trái sang phải rồi móc nhọn lên', exampleChar: '我, 成, 钱, 战' },
  { id: 'wogou', name: 'Ngọa Câu / Nét Nằm Móc (Wò Gōu)', nativeName: '卧钩', symbol: '㇃', desc: 'Nét nằm ngang lượn cong như chiếc thuyền rồi móc lên', exampleChar: '心, 必, 怎, 忍' },
  { id: 'shuti', name: 'Sổ Hất (Shù Tí)', nativeName: '竖提', symbol: '𠄌', desc: 'Sổ thẳng đứng xuống rồi hất nhọn chéo lên trên phải', exampleChar: '长, 民, 很, 切' },
];

export const CHINESE_STROKE_RULES: StrokeOrderRule[] = [
  {
    title: '1. Ngang trước sổ sau (先横后竖)',
    nativeTitle: 'Xiān héng hòu shù',
    desc: 'Khi một chữ có nét ngang và nét sổ giao nhau, luôn viết nét ngang trước rồi mới đến nét sổ.',
    examples: [
      { char: '十', pinyinOrRomaja: 'shí (Mười)', meaning: 'Ngang (一) trước → Sổ dọc (丨) sau', breakdown: '一 → 丨' },
      { char: '土', pinyinOrRomaja: 'tǔ (Đất)', meaning: 'Ngang trên → Sổ giữa → Ngang đáy', breakdown: '一 → 丨 → 一' },
      { char: '干', pinyinOrRomaja: 'gān (Khô/Làm)', meaning: 'Ngang ngắn → Ngang dài → Sổ giữa', breakdown: '一 → 一 → 丨' },
    ],
  },
  {
    title: '2. Phẩy trước mác sau (先撇后捺)',
    nativeTitle: 'Xiān piě hòu nà',
    desc: 'Khi hai nét phẩy và mác giao nhau hoặc đối xứng, nét phẩy bên trái viết trước, nét mác bên phải viết sau.',
    examples: [
      { char: '八', pinyinOrRomaja: 'bā (Tám)', meaning: 'Phẩy trái (丿) trước → Mác phải (乀) sau', breakdown: '丿 → 乀' },
      { char: '人', pinyinOrRomaja: 'rén (Người)', meaning: 'Phẩy trên-trái → Mác dưới-phải', breakdown: '丿 → 乀' },
      { char: '大', pinyinOrRomaja: 'dà (Lớn)', meaning: 'Ngang trên → Phẩy trái → Mác phải', breakdown: '一 → 丿 → 乀' },
      { char: '天', pinyinOrRomaja: 'tiān (Trời)', meaning: 'Ngang ngắn → Ngang dài → Phẩy → Mác', breakdown: '一 → 一 → 丿 → 乀' },
    ],
  },
  {
    title: '3. Trên trước dưới sau (从上到下)',
    nativeTitle: 'Cóng shàng dào xià',
    desc: 'Các chữ có kết cấu tầng trên tầng dưới, luôn viết phần ở trên trước rồi viết phần ở dưới sau.',
    examples: [
      { char: '三', pinyinOrRomaja: 'sān (Ba)', meaning: 'Ngang trên → Ngang giữa → Ngang dưới cùng', breakdown: '一 → 一 → 一' },
      { char: '意', pinyinOrRomaja: 'yì (Ý nghĩa)', meaning: 'Chữ Lập (立) ở trên → Chữ Nhật (日) ở giữa → Chữ Tâm (心) ở dưới', breakdown: '立 → 日 → 心' },
      { char: '二', pinyinOrRomaja: 'èr (Hai)', meaning: 'Ngang trên ngắn → Ngang dưới dài', breakdown: '一 → 一' },
    ],
  },
  {
    title: '4. Trái trước phải sau (从左到右)',
    nativeTitle: 'Cóng zuǒ dào yòu',
    desc: 'Các chữ có kết cấu ghép ngang (trái - phải), luôn viết bộ thủ/nửa bên trái trước rồi viết nửa bên phải sau.',
    examples: [
      { char: '你', pinyinOrRomaja: 'nǐ (Bạn)', meaning: 'Bộ Nhân đứng (亻) bên trái trước → Chữ Nhĩ (尔) bên phải sau', breakdown: '亻 → 尔' },
      { char: '他', pinyinOrRomaja: 'tā (Anh ấy)', meaning: 'Bộ Nhân đứng (亻) trước → Chữ Dã (也) sau', breakdown: '亻 → 也' },
      { char: '明', pinyinOrRomaja: 'míng (Sáng)', meaning: 'Bộ Nhật (日) bên trái trước → Bộ Nguyệt (月) bên phải sau', breakdown: '日 → 月' },
    ],
  },
  {
    title: '5. Ngoài trước trong sau (从外到内)',
    nativeTitle: 'Cóng wài dào nèi',
    desc: 'Đối với các chữ có khung bao bọc (trừ khung khép kín đáy), viết khung viền bao quanh bên ngoài trước rồi mới viết nội dung bên trong.',
    examples: [
      { char: '月', pinyinOrRomaja: 'yuè (Mặt trăng/Tháng)', meaning: 'Khung ngoài (Phẩy → Ngang gập móc) trước → Hai nét ngang bên trong sau', breakdown: '丿 → 𠃌 → 一 → 一' },
      { char: '同', pinyinOrRomaja: 'tóng (Cùng/Đồng)', meaning: 'Khung Quynh (冂) bên ngoài trước → Chữ Nhất (一) và Khẩu (口) bên trong sau', breakdown: '冂 → 一 → 口' },
      { char: '风', pinyinOrRomaja: 'fēng (Gió)', meaning: 'Khung Phong (几) ngoài trước → Nét trong sau', breakdown: '丿 → 𠃌 → 乂' },
    ],
  },
  {
    title: '6. Vào trước đóng sau (先进入后关门)',
    nativeTitle: 'Xiān jìnrù hòu guānmén',
    desc: 'Đối với chữ có khung bao kín 4 phía (như bộ Vi 囗), viết khung ngoài (3 cạnh) → Viết toàn bộ nội dung bên trong → Cuối cùng mới viết nét ngang đóng kín đáy.',
    examples: [
      { char: '国', pinyinOrRomaja: 'guó (Quốc gia)', meaning: 'Sổ ngoài → Ngang gập ngoài → Viết chữ Ngọc (玉) bên trong → Ngang đóng đáy', breakdown: '丨 → 𠃍 → 玉 → 一' },
      { char: '回', pinyinOrRomaja: 'huí (Về/Trở lại)', meaning: 'Khung ngoài (3 cạnh) → Chữ Khẩu (口) bên trong → Ngang đóng đáy', breakdown: '丨 → 𠃍 → 口 → 一' },
      { char: '日', pinyinOrRomaja: 'rì (Mặt trời/Ngày)', meaning: 'Sổ trái → Ngang gập phải → Ngang giữa → Ngang đóng đáy', breakdown: '丨 → 𠃍 → 一 → 一' },
      { char: '四', pinyinOrRomaja: 'sì (Bốn)', meaning: 'Sổ trái → Ngang gập phải → Nét phẩy và sổ cong bên trong → Ngang đóng đáy', breakdown: '丨 → 𠃍 → 八 → 一' },
    ],
  },
  {
    title: '7. Giữa trước hai bên sau (先中间后两边)',
    nativeTitle: 'Xiān zhōngjiān hòu liǎngbiān',
    desc: 'Với các chữ có trục đối xứng chính giữa cao và nhô lên, luôn viết nét hoặc bộ phận ở chính giữa trước, sau đó mới viết bên trái rồi bên phải.',
    examples: [
      { char: '小', pinyinOrRomaja: 'xiǎo (Nhỏ)', meaning: 'Nét Sổ móc (亅) ở giữa trước → Chấm trái → Chấm phải', breakdown: '亅 → 丶 → 丶' },
      { char: '水', pinyinOrRomaja: 'shuǐ (Nước)', meaning: 'Nét Sổ móc (亅) ở giữa trước → Nét bên trái → Nét bên phải', breakdown: '亅 → ㇇ → 丿 → ㇏' },
      { char: '木', pinyinOrRomaja: 'mù (Gỗ/Cây)', meaning: 'Ngang → Sổ dọc đứng giữa → Phẩy trái → Mác phải', breakdown: '一 → 丨 → 丿 → ㇏' },
    ],
  },
];

export const CHINESE_ESSENTIAL_RADICALS: RadicalOrComponent[] = [
  { symbol: '亻', name: 'Bộ Nhân Đứng (Rén)', pinyinOrRomaja: 'rén', strokes: 2, meaning: 'Liên quan đến con người, hành động của người', sampleChars: ['你 (bạn)', '他 (anh ấy)', '休 (nghỉ ngơi)', '作 (làm)'], tips: 'Biến thể của chữ 人 khi ghép bên trái.' },
  { symbol: '口', name: 'Bộ Khẩu (Kǒu)', pinyinOrRomaja: 'kǒu', strokes: 3, meaning: 'Cái miệng, ăn uống, lời nói, âm thanh', sampleChars: ['吃 (ăn)', '喝 (uống)', '叫 (gọi)', '问 (hỏi)', '听 (nghe)'], tips: 'Viết sổ trái → ngang gập → ngang đáy.' },
  { symbol: '氵', name: 'Bộ Ba Chấm Thủy (Shuǐ)', pinyinOrRomaja: 'shuǐ', strokes: 3, meaning: 'Nước, chất lỏng, sông hồ, sông ngòi', sampleChars: ['江 (sông)', '海 (biển)', '洗 (rửa)', '渴 (khát)', '游 (bơi)'], tips: '2 chấm trên hướng xuống, 1 chấm hất từ dưới lên.' },
  { symbol: '艹', name: 'Bộ Thảo Đầu (Cǎo)', pinyinOrRomaja: 'cǎo', strokes: 3, meaning: 'Cây cỏ, thảo mộc, hoa lá, thực vật', sampleChars: ['花 (hoa)', '茶 (trà)', '草 (cỏ)', '菜 (rau/món ăn)', '药 (thuốc)'], tips: 'Nét ngang dài trước, 2 nét sổ ngắn cắt ngang sau.' },
  { symbol: '心 / 忄', name: 'Bộ Tâm (Xīn)', pinyinOrRomaja: 'xīn', strokes: 4, meaning: 'Trái tim, tình cảm, cảm xúc, suy nghĩ', sampleChars: ['想 (nghĩ/nhớ)', '情 (tình cảm)', '快 (vui)', '慢 (chậm)', '忙 (bận)'], tips: 'Đứng dưới là chữ 心, đứng bên trái là bộ Thấu Tâm 忄.' },
  { symbol: '辶', name: 'Bộ Quai Xước (Chuò)', pinyinOrRomaja: 'chuò', strokes: 3, meaning: 'Di chuyển, bước đi, khoảng cách, thời gian', sampleChars: ['进 (vào)', '远 (xa)', '近 (gần)', '边 (bên cạnh)', '过 (qua)'], tips: 'Luôn viết phần bên trong trước rồi mới viết bộ 辶 bao bên ngoài đáy.' },
  { symbol: '扌', name: 'Bộ Thủ / Tay Gảy (Shǒu)', pinyinOrRomaja: 'shǒu', strokes: 3, meaning: 'Bàn tay, thao tác bằng tay, hành động nắm bắt', sampleChars: ['打 (đánh/chơi)', '找 (tìm)', '拿 (cầm)', '提 (xách)', '推 (đẩy)'], tips: 'Ngang ngắn → Sổ móc → Hất nhọn từ dưới lên.' },
  { symbol: '女', name: 'Bộ Nữ (Nǚ)', pinyinOrRomaja: 'nǚ', strokes: 3, meaning: 'Phụ nữ, giống cái, người mẹ, vẻ đẹp', sampleChars: ['好 (tốt)', '妈 (mẹ)', '妹 (em gái)', '姐 (chị gái)', '奶 (bà)'] },
  { symbol: '木', name: 'Bộ Mộc (Mù)', pinyinOrRomaja: 'mù', strokes: 4, meaning: 'Cây cối, gỗ, đồ vật làm từ gỗ', sampleChars: ['桌 (bàn)', '椅 (ghế)', '李 (họ Lý/mận)', '林 (rừng)', '校 (trường)'] },
  { symbol: '日', name: 'Bộ Nhật (Rì)', pinyinOrRomaja: 'rì', strokes: 4, meaning: 'Mặt trời, thời gian, ban ngày, ánh sáng', sampleChars: ['早 (sớm)', '时 (thời gian)', '明 (sáng)', '昨 (hôm qua)', '晴 (trời nắng)'] },
  { symbol: '月', name: 'Bộ Nguyệt (Yuè)', pinyinOrRomaja: 'yuè', strokes: 4, meaning: 'Mặt trăng / Cơ thể thịt (Bộ Nhục)', sampleChars: ['朋 (bạn)', '期 (kỳ hạn)', '脸 (khuôn mặt)', '腿 (chân)', '脑 (não)'] },
  { symbol: '宀', name: 'Bộ Miên / Mái Nhà (Mián)', pinyinOrRomaja: 'mián', strokes: 3, meaning: 'Mái nhà, nơi cư trú, an toàn, nhà cửa', sampleChars: ['家 (gia đình/nhà)', '安 (bình an)', '字 (chữ)', '室 (phòng)', '客 (khách)'] },
  { symbol: '讠', name: 'Bộ Ngôn (Yán)', pinyinOrRomaja: 'yán', strokes: 2, meaning: 'Lời nói, ngôn ngữ, trò chuyện, văn bản', sampleChars: ['话 (lời nói)', '说 (nói)', '请 (mời)', '语 (ngôn ngữ)', '谢 (cảm ơn)'] },
  { symbol: '钅', name: 'Bộ Kim (Jīn)', pinyinOrRomaja: 'jīn', strokes: 5, meaning: 'Kim loại, tiền bạc, chuông, sắt thép', sampleChars: ['钱 (tiền)', '银 (bạc)', '钟 (đồng hồ)', '铁 (sắt)', '销 (tiêu thụ)'] },
  { symbol: '火 / 灬', name: 'Bộ Hỏa (Huǒ)', pinyinOrRomaja: 'huǒ', strokes: 4, meaning: 'Lửa, nhiệt độ, nấu nướng, ánh sáng', sampleChars: ['热 (nóng)', '炒 (xào)', '烤 (nướng)', '点 (chấm/điểm)', '照 (chiếu)'] },
];

export const CHINESE_SAMPLE_PRACTICE: PracticeCharacter[] = [
  { char: '永', phonetic: 'yǒng', meaning: 'Vĩnh cửu (Chứa trọn vẹn 8 nét cơ bản Vĩnh Tự Bát Pháp)', strokeCount: 5, strokeOrder: '1. Chấm (丶) → 2. Ngang gập móc (𠃌) → 3. Hất (𠀁) → 4. Phẩy (丿) → 5. Mác (乀)', components: 'Độc thể tự', difficulty: 'Cơ bản', tags: ['Vĩnh Tự Bát Pháp', 'Kinh điển'] },
  { char: '学', phonetic: 'xué', meaning: 'Học tập / Tri thức (Học)', strokeCount: 8, strokeOrder: '1. Chấm → 2. Chấm → 3. Phẩy → 4. Chấm gập (宀) → 5. Móc gập cong → 6. Ngang (子)', components: '⺍ + 冖 + 子', difficulty: 'Cơ bản', tags: ['HSK 1', 'Giáo dục'] },
  { char: '爱', phonetic: 'ài', meaning: 'Tình yêu / Yêu thương (Ái)', strokeCount: 10, strokeOrder: '1. Phẩy → 2. Chấm → 3. Chấm → 4. Phẩy (爪) → 5. Mái che (冖) → 6-10. Bạn bè (友)', components: '爫 + 冖 + 友', difficulty: 'Trung cấp', tags: ['HSK 2', 'Tình cảm'] },
  { char: '中', phonetic: 'zhōng', meaning: 'Trung tâm / Ở giữa (Trung)', strokeCount: 4, strokeOrder: '1. Sổ trái → 2. Ngang gập phải → 3. Ngang đáy khép kín → 4. Sổ dọc xuyên thẳng giữa', components: '口 + 丨', difficulty: 'Cơ bản', tags: ['HSK 1', 'Địa lý'] },
  { char: '国', phonetic: 'guó', meaning: 'Đất nước / Quốc gia (Quốc)', strokeCount: 8, strokeOrder: '1. Sổ trái → 2. Ngang gập phải → 3-7. Viết chữ Ngọc (玉) bên trong → 8. Ngang đóng đáy', components: '囗 + 玉', difficulty: 'Trung cấp', tags: ['HSK 2', 'Đất nước'] },
  { char: '福', phonetic: 'fú', meaning: 'Hạnh phúc / May mắn / Phước lành (Phúc)', strokeCount: 13, strokeOrder: '1-4. Bộ Thị (礻) bên trái → 5. Ngang → 6-8. Bộ Khẩu (口) → 9-13. Bộ Điền (田) dưới cùng', components: '礻 + 一 + 口 + 田', difficulty: 'Nâng cao', tags: ['Văn hóa', 'Tết'] },
];

/* =========================================================================
 * 3. TIẾNG ANH (ALPHABET, CURSIVE & 4-LINE HANDWRITING)
 * ========================================================================= */
export const ENGLISH_HANDWRITING_RULES: StrokeOrderRule[] = [
  {
    title: '1. Quy tắc 4 Dòng Kẻ Tiêu Chuẩn (Four-Line Ruled Guidelines)',
    nativeTitle: 'Ascender Line, Waistline, Baseline & Descender Line',
    desc: 'Hệ thống 4 dòng kẻ giúp xác định chiều cao và độ cân đối hoàn hảo cho chữ cái Latin.',
    examples: [
      { char: 'Top Line (Ascender)', pinyinOrRomaja: 'Dòng trên cùng', meaning: 'Nơi vươn tới của các chữ hoa (A-Z) và các chữ thường có nét vươn cao (b, d, f, h, k, l, t)', breakdown: 'Chạm dòng 1 trên cùng' },
      { char: 'Mid Line (Waistline)', pinyinOrRomaja: 'Dòng kẻ giữa', meaning: 'Chiều cao chuẩn của phần thân chữ cái thường (a, c, e, m, n, o, r, s, u, v, w, x, z)', breakdown: 'Nằm giữa dòng 2 và dòng 3' },
      { char: 'Baseline', pinyinOrRomaja: 'Đường cơ sở', meaning: 'Đường kẻ chính nơi tất cả các chữ cái tựa chân lên (dòng kẻ thứ 3 từ trên xuống)', breakdown: 'Đáy của hầu hết chữ cái' },
      { char: 'Bottom Line (Descender)', pinyinOrRomaja: 'Dòng đuôi dưới', meaning: 'Nơi kéo dài xuống của các đuôi chữ thường (g, j, p, q, y)', breakdown: 'Kéo sâu xuống dòng kẻ thứ 4' },
    ],
  },
  {
    title: '2. Các Nét Cơ Bản Trong Viết Tay & Chữ Cursive (Basic Strokes)',
    nativeTitle: 'Fundamental Cursive & Print Movements',
    desc: 'Mọi chữ cái tiếng Anh đều được cấu thành từ 6 nét chuyển động cơ bản sau đây.',
    examples: [
      { char: 'Underturn', pinyinOrRomaja: 'Nét uốn đáy', meaning: 'Đi từ dòng giữa xuống đường cơ sở rồi lượn cong đáy đi lên (trong i, u, w, y)', breakdown: 'Xuống → Lượn đáy → Lên' },
      { char: 'Overturn', pinyinOrRomaja: 'Nét uốn vòm', meaning: 'Đi từ đường cơ sở vòm lên dòng giữa rồi kéo thẳng xuống (trong m, n, h, p)', breakdown: 'Vòm lên → Thẳng xuống' },
      { char: 'Oval', pinyinOrRomaja: 'Nét hình trứng khép kín', meaning: 'Nét tròn hình bầu dục ngược chiều kim đồng hồ (trong a, o, d, g, q, c)', breakdown: 'Tròn bầu dục khép kín' },
      { char: 'Ascender Loop', pinyinOrRomaja: 'Nét thắt vươn cao', meaning: 'Lượn chéo lên dòng trên cùng, tạo vòng thắt rồi kéo thẳng đứng xuống (trong l, b, h, k, f)', breakdown: 'Chéo lên → Thắt vòng → Sổ thẳng' },
      { char: 'Descender Loop', pinyinOrRomaja: 'Nét thắt đuôi dưới', meaning: 'Kéo thẳng xuống dòng đáy, tạo vòng thắt sang trái rồi hất chéo lên (trong g, j, y, z)', breakdown: 'Sổ xuống đáy → Thắt trái → Hất lên' },
    ],
  },
  {
    title: '3. Quy tắc Độ Nghiêng & Nối Nét Cursive (Slant & Letter Joining)',
    nativeTitle: 'Continuous Flow & Consistent 55° Angle',
    desc: 'Khi viết chữ Cursive liền mạch, giữ góc nghiêng ổn định khoảng 55 độ từ trái sang phải, không nhấc bút giữa các chữ cái trong cùng một từ.',
    examples: [
      { char: 'Góc nghiêng 55°', pinyinOrRomaja: 'Forward Slant', meaning: 'Nghiêng đều về phía trước tạo nhịp điệu thanh thoát tự nhiên', breakdown: 'Nghiêng 55° sang phải' },
      { char: 'Nối nét liền mạch', pinyinOrRomaja: 'Continuous Flow', meaning: 'Đuôi hất của chữ cái trước chính là nét mở đầu của chữ cái tiếp theo (ví dụ: c-a-t)', breakdown: 'Không nhấc bút giữa từ' },
      { char: 'Nét thanh nét đậm', pinyinOrRomaja: 'Pressure Dynamics', meaning: 'Đưa bút lên: nhẹ tay tạo nét thanh. Kéo bút xuống: nhấn nhẹ tạo nét đậm', breakdown: 'Lên thanh, Xuống đậm' },
    ],
  },
];

export const ENGLISH_ALPHABET_ITEMS: RadicalOrComponent[] = [
  { symbol: 'Aa', name: 'Letter A', pinyinOrRomaja: '/eɪ/ or /æ/', strokes: 3, meaning: 'Nguyên âm quan trọng nhất, hình tháp nhọn', sampleChars: ['Apple', 'Amazing', 'Art', 'Animal'], tips: 'Chữ in hoa: 2 nét xiên nhọn + 1 nét ngang nối giữa.' },
  { symbol: 'Bb', name: 'Letter B', pinyinOrRomaja: '/biː/ - /b/', strokes: 3, meaning: 'Phụ âm bật môi rung thanh quản', sampleChars: ['Book', 'Beautiful', 'Bright', 'Butterfly'], tips: 'Sổ đứng trái + 2 vòm tròn bên phải.' },
  { symbol: 'Cc', name: 'Letter C', pinyinOrRomaja: '/siː/ - /k/', strokes: 1, meaning: 'Nét cong hình trăng khuyết mở sang phải', sampleChars: ['Cat', 'Creative', 'Coffee', 'City'], tips: '1 nét cong liên tục ngược chiều kim đồng hồ.' },
  { symbol: 'Dd', name: 'Letter D', pinyinOrRomaja: '/diː/ - /d/', strokes: 2, meaning: 'Phụ âm đầu lưỡi chạm nướu răng', sampleChars: ['Dog', 'Dream', 'Design', 'Doctor'], tips: 'Sổ thẳng đứng + 1 vòm tròn lớn bên phải.' },
  { symbol: 'Ee', name: 'Letter E', pinyinOrRomaja: '/iː/ - /e/', strokes: 4, meaning: 'Nguyên âm phổ biến nhất trong tiếng Anh', sampleChars: ['Eagle', 'Energy', 'Explore', 'Earth'], tips: 'Sổ đứng + 3 nét ngang song song (trên, giữa, dưới).' },
  { symbol: 'Ff', name: 'Letter F', pinyinOrRomaja: '/ef/ - /f/', strokes: 3, meaning: 'Phụ âm cọ xát răng trên và môi dưới', sampleChars: ['Flower', 'Friend', 'Future', 'Freedom'], tips: 'Sổ đứng + 2 nét ngang (trên và giữa).' },
  { symbol: 'Gg', name: 'Letter G', pinyinOrRomaja: '/dʒiː/ - /ɡ/', strokes: 2, meaning: 'Âm cuống họng, chữ thường có đuôi descender', sampleChars: ['Great', 'Garden', 'Global', 'Guitar'], tips: 'Chữ in hoa: nét cong C thêm gạch ngang vào trong.' },
  { symbol: 'Hh', name: 'Letter H', pinyinOrRomaja: '/eɪtʃ/ - /h/', strokes: 3, meaning: 'Âm thở đẩy hơi từ cuống họng', sampleChars: ['Happy', 'Hope', 'Home', 'Harmony'], tips: '2 nét sổ đứng song song nối bởi nét ngang ở giữa.' },
  { symbol: 'Ii', name: 'Letter I', pinyinOrRomaja: '/aɪ/ - /ɪ/', strokes: 3, meaning: 'Nguyên âm đơn thanh mảnh, chữ thường có chấm trên đầu', sampleChars: ['Idea', 'Inspire', 'Island', 'Imagine'], tips: 'Sổ đứng giữa + 2 gạch ngang trên và dưới.' },
  { symbol: 'Jj', name: 'Letter J', pinyinOrRomaja: '/dʒeɪ/ - /dʒ/', strokes: 2, meaning: 'Âm vòm miệng, chữ thường có móc kéo sâu xuống dòng 4', sampleChars: ['Joy', 'Journey', 'Journal', 'Justice'], tips: 'Sổ xuống rồi lượn móc nhọn sang trái.' },
  { symbol: 'Kk', name: 'Letter K', pinyinOrRomaja: '/keɪ/ - /k/', strokes: 3, meaning: 'Âm tắc bật hơi mạnh', sampleChars: ['King', 'Kind', 'Knowledge', 'Key'], tips: 'Sổ đứng trái + 2 nét xiên chéo vào giữa.' },
  { symbol: 'Ll', name: 'Letter L', pinyinOrRomaja: '/el/ - /l/', strokes: 2, meaning: 'Âm cuộn lưỡi chạm nướu trên', sampleChars: ['Love', 'Life', 'Light', 'Language'], tips: 'Sổ đứng từ trên xuống bẻ góc ngang sang phải.' },
  { symbol: 'Mm', name: 'Letter M', pinyinOrRomaja: '/em/ - /m/', strokes: 4, meaning: 'Âm mũi khép môi đôi', sampleChars: ['Music', 'Morning', 'Master', 'Mountain'], tips: '2 sổ đứng 2 bên nối bởi chữ V ở giữa.' },
  { symbol: 'Nn', name: 'Letter N', pinyinOrRomaja: '/en/ - /n/', strokes: 3, meaning: 'Âm mũi đầu lưỡi', sampleChars: ['Nature', 'Night', 'Novel', 'Noble'], tips: '2 sổ đứng nối bởi nét xiên chéo từ trái sang phải.' },
  { symbol: 'Oo', name: 'Letter O', pinyinOrRomaja: '/əʊ/ - /ɒ/', strokes: 1, meaning: 'Nguyên âm tròn môi hoàn hảo', sampleChars: ['Open', 'Ocean', 'Opportunity', 'Original'], tips: '1 nét tròn hình oval khép kín.' },
  { symbol: 'Pp', name: 'Letter P', pinyinOrRomaja: '/piː/ - /p/', strokes: 2, meaning: 'Âm bật hơi nén môi không rung thanh', sampleChars: ['Peace', 'Passion', 'Power', 'Practice'], tips: 'Sổ đứng + 1 vòm tròn ở nửa trên bên phải.' },
];

export const ENGLISH_SAMPLE_PRACTICE: PracticeCharacter[] = [
  { char: 'Hello', phonetic: '/həˈloʊ/', meaning: 'Xin chào (Lời chào thân thiện)', strokeCount: 5, strokeOrder: 'H → e → l → l → o (Nối liền nét Cursive nhịp nhàng)', components: 'H + e + l + l + o', difficulty: 'Cơ bản', tags: ['Chào hỏi', 'Cơ bản'] },
  { char: 'English', phonetic: '/ˈɪŋ.ɡlɪʃ/', meaning: 'Tiếng Anh / Người Anh', strokeCount: 7, strokeOrder: 'E (in hoa) → n → g (đuôi descender) → l (vươn cao) → i (chấm) → s → h', components: 'E + n + g + l + i + s + h', difficulty: 'Trung cấp', tags: ['Ngôn ngữ'] },
  { char: 'Dream', phonetic: '/driːm/', meaning: 'Ước mơ / Giấc mơ', strokeCount: 5, strokeOrder: 'D (in hoa vươn cao) → r → e → a (oval) → m (2 vòm overturn)', components: 'D + r + e + a + m', difficulty: 'Cơ bản', tags: ['Cảm hứng'] },
  { char: 'Knowledge', phonetic: '/ˈnɒl.ɪdʒ/', meaning: 'Kiến thức / Tri thức', strokeCount: 9, strokeOrder: 'K → n → o → w → l → e → d → g → e (Chữ k âm câm, g kéo đuôi đáy)', components: 'K + n + o + w + l + e + d + g + e', difficulty: 'Nâng cao', tags: ['Học vấn'] },
];
