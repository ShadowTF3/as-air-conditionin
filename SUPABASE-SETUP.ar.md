# إعداد Supabase ونقل بيانات الموقع

يظل الموقع في وضع الملفات محليًا إلى أن يُفعّل Supabase صراحةً. عند ضبط `SITE_STORAGE_MODE=supabase` تصبح قاعدة Supabase وStorage مصدر البيانات الوحيد، ويتوقف التطبيق عن الكتابة إلى `SITE_DATA_DIR`.

## إعداد المشروع

1. أنشئ مشروع Supabase وافتح SQL Editor.
2. نفّذ محتوى الملف `supabase/migrations/202610080001_site_content_and_media.sql`. ينشئ جدول JSONB واحدًا لمحتوى الموقع وbucket عامًا لصور الموقع. قراءة الصور عامة، أما عمليات الرفع والحذف والبيانات فتتم من الخادم فقط.
3. في `.env.local` (وهو ملف مستثنى من Git) أضف القيم التالية من إعدادات المشروع، ولا ترسل المفتاح السري في المحادثة:

   ```dotenv
   SITE_STORAGE_MODE=supabase
   SUPABASE_URL=https://PROJECT_REF.supabase.co
   SUPABASE_SECRET_KEY=YOUR_SERVER_SIDE_SECRET_KEY
   SUPABASE_STORAGE_BUCKET=site-media
   ```

   يمكن استخدام `SUPABASE_SERVICE_ROLE_KEY` بدل المفتاح السري الجديد إذا كان مشروعك لا يزال يعرض مفتاح `service_role`. لا تستخدم أيًّا منهما في المتصفح أو باسم `NEXT_PUBLIC_*`.

4. من مجلد المشروع شغّل `npm run supabase:migrate-local`. تنقل الأداة `site-data/site-content.json` وكل صورة مرفوعة موجودة في `site-data/media`، ثم تقرأ بيانات التحقق مجددًا من Supabase. الأداة قابلة لإعادة التشغيل.
5. أعد تشغيل التطبيق. جرّب من `/admin` تعديل منتج وسعر، ورفع صورة واستخدامها في المعرض، وإضافة عرض وتعديل خدمة ونص مترجم ومحتوى صفحة ورقم الهاتف. تأكد أن التغييرات تظهر على الموقع.
6. أوقف التطبيق ثم شغّله من جديد، وتأكد أن التعديلات والصور ما زالت ظاهرة. لا تحذف `site-data` قبل نجاح التحقق وبعد الاحتفاظ بنسخة احتياطية.

## إعدادات الاستضافة

أضف `SITE_STORAGE_MODE=supabase` و`SUPABASE_URL` و`SUPABASE_SECRET_KEY` و`SUPABASE_STORAGE_BUCKET` إلى Environment Variables على الخادم. أضف كذلك `ADMIN_USERNAME` و`ADMIN_PASSWORD` و`ADMIN_SESSION_SECRET`. لا تضع أسرارًا في ملفات الواجهة أو مستودع Git. ملفات الموقع الثابتة داخل `public/images` تبقى جزءًا من إصدار الموقع؛ الصور التي ترفعها لوحة الإدارة تحفظ في Storage.

في حال غياب مفاتيح Supabase عن تشغيل إنتاجي، يفشل التطبيق بوضوح بدل أن يكتب التعديلات إلى قرص مؤقت.
