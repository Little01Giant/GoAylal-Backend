import {
  BadRequestException,
  Injectable,
  NotFoundException,
  ConflictException,
  OnModuleInit,
  Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ConfigService } from '@nestjs/config';
import { Model, Types } from 'mongoose';
import { User, UserDocument, UserRole } from '../auth/schemas/user.schema.js';
import {
  PaymentTransaction,
  PaymentTransactionDocument,
  PaymentStatus,
} from '../payments/schemas/payment-transaction.schema.js';
import {
  SuggestedTrip,
  SuggestedTripDocument,
} from '../destinations/schemas/suggested-trip.schema.js';
import {
  PaymentsService,
  type BulkTransactionsResult,
  type PaymentVerificationResult,
} from '../payments/payments.service.js';
import {
  PaymentSettingsService,
  type EffectivePaymentSettings,
} from '../payments/payment-settings.service.js';
import type { UpdatePaymentSettingsDto } from '../payments/dto/update-payment-settings.dto.js';
import type { BulkTransactionsDto } from './dto/bulk-transactions.dto.js';
import { CreateSuggestedTripDto } from './dto/create-suggested-trip.dto.js';
import { UpdateSuggestedTripDto } from './dto/update-suggested-trip.dto.js';
import type { AdminTransactionsQueryDto, AdminUsersQueryDto } from './dto/admin-query.dto.js';
import { DestinationsService } from '../destinations/destinations.service.js';
import type { UpsertDestinationDto } from './dto/upsert-destination.dto.js';
import { escapeRegex } from '../../common/utils/escape-regex.js';

export interface AdminStatsResult {
  readonly totalUsers: number;
  readonly totalTransactions: number;
  readonly completedTransactions: number;
  readonly pendingTransactions: number;
  readonly totalRevenue: number;
  readonly totalTrips: number;
  readonly recentTransactions: readonly PaymentTransactionDocument[];
  readonly recentUsers: readonly UserDocument[];
}

export interface AdminUserItem {
  readonly id: string;
  readonly name: string;
  readonly email: string;
  readonly image?: string | undefined;
  readonly role: string;
  readonly isActive: boolean;
  readonly createdAt: string;
  readonly totalSpent: number;
  readonly transactionsCount: number;
}

export interface Page<T> {
  readonly items: T[];
  readonly total: number;
  readonly page: number;
  readonly totalPages: number;
}

interface SpendGroup {
  readonly _id: Types.ObjectId | string;
  readonly spent: number;
  readonly count: number;
}

@Injectable()
export class AdminService implements OnModuleInit {
  private readonly logger = new Logger(AdminService.name);

  constructor(
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
    @InjectModel(PaymentTransaction.name)
    private readonly paymentModel: Model<PaymentTransactionDocument>,
    @InjectModel(SuggestedTrip.name)
    private readonly tripModel: Model<SuggestedTripDocument>,
    private readonly paymentsService: PaymentsService,
    private readonly paymentSettings: PaymentSettingsService,
    private readonly configService: ConfigService,
    private readonly destinations: DestinationsService,
  ) {}

  private get adminEmails(): string[] {
    return this.configService.get<string[]>('admin.emails') ?? [];
  }

  async onModuleInit(): Promise<void> {
    await this.ensureAdminAccounts();
  }

  /** Makes sure every configured ADMIN_EMAILS account exists with the admin role. */
  async ensureAdminAccounts(): Promise<void> {
    for (const email of this.adminEmails) {
      try {
        const existing = await this.userModel.findOne({ email });
        if (!existing) {
          await this.userModel.create({ email, name: email.split('@')[0], role: UserRole.ADMIN, isActive: true });
          this.logger.log(`Админ хэрэглэгч үүсгэгдлээ: ${email}`);
        } else if (existing.role !== UserRole.ADMIN) {
          existing.role = UserRole.ADMIN;
          await existing.save();
          this.logger.log(`Хэрэглэгчийн эрх ADMIN болж шинэчлэгдсэн: ${email}`);
        }
      } catch (err) {
        this.logger.warn(`ensureAdminAccounts error for ${email}: ${String(err)}`);
      }
    }
  }

  /** Dashboard totals computed in the database instead of loading every transaction. */
  async getStats(): Promise<AdminStatsResult> {
    const [totalUsers, byStatus, totalTrips, recentTransactions, recentUsers] = await Promise.all([
      this.userModel.countDocuments().exec(),
      this.paymentModel
        .aggregate<{ _id: PaymentStatus; count: number; revenue: number }>([
          { $group: { _id: '$status', count: { $sum: 1 }, revenue: { $sum: '$amount' } } },
        ])
        .exec(),
      this.tripModel.countDocuments({ isActive: true }).exec(),
      this.paymentModel.find().sort({ createdAt: -1 }).limit(5).exec(),
      this.userModel.find().sort({ createdAt: -1 }).limit(5).exec(),
    ]);

    const completed = byStatus.find((g) => g._id === PaymentStatus.COMPLETED);
    const pending = byStatus.find((g) => g._id === PaymentStatus.PENDING);
    return {
      totalUsers,
      totalTransactions: byStatus.reduce((sum, g) => sum + g.count, 0),
      completedTransactions: completed?.count ?? 0,
      pendingTransactions: pending?.count ?? 0,
      totalRevenue: completed?.revenue ?? 0,
      totalTrips,
      recentTransactions,
      recentUsers,
    };
  }

  async getTransactions(query: AdminTransactionsQueryDto): Promise<Page<PaymentTransactionDocument>> {
    const { page, limit } = query;
    const filter: Record<string, unknown> = {};

    if (query.status && query.status !== 'all') {
      filter.status = query.status;
    }
    const term = query.search?.trim();
    if (term) {
      const regex = new RegExp(escapeRegex(term), 'i');
      filter.$or = [
        { transactionNumber: regex },
        { invoiceNumber: regex },
        { customerEmail: regex },
        { qpayInvoiceId: regex },
      ];
    }

    const [items, total] = await Promise.all([
      this.paymentModel
        .find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .exec(),
      this.paymentModel.countDocuments(filter).exec(),
    ]);
    return { items, total, page, totalPages: Math.ceil(total / limit) || 1 };
  }

  async getTransactionDetails(id: string): Promise<PaymentTransactionDocument> {
    const filter = Types.ObjectId.isValid(id)
      ? { _id: new Types.ObjectId(id) }
      : { $or: [{ transactionNumber: id }, { invoiceNumber: id }, { qpayInvoiceId: id }] };
    const trx = await this.paymentModel.findOne(filter).exec();
    if (!trx) {
      throw new NotFoundException('Гүйлгээ олдсонгүй.');
    }
    return trx;
  }

  /** Re-checks the payment with QPay; settles it if (and only if) QPay confirms. */
  async recheckTransaction(id: string): Promise<PaymentVerificationResult> {
    return this.paymentsService.verifyPayment(id);
  }

  /** One action over many transactions; the payment rules (QPay-confirmed settlement) stay in PaymentsService. */
  async bulkTransactions(dto: BulkTransactionsDto): Promise<BulkTransactionsResult> {
    switch (dto.action) {
      case 'recheck':
        return this.paymentsService.recheckMany(dto.ids);
      case 'expire-pending':
        return this.paymentsService.expirePendingMany(dto.ids);
      case 'mark-refunded':
        return this.paymentsService.markRefundedMany(dto.ids);
    }
  }

  async getPaymentSettings(): Promise<EffectivePaymentSettings> {
    return this.paymentSettings.getEffective();
  }

  async updatePaymentSettings(dto: UpdatePaymentSettingsDto): Promise<EffectivePaymentSettings> {
    return this.paymentSettings.update(dto);
  }

  /** Users with their completed-payment totals, using two grouped queries for the whole page. */
  async getUsers(query: AdminUsersQueryDto): Promise<Page<AdminUserItem>> {
    const { page, limit } = query;
    const filter: Record<string, unknown> = {};
    const term = query.search?.trim();
    if (term) {
      const regex = new RegExp(escapeRegex(term), 'i');
      filter.$or = [{ name: regex }, { email: regex }];
    }

    const [users, total] = await Promise.all([
      this.userModel
        .find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean()
        .exec(),
      this.userModel.countDocuments(filter).exec(),
    ]);

    const ids = users.map((u) => u._id);
    const emails = users.map((u) => u.email.toLowerCase());
    const completed = { status: PaymentStatus.COMPLETED };
    const [byUser, byGuestEmail] = await Promise.all([
      this.paymentModel
        .aggregate<SpendGroup>([
          { $match: { ...completed, userId: { $in: ids } } },
          { $group: { _id: '$userId', spent: { $sum: '$amount' }, count: { $sum: 1 } } },
        ])
        .exec(),
      this.paymentModel
        .aggregate<SpendGroup>([
          { $match: { ...completed, userId: { $exists: false }, customerEmail: { $in: emails } } },
          { $group: { _id: '$customerEmail', spent: { $sum: '$amount' }, count: { $sum: 1 } } },
        ])
        .exec(),
    ]);
    const userSpend = new Map(byUser.map((g) => [String(g._id), g]));
    const guestSpend = new Map(byGuestEmail.map((g) => [String(g._id), g]));

    const items = users.map((u): AdminUserItem => {
      const own = userSpend.get(u._id.toString());
      const guest = guestSpend.get(u.email.toLowerCase());
      return {
        id: u._id.toString(),
        name: u.name ?? u.email.split('@')[0] ?? 'Хэрэглэгч',
        email: u.email,
        image: u.image,
        role: u.role,
        isActive: u.isActive,
        createdAt: u.createdAt ? new Date(u.createdAt).toLocaleDateString('mn-MN') : '',
        totalSpent: (own?.spent ?? 0) + (guest?.spent ?? 0),
        transactionsCount: (own?.count ?? 0) + (guest?.count ?? 0),
      };
    });

    return { items, total, page, totalPages: Math.ceil(total / limit) || 1 };
  }

  /** Changes a role. The last admin and the ADMIN_EMAILS accounts cannot be demoted. */
  async updateUserRole(userId: string, role: UserRole): Promise<{ id: string; _id: string; email: string; name?: string | undefined; role: UserRole; isActive: boolean }> {
    const user = Types.ObjectId.isValid(userId) ? await this.userModel.findById(userId) : null;
    if (!user) {
      throw new NotFoundException('Хэрэглэгч олдсонгүй.');
    }

    if (user.role === UserRole.ADMIN && role !== UserRole.ADMIN) {
      if (this.adminEmails.includes(user.email.toLowerCase())) {
        throw new ConflictException('Системийн үндсэн админы эрхийг бууруулах боломжгүй.');
      }
      const otherAdmins = await this.userModel.countDocuments({
        role: UserRole.ADMIN,
        isActive: true,
        _id: { $ne: user._id },
      });
      if (otherAdmins === 0) {
        throw new ConflictException('Сүүлчийн админы эрхийг бууруулах боломжгүй.');
      }
    }

    user.role = role;
    await user.save();
    const id = user._id.toString();
    return { id, _id: id, email: user.email, name: user.name, role: user.role, isActive: user.isActive };
  }

  getDestinations(): ReturnType<DestinationsService['listCatalog']> {
    return this.destinations.listCatalog();
  }

  /** Adds or updates a whole city in the database; no code change or redeploy needed. */
  async upsertDestination(key: string, dto: UpsertDestinationDto): Promise<{ key: string; attractions: number; hotels: number; transports: number }> {
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(key) || key.length > 64) {
      throw new BadRequestException('Хотын түлхүүр зөвхөн жижиг латин үсэг, тоо, зураас агуулна.');
    }
    for (const [label, ids] of [
      ['үзвэр', dto.attractions.map((a) => a.id)],
      ['буудал', dto.hotels.map((h) => h.id)],
      ['тээвэр', dto.transports.map((t) => t.id)],
    ] as const) {
      if (new Set(ids).size !== ids.length) {
        throw new BadRequestException(`Ижил id-тай ${label} давхардсан байна.`);
      }
    }
    const { popular, ...city } = dto;
    await this.destinations.upsertCity({ ...city, key }, popular === undefined ? {} : { popular });
    return { key, attractions: dto.attractions.length, hotels: dto.hotels.length, transports: dto.transports.length };
  }

  async getTrips(): Promise<SuggestedTripDocument[]> {
    return this.tripModel.find().sort({ createdAt: -1 }).exec();
  }

  async createTrip(dto: CreateSuggestedTripDto): Promise<SuggestedTripDocument> {
    const slug = dto.slug.trim();
    if (await this.tripModel.exists({ slug })) {
      throw new ConflictException(`'${dto.slug}' кодтой аяллын төлөвлөгөө бүртгэгдсэн байна.`);
    }

    return this.tripModel.create({
      slug,
      title: dto.title.trim(),
      destination: dto.destination.trim(),
      country: dto.country.trim(),
      countryKey: dto.countryKey ?? 'china',
      countryFlag: dto.countryFlag ?? '🇨🇳',
      durationText: dto.durationText ?? `${dto.daysCount} өдөр`,
      daysCount: dto.daysCount,
      category: dto.category ?? 'popular',
      categoryLabel: dto.categoryLabel ?? 'Бэлэн төлөвлөгөө',
      startingPrice: dto.startingPrice,
      imageUrl: dto.imageUrl,
      rating: dto.rating ?? 5.0,
      reviewsCount: dto.reviewsCount ?? 1,
      highlights: dto.highlights ?? [],
      isActive: dto.isActive ?? true,
    });
  }

  async updateTrip(id: string, dto: UpdateSuggestedTripDto): Promise<SuggestedTripDocument> {
    const trip = await this.findTrip(id);
    trip.set(dto);
    await trip.save();
    return trip;
  }

  async deleteTrip(id: string): Promise<{ success: boolean }> {
    const trip = await this.findTrip(id);
    await trip.deleteOne();
    return { success: true };
  }

  private async findTrip(id: string): Promise<SuggestedTripDocument> {
    const trip =
      (Types.ObjectId.isValid(id) ? await this.tripModel.findById(id) : null) ??
      (await this.tripModel.findOne({ slug: id }));
    if (!trip) {
      throw new NotFoundException('Аяллын төлөвлөгөө олдсонгүй.');
    }
    return trip;
  }
}
