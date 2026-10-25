import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Document, Model, Types } from 'mongoose';
import { Destination, DestinationDocument } from './schemas/destination.schema.js';
import { Attraction, AttractionDocument } from './schemas/attraction.schema.js';
import { Hotel, HotelDocument } from './schemas/hotel.schema.js';
import { Transport, TransportDocument, TransportType } from './schemas/transport.schema.js';
import { SuggestedTrip, SuggestedTripDocument } from './schemas/suggested-trip.schema.js';
import type { SeedDestinationCity } from './destination-city.types.js';

type LeanAttraction = Attraction & { _id: Types.ObjectId };
type LeanHotel = Hotel & { _id: Types.ObjectId };
type LeanTransport = Transport & { _id: Types.ObjectId };

interface PriceSource {
  sourceUrl?: string;
  priceCheckedAt?: string;
}

/** The Trip.com source of a price is internal bookkeeping for price refreshes; it never leaves the API. */
function withoutPriceSource<T extends PriceSource>({ sourceUrl: _url, priceCheckedAt: _checked, ...rest }: T): Omit<T, keyof PriceSource> {
  return rest;
}

function publicCity(city: SeedDestinationCity): SeedDestinationCity {
  return {
    ...city,
    attractions: city.attractions.map(withoutPriceSource),
    hotels: city.hotels.map(withoutPriceSource),
    transports: city.transports.map(withoutPriceSource),
  };
}

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
export class DestinationsService {
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

  async findAll(query?: { countryKey?: string; popular?: boolean }): Promise<Destination[]> {
    const filter: Record<string, string | boolean> = {};
    if (query?.countryKey) filter.countryKey = query.countryKey;
    if (query?.popular !== undefined) filter.popular = query.popular;

    return this.destinationModel.find(filter).lean<Destination[]>().exec();
  }

  async findByKey(key: string): Promise<SeedDestinationCity> {
    const destination = await this.destinationModel.findOne({ key }).lean().exec();
    if (destination) {
      const [attractions, hotels, transports] = await Promise.all([
        this.attractionModel.find({ destinationKey: key }).sort({ rank: 1, _id: 1 }).lean().exec(),
        this.hotelModel.find({ destinationKey: key }).lean().exec(),
        this.transportModel.find({ destinationKey: key }).lean().exec(),
      ]);

      return publicCity({
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
      });
    }

    throw new NotFoundException(`'${key}' аяллын чиглэл олдсонгүй.`);
  }

  async getSuggestedTrips(): Promise<SuggestedTripItem[]> {
    const docs = await this.tripModel.find({ isActive: true }).lean().exec();
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

  /**
   * Adds or updates one city with its attractions, hotels and transports, keyed by (destinationKey, item id).
   * Items missing from `city` are left untouched, so saved itineraries keep pointing at real rows.
   * The admin API is the only way in, so a city lives in the database without a code change.
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
        sourceUrl: a.sourceUrl,
        priceCheckedAt: a.priceCheckedAt,
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
        sourceUrl: h.sourceUrl,
        priceCheckedAt: h.priceCheckedAt,
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
        sourceUrl: t.sourceUrl,
        priceCheckedAt: t.priceCheckedAt,
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
