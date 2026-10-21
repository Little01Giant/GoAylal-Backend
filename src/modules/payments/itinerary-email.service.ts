import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import nodemailer, { type Transporter } from 'nodemailer';

export interface SendItineraryEmailParams {
  toEmail: string;
  customerName?: string;
  planTitle: string;
  destinationName: string;
  daysCount: number;
  nightsCount: number;
  travelersCount: number;
  roomsCount: number;
  hotelTitle?: string;
  hotelTotalCost?: number;
  transportTitle?: string;
  transportTotalCost?: number;
  attractionsCount?: number;
  attractionsTotalCost?: number;
  grandTotalCost: number;
  invoiceNumber: string;
  transactionNumber: string;
}

@Injectable()
export class ItineraryEmailService {
  private readonly logger = new Logger(ItineraryEmailService.name);
  private transporter: Transporter | null = null;

  constructor(private readonly configService: ConfigService) {
    this.initTransporter();
  }

  private initTransporter() {
    const host = this.configService.get<string>('SMTP_HOST');
    const port = this.configService.get<number>('SMTP_PORT') ?? 587;
    const user = this.configService.get<string>('SMTP_USER');
    const pass = this.configService.get<string>('SMTP_PASS');

    if (host && user && pass) {
      this.transporter = nodemailer.createTransport({
        host,
        port,
        secure: port === 465,
        auth: { user, pass },
      });
      this.logger.log(`SMTP transporter initialized with host: ${host}`);
    } else {
      this.logger.log('SMTP not fully configured. Email service will run in dev/preview mode.');
    }
  }

  async sendItineraryEmail(params: SendItineraryEmailParams): Promise<{ success: boolean; preview?: string }> {
    const {
      toEmail,
      customerName = 'Аялагч',
      planTitle,
      destinationName,
      daysCount,
      nightsCount,
      travelersCount,
      roomsCount,
      hotelTitle = 'Сонгосон зочид буудал',
      hotelTotalCost = 0,
      transportTitle = 'Сонгосон тээвэр',
      transportTotalCost = 0,
      attractionsCount = 0,
      attractionsTotalCost = 0,
      grandTotalCost,
      invoiceNumber,
      transactionNumber,
    } = params;

    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>GoAylal - Таны аяллын хөтөлбөр & Төлөвлөгөө</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; color: #1e293b; margin: 0; padding: 20px; }
    .card { max-width: 620px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
    .header { background: linear-gradient(135deg, #2563eb, #1d4ed8); color: #ffffff; padding: 32px 24px; text-align: center; }
    .header h1 { margin: 0 0 8px 0; font-size: 24px; font-weight: 800; }
    .header p { margin: 0; font-size: 14px; opacity: 0.9; }
    .body-content { padding: 28px 24px; }
    .badge { display: inline-block; background: #dbeafe; color: #1d4ed8; font-size: 12px; font-weight: 700; padding: 4px 12px; border-radius: 9999px; margin-bottom: 16px; }
    .table { width: 100%; border-collapse: collapse; margin-top: 16px; margin-bottom: 24px; }
    .table td, .table th { padding: 12px 14px; border-bottom: 1px solid #e2e8f0; font-size: 14px; }
    .table th { text-align: left; background: #f1f5f9; color: #475569; font-weight: 600; }
    .table td.cost { text-align: right; font-weight: 700; color: #0f172a; }
    .total-row { background: #eff6ff; font-weight: 800; font-size: 16px; color: #1d4ed8; }
    .section-title { font-size: 16px; font-weight: 700; margin: 24px 0 12px 0; color: #0f172a; }
    .tip-box { background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px; padding: 16px; margin: 20px 0; font-size: 13px; color: #166534; }
    .footer { text-align: center; padding: 20px; font-size: 12px; color: #94a3b8; background: #f8fafc; border-top: 1px solid #e2e8f0; }
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <span class="badge" style="background: rgba(255,255,255,0.25); color: #ffffff;">Баталгаажсан хөтөлбөр</span>
      <h1>${destinationName} аяллын хөтөлбөр</h1>
      <p>${daysCount} өдөр / ${nightsCount} шөнө · ${travelersCount} аялагч · ${roomsCount} өрөө</p>
    </div>
    <div class="body-content">
      <p>Сайн байна уу, <strong>${customerName}</strong>?</p>
      <p>Таны сонгосон <strong>"${planTitle}"</strong> аяллын хөтөлбөрийн бодит төсөв болон дэлгэрэнгүй тооцоолол амжилттай баталгаажлаа.</p>

      <div class="section-title">Бодит зардлын нарийвчилсан задаргаа</div>
      <table class="table">
        <thead>
          <tr>
            <th>Үйлчилгээ</th>
            <th style="text-align: right;">Бодит дүн</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <strong>Тээвэр:</strong> ${transportTitle}<br/>
              <span style="font-size: 12px; color: #64748b;">${travelersCount} зорчигч (2 талын нийт тийз)</span>
            </td>
            <td class="cost">${transportTotalCost.toLocaleString('en-US')} ₮</td>
          </tr>
          <tr>
            <td>
              <strong>Байрлах буудал:</strong> ${hotelTitle}<br/>
              <span style="font-size: 12px; color: #64748b;">${nightsCount} шөнө · ${roomsCount} өрөө</span>
            </td>
            <td class="cost">${hotelTotalCost.toLocaleString('en-US')} ₮</td>
          </tr>
          <tr>
            <td>
              <strong>Үзвэр үйлчилгээ:</strong> ${attractionsCount} үзвэр<br/>
              <span style="font-size: 12px; color: #64748b;">${travelersCount} хүний нийт тасалбар</span>
            </td>
            <td class="cost">${attractionsTotalCost.toLocaleString('en-US')} ₮</td>
          </tr>
          <tr class="total-row">
            <td style="padding: 16px 14px;">Нийт аяллын төсөв:</td>
            <td class="cost" style="color: #1d4ed8; font-size: 18px; padding: 16px 14px;">${grandTotalCost.toLocaleString('en-US')} ₮</td>
          </tr>
        </tbody>
      </table>

      <div class="tip-box">
        <strong>💡 Захиалгын зөвлөгөө & Шууд холбоосууд:</strong><br/>
        • Зочид буудлаа Trip.com эсвэл Booking дээр захиалахдаа өрөөний сонголтондоо <em>${roomsCount} өрөө, ${travelersCount} зочин</em> гэж тохируулаарай.<br/>
        • Тээврийн сонголтоо цаг тухайд нь захиалснаар таны төсөв хамгийн хэмнэлттэй байна.
      </div>

      <p style="font-size: 12px; color: #64748b; margin-top: 24px;">
        Нэхэмжлэхийн дугаар: <strong>${invoiceNumber}</strong> | Гүйлгээ: <strong>${transactionNumber}</strong><br/>
        Үйлчилгээний төлбөр: <strong>20,000 ₮ (Төлөгдсөн)</strong>
      </p>
    </div>
    <div class="footer">
      © 2026 GoAylal Platform. Бүх эрх хуулиар хамгаалагдсан.
    </div>
  </div>
</body>
</html>
    `;

    if (this.transporter) {
      try {
        const fromEmail = this.configService.get<string>('SMTP_FROM') ?? 'no-reply@goaylal.mn';
        await this.transporter.sendMail({
          from: `"GoAylal Travel" <${fromEmail}>`,
          to: toEmail,
          subject: `[GoAylal] ${destinationName} аяллын бүрэн хөтөлбөр & төсөв (${invoiceNumber})`,
          html: htmlContent,
        });
        this.logger.log(`Itinerary email successfully sent to: ${toEmail}`);
        return { success: true };
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        this.logger.error(`Failed to send email to ${toEmail}: ${message}`);
      }
    } else {
      this.logger.log(`[Email Mock/Preview Dispatch] Itinerary sent to ${toEmail} for invoice ${invoiceNumber} (Total: ${grandTotalCost}₮)`);
    }

    return { success: true };
  }
}
