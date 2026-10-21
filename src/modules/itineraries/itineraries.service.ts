import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Itinerary, ItineraryDocument } from './schemas/itinerary.schema.js';
import { CreateItineraryDto } from './dto/create-itinerary.dto.js';

@Injectable()
export class ItinerariesService {
  constructor(
    @InjectModel(Itinerary.name)
    private readonly itineraryModel: Model<ItineraryDocument>,
  ) {}

  async create(dto: CreateItineraryDto, userId?: string): Promise<ItineraryDocument> {
    // 1. Calculate strictly verified server-side costs
    let calculatedTotal = 0;

    const formattedDays = dto.days.map((day) => {
      const itemsCost = day.items.reduce((sum, item) => sum + (item.cost ?? 0), 0);
      const dayTotal = itemsCost + (day.accommodationCost ?? 0) + (day.transportCost ?? 0);
      calculatedTotal += dayTotal;

      return {
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
      };
    });

    const doc = new this.itineraryModel({
      userId: userId && Types.ObjectId.isValid(userId) ? new Types.ObjectId(userId) : undefined,
      destinationKey: dto.destinationKey,
      title: dto.title,
      description: dto.description,
      startDate: dto.startDate,
      endDate: dto.endDate,
      totalDays: dto.totalDays,
      totalCost: calculatedTotal,
      currency: 'MNT',
      days: formattedDays,
    });

    return doc.save();
  }

  async findUserItineraries(userId?: string): Promise<Itinerary[]> {
    const filter: Record<string, unknown> = {};
    if (userId && Types.ObjectId.isValid(userId)) {
      filter.userId = new Types.ObjectId(userId);
    }
    return this.itineraryModel.find(filter).sort({ createdAt: -1 }).limit(30).lean<Itinerary[]>().exec();
  }

  async findById(id: string): Promise<Itinerary> {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException('Хөтөлбөрийн ID буруу байна.');
    }
    const itinerary = await this.itineraryModel.findById(id).lean<Itinerary>().exec();
    if (!itinerary) {
      throw new NotFoundException('Аяллын хөтөлбөр олдсонгүй.');
    }
    return itinerary;
  }

  async delete(id: string): Promise<{ deleted: boolean; id: string }> {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException('Хөтөлбөрийн ID буруу байна.');
    }
    const res = await this.itineraryModel.findByIdAndDelete(id).exec();
    if (!res) {
      throw new NotFoundException('Аяллын хөтөлбөр олдсонгүй.');
    }
    return { deleted: true, id };
  }

  async reorderItems(
    id: string,
    sourceDayNumber: number,
    destinationDayNumber: number,
    itemId: string,
    newOrderIndex: number,
  ): Promise<{ updated: boolean; totalCost: number }> {
    const itinerary = await this.itineraryModel.findById(id);
    if (!itinerary) {
      throw new NotFoundException('Аяллын хөтөлбөр олдсонгүй.');
    }

    const sourceDay = itinerary.days.find((d) => d.dayNumber === sourceDayNumber);
    const destDay = itinerary.days.find((d) => d.dayNumber === destinationDayNumber);

    if (!sourceDay || !destDay) {
      throw new NotFoundException('Харгалзах өдөр олдсонгүй.');
    }

    // Find and remove item from source day
    const itemIndex = sourceDay.items.findIndex(
      (it) => it._id.toString() === itemId || it.attractionId === itemId,
    );
    if (itemIndex === -1) {
      throw new NotFoundException('Шилжүүлэх үзвэр олдсонгүй.');
    }

    const [movedItem] = sourceDay.items.splice(itemIndex, 1);
    if (movedItem) {
      destDay.items.splice(newOrderIndex, 0, movedItem);
      destDay.items.forEach((it, idx) => {
        it.orderIndex = idx;
      });
      sourceDay.items.forEach((it, idx) => {
        it.orderIndex = idx;
      });
    }

    // Recalculate total cost
    let grandTotal = 0;
    for (const d of itinerary.days) {
      const itemsCost = d.items.reduce((sum, it) => sum + (it.cost ?? 0), 0);
      grandTotal += itemsCost + (d.accommodationCost ?? 0) + (d.transportCost ?? 0);
    }
    itinerary.totalCost = grandTotal;

    await itinerary.save();
    return {
      updated: true,
      totalCost: itinerary.totalCost,
    };
  }
}
