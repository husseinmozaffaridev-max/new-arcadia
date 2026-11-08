<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# منبع منطق برنامه (Arcadia MBSE Methodology Source of Logic)

این بخش مرجع رسمی و بنیادین معماری و رفتاری کل پروژه New Arcadia است. تمامی تغییرات، توسعه‌ها، بازطراحی‌ها، اعتبارسنجی‌ها و پاسخ به کاربر باید دقیقاً منطبق بر این اصول (مستند کامل در `docs/arcadia-logic.md`) انجام شوند:

## ۱. لایه‌های چهارگانه و پرسش‌های بنیادین:
1. **OA (Operational Analysis):** نیازها و فعالیت‌های کاربران در دنیای واقعی چیست؟
   - عناصر: `OperationalEntity` (قابل شکستن), `OperationalActor` (تجزیه‌ناپذیر), `OperationalActivity`, `OperationalCapability`, `Mission`, `OperationalProcess`.
   - دیاگرام‌ها: `OEBD/OEB` (شکست درختی موجودیت‌ها), `OCB/OCD` (قابلیت‌ها و مشارکت), `OABD` (شکست فعالیت‌ها), `OAIB` (تعامل فعالیت‌ها), `OAS/OPD` (سناریو/فرآیند), `OAB` (معماری جامع عملیاتی).
   - اتصالات OAB: تعامل بین موجودیت‌ها و اکتورها منحصراً `OperationalExchange` (Interaction) و اتصال فعالیت به موجودیت/اکتور منحصراً `Allocation`.
2. **SA (System Analysis):** سیستم برای کاربر چه کاری انجام می‌دهد؟ (مرز جعبه‌سیاه سیستم)
   - عناصر: `System`, `SystemActor` (تجزیه‌ناپذیر), `SystemMission`, `SystemCapability`, `SystemFunction`, `FunctionPort`.
   - قانون ردیابی (Warning): هر قابلیت یا بازیگر سیستمی که پیوند تحقق (Realization) به لایه قبلی (OA) نداشته باشد، باید با Warning مشخص شود.
   - دیاگرام‌ها: `CSA` (مرز سیستم و اکتورها), `MCB/SCD` (مأموریت‌ها و قابلیت‌ها), `SFBD/SFB` (شکست توابع), `SDFB` (جریان داده توابع), `SAB` (معماری جامع سیستم), `FS/SS` (سناریوی زمانی), `FCD` (زنجیره عملکردی).
3. **LA (Logical Architecture):** سیستم چگونه کار می‌کند؟ (بدون وابستگی به فناوری)
   - عناصر: `LogicalComponent`, `LogicalActor` (تجزیه‌ناپذیر), `LogicalFunction`, `LogicalCapability`.
   - دیاگرام‌ها: `CRB/LCRB` (تحقق قابلیت‌ها), `LFBD/LFB` (شکست توابع منطقی), `LDFB` (جریان داده منطقی), `LCB` (شکست درختی مؤلفه‌ها), `LAB` (معماری جامع منطقی با ComponentExchange و اینترفیس‌ها), `FC/LS` (سناریوها).
4. **PA (Physical Architecture):** سیستم چگونه و با چه سخت‌افزار، نرم‌افزار و فناوری‌هایی ساخته می‌شود؟
   - عناصر: `PhysicalNode` (گره سخت‌افزاری میزبان), `PhysicalComponent` (مؤلفه رفتاری/نرم‌افزاری), `PhysicalActor` (تجزیه‌ناپذیر), `PhysicalFunction`.
   - روابط کلیدی: `DeploymentLink` (استقرار مؤلفه رفتاری روی نود), `PhysicalLink` (کابل/باس بین نودها), `ComponentExchange`, `PhysicalExchange`.
   - دیاگرام‌ها: `CRB/PCRB`, `PFBD/PFB`, `PDFB`, `PCB` (شکست فیزیکی), `PAB` (معماری جامع فیزیکی), `FC/PS`.

## ۲. قوانین کلیدی غیرقابل تخطی (قوانین طلایی):
* **حذف کامل مفهوم Composition:** هیچ رابطه‌ای به نام Composition در پالت یا بین عناصر وجود ندارد. شکست ساختاری فقط از طریق ساختار درختی (Tree) و Nesting در دیاگرام‌های مجاز انجام می‌شود.
* **عدم شکست و عدم اتصال اکتور به اکتور:** هیچ اکتوری در هیچ لایه‌ای هرگز والد نمی‌پذیرد، شکسته نمی‌شود، فرزندی ندارد و هرگز به یک اکتور دیگر متصل نمی‌شود (اتصال Actor ↔ Actor در تمامی لایه‌ها و دیاگرام‌ها غیرمجاز است).
* **تخصیص توابع و فعالیت‌ها:** اتصال توابع/فعالیت‌ها به ساختارهای کالبدی (موجودیت، سیستم، مؤلفه، نود) همواره از طریق رابطه `Allocation` انجام می‌شود.
* **تفکیک دیاگرام‌های معماری (Blank) از شکست (Breakdown):** در دیاگرام‌های معماری (OAB, SAB, LAB, PAB) شکست ساختاری یا ژنرالیزیشن رسم نمی‌شود؛ این موارد مختص دیاگرام‌های Breakdown هستند.
