import {
  Injectable,
  NotFoundException,
  ConflictException,
  OnModuleInit,
  Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
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
import { PaymentsService, PaymentVerificationResult } from '../payments/payments.service.js';
import { CreateSuggestedTripDto } from './dto/create-suggested-trip.dto.js';
import { UpdateSuggestedTripDto } from './dto/update-suggested-trip.dto.js';

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
  readonly image?: string;
  readonly role: string;
  readonly isActive: boolean;
  readonly createdAt: string;
  readonly totalSpent: number;
  readonly transactionsCount: number;
}

@Injectable()
export class AdminService implements OnModuleInit {
  private readonly logger = new Logger(AdminService.name);
  readonly adminEmail = 'munkhuu.munkhsaihan01@gmail.com';

  constructor(
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
    @InjectModel(PaymentTransaction.name)
    private readonly paymentModel: Model<PaymentTransactionDocument>,
    @InjectModel(SuggestedTrip.name)
    private readonly tripModel: Model<SuggestedTripDocument>,
    private readonly paymentsService: PaymentsService,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.ensureAdminAccount();
    await this.seedInitialTrips();
  }

  /**
   * munkhuu.munkhsaihan01@gmail.com хаягийг ADMIN эрхтэйгээр шалгаж, шаардлагатай бол үүсгэх/шинэчлэх
   */
  async ensureAdminAccount(): Promise<void> {
    try {
      const existing = await this.userModel.findOne({ email: this.adminEmail.toLowerCase() });
      if (!existing) {
        await this.userModel.create({
          email: this.adminEmail.toLowerCase(),
          name: 'Мөнххүү Мөнхсайхан (Админ)',
          role: UserRole.ADMIN,
          isActive: true,
        });
        this.logger.log(`Үндсэн админ хэрэглэгч үүсгэгдлээ: ${this.adminEmail}`);
      } else if (existing.role !== UserRole.ADMIN) {
        existing.role = UserRole.ADMIN;
        await existing.save();
        this.logger.log(`Хэрэглэгчийн эрх ADMIN болж шинэчлэгдлээ: ${this.adminEmail}`);
      }
    } catch (err) {
      this.logger.warn(`ensureAdminAccount error: ${err}`);
    }
  }

  /**
   * Анхны бэлэн төлөвлөгөөг MongoDB-д суулгах
   */
  private async seedInitialTrips(): Promise<void> {
    try {
      const count = await this.tripModel.countDocuments();
      if (count === 0) {
        await this.tripModel.create({
          slug: 'trip-beijing',
          title: 'Бээжин хотын аяллын хөтөлбөр',
          destination: 'Бээжин хот, Хятад',
          country: 'Хятад',
          countryKey: 'china',
          countryFlag: '🇨🇳',
          durationText: '3 – 10 өдөр',
          daysCount: 5,
          category: 'historical',
          categoryLabel: 'Бэлэн төлөвлөгөө',
          startingPrice: 1348250,
          imageUrl:
            'https://images.unsplash.com/photo-1508804185872-d7badad00f7d?auto=format&fit=crop&w=800&q=80',
          rating: 4.9,
          reviewsCount: 184,
          highlights: [
            'Цагаан хэрэм (Мутяньюй кабель зам & чарга)',
            'Хориотой хот (Хааны ордны музей)',
            'Юниверсал Студио Бээжин бүрэн өдөр',
            'Буудал, тээвэр, хоногоо өөртөө тохируулах боломжтой',
          ],
          isActive: true,
        });
        this.logger.log('Анхны бэлэн аяллын хөтөлбөр (Бээжин) үүсгэгдлээ.');
      }
    } catch (err) {
      this.logger.warn(`seedInitialTrips error: ${err}`);
    }
  }

  /**
   * Хяналтын самбарын нийт статистик мэдээлэл
   */
  async getStats(): Promise<AdminStatsResult> {
    const [totalUsers, allTransactions, totalTrips, recentTransactions, recentUsers] =
      await Promise.all([
        this.userModel.countDocuments().exec(),
        this.paymentModel.find().lean().exec(),
        this.tripModel.countDocuments({ isActive: true }).exec(),
        this.paymentModel.find().sort({ createdAt: -1 }).limit(5).exec(),
        this.userModel.find().sort({ createdAt: -1 }).limit(5).exec(),
      ]);

    const totalTransactions = allTransactions.length;
    let completedTransactions = 0;
    let pendingTransactions = 0;
    let totalRevenue = 0;

    for (const trx of allTransactions) {
      if (trx.status === PaymentStatus.COMPLETED) {
        completedTransactions++;
        totalRevenue += trx.amount || 0;
      } else if (trx.status === PaymentStatus.PENDING) {
        pendingTransactions++;
      }
    }

    return {
      totalUsers,
      totalTransactions,
      completedTransactions,
      pendingTransactions,
      totalRevenue,
      totalTrips,
      recentTransactions,
      recentUsers,
    };
  }

  /**
   * Бүх гүйлгээний жагсаалт хайлт, шүүлтүүртэйгээр авах
   */
  async getTransactions(query?: {
    search?: string;
    status?: string;
    page?: number;
    limit?: number;
  }): Promise<{ items: PaymentTransactionDocument[]; total: number; page: number; totalPages: number }> {
    const page = Math.max(1, query?.page ?? 1);
    const limit = Math.min(100, Math.max(1, query?.limit ?? 30));
    const skip = (page - 1) * limit;

    const filter: Record<string, unknown> = {};

    if (query?.status && query.status !== 'all') {
      filter.status = query.status;
    }

    if (query?.search && query.search.trim()) {
      const term = query.search.trim();
      const regex = new RegExp(term, 'i');
      filter.$or = [
        { transactionNumber: regex },
        { invoiceNumber: regex },
        { customerEmail: regex },
        { qpayInvoiceId: regex },
      ];
    }

    const [items, total] = await Promise.all([
      this.paymentModel.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).exec(),
      this.paymentModel.countDocuments(filter).exec(),
    ]);

    return {
      items,
      total,
      page,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  /**
   * Нэг гүйлгээний дэлгэрэнгүй баримт & төлөвлөгөөний snapshot авах
   */
  async getTransactionDetails(id: string): Promise<PaymentTransactionDocument> {
    let trx: PaymentTransactionDocument | null = null;
    if (Types.ObjectId.isValid(id)) {
      trx = await this.paymentModel.findById(id).exec();
    }
    if (!trx) {
      trx = await this.paymentModel
        .findOne({
          $or: [{ transactionNumber: id }, { invoiceNumber: id }, { qpayInvoiceId: id }],
        })
        .exec();
    }
    if (!trx) {
      throw new NotFoundException('Гүйлгээ олдсонгүй.');
    }
    return trx;
  }

  /**
   * QPay API-тай шууд холбогдож гүйлгээг шалгах
   */
  async recheckTransaction(id: string): Promise<PaymentVerificationResult> {
    return this.paymentsService.verifyPayment(id, false);
  }

  /**
   * Хэрэглэгчдийн жагсаалт ба тэдний зарцуулалтын түүх
   */
  async getUsers(query?: { search?: string; page?: number; limit?: number }): Promise<{
    items: AdminUserItem[];
    total: number;
    page: number;
  }> {
    const page = Math.max(1, query?.page ?? 1);
    const limit = Math.min(100, Math.max(1, query?.limit ?? 30));
    const skip = (page - 1) * limit;

    const filter: Record<string, unknown> = {};
    if (query?.search && query.search.trim()) {
      const regex = new RegExp(query.search.trim(), 'i');
      filter.$or = [{ name: regex }, { email: regex }];
    }

    const [users, total] = await Promise.all([
      this.userModel.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean().exec(),
      this.userModel.countDocuments(filter).exec(),
    ]);

    // Aggregate user transactions
    const items: AdminUserItem[] = await Promise.all(
      users.map(async (u) => {
        const userTrxs = await this.paymentModel
          .find({
            $or: [{ userId: u._id }, { customerEmail: u.email.toLowerCase() }],
            status: PaymentStatus.COMPLETED,
          })
          .lean()
          .exec();

        const totalSpent = userTrxs.reduce((sum, t) => sum + (t.amount || 0), 0);

        return {
          id: u._id.toString(),
          name: u.name ?? u.email.split('@')[0] ?? 'Хэрэглэгч',
          email: u.email,
          image: u.image,
          role: u.role,
          isActive: u.isActive,
          createdAt: u.createdAt ? new Date(u.createdAt).toLocaleDateString('mn-MN') : '',
          totalSpent,
          transactionsCount: userTrxs.length,
        };
      }),
    );

    return { items, total, page };
  }

  /**
   * Хэрэглэгчийн эрх өөрчлөх (User <-> Admin)
   */
  async updateUserRole(userId: string, role: UserRole): Promise<UserDocument> {
    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new NotFoundException('Хэрэглэгч олдсонгүй.');
    }
    user.role = role;
    await user.save();
    return user;
  }

  /**
   * Бүх бэлэн аяллын хөтөлбөрүүд авах
   */
  async getTrips(): Promise<SuggestedTripDocument[]> {
    return this.tripModel.find().sort({ createdAt: -1 }).exec();
  }

  /**
   * Шинэ бэлэн аяллын төлөвлөгөө нэмэх
   */
  async createTrip(dto: CreateSuggestedTripDto): Promise<SuggestedTripDocument> {
    const existing = await this.tripModel.findOne({ slug: dto.slug.trim() });
    if (existing) {
      throw new ConflictException(`'${dto.slug}' кодтой аяллын хөтөлбөр бүртгэгдсэн байна.`);
    }

    const trip = await this.tripModel.create({
      slug: dto.slug.trim(),
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
      isActive: dto.isActive !== undefined ? dto.isActive : true,
    });

    return trip;
  }

  /**
   * Бэлэн аяллын төлөвлөгөө засах
   */
  async updateTrip(id: string, dto: UpdateSuggestedTripDto): Promise<SuggestedTripDocument> {
    let trip = null;
    if (Types.ObjectId.isValid(id)) {
      trip = await this.tripModel.findById(id);
    }
    if (!trip) {
      trip = await this.tripModel.findOne({ slug: id });
    }
    if (!trip) {
      throw new NotFoundException('Аяллын хөтөлбөр олдсонгүй.');
    }

    Object.assign(trip, dto);
    await trip.save();
    return trip;
  }

  /**
   * Бэлэн аяллын төлөвлөгөө устгах
   */
  async deleteTrip(id: string): Promise<{ success: boolean }> {
    let trip = null;
    if (Types.ObjectId.isValid(id)) {
      trip = await this.tripModel.findByIdAndDelete(id);
    }
    if (!trip) {
      trip = await this.tripModel.findOneAndDelete({ slug: id });
    }
    if (!trip) {
      throw new NotFoundException('Устгах аяллын хөтөлбөр олдсонгүй.');
    }
    return { success: true };
  }
}
