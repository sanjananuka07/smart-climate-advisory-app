// Crop recommendation data for Srikakulam district

export interface CropRecommendation {
  crop: string;
  cropTe: string;
  confidence: number;
  sowingTime: string;
  sowingTimeTe: string;
  irrigation: string;
  irrigationTe: string;
  fertilizer: string;
  fertilizerTe: string;
  waterReq: string;
  waterReqTe: string;
  harvestTime: string;
  harvestTimeTe: string;
}

export const cropDatabase: Record<string, CropRecommendation[]> = {
  kharif: [
    {
      crop: 'Paddy (Rice)',
      cropTe: 'వరి',
      confidence: 92,
      sowingTime: 'June - July (with monsoon onset)',
      sowingTimeTe: 'జూన్ - జులై (వర్షాకాలం ప్రారంభంతో)',
      irrigation: 'Flood irrigation every 5-7 days; rely on monsoon rainfall',
      irrigationTe: 'ప్రతి 5-7 రోజులకు నీటి పారుదల; వర్షాకాలం నుండి నీరు',
      fertilizer: 'NPK 80:40:40 kg/ha; apply in 3 splits. Add zinc sulphate 25 kg/ha.',
      fertilizerTe: 'NPK 80:40:40 కిలో/హెక్టార్; 3 దఫాలుగా ఇవ్వండి. జింక్ సల్ఫేట్ 25 కిలో/హెక్టార్.',
      waterReq: '1200-1500 mm over the season',
      waterReqTe: 'సీజన్‌లో 1200-1500 మిమీ',
      harvestTime: 'October - November (110-120 days)',
      harvestTimeTe: 'అక్టోబర్ - నవంబర్ (110-120 రోజులు)',
    },
    {
      crop: 'Maize',
      cropTe: 'మొక్కజొన్న',
      confidence: 85,
      sowingTime: 'June - July',
      sowingTimeTe: 'జూన్ - జులై',
      irrigation: 'Drip or sprinkler every 8-10 days during dry spells',
      irrigationTe: 'పొడి వాతావరణంలో ప్రతి 8-10 రోజులకు డ్రిప్ లేదా స్ప్రింక్లర్',
      fertilizer: 'NPK 80:40:40 kg/ha; basal + 2 top dressings',
      fertilizerTe: 'NPK 80:40:40 కిలో/హెక్టార్; బేసల్ + 2 టాప్ డ్రెస్సింగ్‌లు',
      waterReq: '500-700 mm over the season',
      waterReqTe: 'సీజన్‌లో 500-700 మిమీ',
      harvestTime: 'September - October (90-100 days)',
      harvestTimeTe: 'సెప్టెంబర్ - అక్టోబర్ (90-100 రోజులు)',
    },
    {
      crop: 'Groundnut',
      cropTe: 'వేరుశనగ',
      confidence: 78,
      sowingTime: 'June - July',
      sowingTimeTe: 'జూన్ - జులై',
      irrigation: 'Light irrigation every 10-12 days; avoid waterlogging',
      irrigationTe: 'ప్రతి 10-12 రోజులకు తేలికపాటి నీటి పారుదల; నీరు నిలవకుండా చూడండి',
      fertilizer: 'Gypsum 400 kg/ha at flowering; NPK 20:40:40 kg/ha basal',
      fertilizerTe: 'పుష్పించే సమయంలో జిప్సం 400 కిలో/హెక్టార్; NPK 20:40:40 కిలో/హెక్టార్ బేసల్',
      waterReq: '400-500 mm over the season',
      waterReqTe: 'సీజన్‌లో 400-500 మిమీ',
      harvestTime: 'October (105-120 days)',
      harvestTimeTe: 'అక్టోబర్ (105-120 రోజులు)',
    },
  ],
  rabi: [
    {
      crop: 'Paddy (Rabi)',
      cropTe: 'వరి (రబీ)',
      confidence: 88,
      sowingTime: 'November - December',
      sowingTimeTe: 'నవంబర్ - డిసెంబర్',
      irrigation: 'Irrigation every 4-6 days; ensure canal/borewell supply',
      irrigationTe: 'ప్రతి 4-6 రోజులకు నీటి పారుదల; కాలువ/బోర్‌వెల్ సరఫరా నిర్ధారించుకోండి',
      fertilizer: 'NPK 100:50:50 kg/ha in 3 splits',
      fertilizerTe: 'NPK 100:50:50 కిలో/హెక్టార్ 3 దఫాలుగా',
      waterReq: '1400-1600 mm over the season',
      waterReqTe: 'సీజన్‌లో 1400-1600 మిమీ',
      harvestTime: 'March - April (120-130 days)',
      harvestTimeTe: 'మార్చి - ఏప్రిల్ (120-130 రోజులు)',
    },
    {
      crop: 'Bengal Gram (Chickpea)',
      cropTe: 'శనగ',
      confidence: 82,
      sowingTime: 'November',
      sowingTimeTe: 'నవంబర్',
      irrigation: '1-2 irrigations: at flowering and pod-filling stage',
      irrigationTe: '1-2 నీటి పారుదలలు: పుష్పించే మరియు కాయ నిండే దశలో',
      fertilizer: 'Rhizobium seed treatment; NPK 20:50:25 kg/ha basal',
      fertilizerTe: 'రైజోబియం విత్తన శుద్ధి; NPK 20:50:25 కిలో/హెక్టార్ బేసల్',
      waterReq: '150-250 mm over the season',
      waterReqTe: 'సీజన్‌లో 150-250 మిమీ',
      harvestTime: 'February - March (100-110 days)',
      harvestTimeTe: 'ఫిబ్రవరి - మార్చి (100-110 రోజులు)',
    },
    {
      crop: 'Black Gram (Urad)',
      cropTe: 'మినుము',
      confidence: 76,
      sowingTime: 'November - December',
      sowingTimeTe: 'నవంబర్ - డిసెంబర్',
      irrigation: '1-2 light irrigations; sensitive to excess water',
      irrigationTe: '1-2 తేలికపాటి నీటి పారుదలలు; అదనపు నీటికి సున్నితం',
      fertilizer: 'Rhizobium + PSB seed treatment; NPK 20:40:20 kg/ha',
      fertilizerTe: 'రైజోబియం + PSB విత్తన శుద్ధి; NPK 20:40:20 కిలో/హెక్టార్',
      waterReq: '200-300 mm over the season',
      waterReqTe: 'సీజన్‌లో 200-300 మిమీ',
      harvestTime: 'February - March (80-90 days)',
      harvestTimeTe: 'ఫిబ్రవరి - మార్చి (80-90 రోజులు)',
    },
  ],
  zaid: [
    {
      crop: 'Green Gram (Moong)',
      cropTe: 'పెసర',
      confidence: 80,
      sowingTime: 'March - April',
      sowingTimeTe: 'మార్చి - ఏప్రిల్',
      irrigation: 'Irrigate every 7-10 days; requires assured water source',
      irrigationTe: 'ప్రతి 7-10 రోజులకు నీటి పారుదల; నిశ్చిత నీటి వనరు అవసరం',
      fertilizer: 'NPK 20:40:20 kg/ha basal; Rhizobium seed treatment',
      fertilizerTe: 'NPK 20:40:20 కిలో/హెక్టార్ బేసల్; రైజోబియం విత్తన శుద్ధి',
      waterReq: '300-400 mm over the season',
      waterReqTe: 'సీజన్‌లో 300-400 మిమీ',
      harvestTime: 'June - July (65-75 days)',
      harvestTimeTe: 'జూన్ - జులై (65-75 రోజులు)',
    },
    {
      crop: 'Cucumber',
      cropTe: 'దోస',
      confidence: 74,
      sowingTime: 'March - April',
      sowingTimeTe: 'మార్చి - ఏప్రిల్',
      irrigation: 'Drip irrigation daily or every alternate day',
      irrigationTe: 'ప్రతిరోజు లేదా రెండవ రోజు డ్రిప్ నీటి పారుదల',
      fertilizer: 'NPK 60:30:30 kg/ha; FYM 20 t/ha basal',
      fertilizerTe: 'NPK 60:30:30 కిలో/హెక్టార్; FYM 20 టన్/హెక్టార్ బేసల్',
      waterReq: '450-600 mm over the season',
      waterReqTe: 'సీజన్‌లో 450-600 మిమీ',
      harvestTime: 'May - June (60-70 days)',
      harvestTimeTe: 'మే - జూన్ (60-70 రోజులు)',
    },
  ],
};

export const soilTypes = [
  { value: 'red', label: 'Red Soil', labelTe: '�రుపు నేల' },
  { value: 'black', label: 'Black Soil', labelTe: 'నల్ల నేల' },
  { value: 'alluvial', label: 'Alluvial Soil', labelTe: 'గండి నేల' },
  { value: 'sandy', label: 'Sandy Soil', labelTe: 'ఇసుక నేల' },
  { value: 'loamy', label: 'Loamy Soil', labelTe: 'లోమీ నేల' },
];
