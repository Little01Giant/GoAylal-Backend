import { Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Destination, DestinationDocument } from './schemas/destination.schema.js';
import { Attraction, AttractionDocument } from './schemas/attraction.schema.js';
import { Hotel, HotelDocument } from './schemas/hotel.schema.js';
import { Transport, TransportDocument, TransportType } from './schemas/transport.schema.js';
import { ALL_DESTINATIONS, SeedDestinationCity } from './all-destinations.data.js';

import { Types } from 'mongoose';

type LeanAttraction = Attraction & { _id: Types.ObjectId };
type LeanHotel = Hotel & { _id: Types.ObjectId };
type LeanTransport = Transport & { _id: Types.ObjectId };

export interface SuggestedTripItem {
  readonly id: string;
  readonly title: string;
  readonly destination: string;
  readonly country: string;
  readonly countryKey: string;
  readonly countryFlag: string;
  readonly durationText: string;
  readonly daysCount: number;
  readonly category: string;
  readonly categoryLabel: string;
  readonly startingPrice: number;
  readonly imageUrl: string;
  readonly rating: number;
  readonly reviewsCount: number;
  readonly highlights: readonly string[];
}

import { SuggestedTrip, SuggestedTripDocument } from './schemas/suggested-trip.schema.js';

@Injectable()
export class DestinationsService implements OnModuleInit {
  constructor(
    @InjectModel(Destination.name)
    private readonly destinationModel: Model<DestinationDocument>,
    @InjectModel(Attraction.name)
    private readonly attractionModel: Model<AttractionDocument>,
    @InjectModel(Hotel.name)
    private readonly hotelModel: Model<HotelDocument>,
    @InjectModel(Transport.name)
    private readonly transportModel: Model<TransportDocument>,
    @InjectModel(SuggestedTrip.name)
    private readonly tripModel: Model<SuggestedTripDocument>,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.seedAllDestinations();
  }

  async findAll(query?: { countryKey?: string; popular?: boolean }): Promise<Destination[] | SeedDestinationCity[]> {
    const filter: Record<string, string | boolean> = {};
    if (query?.countryKey) filter.countryKey = query.countryKey;
    if (query?.popular !== undefined) filter.popular = query.popular;

    const docs = await this.destinationModel.find(filter).lean<Destination[]>().exec();
    if (docs.length === 0) {
      // Graceful fallback from in-memory seed catalog
      return ALL_DESTINATIONS.filter((d) => {
        if (query?.countryKey && d.countryKey !== query.countryKey) return false;
        return true;
      });
    }
    return docs;
  }

  async findByKey(key: string): Promise<SeedDestinationCity> {
    const destination = await this.destinationModel.findOne({ key }).lean().exec();
    if (destination) {
      const [attractions, hotels, transports] = await Promise.all([
        this.attractionModel.find({ destinationKey: key }).lean().exec(),
        this.hotelModel.find({ destinationKey: key }).lean().exec(),
        this.transportModel.find({ destinationKey: key }).lean().exec(),
      ]);

      // Defensive deduplication to guarantee strictly unique items
      const uniqueTransports = Array.from(
        new Map((transports as LeanTransport[]).map((t) => [t.type || t.title, t])).values()
      );
      const uniqueHotels = Array.from(
        new Map((hotels as LeanHotel[]).map((h) => [h.starRating ?? h.name, h])).values()
      );
      const uniqueAttractions = Array.from(
        new Map((attractions as LeanAttraction[]).map((a) => [a.name, a])).values()
      );

      return {
        key: destination.key,
        name: destination.name,
        country: destination.country,
        countryKey: destination.countryKey,
        flag: destination.flag,
        tag: destination.tag,
        description: destination.description,
        attractions: uniqueAttractions.map((a) => ({
          ...a,
          id: a._id.toString(),
        })),
        hotels: uniqueHotels.map((h) => ({
          ...h,
          id: h._id.toString(),
        })),
        transports: uniqueTransports.map((t) => ({
          ...t,
          id: t._id.toString(),
        })),
      };
    }

    // Fallback to static seed data if not found in db
    const seed = ALL_DESTINATIONS.find((c) => c.key === key);
    if (seed) {
      return seed;
    }

    throw new NotFoundException(`'${key}' аяллын чиглэл олдсонгүй.`);
  }

  async getSuggestedTrips(): Promise<SuggestedTripItem[]> {
    const docs = await this.tripModel.find({ isActive: true }).lean().exec();
    if (docs.length > 0) {
      return docs.map((d) => ({
        id: d.slug,
        title: d.title,
        destination: d.destination,
        country: d.country,
        countryKey: d.countryKey,
        countryFlag: d.countryFlag,
        durationText: d.durationText,
        daysCount: d.daysCount,
        category: d.category,
        categoryLabel: d.categoryLabel,
        startingPrice: d.startingPrice,
        imageUrl: d.imageUrl,
        rating: d.rating,
        reviewsCount: d.reviewsCount,
        highlights: d.highlights,
      }));
    }

    return [
      {
        id: 'trip-beijing',
        title: 'Бээжин хотын аяллын хөтөлбөр',
        destination: 'Бээжин хот, Хятад',
        country: 'Хятад',
        countryKey: 'china',
        countryFlag: '🇨🇳',
        durationText: '3 – 10 өдөр',
        daysCount: 5,
        category: 'historical',
        categoryLabel: 'Бэлэн төлөвлөгөө',
        startingPrice: 849460,
        imageUrl: '/images/attractions/bj-att-01/1.jpg',
        rating: 4.9,
        reviewsCount: 184,
        highlights: [
          'Цагаан хэрэм (Мутяньюй кабель зам & чарга)',
          'Хориотой хот (Хааны ордны музей)',
          'Юниверсал Студио Бээжин бүрэн өдөр',
          'Буудал, тээвэр, хоногоо өөртөө тохируулах боломжтой',
        ],
      },
    ];
  }

  private async seedAllDestinations(): Promise<void> {
    // Delete non-Beijing records to strictly keep Beijing
    await this.destinationModel.deleteMany({ key: { $ne: 'beijing' } }).exec();
    await this.attractionModel.deleteMany({}).exec();
    await this.hotelModel.deleteMany({}).exec();
    await this.transportModel.deleteMany({}).exec();

    for (const city of ALL_DESTINATIONS) {
      let destDoc = await this.destinationModel.findOne({ key: city.key }).exec();
      if (!destDoc) {
        destDoc = await this.destinationModel.create({
          key: city.key,
          name: city.name,
          country: city.country,
          countryKey: city.countryKey,
          flag: city.flag,
          tag: city.tag,
          description: city.description ?? `${city.name} аяллын бүрэн хөтөлбөр`,
          imageUrl: city.attractions[0]?.imageUrl ?? 'https://images.unsplash.com/photo-1508804185872-d7badad00f7d',
          popular: true,
        });
      } else {
        destDoc.name = city.name;
        destDoc.tag = city.tag;
        destDoc.description = city.description ?? destDoc.description;
        destDoc.imageUrl = city.attractions[0]?.imageUrl ?? destDoc.imageUrl;
        await destDoc.save();
      }

      const destinationId = destDoc._id;

      // Clean existing records for this specific city before re-inserting
      await this.attractionModel.deleteMany({ destinationKey: city.key }).exec();
      await this.hotelModel.deleteMany({ destinationKey: city.key }).exec();
      await this.transportModel.deleteMany({ destinationKey: city.key }).exec();

      await this.attractionModel.insertMany(
        city.attractions.map((a) => ({
          destinationId,
          destinationKey: city.key,
          name: a.name,
          nameEn: a.nameEn,
          description: a.description,
          category: a.category,
          region: a.region ?? city.name,
          estimatedCost: a.estimatedCost,
          estimatedHours: a.estimatedHours,
          imageUrl: a.imageUrl,
          images: a.images ?? (a.imageUrl ? [a.imageUrl] : []),
          rating: a.rating,
          highlights: a.highlights ?? [],
        })),
      );

      await this.hotelModel.insertMany(
        city.hotels.map((h) => ({
          destinationId,
          destinationKey: city.key,
          name: h.name,
          starRating: h.starRating,
          pricePerNight: h.pricePerNight,
          imageUrl: h.imageUrl,
          locationDesc: h.locationDesc,
          amenities: h.amenities ?? [],
          badge: h.badge,
        })),
      );

      await this.transportModel.insertMany(
        city.transports.map((t) => ({
          destinationId,
          destinationKey: city.key,
          type: (t.type as TransportType) ?? TransportType.FLIGHT,
          title: t.title,
          durationText: t.durationText,
          pricePerPerson: t.pricePerPerson,
          description: t.description,
          badge: t.badge,
          provider: t.provider,
          departureFrom: t.departureFrom,
          arrivalAt: t.arrivalAt,
          features: t.features ?? [],
        })),
      );
    }
  }
}
