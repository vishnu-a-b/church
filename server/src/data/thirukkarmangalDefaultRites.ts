// Transcribed verbatim from docs/NEW_FEATURES_2026.html, Section 4 (Thirukkarmangal — Master Rate List).
// Only "ആഘോഷമായ കുർബ്ബാന — Solemn/Festive Mass" (code: solemn_mass) has a confirmed recipient split
// (Section 5): Celebrant 55%, Church Minister 15%, Choir 10%, Altar Servers 10%, Church 10%.
// All other rites ship with an empty split — church management has not yet confirmed those.

export type ThirukkarmangalCategory =
  | 'holy_masses'
  | 'feast_day_rites'
  | 'blessings'
  | 'deceased_rites'
  | 'other_rites';

export interface DefaultRiteFixture {
  category: ThirukkarmangalCategory;
  code: string;
  nameMalayalam: string;
  nameEnglish: string;
  amount: number;
  sortOrder: number;
  split?: Array<{ recipientLabel: string; percent: number }>;
}

export const thirukkarmangalDefaultRites: DefaultRiteFixture[] = [
  // I. കുർബ്ബാനകൾ — Holy Masses (Kurubana)
  { category: 'holy_masses', code: 'ordinary_mass', nameMalayalam: 'സാധാരണ കുർബ്ബാന', nameEnglish: 'Ordinary Mass', amount: 150.0, sortOrder: 1 },
  {
    category: 'holy_masses',
    code: 'solemn_mass',
    nameMalayalam: 'ആഘോഷമായ കുർബ്ബാന',
    nameEnglish: 'Solemn/Festive Mass',
    amount: 300.0,
    sortOrder: 2,
    split: [
      { recipientLabel: 'കാർമ്മികൻ (Celebrant)', percent: 55 },
      { recipientLabel: 'ദൈവാലയ ശുശ്രൂഷി (Church Minister)', percent: 15 },
      { recipientLabel: 'ഗായകസംഘം (Choir)', percent: 10 },
      { recipientLabel: 'അൾത്താരസംഘം (Altar Servers)', percent: 10 },
      { recipientLabel: 'പള്ളി (Church)', percent: 10 },
    ],
  },
  { category: 'holy_masses', code: 'solemn_mass_off_hours', nameMalayalam: 'ആ. കുർബ്ബാന (സമയവ്യത്യാസമനുസരിച്ച്)', nameEnglish: 'Solemn Mass, off-hours', amount: 700.0, sortOrder: 3 },
  { category: 'holy_masses', code: 'solemn_mass_concelebrants', nameMalayalam: 'ആ. കുർബ്ബാന (സഹകാർമ്മികരോട് കൂടി)', nameEnglish: 'Solemn Mass, with concelebrants', amount: 1500.0, sortOrder: 4 },
  { category: 'holy_masses', code: 'raza', nameMalayalam: 'റാസ', nameEnglish: 'Raza (Solemn High Mass)', amount: 2500.0, sortOrder: 5 },
  { category: 'holy_masses', code: 'gregorian_mass', nameMalayalam: 'ഗ്രിഗോറിയൻ കുർബ്ബാന', nameEnglish: 'Gregorian Mass', amount: 9000.0, sortOrder: 6 },

  // II. തിരുനാൾ കർമ്മങ്ങൾ — Feast Day Rites
  { category: 'feast_day_rites', code: 'flag_hoisting', nameMalayalam: 'കൊടിയേറ്റം', nameEnglish: 'Flag Hoisting', amount: 300.0, sortOrder: 1 },
  { category: 'feast_day_rites', code: 'litany_church', nameMalayalam: 'ലദീഞ്ഞ് (പള്ളി / പള്ളിമുറ്റത്തെ കപ്പേള)', nameEnglish: 'Litany, church/churchyard chapel', amount: 150.0, sortOrder: 2 },
  { category: 'feast_day_rites', code: 'litany_outside', nameMalayalam: 'ലദീഞ്ഞ് (പള്ളിമുറ്റത്തിന് പുറത്തുള്ള കപ്പേള)', nameEnglish: 'Litany, chapel outside premises', amount: 300.0, sortOrder: 3 },
  { category: 'feast_day_rites', code: 'feast_day_sermon', nameMalayalam: 'തിരുനാൾ പ്രസംഗം', nameEnglish: 'Feast Day Sermon', amount: 500.0, sortOrder: 4 },
  { category: 'feast_day_rites', code: 'procession_half_hour', nameMalayalam: 'പ്രദക്ഷിണം (അരമണിക്കൂർ)', nameEnglish: 'Procession (half hour)', amount: 250.0, sortOrder: 5 },
  { category: 'feast_day_rites', code: 'novena', nameMalayalam: 'നൊവേന', nameEnglish: 'Novena', amount: 80.0, sortOrder: 6 },

  // III. വെഞ്ചിരിപ്പുകൾ — Blessings (Vencheripp)
  { category: 'blessings', code: 'house_blessing', nameMalayalam: 'വീട് വെഞ്ചിരിപ്പ്', nameEnglish: 'House Blessing', amount: 200.0, sortOrder: 1 },
  { category: 'blessings', code: 'factory_shop_blessing', nameMalayalam: 'വ്യവസായശാല + കട', nameEnglish: 'Factory/Business + Shop', amount: 250.0, sortOrder: 2 },
  { category: 'blessings', code: 'vehicle_2_3_wheeler', nameMalayalam: 'മോട്ടോർ വാഹനങ്ങൾ (Two & Three Wheelers)', nameEnglish: 'Motor Vehicles (Two & Three Wheelers)', amount: 100.0, sortOrder: 3 },
  { category: 'blessings', code: 'vehicle_4_wheeler', nameMalayalam: 'മോട്ടോർവാഹനങ്ങൾ (Four Wheelers)', nameEnglish: 'Motor Vehicles (Four Wheelers)', amount: 250.0, sortOrder: 4 },

  // IV. പരേതർക്കുവേണ്ടിയുള്ള തിരുക്കർമ്മങ്ങൾ — Rites for the Deceased
  { category: 'deceased_rites', code: 'great_office', nameMalayalam: 'വലിയ ഒപ്പീസ് (പള്ളിയിൽ / സിമിത്തേരിയിൽ)', nameEnglish: 'Great Office, church/cemetery', amount: 350.0, sortOrder: 1 },
  { category: 'deceased_rites', code: 'small_office', nameMalayalam: 'ചെറിയ ഒപ്പീസ് (പള്ളിയിൽ / സിമിത്തേരിയിൽ)', nameEnglish: 'Small Office, church/cemetery', amount: 50.0, sortOrder: 2 },
  { category: 'deceased_rites', code: 'anniversary_memorial', nameMalayalam: 'അന്നീദ', nameEnglish: 'Anniversary Memorial', amount: 10.0, sortOrder: 3 },
  { category: 'deceased_rites', code: 'home_memorial', nameMalayalam: 'വീട്ടന്നീദ', nameEnglish: 'Home Memorial', amount: 250.0, sortOrder: 4 },

  // V. മറ്റ് തിരുക്കർമ്മങ്ങൾ — Other Sacred Rites
  { category: 'other_rites', code: 'thanksgiving_hymn', nameMalayalam: 'സ്തോത്രഗീതം', nameEnglish: 'Thanksgiving Hymn', amount: 150.0, sortOrder: 1 },
  { category: 'other_rites', code: 'candle_presentation', nameMalayalam: 'തിരി സമ്മാനിക്കൽ', nameEnglish: 'Candle Presentation', amount: 150.0, sortOrder: 2 },
  { category: 'other_rites', code: 'dedication', nameMalayalam: 'സമർപ്പണം (അടിമയിരുത്തൽ)', nameEnglish: 'Dedication', amount: 50.0, sortOrder: 3 },
];
