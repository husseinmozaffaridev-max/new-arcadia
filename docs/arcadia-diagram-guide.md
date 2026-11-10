# راهنمای دیاگرام‌ها در New Arcadia

> این راهنما قوانین، عناصر مجاز، و روابط مجاز هر نوع دیاگرام را در اپلیکیشن New Arcadia بر اساس متدولوژی **ARCADIA** (پیاده‌سازی شده در ابزار Capella) شرح می‌دهد.

---

## ساختار کلی

پروژه در ۴ لایه سازماندهی می‌شود:

| لایه | نام کامل | کد |
|------|----------|-----|
| OA | Operational Analysis | تحلیل عملیاتی |
| SA | System Analysis | تحلیل سیستم |
| LA | Logical Architecture | معماری منطقی |
| PA | Physical Architecture | معماری فیزیکی |

---

## لایه ۱: Operational Analysis (OA) — تحلیل عملیاتی

### عناصر موجود در لایه OA

| نوع | نام | توضیح |
|-----|-----|--------|
| `OperationalEntity` | موجودیت عملیاتی | سازمان یا واحد قابل شکست به زیرواحدها |
| `OperationalActor` | بازیگر عملیاتی | شخص یا سیستم خارجی (غیرقابل شکست) |
| `OperationalActivity` | فعالیت عملیاتی | عمل یا وظیفه‌ای که انجام می‌شود |
| `OperationalCapability` | قابلیت عملیاتی | توانایی کلی برای انجام مأموریت |
| `Mission` | مأموریت | هدف سطح بالای عملیاتی |

### ۱.۱ OEBD — Operational Entity Breakdown

**هدف:** نمایش سلسله‌مراتب و شکست موجودیت‌ها و بازیگران عملیاتی

**عناصر مجاز:** `OperationalEntity`، `OperationalActor`

**روابط/اتصالات مجاز:**
- موجودیت می‌تواند شامل زیرموجودیت‌ها باشد (رابطه والد–فرزند درختی)
- بازیگر می‌تواند **داخل** یک موجودیت قرار گیرد (نشان‌دهنده عضویت سازمانی)

> [!IMPORTANT]
> **قانون طلایی:** بازیگر (`OperationalActor`) هرگز **نمی‌تواند** والد داشته باشد یا به بازیگر دیگری متصل شود. بازیگر می‌تواند فقط **داخل** یک موجودیت نمایش داده شود.

**مثال مجاز:**
```
Airline (OperationalEntity)
  └── Crew (OperationalEntity)
        └── Cabin Crew (OperationalActor)  ← داخل موجودیت
```

---

### ۱.۲ OCB — Operational Capabilities Blank

**هدف:** نمایش قابلیت‌های عملیاتی و موجودیت‌های/بازیگران درگیر

**عناصر مجاز:** `OperationalCapability`، `Mission`، `OperationalEntity`، `OperationalActor`

**روابط مجاز:** `InvolvementLink` (پیوند مشارکت)

**قوانین:**
- هر موجودیت یا بازیگر با `InvolvementLink` به قابلیت متصل می‌شود
- دیاگرام **تخت** است (بدون nesting)

---

### ۱.۳ OABD — Operational Activity Breakdown

**هدف:** نمایش ساختار درختی شکست فعالیت‌های عملیاتی

**عناصر مجاز:** `OperationalActivity`

**روابط:** درختی (فعالیت فرزند زیر فعالیت والد)

**قوانین:**
- فقط فعالیت‌ها مجاز هستند
- از کشیدن فعالیت فرزند به سمت فعالیت والد، رابطه والد–فرزند ایجاد می‌شود
- برای تبادل بین فعالیت‌ها → از دیاگرام **OAIB** استفاده کنید

---

### ۱.۴ OAIB — Operational Activity Interaction Blank

**هدف:** نمایش تبادل اطلاعات/داده بین فعالیت‌های عملیاتی

**عناصر مجاز:** `OperationalActivity`

**روابط مجاز:** `FunctionalExchange` (تبادل تابعی)

---

### ۱.۵ OAB — Operational Architecture Blank

**هدف:** نمای جامع معماری عملیاتی — موجودیت‌ها، فعالیت‌ها و ارتباطات

**عناصر مجاز:** `OperationalEntity`، `OperationalActor`، `OperationalActivity`

**روابط مجاز:**

| رابطه | از | به | توضیح |
|-------|----|----|--------|
| `CommunicationMean` | Entity/Actor | Entity/Actor | ارتباط سازمانی |
| `FunctionalExchange` | Activity | Activity | تبادل داده بین فعالیت‌ها |
| `Allocation` | Activity | Entity/Actor | تخصیص فعالیت به موجودیت |

> [!WARNING]
> در OAB هیچ‌گونه nesting (قرار دادن یک عنصر داخل دیگری) مجاز نیست. این دیاگرام تخت است.

---

### ۱.۶ OPD — Operational Process Description

**هدف:** توصیف توالی و فرآیند فعالیت‌های عملیاتی (شبیه sequence diagram)

**عناصر مجاز:** `OperationalActivity`

**روابط مجاز:** `FunctionalExchange`

---

### ۱.۷ OAS — Entity Scenario

**هدف:** سناریوی زمانی (sequence) برای موجودیت‌ها و بازیگران عملیاتی

**عناصر مجاز:** `OperationalEntity`، `OperationalActor`، `OperationalActivity`

**روابط مجاز:** `FunctionalExchange`

---

## لایه ۲: System Analysis (SA) — تحلیل سیستم

### عناصر موجود در لایه SA

| نوع | نام | توضیح |
|-----|-----|--------|
| `System` | سیستم | سیستم تحت مطالعه (جعبه سیاه) |
| `SystemActor` | بازیگر سیستم | عناصر خارجی که با سیستم تعامل دارند |
| `SystemFunction` | تابع سیستم | عملکرد قابل ارائه توسط سیستم |
| `SystemCapability` | قابلیت سیستم | توانایی کلی سیستم |
| `SystemMission` | مأموریت سیستم | هدف سطح بالای سیستم |

### ۲.۱ CSA — Contextual System Actors

**هدف:** نمایش مرز سیستم و بازیگران خارجی (جعبه سیاه)

**عناصر مجاز:** `System`، `SystemActor`

**روابط مجاز:** `ComponentExchange`

**قوانین:**
- سیستم یک جعبه سیاه است — داخل آن دیده نمی‌شود
- هر بازیگر خارجی با `ComponentExchange` به سیستم متصل می‌شود

---

### ۲.۲ CCB — Contextual Capability

**هدف:** نمایش قابلیت‌های سیستم از دیدگاه جعبه سیاه

**عناصر مجاز:** `SystemCapability`، `SystemActor`، `System`

**روابط مجاز:** `InvolvementLink`

---

### ۲.۳ CMB — Contextual Mission

**هدف:** نمایش مأموریت‌های سیستم از دیدگاه جعبه سیاه

**عناصر مجاز:** `SystemMission`، `SystemActor`، `System`

**روابط مجاز:** `InvolvementLink`

---

### ۲.۴ MCB — Missions Capabilities Blank

**هدف:** نمایش مأموریت‌ها و قابلیت‌های سیستم در کنار هم

**عناصر مجاز:** `SystemCapability`، `SystemMission`، `SystemActor`، `System`

**روابط مجاز:** `InvolvementLink`

---

### ۲.۵ SFBD — System Function Breakdown

**هدف:** ساختار درختی شکست توابع سیستم

**عناصر مجاز:** `SystemFunction`

**روابط:** درختی (تابع فرزند زیر تابع والد)

---

### ۲.۶ SDFB — System Data Flow Blank

**هدف:** نمایش جریان داده بین توابع سیستم

**عناصر مجاز:** `SystemFunction`، `FunctionPort`

**روابط مجاز:** `FunctionalExchange`

---

### ۲.۷ SAB — System Architecture Blank

**هدف:** معماری داخلی سیستم — توابع تخصیص‌یافته به سیستم

**عناصر مجاز:** `System`، `SystemActor`، `SystemFunction`، `FunctionPort`

**روابط مجاز:**

| رابطه | از | به | توضیح |
|-------|----|----|--------|
| `ComponentExchange` | System/Actor | System/Actor | تبادل بین سیستم و بازیگران |
| `FunctionalExchange` | Function | Function | تبادل بین توابع |
| `Allocation` | SystemFunction | System | تخصیص تابع به سیستم |

**نکته:** توابع می‌توانند داخل `System` قرار گیرند (نشان‌دهنده تخصیص)

---

### ۲.۸ SFOA — System Functions – Operational Activities

**هدف:** نمودار ردیابی — نمایش اینکه کدام تابع سیستم کدام فعالیت عملیاتی را محقق می‌کند

**عناصر مجاز:** `SystemFunction`، `OperationalActivity`

**روابط مجاز:** `Allocation`، `Realization`

> [!NOTE]
> این دیاگرام یک دیاگرام **ردیابی (trace)** است و نه معماری. هدف آن نشان دادن پیوند SA ← OA است.

---

## لایه ۳: Logical Architecture (LA) — معماری منطقی

### عناصر موجود در لایه LA

| نوع | نام | توضیح |
|-----|-----|--------|
| `LogicalComponent` | مؤلفه منطقی | بلوک سازنده معماری (بدون وابستگی فناوری) |
| `LogicalActor` | بازیگر منطقی | عناصر خارجی در سطح منطقی |
| `LogicalFunction` | تابع منطقی | عملکرد در سطح منطقی |
| `LogicalCapability` | قابلیت منطقی | توانایی در سطح منطقی |

### ۳.۱ LCBD — Logical Component Breakdown

**هدف:** ساختار درختی شکست مؤلفه‌های منطقی

**عناصر مجاز:** `LogicalComponent`، `LogicalActor`

**روابط:** درختی (مؤلفه فرزند زیر مؤلفه والد)

> [!IMPORTANT]
> `LogicalActor` می‌تواند داخل `LogicalComponent` قرار گیرد، اما **نمی‌تواند** فرزندی داشته باشد.

---

### ۳.۲ LFBD — Logical Function Breakdown

**هدف:** ساختار درختی شکست توابع منطقی

**عناصر مجاز:** `LogicalFunction`

**روابط:** درختی

---

### ۳.۳ LDFB — Logical Data Flow Blank

**هدف:** نمایش جریان داده بین توابع منطقی

**عناصر مجاز:** `LogicalFunction`، `FunctionPort`

**روابط مجاز:** `FunctionalExchange`

---

### ۳.۴ LAB — Logical Architecture Blank

**هدف:** معماری کامل منطقی — مؤلفه‌ها، توابع، رابط‌ها و تبادلات

**عناصر مجاز:** `LogicalComponent`، `LogicalActor`، `LogicalFunction`، `FunctionPort`

**روابط مجاز:**

| رابطه | از | به | توضیح |
|-------|----|----|--------|
| `ComponentExchange` | Component/Actor | Component/Actor | تبادل بین مؤلفه‌ها |
| `FunctionalExchange` | Function | Function | تبادل بین توابع |
| `Allocation` | LogicalFunction | LogicalComponent | تخصیص تابع به مؤلفه |
| `ProvidedInterface` | Component | Component | رابط ارائه‌شده |
| `RequiredInterface` | Component | Component | رابط مورد نیاز |

**نکته:** مؤلفه‌ها می‌توانند داخل هم قرار گیرند. توابع می‌توانند داخل مؤلفه قرار گیرند.

---

## لایه ۴: Physical Architecture (PA) — معماری فیزیکی

### عناصر موجود در لایه PA

| نوع | نام | توضیح |
|-----|-----|--------|
| `PhysicalComponent` | مؤلفه فیزیکی | نرم‌افزار یا سخت‌افزار قابل اجرا |
| `PhysicalNode` | گره فیزیکی | سخت‌افزار میزبان (سرور، سنسور، ...) |
| `PhysicalActor` | بازیگر فیزیکی | عناصر خارجی فیزیکی |
| `PhysicalFunction` | تابع فیزیکی | عملکرد در سطح پیاده‌سازی |

### ۴.۱ PCBD — Physical Component Breakdown

**هدف:** ساختار درختی شکست مؤلفه‌ها و گره‌های فیزیکی

**عناصر مجاز:** `PhysicalComponent`، `PhysicalNode`، `PhysicalActor`

**روابط:** درختی + `DeploymentLink`

---

### ۴.۲ PFBD — Physical Function Breakdown

**هدف:** ساختار درختی شکست توابع فیزیکی

**عناصر مجاز:** `PhysicalFunction`

**روابط:** درختی

---

### ۴.۳ PDFB — Physical Data Flow Blank

**هدف:** نمایش جریان داده بین توابع فیزیکی

**عناصر مجاز:** `PhysicalFunction`، `FunctionPort`

**روابط مجاز:** `FunctionalExchange`

---

### ۴.۴ PAB — Physical Architecture Blank

**هدف:** معماری کامل فیزیکی — گره‌ها، مؤلفه‌ها، توابع و پیوندها

**عناصر مجاز:** `PhysicalComponent`، `PhysicalNode`، `PhysicalActor`، `PhysicalFunction`، `FunctionPort`

**روابط مجاز:**

| رابطه | از | به | توضیح |
|-------|----|----|--------|
| `ComponentExchange` | Component/Node | Component/Node | تبادل داده |
| `FunctionalExchange` | Function | Function | تبادل بین توابع |
| `PhysicalLink` | Node | Node | کابل/باس بین گره‌ها |
| `DeploymentLink` | PhysicalComponent | PhysicalNode | استقرار نرم‌افزار روی سخت‌افزار |
| `Allocation` | PhysicalFunction | Component/Node | تخصیص تابع |

---

### ۴.۵ PPD — Physical Path Description

**هدف:** توصیف مسیرهای فیزیکی و ارتباطات سخت‌افزاری بین گره‌ها

**عناصر مجاز:** `PhysicalNode`، `PhysicalActor`

**روابط مجاز:** `PhysicalLink`، `ComponentExchange`

---

## قوانین طلایی (غیرقابل تخطی)

> [!CAUTION]
> نقض این قوانین با متدولوژی ARCADIA ناسازگار است.

### ۱. ممنوعیت Composition
هیچ رابطه‌ای به نام **Composition** وجود ندارد. شکست ساختاری فقط از طریق **ساختار درختی (nesting)** در دیاگرام‌های Breakdown انجام می‌شود.

### ۲. قانون بازیگر (Actor Rules)
- هیچ بازیگری نمی‌تواند **والد** داشته باشد یا **شکسته** شود
- بازیگران نمی‌توانند **به هم** متصل شوند (Actor ↔ Actor ممنوع)
- بازیگر فقط در دیاگرام‌های Breakdown می‌تواند **داخل** یک موجودیت/مؤلفه نمایش داده شود

### ۳. جدایی دیاگرام‌های معماری و شکست
| دیاگرام | نوع | چه چیزی نشان می‌دهد |
|---------|------|----------------------|
| OAB, SAB, LAB, PAB | معماری | Exchange و Allocation — بدون nesting ساختاری |
| OEBD, SFBD, LCBD, PCBD | شکست ساختاری | سلسله‌مراتب — بدون Exchange |
| OABD, LFBD, PFBD | شکست تابعی | سلسله‌مراتب توابع — بدون Exchange |

### ۴. تخصیص (Allocation)
اتصال توابع/فعالیت‌ها به موجودیت‌ها یا مؤلفه‌ها همیشه از طریق رابطه **`Allocation`** انجام می‌شود.

---

## جدول خلاصه دیاگرام‌ها

| کد | نام | لایه | نوع | عناصر کلیدی |
|----|-----|------|-----|-------------|
| OEBD | Operational Entity Breakdown | OA | Breakdown | Entity, Actor |
| OCB | Operational Capabilities Blank | OA | Capability | Capability, Entity, Actor |
| OABD | Operational Activity Breakdown | OA | Breakdown | Activity |
| OAIB | Operational Activity Interaction Blank | OA | Dataflow | Activity |
| OAB | Operational Architecture Blank | OA | Architecture | Entity, Actor, Activity |
| OPD | Operational Process Description | OA | Scenario | Activity |
| OAS | Entity Scenario | OA | Scenario | Entity, Actor, Activity |
| CSA | Contextual System Actors | SA | Context | System, Actor |
| CCB | Contextual Capability | SA | Capability | Capability, System, Actor |
| CMB | Contextual Mission | SA | Mission | Mission, System, Actor |
| MCB | Missions Capabilities Blank | SA | Capability | Mission, Capability, System |
| SFBD | System Function Breakdown | SA | Breakdown | SystemFunction |
| SDFB | System Data Flow Blank | SA | Dataflow | SystemFunction |
| SAB | System Architecture Blank | SA | Architecture | System, Actor, Function |
| SFOA | System Functions – Operational Activities | SA | Trace | SystemFunction, Activity |
| LCBD | Logical Component Breakdown | LA | Breakdown | Component, Actor |
| LFBD | Logical Function Breakdown | LA | Breakdown | LogicalFunction |
| LDFB | Logical Data Flow Blank | LA | Dataflow | LogicalFunction |
| LAB | Logical Architecture Blank | LA | Architecture | Component, Actor, Function |
| PCBD | Physical Component Breakdown | PA | Breakdown | Component, Node, Actor |
| PFBD | Physical Function Breakdown | PA | Breakdown | PhysicalFunction |
| PDFB | Physical Data Flow Blank | PA | Dataflow | PhysicalFunction |
| PAB | Physical Architecture Blank | PA | Architecture | Component, Node, Actor, Function |
| PPD | Physical Path Description | PA | Network | Node, Actor |

---

## مثال: پروژه In-Flight Entertainment System (IFE)

### OEBD — موجودیت‌های عملیاتی

```
Airline (OperationalEntity)
├── Crew (OperationalEntity)
│   ├── Cabin Crew (OperationalActor)
│   └── Cockpit Crew (OperationalActor)
└── Ground Operations (OperationalEntity)
    └── Ground Staff (OperationalActor)

Passengers (OperationalEntity)
└── Passenger (OperationalActor)

External Systems (OperationalEntity)
└── Content Provider (OperationalActor)
```

### OAB — معماری عملیاتی

```
Airline ──[CommunicationMean]──► External Systems
Cabin Crew ──[Allocation]── Manage IFE System (Activity)
Passenger ──[Allocation]── Use Entertainment (Activity)
Manage IFE System ──[FunctionalExchange]──► Use Entertainment
```

### SAB — معماری سیستم

```
IFE System (System)
  ├── Provide Content (SystemFunction) [Allocated]
  ├── Manage User Interface (SystemFunction) [Allocated]
  └── Handle Payments (SystemFunction) [Allocated]

Passenger (SystemActor) ──[ComponentExchange]──► IFE System
Airline (SystemActor) ──[ComponentExchange]──► IFE System
```
