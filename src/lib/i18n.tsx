import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import type { L10n, Lang } from "../data/types";

type Trio = [string, string, string]; // [en, fa, ar]

/** Every UI string in English / Persian / Arabic. */
const S: Record<string, Trio> = {
  brand: ["Guess Your Food", "غذایت را حدس بزن", "خمّن طعامك"],
  tagline: ["Guess. Discover. Learn. Complete the World.", "حدس بزن. کشف کن. یاد بگیر. دنیا را کامل کن.", "خمّن. اكتشف. تعلّم. أكمل العالم."],
  taglineShort: ["Guess. Discover. Learn.", "حدس بزن. کشف کن. یاد بگیر.", "خمّن. اكتشف. تعلّم."],
  play: ["Play", "بازی", "العب"],
  home: ["Home", "خانه", "الرئيسية"],
  dailyNav: ["Daily", "روزانه", "يومي"],
  library: ["Food Library", "کتابخانه غذاها", "مكتبة الأطعمة"],
  countries: ["Countries", "کشورها", "الدول"],
  leaderboard: ["Leaderboard", "جدول امتیازات", "لوحة الصدارة"],
  profile: ["Profile", "پروفایل", "الملف الشخصي"],
  settings: ["Settings", "تنظیمات", "الإعدادات"],
  admin: ["Admin", "مدیریت", "الإدارة"],
  searchPh: ["Search food, country, ingredient…", "جستجوی غذا، کشور، ماده اولیه…", "ابحث عن طعام، دولة، مكوّن…"],
  score: ["Score", "امتیاز", "النقاط"],
  lives: ["Lives", "جان", "الأرواح"],
  combo: ["Combo", "کمبو", "كومبو"],
  streak: ["Streak", "پاسخ‌های پیاپی", "سلسلة"],
  level: ["Level", "سطح", "المستوى"],
  question: ["Question", "سؤال", "سؤال"],
  of: ["of", "از", "من"],
  next: ["Next", "بعدی", "التالي"],
  quit: ["Quit", "خروج", "خروج"],
  start: ["Start", "شروع", "ابدأ"],
  back: ["Back", "بازگشت", "رجوع"],
  all: ["All", "همه", "الكل"],
  page: ["Page", "صفحه", "صفحة"],
  prev: ["Prev", "قبلی", "السابق"],
  viewAll: ["View all", "مشاهده همه", "عرض الكل"],
  loading: ["Loading…", "در حال بارگذاری…", "جارٍ التحميل…"],
  noResults: ["Nothing found. Try another search.", "چیزی پیدا نشد. جستجوی دیگری امتحان کنید.", "لا نتائج. جرّب بحثاً آخر."],
  close: ["Close", "بستن", "إغلاق"],
  clear: ["Clear filters", "پاک‌کردن فیلترها", "مسح عوامل التصفية"],
  reset: ["Reset", "بازنشانی", "إعادة تعيين"],
  // cities
  cityLbl: ["City", "شهر", "المدينة"],
  citiesLbl: ["Cities", "شهرها", "المدن"],
  cityChallenge: ["City Challenge", "چالش شهر", "تحدي المدينة"],
  cityChallengeD: ["Master the food of one city.", "غذای یک شهر را فتح کن.", "أتقن طعام مدينة واحدة."],
  startCityChallenge: ["Start {c} Challenge", "شروع چالش {c}", "ابدأ تحدي {c}"],
  exploreCity: ["Explore {c} food", "گشت در غذای {c}", "استكشف طعام {c}"],
  cityFoods: ["{c} Foods", "غذاهای {c}", "أطعمة {c}"],
  filterCity: ["City", "شهر", "المدينة"],
  // collection
  collection: ["Food Collection", "مجموعه غذاها", "مجموعة الأطعمة"],
  discoveredLbl: ["Discovered", "کشف‌شده", "مكتشف"],
  undiscovered: ["Undiscovered", "کشف‌نشده", "غير مكتشف"],
  discoveredOf: ["{a} / {b} discovered", "{a} / {b} کشف شده", "{a} / {b} مكتشف"],
  completion: ["Completion", "تکمیل", "الإكمال"],
  lockedCard: ["Guess it in-game to unlock!", "در بازی حدس بزن تا باز شود!", "خمّنه في اللعبة لفتحه!"],
  mysteryEntry: ["Mystery Food", "غذای مرموز", "طعام غامض"],
  allFoods: ["All", "همه", "الكل"],
  // mystery mode
  mystery: ["Mystery Food", "غذای مرموز", "الطعام الغامض"],
  mysteryD: ["A hidden dish. Reveal clues, pay less, win more.", "غذایی پنهان. سرنخ را آشکار کن، کمتر بپرداز، بیشتر ببر.", "طبق مخفي. اكشف الأدلة وادفع أقل واكسب أكثر."],
  revealImage: ["Reveal Image", "آشکارکردن تصویر", "اكشف الصورة"],
  revealCost: ["Reveals used: {n}", "آشکارسازی: {n}", "الكشوفات: {n}"],
  // coins & hints
  coinsLbl: ["Coins", "سکه", "عملات"],
  useHint: ["Hint", "راهنمایی", "تلميح"],
  notEnoughCoins: ["Not enough coins", "سکه کافی نیست", "عملات غير كافية"],
  freeHintsLeft: ["{n} free hints today", "{n} راهنمایی رایگان امروز", "{n} تلميحات مجانية اليوم"],
  hintCountry: ["Reveal country", "نشان‌دادن کشور", "اكشف الدولة"],
  hintLetter: ["First letter", "حرف اول", "الحرف الأول"],
  hintRemove: ["Remove one wrong answer", "حذف یک پاسخ غلط", "أزل إجابة خاطئة"],
  hintCategory: ["Reveal category", "نشان‌دادن دسته", "اكشف الفئة"],
  hintRegion: ["Reveal region", "نشان‌دادن منطقه", "اكشف المنطقة"],
  hintImage: ["Sharpen image", "واضح‌کردن تصویر", "وضّح الصورة"],
  coinsEarned: ["Coins Earned", "سکه کسب‌شده", "العملات المكتسبة"],
  // recipes
  recipeLbl: ["Recipe", "دستور پخت", "الوصفة"],
  ingredientsFull: ["Ingredients", "مواد اولیه", "المكوّنات"],
  instructions: ["Instructions", "طرز تهیه", "التعليمات"],
  cookingInfo: ["Cooking Information", "اطلاعات پخت", "معلومات الطهي"],
  prepTime: ["Prep time", "زمان آماده‌سازی", "وقت التحضير"],
  cookTime: ["Cook time", "زمان پخت", "وقت الطهي"],
  servings: ["Servings", "نفرات", "الحصص"],
  methodLbl: ["Method", "روش پخت", "الطريقة"],
  originLbl: ["Origin & Background", "خاستگاه و پیشینه", "الأصل والخلفية"],
  regionalVariations: ["Regional Variations", "تنوع منطقه‌ای", "تنويعات إقليمية"],
  interestingFacts: ["Interesting Facts", "دانستنی‌ها", "حقائق مثيرة"],
  relatedFoods: ["Related Foods", "غذاهای مرتبط", "أطعمة ذات صلة"],
  classicRecipe: ["Signature recipe", "دستور اصیل", "وصفة مميزة"],
  generatedRecipe: ["Typical home-style variation", "نسخه خانگی رایج", "نسخة منزلية نموذجية"],
  recipeNote: ["Recipes vary by region and household — this is a typical version, not the only authentic one.", "دستورها بسته به منطقه و خانواده فرق می‌کنند — این نسخهٔ رایج است، نه تنها نسخهٔ اصیل.", "تختلف الوصفات حسب المنطقة والأسرة — هذه نسخة نموذجية وليست الوحيدة الأصيلة."],
  fullRecipe: ["Full Recipe", "دستور کامل", "الوصفة الكاملة"],
  // food detail
  overview: ["Overview", "نمای کلی", "نظرة عامة"],
  foodDetail: ["Food Detail", "جزئیات غذا", "تفاصيل الطعام"],
  playToDiscover: ["Play to discover", "بازی کن تا کشف شود", "العب لتكتشف"],
  // daily theme
  todaysTheme: ["Today's Theme", "موضوع امروز", "موضوع اليوم"],
  // profile extras
  foodsDiscovered: ["Foods Discovered", "غذاهای کشف‌شده", "أطعمة مكتشفة"],
  countriesDiscovered: ["Countries", "کشورها", "الدول"],
  citiesDiscovered: ["Cities Discovered", "شهرهای کشف‌شده", "مدن مكتشفة"],
  avatar: ["Avatar", "آواتار", "الصورة الرمزية"],
  hintsUsedLbl: ["Hints Used", "راهنمایی‌های استفاده‌شده", "التلميحات المستخدمة"],
  newDiscovery: ["New food discovered!", "غذای جدید کشف شد!", "اكتُشف طعام جديد!"],
  save: ["Save", "ذخیره", "حفظ"],
  delete: ["Delete", "حذف", "حذف"],
  edit: ["Edit", "ویرایش", "تعديل"],
  add: ["Add", "افزودن", "إضافة"],
  today: ["Today", "امروز", "اليوم"],
  best: ["Best", "بهترین", "الأفضل"],
  you: ["You", "شما", "أنت"],
  locked: ["Locked", "قفل", "مقفل"],
  unlockAt: ["Unlocks at {req}", "باز شدن در {req}", "يفتح عند {req}"],
  // modes
  classic: ["Classic", "کلاسیک", "كلاسيكي"],
  classicD: ["20 questions, 3 lives. Build your score dish by dish.", "۲۰ سؤال، ۳ جان. امتیازت را غذا به غذا بساز.", "20 سؤالاً و3 أرواح. اجمع نقاطك طبقاً تلو طبق."],
  timeattack: ["Time Attack", "حمله زمانی", "هجوم الوقت"],
  timeattackD: ["60 seconds. Answer fast — speed earns bonus points.", "۶۰ ثانیه. سریع جواب بده — سرعت امتیاز اضافه دارد.", "60 ثانية. أجب بسرعة — السرعة تمنح نقاطاً إضافية."],
  endless: ["Endless", "بی‌پایان", "لا نهائي"],
  endlessD: ["No finish line. Difficulty climbs until you crack.", "خط پایانی نیست. سختی بالا می‌رود تا کم بیاوری.", "بلا نهاية. تزداد الصعوبة حتى تنهار."],
  countryMode: ["Country Challenge", "چالش کشور", "تحدي دولة"],
  countryModeD: ["One nation, one cuisine. Master it completely.", "یک کشور، یک آشپزی. کامل فتحش کن.", "دولة واحدة ومطبخ واحد. أتقنه تماماً."],
  worldMode: ["World Challenge", "چالش جهانی", "تحدي العالم"],
  worldModeD: ["Dishes from every corner of the planet.", "غذاهایی از هر گوشه سیاره.", "أطباق من كل ركن في الكوكب."],
  dailyChallenge: ["Daily Challenge", "چالش روزانه", "التحدي اليومي"],
  dailyD: ["The same 10 questions for everyone, every day.", "هر روز ۱۰ سؤال یکسان برای همه.", "عشرة أسئلة ثابتة للجميع كل يوم."],
  // difficulty
  easy: ["Easy", "آسان", "سهل"],
  easyD: ["World-famous icons everyone knows.", "نمادهای مشهور جهانی که همه می‌شناسند.", "أيقونات عالمية يعرفها الجميع."],
  medium: ["Medium", "متوسط", "متوسط"],
  mediumD: ["Regional classics and real ingredients.", "غذاهای منطقه‌ای و مواد اولیه واقعی.", "أطباق إقليمية ومكوّنات حقيقية."],
  hard: ["Hard", "سخت", "صعب"],
  hardD: ["Obscure dishes, tricky regions and meats.", "غذاهای گمنام، منطقه‌ها و گوشت‌های فریبنده.", "أطباق غامضة ومناطق ولحوم خادعة."],
  extreme: ["Expert", "حرفه‌ای", "خبير"],
  extremeD: ["Traditional, historical and highly regional dishes.", "غذاهای سنتی، تاریخی و به‌شدت منطقه‌ای.", "أطباق تقليدية وتاريخية وإقليمية للغاية."],
  impossible: ["Master", "استاد", "أسطوري"],
  impossibleD: ["Extremely difficult food questions for true connoisseurs.", "سؤالات غذایی فوق‌سخت برای خبرگان واقعی.", "أسئلة طعام شديدة الصعوبة للخبراء الحقيقيين."],
  mixed: ["Mixed", "ترکیبی", "مختلط"],
  mixedD: ["A ramp from easy to brutal.", "شیبی از آسان تا بی‌رحم.", "منحدر من السهل إلى القاسي."],
  // setup
  chooseDifficulty: ["Choose difficulty", "سختی را انتخاب کن", "اختر الصعوبة"],
  chooseCountry: ["Choose a country", "کشور را انتخاب کن", "اختر دولة"],
  questionsCount: ["Questions", "تعداد سؤال", "عدد الأسئلة"],
  livesCount: ["Lives", "جان", "الأرواح"],
  startGame: ["Start Game", "شروع بازی", "ابدأ اللعبة"],
  // game
  timeLeft: ["Time left", "زمان باقی‌مانده", "الوقت المتبقي"],
  questionOf: ["Question {a} of {b}", "سؤال {a} از {b}", "السؤال {a} من {b}"],
  gameOver: ["Game Over", "پایان بازی", "انتهت اللعبة"],
  livesOut: ["Out of lives!", "جان‌ها تمام شد!", "نفدت الأرواح!"],
  timesUp: ["Time's up!", "وقت تمام شد!", "انتهى الوقت!"],
  points: ["pts", "امتیاز", "نقطة"],
  foodFact: ["Food fact", "دانستنی غذا", "معلومة غذائية"],
  foodInfo: ["Food Card", "کارت غذا", "بطاقة الطعام"],
  countryLbl: ["Country", "کشور", "الدولة"],
  cuisineLbl: ["Cuisine", "آشپزی", "المطبخ"],
  ingredientsLbl: ["Main Ingredients", "مواد اولیه اصلی", "المكوّنات الرئيسية"],
  meatLbl: ["Meat", "گوشت", "اللحم"],
  regionLbl: ["Region", "منطقه", "المنطقة"],
  spiceLbl: ["Spice Level", "تندی", "مستوى الحرارة"],
  categoryLbl: ["Categories", "دسته‌ها", "الفئات"],
  diffLbl: ["Difficulty", "سختی", "الصعوبة"],
  vegLbl: ["Vegetarian", "گیاهخواری", "نباتي"],
  veganLbl: ["Vegan", "وگان", "نباتي صرف"],
  descLbl: ["Description", "توضیح", "الوصف"],
  usedIn: ["Used in {n} dishes", "در {n} غذا به کار رفته", "يستخدم في {n} طبقاً"],
  dishes: ["dishes", "غذا", "طبقاً"],
  keyboardHint: ["Keys 1–4 to answer · Enter for next", "کلیدهای ۱ تا ۴ برای پاسخ · Enter برای بعدی", "المفاتيح 1–4 للإجابة · Enter للتالي"],
  // question templates
  qCountry: ["Which country is {food} from?", "{food} از کدام کشور است؟", "من أي بلد يأتي طبق {food}؟"],
  qFoodName: ["What is the name of this dish?", "نام این غذا چیست؟", "ما اسم هذا الطبق؟"],
  qIngredient: ["Which ingredient is traditionally used in {food}?", "کدام ماده به‌طور سنتی در {food} به کار می‌رود؟", "أي مكوّن يستخدم تقليدياً في {food}؟"],
  qMeat: ["What meat is commonly used in {food}?", "در {food} معمولاً چه گوشتی به کار می‌رود؟", "أي لحم يستخدم عادة في {food}؟"],
  qRegion: ["Which region is {food} associated with?", "{food} با کدام منطقه گره خورده است؟", "بأي منطقة يرتبط طبق {food}؟"],
  qCuisine: ["Which cuisine does {food} belong to?", "{food} به کدام آشپزی تعلق دارد؟", "إلى أي مطبخ ينتمي {food}؟"],
  qNotIngredient: ["Which of these is NOT normally used in {food}?", "کدام‌یک از این‌ها معمولاً در {food} به کار نمی‌رود؟", "أيٌّ مما يلي لا يستخدم عادة في {food}؟"],
  qIngFood: ["Which dish is made with these ingredients?", "کدام غذا با این مواد اولیه درست می‌شود؟", "أي طبق يُصنع من هذه المكوّنات؟"],
  qRecipe: ["These recipe steps describe which dish?", "این مراحل پخت، کدام غذا را توصیف می‌کنند؟", "خطوات الطهي هذه تصف أي طبق؟"],
  qCity: ["Which city is this food associated with?", "این غذا با کدام شهر گره خورده است؟", "بأي مدينة يرتبط هذا الطعام؟"],
  // results
  gameComplete: ["Game Complete!", "بازی کامل شد!", "اكتملت اللعبة!"],
  finalScore: ["Final Score", "امتیاز نهایی", "النقاط النهائية"],
  correctAnswers: ["Correct Answers", "پاسخ‌های درست", "إجابات صحيحة"],
  accuracy: ["Accuracy", "دقت", "الدقة"],
  bestComboLbl: ["Best Combo", "بهترین کمبو", "أفضل كومبو"],
  highestStreakLbl: ["Highest Streak", "طولانی‌ترین پیاپی", "أطول سلسلة"],
  xpEarned: ["XP Earned", "تجربه کسب‌شده", "نقاط الخبرة"],
  playAgain: ["Play Again", "بازی دوباره", "العب مجدداً"],
  backHome: ["Home", "خانه", "الرئيسية"],
  newAchievements: ["Achievements Unlocked", "دستاوردهای جدید", "إنجازات مفتوحة"],
  levelUpMsg: ["LEVEL UP!", "ارتقای سطح!", "ارتقاء المستوى!"],
  newRecord: ["New record!", "رکورد جدید!", "رقم قياسي جديد!"],
  // daily
  gregorianDate: ["Gregorian", "میلادی", "ميلادي"],
  persianDate: ["Solar Hijri", "هجری شمسی", "هجري شمسي"],
  dailyStatus: ["Status", "وضعیت", "الحالة"],
  notStarted: ["Not started", "شروع نشده", "لم يبدأ"],
  completedLbl: ["Completed", "کامل شد", "مكتمل"],
  playDaily: ["Play Today's Challenge", "چالش امروز را بازی کن", "العب تحدي اليوم"],
  dailyDoneMsg: ["Come back tomorrow for a fresh set!", "فردا برای مجموعه جدید برگرد!", "عُد غداً لمجموعة جديدة!"],
  dailyQs: ["{n} questions", "{n} سؤال", "{n} أسئلة"],
  bestScoreLbl: ["Best score", "بهترین امتیاز", "أفضل نتيجة"],
  // profile
  playerProfile: ["Player Profile", "پروفایل بازیکن", "ملف اللاعب"],
  username: ["Username", "نام کاربری", "اسم المستخدم"],
  totalScore: ["Total Score", "مجموع امتیاز", "مجموع النقاط"],
  gamesPlayed: ["Games Played", "بازی‌های انجام‌شده", "ألعاب لعبت"],
  correctAns: ["Correct Answers", "پاسخ درست", "إجابات صحيحة"],
  favoriteCountry: ["Favorite Country", "کشور مورد علاقه", "الدولة المفضلة"],
  favoriteFood: ["Favorite Food", "غذای مورد علاقه", "الطعام المفضل"],
  badges: ["Badges & Achievements", "نشان‌ها و دستاوردها", "الشارات والإنجازات"],
  xpLbl: ["XP", "تجربه", "خبرة"],
  toNext: ["{n} XP to next level", "{n} تجربه تا سطح بعد", "{n} خبرة للمستوى التالي"],
  saveName: ["Save name", "ذخیره نام", "حفظ الاسم"],
  notYet: ["Not yet unlocked", "هنوز باز نشده", "غير مفتوح بعد"],
  // leaderboard
  lbGlobal: ["Global", "جهانی", "عالمي"],
  lbDaily: ["Daily", "روزانه", "يومي"],
  lbWeekly: ["Weekly", "هفتگی", "أسبوعي"],
  lbMonthly: ["Monthly", "ماهانه", "شهري"],
  lbCountry: ["By Country", "بر اساس کشور", "حسب الدولة"],
  rank: ["#", "#", "#"],
  player: ["Player", "بازیکن", "اللاعب"],
  streakCol: ["Streak", "پیاپی", "سلسلة"],
  correctCol: ["Correct", "درست", "صحيح"],
  demoNote: ["Demo standings — backend-ready architecture.", "جدول نمایشی — معماری آمادهٔ اتصال به سرور.", "ترتيب تجريبي — بنية جاهزة للخادم."],
  chooseCountryLb: ["Pick a country to rank its food masters.", "کشوری را برای رتبه‌بندی استادان غذایش انتخاب کن.", "اختر دولة لترتيب سادتها في الطعام."],
  // settings
  language: ["Language", "زبان", "اللغة"],
  soundFx: ["Sound Effects", "افکت‌های صوتی", "المؤثرات الصوتية"],
  musicLbl: ["Ambient Music", "موسیقی محیطی", "موسيقى محيطة"],
  notifications: ["Notifications", "اعلان‌ها", "الإشعارات"],
  themeLbl: ["Theme", "پوسته", "السمة"],
  dark: ["Dark", "تیره", "داكن"],
  light: ["Light", "روشن", "فاتح"],
  calendarType: ["Calendar", "تقویم", "التقويم"],
  gregorianCal: ["Gregorian", "میلادی", "ميلادي"],
  persianCal: ["Persian (Solar Hijri)", "هجری شمسی", "هجري شمسي"],
  animationsLbl: ["Animations", "انیمیشن‌ها", "الحركات"],
  on: ["On", "روشن", "تشغيل"],
  off: ["Off", "خاموش", "إيقاف"],
  // admin
  adminPanel: ["Admin Panel", "پنل مدیریت", "لوحة الإدارة"],
  enterPin: ["Enter admin PIN", "پین مدیریت را وارد کن", "أدخل رمز الإدارة"],
  wrongPin: ["Wrong PIN. (Demo PIN: 2024)", "پین اشتباه است. (پین نمایشی: 2024)", "رمز خاطئ. (رمز تجريبي: 2024)"],
  adminNote: ["Client-side demo. In production, all mutations are validated server-side.", "نسخه نمایشی سمت کلاینت. در نسخه اصلی همه تغییرات سمت سرور اعتبارسنجی می‌شود.", "نسخة تجريبية على المتصفح. في الإنتاج تُتحقق كل التعديلات على الخادم."],
  dbStats: ["Database Statistics", "آمار پایگاه داده", "إحصاءات قاعدة البيانات"],
  foodsAdmin: ["Foods", "غذاها", "الأطعمة"],
  countriesAdmin: ["Countries", "کشورها", "الدول"],
  addFood: ["Add Food", "افزودن غذا", "إضافة طعام"],
  scoringCfg: ["Scoring Configuration", "پیکربندی امتیازدهی", "إعداد النقاط"],
  confirmDelete: ["Delete this food?", "این غذا حذف شود؟", "حذف هذا الطعام؟"],
  saved: ["Saved ✓", "ذخیره شد ✓", "تم الحفظ ✓"],
  idLbl: ["ID", "شناسه", "المعرف"],
  nameEn: ["Name (English)", "نام (انگلیسی)", "الاسم (إنجليزي)"],
  nameFa: ["Name (Persian)", "نام (فارسی)", "الاسم (فارسي)"],
  nameAr: ["Name (Arabic)", "نام (عربی)", "الاسم (عربي)"],
  emojiLbl: ["Emoji", "ایموجی", "رمز تعبيري"],
  descEn: ["Description (English)", "توضیح (انگلیسی)", "الوصف (إنجليزي)"],
  ingredientsKey: ["Ingredients (keys, comma separated)", "مواد اولیه (کلیدها، با کاما)", "المكوّنات (مفاتيح، مفصولة بفواصل)"],
  // misc / home
  foodsLbl: ["Foods", "غذا", "طعاماً"],
  countriesLbl: ["Countries", "کشور", "دولة"],
  questionsAvail: ["Question pool", "استخر سؤال", "مخزون الأسئلة"],
  ingredientsLbl2: ["Ingredients", "مواد اولیه", "مكوّنات"],
  tasteWorld: ["Taste the world", "دنیا را بچش", "تذوّق العالم"],
  howTo: ["How to play", "روش بازی", "كيف تلعب"],
  howTo1: ["A dish appears with a clue — country, ingredient, meat or region.", "غذایی با یک سرنخ ظاهر می‌شود — کشور، ماده اولیه، گوشت یا منطقه.", "يظهر طبق مع تلميح — دولة، مكوّن، لحم أو منطقة."],
  howTo2: ["Pick one of four answers before your lives run out.", "پیش از تمام‌شدن جان‌ها یکی از چهار پاسخ را بزن.", "اختر من أربع إجابات قبل نفاد أرواحك."],
  howTo3: ["Chain correct answers for combos up to ×5 and global glory.", "پاسخ‌های درست را زنجیره کن تا کمبوی ×۵ و افتخار جهانی.", "اربط الإجابات الصحيحة لكومبو حتى ×5 ومجد عالمي."],
  startChallenge: ["Start {c} Challenge", "شروع چالش {c}", "ابدأ تحدي {c}"],
  exploreFoods: ["Explore {c} food", "گشت در غذای {c}", "استكشف طعام {c}"],
  foodsCount: ["{n} foods", "{n} غذا", "{n} طعاماً"],
  cuisineOf: ["{c} Cuisine", "آشپزی {c}", "مطبخ {c}"],
  famousFoods: ["Famous foods", "غذاهای مشهور", "أطعمة مشهورة"],
  traditionalFoods: ["Traditional", "سنتی", "تقليدي"],
  regionalFoods: ["Regional", "منطقه‌ای", "إقليمي"],
  popularIn: ["Popular in {c}", "محبوب در {c}", "شائع في {c}"],
  iranSpotlight: ["Iran Spotlight", "ویترین ایران", "أضواء على إيران"],
  iranSpotD: ["Over 100 authentic Persian dishes — from Ghormeh Sabzi to Faloodeh.", "بیش از ۱۰۰ غذای اصیل ایرانی — از قورمه‌سبزی تا فالوده.", "أكثر من 100 طبق فارسي أصيل — من قورمه سبزي إلى الفالودة."],
  playIran: ["Play Iran Challenge", "بازی چالش ایران", "العب تحدي إيران"],
  iranianFoods: ["Iranian Foods", "غذاهای ایرانی", "الأطعمة الإيرانية"],
  worldFoods: ["World Foods", "غذاهای جهان", "أطعمة العالم"],
  filterCountry: ["Country", "کشور", "الدولة"],
  filterCategory: ["Category", "دسته", "الفئة"],
  filterDiff: ["Difficulty", "سختی", "الصعوبة"],
  filterMeat: ["Meat", "گوشت", "اللحم"],
  filterSpice: ["Spice", "تندی", "الحرارة"],
  vegOnly: ["Vegetarian", "گیاهخواری", "نباتي"],
  veganOnly: ["Vegan", "وگان", "نباتي صرف"],
  showing: ["Showing {a}–{b} of {c}", "نمایش {a}–{b} از {c}", "عرض {a}–{b} من {c}"],
  offlineMsg: ["You're offline — FoodGuess still runs, progress saves locally.", "آفلاین هستید — فودگس هنوز کار می‌کند و پیشرفت محلی ذخیره می‌شود.", "أنت غير متصل — فود غيس يعمل ويحفظ تقدمك محلياً."],
  welcomeBack: ["Welcome back, {n}", "خوش آمدی، {n}", "مرحباً بعودتك، {n}"],
  totalXp: ["Total XP", "مجموع تجربه", "مجموع الخبرة"],
  achievementsUnlocked: ["{a}/{b} unlocked", "{a} از {b} باز شده", "{a}/{b} مفتوحة"],
  dailyStreakLbl: ["Daily streak", "پیاپی روزانه", "سلسلة يومية"],
  daysPlayed: ["{n} days", "{n} روز", "{n} يوماً"],
  speedBonus: ["Speed bonus", "پاداش سرعت", "مكافأة سرعة"],
  comboBonus: ["Combo ×{n}", "کمبو ×{n}", "كومبو ×{n}"],
  correctLbl: ["Correct!", "درست!", "صحيح!"],
  wrongLbl: ["Not quite!", "نه دقیقاً!", "ليس تماماً!"],
  correctWas: ["Correct answer", "پاسخ درست", "الإجابة الصحيحة"],
  whyCorrect: ["Why it's right", "چرا درست است", "لماذا هي صحيحة"],
  keepPlaying: ["Keep playing", "ادامه بازی", "واصل اللعب"],
  questionCount: ["{n} questions", "{n} سؤال", "{n} سؤالاً"],
  foodDetails: ["Food Details", "جزئیات غذا", "تفاصيل الطعام"],
  continentLbl: ["Continent", "قاره", "القارة"],
  noFoodsYet: ["This country has no foods in the database yet.", "این کشور هنوز غذایی در پایگاه داده ندارد.", "لا أطعمة لهذه الدولة في قاعدة البيانات بعد."],
  searchHint: ["Try \"saffron\", \"زعفران\" or \"stew\"", "\"زعفران\"، \"قورمه\" یا \"kabab\" را امتحان کن", "جرّب «زعفران» أو «كباب»"],
};

interface I18nCtx {
  lang: Lang;
  setLang: (l: Lang) => void;
  dir: "ltr" | "rtl";
  t: (key: string, vars?: Record<string, string | number>) => string;
  L: (l10n: L10n | undefined, fallback?: string) => string;
}

const Ctx = createContext<I18nCtx>({
  lang: "en", setLang: () => {}, dir: "ltr", t: (k) => k, L: (l) => l?.en ?? "",
});

export function I18nProvider({ children, initialLang }: { children: ReactNode; initialLang: Lang }) {
  const [lang, setLangState] = useState<Lang>(initialLang);
  const dir: "ltr" | "rtl" = lang === "en" ? "ltr" : "rtl";

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    try { localStorage.setItem("fg_lang", l); } catch { /* private mode */ }
  }, []);

  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = dir;
  }, [lang, dir]);

  const t = useCallback((key: string, vars?: Record<string, string | number>) => {
    const row = S[key];
    let s = row ? row[lang === "fa" ? 1 : lang === "ar" ? 2 : 0] : key;
    if (vars) for (const k of Object.keys(vars)) s = s.split(`{${k}}`).join(String(vars[k]));
    return s;
  }, [lang]);

  const L = useCallback((l10n: L10n | undefined, fallback = "—") => {
    if (!l10n) return fallback;
    const v = lang === "fa" ? l10n.fa : lang === "ar" ? l10n.ar : l10n.en;
    return v || l10n.en || fallback;
  }, [lang]);

  const value = useMemo(() => ({ lang, setLang, dir, t, L }), [lang, setLang, dir, t, L]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export const useI18n = () => useContext(Ctx);
