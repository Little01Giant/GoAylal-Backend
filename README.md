# GoAylal Backend Service (NestJS + MongoDB / Mongoose)

Энэхүү төсөл нь **GoAylal** (Монгол аялагчдад зориулсан гадаад, дотоод аяллын төлөвлөгч систем)-ийн албан ёсны бие даасан **Backend Microservice** юм.

---

## 🛠 Технологийн Стек (Tech Stack)

- **Framework:** [NestJS](https://nestjs.com/) v12 (Modular Architecture, Dependency Injection)
- **Runtime:** Node.js v24+
- **Database:** MongoDB 7+ / MongoDB Atlas
- **ODM (Object Document Mapper):** `@nestjs/mongoose`, `mongoose` v9+
- **Configuration & Validation:** `@nestjs/config`, `class-validator`, `class-transformer`
- **Interactive Documentation:** `@nestjs/swagger` (OpenAPI 3.0)
- **Port:** `4000` (Next.js frontend нь 3000 дээр зэрэг ажиллана)

---

## 📁 Төслийн Бүтэц (Folder Structure)

```
D:\travel-backend/
├── src/
│   ├── config/                           # Тохиргооны модулиуд (.env ачаалагч)
│   │   └── configuration.ts              # Port, Mongo URI, QPay, DeepSeek түлхүүрүүд
│   │
│   ├── common/                           # Бүх модульд хэрэглэгдэх дундын хэрэгслүүд
│   │   ├── filters/
│   │   │   └── http-exception.filter.ts  # Монгол хэлтэй нэгдсэн алдаа баригч
│   │   └── interceptors/
│   │       └── transform.interceptor.ts  # Бүх хариуг { success: true, data: ... } болгогч
│   │
│   ├── modules/                          # Бизнес логикийн бие даасан модулиуд
│   │   ├── auth/                         # Хэрэглэгчийн бүртгэл, Google нэвтрэлт
│   │   │   └── schemas/user.schema.ts
│   │   │
│   │   ├── destinations/                 # Чиглэл, үзвэр, зочид буудал, тээврийн каталог
│   │   │   ├── schemas/
│   │   │   │   ├── destination.schema.ts # Хот (Бээжин, Токио, Хөвсгөл г.м)
│   │   │   │   ├── attraction.schema.ts  # Үзвэр, үйлчилгээний өгөгдөл
│   │   │   │   ├── hotel.schema.ts       # Зочид буудлын зэрэглэл, үнэ
│   │   │   │   └── transport.schema.ts   # Нислэг, галт тэрэгний хуваарь, үнэ
│   │   │   ├── destinations.controller.ts# GET /api/v1/destinations, GET /api/v1/destinations/:key
│   │   │   ├── destinations.service.ts   # Монголын датаг автоматаар Seed хийх функцтэй
│   │   │   └── destinations.module.ts
│   │   │
│   │   ├── itineraries/                  # Аяллын хөтөлбөр & Drag-and-Drop төлөвлөгч
│   │   │   ├── dto/
│   │   │   │   └── create-itinerary.dto.ts
│   │   │   ├── schemas/
│   │   │   │   └── itinerary.schema.ts   # Embedded Days & Items бүхий схем
│   │   │   ├── itineraries.controller.ts # POST /api/v1/itineraries, PUT /:id/reorder-items
│   │   │   ├── itineraries.service.ts    # Сервер талын үнийн бодит тооцоолол
│   │   │   └── itineraries.module.ts
│   │   │
│   │   ├── payments/                     # QPay v2 төлбөрийн гарц
│   │   │   ├── schemas/
│   │   │   │   └── payment-transaction.schema.ts
│   │   │   ├── payments.controller.ts    # POST /api/v1/payments/qpay/create-invoice, /callback
│   │   │   ├── payments.service.ts       # QR үүсгэх, банкны апп холбоос, баримт
│   │   │   └── payments.module.ts
│   │   │
│   │   └── ai-planner/                   # DeepSeek AI чат & төлөвлөгч
│   │       ├── schemas/
│   │       │   └── chat-session.schema.ts
│   │       ├── ai-planner.controller.ts  # POST /api/v1/ai/chat
│   │       ├── ai-planner.service.ts     # Монгол яриаг таних & төлөвлөгөө боловсруулах
│   │       └── ai-planner.module.ts
│   │
│   ├── app.module.ts                     # Үндсэн Root модуль
│   └── main.ts                           # CORS, Swagger, Validation, Filter-тэй эхлэл
│
├── .env                                  # Ажиллах орчны хувьсагчид
├── .env.example                          # Хувьсагчдын загвар файл
├── package.json                          # Хамааралтай сангууд
└── tsconfig.json                         # TypeScript Strict тохиргоо
```

---

## 🚀 Ажиллуулах Заавар (Getting Started)

### 1. Орчны хувьсагч бэлтгэх
`.env` файлыг шалгаж өөрийн MongoDB холболтын мөрийг тохируулна:

```env
PORT=4000
MONGODB_URI=mongodb://127.0.0.1:27017/goaylal
# Эсвэл MongoDB Atlas:
# MONGODB_URI=mongodb+srv://<user>:<password>@cluster0.mongodb.net/goaylal?retryWrites=true&w=majority
```

### 2. Хөгжүүлэлтийн горимд эхлүүлэх (Watch Mode)
```bash
npm run start:dev
```

Сервер асмагц:
- **API Base:** [http://localhost:4000/api/v1](http://localhost:4000/api/v1)
- **Swagger Docs:** [http://localhost:4000/api/docs](http://localhost:4000/api/docs)

### 3. Build хийх
```bash
npm run build
```

---

## 🔗 Үндсэн API Endpoint-ууд

| Модуль | Method | Endpoint | Тайлбар |
|---|---|---|---|
| **Auth** | `POST` | `/api/v1/auth/google` | Google ID token-оор нэвтэрч JWT авах |
| **Auth** | `GET` | `/api/v1/auth/me` | Нэвтэрсэн хэрэглэгчийн мэдээллийг авах |
| **Destinations** | `GET` | `/api/v1/destinations` | Бүх аяллын чиглэлийг авах |
| **Destinations** | `GET` | `/api/v1/destinations/:key` | Нэг хотын үзвэр, буудал, тээвэртэй хамт авах |
| **Itineraries** | `POST` | `/api/v1/itineraries` | Шинэ хөтөлбөр хадгалах |
| **Itineraries** | `GET` | `/api/v1/itineraries/:id` | Хөтөлбөрийг өдрүүд, үзвэрүүдтэй нь авах |
| **Itineraries** | `PUT` | `/api/v1/itineraries/:id/reorder-items` | Drag-and-Drop дараалал шинэчлэх |
| **Payments** | `POST` | `/api/v1/payments/qpay/create-invoice` | QPay QR код болон банкны апп линкүүд авах |
| **Payments** | `POST` | `/api/v1/payments/qpay/callback` | QPay Webhook хүлээн авах |
| **Payments** | `GET` | `/api/v1/payments/receipt/:id` | Цахим төлбөрийн баримт харах |
| **AI Planner** | `POST` | `/api/v1/ai/chat` | DeepSeek AI туслахтай чатлаж төлөвлөгөө авах |
