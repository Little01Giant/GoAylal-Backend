import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types, type AnyBulkWriteOperation } from 'mongoose';
import { isDuplicateKeyError } from '../../common/utils/is-duplicate-key-error.js';
import type { BulkDiscountsDto } from './dto/bulk-discounts.dto.js';
import type { BulkPricingPlansDto } from './dto/bulk-pricing-plans.dto.js';
import type { CreateDiscountDto } from './dto/create-discount.dto.js';
import type { CreatePricingPlanDto } from './dto/create-pricing-plan.dto.js';
import type { UpdateDiscountDto } from './dto/update-discount.dto.js';
import type { UpdatePricingPlanDto } from './dto/update-pricing-plan.dto.js';
import {
  discountStatus,
  discountValueProblem,
  pickBestDiscount,
  type DiscountStatus,
} from './pricing.calculator.js';
import { DEFAULT_PLAN_CODE, DEFAULT_PLAN_NAME, MIN_PAYABLE_MNT } from './pricing.constants.js';
import { Discount, DiscountDocument, DiscountType } from './schemas/discount.schema.js';
import { PricingPlan, PricingPlanDocument } from './schemas/pricing-plan.schema.js';

export interface PricingPlanView {
  readonly id: string;
  readonly code: string;
  readonly name: string;
  readonly description: string;
  readonly price: number;
  readonly durationDays: number;
  readonly features: readonly string[];
  readonly isActive: boolean;
  readonly isDefault: boolean;
  readonly sortOrder: number;
  /** What the payer is charged right now, after the best live discount. */
  readonly finalPrice: number;
  readonly appliedDiscountName: string | null;
  readonly createdAt?: Date | undefined;
  readonly updatedAt?: Date | undefined;
}

export interface DiscountView {
  readonly id: string;
  readonly name: string;
  readonly type: DiscountType;
  readonly value: number;
  readonly startsAt: Date | null;
  readonly endsAt: Date | null;
  readonly isActive: boolean;
  readonly appliesToAll: boolean;
  readonly planIds: readonly string[];
  readonly status: DiscountStatus;
  readonly createdAt?: Date | undefined;
}

export interface PriceQuote {
  readonly planId: string;
  readonly planCode: string;
  readonly planName: string;
  readonly durationDays: number;
  readonly basePrice: number;
  readonly discountAmount: number;
  readonly finalPrice: number;
  readonly discountId: string | null;
  readonly discountName: string | null;
}

export interface BulkResult {
  readonly requested: number;
  readonly matched: number;
  readonly modified: number;
  readonly deleted: number;
  readonly missingIds: readonly string[];
}

interface PlanPrice {
  readonly id: string;
  readonly name: string;
  readonly price: number;
}

/** The final shape of a discount after a create / update / bulk edit, validated before it is written. */
interface DiscountCandidate {
  readonly name: string;
  readonly type: DiscountType;
  readonly value: number;
  readonly startsAt: Date | null;
  readonly endsAt: Date | null;
  readonly appliesToAll: boolean;
  readonly planIds: readonly string[];
}

function isDefined<T>(value: T | undefined): value is T {
  return value !== undefined;
}

function toObjectIds(ids: readonly string[]): Types.ObjectId[] {
  return ids.map((id) => new Types.ObjectId(id));
}

@Injectable()
export class PricingService {
  constructor(
    @InjectModel(PricingPlan.name)
    private readonly planModel: Model<PricingPlanDocument>,
    @InjectModel(Discount.name)
    private readonly discountModel: Model<DiscountDocument>,
    private readonly configService: ConfigService,
  ) {}

  // ─── Quote (used by payments) ────────────────────────────────────────────────

  /** The price a payer is charged: the chosen (or default) active plan minus the best live discount. */
  async quote(planId?: string): Promise<PriceQuote> {
    await this.ensureSeeded();
    const plan = await this.resolveChargeablePlan(planId);
    const discounts = await this.discountModel
      .find({ isActive: true, $or: [{ appliesToAll: true }, { planIds: plan._id }] })
      .exec();
    const best = pickBestDiscount(plan.price, discounts, new Date());
    const discountAmount = best?.amount ?? 0;
    return {
      planId: String(plan._id),
      planCode: plan.code,
      planName: plan.name,
      durationDays: plan.durationDays,
      basePrice: plan.price,
      discountAmount,
      finalPrice: plan.price - discountAmount,
      discountId: best ? String(best.discount._id) : null,
      discountName: best?.discount.name ?? null,
    };
  }

  private async resolveChargeablePlan(planId?: string): Promise<PricingPlanDocument> {
    if (planId) {
      if (!Types.ObjectId.isValid(planId)) {
        throw new BadRequestException('Төлөвлөгөөний ID буруу байна.');
      }
      const chosen = await this.planModel.findOne({ _id: planId, isActive: true }).exec();
      if (!chosen) {
        throw new NotFoundException('Сонгосон төлөвлөгөө олдсонгүй эсвэл идэвхгүй байна.');
      }
      return chosen;
    }
    const fallback =
      (await this.planModel.findOne({ isDefault: true, isActive: true }).exec()) ??
      (await this.planModel.findOne({ isActive: true }).sort({ sortOrder: 1, createdAt: 1 }).exec());
    if (!fallback) {
      throw new ServiceUnavailableException('Идэвхтэй үнийн төлөвлөгөө байхгүй байна.');
    }
    return fallback;
  }

  /** The first plan is created from UNLOCK_FEE_MNT so existing deployments keep charging the same fee. */
  private async ensureSeeded(): Promise<void> {
    if ((await this.planModel.estimatedDocumentCount().exec()) > 0) {
      return;
    }
    try {
      await this.planModel
        .updateOne(
          { code: DEFAULT_PLAN_CODE },
          {
            $setOnInsert: {
              name: DEFAULT_PLAN_NAME,
              description: '',
              price: this.configService.getOrThrow<number>('pricing.unlockFeeMnt'),
              durationDays: 0,
              features: [],
              isActive: true,
              isDefault: true,
              sortOrder: 0,
            },
          },
          { upsert: true },
        )
        .exec();
    } catch (err) {
      // A concurrent request seeded it first.
      if (!isDuplicateKeyError(err)) {
        throw err;
      }
    }
  }

  // ─── Plans ───────────────────────────────────────────────────────────────────

  async listPlans(): Promise<PricingPlanView[]> {
    await this.ensureSeeded();
    const [plans, discounts] = await Promise.all([
      this.planModel.find().sort({ sortOrder: 1, createdAt: 1 }).exec(),
      this.discountModel.find({ isActive: true }).exec(),
    ]);
    const now = new Date();
    return plans.map((plan) => {
      const applicable = discounts.filter(
        (d) => d.appliesToAll || d.planIds.some((id) => String(id) === String(plan._id)),
      );
      return this.toPlanView(plan, pickBestDiscount(plan.price, applicable, now));
    });
  }

  async createPlan(dto: CreatePricingPlanDto): Promise<PricingPlanView> {
    await this.ensureSeeded();
    const code = dto.code.trim().toLowerCase();
    if (await this.planModel.exists({ code })) {
      throw new ConflictException(`'${code}' кодтой төлөвлөгөө бүртгэгдсэн байна.`);
    }
    const isActive = dto.isActive ?? true;
    const isDefault = dto.isDefault ?? false;
    if (isDefault && !isActive) {
      throw new BadRequestException('Үндсэн төлөвлөгөө идэвхтэй байх ёстой.');
    }
    await this.assertPriceFitsDiscounts(null, dto.price);

    const plan = await this.planModel.create({
      code,
      name: dto.name.trim(),
      description: dto.description?.trim() ?? '',
      price: dto.price,
      durationDays: dto.durationDays ?? 0,
      features: this.cleanFeatures(dto.features),
      isActive,
      isDefault,
      sortOrder: dto.sortOrder ?? 0,
    });
    if (isDefault) {
      await this.makeOnlyDefault(plan._id);
    }
    return this.toPlanView(plan, null);
  }

  async updatePlan(id: string, dto: UpdatePricingPlanDto): Promise<PricingPlanView> {
    const plan = await this.findPlan(id);
    const isActive = dto.isActive ?? plan.isActive;
    const isDefault = dto.isDefault ?? plan.isDefault;

    if (plan.isDefault && !isDefault) {
      throw new BadRequestException('Үндсэн төлөвлөгөөг сольж болохгүй. Өөр төлөвлөгөөг үндсэн болгоно уу.');
    }
    if (isDefault && !isActive) {
      throw new BadRequestException('Үндсэн төлөвлөгөө идэвхтэй байх ёстой.');
    }
    if (dto.price !== undefined && dto.price !== plan.price) {
      await this.assertPriceFitsDiscounts(plan._id as Types.ObjectId, dto.price);
    }

    const patch = {
      name: dto.name?.trim(),
      description: dto.description?.trim(),
      price: dto.price,
      durationDays: dto.durationDays,
      features: dto.features ? this.cleanFeatures(dto.features) : undefined,
      isActive: dto.isActive,
      isDefault: dto.isDefault,
      sortOrder: dto.sortOrder,
    };
    plan.set(Object.fromEntries(Object.entries(patch).filter(([, value]) => isDefined(value))));
    await plan.save();
    if (isDefault) {
      await this.makeOnlyDefault(plan._id as Types.ObjectId);
    }
    return this.toPlanView(plan, null);
  }

  async deletePlan(id: string): Promise<{ success: boolean }> {
    const plan = await this.findPlan(id);
    if (plan.isDefault) {
      throw new ConflictException('Үндсэн төлөвлөгөөг устгах боломжгүй. Эхлээд өөр төлөвлөгөөг үндсэн болгоно уу.');
    }
    await plan.deleteOne();
    await this.detachPlansFromDiscounts([plan._id as Types.ObjectId]);
    return { success: true };
  }

  /** One round trip per kind of write, whatever the selection size. The default plan is protected. */
  async bulkPlans(dto: BulkPricingPlansDto): Promise<BulkResult> {
    const found = await this.planModel.find({ _id: { $in: toObjectIds(dto.ids) } }).exec();
    const missingIds = this.missingIds(dto.ids, found);

    if (dto.action !== 'activate' && found.some((plan) => plan.isDefault)) {
      throw new ConflictException(
        'Үндсэн төлөвлөгөөг идэвхгүй болгох эсвэл устгах боломжгүй. Эхлээд өөр төлөвлөгөөг үндсэн болгоно уу.',
      );
    }

    const foundIds = found.map((plan) => plan._id as Types.ObjectId);
    if (foundIds.length === 0) {
      return { requested: dto.ids.length, matched: 0, modified: 0, deleted: 0, missingIds };
    }

    if (dto.action === 'delete') {
      const res = await this.planModel.deleteMany({ _id: { $in: foundIds } }).exec();
      await this.detachPlansFromDiscounts(foundIds);
      return { requested: dto.ids.length, matched: foundIds.length, modified: 0, deleted: res.deletedCount, missingIds };
    }

    const res = await this.planModel
      .updateMany({ _id: { $in: foundIds } }, { $set: { isActive: dto.action === 'activate' } })
      .exec();
    return { requested: dto.ids.length, matched: res.matchedCount, modified: res.modifiedCount, deleted: 0, missingIds };
  }

  private async findPlan(id: string): Promise<PricingPlanDocument> {
    const plan = Types.ObjectId.isValid(id) ? await this.planModel.findById(id).exec() : null;
    if (!plan) {
      throw new NotFoundException('Үнийн төлөвлөгөө олдсонгүй.');
    }
    return plan;
  }

  private async makeOnlyDefault(planId: Types.ObjectId): Promise<void> {
    await this.planModel.updateMany({ _id: { $ne: planId }, isDefault: true }, { $set: { isDefault: false } }).exec();
  }

  private cleanFeatures(features: readonly string[] | undefined): string[] {
    return (features ?? []).map((feature) => feature.trim()).filter((feature) => feature.length > 0);
  }

  /** A price change must keep every fixed discount that applies to the plan (or to all plans) payable. */
  private async assertPriceFitsDiscounts(planId: Types.ObjectId | null, price: number): Promise<void> {
    const scope = planId ? [{ appliesToAll: true }, { planIds: planId }] : [{ appliesToAll: true }];
    const fixed = await this.discountModel.find({ type: DiscountType.FIXED, $or: scope }).exec();
    for (const discount of fixed) {
      const problem = discountValueProblem(discount, price);
      if (problem) {
        throw new BadRequestException(`'${discount.name}' хөнгөлөлттэй зөрчилдөж байна. ${problem}`);
      }
    }
  }

  /** Discounts scoped to deleted plans must not silently widen: an emptied scope is switched off. */
  private async detachPlansFromDiscounts(planIds: readonly Types.ObjectId[]): Promise<void> {
    await this.discountModel.updateMany({ planIds: { $in: planIds } }, { $pull: { planIds: { $in: planIds } } }).exec();
    await this.discountModel
      .updateMany({ appliesToAll: false, planIds: { $size: 0 } }, { $set: { isActive: false } })
      .exec();
  }

  // ─── Discounts ───────────────────────────────────────────────────────────────

  async listDiscounts(): Promise<DiscountView[]> {
    const discounts = await this.discountModel.find().sort({ createdAt: -1 }).exec();
    const now = new Date();
    return discounts.map((discount) => this.toDiscountView(discount, now));
  }

  async createDiscount(dto: CreateDiscountDto): Promise<DiscountView> {
    const candidate: DiscountCandidate = {
      name: dto.name.trim(),
      type: dto.type,
      value: dto.value,
      startsAt: dto.startsAt ?? null,
      endsAt: dto.endsAt ?? null,
      appliesToAll: dto.appliesToAll ?? false,
      planIds: dto.planIds ?? [],
    };
    this.assertValid(candidate, await this.planPrices());

    const discount = await this.discountModel.create({
      ...this.toStoredFields(candidate),
      isActive: dto.isActive ?? true,
    });
    return this.toDiscountView(discount, new Date());
  }

  async updateDiscount(id: string, dto: UpdateDiscountDto): Promise<DiscountView> {
    const discount = await this.findDiscount(id);
    const candidate = this.mergeCandidate(discount, {
      name: dto.name?.trim(),
      type: dto.type,
      value: dto.value,
      startsAt: dto.startsAt,
      endsAt: dto.endsAt,
      appliesToAll: dto.appliesToAll,
      planIds: dto.planIds,
    });
    this.assertValid(candidate, await this.planPrices());

    discount.set({ ...this.toStoredFields(candidate), ...(dto.isActive !== undefined ? { isActive: dto.isActive } : {}) });
    await discount.save();
    return this.toDiscountView(discount, new Date());
  }

  async deleteDiscount(id: string): Promise<{ success: boolean }> {
    const discount = await this.findDiscount(id);
    await discount.deleteOne();
    return { success: true };
  }

  /**
   * Applies one action to many discounts. `update` validates every resulting discount first and writes
   * nothing if any is invalid, then applies all changes in a single bulkWrite.
   */
  async bulkDiscounts(dto: BulkDiscountsDto): Promise<BulkResult> {
    const found = await this.discountModel.find({ _id: { $in: toObjectIds(dto.ids) } }).exec();
    const missingIds = this.missingIds(dto.ids, found);
    const foundIds = found.map((discount) => discount._id as Types.ObjectId);
    const result = (modified: number, deleted = 0): BulkResult => ({
      requested: dto.ids.length,
      matched: foundIds.length,
      modified,
      deleted,
      missingIds,
    });
    if (foundIds.length === 0) {
      return result(0);
    }

    if (dto.action === 'delete') {
      const res = await this.discountModel.deleteMany({ _id: { $in: foundIds } }).exec();
      return result(0, res.deletedCount);
    }
    if (dto.action === 'activate' || dto.action === 'deactivate') {
      const res = await this.discountModel
        .updateMany({ _id: { $in: foundIds } }, { $set: { isActive: dto.action === 'activate' } })
        .exec();
      return result(res.modifiedCount);
    }

    return result(await this.bulkUpdateDiscounts(dto, found));
  }

  private async bulkUpdateDiscounts(dto: BulkDiscountsDto, found: readonly DiscountDocument[]): Promise<number> {
    const hasPlanChange = dto.planMode !== undefined;
    if (!hasPlanChange && [dto.type, dto.value, dto.startsAt, dto.endsAt].every((field) => field === undefined)) {
      throw new BadRequestException('Өөрчлөх утгаа (төрөл, утга, огноо эсвэл төлөвлөгөө) сонгоно уу.');
    }
    if (dto.planMode && dto.planMode !== 'all' && (dto.planIds?.length ?? 0) === 0) {
      throw new BadRequestException('Төлөвлөгөөний жагсаалтыг сонгоно уу.');
    }

    const plans = await this.planPrices();
    const allPlanIds = plans.map((plan) => plan.id);
    const problems: string[] = [];
    const operations: AnyBulkWriteOperation<DiscountDocument>[] = [];

    for (const discount of found) {
      const scope = this.nextScope(discount, dto, allPlanIds);
      const candidate = this.mergeCandidate(discount, {
        type: dto.type,
        value: dto.value,
        startsAt: dto.startsAt,
        endsAt: dto.endsAt,
        appliesToAll: scope.appliesToAll,
        planIds: scope.planIds,
      });
      const problem = this.candidateProblem(candidate, plans);
      if (problem) {
        problems.push(`'${discount.name}': ${problem}`);
        continue;
      }
      const { startsAt, endsAt, ...fields } = this.toStoredFields(candidate);
      const set: Record<string, unknown> = { ...fields };
      const unset: Record<string, ''> = {};
      if (startsAt) {
        set.startsAt = startsAt;
      } else {
        unset.startsAt = '';
      }
      if (endsAt) {
        set.endsAt = endsAt;
      } else {
        unset.endsAt = '';
      }
      operations.push({
        updateOne: {
          filter: { _id: discount._id },
          update: Object.keys(unset).length > 0 ? { $set: set, $unset: unset } : { $set: set },
        },
      });
    }

    if (problems.length > 0) {
      throw new BadRequestException(problems.join(' '));
    }
    const res = await this.discountModel.bulkWrite(operations);
    return res.modifiedCount;
  }

  /** The plan scope one discount ends up with under the requested bulk plan mode. */
  private nextScope(
    discount: DiscountDocument,
    dto: BulkDiscountsDto,
    allPlanIds: readonly string[],
  ): { appliesToAll: boolean; planIds: string[] } {
    const current = discount.planIds.map(String);
    const requested = dto.planIds ?? [];
    switch (dto.planMode) {
      case 'all':
        return { appliesToAll: true, planIds: [] };
      case 'set':
        return { appliesToAll: false, planIds: [...requested] };
      case 'add':
        return discount.appliesToAll
          ? { appliesToAll: true, planIds: [] }
          : { appliesToAll: false, planIds: [...new Set([...current, ...requested])] };
      case 'remove': {
        const base = discount.appliesToAll ? allPlanIds : current;
        return { appliesToAll: false, planIds: base.filter((id) => !requested.includes(id)) };
      }
      default:
        return { appliesToAll: discount.appliesToAll, planIds: current };
    }
  }

  private async findDiscount(id: string): Promise<DiscountDocument> {
    const discount = Types.ObjectId.isValid(id) ? await this.discountModel.findById(id).exec() : null;
    if (!discount) {
      throw new NotFoundException('Хөнгөлөлт олдсонгүй.');
    }
    return discount;
  }

  private mergeCandidate(
    discount: DiscountDocument,
    changes: {
      readonly name?: string | undefined;
      readonly type?: DiscountType | undefined;
      readonly value?: number | undefined;
      readonly startsAt?: Date | null | undefined;
      readonly endsAt?: Date | null | undefined;
      readonly appliesToAll?: boolean | undefined;
      readonly planIds?: readonly string[] | undefined;
    },
  ): DiscountCandidate {
    return {
      name: changes.name ?? discount.name,
      type: changes.type ?? discount.type,
      value: changes.value ?? discount.value,
      startsAt: changes.startsAt === undefined ? (discount.startsAt ?? null) : changes.startsAt,
      endsAt: changes.endsAt === undefined ? (discount.endsAt ?? null) : changes.endsAt,
      appliesToAll: changes.appliesToAll ?? discount.appliesToAll,
      planIds: changes.planIds ?? discount.planIds.map(String),
    };
  }

  private toStoredFields(candidate: DiscountCandidate): {
    name: string;
    type: DiscountType;
    value: number;
    startsAt: Date | undefined;
    endsAt: Date | undefined;
    appliesToAll: boolean;
    planIds: Types.ObjectId[];
  } {
    return {
      name: candidate.name,
      type: candidate.type,
      value: candidate.value,
      startsAt: candidate.startsAt ?? undefined,
      endsAt: candidate.endsAt ?? undefined,
      appliesToAll: candidate.appliesToAll,
      planIds: candidate.appliesToAll ? [] : toObjectIds(candidate.planIds),
    };
  }

  private assertValid(candidate: DiscountCandidate, plans: readonly PlanPrice[]): void {
    const problem = this.candidateProblem(candidate, plans);
    if (problem) {
      throw new BadRequestException(problem);
    }
  }

  /** Why a discount cannot be saved as configured, or null. Covers value limits, dates and plan scope. */
  private candidateProblem(candidate: DiscountCandidate, plans: readonly PlanPrice[]): string | null {
    if (candidate.startsAt && candidate.endsAt && candidate.endsAt.getTime() <= candidate.startsAt.getTime()) {
      return 'Дуусах огноо эхлэх огнооноос хойш байх ёстой.';
    }
    if (!candidate.appliesToAll && candidate.planIds.length === 0) {
      return 'Ядаж нэг төлөвлөгөө сонгох эсвэл "Бүх төлөвлөгөө"-г идэвхжүүлнэ үү.';
    }
    const generic = discountValueProblem(candidate);
    if (generic) {
      return generic;
    }
    const targets = candidate.appliesToAll ? plans : plans.filter((plan) => candidate.planIds.includes(plan.id));
    if (!candidate.appliesToAll && targets.length !== new Set(candidate.planIds).size) {
      return 'Сонгосон төлөвлөгөөнүүдийн заримыг олсонгүй.';
    }
    if (candidate.type === DiscountType.FIXED) {
      for (const plan of targets) {
        const problem = discountValueProblem(candidate, plan.price);
        if (problem) {
          return `'${plan.name}' төлөвлөгөө: ${problem} (Хамгийн багадаа ${MIN_PAYABLE_MNT}₮ үлдэнэ.)`;
        }
      }
    }
    return null;
  }

  private async planPrices(): Promise<PlanPrice[]> {
    await this.ensureSeeded();
    const plans = await this.planModel.find().select('name price').lean().exec();
    return plans.map((plan) => ({ id: String(plan._id), name: plan.name, price: plan.price }));
  }

  private missingIds(requested: readonly string[], found: readonly { readonly _id: unknown }[]): string[] {
    const present = new Set(found.map((doc) => String(doc._id)));
    return requested.filter((id) => !present.has(id));
  }

  // ─── Views ───────────────────────────────────────────────────────────────────

  private toPlanView(
    plan: PricingPlanDocument,
    applied: { readonly amount: number; readonly discount: Discount } | null,
  ): PricingPlanView {
    return {
      id: String(plan._id),
      code: plan.code,
      name: plan.name,
      description: plan.description,
      price: plan.price,
      durationDays: plan.durationDays,
      features: plan.features,
      isActive: plan.isActive,
      isDefault: plan.isDefault,
      sortOrder: plan.sortOrder,
      finalPrice: plan.price - (applied?.amount ?? 0),
      appliedDiscountName: applied?.discount.name ?? null,
      createdAt: plan.createdAt,
      updatedAt: plan.updatedAt,
    };
  }

  private toDiscountView(discount: DiscountDocument, now: Date): DiscountView {
    return {
      id: String(discount._id),
      name: discount.name,
      type: discount.type,
      value: discount.value,
      startsAt: discount.startsAt ?? null,
      endsAt: discount.endsAt ?? null,
      isActive: discount.isActive,
      appliesToAll: discount.appliesToAll,
      planIds: discount.planIds.map(String),
      status: discountStatus(discount, now),
      createdAt: discount.createdAt,
    };
  }
}
