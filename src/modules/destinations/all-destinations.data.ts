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
}
];
