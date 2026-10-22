import { Injectable, Logger, NotFoundException, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ConfigService } from '@nestjs/config';
import { Document, Model, Types } from 'mongoose';
import { Destination, DestinationDocument } from './schemas/destination.schema.js';
import { Attraction, AttractionDocument } from './schemas/attraction.schema.js';
import { Hotel, HotelDocument } from './schemas/hotel.schema.js';
import { Transport, TransportDocument, TransportType } from './schemas/transport.schema.js';
import { SuggestedTrip, SuggestedTripDocument } from './schemas/suggested-trip.schema.js';
import { ALL_DESTINATIONS, SeedDestinationCity } from './all-destinations.data.js';

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

@Injectable()
export class DestinationsService implements OnModuleInit {
  private readonly logger = new Logger(DestinationsService.name);

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
    private readonly configService: ConfigService,
  ) {}

  async onModuleInit(): Promise<void> {
    if (this.configService.get<boolean>('seed.onBoot') === true) {
      await this.seedCatalog();
    }
  }

  async findAll(query?: { countryKey?: string; popular?: boolean }): Promise<Destination[] | SeedDestinationCity[]> {
    const filter: Record<string, string | boolean> = {};
    if (query?.countryKey) filter.countryKey = query.countryKey;
    if (query?.popular !== undefined) filter.popular = query.popular;

    const docs = await this.destinationModel.find(filter).lean<Destination[]>().exec();
    if (docs.length === 0) {
      // Graceful fallback from the in-memory seed catalog
      return ALL_DESTINATIONS.filter((d) => !query?.countryKey || d.countryKey === query.countryKey);
    }
    return docs;
  }

  async findByKey(key: string): Promise<SeedDestinationCity> {
    const destination = await this.destinationModel.findOne({ key }).lean().exec();
    if (destination) {
      const [attractions, hotels, transports] = await Promise.all([
        this.attractionModel.find({ destinationKey: key }).sort({ rank: 1, _id: 1 }).lean().exec(),
        this.hotelModel.find({ destinationKey: key }).lean().exec(),
        this.transportModel.find({ destinationKey: key }).lean().exec(),
      ]);

      return {
        key: destination.key,
        name: destination.name,
        country: destination.country,
        countryKey: destination.countryKey,
        flag: destination.flag,
        tag: destination.tag,
        description: destination.description,
        attractions: (attractions as LeanAttraction[]).map((a) => ({ ...a, id: a._id.toString() })),
        hotels: (hotels as LeanHotel[]).map((h) => ({ ...h, id: h._id.toString() })),
        transports: (transports as LeanTransport[]).map((t) => ({ ...t, id: t._id.toString() })),
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
      {
        id: 'trip-shanghai',
        title: 'Шанхай хотын аяллын хөтөлбөр',
        destination: 'Шанхай хот, Хятад',
        country: 'Хятад',
        countryKey: 'china',
        countryFlag: '🇨🇳',
        durationText: '3 – 10 өдөр',
        daysCount: 5,
        category: 'city',
        categoryLabel: 'Бэлэн төлөвлөгөө',
        startingPrice: 2163000,
        imageUrl: 'https://pub-83fca96d5b9048f795fabbfcdabba275.r2.dev/attractions/sh-att-02/1.webp',
        rating: 4.8,
        reviewsCount: 0,
        highlights: [
          'Вайтань далан',
          'Диснейн амралтын газар',
          'Шанхайн цамхаг',
          'Буудал, тээвэр, хоногоо өөртөө тохируулах боломжтой',
        ],
      },
    ];
  }

  /**
   * Idempotent, non-destructive catalog sync: every seed row is upserted by (destinationKey, seedId),
   * so database ids stay stable across runs and saved itineraries keep pointing at real attractions.
   * Rows created by the old delete-and-reinsert seed (no seedId) are adopted by name, never duplicated.
   */
  async seedCatalog(): Promise<void> {
    for (const city of ALL_DESTINATIONS) {
      await this.upsertCity(city);
    }
    this.logger.log(`Catalog synced: ${ALL_DESTINATIONS.length} destinations`);
  }

  /**
   * Adds or updates one city with its attractions, hotels and transports, keyed by (destinationKey, item id).
   * Items missing from `city` are left untouched, so saved itineraries keep pointing at real rows.
   * Shared by the seed script and the admin API, so a city can live in the database without a code change.
   */
  async upsertCity(city: SeedDestinationCity, options: { popular?: boolean } = {}): Promise<void> {
    const firstAttraction = [...city.attractions].sort((a, b) => (a.rank ?? 0) - (b.rank ?? 0))[0];
    const destination = await this.destinationModel
      .findOneAndUpdate(
        { key: city.key },
        {
          $set: {
            name: city.name,
            country: city.country,
            countryKey: city.countryKey,
            flag: city.flag,
            tag: city.tag,
            description: city.description ?? `${city.name} аяллын бүрэн хөтөлбөр`,
            imageUrl: firstAttraction?.imageUrl,
            ...(options.popular === undefined ? {} : { popular: options.popular }),
          },
          ...(options.popular === undefined ? { $setOnInsert: { popular: true } } : {}),
        },
        { upsert: true, returnDocument: 'after' },
      )
      .exec();
    const base = { destinationId: destination._id, destinationKey: city.key };

    for (const a of city.attractions) {
      await this.upsertSeeded(this.attractionModel, city.key, a.id, 'name', a.name, {
        ...base,
        rank: a.rank,
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
      });
    }
    for (const h of city.hotels) {
      await this.upsertSeeded(this.hotelModel, city.key, h.id, 'name', h.name, {
        ...base,
        name: h.name,
        starRating: h.starRating,
        pricePerNight: h.pricePerNight,
        imageUrl: h.imageUrl,
        locationDesc: h.locationDesc,
        amenities: h.amenities ?? [],
        badge: h.badge,
      });
    }
    for (const t of city.transports) {
      await this.upsertSeeded(this.transportModel, city.key, t.id, 'title', t.title, {
        ...base,
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
      });
    }
  }

  async listCatalog(): Promise<
    { key: string; name: string; popular: boolean; attractions: number; hotels: number; transports: number }[]
  > {
    const destinations = await this.destinationModel.find().sort({ createdAt: 1 }).lean().exec();
    return Promise.all(
      destinations.map(async (d) => {
        const [attractions, hotels, transports] = await Promise.all([
          this.attractionModel.countDocuments({ destinationKey: d.key }),
          this.hotelModel.countDocuments({ destinationKey: d.key }),
          this.transportModel.countDocuments({ destinationKey: d.key }),
        ]);
        return { key: d.key, name: d.name, popular: d.popular, attractions, hotels, transports };
      }),
    );
  }

  private async upsertSeeded<T extends Document & { seedId?: string }>(
    model: Model<T>,
    destinationKey: string,
    seedId: string,
    legacyField: 'name' | 'title',
    legacyValue: string,
    fields: Record<string, unknown>,
  ): Promise<void> {
    const existing =
      (await model.findOne({ destinationKey, seedId } as Record<string, unknown>).exec()) ??
      (await model
        .findOne({ destinationKey, seedId: { $exists: false }, [legacyField]: legacyValue } as Record<string, unknown>)
        .exec());
    if (existing) {
      existing.set({ ...fields, seedId });
      await existing.save();
    } else {
      await new model({ ...fields, seedId }).save();
    }
  }
}
