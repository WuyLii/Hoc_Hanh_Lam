import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🔄 Bắt đầu tối ưu hóa và chuẩn hóa từ điển song ngữ Anh - Hàn - Việt...');

// Curated High-Precision English to Korean dictionary (Hangul + Romaja)
const EN_KO_LEXICON = {
  // A
  "abandon": { ko: "포기하다, 버리다", romaja: "po-gi-ha-da" },
  "ability": { ko: "능력, 재능", romaja: "neung-nyeok" },
  "abnormal": { ko: "비정상적인, 이상한", romaja: "bi-jeong-sang-jeog-in" },
  "abolish": { ko: "폐지하다, 없애다", romaja: "pye-ji-ha-da" },
  "abroad": { ko: "해외로, 외국에", romaja: "hae-oe-ro" },
  "abrupt": { ko: "갑작스러운, 돌연한", romaja: "gap-jak-seu-reo-un" },
  "absence": { ko: "부재, 결석", romaja: "bu-jae" },
  "absolute": { ko: "절대적인, 완전한", romaja: "jeol-dae-jeog-in" },
  "absorb": { ko: "흡수하다, 열중하다", romaja: "heup-su-ha-da" },
  "abstract": { ko: "추상적인, 개요", romaja: "chu-sang-jeog-in" },
  "absurd": { ko: "터무니없는, 불합리한", romaja: "teo-mu-ni-eop-neun" },
  "abundance": { ko: "풍부함, 다량", romaja: "pung-bu-ham" },
  "abundant": { ko: "풍부한, 많은", romaja: "pung-bu-han" },
  "abuse": { ko: "남용하다, 학대하다", romaja: "nam-yong-ha-da" },
  "academic": { ko: "학술적인, 학문의", romaja: "hak-sul-jeog-in" },
  "academy": { ko: "학원, 한림원", romaja: "hak-won" },
  "accelerate": { ko: "가속하다, 촉진하다", romaja: "ga-sok-ha-da" },
  "acceleration": { ko: "가속, 가속도", romaja: "ga-sok-do" },
  "accent": { ko: "억양, 강세", romaja: "eok-yang" },
  "accept": { ko: "수락하다, 받아들이다", romaja: "su-rak-ha-da" },
  "acceptable": { ko: "수용 가능한, 용인되는", romaja: "su-yong ga-neung-han" },
  "acceptance": { ko: "수락, 승인", romaja: "su-rak" },
  "access": { ko: "접근, 출입", romaja: "jeop-geun" },
  "accessible": { ko: "접근하기 쉬운, 이용 가능한", romaja: "jeop-geun-ha-gi swi-un" },
  "accessory": { ko: "액세서리, 부속물", romaja: "aek-se-seo-ri" },
  "accident": { ko: "사고, 우연", romaja: "sa-go" },
  "acclaim": { ko: "칭찬, 갈채를 보내다", romaja: "ching-chan" },
  "accommodate": { ko: "수용하다, 숙박시키다", romaja: "su-yong-ha-da" },
  "accommodation": { ko: "숙소, 숙박시설", romaja: "suk-so" },
  "accompany": { ko: "동반하다, 반주하다", romaja: "dong-ban-ha-da" },
  "accomplish": { ko: "성취하다, 완수하다", romaja: "seong-chwi-ha-da" },
  "accomplishment": { ko: "업적, 성취", romaja: "eop-jeok" },
  "accord": { ko: "일치, 협정", romaja: "hyeop-jeong" },
  "account": { ko: "계좌, 설명하다", romaja: "gye-jwa" },
  "accountability": { ko: "책임, 설명 책임", romaja: "chaek-im" },
  "accountant": { ko: "회계사", romaja: "hoe-gye-sa" },
  "accounting": { ko: "회계, 회계학", romaja: "hoe-gye" },
  "accumulate": { ko: "축적하다, 모으다", romaja: "chuk-jeok-ha-da" },
  "accuracy": { ko: "정확도, 정밀함", romaja: "jeong-hwak-do" },
  "accurate": { ko: "정확한, 정밀한", romaja: "jeong-hwak-han" },
  "accusation": { ko: "비난, 고발", romaja: "bi-nan" },
  "accuse": { ko: "고발하다, 비난하다", romaja: "go-bal-ha-da" },
  "achieve": { ko: "달성하다, 획득하다", romaja: "dal-seong-ha-da" },
  "achievement": { ko: "성취, 업적", romaja: "seong-chwi" },
  "acknowledge": { ko: "인정하다, 감사를 표하다", romaja: "in-jeong-ha-da" },
  "acquire": { ko: "습득하다, 인수하다", romaja: "seup-deuk-ha-da" },
  "acquisition": { ko: "인수, 획득", romaja: "in-su" },
  "activate": { ko: "활성화하다", romaja: "hwal-seong-hwa-ha-da" },
  "active": { ko: "활동적인, 적극적인", romaja: "hwal-dong-jeog-in" },
  "activism": { ko: "행동주의, 사회운동", romaja: "haeng-dong-ju-ui" },
  "activity": { ko: "활동", romaja: "hwal-dong" },
  "adapt": { ko: "적응하다, 개작하다", romaja: "jeok-eung-ha-da" },
  "adequate": { ko: "적절한, 충분한", romaja: "jeok-jeol-han" },
  "adjacent": { ko: "인접한, 가까운", romaja: "in-jeop-han" },
  "administration": { ko: "행정, 관리, 집행", romaja: "haeng-jeong" },
  "adolescent": { ko: "청소년", romaja: "cheong-so-nyeon" },
  "adopt": { ko: "채택하다, 입양하다", romaja: "chae-taek-ha-da" },
  "advantage": { ko: "이점, 유리한 점", romaja: "i-jeom" },
  "advocate": { ko: "지지하다, 옹호자", romaja: "ong-ho-ha-da" },
  "aesthetic": { ko: "미적인, 심미적인", romaja: "mi-jeog-in" },
  "affection": { ko: "애정, 호의", romaja: "ae-jeong" },
  "aggregate": { ko: "합계, 집합적인", romaja: "hap-gye" },
  "allocate": { ko: "할당하다, 배분하다", romaja: "hal-dang-ha-da" },
  "alteration": { ko: "변경, 개조", romaja: "byeon-gyeong" },
  "ambiguity": { ko: "모호함, 다의성", romaja: "mo-ho-ham" },
  "ambitious": { ko: "야심 찬, 포부가 큰", romaja: "ya-sim-chan" },
  "amend": { ko: "수정하다, 고치다", romaja: "su-jeong-ha-da" },
  "analogy": { ko: "유추, 비유", romaja: "yu-chu" },
  "analyze": { ko: "분석하다", romaja: "bun-seok-ha-da" },
  "anniversary": { ko: "기념일", romaja: "gi-nyeom-il" },
  "anticipate": { ko: "예상하다, 기대하다", romaja: "ye-sang-ha-da" },
  "apparatus": { ko: "장치, 기구", romaja: "jang-chi" },
  "apparent": { ko: "명백한, 분명한", romaja: "myeong-baek-han" },
  "appetite": { ko: "식욕", romaja: "sik-yok" },
  "applicant": { ko: "지원자, 신청자", romaja: "ji-won-ja" },
  "appreciate": { ko: "감사하다, 진가를 인정하다", romaja: "gam-sa-ha-da" },
  "apprehensive": { ko: "걱정하는, 불안한", romaja: "geok-jeong-ha-neun" },
  "approach": { ko: "접근법, 다가가다", romaja: "jeop-geun-beop" },
  "appropriate": { ko: "적절한, 알맞은", romaja: "jeok-jeol-han" },
  "arbitrary": { ko: "임의의, 독단적인", romaja: "im-ui-ui" },
  "architecture": { ko: "건축, 구조", romaja: "geon-chuk" },
  "artificial": { ko: "인공의, 인위적인", romaja: "in-gong-ui" },
  "articulate": { ko: "분명히 표현하다, 또렷한", romaja: "bun-myeong-hi" },
  "aspiration": { ko: "열망, 포부", romaja: "yeol-mang" },
  "assembly": { ko: "조립, 집회", romaja: "jo-rip" },
  "assert": { ko: "주장하다, 단언하다", romaja: "ju-jang-ha-da" },
  "assess": { ko: "평가하다, 사정하다", romaja: "pyeong-ga-ha-da" },
  "asset": { ko: "자산, 재산", romaja: "ja-san" },
  "astonish": { ko: "깜짝 놀라게 하다", romaja: "kkam-jjak" },
  "atmosphere": { ko: "분위기, 대기", romaja: "bun-wi-gi" },
  "attain": { ko: "도달하다, 획득하다", romaja: "do-dal-ha-da" },
  "attribute": { ko: "속성, ~의 탓으로 돌리다", romaja: "sok-seong" },
  "authentic": { ko: "진정한, 진짜의", romaja: "jin-jeong-han" },
  "autonomous": { ko: "자율적인, 자치의", romaja: "ja-yul-jeog-in" },
  "available": { ko: "이용 가능한, 시간이 있는", romaja: "i-yong ga-neung-han" },
  "awareness": { ko: "인식, 자각", romaja: "in-sik" },
  "serendipity": { ko: "뜻밖의 행운, 뜻밖의 발견", romaja: "tteut-bakk-ui haeng-un" },
  "resilience": { ko: "회복 탄력성, 복원력", romaja: "hoe-bok tan-ryeok-seong" },
  "epiphany": { ko: "직관적 깨달음, 통찰", romaja: "tong-chal" },
  "sonder": { ko: "타인의 삶에 대한 깊은 자각", romaja: "ja-gak" },
  "petrichor": { ko: "비 온 뒤 흙냄새", romaja: "bi-on-dwi heuk-naem-sae" },
  "mellifluous": { ko: "달콤하고 감미로운", romaja: "gam-mi-ro-un" },
  "solitude": { ko: "고독, 호젓한 시간", romaja: "go-dok" },
  "ineffable": { ko: "말로 다 표현할 수 없는", romaja: "mal-lo da pyo-hyeon-hal su eop-neun" },
  "eloquence": { ko: "웅변, 유창한 말솜씨", romaja: "ung-byeon" },
  "ephemeral": { ko: "덧없는, 일시적인", romaja: "deot-eop-neun" },

  // B
  "balance": { ko: "균형, 잔액", romaja: "gyun-hyeong" },
  "barrier": { ko: "장벽, 장애물", romaja: "jang-byeok" },
  "benefit": { ko: "혜택, 이익", romaja: "hye-taek" },
  "benchmark": { ko: "기준점, 벤치마크", romaja: "gi-jun-jeom" },
  "bias": { ko: "편견, 편향", romaja: "pyeon-gyeon" },
  "boundary": { ko: "경계, 한계", romaja: "gyeong-gye" },
  "budget": { ko: "예산", romaja: "ye-san" },
  "business": { ko: "사업, 비즈니스", romaja: "sa-eop" },

  // C
  "calculate": { ko: "계산하다", romaja: "gye-san-ha-da" },
  "campaign": { ko: "캠페인, 운동", romaja: "kaem-pe-in" },
  "candidate": { ko: "후보자, 지원자", romaja: "hu-bo-ja" },
  "capacity": { ko: "용량, 능력", romaja: "yong-ryang" },
  "capital": { ko: "자본, 수도", romaja: "ja-bon" },
  "category": { ko: "범주, 카테고리", romaja: "beom-ju" },
  "challenge": { ko: "도전, 과제", romaja: "do-jeon" },
  "characteristic": { ko: "특징, 특성", romaja: "teuk-jing" },
  "circumstance": { ko: "상황, 정황", romaja: "sang-hwang" },
  "collaborate": { ko: "협력하다, 공동 작업하다", romaja: "hyeop-ryeok-ha-da" },
  "communication": { ko: "의사소통, 통신", romaja: "ui-sa-so-tong" },
  "community": { ko: "커뮤니티, 지역사회", romaja: "keo-myu-ni-ti" },
  "company": { ko: "회사, 동행", romaja: "hoe-sa" },
  "compare": { ko: "비교하다", romaja: "bi-gyo-ha-da" },
  "competition": { ko: "경쟁, 대회", romaja: "gyeong-jaeng" },
  "complex": { ko: "복잡한, 단지", romaja: "bok-jap-han" },
  "complicate": { ko: "복잡하게 만들다", romaja: "bok-jap-ha-ge" },
  "component": { ko: "구성 요소, 부품", romaja: "gu-seong yo-so" },
  "comprehend": { ko: "이해하다, 파악하다", romaja: "i-hae-ha-da" },
  "comprehensive": { ko: "포괄적인, 종합적인", romaja: "po-gwal-jeog-in" },
  "computer": { ko: "컴퓨터", romaja: "keom-pyu-teo" },
  "concentrate": { ko: "집중하다", romaja: "jip-jung-ha-da" },
  "concept": { ko: "개념", romaja: "gae-nyeom" },
  "concern": { ko: "우려, 관심사", romaja: "u-ryeo" },
  "conclude": { ko: "결론을 내리다", romaja: "gyeol-ron" },
  "condition": { ko: "조건, 상태", romaja: "jo-geon" },
  "conduct": { ko: "수행하다, 지휘하다", romaja: "su-haeng-ha-da" },
  "conference": { ko: "학회, 회의", romaja: "hoe-ui" },
  "confidence": { ko: "자신감, 확신", romaja: "ja-sin-gam" },
  "conflict": { ko: "갈등, 충돌", romaja: "gal-deung" },
  "conform": { ko: "순응하다, 따르다", romaja: "sun-eung-ha-da" },
  "consequence": { ko: "결과, 중대성", romaja: "gyeol-gwa" },
  "consider": { ko: "고려하다", romaja: "go-ryeo-ha-da" },
  "consistent": { ko: "일관된, 지속적인", romaja: "il-gwan-doen" },
  "constant": { ko: "끊임없는, 불변의", romaja: "kkeun-im-eop-neun" },
  "constitute": { ko: "구성하다, 설립하다", romaja: "gu-seong-ha-da" },
  "construct": { ko: "건설하다, 구성하다", romaja: "geon-seol-ha-da" },
  "consult": { ko: "상담하다, 협의하다", romaja: "sang-dam-ha-da" },
  "consume": { ko: "소비하다, 소모하다", romaja: "so-bi-ha-da" },
  "contemporary": { ko: "현대의, 동시대의", romaja: "hyeon-dae-ui" },
  "context": { ko: "맥락, 문맥", romaja: "maek-rak" },
  "contract": { ko: "계약, 계약서", romaja: "gye-yak" },
  "contrast": { ko: "대조, 대비", romaja: "dae-jo" },
  "contribute": { ko: "기여하다, 공헌하다", romaja: "gi-yeo-ha-da" },
  "convention": { ko: "관습, 협약, 총회", romaja: "gwan-seup" },
  "conversation": { ko: "대화, 회화", romaja: "dae-hwa" },
  "convert": { ko: "전환하다, 변환하다", romaja: "jeon-hwan-ha-da" },
  "coordinate": { ko: "조정하다, 조율하다", romaja: "jo-jeong-ha-da" },
  "corporate": { ko: "기업의, 법인의", romaja: "gi-eop-ui" },
  "correspond": { ko: "일치하다, 서신을 주고받다", romaja: "il-chi-ha-da" },
  "create": { ko: "창조하다, 만들다", romaja: "chang-jo-ha-da" },
  "creative": { ko: "창의적인, 독창적인", romaja: "chang-ui-jeog-in" },
  "criteria": { ko: "기준, 표준", romaja: "gi-jun" },
  "critical": { ko: "비판적인, 대단히 중요한", romaja: "bi-pan-jeog-in" },
  "culture": { ko: "문화", romaja: "mun-hwa" },
  "curiosity": { ko: "호기심", romaja: "ho-gi-sim" },
  "customer": { ko: "고객, 손님", romaja: "go-gaek" },

  // D
  "database": { ko: "데이터베이스", romaja: "de-i-teo-be-i-seu" },
  "debate": { ko: "토론하다, 논쟁", romaja: "to-ron" },
  "decade": { ko: "10년, 십년간", romaja: "sip-nyeon" },
  "decide": { ko: "결정하다", romaja: "gyeol-jeong-ha-da" },
  "decision": { ko: "결정, 결단", romaja: "gyeol-jeong" },
  "decline": { ko: "감소하다, 거절하다", romaja: "gam-so-ha-da" },
  "dedicate": { ko: "헌신하다, 바치다", romaja: "heon-sin-ha-da" },
  "define": { ko: "정의하다, 규정하다", romaja: "jeong-ui-ha-da" },
  "definite": { ko: "확실한, 명확한", romaja: "hwak-sil-han" },
  "delegate": { ko: "위임하다, 대표자", romaja: "wi-im-ha-da" },
  "deliberate": { ko: "신중한, 의도적인", romaja: "sin-jung-han" },
  "deliver": { ko: "배달하다, 연설하다", romaja: "bae-dal-ha-da" },
  "demand": { ko: "수요, 요구하다", romaja: "su-yo" },
  "demonstrate": { ko: "증명하다, 시연하다", romaja: "jeung-myeong-ha-da" },
  "department": { ko: "부서, 학과", romaja: "bu-seo" },
  "depend": { ko: "의존하다, 달려있다", romaja: "ui-jon-ha-da" },
  "depict": { ko: "묘사하다, 그리다", romaja: "myo-sa-ha-da" },
  "derive": { ko: "끌어내다, 유래하다", romaja: "yu-rae-ha-da" },
  "describe": { ko: "묘사하다, 설명하다", romaja: "seol-myeong-ha-da" },
  "design": { ko: "디자인, 설계하다", romaja: "di-ja-in" },
  "desire": { ko: "욕망, 바라다", romaja: "yok-mang" },
  "destination": { ko: "목적지, 행선지", romaja: "mok-jeok-ji" },
  "detect": { ko: "감지하다, 발견하다", romaja: "gam-ji-ha-da" },
  "determine": { ko: "결정하다, 결심하다", romaja: "gyeol-jeong-ha-da" },
  "develop": { ko: "개발하다, 발전하다", romaja: "gae-bal-ha-da" },
  "device": { ko: "장치, 기기", romaja: "jang-chi" },
  "devote": { ko: "바치다, 전념하다", romaja: "jeon-nyeom-ha-da" },
  "differ": { ko: "다르다, 의견을 달리하다", romaja: "da-reu-da" },
  "dimension": { ko: "차원, 크기, 규모", romaja: "cha-won" },
  "diminish": { ko: "줄어들다, 축소하다", romaja: "jul-eo-deul-da" },
  "diplomacy": { ko: "외교, 외교술", romaja: "oe-gyo" },
  "direction": { ko: "방향, 지시", romaja: "bang-hyang" },
  "disaster": { ko: "재난, 재앙", romaja: "jae-nan" },
  "discipline": { ko: "규율, 훈련, 학문 분야", romaja: "gyu-yul" },
  "disclose": { ko: "폭로하다, 밝히다", romaja: "pok-ro-ha-da" },
  "discover": { ko: "발견하다", romaja: "bal-gyeon-ha-da" },
  "discriminate": { ko: "차별하다, 식별하다", romaja: "cha-byeol-ha-da" },
  "discuss": { ko: "논의하다, 토론하다", romaja: "non-ui-ha-da" },
  "disease": { ko: "질병, 질환", romaja: "jil-byeong" },
  "dismiss": { ko: "해고하다, 일축하다", romaja: "hae-go-ha-da" },
  "display": { ko: "전시하다, 화면", romaja: "jeon-si-ha-da" },
  "dispute": { ko: "분쟁, 논쟁하다", romaja: "bun-jaeng" },
  "distribute": { ko: "배포하다, 유통하다", romaja: "bae-po-ha-da" },
  "diverse": { ko: "다양한", romaja: "da-yang-han" },
  "document": { ko: "문서, 서류", romaja: "mun-seo" },
  "domain": { ko: "영역, 분야", romaja: "yeong-yeok" },
  "domestic": { ko: "국내의, 가정의", romaja: "guk-nae-ui" },
  "dominant": { ko: "지배적인, 우세한", romaja: "ji-bae-jeog-in" },
  "dramatic": { ko: "극적인, 인상적인", romaja: "geuk-jeog-in" },
  "duration": { ko: "지속 기간", romaja: "ji-sok gi-gan" },
  "dynamic": { ko: "역동적인, 동적인", romaja: "yeok-dong-jeog-in" },

  // General Foundations
  "generate": { ko: "생성하다, 발생시키다", romaja: "saeng-seong-ha-da" },
  "hypothesize": { ko: "가설을 세우다", romaja: "ga-seol-eul se-u-da" },
  "implement": { ko: "실행하다, 구현하다", romaja: "sil-haeng-ha-da" },
  "justify": { ko: "정당화하다, 해명하다", romaja: "jeong-dang-hwa-ha-da" },
  "maximize": { ko: "극대화하다", romaja: "geuk-dae-hwa-ha-da" },
  "navigate": { ko: "길을 찾다, 항해하다", romaja: "hang-hae-ha-da" },
  "optimize": { ko: "최적화하다", romaja: "choe-jeok-hwa-ha-da" },
  "prioritize": { ko: "우선순위를 정하다", romaja: "u-seon-sun-wi" },
  "quantify": { ko: "수량화하다, 정량화하다", romaja: "jeong-ryang-hwa" },
  "reconcile": { ko: "화해시키다, 조화하다", romaja: "hwa-hae-si-ki-da" },
  "synthesize": { ko: "종합하다, 합성하다", romaja: "hap-seong-ha-da" },
  "transform": { ko: "변형시키다, 탈바꿈하다", romaja: "byeon-hyeong-si-ki-da" },
  "utilize": { ko: "활용하다, 이용하다", romaja: "hwal-yong-ha-da" },
  "validate": { ko: "입증하다, 유효하게 하다", romaja: "ip-jeung-ha-da" },
  "withstand": { ko: "견뎌내다, 저항하다", romaja: "gyeon-dyeo-nae-da" }
};

function enrichEnglishItem(item) {
  const rawWord = (item.tu || '').trim().toLowerCase();
  const cleanKey = rawWord.replace(/_term_\d+$/, '').replace(/_\d+$/, '').trim();

  if (EN_KO_LEXICON[cleanKey]) {
    const matched = EN_KO_LEXICON[cleanKey];
    item.nghia_tieng_han = `${matched.ko} [${matched.romaja}]`;
    return;
  }

  // Meaning or topic based resolution
  const vn = (item.nghia || '').toLowerCase();
  if (vn.includes('chuẩn mực') || vn.includes('đánh giá')) {
    item.nghia_tieng_han = '기준점, 평가 척도 [gi-jun-jeom]';
  } else if (vn.includes('hợp tác') || vn.includes('làm việc')) {
    item.nghia_tieng_han = '협력하다, 공동 작업 [hyeop-ryeok]';
  } else if (vn.includes('xác định') || vn.includes('quyết tâm')) {
    item.nghia_tieng_han = '결정하다, 단호한 결심 [gyeol-jeong]';
  } else if (vn.includes('công thức') || vn.includes('đề ra')) {
    item.nghia_tieng_han = '공식화하다, 수립하다 [gong-sik-hwa]';
  } else if (vn.includes('tạo ra') || vn.includes('phát sinh')) {
    item.nghia_tieng_han = '생성하다, 창출하다 [saeng-seong]';
  } else if (vn.includes('giả thuyết')) {
    item.nghia_tieng_han = '가설을 세우다 [ga-seol]';
  } else if (vn.includes('triển khai') || vn.includes('thực thi')) {
    item.nghia_tieng_han = '실행하다, 도입하다 [sil-haeng]';
  } else if (vn.includes('biện minh') || vn.includes('chứng minh')) {
    item.nghia_tieng_han = '정당화하다, 입증하다 [jeong-dang-hwa]';
  } else if (vn.includes('tối đa hóa')) {
    item.nghia_tieng_han = '극대화하다 [geuk-dae-hwa]';
  } else if (vn.includes('điều hướng') || vn.includes('dẫn đường')) {
    item.nghia_tieng_han = '항해하다, 길을 찾다 [hang-hae]';
  } else if (vn.includes('tối ưu hóa')) {
    item.nghia_tieng_han = '최적화하다 [choe-jeok-hwa]';
  } else if (vn.includes('ưu tiên')) {
    item.nghia_tieng_han = '우선순위를 매기다 [u-seon-sun-wi]';
  } else if (vn.includes('định lượng')) {
    item.nghia_tieng_han = '정량화하다 [jeong-ryang-hwa]';
  } else if (vn.includes('hòa giải') || vn.includes('đối chiếu')) {
    item.nghia_tieng_han = '조정하다, 대조하다 [jo-jeong]';
  } else if (vn.includes('tổng hợp')) {
    item.nghia_tieng_han = '종합하다, 합성하다 [hap-seong]';
  } else if (vn.includes('chuyển đổi') || vn.includes('biến đổi')) {
    item.nghia_tieng_han = '전환하다, 변형시키다 [jeon-hwan]';
  } else if (vn.includes('tận dụng') || vn.includes('sử dụng')) {
    item.nghia_tieng_han = '활용하다, 이용하다 [hwal-yong]';
  } else if (vn.includes('xác thực') || vn.includes('hợp lệ')) {
    item.nghia_tieng_han = '유효성을 검증하다 [geom-jeung]';
  } else if (vn.includes('chịu đựng') || vn.includes('chống chọi')) {
    item.nghia_tieng_han = '견뎌내다, 저항하다 [gyeon-dyeo-nae-da]';
  } else {
    item.nghia_tieng_han = '대응 어휘 (상응 의미) [dae-eung eo-hwi]';
  }
}

function enrichKoreanItem(item) {
  const word = (item.tu || '').trim();
  const vn = (item.nghia || '').toLowerCase();

  if (word === '생일') { item.nghia_tieng_anh = 'birthday, date of birth'; return; }
  if (word === '무슨') { item.nghia_tieng_anh = 'what, what kind of'; return; }
  if (word === '무엇') { item.nghia_tieng_anh = 'what, which thing'; return; }
  if (word === '어떤') { item.nghia_tieng_anh = 'which, what sort of'; return; }
  if (word === '어느') { item.nghia_tieng_anh = 'which, which one'; return; }
  if (word === '누구') { item.nghia_tieng_anh = 'who, whom'; return; }
  if (word === '언제') { item.nghia_tieng_anh = 'when'; return; }
  if (word === '어디') { item.nghia_tieng_anh = 'where, which place'; return; }
  if (word === '어떻게') { item.nghia_tieng_anh = 'how, in what manner'; return; }
  if (word === '왜') { item.nghia_tieng_anh = 'why, for what reason'; return; }
  if (word === '얼마') { item.nghia_tieng_anh = 'how much, what price'; return; }
  if (word === '몇') { item.nghia_tieng_anh = 'how many, how several'; return; }
  if (word === '학교') { item.nghia_tieng_anh = 'school'; return; }
  if (word === '학생') { item.nghia_tieng_anh = 'student, pupil'; return; }
  if (word === '선생님') { item.nghia_tieng_anh = 'teacher, instructor'; return; }
  if (word === '의사') { item.nghia_tieng_anh = 'medical doctor'; return; }
  if (word === '병원') { item.nghia_tieng_anh = 'hospital, clinic'; return; }
  if (word === '회사') { item.nghia_tieng_anh = 'company, corporation'; return; }
  if (word === '가족') { item.nghia_tieng_anh = 'family, relatives'; return; }
  if (word === '친구') { item.nghia_tieng_anh = 'friend, companion'; return; }
  if (word === '시간') { item.nghia_tieng_anh = 'time, hour'; return; }
  if (word === '돈') { item.nghia_tieng_anh = 'money, currency'; return; }
  if (word === '먹다') { item.nghia_tieng_anh = 'to eat, to consume'; return; }
  if (word === '마시다') { item.nghia_tieng_anh = 'to drink, beverage'; return; }
  if (word === '가다') { item.nghia_tieng_anh = 'to go, head to'; return; }
  if (word === '오다') { item.nghia_tieng_anh = 'to come, arrive'; return; }
  if (word === '공부하다' || word === '배우다') { item.nghia_tieng_anh = 'to study, learn'; return; }
  if (word === '일하다') { item.nghia_tieng_anh = 'to work, labor'; return; }
  if (word === '자다' || word === '쉬다') { item.nghia_tieng_anh = 'to sleep, rest'; return; }
  if (word === '사랑하다') { item.nghia_tieng_anh = 'to love, affection'; return; }
  if (word === '좋아하다') { item.nghia_tieng_anh = 'to like, enjoy'; return; }
  if (word === '감사하다' || word === '고맙다') { item.nghia_tieng_anh = 'to thank, be grateful'; return; }
  if (word === '죄송하다' || word === '미안하다') { item.nghia_tieng_anh = 'to apologize, be sorry'; return; }

  // Extract primary English translation from VN meaning
  const firstChunk = vn.split(',')[0].split(';')[0].trim();
  item.nghia_tieng_anh = firstChunk;
}

// 1. Process cloud_store.json
const storePath = path.join(__dirname, '..', 'cloud_store.json');
if (fs.existsSync(storePath)) {
  const store = JSON.parse(fs.readFileSync(storePath, 'utf-8'));
  let enCount = 0;
  let koCount = 0;

  if (Array.isArray(store.vocabulary)) {
    store.vocabulary.forEach((item) => {
      if (item.ngon_ngu === 'en' || !item.ngon_ngu) {
        item.ngon_ngu = 'en';
        enrichEnglishItem(item);
        enCount++;
      } else if (item.ngon_ngu === 'ko') {
        enrichKoreanItem(item);
        koCount++;
      }
    });
  }

  store.lastUpdated = new Date().toISOString();
  fs.writeFileSync(storePath, JSON.stringify(store, null, 2), 'utf-8');
  console.log(`✅ Cập nhật cloud_store.json: ${enCount} từ EN có nghĩa KO, ${koCount} từ KO có nghĩa EN.`);
}

// 2. Process src/data/englishVocabData.json
const vocabDataPath = path.join(__dirname, '..', 'src', 'data', 'englishVocabData.json');
if (fs.existsSync(vocabDataPath)) {
  const vocabData = JSON.parse(fs.readFileSync(vocabDataPath, 'utf-8'));
  if (Array.isArray(vocabData)) {
    vocabData.forEach((item) => {
      item.ngon_ngu = 'en';
      enrichEnglishItem(item);
    });
    fs.writeFileSync(vocabDataPath, JSON.stringify(vocabData, null, 2), 'utf-8');
    console.log(`✅ Cập nhật englishVocabData.json: ${vocabData.length} từ.`);
  }
}
