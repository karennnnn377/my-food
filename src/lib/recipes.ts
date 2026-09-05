import type { Food, Lang } from "../data/types";
import { ingredientName, meatName } from "./data";

/** Recipe engine. Iconic dishes carry hand-written recipes; every other dish gets a
 *  structured home-style recipe generated from its real ingredient list.
 *  All recipes are labelled as typical variations — never claimed as the single authentic form. */

export interface RecipeItem { ing: string; amount: string }
export interface RecipeStep { en: string; fa: string; ar: string }
export interface Recipe {
  items: RecipeItem[];
  steps: RecipeStep[];
  prep: number; // minutes
  cook: number; // minutes
  servings: number;
  method: { en: string; fa: string; ar: string };
  classic: boolean; // hand-written vs generated
}

type Trio = [string, string, string];

// ---------------- hand-written signature recipes ----------------
const SIG: Record<string, { items: RecipeItem[]; steps: Trio[]; prep: number; cook: number; servings: number; method: Trio }> = {
  "ghormeh-sabzi": {
    items: [
      { ing: "beef", amount: "500 g" }, { ing: "kidney-beans", amount: "1 cup, soaked overnight" },
      { ing: "parsley", amount: "200 g" }, { ing: "cilantro", amount: "150 g" },
      { ing: "fenugreek", amount: "4 tbsp dried" }, { ing: "dried-lime", amount: "4 whole, pierced" },
      { ing: "onion", amount: "2 large, diced" }, { ing: "turmeric", amount: "1 tsp" },
    ],
    steps: [
      ["Fry the diced onion in oil until golden, add turmeric and sear the beef cubes on all sides.", "پیاز خردشده را در روغن سرخ کنید تا طلایی شود، زردچوبه بزنید و تکه‌های گوشت را از همه‌طرف تفت دهید.", "اقلي البصل المفروم بالزيت حتى يذهب لونه، أضيفي الكركم وحمّري مكعبات اللحم من كل الجوانب."],
      ["Add the soaked kidney beans and 4 cups of water; simmer gently for about an hour.", "لوبیای خیس‌خورده و ۴ لیوان آب اضافه کنید و حدود یک ساعت آرام بپزید.", "أضيفي الفاصولياء المنقوعة و4 أكواب ماء واتركيها تغلي بهدوء ساعة تقريباً."],
      ["Meanwhile, fry the finely chopped parsley, cilantro and fenugreek slowly until very dark green and fragrant — this is the soul of the stew.", "در این میان، جعفری، گشنیز و شنبلیله خردشده را آرام سرخ کنید تا بسیار تیره و معطر شوند — این روح خورشت است.", "في هذه الأثناء اقلي البقدونس والكزبرة والحلبة المفرومة ببطء حتى تصبح خضراء داكنة وعطرة — هذه روح اليخنة."],
      ["Stir the fried herbs and the pierced dried limes into the pot; season with salt.", "سبزی سرخ‌شده و لیموعمانی‌های سوراخ‌شده را به قابلمه اضافه کنید و نمک بزنید.", "أضيفي الأعشاب المقلية والليمون الأسود المثقوب إلى القدر وتبّلي بالملح."],
      ["Simmer 45–60 minutes more until the oil rises and the stew turns dark. Serve over chelo rice.", "۴۵ تا ۶۰ دقیقه دیگر بپزید تا روغن بیندازد و تیره شود. با چلو سرو کنید.", "اتركيها 45–60 دقيقة أخرى حتى يطفو الزيت ويسودّ لونها. قدّميها فوق الأرز."],
    ],
    prep: 40, cook: 150, servings: 5, method: ["Slow simmer", "پخت آرام", "طهي بطيء"],
  },
  "fesenjan": {
    items: [
      { ing: "chicken", amount: "8 pieces (or duck)" }, { ing: "walnuts", amount: "300 g, finely ground" },
      { ing: "pomegranate-molasses", amount: "1 cup" }, { ing: "onion", amount: "3 grated" },
      { ing: "sugar", amount: "2 tbsp (to balance)" }, { ing: "saffron", amount: "1 pinch, bloomed" },
    ],
    steps: [
      ["Sauté the grated onion until soft and translucent.", "پیاز رنده‌شده را تفت دهید تا نرم و شفاف شود.", "قلّبي البصل المبروش حتى يذبل ويصبح شفافاً."],
      ["Add the ground walnuts and 4 cups of water; whisk into a smooth, pale sauce.", "گردوی آسیاب‌شده و ۴ لیوان آب اضافه کنید و هم بزنید تا سس یکدست و روشنی شود.", "أضيفي الجوز المطحون و4 أكواب ماء واخفقي حتى تحصلي على صلصة ناعمة فاتحة."],
      ["Stir in pomegranate molasses, sugar and saffron; nestle in the chicken pieces.", "رب انار، شکر و زعفران را اضافه کنید و تکه‌های مرغ را داخل سس بگذارید.", "أضيفي دبس الرمان والسكر والزعفران وغمّري قطع الدجاج في الصلصة."],
      ["Simmer on the lowest heat 1.5–2 hours, stirring now and then, until the sauce darkens and oil rises.", "با کمترین حرارت ۱.۵ تا ۲ ساعت بپزید و گاهی هم بزنید تا سس تیره شود و روغن بیندازد.", "اتركيها على أضعف نار ساعة ونصف إلى ساعتين مع التقليب أحياناً حتى تسودّ الصلصة ويفوح زيتها."],
      ["Taste for the sweet–sour balance, adjust, and serve over saffron rice.", "تعادل ترش و شیرین را بچشید و تنظیم کنید و با برنج زعفرانی سرو کنید.", "تذوّقي توازن الحامض والحلو وعدّليه، وقدّمي الطبق فوق الأرز بالزعفران."],
    ],
    prep: 25, cook: 130, servings: 5, method: ["Slow braise", "برشت آرام", "تسبيك بطيء"],
  },
  "kabab-koobideh": {
    items: [
      { ing: "beef", amount: "500 g, double-minced with fat" }, { ing: "onion", amount: "2, grated & squeezed dry" },
      { ing: "saffron", amount: "1 pinch, bloomed" }, { ing: "black-pepper", amount: "1 tsp" },
      { ing: "tomato", amount: "4, halved for grilling" }, { ing: "butter", amount: "3 tbsp, for basting" },
    ],
    steps: [
      ["Knead the minced meat with squeezed onion, salt, pepper and saffron for 5 minutes until sticky.", "گوشت چرخ‌کرده را با پیاز آب‌گرفته، نمک، فلفل و زعفران ۵ دقیقه ورز دهید تا چسبناک شود.", "اعجني اللحم المفروم مع البصل المعصور والملح والفلفل والزعفران 5 دقائق حتى يتماسك."],
      ["Chill the mixture 30 minutes — cold meat grips the skewer.", "مایه را ۳۰ دقیقه سرد کنید — گوشت سرد به سیخ می‌چسبد.", "برّدي الخليط 30 دقيقة — اللحم البارد يمسك بالسيخ."],
      ["Press the meat along wide flat skewers in an even layer, wetting your hand with salted water.", "با دست خیسِ آب‌نمک، گوشت را به‌صورت لایه‌ای یکنواخت روی سیخ‌های پهن فشار دهید.", "اضغطي اللحم على أسياخ عريضة بطبقة متساوية وبلّلي يدك بماء مملح."],
      ["Grill over hot coals 3–4 minutes per side, fanning the flames and turning once.", "روی زغال داغ از هر طرف ۳–۴ دقیقه کباب کنید و یک‌بار برگردانید.", "اشوِها على جمر ساخن 3–4 دقائق لكل جانب واقلبيها مرة واحدة."],
      ["Baste with saffron butter, serve with grilled tomatoes, raw onion and sangak.", "با کره زعفرانی رومال کنید و با گوجه کبابی، پیاز خام و سنگک سرو کنید.", "ادهنيها بزبدة الزعفران وقدّميها مع الطماطم المشوية والبصل النيئ وخبز السنكك."],
    ],
    prep: 45, cook: 12, servings: 4, method: ["Charcoal grill", "کباب زغالی", "شوي على الفحم"],
  },
  "zereshk-polo": {
    items: [
      { ing: "rice", amount: "3 cups, soaked" }, { ing: "barberry", amount: "1 cup" },
      { ing: "chicken", amount: "4 legs" }, { ing: "saffron", amount: "1 pinch, bloomed" },
      { ing: "sugar", amount: "2 tbsp" }, { ing: "butter", amount: "3 tbsp" }, { ing: "onion", amount: "1, sliced" },
    ],
    steps: [
      ["Brown the chicken with onion, salt, pepper and a little saffron; add 1 cup water and braise 30 minutes.", "مرغ را با پیاز، نمک، فلفل و کمی زعفران سرخ کنید؛ ۱ لیوان آب بریزید و ۳۰ دقیقه بپزید.", "حمّري الدجاج مع البصل والملح والفلفل وقليل من الزعفران، أضيفي كوب ماء واتركيه 30 دقيقة."],
      ["Parboil the soaked rice until the grains are tender outside and firm inside; drain.", "برنج خیس‌خورده را نیم‌پز کنید تا بیرونش نرم و مغزش سفت باشد؛ آبکش کنید.", "اسلقي الأرز المنقوع نصف سلق ثم صفّيه."],
      ["Mound the rice in the pot over oil for tahdig; spoon bloomed saffron over parts of it. Steam 40 minutes.", "برنج را روی روغنِ ته قابلمه جمع کنید و زعفران دم‌کرده روی بخشی از آن بریزید و ۴۰ دقیقه دم کنید.", "كوّمي الأرز فوق زيت القاع ووزّعي الزعفران على أجزاء منه واتركيه على البخار 40 دقيقة."],
      ["Warm the barberries with butter, sugar and a splash of water for 2 minutes.", "زرشک را با کره، شکر و کمی آب ۲ دقیقه گرم کنید.", "سخّني الزرشك مع الزبدة والسكر ورشة ماء دقيقتين."],
      ["Fold half the barberries into saffron rice; scatter the rest on top with the chicken.", "نیمی از زرشک را با برنج زعفرانی مخلوط و بقیه را با مرغ روی آن بپاشید.", "اخلطي نصف الزرشك مع الأرز وانثري الباقي فوقه مع الدجاج."],
    ],
    prep: 30, cook: 70, servings: 4, method: ["Steam (demi)", "دم‌کردن", "تبخير"],
  },
  "tahchin": {
    items: [
      { ing: "rice", amount: "2.5 cups, soaked" }, { ing: "yogurt", amount: "1.5 cups, thick" },
      { ing: "egg", amount: "2 yolks + 1 whole" }, { ing: "saffron", amount: "1 generous pinch" },
      { ing: "chicken", amount: "2 breasts, cooked & sliced" }, { ing: "barberry", amount: "½ cup" },
    ],
    steps: [
      ["Cook and slice the chicken; season it with salt and a little saffron water.", "مرغ را بپزید و برش بزنید و با نمک و کمی آب‌زعفران مزه‌دار کنید.", "اسلقي الدجاج وقطّعيه وتبّليه بالملح وقليل من ماء الزعفران."],
      ["Whisk yogurt, eggs and bloomed saffron into a golden sauce.", "ماست، تخم‌مرغ و زعفران دم‌کرده را هم بزنید تا سس طلایی شود.", "اخفقي الزبادي والبيض والزعفران حتى تحصلي على صلصة ذهبية."],
      ["Parboil the rice 6 minutes, drain, and fold it gently through the saffron yogurt.", "برنج را ۶ دقیقه نیم‌پز و آبکش کنید و آرام با ماست زعفرانی مخلوط کنید.", "اسلقي الأرز 6 دقائق وصفّيه وقلّبيه بلطف مع الزبادي بالزعفران."],
      ["Press half the rice into an oiled pot, layer the chicken and barberries, then the rest of the rice. Cook on low 45–50 minutes until a golden crust forms.", "نیمی از برنج را کف قابلمه روغن‌خورده فشرده کنید، مرغ و زرشک بچینید و بقیه برنج را بریزید. ۴۵–۵۰ دقیقه با حرارت کم بپزید تا ته‌دیگ طلایی شود.", "اضغطي نصف الأرز في قاع القدر المدهون، ضعي الدجاج والزرشك ثم باقي الأرز، واطبخي على نار هادئة 45–50 دقيقة حتى تتكوّن قشرة ذهبية."],
      ["Rest 10 minutes, invert onto a platter, and slice like a cake.", "۱۰ دقیقه استراحت دهید، در ظرف برگردانید و مثل کیک برش بزنید.", "اتركيه 10 دقائق واقلبيه في صحن التقديم وقطّعيه كالكعكة."],
    ],
    prep: 30, cook: 60, servings: 5, method: ["Inverted rice cake", "کیک برنجی وارونه", "كعكة أرز مقلوبة"],
  },
  "ash-reshteh": {
    items: [
      { ing: "noodles", amount: "200 g reshteh" }, { ing: "kidney-beans", amount: "½ cup, soaked" },
      { ing: "chickpeas", amount: "½ cup, soaked" }, { ing: "lentils", amount: "½ cup" },
      { ing: "spinach", amount: "300 g, with parsley & cilantro" }, { ing: "kashk", amount: "1 cup" },
      { ing: "onion", amount: "3, fried golden" }, { ing: "mint", amount: "2 tbsp dried, in hot oil" },
    ],
    steps: [
      ["Simmer chickpeas, kidney beans and lentils in plenty of water until nearly tender.", "نخود، لوبیا و عدس را در آب فراوان بپزید تا تقریباً نرم شوند.", "اسلقي الحمص والفاصولياء والعدس في ماء وفير حتى تقترب من النضج."],
      ["Add the chopped greens and cook until the herbs lose their raw edge.", "سبزی خردشده را اضافه کنید و بپزید تا بوی خامی آن گرفته شود.", "أضيفي الخضار المفرومة واطبخيها حتى تذهب نكهتها النيئة."],
      ["Drop in the reshteh noodles and stir gently so they don't clump; season well.", "رشته را اضافه کنید و آرام هم بزنید تا گوله نشود؛ خوب نمک بزنید.", "أضيفي خيوط الشعيرية وقلّبي برفق حتى لا تتكتّل وتبّلي جيداً."],
      ["Thin the kashk with warm water, whisk it in and heat through without boiling.", "کشک را با آب گرم رقیق کنید و هم‌بزنید و بدون جوشاندن گرم کنید.", "خفّفي الكشك بماء دافئ واخفقيه في الحساء وسخّنيه دون غليان."],
      ["Serve crowned with fried onion, kashk swirls and sizzling mint oil.", "با پیاز داغ، کشک و روغن نعناع داغ تزیین و سرو کنید.", "قدّميه مكلّلاً بالبصل المقلي والكشك وزيت النعناع الساخن."],
    ],
    prep: 30, cook: 90, servings: 8, method: ["Herb & noodle pot", "آش رشته", "قِدر أعشاب وشعيرية"],
  },
  "mirza-ghasemi": {
    items: [
      { ing: "eggplant", amount: "3 large" }, { ing: "garlic", amount: "6 cloves" },
      { ing: "tomato", amount: "3, grated" }, { ing: "egg", amount: "2" },
      { ing: "turmeric", amount: "½ tsp" }, { ing: "olive-oil", amount: "4 tbsp" },
    ],
    steps: [
      ["Char the eggplants directly over flame until the skins blacken and the flesh turns smoky.", "بادمجان‌ها را مستقیم روی شعله کباب کنید تا پوستشان سیاه و گوشتشان دودی شود.", "اشوي الباذنجان مباشرة على اللهب حتى يسودّ قشره ويصبح لبّه مدخناً."],
      ["Peel and mash the flesh roughly.", "پوست بکنید و گوشت را درشت له کنید.", "قشّريه واهرسي اللبّ هرساً خشناً."],
      ["Sauté sliced garlic in oil until fragrant; add turmeric and tomatoes and cook down.", "سیر ورقه‌شده را در روغن تفت دهید تا معطر شود؛ زردچوبه و گوجه بزنید و بپزید تا غلیظ شود.", "قلّبي شرائح الثوم بالزيت حتى تفوح رائحتها، أضيفي الكركم والطماطم واطبخيها حتى تتسبّك."],
      ["Fold in the eggplant, then stir in beaten eggs until just set.", "بادمجان را اضافه کنید و بعد تخم‌مرغ هم‌زده را هم بزنید تا خودش را بگیرد.", "أضيفي الباذنجان ثم اسكبي البيض المخفوق وقلّبي حتى يتماسك."],
      ["Serve warm or at room temperature with bread or kateh rice.", "گرم یا هم‌دمای محیط با نان یا کته سرو کنید.", "قدّميه ساخناً أو بحرارة الغرفة مع الخبز أو الأرز."],
    ],
    prep: 15, cook: 25, servings: 4, method: ["Fire-roast & sauté", "کبابی و تفت‌دادنی", "شوي على النار وقلي"],
  },
  "abgoosht": {
    items: [
      { ing: "lamb", amount: "600 g with bone" }, { ing: "chickpeas", amount: "½ cup, soaked" },
      { ing: "white-beans", amount: "½ cup, soaked" }, { ing: "potato", amount: "3, whole" },
      { ing: "tomato", amount: "3" }, { ing: "dried-lime", amount: "2" }, { ing: "onion", amount: "2, quartered" },
    ],
    steps: [
      ["Simmer lamb, beans, onion, turmeric and water in a clay or heavy pot for 2 hours, skimming the foam.", "گوشت، حبوبات، پیاز، زردچوبه و آب را ۲ ساعت در قابلمه سنگین بپزید و کف را بگیرید.", "اسلقي اللحم والبقول والبصل والكركم والماء ساعتين في قدر ثقيلة مع إزالة الرغوة."],
      ["Add tomatoes, dried limes, potatoes and salt; cook 45 minutes more.", "گوجه، لیموعمانی، سیب‌زمینی و نمک اضافه کنید و ۴۵ دقیقه دیگر بپزید.", "أضيفي الطماطم والليمون الأسود والبطاطس والملح واطبخي 45 دقيقة أخرى."],
      ["Ladle the broth over torn bread — this first course is called tilid.", "آبگوشت را روی نان خردشده بریزید — این بخش اول تلیت نام دارد.", "اسكبي المرق فوق خبز مقطّع — هذه الخطوة الأولى تسمى التليد."],
      ["Mash the meat, beans and potatoes in the pot into goosht-koobideh.", "گوشت، حبوبات و سیب‌زمینی را در ظرف بکوبید تا گوشت‌کوبیده شود.", "اهرسي اللحم والبقول والبطاطس في القدر لتحضير اللحوم المدقوقة."],
      ["Serve the mash with fresh herbs, onion and pickles beside the broth.", "کوبیده را با سبزی تازه، پیاز و ترشی کنار آبگوشت سرو کنید.", "قدّمي الهريس مع الأعشاب الطازجة والبصل والمخللات إلى جانب المرق."],
    ],
    prep: 20, cook: 165, servings: 4, method: ["Clay-pot stew", "دیزی سفالی", "يخنة القدر الفخارية"],
  },
  "sushi": {
    items: [
      { ing: "rice", amount: "2 cups short-grain" }, { ing: "rice-vinegar", amount: "4 tbsp" },
      { ing: "fish", amount: "300 g sushi-grade" }, { ing: "seaweed", amount: "4 nori sheets" },
      { ing: "sugar", amount: "1 tbsp" }, { ing: "wasabi", amount: "to serve" }, { ing: "soy-sauce", amount: "to serve" },
    ],
    steps: [
      ["Rinse the rice until water runs clear, cook with 2¼ cups water, and let it rest 10 minutes.", "برنج را بشویید تا آبش شفاف شود، با ۲¼ لیوان آب بپزید و ۱۰ دقیقه استراحت دهید.", "اغسلي الأرز حتى يصفو ماؤه واطبخيه مع كوبين وربع من الماء واتركيه يرتاح 10 دقائق."],
      ["Warm vinegar, sugar and salt; fold into the rice and fan it to a glossy sheen.", "سرکه، شکر و نمک را گرم کنید؛ با برنج مخلوط و باد بزنید تا براق شود.", "سخّني الخل والسكر والملح وقلّبيها في الأرز وروّحيه حتى يلمع."],
      ["Slice the fish into clean, even pieces with a sharp wet knife.", "ماهی را با چاقوی تیز و خیس به قطعات صاف و یکدست ببرید.", "قطّعي السمك بسكينة حادة مبللة إلى قطع متساوية."],
      ["For nigiri, press small ovals of rice and drape fish over them; for maki, roll rice and filling in nori on a mat.", "برای نیگیری، بیضی‌های کوچک برنج را فرم دهید و ماهی رویش بگذارید؛ برای ماکی، برنج و مواد را در نوری بپیچید.", "اصنعي بيضاوات صغيرة من الأرز للنيجيري وضعي السمك فوقها؛ وللكي لفّي الأرز والحشوة داخل النوري."],
      ["Serve immediately with soy sauce, wasabi and pickled ginger.", "فوری با سس سویا، وسابی و زنجبیل ترشی سرو کنید.", "قدّميه فوراً مع صلصة الصويا والوسابي والزنجبيل المخلل."],
    ],
    prep: 40, cook: 20, servings: 3, method: ["Hand-formed, no-cook", "دست‌ساز، بدون پخت", "تشكيل يدوي بدون طهي"],
  },
  "pad-thai": {
    items: [
      { ing: "noodles", amount: "200 g flat rice noodles, soaked" }, { ing: "shrimp", amount: "250 g" },
      { ing: "egg", amount: "2" }, { ing: "peanuts", amount: "3 tbsp, crushed" },
      { ing: "tamarind", amount: "3 tbsp paste" }, { ing: "fish-sauce", amount: "2 tbsp" },
      { ing: "lime", amount: "2, in wedges" }, { ing: "scallion", amount: "3, chopped" },
    ],
    steps: [
      ["Mix tamarind, fish sauce and palm sugar into the pad thai sauce.", "تمر هندی، سس ماهی و شکر نخل را مخلوط کنید تا سس پد تای شود.", "اخلطي التمر الهندي وصلصة السمك وسكر النخيل لتحضير صلصة الباد تاي."],
      ["Stir-fry shrimp in a screaming-hot wok until just pink; push aside and scramble the eggs.", "میگو را در تابه بسیار داغ تفت دهید تا صورتی شود؛ کنار بزنید و تخم‌مرغ را نیمرو کنید.", "قلّبي الروبيان في مقلاة شديدة السخونة حتى يكتسب لوناً وردياً؛ أزيحيه جانباً واخفقي البيض."],
      ["Add noodles and sauce; toss with tongs until the noodles drink the sauce.", "رشته و سس را اضافه کنید و هم بزنید تا رشته سس را جذب کند.", "أضيفي الشعيرية والصلصة وقلّبي حتى تشرب الشعيرية الصلصة."],
      ["Return the shrimp, add scallions and beansprouts, and toss once more.", "میگو، پیازچه و جوانه ماش را برگردانید و دوباره هم بزنید.", "أعيدي الروبيان وأضيفي البصل الأخضر وبراعم الفاصولياء وقلّبي مرة أخرى."],
      ["Plate up with crushed peanuts, lime wedges and extra chili flakes.", "با بادام‌زمینی خردشده، قاچ لیمو و فلفل سرو کنید.", "قدّميه مع الفول السوداني المطحون وأ wedges الليمون ورقائق الفلفل."],
    ],
    prep: 20, cook: 10, servings: 3, method: ["Wok stir-fry", "تفت در وک", "قلي سريع في الووك"],
  },
  "biryani": {
    items: [
      { ing: "chicken", amount: "800 g, marinated" }, { ing: "rice", amount: "3 cups basmati" },
      { ing: "yogurt", amount: "1 cup" }, { ing: "saffron", amount: "1 pinch in warm milk" },
      { ing: "mint", amount: "1 handful" }, { ing: "cardamom", amount: "4 pods" },
      { ing: "onion", amount: "3, fried crisp" }, { ing: "cinnamon", amount: "1 stick" },
    ],
    steps: [
      ["Marinate chicken in yogurt, ginger-garlic, garam masala and salt for at least an hour.", "مرغ را با ماست، سیر و زنجبیل، garam masala و نمک حداقل یک ساعت مزه‌دار کنید.", "تبّلي الدجاج بالزبادي والثوم والزنجبيل والبهارات والملح ساعة على الأقل."],
      ["Parboil basmati with whole spices until 70% done; drain.", "برنج باسماتی را با ادویه‌های درسته تا ۷۰٪ بپزید و آبکش کنید.", "اسلقي أرز البسمتي مع البهارات الصحيحة حتى ينضج 70٪ ثم صفّيه."],
      ["Cook the marinated chicken until its gravy thickens.", "مرغ مزه‌دار را بپزید تا سسش غلیظ شود.", "اطبخي الدجاج المتبّل حتى تتسبّك مرقته."],
      ["Layer rice over the chicken; top with saffron milk, mint and fried onions.", "برنج را لایه‌لایه روی مرغ بریزید و شیرزعفران، نعناع و پیاز سرخ‌شده رویش بدهید.", "وزّعي الأرز فوق الدجاج واسكبي حليب الزعفران والنعناع والبصل المقلي فوقه."],
      ["Seal the pot and steam on the lowest heat 25 minutes (dum); mix gently before serving.", "درِ قابلمه را ببندید و ۲۵ دقیقه با کمترین حرارت دم کنید؛ قبل از سرو آرام مخلوط کنید.", "أحكمي إغلاق القدر واطبخي على أضعف نار 25 دقيقة؛ قلّبي بلطف قبل التقديم."],
    ],
    prep: 45, cook: 50, servings: 6, method: ["Layered dum steam", "دمِ لایه‌ای", "تبخير طبقي محكم"],
  },
  "pho": {
    items: [
      { ing: "beef", amount: "400 g bones + 200 g sliced" }, { ing: "noodles", amount: "300 g flat rice" },
      { ing: "ginger", amount: "1 knob, charred" }, { ing: "onion", amount: "2, charred" },
      { ing: "star-anise", amount: "3" }, { ing: "cinnamon", amount: "1 stick" },
      { ing: "scallion", amount: "4" }, { ing: "basil", amount: "to serve" }, { ing: "lime", amount: "to serve" },
    ],
    steps: [
      ["Blanch the bones, rinse, then simmer with charred ginger and onion for 3+ hours.", "استخوان را بجوشانید و آبکش کنید؛ با زنجبیل و پیاز کبابی ۳+ ساعت آرام بپزید.", "اسلقي العظام وصفّيها ثم اطبخيها مع الزنجبيل والبصل المشوي 3 ساعات على الأقل."],
      ["Toast star anise, cinnamon and cloves; add to the broth and season with fish sauce.", "بادیان، دارچین و میخک را تفت دهید؛ به آبگوشت اضافه و با سس ماهی مزه‌دار کنید.", "حمّصي اليانسون النجمي والقرفة والقرنفل وأضيفيها للمرق وتبّليه بصلصة السمك."],
      ["Strain the broth — it should be clear, amber and deeply savory.", "آبگوشت را صاف کنید — باید شفاف، کهربایی و خوش‌طعم باشد.", "صفّي المرق — يجب أن يكون صافياً كهرمانياً وغني النكهة."],
      ["Blanch rice noodles and divide among bowls with raw beef slices and scallions.", "رشته برنجی را آب‌پز کنید و با برش‌های گوشت خام و پیازچه در کاسه بریزید.", "اسلقي شعيرية الأرز ووزّعيها في الأطباق مع شرائح اللحم النيئ والبصل الأخضر."],
      ["Ladle boiling broth over to cook the beef; serve with basil, lime and chili.", "آبگوشت جوشان را رویش بریزید تا گوشت بپزد؛ با ریحان، لیمو و فلفل سرو کنید.", "اسكبي المرق المغلي فوقها لينضج اللحم؛ قدّميها مع الريحان والليمون والفلفل."],
    ],
    prep: 25, cook: 200, servings: 4, method: ["Long-simmered broth", "آبگوشت طولانی", "مرق طويل الغليان"],
  },
};

// ---------------- generated recipes ----------------
const AMOUNTS: Record<string, string> = {
  beef: "500 g", lamb: "500 g", chicken: "600 g", fish: "500 g fillet", shrimp: "400 g",
  pork: "500 g", turkey: "500 g", duck: "600 g", liver: "400 g", offal: "500 g",
  egg: "3", rice: "2 cups", "sticky-rice": "1½ cups", flour: "3 cups", "rice-flour": "1 cup",
  bread: "4 flatbreads", potato: "3, cubed", "sweet-potato": "2, cubed", tomato: "3, chopped",
  onion: "2, diced", garlic: "4 cloves", ginger: "1 tbsp grated", turmeric: "1 tsp",
  saffron: "1 pinch, bloomed", lemon: "1, juiced", lime: "2, juiced", "dried-lime": "3, pierced",
  parsley: "1 bunch", cilantro: "1 bunch", fenugreek: "2 tbsp", spinach: "300 g", dill: "½ bunch",
  mint: "2 tbsp", basil: "1 bunch", oregano: "1 tsp", thyme: "1 tsp", paprika: "1 tsp",
  chili: "2, minced", "black-pepper": "1 tsp", cumin: "1 tsp", coriander: "1 tsp", cinnamon: "1 stick",
  cardamom: "4 pods", cloves: "3", nutmeg: "½ tsp", "star-anise": "2", "five-spice": "1 tsp",
  sumac: "1 tbsp", berbere: "2 tbsp", yogurt: "1 cup", kashk: "¾ cup", milk: "1 cup",
  cream: "½ cup", butter: "3 tbsp", ghee: "2 tbsp", "olive-oil": "4 tbsp", "palm-oil": "3 tbsp",
  cheese: "150 g", feta: "150 g", mozzarella: "150 g", parmesan: "50 g", halloumi: "200 g", paneer: "250 g",
  "kidney-beans": "1 cup, soaked", chickpeas: "1 cup, soaked", lentils: "1 cup", "split-peas": "¾ cup",
  "white-beans": "1 cup, soaked", "green-beans": "300 g", "fava-beans": "1 cup", "mung-beans": "¾ cup",
  "black-beans": "1 cup, soaked", "black-eyed-peas": "1 cup", peas: "1 cup", corn: "2 ears",
  masa: "2 cups", eggplant: "2 large", zucchini: "3", pumpkin: "400 g", cucumber: "2, diced",
  carrot: "2, sliced", "bell-pepper": "2, sliced", cabbage: "½ head", "grape-leaves": "30 leaves",
  lettuce: "1 head", mushroom: "300 g", beet: "2", celery: "3 stalks", leek: "2, sliced",
  scallion: "4, chopped", radish: "1 bunch", turnip: "2", olives: "½ cup", capers: "2 tbsp",
  okra: "400 g", pomegranate: "1", "pomegranate-molasses": "4 tbsp", barberry: "¾ cup",
  dates: "1 cup", raisins: "½ cup", prunes: "½ cup", apricots: "½ cup", quince: "2",
  rhubarb: "300 g", "sour-cherries": "1 cup", orange: "1, zested & juiced", avocado: "2",
  honey: "3 tbsp", sugar: "½ cup", walnuts: "1 cup", almonds: "½ cup", pistachios: "½ cup",
  peanuts: "½ cup", cashews: "½ cup", sesame: "2 tbsp", tahini: "⅓ cup", "soy-sauce": "3 tbsp",
  "fish-sauce": "2 tbsp", "coconut-milk": "1 can", coconut: "½ cup grated", noodles: "250 g",
  pasta: "250 g", tofu: "300 g", miso: "2 tbsp", gochujang: "2 tbsp", "rice-vinegar": "2 tbsp",
  vinegar: "2 tbsp", tamarind: "2 tbsp paste", lemongrass: "2 stalks", seaweed: "2 sheets",
  wasabi: "to serve", tortilla: "8", plantain: "2 ripe", quinoa: "1 cup", bulgur: "1 cup",
  couscous: "1½ cups", barley: "1 cup", oats: "1 cup", wheat: "1 cup", teff: "1 cup",
  buckwheat: "1 cup", cassava: "500 g", "palm-sugar": "2 tbsp", "rose-water": "2 tbsp",
  "orange-blossom": "1 tbsp", tea: "2 bags", coffee: "2 shots", chocolate: "100 g",
  vanilla: "1 tsp", mayonnaise: "3 tbsp", sausage: "300 g", ham: "150 g", bacon: "150 g",
  chorizo: "150 g", kimchi: "1 cup", anchovies: "4", squid: "400 g", octopus: "400 g",
  "bamboo-shoots": "1 cup", "water-chestnut": "½ cup", zaatar: "2 tbsp", harissa: "2 tbsp",
  curry: "8 leaves", mustard: "1 tsp", egusi: "1 cup ground", "peri-peri": "2 tbsp",
  "maple-syrup": "3 tbsp", cranberries: "½ cup", beer: "1 cup", wine: "½ cup", yeast: "1 tbsp",
  baking: "1 tsp", "pine-nuts": "¼ cup", "shrimp-paste": "1 tsp", jaggery: "½ cup",
  "kaffir-lime": "3 leaves", "black-sesame": "1 tbsp", bonitol: "1 handful", "dashi": "3 cups",
  papaya: "1 small, green", mango: "1 ripe", apple: "2", crab: "400 g", mussels: "500 g",
  pineapple: "1 cup", ackee: "1 can", strawberry: "1 cup", sprouts: "1 cup", tripe: "500 g",
  "rose-hips": "1 cup", galangal: "1 tbsp", tomatillo: "4", water: "4 cups", salt: "1 tsp",
  oil: "3 tbsp", snails: "500 g",
};

type Group = "stew" | "rice" | "grilled" | "soup" | "dessert" | "bread" | "drink" | "salad" | "other";

function groupOf(f: Food): Group {
  if (f.cats.includes("stew") || f.cats.includes("curry")) return "stew";
  if (f.cats.includes("soup")) return "soup";
  if (f.cats.includes("rice")) return "rice";
  if (f.cats.includes("grilled")) return "grilled";
  if (f.cats.includes("dessert")) return "dessert";
  if (f.cats.includes("bread")) return "bread";
  if (f.cats.includes("drink")) return "drink";
  if (f.cats.includes("salad")) return "salad";
  return "other";
}

const GROUP_META: Record<Group, { prep: number; cook: number; servings: number; method: Trio; steps: Trio[] }> = {
  stew: {
    prep: 30, cook: 100, servings: 4, method: ["Slow simmer", "پخت آرام", "طهي بطيء"],
    steps: [
      ["Brown %1 in hot oil with %2 until deeply golden.", "%1 را با %2 در روغن داغ سرخ کنید تا کاملاً طلایی شود.", "حمّري %1 مع %2 في زيت ساخن حتى يكتسب لوناً ذهبياً غامقاً."],
      ["Stir in %3 and the spices; toast one minute until fragrant.", "%3 و ادویه‌ها را اضافه کنید و یک دقیقه تفت دهید تا معطر شود.", "أضيفي %3 والتوابل وقلّبي دقيقة حتى تفوح الرائحة."],
      ["Pour in enough water to cover and simmer gently, partly covered.", "به‌اندازه آب بریزید تا روی مواد را بگیرد و آرام بپزید.", "اسكبي ماءً يغطي المكوّنات واتركيها تغلي بهدوء."],
      ["Cook until %1 is fork-tender and the sauce has thickened, 45–60 minutes.", "بپزید تا %1 کاملاً نرم شود و سس غلیظ شود؛ ۴۵ تا ۶۰ دقیقه.", "اطبخي حتى يطرى %1 وتتكثف الصلصة، 45–60 دقيقة."],
      ["Taste, adjust salt and acidity, and rest 10 minutes before serving over rice or with bread.", "بچشید، نمک و ترشی را تنظیم کنید و ۱۰ دقیقه استراحت دهید و با برنج یا نان سرو کنید.", "تذوّقي وعدّلي الملح والحموضة واتركيها 10 دقائق قبل التقديم مع الأرز أو الخبز."],
    ],
  },
  soup: {
    prep: 20, cook: 60, servings: 6, method: ["Pot soup", "آش و سوپ", "شوربة"],
    steps: [
      ["Soften %1 in oil with %2 over medium heat.", "%1 را با %2 در روغن روی حرارت متوسط نرم کنید.", "ليّني %1 مع %2 بالزيت على نار متوسطة."],
      ["Add %3 and any legumes; stir for two minutes.", "%3 و حبوبات را اضافه کنید و دو دقیقه هم بزنید.", "أضيفي %3 والبقول وقلّبي دقيقتين."],
      ["Pour in stock or water and bring to a boil; skim the surface.", "آب یا عصاره بریزید و بجوشانید؛ کف روی آن را بگیرید.", "اسكبي الماء أو المرق واغليها وأزيلي الرغوة."],
      ["Simmer until everything is meltingly tender and the broth is rich.", "بپزید تا همه‌چیز کاملاً نرم شود و آبگوشت غنی شود.", "اتركيها تغلي بهدوء حتى يطرى كل شيء ويصبح المرق غنياً."],
      ["Season boldly, ladle into bowls and finish with the fresh herbs.", "خوب مزه بزنید، در کاسه بریزید و با سبزی تازه تمام کنید.", "تبّلي جيداً واسكبيها في الأطباق وزيّنيها بالأعشاب الطازجة."],
    ],
  },
  rice: {
    prep: 20, cook: 50, servings: 4, method: ["Steam", "دم‌کردن", "تبخير"],
    steps: [
      ["Rinse %1 until the water runs clear, then soak 30 minutes with salt.", "%1 را بشویید تا آبش شفاف شود و ۳۰ دقیقه با نمک خیس کنید.", "اغسلي %1 حتى يصفو ماؤه ثم انقعيه 30 دقيقة مع الملح."],
      ["Cook %2 with %3 until fragrant and nearly done.", "%2 را با %3 بپزید تا معطر و تقریباً آماده شود.", "اطبخي %2 مع %3 حتى تفوح الرائحة ويكاد ينضج."],
      ["Layer the rice over the pot's base with a little oil for the crust.", "برنج را با کمی روغن کف قابلمه لایه کنید تا ته‌دیگ ببندد.", "وزّعي الأرز فوق قاعدة القدر مع قليل من الزيت لتتكوّن القشرة."],
      ["Steam on the lowest heat 35–40 minutes under a cloth-wrapped lid.", "۳۵ تا ۴۰ دقیقه با کمترین حرارت و درِ دم‌کنی دم کنید.", "اتركيه على أضعف نار 35–40 دقيقة بغطاء ملفوف بقماش."],
      ["Fluff gently, plate, and crown with %4 or the saffron topping.", "آرام زیر و رو کنید و با %4 یا رویه زعفرانی سرو کنید.", "قلّبي بلطف وقدّميه مكلّلاً بـ%4 أو طبقة الزعفران."],
    ],
  },
  grilled: {
    prep: 30, cook: 20, servings: 4, method: ["Charcoal grill", "کباب زغالی", "شوي على الفحم"],
    steps: [
      ["Massage %1 with %2, %3, salt and pepper; marinate at least 30 minutes.", "%1 را با %2، %3، نمک و فلفل مزه‌دار کنید؛ حداقل ۳۰ دقیقه بماند.", "دلّكي %1 مع %2 و%3 والملح والفلفل واتركيه 30 دقيقة على الأقل."],
      ["Thread onto skewers or shape over them with wet hands.", "به سیخ بکشید یا با دست خیس روی سیخ شکل دهید.", "ثبّتيها على الأسياخ أو شكّليها بيد مبللة."],
      ["Build a bed of hot coals — no flames, just glowing heat.", "بستر زغال داغ آماده کنید — بدون شعله، فقط حرارت گداخته.", "جهّزي جمراً ساخناً — بلا لهب، مجرد حرارة متوهجة."],
      ["Grill 3–5 minutes per side, turning once, until cooked through with charred edges.", "از هر طرف ۳ تا ۵ دقیقه کباب کنید و یک‌بار برگردانید تا بپزد و لبه‌هایش برشته شود.", "اشويها 3–5 دقائق لكل جانب واقلبيها مرة حتى تنضج بحواف محمّرة."],
      ["Rest two minutes; serve with grilled %4, bread and raw onion.", "دو دقیقه استراحت دهید و با %4 کبابی، نان و پیاز خام سرو کنید.", "اتركيها دقيقتين وقدّميها مع %4 المشوي والخبز والبصل النيئ."],
    ],
  },
  dessert: {
    prep: 25, cook: 35, servings: 6, method: ["Sweet-making", "شیرینی‌پزی", "تحلية"],
    steps: [
      ["Combine %1 with %2 and %3 in a heavy pan.", "%1 را با %2 و %3 در ظرف سنگین مخلوط کنید.", "اخلطي %1 مع %2 و%3 في قدر ثقيلة."],
      ["Cook over medium-low heat, stirring often so nothing scorches.", "روی حرارت ملایم بپزید و مرتب هم بزنید تا نسوزد.", "اطبخي على نار هادئة مع التحريك المستمر حتى لا يحترق."],
      ["When the mixture thickens and pulls from the pan, add %4.", "وقتی غلیظ شد و از ظرف جدا شد، %4 را اضافه کنید.", "حين يتماسك الخليط ويفارق القدر أضيفي %4."],
      ["Shape, pour or layer as the recipe calls for, then cool.", "به شکل دلخواه درآورید یا لایه‌چینی کنید و بگذارید خنک شود.", "شكّليه أو اسكبيه ثم اتركيه يبرد."],
      ["Finish with nuts, syrup or a dusting — and serve proudly.", "با مغزیجات، شربت یا پودر تزیین کنید و با افتخار سرو کنید.", "زيّنيه بالمكسرات أو القطر أو رشة سكر وقدّميه بفخر."],
    ],
  },
  bread: {
    prep: 40, cook: 20, servings: 6, method: ["Oven / griddle", "تنور و ماهیتابه", "فرن / صاج"],
    steps: [
      ["Knead %1 with yeast, salt and warm water into a smooth dough.", "%1 را با مخمر، نمک و آب گرم ورز دهید تا خمیر یکدستی شود.", "اعجني %1 مع الخميرة والملح والماء الدافئ حتى تحصلي على عجينة ناعمة."],
      ["Rest the dough in a warm spot until doubled, about an hour.", "خمیر را یک ساعت در جای گرم استراحت دهید تا دو برابر شود.", "اتركي العجينة ترتاح في مكان دافئ حتى يتضاعف حجمها."],
      ["Divide, shape and press with %2 where the recipe asks.", "خمیر را تقسیم و شکل دهید و در صورت نیاز %2 را رویش بزنید.", "قسّمي العجينة وشكّليها وادهنيها بـ%2 إن طلبت الوصفة."],
      ["Bake on a hot stone or griddle until blistered and golden.", "روی سنگ داغ یا ماهیتابه بپزید تا حباب بزند و طلایی شود.", "اخبزيها على حجر ساخن أو صاج حتى تنتفخ وتذهب."],
      ["Wrap in a cloth to stay soft; eat warm.", "در پارچه بپیچید تا نرم بماند؛ گرم نوش جان کنید.", "لفّيها بقماش لتبقى طرية وتناوليها دافئة."],
    ],
  },
  drink: {
    prep: 10, cook: 5, servings: 4, method: ["Blend / brew", "مخلوط و دم", "مزج / تخمير"],
    steps: [
      ["Prepare %1 and %2 — chill everything well.", "%1 و %2 را آماده کنید — همه‌چیز را خوب خنک کنید.", "جهّزي %1 و%2 وبرّدي كل شيء جيداً."],
      ["Combine with %3 in a pitcher.", "با %3 در پارچ مخلوط کنید.", "اخلطيها مع %3 في إبريق."],
      ["Stir or shake until evenly mixed and frothy if desired.", "هم بزنید یا تکان دهید تا یکدست شود و در صورت تمایل کف کند.", "حرّكي أو رجّي حتى تتجانس وتصبح رغوية إن رغبت."],
      ["Taste and balance sweet and sour; dilute to strength.", "بچشید و ترشی و شیرینی را متوازن کنید و به غلظت دلخواه برسانید.", "تذوّقي ووازني الحلو والحامض وخفّفيها حسب الرغبة."],
      ["Serve over ice with %4 or fresh garnish.", "با یخ، %4 یا تزیین تازه سرو کنید.", "قدّميها مع الثلج و%4 أو تزيين طازج."],
    ],
  },
  salad: {
    prep: 15, cook: 0, servings: 4, method: ["No-cook", "بدون پخت", "بدون طهي"],
    steps: [
      ["Wash and dry %1 thoroughly; cut everything to an even size.", "%1 را خوب بشویید و خشک کنید و همه‌چیز را یک‌اندازه خرد کنید.", "اغسلي %1 وجفّفيها جيداً وقطّعي كل شيء بحجم متساوٍ."],
      ["Dice %2 and %3 finely by hand — no food processor.", "%2 و %3 را با دست ریز خرد کنید — بدون غذاساز.", "افرمي %2 و%3 ناعماً باليد — بدون محضّرة."],
      ["Whisk lemon or lime, %4, salt and pepper into a sharp dressing.", "لیمو، %4، نمک و فلفل را هم بزنید تا سس تیز شود.", "اخفقي الليمون و%4 والملح والفلفل لتحضير تتبيلة حادة."],
      ["Toss everything gently just before serving so it stays crisp.", "درست قبل از سرو همه‌چیز را آرام مخلوط کنید تا ترد بماند.", "قلّبي كل شيء بلطف قبل التقديم مباشرة ليبقى مقرمشاً."],
      ["Taste, adjust, and pile high on the plate.", "بچشید، تنظیم کنید و در ظرف بلند بچینید.", "تذوّقي وعدّلي وكوّميها عالياً في الطبق."],
    ],
  },
  other: {
    prep: 20, cook: 40, servings: 4, method: ["Stovetop", "روی اجاق", "على الموقد"],
    steps: [
      ["Heat oil in a wide pan and soften %1 with %2.", "روغن را در تابه پهن گرم کنید و %1 را با %2 نرم کنید.", "سخّني الزيت في مقلاة واسعة وليّني %1 مع %2."],
      ["Add %3 and cook, stirring, until it takes on color.", "%3 را اضافه کنید و هم بزنید تا رنگ بگیرد.", "أضيفي %3 وقلّبي حتى يكتسب لوناً."],
      ["Fold in %4 and the seasonings; cook until combined and fragrant.", "%4 و چاشنی‌ها را اضافه کنید و بپزید تا یکدست و معطر شود.", "أضيفي %4 والتوابل واطبخي حتى تتجانس وتفوح الرائحة."],
      ["Adjust the heat and cook to the texture the dish needs — crisp, creamy or caramelized.", "حرارت را تنظیم کنید و به بافت مورد نیاز غذا بپزید — ترد، خامه‌ای یا کاراملی.", "اضبطي النار واطبخي حتى القوام المطلوب — مقرمشاً أو كريمياً أو مكرملاً."],
      ["Season, rest briefly, and serve hot.", "مزه بزنید، کمی استراحت دهید و داغ سرو کنید.", "تبّلي واتركيها قليلاً وقدّميها ساخنة."],
    ],
  },
};

function fill(tpl: Trio, names: string[]): Trio {
  return tpl.map((s) => {
    let out = s;
    names.forEach((n, i) => { out = out.split(`%${i + 1}`).join(n); });
    return out;
  }) as Trio;
}

export function getRecipe(food: Food, lang: Lang): Recipe {
  const name = (k: string) => ingredientName(k, lang);
  const sig = SIG[food.id];
  if (sig) {
    return {
      items: sig.items.map((it) => ({ ing: it.ing, amount: it.amount })),
      steps: sig.steps.map(([en, fa, ar]) => ({ en, fa, ar })),
      prep: sig.prep, cook: sig.cook, servings: sig.servings,
      method: { en: sig.method[0], fa: sig.method[1], ar: sig.method[2] },
      classic: true,
    };
  }
  const g = groupOf(food);
  const meta = GROUP_META[g];
  const ings = food.ings.slice(0, 8);
  const names = ings.map(name);
  const steps = meta.steps.map((tpl) => {
    const [en, fa, ar] = fill(tpl, names);
    return { en, fa, ar };
  });
  return {
    items: ings.map((k) => ({ ing: k, amount: AMOUNTS[k] ?? "to taste" })),
    steps,
    prep: meta.prep,
    cook: meta.cook + (food.cats.includes("stew") ? Math.min(60, food.ings.length * 6) : 0),
    servings: meta.servings,
    method: { en: meta.method[0], fa: meta.method[1], ar: meta.method[2] },
    classic: false,
  };
}

export function recipeStepText(s: RecipeStep, lang: Lang): string {
  return lang === "fa" ? s.fa : lang === "ar" ? s.ar : s.en;
}

export const MEAT_NAME = meatName;
