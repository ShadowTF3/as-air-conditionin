"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import Link from "../site-link";
import { SelectField } from "../select-field";
import {
  AirVent,
  ArrowDownToLine,
  Check,
  ChevronDown,
  CircleAlert,
  FileText,
  ImagePlus,
  LayoutDashboard,
  LogOut,
  Package,
  Phone,
  Plus,
  Save,
  Settings2,
  ShieldCheck,
  Trash2,
  Upload,
} from "lucide-react";
import { defaultSiteContent, type ManagedProduct, type SiteContent } from "../site-content-data";
import { CmsPanel } from "./CmsPanel";

type Language = "he" | "ar" | "en";
type Tab = "overview" | "products" | "business" | "content";

const labels: Record<Language, Record<string, string>> = {
  he: {
    dashboard: "לוח ניהול", overview: "סקירה", products: "מוצרים", business: "פרטי העסק", logout: "יציאה", language: "שפה",
    welcome: "ניהול האתר", subtitle: "עדכון התוכן והתמונות של א.ס מיזוג אוויר",
    live: "האתר פעיל", models: "דגמים בקטלוג", available: "דגמים זמינים", indicative: "מחירים להמחשה",
    signIn: "כניסה מאובטחת", username: "שם משתמש", password: "סיסמה", enter: "כניסה ללוח הניהול",
    setup: "הגדרת גישת מנהל", setupText: "לפני הכניסה, הגדרו את משתני ADMIN_USERNAME, ADMIN_PASSWORD ו־ADMIN_SESSION_SECRET בהגדרות אפליקציית Node של חברת האחסון.",
    setupSecret: "יש להגדיר סוד אקראי באורך 32 תווים לפחות. אל תשמרו אותו בקוד האתר.",
    catalogTitle: "קטלוג המוצרים", catalogText: "שנו מחיר, מפרט, תמונה וזמינות. השינויים נשמרים באתר מיד.",
    addProduct: "הוספת דגם", chooseModel: "בחרו דגם לעריכה", brand: "מותג", model: "שם הדגם", price: "מחיר (₪)",
    btu: "תפוקת קירור (BTU)", energy: "דירוג אנרגטי", room: "סוג החלל", bedroom: "חדר שינה", living: "חלל משפחתי", large: "חלל גדול",
    image: "תמונת המוצר", upload: "העלאת תמונה", availableToggle: "זמין לפנייה באתר", saveProduct: "שמירת הדגם", remove: "הסרת דגם",
    companyTitle: "פרטי העסק והאתר", companyText: "המספרים והפרטים שמופיעים באתר נשמרים כאן, בנפרד מקוד האתר.",
    displayPhone: "מספר טלפון להצגה", phoneIntl: "טלפון בפורמט בינלאומי", whatsappIntl: "מספר WhatsApp בינלאומי",
    areaHe: "אזור שירות — עברית", areaAr: "אזור שירות — ערבית", areaEn: "אזור שירות — אנגלית",
    logo: "לוגו", hero: "תמונת פתיחה", pricesDemo: "הצגת המחירים כמחירים להמחשה", saveSettings: "שמירת פרטי העסק",
    saved: "השינויים נשמרו באתר.", saving: "שומר…", failed: "לא ניתן לשמור. בדקו את החיבור ואת פרטי הטופס.",
    validationFields: "יש להשלים או לתקן את השדות הבאים:",
    uploadFailed: "העלאת התמונה נכשלה.", noProducts: "אין דגמים להצגה.", minimumProduct: "יש להשאיר לפחות דגם אחד בקטלוג.", unavailable: "לא זמין", edit: "עריכה",
    phoneHint: "לדוגמה: +972529504011", imageHint: "JPEG, PNG, WebP או AVIF עד 8MB.", confirmDelete: "להסיר את הדגם מהקטלוג?",
    back: "חזרה לאתר", updated: "שינויים בתוכן נשמרים ללא בנייה או העלאה מחדש של האתר.", sessionExpired: "פג תוקף הכניסה. התחברו שוב.",
  },
  ar: {
    dashboard: "لوحة التحكم", overview: "نظرة عامة", products: "المنتجات", business: "بيانات الشركة", logout: "تسجيل الخروج", language: "اللغة",
    welcome: "إدارة الموقع", subtitle: "حدّث محتوى وصور موقع א.ס מיזוג אוויר",
    live: "الموقع نشط", models: "موديلات الكتالوج", available: "موديلات متاحة", indicative: "الأسعار توضيحية",
    signIn: "دخول آمن", username: "اسم المستخدم", password: "كلمة المرور", enter: "الدخول إلى لوحة التحكم",
    setup: "إعداد دخول المدير", setupText: "قبل الدخول، أضف المتغيرات ADMIN_USERNAME وADMIN_PASSWORD وADMIN_SESSION_SECRET في إعدادات تطبيق Node لدى شركة الاستضافة.",
    setupSecret: "استخدم سرًا عشوائيًا بطول 32 حرفًا على الأقل، ولا تضعه في ملفات الموقع.",
    catalogTitle: "كتالوج المنتجات", catalogText: "عدّل السعر والمواصفات والصورة والتوفر. تُحفظ التغييرات مباشرة على الموقع.",
    addProduct: "إضافة موديل", chooseModel: "اختر موديلًا للتعديل", brand: "العلامة التجارية", model: "اسم الموديل", price: "السعر (₪)",
    btu: "قدرة التبريد (BTU)", energy: "كفاءة الطاقة", room: "نوع المساحة", bedroom: "غرفة نوم", living: "مساحة عائلية", large: "مساحة كبيرة",
    image: "صورة المنتج", upload: "رفع صورة", availableToggle: "متاح للاستفسار على الموقع", saveProduct: "حفظ الموديل", remove: "حذف الموديل",
    companyTitle: "بيانات الشركة والموقع", companyText: "تُحفظ أرقام الاتصال والتفاصيل الظاهرة بالموقع هنا، بشكل مستقل عن كود الموقع.",
    displayPhone: "رقم الهاتف للعرض", phoneIntl: "الهاتف بالصيغة الدولية", whatsappIntl: "رقم واتساب بالصيغة الدولية",
    areaHe: "منطقة الخدمة — العبرية", areaAr: "منطقة الخدمة — العربية", areaEn: "منطقة الخدمة — الإنجليزية",
    logo: "الشعار", hero: "صورة الواجهة الرئيسية", pricesDemo: "عرض الأسعار على أنها توضيحية", saveSettings: "حفظ بيانات الشركة",
    saved: "حُفظت التغييرات على الموقع.", saving: "جارٍ الحفظ…", failed: "تعذر الحفظ. تحقق من الاتصال والحقول.",
    validationFields: "يرجى إكمال الحقول التالية أو تصحيحها:",
    uploadFailed: "تعذر رفع الصورة.", noProducts: "لا توجد موديلات للعرض.", minimumProduct: "يجب إبقاء موديل واحد على الأقل في الكتالوج.", unavailable: "غير متوفر", edit: "تعديل",
    phoneHint: "مثال: +972529504011", imageHint: "JPEG أو PNG أو WebP أو AVIF حتى 8 ميغابايت.", confirmDelete: "حذف الموديل من الكتالوج؟",
    back: "العودة إلى الموقع", updated: "تُحفظ تعديلات المحتوى دون إعادة بناء الموقع أو رفعه.", sessionExpired: "انتهت الجلسة. سجّل الدخول مجددًا.",
  },
  en: {
    dashboard: "Dashboard", overview: "Overview", products: "Products", business: "Business details", logout: "Sign out", language: "Language",
    welcome: "Site management", subtitle: "Manage A.S Air Conditioning content and images",
    live: "Site is live", models: "Catalog models", available: "Available models", indicative: "Indicative prices",
    signIn: "Secure sign in", username: "Username", password: "Password", enter: "Open admin dashboard",
    setup: "Set up administrator access", setupText: "Before signing in, set ADMIN_USERNAME, ADMIN_PASSWORD and ADMIN_SESSION_SECRET in the Node app settings at your hosting provider.",
    setupSecret: "Use a random secret at least 32 characters long. Keep it out of the website code.",
    catalogTitle: "Product catalog", catalogText: "Update prices, specifications, images and availability. Changes are saved directly to the site.",
    addProduct: "Add a model", chooseModel: "Choose a model to edit", brand: "Brand", model: "Model name", price: "Price (₪)",
    btu: "Cooling capacity (BTU)", energy: "Energy rating", room: "Room type", bedroom: "Bedroom", living: "Living space", large: "Large space",
    image: "Product image", upload: "Upload image", availableToggle: "Available for inquiries on the site", saveProduct: "Save model", remove: "Remove model",
    companyTitle: "Business and site details", companyText: "Contact details shown on the site are saved here, separately from its code.",
    displayPhone: "Display phone number", phoneIntl: "Phone in international format", whatsappIntl: "WhatsApp in international format",
    areaHe: "Service area — Hebrew", areaAr: "Service area — Arabic", areaEn: "Service area — English",
    logo: "Logo", hero: "Homepage hero image", pricesDemo: "Mark catalog prices as indicative", saveSettings: "Save business details",
    saved: "Changes are saved on the site.", saving: "Saving…", failed: "Could not save. Check your connection and the form fields.",
    validationFields: "Please complete or correct these fields:",
    uploadFailed: "Image upload failed.", noProducts: "No models to display.", minimumProduct: "Keep at least one model in the catalog.", unavailable: "Unavailable", edit: "Edit",
    phoneHint: "Example: +972529504011", imageHint: "JPEG, PNG, WebP or AVIF up to 8 MB.", confirmDelete: "Remove this model from the catalog?",
    back: "Back to site", updated: "Content updates are saved without rebuilding or re-uploading the site.", sessionExpired: "Your session expired. Sign in again.",
  },
};

const idEntityLabels: Record<Language, Record<string, string>> = {
  he: { products: "מוצר", categories: "קטגוריה", brands: "מותג", offers: "מבצע", services: "שירות", faqs: "שאלה", "policies.items": "סעיף מדיניות", navigation: "קישור בתפריט", "footer.links": "קישור בתחתית", "settings.socialLinks": "קישור חברתי", "about.values": "יתרון", "servicePage.process": "שלב שירות" },
  ar: { products: "منتج", categories: "تصنيف", brands: "علامة تجارية", offers: "عرض", services: "خدمة", faqs: "سؤال", "policies.items": "بند سياسة", navigation: "رابط القائمة", "footer.links": "رابط التذييل", "settings.socialLinks": "رابط اجتماعي", "about.values": "ميزة", "servicePage.process": "خطوة خدمة" },
  en: { products: "Product", categories: "Category", brands: "Brand", offers: "Offer", services: "Service", faqs: "FAQ", "policies.items": "Policy item", navigation: "Navigation link", "footer.links": "Footer link", "settings.socialLinks": "Social link", "about.values": "Benefit", "servicePage.process": "Service step" },
};

function emptyProduct(): ManagedProduct {
  return {
    ...defaultSiteContent.products[0],
    id: `model-${crypto.randomUUID()}`,
    brand: "",
    name: "",
    nameLocalized: { he: "", ar: "", en: "" },
    price: 0,
    cooling: 0,
    energy: "A++",
    room: "bedroom",
    image: "/images/tadiran.webp",
    source: "",
    features: [],
    specs: [],
    available: true,
  };
}

function e164(value: string) {
  return `+${value.replace(/\D/g, "")}`;
}

export default function AdminPage() {
  const [language, setLanguage] = useState<Language>("he");
  const [state, setState] = useState<"loading" | "setup" | "login" | "admin">("loading");
  const [credentials, setCredentials] = useState({ username: "", password: "" });
  const [content, setContent] = useState<SiteContent>(defaultSiteContent);
  const [selectedId, setSelectedId] = useState<string | null>(defaultSiteContent.products[0]?.id ?? null);
  const [draft, setDraft] = useState<ManagedProduct | null>(null);
  const [tab, setTab] = useState<Tab>("overview");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [messageError, setMessageError] = useState(false);
  const c = (key: string) => labels[language][key] ?? key;
  const direction = language === "en" ? "ltr" : "rtl";

  const loadContent = useCallback(async () => {
    const response = await fetch("/api/admin/content", { cache: "no-store" });
    if (response.status === 401) {
      setState("login");
      setMessage(labels[language].sessionExpired);
      return;
    }
    if (!response.ok) throw new Error("Could not load site content.");
    const value = (await response.json()) as SiteContent;
    setContent(value);
    setSelectedId(value.products[0]?.id ?? null);
    setState("admin");
  }, [language]);

  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dir = direction;
  }, [language, direction]);

  useEffect(() => {
    fetch("/api/admin/session", { cache: "no-store" })
      .then((response) => response.json())
      .then(async (rawSession) => {
        const session = rawSession as { configured: boolean; authenticated: boolean };
        if (!session.configured) {
          setState("setup");
        } else if (session.authenticated) {
          await loadContent();
        } else {
          setState("login");
        }
      })
      .catch(() => setState("setup"));
  }, [loadContent]);

  async function signIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(credentials),
      });
      if (!response.ok) {
        const value = await response.json() as { error?: string };
        throw new Error(value.error ?? c("failed"));
      }
      await loadContent();
      setMessage("");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : c("failed"));
      setMessageError(true);
    } finally {
      setBusy(false);
    }
  }

  async function saveAll(next: SiteContent, successMessage = c("saved")) {
    setBusy(true);
    setMessage("");
    setMessageError(false);
    try {
      const response = await fetch("/api/admin/content", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(next),
      });
      const value = await response.json() as SiteContent & { error?: string };
      if (!response.ok) {
        const issues = (value as SiteContent & { issues?: Array<{ path: Array<string | number> }> }).issues;
        if (response.status === 422 && issues?.length) {
          const labelsByPath: Record<string, string> = {
            nameLocalized: c("model"), name: c("model"), brand: c("brand"), brandId: c("brand"),
            categoryId: c("room"), room: c("room"), price: c("price"), previousPrice: c("price"),
            cooling: c("btu"), energy: c("energy"), image: c("image"), socialImage: c("image"),
            phoneDisplay: c("displayPhone"), phoneE164: c("phoneIntl"), whatsappE164: c("whatsappIntl"),
          };
          const fields = [...new Set(issues.map(({ path }) => {
            if (path.at(-1) === "id") {
              const index = path.findLast((part) => typeof part === "number");
              if (typeof index === "number") {
                const collection = path.slice(0, path.lastIndexOf(index)).filter((part) => typeof part === "string").join(".");
                const entity = idEntityLabels[language][collection] ?? (language === "he" ? "רשומה" : language === "ar" ? "سجل" : "Record");
                if (collection === "brands") return language === "he" ? `מזהה המותג ${index + 1}` : language === "ar" ? `معرّف العلامة التجارية ${index + 1}` : `Brand ID ${index + 1}`;
                return language === "he" ? `${entity} ${index + 1}: מזהה` : language === "ar" ? `معرّف ${entity} ${index + 1}` : `${entity} ID ${index + 1}`;
              }
            }
            const key = path.map(String).findLast((part) => labelsByPath[part]);
            return key ? labelsByPath[key] : path.map(String).join(".");
          }))];
          throw new Error(`${c("validationFields")} ${fields.join(", ")}`);
        }
        throw new Error(value.error ?? c("failed"));
      }
      setContent(value as SiteContent);
      setMessage(successMessage);
      setMessageError(false);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : c("failed"));
      setMessageError(true);
    } finally {
      setBusy(false);
    }
  }

  async function uploadImage(file: File | undefined) {
    if (!file) return null;
    const form = new FormData();
    form.set("file", file);
    const response = await fetch("/api/admin/media", { method: "POST", body: form });
    const value = await response.json() as { image: string; error?: string };
    if (!response.ok) throw new Error(value.error ?? c("uploadFailed"));
    return value.image as string;
  }

  async function uploadForProduct(file: File | undefined) {
    if (!file || !draft) return;
    setBusy(true);
    try {
      const image = await uploadImage(file);
      if (image) setDraft({ ...draft, image });
      setMessage("");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : c("uploadFailed"));
      setMessageError(true);
    } finally {
      setBusy(false);
    }
  }

  async function uploadForSetting(key: "logoImage" | "heroImage", file: File | undefined) {
    if (!file) return;
    setBusy(true);
    try {
      const image = await uploadImage(file);
      if (image) {
        setContent((current) => ({
          ...current,
          settings: { ...current.settings, [key]: image },
        }));
      }
      setMessage("");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : c("uploadFailed"));
      setMessageError(true);
    } finally {
      setBusy(false);
    }
  }

  async function signOut() {
    await fetch("/api/admin/logout", { method: "POST" });
    setCredentials({ username: "", password: "" });
    setState("login");
    setTab("overview");
    setMessage("");
  }

  function saveProduct() {
    if (!draft) return;
    const productName = draft.name.trim() || draft.nameLocalized[language].trim();
    const nameLocalized = {
      he: draft.nameLocalized.he.trim() || productName,
      ar: draft.nameLocalized.ar.trim() || productName,
      en: draft.nameLocalized.en.trim() || productName,
    };
    const product = { ...draft, name: productName, nameLocalized };
    const exists = content.products.some((item) => item.id === product.id);
    const next = {
      ...content,
      products: exists
        ? content.products.map((item) => item.id === product.id ? product : item)
        : [...content.products, product],
    };
    void saveAll(next);
    setContent(next);
    setDraft(product);
    setSelectedId(product.id);
  }

  function removeProduct(id: string) {
    if (content.products.length <= 1) {
      setMessage(c("minimumProduct"));
      setMessageError(true);
      return;
    }
    if (!window.confirm(c("confirmDelete"))) return;
    const next = { ...content, products: content.products.filter((product) => product.id !== id) };
    setContent(next);
    setDraft(null);
    setSelectedId(next.products[0]?.id ?? null);
    void saveAll(next);
  }

  const selectedProduct = content.products.find((product) => product.id === selectedId);
  const pageTitle = tab === "products" ? c("catalogTitle") : tab === "business" ? c("companyTitle") : c("welcome");
  const pageDescription = tab === "products" ? c("catalogText") : tab === "business" ? c("companyText") : c("subtitle");
  const currentTitle = tab === "content" ? (language === "he" ? "ניהול תוכן האתר" : language === "ar" ? "إدارة محتوى الموقع" : "Manage site content") : pageTitle;
  const currentDescription = tab === "content" ? (language === "he" ? "עריכת כל הטקסטים, המוצרים, השירותים וההגדרות שמוצגים באתר." : language === "ar" ? "تحرير النصوص والمنتجات والخدمات والإعدادات التي تظهر على الموقع." : "Edit the text, products, services and settings visitors see.") : pageDescription;
  const currentTabLabel = tab === "content" ? (language === "he" ? "תוכן האתר" : language === "ar" ? "محتوى الموقع" : "Site content") : c(tab);

  return (
    <main className="admin-root" dir={direction}>
      <header className="admin-topbar">
        <Link className="admin-brand" href="/">
          <span className="admin-brand-mark"><AirVent size={22} /></span>
          <span><b>א.ס</b><small>{c("dashboard")}</small></span>
        </Link>
        <div className="admin-top-actions">
          <Link href="/" className="admin-view-site"><ArrowDownToLine size={16} />{c("back")}</Link>
          <label className="admin-language">
            <SelectField aria-label={c("language")} value={language} onChange={(event) => setLanguage(event.target.value as Language)}>
              <option value="he">עברית</option><option value="ar">العربية</option><option value="en">English</option>
            </SelectField>
          </label>
        </div>
      </header>

      {state === "loading" ? (
        <div className="admin-loading"><span className="admin-spinner" />{c("dashboard")}</div>
      ) : state === "setup" || state === "login" ? (
        <section className="admin-auth-page">
          <div className="admin-auth-card">
            <div className="admin-auth-mark"><ShieldCheck size={28} /></div>
            <span className="admin-eyebrow">A.S AIR CONDITIONING · ADMIN</span>
            <h1>{state === "setup" ? c("setup") : c("signIn")}</h1>
            <p>{state === "setup" ? c("setupText") : c("subtitle")}</p>
            {state === "setup" ? (
              <div className="admin-setup-note"><CircleAlert size={18} /><span>{c("setupSecret")}</span></div>
            ) : (
              <form className="admin-auth-form" onSubmit={signIn}>
                <label>{c("username")}<input autoComplete="username" required value={credentials.username} onChange={(event) => setCredentials({ ...credentials, username: event.target.value })} /></label>
                <label>{c("password")}<input type="password" autoComplete="current-password" required value={credentials.password} onChange={(event) => setCredentials({ ...credentials, password: event.target.value })} /></label>
                <button className="admin-primary-button" disabled={busy}>{busy ? c("saving") : c("enter")}<ShieldCheck size={17} /></button>
              </form>
            )}
            {message && <p className={`admin-notice ${messageError ? "error" : ""}`}>{message}</p>}
            <div className="admin-auth-foot"><span className="admin-status-dot" /> HTTPS · {c("live")}</div>
          </div>
        </section>
      ) : (
        <div className="admin-layout">
          <aside className="admin-sidebar">
            <div className="admin-sidebar-caption">{c("dashboard")}</div>
            <button aria-label={c("dashboard")} className={tab === "overview" ? "active" : ""} onClick={() => { setTab("overview"); setMessage(""); }}><LayoutDashboard size={18} />{c("dashboard")}</button>
            <button aria-label={c("products")} className={tab === "products" ? "active" : ""} onClick={() => { setTab("products"); setDraft(null); setMessage(""); }}><Package size={18} />{c("products")}<span className="admin-nav-count">{content.products.length}</span></button>
            <button aria-label={c("business")} className={tab === "business" ? "active" : ""} onClick={() => { setTab("business"); setDraft(null); setMessage(""); }}><Settings2 size={18} />{c("business")}</button>
            <button aria-label={language === "he" ? "תוכן האתר" : language === "ar" ? "محتوى الموقع" : "Site content"} className={tab === "content" ? "active" : ""} onClick={() => { setTab("content"); setDraft(null); setMessage(""); }}><FileText size={18} />{language === "he" ? "תוכן האתר" : language === "ar" ? "محتوى الموقع" : "Site content"}</button>
            <div className="admin-sidebar-bottom">
              <span className="admin-status-card"><i /><span><b>{c("live")}</b><small>Node.js · HTTPS</small></span></span>
              <button aria-label={c("logout")} onClick={signOut}><LogOut size={17} />{c("logout")}</button>
            </div>
          </aside>

          <section className="admin-main">
            <div className="admin-page-head">
              <div><span className="admin-eyebrow">{currentTabLabel}</span><h1>{currentTitle}</h1><p>{currentDescription}</p></div>
              {tab === "products" && <button className="admin-primary-button admin-add-button" onClick={() => { const product = emptyProduct(); setDraft(product); setSelectedId(product.id); setMessage(""); }}><Plus size={17} />{c("addProduct")}</button>}
            </div>

            {message && <div className={`admin-notice ${messageError ? "error" : "success"}`}>{messageError ? <CircleAlert size={17} /> : <Check size={17} />}{message}</div>}

            {tab === "overview" && (
              <>
                <div className="admin-stat-grid">
                  <article><span className="admin-stat-icon blue"><Package size={19} /></span><small>{c("models")}</small><strong>{content.products.length}</strong><span className="admin-stat-note">{c("catalogTitle")}</span></article>
                  <article><span className="admin-stat-icon green"><Check size={19} /></span><small>{c("available")}</small><strong>{content.products.filter((product) => product.available).length}</strong><span className="admin-stat-note">{c("live")}</span></article>
                  <article><span className="admin-stat-icon amber"><Phone size={19} /></span><small>{c("displayPhone")}</small><strong className="admin-stat-phone" dir="ltr">{content.settings.phoneDisplay}</strong><span className="admin-stat-note">WhatsApp · {content.settings.phoneE164}</span></article>
                </div>
                <section className="admin-panel admin-overview-products">
                  <div className="admin-panel-head"><div><h2>{c("catalogTitle")}</h2><p>{c("catalogText")}</p></div><button className="admin-text-button" onClick={() => setTab("products")}>{c("edit")} <ChevronDown size={15} /></button></div>
                  <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>{c("model")}</th><th>{c("brand")}</th><th>{c("price")}</th><th>{c("available")}</th></tr></thead><tbody>{content.products.slice(0, 6).map((product) => <tr key={product.id}><td><span className="admin-table-model"><img src={product.image} alt="" />{product.name}</span></td><td>{product.brand}</td><td>₪{product.price.toLocaleString("en-IL")}</td><td><span className={`admin-pill ${product.available ? "on" : "off"}`}>{product.available ? c("live") : c("unavailable")}</span></td></tr>)}</tbody></table></div>
                </section>
                <p className="admin-persist-hint"><ShieldCheck size={16} />{c("updated")}</p>
              </>
            )}

            {tab === "products" && (
              <div className="admin-products-layout">
                <section className="admin-panel admin-product-list">
                  <div className="admin-panel-head"><div><h2>{c("chooseModel")}</h2><p>{content.products.length} · {c("models")}</p></div></div>
                  <div className="admin-model-list">
                    {content.products.map((product) => <button key={product.id} className={`admin-model-row ${selectedId === product.id ? "selected" : ""}`} onClick={() => { setDraft(null); setSelectedId(product.id); setMessage(""); }}><img src={product.image} alt="" /><span><b>{product.name}</b><small>{product.brand} · ₪{product.price.toLocaleString("en-IL")}</small></span><i className={product.available ? "" : "off"} /></button>)}
                    {!content.products.length && <p className="admin-empty">{c("noProducts")}</p>}
                  </div>
                </section>

                {(draft || selectedProduct) && (() => {
                  const product = draft ?? selectedProduct!;
                  const isNew = !content.products.some((item) => item.id === product.id);
                  const setProduct = (patch: Partial<ManagedProduct>) => setDraft({ ...product, ...patch });
                  return <section className="admin-panel admin-product-editor">
                    <div className="admin-panel-head"><div><span className="admin-eyebrow">{isNew ? c("addProduct") : c("edit")}</span><h2>{product.name || c("model")}</h2></div>{!isNew && <button className="admin-icon-danger" aria-label={c("remove")} title={c("remove")} onClick={() => removeProduct(product.id)}><Trash2 size={17} /></button>}</div>
                    <div className="admin-form-grid">
                      <label>{c("brand")}<input value={product.brand} onChange={(event) => { const brand = event.target.value; const brandId = brand.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60) || "brand-new"; const exists = content.brands.some((item) => item.id === brandId); const brands = exists ? content.brands : [...content.brands, { id: brandId, name: { he: brand, ar: brand, en: brand }, logo: "", order: content.brands.length + 1, visible: true }]; setContent({ ...content, brands }); setProduct({ brand, brandId }); }} /></label>
                      <label>{c("model")}<input value={product.nameLocalized[language] || product.name} onChange={(event) => { const name = event.target.value; setProduct({ name, nameLocalized: { ...product.nameLocalized, [language]: name } }); }} /></label>
                      <label>{c("price")}<input type="number" min="0" step="1" value={product.price} onChange={(event) => setProduct({ price: Number(event.target.value) })} /></label>
                      <label>{c("btu")}<input type="number" min="0" step="1" value={product.cooling} onChange={(event) => setProduct({ cooling: Number(event.target.value) })} /></label>
                      <label>{c("energy")}<input value={product.energy} onChange={(event) => setProduct({ energy: event.target.value })} /></label>
                      <label>{c("room")}<SelectField value={product.room} onChange={(event) => setProduct({ room: event.target.value as ManagedProduct["room"], categoryId: event.target.value })}><option value="bedroom">{c("bedroom")}</option><option value="living">{c("living")}</option><option value="large">{c("large")}</option></SelectField></label>
                    </div>
                    <label className="admin-toggle-row"><input type="checkbox" checked={product.available} onChange={(event) => setProduct({ available: event.target.checked })} /><span><b>{c("availableToggle")}</b><small>{product.available ? c("live") : c("unavailable")}</small></span></label>
                    <div className="admin-upload-field"><span className="admin-field-label">{c("image")}</span><div className="admin-image-preview"><img src={product.image} alt="" /><label className="admin-upload-button"><Upload size={16} />{c("upload")}<input type="file" accept="image/jpeg,image/png,image/webp,image/avif" disabled={busy} onChange={(event) => { void uploadForProduct(event.target.files?.[0]); event.currentTarget.value = ""; }} /></label></div><small>{c("imageHint")}</small></div>
                    <div className="admin-editor-actions"><button className="admin-primary-button" disabled={busy || !product.name || !product.brand} onClick={saveProduct}><Save size={17} />{busy ? c("saving") : c("saveProduct")}</button></div>
                  </section>;
                })()}
              </div>
            )}

            {tab === "business" && (
              <form className="admin-panel admin-business-form" onSubmit={(event) => { event.preventDefault(); void saveAll(content); }}>
                <div className="admin-panel-head"><div><h2>{c("companyTitle")}</h2><p>{c("companyText")}</p></div></div>
                <div className="admin-form-grid">
                  <label>{c("displayPhone")}<input required value={content.settings.phoneDisplay} onChange={(event) => setContent({ ...content, settings: { ...content.settings, phoneDisplay: event.target.value } })} /></label>
                  <label>{c("phoneIntl")}<input required dir="ltr" placeholder={c("phoneHint")} value={content.settings.phoneE164} onChange={(event) => setContent({ ...content, settings: { ...content.settings, phoneE164: e164(event.target.value) } })} /></label>
                  <label>{c("whatsappIntl")}<input required dir="ltr" placeholder={c("phoneHint")} value={content.settings.whatsappE164} onChange={(event) => setContent({ ...content, settings: { ...content.settings, whatsappE164: e164(event.target.value) } })} /></label>
                  <label>{c("areaHe")}<input required value={content.settings.serviceAreaHe} onChange={(event) => setContent({ ...content, settings: { ...content.settings, serviceAreaHe: event.target.value } })} /></label>
                  <label>{c("areaAr")}<input required value={content.settings.serviceAreaAr} onChange={(event) => setContent({ ...content, settings: { ...content.settings, serviceAreaAr: event.target.value } })} /></label>
                  <label>{c("areaEn")}<input required value={content.settings.serviceAreaEn} onChange={(event) => setContent({ ...content, settings: { ...content.settings, serviceAreaEn: event.target.value } })} /></label>
                </div>
                <label className="admin-check-row"><input type="checkbox" checked={content.settings.pricesAreIndicative} onChange={(event) => setContent({ ...content, settings: { ...content.settings, pricesAreIndicative: event.target.checked } })} />{c("pricesDemo")}</label>
                <div className="admin-media-grid">
                  {([ ["logoImage", c("logo")], ["heroImage", c("hero")] ] as const).map(([key, label]) => <div className="admin-upload-field" key={key}><span className="admin-field-label">{label}</span><div className={`admin-image-preview ${key === "heroImage" ? "wide" : ""}`}><img src={content.settings[key]} alt="" /><label className="admin-upload-button"><ImagePlus size={16} />{c("upload")}<input type="file" accept="image/jpeg,image/png,image/webp,image/avif" disabled={busy} onChange={(event) => { void uploadForSetting(key, event.target.files?.[0]); event.currentTarget.value = ""; }} /></label></div><small>{c("imageHint")}</small></div>)}
                </div>
                <div className="admin-editor-actions"><button className="admin-primary-button" disabled={busy}><Save size={17} />{busy ? c("saving") : c("saveSettings")}</button><span className="admin-persist-hint"><Check size={15} />{c("updated")}</span></div>
              </form>
            )}

            {tab === "content" && <CmsPanel value={content} onChange={(next) => setContent(next)} onSave={(next) => { void saveAll(next); }} busy={busy} language={language} />}
          </section>
        </div>
      )}
    </main>
  );
}
