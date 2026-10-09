"use client";
import { Fragment, useState, useEffect, useMemo, type CSSProperties, type ReactNode } from "react";
import Link from "./site-link";
import { SelectField } from "./select-field";
import {
  Snowflake,
  Phone,
  Menu,
  X,
  Wrench,
  ShieldCheck,
  Leaf,
  MessageCircle,
  Check,
  MapPin,
} from "lucide-react";
import type { Lang, Translate } from "./locale";
import { defaultSiteContent, localize, type HomeSectionId, type SiteContent } from "./site-content-data";
import { siteTranslator } from "./site-content-copy";
import { SiteContentProvider } from "./site-content-context";
import { Catalog, ProductDetail, HomeProducts, HomeServiceStory, HomeRoomCards, HomeOffers, FAQ, ContactBanner } from "./experience";
import { Services, About, Contact, Policies, FAQPage } from "./company-pages";
export default function Site({
  page = "home",
  slug,
}: {
  page?: string;
  slug?: string;
}) {
  const [lang, setLang] = useState<Lang>("he");
  const [content, setContent] = useState(defaultSiteContent);
  const [menu, setMenu] = useState(false);
  const [ready, setReady] = useState(false);
  const t: Translate = useMemo(() => siteTranslator(lang, content.copy), [lang, content.copy]);
  const { settings } = content;
  const whatsappUrl = `https://wa.me/${settings.whatsappE164.replace(/\D/g, "")}`;
  const themeStyle = {
    "--blue": content.theme.primary,
    "--site-accent": content.theme.accent,
    "--pale": content.theme.surface,
    "--navy": content.theme.ink,
  } as CSSProperties;
  useEffect(() => {
    const timer = window.setTimeout(() => {
      const l = localStorage.getItem("as-language");
      if (l === "ar" || l === "en") setLang(l);
      setReady(true);
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);
  useEffect(() => {
    let active = true;
    fetch("/api/content", { cache: "no-store" })
      .then((response) => (response.ok ? response.json() : null))
      .then((rawValue) => {
        const value = rawValue as SiteContent | null;
        if (active && value?.products && value?.settings) setContent(value);
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, []);
  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === "en" ? "ltr" : "rtl";
    document.body.dataset.ready = String(ready);
  }, [lang, ready]);
  const changeLang = (l: Lang) => {
    setLang(l);
    localStorage.setItem("as-language", l);
  };
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("visible");
            observer.unobserve(e.target);
          }
        }),
      { threshold: 0.08 },
    );
    document.querySelectorAll(".reveal").forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [page, lang]);
  const nav = content.navigation.filter((item) => item.visible).sort((a, b) => a.order - b.order);
  const footerLinks = content.footer.links.filter((item) => item.visible).sort((a, b) => a.order - b.order);
  const homeComponents: Record<HomeSectionId, ReactNode> = {
    hero: <HomeHero t={t} settings={settings} home={content.home} />,
    benefits: <HomeBenefits t={t} config={content.home.benefits} />,
    featuredProducts: <HomeProducts t={t} />,
    offers: <HomeOffers />,
    serviceStory: <HomeServiceStory t={t} />,
    roomCards: <HomeRoomCards t={t} />,
    faq: content.home.showFaqPreview && content.faqPage.showOnHome ? <FAQ t={t} compact /> : null,
    contact: <ContactBanner t={t} />,
  };
  return (
    <SiteContentProvider value={{ content, lang }}>
    <div className="site-content" style={themeStyle}>
      <a className="skip-link" href="#main">
        {t("דילוג לתוכן", "انتقل إلى المحتوى")}
      </a>
      <div className="topbar">
        <div className="wrap">
          <span>{localize(settings.topbarMessage, lang)}</span>
          <span>
            <MapPin size={13} />
            {lang === "he"
              ? settings.serviceAreaHe
              : lang === "ar"
                ? settings.serviceAreaAr
                : settings.serviceAreaEn}
            <i />
            <a href={`tel:${settings.phoneE164}`} dir="ltr">
              {settings.phoneDisplay}
            </a>
          </span>
        </div>
      </div>
      <header>
        <div className="wrap header-inner">
          <Link href="/" className="brand" aria-label={localize(settings.companyName, lang)}>
            <span className="logo-crop">
              <img src={settings.logoImage} alt="" />
            </span>
            <span>
              <strong>{localize(settings.companyName, lang)}</strong>
              <small>{localize(settings.brandDescriptor, lang)}</small>
            </span>
          </Link>
          <nav
            className={menu ? "nav open" : "nav"}
            onClick={() => setMenu(false)}
            aria-label={t("תפריט ראשי", "القائمة الرئيسية")}
          >
            {nav.map((item) => (
              <Link
                href={item.href}
                key={item.id}
                className={page === "home" ? item.href === "/" ? "active" : "" : item.href === `/${page === "product" ? "products" : page}` ? "active" : ""}
              >
                {localize(item.label, lang)}
              </Link>
            ))}
          </nav>
          <div className="header-actions">
            <SelectField
              className="language"
              value={lang}
              onChange={(e) => changeLang(e.target.value as Lang)}
              aria-label={t("שפת האתר", "لغة الموقع", "Website language")}
            >
              <option value="he">עברית</option>
              <option value="ar">العربية</option>
              <option value="en">EN</option>
            </SelectField>
            <Link
              href={settings.headerCtaHref}
              className="button small header-cta"
            >
              {t("בואו נדבר", "لنتحدث")}
              <MessageCircle size={16} />
            </Link>
            <button
              className="menu-button icon-button"
              aria-expanded={menu}
              aria-label={t("פתיחת תפריט", "فتح القائمة")}
              onClick={() => setMenu(!menu)}
            >
              {menu ? <X /> : <Menu />}
            </button>
          </div>
        </div>
      </header>
      <main id="main">
        {page === "home" ? (
          content.home.sections.filter((section) => section.visible).sort((a, b) => a.order - b.order).map((section) => <Fragment key={section.id}>{homeComponents[section.id]}</Fragment>)
        ) : page === "products" ? (
          <Catalog t={t} />
        ) : page === "product" ? (
          <ProductDetail t={t} slug={slug} />
        ) : page === "services" ? (
          <Services t={t} />
        ) : page === "about" ? (
          <About t={t} />
        ) : page === "contact" ? (
          <Contact t={t} />
        ) : page === "policies" ? (
          <Policies t={t} />
        ) : (
          <FAQPage t={t} />
        )}
      </main>
      <footer>
        <div className="wrap footer-grid">
          <div>
            <strong className="footer-brand">{localize(settings.companyName, lang)}</strong>
            <p>{t("מכניסים הביתה אוויר טוב.", "هواء أفضل، وراحة لبيتك.")}</p>
            <p>
              {t("מכירה, התקנה, תחזוקה ותיקונים.", "بيع وتركيب وصيانة وإصلاح.")}
            </p>
          </div>
          <div>
            <strong>{t("בואו למצוא את הנוחות שלכם", "اكتشف راحتك")}</strong>
            {footerLinks.map((item) => (
              <Link href={item.href} key={item.id}>
                {localize(item.label, lang)}
              </Link>
            ))}
          </div>
          <div>
            <strong>{t("נשמח לשמוע מכם", "يسعدنا تواصلك")}</strong>
            <a href={`tel:${settings.phoneE164}`} dir="ltr">
              {settings.phoneDisplay}
            </a>
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              WhatsApp
            </a>
            <span>
              {lang === "he"
                ? settings.serviceAreaHe
                : lang === "ar"
                  ? settings.serviceAreaAr
                  : settings.serviceAreaEn}
            </span>
            {settings.email && <a href={`mailto:${settings.email}`}>{settings.email}</a>}
            {settings.socialLinks.filter((item) => item.visible).sort((a, b) => a.order - b.order).map((item) => <a href={item.url} target="_blank" rel="noopener noreferrer" key={item.id}>{item.label}</a>)}
          </div>
        </div>
        <div className="wrap footer-bottom">
          <span>© {new Date().getFullYear()} {localize(settings.companyName, lang)}</span>
          <Link href="/policies">
            {t("רכישה, משלוח ואחריות", "الشراء والتوصيل والضمان")}
          </Link>
          <Link href="/faq">{t("שאלות נפוצות", "أسئلة شائعة")}</Link>
        </div>
      </footer>
      <a
        className="floating-whatsapp"
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={t("דברו איתנו בוואטסאפ", "تواصل عبر واتساب")}
      >
        <MessageCircle />
      </a>
    </div>
    </SiteContentProvider>
  );
}

function HomeHero({ t, settings, home }: { t: Translate; settings: SiteContent["settings"]; home: SiteContent["home"] }) {
  return (
    <section className="hero wrap">
      <div className="hero-copy">
        <span className="eyebrow"><span />{t("נוחות שמרגישים. איכות שסומכים עליה.", "راحة تشعر بها. جودة تثق بها.")}</span>
        <h1>{t("האוויר הנכון.", "الهواء المناسب.")}<br /><span>{t("הבית שלכם.", "لبيتك.")}</span></h1>
        <p>{t("מזגן טוב הוא רק ההתחלה. אנחנו כאן כדי להתאים, להתקין ולדאוג לנוחות שלכם — בקיץ, בחורף וכל מה שביניהם.", "المكيف الجيد هو البداية. نساعدك في الاختيار والتركيب والصيانة، لراحة بيتك صيفًا وشتاءً.")}</p>
        <div className="hero-buttons">
          <Link className="button" href={home.heroPrimaryHref}>{t("למציאת המזגן שלכם", "اكتشف المكيف المناسب")}<Snowflake size={18} /></Link>
          <Link className="button secondary" href={home.heroSecondaryHref}>{t("אני צריך שירות למזגן", "أحتاج صيانة للمكيف")}<Wrench size={17} /></Link>
        </div>
        <div className="hero-assurances">
          <span><Check />{t("התאמה אישית", "اختيار يناسبك")}</span>
          <span><Check />{t("התקנה מקצועית", "تركيب احترافي")}</span>
          <span><Check />{t("ליווי גם אחרי הרכישה", "متابعة بعد الشراء")}</span>
        </div>
      </div>
      <div className="hero-visual">
        <img src={settings.heroImage} alt={t("סלון מואר ונעים עם מזגן עילי", "غرفة معيشة مضيئة ومريحة مع مكيف جداري")} fetchPriority="high" />
        <span className="image-caption">{t("נוחות, בכל פרט", "راحة في كل تفصيل", "COMFORT, BY DESIGN.")}</span>
        <div className="temperature-card"><div className="temperature-icon"><Snowflake /></div><div><small>{t("בדיוק כמו שאתם אוהבים", "تمامًا كما تحب")}</small><strong dir="ltr">24° <span>{t("של נוחות", "من الراحة")}</span></strong></div></div>
        <div className="image-number">{t("בכל עונה / 01", "في كل موسم / 01", "01 / EVERY SEASON")}</div>
      </div>
    </section>
  );
}

function HomeBenefits({ t, config }: { t: Translate; config: SiteContent["home"]["benefits"] }) {
  const items = [
    { id: "confidence", icon: ShieldCheck, title: t("בחירה בראש שקט", "اختيار بكل ثقة"), description: t("ייעוץ ברור, בלי סימני שאלה", "استشارة واضحة، دون حيرة") },
    { id: "energy", icon: Leaf, title: t("חושבים גם על החשמל", "نراعي استهلاك الطاقة"), description: t("טכנולוגיית אינוורטר חכמה", "تقنية إنفرتر ذكية") },
    { id: "installation", icon: Wrench, title: t("מהבחירה ועד ההתקנה", "من الاختيار إلى التركيب"), description: t("פתרון שלם במקום אחד", "حل متكامل في مكان واحد") },
    { id: "service", icon: Phone, title: t("תמיד יש עם מי לדבר", "دائمًا هناك من يساعدك"), description: t("שירות אישי בעברית ובערבית", "خدمة بالعربية والعبرية") },
  ];
  return (
    <div className="benefits wrap">
      {config.filter((item) => item.visible).sort((a, b) => a.order - b.order).map((setting) => {
        const item = items.find((candidate) => candidate.id === setting.id);
        if (!item) return null;
        const Icon = item.icon;
        return <div key={setting.id}><Icon /><span><strong>{item.title}</strong><small>{item.description}</small></span></div>;
      })}
    </div>
  );
}
