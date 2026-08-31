export interface NumberRuleItem {
  id: string;
  title: string;
  category: 'Hệ thống đếm' | 'Lượng từ' | 'Thời gian & Ngày tháng' | 'Tiền tệ & Đo lường' | 'Quy tắc đặc biệt';
  desc: string;
  formula?: string;
  examples: {
    numberOrExpression: string;
    reading: string;
    phonetic: string;
    meaning: string;
    note?: string;
  }[];
  warningOrTip?: string;
}

export interface CounterWord {
  symbol: string;
  pinyinOrRomaja: string;
  vietnameseMeaning: string;
  usedFor: string;
  examples: {
    amount: string;
    fullPhrase: string;
    reading: string;
    meaning: string;
  }[];
}

export interface NumberTableEntry {
  arabic: number | string;
  koreanSino?: string;
  koreanNative?: string;
  koreanRomaja?: string;
  chineseSimp?: string;
  chineseDaXie?: string;
  chinesePinyin?: string;
  englishCardinal?: string;
  englishOrdinal?: string;
  englishIpa?: string;
  note?: string;
}

/* =========================================================================
 * 1. TIẾNG HÀN: DỮ LIỆU SỐ & QUY TẮC ĐẾM (HÁN HÀN VS THUẦN HÀN)
 * ========================================================================= */
export const KOREAN_NUMBER_TABLE: NumberTableEntry[] = [
  { arabic: 0, koreanSino: '영 / 공 (零/空)', koreanNative: '-', koreanRomaja: 'yeong / gong', note: 'Số 0 dùng 공 cho số điện thoại, 영 cho toán/nhiệt độ' },
  { arabic: 1, koreanSino: '일 (一)', koreanNative: '하나 (한)', koreanRomaja: 'il / hana (han)', note: 'Gắn lượng từ biến thành 한 (ví dụ: 한 개)' },
  { arabic: 2, koreanSino: '이 (二)', koreanNative: '둘 (두)', koreanRomaja: 'i / dul (du)', note: 'Gắn lượng từ biến thành 두 (ví dụ: 두 명)' },
  { arabic: 3, koreanSino: '삼 (三)', koreanNative: '셋 (세)', koreanRomaja: 'sam / set (se)', note: 'Gắn lượng từ biến thành 세 (ví dụ: 세 시)' },
  { arabic: 4, koreanSino: '사 (四)', koreanNative: '넷 (네)', koreanRomaja: 'sa / net (ne)', note: 'Gắn lượng từ biến thành 네 (ví dụ: 네 권)' },
  { arabic: 5, koreanSino: '오 (五)', koreanNative: '다섯', koreanRomaja: 'o / daseot', note: 'Giữ nguyên khi ghép lượng từ (다섯 잔)' },
  { arabic: 6, koreanSino: '육 (六)', koreanNative: '여섯', koreanRomaja: 'yuk / yeoseot', note: '여섯 마리 (6 con vật)' },
  { arabic: 7, koreanSino: '칠 (七)', koreanNative: '일곱', koreanRomaja: 'chil / ilgop', note: '일곱 시 (7 giờ)' },
  { arabic: 8, koreanSino: '팔 (八)', koreanNative: '여덟', koreanRomaja: 'pal / yeodeol', note: '여덟 살 (8 tuổi) - phát âm 여덜' },
  { arabic: 9, koreanSino: '구 (九)', koreanNative: '아홉', koreanRomaja: 'gu / ahop', note: '아홉 개 (9 cái)' },
  { arabic: 10, koreanSino: '십 (十)', koreanNative: '열', koreanRomaja: 'sip / yeol', note: '열 명 (10 người)' },
  { arabic: 11, koreanSino: '십일', koreanNative: '열하나 (열한)', koreanRomaja: 'sibil / yeolhana (yeolhan)', note: '열한 시 (11 giờ)' },
  { arabic: 12, koreanSino: '십이', koreanNative: '열둘 (열두)', koreanRomaja: 'sibi / yeoldul (yeoldu)', note: '열두 달 (12 tháng)' },
  { arabic: 20, koreanSino: '이십', koreanNative: '스물 (스무)', koreanRomaja: 'isip / seumul (seumu)', note: 'Gắn lượng từ biến thành 스무 (스무 살 - 20 tuổi)' },
  { arabic: 30, koreanSino: '삼십', koreanNative: '서른', koreanRomaja: 'samsip / seoreun', note: '서른 살 (30 tuổi)' },
  { arabic: 40, koreanSino: '사십', koreanNative: '마흔', koreanRomaja: 'sasip / maheun', note: '마흔 명 (40 người)' },
  { arabic: 50, koreanSino: '오십', koreanNative: '쉰', koreanRomaja: 'osip / swin', note: '쉰 살 (50 tuổi)' },
  { arabic: 60, koreanSino: '육십', koreanNative: '예순', koreanRomaja: 'yuksip / yesun', note: '예순 (60 tuổi - lục tuần)' },
  { arabic: 70, koreanSino: '칠십', koreanNative: '일흔', koreanRomaja: 'chilsip / ilheun', note: '일흔 (70 tuổi - thất tuần)' },
  { arabic: 80, koreanSino: '팔십', koreanNative: '여든', koreanRomaja: 'palsip / yeodeun', note: '여든 (80 tuổi)' },
  { arabic: 90, koreanSino: '구십', koreanNative: '아흔', koreanRomaja: 'gusip / aheun', note: '아흔 (90 tuổi)' },
  { arabic: 100, koreanSino: '백 (百)', koreanNative: '(Dùng số Hán Hàn 백)', koreanRomaja: 'baek', note: 'Từ 100 trở lên người Hàn dùng số Hán-Hàn' },
  { arabic: 1000, koreanSino: '천 (千)', koreanNative: '-', koreanRomaja: 'cheon', note: '1,000 Won = 천 원' },
  { arabic: 10000, koreanSino: '만 (萬 - Vạn)', koreanNative: '-', koreanRomaja: 'man', note: 'Đơn vị cơ bản 4 số 0 trong tiếng Hàn' },
  { arabic: 100000000, koreanSino: '억 (億 - Ức)', koreanNative: '-', koreanRomaja: 'eok', note: '100 triệu (8 số 0)' },
  { arabic: 1000000000000, koreanSino: '조 (兆 - Triệu)', koreanNative: '-', koreanRomaja: 'jo', note: '1 nghìn tỷ (12 số 0)' },
];

export const KOREAN_NUMBER_RULES: NumberRuleItem[] = [
  {
    id: 'ko_sino_vs_native',
    title: 'Phân biệt Hệ số Hán-Hàn (Sino) & Thuần Hàn (Native)',
    category: 'Hệ thống đếm',
    desc: 'Tiếng Hàn sử dụng đồng thời 2 hệ thống số riêng biệt cho từng ngữ cảnh cụ thể.',
    formula: 'Số Hán-Hàn (일, 이, 삼...) vs Số Thuần Hàn (하나, 둘, 셋...)',
    examples: [
      { numberOrExpression: 'Hán Hàn (Sino-Korean)', reading: '일, 이, 삼, 사, 오, 육, 칠, 팔, 구, 십...', phonetic: 'il, i, sam, sa...', meaning: 'Dùng cho: Giá tiền (원), Ngày tháng năm (년/월/일), Phút/Giây (분/초), Số điện thoại, Số tầng (층), Số phòng (호), Phép toán, Cân nặng/Chiều cao/Đo lường' },
      { numberOrExpression: 'Thuần Hàn (Native Korean)', reading: '하나, 둘, 셋, 넷, 다섯, 여섯, 일곱...', phonetic: 'hana, dul, set, net...', meaning: 'Dùng cho: Đếm đồ vật/con người (개, 명, 마리), Tuổi tác (살), Số giờ trong ngày (시), Số lần (번), Số chai/ly (병/잔), Số quyển sách (권)' },
    ],
    warningOrTip: 'Từ 100 trở lên (백, 천, 만, 억), người Hàn hầu như chuyển hẳn sang dùng số Hán-Hàn vì số thuần Hàn cổ không còn thông dụng.',
  },
  {
    id: 'ko_native_mutation',
    title: 'Quy tắc Biến đổi Số Thuần Hàn khi gắn với Lượng từ',
    category: 'Quy tắc đặc biệt',
    desc: '5 số Thuần Hàn đầu tiên (1, 2, 3, 4, 20) sẽ bị rút gọn đuôi khi đứng trước danh từ chỉ đơn vị / lượng từ.',
    formula: '하나 → 한 / 둘 → 두 / 셋 → 세 / 넷 → 네 / 스물 → 스무',
    examples: [
      { numberOrExpression: '1 cái / 1 người', reading: '한 개 (han gae) / 한 명 (han myeong)', phonetic: 'han gae / han myeong', meaning: '하나 biến thành 한 (KHÔNG nói 하나 개)' },
      { numberOrExpression: '2 ly cà phê', reading: '커피 두 잔 (keopi du jan)', phonetic: 'keopi du jan', meaning: '둘 biến thành 두 (KHÔNG nói 둘 잔)' },
      { numberOrExpression: '3 cuốn sách', reading: '책 세 권 (chaek se gwon)', phonetic: 'chaek se gwon', meaning: '셋 biến thành 세 (KHÔNG nói 셋 권)' },
      { numberOrExpression: '4 con mèo', reading: '고양이 네 마리 (goyangi ne mari)', phonetic: 'goyangi ne mari', meaning: '넷 biến thành 네 (KHÔNG nói 넷 마리)' },
      { numberOrExpression: '20 tuổi', reading: '스무 살 (seumu sal)', phonetic: 'seumu sal', meaning: '스물 biến thành 스무 (KHÔNG nói 스물 살)' },
    ],
  },
  {
    id: 'ko_time_rule',
    title: 'Quy tắc Đọc Giờ & Phút: Kết hợp Thuần Hàn + Hán Hàn',
    category: 'Thời gian & Ngày tháng',
    desc: 'Trong cùng một câu nói về thời gian, Giờ (시) dùng số Thuần Hàn, còn Phút (분) & Giây (초) bắt buộc dùng số Hán Hàn.',
    formula: '[Số Thuần Hàn] + 시 (Giờ) + [Số Hán Hàn] + 분 (Phút)',
    examples: [
      { numberOrExpression: '3:25', reading: '세 시 이십오 분', phonetic: 'se si isibo bun', meaning: '3 giờ (Thuần Hàn: 세) 25 phút (Hán Hàn: 이십오)' },
      { numberOrExpression: '7:30', reading: '일곱 시 삼십 분 (hoặc 일곱 시 반)', phonetic: 'ilgop si samsip bun / ban', meaning: '7 giờ 30 phút (hoặc 7 giờ rưỡi)' },
      { numberOrExpression: '12:45', reading: '열두 시 사십오 분', phonetic: 'yeoldu si sasibo bun', meaning: '12 giờ 45 phút' },
    ],
    warningOrTip: 'Đặc biệt tháng 6 (유월 thay vì 육월) và tháng 10 (시월 thay vì 십월) bị rụng phụ âm dưới patchim khi đọc tên tháng!',
  },
  {
    id: 'ko_large_numbers',
    title: 'Quy tắc Đọc Số Lớn theo Hàng Vạn (만 - 10,000)',
    category: 'Tiền tệ & Đo lường',
    desc: 'Người Hàn Quốc phân tách đơn vị số lớn theo 4 chữ số (10,000 = 만, 100,000,000 = 억) thay vì 3 chữ số như phương Tây.',
    formula: 'X vạn Y nghìn Z trăm (만 → 천 → 백 → 십 → 일)',
    examples: [
      { numberOrExpression: '50,000 Won', reading: '오만 원 (5만 원)', phonetic: 'oman won', meaning: '5 vạn Won = 50 nghìn Won' },
      { numberOrExpression: '125,000 Won', reading: '십이만 오천 원 (12만 5천 원)', phonetic: 'sibiman ocheon won', meaning: '12 vạn 5 nghìn Won = 125 nghìn Won' },
      { numberOrExpression: '3,500,000 Won', reading: '삼백오십만 원 (350만 원)', phonetic: 'sambaegosipman won', meaning: '350 vạn Won = 3.5 triệu Won' },
      { numberOrExpression: '100,000,000 Won', reading: '일억 원 (1억 원)', phonetic: 'ireok won', meaning: '1 Ức Won = 100 triệu Won' },
    ],
  },
];

export const KOREAN_COUNTERS: CounterWord[] = [
  { symbol: '개 (Gae)', pinyinOrRomaja: 'gae', vietnameseMeaning: 'Cái, quả, chiếc (Lượng từ tổng quát)', usedFor: 'Đồ vật nói chung, hoa quả, đồ đạc nhỏ', examples: [{ amount: '3 quả táo', fullPhrase: '사과 세 개', reading: 'sagwa se gae', meaning: '3 quả táo' }, { amount: '5 cái bánh', fullPhrase: '빵 다섯 개', reading: 'ppang daseot gae', meaning: '5 cái bánh mì' }] },
  { symbol: '명 / 분 (Myeong / Bun)', pinyinOrRomaja: 'myeong / bun', vietnameseMeaning: 'Người / Vị (Kính ngữ)', usedFor: 'Đếm số lượng con người', examples: [{ amount: '4 người', fullPhrase: '친구 네 명', reading: 'chingu ne myeong', meaning: '4 người bạn' }, { amount: '2 vị khách', fullPhrase: '손님 두 분', reading: 'sonnim du bun', meaning: '2 vị khách quý (kính ngữ)' }] },
  { symbol: '마리 (Mari)', pinyinOrRomaja: 'mari', vietnameseMeaning: 'Con (Động vật)', usedFor: 'Đếm chó, mèo, chim, cá, động vật', examples: [{ amount: '1 con chó', fullPhrase: '강아지 한 마리', reading: 'gangaji han mari', meaning: '1 chú cún con' }, { amount: '2 con cá', fullPhrase: '물고기 두 마리', reading: 'mulgogi du mari', meaning: '2 con cá' }] },
  { symbol: '권 (Gwon)', pinyinOrRomaja: 'gwon', vietnameseMeaning: 'Quyển, cuốn', usedFor: 'Sách, vở, tạp chí, từ điển', examples: [{ amount: '2 cuốn sách', fullPhrase: '책 두 권', reading: 'chaek du gwon', meaning: '2 quyển sách' }] },
  { symbol: '잔 (Jan)', pinyinOrRomaja: 'jan', vietnameseMeaning: 'Cốc, ly, chén, tách', usedFor: 'Trà, cà phê, nước ngọt, bia rượu', examples: [{ amount: '1 ly cà phê', fullPhrase: '커피 한 잔', reading: 'keopi han jan', meaning: '1 ly cà phê' }, { amount: '3 chén rượu', fullPhrase: '소주 세 잔', reading: 'soju se jan', meaning: '3 chén soju' }] },
  { symbol: '병 (Byeong)', pinyinOrRomaja: 'byeong', vietnameseMeaning: 'Chai, bình', usedFor: 'Đồ uống đóng chai', examples: [{ amount: '2 chai bia', fullPhrase: '맥주 두 병', reading: 'maekju du byeong', meaning: '2 chai bia' }] },
  { symbol: '대 (Dae)', pinyinOrRomaja: 'dae', vietnameseMeaning: 'Chiếc, cái (Máy móc, phương tiện)', usedFor: 'Ô tô, xe máy, máy tính, điện thoại, tivi', examples: [{ amount: '1 chiếc ô tô', fullPhrase: '차 한 대', reading: 'cha han dae', meaning: '1 chiếc ô tô' }, { amount: '2 máy tính', fullPhrase: '컴퓨터 두 대', reading: 'keompyuteo du dae', meaning: '2 chiếc máy tính' }] },
  { symbol: '채 (Chae)', pinyinOrRomaja: 'chae', vietnameseMeaning: 'Ngôi, căn (Nhà)', usedFor: 'Nhà cửa, biệt thự, tòa nhà', examples: [{ amount: '1 căn nhà', fullPhrase: '집 한 채', reading: 'jip han chae', meaning: '1 căn nhà' }] },
  { symbol: '장 (Jang)', pinyinOrRomaja: 'jang', vietnameseMeaning: 'Tờ, tấm, lá, vé', usedFor: 'Giấy tờ, vé xem phim, ảnh chụp, thẻ', examples: [{ amount: '2 vé xem phim', fullPhrase: '영화표 두 장', reading: 'yeonghwapyo du jang', meaning: '2 tấm vé xem phim' }] },
  { symbol: '켤레 (Kyeolle)', pinyinOrRomaja: 'kyeolle', vietnameseMeaning: 'Đôi (Giày, tất, găng tay)', usedFor: 'Đồ vật có cặp đi liền đôi', examples: [{ amount: '1 đôi giày', fullPhrase: '신발 한 켤레', reading: 'sinbal han kyeolle', meaning: '1 đôi giày' }, { amount: '3 đôi tất', fullPhrase: '양말 세 켤레', reading: 'yangmal se kyeolle', meaning: '3 đôi tất' }] },
  { symbol: '송이 (Song-i)', pinyinOrRomaja: 'song-i', vietnameseMeaning: 'Bông, cành, chùm', usedFor: 'Bông hoa, chùm nho, chùm chuối', examples: [{ amount: '1 bông hồng', fullPhrase: '장미 한 송이', reading: 'jangmi han song-i', meaning: '1 bông hoa hồng' }] },
  { symbol: '벌 (Beol)', pinyinOrRomaja: 'beol', vietnameseMeaning: 'Bộ (Quần áo)', usedFor: 'Trang phục, vest, váy đầm', examples: [{ amount: '2 bộ đồ', fullPhrase: '옷 두 벌', reading: 'ot du beol', meaning: '2 bộ quần áo' }] },
  { symbol: '살 (Sal)', pinyinOrRomaja: 'sal', vietnameseMeaning: 'Tuổi (Đếm tuổi)', usedFor: 'Đếm tuổi bằng số Thuần Hàn (Kính ngữ dùng 연세)', examples: [{ amount: '25 tuổi', fullPhrase: '스물다섯 살', reading: 'seumuldaseot sal', meaning: '25 tuổi' }] },
  { symbol: '번 (Beon) / 번째', pinyinOrRomaja: 'beon / beonjjae', vietnameseMeaning: 'Lần / Thứ tự (Lần thứ N)', usedFor: 'Đếm số lượt hoặc thứ tự', examples: [{ amount: '3 lần', fullPhrase: '세 번', reading: 'se beon', meaning: '3 lần' }, { amount: 'Lần đầu tiên', fullPhrase: '첫 번째', reading: 'cheot beonjjae', meaning: 'Lần thứ nhất / Đầu tiên' }] },
];

/* =========================================================================
 * 2. TIẾNG TRUNG: DỮ LIỆU SỐ & QUY TẮC ĐẾM (LƯỢNG TỪ & ĐẠI TẢ TÀI CHÍNH)
 * ========================================================================= */
export const CHINESE_NUMBER_TABLE: NumberTableEntry[] = [
  { arabic: 0, chineseSimp: '零 (líng)', chineseDaXie: '零', chinesePinyin: 'líng', note: 'Chữ số 0 dùng trong toán học, điện thoại, năm' },
  { arabic: 1, chineseSimp: '一 (yī)', chineseDaXie: '壹', chinesePinyin: 'yī (đọc yāo trong số điện thoại)', note: 'Khi đọc số ĐT/phòng đọc là yāo (幺)' },
  { arabic: 2, chineseSimp: '二 (èr) / 两 (liǎng)', chineseDaXie: '贰', chinesePinyin: 'èr / liǎng', note: 'Đếm số lượng trước lượng từ dùng 两 (liǎng)' },
  { arabic: 3, chineseSimp: '三 (sān)', chineseDaXie: '叁', chinesePinyin: 'sān', note: 'Số 3' },
  { arabic: 4, chineseSimp: '四 (sì)', chineseDaXie: '肆', chinesePinyin: 'sì', note: 'Số 4 (thanh 4)' },
  { arabic: 5, chineseSimp: '五 (wǔ)', chineseDaXie: '伍', chinesePinyin: 'wǔ', note: 'Số 5 (thanh 3)' },
  { arabic: 6, chineseSimp: '六 (liù)', chineseDaXie: '陆', chinesePinyin: 'liù', note: 'Số 6 (biểu tượng may mắn, thuận buồm xuôi gió)' },
  { arabic: 7, chineseSimp: '七 (qī)', chineseDaXie: '柒', chinesePinyin: 'qī', note: 'Số 7' },
  { arabic: 8, chineseSimp: '八 (bā)', chineseDaXie: '捌', chinesePinyin: 'bā', note: 'Số 8 (phát tài - Phát 发 fā đồng âm với Bát 八 bā)' },
  { arabic: 9, chineseSimp: '九 (jiǔ)', chineseDaXie: '玖', chinesePinyin: 'jiǔ', note: 'Số 9 (trường tồn - Cửu 久 jiǔ)' },
  { arabic: 10, chineseSimp: '十 (shí)', chineseDaXie: '拾', chinesePinyin: 'shí', note: 'Số 10' },
  { arabic: 11, chineseSimp: '十一 (shíyī)', chineseDaXie: '拾壹', chinesePinyin: 'shíyī', note: '11' },
  { arabic: 20, chineseSimp: '二十 (èrshí)', chineseDaXie: '贰拾', chinesePinyin: 'èrshí (khẩu ngữ: 廿 niàn)', note: '20' },
  { arabic: 100, chineseSimp: '一百 (yìbǎi)', chineseDaXie: '壹佰', chinesePinyin: 'yìbǎi', note: '100' },
  { arabic: 1000, chineseSimp: '一千 (yìqiān)', chineseDaXie: '壹仟', chinesePinyin: 'yìqiān', note: '1,000' },
  { arabic: 10000, chineseSimp: '一万 (yíwàn)', chineseDaXie: '壹万', chinesePinyin: 'yíwàn (Vạn)', note: 'Đơn vị 4 chữ số 0 cốt lõi trong tiếng Trung' },
  { arabic: 100000, chineseSimp: '十万 (shíwàn)', chineseDaXie: '拾万', chinesePinyin: 'shíwàn', note: '10 vạn = 100 nghìn' },
  { arabic: 1000000, chineseSimp: '一百万 (yìbǎiwàn)', chineseDaXie: '壹佰万', chinesePinyin: 'yìbǎiwàn', note: '100 vạn = 1 triệu' },
  { arabic: 10000000, chineseSimp: '一千万 (yìqiānwàn)', chineseDaXie: '壹仟万', chinesePinyin: 'yìqiānwàn', note: '1,000 vạn = 10 triệu' },
  { arabic: 100000000, chineseSimp: '一亿 (yíyì)', chineseDaXie: '壹亿', chinesePinyin: 'yíyì (Ức)', note: '1 Ức = 100 triệu (8 số 0)' },
];

export const CHINESE_NUMBER_RULES: NumberRuleItem[] = [
  {
    id: 'zh_er_vs_liang',
    title: 'Quy tắc Vàng: Phân biệt 二 (Èr) & 两 (Liǎng)',
    category: 'Hệ thống đếm',
    desc: 'Cả hai đều có nghĩa là 2, nhưng ngữ pháp tiếng Trung phân định cực kỳ nghiêm ngặt trường hợp sử dụng.',
    formula: '二 (Số đếm/thứ tự/toán học) vs 两 (Đếm số lượng trước Lượng từ / 200 / 2000 / 2 vạn)',
    examples: [
      { numberOrExpression: 'Trước lượng từ (Bắt buộc dùng 两)', reading: '两个人 (liǎng gè rén) / 两本书 (liǎng běn shū)', phonetic: 'liǎng gè rén / liǎng běn shū', meaning: '2 người / 2 quyển sách (TUYỆT ĐỐI KHÔNG dùng 二个人)' },
      { numberOrExpression: 'Số thứ tự & Phép đếm (Dùng 二)', reading: '第一, 第二 (dì-èr) / 一二三四 / 二楼 (èr lóu)', phonetic: 'dì-èr / èr lóu', meaning: 'Thứ hai / 1, 2, 3, 4 / Tầng 2 / Số phòng 202 (èr líng èr)' },
      { numberOrExpression: 'Hàng trăm, hàng nghìn (Có thể dùng cả hai)', reading: '两百 / 二百 (liǎngbǎi / èrbǎi) & 两千 (liǎngqiān)', phonetic: 'liǎngbǎi / liǎngqiān', meaning: '200 có thể dùng cả 2, nhưng 2000 và 20,000 thì thường chuộng 两 (两千, 两万)' },
      { numberOrExpression: 'Số mười hai, hai mươi (Bắt buộc dùng 二)', reading: '十二 (shí\'èr) / 二十 (èrshí) / 二十二 (èrshí\'èr)', phonetic: 'shí\'èr / èrshí', meaning: 'Trong hàng chục không bao giờ dùng 两 (KHÔNG nói 两十)' },
    ],
    warningOrTip: 'Mẹo nhớ nhanh: Đếm số lượng cụ thể của đồ vật/con người đi kèm lượng từ → Luôn chọn 两 (Liǎng)!',
  },
  {
    id: 'zh_zero_rule',
    title: 'Quy tắc Đọc Số 0 (零 - Líng) ở giữa và cuối số',
    category: 'Quy tắc đặc biệt',
    desc: 'Quy tắc đọc số 0 trong các chữ số lớn của tiếng Trung.',
    formula: 'Nhiều số 0 liên tiếp ở giữa → Chỉ đọc 1 chữ 零. Số 0 ở tận cùng → Không đọc 零.',
    examples: [
      { numberOrExpression: '105', reading: '一百零五 (yì bǎi líng wǔ)', phonetic: 'yì bǎi líng wǔ', meaning: 'Có 1 số 0 ở giữa → Bắt buộc phải đọc 零' },
      { numberOrExpression: '1005', reading: '一千零五 (yì qiān líng wǔ)', phonetic: 'yì qiān líng wǔ', meaning: 'Có 2 số 0 liên tiếp ở giữa → Chỉ đọc đúng MỘT chữ 零' },
      { numberOrExpression: '150', reading: '一百五 (yì bǎi wǔ) hoặc 一百五十', phonetic: 'yì bǎi wǔ / yì bǎi wǔshí', meaning: 'Số 0 ở cuối cùng không đọc 零' },
      { numberOrExpression: '10,008', reading: '一万零八 (yí wàn líng bā)', phonetic: 'yí wàn líng bā', meaning: '3 số 0 ở giữa vẫn chỉ đọc 1 chữ 零' },
    ],
  },
  {
    id: 'zh_phone_and_dates',
    title: 'Đọc Số Điện Thoại (幺 - Yāo) & Ngày Tháng Phân Số',
    category: 'Thời gian & Ngày tháng',
    desc: 'Trong số điện thoại, biển số xe và số phòng, số 1 thường được đọc là yāo (幺) để tránh nhầm lẫn âm thanh với số 7 (qī).',
    formula: '1 → yāo trong số liên lạc. Phân số: Mẫu số + 分之 + Tử số.',
    examples: [
      { numberOrExpression: 'Phòng 118', reading: '幺幺八号房 (yāo yāo bā hào fáng)', phonetic: 'yāo yāo bā hào fáng', meaning: 'Phòng 118 (đọc 2 số 1 là yāo)' },
      { numberOrExpression: '1/3 (Phân số)', reading: '三分之一 (sān fēn zhī yī)', phonetic: 'sān fēn zhī yī', meaning: 'Một phần ba (Đọc mẫu số 3 trước → phân chi → tử số 1 sau)' },
      { numberOrExpression: '50% (Phần trăm)', reading: '百分之五十 (bǎi fēn zhī wǔshí)', phonetic: 'bǎi fēn zhī wǔshí', meaning: 'Năm mươi phần trăm' },
      { numberOrExpression: 'Thứ Hai đến Chủ Nhật', reading: '星期一 (Thứ 2) ... 星期六 (Thứ 7) / 星期天 (Chủ nhật)', phonetic: 'xīngqīyī ... xīngqītiān', meaning: 'Tiếng Trung gọi Thứ 2 là 星期一 (Tuần ngày 1), Thứ 3 là 星期二...' },
    ],
  },
  {
    id: 'zh_financial_daxie',
    title: 'Chữ số Đại Tả Tài Chính (大写数字) trong Ngân hàng & Hóa đơn',
    category: 'Tiền tệ & Đo lường',
    desc: 'Để chống sửa đổi gian lận trên séc ngân hàng và hợp đồng, người Trung Quốc bắt buộc dùng hệ chữ số Đại Tả nét phức tạp.',
    formula: '壹, 贰, 叁, 肆, 伍, 陆, 柒, 捌, 玖, 拾, 佰, 仟, 万, 亿',
    examples: [
      { numberOrExpression: '¥ 3,500', reading: '叁仟伍佰元整 (sānqiān wǔbǎi yuán zhěng)', phonetic: 'sānqiān wǔbǎi yuán zhěng', meaning: '3 nghìn 5 trăm tệ chẵn (viết bằng chữ đại tả)' },
      { numberOrExpression: '¥ 10,000', reading: '壹万元整 (yíwàn yuán zhěng)', phonetic: 'yíwàn yuán zhěng', meaning: '1 vạn tệ chẵn' },
    ],
  },
];

export const CHINESE_COUNTERS: CounterWord[] = [
  { symbol: '个 (Gè)', pinyinOrRomaja: 'gè', vietnameseMeaning: 'Cái, người, quả (Lượng từ vạn năng phổ biến nhất)', usedFor: 'Người, đồ vật trừu tượng, hoa quả nói chung', examples: [{ amount: '3 người', fullPhrase: '三个人', reading: 'sān gè rén', meaning: '3 người' }, { amount: '1 quả táo', fullPhrase: '一个苹果', reading: 'yí gè píngguǒ', meaning: '1 quả táo' }] },
  { symbol: '本 (Běn)', pinyinOrRomaja: 'běn', vietnameseMeaning: 'Quyển, cuốn, bản', usedFor: 'Sách, vở, tạp chí, từ điển, album ảnh', examples: [{ amount: '2 cuốn sách', fullPhrase: '两本书', reading: 'liǎng běn shū', meaning: '2 quyển sách' }, { amount: '1 cuốn từ điển', fullPhrase: '一本词典', reading: 'yì běn cídiǎn', meaning: '1 cuốn từ điển' }] },
  { symbol: '张 (Zhāng)', pinyinOrRomaja: 'zhāng', vietnameseMeaning: 'Tờ, tấm, chiếc (Mặt phẳng hoặc có thể mở rộng)', usedFor: 'Giấy, vé, ảnh, bàn, giường, cung tên, miệng', examples: [{ amount: '1 tờ giấy', fullPhrase: '一张纸', reading: 'yì zhāng zhǐ', meaning: '1 tờ giấy' }, { amount: '2 vé xem phim', fullPhrase: '两张电影票', reading: 'liǎng zhāng diànyǐng piào', meaning: '2 vé xem phim' }, { amount: '1 cái bàn', fullPhrase: '一张桌子', reading: 'yì zhāng zhuōzi', meaning: '1 chiếc bàn' }] },
  { symbol: '支 / 只 (Zhī)', pinyinOrRomaja: 'zhī', vietnameseMeaning: 'Cây, chiếc / Con (Động vật hoặc 1 bên của cặp đôi)', usedFor: 'Bút, súng, bài hát (支); Động vật nhỏ, 1 chiếc giày/tất/tay/mắt (只)', examples: [{ amount: '1 cây bút', fullPhrase: '一支笔', reading: 'yì zhī bǐ', meaning: '1 chiếc bút' }, { amount: '2 con mèo', fullPhrase: '两只猫', reading: 'liǎng zhī māo', meaning: '2 con mèo' }, { amount: '1 con mắt', fullPhrase: '一只眼睛', reading: 'yì zhī yǎnjīng', meaning: '1 bên mắt' }] },
  { symbol: '条 (Tiáo)', pinyinOrRomaja: 'tiáo', vietnameseMeaning: 'Con, sợi, con đường, chiếc (Vật thon dài, uốn lượn)', usedFor: 'Cá, rắn, rồng, sông ngòi, đường xá, quần, khăn choàng', examples: [{ amount: '1 con cá', fullPhrase: '一条鱼', reading: 'yì tiáo yú', meaning: '1 con cá' }, { amount: '2 cái quần', fullPhrase: '两条裤子', reading: 'liǎng tiáo kùzi', meaning: '2 chiếc quần' }, { amount: '1 con đường', fullPhrase: '一条路', reading: 'yì tiáo lù', meaning: '1 con đường' }] },
  { symbol: '辆 (Liàng)', pinyinOrRomaja: 'liàng', vietnameseMeaning: 'Chiếc, cỗ (Xe cộ có bánh)', usedFor: 'Ô tô, xe đạp, xe máy, xe buýt', examples: [{ amount: '1 chiếc xe hơi', fullPhrase: '一辆汽车', reading: 'yí liàng qìchē', meaning: '1 chiếc xe hơi' }, { amount: '2 chiếc xe đạp', fullPhrase: '两辆自行车', reading: 'liǎng liàng zìxíngchē', meaning: '2 chiếc xe đạp' }] },
  { symbol: '件 (Jiàn)', pinyinOrRomaja: 'jiàn', vietnameseMeaning: 'Chiếc, cái, vụ, việc (Áo, hành lý, sự việc)', usedFor: 'Áo quần (thân trên), quà tặng, sự việc, hành lý', examples: [{ amount: '1 chiếc áo', fullPhrase: '一件衣服', reading: 'yí jiàn yīfu', meaning: '1 chiếc áo' }, { amount: '1 món quà', fullPhrase: '一件礼物', reading: 'yí jiàn lǐwù', meaning: '1 món quà' }, { amount: '1 sự việc', fullPhrase: '一件事', reading: 'yí jiàn shì', meaning: '1 việc' }] },
  { symbol: '杯 / 瓶 (Bēi / Píng)', pinyinOrRomaja: 'bēi / píng', vietnameseMeaning: 'Ly, tách, cốc / Chai, bình', usedFor: 'Đồ uống lỏng', examples: [{ amount: '1 tách trà', fullPhrase: '一杯茶', reading: 'yì bēi chá', meaning: '1 tách trà' }, { amount: '2 chai bia', fullPhrase: '两瓶啤酒', reading: 'liǎng píng píjiǔ', meaning: '2 chai bia' }] },
  { symbol: '双 (Shuāng)', pinyinOrRomaja: 'shuāng', vietnameseMeaning: 'Đôi, cặp', usedFor: 'Đũa, giày dép, tất, găng tay, bàn tay', examples: [{ amount: '1 đôi đũa', fullPhrase: '一双筷子', reading: 'yì shuāng kuàizi', meaning: '1 đôi đũa' }, { amount: '1 đôi giày', fullPhrase: '一双鞋', reading: 'yì shuāng xié', meaning: '1 đôi giày' }] },
  { symbol: '位 (Wèi)', pinyinOrRomaja: 'wèi', vietnameseMeaning: 'Vị (Kính ngữ chỉ người trang trọng)', usedFor: 'Thầy cô, khách hàng, bác sĩ, chuyên gia', examples: [{ amount: '1 vị giáo viên', fullPhrase: '一位老师', reading: 'yí wèi lǎoshī', meaning: '1 vị thầy giáo' }, { amount: '3 vị khách', fullPhrase: '三位客人', reading: 'sān wèi kèrén', meaning: '3 vị khách quý' }] },
  { symbol: '块 (Kuài)', pinyinOrRomaja: 'kuài', vietnameseMeaning: 'Miếng, cục, khối / Đồng tệ (Khẩu ngữ tiền)', usedFor: 'Bánh ngọt, xà phòng, đá, thịt, đồng tiền tệ', examples: [{ amount: '1 miếng bánh', fullPhrase: '一块蛋糕', reading: 'yí kuài dàngāo', meaning: '1 miếng bánh kem' }, { amount: '10 tệ (đồng)', fullPhrase: '十块钱', reading: 'shí kuài qián', meaning: '10 đồng (tệ)' }] },
  { symbol: '台 (Tái)', pinyinOrRomaja: 'tái', vietnameseMeaning: 'Chiếc, máy (Thiết bị điện tử, máy móc, sân khấu)', usedFor: 'Tivi, máy tính, tủ lạnh, điều hòa', examples: [{ amount: '1 máy tính', fullPhrase: '一台电脑', reading: 'yì tái diànnǎo', meaning: '1 chiếc máy tính' }] },
];

/* =========================================================================
 * 3. TIẾNG ANH: DỮ LIỆU SỐ & QUY TẮC ĐẾM (CARDINAL, ORDINAL, FRACTIONS & PARTITIVES)
 * ========================================================================= */
export const ENGLISH_NUMBER_TABLE: NumberTableEntry[] = [
  { arabic: 0, englishCardinal: 'Zero (hoặc Oh, Nil, Love)', englishOrdinal: 'Zeroth', englishIpa: '/ˈzɪə.rəʊ/', note: 'Oh trong số ĐT/năm; Nil trong bóng đá; Love trong quần vợt' },
  { arabic: 1, englishCardinal: 'One', englishOrdinal: '1st (First)', englishIpa: '/wʌn/ - /fɜːst/', note: 'Đuôi -st' },
  { arabic: 2, englishCardinal: 'Two', englishOrdinal: '2nd (Second)', englishIpa: '/tuː/ - /ˈsek.ənd/', note: 'Đuôi -nd' },
  { arabic: 3, englishCardinal: 'Three', englishOrdinal: '3rd (Third)', englishIpa: '/θriː/ - /θɜːd/', note: 'Đuôi -rd' },
  { arabic: 4, englishCardinal: 'Four', englishOrdinal: '4th (Fourth)', englishIpa: '/fɔːr/ - /fɔːθ/', note: 'Bắt đầu dùng đuôi -th' },
  { arabic: 5, englishCardinal: 'Five', englishOrdinal: '5th (Fifth)', englishIpa: '/faɪv/ - /fɪfθ/', note: 'Biến đổi five → fifth' },
  { arabic: 6, englishCardinal: 'Six', englishOrdinal: '6th (Sixth)', englishIpa: '/sɪks/ - /sɪksθ/', note: '6th' },
  { arabic: 7, englishCardinal: 'Seven', englishOrdinal: '7th (Seventh)', englishIpa: '/ˈsev.ən/ - /ˈsev.ənθ/', note: '7th' },
  { arabic: 8, englishCardinal: 'Eight', englishOrdinal: '8th (Eighth)', englishIpa: '/eɪt/ - /eɪtθ/', note: 'Chỉ thêm h (eighth)' },
  { arabic: 9, englishCardinal: 'Nine', englishOrdinal: '9th (Ninth)', englishIpa: '/naɪn/ - /naɪnθ/', note: 'Bỏ chữ e (ninth)' },
  { arabic: 10, englishCardinal: 'Ten', englishOrdinal: '10th (Tenth)', englishIpa: '/ten/ - /tenθ/', note: '10th' },
  { arabic: 11, englishCardinal: 'Eleven', englishOrdinal: '11th (Eleventh)', englishIpa: '/ɪˈlev.ən/', note: '11th' },
  { arabic: 12, englishCardinal: 'Twelve', englishOrdinal: '12th (Twelfth)', englishIpa: '/twelv/ - /twelfθ/', note: 'Biến ve → f (twelfth)' },
  { arabic: 13, englishCardinal: 'Thirteen', englishOrdinal: '13th (Thirteenth)', englishIpa: '/ˌθɜːˈtiːn/', note: 'Đuôi -teen' },
  { arabic: 20, englishCardinal: 'Twenty', englishOrdinal: '20th (Twentieth)', englishIpa: '/ˈtwen.ti/ - /ˈtwen.ti.əθ/', note: 'Đuôi -y đổi thành -ieth' },
  { arabic: 21, englishCardinal: 'Twenty-one', englishOrdinal: '21st (Twenty-first)', englishIpa: '/ˌtwen.ti ˈwʌn/', note: 'Bắt buộc có dấu gạch nối (-)' },
  { arabic: 30, englishCardinal: 'Thirty', englishOrdinal: '30th (Thirtieth)', englishIpa: '/ˈθɜː.ti/', note: '30th' },
  { arabic: 50, englishCardinal: 'Fifty', englishOrdinal: '50th (Fiftieth)', englishIpa: '/ˈfɪf.ti/', note: '50th' },
  { arabic: 100, englishCardinal: 'One hundred', englishOrdinal: '100th (Hundredth)', englishIpa: '/wʌn ˈhʌn.drəd/', note: '100' },
  { arabic: 1000, englishCardinal: 'One thousand', englishOrdinal: '1,000th (Thousandth)', englishIpa: '/wʌn ˈθaʊ.zənd/', note: '1,000' },
  { arabic: 1000000, englishCardinal: 'One million', englishOrdinal: '1,000,000th (Millionth)', englishIpa: '/wʌn ˈmɪl.jən/', note: '1,000,000 (Triệu)' },
  { arabic: 1000000000, englishCardinal: 'One billion', englishOrdinal: '1,000,000,000th (Billionth)', englishIpa: '/wʌn ˈbɪl.jən/', note: '1,000,000,000 (Tỷ)' },
];

export const ENGLISH_NUMBER_RULES: NumberRuleItem[] = [
  {
    id: 'en_cardinal_vs_ordinal',
    title: 'Số đếm (Cardinal) vs Số thứ tự (Ordinal Numbers)',
    category: 'Hệ thống đếm',
    desc: 'Số đếm dùng để chỉ số lượng đồ vật, còn số thứ tự dùng cho ngày trong tháng, thứ hạng, tầng lầu, và thế kỷ.',
    formula: 'Cardinal (1, 2, 3...) vs Ordinal (1st, 2nd, 3rd, 4th...)',
    examples: [
      { numberOrExpression: 'Số lượng (Cardinal)', reading: 'I have three dogs and two cats.', phonetic: '/θriː dɒɡz/', meaning: 'Tôi có 3 chú chó và 2 chú mèo (Đếm số lượng)' },
      { numberOrExpression: 'Thứ tự & Ngày tháng (Ordinal)', reading: 'He finished in 1st place on March 3rd.', phonetic: '/fɜːst pleɪs ɒn mɑːtʃ θɜːd/', meaning: 'Anh ấy về đích ở vị trí thứ nhất vào ngày 3 tháng 3' },
      { numberOrExpression: 'Thế kỷ & Tầng nhà', reading: 'The 21st century / On the 5th floor', phonetic: '/ˌtwen.ti ˈfɜːst ˈsen.tʃər.i/', meaning: 'Thế kỷ 21 / Ở tầng 5' },
    ],
    warningOrTip: 'Quy tắc dấu gạch nối: Mọi số đếm và số thứ tự ghép từ 21 đến 99 bắt buộc phải có dấu gạch nối hyphen (twenty-one, ninety-ninth).',
  },
  {
    id: 'en_reading_years_dates',
    title: 'Quy tắc Đọc Năm, Giờ giấc & Số điện thoại',
    category: 'Thời gian & Ngày tháng',
    desc: 'Quy tắc ngắt đôi chữ số khi đọc năm và cách diễn đạt giờ quốc tế.',
    formula: 'Năm: Tách 2 số đầu + 2 số cuối (1998 = nineteen ninety-eight). Giờ: Past (hơn) / To (kém).',
    examples: [
      { numberOrExpression: 'Năm 1995', reading: 'Nineteen ninety-five (19 + 95)', phonetic: '/ˌnaɪn.tiːn ˌnaɪn.ti ˈfaɪv/', meaning: 'Năm 1995' },
      { numberOrExpression: 'Năm 2026', reading: 'Twenty twenty-six (hoặc Two thousand and twenty-six)', phonetic: '/ˌtwen.ti ˌtwen.ti ˈsɪks/', meaning: 'Năm 2026' },
      { numberOrExpression: 'Năm 2008', reading: 'Two thousand and eight', phonetic: '/tuː ˈθaʊ.zənd ænd eɪt/', meaning: 'Năm 2008' },
      { numberOrExpression: '10:15', reading: 'Quarter past ten (hoặc Ten fifteen)', phonetic: '/ˈkwɔː.tər pɑːst ten/', meaning: '10 giờ 15 phút' },
      { numberOrExpression: '10:45', reading: 'Quarter to eleven (hoặc Ten forty-five)', phonetic: '/ˈkwɔː.tər tu ɪˈlev.ən/', meaning: '11 giờ kém 15' },
      { numberOrExpression: '090-1234-5678', reading: 'Oh nine oh, one two three four, five six seven eight', phonetic: '/əʊ naɪn əʊ.../', meaning: 'Số 0 trong số điện thoại thường đọc là "Oh"' },
    ],
  },
  {
    id: 'en_fractions_and_decimals',
    title: 'Cách đọc Phân số (Fractions) & Số thập phân (Decimals)',
    category: 'Quy tắc đặc biệt',
    desc: 'Phân số đọc Tử số bằng Số đếm (Cardinal) + Mẫu số bằng Số thứ tự (Ordinal). Số thập phân dùng chữ "Point".',
    formula: 'Tử số (Số đếm) / Mẫu số (Số thứ tự - nếu tử > 1 thì mẫu thêm s). Thập phân: X point Y Z.',
    examples: [
      { numberOrExpression: '1/2', reading: 'A half / One-half', phonetic: '/ə hɑːf/', meaning: 'Một nửa / Một phần hai' },
      { numberOrExpression: '1/4', reading: 'A quarter / One-fourth', phonetic: '/ə ˈkwɔː.tər/', meaning: 'Một phần tư' },
      { numberOrExpression: '3/4', reading: 'Three-quarters / Three-fourths', phonetic: '/θriː ˈkwɔː.təz/', meaning: 'Ba phần tư (Tử số là 3 > 1 nên quarters thêm s)' },
      { numberOrExpression: '2/5', reading: 'Two-fifths', phonetic: '/tuː fɪfθs/', meaning: 'Hai phần năm' },
      { numberOrExpression: '3.1415', reading: 'Three point one four one five', phonetic: '/θriː pɔɪnt wʌn fɔː wʌn faɪv/', meaning: 'Sau dấu point, đọc từng chữ số rời rạc' },
      { numberOrExpression: '75%', reading: 'Seventy-five percent', phonetic: '/ˌsev.ən.ti faɪv pəˈsent/', meaning: '75 phần trăm' },
    ],
  },
  {
    id: 'en_currency_and_scores',
    title: 'Cách đọc Tiền tệ ($ £ €) & Tỷ số thể thao',
    category: 'Tiền tệ & Đo lường',
    desc: 'Đọc tiền tệ chuẩn bản xứ và các biến thể của số 0 trong thể thao.',
    formula: '$19.99 = Nineteen dollars and ninety-nine cents (hoặc Nineteen ninety-nine).',
    examples: [
      { numberOrExpression: '$4.50', reading: 'Four dollars and fifty cents (hoặc Four fifty)', phonetic: '/fɔː ˈdɒl.əz ænd ˈfɪf.ti sents/', meaning: '4 đô la 50 xu' },
      { numberOrExpression: '£25.00', reading: 'Twenty-five pounds', phonetic: '/ˌtwen.ti faɪv paʊndz/', meaning: '25 bảng Anh' },
      { numberOrExpression: 'Tỷ số bóng đá 2 - 0', reading: 'Two - Nil', phonetic: '/tuː nɪl/', meaning: '2 - 0 (Số 0 trong bóng đá đọc là Nil)' },
      { numberOrExpression: 'Tỷ số quần vợt 40 - 0', reading: 'Forty - Love', phonetic: '/ˈfɔː.ti lʌv/', meaning: '40 - 0 (Số 0 trong Tennis đọc là Love)' },
      { numberOrExpression: 'Nhiệt độ -5°C', reading: 'Five degrees below zero (hoặc Minus five degrees)', phonetic: '/faɪv dɪˈɡriːz bɪˈləʊ ˈzɪə.rəʊ/', meaning: 'Âm 5 độ C' },
    ],
  },
];

export const ENGLISH_PARTITIVES: CounterWord[] = [
  { symbol: 'A piece of', pinyinOrRomaja: '/ə piːs əv/', vietnameseMeaning: 'Một mẩu, một miếng, một món', usedFor: 'Cake, paper, advice, news, information, furniture, luggage', examples: [{ amount: '1 lời khuyên', fullPhrase: 'A piece of advice', reading: '/ə piːs əv ədˈvaɪs/', meaning: 'Một lời khuyên hữu ích' }, { amount: '1 miếng bánh', fullPhrase: 'A piece of cake', reading: '/ə piːs əv keɪk/', meaning: 'Một miếng bánh ngọt (cũng có nghĩa: Dễ như ăn cháo)' }] },
  { symbol: 'A cup of / A glass of', pinyinOrRomaja: '/ə kʌp əv/ - /ə ɡlɑːs əv/', vietnameseMeaning: 'Một tách, ly / Một cốc thủy tinh', usedFor: 'Tea, coffee (cup); Water, milk, juice, wine (glass)', examples: [{ amount: '1 tách cà phê', fullPhrase: 'A cup of coffee', reading: '/ə kʌp əv ˈkɒf.i/', meaning: 'Một tách cà phê' }, { amount: '1 ly nước lọc', fullPhrase: 'A glass of water', reading: '/ə ɡlɑːs əv ˈwɔː.tər/', meaning: 'Một ly nước' }] },
  { symbol: 'A bottle of', pinyinOrRomaja: '/ə ˈbɒt.əl əv/', vietnameseMeaning: 'Một chai, bình', usedFor: 'Wine, beer, milk, olive oil, perfume, water', examples: [{ amount: '1 chai rượu vang', fullPhrase: 'A bottle of wine', reading: '/ə ˈbɒt.əl əv waɪn/', meaning: 'Một chai rượu vang' }] },
  { symbol: 'A pair of', pinyinOrRomaja: '/ə peər əv/', vietnameseMeaning: 'Một đôi, một cặp', usedFor: 'Shoes, glasses, scissors, trousers, jeans, socks, gloves', examples: [{ amount: '1 đôi giày', fullPhrase: 'A pair of shoes', reading: '/ə peər əv ʃuːz/', meaning: 'Một đôi giày' }, { amount: '1 cái kéo', fullPhrase: 'A pair of scissors', reading: '/ə peər əv ˈsɪz.əz/', meaning: 'Một chiếc kéo' }] },
  { symbol: 'A slice of / A loaf of', pinyinOrRomaja: '/ə slaɪs əv/ - /ə ləʊf əv/', vietnameseMeaning: 'Một lát mỏng / Một ổ bánh', usedFor: 'Bread, pizza, cheese, meat (slice); Bread (loaf - số nhiều loaves)', examples: [{ amount: '1 ổ bánh mì', fullPhrase: 'A loaf of bread', reading: '/ə ləʊf əv bred/', meaning: 'Một ổ bánh mì' }, { amount: '2 lát pizza', fullPhrase: 'Two slices of pizza', reading: '/tuː ˈslaɪ.sɪz əv ˈpiːt.sə/', meaning: 'Hai lát bánh pizza' }] },
  { symbol: 'A bar of', pinyinOrRomaja: '/ə bɑːr əv/', vietnameseMeaning: 'Một thanh, một thỏi, một bánh', usedFor: 'Chocolate, soap, gold', examples: [{ amount: '1 thanh sô-cô-la', fullPhrase: 'A bar of chocolate', reading: '/ə bɑːr əv ˈtʃɒk.lət/', meaning: 'Một thanh sô-cô-la' }, { amount: '1 bánh xà phòng', fullPhrase: 'A bar of soap', reading: '/ə bɑːr əv səʊp/', meaning: 'Một bánh xà bông' }] },
  { symbol: 'A bowl of', pinyinOrRomaja: '/ə bəʊl əv/', vietnameseMeaning: 'Một bát, một tô', usedFor: 'Soup, rice, cereal, noodles, salad', examples: [{ amount: '1 tô phở/mì', fullPhrase: 'A bowl of noodles', reading: '/ə bəʊl əv ˈnuː.dəlz/', meaning: 'Một tô mì' }] },
  { symbol: 'A flock of / A herd of', pinyinOrRomaja: '/ə flɒk əv/ - /ə hɜːd əv/', vietnameseMeaning: 'Một đàn (chim, cừu) / Một bầy (gia súc lớn)', usedFor: 'Birds, sheep (flock); Cows, elephants, cattle (herd)', examples: [{ amount: 'Một đàn chim', fullPhrase: 'A flock of birds', reading: '/ə flɒk əv bɜːdz/', meaning: 'Một đàn chim đang bay' }, { amount: 'Một bầy bò', fullPhrase: 'A herd of cows', reading: '/ə hɜːd əv kaʊz/', meaning: 'Một bầy bò' }] },
];
