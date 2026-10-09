export interface Product {
  id: string;
  brand: string;
  name: string;
  price: number;
  cooling: number;
  energy: string;
  room: string;
  available?: boolean;
  image: string;
  source: string;
  specs: [string, string, string, string][];
  features: [string, string, string][];
}
const tadiranFeatures: [string, string, string][] = [
  ["אינוורטר", "إنفرتر", "Inverter technology"],
  ["Wi-Fi מובנה", "Wi-Fi مدمج", "Built-in Wi-Fi"],
  ["פיזור אוויר 4D", "توزيع هواء 4D", "4D airflow"],
  ["פעולה שקטה", "تشغيل هادئ", "Quiet operation"],
];
const electraFeatures: [string, string, string][] = [
  ["אינוורטר", "إنفرتر", "Inverter technology"],
  ["שליטה חכמה", "تحكم ذكي", "Smart control"],
  ["ניקוי עצמי", "تنظيف ذاتي", "Self-cleaning"],
  ["פעולה שקטה", "تشغيل هادئ", "Quiet operation"],
];
const tadiranSpecs = (
  heat: string,
  seer: string,
  scop: string,
  dimensions: string,
  pipes: string,
): Product["specs"] => [
  ["תפוקת חימום", "قدرة التدفئة", "Heating capacity", heat + " BTU/h"],
  ["SEER", "SEER", "SEER", seer],
  ["SCOP", "SCOP", "SCOP", scop],
  [
    "מידות יחידה פנימית (כפי שמפרסם היצרן)",
    "أبعاد الوحدة الداخلية (كما ينشرها المصنع)",
    "Indoor dimensions (manufacturer order)",
    dimensions + " mm",
  ],
  ["מתח הזנה", "جهد التشغيل", "Power supply", "230 V / 50 Hz"],
  ["קוטר צנרת", "قطر الأنابيب", "Pipe diameter", pipes + " in"],
];
export const products: Product[] = [
  {
    id: "tadiran-alpha-140",
    brand: "Tadiran",
    name: "ALPHA PRO 140NG",
    price: 2290,
    cooling: 9210,
    energy: "A++",
    room: "bedroom",
    image: "/images/tadiran.webp",
    source: "https://www.tadiran-group.co.il/product/alpha-pro-inv-140ng/",
    features: tadiranFeatures,
    specs: [
      ["תפוקת חימום", "قدرة التدفئة", "Heating capacity", "10,236 BTU/h"],
      ["SEER", "SEER", "SEER", "7"],
      ["SCOP", "SCOP", "SCOP", "4.1"],
      [
        "מידות יחידה פנימית (רוחב × גובה × עומק)",
        "أبعاد الوحدة الداخلية (عرض × ارتفاع × عمق)",
        "Indoor unit (W × H × D)",
        "894 × 291 × 211 mm",
      ],
      ["מתח הזנה", "جهد التشغيل", "Power supply", "230 V / 50 Hz"],
      ["קוטר צנרת", "قطر الأنابيب", "Pipe diameter", "1/4 – 3/8 in"],
    ],
  },
  {
    id: "tadiran-alpha-240",
    brand: "Tadiran",
    name: "ALPHA PRO 240NG",
    price: 4290,
    cooling: 17740,
    energy: "A++",
    room: "living",
    image: "/images/tadiran.webp",
    source: "https://www.tadiran-group.co.il/product/alpha-pro-inv-240ng/",
    features: tadiranFeatures,
    specs: tadiranSpecs("17,740", "6.6", "4", "1017 × 304 × 221", "1/4 – 1/2"),
  },
  {
    id: "tadiran-alpha-340",
    brand: "Tadiran",
    name: "ALPHA PRO 340NG",
    price: 5790,
    cooling: 24000,
    energy: "A++",
    room: "large",
    image: "/images/tadiran.webp",
    source:
      "https://www.tadiran-group.co.il/product/tadiran-alpha-pro-inv-340ng/",
    features: tadiranFeatures,
    specs: tadiranSpecs("25,000", "7", "4.3", "1135 × 328 × 247", "1/4 – 5/8"),
  },
  {
    id: "tadiran-alpha-370",
    brand: "Tadiran",
    name: "ALPHA PRO 370NG",
    price: 6990,
    cooling: 28000,
    energy: "A++",
    room: "large",
    image: "/images/tadiran.webp",
    source: "https://www.tadiran-group.co.il/product/alpha-pro-inv-370ng/",
    features: tadiranFeatures,
    specs: tadiranSpecs("28,000", "7", "4.1", "1135 × 328 × 247", "1/4 – 5/8"),
  },
  {
    id: "electra-a-170",
    brand: "Electra",
    name: "A Inverter 170",
    price: 2190,
    cooling: 12355,
    energy: "A++",
    room: "bedroom",
    image: "/images/electra.webp",
    source: "https://www.electra-air.co.il/product/electra-a-inverter-170/",
    features: electraFeatures,
    specs: [
      ["תפוקת חימום", "قدرة التدفئة", "Heating capacity", "10,966 BTU/h"],
    ],
  },
  {
    id: "electra-a-240",
    brand: "Electra",
    name: "A Inverter 240",
    price: 2890,
    cooling: 18356,
    energy: "A++",
    room: "living",
    image: "/images/electra.webp",
    source: "https://www.electra-air.co.il/product/electra-a-inverter-240/",
    features: electraFeatures,
    specs: [
      ["תפוקת חימום", "قدرة التدفئة", "Heating capacity", "16,241 BTU/h"],
      [
        "הספק נצרך בקירור",
        "استهلاك الطاقة للتبريد",
        "Cooling power consumption",
        "1,749 W",
      ],
      [
        "מידות יחידה פנימית (כפי שמפרסם היצרן)",
        "أبعاد الوحدة الداخلية (كما ينشرها المصنع)",
        "Indoor dimensions (manufacturer order)",
        "957 × 213 × 302 mm",
      ],
    ],
  },
];
export const phone = "+972529504011";
export const whatsapp = (message?: string) =>
  `https://wa.me/972529504011${message ? `?text=${encodeURIComponent(message)}` : ""}`;
export const money = (value: number) => `₪${value.toLocaleString("en-US")}`;
