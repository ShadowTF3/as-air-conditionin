# تجهيز استضافة الموقع

يستخدم المشروع خادم Node.js لتشغيل الموقع وواجهات API ولوحة `/admin`. خطة النشر الحالية هي Render مع Supabase، بعد نقل البيانات واختبارها على Supabase. لم تُنشأ خدمة Render أو تُربط بعد.

## متطلبات المشروع

- Node.js `22.13.0` أو أحدث.
- أمر البناء: `npm ci` ثم `npm run build`.
- أمر التشغيل لحزمة Node: `npm start`.
- التطبيق يعتمد متغير `PORT` الذي توفره الاستضافة.
- بيانات الإدارة الإنتاجية تحفظ في Supabase PostgreSQL، والصور المرفوعة في Supabase Storage.

## متغيرات بيئة الخادم

اضبط القيم مباشرة في إعدادات التطبيق لدى مزوّد الاستضافة:

- `SITE_STORAGE_MODE=supabase`
- `SUPABASE_URL`
- `SUPABASE_SECRET_KEY`، أو `SUPABASE_SERVICE_ROLE_KEY` عند استخدام المفتاح القديم
- `SUPABASE_STORAGE_BUCKET=site-media`
- `ADMIN_USERNAME`
- `ADMIN_PASSWORD`
- `ADMIN_SESSION_SECRET` بطول عشوائي لا يقل عن 32 حرفًا

لا تضف مفاتيح Supabase إلى متغيرات `NEXT_PUBLIC_*` أو ملفات الواجهة. لا تعتمد بيئة الإنتاج على `SITE_DATA_DIR`؛ القرص المحلي للتطوير والنقل فقط.

## حالة النشر

أضيف `Dockerfile` و`render.yaml` وفحص جاهزية الخدمة. خطوات الربط والإعدادات موجودة في [دليل Render وDocker](RENDER-DEPLOY.ar.md). لم تُنشأ خدمة Render بعد. يجب نجاح اختبارات Supabase الفعلية قبل اعتماد النشر، ثم اختبار رابط Render وإعادة التشغيل وRedeploy قبل إضافة نطاق `.co.il`.
