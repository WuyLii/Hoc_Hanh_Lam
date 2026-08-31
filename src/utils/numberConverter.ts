// =========================================================================
// NUMBER CONVERTER ENGINE (Tiếng Hàn, Tiếng Trung, Tiếng Anh)
// =========================================================================

// 1. TIẾNG HÀN CONVERTER
const KO_SINO_DIGITS = ['', '일', '이', '삼', '사', '오', '육', '칠', '팔', '구'];
const KO_SINO_UNITS = ['', '십', '백', '천'];
const KO_SINO_BIG_UNITS = ['', '만', '억', '조'];

const KO_NATIVE_1_9 = ['', '하나', '둘', '셋', '넷', '다섯', '여섯', '일곱', '여덟', '아홉'];
const KO_NATIVE_TENS = ['', '열', '스물', '서른', '마흔', '쉰', '예순', '일흔', '여든', '아흔'];

const KO_NATIVE_COUNTER_1_9 = ['', '한', '두', '세', '네', '다섯', '여섯', '일곱', '여덟', '아홉'];
const KO_NATIVE_COUNTER_TENS = ['', '열', '스무', '서른', '마흔', '쉰', '예순', '일흔', '여든', '아흔'];

export function convertToKoreanSino(num: number): string {
  if (num === 0) return '영 (0)';
  if (num < 0) return '마이너스 ' + convertToKoreanSino(Math.abs(num));
  if (num > 999999999999) return 'Số quá lớn (vượt quá 1 nghìn tỷ)';

  let result = '';
  let temp = Math.floor(num);
  let bigUnitIdx = 0;

  while (temp > 0) {
    const chunk = temp % 10000;
    if (chunk > 0) {
      let chunkStr = '';
      const strChunk = chunk.toString().padStart(4, '0');
      for (let i = 0; i < 4; i++) {
        const d = parseInt(strChunk[i], 10);
        const unitPos = 3 - i;
        if (d > 0) {
          if (d === 1 && unitPos > 0) {
            // Trong tiếng Hàn, thường không đọc "일십", "일백", "일천" ở cấp độ hàng nhỏ
            chunkStr += KO_SINO_UNITS[unitPos];
          } else {
            chunkStr += KO_SINO_DIGITS[d] + KO_SINO_UNITS[unitPos];
          }
        }
      }
      result = chunkStr + KO_SINO_BIG_UNITS[bigUnitIdx] + (result ? ' ' + result : '');
    }
    temp = Math.floor(temp / 10000);
    bigUnitIdx++;
  }

  return result.trim();
}

export function convertToKoreanNative(num: number): string {
  if (num === 0) return '-';
  if (num < 0 || num > 99) return '(Số thuần Hàn truyền thống chủ yếu dùng từ 1 đến 99, trên 100 dùng hệ Hán-Hàn)';

  const tens = Math.floor(num / 10);
  const ones = num % 10;

  if (tens === 0) return KO_NATIVE_1_9[ones];
  if (ones === 0) return KO_NATIVE_TENS[tens];

  return `${KO_NATIVE_TENS[tens]}${KO_NATIVE_1_9[ones]}`;
}

export function convertToKoreanWithCounter(num: number, counterName: string = '개'): string {
  if (num >= 1 && num <= 99) {
    const tens = Math.floor(num / 10);
    const ones = num % 10;
    let numStr = '';
    if (tens === 0) {
      numStr = KO_NATIVE_COUNTER_1_9[ones];
    } else if (ones === 0) {
      numStr = KO_NATIVE_COUNTER_TENS[tens];
    } else {
      numStr = `${KO_NATIVE_TENS[tens]}${KO_NATIVE_COUNTER_1_9[ones]}`;
    }
    return `${numStr} ${counterName}`;
  }
  return `${convertToKoreanSino(num)} ${counterName}`;
}

// 2. TIẾNG TRUNG CONVERTER
const ZH_SIMP_DIGITS = ['零', '一', '二', '三', '四', '五', '六', '七', '八', '九'];
const ZH_SIMP_UNITS = ['', '十', '百', '千'];
const ZH_SIMP_BIG_UNITS = ['', '万', '亿'];

const ZH_DAXIE_DIGITS = ['零', '壹', '贰', '叁', '肆', '伍', '陆', '柒', '捌', '玖'];
const ZH_DAXIE_UNITS = ['', '拾', '佰', '仟'];
const ZH_DAXIE_BIG_UNITS = ['', '万', '亿'];

const ZH_PINYIN_DIGITS = ['líng', 'yī', 'èr', 'sān', 'sì', 'wǔ', 'liù', 'qī', 'bā', 'jiǔ'];

export function convertToChineseSimp(num: number): { char: string; pinyin: string; daxie: string } {
  if (num === 0) return { char: '零', pinyin: 'líng', daxie: '零元整' };
  if (num < 0) {
    const sub = convertToChineseSimp(Math.abs(num));
    return { char: '负 ' + sub.char, pinyin: 'fù ' + sub.pinyin, daxie: '负 ' + sub.daxie };
  }
  if (num > 999999999999) return { char: '数值过大', pinyin: '-', daxie: '-' };

  // Convert to Simplified
  let simpResult = '';
  let daxieResult = '';

  const numStr = Math.floor(num).toString();
  const len = numStr.length;

  if (num >= 10 && num <= 19) {
    const d = num % 10;
    simpResult = d === 0 ? '十' : `十一${d > 1 ? ZH_SIMP_DIGITS[d] : ''}`.replace('十一一', '十一');
  }

  // General 4-digit chunking algorithm
  function chunkToSimp(chunk: number): string {
    if (chunk === 0) return '';
    let res = '';
    const s = chunk.toString().padStart(4, '0');
    let zeroFlag = false;

    for (let i = 0; i < 4; i++) {
      const d = parseInt(s[i], 10);
      const unit = ZH_SIMP_UNITS[3 - i];
      if (d === 0) {
        if (res.length > 0 && !zeroFlag) {
          zeroFlag = true;
        }
      } else {
        if (zeroFlag) {
          res += '零';
          zeroFlag = false;
        }
        res += ZH_SIMP_DIGITS[d] + unit;
      }
    }
    return res;
  }

  function chunkToDaXie(chunk: number): string {
    if (chunk === 0) return '';
    let res = '';
    const s = chunk.toString().padStart(4, '0');
    let zeroFlag = false;

    for (let i = 0; i < 4; i++) {
      const d = parseInt(s[i], 10);
      const unit = ZH_DAXIE_UNITS[3 - i];
      if (d === 0) {
        if (res.length > 0 && !zeroFlag) {
          zeroFlag = true;
        }
      } else {
        if (zeroFlag) {
          res += '零';
          zeroFlag = false;
        }
        res += ZH_DAXIE_DIGITS[d] + unit;
      }
    }
    return res;
  }

  let temp = Math.floor(num);
  let bigIdx = 0;
  let sChunks: string[] = [];
  let dChunks: string[] = [];

  while (temp > 0) {
    const c = temp % 10000;
    if (c > 0) {
      sChunks.unshift(chunkToSimp(c) + ZH_SIMP_BIG_UNITS[bigIdx]);
      dChunks.unshift(chunkToDaXie(c) + ZH_DAXIE_BIG_UNITS[bigIdx]);
    }
    temp = Math.floor(temp / 10000);
    bigIdx++;
  }

  simpResult = sChunks.join('') || ZH_SIMP_DIGITS[0];
  daxieResult = (dChunks.join('') || ZH_DAXIE_DIGITS[0]) + '元整';

  // Quick Pinyin estimation
  let pinyinEst = simpResult
    .split('')
    .map((c) => {
      const map: Record<string, string> = {
        '零': 'líng', '一': 'yī', '二': 'èr', '三': 'sān', '四': 'sì', '五': 'wǔ',
        '六': 'liù', '七': 'qī', '八': 'bā', '九': 'jiǔ', '十': 'shí', '百': 'bǎi',
        '千': 'qiān', '万': 'wàn', '亿': 'yì', '两': 'liǎng'
      };
      return map[c] || c;
    })
    .join(' ');

  return {
    char: simpResult,
    pinyin: pinyinEst,
    daxie: daxieResult,
  };
}

// 3. TIẾNG ANH CONVERTER
const EN_ONES = [
  '', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine',
  'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen',
  'seventeen', 'eighteen', 'nineteen',
];

const EN_TENS = [
  '', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety',
];

const EN_ORDINALS_ONES: Record<string, string> = {
  one: 'first', two: 'second', three: 'third', four: 'fourth', five: 'fifth',
  six: 'sixth', seven: 'seventh', eight: 'eighth', nine: 'ninth', ten: 'tenth',
  eleven: 'eleventh', twelve: 'twelfth', thirteen: 'thirteenth', fourteen: 'fourteenth',
  fifteen: 'fifteenth', sixteen: 'sixteenth', seventeen: 'seventeenth',
  eighteen: 'eighteenth', nineteen: 'nineteenth',
};

const EN_ORDINALS_TENS: Record<string, string> = {
  twenty: 'twentieth', thirty: 'thirtieth', forty: 'fortieth', fifty: 'fiftieth',
  sixty: 'sixtieth', seventy: 'seventieth', eighty: 'eightieth', ninety: 'ninetieth',
};

export function convertToEnglishCardinal(num: number): string {
  if (num === 0) return 'zero';
  if (num < 0) return 'negative ' + convertToEnglishCardinal(Math.abs(num));
  if (num > 999999999999) return 'Number exceeds 999 billion';

  function convertHundreds(n: number): string {
    let str = '';
    if (n >= 100) {
      str += EN_ONES[Math.floor(n / 100)] + ' hundred';
      n %= 100;
      if (n > 0) str += ' and ';
    }
    if (n > 0) {
      if (n < 20) {
        str += EN_ONES[n];
      } else {
        str += EN_TENS[Math.floor(n / 10)];
        if (n % 10 > 0) {
          str += '-' + EN_ONES[n % 10];
        }
      }
    }
    return str;
  }

  let result = '';
  const billions = Math.floor(num / 1000000000);
  const millions = Math.floor((num % 1000000000) / 1000000);
  const thousands = Math.floor((num % 1000000) / 1000);
  const remainder = Math.floor(num % 1000);

  if (billions > 0) {
    result += convertHundreds(billions) + ' billion ';
  }
  if (millions > 0) {
    result += convertHundreds(millions) + ' million ';
  }
  if (thousands > 0) {
    result += convertHundreds(thousands) + ' thousand ';
  }
  if (remainder > 0) {
    result += convertHundreds(remainder);
  }

  return result.trim();
}

export function convertToEnglishOrdinal(num: number): string {
  const cardinal = convertToEnglishCardinal(num);
  if (cardinal.includes('exceeds')) return cardinal;

  const words = cardinal.split(' ');
  const lastWord = words[words.length - 1];

  let ordinalLastWord = '';

  if (lastWord.includes('-')) {
    const parts = lastWord.split('-');
    const suffix = EN_ORDINALS_ONES[parts[1]] || (parts[1] + 'th');
    ordinalLastWord = `${parts[0]}-${suffix}`;
  } else if (EN_ORDINALS_ONES[lastWord]) {
    ordinalLastWord = EN_ORDINALS_ONES[lastWord];
  } else if (EN_ORDINALS_TENS[lastWord]) {
    ordinalLastWord = EN_ORDINALS_TENS[lastWord];
  } else if (lastWord === 'hundred' || lastWord === 'thousand' || lastWord === 'million' || lastWord === 'billion') {
    ordinalLastWord = lastWord + 'th';
  } else {
    ordinalLastWord = lastWord + 'th';
  }

  words[words.length - 1] = ordinalLastWord;
  return words.join(' ');
}
