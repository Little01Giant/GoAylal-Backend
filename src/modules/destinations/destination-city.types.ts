export interface SeedAttraction {
  rank?: number;
  id: string;
  name: string;
  nameEn?: string;
  category: string;
  region?: string;
  estimatedCost: number;
  estimatedHours: number;
  imageUrl: string;
  images?: string[];
  rating: number;
  highlights: string[];
  description: string;
  /** Trip.com page the price was read from; kept internal so prices can be refreshed later. */
  sourceUrl?: string;
  /** YYYY-MM-DD the price was last checked on sourceUrl. */
  priceCheckedAt?: string;
}

export interface SeedHotel {
  id: string;
  name: string;
  starRating: number;
  pricePerNight: number;
  imageUrl: string;
  locationDesc: string;
  amenities: string[];
  badge?: string;
  sourceUrl?: string;
  priceCheckedAt?: string;
}

export interface SeedTransport {
  id: string;
  type: 'flight' | 'combined' | 'overland';
  title: string;
  durationText: string;
  pricePerPerson: number;
  description?: string;
  badge?: string;
  provider?: string;
  departureFrom?: string;
  arrivalAt?: string;
  features?: string[];
  sourceUrl?: string;
  priceCheckedAt?: string;
}

export interface SeedDestinationCity {
  key: string;
  name: string;
  country: string;
  countryKey: string;
  flag: string;
  tag: string;
  description?: string;
  attractions: SeedAttraction[];
  hotels: SeedHotel[];
  transports: SeedTransport[];
}
