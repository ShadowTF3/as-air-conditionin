"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import Link from "./site-link";
import {
  Snowflake,
  Leaf,
  Wrench,
  Wind,
  ShieldCheck,
  Search,
  SlidersHorizontal,
  Scale,
  Check,
  X,
  Phone,
  MessageCircle,
  Thermometer,
  Wifi,
  Plus,
} from "lucide-react";
import { money } from "./catalog-data";
import { localize, productBrand, productTitle, type ManagedProduct } from "./site-content-data";
import { useSiteContent } from "./site-content-context";
import type { Translate } from "./locale";
type Props = { t: Translate };
export const roomLabel = (room: string, t: Translate) =>
  room === "bedroom"
    ? t("חדר שינה", "غرفة النوم", "Bedroom")
    : room === "living"
      ? t("חלל משפחתי", "مساحة عائلية", "Living space")
      : t("חלל גדול", "مساحة كبيرة", "Large space");
export function ProductCard({
  product: p,
  t,
  onCompare,
  selected,
}: {
  product: ManagedProduct;
  t: Translate;
  onCompare?: (id: string) => void;
  selected?: boolean;
}) {
  const { content, lang } = useSiteContent();
  const title = productTitle(p, lang);
  const brand = productBrand(p, content.brands, lang);
  return (
    <article className="product-card">
      <Link
        href={`/products/${p.id}`}
        className="product-image"
        aria-label={`${brand} ${title}`}
      >
        <span className="tag">{t("אינוורטר", "إنفرتر", "INVERTER")}</span>
        <img
          src={p.image}
          alt={`${brand} ${title}`}
          width="860"
          height="290"
          loading="lazy"
        />
      </Link>
      <div className="product-info">
        <small>{brand.toUpperCase()}</small>
        <Link href={`/products/${p.id}`}>
          <h3 dir="ltr">{title}</h3>
        </Link>
        <div className="product-specs">
          <span>
            <Snowflake size={14} />
            <bdi>{p.cooling.toLocaleString("en-US")} BTU</bdi>
          </span>
          <span>
            <Leaf size={14} />
            <bdi>{p.energy}</bdi>
          </span>
        </div>
        <p className="room-label">{roomLabel(p.room, t)}</p>
        <div className="product-price">
          <strong dir="ltr">{money(p.price)}</strong>
          <small>
            {p.available === false
              ? t("לא זמין כרגע", "غير متوفر حاليًا", "Currently unavailable")
              : content.settings.pricesAreIndicative
                ? t("מחיר להמחשה", "سعر توضيحي", "Indicative price")
                : t("מחיר", "السعر", "Price")}
          </small>
        </div>
        <div className="card-actions">
          <Link href={`/products/${p.id}`} className="button secondary small">
            {t("פרטים והתאמה", "التفاصيل والاختيار", "Explore model")}
          </Link>
          {onCompare && (
            <button
              className={`compare-button ${selected ? "selected" : ""}`}
              onClick={() => onCompare(p.id)}
              aria-pressed={!!selected}
              aria-label={`${t("השוואה", "قارن", "Compare")} ${title}`}
            >
              {selected ? <Check size={17} /> : <Scale size={17} />}
              <span>{t("השוואה", "قارن", "Compare")}</span>
            </button>
          )}
        </div>
      </div>
    </article>
  );
}
export function Catalog({ t }: Props) {
  const { content, lang } = useSiteContent();
  const products = useMemo(() => content.products.filter((product) => product.visible).sort((a, b) => a.order - b.order), [content.products]);
  const brands = useMemo(() => content.brands.filter((item) => item.visible).sort((a, b) => a.order - b.order), [content.brands]);
  const categories = useMemo(() => content.categories.filter((item) => item.visible).sort((a, b) => a.order - b.order), [content.categories]);
  const [query, setQuery] = useState("");
  const [brand, setBrand] = useState("all");
  const [category, setCategory] = useState("all");
  const [room, setRoom] = useState("all");
  const [sort, setSort] = useState("featured");
  const [selected, setSelected] = useState<string[]>([]);
  const [notice, setNotice] = useState("");
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const timer = window.setTimeout(() => {
      const r = new URLSearchParams(location.search).get("room");
      if (r && ["bedroom", "living", "large"].includes(r)) setRoom(r);
      const c = new URLSearchParams(location.search).get("category");
      if (c && categories.some((item) => item.id === c)) setCategory(c);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [products, categories]);
  const filtered = products
    .filter(
      (p) =>
        (brand === "all" || p.brandId === brand) &&
        (category === "all" || p.categoryId === category) &&
        (room === "all" || p.room === room) &&
        `${productTitle(p, lang)} ${productBrand(p, content.brands, lang)}`.toLowerCase().includes(query.toLowerCase()),
    )
    .sort((a, b) =>
      sort === "low"
        ? a.price - b.price
        : sort === "high"
          ? b.price - a.price
          : Number(b.featured) - Number(a.featured) || a.order - b.order,
    );
  const reset = () => {
    setQuery("");
    setBrand("all");
    setCategory("all");
    setRoom("all");
    setSort("featured");
  };
  const toggle = (id: string) => {
    setNotice("");
    setSelected((prev) =>
      prev.includes(id)
        ? prev.filter((x) => x !== id)
        : prev.length < 3
          ? [...prev, id]
          : (setNotice(
              t(
                "אפשר להשוות עד שלושה מזגנים. הסירו דגם כדי להוסיף אחר.",
                "يمكن مقارنة ثلاثة مكيفات كحد أقصى. أزل واحدًا لإضافة آخر.",
                "Compare up to three models. Remove one to add another.",
              ),
            ),
            prev),
    );
  };
  useEffect(() => {
    const context = (
      document as unknown as {
        modelContext?: {
          registerTool: (tool: unknown, options: unknown) => unknown;
        };
      }
    ).modelContext;
    if (!context?.registerTool) return;
    const controller = new AbortController();
    try {
      Promise.resolve(
        context.registerTool(
          {
            name: "filter_air_conditioners",
            description:
              "Filter the visible air-conditioner catalog by brand, room and model name. Does not make purchases or contact the company.",
            inputSchema: {
              type: "object",
              properties: {
                brand: { enum: ["all", ...brands.map((item) => item.id)] },
                category: { enum: ["all", ...categories.map((item) => item.id)] },
                room: { enum: ["all", "bedroom", "living", "large"] },
                query: { type: "string" },
              },
              additionalProperties: false,
            },
            annotations: { readOnlyHint: false },
            execute: async (input: unknown) => {
              const v = input as {
                brand?: string;
                category?: string;
                room?: string;
                query?: string;
              };
              if (
                !v ||
                typeof v !== "object" ||
                (v.brand !== undefined &&
                  !["all", ...brands.map((item) => item.id)].includes(v.brand)) ||
                (v.category !== undefined &&
                  !["all", ...categories.map((item) => item.id)].includes(v.category)) ||
                (v.room !== undefined &&
                  !["all", "bedroom", "living", "large"].includes(v.room)) ||
                (v.query !== undefined && typeof v.query !== "string") ||
                Object.keys(v).some(
                  (key) => !["brand", "category", "room", "query"].includes(key),
                )
              )
                throw new Error("Invalid catalog filters");
              setBrand(v.brand ?? "all");
              setCategory(v.category ?? "all");
              setRoom(v.room ?? "all");
              setQuery(v.query ?? "");
              await new Promise<void>((resolve) =>
                requestAnimationFrame(() =>
                  requestAnimationFrame(() => resolve()),
                ),
              );
              return {
                products: products
                  .filter(
                    (p) =>
                      p.visible &&
                      (!v.brand || v.brand === "all" || p.brandId === v.brand) &&
                      (!v.category || v.category === "all" || p.categoryId === v.category) &&
                      (!v.room || v.room === "all" || p.room === v.room) &&
                      `${productBrand(p, content.brands, lang)} ${productTitle(p, lang)}`
                        .toLowerCase()
                        .includes((v.query ?? "").toLowerCase()),
                  )
                  .map((p) => ({
                    id: p.id,
                    model: productTitle(p, lang),
                    illustrativePrice: p.price,
                  })),
              };
            },
          },
          { signal: controller.signal },
        ),
      ).catch(() => {});
    } catch {}
    return () => controller.abort();
  }, [products, brands, categories, content.brands, lang]);
  return (
    <>
      <PageIntro
        t={t}
        eyebrow={t("הקטלוג", "الكتالوج", "THE COLLECTION")}
        title={t(
          "מזגן שמתאים לצרכים שלכם.",
          "مكيف يناسب احتياجك.",
          "Air conditioning that fits your needs.",
        )}
        description={t(
          "השוו דגמים, הכירו את היתרונות ומצאו את הכיוון הנכון לבית שלכם. את הפרטים האחרונים נסגור יחד.",
          "قارن الموديلات واكتشف مزاياها واختر الأنسب لبيتك. نساعدك في إتمام الاختيار.",
          "Explore the models, compare the details and find your fit. We’ll help with the final choice.",
        )}
        icon={<Snowflake />}
      />
      <section className="wrap catalog-section">
        <div
          className="room-tabs"
          aria-label={t(
            "בחירה לפי חלל",
            "الاختيار حسب المساحة",
            "Filter by space",
          )}
        >
          {["all", "bedroom", "living", "large"].map((r) => (
            <button
              key={r}
              onClick={() => setRoom(r)}
              className={r === room ? "selected" : ""}
              aria-pressed={r === room}
            >
              {r === "all"
                ? t("כל המזגנים", "كل المكيفات", "All models")
                : roomLabel(r, t)}
            </button>
          ))}
        </div>
        <div className="catalog-layout">
          <aside className="filters">
            <h2>
              <SlidersHorizontal size={18} />
              {t("לדייק את הבחירה", "خصص اختيارك", "Refine your choice")}
            </h2>
            <label className="field">
              <span>{t("חיפוש דגם", "ابحث عن موديل", "Search models")}</span>
              <div className="search-field">
                <Search size={17} />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Tadiran, Electra…"
                  type="search"
                />
              </div>
            </label>
            <label className="field">
              <span>{t("מותג", "العلامة التجارية", "Brand")}</span>
              <select value={brand} onChange={(e) => setBrand(e.target.value)}>
                <option value="all">
                  {t("כל המותגים", "جميع العلامات", "All brands")}
                </option>
                {brands.map((item) => <option value={item.id} key={item.id}>{localize(item.name, lang)}</option>)}
              </select>
            </label>
            <label className="field">
              <span>{t("קטגוריה", "التصنيف", "Category")}</span>
              <select value={category} onChange={(e) => setCategory(e.target.value)}>
                <option value="all">{t("כל הקטגוריות", "جميع التصنيفات", "All categories")}</option>
                {categories.map((item) => <option key={item.id} value={item.id}>{localize(item.name, lang)}</option>)}
              </select>
            </label>
            <button className="text-link reset-button" onClick={reset}>
              {t("איפוס סינון", "إعادة ضبط الفلاتر", "Reset filters")}
            </button>
            <div className="advisor-card">
              <Wind />
              <h3>
                {t(
                  "לא בטוחים במה לבחור?",
                  "تحتاج مساعدة في الاختيار؟",
                  "Need a little guidance?",
                )}
              </h3>
              <p>
                {t(
                  "ספרו לנו על החדר. נעזור לכם לבחור את המזגן המתאים.",
                  "أخبرنا عن الغرفة، وسنساعدك في اختيار المكيف المناسب.",
                  "Tell us about your room. We’ll help you find the right model.",
                )}
              </p>
              <Link className="text-link" href="/contact?service=consultation">
                {t("לייעוץ אישי", "استشارة شخصية", "Let’s find your fit")}
              </Link>
            </div>
          </aside>
          <div>
            <div className="catalog-toolbar">
              <span aria-live="polite">
                {filtered.length} {t("מזגנים", "مكيفات", "models")}
              </span>
              <label>
                {t("מיון לפי", "رتب حسب", "Sort by")}
                <select value={sort} onChange={(e) => setSort(e.target.value)}>
                  <option value="featured">
                    {t("סדר מומלץ", "الترتيب المقترح", "Featured")}
                  </option>
                  <option value="low">
                    {t(
                      "מחיר: מהנמוך לגבוה",
                      "السعر: من الأقل للأعلى",
                      "Price: low to high",
                    )}
                  </option>
                  <option value="high">
                    {t(
                      "מחיר: מהגבוה לנמוך",
                      "السعر: من الأعلى للأقل",
                      "Price: high to low",
                    )}
                  </option>
                </select>
              </label>
            </div>
            <div className="products-grid">
              {filtered.map((p) => (
                <ProductCard
                  key={p.id}
                  product={p}
                  t={t}
                  onCompare={toggle}
                  selected={selected.includes(p.id)}
                />
              ))}
            </div>
            {!filtered.length && (
              <div className="empty-state">
                <Search size={32} />
                <h3>
                  {t(
                    "לא נמצאו דגמים מתאימים",
                    "لا توجد موديلات مطابقة",
                    "No matching models",
                  )}
                </h3>
                <p>
                  {t(
                    "נסו שם דגם אחר או הרחיבו את הסינון.",
                    "جرّب اسمًا آخر أو خفف شروط البحث.",
                    "Try another model name or broaden your filters.",
                  )}
                </p>
                <button className="button secondary" onClick={reset}>
                  {t(
                    "הצגת כל הדגמים",
                    "اعرض جميع الموديلات",
                    "Show all models",
                  )}
                </button>
              </div>
            )}
            <p className="catalog-note">
              {t(
                "מחירים להמחשת הקטלוג בלבד. מחיר סופי, זמינות, הובלה והתקנה יאושרו בהצעת מחיר אישית. התאמה לחלל מחייבת ייעוץ.",
                "الأسعار لتوضيح الكتالوج فقط. يُؤكد السعر النهائي والتوفر والتوصيل والتركيب بعرض سعر شخصي. اختيار القدرة يتطلب استشارة.",
                "Prices are for catalog demonstration. Final pricing, availability, delivery and installation are confirmed in a personal quote. Space suitability requires consultation.",
              )}
            </p>
          </div>
        </div>
      </section>
      {selected.length > 0 && (
        <div className="compare-tray">
          <div className="wrap">
            <div>
              <Scale />
              <span>
                {selected.length}/3{" "}
                {t(
                  "נבחרו להשוואה",
                  "تم اختيارها للمقارنة",
                  "selected to compare",
                )}
              </span>
            </div>
            <div className="compare-models">
              {selected.map((id) => (
                <button
                  key={id}
                  onClick={() => toggle(id)}
                  aria-label={`${t("הסרת", "إزالة", "Remove")} ${products.find((p) => p.id === id)?.name}`}
                >
                  <bdi>{products.find((p) => p.id === id)?.name}</bdi>
                  <X size={14} />
                </button>
              ))}
            </div>
            <button
              className="button small"
              disabled={selected.length < 2}
              onClick={() => dialog.current?.showModal()}
            >
              {t("השוואת דגמים", "قارن الموديلات", "Compare models")}
            </button>
            <button
              className="icon-button"
              aria-label={t("ניקוי השוואה", "مسح المقارنة", "Clear comparison")}
              onClick={() => setSelected([])}
            >
              <X />
            </button>
          </div>
          <p role="status">
            {notice ||
              t(
                "בחרו 2–3 דגמים להשוואה",
                "اختر 2–3 موديلات للمقارنة",
                "Choose 2–3 models to compare",
              )}
          </p>
        </div>
      )}
      <dialog
        className="comparison-dialog"
        ref={dialog}
        aria-labelledby="comparison-title"
      >
        <div className="dialog-heading">
          <div>
            <span className="eyebrow">SIDE BY SIDE</span>
            <h2 id="comparison-title">
              {t(
                "ההבדלים שעושים את הבחירה",
                "تفاصيل تساعدك على الاختيار",
                "The details that make the difference",
              )}
            </h2>
          </div>
          <button
            className="icon-button"
            onClick={() => dialog.current?.close()}
            aria-label={t("סגירת השוואה", "إغلاق المقارنة", "Close comparison")}
          >
            <X />
          </button>
        </div>
        <div className="comparison-scroll">
          <table>
            <thead>
              <tr>
                <th>{t("מפרט", "المواصفات", "Specification")}</th>
                {selected.map((id) => {
                  const p = products.find((p) => p.id === id)!;
                  return (
                    <th key={id}>
                      <img src={p.image} alt="" />
                      <bdi>
                        {productBrand(p, content.brands, lang)} {productTitle(p, lang)}
                      </bdi>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {[
                [
                  t("מחיר להמחשה", "السعر التوضيحي", "Illustrative price"),
                  (p: ManagedProduct) => money(p.price),
                ],
                [
                  t("תפוקת קירור", "قدرة التبريد", "Cooling capacity"),
                  (p: ManagedProduct) => `${p.cooling.toLocaleString("en-US")} BTU/h`,
                ],
                [
                  t("דירוג אנרגטי", "تصنيف الطاقة", "Energy rating"),
                  (p: ManagedProduct) => p.energy,
                ],
                [t("טכנולוגיה", "التقنية", "Technology"), () => "Inverter"],
                [
                  t("חלל מוצע", "المساحة المقترحة", "Suggested space"),
                  (p: ManagedProduct) => roomLabel(p.room, t),
                ],
              ].map(([label, get]) => (
                <tr key={label as string}>
                  <th>{label as string}</th>
                  {selected.map((id) => (
                    <td key={id}>
                      <bdi>
                        {(get as (p: ManagedProduct) => string)(
                          products.find((p) => p.id === id)!,
                        )}
                      </bdi>
                    </td>
                  ))}
                </tr>
              ))}
              <tr>
                <th>{t("עוד על הדגם", "تفاصيل الموديل", "Explore")}</th>
                {selected.map((id) => (
                  <td key={id}>
                    <Link className="text-link" href={`/products/${id}`}>
                      {t("לפרטים", "التفاصيل", "View model")}
                    </Link>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </dialog>
    </>
  );
}
export function PageIntro({
  t,
  eyebrow,
  title,
  description,
  icon,
}: {
  t: Translate;
  eyebrow: string;
  title: string;
  description: string;
  icon?: React.ReactNode;
}) {
  return (
    <section className="page-intro">
      <div className="wrap">
        <nav
          className="breadcrumbs"
          aria-label={t("מיקום באתר", "مسار الصفحة", "Breadcrumb")}
        >
          <Link href="/">{t("בית", "الرئيسية", "Home")}</Link>
          <span>/</span>
          <span>{eyebrow}</span>
        </nav>
        <div className="page-intro-content">
          <div>
            <span className="eyebrow">{eyebrow}</span>
            <h1>{title}</h1>
            <p>{description}</p>
          </div>
          {icon && (
            <span className="intro-symbol" aria-hidden="true">
              {icon}
            </span>
          )}
        </div>
      </div>
    </section>
  );
}
export function ProductDetail({ t, slug }: { t: Translate; slug?: string }) {
  const { content, lang } = useSiteContent();
  const products = content.products;
  const settings = content.settings;
  const p = products.find((p) => p.id === slug && p.visible);
  const [tab, setTab] = useState("specs");
  const [scene, setScene] = useState(false);
  const [activeImageSelection, setActiveImageSelection] = useState<{ productId: string; image: string } | null>(null);
  if (!p) return <div className="wrap empty-state"><h1>{t("הדגם לא זמין", "الموديل غير متاح", "This model is unavailable")}</h1><Link className="button" href="/products">{t("לכל המזגנים", "جميع المكيفات", "Explore all models")}</Link></div>;
  const productImages = Array.from(new Set([p.image, ...p.gallery]));
  const activeImage = activeImageSelection?.productId === p.id ? activeImageSelection.image : p.image;
  const displayedImage = productImages.includes(activeImage) ? activeImage : p.image;
  const name = productTitle(p, lang);
  const brand = productBrand(p, content.brands, lang);
  return (
    <>
      <section className="wrap product-detail">
        <nav className="breadcrumbs">
          <Link href="/products">
            {t("המזגנים שלנו", "المكيفات", "Air conditioners")}
          </Link>
          <span>/</span>
          <bdi>{name}</bdi>
        </nav>
        <div className="detail-grid">
          <div className="detail-gallery">
            <div className={`detail-visual ${scene ? "room-scene" : ""}`}>
              <span className="tag">
                {scene
                  ? t("השראה לבית", "إلهام لبيتك", "ROOM INSPIRATION")
                  : t(
                      "מזגן עילי • אינוורטר",
                      "مكيف جداري • إنفرتر",
                      "WALL-MOUNTED • INVERTER",
                    )}
              </span>
              <img
                src={scene ? "/images/hero.webp" : displayedImage}
                alt={
                  scene
                    ? t(
                        "תמונת אווירה של חלל ממוזג",
                        "صورة أجواء لغرفة مكيفة",
                        "Air-conditioned room inspiration",
                      )
                    : `${brand} ${name}`
                }
                width="860"
                height="290"
              />
              <span className="visual-footnote">
                {scene
                  ? t(
                      "תמונת אווירה להמחשה, אינה מציגה את הדגם.",
                      "صورة أجواء للتوضيح، لا تعرض هذا الموديل.",
                      "Room inspiration. Does not show this specific model.",
                    )
                  : t(
                      "תמונת סדרת המוצר. להמחשה בלבד.",
                      "صورة سلسلة المنتج، للتوضيح فقط.",
                      "Product series image. For illustration.",
                    )}
              </span>
            </div>
            <div className="gallery-options">
              <button onClick={() => setScene(false)} aria-pressed={!scene}>
                <img src={p.image} alt="" />
                {t("המזגן", "المكيف", "The model")}
              </button>
              {productImages.slice(1).map((image, index) => <button key={image} onClick={() => { setActiveImageSelection({ productId: p.id, image }); setScene(false); }} aria-pressed={!scene && displayedImage === image}>
                <img src={image} alt="" />
                {t("\u05d2\u05dc\u05e8\u05d9\u05d4", "\u0635\u0648\u0631\u0629", "Gallery")} {index + 2}
              </button>)}
              <button onClick={() => setScene(true)} aria-pressed={scene}>
                <img src="/images/hero.webp" alt="" />
                {t("השראה לחלל", "إلهام للمساحة", "Room inspiration")}
              </button>
            </div>
          </div>
          <div className="detail-copy">
            <span className="eyebrow">
              {brand.toUpperCase()} / HOME COMFORT
            </span>
            <h1 dir="ltr">{name}</h1>
            <p>{localize(p.description, lang)}</p>
            <div className="detail-highlights">
              <div>
                <Snowflake />
                <strong dir="ltr">{p.cooling.toLocaleString("en-US")}</strong>
                <small>BTU/h</small>
              </div>
              <div>
                <Leaf />
                <strong dir="ltr">{p.energy}</strong>
                <small>
                  {t("דירוג אנרגטי", "تصنيف الطاقة", "Energy rating")}
                </small>
              </div>
              <div>
                <Wind />
                <strong>Inverter</strong>
                <small>{t("טכנולוגיה", "التقنية", "Technology")}</small>
              </div>
            </div>
            <div className="detail-price">
          <strong dir="ltr">{money(p.price)}</strong>
          {p.previousPrice !== undefined && <s dir="ltr">{money(p.previousPrice)}</s>}
              <span>
                {content.settings.pricesAreIndicative
                  ? t(
                      "מחיר להמחשה בלבד",
                      "سعر توضيحي فقط",
                      "Indicative price only",
                    )
                  : t("מחיר", "السعر", "Price")}
              </span>
            </div>
            <div className="availability">
              <span />
              {p.available === false
                ? t("לא זמין כרגע", "غير متوفر حاليًا", "Currently unavailable")
                : t(
                    "זמינות: בבירור מול החברה",
                    "التوفر: يُؤكد مع الشركة",
                    "Availability: confirm with us",
                  )}
            </div>
            <div className="detail-actions">
              <a
                className="button"
                href={`https://wa.me/${settings.whatsappE164.replace(/\D/g, "")}?text=${encodeURIComponent(
                  t(
                    `שלום, אשמח להצעת מחיר עבור ${brand} ${name}`,
                    `مرحبًا، أريد عرض سعر للمكيف ${brand} ${name}`,
                    `Hello, I’d like a quote for ${brand} ${name}`,
                  ),
                )}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <MessageCircle size={18} />
                {t("בקשת הצעת מחיר", "اطلب عرض سعر", "Request a quote")}
              </a>
              <Link
                className="button secondary"
                href={`/contact?product=${p.id}`}
              >
                {t(
                  "התייעצות על הדגם",
                  "استشارة حول الموديل",
                  "Ask about this model",
                )}
              </Link>
            </div>
            <p className="small-note">
              {t(
                "התקנה והובלה יתומחרו בנפרד לפי הצורך. מחיר סופי ותנאי אחריות יפורטו בהצעה.",
                "يُحدد التوصيل والتركيب حسب الحاجة. السعر النهائي وشروط الضمان ضمن عرض السعر.",
                "Installation and delivery are quoted as needed. Final pricing and warranty terms are included in your quote.",
              )}
            </p>
          </div>
        </div>
      </section>
      <section className="wrap detail-information">
        <div
          className="detail-tabs"
          role="tablist"
          aria-label={t("מידע על הדגם", "معلومات الموديل", "Model information")}
        >
          {[
            [
              "specs",
              t("מפרט טכני", "المواصفات الفنية", "Technical specifications"),
            ],
            ["features", t("יתרונות הדגם", "مزايا الموديل", "Model features")],
            [
              "installation",
              t("התקנה ואחריות", "التركيب والضمان", "Installation & warranty"),
            ],
          ].map(([id, label]) => (
            <button
              key={id}
              id={`tab-${id}`}
              role="tab"
              aria-selected={tab === id}
              aria-controls={`panel-${id}`}
              onClick={() => setTab(id)}
              onKeyDown={(e) => {
                if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
                  const list = ["specs", "features", "installation"];
                  const next =
                    list[
                      (list.indexOf(tab) + (e.key === "ArrowRight" ? 1 : 2)) % 3
                    ];
                  setTab(next);
                  document.getElementById(`tab-${next}`)?.focus();
                }
              }}
              tabIndex={tab === id ? 0 : -1}
            >
              {label}
            </button>
          ))}
        </div>
        <div
          className="tab-panel"
          role="tabpanel"
          id={`panel-${tab}`}
          aria-labelledby={`tab-${tab}`}
        >
          {tab === "specs" ? (
            <>
              <dl className="spec-table">
                {[
                  [t("מותג", "العلامة التجارية", "Brand"), brand],
                  [t("דגם", "الموديل", "Model"), name],
                  [
                    t("תפוקת קירור", "قدرة التبريد", "Cooling capacity"),
                    `${p.cooling.toLocaleString("en-US")} BTU/h`,
                  ],
                  [
                    t(
                      "דירוג אנרגטי בקירור",
                      "تصنيف الطاقة للتبريد",
                      "Cooling energy rating",
                    ),
                    p.energy,
                  ],
                  [t("טכנולוגיה", "التقنية", "Technology"), "Inverter"],
                  ...p.specs.map(([he, ar, en, v]) => [t(he, ar, en), v]),
                ].map(([key, value]) => (
                  <div key={key}>
                    <dt>{key}</dt>
                    <dd>
                      <bdi>{value}</bdi>
                    </dd>
                  </div>
                ))}
              </dl>
              <a
                className="text-link manufacturer-link"
                href={p.source}
                target="_blank"
                rel="noopener noreferrer"
              >
                {t(
                  "למפרט המלא באתר היצרן",
                  "المواصفات الكاملة لدى المصنع",
                  "Full specifications from the manufacturer",
                )}
              </a>
            </>
          ) : tab === "features" ? (
            <div className="feature-grid">
              {p.features.map(([he, ar, en], i) => (
                <div key={he}>
                  {
                    [
                      <Wind key="w" />,
                      <Wifi key="f" />,
                      <Leaf key="l" />,
                      <Snowflake key="s" />,
                    ][i]
                  }
                  <h3>{t(he, ar, en)}</h3>
                </div>
              ))}
            </div>
          ) : (
            <div className="installation-info">
              <h3>
                {t(
                  "מתכננים נכון, מתקינים בקפידה.",
                  "نخطط بدقة ونركب بعناية.",
                  "Thoughtfully planned. Carefully installed.",
                )}
              </h3>
              <p>{localize(p.warranty, lang)}</p>
              <Link className="text-link" href="/services">
                {t(
                  "לשירותי ההתקנה שלנו",
                  "خدمات التركيب",
                  "Our installation service",
                )}
              </Link>
            </div>
          )}
        </div>
      </section>
      <section className="section wrap">
        <div className="section-heading">
          <div>
            <span className="eyebrow">
              {t("עוד אפשרויות", "خيارات أخرى", "MORE TO EXPLORE")}
            </span>
            <h2>
              {t(
                "שווה להכיר גם",
                "تعرّف أيضًا على",
                "A few more possibilities",
              )}
            </h2>
          </div>
        </div>
        <div className="preview-products">
          {products
            .filter((x) => x.id !== p.id)
            .slice(0, 3)
            .map((x) => (
              <ProductCard key={x.id} product={x} t={t} />
            ))}
        </div>
      </section>
    </>
  );
}
export function HomeProducts({ t }: Props) {
  const { content } = useSiteContent();
  const products = content.products.filter((product) => product.visible && product.featured).sort((a, b) => a.order - b.order);
  return (
    <section className="section wrap reveal">
      <div className="section-heading">
        <div>
          <span className="eyebrow">
            {t("המזגנים שלנו", "مكيفاتنا", "OUR COLLECTION")}
          </span>
          <h2>
            {t(
              "נוחות מתחילה בבחירה נכונה",
              "الراحة تبدأ بالاختيار الصحيح",
              "Great comfort. The right choice.",
            )}
          </h2>
        </div>
        <Link className="text-link" href="/products">
          {t("לכל המזגנים", "جميع المكيفات", "Explore all models")}
        </Link>
      </div>
      <div className="preview-products">
        {products.slice(0, 3).map((p) => (
          <ProductCard key={p.id} product={p} t={t} />
        ))}
      </div>
      <span className="mobile-swipe-hint">
        {t(
          "החליקו כדי לגלות עוד דגמים",
          "اسحب لاكتشاف موديلات أخرى",
          "Swipe to explore more models",
        )}
      </span>
    </section>
  );
}
export function HomeOffers() {
  const { content, lang } = useSiteContent();
  const [now, setNow] = useState(0);
  useEffect(() => {
    const timer = window.setTimeout(() => setNow(Date.now()), 0);
    return () => window.clearTimeout(timer);
  }, []);
  const offers = content.offers
    .filter((offer) => {
      const starts = offer.startsAt ? Date.parse(offer.startsAt) : Number.NEGATIVE_INFINITY;
      const ends = offer.endsAt ? Date.parse(offer.endsAt) + 86_399_999 : Number.POSITIVE_INFINITY;
      return offer.visible && starts <= now && now <= ends;
    })
    .sort((a, b) => a.order - b.order);
  if (!offers.length) return null;
  return (
    <section className="section wrap offers-section">
      {offers.map((offer) => {
        const product = content.products.find((item) => item.id === offer.productId);
        const href = product ? `/products/${product.id}` : offer.href;
        const currentPrice = offer.price ?? product?.price;
        const oldPrice = offer.oldPrice ?? product?.previousPrice;
        return (
          <article className="offer-card reveal" key={offer.id}>
            <Link className="offer-image" href={href}>
              <img src={offer.image} alt={localize(offer.title, lang)} loading="lazy" />
            </Link>
            <div className="offer-copy">
              <span className="eyebrow">{localize(offer.title, lang)}</span>
              <p>{localize(offer.description, lang)}</p>
              {currentPrice !== undefined && <div className="offer-price"><strong dir="ltr">{money(currentPrice)}</strong>{oldPrice !== undefined && <s dir="ltr">{money(oldPrice)}</s>}</div>}
              <Link className="button" href={href}>{localize(offer.buttonLabel, lang)}<Plus size={16} /></Link>
            </div>
          </article>
        );
      })}
    </section>
  );
}
export function HomeServiceStory({ t }: Props) {
  const { content, lang } = useSiteContent();
  const serviceIcons = { installation: Wrench, maintenance: Wind, repair: ShieldCheck, consultation: MessageCircle };
  const services = content.services.filter((service) => service.visible).sort((a, b) => a.order - b.order).slice(0, 3);
  return (
    <>
      <section className="service-story reveal">
        <div className="wrap service-story-grid">
          <div>
            <span className="eyebrow">
              {t(
                "יותר ממזגן",
                "أكثر من مجرد مكيف",
                "BEYOND THE AIR CONDITIONER",
              )}
            </span>
            <h2>
              {t("האוויר משתנה.", "الهواء يتغير.", "Seasons change.")}
              <br />
              <span>
                {t("השירות נשאר.", "خدمتنا ترافقك.", "Our care stays.")}
              </span>
            </h2>
            <p>
              {t(
                "מההתקנה הראשונה ועד לתחזוקה השוטפת, אנחנו כאן כדי שהמזגן שלכם יעבוד כמו שצריך. פתרונות מקצועיים לבית ולעסק, בכל הארץ.",
                "من أول تركيب إلى الصيانة الدورية، نعتني بمكيفك ليعمل كما يجب. حلول احترافية للبيوت والأعمال في جميع المدن.",
                "From the first installation to regular maintenance, we’re here to keep your air conditioner working well. Professional solutions for homes and businesses throughout Israel.",
              )}
            </p>
            <Link className="button" href="/services">
              {t("לכל שירותי המיזוג", "اكتشف خدماتنا", "Explore our services")}
              <Wrench size={17} />
            </Link>
          </div>
          <div className="service-story-list">
            {services.map((service, i) => {
              const I = serviceIcons[service.icon];
              return (
                <Link
                  href={`/services#${service.id}`}
                  className="service-row"
                  key={service.id}
                >
                  <span className="row-number">0{i + 1}</span>
                  <I />
                  <div>
                    <h3>{localize(service.title, lang)}</h3>
                    <p>{localize(service.description, lang)}</p>
                  </div>
                  <Plus size={17} />
                </Link>
              );
            })}
          </div>
        </div>
      </section>
    </>
  );
}
export function HomeRoomCards({ t }: Props) {
  const { content, lang } = useSiteContent();
  const categories = content.categories.filter((category) => category.visible).sort((a, b) => a.order - b.order).slice(0, 3);
  return (
      <section className="section wrap reveal">
        <div className="section-heading">
          <div>
            <span className="eyebrow">
              {t(
                "בחירה לפי החלל",
                "اختيار حسب مساحتك",
                "YOUR SPACE. YOUR COMFORT.",
              )}
            </span>
            <h2>
              {t(
                "לכל חדר, האוויר שלו.",
                "لكل غرفة، راحتها.",
                "Every room has its own rhythm.",
              )}
            </h2>
          </div>
        </div>
        <div className="space-grid">
          {categories.map((category, i) => (
            <Link
              key={category.id}
              href={`/products?category=${category.id}`}
              className={`space-card space-${i}`}
            >
              <span className="space-number">0{i + 1}</span>
              <div>
                <h3>{localize(category.name, lang)}</h3>
                <p>{localize(category.description, lang)}</p>
                <span className="text-link">
                  {t(
                    "לגלות את הדגמים",
                    "اكتشف الموديلات",
                    "Discover the models",
                  )}
                </span>
              </div>
              {i === 0 ? <Wind /> : i === 1 ? <Snowflake /> : <Thermometer />}
            </Link>
          ))}
        </div>
      </section>
  );
}
export function ContactBanner({ t }: Props) {
  const { content } = useSiteContent();
  const { settings } = content;
  return (
    <section className="wrap contact-banner reveal">
      <div>
        <span className="eyebrow">
          {t("בואו נדבר על נוחות", "لنتحدث عن راحتك", "LET’S TALK COMFORT")}
        </span>
        <h2>
          {t(
            "אוויר טוב מתחיל בשיחה.",
            "هواء أفضل يبدأ بمحادثة.",
            "Better air starts with a conversation.",
          )}
        </h2>
        <p>
          {t(
            "מזגן חדש או טיפול בקיים? אנחנו כאן בשבילכם.",
            "مكيف جديد أو صيانة لمكيفك؟ نحن هنا لمساعدتك.",
            "A new air conditioner or care for your current one? We’re here to help.",
          )}
        </p>
      </div>
      <div>
        <a href={`tel:${settings.phoneE164}`} className="button">
          <Phone size={17} />
          <bdi>{settings.phoneDisplay}</bdi>
        </a>
        <a
          className="text-link"
          href={`https://wa.me/${settings.whatsappE164.replace(/\D/g, "")}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          {t(
            "אפשר גם בוואטסאפ",
            "تواصل أيضًا عبر واتساب",
            "Or chat on WhatsApp",
          )}
        </a>
      </div>
    </section>
  );
}
export function FAQ({ t, compact = false }: Props & { compact?: boolean }) {
  const { content, lang } = useSiteContent();
  const items = content.faqs.filter((item) => item.visible).sort((a, b) => a.order - b.order).slice(0, compact ? 3 : 100);
  return (
    <section className="section wrap faq-section reveal">
      <div>
        <span className="eyebrow">
          {t("טוב לדעת", "معلومات تفيدك", "GOOD TO KNOW")}
        </span>
        <h2>
          {t(
            "שואלים. מבינים. בוחרים.",
            "اسأل، افهم، واختر.",
            "Good questions. Clear answers.",
          )}
        </h2>
        {compact && (
          <Link href="/faq" className="text-link">
            {t("לכל השאלות", "جميع الأسئلة", "All questions")}
          </Link>
        )}
      </div>
      <div className="faq-list">
        {items.map((item) => (
          <details key={item.id}>
            <summary>
              {localize(item.question, lang)}
              <Plus size={18} />
            </summary>
            <p>{localize(item.answer, lang)}</p>
          </details>
        ))}
      </div>
    </section>
  );
}
