import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Itinerary, ItineraryDocument, ItineraryStatus } from './schemas/itinerary.schema.js';
import { CreateItineraryDto } from './dto/create-itinerary.dto.js';
import { ReorderItemsDto } from './dto/reorder-items.dto.js';
import { MAX_ITEMS_PER_DAY } from './itineraries.constants.js';
import { UserRole } from '../auth/schemas/user.schema.js';
import type { AuthenticatedUser } from '../auth/auth.types.js';

const LIST_LIMIT = 100;

/** API shape: the stored itinerary plus `id`. `_id` stays for the current frontend (transitional). */
export type ItineraryDto = Omit<Itinerary, 'userId'> & { id: string; _id: string; userId?: string | undefined };

type LeanItinerary = Itinerary & { _id: Types.ObjectId };

function toDto(doc: LeanItinerary): ItineraryDto {
  const { userId, ...rest } = doc;
  const id = doc._id.toString();
  return { ...rest, id, _id: id, userId: userId?.toString() };
}

@Injectable()
export class ItinerariesService {
  constructor(
    @InjectModel(Itinerary.name)
    private readonly itineraryModel: Model<ItineraryDocument>,
  ) {}

  async create(dto: CreateItineraryDto, user: AuthenticatedUser): Promise<ItineraryDto> {
    const dayNumbers = new Set(dto.days.map((d) => d.dayNumber));
    if (dayNumbers.size !== dto.days.length) {
      throw new BadRequestException('Өдрийн дугаар давхардсан байна.');
    }
    // A true multi-day plan is capped per day. The current frontend sends one day holding every
    // item, so the cap is also enforced in aggregate (8 items x totalDays).
    const totalItems = dto.days.reduce((sum, d) => sum + d.items.length, 0);
    if (dto.days.length > 1 && dto.days.some((d) => d.items.length > MAX_ITEMS_PER_DAY)) {
      throw new BadRequestException(`Нэг өдөрт хамгийн ихдээ ${MAX_ITEMS_PER_DAY} үзвэр оруулах боломжтой.`);
    }
    if (totalItems > MAX_ITEMS_PER_DAY * dto.totalDays) {
      throw new BadRequestException(
        `Нийт үзвэрийн тоо ${MAX_ITEMS_PER_DAY * dto.totalDays}-аас хэтэрсэн байна (өдөрт ${MAX_ITEMS_PER_DAY}).`,
      );
    }

    const days = dto.days.map((day) => ({
      _id: new Types.ObjectId(),
      dayNumber: day.dayNumber,
      title: day.title,
      date: day.date,
      accommodationCost: day.accommodationCost ?? 0,
      transportCost: day.transportCost ?? 0,
      items: day.items.map((item, idx) => ({
        _id: new Types.ObjectId(),
        attractionId: item.attractionId,
        name: item.name,
        orderIndex: item.orderIndex ?? idx,
        cost: item.cost ?? 0,
        durationHours: item.durationHours ?? 2.0,
      })),
    }));

    const doc = await this.itineraryModel.create({
      userId: new Types.ObjectId(user.sub),
      destinationKey: dto.destinationKey,
      title: dto.title,
      description: dto.description,
      startDate: dto.startDate,
      endDate: dto.endDate,
      totalDays: dto.totalDays,
      totalCost: this.computeTotal(days),
      currency: 'MNT',
      status: ItineraryStatus.SAVED,
      days,
    });
    return toDto(doc.toObject() as LeanItinerary);
  }

  async findUserItineraries(user: AuthenticatedUser): Promise<ItineraryDto[]> {
    const docs = await this.itineraryModel
      .find({ userId: new Types.ObjectId(user.sub) })
      .sort({ createdAt: -1 })
      .limit(LIST_LIMIT)
      .lean<LeanItinerary[]>()
      .exec();
    return docs.map(toDto);
  }

  /** Owner or admin may read. Anyone else gets 404, so the existence of an id is not disclosed. */
  async findById(id: string, user: AuthenticatedUser): Promise<ItineraryDto> {
    const itinerary = await this.findLean(id);
    if (itinerary.userId?.toString() !== user.sub && user.role !== UserRole.ADMIN) {
      throw new NotFoundException('Аяллын хөтөлбөр олдсонгүй.');
    }
    return toDto(itinerary);
  }

  async delete(id: string, user: AuthenticatedUser): Promise<{ deleted: boolean; id: string }> {
    this.assertValidId(id);
    const res = await this.itineraryModel
      .findOneAndDelete({ _id: new Types.ObjectId(id), userId: new Types.ObjectId(user.sub) })
      .exec();
    if (!res) {
      throw new NotFoundException('Аяллын хөтөлбөр олдсонгүй.');
    }
    return { deleted: true, id };
  }

  async reorderItems(
    id: string,
    dto: ReorderItemsDto,
    user: AuthenticatedUser,
  ): Promise<{ updated: boolean; totalCost: number; recalculatedTotalCost: number }> {
    this.assertValidId(id);
    const itinerary = await this.itineraryModel.findOne({
      _id: new Types.ObjectId(id),
      userId: new Types.ObjectId(user.sub),
    });
    if (!itinerary) {
      throw new NotFoundException('Аяллын хөтөлбөр олдсонгүй.');
    }
    if (itinerary.status === ItineraryStatus.UNLOCKED) {
      throw new ConflictException('Төлбөр төлөгдсөн хөтөлбөрийг өөрчлөх боломжгүй.');
    }

    const sourceDay = itinerary.days.find((d) => d.dayNumber === dto.sourceDayNumber);
    const destDay = itinerary.days.find((d) => d.dayNumber === dto.destinationDayNumber);
    if (!sourceDay || !destDay) {
      throw new NotFoundException('Харгалзах өдөр олдсонгүй.');
    }

    let itemIndex = sourceDay.items.findIndex((it) => it._id.toString() === dto.itemId);
    if (itemIndex === -1) {
      const byAttraction = sourceDay.items.filter((it) => it.attractionId === dto.itemId);
      if (byAttraction.length > 1) {
        throw new BadRequestException('Үзвэр давхардсан тул itemId-г ашиглана уу.');
      }
      itemIndex = sourceDay.items.findIndex((it) => it.attractionId === dto.itemId);
    }
    if (itemIndex === -1) {
      throw new NotFoundException('Шилжүүлэх үзвэр олдсонгүй.');
    }
    if (
      sourceDay !== destDay &&
      itinerary.days.length > 1 &&
      destDay.items.length >= MAX_ITEMS_PER_DAY
    ) {
      throw new BadRequestException(`Нэг өдөрт хамгийн ихдээ ${MAX_ITEMS_PER_DAY} үзвэр оруулах боломжтой.`);
    }

    const [movedItem] = sourceDay.items.splice(itemIndex, 1);
    if (movedItem) {
      destDay.items.splice(Math.min(dto.newOrderIndex, destDay.items.length), 0, movedItem);
      destDay.items.forEach((it, idx) => {
        it.orderIndex = idx;
      });
      sourceDay.items.forEach((it, idx) => {
        it.orderIndex = idx;
      });
    }

    itinerary.totalCost = this.computeTotal(itinerary.days);
    await itinerary.save();
    return { updated: true, totalCost: itinerary.totalCost, recalculatedTotalCost: itinerary.totalCost };
  }

  private computeTotal(
    days: ReadonlyArray<{ accommodationCost?: number; transportCost?: number; items: ReadonlyArray<{ cost?: number }> }>,
  ): number {
    return days.reduce(
      (sum, d) =>
        sum + d.items.reduce((s, it) => s + (it.cost ?? 0), 0) + (d.accommodationCost ?? 0) + (d.transportCost ?? 0),
      0,
    );
  }

  private assertValidId(id: string): void {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException('Аяллын хөтөлбөр олдсонгүй.');
    }
  }

  private async findLean(id: string): Promise<LeanItinerary> {
    this.assertValidId(id);
    const itinerary = await this.itineraryModel.findById(id).lean<LeanItinerary>().exec();
    if (!itinerary) {
      throw new NotFoundException('Аяллын хөтөлбөр олдсонгүй.');
    }
    return itinerary;
  }
}
