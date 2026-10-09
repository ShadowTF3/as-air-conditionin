import Link from "./site-link";
export default function NotFound() {
  return (
    <main className="wrap empty-state">
      <span className="eyebrow">404</span>
      <h1>העמוד לא נמצא</h1>
      <p>الصفحة غير موجودة · Page not found</p>
      <Link className="button" href="/">
        חזרה לבית / الرئيسية / Home
      </Link>
    </main>
  );
}
