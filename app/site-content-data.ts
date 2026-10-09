import { products, type Product } from "./catalog-data";
import { defaultCopy } from "./site-copy-defaults";
import type { Lang } from "./locale";

export type LocalizedText = { he: string; ar: string; en: string };
export type CopyGroup = "global" | "home" | "products" | "services" | "about" | "contact" | "faq" | "policies";
export type ManagedCopy = LocalizedText & { id: string; group: CopyGroup; source: string };

export type ManagedProduct = Product & {
  available: boolean;
  visible: boolean;
  featured: boolean;
  order: number;
  brandId: string;
  categoryId: string;
  nameLocalized: LocalizedText;
  description: LocalizedText;
  warranty: LocalizedText;
  previousPrice?: number;
  gallery: string[];
  seoTitle: LocalizedText;
  seoDescription: LocalizedText;
  socialImage: string;
};

export type ManagedCategory = {
  id: string;
  name: LocalizedText;
  description: LocalizedText;
  image: string;
  order: number;
  visible: boolean;
};

export type ManagedBrand = {
  id: string;
  name: LocalizedText;
  logo: string;
  order: number;
  visible: boolean;
};

export type ManagedOffer = {
  id: string;
  title: LocalizedText;
  description: LocalizedText;
  image: string;
  buttonLabel: LocalizedText;
  href: string;
  productId: string;
  oldPrice?: number;
  price?: number;
  startsAt: string;
  endsAt: string;
  order: number;
  visible: boolean;
};

export type ManagedService = {
  id: string;
  icon: "installation" | "maintenance" | "repair" | "consultation";
  title: LocalizedText;
  description: LocalizedText;
  image: string;
  points: LocalizedText[];
  priceLabel: LocalizedText;
  requestMethod: "contact" | "phone" | "whatsapp";
  order: number;
  visible: boolean;
};

export type ManagedFaq = {
  id: string;
  question: LocalizedText;
  answer: LocalizedText;
  order: number;
  visible: boolean;
};

export type ManagedPolicy = {
  id: string;
  title: LocalizedText;
  body: LocalizedText;
  order: number;
  visible: boolean;
};

export type ManagedLink = {
  id: string;
  label: LocalizedText;
  href: string;
  order: number;
  visible: boolean;
};

export type HomeSectionId = "hero" | "benefits" | "featuredProducts" | "offers" | "serviceStory" | "roomCards" | "faq" | "contact";
export type SeoPageId = "home" | "products" | "services" | "about" | "contact" | "faq" | "policies";

export type SiteSettings = {
  phoneDisplay: string;
  phoneE164: string;
  whatsappE164: string;
  serviceAreaHe: string;
  serviceAreaAr: string;
  serviceAreaEn: string;
  logoImage: string;
  heroImage: string;
  pricesAreIndicative: boolean;
  companyName: LocalizedText;
  brandDescriptor: LocalizedText;
  topbarMessage: LocalizedText;
  email: string;
  address: LocalizedText;
  businessHours: LocalizedText;
  headerCtaHref: string;
  socialLinks: Array<{ id: string; label: string; url: string; visible: boolean; order: number }>;
};

export type SiteContent = {
  version: 2;
  copy: ManagedCopy[];
  products: ManagedProduct[];
  categories: ManagedCategory[];
  brands: ManagedBrand[];
  offers: ManagedOffer[];
  services: ManagedService[];
  faqs: ManagedFaq[];
  policies: { notice: LocalizedText; items: ManagedPolicy[] };
  settings: SiteSettings;
  navigation: ManagedLink[];
  footer: { links: ManagedLink[] };
  home: {
    sections: Array<{ id: HomeSectionId; visible: boolean; order: number }>;
    benefits: Array<{ id: string; visible: boolean; order: number }>;
    heroPrimaryHref: string;
    heroSecondaryHref: string;
    showFaqPreview: boolean;
  };
  about: {
    storyImage: string;
    values: Array<{ id: string; icon: "fit" | "craft" | "communication"; title: LocalizedText; description: LocalizedText; order: number; visible: boolean }>;
  };
  servicePage: {
    process: Array<{ id: string; title: LocalizedText; description: LocalizedText; order: number; visible: boolean }>;
    showFaq: boolean;
    showContact: boolean;
  };
  faqPage: { showOnHome: boolean; showOnServices: boolean; showContact: boolean };
  seo: {
    defaultTitle: LocalizedText;
    defaultDescription: LocalizedText;
    shareImage: string;
    pages: Record<SeoPageId, { title: LocalizedText; description: LocalizedText; socialImage: string }>;
  };
  theme: { primary: string; accent: string; surface: string; ink: string };
};

const text = (he: string, ar: string, en: string): LocalizedText => ({ he, ar, en });
const emptyText = (): LocalizedText => ({ he: "", ar: "", en: "" });

const defaultProducts: ManagedProduct[] = products.map((product, index) => ({
  ...product,
  available: true,
  visible: true,
  featured: index < 3,
  order: index + 1,
  brandId: product.brand.toLowerCase(),
  categoryId: product.room,
  nameLocalized: text(product.name, product.name, product.name),
  description: text(
    `מזגן ${product.name} עם תפוקת קירור של ${product.cooling.toLocaleString("en-US")} BTU. בדקו התאמה לחלל, מחיר וזמינות מול החברה.`,
    `مكيف ${product.name} بقدرة تبريد ${product.cooling.toLocaleString("en-US")} BTU. يُرجى تأكيد ملاءمته للمساحة والسعر والتوفر مع الشركة.`,
    `${product.name} air conditioner with ${product.cooling.toLocaleString("en-US")} BTU cooling capacity. Confirm room suitability, price and availability with the company.`,
  ),
  warranty: text(
    "בכפוף לתנאי היצרן ולדגם; פרטי האחריות יאושרו בהצעת המחיר.",
    "وفق شروط الشركة المصنّعة والموديل؛ تُؤكد تفاصيل الضمان في عرض السعر.",
    "Subject to manufacturer and model terms; confirm warranty details in your quote.",
  ),
  gallery: [],
  seoTitle: emptyText(),
  seoDescription: emptyText(),
  socialImage: product.image,
}));

const defaultNavigation: ManagedLink[] = [
  { id: "home", label: text("בית", "الرئيسية", "Home"), href: "/", order: 1, visible: true },
  { id: "products", label: text("המזגנים שלנו", "المكيفات", "Air conditioners"), href: "/products", order: 2, visible: true },
  { id: "services", label: text("התקנה ושירות", "التركيب والصيانة", "Installation & service"), href: "/services", order: 3, visible: true },
  { id: "about", label: text("אודותינו", "من نحن", "About us"), href: "/about", order: 4, visible: true },
  { id: "contact", label: text("יצירת קשר", "تواصل معنا", "Contact"), href: "/contact", order: 5, visible: true },
];

export const defaultSiteContent: SiteContent = {
  version: 2,
  copy: defaultCopy as unknown as ManagedCopy[],
  products: defaultProducts,
  categories: [
    { id: "bedroom", name: text("חדרי שינה", "غرف النوم", "Bedrooms"), description: text("מיזוג שקט לחללים אינטימיים.", "تكييف هادئ للمساحات الصغيرة.", "Quiet cooling for smaller rooms."), image: "/images/tadiran.webp", order: 1, visible: true },
    { id: "living", name: text("חללי מגורים", "مساحات المعيشة", "Living spaces"), description: text("בחירה לפי גודל החלל והרגלי השימוש.", "اختيار حسب مساحة الغرفة وطريقة الاستخدام.", "Choose for the room size and how you use it."), image: "/images/electra.webp", order: 2, visible: true },
    { id: "large", name: text("חללים גדולים", "المساحات الكبيرة", "Large spaces"), description: text("תפוקה שמתאימה לחלל רחב.", "قدرة تناسب المساحات الواسعة.", "Capacity designed for larger rooms."), image: "/images/tadiran.webp", order: 3, visible: true },
  ],
  brands: [
    { id: "tadiran", name: text("Tadiran", "Tadiran", "Tadiran"), logo: "/images/tadiran.webp", order: 1, visible: true },
    { id: "electra", name: text("Electra", "Electra", "Electra"), logo: "/images/electra.webp", order: 2, visible: true },
  ],
  offers: [],
  services: [
    {
      id: "installation", icon: "installation", title: text("התקנת מזגנים", "تركيب المكيفات", "Air conditioner installation"),
      description: text("התקנה טובה מתחילה עוד לפני הקידוח הראשון. מתכננים יחד את מיקום היחידות ואת התשתיות, לקבלת תוצאה נקייה ונוחה לשימוש.", "التركيب الجيد يبدأ قبل أول ثقب. نخطط معك لموقع الوحدات والبنية المطلوبة، لنتيجة متقنة وسهلة الاستخدام.", "A good installation starts before the first hole is drilled. We plan unit placement and infrastructure together, for a clean result that works for your space."),
      image: "/images/hero.webp", points: [text("בדיקת החלל והתשתיות", "فحص المساحة والبنية الأساسية", "Review of the space and infrastructure"), text("תכנון צנרת וניקוז", "تخطيط الأنابيب والتصريف", "Pipe routing and drainage planning"), text("התקנה ובדיקת הפעלה", "تركيب وفحص التشغيل", "Installation and commissioning")],
      priceLabel: text("הצעת מחיר לפי היקף העבודה", "عرض سعر حسب نطاق العمل", "Quote based on the scope of work"), requestMethod: "contact", order: 1, visible: true,
    },
    {
      id: "maintenance", icon: "maintenance", title: text("תחזוקה וניקוי", "الصيانة والتنظيف", "Maintenance & cleaning"),
      description: text("טיפול נכון עוזר לשמור על מערכת המיזוג לאורך זמן. בדיקה, ניקוי והתאמת הטיפול למצב המזגן ולאופן השימוש בו.", "العناية الصحيحة تساعد على الحفاظ على النظام. نفحص وننظف ونختار العلاج بحسب حالة المكيف واستخدامه.", "Thoughtful maintenance helps care for your system over time. Inspection, cleaning and a service plan suited to its condition and everyday use."),
      image: "/images/hero.webp", points: [text("ניקוי מסננים ויחידה פנימית", "تنظيف الفلاتر والوحدة الداخلية", "Filter and indoor unit cleaning"), text("בדיקת ניקוז וזרימת אוויר", "فحص التصريف وتدفق الهواء", "Drainage and airflow checks"), text("המלצות להמשך תחזוקה", "توصيات للعناية اللاحقة", "Advice for continued care")],
      priceLabel: text("הצעת מחיר לפי מצב המערכת", "عرض سعر حسب حالة النظام", "Quote based on system condition"), requestMethod: "contact", order: 2, visible: true,
    },
    {
      id: "repair", icon: "repair", title: text("אבחון ותיקון תקלות", "تشخيص الأعطال وإصلاحها", "Diagnosis & repairs"),
      description: text("המזגן לא מקרר, מרעיש או מטפטף? מתחילים באבחון ברור, מסבירים מה מצאנו ומציעים את התיקון המתאים לפני ביצוע העבודה.", "المكيف لا يبرد أو يصدر ضجيجًا أو يسرب الماء؟ نبدأ بالتشخيص ونشرح النتائج ونقترح الإصلاح قبل العمل.", "Not cooling, making noise or leaking? We start with a clear diagnosis, explain what we find and propose the right repair before work begins."),
      image: "/images/hero.webp", points: [text("איתור מקור התקלה", "تحديد مصدر العطل", "Identification of the underlying fault"), text("הסבר והצעת מחיר", "شرح وعرض سعر", "Clear explanation and quote"), text("תיקון ובדיקת תקינות", "إصلاح وفحص الأداء", "Repair and operation checks")],
      priceLabel: text("אבחון והצעת מחיר לפני תיקון", "تشخيص وعرض سعر قبل الإصلاح", "Diagnosis and quote before repair"), requestMethod: "contact", order: 3, visible: true,
    },
  ],
  faqs: [
    { id: "sizing", question: text("איך בוחרים מזגן שמתאים לחדר?", "كيف أختار مكيفًا مناسبًا للغرفة؟", "How do I choose the right air conditioner?"), answer: text("הבחירה תלויה בשטח החלל, גובה התקרה, כיוון השמש, הבידוד ואופן השימוש. נתוני BTU הם התחלה — ייעוץ אישי עוזר לבחור נכון.", "يعتمد الاختيار على مساحة الغرفة وارتفاع السقف والشمس والعزل وطريقة الاستخدام. قدرة BTU نقطة بداية؛ والاستشارة تساعد على الاختيار الصحيح.", "The right choice depends on room size, ceiling height, sun exposure, insulation and how you use the space. BTU ratings are a starting point; personal guidance helps you choose well."), order: 1, visible: true },
    { id: "installation-cost", question: text("האם מחיר המזגן כולל התקנה?", "هل سعر المكيف يشمل التركيب؟", "Is installation included in the price?"), answer: text("מחירי הקטלוג כרגע להמחשה בלבד. עלות ההתקנה וההובלה מתואמת בנפרד לפי מיקום המזגן ותכולת העבודה, ונכללת בהצעת המחיר האישית.", "أسعار الكتالوج حاليًا توضيحية. تُحدد تكلفة التركيب والتوصيل حسب الموقع والعمل المطلوب، وتُوضح في عرض السعر الشخصي.", "Catalog prices are currently illustrative. Installation and delivery are quoted separately according to placement and scope, and explained in your personal quote."), order: 2, visible: true },
    { id: "service-area", question: text("באילו אזורים אתם נותנים שירות?", "ما مناطق الخدمة؟", "Where do you provide service?"), answer: text("אנחנו נותנים שירות בכל ערי ישראל. מועד הביקור ותנאי השירות יתואמו בשיחה לפי המיקום וסוג העבודה.", "نقدم الخدمة في جميع المدن في إسرائيل. نُنسق موعد الزيارة وتفاصيلها حسب موقعك ونوع الخدمة.", "We serve every city in Israel. We’ll coordinate the visit and service details according to your location and the work needed."), order: 3, visible: true },
    { id: "request", question: text("איך מזמינים שירות למזגן?", "كيف أطلب صيانة المكيف؟", "How can I request a service?"), answer: text("אפשר להתקשר, לכתוב בוואטסאפ או להכין בקשה בעמוד יצירת הקשר. ציינו את העיר, סוג המזגן ומה התקלה.", "يمكنك الاتصال أو التواصل عبر واتساب أو تجهيز طلب من صفحة التواصل. اذكر المدينة ونوع المكيف والمشكلة.", "Call us, chat on WhatsApp or prepare a request on our contact page. Tell us your city, air conditioner type and what’s happening."), order: 4, visible: true },
    { id: "warranty", question: text("מה כוללת האחריות?", "ماذا يشمل الضمان؟", "What does the warranty cover?"), answer: text("תנאי האחריות משתנים לפי היצרן, הדגם וסוג העבודה. תקבלו פירוט של אחריות המוצר וההתקנה בהצעת המחיר לפני אישור ההזמנה.", "تختلف شروط الضمان حسب المصنع والموديل والعمل. نوضح ضمان المنتج والتركيب في عرض السعر قبل تأكيد الطلب.", "Warranty terms vary by manufacturer, model and work. Product and installation warranty details are provided in your quote before you confirm an order."), order: 5, visible: true },
  ],
  policies: {
    notice: text("בשלב זה האתר מציג קטלוג להמחשה ובקשות להצעת מחיר. אין רכישה או תשלום באתר. תנאי העסקה המלאים יימסרו בהצעה האישית.", "يعرض الموقع حاليًا كتالوجًا توضيحيًا وطلبات عرض سعر. لا يوجد شراء أو دفع داخل الموقع. تُوضح شروط المعاملة في عرض السعر الشخصي.", "This site currently presents a demonstration catalog and quote requests. Online purchases and payments are not available. Complete transaction terms are provided with your personal quote."),
    items: [
      { id: "pricing", title: text("מחיר וזמינות", "السعر والتوفر", "Pricing & availability"), body: text("מחירי המוצרים באתר להמחשה בלבד. המחיר הסופי וזמינות המוצר יאושרו מול החברה לפני אישור ההזמנה.", "أسعار المنتجات توضيحية فقط. يُؤكد السعر النهائي والتوفر مع الشركة قبل تأكيد الطلب.", "Product prices are illustrative. Final pricing and stock availability are confirmed with us before you approve an order."), order: 1, visible: true },
      { id: "delivery", title: text("הובלה והתקנה", "التوصيل والتركيب", "Delivery & installation"), body: text("עלות ההובלה, מועד האספקה, סוג ההתקנה והתוספות הנדרשות יסוכמו מראש בהצעת המחיר.", "يُتفق مسبقًا في عرض السعر على تكلفة التوصيل وموعده ونوع التركيب والإضافات المطلوبة.", "Delivery costs, timing, installation scope and any additional work are agreed in advance in your quote."), order: 2, visible: true },
      { id: "warranty", title: text("אחריות ושירות", "الضمان والخدمة", "Warranty & service"), body: text("תנאי אחריות המוצר נקבעים לפי היצרן והדגם. פירוט האחריות על המוצר ועל ההתקנה יוצג לפני ביצוע העסקה.", "تعتمد شروط ضمان المنتج على المصنع والموديل. يُوضح ضمان المنتج والتركيب قبل إتمام المعاملة.", "Product warranty terms depend on manufacturer and model. Product and installation warranty details are provided before a transaction."), order: 3, visible: true },
      { id: "changes", title: text("שינוי או ביטול בקשה", "تعديل أو إلغاء الطلب", "Changing a request"), body: text("לתיאום שינוי, ביטול או בירור בנוגע להצעת המחיר, פנו ישירות לחברה בטלפון או בוואטסאפ.", "لتعديل طلب أو إلغائه أو الاستفسار عن عرض السعر، تواصل مباشرة بالهاتف أو واتساب.", "To change or cancel a request, or ask about your quote, contact us directly by phone or WhatsApp."), order: 4, visible: true },
    ],
  },
  settings: {
    phoneDisplay: "052-950-4011",
    phoneE164: "+972529504011",
    whatsappE164: "+972529504011",
    serviceAreaHe: "שירות בכל הארץ",
    serviceAreaAr: "الخدمة في جميع مدن إسرائيل",
    serviceAreaEn: "Service across Israel",
    logoImage: "/images/logo.jpg",
    heroImage: "/images/hero.webp",
    pricesAreIndicative: true,
    companyName: text("א.ס מיזוג אוויר", "א.ס لتكييف الهواء", "A.S Air Conditioning"),
    brandDescriptor: text("מערכות מיזוג אוויר מתקדמות", "أنظمة تكييف متقدمة", "Advanced air conditioning"),
    topbarMessage: text("מיזוג נכון. בכל עונה.", "تكييف متقن. في كل موسم.", "Better air. Every season."),
    email: "",
    address: text("", "", ""),
    businessHours: text("", "", ""),
    headerCtaHref: "/contact?service=consultation",
    socialLinks: [],
  },
  navigation: defaultNavigation,
  footer: { links: defaultNavigation.filter((item) => item.id !== "home") },
  home: {
    sections: [
      { id: "hero", visible: true, order: 1 },
      { id: "benefits", visible: true, order: 2 },
      { id: "featuredProducts", visible: true, order: 3 },
      { id: "offers", visible: true, order: 4 },
      { id: "serviceStory", visible: true, order: 5 },
      { id: "roomCards", visible: true, order: 6 },
      { id: "faq", visible: true, order: 7 },
      { id: "contact", visible: true, order: 8 },
    ],
    benefits: [
      { id: "confidence", visible: true, order: 1 },
      { id: "energy", visible: true, order: 2 },
      { id: "installation", visible: true, order: 3 },
      { id: "service", visible: true, order: 4 },
    ],
    heroPrimaryHref: "/products",
    heroSecondaryHref: "/services",
    showFaqPreview: true,
  },
  about: {
    storyImage: "/images/hero.webp",
    values: [
      { id: "fit", icon: "fit", title: text("מתאימים, לא מנחשים", "نختار بدقة", "Fit comes first"), description: text("מסתכלים על החלל ועל הצורך לפני בחירת המזגן.", "نفهم المساحة والاحتياج قبل اختيار المكيف.", "We understand the space and the need before choosing the model."), order: 1, visible: true },
      { id: "craft", icon: "craft", title: text("עבודה עם תשומת לב", "عمل بعناية", "Care in the craft"), description: text("תכנון, התקנה ובדיקה הם חלקים של אותו תהליך.", "التخطيط والتركيب والفحص أجزاء من عملية واحدة.", "Planning, installation and checking are all part of one process."), order: 2, visible: true },
      { id: "communication", icon: "communication", title: text("תקשורת ברורה", "تواصل واضح", "Straightforward conversations"), description: text("יודעים מה צפוי, מה כלול ועם מי מדברים.", "تعرف ما تتوقع وما يشمله العمل ومن يساعدك.", "Know what to expect, what’s included and who to speak to."), order: 3, visible: true },
    ],
  },
  servicePage: {
    process: [
      { id: "tell-us", title: text("מספרים לנו", "أخبرنا", "Tell us"), description: text("מתארים את הצורך, הדגם והעיר.", "صف احتياجك والموديل والمدينة.", "Share your need, model and city."), order: 1, visible: true },
      { id: "plan", title: text("מתאמים יחד", "ننسق معك", "Make a plan"), description: text("מסכמים את העבודה, המחיר ומועד הביקור.", "نتفق على العمل والسعر وموعد الزيارة.", "Agree on scope, pricing and a visit."), order: 2, visible: true },
      { id: "finish", title: text("מטפלים ובודקים", "نعالج ونفحص", "Care & check"), description: text("מבצעים את העבודה ובודקים את התוצאה.", "ننجز العمل ونفحص النتيجة.", "Complete the work and check the result."), order: 3, visible: true },
    ],
    showFaq: true,
    showContact: true,
  },
  faqPage: { showOnHome: true, showOnServices: true, showContact: true },
  seo: {
    defaultTitle: text("א.ס מיזוג אוויר | מזגנים, התקנה ושירות", "א.ס מיזוג אוויר | مكيفات وتركيب وصيانة", "A.S Air Conditioning | Sales, installation & service"),
    defaultDescription: text("פתרונות מיזוג לבית ולעסק. בחירת מזגן, התקנה, תחזוקה ותיקונים בכל הארץ.", "حلول تكييف للبيت والعمل: اختيار المكيف وتركيبه وصيانته وإصلاحه في جميع المدن.", "Air conditioning solutions for homes and businesses. Sales, installation, maintenance and repairs across Israel."),
    shareImage: "/images/hero.webp",
    pages: {
      home: { title: text("מזגנים, התקנה ושירות | א.ס מיזוג אוויר", "مكيفات وتركيب وصيانة | א.ס", "Air conditioners, installation & service | A.S"), description: text("מוצאים את המזגן המתאים ומקבלים שירות אישי בכל רחבי ישראל.", "اختر المكيف المناسب واحصل على خدمة شخصية في جميع أنحاء إسرائيل.", "Find the right air conditioner with personal service throughout Israel."), socialImage: "/images/hero.webp" },
      products: { title: text("קטלוג מזגנים | א.ס מיזוג אוויר", "كتالوج المكيفات | א.ס", "Air conditioner catalog | A.S"), description: text("השוו דגמים, מפרטים ויכולות קירור. פנו לקבלת הצעה וזמינות.", "قارن الموديلات والمواصفات وقدرات التبريد، واطلب عرض سعر وتأكيد التوفر.", "Compare models, specifications and cooling capacity. Ask us for a quote and availability."), socialImage: "/images/tadiran.webp" },
      services: { title: text("התקנה, תחזוקה ותיקונים | א.ס מיזוג אוויר", "تركيب وصيانة وإصلاح | א.ס", "Installation, maintenance & repairs | A.S"), description: text("שירותי התקנה, תחזוקה ואבחון למזגנים ברחבי ישראל.", "خدمات تركيب وصيانة وتشخيص أعطال المكيفات في جميع أنحاء إسرائيل.", "Air conditioner installation, maintenance and diagnostics across Israel."), socialImage: "/images/hero.webp" },
      about: { title: text("אודות א.ס מיזוג אוויר", "من نحن | א.ס מיזוג אוויר", "About A.S Air Conditioning"), description: text("הכירו את החברה ואת הדרך שלנו לספק פתרונות מיזוג ושירות.", "تعرف على الشركة وطريقتنا في تقديم حلول التكييف والصيانة.", "Meet the company and how we provide air conditioning and service solutions."), socialImage: "/images/hero.webp" },
      contact: { title: text("יצירת קשר ובקשת שירות | א.ס מיזוג אוויר", "تواصل واطلب الخدمة | א.ס", "Contact & request service | A.S"), description: text("דברו איתנו בטלפון או בוואטסאפ ותאמו ייעוץ או שירות.", "تواصل معنا بالهاتف أو واتساب لتنسيق استشارة أو خدمة.", "Call or message us to arrange a consultation or service."), socialImage: "/images/hero.webp" },
      faq: { title: text("שאלות נפוצות | א.ס מיזוג אוויר", "الأسئلة الشائعة | א.ס", "Frequently asked questions | A.S"), description: text("תשובות על בחירת מזגן, התקנה, שירות ואחריות.", "إجابات حول اختيار المكيف والتركيب والصيانة والضمان.", "Answers about choosing an air conditioner, installation, service and warranty."), socialImage: "/images/hero.webp" },
      policies: { title: text("רכישה, הובלה ואחריות | א.ס מיזוג אוויר", "الشراء والتوصيل والضمان | א.ס", "Purchase, delivery & warranty | A.S"), description: text("מידע ברור על מחירים, זמינות, הובלה, התקנה ואחריות.", "معلومات واضحة عن الأسعار والتوفر والتوصيل والتركيب والضمان.", "Clear information about pricing, availability, delivery, installation and warranty."), socialImage: "/images/hero.webp" },
    },
  },
  theme: { primary: "#1466a5", accent: "#34a6b3", surface: "#f6f9fb", ink: "#173042" },
};

export function localize(value: LocalizedText | undefined, lang: Lang, fallback = "") {
  return value?.[lang]?.trim() || value?.he?.trim() || fallback;
}

export function productTitle(product: ManagedProduct, lang: Lang) {
  return localize(product.nameLocalized, lang, product.name);
}

export function productBrand(product: ManagedProduct, brands: ManagedBrand[], lang: Lang) {
  const brand = brands.find((item) => item.id === product.brandId);
  return localize(brand?.name, lang, product.brand);
}
