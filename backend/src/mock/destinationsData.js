/**
 * Realistic Mock Data for Indonesian Tourist Destinations
 * Used for offline testing, demos, and graceful fallback when external API quotas are exceeded.
 */

export const mockDestinations = {
  semarang: [
    {
      placeId: "smg_lawang_sewu",
      name: "Lawang Sewu",
      category: "Wisata Sejarah",
      rating: 4.6,
      userRatingsTotal: 48200,
      priceLevel: 1,
      estimatedPrice: 20000,
      lat: -6.9840,
      lng: 110.4103,
      address: "Jl. Pemuda No.160, Sekayu, Kec. Semarang Tengah, Kota Semarang",
      photoUrl: "https://thumb.wikimedia.org/wikipedia/commons/thumb/9/92/Lawang_Sewu_Semarang_Indonesia_1.jpg/960px-Lawang_Sewu_Semarang_Indonesia_1.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail",
      description: "Gedung bersejarah peninggalan kolonial Belanda dengan arsitektur pintu seribu yang megah dan museum kereta api.",
      openingHours: "08:00 - 20:00 WIB"
    },
    {
      placeId: "smg_sam_poo_kong",
      name: "Klenteng Sam Poo Kong",
      category: "Wisata Budaya & Religi",
      rating: 4.5,
      userRatingsTotal: 34100,
      priceLevel: 1,
      estimatedPrice: 25000,
      lat: -6.9962,
      lng: 110.3981,
      address: "Jl. Simongan No.129, Bongsari, Kec. Semarang Barat, Kota Semarang",
      photoUrl: "https://thumb.wikimedia.org/wikipedia/commons/thumb/3/33/Sam_Po_Kong.jpg/960px-Sam_Po_Kong.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail",
      description: "Klenteng tertua bernuansa akulturasi budaya Tionghoa dan Jawa, bekas tempat persinggahan Laksamana Cheng Ho.",
      openingHours: "08:00 - 20:00 WIB"
    },
    {
      placeId: "smg_kota_lama",
      name: "Kawasan Kota Lama Semarang",
      category: "Wisata Sejarah & Foto",
      rating: 4.7,
      userRatingsTotal: 52000,
      priceLevel: 0,
      estimatedPrice: 0,
      lat: -6.9680,
      lng: 110.4281,
      address: "Bandarharjo, Kec. Semarang Utara, Kota Semarang",
      photoUrl: "https://thumb.wikimedia.org/wikipedia/commons/thumb/8/8c/Kota_Lama_Semarang_4.jpg/960px-Kota_Lama_Semarang_4.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail",
      description: "Little Netherland dengan bangunan Eropa kuno terawat, Gereja Blenduk, kafe estetik, dan spot foto menarik.",
      openingHours: "Buka 24 Jam"
    },
    {
      placeId: "smg_lumpia_gang_lombok",
      name: "Lumpia Gang Lombok No. 11",
      category: "Kuliner Khas",
      rating: 4.6,
      userRatingsTotal: 8900,
      priceLevel: 1,
      estimatedPrice: 22000,
      lat: -6.9742,
      lng: 110.4261,
      address: "Gang Lombok No.11, Purwodinatan, Kec. Semarang Tengah, Kota Semarang",
      photoUrl: "https://upload.wikimedia.org/wikipedia/commons/2/24/Loenpia_Gang_Lombok_Semarang.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail_unscaled",
      description: "Pelopor lumpia legendaris di Semarang sejak abad ke-19, menyajikan lumpia basah dan goreng dengan rebung istimewa.",
      openingHours: "08:00 - 17:00 WIB"
    },
    {
      placeId: "smg_soto_bangkong",
      name: "Soto Bangkong Asli",
      category: "Kuliner Khas",
      rating: 4.4,
      userRatingsTotal: 15400,
      priceLevel: 1,
      estimatedPrice: 25000,
      lat: -6.9936,
      lng: 110.4326,
      address: "Jl. Brigjen Katamso No.1, Peterongan, Kec. Semarang Selatan, Kota Semarang",
      photoUrl: "https://thumb.wikimedia.org/wikipedia/commons/thumb/f/f5/Soto_Bangkong.JPG/960px-Soto_Bangkong.JPG?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail",
      description: "Soto ayam berkuah cokelat bening khas Semarang dengan pelengkap sate kerang, perkedel, dan tempe renyah.",
      openingHours: "07:00 - 22:00 WIB"
    },
    {
      placeId: "smg_tahu_gimbal_pak_man",
      name: "Tahu Gimbal Pak Man",
      category: "Kuliner Khas",
      rating: 4.5,
      userRatingsTotal: 6200,
      priceLevel: 1,
      estimatedPrice: 20000,
      lat: -6.9912,
      lng: 110.4219,
      address: "Jl. Plampitan No.54, Bangunharjo, Kec. Semarang Tengah, Kota Semarang",
      photoUrl: "https://thumb.wikimedia.org/wikipedia/commons/thumb/2/26/Tahu_gimbal_in_Semarang.jpg/960px-Tahu_gimbal_in_Semarang.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail",
      description: "Tahu gimbal porsi melimpah dengan bakwan udang renyah, lontong, tauge, dan bumbu petis kacang mantap.",
      openingHours: "10:00 - 16:00 WIB"
    }
  ],
  yogyakarta: [
    {
      placeId: "jog_prambanan",
      name: "Candi Prambanan",
      category: "Wisata Sejarah & Budaya",
      rating: 4.7,
      userRatingsTotal: 78000,
      priceLevel: 2,
      estimatedPrice: 50000,
      lat: -7.7520,
      lng: 110.4915,
      address: "Jl. Raya Solo - Yogyakarta No.16, Kranggan, Bokoharjo, Prambanan",
      photoUrl: "https://thumb.wikimedia.org/wikipedia/commons/thumb/e/e9/Candi_prambanan_di_malam_hari.jpg/960px-Candi_prambanan_di_malam_hari.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail",
      description: "Kompleks candi Hindu terbesar dan termegah di Indonesia berlatar arsitektur batu menjulang indah.",
      openingHours: "06:30 - 17:00 WIB"
    },
    {
      placeId: "jog_keraton",
      name: "Keraton Ngayogyakarta Hadiningrat",
      category: "Wisata Budaya",
      rating: 4.6,
      userRatingsTotal: 42000,
      priceLevel: 1,
      estimatedPrice: 15000,
      lat: -7.8053,
      lng: 110.3642,
      address: "Jl. Rotowijayan Blok No. 1, Panembahan, Kraton, Kota Yogyakarta",
      photoUrl: "https://thumb.wikimedia.org/wikipedia/commons/thumb/9/9e/Yogyakarta_Indonesia_Kraton-the-Sultans-Palace-02.jpg/960px-Yogyakarta_Indonesia_Kraton-the-Sultans-Palace-02.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail",
      description: "Pusat kebudayaan Jawa yang masih hidup, istana Sultan dengan museum pusaka dan pertunjukan gamelan.",
      openingHours: "08:30 - 14:00 WIB"
    },
    {
      placeId: "jog_tamansari",
      name: "Taman Sari Water Castle",
      category: "Wisata Sejarah & Foto",
      rating: 4.5,
      userRatingsTotal: 31000,
      priceLevel: 1,
      estimatedPrice: 15000,
      lat: -7.8099,
      lng: 110.3592,
      address: "Patehan, Kecamatan Kraton, Kota Yogyakarta",
      photoUrl: "https://thumb.wikimedia.org/wikipedia/commons/thumb/e/e1/Taman_Sari_Water_Castle%2C_Yogyakarta%2C_20220818_1041_8964.jpg/960px-Taman_Sari_Water_Castle%2C_Yogyakarta%2C_20220818_1041_8964.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail",
      description: "Bekas taman pemandian istana dan masjid bawah tanah dengan lorong mistis yang fotogenik.",
      openingHours: "09:00 - 15:00 WIB"
    },
    {
      placeId: "jog_gudeg_yu_djum",
      name: "Gudeg Yu Djum Wijilan 167",
      category: "Kuliner Khas",
      rating: 4.5,
      userRatingsTotal: 22000,
      priceLevel: 1,
      estimatedPrice: 35000,
      lat: -7.8041,
      lng: 110.3675,
      address: "Jl. Wijilan No.167, Panembahan, Kraton, Kota Yogyakarta",
      photoUrl: "https://thumb.wikimedia.org/wikipedia/commons/thumb/7/73/Gudeg_Yu_Djum_Pusat%2C_Jl._Laksda_Adi_Sucipto%2C_Yogyakarta_-_panoramio.jpg/960px-Gudeg_Yu_Djum_Pusat%2C_Jl._Laksda_Adi_Sucipto%2C_Yogyakarta_-_panoramio.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail",
      description: "Gudeg kering legendaris dimasak dengan kayu bakar, disajikan bersama krecek pedas dan ayam kampung.",
      openingHours: "06:00 - 22:00 WIB"
    },
    {
      placeId: "jog_malioboro",
      name: "Jalan Malioboro & Teras Malioboro",
      category: "Belanja & Kuliner",
      rating: 4.7,
      userRatingsTotal: 95000,
      priceLevel: 1,
      estimatedPrice: 20000,
      lat: -7.7928,
      lng: 110.3658,
      address: "Jl. Malioboro, Sosromenduran, Gedong Tengen, Kota Yogyakarta",
      photoUrl: "https://thumb.wikimedia.org/wikipedia/commons/thumb/f/f0/Malioboro_Street%2C_Yogyakarta.JPG/960px-Malioboro_Street%2C_Yogyakarta.JPG?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail",
      description: "Jantung kota Jogja untuk jalan santai, belanja oleh-oleh batik, bakpia, dan menikmati suasana malam.",
      openingHours: "Buka 24 Jam"
    }
  ],
  bandung: [
    {
      placeId: "bdg_gedung_sate",
      name: "Gedung Sate & Museum",
      category: "Wisata Sejarah",
      rating: 4.6,
      userRatingsTotal: 31000,
      priceLevel: 1,
      estimatedPrice: 10000,
      lat: -6.9025,
      lng: 107.6186,
      address: "Jl. Diponegoro No.22, Citarum, Kec. Bandung Wetan, Kota Bandung",
      photoUrl: "https://thumb.wikimedia.org/wikipedia/commons/thumb/0/01/Gedung_Sate_Bandung.jpg/960px-Gedung_Sate_Bandung.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail",
      description: "Ikon arsitektur khas Bandung dengan ornamen tusuk sate dan museum interaktif berteknologi tinggi.",
      openingHours: "09:30 - 16:00 WIB"
    },
    {
      placeId: "bdg_braga",
      name: "Jalan Braga Heritage Walk",
      category: "Wisata Kota & Kafe",
      rating: 4.7,
      userRatingsTotal: 58000,
      priceLevel: 1,
      estimatedPrice: 30000,
      lat: -6.9175,
      lng: 107.6096,
      address: "Jl. Braga, Sumur Bandung, Kota Bandung",
      photoUrl: "https://thumb.wikimedia.org/wikipedia/commons/thumb/c/c7/Bank_BJB_Headquarters_in_Braga_street%2C_Bandung_%281%29.jpg/960px-Bank_BJB_Headquarters_in_Braga_street%2C_Bandung_%281%29.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail",
      description: "Kawasan bernuansa Paris van Java dengan deretan kafe estetik, toko kue legendaris, dan lukisan jalanan.",
      openingHours: "Buka 24 Jam"
    },
    {
      placeId: "bdg_tebing_keraton",
      name: "Tebing Keraton",
      category: "Wisata Alam",
      rating: 4.6,
      userRatingsTotal: 18000,
      priceLevel: 1,
      estimatedPrice: 17000,
      lat: -6.8341,
      lng: 107.6636,
      address: "Ciburial, Kec. Cimenyan, Kabupaten Bandung Barat",
      photoUrl: "https://thumb.wikimedia.org/wikipedia/commons/thumb/f/fc/Tebing_Keraton_32.jpg/960px-Tebing_Keraton_32.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail",
      description: "Pemandangan kabut pagi dan hamparan hutan pinus Taman Hutan Raya Ir. H. Djuanda dari ketinggian tebing.",
      openingHours: "05:00 - 18:00 WIB"
    },
    {
      placeId: "bdg_paskal_food_market",
      name: "Paskal Food Market",
      category: "Kuliner",
      rating: 4.5,
      userRatingsTotal: 29000,
      priceLevel: 2,
      estimatedPrice: 45000,
      lat: -6.9154,
      lng: 107.5956,
      address: "Paskal Hyper Square, Jl. Pasir Kaliki No.25-27, Kota Bandung",
      photoUrl: "https://thumb.wikimedia.org/wikipedia/commons/thumb/4/43/Bandung_View_dari_Gedung_Wisma_HSBC_Asia_Afrika_4.jpg/960px-Bandung_View_dari_Gedung_Wisma_HSBC_Asia_Afrika_4.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=thumbnail",
      description: "Pusat kuliner outdoor dengan lebih dari 100 tenant kuliner khas Nusantara dan modern.",
      openingHours: "10:00 - 23:00 WIB"
    }
  ],
  bali: [
    {
      placeId: "bali_tanah_lot",
      name: "Pura Tanah Lot",
      category: "Wisata Budaya & Alam",
      rating: 4.7,
      userRatingsTotal: 84000,
      priceLevel: 2,
      estimatedPrice: 30000,
      lat: -8.6212,
      lng: 115.0868,
      address: "Beraban, Kec. Kediri, Kabupaten Tabanan, Bali",
      photoUrl: "https://thumb.wikimedia.org/wikipedia/commons/thumb/d/dc/Bali_-_Pura_Tanah_Lot%2C_20220827_0957_1108.jpg/960px-Bali_-_Pura_Tanah_Lot%2C_20220827_0957_1108.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail",
      description: "Pura sakral di atas bongkahan batu karang besar di tengah deburan ombak samudra, spektakuler saat sunset.",
      openingHours: "06:00 - 19:00 WITA"
    },
    {
      placeId: "bali_monkey_forest",
      name: "Sacred Monkey Forest Sanctuary Ubud",
      category: "Wisata Alam & Budaya",
      rating: 4.6,
      userRatingsTotal: 51000,
      priceLevel: 2,
      estimatedPrice: 80000,
      lat: -8.5194,
      lng: 115.2631,
      address: "Jl. Monkey Forest, Ubud, Kecamatan Ubud, Kabupaten Gianyar, Bali",
      photoUrl: "https://thumb.wikimedia.org/wikipedia/commons/thumb/5/52/Macaca_fascicularis%2C_Ubud_Monkey_Forest%2C_Bali%2C_20220822_1012_9935.jpg/960px-Macaca_fascicularis%2C_Ubud_Monkey_Forest%2C_Bali%2C_20220822_1012_9935.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail",
      description: "Hutan lindung nan asri yang dihuni ratusan monyet ekor panjang dan candi-candi kuno mistis.",
      openingHours: "09:00 - 18:00 WITA"
    },
    {
      placeId: "bali_campuhan",
      name: "Campuhan Ridge Walk",
      category: "Wisata Alam & Trekking",
      rating: 4.6,
      userRatingsTotal: 19000,
      priceLevel: 0,
      estimatedPrice: 0,
      lat: -8.5036,
      lng: 115.2547,
      address: "Kelusa, Payangan, Jl. Raya Campuan, Sayan, Kecamatan Ubud, Bali",
      photoUrl: "https://thumb.wikimedia.org/wikipedia/commons/thumb/3/35/Campuhan_Ridge_Walk%2C_Ubud%2C_Bali_%2815003625958%29.jpg/960px-Campuhan_Ridge_Walk%2C_Ubud%2C_Bali_%2815003625958%29.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail",
      description: "Jalur jalan santai menyusuri bukit berpadang ilalang hijau dengan lembah sungai di kedua sisi.",
      openingHours: "Buka 24 Jam"
    }
  ]
};

/**
 * Helper to get places for a given location query with fallback
 */
export function getMockPlacesForLocation(location, categories = [], budget = 0) {
  const locLower = (location || '').toLowerCase().trim();
  if (!locLower) return [];

  let matchedKey = Object.keys(mockDestinations).find(key => 
    locLower.includes(key) || key.includes(locLower)
  );

  if (!matchedKey) return [];

  let places = [...mockDestinations[matchedKey]];

  // If user specified categories, we can prioritize them
  if (categories && categories.length > 0) {
    const catKeywords = categories.map(c => c.toLowerCase());
    places.sort((a, b) => {
      const aMatches = catKeywords.some(k => a.category.toLowerCase().includes(k) || a.description.toLowerCase().includes(k));
      const bMatches = catKeywords.some(k => b.category.toLowerCase().includes(k) || b.description.toLowerCase().includes(k));
      return (bMatches ? 1 : 0) - (aMatches ? 1 : 0);
    });
  }

  // Filter or flag by budget if specified
  if (budget > 0) {
    // Keep places that can fit reasonable budget
    places = places.filter(p => p.estimatedPrice <= budget);
    if (places.length < 3) {
      // Fallback: restore full list so user gets recommendations
      places = [...mockDestinations[matchedKey]];
    }
  }

  return places;
}
