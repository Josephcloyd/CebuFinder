export const DISCOVERY_CITY_BARANGAYS = {
  'Cebu City': [
    'Adlaon', 'Agsungot', 'Apas', 'Babag', 'Basak Pardo', 'Bacayan', 'Banilad',
    'Basak San Nicolas', 'Binaliw', 'Bonbon', 'Budla-an', 'Buhisan', 'Bulacao',
    'Buot-Taup Pardo', 'Busay', 'Calamba', 'Cambinocot', 'Capitol Site', 'Carreta',
    'Central', 'Cogon Ramos', 'Cogon Pardo', 'Day-as', 'Duljo', 'Ermita',
    'Guadalupe', 'Guba', 'Hippodromo', 'Inayawan', 'Kalubihan', 'Kalunasan',
    'Kamagayan', 'Camputhaw', 'Kasambagan', 'Kinasang-an Pardo', 'Labangon',
    'Lahug', 'Lorega', 'Lusaran', 'Luz', 'Mabini', 'Mabolo', 'Malubog',
    'Mambaling', 'Pahina Central', 'Pahina San Nicolas', 'Pamutan', 'Pardo',
    'Pari-an', 'Paril', 'Pasil', 'Pit-os', 'Pulangbato', 'Pung-ol-Sibugay',
    'Punta Princesa', 'Quiot Pardo', 'Sambag I', 'Sambag II', 'San Antonio',
    'San Jose', 'San Nicolas Central', 'San Roque', 'Santa Cruz', 'Sawang Calero',
    'Sinsin', 'Sirao', 'Suba Pob.', 'Sudlon I', 'Sapangdaku', 'T. Padilla',
    'Tabunan', 'Tagbao', 'Talamban', 'Taptap', 'Tejero', 'Tinago', 'Tisa',
    'To-ong Pardo', 'Zapatera', 'Sudlon II',
  ],
  'Mandaue City': [
    'Alang-alang', 'Bakilid', 'Banilad', 'Basak', 'Cabancalan', 'Cambaro',
    'Canduman', 'Casili', 'Casuntingan', 'Centro', 'Cubacub', 'Guizo',
    'Ibabao-Estancia', 'Jagobiao', 'Labogon', 'Looc', 'Maguikay', 'Mantuyong',
    'Opao', 'Pakna-an', 'Pagsabungan', 'Subangdaku', 'Tabok', 'Tawason',
    'Tingub', 'Tipolo', 'Umapad',
  ],
  'Lapu-Lapu City': [
    'Agus', 'Babag', 'Bankal', 'Baring', 'Basak', 'Buaya', 'Calawisan',
    'Canjulao', 'Caw-oy', 'Cawhagan', 'Caubian', 'Gun-ob', 'Ibo', 'Looc',
    'Mactan', 'Maribago', 'Marigondon', 'Pajac', 'Pajo', 'Pangan-an',
    'Poblacion', 'Punta Enga', 'Pusok', 'Sabang', 'Santa Rosa', 'Subabasbas',
    'Talima', 'Tingo', 'Tungasan', 'San Vicente',
  ],
  'Talisay City': [
    'Bulacao', 'Cadulawan', 'Cansojong', 'Dumlog', 'Jaclupan', 'Lagtang',
    'Lawaan I', 'Linao', 'Maghaway', 'Manipis', 'Mohon', 'Poblacion', 'Pooc',
    'San Isidro', 'San Roque', 'Tabunoc', 'Tangke', 'Tapul', 'Biasong',
    'Camp IV', 'Lawaan II', 'Lawaan III',
  ],
} as const

export type DiscoveryCity = keyof typeof DISCOVERY_CITY_BARANGAYS

export const DISCOVERY_CITIES = Object.keys(DISCOVERY_CITY_BARANGAYS) as DiscoveryCity[]

