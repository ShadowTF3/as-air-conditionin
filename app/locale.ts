export type Lang = "he" | "ar" | "en";
export type Translate = (he: string, ar: string, en?: string) => string;
const english: Record<string, string> = {
  "דילוג לתוכן": "Skip to content",
  "מיזוג נכון. בכל עונה.": "Better air. Every season.",
  "שירות בכל הארץ": "Serving all of Israel",
  "מערכות מיזוג אוויר מתקדמות": "Advanced air conditioning",
  בית: "Home",
  "המזגנים שלנו": "Air conditioners",
  "התקנה ושירות": "Installation & service",
  אודותינו: "About us",
  "יצירת קשר": "Contact",
  "תפריט ראשי": "Main navigation",
  "בואו נדבר": "Let’s talk",
  "פתיחת תפריט": "Toggle navigation",
  "נוחות שמרגישים. איכות שסומכים עליה.": "Comfort you feel. Quality you trust.",
  "האוויר הנכון.": "Better air.",
  "הבית שלכם.": "Your home.",
  "מזגן טוב הוא רק ההתחלה. אנחנו כאן כדי להתאים, להתקין ולדאוג לנוחות שלכם — בקיץ, בחורף וכל מה שביניהם.":
    "A good air conditioner is just the beginning. We help you choose, install and enjoy lasting comfort — summer, winter and every day in between.",
  "למציאת המזגן שלכם": "Find your air conditioner",
  "אני צריך שירות למזגן": "Book a service",
  "התאמה אישית": "Personal advice",
  "התקנה מקצועית": "Expert installation",
  "ליווי גם אחרי הרכישה": "After-sales support",
  "סלון מואר ונעים עם מזגן עילי":
    "Bright, comfortable living room with a wall-mounted air conditioner",
  "בדיוק כמו שאתם אוהבים": "Just the way you like it",
  "של נוחות": "of comfort",
  "בחירה בראש שקט": "Choose with confidence",
  "ייעוץ ברור, בלי סימני שאלה": "Clear, personal guidance",
  "חושבים גם על החשמל": "Mindful of energy",
  "טכנולוגיית אינוורטר חכמה": "Smart inverter technology",
  "מהבחירה ועד ההתקנה": "From choice to installation",
  "פתרון שלם במקום אחד": "A complete solution",
  "תמיד יש עם מי לדבר": "A real person to help",
  "שירות אישי בעברית ובערבית": "Service in Hebrew & Arabic",
  "נוחות מתחילה בבחירה נכונה": "Great comfort. The right choice.",
  "לכל המזגנים": "Explore all models",
  "לפרטים נוספים": "View details",
  "מכניסים הביתה אוויר טוב.": "Better air, brought home.",
  "מכירה, התקנה, תחזוקה ותיקונים.":
    "Sales, installation, maintenance and repairs.",
  "בואו למצוא את הנוחות שלכם": "Find your comfort",
  "נשמח לשמוע מכם": "Get in touch",
  "שירות בכל ערי ישראל": "Serving every city in Israel",
  "רכישה, משלוח ואחריות": "Purchase, delivery & warranty",
  "שאלות נפוצות": "Frequently asked questions",
  "דברו איתנו בוואטסאפ": "Chat with us on WhatsApp",
};
export const translator =
  (lang: Lang): Translate =>
  (he, ar, en) =>
    lang === "he" ? he : lang === "ar" ? ar : (en ?? english[he] ?? he);
