/**
 * AEGIS (Askrindo Environmental & Geospatial Intelligence System)
 * Data Repository — Memanfaatkan Framework Askrindo Georisk Platform
 * & Diperluas untuk memenuhi seluruh spesifikasi PDF "Panel Interface" serta AEGIS_Final_Planning_Brief.md
 *
 * CATATAN TATA KELOLA:
 * - Seluruh data polis, klaim, asesmen, dan nilai TSI pada repositori ini berstatus DUMMY / DATA SIMULASI.
 * - Status "NO_DATA" berarti data/layer belum tersedia atau di luar cakupan, BUKAN berarti lokasi aman ("LOW" / "NONE").
 */

// 9 Bahaya Utama sesuai PDF Panel Interface (Hal. 2, 4, 7)
const AEGIS_PERILS = [
  { key: "flood", label: "Flood", idLabel: "Banjir", icon: "fa-house-flood-water", color: "#3B82F6" },
  { key: "landslide", label: "Landslide", idLabel: "Tanah Longsor", icon: "fa-mountain", color: "#D97706" },
  { key: "earthquake", label: "Earthquake", idLabel: "Gempa Bumi", icon: "fa-house-crack", color: "#EF4444" },
  { key: "wildfire", label: "Wildfire / Fire", idLabel: "Kebakaran / Titik Panas", icon: "fa-fire", color: "#F97316" },
  { key: "extremeWeather", label: "Extreme Weather", idLabel: "Cuaca Ekstrem", icon: "fa-cloud-bolt", color: "#06B6D4" },
  { key: "drought", label: "Drought", idLabel: "Kekeringan", icon: "fa-sun-plant-wilt", color: "#EAB308" },
  { key: "liquefaction", label: "Liquefaction", idLabel: "Likuefaksi", icon: "fa-water-ladder", color: "#8B5CF6" },
  { key: "tsunami", label: "Tsunami", idLabel: "Tsunami", icon: "fa-water", color: "#0EA5E9" },
  { key: "volcano", label: "Volcanic Eruption", idLabel: "Erupsi Gunung Api", icon: "fa-volcano", color: "#EC4899" }
];

// ============================================================================
// DAFTAR KODE OKUPASI RESMI OTORITAS JASA KEUANGAN (OJK)
// Berdasarkan Surat Edaran OJK Nomor 6/SEOJK.05/2017 Lampiran I Tabel I.A (Hal. 2-23)
// ============================================================================
const SEOJK_OCCUPATION_CODES = [
  // --- Kategori 20: Pertambangan Logam, Minyak, Gas & Batubara ---
  { code: "200", category: "20 - Pertambangan & Logam", name: "Mining of precious metal (Gold, Silver, Platinum)", nameId: "Tambang logam mulia (Emas, Perak, Platina)" },
  { code: "201", category: "20 - Pertambangan & Logam", name: "Mining of Aluminium including Smelting and Refinery", nameId: "Tambang aluminium termasuk peleburan & pemurnian" },
  { code: "2020", category: "20 - Pertambangan & Logam", name: "Iron Mines (underground or above ground)", nameId: "Tambang bijih besi (bawah tanah atau permukaan)" },
  { code: "2021", category: "20 - Pertambangan & Logam", name: "Blast Furnaces and Iron Foundries", nameId: "Tungku pembakar & peleburan besi" },
  { code: "203", category: "20 - Pertambangan & Logam", name: "Steelworks and Rolling Mills", nameId: "Pabrik baja & penggulungan pelat baja" },
  { code: "2041", category: "20 - Pertambangan & Logam", name: "Exploration & Production for Crude Petroleum (on-shore)", nameId: "Eksplorasi & produksi minyak bumi mentah (darat)" },
  { code: "2042", category: "20 - Pertambangan & Logam", name: "Crude Petroleum Pipelines & Pump Stations", nameId: "Pipa minyak bumi mentah & stasiun pompa (darat)" },
  { code: "2043", category: "20 - Pertambangan & Logam", name: "Natural Gas & Geothermal Exploration & Production", nameId: "Eksplorasi & produksi gas alam dan panas bumi" },
  { code: "2044", category: "20 - Pertambangan & Logam", name: "Natural Gas Transmission & Distribution Pipelines", nameId: "Transmisi & distribusi pipa gas alam & geotermal" },
  { code: "2045", category: "20 - Pertambangan & Logam", name: "Terminal for Crude Oil", nameId: "Terminal penampungan minyak mentah" },
  { code: "2046", category: "20 - Pertambangan & Logam", name: "Terminals for Liquefied Gases (LPG/LNG)", nameId: "Terminal penampungan gas cair (LPG/LNG)" },
  { code: "2047", category: "20 - Pertambangan & Logam", name: "Other petroleum and gas products", nameId: "Produk minyak dan gas lainnya" },
  { code: "2048", category: "20 - Pertambangan & Logam", name: "Degasification Stations", nameId: "Stasiun degasifikasi gas bumi" },
  { code: "2049", category: "20 - Pertambangan & Logam", name: "Off-shore Oil & Gas Facilities", nameId: "Fasilitas minyak dan gas lepas pantai (offshore)" },
  { code: "2051", category: "20 - Pertambangan & Logam", name: "Mines Extraction & Processing above ground", nameId: "Tambang mineral bukan besi di atas tanah" },
  { code: "2052", category: "20 - Pertambangan & Logam", name: "Mines Extraction & Processing below ground", nameId: "Tambang mineral bukan besi bawah tanah" },
  { code: "206", category: "20 - Pertambangan & Logam", name: "Foundries & Reduction Plants for Metals", nameId: "Peleburan logam (selain besi, aluminium, mulia)" },
  { code: "2071", category: "20 - Pertambangan & Logam", name: "Coal & Lignite Extraction above ground (surface)", nameId: "Tambang batubara terbuka (permukaan)" },
  { code: "2072", category: "20 - Pertambangan & Logam", name: "Coal & Lignite Extraction below ground", nameId: "Tambang batubara bawah tanah" },
  { code: "2073", category: "20 - Pertambangan & Logam", name: "Coal Coking Plants (Kokas)", nameId: "Pabrik kokas batubara" },
  { code: "2074", category: "20 - Pertambangan & Logam", name: "Manufacturing of Coal Briquettes", nameId: "Pabrik briket batubara" },
  { code: "2081", category: "20 - Pertambangan & Logam", name: "Salt mines from rock or evaporated deposit", nameId: "Tambang garam batu / deposit evaporasi" },
  { code: "2082", category: "20 - Pertambangan & Logam", name: "Salt extraction from sea water (tambak garam)", nameId: "Tambak garam air laut" },
  { code: "209", category: "20 - Pertambangan & Logam", name: "Peat extraction & processing", nameId: "Penambangan & pengolahan gambut" },

  // --- Kategori 21: Industri Galian Bukan Logam (Semen, Kaca, Keramik) ---
  { code: "210", category: "21 - Galian Bukan Logam", name: "Stone, gravel and sand extraction installations", nameId: "Penambangan batu, kerikil, dan pasir" },
  { code: "21121", category: "21 - Galian Bukan Logam", name: "Cement Factories with rotary kiln", nameId: "Pabrik semen dengan rotary kiln" },
  { code: "21122", category: "21 - Galian Bukan Logam", name: "Cement Factories without rotary kiln", nameId: "Pabrik semen tanpa rotary kiln" },
  { code: "2113", category: "21 - Galian Bukan Logam", name: "Concrete product, Ready Mixed Concrete, mortar, gips", nameId: "Industri beton siap pakai (ready mix), batako, mortar, gips" },
  { code: "2114", category: "21 - Galian Bukan Logam", name: "Artificial Teeth, non plastic", nameId: "Pembuatan gigi tiruan non-plastik" },
  { code: "2121", category: "21 - Galian Bukan Logam", name: "Asbestos products, Cut stone and stone products", nameId: "Produk asbes & pemotongan batu alam" },
  { code: "2131", category: "21 - Galian Bukan Logam", name: "Brick & Structural Clay Tile (Tunnel Kilns)", nameId: "Pabrik bata, genteng, ubin tanah liat (tunnel kiln)" },
  { code: "2132", category: "21 - Galian Bukan Logam", name: "Brick & Structural Clay Tile (other types of kilns)", nameId: "Pabrik bata & genteng dengan tungku pembakar lainnya" },
  { code: "2141", category: "21 - Galian Bukan Logam", name: "Porcelain, Pottery, Ceramic Tiles (Tunnel Kilns)", nameId: "Pabrik porselen, tembikar & keramik (tunnel kiln)" },
  { code: "2142", category: "21 - Galian Bukan Logam", name: "Porcelain, Pottery, Ceramic Tiles (other kilns)", nameId: "Pabrik porselen & keramik dengan tungku lainnya" },
  { code: "2151", category: "21 - Galian Bukan Logam", name: "Glass container, Pressed and Blown Glassware", nameId: "Pabrik botol kaca & barang gelas cetak" },
  { code: "2152", category: "21 - Galian Bukan Logam", name: "Flat Glass including tempered", nameId: "Pabrik kaca lembaran & kaca tempered" },
  { code: "216", category: "21 - Galian Bukan Logam", name: "Glass Products (lenses, safety glass, mirror)", nameId: "Produk olahan kaca (lensa, kaca pengaman, cermin)" },
  { code: "217", category: "21 - Galian Bukan Logam", name: "Precious stone workshops & processing plant", nameId: "Bengkel & pengolahan batu mulia / perhiasan" },
  { code: "218", category: "21 - Galian Bukan Logam", name: "Emery and abrasive materials factories", nameId: "Pabrik bahan ampelas dan abrasif" },
  { code: "219", category: "21 - Galian Bukan Logam", name: "Asphalt and roofing felt factories", nameId: "Pabrik aspal olahan & bahan atap aspal" },

  // --- Kategori 22: Produk Logam Dasar, Mesin, Elektronik & Kendaraan ---
  { code: "2201", category: "22 - Produk Logam & Mesin", name: "Sheet rolling mills, foil, forging, locksmiths", nameId: "Penggulungan pelat logam, tempa besi, konstruksi logam" },
  { code: "2202", category: "22 - Produk Logam & Mesin", name: "Metal product from metal powder (metalurgi bubuk)", nameId: "Produk logam cetak pres & metalurgi bubuk" },
  { code: "22111", category: "22 - Produk Logam & Mesin", name: "Industrial & Mining Machinery (without melting)", nameId: "Pabrik mesin industri & tambang (tanpa peleburan)" },
  { code: "22112", category: "22 - Produk Logam & Mesin", name: "Industrial & Mining Machinery (with melting)", nameId: "Pabrik mesin industri & tambang (dengan peleburan)" },
  { code: "2212", category: "22 - Produk Logam & Mesin", name: "Metal Coating Services (galvanizing, anodizing)", nameId: "Pelapisan logam (galvanisasi, anodisasi, pencelupan)" },
  { code: "2214", category: "22 - Produk Logam & Mesin", name: "Metal/Steel Furniture factories (plastic cupboards, chairs)", nameId: "Pabrik perabot baja/logam, lemari & kursi lipat" },
  { code: "2221", category: "22 - Produk Logam & Mesin", name: "Manufacture & repair of electrical machines", nameId: "Pabrik perakitan & perbaikan mesin listrik" },
  { code: "2222", category: "22 - Produk Logam & Mesin", name: "Wet & dry battery factories (aki/baterai)", nameId: "Pabrik baterai kering & aki basah" },
  { code: "2223", category: "22 - Produk Logam & Mesin", name: "Measuring equipment & scientific instruments", nameId: "Pabrik instrumen presisi, alat ukur & optik" },
  { code: "2231", category: "22 - Produk Logam & Mesin", name: "Wire factories (pabrik kawat)", nameId: "Pabrik kawat logam" },
  { code: "2232", category: "22 - Produk Logam & Mesin", name: "Cable factories (pabrik kabel)", nameId: "Pabrik kabel listrik & kabel data" },
  { code: "2233", category: "22 - Produk Logam & Mesin", name: "Nails, screws, bolts and nuts factories", nameId: "Pabrik paku, sekrup, baut dan mur" },
  { code: "2241", category: "22 - Produk Logam & Mesin", name: "Vehicle construction (bicycle, becak, 3-wheels)", nameId: "Pabrik perakitan sepeda dan kendaraan roda tiga" },
  { code: "2242", category: "22 - Produk Logam & Mesin", name: "Construction of railway carriages & locomotives", nameId: "Pabrik gerbong kereta api & lokomotif" },
  { code: "2243", category: "22 - Produk Logam & Mesin", name: "Aircraft construction plants (pabrik pesawat terbang)", nameId: "Pabrik & perakitan pesawat terbang / kedirgantaraan" },
  { code: "2244", category: "22 - Produk Logam & Mesin", name: "Ship construction, naval shipyards (galangan kapal)", nameId: "Galangan pembuatan & perbaikan kapal laut" },
  { code: "2245", category: "22 - Produk Logam & Mesin", name: "Vehicle assembling plants (perakitan mobil/motor)", nameId: "Pabrik perakitan kendaraan bermotor (APM otomotif)" },
  { code: "2251", category: "22 - Produk Logam & Mesin", name: "Manufacture of telecommunication apparatus", nameId: "Pabrik perangkat telekomunikasi" },
  { code: "2252", category: "22 - Produk Logam & Mesin", name: "Manufacture of computer apparatus", nameId: "Pabrik perakitan komputer & perangkat IT" },
  { code: "2253", category: "22 - Produk Logam & Mesin", name: "Manufacture of Integrated Circuit (IC) from chips", nameId: "Pabrik semikonduktor & Integrated Circuit (IC)" },
  { code: "2261", category: "22 - Produk Logam & Mesin", name: "Radio, TV, audio-video receiver & player factories", nameId: "Pabrik perangkat radio, TV, dan audio visual" },
  { code: "227", category: "22 - Produk Logam & Mesin", name: "Light Bulb Factories, LED, Neon Signs", nameId: "Pabrik lampu pijar, neon, dan LED" },
  { code: "228", category: "22 - Produk Logam & Mesin", name: "Watches and clocks factories (pabrik jam)", nameId: "Pabrik jam tangan dan jam dinding" },

  // --- Kategori 23: Produk Kimia, Farmasi, Minyak & Petrokimia ---
  { code: "230011", category: "23 - Kimia & Farmasi", name: "General Chemical Products flammable (biofuel, oleochemical)", nameId: "Pabrik kimia umum mudah terbakar (biofuel, oleokimia)" },
  { code: "230012", category: "23 - Kimia & Farmasi", name: "General Chemical Products non flammable", nameId: "Pabrik kimia umum tidak mudah terbakar" },
  { code: "23002", category: "23 - Kimia & Farmasi", name: "Pharmaceutical Products & Medicated Plaster", nameId: "Pabrik farmasi, obat-obatan & plester medis" },
  { code: "23003", category: "23 - Kimia & Farmasi", name: "Natural Drug / Jamu / Herbal Medicine", nameId: "Industri obat tradisional / jamu herbal" },
  { code: "23004", category: "23 - Kimia & Farmasi", name: "Pesticides and agricultural chemicals", nameId: "Pabrik pestisida dan bahan kimia pertanian" },
  { code: "230051", category: "23 - Kimia & Farmasi", name: "Paint & Varnish - Solvent base product", nameId: "Pabrik cat dan pernis (berbasis pelarut kimia)" },
  { code: "230052", category: "23 - Kimia & Farmasi", name: "Paint & Varnish - Water base product", nameId: "Pabrik cat berbasis air (water base)" },
  { code: "23006", category: "23 - Kimia & Farmasi", name: "Acid, Alkaline Factories (pabrik asam dan basa)", nameId: "Pabrik bahan kimia asam dan alkali" },
  { code: "23008", category: "23 - Kimia & Farmasi", name: "Air Separation Plants (Oxygen, Nitrogen, Hydrogen)", nameId: "Pabrik pemisahan gas udara teknis (O2, N2, H2)" },
  { code: "230121", category: "23 - Kimia & Farmasi", name: "Ink Factory - solvent base (pabrik tinta)", nameId: "Pabrik tinta berbasis solvent" },
  { code: "2310", category: "23 - Kimia & Farmasi", name: "Oil Refinery (kilang minyak bumi, bensin, avtur)", nameId: "Kilang pengolahan minyak bumi (refinery)" },
  { code: "23115", category: "23 - Kimia & Farmasi", name: "Lubricating oils and greases blending (oli/pelumas)", nameId: "Pabrik pencampuran minyak pelumas dan gemuk" },
  { code: "2321", category: "23 - Kimia & Farmasi", name: "Primary Petrochemical Works (Ethylene, Propylene)", nameId: "Industri petrokimia hulu dasar (etilen, propilen)" },
  { code: "2323", category: "23 - Kimia & Farmasi", name: "Polymerization (PP, PET, PE, PVC, Teflon)", nameId: "Pabrik polimer plastik skala besar (PET, PE, PVC)" },
  { code: "23241", category: "23 - Kimia & Farmasi", name: "Fertilizer on petrochemical basis (Urea/Ammonia)", nameId: "Pabrik pupuk petrokimia (Urea, Amonia)" },
  { code: "2326", category: "23 - Kimia & Farmasi", name: "Liquefaction of Natural Gas (LNG Plant)", nameId: "Kilang pencairan gas alam (LNG)" },
  { code: "2327", category: "23 - Kimia & Farmasi", name: "Liquefaction of Petroleum Gases (LPG Plant)", nameId: "Kilang pencairan gas minyak bumi (LPG)" },
  { code: "2331", category: "23 - Kimia & Farmasi", name: "Crude Oil Storage Tanks (non terminal)", nameId: "Tangki penimbunan minyak mentah non-terminal" },
  { code: "2333", category: "23 - Kimia & Farmasi", name: "Liquefied Gases Storage Tanks (non terminal)", nameId: "Tangki penimbunan gas cair non-terminal" },
  { code: "2341", category: "23 - Kimia & Farmasi", name: "Plastic products manufacture by molding & extrusion", nameId: "Pabrik cetak produk plastik injeksi & ekstrusi" },
  { code: "2342", category: "23 - Kimia & Farmasi", name: "Foam and expanded plastics (pabrik busa)", nameId: "Pabrik busa poliuretan dan plastik spons" },
  { code: "235", category: "23 - Kimia & Farmasi", name: "Manufacture of Artificial Fibres (rayon, nylon)", nameId: "Pabrik serat sintetis (rayon, nilon, poliester)" },
  { code: "2371", category: "23 - Kimia & Farmasi", name: "Manufacture of soaps, detergents and polishes", nameId: "Pabrik sabun, deterjen, dan pembersih" },
  { code: "2372", category: "23 - Kimia & Farmasi", name: "Manufacture of perfumes and cosmetic products", nameId: "Pabrik minyak wangi, kosmetik dan produk kecantikan" },
  { code: "238", category: "23 - Kimia & Farmasi", name: "Chemical fertilizer factories (conventional)", nameId: "Pabrik pupuk kimia konvensional" },
  { code: "2399", category: "23 - Kimia & Farmasi", name: "Powder, Explosives, Matches and Fireworks", nameId: "Pabrik bahan peledak, korek api, kembang api" },

  // --- Kategori 24: Tekstil, Garmen & Konveksi ---
  { code: "2402", category: "24 - Tekstil & Pakaian Jadi", name: "Spinning mills (vegetable & cellulose fibres)", nameId: "Pemintalan benang serat nabati/selulosa" },
  { code: "2412", category: "24 - Tekstil & Pakaian Jadi", name: "Weaving processes (vegetable & cellulose fibres)", nameId: "Penenunan kain serat kapas/selulosa" },
  { code: "2422", category: "24 - Tekstil & Pakaian Jadi", name: "Dressing and finishing processes (textile)", nameId: "Pencelupan, pencapan & penyempurnaan tekstil" },
  { code: "2451", category: "24 - Tekstil & Pakaian Jadi", name: "Ropemakers, stringmakers and sackmakers", nameId: "Pabrik tali tambang dan karung goni/plastik" },
  { code: "2452", category: "24 - Tekstil & Pakaian Jadi", name: "Blanket weaving mills and carpet manufacture", nameId: "Pabrik tenun selimut dan karpet" },
  { code: "2461", category: "24 - Tekstil & Pakaian Jadi", name: "Knitting mills, hosiery & glove factories", nameId: "Pabrik rajutan, kaos kaki dan sarung tangan" },
  { code: "2462", category: "24 - Tekstil & Pakaian Jadi", name: "Clothing & garment factory (large scale)", nameId: "Pabrik pakaian jadi / garmen skala besar" },
  { code: "2464", category: "24 - Tekstil & Pakaian Jadi", name: "Batik Establishments", nameId: "Industri pembuatan kain & busana batik" },
  { code: "2465", category: "24 - Tekstil & Pakaian Jadi", name: "Konveksi pakaian skala kecil / home industry", nameId: "Konveksi pakaian, jaket (skala kecil/rumahan)" },
  { code: "2466", category: "24 - Tekstil & Pakaian Jadi", name: "Zipper Factories (pabrik ritsleting)", nameId: "Pabrik kancing dan ritsleting pakaian" },
  { code: "2491", category: "24 - Tekstil & Pakaian Jadi", name: "Laundries and pressers (penatu komersial)", nameId: "Jasa binatu komersial dan setrika" },
  { code: "2492", category: "24 - Tekstil & Pakaian Jadi", name: "Dry (chemical) cleaning establishments", nameId: "Jasa dry cleaning dengan bahan kimia" },

  // --- Kategori 25: Kayu Olahan, Kertas, Percetakan, Kulit & Karet ---
  { code: "2501", category: "25 - Kertas, Percetakan & Karet", name: "Wood pulp and cellulose based on wood pulp", nameId: "Pabrik bubur kertas (wood pulp) & selulosa" },
  { code: "2511", category: "25 - Kertas, Percetakan & Karet", name: "Paper manufacture (pabrik kertas)", nameId: "Pabrik kertas tulis & kertas cetak" },
  { code: "2512", category: "25 - Kertas, Percetakan & Karet", name: "Manufacture of cardboard and hardboard", nameId: "Pabrik kertas karton dan hardboard" },
  { code: "2521", category: "25 - Kertas, Percetakan & Karet", name: "Carton & corrugated paper products", nameId: "Pabrik kemasan kardus & karton gelombang" },
  { code: "2523", category: "25 - Kertas, Percetakan & Karet", name: "Bookbinders (usaha penjilidan buku)", nameId: "Usaha penjilidan buku dan dokumen" },
  { code: "2531", category: "25 - Kertas, Percetakan & Karet", name: "Newspaper printers (percetakan surat kabar)", nameId: "Percetakan surat kabar dan tabloid" },
  { code: "2532", category: "25 - Kertas, Percetakan & Karet", name: "Commercial & art printing, lithographers, sablon", nameId: "Percetakan umum, sablon dan percetakan seni" },
  { code: "256", category: "25 - Kertas, Percetakan & Karet", name: "Leather production and tanneries", nameId: "Industri penyamakan dan pengolahan kulit" },
  { code: "2571", category: "25 - Kertas, Percetakan & Karet", name: "Shoe factories - Leather", nameId: "Pabrik sepatu kulit" },
  { code: "2572", category: "25 - Kertas, Percetakan & Karet", name: "Shoe factories - Rubber and/or Canvas", nameId: "Pabrik sepatu kanvas dan karet" },
  { code: "2581", category: "25 - Kertas, Percetakan & Karet", name: "Leather goods factories (tas, koper kulit)", nameId: "Pabrik barang-barang kulit (tas, dompet, koper)" },
  { code: "2591", category: "25 - Kertas, Percetakan & Karet", name: "Rubber goods factories (barang dari karet)", nameId: "Pabrik barang-barang olahan karet" },
  { code: "2592", category: "25 - Kertas, Percetakan & Karet", name: "Foamed rubber factories (karet busa)", nameId: "Pabrik lateks busa dan spon karet" },
  { code: "2593", category: "25 - Kertas, Percetakan & Karet", name: "Tyre factories and vulcanizing works", nameId: "Pabrik ban kendaraan dan vulkanisir ban" },
  { code: "2596", category: "25 - Kertas, Percetakan & Karet", name: "Crumb Rubber Factories (remah karet)", nameId: "Pabrik remah karet alam (crumb rubber)" },

  // --- Kategori 26: Industri Kayu, Mebel & Plywood ---
  { code: "2601", category: "26 - Pengolahan Kayu & Mebel", name: "Sawmills, panglong (penggergajian kayu)", nameId: "Pabrik penggergajian kayu (sawmill/panglong)" },
  { code: "2602", category: "26 - Pengolahan Kayu & Mebel", name: "Carpenter shops & parquet factories", nameId: "Bengkel tukang kayu dan lantai kayu parket" },
  { code: "261", category: "26 - Pengolahan Kayu & Mebel", name: "Furniture manufacture, wooden & rattan", nameId: "Pabrik mebel / furnitur kayu dan rotan" },
  { code: "2621", category: "26 - Pengolahan Kayu & Mebel", name: "Manufacture of fibreboard, hardboard, Masonite", nameId: "Pabrik papan serat kayu dan hardboard" },
  { code: "2623", category: "26 - Pengolahan Kayu & Mebel", name: "Manufacture of plywood (triplex, multiplex, veneer)", nameId: "Pabrik kayu lapis (tripleks, multipleks, veneer)" },
  { code: "264", category: "26 - Pengolahan Kayu & Mebel", name: "Wicker-Work Factories (anyaman bambu & rotan)", nameId: "Kerajinan anyaman bambu dan rotan" },
  { code: "268", category: "26 - Pengolahan Kayu & Mebel", name: "Wooden musical instruments factories", nameId: "Pabrik alat musik berbahan kayu" },

  // --- Kategori 27: Industri Makanan, Minuman & Hasil Bumi ---
  { code: "2701", category: "27 - Makanan & Minuman", name: "Corn mills (penggilingan jagung)", nameId: "Pabrik penggilingan jagung" },
  { code: "2702", category: "27 - Makanan & Minuman", name: "Fodder mills (pabrik pakan ternak)", nameId: "Pabrik pakan ternak dan unggas" },
  { code: "2705", category: "27 - Makanan & Minuman", name: "Flour Mills (terigu, tapioka, sagu, beras)", nameId: "Pabrik tepung terigu, tapioka, sagu dan beras" },
  { code: "2709", category: "27 - Makanan & Minuman", name: "Paddy & Hulling Mills (penggilingan padi/gabah)", nameId: "Penggilingan padi / penggilingan beras" },
  { code: "27111", category: "27 - Makanan & Minuman", name: "Sugar refinery plant (pabrik gula rafinasi)", nameId: "Pabrik pengolahan gula rafinasi" },
  { code: "27112", category: "27 - Makanan & Minuman", name: "Cane sugar plant (pabrik gula tebu)", nameId: "Pabrik gula tebu" },
  { code: "27113", category: "27 - Makanan & Minuman", name: "Chocolate & sweets factories (cokelat & permen)", nameId: "Pabrik kembang gula dan cokelat" },
  { code: "2721", category: "27 - Makanan & Minuman", name: "Alimentary Paste (pasta, makaroni)", nameId: "Pabrik pasta, makaroni dan mie instan kering" },
  { code: "2722", category: "27 - Makanan & Minuman", name: "Bakeries and biscuit works (roti & biskuit)", nameId: "Pabrik roti, kue kering dan biskuit" },
  { code: "2723", category: "27 - Makanan & Minuman", name: "Processed food factories (bihun, mie, kerupuk)", nameId: "Pabrik mie basah, bihun, kerupuk, makanan olahan" },
  { code: "2731", category: "27 - Makanan & Minuman", name: "Fruit canning & Monosodium Glutamate (MSG)", nameId: "Pabrik pengalengan buah, selai dan penyedap (MSG)" },
  { code: "2732", category: "27 - Makanan & Minuman", name: "Meat & fish products processing (olahan daging & ikan)", nameId: "Pengolahan & pengalengan daging dan ikan" },
  { code: "2733", category: "27 - Makanan & Minuman", name: "Soy sauce, tomato & chilli sauce (kecap, saus)", nameId: "Pabrik kecap, saus tomat dan sambal" },
  { code: "2734", category: "27 - Makanan & Minuman", name: "Poultry Farms (peternakan ayam/unggas)", nameId: "Peternakan ayam ras petelur / pedaging" },
  { code: "2741", category: "27 - Makanan & Minuman", name: "Edible fats producers (lemak makan, shortening)", nameId: "Pabrik shortening dan lemak makanan" },
  { code: "2742", category: "27 - Makanan & Minuman", name: "Edible Oils Plants (CPO, cooking oil, margarine)", nameId: "Pabrik kelapa sawit (PKS), minyak goreng & margarin" },
  { code: "2743", category: "27 - Makanan & Minuman", name: "Storage of crude palm oil (CPO tanks outside estates)", nameId: "Tangki timbun minyak kelapa sawit (CPO tank)" },
  { code: "2751", category: "27 - Makanan & Minuman", name: "Dairies: fresh milk, UHT, yoghurt, cheese, ice cream", nameId: "Pabrik pengolahan susu segar, es krim & keju" },
  { code: "2752", category: "27 - Makanan & Minuman", name: "Powder milk factories (pabrik susu bubuk)", nameId: "Pabrik pembuatan susu bubuk" },
  { code: "2761", category: "27 - Makanan & Minuman", name: "Coffee roasting & peeling, cashew nut plants", nameId: "Pengolahan kopi, sangrai kopi & kacang mete" },
  { code: "2763", category: "27 - Makanan & Minuman", name: "Tea Sheds & Tea Factories (pabrik teh)", nameId: "Pabrik pengolahan daun teh dan minuman herbal" },
  { code: "2771", category: "27 - Makanan & Minuman", name: "Cold stores and ice factories (gudang es pendingin)", nameId: "Pabrik es batu & gudang berpendingin (cold storage)" },
  { code: "2772", category: "27 - Makanan & Minuman", name: "Abattoirs and slaughterhouses (rumah potong hewan)", nameId: "Rumah potong hewan (RPH)" },
  { code: "2781", category: "27 - Makanan & Minuman", name: "Breweries, beer factories (pabrik bir)", nameId: "Pabrik bir dan minuman fermentasi" },
  { code: "2782", category: "27 - Makanan & Minuman", name: "Producers of fruit juices and mineral water (AMDK)", nameId: "Pabrik air minum dalam kemasan (AMDK) & sari buah" },
  { code: "2790", category: "27 - Makanan & Minuman", name: "Tobacco, cigars and cigarettes manufacture", nameId: "Pabrik rokok kretek, cerutu dan sigaret" },

  // --- Kategori 28: Ketenagalistrikan & Utilitas ---
  { code: "2801", category: "28 - Ketenagalistrikan & Energi", name: "Conventional hydro electric power station (PLTA)", nameId: "Pembangkit Listrik Tenaga Air (PLTA)" },
  { code: "28111", category: "28 - Ketenagalistrikan & Energi", name: "Steam boiler power plant (PLTU Batubara/Uap)", nameId: "Pembangkit Listrik Tenaga Uap (PLTU)" },
  { code: "28112", category: "28 - Ketenagalistrikan & Energi", name: "Geothermal power plant (PLTP Panas Bumi)", nameId: "Pembangkit Listrik Tenaga Panas Bumi (PLTP)" },
  { code: "2812", category: "28 - Ketenagalistrikan & Energi", name: "Gas turbine power plant (PLTG)", nameId: "Pembangkit Listrik Tenaga Gas (PLTG)" },
  { code: "2813", category: "28 - Ketenagalistrikan & Energi", name: "Combined cycle power plant (PLTGU)", nameId: "Pembangkit Listrik Gas & Uap (PLTGU)" },
  { code: "2814", category: "28 - Ketenagalistrikan & Energi", name: "Diesel power plant (PLTD)", nameId: "Pembangkit Listrik Tenaga Diesel (PLTD)" },
  { code: "283", category: "28 - Ketenagalistrikan & Energi", name: "Overhead power transmission lines (SUTET/Transmisi)", nameId: "Saluran transmisi tenaga listrik udara (SUTT/SUTET)" },
  { code: "284", category: "28 - Ketenagalistrikan & Energi", name: "Transformer stations, junction in the open (Gardu Induk)", nameId: "Gardu Induk listrik dan trafo tegangan tinggi" },
  { code: "287", category: "28 - Ketenagalistrikan & Energi", name: "Waterworks, Pumping Stations, WTP, WWTP (PDAM)", nameId: "Instalasi pengolahan air bersih (WTP/PDAM) & IPAL" },

  // --- Kategori 29: Komersial, Perkantoran, Hunian, Gudang & Transportasi ---
  { code: "2901", category: "29 - Komersial, Hunian & Transportasi", name: "Railways, LRT, MRT, Monorel, Cable cars", nameId: "Fasilitas stasiun & depo kereta api, LRT, MRT" },
  { code: "2902", category: "29 - Komersial, Hunian & Transportasi", name: "Highways, toll bridges, airport runways", nameId: "Jalan tol, jembatan tol, dan landasan pacu bandara" },
  { code: "2903", category: "29 - Komersial, Hunian & Transportasi", name: "Jetties, wharves, ports (dermaga pelabuhan)", nameId: "Dermaga dan terminal pelabuhan laut" },
  { code: "2905", category: "29 - Komersial, Hunian & Transportasi", name: "Airport Hangars (hanggar pesawat)", nameId: "Hanggar pemeliharaan pesawat udara bandara" },
  { code: "2908", category: "29 - Komersial, Hunian & Transportasi", name: "Airport General Services (terminal penumpang bandara)", nameId: "Terminal penumpang bandar udara" },
  { code: "2911", category: "29 - Komersial, Hunian & Transportasi", name: "Construction firms & construction sites", nameId: "Kantor kontraktor & lokasi proyek konstruksi" },
  { code: "2921", category: "29 - Komersial, Hunian & Transportasi", name: "Film, TV & sound recording studios", nameId: "Studio rekaman audio, film dan siaran TV" },
  { code: "2923", category: "29 - Komersial, Hunian & Transportasi", name: "Cinemas, assembly rooms and concert halls (bioskop)", nameId: "Bioskop, gedung konser dan aula pertemuan" },
  { code: "2927", category: "29 - Komersial, Hunian & Transportasi", name: "Radio & TV broadcasting & transmission towers", nameId: "Menara transmisi dan pemancar radio/TV/BTS" },
  { code: "29291", category: "29 - Komersial, Hunian & Transportasi", name: "Data Center (fasilitas pusat data komputer)", nameId: "Pusat data komputer (Data Center)" },
  { code: "2930", category: "29 - Komersial, Hunian & Transportasi", name: "Drug Store (apotek dan toko obat)", nameId: "Apotek dan toko obat-obatan" },
  { code: "29311", category: "29 - Komersial, Hunian & Transportasi", name: "Department stores (>200m2)", nameId: "Toserba / Department store (>200m2)" },
  { code: "29312", category: "29 - Komersial, Hunian & Transportasi", name: "Supermarket (>200m2)", nameId: "Pasar swalayan / Supermarket (>200m2)" },
  { code: "29313", category: "29 - Komersial, Hunian & Transportasi", name: "Shopping Mall / Center (Pusat Perbelanjaan Modern)", nameId: "Pusat perbelanjaan modern / Mall (Grade A / B)" },
  { code: "29314", category: "29 - Komersial, Hunian & Transportasi", name: "Grocery Store (toko kelontong)", nameId: "Toko sembako / kelontong" },
  { code: "2932", category: "29 - Komersial, Hunian & Transportasi", name: "Mail Order Houses, e-commerce fulfilment", nameId: "Gudang e-commerce dan pesanan daring" },
  { code: "2933", category: "29 - Komersial, Hunian & Transportasi", name: "Convenience store, minimarket (<200m2)", nameId: "Minimarket waralaba / toko serba ada (<200m2)" },
  { code: "2934", category: "29 - Komersial, Hunian & Transportasi", name: "Shops, non chain store (toko mandiri)", nameId: "Toko retail mandiri bukan berantai" },
  { code: "2935", category: "29 - Komersial, Hunian & Transportasi", name: "Pasar Tradisional (konsorsium pasar rakyat)", nameId: "Pasar rakyat / pasar tradisional tanpa AC sentral" },
  { code: "29371", category: "29 - Komersial, Hunian & Transportasi", name: "Private Warehouses (gudang milik/sewa tertanggung)", nameId: "Gudang pribadi tertutup milik/sewa tertanggung" },
  { code: "29378", category: "29 - Komersial, Hunian & Transportasi", name: "Public Warehouses (gudang publik/sewa umum)", nameId: "Gudang umum komersial (sewa multi-pihak)" },
  { code: "29383", category: "29 - Komersial, Hunian & Transportasi", name: "Petrol / Diesel Fuel Stations (SPBU)", nameId: "Stasiun Pengisian Bahan Bakar Umum (SPBU)" },
  { code: "29395", category: "29 - Komersial, Hunian & Transportasi", name: "Showrooms for New Cars, Electronics, Medical Equipment", nameId: "Showroom mobil/motor baru, elektronik & alat medis" },
  { code: "29411", category: "29 - Komersial, Hunian & Transportasi", name: "Hotels, motels below 3-star (< bintang 3)", nameId: "Hotel non-bintang dan hotel bintang 1-2" },
  { code: "29412", category: "29 - Komersial, Hunian & Transportasi", name: "Hotels certified 3-star and above (>= bintang 3)", nameId: "Hotel bintang 3, 4, 5 dan resor berbintang" },
  { code: "2942", category: "29 - Komersial, Hunian & Transportasi", name: "Night clubs, discotheques, bars, karaoke, billiards", nameId: "Klub malam, diskotik, pub, bar dan ruang karaoke" },
  { code: "29432", category: "29 - Komersial, Hunian & Transportasi", name: "Sport Stadium, Sports Centre, Gyms", nameId: "Stadion olahraga, pusat kebugaran dan GOR" },
  { code: "2945", category: "29 - Komersial, Hunian & Transportasi", name: "Restaurants, eating & drinking places (permanent building)", nameId: "Restoran dan kafe (bangunan permanen)" },
  { code: "2946", category: "29 - Komersial, Hunian & Transportasi", name: "Food Stalls, Kedai, Warung Makan (non-permanent)", nameId: "Warung makan, kedai makan (bangunan semi-permanen)" },
  { code: "2951", category: "29 - Komersial, Hunian & Transportasi", name: "Hospitals, Sanatorium, Medical Clinics", nameId: "Rumah sakit, balai pengobatan dan klinik spesialis" },
  { code: "2952", category: "29 - Komersial, Hunian & Transportasi", name: "Religious facilities (masjid, gereja, vihara, pura)", nameId: "Tempat ibadah (masjid, gereja, vihara, pura)" },
  { code: "2953", category: "29 - Komersial, Hunian & Transportasi", name: "Schools, universities, training colleges", nameId: "Gedung sekolah, kampus perguruan tinggi & diklat" },
  { code: "2961", category: "29 - Komersial, Hunian & Transportasi", name: "Motor vehicle repair shops with body repair & paint", nameId: "Bengkel perbaikan bodi mobil & pengecatan" },
  { code: "2963", category: "29 - Komersial, Hunian & Transportasi", name: "Motor vehicle service stations only (tanpa ketok/cat)", nameId: "Bengkel servis mesin dan ganti oli mobil/motor" },
  { code: "2971", category: "29 - Komersial, Hunian & Transportasi", name: "Apartments, offices, car parks <= 6 storeys", nameId: "Apartemen / gedung perkantoran bertingkat s/d 6 lantai" },
  { code: "2972", category: "29 - Komersial, Hunian & Transportasi", name: "Apartments, offices, car parks 6 to 18 storeys", nameId: "Apartemen / perkantoran bertingkat 6 s/d 18 lantai" },
  { code: "2973", category: "29 - Komersial, Hunian & Transportasi", name: "Apartments, offices, car parks > 18 storeys", nameId: "Apartemen / gedung perkantoran di atas 18 lantai" },
  { code: "2974", category: "29 - Komersial, Hunian & Transportasi", name: "Convention halls & multi-purpose buildings", nameId: "Gedung serbaguna dan balai pertemuan komersial" },
  { code: "2975", category: "29 - Komersial, Hunian & Transportasi", name: "Apartments, offices, car parks > 24 storeys", nameId: "Gedung pencakar langit / perkantoran di atas 24 lantai" },
  { code: "2976", category: "29 - Komersial, Hunian & Transportasi", name: "Dwelling houses not classified as shop houses (ruko) <= 3 storeys", nameId: "Rumah tinggal / ruko bertingkat s/d 3 lantai" },
  { code: "29761", category: "29 - Komersial, Hunian & Transportasi", name: "Dwelling house for boarding house (rumah kos-kosan)", nameId: "Rumah kos-kosan / tempat pemondokan" },
  { code: "2977", category: "29 - Komersial, Hunian & Transportasi", name: "Dwelling houses floating on river/sea shore", nameId: "Rumah tinggal terapung di atas air / pesisir pantai" },
  { code: "2978", category: "29 - Komersial, Hunian & Transportasi", name: "Independent analytical laboratories", nameId: "Laboratorium uji & analisis independen" },
  { code: "2981", category: "29 - Komersial, Hunian & Transportasi", name: "Public buildings (gedung perkantoran pemerintah)", nameId: "Gedung perkantoran lembaga publik / instansi negara" },
  { code: "2991", category: "29 - Komersial, Hunian & Transportasi", name: "Buildings in course of construction", nameId: "Gedung dalam tahap pelaksanaan konstruksi" },

  // --- Kategori 30 & 31: Perkebunan & Tanaman Komersial ---
  { code: "3031", category: "30 - Perkebunan & Tanaman", name: "Coffee without drying shed", nameId: "Perkebunan kopi tanpa rumah pengeringan" },
  { code: "304", category: "30 - Perkebunan & Tanaman", name: "Tea plantation (perkebunan teh)", nameId: "Perkebunan tanaman teh" },
  { code: "3071", category: "30 - Perkebunan & Tanaman", name: "Coconut & copra plantation", nameId: "Perkebunan kelapa dan kopra" },
  { code: "3081", category: "30 - Perkebunan & Tanaman", name: "Rubber plantation without smoke house", nameId: "Perkebunan karet tanpa rumah asap" },
  { code: "316", category: "31 - Perkebunan & Tanaman", name: "Oil palm plantation (perkebunan kelapa sawit)", nameId: "Perkebunan kelapa sawit" },
  { code: "317", category: "31 - Perkebunan & Tanaman", name: "Tobacco plantation (perkebunan tembakau)", nameId: "Perkebunan tembakau" }
];

function getSeojkOccupation(code) {
  const c = String(code || "").trim();
  const found = SEOJK_OCCUPATION_CODES.find(o => o.code === c);
  if (found) return found;
  return {
    code: c || "2971",
    category: "29 - Komersial, Hunian & Transportasi",
    name: "Apartments, offices, car parks <= 6 storeys",
    nameId: "Apartemen / perkantoran bertingkat s/d 6 lantai"
  };
}

// Data Portofolio Polis & Objek Pertanggungan (DUMMY / SIMULASI)
// Mencakup seluruh atribut pada PDF Hal. 3, 4, 5, 7, 8, 9, 10
const INITIAL_POLICIES = [
  {
    id: "703.203.110.26.00444/000/001",
    requestNo: "000010/110/203/2026/001",
    objectCode: "OBJ-JKT-004",
    riskBlockCode: "INAJKT0001",
    holderName: "PT Gema Properti Nusantara (DUMMY)",
    insuredName: "PT Gema Properti Nusantara (DUMMY)",
    nikOrNpwp: "01.234.567.8-012.000",
    lineOfBusiness: "PAR",
    productType: "Property BUMN",
    insuredType: "EQ & Flood Extended",
    underwriteYear: 2026,
    propertyCategory: "Ruko & Gedung Komersial",
    occupationCode: "2976 - Dwelling houses not classified or shop houses (ruko) not exceeding 3 storeys",
    constructionClass: "Kelas 1 (Konstruksi Tahan Api)",
    yearBuilt: 2019,
    numberOfFloors: 3,
    tariffCode: "TRF-2976-K1",
    itemCode: "ITM-BLD-01",
    address: "Jl. KH Wahid Hasyim No. 104, Menteng, Jakarta Pusat",
    village: "Kebon Sirih",
    district: "Menteng",
    city: "Kota Adm. Jakarta Pusat",
    province: "DKI Jakarta",
    postalCode: "10340",
    lat: -6.187026,
    lng: 106.823654,
    sumInsured: 3010520000,
    siBreakdown: {
      building: 1805260000,
      machinery: 450000000,
      stock: 555260000,
      others: 200000000,
      bi: 0
    },
    premium: 5222187,
    startDate: "2026-02-26",
    endDate: "2027-02-26",
    status: "Aktif (DUMMY)",
    elevation: 4.0,
    riverDistance: 44.1,
    basinName: "DAS Ciliwung",
    basinAreaKm2: 438.22,
    rainfallWeekly: 68.5,
    nearestQuakeDist: 118,
    slopeAngleDeg: 2.4,
    soilType: "Dystric Fluvisols (Tanah Aluvial)",
    landCover: "Urban / Built Area",
    nearestFireStation: {
      name: "Suku Dinas Pemadam Kebakaran Jakarta Pusat (Sektor Menteng)",
      distanceKm: 1.42,
      estArrivalText: "5 minutes, 40 seconds",
      lat: -6.1952,
      lng: 106.8315
    },
    nearbyBuildings20m: 34,
    nearbyGasStations: [
      { name: "SPBU Cikini Raya (Simulasi)", distM: 480, lat: -6.1910, lng: 106.8380 },
      { name: "SPBU Kebon Sirih (Simulasi)", distM: 620, lat: -6.1832, lng: 106.8295 }
    ],
    riskLevel: "Tinggi",
    riskScore: 62,
    perilScores: {
      flood: { score: 62, status: "High", source: "Fixture Simulasi DAS Ciliwung & Open-Meteo", updated: "2026-10-01" },
      landslide: { score: 8, status: "Very Low", source: "Kemiringan Topografi Lokal (<3°)", updated: "2026-10-01" },
      earthquake: { score: 41, status: "Medium", source: "USGS / PusGen Megathrust & Sesar Jawa", updated: "2026-10-18" },
      wildfire: { score: 54, status: "Medium", source: "Proxy Kepadatan Bangunan Perkotaan", updated: "2026-09-15" },
      extremeWeather: { score: 65, status: "High", source: "Open-Meteo Weekly Precipitation", updated: "Live / Simulasi" },
      drought: { score: 25, status: "Low", source: "Indeks Klimatologi Simulasi", updated: "2026-08-01" },
      liquefaction: { score: 38, status: "Medium", source: "Indikasi Tanah Aluvial (Dystric Fluvisols)", updated: "2026-07-01" },
      tsunami: { score: 5, status: "None", source: "Jarak Garis Pantai > 8 km", updated: "2026-09-01" },
      volcano: { score: 0, status: "None", source: "Di Luar Radius KRB Gunung Api (>60 km)", updated: "2026-10-01" }
    },
    claimHistory: [
      {
        claimNo: "CLM-ASK-2024-0019 (DUMMY)",
        date: "2024-02-18",
        peril: "Flood",
        amount: 185000000,
        status: "Settled (Dummy)",
        note: "Genangan luapan drainase jalan protokol pada ruang lantai dasar."
      }
    ],
    assessmentHistory: [
      {
        id: "ASMT-2026-01",
        date: "2026-02-20",
        assessor: "Underwriter Property Askrindo (Dummy)",
        summary: "Inspeksi pra-akseptasi: Pompa sump-pit gedung aktif, APAR lengkap di tiap lantai."
      }
    ],
    riskFactors: {
      flood: "High (Jarak ke alur sungai/kanal 44m, elevasi 4.0 mdpl)",
      earthquake: "Medium (41/100)",
      rain: "High (68.5 mm/minggu)",
      underwritingNote: "DATA DUMMY — Dukungan analisis: Perhatikan eksposur genangan DAS Ciliwung. Keputusan underwriting final berada pada Underwriter berwenang."
    },
    isDummy: true
  },
  {
    id: "703.297.110.26.00336/000/001",
    requestNo: "000018/110/297/2026/002",
    objectCode: "OBJ-JKT-008",
    riskBlockCode: "INAJKT0002",
    holderName: "PT Asuransi Jiwa Nusantara (DUMMY)",
    insuredName: "PT Asuransi Jiwa Nusantara (DUMMY)",
    nikOrNpwp: "01.339.881.2-093.000",
    lineOfBusiness: "PAR",
    productType: "Property BUMN",
    insuredType: "All Risks + EQ",
    underwriteYear: 2026,
    propertyCategory: "Gedung Perkantoran / Klinik",
    occupationCode: "2971 - Office buildings & financial institutions",
    constructionClass: "Kelas 1 (Konstruksi Tahan Api)",
    yearBuilt: 2021,
    numberOfFloors: 8,
    tariffCode: "TRF-2971-K1",
    itemCode: "ITM-BLD-02",
    address: "Jl. Rawasari Barat III E/54, Cempaka Putih, Jakarta Pusat",
    village: "Cempaka Putih Timur",
    district: "Cempaka Putih",
    city: "Kota Adm. Jakarta Pusat",
    province: "DKI Jakarta",
    postalCode: "10510",
    lat: -6.175495,
    lng: 106.869743,
    sumInsured: 18500000000,
    siBreakdown: {
      building: 12500000000,
      machinery: 2800000000,
      stock: 1200000000,
      others: 1000000000,
      bi: 1000000000
    },
    premium: 29600000,
    startDate: "2026-01-10",
    endDate: "2027-01-10",
    status: "Aktif (DUMMY)",
    elevation: 6.5,
    riverDistance: 165.0,
    basinName: "DAS Sunter - Ciliwung",
    basinAreaKm2: 312.5,
    rainfallWeekly: 72.0,
    nearestQuakeDist: 124,
    slopeAngleDeg: 1.8,
    soilType: "Dystric Fluvisols (Tanah Aluvial)",
    landCover: "Urban / Built Area",
    nearestFireStation: {
      name: "Suku Dinas Pemadam Kebakaran Serdang (A)",
      distanceKm: 1.78,
      estArrivalText: "7 minutes, 23 seconds",
      lat: -6.1615,
      lng: 106.8585
    },
    nearbyBuildings20m: 39,
    nearbyGasStations: [
      { name: "SPBU Pramuka / Rawasari (Simulasi)", distM: 540, lat: -6.1820, lng: 106.8720 }
    ],
    riskLevel: "Tinggi",
    riskScore: 68,
    perilScores: {
      flood: { score: 82, status: "High", source: "Fixture Simulasi Banjir DKI", updated: "2026-10-01" },
      landslide: { score: 0, status: "Very Low", source: "Dataran Perkotaan (Slope 1.8°)", updated: "2026-10-01" },
      earthquake: { score: 41, status: "Medium", source: "USGS / PusGen", updated: "2026-10-18" },
      wildfire: { score: 45, status: "Medium", source: "Proxy Kepadatan 39 Bangunan / 20m", updated: "2026-09-15" },
      extremeWeather: { score: 87, status: "Very High", source: "Open-Meteo Precip Alert", updated: "Live / Simulasi" },
      drought: { score: 40, status: "Medium", source: "Indeks Klimatologi Simulasi", updated: "2026-08-01" },
      liquefaction: { score: 35, status: "Medium", source: "Indikasi Tanah Aluvial", updated: "2026-07-01" },
      tsunami: { score: 0, status: "None", source: "Daratan Tengah Kota", updated: "2026-09-01" },
      volcano: { score: 0, status: "None", source: "Aman dari KRB Gunung Api", updated: "2026-10-01" }
    },
    claimHistory: [],
    assessmentHistory: [
      {
        id: "ASMT-2026-02",
        date: "2026-01-08",
        assessor: "Risk Engineer Askrindo (Dummy)",
        summary: "Gedung dilengkapi genset cadangan di lantai 2 dan tanggul banjir parkir."
      }
    ],
    riskFactors: {
      flood: "High (82/100)",
      earthquake: "Medium (41/100)",
      rain: "Very High (87/100)",
      underwritingNote: "DATA DUMMY — Dukungan analisis: Eksposur curah hujan ekstrem dan genangan tinggi. Keputusan final di tangan Underwriter."
    },
    isDummy: true
  },
  {
    id: "POL-ASK-2026-001",
    requestNo: "000021/110/201/2026/003",
    objectCode: "OBJ-JKT-001",
    riskBlockCode: "INAJKT0003",
    holderName: "PT Global Logistik Nusantara (DUMMY)",
    insuredName: "PT Global Logistik Nusantara (DUMMY)",
    nikOrNpwp: "01.234.567.8-012.000",
    lineOfBusiness: "PAR",
    productType: "Property All Risks (PAR)",
    insuredType: "All Risks + Flood",
    underwriteYear: 2026,
    propertyCategory: "Gudang Logistik & Depo",
    occupationCode: "3401 - Cold storage & logistics warehouse",
    constructionClass: "Kelas 1",
    yearBuilt: 2017,
    numberOfFloors: 2,
    tariffCode: "TRF-3401-K1",
    itemCode: "ITM-WH-01",
    address: "Jl. Pluit Samudra No. 18, Penjaringan, Jakarta Utara",
    village: "Pluit",
    district: "Penjaringan",
    city: "Kota Adm. Jakarta Utara",
    province: "DKI Jakarta",
    postalCode: "14450",
    lat: -6.1185,
    lng: 106.7925,
    sumInsured: 35000000000,
    siBreakdown: {
      building: 18000000000,
      machinery: 5000000000,
      stock: 10000000000,
      others: 1000000000,
      bi: 1000000000
    },
    premium: 52500000,
    startDate: "2026-01-15",
    endDate: "2027-01-14",
    status: "Aktif (DUMMY)",
    elevation: 1.8,
    riverDistance: 120,
    basinName: "Muara Angke - Waduk Pluit",
    basinAreaKm2: 210.4,
    rainfallWeekly: 85.4,
    nearestQuakeDist: 145,
    slopeAngleDeg: 0.9,
    soilType: "Marine Alluvial Clay (Lempung Marin)",
    landCover: "Coastal Industrial Zone",
    nearestFireStation: {
      name: "Pos Pemadam Kebakaran Pluit / Penjaringan",
      distanceKm: 1.95,
      estArrivalText: "6 minutes, 50 seconds",
      lat: -6.1260,
      lng: 106.7880
    },
    nearbyBuildings20m: 22,
    nearbyGasStations: [
      { name: "SPBU Pluit Raya (Simulasi)", distM: 410, lat: -6.1225, lng: 106.7950 }
    ],
    riskLevel: "Tinggi",
    riskScore: 82,
    perilScores: {
      flood: { score: 88, status: "High", source: "Zona Pasang Rob & Pesisir Pantura", updated: "2026-10-01" },
      landslide: { score: 2, status: "Very Low", source: "Pesisir Datar", updated: "2026-10-01" },
      earthquake: { score: 35, status: "Low", source: "USGS / PusGen", updated: "2026-10-18" },
      wildfire: { score: 48, status: "Medium", source: "Kawasan Gudang Logistik", updated: "2026-09-15" },
      extremeWeather: { score: 80, status: "High", source: "Open-Meteo Coastal Weather", updated: "Live / Simulasi" },
      drought: { score: 15, status: "None", source: "Simulasi", updated: "2026-08-01" },
      liquefaction: { score: 72, status: "High", source: "Tanah Reklamasi & Lempung Marin Pesisir", updated: "2026-07-01" },
      tsunami: { score: 32, status: "Low", source: "Pesisir Teluk Jakarta", updated: "2026-09-01" },
      volcano: { score: 0, status: "None", source: "Aman dari KRB", updated: "2026-10-01" }
    },
    claimHistory: [
      {
        claimNo: "CLM-ASK-2023-0812 (DUMMY)",
        date: "2023-12-04",
        peril: "Flood (Rob)",
        amount: 640000000,
        status: "Settled (Dummy)",
        note: "Rembesan air pasang purnama di area bongkar muat."
      }
    ],
    assessmentHistory: [],
    riskFactors: {
      flood: "Tinggi (Elevasi 1.8 mdpl & Jarak ke air 120m)",
      earthquake: "Rendah (Jarak > 140km)",
      rain: "Tinggi (Curah hujan mingguan > 80mm)",
      underwritingNote: "DATA DUMMY — Dukungan analisis: Lokasi pesisir rawan banjir rob & penurunan tanah. Keputusan akhir pada Underwriter."
    },
    isDummy: true
  },
  {
    id: "POL-ASK-2026-002",
    requestNo: "000034/110/202/2026/004",
    objectCode: "OBJ-JKT-012",
    riskBlockCode: "INAJKT0004",
    holderName: "PT Menara Niaga Kebayoran (DUMMY)",
    insuredName: "PT Menara Niaga Kebayoran (DUMMY)",
    nikOrNpwp: "3171051204850003",
    lineOfBusiness: "PSAKI",
    productType: "Asuransi Kebakaran & Gempa (PSAKI)",
    insuredType: "Fire & EQ",
    underwriteYear: 2026,
    propertyCategory: "Gedung Perkantoran / Klinik",
    occupationCode: "2971 - Commercial High-Rise Building",
    constructionClass: "Kelas 1",
    yearBuilt: 2022,
    numberOfFloors: 14,
    tariffCode: "TRF-2971-K1",
    itemCode: "ITM-BLD-04",
    address: "Jl. Sultan Iskandar Muda No. 28, Kebayoran Lama, Jakarta Selatan",
    village: "Kebayoran Lama Utara",
    district: "Kebayoran Lama",
    city: "Kota Adm. Jakarta Selatan",
    province: "DKI Jakarta",
    postalCode: "12240",
    lat: -6.2450,
    lng: 106.7820,
    sumInsured: 48000000000,
    siBreakdown: {
      building: 34000000000,
      machinery: 6000000000,
      stock: 2000000000,
      others: 3000000000,
      bi: 3000000000
    },
    premium: 72000000,
    startDate: "2026-03-01",
    endDate: "2027-02-28",
    status: "Aktif (DUMMY)",
    elevation: 28.5,
    riverDistance: 480,
    basinName: "DAS Pesanggrahan",
    basinAreaKm2: 195.0,
    rainfallWeekly: 45.0,
    nearestQuakeDist: 112,
    slopeAngleDeg: 2.1,
    soilType: "Latosol / Reddish Clay",
    landCover: "Urban Commercial",
    nearestFireStation: {
      name: "Sektor Damkar Kebayoran Lama",
      distanceKm: 1.15,
      estArrivalText: "4 minutes, 50 seconds",
      lat: -6.2510,
      lng: 106.7780
    },
    nearbyBuildings20m: 18,
    nearbyGasStations: [
      { name: "SPBU Arteria Pondok Indah (Simulasi)", distM: 390, lat: -6.2490, lng: 106.7810 }
    ],
    riskLevel: "Rendah",
    riskScore: 28,
    perilScores: {
      flood: { score: 24, status: "Low", source: "Elevasi 28.5 mdpl", updated: "2026-10-01" },
      landslide: { score: 10, status: "Very Low", source: "Topografi Stabil", updated: "2026-10-01" },
      earthquake: { score: 38, status: "Low", source: "USGS / PusGen", updated: "2026-10-18" },
      wildfire: { score: 25, status: "Low", source: "Proteksi Hydrant & Sprinkler Aktif", updated: "2026-09-15" },
      extremeWeather: { score: 35, status: "Low", source: "Open-Meteo", updated: "Live / Simulasi" },
      drought: { score: 20, status: "Low", source: "Simulasi", updated: "2026-08-01" },
      liquefaction: { score: 15, status: "None", source: "Tanah Latosol Padat", updated: "2026-07-01" },
      tsunami: { score: 0, status: "None", source: "Jauh dari Pantai (>14 km)", updated: "2026-09-01" },
      volcano: { score: 0, status: "None", source: "Aman dari KRB", updated: "2026-10-01" }
    },
    claimHistory: [],
    assessmentHistory: [],
    riskFactors: {
      flood: "Rendah (Elevasi 28.5 mdpl)",
      earthquake: "Rendah-Sedang (38/100)",
      rain: "Sedang (45mm)",
      underwritingNote: "DATA DUMMY — Elevasi relatif tinggi di Jakarta Selatan."
    },
    isDummy: true
  },
  {
    id: "POL-ASK-2026-003",
    requestNo: "000045/110/204/2026/005",
    objectCode: "OBJ-JBR-003",
    riskBlockCode: "INAJBR0011",
    holderName: "PT Surya Tekstil Mandiri (DUMMY)",
    insuredName: "PT Surya Tekstil Mandiri (DUMMY)",
    nikOrNpwp: "02.890.123.4-421.000",
    lineOfBusiness: "IAR",
    productType: "Industrial All Risks (IAR)",
    insuredType: "All Risks + EQ Zone 4",
    underwriteYear: 2026,
    propertyCategory: "Pabrik Industri Manufaktur",
    occupationCode: "2411 - Textile spinning & weaving mills",
    constructionClass: "Kelas 1",
    yearBuilt: 2015,
    numberOfFloors: 2,
    tariffCode: "TRF-2411-K1",
    itemCode: "ITM-FAC-01",
    address: "Kawasan Industri Cimahi Selatan, Kota Cimahi",
    village: "utama",
    district: "Cimahi Selatan",
    city: "Kota Cimahi",
    province: "Jawa Barat",
    postalCode: "40533",
    lat: -6.9012,
    lng: 107.5451,
    sumInsured: 68000000000,
    siBreakdown: {
      building: 28000000000,
      machinery: 25000000000,
      stock: 10000000000,
      others: 2000000000,
      bi: 3000000000
    },
    premium: 102000000,
    startDate: "2025-11-10",
    endDate: "2026-11-09",
    status: "Aktif (DUMMY)",
    elevation: 710.0,
    riverDistance: 310,
    basinName: "DAS Citarum Hulu",
    basinAreaKm2: 615.0,
    rainfallWeekly: 62.0,
    nearestQuakeDist: 18,
    slopeAngleDeg: 6.5,
    soilType: "Andosols (Vulkanik Cekungan Bandung)",
    landCover: "Industrial Estate",
    nearestFireStation: {
      name: "Damkar Kota Cimahi",
      distanceKm: 2.4,
      estArrivalText: "8 minutes, 15 seconds",
      lat: -6.8850,
      lng: 107.5420
    },
    nearbyBuildings20m: 14,
    nearbyGasStations: [
      { name: "SPBU Cimindi (Simulasi)", distM: 750, lat: -6.8960, lng: 107.5540 }
    ],
    riskLevel: "Tinggi",
    riskScore: 78,
    perilScores: {
      flood: { score: 35, status: "Low", source: "DAS Citarum Hulu", updated: "2026-10-01" },
      landslide: { score: 42, status: "Medium", source: "Kemiringan 6.5°", updated: "2026-10-01" },
      earthquake: { score: 88, status: "High", source: "Koridor Dekat Sesar Lembang (<18 km)", updated: "2026-10-18" },
      wildfire: { score: 65, status: "High", source: "Okupasi Pabrik Tekstil (Bahan Mudah Terbakar)", updated: "2026-09-15" },
      extremeWeather: { score: 55, status: "Medium", source: "Open-Meteo", updated: "Live / Simulasi" },
      drought: { score: null, status: "NO_DATA", noDataReason: "OUT_OF_COVERAGE", source: "Layer Kekeringan Detail Belum Dimuat di Luar Pilot DKI", updated: "N/A" },
      liquefaction: { score: 58, status: "Medium", source: "Endapan Danau Purba Bandung", updated: "2026-07-01" },
      tsunami: { score: 0, status: "None", source: "Dataran Tinggi 710 mdpl", updated: "2026-09-01" },
      volcano: { score: 30, status: "Low", source: "Jarak ~22 km dari G. Tangkuban Perahu", updated: "2026-10-01" }
    },
    claimHistory: [],
    assessmentHistory: [],
    riskFactors: {
      flood: "Rendah-Sedang (35/100)",
      earthquake: "Tinggi (Zona Sesar Lembang radius < 20km)",
      rain: "Sedang (62mm)",
      underwritingNote: "DATA DUMMY — Perhatikan eksposur gempa Sesar Lembang dan proteksi kebakaran stok tekstil. Peril Kekeringan berstatus NO DATA (≠ Aman)."
    },
    isDummy: true
  },
  {
    id: "POL-ASK-2026-004",
    requestNo: "000052/110/205/2026/006",
    objectCode: "OBJ-JTG-004",
    riskBlockCode: "INAJTG0008",
    holderName: "PT Maritim Kaligawe Semarang (DUMMY)",
    insuredName: "PT Maritim Kaligawe Semarang (DUMMY)",
    nikOrNpwp: "3374025501780002",
    lineOfBusiness: "PSAGBI",
    productType: "PSAGBI (Properti & Gangguan Usaha)",
    insuredType: "All Risks + Rob",
    underwriteYear: 2026,
    propertyCategory: "Gudang Logistik & Depo",
    occupationCode: "3402 - Coastal container & cargo depot",
    constructionClass: "Kelas 1",
    yearBuilt: 2016,
    numberOfFloors: 2,
    tariffCode: "TRF-3402-K1",
    itemCode: "ITM-WH-04",
    address: "Jl. Raden Patah No. 88, Tanjung Emas, Semarang Utara",
    village: "Tanjung Mas",
    district: "Semarang Utara",
    city: "Kota Semarang",
    province: "Jawa Tengah",
    postalCode: "50174",
    lat: -6.9620,
    lng: 110.4350,
    sumInsured: 32000000000,
    siBreakdown: {
      building: 16000000000,
      machinery: 4000000000,
      stock: 8000000000,
      others: 1500000000,
      bi: 2500000000
    },
    premium: 54000000,
    startDate: "2026-02-01",
    endDate: "2027-01-31",
    status: "Aktif (DUMMY)",
    elevation: 1.2,
    riverDistance: 140,
    basinName: "Banjir Kanal Timur & Pesisir Semarang",
    basinAreaKm2: 280.0,
    rainfallWeekly: 70.0,
    nearestQuakeDist: 180,
    slopeAngleDeg: 0.5,
    soilType: "Alluvial Marine Clay",
    landCover: "Port & Industrial",
    nearestFireStation: {
      name: "Dinas Pemadam Kebakaran Kota Semarang",
      distanceKm: 2.8,
      estArrivalText: "9 minutes, 10 seconds",
      lat: -6.9820,
      lng: 110.4210
    },
    nearbyBuildings20m: 26,
    nearbyGasStations: [
      { name: "SPBU Kaligawe (Simulasi)", distM: 610, lat: -6.9590, lng: 110.4450 }
    ],
    riskLevel: "Tinggi",
    riskScore: 88,
    perilScores: {
      flood: { score: 92, status: "Very High", source: "Zona Pasang Rob Pantura & Elevasi 1.2m", updated: "2026-10-01" },
      landslide: { score: 0, status: "None", source: "Dataran Pesisir", updated: "2026-10-01" },
      earthquake: { score: 34, status: "Low", source: "Jalur Sesar Baribis-Kendeng", updated: "2026-10-18" },
      wildfire: { score: 40, status: "Medium", source: "Kawasan Depo Logistik", updated: "2026-09-15" },
      extremeWeather: { score: 74, status: "High", source: "Open-Meteo", updated: "Live / Simulasi" },
      drought: { score: null, status: "NO_DATA", noDataReason: "OUT_OF_COVERAGE", source: "Layer Detail Belum Dimuat", updated: "N/A" },
      liquefaction: { score: 75, status: "High", source: "Endapan Aluvial Pesisir Lunak", updated: "2026-07-01" },
      tsunami: { score: 25, status: "Low", source: "Laut Jawa", updated: "2026-09-01" },
      volcano: { score: 0, status: "None", source: "Aman dari KRB", updated: "2026-10-01" }
    },
    claimHistory: [
      {
        claimNo: "CLM-ASK-2025-0119 (DUMMY)",
        date: "2025-01-12",
        peril: "Flood (Pasang Rob)",
        amount: 920000000,
        status: "Settled (Dummy)",
        note: "Genangan pasang laut purnama di area penyimpanan kargo."
      }
    ],
    assessmentHistory: [],
    riskFactors: {
      flood: "Sangat Tinggi (Zona Pasang Rob & Elevasi 1.2m)",
      earthquake: "Rendah",
      rain: "Tinggi (70mm)",
      underwritingNote: "DATA DUMMY — Eksposur rob dan penurunan tanah pesisir Semarang sangat tinggi."
    },
    isDummy: true
  },
  {
    id: "POL-ASK-2026-005",
    requestNo: "000061/110/206/2026/007",
    objectCode: "OBJ-JTM-005",
    riskBlockCode: "INAJTM0015",
    holderName: "PT Berkah Samudera Abadi (DUMMY)",
    insuredName: "PT Berkah Samudera Abadi (DUMMY)",
    nikOrNpwp: "03.456.789.0-604.000",
    lineOfBusiness: "PAR",
    productType: "Property All Risks (PAR)",
    insuredType: "All Risks",
    underwriteYear: 2025,
    propertyCategory: "Gudang Logistik & Depo",
    occupationCode: "3401 - Industrial Estate Warehouse",
    constructionClass: "Kelas 1",
    yearBuilt: 2018,
    numberOfFloors: 2,
    tariffCode: "TRF-3401-K1",
    itemCode: "ITM-WH-05",
    address: "Kawasan Industri Rungkut (SIER), Kota Surabaya",
    village: "Kali Rungkut",
    district: "Rungkut",
    city: "Kota Surabaya",
    province: "Jawa Timur",
    postalCode: "60293",
    lat: -7.3320,
    lng: 112.7680,
    sumInsured: 42000000000,
    siBreakdown: {
      building: 22000000000,
      machinery: 8000000000,
      stock: 9000000000,
      others: 1500000000,
      bi: 1500000000
    },
    premium: 63000000,
    startDate: "2025-10-01",
    endDate: "2026-09-30",
    status: "Aktif (DUMMY)",
    elevation: 4.8,
    riverDistance: 290,
    basinName: "DAS Kali Brantas Hilir",
    basinAreaKm2: 520.0,
    rainfallWeekly: 38.0,
    nearestQuakeDist: 90,
    slopeAngleDeg: 1.2,
    soilType: "Alluvial Brantas Delta",
    landCover: "Industrial Zone",
    nearestFireStation: {
      name: "Pos Damkar Rungkut / SIER Surabaya",
      distanceKm: 1.1,
      estArrivalText: "4 minutes, 15 seconds",
      lat: -7.3250,
      lng: 112.7620
    },
    nearbyBuildings20m: 16,
    nearbyGasStations: [
      { name: "SPBU Rungkut Industri (Simulasi)", distM: 450, lat: -7.3290, lng: 112.7650 }
    ],
    riskLevel: "Sedang",
    riskScore: 49,
    perilScores: {
      flood: { score: 48, status: "Medium", source: "DAS Brantas Hilir", updated: "2026-10-01" },
      landslide: { score: 0, status: "None", source: "Datar", updated: "2026-10-01" },
      earthquake: { score: 45, status: "Medium", source: "Segmen Sesar Waru-Kendeng", updated: "2026-10-18" },
      wildfire: { score: 42, status: "Medium", source: "Kawasan Industri", updated: "2026-09-15" },
      extremeWeather: { score: 40, status: "Medium", source: "Open-Meteo", updated: "Live / Simulasi" },
      drought: { score: 52, status: "Medium", source: "Musim Kemarau Jawa Timur", updated: "2026-08-01" },
      liquefaction: { score: 44, status: "Medium", source: "Delta Aluvial", updated: "2026-07-01" },
      tsunami: { score: 10, status: "None", source: "Selat Madura Terlindung", updated: "2026-09-01" },
      volcano: { score: 15, status: "None", source: "Jarak > 50 km dari Bromo/Arjuno", updated: "2026-10-01" }
    },
    claimHistory: [],
    assessmentHistory: [],
    riskFactors: {
      flood: "Sedang (Drainase kawasan industri SIER)",
      earthquake: "Sedang (Sesar Waru Surabaya)",
      rain: "Sedang",
      underwritingNote: "DATA DUMMY — Risiko kawasan industri SIER menengah."
    },
    isDummy: true
  },
  {
    id: "POL-ASK-2026-006",
    requestNo: "000072/110/207/2026/008",
    objectCode: "OBJ-SBR-006",
    riskBlockCode: "INASBR0004",
    holderName: "RSIA Bunda Khatib Sulaiman (DUMMY)",
    insuredName: "RSIA Bunda Khatib Sulaiman (DUMMY)",
    nikOrNpwp: "1371011807750001",
    lineOfBusiness: "PAR",
    productType: "Property BUMN / Kesehatan",
    insuredType: "All Risks + EQ & Tsunami",
    underwriteYear: 2026,
    propertyCategory: "Gedung Perkantoran / Klinik",
    occupationCode: "2985 - Hospitals & medical clinics",
    constructionClass: "Kelas 1",
    yearBuilt: 2020,
    numberOfFloors: 5,
    tariffCode: "TRF-2985-K1",
    itemCode: "ITM-HSP-01",
    address: "Jl. Khatib Sulaiman No. 42, Padang Utara, Kota Padang",
    village: "ulak Karang Selatan",
    district: "Padang Utara",
    city: "Kota Padang",
    province: "Sumatera Barat",
    postalCode: "25135",
    lat: -0.9230,
    lng: 100.3610,
    sumInsured: 28500000000,
    siBreakdown: {
      building: 18500000000,
      machinery: 6500000000,
      stock: 1500000000,
      others: 1000000000,
      bi: 1000000000
    },
    premium: 51300000,
    startDate: "2026-01-05",
    endDate: "2027-01-04",
    status: "Aktif (DUMMY)",
    elevation: 8.5,
    riverDistance: 450,
    basinName: "DAS Batang Kuranji - Batang Arau",
    basinAreaKm2: 245.0,
    rainfallWeekly: 95.0,
    nearestQuakeDist: 35,
    slopeAngleDeg: 2.0,
    soilType: "Coastal Sandy Alluvial",
    landCover: "Urban Commercial",
    nearestFireStation: {
      name: "Dinas Pemadam Kebakaran Kota Padang",
      distanceKm: 1.6,
      estArrivalText: "5 minutes, 55 seconds",
      lat: -0.9350,
      lng: 100.3620
    },
    nearbyBuildings20m: 24,
    nearbyGasStations: [
      { name: "SPBU Khatib Sulaiman (Simulasi)", distM: 310, lat: -0.9210, lng: 100.3605 }
    ],
    riskLevel: "Tinggi",
    riskScore: 85,
    perilScores: {
      flood: { score: 64, status: "High", source: "Curah Hujan Pesisir Barat Sumatera", updated: "2026-10-01" },
      landslide: { score: 15, status: "None", source: "Dataran Kota", updated: "2026-10-01" },
      earthquake: { score: 94, status: "Very High", source: "Zona Megathrust Mentawai & Sesar Semangko", updated: "2026-10-18" },
      wildfire: { score: 30, status: "Low", source: "Gedung Rumah Sakit", updated: "2026-09-15" },
      extremeWeather: { score: 88, status: "High", source: "Open-Meteo (>90mm/minggu)", updated: "Live / Simulasi" },
      drought: { score: 10, status: "None", source: "Curah Hujan Tahunan Tinggi", updated: "2026-08-01" },
      liquefaction: { score: 78, status: "High", source: "Pasir Pesisir Jenuh Air + PGA Tinggi", updated: "2026-07-01" },
      tsunami: { score: 82, status: "High", source: "Pantai Barat Sumatera (<1.8 km dari bibir pantai)", updated: "2026-09-01" },
      volcano: { score: 25, status: "Low", source: "Jarak ~60 km dari G. Marapi", updated: "2026-10-01" }
    },
    claimHistory: [],
    assessmentHistory: [],
    riskFactors: {
      flood: "Tinggi (Curah hujan pesisir ekstrem)",
      earthquake: "Sangat Tinggi (Subduksi Megathrust Mentawai)",
      rain: "Sangat Tinggi (95mm)",
      underwritingNote: "DATA DUMMY — Zona seismik & tsunami tinggi Pantai Barat Sumatera."
    },
    isDummy: true
  },
  {
    id: "POL-ASK-2026-007",
    requestNo: "000081/110/208/2026/009",
    objectCode: "OBJ-BAL-007",
    riskBlockCode: "INABAL0002",
    holderName: "PT Graha Santika Bali Resort (DUMMY)",
    insuredName: "PT Graha Santika Bali Resort (DUMMY)",
    nikOrNpwp: "01.999.888.7-901.000",
    lineOfBusiness: "PAR",
    productType: "Property All Risks (PAR)",
    insuredType: "All Risks + EQ",
    underwriteYear: 2026,
    propertyCategory: "Hotel & Resort",
    occupationCode: "2981 - Hotels, resorts & convention centers",
    constructionClass: "Kelas 1",
    yearBuilt: 2019,
    numberOfFloors: 4,
    tariffCode: "TRF-2981-K1",
    itemCode: "ITM-HTL-01",
    address: "Jl. Danau Tamblingan No. 102, Sanur, Denpasar Selatan",
    village: "Sanur",
    district: "Denpasar Selatan",
    city: "Kota Denpasar",
    province: "Bali",
    postalCode: "80228",
    lat: -8.6945,
    lng: 115.2625,
    sumInsured: 95000000000,
    siBreakdown: {
      building: 62000000000,
      machinery: 12000000000,
      stock: 4000000000,
      others: 7000000000,
      bi: 10000000000
    },
    premium: 142500000,
    startDate: "2026-02-15",
    endDate: "2027-02-14",
    status: "Aktif (DUMMY)",
    elevation: 5.2,
    riverDistance: 550,
    basinName: "Pesisir Sanur - Tukad Badung",
    basinAreaKm2: 140.0,
    rainfallWeekly: 30.0,
    nearestQuakeDist: 75,
    slopeAngleDeg: 1.5,
    soilType: "Carbonate Coastal Sand",
    landCover: "Tourism & Hospitality",
    nearestFireStation: {
      name: "BPBD & Damkar Kota Denpasar (Pos Sanur)",
      distanceKm: 2.1,
      estArrivalText: "7 minutes, 10 seconds",
      lat: -8.6810,
      lng: 115.2520
    },
    nearbyBuildings20m: 19,
    nearbyGasStations: [
      { name: "SPBU Bypass Ngurah Rai Sanur (Simulasi)", distM: 680, lat: -8.6910, lng: 115.2550 }
    ],
    riskLevel: "Sedang",
    riskScore: 54,
    perilScores: {
      flood: { score: 38, status: "Low", source: "Pesisir Sanur", updated: "2026-10-01" },
      landslide: { score: 5, status: "None", source: "Datar", updated: "2026-10-01" },
      earthquake: { score: 66, status: "High", source: "Megathrust Selatan Bali & Flores Thrust", updated: "2026-10-18" },
      wildfire: { score: 28, status: "Low", source: "Proteksi Resort Standar Internasional", updated: "2026-09-15" },
      extremeWeather: { score: 42, status: "Medium", source: "Angin Pesisir & Gelombang", updated: "Live / Simulasi" },
      drought: { score: 35, status: "Low", source: "Simulasi", updated: "2026-08-01" },
      liquefaction: { score: 45, status: "Medium", source: "Pasir Pantai", updated: "2026-07-01" },
      tsunami: { score: 62, status: "High", source: "Zona Pantai Sanur", updated: "2026-09-01" },
      volcano: { score: 22, status: "Low", source: "Jarak ~45 km dari G. Agung", updated: "2026-10-01" }
    },
    claimHistory: [],
    assessmentHistory: [],
    riskFactors: {
      flood: "Rendah-Sedang (Pesisir pantai)",
      earthquake: "Tinggi (Busur Belakang Flores & Megathrust Selatan)",
      rain: "Rendah (30mm)",
      underwritingNote: "DATA DUMMY — Perhatikan eksposur gempa & tsunami pesisir selatan Bali."
    },
    isDummy: true
  },
  {
    id: "POL-ASK-2026-008",
    requestNo: "000090/110/209/2026/010",
    objectCode: "OBJ-SLS-008",
    riskBlockCode: "INASLS0006",
    holderName: "PT Agro Makassar Sejahtera (DUMMY)",
    insuredName: "PT Agro Makassar Sejahtera (DUMMY)",
    nikOrNpwp: "7371100508820005",
    lineOfBusiness: "PSAKI",
    productType: "Asuransi Harta Benda (PSAKI)",
    insuredType: "Fire & Flood",
    underwriteYear: 2026,
    propertyCategory: "Gudang Logistik & Depo",
    occupationCode: "3405 - Agricultural commodity storage",
    constructionClass: "Kelas 1",
    yearBuilt: 2018,
    numberOfFloors: 2,
    tariffCode: "TRF-3405-K1",
    itemCode: "ITM-WH-08",
    address: "Kawasan Antang Blok C-12, Manggala, Kota Makassar",
    village: "Antang",
    district: "Manggala",
    city: "Kota Makassar",
    province: "Sulawesi Selatan",
    postalCode: "90234",
    lat: -5.1480,
    lng: 119.4890,
    sumInsured: 19500000000,
    siBreakdown: {
      building: 10500000000,
      machinery: 2500000000,
      stock: 5500000000,
      others: 1000000000,
      bi: 0
    },
    premium: 29250000,
    startDate: "2026-04-01",
    endDate: "2027-03-31",
    status: "Aktif (DUMMY)",
    elevation: 14.0,
    riverDistance: 220,
    basinName: "DAS Sungai Tallo",
    basinAreaKm2: 410.0,
    rainfallWeekly: 54.0,
    nearestQuakeDist: 210,
    slopeAngleDeg: 1.9,
    soilType: "Alluvial Clay",
    landCover: "Suburban Mixed",
    nearestFireStation: {
      name: "Damkar Kota Makassar (Pos Timur)",
      distanceKm: 3.1,
      estArrivalText: "10 minutes, 05 seconds",
      lat: -5.1380,
      lng: 119.4650
    },
    nearbyBuildings20m: 21,
    nearbyGasStations: [
      { name: "SPBU Antang Raya (Simulasi)", distM: 520, lat: -5.1520, lng: 119.4850 }
    ],
    riskLevel: "Sedang",
    riskScore: 48,
    perilScores: {
      flood: { score: 65, status: "High", source: "Cekungan DAS Sungai Tallo / Antang", updated: "2026-10-01" },
      landslide: { score: 8, status: "None", source: "Datar", updated: "2026-10-01" },
      earthquake: { score: 22, status: "Low", source: "USGS / PusGen", updated: "2026-10-18" },
      wildfire: { score: 35, status: "Low", source: "Simulasi", updated: "2026-09-15" },
      extremeWeather: { score: 52, status: "Medium", source: "Open-Meteo", updated: "Live / Simulasi" },
      drought: { score: null, status: "NO_DATA", noDataReason: "OUT_OF_COVERAGE", source: "Layer Belum Tersedia", updated: "N/A" },
      liquefaction: { score: null, status: "NO_DATA", noDataReason: "LAYER_UNAVAILABLE", source: "Peta Mikrozonasi Likuefaksi Belum Tersedia", updated: "N/A" },
      tsunami: { score: 5, status: "None", source: "Daratan Antang (>7 km dari pantai)", updated: "2026-09-01" },
      volcano: { score: 0, status: "None", source: "Tidak Ada Gunung Api Aktif Dekat", updated: "2026-10-01" }
    },
    claimHistory: [],
    assessmentHistory: [],
    riskFactors: {
      flood: "Tinggi (Bantaran DAS Sungai Tallo)",
      earthquake: "Rendah (Zona seismik relatif stabil)",
      rain: "Sedang (54mm)",
      underwritingNote: "DATA DUMMY — Pantau musim hujan pada luapan DAS Sungai Tallo."
    },
    isDummy: true
  },
  {
    id: "POL-ASK-2026-009",
    requestNo: "000098/110/210/2026/011",
    objectCode: "OBJ-KTM-009",
    riskBlockCode: "INAKTM0003",
    holderName: "PT Nusantara Timber & Logistics Kariangau (DUMMY)",
    insuredName: "PT Nusantara Timber & Logistics Kariangau (DUMMY)",
    nikOrNpwp: "02.555.444.3-722.000",
    lineOfBusiness: "IAR",
    productType: "Industrial All Risks (IAR)",
    insuredType: "All Risks",
    underwriteYear: 2026,
    propertyCategory: "Pabrik Industri Manufaktur",
    occupationCode: "2510 - Wood processing & logistics terminal",
    constructionClass: "Kelas 1",
    yearBuilt: 2021,
    numberOfFloors: 2,
    tariffCode: "TRF-2510-K1",
    itemCode: "ITM-FAC-09",
    address: "Kawasan Industri Kariangau Km 5.5, Kota Balikpapan",
    village: "Kariangau",
    district: "Balikpapan Barat",
    city: "Kota Balikpapan",
    province: "Kalimantan Timur",
    postalCode: "76134",
    lat: -1.1890,
    lng: 116.8250,
    sumInsured: 55000000000,
    siBreakdown: {
      building: 25000000000,
      machinery: 18000000000,
      stock: 8000000000,
      others: 2000000000,
      bi: 2000000000
    },
    premium: 88000000,
    startDate: "2026-03-10",
    endDate: "2027-03-09",
    status: "Aktif (DUMMY)",
    elevation: 24.0,
    riverDistance: 480,
    basinName: "Teluk Balikpapan - Wain",
    basinAreaKm2: 185.0,
    rainfallWeekly: 50.0,
    nearestQuakeDist: 340,
    slopeAngleDeg: 4.2,
    soilType: "Podzolic Red-Yellow",
    landCover: "Industrial Corridor",
    nearestFireStation: {
      name: "BPBD & Damkar Balikpapan Barat (Kariangau)",
      distanceKm: 3.4,
      estArrivalText: "11 minutes, 20 seconds",
      lat: -1.2150,
      lng: 116.8310
    },
    nearbyBuildings20m: 9,
    nearbyGasStations: [
      { name: "SPBU Kariangau (Simulasi)", distM: 890, lat: -1.1980, lng: 116.8320 }
    ],
    riskLevel: "Rendah",
    riskScore: 22,
    perilScores: {
      flood: { score: 20, status: "Low", source: "Elevasi Perbukitan 24 mdpl", updated: "2026-10-01" },
      landslide: { score: 28, status: "Low", source: "Kemiringan 4.2°", updated: "2026-10-01" },
      earthquake: { score: 15, status: "None", source: "USGS / PusGen", updated: "2026-10-18" },
      wildfire: { score: 46, status: "Medium", source: "Konteks Industri Kayu & Lahan Sekitar", updated: "2026-09-15" },
      extremeWeather: { score: 35, status: "Low", source: "Open-Meteo", updated: "Live / Simulasi" },
      drought: { score: null, status: "NO_DATA", noDataReason: "OUT_OF_COVERAGE", source: "Layer Belum Tersedia", updated: "N/A" },
      liquefaction: { score: null, status: "NO_DATA", noDataReason: "OUT_OF_COVERAGE", source: "Layer Belum Tersedia", updated: "N/A" },
      tsunami: { score: 12, status: "None", source: "Teluk Dalam Terlindung", updated: "2026-09-01" },
      volcano: { score: 0, status: "None", source: "Bebas Gunung Api Aktif", updated: "2026-10-01" }
    },
    claimHistory: [],
    assessmentHistory: [],
    riskFactors: {
      flood: "Rendah (Elevasi 24 mdpl)",
      earthquake: "Rendah (Kalimantan)",
      rain: "Sedang (50mm)",
      underwritingNote: "DATA DUMMY — Perhatikan manajemen risiko kebakaran (wildfire/fire) pada stok pengolahan kayu."
    },
    isDummy: true
  },
  {
    id: "POL-ASK-2026-010",
    requestNo: "000105/110/211/2026/012",
    objectCode: "OBJ-DIY-010",
    riskBlockCode: "INADIY0005",
    holderName: "PT Malioboro Heritage Hotel & Retail (DUMMY)",
    insuredName: "PT Malioboro Heritage Hotel & Retail (DUMMY)",
    nikOrNpwp: "3471021903800004",
    lineOfBusiness: "PAR",
    productType: "Property All Risks (PAR)",
    insuredType: "All Risks + EQ & Volcanic",
    underwriteYear: 2025,
    propertyCategory: "Hotel & Resort",
    occupationCode: "2981 - Urban Boutique Hotel & Retail",
    constructionClass: "Kelas 1",
    yearBuilt: 2016,
    numberOfFloors: 5,
    tariffCode: "TRF-2981-K1",
    itemCode: "ITM-HTL-10",
    address: "Jl. Malioboro No. 56, Suryatmajan, Danurejan, Kota Yogyakarta",
    village: "Suryatmajan",
    district: "Danurejan",
    city: "Kota Yogyakarta",
    province: "DI Yogyakarta",
    postalCode: "55213",
    lat: -7.7930,
    lng: 110.3660,
    sumInsured: 27200000000,
    siBreakdown: {
      building: 18200000000,
      machinery: 3500000000,
      stock: 2500000000,
      others: 1500000000,
      bi: 1500000000
    },
    premium: 43500000,
    startDate: "2025-12-01",
    endDate: "2026-11-30",
    status: "Aktif (DUMMY)",
    elevation: 112.0,
    riverDistance: 420,
    basinName: "DAS Kali Code",
    basinAreaKm2: 168.0,
    rainfallWeekly: 58.0,
    nearestQuakeDist: 38,
    slopeAngleDeg: 2.2,
    soilType: "Volcanic Regosol Merapi",
    landCover: "High-Density Commercial",
    nearestFireStation: {
      name: "Dinas Pemadam Kebakaran & Penyelamatan Kota Yogyakarta",
      distanceKm: 1.5,
      estArrivalText: "5 minutes, 30 seconds",
      lat: -7.8010,
      lng: 110.3780
    },
    nearbyBuildings20m: 44,
    nearbyGasStations: [
      { name: "SPBU Lempuyangan (Simulasi)", distM: 580, lat: -7.7890, lng: 110.3750 }
    ],
    riskLevel: "Tinggi",
    riskScore: 76,
    perilScores: {
      flood: { score: 38, status: "Low", source: "Jarak 420m dari Lembah Kali Code", updated: "2026-10-01" },
      landslide: { score: 12, status: "Very Low", source: "Dataran Kota", updated: "2026-10-01" },
      earthquake: { score: 84, status: "High", source: "Koridor Sesar Opak Yogyakarta", updated: "2026-10-18" },
      wildfire: { score: 58, status: "Medium", source: "Kepadatan Bangunan Koridor Malioboro (44 gedung/20m)", updated: "2026-09-15" },
      extremeWeather: { score: 48, status: "Medium", source: "Open-Meteo", updated: "Live / Simulasi" },
      drought: { score: 25, status: "Low", source: "Simulasi", updated: "2026-08-01" },
      liquefaction: { score: 62, status: "High", source: "Pasir Vulkanik Muda Merapi + Sesar Opak", updated: "2026-07-01" },
      tsunami: { score: 0, status: "None", source: "Jarak > 27 km dari Pantai Selatan", updated: "2026-09-01" },
      volcano: { score: 68, status: "High", source: "Paparan Hujan Abu Vulkanik & Hulu Kali Code G. Merapi", updated: "2026-10-01" }
    },
    claimHistory: [],
    assessmentHistory: [],
    riskFactors: {
      flood: "Rendah-Sedang (Ancaman lahar hujan Kali Code bila Merapi erupsi besar)",
      earthquake: "Tinggi (Zona Sesar Opak Yogyakarta)",
      rain: "Sedang (58mm)",
      underwritingNote: "DATA DUMMY — Perhatikan eksposur gempa Sesar Opak dan abu vulkanik Gunung Merapi."
    },
    isDummy: true
  },
  {
    id: "POL-ASK-2026-011",
    requestNo: "000112/110/212/2026/013",
    objectCode: "OBJ-SUM-011",
    riskBlockCode: "INASUT0009",
    holderName: "PT Deli Agro Industri Medan (DUMMY)",
    insuredName: "PT Deli Agro Industri Medan (DUMMY)",
    nikOrNpwp: "01.771.229.8-101.000",
    lineOfBusiness: "PSAGBI",
    productType: "PSAGBI (Properti & Gangguan Usaha)",
    insuredType: "All Risks + Flood",
    underwriteYear: 2026,
    propertyCategory: "Pabrik Industri Manufaktur",
    occupationCode: "2105 - Palm oil & food processing plant",
    constructionClass: "Kelas 1",
    yearBuilt: 2017,
    numberOfFloors: 3,
    tariffCode: "TRF-2105-K1",
    itemCode: "ITM-FAC-11",
    address: "Kawasan Industri Medan (KIM) Tahap II, Medan Deli, Kota Medan",
    village: "Mabar",
    district: "Medan Deli",
    city: "Kota Medan",
    province: "Sumatera Utara",
    postalCode: "20242",
    lat: 3.6650,
    lng: 98.6850,
    sumInsured: 51000000000,
    siBreakdown: {
      building: 24000000000,
      machinery: 16000000000,
      stock: 7000000000,
      others: 1500000000,
      bi: 2500000000
    },
    premium: 76500000,
    startDate: "2026-02-10",
    endDate: "2027-02-09",
    status: "Aktif (DUMMY)",
    elevation: 9.0,
    riverDistance: 260,
    basinName: "DAS Sungai Deli",
    basinAreaKm2: 390.0,
    rainfallWeekly: 76.0,
    nearestQuakeDist: 95,
    slopeAngleDeg: 1.4,
    soilType: "Alluvial Deli Plain",
    landCover: "Industrial Estate",
    nearestFireStation: {
      name: "UPT Pemadam Kebakaran KIM / Medan Deli",
      distanceKm: 1.3,
      estArrivalText: "5 minutes, 05 seconds",
      lat: 3.6580,
      lng: 98.6790
    },
    nearbyBuildings20m: 15,
    nearbyGasStations: [
      { name: "SPBU KIM Mabar (Simulasi)", distM: 490, lat: 3.6610, lng: 98.6810 }
    ],
    riskLevel: "Tinggi",
    riskScore: 71,
    perilScores: {
      flood: { score: 74, status: "High", source: "DAS Sungai Deli & Curah Hujan Sumatera Utara", updated: "2026-10-01" },
      landslide: { score: 5, status: "None", source: "Dataran Rendah", updated: "2026-10-01" },
      earthquake: { score: 48, status: "Medium", source: "USGS / Sesar Sumatera", updated: "2026-10-18" },
      wildfire: { score: 52, status: "Medium", source: "Fasilitas Pengolahan Agro", updated: "2026-09-15" },
      extremeWeather: { score: 78, status: "High", source: "Open-Meteo Sumatera Flash Flood Alert", updated: "Live / Simulasi" },
      drought: { score: null, status: "NO_DATA", noDataReason: "OUT_OF_COVERAGE", source: "Layer Belum Tersedia", updated: "N/A" },
      liquefaction: { score: 42, status: "Medium", source: "Dataran Aluvial", updated: "2026-07-01" },
      tsunami: { score: 15, status: "None", source: "Selat Malaka (>10 km dari garis pantai)", updated: "2026-09-01" },
      volcano: { score: 20, status: "Low", source: "Jarak ~55 km dari G. Sinabung", updated: "2026-10-01" }
    },
    claimHistory: [],
    assessmentHistory: [],
    riskFactors: {
      flood: "Tinggi (DAS Sungai Deli)",
      earthquake: "Sedang (48/100)",
      rain: "Tinggi (76mm)",
      underwritingNote: "DATA DUMMY — Termasuk koridor pantauan Sumatera Flash Flood & DAS Sungai Deli."
    },
    isDummy: true
  },
  {
    id: "POL-ASK-2026-012",
    requestNo: "000120/110/213/2026/014",
    objectCode: "OBJ-JKT-019",
    riskBlockCode: "INAJKT0009",
    holderName: "PT Pancoran Graha Korporindo (DUMMY)",
    insuredName: "PT Pancoran Graha Korporindo (DUMMY)",
    nikOrNpwp: "01.662.410.9-061.000",
    lineOfBusiness: "PAR",
    productType: "Property BUMN",
    insuredType: "All Risks + EQ",
    underwriteYear: 2026,
    propertyCategory: "Gedung Perkantoran / Klinik",
    occupationCode: "2971 - Corporate Office Tower",
    constructionClass: "Kelas 1",
    yearBuilt: 2020,
    numberOfFloors: 16,
    tariffCode: "TRF-2971-K1",
    itemCode: "ITM-BLD-12",
    address: "Jl. MT Haryono Kav. 22, Pancoran, Jakarta Selatan",
    village: "Pancoran",
    district: "Pancoran",
    city: "Kota Adm. Jakarta Selatan",
    province: "DKI Jakarta",
    postalCode: "12780",
    lat: -6.2442,
    lng: 106.8475,
    sumInsured: 74000000000,
    siBreakdown: {
      building: 50000000000,
      machinery: 11000000000,
      stock: 3000000000,
      others: 4000000000,
      bi: 6000000000
    },
    premium: 111000000,
    startDate: "2026-03-15",
    endDate: "2027-03-14",
    status: "Aktif (DUMMY)",
    elevation: 16.5,
    riverDistance: 390,
    basinName: "DAS Ciliwung Tengah",
    basinAreaKm2: 438.22,
    rainfallWeekly: 60.0,
    nearestQuakeDist: 115,
    slopeAngleDeg: 2.3,
    soilType: "Reddish Alluvial Latosol",
    landCover: "Urban CBD",
    nearestFireStation: {
      name: "Sektor Damkar Tebet / Pancoran",
      distanceKm: 1.55,
      estArrivalText: "6 minutes, 10 seconds",
      lat: -6.2360,
      lng: 106.8520
    },
    nearbyBuildings20m: 28,
    nearbyGasStations: [
      { name: "SPBU MT Haryono Pancoran (Simulasi)", distM: 290, lat: -6.2435, lng: 106.8445 }
    ],
    riskLevel: "Sedang",
    riskScore: 52,
    perilScores: {
      flood: { score: 54, status: "Medium", source: "Dekat Koridor Ciliwung Cawang-Pancoran", updated: "2026-10-01" },
      landslide: { score: 12, status: "Very Low", source: "Topografi Stabil", updated: "2026-10-01" },
      earthquake: { score: 44, status: "Medium", source: "USGS / PusGen", updated: "2026-10-18" },
      wildfire: { score: 38, status: "Low", source: "Gedung Perkantoran Modern", updated: "2026-09-15" },
      extremeWeather: { score: 58, status: "Medium", source: "Open-Meteo", updated: "Live / Simulasi" },
      drought: { score: 22, status: "Low", source: "Simulasi", updated: "2026-08-01" },
      liquefaction: { score: 28, status: "Low", source: "Tanah Latosol", updated: "2026-07-01" },
      tsunami: { score: 0, status: "None", source: "Jauh dari Pantai", updated: "2026-09-01" },
      volcano: { score: 0, status: "None", source: "Aman dari KRB", updated: "2026-10-01" }
    },
    claimHistory: [],
    assessmentHistory: [],
    riskFactors: {
      flood: "Sedang (54/100)",
      earthquake: "Sedang (44/100)",
      rain: "Sedang (60mm)",
      underwritingNote: "DATA DUMMY — Koridor bisnis Pancoran/MT Haryono."
    },
    isDummy: true
  }
];

// Contoh Baris Template Excel (Revisi ASGARD: Wajib "Policy Number", "Type of Class (TOC)", "Occupation Code", dan 9 Kolom Lokasi)
const EXCEL_TEMPLATE_SAMPLE_ROWS = [
  {
    "Policy Number": "POL-ACS-2026-000101",
    "Type of Class (TOC)": "0103 PAR",
    "Occupation Code": "2971",
    "Durasi Pertanggungan": "5 Tahun (17 Oktober 2026 – 17 Oktober 2031)",
    "Village": "Mampir",
    "Sub District": "Cileungsi",
    "City/Regency": "Bogor",
    "Province": "Jawa Barat",
    "Postal Code": "16820",
    "Geo - Longitude": "106.985214",
    "Geo - Latitude": "-6.412530",
    "Sum Insured": 12500000000,
    "Insured Name (Optional)": "PT Cibubur Logistik Utama"
  },
  {
    "Policy Number": "POL-ACS-2026-000102",
    "Type of Class (TOC)": "0104 IAR",
    "Occupation Code": "2972",
    "Durasi Pertanggungan": "5 Tahun (17 Oktober 2026 – 17 Oktober 2031)",
    "Village": "Kebon Sirih",
    "Sub District": "Menteng",
    "City/Regency": "Kota Adm. Jakarta Pusat",
    "Province": "DKI Jakarta",
    "Postal Code": "10340",
    "Geo - Longitude": "106.826500",
    "Geo - Latitude": "-6.183800",
    "Sum Insured": 24000000000,
    "Insured Name (Optional)": "PT Graha Menteng Asri"
  },
  {
    "Policy Number": "POL-ACS-2026-000103",
    "Type of Class (TOC)": "0101 PSAKI",
    "Occupation Code": "29311",
    "Durasi Pertanggungan": "3 Tahun (17 Oktober 2026 – 17 Oktober 2029)",
    "Village": "Sunter Agung",
    "Sub District": "Tanjung Priok",
    "City/Regency": "Kota Adm. Jakarta Utara",
    "Province": "DKI Jakarta",
    "Postal Code": "14350",
    "Geo - Longitude": "106.861200",
    "Geo - Latitude": "-6.139500",
    "Sum Insured": 45000000000,
    "Insured Name (Optional)": "PT Otomotif Nusantara Sunter"
  }
];

// Riwayat Kejadian Bencana Sekitar (PDF Hal. 7, 8, 9 - Historical Disasters & Flood Frequency)
const HISTORICAL_DISASTERS_SAMPLE = [
  { type: "Flood", date: "Sabtu, 19 Februari 2022", distanceNote: "12.4 km S", casualties: "0 Casualties", lossNote: "Kerugian Rp 0 (Simulasi)", region: "DKI Jakarta" },
  { type: "Flood", date: "Kamis, 17 Februari 2022", distanceNote: "14.8 km S", casualties: "0 Casualties", lossNote: "Kerugian Rp 0 (Simulasi)", region: "DKI Jakarta" },
  { type: "Flood", date: "Sabtu, 20 Februari 2021", distanceNote: "15.0 km S", casualties: "1 Casualties (Data Historis BNPB Simulasi)", lossNote: "Genangan Regional", region: "DKI Jakarta" },
  { type: "Flood", date: "Minggu, 07 Februari 2021", distanceNote: "28.4 km S", casualties: "0 Casualties", lossNote: "Luapan DAS Ciliwung", region: "DKI Jakarta" },
  { type: "Earthquake", date: "Senin, 21 November 2022", distanceNote: "78.0 km SE (Cianjur M 5.6)", casualties: "Terasa MMI III-IV di Jakarta", lossNote: "Guncangan Regional", region: "Jawa Barat / DKI" }
];

// Data Frekuensi Banjir Tahunan pada DAS yang Sama (PDF Hal. 9 - Historical Flood Events Bar Chart)
const BASIN_FLOOD_FREQUENCY_BY_YEAR = {
  years: ["2017", "2018", "2019", "2020", "2021", "2022", "2023", "2024", "2025", "2026"],
  counts: [2, 5, 4, 10, 6, 4, 2, 3, 2, 1]
};

// Data Lintasan Siklon Tropis (PDF Hal. 11 - Tropical Cyclone Monitoring Trajectory Timeline)
const TROPICAL_CYCLONE_SIMULATION = {
  name: "BIBIT SIKLON TROPIS 92W / CEMPAKA (DATA SIMULASI)",
  season: "2026 (Data Simulasi Historis)",
  basin: "Southern Hemisphere / Samudera Hindia Selatan Jawa",
  isActive: false,
  note: "SIMULASI / DUMMY — BMKG TCWC Jakarta menyatakan wilayah Indonesia umumnya terdampak ekor siklon (hujan ekstrem & angin kencang pesisir).",
  trajectory: [
    { datetime: "Sep 25, 2026 07:00 WIB", coords: "-10.8000°, 108.5000°", maxWindKnots: "35 knots", pressureHpa: "998 mb" },
    { datetime: "Sep 24, 2026 19:00 WIB", coords: "-11.2000°, 109.1000°", maxWindKnots: "30 knots", pressureHpa: "1000 mb" },
    { datetime: "Sep 24, 2026 07:00 WIB", coords: "-11.6000°, 109.8000°", maxWindKnots: "25 knots", pressureHpa: "1003 mb" },
    { datetime: "Sep 23, 2026 19:00 WIB", coords: "-12.1000°, 110.4000°", maxWindKnots: "20 knots", pressureHpa: "1005 mb" }
  ],
  pathCoords: [
    [-12.1, 110.4],
    [-11.6, 109.8],
    [-11.2, 109.1],
    [-10.8, 108.5]
  ]
};

// Geometri Sungai-Sungai Utama Indonesia (Dari Askrindo Georisk Platform)
const MAJOR_RIVERS_GEOJSON = {
  type: "FeatureCollection",
  features: [
    {
      type: "Feature",
      properties: { name: "Sungai Ciliwung", category: "DAS Jakarta", floodRisk: "Tinggi" },
      geometry: {
        type: "LineString",
        coordinates: [
          [106.985, -6.685], [106.920, -6.610], [106.880, -6.530],
          [106.840, -6.440], [106.850, -6.360], [106.865, -6.280],
          [106.855, -6.220], [106.842, -6.180], [106.828, -6.125]
        ]
      }
    },
    {
      type: "Feature",
      properties: { name: "Sungai Cisadane", category: "DAS Tangerang-Bogor", floodRisk: "Tinggi" },
      geometry: {
        type: "LineString",
        coordinates: [
          [106.810, -6.710], [106.775, -6.600], [106.720, -6.450],
          [106.670, -6.330], [106.630, -6.200], [106.620, -6.070]
        ]
      }
    },
    {
      type: "Feature",
      properties: { name: "Sungai Citarum", category: "DAS Bandung & Karawang", floodRisk: "Sangat Tinggi" },
      geometry: {
        type: "LineString",
        coordinates: [
          [107.680, -7.180], [107.620, -7.020], [107.540, -6.950],
          [107.480, -6.850], [107.380, -6.720], [107.310, -6.550],
          [107.270, -6.320], [107.150, -6.010]
        ]
      }
    },
    {
      type: "Feature",
      properties: { name: "Bengawan Solo", category: "DAS Jawa Tengah & Timur", floodRisk: "Sangat Tinggi" },
      geometry: {
        type: "LineString",
        coordinates: [
          [110.880, -7.880], [110.850, -7.650], [110.820, -7.560],
          [110.980, -7.420], [111.350, -7.310], [111.850, -7.150],
          [112.420, -7.080], [112.550, -6.900]
        ]
      }
    },
    {
      type: "Feature",
      properties: { name: "Kali Brantas", category: "DAS Jawa Timur", floodRisk: "Tinggi" },
      geometry: {
        type: "LineString",
        coordinates: [
          [112.510, -7.780], [112.630, -7.980], [112.550, -8.150],
          [112.020, -8.080], [111.950, -7.820], [111.120, -7.520],
          [112.450, -7.450], [112.750, -7.350]
        ]
      }
    },
    {
      type: "Feature",
      properties: { name: "Banjir Kanal Barat Semarang", category: "DAS Semarang", floodRisk: "Tinggi" },
      geometry: {
        type: "LineString",
        coordinates: [
          [110.380, -7.050], [110.395, -7.000], [110.400, -6.960], [110.390, -6.930]
        ]
      }
    },
    {
      type: "Feature",
      properties: { name: "Sungai Batang Arau & Kuranji", category: "DAS Padang", floodRisk: "Tinggi" },
      geometry: {
        type: "LineString",
        coordinates: [
          [100.480, -0.960], [100.410, -0.950], [100.360, -0.965], [100.350, -0.975]
        ]
      }
    },
    {
      type: "Feature",
      properties: { name: "Sungai Deli", category: "DAS Medan", floodRisk: "Tinggi" },
      geometry: {
        type: "LineString",
        coordinates: [
          [98.650, -3.420], [98.665, -3.510], [98.680, -3.600], [98.685, -3.720]
        ]
      }
    },
    {
      type: "Feature",
      properties: { name: "Sungai Tallo", category: "DAS Makassar (Sulsel)", floodRisk: "Sedang" },
      geometry: {
        type: "LineString",
        coordinates: [
          [119.560, -5.200], [119.510, -5.160], [119.460, -5.120], [119.435, -5.090]
        ]
      }
    }
  ]
};

// Sesar & Megathrust Aktif (Dari Askrindo Georisk Platform)
const ACTIVE_FAULTS_GEOJSON = {
  type: "FeatureCollection",
  features: [
    {
      type: "Feature",
      properties: {
        name: "Sesar Lembang",
        faultCategory: "fault",
        type: "Sesar Geser Sinistral & Turun",
        lengthKm: 29,
        maxPotentialMag: 6.8,
        slipRateMmYear: "3 - 5",
        region: "Bandung Raya, Jawa Barat",
        hazardLevel: "Sangat Tinggi",
        description: "Membentang dari Gunung Palasari hingga Cisarua, mengancam Cekungan Bandung dengan amplifikasi tanah lunak (Data Indikatif PusGen)."
      },
      geometry: {
        type: "LineString",
        coordinates: [
          [107.720, -6.812], [107.675, -6.818], [107.625, -6.822],
          [107.575, -6.827], [107.510, -6.832], [107.450, -6.838]
        ]
      }
    },
    {
      type: "Feature",
      properties: {
        name: "Sesar Cimandiri",
        faultCategory: "fault",
        type: "Sesar Geser Dekstral Miring",
        lengthKm: 100,
        maxPotentialMag: 7.0,
        slipRateMmYear: "4 - 8",
        region: "Sukabumi - Pelabuhan Ratu - Cianjur",
        hazardLevel: "Sangat Tinggi",
        description: "Sesar aktif dari Teluk Pelabuhan Ratu, Sukabumi, Cianjur, hingga Tangkuban Perahu (Data Indikatif PusGen)."
      },
      geometry: {
        type: "LineString",
        coordinates: [
          [106.520, -7.020], [106.750, -6.950], [106.930, -6.920],
          [107.120, -6.860], [107.280, -6.810], [107.440, -6.780]
        ]
      }
    },
    {
      type: "Feature",
      properties: {
        name: "Sesar Baribis - Kendeng",
        faultCategory: "fault",
        type: "Sesar Naik Aktif (Thrust Fault)",
        lengthKm: 300,
        maxPotentialMag: 7.2,
        slipRateMmYear: "3 - 6",
        region: "Purwakarta - Cirebon - Semarang - Surabaya",
        hazardLevel: "Tinggi",
        description: "Jalur sesar anjak di utara Pulau Jawa melintasi koridor padat infrastruktur dan pusat industri."
      },
      geometry: {
        type: "LineString",
        coordinates: [
          [108.180, -6.850], [108.550, -6.880], [109.120, -6.980],
          [109.850, -7.020], [110.420, -7.050], [111.120, -7.150],
          [111.850, -7.220], [112.550, -7.280]
        ]
      }
    },
    {
      type: "Feature",
      properties: {
        name: "Sesar Opak",
        faultCategory: "fault",
        type: "Sesar Geser Sinistral",
        lengthKm: 40,
        maxPotentialMag: 6.6,
        slipRateMmYear: "2 - 4",
        region: "Bantul - Klaten - Yogyakarta",
        hazardLevel: "Sangat Tinggi",
        description: "Patahan di lembah Sungai Opak Yogyakarta."
      },
      geometry: {
        type: "LineString",
        coordinates: [
          [110.280, -8.010], [110.360, -7.920], [110.430, -7.820],
          [110.480, -7.740], [110.530, -7.670]
        ]
      }
    },
    {
      type: "Feature",
      properties: {
        name: "Sesar Besar Sumatera (Sesar Semangko)",
        faultCategory: "fault",
        type: "Sesar Mendatar Dekstral (Strike-Slip)",
        lengthKm: 1900,
        maxPotentialMag: 7.8,
        slipRateMmYear: "15 - 27",
        region: "Sepanjang Bukit Barisan dari Lampung hingga Aceh",
        hazardLevel: "Kritis",
        description: "Patahan darat utama Pulau Sumatera."
      },
      geometry: {
        type: "LineString",
        coordinates: [
          [104.650, -5.720], [103.950, -4.950], [102.820, -3.850],
          [101.950, -2.750], [100.850, -1.250], [100.350, -0.650],
          [99.650, 0.450], [98.850, 1.850], [97.550, 3.550],
          [96.150, 4.850], [95.450, 5.550]
        ]
      }
    },
    {
      type: "Feature",
      properties: {
        name: "Sesar Palu-Koro",
        faultCategory: "fault",
        type: "Sesar Mendatar Sinistral Cepat",
        lengthKm: 250,
        maxPotentialMag: 7.5,
        slipRateMmYear: "35 - 45",
        region: "Teluk Palu - Lembah Koro, Sulawesi Tengah",
        hazardLevel: "Kritis",
        description: "Patahan aktif di Sulawesi Tengah."
      },
      geometry: {
        type: "LineString",
        coordinates: [
          [119.820, -0.720], [119.880, -0.920], [119.980, -1.250],
          [120.150, -1.650], [120.350, -2.050], [120.650, -2.550]
        ]
      }
    },
    {
      type: "Feature",
      properties: {
        name: "Flores Back-Arc Thrust",
        faultCategory: "megathrust",
        type: "Zona Anjak Busur Belakang",
        lengthKm: 450,
        maxPotentialMag: 7.4,
        slipRateMmYear: "8 - 12",
        region: "Laut Bali - Lombok - Sumbawa - Flores",
        hazardLevel: "Sangat Tinggi",
        description: "Zona subduksi terbalik di utara Kepulauan Nusa Tenggara."
      },
      geometry: {
        type: "LineString",
        coordinates: [
          [115.150, -8.120], [115.850, -8.180], [116.550, -8.220],
          [117.850, -8.280], [119.250, -8.320], [120.550, -8.380]
        ]
      }
    },
    {
      type: "Feature",
      properties: {
        name: "Megathrust Sunda (Segmen Sumatera - Jawa - Bali)",
        faultCategory: "megathrust",
        type: "Zona Subduksi Megathrust",
        lengthKm: 2200,
        maxPotentialMag: 8.8,
        slipRateMmYear: "60 - 70",
        region: "Samudera Hindia Barat Sumatera & Selatan Jawa-Bali",
        hazardLevel: "Kritis",
        description: "Zona subduksi megathrust utama Indonesia (Indikatif PusGen)."
      },
      geometry: {
        type: "LineString",
        coordinates: [
          [95.0, 3.5], [97.5, 0.5], [99.5, -2.2], [102.0, -5.2],
          [104.550, -6.850], [106.250, -7.550], [108.150, -8.350],
          [110.550, -9.150], [112.850, -9.650], [115.250, -9.950]
        ]
      }
    }
  ]
};

// Gunung Api Aktif (Dari Askrindo Georisk Platform + Detail KRB sesuai PDF Hal. 15)
const ACTIVE_VOLCANOES = [
  {
    id: "VOL-01",
    code: "MER - Merapi",
    name: "Gunung Merapi",
    province: "Jawa Tengah / DI Yogyakarta",
    lat: -7.5407,
    lng: 110.4457,
    elevation: 2968,
    statusLevel: "Level III (Siaga - Indikatif Simulasi)",
    statusBadgeColor: "bg-orange-600",
    dangerRadiusKm: 7.0,
    krbZones: { krb3Km: 5.0, krb2Km: 7.0, krb1Km: 10.0 },
    threats: "Potensi guguran lava dan awan panas pada sektor selatan-barat daya (Sungai Boyong, Bebeng) dan tenggara (Sungai Woro, Gendol).",
    recommendationText: "REKOMENDASI (Referensi Simulasi PVMBG): Masyarakat dan pengelola aset properti diimbau tidak melakukan kegiatan di daerah potensi bahaya KRB III serta mewaspadai bahaya lahar hujan dan gangguan abu vulkanik.",
    lastEruption: "Data Statis Simulasi 2026"
  },
  {
    id: "VOL-02",
    code: "SMR - Semeru",
    name: "Gunung Semeru",
    province: "Jawa Timur",
    lat: -8.1080,
    lng: 112.9220,
    elevation: 3676,
    statusLevel: "Level III (Siaga - Indikatif Simulasi)",
    statusBadgeColor: "bg-orange-600",
    dangerRadiusKm: 8.0,
    krbZones: { krb3Km: 5.0, krb2Km: 8.0, krb1Km: 12.0 },
    threats: "Awan panas guguran sepanjang Besuk Kobokan, banjir lahar hujan di DAS Curah Kobokan.",
    recommendationText: "Hindari aktivitas pada sektor tenggara sepanjang Besuk Kobokan sejauh 13 km dari puncak.",
    lastEruption: "Data Statis Simulasi 2026"
  },
  {
    id: "VOL-03",
    code: "MRP - Marapi",
    name: "Gunung Marapi",
    province: "Sumatera Barat",
    lat: -0.3810,
    lng: 100.4730,
    elevation: 2891,
    statusLevel: "Level III (Siaga - Indikatif Simulasi)",
    statusBadgeColor: "bg-orange-600",
    dangerRadiusKm: 5.5,
    krbZones: { krb3Km: 4.5, krb2Km: 5.5, krb1Km: 8.0 },
    threats: "Lontaran abu vulkanik, bahaya banjir lahar hujan (Galodo) mengarah ke Agam dan Tanah Datar.",
    recommendationText: "Waspadai potensi lahar dingin di sepanjang aliran sungai yang berhulu di puncak Marapi.",
    lastEruption: "Data Statis Simulasi 2026"
  },
  {
    id: "VOL-04",
    code: "LWT - Lewotobi Laki-Laki",
    name: "Gunung Lewotobi Laki-Laki",
    province: "Nusa Tenggara Timur",
    lat: -8.5380,
    lng: 122.7680,
    elevation: 1584,
    statusLevel: "Level IV (Awas - Indikatif Simulasi)",
    statusBadgeColor: "bg-red-600",
    dangerRadiusKm: 7.0,
    krbZones: { krb3Km: 5.0, krb2Km: 7.0, krb1Km: 9.0 },
    threats: "Kolom erupsi abu vulkanik dan lontaran material pijar radius 7 km.",
    recommendationText: "Sterilisasi zona radius KRB III dan antisipasi beban abu vulkanik pada atap bangunan.",
    lastEruption: "Data Statis Simulasi 2026"
  },
  {
    id: "VOL-05",
    code: "KRK - Anak Krakatau",
    name: "Gunung Anak Krakatau",
    province: "Lampung (Selat Sunda)",
    lat: -6.1020,
    lng: 105.4230,
    elevation: 157,
    statusLevel: "Level III (Siaga - Indikatif Simulasi)",
    statusBadgeColor: "bg-orange-600",
    dangerRadiusKm: 5.0,
    krbZones: { krb3Km: 3.0, krb2Km: 5.0, krb1Km: 7.0 },
    threats: "Letusan freatomagmatik, lontaran material vulkanik di perairan Selat Sunda.",
    recommendationText: "Radius aman 5 km dari kawah aktif.",
    lastEruption: "Data Statis Simulasi 2026"
  }
];

// Zona Kerentanan Longsor (Dari Askrindo Georisk Platform)
const LANDSLIDE_HAZARD_ZONES = [
  {
    id: "LS-01",
    name: "Zona Longsor Puncak - Cianjur - Bogor",
    province: "Jawa Barat",
    lat: -6.705,
    lng: 106.995,
    risk: "Sangat Tinggi",
    dangerRadiusKm: 4.0,
    trigger: "Kemiringan lereng > 35%, tanah pelapukan vulkanik tebal, curah hujan ekstrem > 70 mm/hari."
  },
  {
    id: "LS-02",
    name: "Zona Longsor Banjarnegara - Wonosobo (Dieng)",
    province: "Jawa Tengah",
    lat: -7.280,
    lng: 109.920,
    risk: "Sangat Tinggi",
    dangerRadiusKm: 3.5,
    trigger: "Lereng curam batuan vulkanik lapuk dan rekahan tanah jenuh air."
  },
  {
    id: "LS-03",
    name: "Zona Longsor Lembah Anai - Agam",
    province: "Sumatera Barat",
    lat: -0.480,
    lng: 100.340,
    risk: "Sangat Tinggi",
    dangerRadiusKm: 4.0,
    trigger: "Dinding tebing curam di sepanjang jalur sesar Sumatera."
  },
  {
    id: "LS-04",
    name: "Zona Longsor Sibolangit - Berastagi",
    province: "Sumatera Utara",
    lat: 3.280,
    lng: 98.570,
    risk: "Tinggi",
    dangerRadiusKm: 3.0,
    trigger: "Jalur tebing batuan piroklastik curam dengan curah hujan pegunungan tinggi."
  },
  {
    id: "LS-05",
    name: "Zona Longsor Pegunungan Menoreh - Kulon Progo",
    province: "DI Yogyakarta",
    lat: -7.720,
    lng: 110.160,
    risk: "Tinggi",
    dangerRadiusKm: 3.0,
    trigger: "Formasi andesit tua dengan bidang gelincir lempung di lereng perbukitan."
  }
];

// Zona Bencana Banjir Nasional (Dari Askrindo Georisk Platform)
const FLOOD_HAZARD_ZONES = [
  {
    id: "FL-01",
    name: "Koridor DAS Ciliwung (Kampung Melayu, Bidara Cina, Rawajati & Manggarai)",
    province: "DKI Jakarta",
    lat: -6.225,
    lng: 106.860,
    categoryType: "luapan",
    categoryLabel: "Banjir Luapan Sungai",
    type: "Banjir Luapan Kiriman Hulu Katulampa & Hujan Lokal",
    elevation: "6 - 14 mdpl",
    dangerRadiusKm: 4.5,
    threat: "Luapan debit Sungai Ciliwung merendam koridor permukiman dan area komersial bantaran sungai."
  },
  {
    id: "FL-02",
    name: "Pesisir Pantura Jakarta (Pluit, Muara Baru, Ancol & Tanjung Priok)",
    province: "DKI Jakarta",
    lat: -6.118,
    lng: 106.830,
    categoryType: "rob",
    categoryLabel: "Banjir Pasang Rob Pesisir",
    type: "Banjir Pasang Rob & Penurunan Muka Tanah",
    elevation: "< 2.0 mdpl",
    dangerRadiusKm: 5.0,
    threat: "Penurunan muka tanah (land subsidence) diperparah pasang air laut dan muara saluran utama."
  },
  {
    id: "FL-03",
    name: "Cekungan Drainase Urban Jakarta (Kelapa Gading, Cempaka Putih & Kemang)",
    province: "DKI Jakarta",
    lat: -6.165,
    lng: 106.885,
    categoryType: "genangan",
    categoryLabel: "Banjir Genangan Perkotaan",
    type: "Banjir Genangan Drainase Urban (Pluvial)",
    elevation: "3 - 7 mdpl",
    dangerRadiusKm: 4.0,
    threat: "Intensitas hujan ekstrem lokal melampaui kapasitas drainase mikro perkotaan."
  },
  {
    id: "FL-04",
    name: "Banjir Bandang & Luapan DAS Sumatera Utara (Medan Deli, Binjai & Langkat)",
    province: "Sumatera Utara",
    lat: 3.640,
    lng: 98.670,
    categoryType: "bandang",
    categoryLabel: "Sumatera Flash Flood / Bandang",
    type: "Banjir Bandang & Luapan Hulu Bukit Barisan",
    elevation: "8 - 25 mdpl",
    dangerRadiusKm: 8.0,
    threat: "Debit banjir bandang dari hulu Bukit Barisan mengalir ke hilir DAS Deli dan Langkat."
  },
  {
    id: "FL-05",
    name: "Galodo Lembah Anai, Agam & Pesisir Padang",
    province: "Sumatera Barat",
    lat: -0.880,
    lng: 100.370,
    categoryType: "bandang",
    categoryLabel: "Sumatera Flash Flood / Galodo",
    type: "Banjir Bandang & Luapan Sungai Kuranji/Arau",
    elevation: "5 - 400 mdpl",
    dangerRadiusKm: 8.0,
    threat: "Aliran banjir bandang dan curah hujan ekstrem pesisir barat Sumatera."
  },
  {
    id: "FL-06",
    name: "Cekungan Kaligawe, Tanjung Emas & Sayung (Semarang - Demak)",
    province: "Jawa Tengah",
    lat: -6.958,
    lng: 110.450,
    categoryType: "rob",
    categoryLabel: "Banjir Pasang Rob Pesisir",
    type: "Banjir Rob & Genangan Koridor Industri Pantura",
    elevation: "0.5 - 1.8 mdpl",
    dangerRadiusKm: 5.0,
    threat: "Genangan pasang rob dan luapan kanal di kawasan industri dan pelabuhan Semarang."
  },
  {
    id: "FL-07",
    name: "Cekungan Baleendah - Dayeuhkolot (DAS Citarum Bandung)",
    province: "Jawa Barat",
    lat: -6.985,
    lng: 107.615,
    categoryType: "luapan",
    categoryLabel: "Banjir Luapan Sungai",
    type: "Banjir Cekungan DAS Citarum",
    elevation: "650 mdpl",
    dangerRadiusKm: 5.0,
    threat: "Genangan luapan Sungai Citarum hulu pada kawasan industri dan permukiman."
  },
  {
    id: "FL-08",
    name: "DAS Sungai Tallo & Manggala (Kota Makassar)",
    province: "Sulawesi Selatan",
    lat: -5.140,
    lng: 119.480,
    categoryType: "luapan",
    categoryLabel: "Banjir Luapan Sungai",
    type: "Banjir Luapan DAS Tallo",
    elevation: "4 - 14 mdpl",
    dangerRadiusKm: 4.5,
    threat: "Luapan Sungai Tallo saat puncak musim hujan menggenangi wilayah timur Makassar."
  }
];

// Preset Navigasi 38 Provinsi Indonesia (Dari Askrindo Georisk Platform)
const PROVINCE_BOOKMARKS = {
  "semua": { name: "National Natural Hazard (Seluruh Indonesia)", center: [-2.5, 118.0], zoom: 5 },
  "dki-jakarta": { name: "DKI Jakarta", center: [-6.195, 106.835], zoom: 12 },
  "jawa-barat": { name: "Jawa Barat", center: [-6.901, 107.580], zoom: 9 },
  "jawa-tengah": { name: "Jawa Tengah", center: [-7.005, 110.420], zoom: 9 },
  "di-yogyakarta": { name: "DI Yogyakarta", center: [-7.793, 110.366], zoom: 11 },
  "jawa-timur": { name: "Jawa Timur", center: [-7.350, 112.720], zoom: 9 },
  "banten": { name: "Banten", center: [-6.4058, 106.0640], zoom: 9 },
  "bali": { name: "Bali", center: [-8.650, 115.220], zoom: 10 },
  "sumatera-utara": { name: "Sumatera Utara", center: [3.620, 98.680], zoom: 9 },
  "sumatera-barat": { name: "Sumatera Barat", center: [-0.900, 100.370], zoom: 9 },
  "kalimantan-timur": { name: "Kalimantan Timur", center: [-1.189, 116.825], zoom: 9 },
  "sulawesi-selatan": { name: "Sulawesi Selatan", center: [-5.148, 119.489], zoom: 10 }
};


// ============================================================================
// NORMALISASI SKEMA DATA & KAMUS GEOKODING WILAYAH INDONESIA (AEGIS v2.1)
// ============================================================================

const PERIL_EMOJI_MAP = {
  flood: {
    id: "flood",
    icon: "🌊",
    providerBadge: "INARISK BNPB + Sungai/DAS",
    inariskService: "inarisk/layer_risiko_banjir",
    sourceNote: "API INARISK BNPB (layer_risiko_banjir) + Jarak Sungai/Sumber Air (Turf.js) & Formula H × V × (1 - C)."
  },
  landslide: {
    id: "landslide",
    icon: "⛰️",
    providerBadge: "INARISK BNPB",
    inariskService: "inarisk/layer_risiko_tanah_longsor",
    sourceNote: "API INARISK BNPB (layer_risiko_tanah_longsor) + Kemiringan Lereng DEM & Formula H × V × (1 - C)."
  },
  earthquake: {
    id: "earthquake",
    icon: "📳",
    providerBadge: "BMKG TEWS + MAGMA",
    inariskService: "inarisk/layer_risiko_gempabumi",
    sourceNote: "API Gempa Tektonik BMKG TEWS + Gempa Vulkanik MAGMA ESDM + Sesar PuSGeN & INARISK BNPB."
  },
  wildfire: {
    id: "fire",
    icon: "🔥",
    providerBadge: "INARISK Fire × Populasi",
    inariskService: "inarisk/layer_risiko_kebakaran_hutan_dan_lahan",
    sourceNote: "Overlay Data Kebakaran & Kepadatan Penduduk (INARISKPOP_2020 BNPB) + Radius Bangunan 20m."
  },
  fire: {
    id: "fire",
    icon: "🔥",
    providerBadge: "INARISK Fire × Populasi",
    inariskService: "inarisk/layer_risiko_kebakaran_hutan_dan_lahan",
    sourceNote: "Overlay Data Kebakaran & Kepadatan Penduduk (INARISKPOP_2020 BNPB) + Radius Bangunan 20m."
  },
  extremeWeather: {
    id: "extreme_weather",
    icon: "⛈️",
    providerBadge: "WINDY + INARISK",
    inariskService: "inarisk/layer_risiko_cuaca_ekstrim",
    sourceNote: "Data Cuaca Ekstrem WINDY / Open-Meteo Forecast + Radar Live & INARISK Cuaca Ekstrem."
  },
  extreme_weather: {
    id: "extreme_weather",
    icon: "⛈️",
    providerBadge: "WINDY + INARISK",
    inariskService: "inarisk/layer_risiko_cuaca_ekstrim",
    sourceNote: "Data Cuaca Ekstrem WINDY / Open-Meteo Forecast + Radar Live & INARISK Cuaca Ekstrem."
  },
  drought: {
    id: "drought",
    icon: "☀️",
    providerBadge: "INARISK BNPB",
    inariskService: "inarisk/layer_risiko_kekeringan",
    sourceNote: "API INARISK BNPB (layer_risiko_kekeringan) & Indeks Kekeringan Klimatologi H × V × (1 - C)."
  },
  liquefaction: {
    id: "liquefaction",
    icon: "💧",
    providerBadge: "INARISK BNPB",
    inariskService: "inarisk/layer_risiko_likuefaksi",
    sourceNote: "API INARISK BNPB (layer_risiko_likuefaksi) & Kerentanan Tanah Aluvial Jenuh Air."
  },
  tsunami: {
    id: "tsunami",
    icon: "🌊",
    providerBadge: "INARISK BNPB + BMKG",
    inariskService: "inarisk/layer_risiko_tsunami",
    sourceNote: "API INARISK BNPB (layer_risiko_tsunami) + Proksimitas Garis Pantai & Megathrust BMKG."
  },
  volcano: {
    id: "volcano",
    icon: "🌋",
    providerBadge: "MAGMA ESDM / PVMBG",
    inariskService: "inarisk/layer_risiko_letusan_gunungapi",
    sourceNote: "API MAGMA Indonesia (PVMBG Kementerian ESDM) Tingkat Aktivitas Gunung Api & Zona KRB I/II/III."
  }
};

AEGIS_PERILS.forEach(p => {
  const meta = PERIL_EMOJI_MAP[p.key] || { id: p.key, icon: "⚠️", providerBadge: "INARISK BNPB", sourceNote: "Analisis Spasial Multi-Peril AEGIS" };
  p.id = meta.id;
  p.name = p.label || p.name;
  p.nameId = p.idLabel || p.nameId;
  p.icon = meta.icon;
  p.providerBadge = meta.providerBadge;
  p.inariskService = meta.inariskService;
  p.sourceNote = meta.sourceNote;
});

// ============================================================================
// POLIGON DARATAN KEPULAUAN INDONESIA (UNTUK CLIPPING HEATMAP RISIKO BANJIR)
// Memastikan heatmap risiko banjir mengikuti bentuk pulau asli & tidak bocor ke laut
// ============================================================================
const INDONESIA_ISLAND_POLYGONS = [
  // 1. Pulau Sumatera (Banda Aceh -> Medan -> Riau -> Jambi -> Palembang -> Lampung -> Bengkulu -> Padang -> Sibolga -> Meulaboh)
  [
    [95.22, 5.58], [96.15, 5.28], [97.15, 5.18], [97.95, 4.42], [98.68, 3.78],
    [99.65, 3.12], [100.55, 2.18], [101.45, 1.68], [102.35, 1.25], [103.35, 0.72],
    [103.78, -0.35], [104.45, -1.15], [104.92, -2.12], [105.95, -2.95], [105.88, -4.35],
    [105.78, -5.85], [105.15, -5.82], [104.45, -5.48], [103.75, -4.95], [102.22, -3.82],
    [101.08, -2.42], [100.32, -0.98], [99.78, -0.25], [99.12, 0.35], [98.65, 1.55],
    [97.92, 2.25], [96.95, 3.45], [96.12, 4.18], [95.32, 5.12]
  ],
  // 2. Pulau Bangka & Belitung
  [
    [105.12, -1.55], [106.15, -1.62], [106.85, -2.45], [106.52, -3.08], [105.82, -2.85], [105.15, -2.08]
  ],
  [
    [107.52, -2.52], [108.32, -2.58], [108.35, -3.22], [107.55, -3.22]
  ],
  // 3. Kepulauan Riau / Batam / Bintan
  [
    [103.85, 1.18], [104.68, 1.22], [104.68, 0.75], [103.85, 0.78]
  ],
  // 4. Pulau Jawa (Merak -> Jakarta -> Pantura Cirebon/Semarang/Surabaya/Banyuwangi -> Pantai Selatan Malang/Jogja/Cilacap/Sukabumi/Ujung Kulon)
  [
    [105.98, -5.88], [106.68, -6.02], [106.98, -6.05], [107.45, -5.98], [107.88, -6.22],
    [108.42, -6.32], [108.58, -6.72], [109.18, -6.84], [109.85, -6.88], [110.45, -6.92],
    [110.75, -6.42], [111.15, -6.65], [111.65, -6.72], [112.45, -6.88], [112.78, -7.18],
    [113.28, -7.68], [114.08, -7.68], [114.45, -8.15], [114.38, -8.72], [113.65, -8.48],
    [112.65, -8.38], [111.75, -8.28], [110.95, -8.22], [110.15, -7.95], [109.02, -7.74],
    [108.65, -7.68], [107.65, -7.62], [106.52, -7.42], [106.38, -6.95], [105.22, -6.78],
    [105.78, -6.18]
  ],
  // 5. Pulau Madura
  [
    [112.68, -6.88], [114.12, -6.88], [114.12, -7.25], [112.72, -7.22]
  ],
  // 6. Pulau Bali
  [
    [114.43, -8.08], [115.12, -8.08], [115.71, -8.35], [115.62, -8.72], [115.15, -8.84], [114.62, -8.42]
  ],
  // 7. Pulau Lombok
  [
    [115.82, -8.22], [116.68, -8.25], [116.65, -8.92], [115.85, -8.88]
  ],
  // 8. Pulau Sumbawa
  [
    [116.72, -8.32], [118.25, -8.15], [119.18, -8.45], [119.12, -8.95], [117.85, -9.05], [116.75, -9.02]
  ],
  // 9. Pulau Flores
  [
    [119.78, -8.35], [121.45, -8.38], [123.05, -8.18], [123.02, -8.72], [121.25, -8.88], [119.82, -8.82]
  ],
  // 10. Pulau Sumba
  [
    [118.92, -9.32], [120.25, -9.58], [120.82, -10.05], [120.15, -10.32], [119.05, -9.78]
  ],
  // 11. Pulau Timor (NTT / Kupang - Atambua)
  [
    [123.45, -9.95], [124.95, -8.95], [125.25, -9.45], [124.35, -10.25], [123.52, -10.38]
  ],
  // 12. Pulau Kalimantan (Kalbar, Kalteng, Kalsel, Kaltim, Kaltara)
  [
    [108.85, 0.92], [109.65, 2.05], [111.85, 1.45], [114.55, 2.25], [116.25, 4.25],
    [117.88, 4.18], [117.95, 2.15], [118.95, 0.95], [117.65, -0.25], [117.05, -1.25],
    [116.45, -2.35], [116.25, -3.55], [114.52, -4.12], [113.25, -3.45], [111.75, -3.45],
    [110.15, -2.95], [109.92, -1.65], [109.18, -0.45]
  ],
  // 13. Pulau Sulawesi (Sulsel, Sulbar, Sulteng, Sultra, Gorontalo, Sulut)
  [
    [119.35, -5.65], [120.48, -5.62], [120.45, -4.45], [120.25, -3.05], [120.85, -2.55],
    [121.45, -3.25], [122.15, -4.65], [122.95, -4.45], [122.45, -3.15], [121.95, -1.95],
    [123.45, -1.35], [123.52, -0.65], [121.65, -0.45], [120.45, -1.15], [120.15, 0.35],
    [121.25, 0.95], [123.15, 0.95], [124.85, 1.45], [125.25, 1.55], [125.15, 0.85],
    [123.65, 0.25], [121.45, 0.35], [119.85, 0.15], [119.65, -0.95], [118.78, -2.65],
    [119.35, -3.55], [119.55, -4.45]
  ],
  // 14. Kepulauan Maluku (Halmahera, Seram, Buru, Ambon)
  [
    [127.45, 2.15], [128.75, 1.65], [128.75, -0.65], [127.45, -0.85]
  ],
  [
    [127.95, -2.78], [130.85, -2.85], [130.85, -3.82], [127.95, -3.78]
  ],
  [
    [125.95, -3.05], [127.25, -3.08], [127.25, -3.88], [125.95, -3.85]
  ],
  // 15. Pulau Papua (Sorong -> Manokwari -> Nabire -> Biak/Jayapura -> Merauke -> Timika -> Fakfak -> Bintuni)
  [
    [130.95, -0.82], [132.45, -0.42], [134.12, -0.85], [134.18, -2.25], [135.45, -3.25],
    [136.45, -1.95], [138.25, -1.65], [140.98, -2.55], [141.00, -9.12], [138.85, -8.35],
    [137.85, -7.45], [138.35, -5.65], [136.65, -4.85], [134.75, -4.25], [133.25, -4.05],
    [132.15, -2.95], [133.45, -2.35], [131.85, -1.65]
  ]
];

// ============================================================================
// KORIDOR DAS & CEKUNGAN RAWAN BANJIR NASIONAL (SUMATERA, JAWA, KALIMANTAN, SULAWESI, BALI-NUSA TENGGARA, MALUKU, PAPUA)
// Digunakan untuk membentuk kontur Flood Risk Heatmap yang interaktif & dinamis di seluruh Indonesia
// ============================================================================
const INDONESIA_FLOOD_CORRIDORS = [
  // --- SUMATERA ---
  { name: "DAS Krueng Aceh & Pesisir Utara Aceh", points: [[95.32, 5.55], [95.95, 5.25], [96.72, 5.18], [97.35, 5.05], [97.75, 4.45]], widthKm: 28, peakScore: 86 },
  { name: "DAS Deli, Percut, Belawan & Asahan (Sumatera Utara)", points: [[98.45, 3.85], [98.68, 3.62], [99.15, 3.35], [99.62, 2.98], [99.95, 2.55]], widthKm: 34, peakScore: 89 },
  { name: "DAS Rokan & Siak (Riau - Pekanbaru - Dumai)", points: [[100.35, 1.45], [100.95, 1.65], [101.45, 0.53], [102.15, 0.85], [102.65, 1.05]], widthKm: 45, peakScore: 88 },
  { name: "DAS Kampar & Indragiri (Riau Timur)", points: [[101.15, 0.32], [101.85, 0.15], [102.55, -0.35], [103.25, -0.28]], widthKm: 42, peakScore: 85 },
  { name: "DAS Batanghari (Jambi - Muaro Jambi - Tanjab)", points: [[101.85, -1.45], [102.65, -1.55], [103.61, -1.59], [104.15, -1.25]], widthKm: 44, peakScore: 89 },
  { name: "DAS Musi, Ogan & Komering (Palembang - Banyuasin - OKI)", points: [[103.85, -3.45], [104.45, -3.15], [104.76, -2.99], [105.15, -2.55], [105.45, -3.25]], widthKm: 52, peakScore: 92 },
  { name: "Pesisir Barat Padang, Pariaman & Pesisir Selatan", points: [[100.12, -0.62], [100.36, -0.95], [100.58, -1.35], [100.85, -1.85]], widthKm: 22, peakScore: 84 },
  { name: "DAS Bengkulu & Ketahun", points: [[101.75, -3.35], [102.26, -3.79], [102.55, -4.15]], widthKm: 24, peakScore: 80 },
  { name: "DAS Way Sekampung, Way Seputih & Tulang Bawang (Lampung)", points: [[105.05, -4.45], [105.45, -4.85], [105.68, -5.35], [105.26, -5.42]], widthKm: 36, peakScore: 86 },
  { name: "DAS Baturusa Pangkalpinang & Tanjungpandan", points: [[106.05, -2.10], [106.15, -2.15], [106.35, -2.45]], widthKm: 22, peakScore: 82 },

  // --- JAWA ---
  { name: "DAS Ciujung, Cidurian & Cidanau (Banten - Serang - Tangerang)", points: [[106.02, -6.08], [106.18, -6.12], [106.42, -6.10], [106.63, -6.15]], widthKm: 24, peakScore: 86 },
  { name: "Megapolitan Jabodetabek (Cisadane - Angke - Ciliwung - Sunter - Kali Bekasi)", points: [[106.62, -6.14], [106.78, -6.14], [106.85, -6.16], [106.95, -6.19], [107.02, -6.24], [106.83, -6.42]], widthKm: 28, peakScore: 95 },
  { name: "DAS Citarum Hilir, Ciasem & Cipunagara (Karawang - Bekasi - Subang)", points: [[107.05, -6.08], [107.28, -6.22], [107.55, -6.28], [107.82, -6.32]], widthKm: 30, peakScore: 91 },
  { name: "DAS Cimanuk & Cisanggarung (Indramayu - Majalengka - Cirebon)", points: [[108.05, -6.42], [108.32, -6.35], [108.55, -6.71], [108.78, -6.82]], widthKm: 28, peakScore: 88 },
  { name: "Cekungan Bandung - DAS Citarum Hulu (Dayeuhkolot - Baleendah - Gedebage - Rancaekek)", points: [[107.52, -6.96], [107.63, -6.98], [107.76, -6.97]], widthKm: 20, peakScore: 92 },
  { name: "DAS Citanduy & Serayu (Banjar - Pangandaran - Cilacap - Kebumen)", points: [[108.55, -7.42], [108.82, -7.58], [109.02, -7.70], [109.38, -7.62], [109.68, -7.68]], widthKm: 24, peakScore: 85 },
  { name: "Pantura Jawa Tengah Barat (Brebes - Tegal - Pemalang - Pekalongan - Batang - Kendal)", points: [[109.02, -6.87], [109.38, -6.88], [109.67, -6.89], [109.95, -6.92], [110.20, -6.93]], widthKm: 24, peakScore: 90 },
  { name: "Pantura Semarang - Demak - Kudus - Pati - Rembang (Rob & DAS Tuntang/Serang/Juwana)", points: [[110.38, -6.96], [110.62, -6.88], [110.85, -6.82], [111.05, -6.75], [111.35, -6.72]], widthKm: 28, peakScore: 93 },
  { name: "DAS Bengawan Solo (Wonogiri - Sukoharjo - Solo - Sragen - Ngawi - Bojonegoro - Lamongan - Gresik)", points: [[110.82, -7.75], [110.83, -7.56], [111.02, -7.42], [111.45, -7.38], [111.88, -7.15], [112.22, -7.08], [112.58, -7.02]], widthKm: 28, peakScore: 91 },
  { name: "DAS Progo & Opak (Yogyakarta - Bantul - Kulon Progo)", points: [[110.22, -7.88], [110.36, -7.82], [110.42, -7.92]], widthKm: 18, peakScore: 80 },
  { name: "DAS Brantas & Gerbangkertosusila (Kediri - Jombang - Mojokerto - Sidoarjo - Surabaya)", points: [[112.01, -7.81], [112.23, -7.55], [112.44, -7.47], [112.71, -7.44], [112.75, -7.26]], widthKm: 28, peakScore: 90 },
  { name: "Tapal Kuda Jawa Timur (Pasuruan - Probolinggo - Lumajang - Jember - Banyuwangi)", points: [[112.90, -7.64], [113.21, -7.75], [113.25, -8.12], [113.70, -8.17], [114.35, -8.22]], widthKm: 24, peakScore: 84 },
  { name: "DAS Sampang & Pamekasan (Madura)", points: [[113.24, -7.18], [113.48, -7.16], [113.85, -7.05]], widthKm: 18, peakScore: 83 },

  // --- BALI & NUSA TENGGARA ---
  { name: "Denpasar, Badung & Gianyar (Tukad Badung & Tukad Mati)", points: [[115.16, -8.72], [115.22, -8.66], [115.32, -8.58]], widthKm: 16, peakScore: 83 },
  { name: "Mataram & Lombok Barat (DAS Jangkok & Babak)", points: [[116.08, -8.58], [116.18, -8.62], [116.32, -8.65]], widthKm: 18, peakScore: 82 },
  { name: "Sumbawa Besar & Bima (NTB Timur)", points: [[117.42, -8.49], [118.45, -8.52], [118.72, -8.46]], widthKm: 22, peakScore: 84 },
  { name: "DAS Benanain, Kupang & Malaka (NTT)", points: [[123.58, -10.17], [124.25, -9.85], [124.88, -9.58]], widthKm: 24, peakScore: 85 },

  // --- KALIMANTAN ---
  { name: "DAS Kapuas (Pontianak - Kubu Raya - Sanggau - Sekadau - Sintang)", points: [[109.33, -0.03], [109.95, 0.12], [110.65, 0.12], [111.49, 0.07], [112.25, 0.35]], widthKm: 52, peakScore: 91 },
  { name: "DAS Sambas & Pesisir Singkawang (Kalbar Utara)", points: [[108.98, 0.91], [109.32, 1.35]], widthKm: 28, peakScore: 84 },
  { name: "DAS Kahayan, Kapuas Murung, Sampit & Katingan (Palangkaraya - Kalteng)", points: [[112.95, -2.53], [113.62, -2.35], [113.92, -2.21], [114.28, -2.98]], widthKm: 48, peakScore: 89 },
  { name: "DAS Barito, Martapura & Negara (Banjarmasin - Banjarbaru - Barito Kuala - Hulu Sungai)", points: [[114.59, -3.32], [114.85, -3.42], [115.15, -2.85], [115.28, -2.42], [114.88, -1.95]], widthKm: 46, peakScore: 93 },
  { name: "DAS Mahakam & Pesisir Balikpapan (Samarinda - Kutai Kartanegara - Balikpapan)", points: [[116.85, -1.24], [117.05, -0.85], [117.15, -0.50], [116.98, -0.42], [116.55, -0.25]], widthKm: 44, peakScore: 92 },
  { name: "DAS Kayan & Sesayap (Tanjung Selor - Tarakan - Kaltara)", points: [[117.35, 2.85], [117.58, 3.32]], widthKm: 36, peakScore: 84 },

  // --- SULAWESI ---
  { name: "DAS Jeneberang, Tallo & Maros (Makassar - Gowa - Maros - Pangkep)", points: [[119.42, -5.22], [119.44, -5.13], [119.57, -5.01], [119.62, -4.82]], widthKm: 26, peakScore: 91 },
  { name: "Cekungan Danau Tempe & DAS Walanae-Cenrana (Wajo - Soppeng - Sidrap - Bone)", points: [[119.88, -4.05], [120.03, -4.12], [120.28, -4.32]], widthKm: 32, peakScore: 90 },
  { name: "Luwu Utara / Masamba & Palopo (Teluk Bone)", points: [[120.19, -2.99], [120.35, -2.65], [120.65, -2.58]], widthKm: 28, peakScore: 88 },
  { name: "DAS Konaweha, Lasolo & Wanggu (Kendari - Konawe - Sultra)", points: [[122.15, -3.85], [122.38, -3.92], [122.52, -3.99]], widthKm: 28, peakScore: 87 },
  { name: "DAS Palu & Lariang (Palu - Sigi - Donggala)", points: [[119.85, -1.25], [119.87, -0.90], [119.82, -0.72]], widthKm: 22, peakScore: 85 },
  { name: "Cekungan Danau Limboto & Bone-Bolango (Gorontalo)", points: [[122.88, 0.62], [123.06, 0.54], [123.22, 0.55]], widthKm: 24, peakScore: 88 },
  { name: "DAS Tondano & Sawangan (Manado - Minahasa - Bitung)", points: [[124.84, 1.48], [124.92, 1.32], [125.12, 1.44]], widthKm: 22, peakScore: 87 },

  // --- MALUKU & PAPUA ---
  { name: "Teluk Ambon, Batu Merah & Passo (Maluku)", points: [[128.16, -3.70], [128.24, -3.64], [128.65, -3.32]], widthKm: 22, peakScore: 84 },
  { name: "Halmahera & Ternate Pesisir (Maluku Utara)", points: [[127.38, 0.79], [127.85, 1.15], [128.15, 0.65]], widthKm: 24, peakScore: 82 },
  { name: "Sorong Klasaman & Teluk Bintuni (Papua Barat Daya / Papua Barat)", points: [[131.25, -0.88], [131.65, -1.15], [133.52, -2.12]], widthKm: 32, peakScore: 85 },
  { name: "DAS Mamberamo & Dataran Danau Rombebai (Papua Utara)", points: [[137.85, -1.85], [138.15, -2.35], [138.65, -2.65]], widthKm: 48, peakScore: 89 },
  { name: "Cekungan Sentani & Kota Jayapura (Papua)", points: [[140.48, -2.57], [140.70, -2.54], [140.78, -2.62]], widthKm: 24, peakScore: 88 },
  { name: "Dataran Aluvial Timika & Mimika (Papua Tengah)", points: [[136.65, -4.55], [136.89, -4.55], [137.25, -4.68]], widthKm: 34, peakScore: 86 },
  { name: "DAS Digul, Bian & Dataran Rawa Merauke (Papua Selatan)", points: [[139.65, -6.85], [140.15, -7.45], [140.40, -8.49]], widthKm: 55, peakScore: 90 }
];

// ============================================================================
// GENERATOR 1.000 DATA POLIS DUMMY PORTOFOLIO ASKRINDO (TERSEBAR DI SELURUH INDONESIA)
// Revisi: Menambahkan total 1.000 polis existing (ACS) di 36 klaster kota/provinsi Indonesia
// ============================================================================
(function generate1000DummyPolicies() {
  const TARGET_TOTAL = 1000;
  if (INITIAL_POLICIES.length >= TARGET_TOTAL) return;

  const REGIONAL_CLUSTERS = [
    // DKI Jakarta (5 Kota Administrasi - Konsentrasi Tertinggi)
    { province: "DKI Jakarta", city: "Kota Adm. Jakarta Pusat", districts: ["Menteng", "Gambir", "Tanah Abang", "Cempaka Putih", "Kemayoran", "Senen", "Sawah Besar"], villages: ["Kebon Sirih", "Cideng", "Bendungan Hilir", "Cempaka Baru", "Gunung Sahari", "Kwitang", "Mangga Dua"], lat: -6.1805, lon: 106.8340, spread: 0.032, count: 88, baseFlood: 78, baseEq: 54 },
    { province: "DKI Jakarta", city: "Kota Adm. Jakarta Utara", districts: ["Penjaringan", "Tanjung Priok", "Kelapa Gading", "Pademangan", "Cilincing", "Koja"], villages: ["Pluit", "Sunter Agung", "Pegangsaan Dua", "Ancol", "Marunda", "Rawa Badak"], lat: -6.1360, lon: 106.8720, spread: 0.035, count: 85, baseFlood: 90, baseEq: 52 },
    { province: "DKI Jakarta", city: "Kota Adm. Jakarta Selatan", districts: ["Kebayoran Baru", "Setiabudi", "Pancoran", "Tebet", "Cilandak", "Mampang Prapatan"], villages: ["Senayan", "Kuningan Timur", "Kalibata", "Kampung Melayu", "Pondok Indah", "Kemang"], lat: -6.2480, lon: 106.8220, spread: 0.038, count: 76, baseFlood: 72, baseEq: 56 },
    { province: "DKI Jakarta", city: "Kota Adm. Jakarta Barat", districts: ["Kembangan", "Grogol Petamburan", "Kebon Jeruk", "Cengkareng", "Kalideres", "Palmerah"], villages: ["Puri Indah", "Tanjung Duren", "Duri Kepa", "Rawa Buaya", "Pegadungan", "Slipi"], lat: -6.1680, lon: 106.7580, spread: 0.035, count: 65, baseFlood: 84, baseEq: 53 },
    { province: "DKI Jakarta", city: "Kota Adm. Jakarta Timur", districts: ["Cakung", "Pulo Gadung", "Jatinegara", "Kramat Jati", "Matraman", "Duren Sawit"], villages: ["Rawa Terate", "Jatinegara Kaum", "Bidara Cina", "Cawang", "Utan Kayu", "Pondok Bambu"], lat: -6.2120, lon: 106.9020, spread: 0.038, count: 64, baseFlood: 82, baseEq: 54 },

    // Banten & Jawa Barat
    { province: "Banten", city: "Kota Tangerang", districts: ["Karawaci", "Cibodas", "Jatiuwung", "Batuceper", "Cipondoh"], villages: ["Lippo Karawaci", "Jatake", "Poris Plawad", "Cipondoh Makmur"], lat: -6.1850, lon: 106.6320, spread: 0.045, count: 38, baseFlood: 79, baseEq: 55 },
    { province: "Banten", city: "Kota Tangerang Selatan", districts: ["Serpong", "Pondok Aren", "Ciputat", "Pamulang"], villages: ["BSD City", "Bintaro", "Ciputat Timur", "Pamulang Barat"], lat: -6.2880, lon: 106.6850, spread: 0.038, count: 26, baseFlood: 66, baseEq: 56 },
    { province: "Banten", city: "Kota Cilegon", districts: ["Ciwandan", "Citangkil", "Pulo Merak", "Cibeber"], villages: ["Kubangsari", "Samangraya", "Tamansari", "Cibeber"], lat: -6.0180, lon: 106.0520, spread: 0.035, count: 18, baseFlood: 70, baseEq: 68 },
    { province: "Jawa Barat", city: "Kab. Bekasi", districts: ["Cikarang Barat", "Cikarang Selatan", "Cikarang Utara", "Tambun Selatan", "Cibitung"], villages: ["Jababeka", "Lippo Cikarang", "MM2100", "Tambun", "Wanasari"], lat: -6.2850, lon: 107.1350, spread: 0.055, count: 48, baseFlood: 83, baseEq: 52 },
    { province: "Jawa Barat", city: "Kab. Karawang", districts: ["Telukjambe Timur", "Ciampel", "Klari", "Karawang Barat"], villages: ["Sirnabaya", "Kutanegara", "Duren", "Tanjungpura"], lat: -6.3250, lon: 107.3050, spread: 0.050, count: 28, baseFlood: 85, baseEq: 50 },
    { province: "Jawa Barat", city: "Kab. Bogor", districts: ["Cibinong", "Cileungsi", "Gunung Putri", "Citeureup", "Sentul"], villages: ["Pakansari", "Mampir", "Tlajung Udik", "Karang Asem", "Babakan Madang"], lat: -6.4850, lon: 106.8850, spread: 0.055, count: 32, baseFlood: 68, baseEq: 64 },
    { province: "Jawa Barat", city: "Kota Bandung", districts: ["Gedebage", "Bojongloa Kidul", "Coblong", "Buahbatu", "Dayeuhkolot", "Baleendah"], villages: ["Cisaranten Kidul", "Kopo", "Dago", "Margasari", "Citeureup", "Andir"], lat: -6.9350, lon: 107.6250, spread: 0.048, count: 44, baseFlood: 84, baseEq: 74 },
    { province: "Jawa Barat", city: "Kota Cirebon", districts: ["Kejaksan", "Lemahwungkuk", "Harjamukti", "Kesambi"], villages: ["Kebonbaru", "Panjunan", "Kalijaga", "Sunyaragi"], lat: -6.7320, lon: 108.5520, spread: 0.032, count: 20, baseFlood: 81, baseEq: 52 },

    // Jawa Tengah & DI Yogyakarta
    { province: "Jawa Tengah", city: "Kota Semarang", districts: ["Genuk", "Semarang Utara", "Semarang Tengah", "Tugu", "Pedurungan", "Banyumanik"], villages: ["Kaligawe", "Tanjung Mas", "Simpang Lima", "Mangkang", "Tlogosari", "Srondol"], lat: -6.9920, lon: 110.4220, spread: 0.038, count: 40, baseFlood: 89, baseEq: 48 },
    { province: "Jawa Tengah", city: "Kota Pekalongan", districts: ["Pekalongan Utara", "Pekalongan Barat", "Pekalongan Timur"], villages: ["Panjang Wetan", "Tirto", "Noyontaan"], lat: -6.8920, lon: 109.6750, spread: 0.025, count: 16, baseFlood: 88, baseEq: 46 },
    { province: "Jawa Tengah", city: "Kota Surakarta", districts: ["Laweyan", "Banjarsari", "Jebres", "Pasar Kliwon"], villages: ["Purwosari", "Manahan", "Mojosongo", "Joyosuran"], lat: -7.5680, lon: 110.8250, spread: 0.032, count: 20, baseFlood: 82, baseEq: 58 },
    { province: "DI Yogyakarta", city: "Kota Yogyakarta", districts: ["Gondokusuman", "Umbulharjo", "Depok Sleman", "Mlati", "Kasihan Bantul"], villages: ["Terban", "Warungboto", "Caturtunggal", "Sinduadi", "Tamantirto"], lat: -7.7956, lon: 110.3695, spread: 0.038, count: 22, baseFlood: 65, baseEq: 79 },

    // Jawa Timur
    { province: "Jawa Timur", city: "Kota Surabaya", districts: ["Rungkut", "Tenggilis Mejoyo", "Gubeng", "Tegalsari", "Tandes", "Wonokromo"], villages: ["Kalirungkut (SIER)", "Panjang Jiwo", "Airlangga", "Embong Kaliasin", "Margomulyo", "Darmo"], lat: -7.2750, lon: 112.7480, spread: 0.042, count: 48, baseFlood: 82, baseEq: 49 },
    { province: "Jawa Timur", city: "Kab. Sidoarjo", districts: ["Waru", "Taman", "Sidoarjo", "Buduran", "Porong"], villages: ["Berbek Industri", "Sepanjang", "Lemahputro", "Banjarkemantren", "Juwetkenongo"], lat: -7.4350, lon: 112.7120, spread: 0.042, count: 22, baseFlood: 85, baseEq: 48 },
    { province: "Jawa Timur", city: "Kota Malang", districts: ["Lowokwaru", "Blimbing", "Klojen", "Sukun"], villages: ["Jatimulyo", "Arjosari", "Kauman", "Bandulan"], lat: -7.9666, lon: 112.6326, spread: 0.035, count: 18, baseFlood: 68, baseEq: 66 },

    // Sumatera
    { province: "Aceh", city: "Kota Banda Aceh", districts: ["Baiturrahman", "Kuta Alam", "Meuraxa", "Syiah Kuala"], villages: ["Kampung Baru", "Peunayong", "Ulee Lheue", "Darussalam"], lat: 5.5483, lon: 95.3350, spread: 0.025, count: 14, baseFlood: 78, baseEq: 84 },
    { province: "Sumatera Utara", city: "Kota Medan", districts: ["Medan Deli", "Medan Belawan", "Medan Barat", "Medan Polonia", "Medan Labuhan"], villages: ["Mabar (KIM)", "Belawan I", "Kesawan", "Polonia", "Martubung"], lat: 3.6150, lon: 98.6750, spread: 0.045, count: 32, baseFlood: 86, baseEq: 56 },
    { province: "Sumatera Barat", city: "Kota Padang", districts: ["Padang Barat", "Padang Utara", "Koto Tangah", "Lubuk Begalung"], villages: ["Purus", "Air Tawar", "Tabing", "Gates Teluk Bayur"], lat: -0.9250, lon: 100.3750, spread: 0.030, count: 16, baseFlood: 79, baseEq: 85 },
    { province: "Riau", city: "Kota Pekanbaru", districts: ["Rumbai", "Tenayan Raya", "Marpoyan Damai", "Tampan"], villages: ["Meranti Pandak", "Rejosari", "Tangkerang", "Simpang Baru"], lat: 0.5250, lon: 101.4480, spread: 0.038, count: 16, baseFlood: 84, baseEq: 38 },
    { province: "Kepulauan Riau", city: "Kota Batam", districts: ["Batam Kota", "Batu Ampar", "Sekupang", "Nongsa"], villages: ["Batamindo", "Jodoh", "Tanjung Uncang", "Kabil"], lat: 1.1150, lon: 104.0350, spread: 0.030, count: 12, baseFlood: 68, baseEq: 32 },
    { province: "Jambi", city: "Kota Jambi", districts: ["Pasar Jambi", "Telanaipura", "Jambi Timur", "Paal Merah"], villages: ["Beringin", "Telanaipura", "Talang Banjar", "Lingkar Selatan"], lat: -1.6100, lon: 103.6150, spread: 0.032, count: 10, baseFlood: 85, baseEq: 40 },
    { province: "Sumatera Selatan", city: "Kota Palembang", districts: ["Ilir Timur I", "Seberang Ulu I", "Kalidoni", "Alang-Alang Lebar", "Plaju"], villages: ["Sungai Pangeran", "7 Ulu", "Sei Selayur", "Talang Kelapa", "Plaju Ulu"], lat: -2.9760, lon: 104.7650, spread: 0.042, count: 22, baseFlood: 88, baseEq: 38 },
    { province: "Lampung", city: "Kota Bandar Lampung", districts: ["Panjang", "Teluk Betung Selatan", "Tanjung Karang Pusat", "Sukarame"], villages: ["Panjang Selatan", "Pesawahan", "Enggal", "Way Dadi"], lat: -5.4150, lon: 105.2650, spread: 0.032, count: 12, baseFlood: 80, baseEq: 64 },

    // Bali & Nusa Tenggara
    { province: "Bali", city: "Kota Denpasar", districts: ["Denpasar Selatan", "Denpasar Barat", "Kuta", "Kuta Utara"], villages: ["Sanur", "Pemecutan", "Legian", "Canggu"], lat: -8.6705, lon: 115.2150, spread: 0.032, count: 18, baseFlood: 75, baseEq: 62 },
    { province: "Nusa Tenggara Barat", city: "Kota Mataram", districts: ["Ampenan", "Mataram", "Cakranegara", "Sandubaya"], villages: ["Ampenan Tengah", "Pagesangan", "Cakranegara Barat", "Bertais"], lat: -8.5833, lon: 116.1167, spread: 0.025, count: 8, baseFlood: 76, baseEq: 70 },
    { province: "Nusa Tenggara Timur", city: "Kota Kupang", districts: ["Oebobo", "Kelapa Lima", "Alak", "Kota Raja"], villages: ["Oebobo", "Lasiana", "Tenau", "Fontein"], lat: -10.1772, lon: 123.6070, spread: 0.025, count: 6, baseFlood: 74, baseEq: 66 },

    // Kalimantan
    { province: "Kalimantan Barat", city: "Kota Pontianak", districts: ["Pontianak Selatan", "Pontianak Kota", "Pontianak Utara", "Sungai Raya"], villages: ["Benua Melayu Darat", "Sungai Bangkong", "Siantan Hulu", "Sungai Raya Dalam"], lat: -0.0263, lon: 109.3425, spread: 0.035, count: 12, baseFlood: 87, baseEq: 26 },
    { province: "Kalimantan Selatan", city: "Kota Banjarmasin", districts: ["Banjarmasin Tengah", "Banjarmasin Barat", "Banjarmasin Selatan", "Liang Anggang"], villages: ["Kertak Baru", "Telawang", "Kelayan Selatan", "Landasan Ulin"], lat: -3.3186, lon: 114.5944, spread: 0.035, count: 14, baseFlood: 90, baseEq: 30 },
    { province: "Kalimantan Timur", city: "Kota Balikpapan", districts: ["Balikpapan Barat", "Balikpapan Selatan", "Balikpapan Kota", "Samarinda Seberang"], villages: ["Kariangau", "Sepinggan", "Klandasan", "Palaran"], lat: -1.2379, lon: 116.8529, spread: 0.038, count: 16, baseFlood: 84, baseEq: 36 },

    // Sulawesi, Maluku & Papua
    { province: "Sulawesi Selatan", city: "Kota Makassar", districts: ["Manggala", "Tallo", "Panakkukang", "Tamalanrea", "Ujung Pandang"], villages: ["Antang", "Tallo", "Masale", "KIMA Bira", "Losari"], lat: -5.1477, lon: 119.4450, spread: 0.035, count: 20, baseFlood: 86, baseEq: 48 },
    { province: "Sulawesi Utara", city: "Kota Manado", districts: ["Wenang", "Malalayang", "Mapanget", "Tikala"], villages: ["Calaca", "Bahu", "Paniki Bawah", "Tikala Baru"], lat: 1.4748, lon: 124.8480, spread: 0.025, count: 8, baseFlood: 80, baseEq: 72 },
    { province: "Maluku", city: "Kota Ambon", districts: ["Sirimau", "Baguala", "Nusaniwe"], villages: ["Batu Merah", "Passo", "Waihaong"], lat: -3.6954, lon: 128.1880, spread: 0.022, count: 6, baseFlood: 76, baseEq: 78 },
    { province: "Papua", city: "Kota Jayapura", districts: ["Abepura", "Jayapura Selatan", "Heram", "Sentani"], villages: ["Kotaraja", "Entrop", "Waena", "Hinekombe"], lat: -2.5650, lon: 140.6650, spread: 0.030, count: 8, baseFlood: 82, baseEq: 74 }
  ];

  const COMPANY_PREFIXES = [
    "PT Nusantara", "PT Graha", "PT Cipta", "PT Mitra", "PT Karya",
    "PT Prima", "PT Surya", "PT Buana", "PT Mega", "PT Indo",
    "PT Sentosa", "PT Mandiri", "PT Global", "PT Duta", "PT Pelita",
    "PT Bahari", "PT Agung", "PT Mulia", "PT Panca", "PT Tirta"
  ];
  const COMPANY_SECTORS = [
    "Logistik & Pergudangan", "Manufaktur Terpadu", "Properti Komersial", "Industri Pangan",
    "Distribusi Nasional", "Energi & Utilitas", "Tekstil & Garmen", "Otomotif Nusantara",
    "Farmasi & Alkes", "Karya Konstruksi", "Retail & Plaza", "Cold Storage",
    "Kimia & Kemasan", "Elektronik Presisi", "Agroindustri", "Perhotelan & Resort"
  ];
  const PRODUCT_TYPES = [
    "Property All Risks (PAR)",
    "Industrial All Risks (IAR)",
    "Asuransi Kebakaran Standar (PSAKI)",
    "Machinery Breakdown (MB)"
  ];

  let seq = INITIAL_POLICIES.length + 1;

  for (let cIdx = 0; cIdx < REGIONAL_CLUSTERS.length; cIdx++) {
    const cluster = REGIONAL_CLUSTERS[cIdx];
    // Adjust final cluster count if needed so total hits exactly TARGET_TOTAL (1000)
    const isLastCluster = cIdx === REGIONAL_CLUSTERS.length - 1;
    const countToCreate = isLastCluster ? Math.max(0, TARGET_TOTAL - INITIAL_POLICIES.length) : cluster.count;

    for (let i = 0; i < countToCreate; i++) {
      if (INITIAL_POLICIES.length >= TARGET_TOTAL) break;

      // Deterministic pseudo-random generator based on seq
      const h1 = Math.sin(seq * 12.9898 + cIdx * 78.233) * 43758.5453;
      const r1 = h1 - Math.floor(h1);
      const h2 = Math.cos(seq * 93.9898 + i * 47.113) * 28461.3519;
      const r2 = h2 - Math.floor(h2);
      const h3 = Math.sin(seq * 41.1234 + i * 19.876) * 19283.7465;
      const r3 = h3 - Math.floor(h3);

      // Keep points safely inside inland cluster bounds using polar distribution
      const radius = Math.sqrt(r1) * cluster.spread;
      const angle = r2 * Math.PI * 2;
      const lat = Number((cluster.lat + Math.sin(angle) * radius * 0.75).toFixed(6));
      const lon = Number((cluster.lon + Math.cos(angle) * radius).toFixed(6));

      const distName = cluster.districts[seq % cluster.districts.length];
      const villName = cluster.villages[(seq + i) % cluster.villages.length];
      const compPrefix = COMPANY_PREFIXES[seq % COMPANY_PREFIXES.length];
      const compSector = COMPANY_SECTORS[(seq * 3 + i) % COMPANY_SECTORS.length];
      const insuredName = `${compPrefix} ${compSector} ${villName}`;

      const tsiBillion = 5 + Math.round(r3 * 145); // Rp 5 Miliar s/d Rp 150 Miliar
      const tsi = tsiBillion * 1000000000;

      const floodScore = Math.max(24, Math.min(96, Math.round(cluster.baseFlood + (r1 - 0.45) * 26)));
      const eqScore = Math.max(22, Math.min(92, Math.round(cluster.baseEq + (r2 - 0.5) * 24)));
      const fireScore = Math.max(28, Math.min(82, Math.round(44 + (r3 - 0.4) * 32)));
      const weatherScore = Math.max(30, Math.min(84, Math.round(floodScore * 0.72 + 12)));
      const liqScore = Math.max(20, Math.min(85, Math.round((floodScore * 0.5 + eqScore * 0.4) - 8)));
      const landslideScore = Math.max(15, Math.min(78, Math.round(28 + (1 - r1) * 25)));

      const classifyLabel = (sc) => sc >= 80 ? "Very High" : sc >= 60 ? "High" : sc >= 40 ? "Medium" : "Low";
      const provCode = cluster.province.replace(/[^A-Z]/g, "").slice(0, 3) || "INA";
      const policyNo = `POL-ACS-2026-${String(seq).padStart(6, "0")}`;
      const objectCode = `OBJ-${provCode}-${String(seq).padStart(4, "0")}`;
      const rbcCode = `RBC-${provCode}-${String((seq % 900) + 100)}`;

      const TOC_TYPES = ["0103 PAR", "0104 IAR", "0101 PSAKI", "0102 PSAGBI"];
      const TOC_FULL_NAMES = {
        "0103 PAR": "0103 PAR — Properti All Risk (PAR)",
        "0104 IAR": "0104 IAR — Industrial All Risk (IAR)",
        "0101 PSAKI": "0101 PSAKI — Polis Standar Asuransi Kebakaran Indonesia",
        "0102 PSAGBI": "0102 PSAGBI — Polis Standar Asuransi Gempa Bumi Indonesia"
      };
      const toc = TOC_TYPES[seq % TOC_TYPES.length];
      const durYears = (seq % 5 === 0) ? 5 : (seq % 3 === 0) ? 3 : (seq % 2 === 0) ? 2 : 1;
      const startYear = seq % 4 === 0 ? 2025 : 2026;
      const endYear = startYear + durYears;
      const coverageDuration = `${durYears} Tahun (17 Oktober ${startYear} – 17 Oktober ${endYear})`;

      const sampleOccList = [
        "2971", "2972", "2976", "29311", "29313", "29371", "29383", "29412",
        "2945", "2951", "2953", "29291", "2252", "23002", "2742", "28111"
      ];
      const occCode = sampleOccList[seq % sampleOccList.length];
      const occMeta = getSeojkOccupation(occCode);

      INITIAL_POLICIES.push({
        id: `POL-ASK-2026-${String(seq).padStart(4, "0")}`,
        policyNumber: policyNo,
        objectCode: objectCode,
        riskBlockCode: rbcCode,
        toc: toc,
        typeOfClass: toc,
        coverageDuration: coverageDuration,
        insuredName: insuredName,
        lob: toc,
        productType: TOC_FULL_NAMES[toc] || PRODUCT_TYPES[seq % PRODUCT_TYPES.length],
        underwriteYear: startYear,
        insuredType: "Existing ACS Portfolio",
        occupationCode: occCode,
        occupationName: `${occMeta.nameId} (${occMeta.name})`,
        constructionClass: "Kelas 1 (Konstruksi Tahan Api)",
        province: cluster.province,
        city: cluster.city,
        district: distName,
        village: villName,
        postalCode: String(10110 + ((seq * 37) % 89000)),
        address: `Jl. Raya ${villName} No. ${(seq % 180) + 1}, Kec. ${distName}, ${cluster.city}, ${cluster.province}`,
        lat: lat,
        lon: lon,
        lng: lon,
        tsi: tsi,
        sumInsured: tsi,
        siBreakdown: {
          building: Math.round(tsi * 0.55),
          machinery: Math.round(tsi * 0.22),
          stock: Math.round(tsi * 0.13),
          others: Math.round(tsi * 0.05),
          bi: Math.round(tsi * 0.05)
        },
        elevationMdpl: Math.max(2, Math.round(45 - floodScore * 0.42)),
        slopeDeg: Number((1.2 + r2 * 4.5).toFixed(1)),
        soilType: floodScore >= 75 ? "SE - Tanah Lunak Aluvial" : "SD - Tanah Sedang",
        landCoverType: "Kawasan Komersial & Industri",
        nearestFireStation: {
          name: `Pos Damkar Sektor ${distName}`,
          distanceKm: Number((1.1 + r1 * 3.8).toFixed(1)),
          durationMins: Math.round(4 + r1 * 11),
          lat: Number((lat + 0.008).toFixed(6)),
          lon: Number((lon + 0.008).toFixed(6))
        },
        nearbyBuildings20m: Math.round(8 + r3 * 28),
        nearbyGasStations: [
          { name: `SPBU Pertamina ${villName}`, distanceMeters: Math.round(280 + r2 * 650) }
        ],
        perilScores: {
          flood: { score: floodScore, status: classifyLabel(floodScore), source: "INARISK BNPB + Topografi DAS", updated: "2026-10-01" },
          earthquake: { score: eqScore, status: classifyLabel(eqScore), source: "PuSGeN / BMKG", updated: "2026-10-01" },
          landslide: { score: landslideScore, status: classifyLabel(landslideScore), source: "PVMBG / DEM", updated: "2026-09-15" },
          wildfire: { score: fireScore, status: classifyLabel(fireScore), source: "Kepadatan Bangunan & Damkar", updated: "2026-09-15" },
          extremeWeather: { score: weatherScore, status: classifyLabel(weatherScore), source: "BMKG / Open-Meteo", updated: "Live / Simulasi" },
          drought: { score: 28, status: "Low", source: "INARISK BNPB", updated: "2026-08-01" },
          liquefaction: { score: liqScore, status: classifyLabel(liqScore), source: "Atlas Likuefaksi ESDM", updated: "2026-07-01" },
          tsunami: { score: 15, status: "None", source: "Inland Zone", updated: "2026-09-01" },
          volcano: { score: 18, status: "None", source: "MAGMA ESDM", updated: "2026-10-01" }
        },
        claimHistory: [],
        assessmentHistory: [
          {
            date: "2026-09-20",
            assessor: "Sistem ACS -> Sinkronisasi ASGARD",
            grade: `${classifyLabel(floodScore)} (Flood ${floodScore}/100)`,
            completionPct: 100,
            notes: `Polis existing nasabah Askrindo (ACS) di wilayah ${villName}, ${cluster.city}.`
          }
        ],
        isDummy: true
      });

      seq++;
    }
  }
})();

INITIAL_POLICIES.forEach(p => {
  p.policyNumber = p.policyNumber || p.id;
  p.lon = typeof p.lon === "number" ? p.lon : p.lng;
  p.lng = typeof p.lng === "number" ? p.lng : p.lon;
  p.tsi = typeof p.tsi === "number" ? p.tsi : (p.sumInsured || 0);
  p.sumInsured = p.tsi;
  p.currency = p.currency || "IDR";
  p.elevationMdpl = typeof p.elevationMdpl === "number" ? p.elevationMdpl : (typeof p.elevation === "number" ? p.elevation : null);
  p.slopeDeg = typeof p.slopeDeg === "number" ? p.slopeDeg : (p.slopeAngleDeg ?? 2.0);
  p.landCoverType = p.landCoverType || p.landCover || "Urban / Commercial";
  p.occupationName = p.occupationName || p.propertyCategory || "Commercial Property";

  // Type of Class (TOC) normalization: PAR, IAR, PSAKI, PSAGBI
  if (!p.toc) {
    const rawLob = (p.lineOfBusiness || p.lob || '').toUpperCase();
    if (['PAR', 'IAR', 'PSAKI', 'PSAGBI'].includes(rawLob)) {
      p.toc = rawLob;
    } else if (p.productType && p.productType.includes('IAR')) {
      p.toc = 'IAR';
    } else if (p.productType && (p.productType.includes('Kebakaran') || p.productType.includes('PSAKI'))) {
      p.toc = 'PSAKI';
    } else if (p.productType && (p.productType.includes('Gempa') || p.productType.includes('PSAGBI'))) {
      p.toc = 'PSAGBI';
    } else {
      p.toc = 'PAR';
    }
  }
  p.typeOfClass = p.toc;

  // Durasi Pertanggungan (Coverage Duration)
  if (!p.coverageDuration) {
    const startYear = p.underwriteYear || 2026;
    const durYears = 5;
    const endYear = startYear + durYears;
    p.coverageDuration = `${durYears} Tahun (17 Oktober ${startYear} – 17 Oktober ${endYear})`;
  }

  // Clean up "(DUMMY)" suffix from display name while keeping governance badge in UI
  if (p.insuredName) {
    p.insuredName = p.insuredName.replace(/\s*\(DUMMY\)/gi, "");
  }

  if (p.nearestFireStation) {
    p.nearestFireStation.lon = p.nearestFireStation.lon ?? p.nearestFireStation.lng;
    p.nearestFireStation.durationMins = p.nearestFireStation.durationMins ?? (parseInt(p.nearestFireStation.estArrivalText || "7", 10) || 7);
  }

  if (Array.isArray(p.nearbyGasStations)) {
    p.nearbyGasStations.forEach(g => {
      g.distanceMeters = g.distanceMeters ?? g.distM ?? 500;
    });
  }

  if (p.perilScores) {
    if (p.perilScores.wildfire && !p.perilScores.fire) {
      p.perilScores.fire = { ...p.perilScores.wildfire };
    }
    if (p.perilScores.extremeWeather && !p.perilScores.extreme_weather) {
      p.perilScores.extreme_weather = { ...p.perilScores.extremeWeather };
    }
    Object.keys(p.perilScores).forEach(k => {
      const item = p.perilScores[k];
      if (item) {
        item.originalStatus = item.status;
        if (item.status !== "NO_DATA" && item.score !== null && typeof item.score !== "undefined") {
          item.status = "OK";
        } else {
          item.status = "NO_DATA";
        }
      }
    });
  }
});

ACTIVE_VOLCANOES.forEach(v => {
  v.lon = typeof v.lon === "number" ? v.lon : v.lng;
  v.status = v.status || v.statusLevel || "Level II (Waspada)";
  v.pvmbgNote = v.pvmbgNote || v.threats || v.recommendationText || "Pantauan KRB Gunung Api Aktif";
  v.krb3RadiusKm = v.krb3RadiusKm || (v.krbZones && v.krbZones.krb3Km) || 5.0;
  v.krb2RadiusKm = v.krb2RadiusKm || (v.krbZones && v.krbZones.krb2Km) || 7.0;
  v.krb1RadiusKm = v.krb1RadiusKm || (v.krbZones && v.krbZones.krb1Km) || 10.0;
});

FLOOD_HAZARD_ZONES.forEach(z => {
  z.lon = typeof z.lon === "number" ? z.lon : z.lng;
  z.radiusMeters = z.radiusMeters || ((z.dangerRadiusKm || 4.0) * 1000);
  z.riskScore = z.riskScore || (z.categoryType === "rob" || z.categoryType === "bandang" ? 88 : 78);
  z.note = z.note || z.threat || z.type || "Zona Bahaya Banjir";
});

LANDSLIDE_HAZARD_ZONES.forEach(z => {
  z.lon = typeof z.lon === "number" ? z.lon : z.lng;
  z.radiusMeters = z.radiusMeters || ((z.dangerRadiusKm || 3.5) * 1000);
  z.riskScore = z.riskScore || (z.risk === "Sangat Tinggi" ? 86 : 74);
  z.note = z.note || z.trigger || "Zona Kerentanan Gerakan Tanah";
});

HISTORICAL_DISASTERS_SAMPLE.forEach(h => {
  h.peril = h.peril || h.type || "Flood";
  h.province = h.province || h.region || "DKI Jakarta";
  h.title = h.title || `${h.peril} Event (${h.distanceNote || "Lokal"})`;
  h.impactNote = h.impactNote || `${h.casualties || "0 Casualties"} • ${h.lossNote || "-"}`;
});

// Normalisasi TROPICAL_CYCLONE_SIMULATION menjadi Array
const CYCLONE_ARRAY_NORMALIZED = Array.isArray(TROPICAL_CYCLONE_SIMULATION)
  ? TROPICAL_CYCLONE_SIMULATION
  : [
      {
        id: "TC-92W",
        name: TROPICAL_CYCLONE_SIMULATION.name || "Siklon Tropis Cempaka / 92W (Simulasi)",
        category: "Severe Tropical Storm (Simulasi Historis)",
        advisoryNote: TROPICAL_CYCLONE_SIMULATION.note || "Ekor siklon memicu hujan ekstrem dan gelombang tinggi di pesisir selatan Jawa.",
        trackPoints: [
          { lat: -12.1, lon: 110.4, time: "23 Sep 19:00 WIB", windKmh: 65, pressureHpa: 1005 },
          { lat: -11.6, lon: 109.8, time: "24 Sep 07:00 WIB", windKmh: 75, pressureHpa: 1003 },
          { lat: -11.2, lon: 109.1, time: "24 Sep 19:00 WIB", windKmh: 85, pressureHpa: 1000 },
          { lat: -10.8, lon: 108.5, time: "25 Sep 07:00 WIB", windKmh: 95, pressureHpa: 998 }
        ]
      }
    ];

// Tambahkan alias kunci Provinsi untuk PROVINCE_BOOKMARKS
Object.assign(PROVINCE_BOOKMARKS, {
  "ALL": { lat: -2.5489, lon: 118.0149, zoom: 5 },
  "DKI Jakarta": { lat: -6.1754, lon: 106.8272, zoom: 12 },
  "Jawa Barat": { lat: -6.9175, lon: 107.6191, zoom: 9 },
  "Jawa Tengah": { lat: -7.1510, lon: 110.1403, zoom: 9 },
  "DI Yogyakarta": { lat: -7.7956, lon: 110.3695, zoom: 11 },
  "Jawa Timur": { lat: -7.5361, lon: 112.2384, zoom: 9 },
  "Banten": { lat: -6.4058, lon: 106.0640, zoom: 9 },
  "Bali": { lat: -8.4095, lon: 115.1889, zoom: 10 },
  "Nusa Tenggara Barat": { lat: -8.5833, lon: 116.1167, zoom: 9 },
  "Nusa Tenggara Timur": { lat: -10.1772, lon: 123.6070, zoom: 9 },
  "Sumatera Barat": { lat: -0.7399, lon: 100.8000, zoom: 8 },
  "Sumatera Utara": { lat: 2.8154, lon: 99.1451, zoom: 8 },
  "Sumatera Selatan": { lat: -2.9760, lon: 104.7650, zoom: 8 },
  "Riau": { lat: 0.5250, lon: 101.4480, zoom: 8 },
  "Kepulauan Riau": { lat: 1.0828, lon: 104.0305, zoom: 9 },
  "Jambi": { lat: -1.6100, lon: 103.6150, zoom: 8 },
  "Lampung": { lat: -5.1150, lon: 105.2650, zoom: 8 },
  "Aceh": { lat: 4.6951, lon: 96.7494, zoom: 8 },
  "Kalimantan Barat": { lat: -0.0263, lon: 109.3425, zoom: 8 },
  "Kalimantan Selatan": { lat: -3.3186, lon: 114.5944, zoom: 8 },
  "Kalimantan Timur": { lat: -0.5021, lon: 117.1536, zoom: 8 },
  "Sulawesi Selatan": { lat: -5.1477, lon: 119.4327, zoom: 9 },
  "Sulawesi Utara": { lat: 1.4748, lon: 124.8421, zoom: 9 },
  "Maluku": { lat: -3.6954, lon: 128.1814, zoom: 9 },
  "Papua": { lat: -2.5650, lon: 140.6650, zoom: 8 }
});

// Kamus Koordinat Cepat Kota/Kabupaten/Kecamatan/Kelurahan (Untuk Auto-Focus Peta Saat Filter Diisi Sebagian)
const INDONESIA_AREA_COORDS = [
  // DKI Jakarta - Kota Administrasi
  { keywords: ["jakarta pusat", "jakpus", "kota adm. jakarta pusat"], lat: -6.1805, lon: 106.8284, zoom: 13, label: "Kota Adm. Jakarta Pusat, DKI Jakarta" },
  { keywords: ["jakarta utara", "jakut", "kota adm. jakarta utara"], lat: -6.1384, lon: 106.8639, zoom: 13, label: "Kota Adm. Jakarta Utara, DKI Jakarta" },
  { keywords: ["jakarta barat", "jakbar", "kota adm. jakarta barat"], lat: -6.1674, lon: 106.7637, zoom: 13, label: "Kota Adm. Jakarta Barat, DKI Jakarta" },
  { keywords: ["jakarta selatan", "jaksel", "kota adm. jakarta selatan"], lat: -6.2615, lon: 106.8106, zoom: 13, label: "Kota Adm. Jakarta Selatan, DKI Jakarta" },
  { keywords: ["jakarta timur", "jaktim", "kota adm. jakarta timur"], lat: -6.2250, lon: 106.9004, zoom: 13, label: "Kota Adm. Jakarta Timur, DKI Jakarta" },
  { keywords: ["kepulauan seribu", "pulau seribu"], lat: -5.7985, lon: 106.5614, zoom: 11, label: "Kab. Adm. Kepulauan Seribu, DKI Jakarta" },

  // Kecamatan & Kelurahan Utama DKI Jakarta
  { keywords: ["menteng", "kebon sirih", "cikini", "gondangdia"], lat: -6.1895, lon: 106.8325, zoom: 15, label: "Kec. Menteng / Kebon Sirih, Jakarta Pusat" },
  { keywords: ["gambir", "monas", "cideng", "petojo"], lat: -6.1754, lon: 106.8272, zoom: 15, label: "Kec. Gambir, Jakarta Pusat" },
  { keywords: ["tanah abang", "bendungan hilir", "benhil", "kebon melati", "sudirman", "thamrin"], lat: -6.1975, lon: 106.8145, zoom: 15, label: "Kec. Tanah Abang / Sudirman-Thamrin, Jakarta Pusat" },
  { keywords: ["cempaka putih", "rawasari"], lat: -6.1745, lon: 106.8710, zoom: 15, label: "Kec. Cempaka Putih, Jakarta Pusat" },
  { keywords: ["kemayoran", "gunung sahari", "serdang"], lat: -6.1560, lon: 106.8520, zoom: 15, label: "Kec. Kemayoran, Jakarta Pusat" },
  { keywords: ["senen", "kwitang", "kramat", "salemba"], lat: -6.1840, lon: 106.8460, zoom: 15, label: "Kec. Senen, Jakarta Pusat" },
  { keywords: ["sawah besar", "mangga dua", "pasar baru", "kartini"], lat: -6.1520, lon: 106.8310, zoom: 15, label: "Kec. Sawah Besar, Jakarta Pusat" },
  { keywords: ["penjaringan", "pluit", "muara baru", "muara karang", "pik", "pantai indah kapuk", "kapuk muara"], lat: -6.1256, lon: 106.7902, zoom: 14, label: "Kec. Penjaringan / Pluit, Jakarta Utara" },
  { keywords: ["tanjung priok", "sunter", "sunter agung", "kebon bawang"], lat: -6.1320, lon: 106.8715, zoom: 14, label: "Kec. Tanjung Priok / Sunter, Jakarta Utara" },
  { keywords: ["kelapa gading", "pegangsaan dua"], lat: -6.1574, lon: 106.9080, zoom: 14, label: "Kec. Kelapa Gading, Jakarta Utara" },
  { keywords: ["pademangan", "ancol"], lat: -6.1290, lon: 106.8380, zoom: 14, label: "Kec. Pademangan / Ancol, Jakarta Utara" },
  { keywords: ["cilincing", "marunda", "koja"], lat: -6.1150, lon: 106.9350, zoom: 14, label: "Kec. Cilincing / Marunda, Jakarta Utara" },
  { keywords: ["setiabudi", "kuningan", "karet", "gatot subroto", "mega kuningan"], lat: -6.2245, lon: 106.8295, zoom: 15, label: "Kec. Setiabudi / Kuningan, Jakarta Selatan" },
  { keywords: ["kebayoran baru", "senayan", "scbd", "melawai", "blok m"], lat: -6.2385, lon: 106.8020, zoom: 15, label: "Kec. Kebayoran Baru / SCBD, Jakarta Selatan" },
  { keywords: ["pancoran", "kalibata", "mt haryono", "duren tiga"], lat: -6.2442, lon: 106.8475, zoom: 15, label: "Kec. Pancoran, Jakarta Selatan" },
  { keywords: ["tebet", "kampung melayu", "bukit duri", "manggarai"], lat: -6.2260, lon: 106.8550, zoom: 15, label: "Kec. Tebet / Manggarai, Jakarta Selatan" },
  { keywords: ["cilandak", "pondok indah", "tb simatupang", "kemang", "mampang"], lat: -6.2845, lon: 106.7995, zoom: 14, label: "Kec. Cilandak / Kemang, Jakarta Selatan" },
  { keywords: ["cakung", "pulogadung", "pulo gadung", "rawaterate", "kiep"], lat: -6.1882, lon: 106.9245, zoom: 14, label: "Kawasan Industri Pulogadung / Cakung, Jakarta Timur" },
  { keywords: ["jatinegara", "bidara cina", "cawang", "kramat jati"], lat: -6.2350, lon: 106.8680, zoom: 14, label: "Kec. Jatinegara / Cawang, Jakarta Timur" },
  { keywords: ["kembangan", "puri indah", "kebon jeruk", "meruya"], lat: -6.1885, lon: 106.7380, zoom: 14, label: "Kec. Kembangan / Kebon Jeruk, Jakarta Barat" },
  { keywords: ["grogol", "petamburan", "tomang", "tanjung duren", "palmerah"], lat: -6.1710, lon: 106.7890, zoom: 14, label: "Kec. Grogol Petamburan, Jakarta Barat" },
  { keywords: ["cengkareng", "kalideres", "rawa buaya"], lat: -6.1480, lon: 106.7250, zoom: 14, label: "Kec. Cengkareng / Kalideres, Jakarta Barat" },

  // Kota Besar Lainnya di Indonesia
  { keywords: ["bandung", "gedebage", "dayeuhkolot", "baleendah", "lembang"], lat: -6.9175, lon: 107.6191, zoom: 12, label: "Kota/Kab. Bandung, Jawa Barat" },
  { keywords: ["bogor", "cileungsi", "cibinong", "puncak", "sentul"], lat: -6.5971, lon: 106.8060, zoom: 12, label: "Kota/Kab. Bogor, Jawa Barat" },
  { keywords: ["bekasi", "cikarang", "jababeka", "karawang"], lat: -6.2845, lon: 107.1200, zoom: 12, label: "Bekasi / Cikarang, Jawa Barat" },
  { keywords: ["tangerang", "bsd", "serpong", "cikupa", "cilegon", "serang"], lat: -6.1783, lon: 106.6319, zoom: 12, label: "Tangerang Raya, Banten" },
  { keywords: ["semarang", "kaligawe", "genuk", "tanjung emas", "simpang lima"], lat: -6.9667, lon: 110.4167, zoom: 13, label: "Kota Semarang, Jawa Tengah" },
  { keywords: ["yogyakarta", "jogja", "malioboro", "sleman", "bantul"], lat: -7.7956, lon: 110.3695, zoom: 13, label: "Kota Yogyakarta, DI Yogyakarta" },
  { keywords: ["surabaya", "rungkut", "sier", "tanjung perak", "gresik", "sidoarjo"], lat: -7.2575, lon: 112.7521, zoom: 12, label: "Kota Surabaya, Jawa Timur" },
  { keywords: ["denpasar", "sanur", "kuta", "badung", "bali"], lat: -8.6705, lon: 115.2126, zoom: 12, label: "Kota Denpasar / Badung, Bali" },
  { keywords: ["medan", "belawan", "mabar", "medan deli", "binjai"], lat: 3.5952, lon: 98.6722, zoom: 12, label: "Kota Medan, Sumatera Utara" },
  { keywords: ["padang", "lembah anai", "bukittinggi", "agam"], lat: -0.9471, lon: 100.4172, zoom: 12, label: "Kota Padang, Sumatera Barat" },
  { keywords: ["banda aceh", "meuraxa", "ulee lheue", "aceh besar"], lat: 5.5483, lon: 95.3238, zoom: 13, label: "Kota Banda Aceh, Aceh" },
  { keywords: ["balikpapan", "kariangau", "samarinda", "ikn"], lat: -1.2379, lon: 116.8529, zoom: 12, label: "Kota Balikpapan, Kalimantan Timur" },
  { keywords: ["makassar", "antang", "manggala", "tallo"], lat: -5.1477, lon: 119.4327, zoom: 12, label: "Kota Makassar, Sulawesi Selatan" }
];
