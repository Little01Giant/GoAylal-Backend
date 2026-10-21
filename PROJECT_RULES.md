# PROJECT_RULES.md — GoAylal Backend (NestJS + MongoDB)

> **Ач холбогдол:** Энэхүү дүрмийг backend хөгжүүлэлтийн **бүх сесс, бүх нэмэлт өөрчлөлтөд** чанд баримтална. Дүрэм зөрчсөн кодод 0 tolerance баримтална.

---

## 1. Технологийн Стек ба Стандарт (Tech Stack)

| Хэрэгсэл | Хувилбар | Зориулалт |
|---|---|---|
| **NestJS** | `12.x` | Backend Modular Framework (Dependency Injection) |
| **Node.js** | `24.x+` (ESM, `"type": "module"`) | Runtime Environment |
| **MongoDB / Mongoose** | `9.x+` (`@nestjs/mongoose`) | Өгөгдлийн сан ба ODM |
| **TypeScript** | `5.x+ / 6.x` Strict | Хэл ба төрөлжүүлэлт |
| **Class Validator / Transformer** | Latest | Оролтын өгөгдлийн баталгаажуулалт |
| **@nestjs/swagger** | Latest | OpenAPI 3.0 интерактив баримтжуулалт |
| **OxLint / Prettier** | Latest | Кодын статик шалгалт ба формат |

### Хориглосон зүйлс:
- ❌ `any`, `unknown` (хонхор cast), `@ts-ignore`, `@ts-expect-error` ашиглахгүй.
- ❌ Non-null assertion (`!`) ашиглахгүй.
- ❌ Controller дотор шууд өгөгдлийн сангийн query (`Model.find()`) бичихгүй.
- ❌ Дэд сангаас нууц түлхүүр (`process.env.XYZ`) шууд дуудахгүй — зөвхөн `ConfigService` ашиглана.
- ❌ Client-ээс ирсэн үнийн дүнг шууд итгэж баазад хадгалахгүй — заавал сервер талд дахин бодно.

---

## 2. TypeScript — Строк Дүрмүүд (Strict Rules)

### 2.1 `tsconfig.json` тохиргоо
```jsonc
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,   // Жагсаалтын индексээс утга авахад: T | undefined байна
    "noImplicitReturns": true,           // Функцийн бүх салбар return хийнэ
    "noFallthroughCasesInSwitch": true,  // Switch case тасралтгүй урсахаас хамгаална
    "noUnusedLocals": true,              // Ашиглаагүй хувьсагч үлдээхгүй
    "noUnusedParameters": true,          // Ашиглаагүй функцийн параметр үлдээхгүй
    "exactOptionalPropertyTypes": true   // { a?: string | undefined } байх ёстой
  }
}
```

### 2.2 Буцах утгын төрлийг заавал зааж бичих (Explicit Return Types)
Бүх Service болон Controller функцууд буцах төрлөө тодорхой зааж бичнэ:
```typescript
// ✅ ЗӨВ:
async getDestinations(): Promise<DestinationDocument[]> { ... }

// ❌ БУРУУ: Буцах төрөл тодорхойгүй
async getDestinations() { ... }
```

---

## 3. Архитектур ба Модулийн Зохион Байгуулалт (Layered Architecture)

Бүтэц нь **Controller -> Service -> Model (Schema)** гэсэн 3 үндсэн үетэй байна:

```
src/modules/[feature]/
├── dto/                     # Оролтын DTO (class-validator + @ApiProperty)
│   ├── create-[feature].dto.ts
│   └── update-[feature].dto.ts
├── schemas/                 # Mongoose Schema
│   └── [feature].schema.ts
├── [feature].controller.ts  # HTTP Request хүлээн авах, DTO шалгах, Service дуудах
├── [feature].service.ts     # Бүх бизнес логик, тооцоолол, DB хандалт
└── [feature].module.ts      # NestJS Module тодорхойлолт
```

### 3.1 Controller Дүрэм:
- Бизнес логик агуулахгүй, зөвхөн HTTP хүсэлтийг хүлээн авч, Service рүү дамжуулна.
- Endpoint бүр дээр Swagger чимэглэл (`@ApiOperation`, `@ApiResponse`, `@ApiTags`, `@ApiParam`) заавал байна.
- Endpoint бүрийн зам `kebab-case` байна.

### 3.2 Service Дүрэм:
- Бүх төрлийн үнийн тооцоолол, валидаци, хайлт, шүүлтүүр энд бичигдэнэ.
- Хэрэв өгөгдөл олдохгүй бол NestJS-ийн стандарт алдааг (`NotFoundException`, `BadRequestException`) **Монгол тайлбартай** шиднэ:
  ```typescript
  throw new NotFoundException('Хүссэн аяллын чиглэл олдсонгүй.');
  ```

---

## 4. API Хариу ба Алдааны Нэгдсэн Формат

Бүх API хариу болон алдааг Interceptor ба Filter автоматаар барьж доорх хэлбэрт хөрвүүлнэ:

### 4.1 Амжилттай хариу (`TransformInterceptor`):
```json
{
  "success": true,
  "data": { ... }
}
```

### 4.2 Алдааны хариу (`AllExceptionsFilter`):
```json
{
  "success": false,
  "error": "Монгол хэл дээрх алдааны тайлбар мессеж",
  "code": "BAD_REQUEST"
}
```

---

## 5. QPay v2 ба Төлбөрийн Аюулгүй Байдал

1. **Bearer Token Caching:**
   - QPay-ийн `access_token`-ийг хүсэлт болгонд шинээр авахгүй. Серверийн санах ойд хугацаа нь дуустал кэшилж ашиглана.
2. **Idempotency (Давхардалгүй байх):**
   - Нэг захиалгад зөвхөн 1 идэвхтэй `invoice_id` үүсгэнэ.
3. **Webhook Verification (Хоёр дахин шалгах):**
   - QPay callback ирэх үед нэхэмжлэхийн дугаараар QPay серверийг дуудаж (`/v2/payment/check`) төлбөр бодитоор төлөгдсөнийг баталгаажуулсны дараа төлөвийг `completed` болгоно.

---

## 6. Тооцооллын Шударга Байдал (Pricing & Cost Ledger)

$$\text{Day Cost} = \sum (\text{Attraction Item Cost}) + \text{Accommodation Cost} + \text{Transport Cost}$$

$$\text{Grand Total} = \sum_{d=1}^{N} \text{Day Cost}_d$$

- `customCost` нь үндсэн `estimatedCost`-ийг дарж ажиллана.
- Нэг өдрийн үзвэрийн тоо дээд тал нь 8 (`MAX_ITEMS_PER_DAY = 8`).
- Аяллын хоног дээд тал нь 30 (`MAX_ITINERARY_DAYS = 30`).
- Бүх мөнгөн дүн Монгол төгрөг (`₮` / MNT).

---

## 7. Нэршил ба Кодын Дэг Журам (Naming Conventions)

| Объект | Хэлбэр | Жишээ |
|---|---|---|
| Файлын нэр (Module) | `kebab-case.module.ts` | `ai-planner.module.ts` |
| Файлын нэр (Controller) | `kebab-case.controller.ts` | `destinations.controller.ts` |
| Файлын нэр (Service) | `kebab-case.service.ts` | `itineraries.service.ts` |
| Файлын нэр (Schema) | `kebab-case.schema.ts` | `payment-transaction.schema.ts` |
| Файлын нэр (DTO) | `kebab-case.dto.ts` | `create-itinerary.dto.ts` |
| Class нэршил | `PascalCase` | `DestinationsController` |
| Функц, хувьсагч | `camelCase` | `calculateDayCost`, `invoiceId` |
| Тогтмол утга (Constant) | `UPPER_SNAKE_CASE` | `MAX_ITEMS_PER_DAY` |
| Mongoose Collection | `plural_snake_case` | `destinations`, `chat_sessions` |

---

## 8. Кодын Чанарын Шалгуур (QA Gate)

Git commit хийх эсвэл PR нэгтгэхийн өмнө:
```bash
npm run build
npm run lint
```
- **0 errors, 0 warnings** байх шаардлагатай.
- `// TODO`, `// FIXME`, `// HACK` зэрэг дутуу код үлдээхийг хориглоно.
