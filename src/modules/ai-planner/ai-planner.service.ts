import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ConfigService } from '@nestjs/config';
import { Model, Types } from 'mongoose';
import {
  ChatSession,
  ChatSessionDocument,
  MessageRole,
  GeneratedPlanSnapshot,
} from './schemas/chat-session.schema.js';
import { DestinationsService } from '../destinations/destinations.service.js';

export interface AiChatResult {
  readonly sessionId: Types.ObjectId | string;
  readonly messageId: Types.ObjectId | string;
  readonly role: 'assistant';
  readonly content: string;
  readonly plan?: GeneratedPlanSnapshot | undefined;
  readonly quickSuggestions: readonly string[];
}

@Injectable()
export class AiPlannerService {
  private readonly logger = new Logger(AiPlannerService.name);

  constructor(
    @InjectModel(ChatSession.name)
    private readonly chatSessionModel: Model<ChatSessionDocument>,
    private readonly destinationsService: DestinationsService,
    private readonly configService: ConfigService,
  ) {}

  private async callDeepSeek(
    history: { role: 'user' | 'assistant'; content: string }[],
    userMessage: string,
    destinationContext?: string,
  ): Promise<string | null> {
    const apiKey = this.configService.get<string>('deepseek.apiKey');
    if (!apiKey || apiKey === 'your_deepseek_api_key_here' || apiKey.length < 5) {
      return null;
    }

    const baseUrl =
      this.configService.get<string>('deepseek.baseUrl') ?? 'https://api.deepseek.com';
    const model =
      this.configService.get<string>('deepseek.model') ?? 'deepseek-chat';

    const systemPrompt = `Та бол Монгол аялагчдад зориулсан "GoAylal" платформын аяллын ухаалаг зөвлөх AI туслах юм.
Таны үүрэг:
1. Монгол хэлээр маш найрсаг, сонирхолтой, ойлгомжтой, цэгцтэй (bullet points, emoji ашиглан) хариулах.
2. Хэрэглэгчийн аяллын чиглэл, хугацаа, төсөвт тохирсон өдөр тутмын хөтөлбөр (itinerary), үзвэр үйлчилгээ, буудал, тээврийн сонголт, тооцоолсон зардал (Монгол төгрөгөөр ₮), улирлын зөвлөгөө, визний шаардлага зэргийг тодорхой зөвлөх.
3. Системд байгаа чиглэлийн өгөгдөл: ${destinationContext ?? 'Аяллын чиглэлийн ерөнхий мэдээлэл'}.
4. Хариултынхаа төгсгөлд хэрэглэгчийн сонгож болох 2-3 богино санал болгох асуулт эсвэл дараагийн алхмыг оруулна уу.`;

    try {
      const messages = [
        { role: 'system', content: systemPrompt },
        ...history.slice(-6).map((m) => ({ role: m.role, content: m.content })),
        { role: 'user', content: userMessage },
      ];

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 7500);

      let response: Response;
      try {
        response = await fetch(`${baseUrl}/chat/completions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey}`,
            Accept: 'application/json, text/event-stream',
          },
          body: JSON.stringify({
            model,
            messages,
            stream: false,
            temperature: 0.7,
          }),
          signal: controller.signal,
        });
      } finally {
        clearTimeout(timeoutId);
      }

      if (!response.ok) {
        const errorText = await response.text();
        this.logger.warn(`AI API returned status ${response.status}: ${errorText.slice(0, 150)}`);
        return null;
      }

      const contentType = response.headers.get('content-type') ?? '';
      if (contentType.includes('text/event-stream')) {
        const rawStreamText = await response.text();
        let combinedText = '';
        const lines = rawStreamText.split('\n');
        for (const line of lines) {
          const trimmed = line.trim();
          if (trimmed.startsWith('data:') && !trimmed.includes('[DONE]')) {
            try {
              const jsonStr = trimmed.replace(/^data:\s*/, '');
              const parsed = JSON.parse(jsonStr) as {
                choices?: Array<{ delta?: { content?: string } }>;
              };
              const piece = parsed.choices?.[0]?.delta?.content;
              if (piece) {
                combinedText += piece;
              }
            } catch {
              // Ignore partial stream line
            }
          }
        }
        return combinedText || null;
      }

      const data = (await response.json()) as {
        choices?: Array<{ message?: { content?: string } }>;
      };

      return data.choices?.[0]?.message?.content ?? null;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      this.logger.warn(`AI API request fell back gracefully: ${msg}`);
      return null;
    }
  }

  async chat(message: string, sessionId?: string, userId?: string): Promise<AiChatResult> {
    let session = sessionId && Types.ObjectId.isValid(sessionId)
      ? await this.chatSessionModel.findById(sessionId)
      : null;

    if (!session) {
      session = new this.chatSessionModel({
        userId: userId && Types.ObjectId.isValid(userId) ? new Types.ObjectId(userId) : undefined,
        title: message.slice(0, 30) + '...',
        messages: [],
      });
    }

    // 1. Add user message
    session.messages.push({
      _id: new Types.ObjectId(),
      role: MessageRole.USER,
      content: message,
      quickSuggestions: [],
    });

    // 2. Intelligent destination keyword detection
    const normalized = message.toLowerCase();
    let cityKey = 'beijing';
    if (normalized.includes('шанхай') || normalized.includes('shanghai')) {
      cityKey = 'shanghai';
    } else if (normalized.includes('токио') || normalized.includes('tokyo') || normalized.includes('япон') || normalized.includes('japan')) {
      cityKey = 'tokyo';
    } else if (normalized.includes('сөүл') || normalized.includes('seoul') || normalized.includes('солонгос') || normalized.includes('korea')) {
      cityKey = 'seoul';
    } else if (normalized.includes('бангкок') || normalized.includes('bangkok') || normalized.includes('тайланд') || normalized.includes('thailand') || normalized.includes('пхукет') || normalized.includes('phuket')) {
      cityKey = 'bangkok';
    } else if (normalized.includes('дананг') || normalized.includes('danang') || normalized.includes('хой ан') || normalized.includes('hoi an')) {
      cityKey = 'danang';
    } else if (normalized.includes('ханой') || normalized.includes('hanoi') || normalized.includes('халонг') || normalized.includes('halong')) {
      cityKey = 'hanoi';
    } else if (normalized.includes('дубай') || normalized.includes('dubai') || normalized.includes('эмират') || normalized.includes('uae')) {
      cityKey = 'dubai';
    } else if (normalized.includes('хөвсгөл') || normalized.includes('нуур') || normalized.includes('khuvsgul')) {
      cityKey = 'khuvsgul';
    } else if (normalized.includes('бээжин') || normalized.includes('beijing') || normalized.includes('хятад') || normalized.includes('china')) {
      cityKey = 'beijing';
    }

    // Parse days & travelers
    let days = 5;
    if (normalized.includes('3') || normalized.includes('гурав')) days = 3;
    else if (normalized.includes('6') || normalized.includes('зургаа')) days = 6;
    else if (normalized.includes('7') || normalized.includes('долоо')) days = 7;
    else if (normalized.includes('10') || normalized.includes('арав')) days = 10;

    let travelers = 2;
    if (normalized.includes('1 хүн') || normalized.includes('ганцаараа')) travelers = 1;
    else if (normalized.includes('3 хүн') || normalized.includes('3 найз')) travelers = 3;
    else if (normalized.includes('4 хүн') || normalized.includes('гэр бүл')) travelers = 4;

    let planData: GeneratedPlanSnapshot | undefined = undefined;
    let destinationContext = '';
    let quickSuggestions: string[] = [];

    try {
      const city = await this.destinationsService.findByKey(cityKey);
      destinationContext = `Чиглэл: ${city.name} (${city.country}). Үзвэрүүд: ${city.attractions?.slice(0, 3).map((a) => a.name).join(', ')}. Буудал: ${city.hotels?.[0]?.name ?? 'Standard Hotel'}, Тээвэр: ${city.transports?.[0]?.title ?? 'Standard Flight'}`;

      let hotel = city.hotels?.find((h) => h.starRating === 3) ?? city.hotels?.[0];
      if (
        normalized.includes('хямд') ||
        normalized.includes('төсөв') ||
        normalized.includes('2 од') ||
        normalized.includes('хоёр од')
      ) {
        hotel = city.hotels?.find((h) => h.starRating === 2) ?? hotel;
      } else if (
        normalized.includes('тансаг') ||
        normalized.includes('люкс') ||
        normalized.includes('5 од') ||
        normalized.includes('таван од')
      ) {
        hotel = city.hotels?.find((h) => h.starRating === 5) ?? hotel;
      }

      let transport = city.transports?.find((t) => t.type === 'flight') ?? city.transports?.[0];
      if (
        normalized.includes('газраар') ||
        normalized.includes('газрын') ||
        normalized.includes('автобус') ||
        normalized.includes('галт тэрэг')
      ) {
        transport = city.transports?.find((t) => t.type === 'overland') ?? transport;
      } else if (normalized.includes('хосолсон') || normalized.includes('хослол')) {
        transport = city.transports?.find((t) => t.type === 'combined') ?? transport;
      }

      const nights = Math.max(1, days - 1);
      const hotelCost = (hotel?.pricePerNight ?? 240000) * nights;
      const transportCost = (transport?.pricePerPerson ?? 916300) * travelers;
      const attractionsList = city.attractions || [];
      const selectedAttractionsList = attractionsList.slice(0, days <= 3 ? 2 : 3);
      const attractionsCost =
        (selectedAttractionsList.reduce((sum, a) => sum + (a.estimatedCost || 0), 0) || 300000) * travelers;
      const grandTotal = hotelCost + transportCost + attractionsCost;

      const durationText = transport?.durationText ?? '2-3 цаг';
      const arrivalActivity =
        transport?.type === 'flight'
          ? `Улаанбаатараас шууд нислэгээр ${city.name} хотод хүрэлцэн ирэх (${durationText})`
          : transport?.type === 'overland'
          ? `Улаанбаатараас Замын-Үүд рүү галт тэрэг, Замын-Үүдээс Эрээн рүү автобус, Эрээнээс ${city.name} рүү автобусаар зорчин хүрэлцэн ирэх (${durationText})`
          : `Улаанбаатараас Замын-Үүд рүү галт тэрэг, Эрээн рүү автобусаар очоод, цааш дотоод нислэгээр ${city.name} хотод хүрэлцэн ирэх (${durationText})`;

      const returnActivity =
        transport?.type === 'flight'
          ? `Шууд нислэгээр Улаанбаатар хот руу буцах (${durationText})`
          : transport?.type === 'overland'
          ? `${city.name}-ээс Эрээн рүү автобус, Эрээнээс Замын-Үүд рүү автобус, Замын-Үүдээс Улаанбаатар луу галт тэргээр эх орондоо буцах (${durationText})`
          : `${city.name}-ээс Эрээн рүү нислэгээр, Эрээнээс Замын-Үүд рүү автобус, цааш галт тэргээр Улаанбаатар хот руу буцах (${durationText})`;

      // Build day-by-day plan
      const itineraryDays = [];
      for (let d = 1; d <= days; d++) {
        if (d === 1) {
          itineraryDays.push({
            day: 1,
            title: `${city.name}-д хүрэлцэн ирэх & зочид буудалдаа бүртгүүлэх`,
            activities: [
              arrivalActivity,
              `${hotel?.name ?? 'Зочид буудал'}-даа бүртгүүлэн өрөөндөө тухлах, амарч хүчээ сэлбэх`,
              'Оройн хоол & хотын төвийн хөл хөдөлгөөнт гудамжаар зугаалах',
            ],
          });
        } else if (d === days) {
          itineraryDays.push({
            day: d,
            title: 'Бэлэг дурсгал худалдан авах & Буцах',
            activities: [
              'Буудлын өрөөгөө хүлээлгэн өгөх (Check-out)',
              'Нутгийн алдартай худалдааны төвөөр орох, дурсгалын зүйлс авах',
              returnActivity,
            ],
          });
        } else {
          const attrIndex = (d - 2) % Math.max(1, attractionsList.length);
          const attr = attractionsList[attrIndex];
          itineraryDays.push({
            day: d,
            title: attr ? `${attr.name} үзэх & танилцах` : `${d} дахь өдрийн аялал`,
            activities: [
              attr ? `${attr.name} (${attr.category ?? 'Үзвэр'}) бүрэн үзэх` : 'Хотын дурсгалт газруудаар аялах',
              'Орон нутгийн уламжлалт зоогийн газарт өдрийн хоол идэх',
              'Оройн үзэмж, алжаал тайлах чөлөөт цаг',
            ],
          });
        }
      }

      planData = {
        city: {
          key: city.key,
          name: city.name,
          country: city.country,
          flag: city.flag,
          tag: city.tag || 'Онцлох чиглэл',
        },
        days,
        nightsCount: nights,
        travelers,
        hotelTierStars: hotel?.starRating ?? 3,
        selectedHotel: hotel
          ? {
              id: hotel.id || hotel.name,
              name: hotel.name,
              starRating: hotel.starRating,
              pricePerNight: hotel.pricePerNight,
            }
          : {
              name: 'Тохилог буудал',
              starRating: 3,
              pricePerNight: 240000,
            },
        selectedAttractions: selectedAttractionsList.map((a) => ({
          id: a.id || a.name,
          name: a.name,
          category: a.category || 'Үзвэр',
          estimatedCost: a.estimatedCost || 50000,
        })),
        selectedTransport: transport
          ? {
              id: transport.id || transport.title,
              title: transport.title,
              type: transport.type || 'flight',
              pricePerPerson: transport.pricePerPerson,
            }
          : {
              title: 'Шууд нислэг',
              type: 'flight',
              pricePerPerson: 1250000,
            },
        hotelTotalCost: hotelCost,
        attractionsTotalCost: attractionsCost,
        transportTotalCost: transportCost,
        grandTotalCost: grandTotal,
        perPersonCost: Math.round(grandTotal / travelers),
        itinerary: itineraryDays,
      };

      quickSuggestions = [
        `${city.flag} ${city.name} ${days} өдрийн зардлыг нарийвчлах`,
        `${hotel?.name ?? 'Буудал'} сонголтыг өөрчлөх`,
        `${city.name} аяллын хөтөлбөрийг хадгалах`,
      ];
    } catch {
      quickSuggestions = [
        'Бээжин 5 өдөр 2 хүн төлөвлөх',
        'Токио 6 өдөр аялах зардал',
        'Дананг далайн амралт төлөвлөх',
      ];
    }

    // 3. Call AI
    const history = session.messages.map((m) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    }));

    const deepSeekReply = await this.callDeepSeek(history, message, destinationContext);

    let aiResponseText = deepSeekReply;
    if (!aiResponseText) {
      if (planData) {
        aiResponseText = `Таны хүсэлтийн дагуу би **${planData.city.flag} ${planData.city.name}** чиглэлд **${planData.days} өдөр**, **${planData.travelers} хүнтэй** аялахад зориулсан хөтөлбөр, зардлын тооцоог бэлтгэлээ.

### 💰 Зардлын ерөнхий тойм:
- **Нийт тооцоолсон төсөв:** ₮${planData.grandTotalCost.toLocaleString()}
- **Нэг хүнд ногдох зардал:** ₮${planData.perPersonCost.toLocaleString()}
- **Буудал:** ${planData.selectedHotel?.name ?? '3 одтой тохилог буудал'} (${planData.hotelTierStars} одтой)
- **Тээвэр:** ${planData.selectedTransport?.title ?? 'Шууд нислэг'}

Та доорх төлөвлөгөөний хуваарьтай танилцаад өөрийн хүссэнээр өөрчлөх боломжтой!`;
      } else {
        aiResponseText =
          'Сайн байна уу! Та аль улс, ямар хот руу, хэдэн хоногоор, хэдэн хүнтэй аялахаар төлөвлөж байна вэ? Би танд төсөв, үзвэр, зочид буудал, тээврийн хамгийн оновчтой хувилбарыг Монгол төгрөгөөр тооцоолж хөтөлбөр гаргаж өгье.';
      }
    }

    // 4. Save assistant response
    const assistantMessage = {
      _id: new Types.ObjectId(),
      role: MessageRole.ASSISTANT,
      content: aiResponseText,
      planSnapshot: planData,
      quickSuggestions,
    };
    session.messages.push(assistantMessage);
    session.lastActiveAt = new Date();
    await session.save();

    return {
      sessionId: session._id,
      messageId: assistantMessage._id,
      role: 'assistant',
      content: aiResponseText,
      plan: planData,
      quickSuggestions,
    };
  }
}
