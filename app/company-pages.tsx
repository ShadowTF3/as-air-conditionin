"use client";
import { useEffect, useState, type FormEvent } from "react";
import Link from "./site-link";
import { SelectField } from "./select-field";
import {
  Wrench,
  Wind,
  ShieldCheck,
  Phone,
  MessageCircle,
  MapPin,
  Mail,
  Clock,
  Check,
  Snowflake,
  SlidersHorizontal,
} from "lucide-react";
import type { Translate } from "./locale";
import { useSiteContent } from "./site-content-context";
import { localize, productBrand, productTitle } from "./site-content-data";
import { PageIntro, ContactBanner, FAQ } from "./experience";
type Props = { t: Translate };
export function Services({ t }: Props) {
  const { content, lang } = useSiteContent();
  const icons = { installation: Wrench, maintenance: Wind, repair: ShieldCheck, consultation: SlidersHorizontal };
  const services = content.services.filter((service) => service.visible).sort((a, b) => a.order - b.order);
  return (
    <>
      <PageIntro
        t={t}
        eyebrow={t(
          "התקנה ושירות",
          "التركيب والصيانة",
          "INSTALLATION & SERVICE",
        )}
        title={t(
          "דואגים למזגן. ולנוחות שלכם.",
          "نعتني بمكيفك. وبراحتك.",
          "Care for your air. Care for your comfort.",
        )}
        description={t(
          "התקנה, תחזוקה ותיקונים — עם תשומת לב לפרטים ושיחה בגובה העיניים. שירות לבית ולעסק בכל ערי ישראל.",
          "تركيب وصيانة وإصلاح، باهتمام بالتفاصيل وتواصل واضح. خدمة للبيوت والأعمال في جميع المدن في إسرائيل.",
          "Installation, maintenance and repairs, with attention to detail and straightforward advice. Serving homes and businesses throughout Israel.",
        )}
        icon={<Wrench />}
      />
      <section className="wrap services-section">
        <div className="service-index">
          {services.map((service, i) => (
            <a href={`#${service.id}`} key={service.id}>
              <span>0{i + 1}</span>
              {localize(service.title, lang)}
            </a>
          ))}
        </div>
        {services.map((service, i) => {
          const Icon = icons[service.icon];
          return <article id={service.id} key={service.id} className="service-detail reveal">
            <div className="service-detail-heading">
              <span className="service-large-number">0{i + 1}</span>
              <Icon />
              <h2>{localize(service.title, lang)}</h2>
            </div>
            <div className="service-detail-copy">
              <img className="service-detail-media" src={service.image} alt={localize(service.title, lang)} loading="lazy" />
              <p>{localize(service.description, lang)}</p>
              <ul className="check-list">
                {service.points.map((point, pointIndex) => (
                  <li key={`${service.id}-${pointIndex}`}>
                    <Check size={17} />
                    {localize(point, lang)}
                  </li>
                ))}
              </ul>
              {localize(service.priceLabel, lang) && <p className="service-price-label">{localize(service.priceLabel, lang)}</p>}
              <Link
                className="button secondary"
                href={service.requestMethod === "phone" ? `tel:${content.settings.phoneE164}` : service.requestMethod === "whatsapp" ? `https://wa.me/${content.settings.whatsappE164.replace(/\D/g, "")}` : `/contact?service=${service.id}`}
              >
                {t("לתיאום השירות", "اطلب هذه الخدمة", "Arrange this service")}
              </Link>
            </div>
          </article>;
        })}
      </section>
      <section className="process-band">
        <div className="wrap">
          <span className="eyebrow">
            {t("פשוט, מההתחלה", "بوضوح، من البداية", "SIMPLE FROM THE START")}
          </span>
          <h2>
            {t(
              "כך חוזרים לאוויר טוב.",
              "هكذا نعيد الهواء الجيد.",
              "Your way back to better air.",
            )}
          </h2>
          <div className="process-grid">
            {content.servicePage.process.filter((step) => step.visible).sort((a, b) => a.order - b.order).map((step, i) => (
              <div key={step.id}>
                <span>0{i + 1}</span>
                <h3>{localize(step.title, lang)}</h3>
                <p>{localize(step.description, lang)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      {content.servicePage.showFaq && content.faqPage.showOnServices && <FAQ t={t} compact />}
      {content.servicePage.showContact && <ContactBanner t={t} />}
    </>
  );
}
export function About({ t }: Props) {
  const { content, lang } = useSiteContent();
  const { settings } = content;
  const valueIcons = { fit: SlidersHorizontal, craft: Wrench, communication: MessageCircle };
  return (
    <>
      <PageIntro
        t={t}
        eyebrow={t("אודות א.ס", "عن א.ס", "ABOUT A.S")}
        title={t(
          "מומחים למיזוג, עם מחשבה עליכם.",
          "متخصصون في التكييف، نهتم براحتك.",
          "Air conditioning expertise, with you in mind.",
        )}
        description={t(
          "מאחורי כל מערכת מיזוג יש אנשים שרוצים להרגיש בנוח. זו נקודת ההתחלה שלנו.",
          "وراء كل نظام تكييف أناس يريدون الراحة. من هنا نبدأ.",
          "Behind every air conditioning system are people who want to feel comfortable. That’s where we start.",
        )}
        icon={<Snowflake />}
      />
      <section className="section wrap about-story">
        <div className="about-photo">
          <img
            src={content.about.storyImage}
            alt={t(
              "מיזוג שמשתלב בבית",
              "تكييف ينسجم مع البيت",
              "Air conditioning that feels at home",
            )}
            loading="lazy"
          />
          <span>GOOD AIR. GOOD LIVING.</span>
        </div>
        <div>
          <span className="eyebrow">{localize(settings.companyName, lang)}</span>
          <h2>
            {t(
              "פתרון מיזוג שלם.",
              "حل تكييف متكامل.",
              "A complete air conditioning solution.",
            )}
            <br />
            {t(
              "יחס אישי לאורך הדרך.",
              "اهتمام شخصي بكل خطوة.",
              "Personal care along the way.",
            )}
          </h2>
          <p>
            {t(
              "א.ס מיזוג אוויר מתמחה במכירת מזגנים ובשירותי התקנה, תחזוקה ותיקונים. אנחנו מלווים את הבחירה לבית ולעסק, ומתאימים את הפתרון לצרכים של החלל ושל האנשים שמשתמשים בו.",
              "شركة א.ס מיזוג אוויר متخصصة في بيع المكيفات وخدمات التركيب والصيانة والإصلاح. نرافق اختيارك للبيت والعمل، ونراعي احتياجات المساحة والأشخاص الذين يستخدمونها.",
              "A.S Air Conditioning specialises in air conditioner sales, installation, maintenance and repairs. We guide choices for homes and businesses, with solutions shaped around the space and the people who use it.",
            )}
          </p>
          <p>
            {t(
              "עבורנו, שירות טוב הוא הסבר ברור, תיאום מראש ותשומת לב לפרטים. אנחנו נותנים שירות בכל ערי ישראל, בעברית ובערבית.",
              "الخدمة الجيدة بالنسبة لنا تعني شرحًا واضحًا وتنسيقًا مسبقًا واهتمامًا بالتفاصيل. نخدم جميع المدن في إسرائيل بالعربية والعبرية.",
              "To us, good service means clear explanations, arrangements made in advance and attention to detail. We serve every city in Israel, with personal service in Hebrew and Arabic.",
            )}
          </p>
          <Link className="text-link" href="/contact">
            {t("בואו נכיר", "لنتعرف عليك", "Let’s get acquainted")}
          </Link>
        </div>
      </section>
      <section className="values-section">
        <div className="wrap">
          <span className="eyebrow">
            {t("הדרך שלנו", "طريقتنا", "HOW WE WORK")}
          </span>
          <h2>
            {t(
              "הפרטים הקטנים. ההבדל הגדול.",
              "تفاصيل صغيرة. فرق كبير.",
              "Small details. A meaningful difference.",
            )}
          </h2>
          <div className="values-grid">
            {content.about.values.filter((value) => value.visible).sort((a, b) => a.order - b.order).map((value) => {
              const I = valueIcons[value.icon];
              return (
                <div className="value-card" key={value.id}>
                  <I />
                  <h3>{localize(value.title, lang)}</h3>
                  <p>{localize(value.description, lang)}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>
      <ContactBanner t={t} />
    </>
  );
}
export function Contact({ t }: Props) {
  const { content, lang } = useSiteContent();
  const { products, settings } = content;
  const visibleProducts = products.filter((item) => item.visible).sort((a, b) => a.order - b.order);
  const servicesList = [
    ["consultation", t("ייעוץ ורכישת מזגן", "استشارة وشراء مكيف", "Advice & a new air conditioner")],
    ...content.services.filter((item) => item.visible).sort((a, b) => a.order - b.order).map((item) => [item.id, localize(item.title, lang)]),
  ];
  const whatsappLink = (message = "") =>
    `https://wa.me/${settings.whatsappE164.replace(/\D/g, "")}${message ? `?text=${encodeURIComponent(message)}` : ""}`;
  const [service, setService] = useState("consultation");
  const [product, setProduct] = useState("");
  const [prepared, setPrepared] = useState(false);
  const [values, setValues] = useState({
    name: "",
    phone: "",
    city: "",
    message: "",
  });
  useEffect(() => {
    const timer = window.setTimeout(() => {
      const q = new URLSearchParams(location.search);
      const s = q.get("service");
      if (
        s &&
        (s === "consultation" || content.services.some((item) => item.id === s && item.visible))
      )
        setService(s);
      const p = q.get("product");
      if (p && visibleProducts.some((x) => x.id === p)) setProduct(p);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [visibleProducts, content.services]);
  const selectedProduct = visibleProducts.find((p) => p.id === product);
  const message =
    t(
      "שלום א.ס מיזוג אוויר, אשמח לתאם:",
      "مرحبًا א.ס מיזוג אוויר، أريد طلب:",
      "Hello A.S Air Conditioning, I’d like to request:",
    ) +
    "\n" +
    servicesList.find(([id]) => id === service)?.[1] +
    "\n" +
    t("שם: ", "الاسم: ", "Name: ") +
    values.name +
    "\n" +
    t("טלפון: ", "الهاتف: ", "Phone: ") +
    values.phone +
    "\n" +
    t("עיר: ", "المدينة: ", "City: ") +
    values.city +
    (selectedProduct
      ? "\n" + productBrand(selectedProduct, content.brands, lang) + " " + productTitle(selectedProduct, lang)
      : "") +
    (values.message ? "\n" + values.message : "");
  const submit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setPrepared(true);
    setTimeout(() => document.getElementById("request-review")?.focus(), 0);
  };
  const update = (key: keyof typeof values, value: string) => {
    setValues((prev) => ({ ...prev, [key]: value }));
    setPrepared(false);
  };
  return (
    <>
      <PageIntro
        t={t}
        eyebrow={t("יצירת קשר", "تواصل معنا", "LET’S CONNECT")}
        title={t(
          "בואו נעשה לכם נעים.",
          "لنجعل بيتك أكثر راحة.",
          "Let’s make you comfortable.",
        )}
        description={t(
          "שאלה קטנה, מזגן חדש או תקלה שדורשת טיפול — נשמח לדבר, להבין ולעזור.",
          "سؤال، مكيف جديد أو عطل يحتاج إصلاحًا، يسعدنا أن نفهم احتياجك ونساعدك.",
          "A quick question, a new air conditioner or a fault that needs attention — we’re here to listen and help.",
        )}
        icon={<MessageCircle />}
      />
      <section className="section wrap contact-grid">
        <aside className="contact-details">
          <span className="eyebrow">
            {t("מדברים ישירות", "تواصل مباشر", "A REAL CONVERSATION")}
          </span>
          <h2>
            {t("אנחנו כאן בשבילכם.", "نحن هنا لمساعدتك.", "Here to help.")}
          </h2>
          <a href={`tel:${settings.phoneE164}`} className="contact-method">
            <span>
              <Phone />
            </span>
            <div>
              <small>{t("טלפון", "الهاتف", "Call us")}</small>
              <strong dir="ltr">{settings.phoneDisplay}</strong>
            </div>
          </a>
          <a
            href={whatsappLink()}
            target="_blank"
            rel="noopener noreferrer"
            className="contact-method"
          >
            <span>
              <MessageCircle />
            </span>
            <div>
              <small>WhatsApp</small>
              <strong>
                {t("שלחו לנו הודעה", "أرسل لنا رسالة", "Start a conversation")}
              </strong>
            </div>
          </a>
          <div className="contact-method">
            <span>
              <MapPin />
            </span>
            <div>
              <small>{t("אזורי שירות", "مناطق الخدمة", "Where we work")}</small>
              <strong>
                {lang === "he"
                  ? settings.serviceAreaHe
                  : lang === "ar"
                    ? settings.serviceAreaAr
                    : settings.serviceAreaEn}
              </strong>
            </div>
          </div>
          {settings.email && <a href={`mailto:${settings.email}`} className="contact-method"><span><Mail /></span><div><small>{t("דוא״ל", "البريد الإلكتروني", "Email")}</small><strong>{settings.email}</strong></div></a>}
          {localize(settings.address, lang) && <div className="contact-method"><span><MapPin /></span><div><small>{t("כתובת", "العنوان", "Address")}</small><strong>{localize(settings.address, lang)}</strong></div></div>}
          {localize(settings.businessHours, lang) && <div className="contact-method"><span><Clock /></span><div><small>{t("שעות פעילות", "ساعات العمل", "Business hours")}</small><strong>{localize(settings.businessHours, lang)}</strong></div></div>}
          {settings.socialLinks.some((item) => item.visible) && <div className="contact-socials">{settings.socialLinks.filter((item) => item.visible).sort((a, b) => a.order - b.order).map((item) => <a href={item.url} key={item.id} target="_blank" rel="noopener noreferrer">{item.label}</a>)}</div>}
          <div className="contact-hint">
            <Snowflake />
            <p>
              {t(
                "יש לכם דגם או קוד תקלה? ציינו אותם בבקשה כדי שנוכל לעזור בצורה מדויקת יותר.",
                "لديك موديل أو رمز عطل؟ اذكره لنساعدك بدقة أكبر.",
                "Have a model name or an error code? Include it so we can help more precisely.",
              )}
            </p>
          </div>
        </aside>
        <div className="request-card">
          <span className="eyebrow">
            {t(
              "כמה פרטים, ומתחילים",
              "بعض التفاصيل، ونبدأ",
              "A FEW DETAILS TO START",
            )}
          </span>
          <h2>
            {t(
              "מה נוכל לעשות בשבילכם?",
              "كيف يمكننا مساعدتك؟",
              "How can we help?",
            )}
          </h2>
          <p>
            {t(
              "הכינו בקשה מסודרת והמשיכו איתה לוואטסאפ.",
              "جهز طلبك ثم تابع به إلى واتساب.",
              "Prepare your request, then continue with it to WhatsApp.",
            )}
          </p>
          <form onSubmit={submit}>
            <div className="form-grid">
              <label className="field">
                <span>{t("שם מלא", "الاسم الكامل", "Full name")} *</span>
                <input
                  required
                  minLength={2}
                  maxLength={80}
                  autoComplete="name"
                  value={values.name}
                  onChange={(e) => update("name", e.target.value)}
                  placeholder={t(
                    "איך לפנות אליכם?",
                    "كيف نناديك؟",
                    "How should we address you?",
                  )}
                />
              </label>
              <label className="field">
                <span>{t("מספר טלפון", "رقم الهاتف", "Phone number")} *</span>
                <input
                  type="tel"
                  required
                  minLength={9}
                  maxLength={20}
                  title={t(
                    "מספר טלפון עם 9–20 תווים",
                    "رقم هاتف من 9 إلى 20 خانة",
                    "A phone number with 9–20 characters",
                  )}
                  autoComplete="tel"
                  dir="ltr"
                  value={values.phone}
                  onChange={(e) => update("phone", e.target.value)}
                  placeholder="05X-XXX-XXXX"
                />
              </label>
              <label className="field">
                <span>{t("עיר", "المدينة", "City")} *</span>
                <input
                  required
                  minLength={2}
                  maxLength={80}
                  autoComplete="address-level2"
                  value={values.city}
                  onChange={(e) => update("city", e.target.value)}
                  placeholder={t(
                    "היכן נדרש השירות?",
                    "أين تحتاج الخدمة؟",
                    "Where do you need us?",
                  )}
                />
              </label>
              <label className="field">
                <span>{t("סוג הבקשה", "نوع الطلب", "What do you need?")}</span>
                <SelectField
                  value={service}
                  onChange={(e) => {
                    setService(e.target.value);
                    setPrepared(false);
                  }}
                >
                  {servicesList.map(([id, label]) => (
                    <option key={id} value={id}>
                      {label}
                    </option>
                  ))}
                </SelectField>
              </label>
              <label className="field full">
                <span>
                  {t(
                    "דגם שמעניין אתכם",
                    "الموديل الذي يهمك",
                    "Model you’re interested in",
                  )}
                </span>
                <SelectField
                  value={product}
                  onChange={(e) => {
                    setProduct(e.target.value);
                    setPrepared(false);
                  }}
                >
                  <option value="">
                    {t(
                      "טרם בחרתי / לא רלוונטי",
                      "لم أختر بعد / لا ينطبق",
                      "Not chosen yet / not applicable",
                    )}
                  </option>
                  {visibleProducts.map((p) => (
                    <option key={p.id} value={p.id}>
                      {productBrand(p, content.brands, lang)} {productTitle(p, lang)}
                    </option>
                  ))}
                </SelectField>
              </label>
              <label className="field full">
                <span>
                  {t(
                    "ספרו לנו קצת יותר",
                    "أخبرنا بالمزيد",
                    "Tell us a little more",
                  )}
                </span>
                <textarea
                  rows={4}
                  maxLength={1000}
                  value={values.message}
                  onChange={(e) => update("message", e.target.value)}
                  placeholder={t(
                    "סוג המזגן, קוד תקלה או פרטים על החלל…",
                    "نوع المكيف أو رمز العطل أو تفاصيل المساحة…",
                    "Model, error code or a few details about your space…",
                  )}
                />
              </label>
            </div>
            <button className="button" type="submit">
              <MessageCircle size={18} />
              {t("הכנת הבקשה", "جهّز الطلب", "Prepare my request")}
            </button>
            <p className="small-note">
              {t(
                "הפרטים לא נשלחים ולא נשמרים באתר. תוכלו לבדוק את הבקשה לפני המשך לוואטסאפ ושליחתה.",
                "لا تُرسل البيانات ولا تُحفظ في الموقع. يمكنك مراجعة الطلب قبل المتابعة إلى واتساب وإرساله.",
                "Your details are not sent or stored on this site. Review your request before continuing to WhatsApp and sending it.",
              )}
            </p>
          </form>
          {prepared && (
            <div
              className="request-review"
              id="request-review"
              tabIndex={-1}
              role="region"
              aria-label={t(
                "בדיקת הבקשה",
                "مراجعة الطلب",
                "Review your request",
              )}
            >
              <h3>
                <Check />
                {t(
                  "הבקשה מוכנה לבדיקה",
                  "طلبك جاهز للمراجعة",
                  "Your request is ready to review",
                )}
              </h3>
              <p>{message}</p>
              <a
                href={whatsappLink(message)}
                target="_blank"
                rel="noopener noreferrer"
                className="button"
              >
                {t("להמשך בוואטסאפ", "تابع عبر واتساب", "Continue to WhatsApp")}
                <MessageCircle size={17} />
              </a>
              <small>
                {t(
                  "ההודעה לא נשלחה. שולחים מתוך וואטסאפ לאחר הבדיקה.",
                  "لم يتم إرسال الرسالة. أرسلها من واتساب بعد المراجعة.",
                  "Nothing has been sent. Send the message in WhatsApp after reviewing it.",
                )}
              </small>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
export function Policies({ t }: Props) {
  const { content, lang } = useSiteContent();
  return (
    <>
      <PageIntro
        t={t}
        eyebrow={t("רכישה ושירות", "الشراء والخدمة", "PURCHASE & SERVICE")}
        title={t(
          "כל הפרטים, בשקיפות.",
          "كل التفاصيل، بوضوح.",
          "The details, clearly explained.",
        )}
        description={t(
          "לפני שמחליטים, מוודאים יחד מה כלול בהצעה ומה מתאים לכם.",
          "قبل اتخاذ القرار نوضح ما يشمله العرض وما يناسبك.",
          "Before you decide, we’ll clarify what’s included and what works for you.",
        )}
      />
      <section className="section wrap policies">
        <div className="policy-note">{localize(content.policies.notice, lang)}</div>
        {content.policies.items.filter((item) => item.visible).sort((a, b) => a.order - b.order).map((item, i) => (
          <article key={item.id}>
            <span>0{i + 1}</span>
            <div>
              <h2>{localize(item.title, lang)}</h2>
              <p>{localize(item.body, lang)}</p>
            </div>
          </article>
        ))}
        <Link className="button secondary" href="/contact">
          {t(
            "בירור פרטים נוספים",
            "استفسر عن التفاصيل",
            "Ask us for more details",
          )}
        </Link>
      </section>
    </>
  );
}
export function FAQPage({ t }: Props) {
  return (
    <>
      <PageIntro
        t={t}
        eyebrow={t("שאלות נפוצות", "أسئلة شائعة", "FREQUENTLY ASKED QUESTIONS")}
        title={t(
          "קצת ידע. הרבה שקט.",
          "معرفة أكثر. راحة أكبر.",
          "A little clarity. A lot of comfort.",
        )}
        description={t(
          "תשובות לשאלות על בחירת מזגן, התקנה ושירות.",
          "إجابات حول اختيار المكيف والتركيب والصيانة.",
          "Answers about choosing an air conditioner, installation and service.",
        )}
      />
      <FAQ t={t} />
      <ContactBanner t={t} />
    </>
  );
}
