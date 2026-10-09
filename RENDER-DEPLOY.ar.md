# تشغيل الموقع على Render بواسطة Docker

المستودع: https://github.com/ShadowTF3/as-air-conditionin، الفرع `main`. ملفات التطبيق موجودة في جذر المستودع؛ اترك Root Directory فارغًا.

## ما تم تجهيزه

- `Dockerfile`: بناء Linux باستخدام Node.js 24، ثم تشغيل حزمة الموقع المستقلة بمستخدم غير root.
- `.dockerignore`: يمنع إرسال ملفات البيئة والأسرار والبيانات المحلية ونسخ الاختبار إلى بناء Docker.
- `render.yaml`: إعداد Web Service ببيئة Docker في Frankfurt، وخطة `free` للمعاينة الأولية. راجع الخطة المناسبة قبل التشغيل التجاري.
- `/api/health`: يتحقق من إعدادات الإدارة ومحتوى الموقع وإمكانية الوصول إلى الصور في Supabase. يرجع `200` عند الجاهزية، أو `503` إذا كان الإعداد غير مكتمل.
- لا تدخل أي مفاتيح سرية في Dockerfile أو Build Arguments. تمرر المفاتيح وقت تشغيل الحاوية فقط.

## قبل النشر

أكمل [إعداد Supabase](SUPABASE-SETUP.ar.md): إنشاء الجدول والـ bucket، ونقل البيانات، واختبار عمليات الإدارة والصور وإعادة تشغيل التطبيق. تجهيز Docker وRender لا يعني أن اختبارات Supabase الحقيقية تمت. لا تربط الدومين قبل نجاح نسخة Render.

## الربط عبر Blueprint

1. افتح Render واختر **New → Blueprint**.
2. اربط مستودع `ShadowTF3/as-air-conditionin` واختر `main`.
3. استخدم ملف `render.yaml` الموجود في الجذر.
4. أدخل قيم `SUPABASE_URL` و`SUPABASE_SECRET_KEY` و`ADMIN_USERNAME` و`ADMIN_PASSWORD` عند طلبها. يولد Render قيمة `ADMIN_SESSION_SECRET` تلقائيًا عند إنشاء الخدمة بواسطة Blueprint.
5. راجع إعدادات الخدمة قبل إنشائها. النشر التلقائي معطل مؤقتًا؛ استخدم Manual Deploy بعد اجتياز اختبارات كل إصدار.

## الربط يدويًا عبر Web Service

إذا أنشأت Web Service بالفعل، استخدم:

| الإعداد | القيمة |
| --- | --- |
| Repository | `ShadowTF3/as-air-conditionin` |
| Branch | `main` |
| Runtime / Language | `Docker` |
| Root Directory | فارغ |
| Dockerfile Path | `./Dockerfile` |
| Docker Build Context | `.` |
| Docker Command | فارغ، لاستخدام CMD المرفق |
| Health Check Path | `/api/health` |
| Region | `Frankfurt` |

في Environment أضف:

| المتغير | القيمة |
| --- | --- |
| `NODE_ENV` | `production` |
| `HOST` | `0.0.0.0` |
| `PORT` | `10000` أو المنفذ الذي توفره Render |
| `SITE_STORAGE_MODE` | `supabase` |
| `SUPABASE_STORAGE_BUCKET` | `site-media` |
| `SUPABASE_URL` | رابط مشروع Supabase |
| `SUPABASE_SECRET_KEY` | مفتاح الخادم السري، أو استخدم `SUPABASE_SERVICE_ROLE_KEY` القديم بدلًا منه |
| `ADMIN_USERNAME` | اسم المدير |
| `ADMIN_PASSWORD` | كلمة مرور المدير |
| `ADMIN_SESSION_SECRET` | قيمة عشوائية بطول 32 حرفًا على الأقل |

لا تضف `SITE_DATA_DIR` في Render. جميع البيانات والصور المرفوعة تأتي من Supabase. الحاوية ترفض بدء التشغيل إذا كانت المفاتيح أو إعدادات الإدارة ناقصة، أو كان وضع التخزين محليًا. لا تنفذ استيراد البيانات المحلية تلقائيًا عند كل Redeploy؛ قد يؤدي ذلك إلى استبدال تعديلات الإدارة الأحدث.

## اختبار Docker على جهازك

```sh
docker build -t as-air-conditioning:render .
docker run --rm -p 10000:10000 --env-file .env.production as-air-conditioning:render
```

أنشئ `.env.production` محليًا بالقيم الحقيقية المذكورة أعلاه. الملف مستبعد من Git ومن بناء Docker. افتح `http://localhost:10000` و`http://localhost:10000/admin`.

بعد بناء الصورة، شغّل `npm run test:docker` لفحص الحاوية دون مفاتيح حقيقية. الاختبار يشغل نسخة محلية معزولة ويتحقق من الصفحات وعمليات الإدارة والصور وإعادة تشغيل الحاوية، ثم يفحص فشل الإنتاج عند نقص الإعدادات أو تعذر Supabase. هذه الفحوص لا تثبت الاتصال بمشروع Supabase الحقيقي.

## التحقق بعد نشر Render

اختبر الصفحة الرئيسية والكتالوج وتفاصيل المنتج والخدمات واللغات الثلاث، ثم `/admin` وعمليات الكتابة والرفع والحذف. يجب أن يرجع `/api/health` حالة `200`. بعد ذلك أعد تشغيل الخدمة ونفذ Redeploy وتحقق من بقاء البيانات والصور. احتفظ برابط `onrender.com` للاختبار حتى تسجيل الدومين وربطه.

لم تُنشأ أو تُنشر خدمة Render من هذه الملفات وحدها. إضافة الدومين وHTTPS تأتي بعد نجاح اختبار الخدمة الفعلية. Zap وVisa وBit تبقى مؤجلة.

المراجع الرسمية: [Docker على Render](https://render.com/docs/docker)، [إعدادات Blueprint](https://render.com/docs/blueprint-spec)، [فحص جاهزية الخدمة](https://render.com/docs/health-checks).
