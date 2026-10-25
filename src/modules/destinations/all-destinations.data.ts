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

export const ALL_DESTINATIONS: SeedDestinationCity[] = [
{
  "key": "beijing",
  "name": "Бээжин",
  "country": "Хятад",
  "countryKey": "china",
  "flag": "🇨🇳",
  "tag": "Түүх, Орчин үе & Шоппинг",
  "description": "Дэлхийн 7 гайхамшиг Цагаан хэрэм, Хориотой хот, Юниверсал Студио, эртний хаадын зуны ордон бүхий 20 шилдэг үзвэртэй түүхэн нийслэл.",
  "attractions": [
    {
        "rank": 1,
        "id": "bj-att-01",
        "sourceUrl": "https://www.trip.com/travel-guide/attraction/beijing/badaling-great-wall-75596?curr=MNT&locale=en-XX&poiType=3&scene=ticket",
        "name": "Цагаан хэрэм (Бадалин хэсэг)",
        "nameEn": "Badaling Great Wall",
        "category": "historical",
        "region": "Yanqing, Beijing",
        "estimatedCost": 20000,
        "estimatedHours": 5,
        "imageUrl": "https://pub-83fca96d5b9048f795fabbfcdabba275.r2.dev/attractions/bj-att-01/1.webp",
        "images": [
            "https://pub-83fca96d5b9048f795fabbfcdabba275.r2.dev/attractions/bj-att-01/1.webp",
            "https://pub-83fca96d5b9048f795fabbfcdabba275.r2.dev/attractions/bj-att-01/2.webp",
            "https://pub-83fca96d5b9048f795fabbfcdabba275.r2.dev/attractions/bj-att-01/3.webp"
        ],
        "rating": 4.9,
        "highlights": [
            "Мин гүрний сүрлэг цайз ба цамхаг",
            "Уулын нуруу дамжсан аварга хэрэм",
            "Бээжингээс хурдан галт тэргээр шууд очих",
            "Дэлхийн 7 гайхамшгийн хамгийн алдартай хэсэг"
        ],
        "description": "Дэлхийн 7 гайхамшгийн хамгийн их алдаршсан түүхэн хэсэг. Мин гүрний эртний цайз хэрэм дагуу панорама үзэмжтэй."
    },
    {
        "rank": 2,
        "id": "bj-att-02",
        "sourceUrl": "https://www.trip.com/travel-guide/attraction/beijing/the-palace-museum-75595?curr=MNT&locale=en-XX&poiType=3&scene=ticket",
        "name": "Хориотой хот (Хааны ордны музей)",
        "nameEn": "Forbidden City (Palace Museum)",
        "category": "historical",
        "region": "Dongcheng, Beijing",
        "estimatedCost": 30000,
        "estimatedHours": 4,
        "imageUrl": "https://pub-83fca96d5b9048f795fabbfcdabba275.r2.dev/attractions/bj-att-02/1.webp",
        "images": [
            "https://pub-83fca96d5b9048f795fabbfcdabba275.r2.dev/attractions/bj-att-02/1.webp",
            "https://pub-83fca96d5b9048f795fabbfcdabba275.r2.dev/attractions/bj-att-02/2.webp",
            "https://pub-83fca96d5b9048f795fabbfcdabba275.r2.dev/attractions/bj-att-02/3.webp"
        ],
        "rating": 4.9,
        "highlights": [
            "Мин ба Чин гүрний 24 хааны ордон",
            "9999 өрөө тасалгаа",
            "Хаш эрдэнэсийн сан",
            "Тяньаньмэний талбайтай залгаа"
        ],
        "description": "Дэлхийн хамгийн том модон хийцтэй хааны ордны цогцолбор. 500 гаруй жил хаадын төв ордон байсан түүхийн өлгий."
    },
    {
        "rank": 3,
        "id": "bj-att-03",
        "sourceUrl": "https://www.trip.com/travel-guide/attraction/beijing/tiananmen-square-75594?curr=MNT&locale=en-XX&poiType=3&scene=ticket",
        "name": "Тяньаньмэний талбай",
        "nameEn": "Tiananmen Square",
        "category": "historical",
        "region": "Dongcheng, Beijing",
        "estimatedCost": 0,
        "estimatedHours": 1.5,
        "imageUrl": "https://pub-83fca96d5b9048f795fabbfcdabba275.r2.dev/attractions/bj-att-03/1.webp",
        "images": [
            "https://pub-83fca96d5b9048f795fabbfcdabba275.r2.dev/attractions/bj-att-03/1.webp",
            "https://pub-83fca96d5b9048f795fabbfcdabba275.r2.dev/attractions/bj-att-03/2.webp",
            "https://pub-83fca96d5b9048f795fabbfcdabba275.r2.dev/attractions/bj-att-03/3.webp"
        ],
        "rating": 4.8,
        "highlights": [
            "Төрийн далбаа мандуулах ёслол",
            "Тяньаньмэний түүхэн улаан хаалга",
            "Дэлхийн хамгийн том нийтийн талбай",
            "Хориотой хотын өмнөд үүд"
        ],
        "description": "Дэлхийн хамгийн том хотын төв талбай. Түүхэн Тяньаньмэний хаалга, Ардын их хурал, дурсгалын хөшөө бүхий нийслэлийн зүрх."
    },
    {
        "rank": 4,
        "id": "bj-att-04",
        "sourceUrl": "https://www.trip.com/travel-guide/attraction/beijing/universal-beijing-resort-31677717?curr=MNT&locale=en-XX&poiType=3&scene=ticket",
        "name": "Юниверсал Студио Бээжин",
        "nameEn": "Universal Beijing Resort",
        "category": "adventure",
        "region": "Tongzhou, Beijing",
        "estimatedCost": 173467,
        "estimatedHours": 7.5,
        "imageUrl": "https://pub-83fca96d5b9048f795fabbfcdabba275.r2.dev/attractions/bj-att-04/1.webp",
        "images": [
            "https://pub-83fca96d5b9048f795fabbfcdabba275.r2.dev/attractions/bj-att-04/1.webp",
            "https://pub-83fca96d5b9048f795fabbfcdabba275.r2.dev/attractions/bj-att-04/2.webp",
            "https://pub-83fca96d5b9048f795fabbfcdabba275.r2.dev/attractions/bj-att-04/3.webp"
        ],
        "rating": 4.9,
        "highlights": [
            "Харри Поттерын шидэт ертөнц",
            "Трансформерсын галзуу хулгана",
            "Кунг-Фу Пандагийн усан хотхон",
            "Юрийн галавын үлэг гүрвэлийн ертөнц"
        ],
        "description": "Дэлхийн хамгийн том Юниверсал сэдэвт паркуудын нэг. Монгол гэр бүл, залуусын заавал очих дуртай хамгийн өндөр сэтгэгдэлтэй парк."
    },
    {
        "rank": 5,
        "id": "bj-att-05",
        "sourceUrl": "https://www.trip.com/travel-guide/attraction/beijing/summer-palace-75597?curr=MNT&locale=en-XX&poiType=3&scene=ticket",
        "name": "Зуны ордон (Ишэюань)",
        "nameEn": "Summer Palace",
        "category": "nature",
        "region": "Haidian, Beijing",
        "estimatedCost": 15000,
        "estimatedHours": 3.5,
        "imageUrl": "https://pub-83fca96d5b9048f795fabbfcdabba275.r2.dev/attractions/bj-att-05/1.webp",
        "images": [
            "https://pub-83fca96d5b9048f795fabbfcdabba275.r2.dev/attractions/bj-att-05/1.webp",
            "https://pub-83fca96d5b9048f795fabbfcdabba275.r2.dev/attractions/bj-att-05/2.webp",
            "https://pub-83fca96d5b9048f795fabbfcdabba275.r2.dev/attractions/bj-att-05/3.webp"
        ],
        "rating": 4.8,
        "highlights": [
            "Күнмин нууранд завиар зугаалах",
            "728 метр урт уран зургийн саравч",
            "Гантиг чулуун завины баримал",
            "Цэцэрлэгт хүрээлэнгийн зохицол"
        ],
        "description": "Хаадын зуны амралтын гайхамшигт хүрээлэн. Күнмин хиймэл нуур болон Урт коридорын дэлхийн дээд амжилтыг тогтоосон уран зурагтай."
    },
    {
        "rank": 6,
        "id": "bj-att-06",
        "sourceUrl": "https://www.trip.com/travel-guide/attraction/beijing/temple-of-heaven-75599?curr=MNT&locale=en-XX&poiType=3&scene=ticket",
        "name": "Тэнгэрийн сүм (Тяньтань)",
        "nameEn": "Temple of Heaven",
        "category": "cultural",
        "region": "Dongcheng, Beijing",
        "estimatedCost": 7500,
        "estimatedHours": 2.5,
        "imageUrl": "https://pub-83fca96d5b9048f795fabbfcdabba275.r2.dev/attractions/bj-att-06/1.webp",
        "images": [
            "https://pub-83fca96d5b9048f795fabbfcdabba275.r2.dev/attractions/bj-att-06/1.webp",
            "https://pub-83fca96d5b9048f795fabbfcdabba275.r2.dev/attractions/bj-att-06/2.webp",
            "https://pub-83fca96d5b9048f795fabbfcdabba275.r2.dev/attractions/bj-att-06/3.webp"
        ],
        "rating": 4.8,
        "highlights": [
            "Арвин ургацын залбирлын танхим",
            "Цуурайтах хана (Echo Wall)",
            "Хумхын чулуун тавцан",
            "Өглөөний тай-чи дасгалтай паркийн орчин"
        ],
        "description": "Хаад тэнгэрт тайлга үйлдэж, арвин их ургац гуйн залбирдаг байсан өвөрмөц дугуй цэнхэр дээвэрт уран барилгын сувд."
    },
    {
        "rank": 7,
        "id": "bj-att-07",
        "sourceUrl": "https://www.trip.com/travel-guide/attraction/beijing/beijing-zoo-76612?curr=MNT&locale=en-XX&poiType=3&scene=ticket",
        "name": "Бээжингийн амьтны хүрээлэн & Пандагийн байшин",
        "nameEn": "Beijing Zoo & Giant Panda Pavilion",
        "category": "nature",
        "region": "Xicheng, Beijing",
        "estimatedCost": 9500,
        "estimatedHours": 3,
        "imageUrl": "https://pub-83fca96d5b9048f795fabbfcdabba275.r2.dev/attractions/bj-att-07/1.webp",
        "images": [
            "https://pub-83fca96d5b9048f795fabbfcdabba275.r2.dev/attractions/bj-att-07/1.webp",
            "https://pub-83fca96d5b9048f795fabbfcdabba275.r2.dev/attractions/bj-att-07/2.webp",
            "https://pub-83fca96d5b9048f795fabbfcdabba275.r2.dev/attractions/bj-att-07/3.webp"
        ],
        "rating": 4.7,
        "highlights": [
            "Хулсны бамбарууш пандаг амьдаар нь харах",
            "Хятадын хамгийн эртний амьтны хүрээлэн",
            "Азийн заан ба ховор ан амьтад",
            "Хүүхдэд маш сонирхолтой"
        ],
        "description": "Хятадын үндэсний бахархал аварга пандаг ойроос харж хооллох агшныг үзэх боломжтой 100 гаруй жилийн түүхтэй хүрээлэн."
    },
    {
        "rank": 8,
        "id": "bj-att-08",
        "sourceUrl": "https://www.trip.com/travel-guide/attraction/beijing/beijing-happy-valley-86171?curr=MNT&locale=en-XX&poiType=3&scene=ticket",
        "name": "Бээжингийн Хэппи Валли тоглоомын хүрээлэн",
        "nameEn": "Beijing Happy Valley",
        "category": "adventure",
        "region": "Chaoyang, Beijing",
        "estimatedCost": 105000,
        "estimatedHours": 6,
        "imageUrl": "https://pub-83fca96d5b9048f795fabbfcdabba275.r2.dev/attractions/bj-att-08/1.webp",
        "images": [
            "https://pub-83fca96d5b9048f795fabbfcdabba275.r2.dev/attractions/bj-att-08/1.webp",
            "https://pub-83fca96d5b9048f795fabbfcdabba275.r2.dev/attractions/bj-att-08/2.webp",
            "https://pub-83fca96d5b9048f795fabbfcdabba275.r2.dev/attractions/bj-att-08/3.webp"
        ],
        "rating": 4.7,
        "highlights": [
            "Хурдны олон төрлийн галзуу хулганууд",
            "Усан гулсуур бүхий адал явдал",
            "Атлантис ба Эртний Майя сэдэвт хэсгүүд",
            "Гэр бүлээрээ бүтэн өдөр зугаацах"
        ],
        "description": "Бээжингийн хамгийн том адреналин ялгаруулах галзуу хулганууд, сонирхолтой тоглоомуудтай үндэсний сэдэвт цэцэрлэгт хүрээлэн."
    },
    {
        "rank": 9,
        "id": "bj-att-09",
        "sourceUrl": "https://www.trip.com/travel-guide/attraction/beijing/beijing-aquarium-84619?curr=MNT&locale=en-XX&poiType=3&scene=ticket",
        "name": "Бээжингийн далайн аквариум",
        "nameEn": "Beijing Aquarium",
        "category": "nature",
        "region": "Haidian, Beijing",
        "estimatedCost": 88000,
        "estimatedHours": 3,
        "imageUrl": "https://pub-83fca96d5b9048f795fabbfcdabba275.r2.dev/attractions/bj-att-09/1.webp",
        "images": [
            "https://pub-83fca96d5b9048f795fabbfcdabba275.r2.dev/attractions/bj-att-09/1.webp",
            "https://pub-83fca96d5b9048f795fabbfcdabba275.r2.dev/attractions/bj-att-09/2.webp",
            "https://pub-83fca96d5b9048f795fabbfcdabba275.r2.dev/attractions/bj-att-09/3.webp"
        ],
        "rating": 4.7,
        "highlights": [
            "Аварга загас, далайн хав, дельфин",
            "Далайн амьтдын акробат үзүүлбэр",
            "Усан доорх шилэн хонгил",
            "Дотроо битүү дээвэртэй хамгийн том аквариум"
        ],
        "description": "Дэлхийн хамгийн том хуурай газрын битүү аквариумуудын нэг. Далайн гүний мянга мянган ховор загас, дельфиний тоглолтыг сонирхох боломжтой."
    },
    {
        "rank": 10,
        "id": "bj-att-10",
        "sourceUrl": "https://www.trip.com/travel-guide/attraction/beijing/water-cube-10559020?curr=MNT&locale=en-XX&poiType=3&scene=ticket",
        "name": "Олимпын Усны куб (Үндэсний усан спортын төв)",
        "nameEn": "Water Cube (National Aquatics Center)",
        "category": "city",
        "region": "Chaoyang, Beijing",
        "estimatedCost": 15000,
        "estimatedHours": 2,
        "imageUrl": "https://pub-83fca96d5b9048f795fabbfcdabba275.r2.dev/attractions/bj-att-10/1.webp",
        "images": [
            "https://pub-83fca96d5b9048f795fabbfcdabba275.r2.dev/attractions/bj-att-10/1.webp",
            "https://pub-83fca96d5b9048f795fabbfcdabba275.r2.dev/attractions/bj-att-10/2.webp",
            "https://pub-83fca96d5b9048f795fabbfcdabba275.r2.dev/attractions/bj-att-10/3.webp"
        ],
        "rating": 4.7,
        "highlights": [
            "Бөмбөлөг хөөсөн өвөрмөц гадна хийц",
            "Олимпын усан сан ба дотоод орчин",
            "Оройн LED гэрлэн архитектур",
            "Шувууны үүр цэнгэлдэхтэй зэрэгцээ"
        ],
        "description": "2008 оны олимпын домогт Усны куб ордон. Бөмбөлөг хөөсөн өвөрмөц архитектур болон оройн гайхамшигт гэрэлтүүлэгтэй дэлхийн барилга."
    },
    {
        "rank": 11,
        "id": "bj-att-11",
        "sourceUrl": "https://www.trip.com/travel-guide/attraction/beijing/happy-magic-water-cube-100544?curr=MNT&locale=en-XX&poiType=3&scene=ticket",
        "name": "Хэппи Мэжик усан парк",
        "nameEn": "Happy Magic Water Cube",
        "category": "adventure",
        "region": "Fengtai, Beijing",
        "estimatedCost": 98000,
        "estimatedHours": 4,
        "imageUrl": "https://pub-83fca96d5b9048f795fabbfcdabba275.r2.dev/attractions/bj-att-11/1.webp",
        "images": [
            "https://pub-83fca96d5b9048f795fabbfcdabba275.r2.dev/attractions/bj-att-11/1.webp",
            "https://pub-83fca96d5b9048f795fabbfcdabba275.r2.dev/attractions/bj-att-11/2.webp",
            "https://pub-83fca96d5b9048f795fabbfcdabba275.r2.dev/attractions/bj-att-11/3.webp"
        ],
        "rating": 4.7,
        "highlights": [
            "Хар шуурганы аварга усан гулсуур",
            "Цунами давалгаат асар том усан сан",
            "Гэр бүлийн усан хотхон ба наран шарлагын хэсэг",
            "Зуны халуунд сэрүүцэх хамгийн шилдэг цэг"
        ],
        "description": "Бээжингийн хамгийн том задгай болон битүү усан гулсуурууд, аварга давалгаат усан сантай адал явдалт усан парк."
    },
    {
        "rank": 12,
        "id": "bj-att-12",
        "sourceUrl": "https://www.trip.com/travel-guide/attraction/beijing/pop-land-136653497?curr=MNT&locale=en-XX&poiType=3&scene=ticket",
        "name": "Поп Март сэдэвт парк (POP LAND Бээжин)",
        "nameEn": "POP LAND Beijing",
        "category": "adventure",
        "region": "Chaoyang, Beijing",
        "estimatedCost": 49000,
        "estimatedHours": 3.5,
        "imageUrl": "https://pub-83fca96d5b9048f795fabbfcdabba275.r2.dev/attractions/bj-att-12/1.webp",
        "images": [
            "https://pub-83fca96d5b9048f795fabbfcdabba275.r2.dev/attractions/bj-att-12/1.webp",
            "https://pub-83fca96d5b9048f795fabbfcdabba275.r2.dev/attractions/bj-att-12/2.webp",
            "https://pub-83fca96d5b9048f795fabbfcdabba275.r2.dev/attractions/bj-att-12/3.webp"
        ],
        "rating": 4.8,
        "highlights": [
            "Лабубу, Молли, Диму дүрүүдийн шидэт цайз",
            "Зураг авахуулахад хамгийн тохиромжтой инстолляциуд",
            "Поп Март тусгай хязгаарлагдмал цуглуулгууд",
            "Залуус, хүүхдүүдийн хамгийн тренд парк"
        ],
        "description": "Дэлхийд алдартай Pop Mart тоглоомын Молли, Лабубу дүрүүдийн шидэт ертөнц бүхий Чаоян парк доторх орчин үеийн сэдэвт парк."
    },
    {
        "rank": 13,
        "id": "bj-att-13",
        "sourceUrl": "https://www.trip.com/travel-guide/attraction/beijing/chaoyang-park-90782?curr=MNT&locale=en-XX&poiType=3&scene=ticket",
        "name": "Чаоян нарны парк (Sun Park)",
        "nameEn": "Sun Park (Chaoyang Park)",
        "category": "nature",
        "region": "Chaoyang, Beijing",
        "estimatedCost": 0,
        "estimatedHours": 2.5,
        "imageUrl": "https://pub-83fca96d5b9048f795fabbfcdabba275.r2.dev/attractions/bj-att-13/1.webp",
        "images": [
            "https://pub-83fca96d5b9048f795fabbfcdabba275.r2.dev/attractions/bj-att-13/1.webp",
            "https://pub-83fca96d5b9048f795fabbfcdabba275.r2.dev/attractions/bj-att-13/2.webp",
            "https://pub-83fca96d5b9048f795fabbfcdabba275.r2.dev/attractions/bj-att-13/3.webp"
        ],
        "rating": 4.7,
        "highlights": [
            "Төв нуурын завины тайван аялал",
            "Ногоон зүлэг, ой мод бүхий амралтын орчин",
            "POP LAND сэдэвт парктай залгаа",
            "Үнэ төлбөргүй нэвтрэх боломжтой нийтийн парк"
        ],
        "description": "Бээжин хотын төвийн хамгийн том ногоон цэцэрлэгт хүрээлэн. Нуурын эрэг дээр салхилах, дугуй унах, амарч тухлахад нэн таатай."
    },
    {
        "rank": 14,
        "id": "bj-att-14",
        "sourceUrl": "https://www.trip.com/travel-guide/attraction/beijing/jingshan-park-76610?curr=MNT&locale=en-XX&poiType=3&scene=ticket",
        "name": "Жиншань парк (Хориотой хотыг тольдох цэг)",
        "nameEn": "Jingshan Park",
        "category": "nature",
        "region": "Xicheng, Beijing",
        "estimatedCost": 1000,
        "estimatedHours": 1.5,
        "imageUrl": "https://pub-83fca96d5b9048f795fabbfcdabba275.r2.dev/attractions/bj-att-14/1.webp",
        "images": [
            "https://pub-83fca96d5b9048f795fabbfcdabba275.r2.dev/attractions/bj-att-14/1.webp",
            "https://pub-83fca96d5b9048f795fabbfcdabba275.r2.dev/attractions/bj-att-14/2.webp",
            "https://pub-83fca96d5b9048f795fabbfcdabba275.r2.dev/attractions/bj-att-14/3.webp"
        ],
        "rating": 4.9,
        "highlights": [
            "Хориотой хотыг дээрээс нь бүтэн харах панорама",
            "Бээжин хотын төв цэг",
            "Нар жаргах үеийн гайхамшигтай зураг",
            "Хямд бөгөөд хамгийн өндөр үнэ цэнтэй"
        ],
        "description": "Хориотой хотын шууд хойд талын хиймэл уул. Орой дээрх асарт гарч Хориотой хотын шар дээврүүдийг бүтнээр нь панорамаар тольдох шилдэг цэг."
    },
    {
        "rank": 15,
        "id": "bj-att-15",
        "sourceUrl": "https://www.trip.com/travel-guide/attraction/beijing/shichahai-scenic-area-100947?curr=MNT&locale=en-XX&poiType=3&scene=ticket",
        "name": "Шычахай нуурын бүс & Хутун",
        "nameEn": "Shichahai Scenic Area",
        "category": "cultural",
        "region": "Xicheng, Beijing",
        "estimatedCost": 0,
        "estimatedHours": 2.5,
        "imageUrl": "https://pub-83fca96d5b9048f795fabbfcdabba275.r2.dev/attractions/bj-att-15/1.webp",
        "images": [
            "https://pub-83fca96d5b9048f795fabbfcdabba275.r2.dev/attractions/bj-att-15/1.webp",
            "https://pub-83fca96d5b9048f795fabbfcdabba275.r2.dev/attractions/bj-att-15/2.webp",
            "https://pub-83fca96d5b9048f795fabbfcdabba275.r2.dev/attractions/bj-att-15/3.webp"
        ],
        "rating": 4.7,
        "highlights": [
            "Нуурын хөвөөний амьд хөгжимтэй кафенууд",
            "Уламжлалт хутун гудамжаар зугаалах",
            "Эртний гүүр ба романтик завины аялал",
            "Бээжин иргэдийн амьдралын хэв маяг"
        ],
        "description": "Эртний Бээжингийн 3 нуурын хөвөө болон хутун буюу нарийн гудамж, уламжлалт хашаа байшин, кафенуудтай үзэсгэлэнт түүхэн бүс."
    },
    {
        "rank": 16,
        "id": "bj-att-16",
        "sourceUrl": "https://www.trip.com/travel-guide/attraction/beijing/qianmen-street-90794?curr=MNT&locale=en-XX&poiType=3&scene=ticket",
        "name": "Цяньмэнь хуучны худалдааны гудамж",
        "nameEn": "Qianmen Street",
        "category": "culinary",
        "region": "Dongcheng, Beijing",
        "estimatedCost": 0,
        "estimatedHours": 2,
        "imageUrl": "https://pub-83fca96d5b9048f795fabbfcdabba275.r2.dev/attractions/bj-att-16/1.webp",
        "images": [
            "https://pub-83fca96d5b9048f795fabbfcdabba275.r2.dev/attractions/bj-att-16/1.webp",
            "https://pub-83fca96d5b9048f795fabbfcdabba275.r2.dev/attractions/bj-att-16/2.webp",
            "https://pub-83fca96d5b9048f795fabbfcdabba275.r2.dev/attractions/bj-att-16/3.webp"
        ],
        "rating": 4.7,
        "highlights": [
            "Эртний модон трамвайгаар явах",
            "600 жилийн түүхтэй уламжлалт дэлгүүрүүд",
            "Дашилань эртний гудамж ба бээжин нугас",
            "Тяньаньмэний урд байрлах өвөрмөц хаалга"
        ],
        "description": "Мин, Чин гүрний үеийн архитектур бүхий эртний худалдааны гудамж. Уламжлалт эмийн сан, торго, бээжин цай болон хоолны газруудтай."
    },
    {
        "rank": 17,
        "id": "bj-att-17",
        "sourceUrl": "https://www.trip.com/travel-guide/attraction/beijing/taikoo-li-sanlitun-18175563?curr=MNT&locale=en-XX&poiType=3&scene=ticket",
        "name": "Санлитун Taikoo Li",
        "nameEn": "Sanlitun Taikoo Li",
        "category": "city",
        "region": "Chaoyang, Beijing",
        "estimatedCost": 0,
        "estimatedHours": 2.5,
        "imageUrl": "https://pub-83fca96d5b9048f795fabbfcdabba275.r2.dev/attractions/bj-att-17/1.webp",
        "images": [
            "https://pub-83fca96d5b9048f795fabbfcdabba275.r2.dev/attractions/bj-att-17/1.webp",
            "https://pub-83fca96d5b9048f795fabbfcdabba275.r2.dev/attractions/bj-att-17/2.webp",
            "https://pub-83fca96d5b9048f795fabbfcdabba275.r2.dev/attractions/bj-att-17/3.webp"
        ],
        "rating": 4.8,
        "highlights": [
            "Орчин үеийн загварлаг архитектур",
            "Дэлхийн тэргүүлэгч брэнд дэлгүүрүүд",
            "Залуусын цугларах кофе шоп, баарууд",
            "Шөнийн амьдралын төв"
        ],
        "description": "Бээжингийн орчин үеийн соёл, загварын төв. Гадаадын элчин сайдын яамдын бүс дэх дэлхийн түвшний ресторан, дэлгүүрүүдийн бөөгнөрөл."
    },
    {
        "rank": 18,
        "id": "bj-att-18",
        "sourceUrl": "https://www.trip.com/travel-guide/attraction/beijing/beijing-auto-museum-90977?curr=MNT&locale=en-XX&poiType=3&scene=ticket",
        "name": "Бээжингийн авто музей",
        "nameEn": "Beijing Auto Museum",
        "category": "cultural",
        "region": "Fengtai, Beijing",
        "estimatedCost": 15000,
        "estimatedHours": 2.5,
        "imageUrl": "https://pub-83fca96d5b9048f795fabbfcdabba275.r2.dev/attractions/bj-att-18/1.webp",
        "images": [
            "https://pub-83fca96d5b9048f795fabbfcdabba275.r2.dev/attractions/bj-att-18/1.webp",
            "https://pub-83fca96d5b9048f795fabbfcdabba275.r2.dev/attractions/bj-att-18/2.webp",
            "https://pub-83fca96d5b9048f795fabbfcdabba275.r2.dev/attractions/bj-att-18/3.webp"
        ],
        "rating": 4.7,
        "highlights": [
            "Дэлхийн анхны тэрэг ба сонгодог машинууд",
            "Интерактив хөдөлгүүрийн туршилтын танхим",
            "Уралдааны симулятор тоглоомууд",
            "Машин сонирхогч хүүхэд залуусын диваажин"
        ],
        "description": "Дэлхийн болон Хятадын авто үйлдвэрлэлийн түүхийг харуулсан эртний сонгодог машинууд, концепт загваруудын гайхалтай музей."
    },
    {
        "rank": 19,
        "id": "bj-att-19",
        "sourceUrl": "https://www.trip.com/travel-guide/attraction/beijing/nanluogu-xiang-87891?curr=MNT&locale=en-XX&poiType=3&scene=ticket",
        "name": "Наньлуогүшян хуучны гудамж & Шөнийн аялал",
        "nameEn": "Nanluogu Xiang & Beijing Nightlife",
        "category": "cultural",
        "region": "Dongcheng, Beijing",
        "estimatedCost": 0,
        "estimatedHours": 2.5,
        "imageUrl": "https://pub-83fca96d5b9048f795fabbfcdabba275.r2.dev/attractions/bj-att-19/1.webp",
        "images": [
            "https://pub-83fca96d5b9048f795fabbfcdabba275.r2.dev/attractions/bj-att-19/1.webp",
            "https://pub-83fca96d5b9048f795fabbfcdabba275.r2.dev/attractions/bj-att-19/2.webp",
            "https://pub-83fca96d5b9048f795fabbfcdabba275.r2.dev/attractions/bj-att-19/3.webp"
        ],
        "rating": 4.8,
        "highlights": [
            "700 жилийн түүхтэй хутун гудамж",
            "Шөнийн гудамжны өвөрмөц амттан, хоол",
            "Бэлэг дурсгал, гар урлалын содон урлангууд",
            "Үдшийн амьд хөгжимтэй тухтай кафенууд"
        ],
        "description": "700 жилийн түүхтэй хутун гудамжны өвөрмөц гар урлал, шөнийн амтат гудамжны хоол, амьд баар, залуусын соёлын гол төв."
    },
    {
        "rank": 20,
        "id": "bj-att-20",
        "sourceUrl": "https://www.trip.com/travel-guide/attraction/beijing/wangfujing-10524169?curr=MNT&locale=en-XX&poiType=3&scene=ticket",
        "name": "Ванфүжин худалдааны гудамж",
        "nameEn": "Wangfujing Pedestrian Street",
        "category": "culinary",
        "region": "Dongcheng, Beijing",
        "estimatedCost": 0,
        "estimatedHours": 2.5,
        "imageUrl": "https://pub-83fca96d5b9048f795fabbfcdabba275.r2.dev/attractions/bj-att-20/1.webp",
        "images": [
            "https://pub-83fca96d5b9048f795fabbfcdabba275.r2.dev/attractions/bj-att-20/1.webp",
            "https://pub-83fca96d5b9048f795fabbfcdabba275.r2.dev/attractions/bj-att-20/2.webp",
            "https://pub-83fca96d5b9048f795fabbfcdabba275.r2.dev/attractions/bj-att-20/3.webp"
        ],
        "rating": 4.7,
        "highlights": [
            "Бээжин нугас (Quanjude) зооглох",
            "Худалдааны томоохон их дэлгүүрүүд",
            "Шөнийн гудамжны содон хоол, амттан",
            "Бэлэг дурсгал, брэндийн сонголтууд"
        ],
        "description": "Бээжин хотын хамгийн алдартай төв худалдааны явган гудамж. Дэлхийн брэндүүд болон уламжлалт бээжин хоол, амттанг амтлах төв."
    }
],
  "hotels": [
    {
      "id": "hotel-bj-level-1",
      "name": "Хямд буудал (Төсөвт 2 од)",
      "starRating": 2,
      "pricePerNight": 124350,
      "imageUrl": "https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=800&q=80",
      "locationDesc": "Метроны буудалтай ойр, цэвэрхэн тохилог орчин",
      "amenities": [
        "Үнэгүй Wi-Fi",
        "Халуун ус",
        "24 цагийн хүлээн авах",
        "Агааржуулагч"
      ],
      "badge": "Төсөвт ээлтэй"
    },
    {
      "id": "hotel-bj-level-2",
      "name": "Энгийн буудал (Стандарт 3 од)",
      "starRating": 3,
      "pricePerNight": 248720,
      "imageUrl": "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80",
      "locationDesc": "Хотын төвийн бүсэд байрлалтай, өглөөний цайтай",
      "amenities": [
        "Өглөөний цай багтсан",
        "Үнэгүй өндөр хурдны Wi-Fi",
        "Лифт",
        "Өдөр тутмын цэвэрлэгээ",
        "Зочны өрөөний хэрэгслүүд"
      ],
      "badge": "Эрэлттэй сонголт"
    },
    {
      "id": "hotel-bj-level-3",
      "name": "Тансаг буудал (Люкс 5 од)",
      "starRating": 5,
      "pricePerNight": 526480,
      "imageUrl": "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=800&q=80",
      "locationDesc": "Дээд зэрэглэлийн тав тух, төвийн гол талбай эсвэл бизнесийн бүсэд",
      "amenities": [
        "Тансаг өглөөний цай",
        "Спа & Саун",
        "Битүү бассейн",
        "Фитнесс төв",
        "24 цагийн өрөөний үйлчилгээ",
        "Консьерж"
      ],
      "badge": "Дээд зэрэглэл"
    }
  ],
  "transports": [
    {
      "id": "tr-bj-flight",
      "type": "flight",
      "title": "Дан нислэг",
      "durationText": "2 цаг 15 минут",
      "pricePerPerson": 916300,
      "description": "Улаанбаатар (UBN) → Бээжин (PEK) шууд нислэг (Trip.com 1 сарын өмнөх эрт захиалгын үнэ, тээш багтсан, 2 талдаа)",
      "badge": "Сарын өмнөх үнэ",
      "provider": "Trip.com (Сарын өмнөх эрт захиалга)",
      "features": [
        "MIAT Mongolian Airlines шууд нислэг",
        "23кг тээш багтсан (Round-trip)",
        "Trip.com 1 сарын өмнөх бодит тариф",
        "2 талын зардал багтсан"
      ]
    },
    {
      "id": "tr-bj-combined",
      "type": "combined",
      "title": "Газар + Нислэг хосолсон",
      "durationText": "14-16 цаг",
      "pricePerPerson": 598000,
      "description": "Улаанбаатар → Замын-Үүд (Галт тэрэг) → Эрээн (Автобус) + Эрээн → Бээжин (Trip.com дотоод нислэг)",
      "badge": "Тэнцвэртэй",
      "provider": "УБТЗ + Хилийн автобус + Trip.com нислэг",
      "features": [
        "1. Улаанбаатар → Замын-Үүд (УБТЗ галт тэрэг)",
        "2. Замын-Үүд → Эрээн (Хилийн автобус)",
        "3. Эрээн (ERL) → Бээжин (Trip.com дотоод нислэг)",
        "2 талын (ирэх & буцах) зардал багтсан"
      ]
    },
    {
      "id": "tr-bj-overland",
      "type": "overland",
      "title": "Дан газраар (Галт тэрэг + Автобус)",
      "durationText": "24-28 цаг",
      "pricePerPerson": 418260,
      "description": "Улаанбаатар → Замын-Үүд (Галт тэрэг) → Эрээн (Автобус) → Бээжин (Автобус) чиглэлээр бүрэн газраар аялах",
      "badge": "Хамгийн хэмнэлттэй",
      "provider": "УБТЗ + Хилийн автобус + Эрээн-Бээжин автобус",
      "features": [
        "1. Улаанбаатар → Замын-Үүд (УБТЗ галт тэрэг)",
        "2. Замын-Үүд → Эрээн (Хилийн автобус)",
        "3. Эрээн → Бээжин (Холын зайн унтлагын автобус)",
        "2 талын (ирэх & буцах) бүх тээврийн зардал багтсан"
      ]
    }
  ]
},
{
  "key": "shanghai",
  "name": "Шанхай",
  "country": "Хятад",
  "countryKey": "china",
  "flag": "🇨🇳",
  "tag": "Орчин үе, Диснейлэнд & Хуанпу гол",
  "description": "Вайтаний түүхэн далан, Диснейн амралтын газар, Шанхайн цамхаг, Юйюань цэцэрлэг бүхий 20 шилдэг үзвэртэй Хятадын томоохон хот.",
  "attractions": [
    {
      "rank": 1,
      "id": "sh-att-01",
      "sourceUrl": "https://www.trip.com/travel-guide/attraction/shanghai/shanghai-disney-resort-13412802?curr=MNT&locale=en-XX&poiType=3&scene=ticket",
      "name": "Шанхайн Диснейн амралтын газар",
      "nameEn": "Shanghai Disney Resort",
      "category": "adventure",
      "region": "Pudong, Shanghai",
      "estimatedCost": 216667,
      "estimatedHours": 10,
      "imageUrl": "https://pub-83fca96d5b9048f795fabbfcdabba275.r2.dev/attractions/sh-att-01/1.webp",
      "images": [
        "https://pub-83fca96d5b9048f795fabbfcdabba275.r2.dev/attractions/sh-att-01/1.webp",
        "https://pub-83fca96d5b9048f795fabbfcdabba275.r2.dev/attractions/sh-att-01/2.webp",
        "https://pub-83fca96d5b9048f795fabbfcdabba275.r2.dev/attractions/sh-att-01/3.webp"
      ],
      "rating": 4.7,
      "highlights": [
        "Диснейлэндийн цайз ба сэдэвт бүсүүд",
        "Тоглоом, парад, шөнийн галын шоу",
        "Хүүхэд, гэр бүлд тохиромжтой",
        "Диснейтаун худалдаа, хоолны бүстэй залгаа"
      ],
      "description": "Хятадын эх газрын анхны Диснейн амралтын газар. Цайз, тоглоомууд, парад болон шөнийн галын шоугаар бүтэн өдрийг өнгөрөөх боломжтой."
    },
    {
      "rank": 2,
      "id": "sh-att-02",
      "sourceUrl": "https://www.trip.com/travel-guide/attraction/shanghai/the-bund-75611?curr=MNT&locale=en-XX&poiType=3&scene=ticket",
      "name": "Вайтань (Бунд) далан",
      "nameEn": "The Bund",
      "category": "city",
      "region": "Huangpu, Shanghai",
      "estimatedCost": 0,
      "estimatedHours": 2,
      "imageUrl": "https://pub-83fca96d5b9048f795fabbfcdabba275.r2.dev/attractions/sh-att-02/1.webp",
      "images": [
        "https://pub-83fca96d5b9048f795fabbfcdabba275.r2.dev/attractions/sh-att-02/1.webp",
        "https://pub-83fca96d5b9048f795fabbfcdabba275.r2.dev/attractions/sh-att-02/2.webp",
        "https://pub-83fca96d5b9048f795fabbfcdabba275.r2.dev/attractions/sh-att-02/3.webp"
      ],
      "rating": 4.8,
      "highlights": [
        "Гол дагуух 1.5 км-ийн алхалтын зам",
        "Янз бүрийн хэв маягийн түүхэн барилгууд",
        "Лужуйцзуй тэнгэр баганадсын шөнийн үзэмж",
        "Орох төлбөргүй, 24 цагаар нээлттэй"
      ],
      "description": "Хуанпу голын эрэг дагуух түүхэн барилгуудын цуглуулга бүхий Шанхайн бэлгэдэл. Шөнийн гэрэлтүүлэг болон голын нөгөө эргийн Лужуйцзуй бүсийн үзэмжээрээ алдартай."
    },
    {
      "rank": 3,
      "id": "sh-att-03",
      "sourceUrl": "https://www.trip.com/travel-guide/attraction/shanghai/shanghai-wild-animal-park-75624?curr=MNT&locale=en-XX&poiType=3&scene=ticket",
      "name": "Шанхайн зэрлэг амьтдын цэцэрлэгт хүрээлэн",
      "nameEn": "Shanghai Wild Animal Park",
      "category": "nature",
      "region": "Pudong, Shanghai",
      "estimatedCost": 95960,
      "estimatedHours": 6,
      "imageUrl": "https://pub-83fca96d5b9048f795fabbfcdabba275.r2.dev/attractions/sh-att-03/1.webp",
      "images": [
        "https://pub-83fca96d5b9048f795fabbfcdabba275.r2.dev/attractions/sh-att-03/1.webp",
        "https://pub-83fca96d5b9048f795fabbfcdabba275.r2.dev/attractions/sh-att-03/2.webp",
        "https://pub-83fca96d5b9048f795fabbfcdabba275.r2.dev/attractions/sh-att-03/3.webp"
      ],
      "rating": 4.7,
      "highlights": [
        "10,000 гаруй ховор амьтан",
        "Аварга панда, анхир, мэрэгчид",
        "Автобус болон усан онгоцоор тойрох аялал",
        "Хүүхэд гэр бүлд тохиромжтой"
      ],
      "description": "Хятадын хамгийн дээд зэрэглэлийн аялал жуулчлалын газруудын нэг. Өргөн нутагт чөлөөтэй амьдардаг амьтдыг автобус, усан онгоцоор үзнэ."
    },
    {
      "rank": 4,
      "id": "sh-att-04",
      "sourceUrl": "https://www.trip.com/travel-guide/attraction/shanghai/yu-garden-75615?curr=MNT&locale=en-XX&poiType=3&scene=ticket",
      "name": "Юйюань цэцэрлэг",
      "nameEn": "Yu Garden",
      "category": "historical",
      "region": "Huangpu, Shanghai",
      "estimatedCost": 20202,
      "estimatedHours": 2.5,
      "imageUrl": "https://pub-83fca96d5b9048f795fabbfcdabba275.r2.dev/attractions/sh-att-04/1.webp",
      "images": [
        "https://pub-83fca96d5b9048f795fabbfcdabba275.r2.dev/attractions/sh-att-04/1.webp",
        "https://pub-83fca96d5b9048f795fabbfcdabba275.r2.dev/attractions/sh-att-04/2.webp",
        "https://pub-83fca96d5b9048f795fabbfcdabba275.r2.dev/attractions/sh-att-04/3.webp"
      ],
      "rating": 4.7,
      "highlights": [
        "Жяннаны сонгодог цэцэрлэгийн архитектур",
        "Нуур, хад чулуу, хонхор хонгил",
        "Ойролцоох Чэнхуанмяо сүм, хуучин хотын гудамж",
        "Шанхайн уламжлалт хоол, зоогийн газрууд"
      ],
      "description": "Мин гүрний үеийн Жяннаны сонгодог хэв маягийн цэцэрлэг. Шанхайн хуучин хотын төвд оршдог."
    },
    {
      "rank": 5,
      "id": "sh-att-05",
      "sourceUrl": "https://www.trip.com/travel-guide/attraction/shanghai/shanghai-ocean-aquarium-80473?curr=MNT&locale=en-XX&poiType=3&scene=ticket",
      "name": "Шанхайн далайн аквариум",
      "nameEn": "Shanghai Ocean Aquarium",
      "category": "nature",
      "region": "Pudong, Shanghai",
      "estimatedCost": 80808,
      "estimatedHours": 2.5,
      "imageUrl": "https://pub-83fca96d5b9048f795fabbfcdabba275.r2.dev/attractions/sh-att-05/1.webp",
      "images": [
        "https://pub-83fca96d5b9048f795fabbfcdabba275.r2.dev/attractions/sh-att-05/1.webp",
        "https://pub-83fca96d5b9048f795fabbfcdabba275.r2.dev/attractions/sh-att-05/2.webp",
        "https://pub-83fca96d5b9048f795fabbfcdabba275.r2.dev/attractions/sh-att-05/3.webp"
      ],
      "rating": 4.7,
      "highlights": [
        "Дэлхийн хамгийн урт далайн хонгилуудын нэг",
        "Олон төрлийн далайн болон голын загас",
        "Лужуйцзуйн Дорнын сувдан цамхагийн дэргэд",
        "Хооллох цагийн үзүүлбэрүүд"
      ],
      "description": "Дэлхийн хамгийн том хиймэл далайн ус бүхий аквариумуудын нэг. Далайн амьтдыг хонгилоор алхан үзнэ."
    },
    {
      "rank": 6,
      "id": "sh-att-06",
      "sourceUrl": "https://www.trip.com/travel-guide/attraction/shanghai/shanghai-science-and-technology-museum-80261?curr=MNT&locale=en-XX&poiType=3&scene=ticket",
      "name": "Шанхайн шинжлэх ухаан, технологийн музей",
      "nameEn": "Shanghai Science and Technology Museum",
      "category": "cultural",
      "region": "Pudong, Shanghai",
      "estimatedCost": 22727,
      "estimatedHours": 4,
      "imageUrl": "https://pub-83fca96d5b9048f795fabbfcdabba275.r2.dev/attractions/sh-att-06/1.webp",
      "images": [
        "https://pub-83fca96d5b9048f795fabbfcdabba275.r2.dev/attractions/sh-att-06/1.webp",
        "https://pub-83fca96d5b9048f795fabbfcdabba275.r2.dev/attractions/sh-att-06/2.webp",
        "https://pub-83fca96d5b9048f795fabbfcdabba275.r2.dev/attractions/sh-att-06/3.webp"
      ],
      "rating": 4.7,
      "highlights": [
        "Байгалийн шинжлэх ухааны интерактив үзмэрүүд",
        "Дүрс, дууны шинжлэх ухааны театр",
        "Хүүхдэд зориулсан тоглоомоор суралцах бүс",
        "Зуун жилийн өргөн чөлөөнд байрлана"
      ],
      "description": "Шанхайн шинжлэх ухааны боловсролын гол газруудын нэг. Интерактив үзмэр, дүрс дууны театр бүхий том музей."
    },
    {
      "rank": 7,
      "id": "sh-att-07",
      "sourceUrl": "https://www.trip.com/travel-guide/attraction/shanghai/shanghai-happy-valley-10559194?curr=MNT&locale=en-XX&poiType=66&scene=ticket",
      "name": "Шанхайн Хэппи Валли",
      "nameEn": "Shanghai Happy Valley",
      "category": "adventure",
      "region": "Songjiang, Shanghai",
      "estimatedCost": 151010,
      "estimatedHours": 8,
      "imageUrl": "https://pub-83fca96d5b9048f795fabbfcdabba275.r2.dev/attractions/sh-att-07/1.webp",
      "images": [
        "https://pub-83fca96d5b9048f795fabbfcdabba275.r2.dev/attractions/sh-att-07/1.webp",
        "https://pub-83fca96d5b9048f795fabbfcdabba275.r2.dev/attractions/sh-att-07/2.webp",
        "https://pub-83fca96d5b9048f795fabbfcdabba275.r2.dev/attractions/sh-att-07/3.webp"
      ],
      "rating": 4.7,
      "highlights": [
        "Өндөр хурдны рельс ба усны тоглоомууд",
        "Сэдэвт баяр наадам, шөнийн үзүүлбэр",
        "Хотоос баруун өмнө Шэшань уулын бүсэд",
        "Бүтэн өдрийн хөтөлбөр"
      ],
      "description": "Шанхайн томоохон зугаа цэнгээний парк. Өндөр хурдны тоглоом, үзүүлбэрээр дүүрэн бүтэн өдрийн аялал."
    },
    {
      "rank": 8,
      "id": "sh-att-08",
      "sourceUrl": "https://www.trip.com/travel-guide/attraction/shanghai/disney-town-28408248?curr=MNT&locale=en-XX&poiType=3&scene=ticket",
      "name": "Диснейтаун",
      "nameEn": "Disney Town",
      "category": "city",
      "region": "Pudong, Shanghai",
      "estimatedCost": 0,
      "estimatedHours": 3,
      "imageUrl": "https://pub-83fca96d5b9048f795fabbfcdabba275.r2.dev/attractions/sh-att-08/1.webp",
      "images": [
        "https://pub-83fca96d5b9048f795fabbfcdabba275.r2.dev/attractions/sh-att-08/1.webp",
        "https://pub-83fca96d5b9048f795fabbfcdabba275.r2.dev/attractions/sh-att-08/2.webp",
        "https://pub-83fca96d5b9048f795fabbfcdabba275.r2.dev/attractions/sh-att-08/3.webp"
      ],
      "rating": 4.8,
      "highlights": [
        "Диснейн амралтын газрын худалдаа, хоолны бүс",
        "Орох төлбөргүй",
        "Диснейлэндийн үзэмжтэй ресторанууд",
        "Паркийн дараа амрахад тохиромжтой"
      ],
      "description": "Шанхайн Диснейн амралтын газар доторх шоппинг, хоол, зугаа цэнгээний гудамж. Орох төлбөргүй."
    },
    {
      "rank": 9,
      "id": "sh-att-09",
      "sourceUrl": "https://www.trip.com/travel-guide/attraction/shanghai/huangpu-river-cruise-98472?curr=MNT&locale=en-XX&poiType=3&scene=ticket",
      "name": "Хуанпу голын круиз (Шилиупү усан боомт)",
      "nameEn": "Huangpu River Cruise",
      "category": "city",
      "region": "Huangpu, Shanghai",
      "estimatedCost": 60606,
      "estimatedHours": 1.5,
      "imageUrl": "https://pub-83fca96d5b9048f795fabbfcdabba275.r2.dev/attractions/sh-att-09/1.webp",
      "images": [
        "https://pub-83fca96d5b9048f795fabbfcdabba275.r2.dev/attractions/sh-att-09/1.webp",
        "https://pub-83fca96d5b9048f795fabbfcdabba275.r2.dev/attractions/sh-att-09/2.webp",
        "https://pub-83fca96d5b9048f795fabbfcdabba275.r2.dev/attractions/sh-att-09/3.webp"
      ],
      "rating": 4.4,
      "highlights": [
        "Вайтань болон Лужуйцзуйг голоос харах",
        "Шөнийн гэрэлтүүлэгтэй үзэмж",
        "Шилиупү усан боомтоос хөдөлнө",
        "1–2 цагийн тайван аялал"
      ],
      "description": "Хуанпу голоор усан онгоцоор аялж, нэг эрэгт түүхэн Вайтань, нөгөө эрэгт орчин үеийн Лужуйцзуйг харна."
    },
    {
      "rank": 10,
      "id": "sh-att-10",
      "sourceUrl": "https://www.trip.com/travel-guide/attraction/shanghai/shanghai-tower-24591219?curr=MNT&locale=en-XX&poiType=3&scene=ticket",
      "name": "Шанхайн цамхаг",
      "nameEn": "Shanghai Tower",
      "category": "city",
      "region": "Pudong, Shanghai",
      "estimatedCost": 90909,
      "estimatedHours": 2,
      "imageUrl": "https://pub-83fca96d5b9048f795fabbfcdabba275.r2.dev/attractions/sh-att-10/1.webp",
      "images": [
        "https://pub-83fca96d5b9048f795fabbfcdabba275.r2.dev/attractions/sh-att-10/1.webp",
        "https://pub-83fca96d5b9048f795fabbfcdabba275.r2.dev/attractions/sh-att-10/2.webp",
        "https://pub-83fca96d5b9048f795fabbfcdabba275.r2.dev/attractions/sh-att-10/3.webp"
      ],
      "rating": 4.6,
      "highlights": [
        "632 м өндөр, Хятадын хамгийн өндөр барилга",
        "118 давхрын үзмэрийн тавцан",
        "Өндөр хурдны цахилгаан шат",
        "Шанхайн панорама үзэмж"
      ],
      "description": "Лужуйцзуй бүсэд байрлах Хятадын хамгийн өндөр барилга. 118 давхрын тавцангаас хотыг бүхэлд нь харна."
    },
    {
      "rank": 11,
      "id": "sh-att-11",
      "sourceUrl": "https://www.trip.com/travel-guide/attraction/shanghai/shanghai-film-park-76783?curr=MNT&locale=en-XX&poiType=3&scene=ticket",
      "name": "Шанхайн киноны парк",
      "nameEn": "Shanghai Film Park",
      "category": "cultural",
      "region": "Songjiang, Shanghai",
      "estimatedCost": 40404,
      "estimatedHours": 4,
      "imageUrl": "https://pub-83fca96d5b9048f795fabbfcdabba275.r2.dev/attractions/sh-att-11/1.webp",
      "images": [
        "https://pub-83fca96d5b9048f795fabbfcdabba275.r2.dev/attractions/sh-att-11/1.webp",
        "https://pub-83fca96d5b9048f795fabbfcdabba275.r2.dev/attractions/sh-att-11/2.webp",
        "https://pub-83fca96d5b9048f795fabbfcdabba275.r2.dev/attractions/sh-att-11/3.webp"
      ],
      "rating": 4.3,
      "highlights": [
        "1930-аад оны Шанхайн гудамжийн киноны декор",
        "Нанкин гудамж, Шикумэн байшин, Вайбайду гүүр",
        "Зураг авахуулах олон газар",
        "Сунцзян дүүрэгт байрлана"
      ],
      "description": "1930-аад оны Шанхайг дүрсэлсэн киноны хот. Декорацийн дунд алхаж, зураг авахуулна."
    },
    {
      "rank": 12,
      "id": "sh-att-12",
      "sourceUrl": "https://www.trip.com/travel-guide/attraction/shanghai/shanghai-city-god-temple-tourist-area-10524093?curr=MNT&locale=en-XX&poiType=3&scene=ticket",
      "name": "Чэнхуанмяо аялал жуулчлалын бүс",
      "nameEn": "City God Temple Tourist Area",
      "category": "historical",
      "region": "Huangpu, Shanghai",
      "estimatedCost": 0,
      "estimatedHours": 4,
      "imageUrl": "https://pub-83fca96d5b9048f795fabbfcdabba275.r2.dev/attractions/sh-att-12/1.webp",
      "images": [
        "https://pub-83fca96d5b9048f795fabbfcdabba275.r2.dev/attractions/sh-att-12/1.webp",
        "https://pub-83fca96d5b9048f795fabbfcdabba275.r2.dev/attractions/sh-att-12/2.webp",
        "https://pub-83fca96d5b9048f795fabbfcdabba275.r2.dev/attractions/sh-att-12/3.webp"
      ],
      "rating": 4.7,
      "highlights": [
        "Чэнхуанмяо сүм ба Юйюань цэцэрлэг",
        "Уламжлалт Шанхайн зууш, хоол",
        "Эртний хэв маягийн барилгын шөнийн гэрэлтүүлэг",
        "Орох төлбөргүй, 24 цаг"
      ],
      "description": "Шанхайн хуучин хотын түүхэн бүс. Уламжлалт барилга, зуушны дэлгүүр, шөнийн гэрэлтүүлгээрээ алдартай."
    },
    {
      "rank": 13,
      "id": "sh-att-13",
      "sourceUrl": "https://www.trip.com/travel-guide/attraction/shanghai/shanghai-songcheng-show-park-140068129?curr=MNT&locale=en-XX&poiType=3&scene=ticket",
      "name": "Шанхайн Сунчэн шоу парк",
      "nameEn": "Shanghai Songcheng Show Park",
      "category": "cultural",
      "region": "Pudong, Shanghai",
      "estimatedCost": 160606,
      "estimatedHours": 5,
      "imageUrl": "https://pub-83fca96d5b9048f795fabbfcdabba275.r2.dev/attractions/sh-att-13/1.webp",
      "images": [
        "https://pub-83fca96d5b9048f795fabbfcdabba275.r2.dev/attractions/sh-att-13/1.webp",
        "https://pub-83fca96d5b9048f795fabbfcdabba275.r2.dev/attractions/sh-att-13/2.webp",
        "https://pub-83fca96d5b9048f795fabbfcdabba275.r2.dev/attractions/sh-att-13/3.webp"
      ],
      "rating": 4.7,
      "highlights": [
        "Хятадын түүхийг харуулсан тайзны шоу",
        "Эртний үеийн гудамжуудыг дүрсэлсэн парк",
        "Шоуны тасалбарт паркийн орох эрх багтсан",
        "Экспо паркийн дэргэд"
      ],
      "description": "Хуанпу голын эрэг дэх Экспо паркт орших түүхэн сэдэвт парк. Хятадын түүхийг дүрсэлсэн томоохон тайзны шоу үзнэ."
    },
    {
      "rank": 14,
      "id": "sh-att-14",
      "sourceUrl": "https://www.trip.com/travel-guide/attraction/shanghai/jinmao-tower-observation-deck-24313002?curr=MNT&locale=en-XX&poiType=3&scene=ticket",
      "name": "Цзиньмао цамхгийн 88 давхрын тавцан",
      "nameEn": "Jinmao Tower Observation Deck",
      "category": "city",
      "region": "Pudong, Shanghai",
      "estimatedCost": 60606,
      "estimatedHours": 1.5,
      "imageUrl": "https://pub-83fca96d5b9048f795fabbfcdabba275.r2.dev/attractions/sh-att-14/1.webp",
      "images": [
        "https://pub-83fca96d5b9048f795fabbfcdabba275.r2.dev/attractions/sh-att-14/1.webp",
        "https://pub-83fca96d5b9048f795fabbfcdabba275.r2.dev/attractions/sh-att-14/2.webp",
        "https://pub-83fca96d5b9048f795fabbfcdabba275.r2.dev/attractions/sh-att-14/3.webp"
      ],
      "rating": 4.6,
      "highlights": [
        "88 давхрын 360 градусын үзэмж",
        "Лужуйцзуйн төвд байрлана",
        "Шөнийн хотын гэрэлтүүлэг",
        "Зоригтой хүнд шилэн тавцан"
      ],
      "description": "Лужуйцзуй бүсийн Цзиньмао цамхгийн 88 давхарт байрлах тавцан. Шанхайг 360 градусаар харж болно."
    },
    {
      "rank": 15,
      "id": "sh-att-15",
      "sourceUrl": "https://www.trip.com/travel-guide/attraction/shanghai/city-sightseeing-tour-bus-18054301?curr=MNT&locale=en-XX&poiType=66&scene=ticket",
      "name": "Хотын аялал жуулчлалын автобус",
      "nameEn": "City Sightseeing Bus",
      "category": "city",
      "region": "Pudong, Shanghai",
      "estimatedCost": 30303,
      "estimatedHours": 2,
      "imageUrl": "https://pub-83fca96d5b9048f795fabbfcdabba275.r2.dev/attractions/sh-att-15/1.webp",
      "images": [
        "https://pub-83fca96d5b9048f795fabbfcdabba275.r2.dev/attractions/sh-att-15/1.webp",
        "https://pub-83fca96d5b9048f795fabbfcdabba275.r2.dev/attractions/sh-att-15/2.webp",
        "https://pub-83fca96d5b9048f795fabbfcdabba275.r2.dev/attractions/sh-att-15/3.webp"
      ],
      "rating": 4.3,
      "highlights": [
        "Давхар аялал жуулчлалын автобус",
        "Дурын буудалд бууж, суух боломжтой",
        "8 хэлний аудио хөтөч",
        "Шанхайн гол үзэсгэлэнт газруудаар"
      ],
      "description": "Давхар автобусаар Шанхайн гол цэгүүдийг тойрох. Дуртай буудал дээрээ бууж, дараагийн автобусанд суух боломжтой."
    },
    {
      "rank": 16,
      "id": "sh-att-16",
      "sourceUrl": "https://www.trip.com/travel-guide/attraction/shanghai/shanghai-art-museum-80268?curr=MNT&locale=en-XX&poiType=3&scene=ticket",
      "name": "Шанхайн Дүрслэх урлагийн музей (Хятадын урлагийн ордон)",
      "nameEn": "Shanghai Art Museum (China Art Museum)",
      "category": "cultural",
      "region": "Pudong, Shanghai",
      "estimatedCost": 0,
      "estimatedHours": 4,
      "imageUrl": "https://pub-83fca96d5b9048f795fabbfcdabba275.r2.dev/attractions/sh-att-16/1.webp",
      "images": [
        "https://pub-83fca96d5b9048f795fabbfcdabba275.r2.dev/attractions/sh-att-16/1.webp",
        "https://pub-83fca96d5b9048f795fabbfcdabba275.r2.dev/attractions/sh-att-16/2.webp",
        "https://pub-83fca96d5b9048f795fabbfcdabba275.r2.dev/attractions/sh-att-16/3.webp"
      ],
      "rating": 4.6,
      "highlights": [
        "2010 оны Экспогийн Хятадын павилион",
        "Азийн хамгийн том урлагийн музейнүүдийн нэг",
        "Орчин үеийн Хятад архитектур",
        "Үндсэн үзмэрт үнэгүй орно"
      ],
      "description": "2010 оны Экспогийн Хятадын павилион байсан Азийн хамгийн том урлагийн музейнүүдийн нэг. Үндсэн үзмэрт үнэгүй."
    },
    {
      "rank": 17,
      "id": "sh-att-17",
      "sourceUrl": "https://www.trip.com/travel-guide/attraction/shanghai/wukang-road-10559490?curr=MNT&locale=en-XX&poiType=3&scene=ticket",
      "name": "Вүкан гудамж",
      "nameEn": "Wukang Road",
      "category": "cultural",
      "region": "Xuhui, Shanghai",
      "estimatedCost": 0,
      "estimatedHours": 2,
      "imageUrl": "https://pub-83fca96d5b9048f795fabbfcdabba275.r2.dev/attractions/sh-att-17/1.webp",
      "images": [
        "https://pub-83fca96d5b9048f795fabbfcdabba275.r2.dev/attractions/sh-att-17/1.webp",
        "https://pub-83fca96d5b9048f795fabbfcdabba275.r2.dev/attractions/sh-att-17/2.webp",
        "https://pub-83fca96d5b9048f795fabbfcdabba275.r2.dev/attractions/sh-att-17/3.webp"
      ],
      "rating": 4.7,
      "highlights": [
        "Хуучин Францын концессийн мод бүхий гудамж",
        "Вүкан байшингийн алдарт барилга",
        "Кафе, жижиг дэлгүүр, зураг авахуулах газар",
        "Орох төлбөргүй, 24 цаг"
      ],
      "description": "Хуучин Францын концессийн бүс дэх модоор шигтгэсэн гудамж. Түүхэн барилга, кафе, зураг авахуулах газраараа алдартай."
    },
    {
      "rank": 18,
      "id": "sh-att-18",
      "sourceUrl": "https://www.trip.com/travel-guide/attraction/shanghai/fuxing-park-78448?curr=MNT&locale=en-XX&poiType=3&scene=ticket",
      "name": "Фусин цэцэрлэгт хүрээлэн",
      "nameEn": "Fuxing Park",
      "category": "nature",
      "region": "Huangpu, Shanghai",
      "estimatedCost": 0,
      "estimatedHours": 1.5,
      "imageUrl": "https://pub-83fca96d5b9048f795fabbfcdabba275.r2.dev/attractions/sh-att-18/1.webp",
      "images": [
        "https://pub-83fca96d5b9048f795fabbfcdabba275.r2.dev/attractions/sh-att-18/1.webp",
        "https://pub-83fca96d5b9048f795fabbfcdabba275.r2.dev/attractions/sh-att-18/2.webp",
        "https://pub-83fca96d5b9048f795fabbfcdabba275.r2.dev/attractions/sh-att-18/3.webp"
      ],
      "rating": 4.6,
      "highlights": [
        "1909 онд байгуулсан Францын хэв маягийн цэцэрлэг",
        "Тэгш хэмтэй цэцгийн ор, ногоон бүс",
        "Орох төлбөргүй",
        "Хуучин Францын концессийн төвд"
      ],
      "description": "Шанхайн хамгийн эртний цэцэрлэгт хүрээлэнгийн нэг. Францын хэв маягийн, нутгийнхны \"Францын парк\" гэж нэрлэдэг газар."
    },
    {
      "rank": 19,
      "id": "sh-att-19",
      "sourceUrl": "https://www.trip.com/travel-guide/attraction/shanghai/shanghai-disney-zootopia-143192731?curr=MNT&locale=en-XX&poiType=66&scene=ticket",
      "name": "Шанхайн Диснейн Зоотопиа бүс",
      "nameEn": "Shanghai Disney Zootopia",
      "category": "adventure",
      "region": "Pudong, Shanghai",
      "estimatedCost": 216667,
      "estimatedHours": 4,
      "imageUrl": "https://pub-83fca96d5b9048f795fabbfcdabba275.r2.dev/attractions/sh-att-19/1.webp",
      "images": [
        "https://pub-83fca96d5b9048f795fabbfcdabba275.r2.dev/attractions/sh-att-19/1.webp",
        "https://pub-83fca96d5b9048f795fabbfcdabba275.r2.dev/attractions/sh-att-19/2.webp",
        "https://pub-83fca96d5b9048f795fabbfcdabba275.r2.dev/attractions/sh-att-19/3.webp"
      ],
      "rating": 4.8,
      "highlights": [
        "\"Зоотопиа\" киноноос сэдэвлэсэн 8 дахь бүс",
        "Шинэ тоглоом, үзүүлбэр",
        "Диснейлэндийн тасалбараар орно",
        "2023 оны 12-р сард нээгдсэн"
      ],
      "description": "Диснейлэндийн \"Зоотопиа\" киноны сэдэвтэй бүс. Диснейлэндийн ерөнхий тасалбараар орно."
    },
    {
      "rank": 20,
      "id": "sh-att-20",
      "sourceUrl": "https://www.trip.com/things-to-do/detail/102198714?locale=en-XX&curr=MNT",
      "name": "ERA циркийн шоу (Цирк хот)",
      "nameEn": "ERA Acrobatic Show (Circus City)",
      "category": "cultural",
      "region": "Zhabei, Shanghai",
      "estimatedCost": 133231,
      "estimatedHours": 1.5,
      "imageUrl": "https://pub-83fca96d5b9048f795fabbfcdabba275.r2.dev/attractions/sh-att-20/1.webp",
      "images": [
        "https://pub-83fca96d5b9048f795fabbfcdabba275.r2.dev/attractions/sh-att-20/1.webp",
        "https://pub-83fca96d5b9048f795fabbfcdabba275.r2.dev/attractions/sh-att-20/2.webp",
        "https://pub-83fca96d5b9048f795fabbfcdabba275.r2.dev/attractions/sh-att-20/3.webp"
      ],
      "rating": 4.8,
      "highlights": [
        "Акробат, олон төрлийн урлагийн нийлмэл шоу",
        "Усан дотор болон тайзны гайхалтай үзүүлбэр",
        "QR кодоор шууд орно",
        "Ойролцоогоор 1.5 цагийн хөтөлбөр"
      ],
      "description": "Шанхайн алдартай акробатын шоу. Циркийн театрт олон төрлийн урлагийг хослуулсан гайхалтай тайзны үзүүлбэр үзнэ."
    }
  ],
  "hotels": [
    {
      "id": "hotel-sh-level-1",
      "name": "Хямд буудал (Төсөвт 2 од)",
      "starRating": 2,
      "pricePerNight": 100000,
      "imageUrl": "https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=800&q=80",
      "locationDesc": "Метроны буудалтай ойр, цэвэрхэн тохилог орчин",
      "amenities": [
        "Үнэгүй Wi-Fi",
        "Халуун ус",
        "24 цагийн хүлээн авах",
        "Агааржуулагч"
      ],
      "badge": "Төсөвт ээлтэй"
    },
    {
      "id": "hotel-sh-level-2",
      "name": "Энгийн буудал (Стандарт 3 од)",
      "starRating": 3,
      "pricePerNight": 135000,
      "imageUrl": "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80",
      "locationDesc": "Хотын төвийн бүсэд байрлалтай, өглөөний цайтай",
      "amenities": [
        "Өглөөний цай багтсан",
        "Үнэгүй өндөр хурдны Wi-Fi",
        "Лифт",
        "Өдөр тутмын цэвэрлэгээ",
        "Зочны өрөөний хэрэгслүүд"
      ],
      "badge": "Тохилог сонголт"
    },
    {
      "id": "hotel-sh-level-3",
      "name": "Тансаг буудал (Люкс 5 од)",
      "starRating": 5,
      "pricePerNight": 700000,
      "imageUrl": "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=800&q=80",
      "locationDesc": "Дээд зэрэглэлийн тав тух, төвийн гол талбай эсвэл бизнесийн бүсэд",
      "amenities": [
        "Тансаг өглөөний цай",
        "Спа & Саун",
        "Битүү бассейн",
        "Фитнесс төв",
        "24 цагийн өрөөний үйлчилгээ",
        "Консьерж"
      ],
      "badge": "Дээд зэрэглэл"
    }
  ],
  "transports": [
    {
      "id": "tr-sh-flight",
      "type": "flight",
      "title": "Дан нислэг",
      "durationText": "3 цаг 45 минут",
      "pricePerPerson": 1024200,
      "description": "Улаанбаатар (UBN) → Шанхай (PVG) шууд нислэг (Trip.com хамгийн хямд тариф, тээш багтсан, 2 талдаа)",
      "badge": "Шууд нислэг",
      "provider": "Trip.com",
      "features": [
        "Улаанбаатар → Шанхай шууд нислэг",
        "Тээш багтсан (Round-trip)",
        "Trip.com бодит тариф",
        "2 талын зардал багтсан"
      ]
    },
    {
      "id": "tr-sh-combined",
      "type": "combined",
      "title": "Газар + Нислэг хосолсон",
      "durationText": "30-36 цаг",
      "pricePerPerson": 1038060,
      "description": "Улаанбаатар → Замын-Үүд (Галт тэрэг) → Эрээн (Автобус) → Бээжин (Автобус) + Бээжин → Шанхай (шууд нислэг)",
      "badge": "Хосолсон",
      "provider": "УБТЗ + Хилийн автобус + Эрээн-Бээжин автобус + Trip.com нислэг",
      "features": [
        "1. Улаанбаатар → Замын-Үүд (УБТЗ галт тэрэг)",
        "2. Замын-Үүд → Эрээн (Хилийн автобус)",
        "3. Эрээн → Бээжин (Холын зайн автобус)",
        "4. Бээжин → Шанхай (шууд нислэг, тээш багтсан)",
        "2 талын (ирэх & буцах) зардал багтсан"
      ]
    }
  ]
},
{
  "key": "phuket",
  "name": "Пукет",
  "country": "Тайланд",
  "countryKey": "thailand",
  "flag": "🇹🇭",
  "tag": "Арал, далайн эрэг & адал явдал",
  "description": "Андаманы тэнгисийн хамгийн том арал: Ката, Карон далайн эрэг, Пхи Пхи арал, Их Бурхан, хуучин хот, зиплайн, шоу бүхий 19 шилдэг үзвэртэй амралтын хот.",
  "attractions": [
    {
      "rank": 1,
      "id": "ph-att-08",
      "sourceUrl": "https://www.trip.com/things-to-do/detail/92775178?locale=en-XX&curr=MNT",
      "priceCheckedAt": "2026-10-23",
      "name": "Пхи Пхи арлууд (Паромын тасалбар)",
      "nameEn": "Phi Phi Islands (Ferry Ticket)",
      "category": "nature",
      "region": "Phi Phi, Krabi",
      "estimatedCost": 48928,
      "estimatedHours": 8,
      "imageUrl": "https://pub-83fca96d5b9048f795fabbfcdabba275.r2.dev/attractions/ph-att-08/1.webp",
      "images": [
        "https://pub-83fca96d5b9048f795fabbfcdabba275.r2.dev/attractions/ph-att-08/1.webp",
        "https://pub-83fca96d5b9048f795fabbfcdabba275.r2.dev/attractions/ph-att-08/2.webp",
        "https://pub-83fca96d5b9048f795fabbfcdabba275.r2.dev/attractions/ph-att-08/3.webp"
      ],
      "rating": 4.7,
      "highlights": [
        "Пукетээс Пхи Пхи рүү албан ёсны паром, 2-3 цагийн зам",
        "Андаманы тэнгисийн тунгалаг ус, шохойн чулуун хад",
        "Standard болон Premium суудлын сонголттой",
        "50 гаруй жилийн туршлагатай оператор"
      ],
      "description": "Пукетээс Пхи Пхи Тонсай буюу Лаемтонг боомт хүртэл албан ёсны паромоор Андаманы тэнгисийг дайран явна. Арлын эрэг, шүрэн хадаар бүтэн өдөр аялах хамгийн алдартай сонголт."
    },
    {
      "rank": 2,
      "id": "ph-att-19",
      "sourceUrl": "https://www.trip.com/travel-guide/attraction/phuket/phuket-big-buddha-156419307?curr=MNT&locale=en-XX&poiType=3",
      "priceCheckedAt": "2026-10-23",
      "name": "Пукетийн Их Бурхан",
      "nameEn": "Phuket Big Buddha",
      "category": "cultural",
      "region": "Karon, Mueang Phuket",
      "estimatedCost": 0,
      "estimatedHours": 1.5,
      "imageUrl": "https://pub-83fca96d5b9048f795fabbfcdabba275.r2.dev/attractions/ph-att-19/1.webp",
      "images": [
        "https://pub-83fca96d5b9048f795fabbfcdabba275.r2.dev/attractions/ph-att-19/1.webp",
        "https://pub-83fca96d5b9048f795fabbfcdabba275.r2.dev/attractions/ph-att-19/2.webp",
        "https://pub-83fca96d5b9048f795fabbfcdabba275.r2.dev/attractions/ph-att-19/3.webp"
      ],
      "rating": 4.5,
      "highlights": [
        "Уулын орой дахь цагаан бурханы том хөшөө",
        "Арлын бүх талыг харах панорама үзэмж",
        "Нэвтрэх эрх чөлөөтэй, өглөө 06:30-18:30",
        "Нар жаргах үеийн гоё зураг"
      ],
      "description": "Пукет арлын хамгийн бэлгэдэлтэй шашин соёлын дурсгал. Толгодын оройд өргөгдсөн цагаан бурханы хөшөөнөөс арал, тэнгисийн үзэмжийг харна."
    },
    {
      "rank": 3,
      "id": "ph-att-01",
      "sourceUrl": "https://www.trip.com/travel-guide/attraction/phuket/old-phuket-town-10559094?curr=MNT&locale=en-XX&poiType=3&scene=ticket",
      "priceCheckedAt": "2026-10-23",
      "name": "Пукетийн хуучин хот",
      "nameEn": "Old Phuket Town",
      "category": "historical",
      "region": "Mueang Phuket, Phuket",
      "estimatedCost": 0,
      "estimatedHours": 3,
      "imageUrl": "https://pub-83fca96d5b9048f795fabbfcdabba275.r2.dev/attractions/ph-att-01/1.webp",
      "images": [
        "https://pub-83fca96d5b9048f795fabbfcdabba275.r2.dev/attractions/ph-att-01/1.webp",
        "https://pub-83fca96d5b9048f795fabbfcdabba275.r2.dev/attractions/ph-att-01/2.webp",
        "https://pub-83fca96d5b9048f795fabbfcdabba275.r2.dev/attractions/ph-att-01/3.webp"
      ],
      "rating": 4.8,
      "highlights": [
        "Хятад, Европ хэлбэрийн архитектурын хослол",
        "Хоккиен шарсан гоймон, карри гоймон зэрэг орон нутгийн хоол",
        "Кафе, галерей, дэлгүүртэй өнгөт гудамжууд",
        "Шөнийн хөтөлбөр, бүхэл өдөр нээлттэй"
      ],
      "description": "Пукет мужийн төв хот бөгөөд эрэг, зочид буудлын бүсээс ялгаатай уламжлалт гудамж, өвөрмөц архитектуртай. Орон нутгийн хоол, дэлгүүр, кафег алхаж үзнэ."
    },
    {
      "rank": 4,
      "id": "ph-att-02",
      "sourceUrl": "https://www.trip.com/travel-guide/attraction/phuket/kata-beach-80294?curr=MNT&locale=en-XX&poiType=3&scene=ticket",
      "priceCheckedAt": "2026-10-23",
      "name": "Ката далайн эрэг",
      "nameEn": "Kata Beach",
      "category": "nature",
      "region": "Karon, Phuket",
      "estimatedCost": 0,
      "estimatedHours": 4,
      "imageUrl": "https://pub-83fca96d5b9048f795fabbfcdabba275.r2.dev/attractions/ph-att-02/1.webp",
      "images": [
        "https://pub-83fca96d5b9048f795fabbfcdabba275.r2.dev/attractions/ph-att-02/1.webp",
        "https://pub-83fca96d5b9048f795fabbfcdabba275.r2.dev/attractions/ph-att-02/2.webp"
      ],
      "rating": 4.7,
      "highlights": [
        "Нарийн цайвар элс, тунгалаг ус",
        "Хоёр талдаа ногоон толгод, ойролцоо жижиг арлууд",
        "Далайн хоол, шарсан хоолны шөнийн зах",
        "2026 оны Global 50 - Cool Water Escapes жагсаалт"
      ],
      "description": "Пукетийн хамгийн алдартай далайн эрэгүүдийн нэг. Наранд шарах, усанд сэлэх, нар жаргахыг харах, ойролцоох шөнийн захаар хооллох боломжтой."
    },
    {
      "rank": 5,
      "id": "ph-att-11",
      "sourceUrl": "https://www.trip.com/travel-guide/attraction/phuket/karon-beach-80295?curr=MNT&locale=en-XX&poiType=3&scene=ticket",
      "priceCheckedAt": "2026-10-23",
      "name": "Карон далайн эрэг",
      "nameEn": "Karon Beach",
      "category": "nature",
      "region": "Karon, Phuket",
      "estimatedCost": 0,
      "estimatedHours": 4,
      "imageUrl": "https://pub-83fca96d5b9048f795fabbfcdabba275.r2.dev/attractions/ph-att-11/1.webp",
      "images": [
        "https://pub-83fca96d5b9048f795fabbfcdabba275.r2.dev/attractions/ph-att-11/1.webp",
        "https://pub-83fca96d5b9048f795fabbfcdabba275.r2.dev/attractions/ph-att-11/2.webp",
        "https://pub-83fca96d5b9048f795fabbfcdabba275.r2.dev/attractions/ph-att-11/3.webp"
      ],
      "rating": 4.7,
      "highlights": [
        "Пукетийн хамгийн урт элсэн эрэгийн нэг",
        "Сэлэлт, серфинг, шөнийн үзэмж",
        "Нэвтрэх үнэгүй, бүхэл өдөр нээлттэй",
        "Ката эрэгтэй зэргэлдээ"
      ],
      "description": "Урт өргөн элсэн эрэгтэй, гэр бүлээрээ амрахад тохиромжтой. Серфинг, усан спорт, нар жаргах үзэмжтэй."
    },
    {
      "rank": 6,
      "id": "ph-att-14",
      "sourceUrl": "https://www.trip.com/travel-guide/attraction/phuket/elephant-care-park-phuket-55942155?curr=MNT&locale=en-XX&poiType=3&scene=ticket",
      "priceCheckedAt": "2026-10-23",
      "name": "Заан асрах парк",
      "nameEn": "Elephant Care Park Phuket",
      "category": "adventure",
      "region": "Mueang Phuket, Phuket",
      "estimatedCost": 59918,
      "estimatedHours": 4,
      "imageUrl": "https://pub-83fca96d5b9048f795fabbfcdabba275.r2.dev/attractions/ph-att-14/1.webp",
      "images": [
        "https://pub-83fca96d5b9048f795fabbfcdabba275.r2.dev/attractions/ph-att-14/1.webp",
        "https://pub-83fca96d5b9048f795fabbfcdabba275.r2.dev/attractions/ph-att-14/2.webp",
        "https://pub-83fca96d5b9048f795fabbfcdabba275.r2.dev/attractions/ph-att-14/3.webp"
      ],
      "rating": 4.7,
      "highlights": [
        "Заанд хоол өгөх туршлага",
        "Капибарад хоол өгөх үнэгүй",
        "Дурсгалын цүнх, ундаа багтсан",
        "Тасалбар авах шаардлагагүй, шууд захиалга"
      ],
      "description": "Заануудыг асран хамгаалдаг этик парк. Заанд гараар хоол өгч, капибаратай танилцаж, тайван орчинд бүтэн өглөө өнгөрүүлнэ."
    },
    {
      "rank": 7,
      "id": "ph-att-18",
      "sourceUrl": "https://www.trip.com/travel-guide/attraction/phuket/simon-cabaret-phuket-10758707?curr=MNT&locale=en-XX&poiType=3&scene=ticket",
      "priceCheckedAt": "2026-10-23",
      "name": "Саймон Кабаре шоу",
      "nameEn": "Simon Cabaret Phuket",
      "category": "cultural",
      "region": "Patong, Phuket",
      "estimatedCost": 99530,
      "estimatedHours": 2,
      "imageUrl": "https://pub-83fca96d5b9048f795fabbfcdabba275.r2.dev/attractions/ph-att-18/1.webp",
      "images": [
        "https://pub-83fca96d5b9048f795fabbfcdabba275.r2.dev/attractions/ph-att-18/1.webp"
      ],
      "rating": 4.7,
      "highlights": [
        "Тансаг хувцастай трансжендер кабаре шоу",
        "VIP суудал (1-3 эгнээ) + үнэгүй ундаа",
        "Орой 18:00-22:30",
        "Тасалбар авах шаардлагагүй"
      ],
      "description": "Тайландын алдартай кабаре театр. Тансаг хувцас, бүжиг, хөгжмийн тоглолтыг VIP суудлаас үзнэ."
    },
    {
      "rank": 8,
      "id": "ph-att-13",
      "sourceUrl": "https://www.trip.com/travel-guide/attraction/phuket/andamanda-phuket-waterpark-133979403?curr=MNT&locale=en-XX&poiType=66&scene=ticket",
      "priceCheckedAt": "2026-10-23",
      "name": "Андаманда усан парк",
      "nameEn": "Andamanda Phuket Waterpark",
      "category": "adventure",
      "region": "Kathu, Phuket",
      "estimatedCost": 130039,
      "estimatedHours": 8,
      "imageUrl": "https://pub-83fca96d5b9048f795fabbfcdabba275.r2.dev/attractions/ph-att-13/1.webp",
      "images": [
        "https://pub-83fca96d5b9048f795fabbfcdabba275.r2.dev/attractions/ph-att-13/1.webp",
        "https://pub-83fca96d5b9048f795fabbfcdabba275.r2.dev/attractions/ph-att-13/2.webp",
        "https://pub-83fca96d5b9048f795fabbfcdabba275.r2.dev/attractions/ph-att-13/3.webp"
      ],
      "rating": 4.7,
      "highlights": [
        "Олон төрлийн гулсуур, усан сан",
        "Гэр бүлд ээлтэй 2026 Global 100 жагсаалт",
        "Бүтэн өдрийн нэвтрэх тасалбар (насанд хүрэгч)",
        "10:00-19:00 нээлттэй"
      ],
      "description": "Пукетийн хамгийн том усан парк. Гулсуур, давалгаат сан, амралтын бүсээр бүтэн өдрийн зугаа."
    },
    {
      "rank": 9,
      "id": "ph-att-05",
      "sourceUrl": "https://www.trip.com/travel-guide/attraction/phuket/chaithararam-temple-wat-chalong-82492?curr=MNT&locale=en-XX&poiType=3&scene=ticket",
      "priceCheckedAt": "2026-10-23",
      "name": "Ват Чалонг сүм",
      "nameEn": "Chaithararam Temple (Wat Chalong)",
      "category": "historical",
      "region": "Chalong, Mueang Phuket",
      "estimatedCost": 0,
      "estimatedHours": 1.5,
      "imageUrl": "https://pub-83fca96d5b9048f795fabbfcdabba275.r2.dev/attractions/ph-att-05/1.webp",
      "images": [
        "https://pub-83fca96d5b9048f795fabbfcdabba275.r2.dev/attractions/ph-att-05/1.webp",
        "https://pub-83fca96d5b9048f795fabbfcdabba275.r2.dev/attractions/ph-att-05/2.webp",
        "https://pub-83fca96d5b9048f795fabbfcdabba275.r2.dev/attractions/ph-att-05/3.webp"
      ],
      "rating": 4.7,
      "highlights": [
        "Пукетийн хамгийн том буддын сүм",
        "60 м өндөр Phra Mahathat пагод",
        "Бурханы амьдралыг дүрсэлсэн ханын зураг",
        "Нэвтрэх үнэгүй, 08:00-19:00"
      ],
      "description": "Пукет дахь хамгийн том буддын сүм. Улаан олон давхар дээвэр, алтан чимэглэл, 60 м өндөр пагодтой."
    },
    {
      "rank": 10,
      "id": "ph-att-10",
      "sourceUrl": "https://www.trip.com/travel-guide/attraction/phuket/siam-niramit-phuket-13384559?curr=MNT&locale=en-XX&poiType=3&scene=ticket",
      "priceCheckedAt": "2026-10-23",
      "name": "Сиам Нирамит шоу",
      "nameEn": "Siam Niramit Phuket",
      "category": "cultural",
      "region": "Mueang Phuket, Phuket",
      "estimatedCost": 82152,
      "estimatedHours": 4,
      "imageUrl": "https://pub-83fca96d5b9048f795fabbfcdabba275.r2.dev/attractions/ph-att-10/1.webp",
      "images": [
        "https://pub-83fca96d5b9048f795fabbfcdabba275.r2.dev/attractions/ph-att-10/1.webp",
        "https://pub-83fca96d5b9048f795fabbfcdabba275.r2.dev/attractions/ph-att-10/2.webp",
        "https://pub-83fca96d5b9048f795fabbfcdabba275.r2.dev/attractions/ph-att-10/3.webp"
      ],
      "rating": 4.7,
      "highlights": [
        "Тайландын түүх, соёлыг харуулсан том тоглолт",
        "Тасалбар + оройн хоолны багц сонголттой",
        "Орой 17:30-22:30",
        "Тайзны үзүүлбэр, заан бүхий тоглолт"
      ],
      "description": "Тайландын түүх соёлыг хөгжим, бүжиг, тайзны онцгой эффектээр харуулдаг том шоу. Шоуны өмнө хоолны хэсэгт зугаалах боломжтой."
    },
    {
      "rank": 11,
      "id": "ph-att-03",
      "sourceUrl": "https://www.trip.com/travel-guide/attraction/phuket/patong-boxing-stadium-sainamyen-33520226?curr=MNT&locale=en-XX&poiType=66&scene=ticket",
      "priceCheckedAt": "2026-10-23",
      "name": "Патонгийн Муай Тай цэнгэлдэх",
      "nameEn": "Patong Boxing Stadium Sainamyen",
      "category": "cultural",
      "region": "Patong, Kathu",
      "estimatedCost": 126038,
      "estimatedHours": 2,
      "imageUrl": "https://pub-83fca96d5b9048f795fabbfcdabba275.r2.dev/attractions/ph-att-03/1.webp",
      "images": [
        "https://pub-83fca96d5b9048f795fabbfcdabba275.r2.dev/attractions/ph-att-03/1.webp"
      ],
      "rating": 4.6,
      "highlights": [
        "Тайландын үндэсний тулааны урлаг Муай Тай",
        "Стадионы суудлын тасалбар (насанд хүрэгч)",
        "Тулаан дууссаны дараа тамирчидтай зураг авах",
        "08:00-23:00 нээлттэй"
      ],
      "description": "Пукетийн алдартай Муай Тай цэнгэлдэхүүдийн нэг. Эхлээд залуу тамирчид, дараа нь насанд хүрэгчид тулалдана."
    },
    {
      "rank": 12,
      "id": "ph-att-12",
      "sourceUrl": "https://www.trip.com/travel-guide/attraction/phuket/carnival-magic-phuket-135121819?curr=MNT&locale=en-XX&poiType=3&scene=ticket",
      "priceCheckedAt": "2026-10-23",
      "name": "Карнивал Мэжик",
      "nameEn": "Carnival Magic Phuket",
      "category": "city",
      "region": "Kamala, Kathu",
      "estimatedCost": 169551,
      "estimatedHours": 4,
      "imageUrl": "https://pub-83fca96d5b9048f795fabbfcdabba275.r2.dev/attractions/ph-att-12/1.webp",
      "images": [
        "https://pub-83fca96d5b9048f795fabbfcdabba275.r2.dev/attractions/ph-att-12/1.webp",
        "https://pub-83fca96d5b9048f795fabbfcdabba275.r2.dev/attractions/ph-att-12/2.webp",
        "https://pub-83fca96d5b9048f795fabbfcdabba275.r2.dev/attractions/ph-att-12/3.webp"
      ],
      "rating": 4.6,
      "highlights": [
        "Цирк, тоглолт, шөнийн зугаа цэнгэлийн парк",
        "General Seat тасалбар",
        "Орой 17:30-23:30",
        "Пукетийн шөнийн үзвэрийн Топ 4"
      ],
      "description": "Камала эрэгт байрлах том зугаа цэнгэлийн парк. Цирк, бүжиг, хөгжмийн шоуг нэг дор үзнэ."
    },
    {
      "rank": 13,
      "id": "ph-att-16",
      "sourceUrl": "https://www.trip.com/travel-guide/attraction/phuket/hanuman-world-28376705?curr=MNT&locale=en-XX&poiType=66&scene=ticket",
      "priceCheckedAt": "2026-10-23",
      "name": "Ханумэн Ворлд",
      "nameEn": "Hanuman World",
      "category": "adventure",
      "region": "Kathu, Phuket",
      "estimatedCost": 132387,
      "estimatedHours": 2.5,
      "imageUrl": "https://pub-83fca96d5b9048f795fabbfcdabba275.r2.dev/attractions/ph-att-16/1.webp",
      "images": [
        "https://pub-83fca96d5b9048f795fabbfcdabba275.r2.dev/attractions/ph-att-16/1.webp",
        "https://pub-83fca96d5b9048f795fabbfcdabba275.r2.dev/attractions/ph-att-16/2.webp",
        "https://pub-83fca96d5b9048f795fabbfcdabba275.r2.dev/attractions/ph-att-16/3.webp"
      ],
      "rating": 4.6,
      "highlights": [
        "Ширэнгэн ойн дундах зиплайн",
        "Роллер зиплайн, тэнгэрийн гүүр",
        "30 гаруй станц",
        "08:00-18:00, 15:00 хүртэл орно"
      ],
      "description": "Азийн хамгийн том адал явдалт парк. Хоёр мод хоорондын зиплайн, тэнгэрийн гүүр, ширэнгэн ойн хөтөлбөртэй."
    },
    {
      "rank": 14,
      "id": "ph-att-17",
      "sourceUrl": "https://www.trip.com/hotspoi/jungle-flight-in-phuket-148805128/",
      "priceCheckedAt": "2026-10-23",
      "name": "Ширэнгэн ойн нислэг",
      "nameEn": "Jungle Flight in Phuket",
      "category": "adventure",
      "region": "Kata, Phuket",
      "estimatedCost": 132387,
      "estimatedHours": 2.5,
      "imageUrl": "https://pub-83fca96d5b9048f795fabbfcdabba275.r2.dev/attractions/ph-att-17/1.webp",
      "images": [
        "https://pub-83fca96d5b9048f795fabbfcdabba275.r2.dev/attractions/ph-att-17/1.webp",
        "https://pub-83fca96d5b9048f795fabbfcdabba275.r2.dev/attractions/ph-att-17/2.webp",
        "https://pub-83fca96d5b9048f795fabbfcdabba275.r2.dev/attractions/ph-att-17/3.webp"
      ],
      "rating": 4.6,
      "highlights": [
        "Ширэнгэн ойн дундуур Тарзан шиг нисэх",
        "Андаманы тэнгисийн үзэмж",
        "Зиплайн, тэнгэрийн гүүр, шатан зам",
        "11 сараас 4 сар хүртэл хамгийн тохиромжтой"
      ],
      "description": "Ширэнгэн ойн дунд зиплайн, дүүжин гүүр, шат зэрэг төрөл бүрийн станцаар нисдэг адал явдал. Тасалбарын үнэ Hanuman World-тэй адил."
    },
    {
      "rank": 15,
      "id": "ph-att-15",
      "sourceUrl": "https://www.trip.com/travel-guide/attraction/phuket/dolphins-bay-phuket-23868376?curr=MNT&locale=en-XX&poiType=66&scene=ticket",
      "priceCheckedAt": "2026-10-23",
      "name": "Далайн гахайн булан",
      "nameEn": "Dolphins Bay Phuket",
      "category": "nature",
      "region": "Phuket",
      "estimatedCost": 76023,
      "estimatedHours": 2,
      "imageUrl": "https://pub-83fca96d5b9048f795fabbfcdabba275.r2.dev/attractions/ph-att-15/1.webp",
      "images": [
        "https://pub-83fca96d5b9048f795fabbfcdabba275.r2.dev/attractions/ph-att-15/1.webp",
        "https://pub-83fca96d5b9048f795fabbfcdabba275.r2.dev/attractions/ph-att-15/2.webp",
        "https://pub-83fca96d5b9048f795fabbfcdabba275.r2.dev/attractions/ph-att-15/3.webp"
      ],
      "rating": 4.7,
      "highlights": [
        "Далайн гахайн шоу, VIP суудал",
        "Насанд хүрэгч (Хятад, Тайланд бус оршин суугч)",
        "09:00-18:00",
        "Далайн гахайтай сэлэх сонголттой"
      ],
      "description": "Далайн гахайн хөтөлбөр, шоу үзэж, хүсвэл тэдэнтэй хамт сэлэх боломжтой. Гэр бүлд тохиромжтой."
    },
    {
      "rank": 16,
      "id": "ph-att-09",
      "sourceUrl": "https://www.trip.com/travel-guide/attraction/phuket/aquaria-phuket-71541534?curr=MNT&locale=en-XX&poiType=3&scene=ticket",
      "priceCheckedAt": "2026-10-23",
      "name": "Аквариа Пукет",
      "nameEn": "Aquaria Phuket",
      "category": "city",
      "region": "Central Phuket Floresta, Mueang Phuket",
      "estimatedCost": 51015,
      "estimatedHours": 2,
      "imageUrl": "https://pub-83fca96d5b9048f795fabbfcdabba275.r2.dev/attractions/ph-att-09/1.webp",
      "images": [
        "https://pub-83fca96d5b9048f795fabbfcdabba275.r2.dev/attractions/ph-att-09/1.webp",
        "https://pub-83fca96d5b9048f795fabbfcdabba275.r2.dev/attractions/ph-att-09/2.webp",
        "https://pub-83fca96d5b9048f795fabbfcdabba275.r2.dev/attractions/ph-att-09/3.webp"
      ],
      "rating": 4.6,
      "highlights": [
        "Central Floresta дэлгүүрийн B1 давхарт",
        "Далайн болон хуурай газрын амьтад",
        "10:30-19:00, 18:00 хүртэл орно",
        "Хүүхдүүдэд тохиромжтой"
      ],
      "description": "Central Phuket Floresta худалдааны төвд байрлах аквариум. Далайн амьтад, жижиг хуурай газрын амьтдыг ойроос үзнэ."
    },
    {
      "rank": 17,
      "id": "ph-att-07",
      "sourceUrl": "https://www.trip.com/travel-guide/attraction/phuket/phuket-bird-park-20629561?curr=MNT&locale=en-XX&poiType=3&scene=ticket",
      "priceCheckedAt": "2026-10-23",
      "name": "Пукетийн шувууны парк",
      "nameEn": "Phuket Bird Park",
      "category": "nature",
      "region": "Mueang Phuket, Phuket",
      "estimatedCost": 28699,
      "estimatedHours": 2,
      "imageUrl": "https://pub-83fca96d5b9048f795fabbfcdabba275.r2.dev/attractions/ph-att-07/1.webp",
      "images": [
        "https://pub-83fca96d5b9048f795fabbfcdabba275.r2.dev/attractions/ph-att-07/1.webp",
        "https://pub-83fca96d5b9048f795fabbfcdabba275.r2.dev/attractions/ph-att-07/2.webp",
        "https://pub-83fca96d5b9048f795fabbfcdabba275.r2.dev/attractions/ph-att-07/3.webp"
      ],
      "rating": 4.4,
      "highlights": [
        "1000 гаруй төрлийн шувуу",
        "Тайзны шоу, шувууны сургалтын үзүүлбэр",
        "Насанд хүрэгчийн тасалбар",
        "10:00-17:00"
      ],
      "description": "Азия, Африк, Өмнөд Америкийн 1000 гаруй зүйл шувуутай хувийн парк. Нээлттэй тайзан дээр шувуудын шоу явагддаг."
    },
    {
      "rank": 18,
      "id": "ph-att-06",
      "sourceUrl": "https://www.trip.com/travel-guide/attraction/phuket/mai-khao-beach-10523996?curr=MNT&locale=en-XX&poiType=3&scene=ticket",
      "priceCheckedAt": "2026-10-23",
      "name": "Май Као далайн эрэг",
      "nameEn": "Mai Khao Beach",
      "category": "nature",
      "region": "Mai Khao, Phuket",
      "estimatedCost": 0,
      "estimatedHours": 4,
      "imageUrl": "https://pub-83fca96d5b9048f795fabbfcdabba275.r2.dev/attractions/ph-att-06/1.webp",
      "images": [
        "https://pub-83fca96d5b9048f795fabbfcdabba275.r2.dev/attractions/ph-att-06/1.webp"
      ],
      "rating": 4.6,
      "highlights": [
        "Пукетийн хамгийн чимээгүй, урт эрэг",
        "Нар жаргах үед эрэг дээр заан үзэх",
        "Далайн хоолны ресторанууд",
        "Нэвтрэх үнэгүй"
      ],
      "description": "Нисэх буудлын ойролцоох намуухан урт эрэг. Нар жаргах үед эрэг дээр заан авч гарч, зураг авах боломжтой."
    },
    {
      "rank": 19,
      "id": "ph-att-04",
      "sourceUrl": "https://www.trip.com/travel-guide/attraction/phuket/tiger-kingdom-phuket-24140241?curr=MNT&locale=en-XX&poiType=3&scene=ticket",
      "priceCheckedAt": "2026-10-23",
      "name": "Барын хаант улс",
      "nameEn": "Tiger Kingdom Phuket",
      "category": "adventure",
      "region": "Kathu, Phuket",
      "estimatedCost": 268636,
      "estimatedHours": 2,
      "imageUrl": "https://pub-83fca96d5b9048f795fabbfcdabba275.r2.dev/attractions/ph-att-04/1.webp",
      "images": [
        "https://pub-83fca96d5b9048f795fabbfcdabba275.r2.dev/attractions/ph-att-04/1.webp"
      ],
      "rating": 4.6,
      "highlights": [
        "Янз бүрийн насны бар, ойроос зураг авах",
        "Том, дунд, жижиг бар + зочид буудлаас тээврийн багц",
        "Тасалбар авах шаардлагатай, 2 хүнээс",
        "09:00-17:30"
      ],
      "description": "Бар, жижиг баруудтай ойроос уулзаж, зураг авах хөтөлбөр. Багцад зочид буудлаас нэг талын тээвэр багтсан."
    }
  ],
  "hotels": [
    {
      "id": "hotel-ph-level-1",
      "sourceUrl": "https://www.trip.com/hotels/list?city=725&cityName=Phuket&checkin=2026-11-23&checkout=2026-11-24&adult=1&children=0&crn=1&curr=MNT&locale=en-XX",
      "priceCheckedAt": "2026-10-23",
      "name": "Хямд буудал (Төсөвт 2 од)",
      "starRating": 2,
      "pricePerNight": 95436,
      "imageUrl": "https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=800&q=80",
      "locationDesc": "Пукетийн хуучин хотод, Hop Inn Phuket Old Town-тэй ижил түвшний цэвэрхэн буудал",
      "amenities": [
        "Үнэгүй Wi-Fi",
        "Халуун ус",
        "24 цагийн хүлээн авах",
        "Агааржуулагч"
      ],
      "badge": "Төсөвт ээлтэй"
    },
    {
      "id": "hotel-ph-level-2",
      "sourceUrl": "https://www.trip.com/hotels/list?city=725&cityName=Phuket&checkin=2026-11-23&checkout=2026-11-24&adult=1&children=0&crn=1&curr=MNT&locale=en-XX",
      "priceCheckedAt": "2026-10-23",
      "name": "Энгийн буудал (Стандарт 3 од)",
      "starRating": 3,
      "pricePerNight": 96758,
      "imageUrl": "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80",
      "locationDesc": "Пукетийн хуучин хот, Horange Phuket Town зэрэг төвийн бүсэд, үнэгүй цуцлалттай",
      "amenities": [
        "Үнэгүй өндөр хурдны Wi-Fi",
        "Лифт",
        "Өдөр тутмын цэвэрлэгээ",
        "Үнэгүй цуцлалт"
      ],
      "badge": "Тохилог сонголт"
    },
    {
      "id": "hotel-ph-level-3",
      "sourceUrl": "https://www.trip.com/hotels/list?city=725&cityName=Phuket&checkin=2026-11-23&checkout=2026-11-24&adult=1&children=0&crn=1&curr=MNT&locale=en-XX",
      "priceCheckedAt": "2026-10-23",
      "name": "Тансаг буудал (Люкс 5 од)",
      "starRating": 5,
      "pricePerNight": 163278,
      "imageUrl": "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=800&q=80",
      "locationDesc": "Пукет хотын төвд, The Oceanic Sportel Phuket зэрэг 5 одтой цэвэр усан сантай буудал",
      "amenities": [
        "Цэвэр усан сан",
        "Фитнесс төв",
        "Спа",
        "24 цагийн өрөөний үйлчилгээ",
        "Консьерж"
      ],
      "badge": "Дээд зэрэглэл"
    }
  ],
  "transports": [
    {
      "id": "tr-ph-flight",
      "sourceUrl": "https://www.trip.com/flights/beijing-to-phuket/tickets-bjs-hkt/?dcity=bjs&acity=hkt&ddate=2026-11-23&rdate=2026-11-28&flighttype=rt&curr=MNT&locale=en-XX&quantity=1",
      "priceCheckedAt": "2026-10-23",
      "type": "flight",
      "title": "Бээжингээр дамжих нислэг",
      "durationText": "11-14 цаг (Бээжинд дамжин)",
      "pricePerPerson": 2315400,
      "description": "Улаанбаатар (UBN) → Бээжин (PEK) → Пукет (HKT) нислэг (Trip.com 1 сарын өмнөх эрт захиалгын үнэ, 2 талдаа)",
      "badge": "Хамгийн хурдан",
      "provider": "Trip.com (MIAT + Air China)",
      "departureFrom": "Улаанбаатар (UBN)",
      "arrivalAt": "Пукет (HKT)",
      "features": [
        "1. Улаанбаатар → Бээжин (шууд нислэг, 2ц 15мин)",
        "2. Бээжин → Пукет (Air China шууд нислэг, 6ц 5мин)",
        "Тээш багтсан (Round-trip)",
        "2 талын зардал багтсан"
      ]
    },
    {
      "id": "tr-ph-combined",
      "sourceUrl": "https://www.trip.com/flights/beijing-to-phuket/tickets-bjs-hkt/?dcity=bjs&acity=hkt&ddate=2026-11-23&rdate=2026-11-28&flighttype=rt&curr=MNT&locale=en-XX&quantity=1",
      "priceCheckedAt": "2026-10-23",
      "type": "combined",
      "title": "Газар + Нислэг хосолсон",
      "durationText": "30-36 цаг",
      "pricePerPerson": 1817360,
      "description": "Улаанбаатар → Замын-Үүд → Эрээн → Бээжин газраар, Бээжин → Пукет шууд нислэг (Trip.com тариф, 2 талдаа)",
      "badge": "Хэмнэлттэй",
      "provider": "УБТЗ + Хилийн автобус + Эрээн-Бээжин автобус + Trip.com нислэг",
      "departureFrom": "Улаанбаатар",
      "arrivalAt": "Пукет (HKT)",
      "features": [
        "1. Улаанбаатар → Замын-Үүд (УБТЗ галт тэрэг)",
        "2. Замын-Үүд → Эрээн (Хилийн автобус)",
        "3. Эрээн → Бээжин (Холын зайн унтлагын автобус)",
        "4. Бээжин → Пукет (Air China шууд нислэг, 6ц 5мин)",
        "2 талын (ирэх & буцах) зардал багтсан"
      ]
    }
  ]
}
];
