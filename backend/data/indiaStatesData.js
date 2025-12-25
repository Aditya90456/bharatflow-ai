// Comprehensive data for all Indian states and union territories
const indiaStatesData = {
  // States
  "Andhra Pradesh": {
    code: "AP",
    capital: "Amaravati",
    type: "state",
    coordinates: { lat: 15.9129, lng: 79.7400 },
    bounds: { 
      north: 19.9070, south: 12.6269, 
      east: 84.7750, west: 76.7540 
    },
    population: 49386799,
    area: 162968,
    districts: 13,
    majorCities: [
      { name: "Visakhapatnam", lat: 17.6868, lng: 83.2185, population: 2035922 },
      { name: "Vijayawada", lat: 16.5062, lng: 80.6480, population: 1048240 },
      { name: "Guntur", lat: 16.3067, lng: 80.4365, population: 743354 },
      { name: "Nellore", lat: 14.4426, lng: 79.9865, population: 558676 },
      { name: "Kurnool", lat: 15.8281, lng: 78.0373, population: 484327 },
      { name: "Rajahmundry", lat: 17.0005, lng: 81.8040, population: 341831 },
      { name: "Tirupati", lat: 13.6288, lng: 79.4192, population: 287035 },
      { name: "Kadapa", lat: 14.4673, lng: 78.8242, population: 344893 }
    ],
    trafficHotspots: [
      { name: "Visakhapatnam Port Area", severity: "HIGH", type: "COMMERCIAL" },
      { name: "Vijayawada Railway Junction", severity: "HIGH", type: "TRANSPORT" },
      { name: "Guntur-Vijayawada Highway", severity: "MEDIUM", type: "HIGHWAY" }
    ]
  },

  "Arunachal Pradesh": {
    code: "AR",
    capital: "Itanagar",
    type: "state",
    coordinates: { lat: 28.2180, lng: 94.7278 },
    bounds: { 
      north: 29.4528, south: 26.6344, 
      east: 97.4025, west: 91.6080 
    },
    population: 1383727,
    area: 83743,
    districts: 25,
    majorCities: [
      { name: "Itanagar", lat: 27.0844, lng: 93.6053, population: 59490 },
      { name: "Naharlagun", lat: 27.1050, lng: 93.6950, population: 30709 },
      { name: "Pasighat", lat: 28.0669, lng: 95.3261, population: 24656 },
      { name: "Tezpur", lat: 26.6340, lng: 92.7789, population: 58851 }
    ],
    trafficHotspots: [
      { name: "Itanagar-Naharlagun Corridor", severity: "MEDIUM", type: "URBAN" },
      { name: "NH-415 Tezpur Section", severity: "LOW", type: "HIGHWAY" }
    ]
  },

  "Assam": {
    code: "AS",
    capital: "Dispur",
    type: "state",
    coordinates: { lat: 26.2006, lng: 92.9376 },
    bounds: { 
      north: 28.1625, south: 24.1270, 
      east: 96.0252, west: 89.7050 
    },
    population: 31205576,
    area: 78438,
    districts: 35,
    majorCities: [
      { name: "Guwahati", lat: 26.1445, lng: 91.7362, population: 1116267 },
      { name: "Silchar", lat: 24.8333, lng: 92.7789, population: 228951 },
      { name: "Dibrugarh", lat: 27.4728, lng: 94.9120, population: 154296 },
      { name: "Jorhat", lat: 26.7509, lng: 94.2037, population: 153889 },
      { name: "Nagaon", lat: 26.3484, lng: 92.6855, population: 147231 },
      { name: "Tinsukia", lat: 27.4898, lng: 95.3597, population: 125438 }
    ],
    trafficHotspots: [
      { name: "Guwahati City Center", severity: "HIGH", type: "URBAN" },
      { name: "Saraighat Bridge", severity: "HIGH", type: "BRIDGE" },
      { name: "NH-37 Guwahati-Jorhat", severity: "MEDIUM", type: "HIGHWAY" }
    ]
  },

  "Bihar": {
    code: "BR",
    capital: "Patna",
    type: "state",
    coordinates: { lat: 25.0961, lng: 85.3131 },
    bounds: { 
      north: 27.5218, south: 24.2042, 
      east: 88.2275, west: 83.3259 
    },
    population: 104099452,
    area: 94163,
    districts: 38,
    majorCities: [
      { name: "Patna", lat: 25.5941, lng: 85.1376, population: 2049156 },
      { name: "Gaya", lat: 24.7914, lng: 85.0002, population: 470839 },
      { name: "Bhagalpur", lat: 25.2425, lng: 86.9842, population: 410210 },
      { name: "Muzaffarpur", lat: 26.1209, lng: 85.3647, population: 393724 },
      { name: "Darbhanga", lat: 26.1542, lng: 85.8918, population: 308873 },
      { name: "Bihar Sharif", lat: 25.2073, lng: 85.5226, population: 297268 }
    ],
    trafficHotspots: [
      { name: "Patna Junction Area", severity: "HIGH", type: "TRANSPORT" },
      { name: "Gandhi Maidan Patna", severity: "HIGH", type: "COMMERCIAL" },
      { name: "NH-31 Patna-Gaya", severity: "MEDIUM", type: "HIGHWAY" }
    ]
  },

  "Chhattisgarh": {
    code: "CG",
    capital: "Raipur",
    type: "state",
    coordinates: { lat: 21.2787, lng: 81.8661 },
    bounds: { 
      north: 24.0859, south: 17.7800, 
      east: 84.3517, west: 80.2707 
    },
    population: 25545198,
    area: 135192,
    districts: 33,
    majorCities: [
      { name: "Raipur", lat: 21.2514, lng: 81.6296, population: 1122555 },
      { name: "Bhilai", lat: 21.1938, lng: 81.3509, population: 625697 },
      { name: "Korba", lat: 22.3595, lng: 82.7501, population: 365073 },
      { name: "Bilaspur", lat: 22.0797, lng: 82.1409, population: 365579 },
      { name: "Durg", lat: 21.1901, lng: 81.2849, population: 268806 }
    ],
    trafficHotspots: [
      { name: "Raipur-Bhilai Industrial Corridor", severity: "HIGH", type: "INDUSTRIAL" },
      { name: "Steel Plant Area Bhilai", severity: "MEDIUM", type: "INDUSTRIAL" },
      { name: "NH-6 Raipur Section", severity: "MEDIUM", type: "HIGHWAY" }
    ]
  },

  "Goa": {
    code: "GA",
    capital: "Panaji",
    type: "state",
    coordinates: { lat: 15.2993, lng: 74.1240 },
    bounds: { 
      north: 15.8000, south: 14.8954, 
      east: 74.3132, west: 73.7394 
    },
    population: 1458545,
    area: 3702,
    districts: 2,
    majorCities: [
      { name: "Panaji", lat: 15.4909, lng: 73.8278, population: 114405 },
      { name: "Margao", lat: 15.2700, lng: 73.9500, population: 120333 },
      { name: "Vasco da Gama", lat: 15.3955, lng: 73.8157, population: 122138 },
      { name: "Mapusa", lat: 15.5937, lng: 73.8097, population: 40487 }
    ],
    trafficHotspots: [
      { name: "Panaji-Margao Highway", severity: "HIGH", type: "TOURIST" },
      { name: "Dabolim Airport Area", severity: "MEDIUM", type: "AIRPORT" },
      { name: "Calangute Beach Road", severity: "HIGH", type: "TOURIST" }
    ]
  },

  "Gujarat": {
    code: "GJ",
    capital: "Gandhinagar",
    type: "state",
    coordinates: { lat: 22.2587, lng: 71.1924 },
    bounds: { 
      north: 24.7081, south: 20.0630, 
      east: 74.4669, west: 68.1097 
    },
    population: 60439692,
    area: 196244,
    districts: 33,
    majorCities: [
      { name: "Ahmedabad", lat: 23.0225, lng: 72.5714, population: 7692000 },
      { name: "Surat", lat: 21.1702, lng: 72.8311, population: 6564000 },
      { name: "Vadodara", lat: 22.3072, lng: 73.1812, population: 2065771 },
      { name: "Rajkot", lat: 22.3039, lng: 70.8022, population: 1390933 },
      { name: "Bhavnagar", lat: 21.7645, lng: 72.1519, population: 605882 },
      { name: "Jamnagar", lat: 22.4707, lng: 70.0577, population: 600943 }
    ],
    trafficHotspots: [
      { name: "Ahmedabad SG Highway", severity: "HIGH", type: "COMMERCIAL" },
      { name: "Surat Diamond Market Area", severity: "HIGH", type: "COMMERCIAL" },
      { name: "Mumbai-Ahmedabad Highway", severity: "HIGH", type: "HIGHWAY" }
    ]
  },

  "Haryana": {
    code: "HR",
    capital: "Chandigarh",
    type: "state",
    coordinates: { lat: 29.0588, lng: 76.0856 },
    bounds: { 
      north: 30.9293, south: 27.6540, 
      east: 77.3648, west: 74.4580 
    },
    population: 25351462,
    area: 44212,
    districts: 22,
    majorCities: [
      { name: "Faridabad", lat: 28.4089, lng: 77.3178, population: 1404653 },
      { name: "Gurgaon", lat: 28.4595, lng: 77.0266, population: 1153000 },
      { name: "Panipat", lat: 29.3909, lng: 76.9635, population: 294151 },
      { name: "Ambala", lat: 30.3782, lng: 76.7767, population: 207934 },
      { name: "Yamunanagar", lat: 30.1290, lng: 77.2674, population: 383318 }
    ],
    trafficHotspots: [
      { name: "Delhi-Gurgaon Expressway", severity: "HIGH", type: "HIGHWAY" },
      { name: "Cyber City Gurgaon", severity: "HIGH", type: "COMMERCIAL" },
      { name: "NH-1 Delhi Border", severity: "HIGH", type: "HIGHWAY" }
    ]
  },

  "Himachal Pradesh": {
    code: "HP",
    capital: "Shimla",
    type: "state",
    coordinates: { lat: 31.1048, lng: 77.1734 },
    bounds: { 
      north: 33.2206, south: 30.3804, 
      east: 79.0422, west: 75.4734 
    },
    population: 6864602,
    area: 55673,
    districts: 12,
    majorCities: [
      { name: "Shimla", lat: 31.1048, lng: 77.1734, population: 198809 },
      { name: "Dharamshala", lat: 32.2190, lng: 76.3234, population: 30764 },
      { name: "Solan", lat: 30.9045, lng: 77.0967, population: 58564 },
      { name: "Mandi", lat: 31.7084, lng: 76.9319, population: 26422 }
    ],
    trafficHotspots: [
      { name: "Shimla Mall Road", severity: "MEDIUM", type: "TOURIST" },
      { name: "Chandigarh-Shimla Highway", severity: "MEDIUM", type: "HIGHWAY" },
      { name: "Dharamshala McLeod Ganj", severity: "MEDIUM", type: "TOURIST" }
    ]
  },

  "Jharkhand": {
    code: "JH",
    capital: "Ranchi",
    type: "state",
    coordinates: { lat: 23.6102, lng: 85.2799 },
    bounds: { 
      north: 25.3218, south: 21.9590, 
      east: 87.5277, west: 83.3259 
    },
    population: 33406061,
    area: 79716,
    districts: 24,
    majorCities: [
      { name: "Ranchi", lat: 23.3441, lng: 85.3096, population: 1126741 },
      { name: "Jamshedpur", lat: 22.8046, lng: 86.2029, population: 1337131 },
      { name: "Dhanbad", lat: 23.7957, lng: 86.4304, population: 1195298 }
    ],
    trafficHotspots: [
      { name: "Ranchi Main Road", severity: "MEDIUM", type: "URBAN" },
      { name: "Jamshedpur Steel City", severity: "HIGH", type: "INDUSTRIAL" }
    ]
  }
,

  "Karnataka": {
    code: "KA",
    capital: "Bengaluru",
    type: "state",
    coordinates: { lat: 15.3173, lng: 75.7139 },
    bounds: { 
      north: 18.4574, south: 11.5945, 
      east: 78.5885, west: 74.0894 
    },
    population: 61095297,
    area: 191791,
    districts: 31,
    majorCities: [
      { name: "Bengaluru", lat: 12.9716, lng: 77.5946, population: 12764935 },
      { name: "Mysuru", lat: 12.2958, lng: 76.6394, population: 920550 },
      { name: "Hubli-Dharwad", lat: 15.3647, lng: 75.1240, population: 1031974 },
      { name: "Mangaluru", lat: 12.9141, lng: 74.8560, population: 623841 },
      { name: "Belagavi", lat: 15.8497, lng: 74.4977, population: 610350 },
      { name: "Gulbarga", lat: 17.3297, lng: 76.8343, population: 543147 }
    ],
    trafficHotspots: [
      { name: "Bengaluru Electronic City", severity: "HIGH", type: "COMMERCIAL" },
      { name: "Outer Ring Road Bengaluru", severity: "HIGH", type: "HIGHWAY" },
      { name: "Hosur Road IT Corridor", severity: "HIGH", type: "COMMERCIAL" }
    ]
  },

  "Kerala": {
    code: "KL",
    capital: "Thiruvananthapuram",
    type: "state",
    coordinates: { lat: 10.8505, lng: 76.2711 },
    bounds: { 
      north: 12.7840, south: 8.1800, 
      east: 77.4170, west: 74.8520 
    },
    population: 33406061,
    area: 38852,
    districts: 14,
    majorCities: [
      { name: "Thiruvananthapuram", lat: 8.5241, lng: 76.9366, population: 957730 },
      { name: "Kochi", lat: 9.9312, lng: 76.2673, population: 2117990 },
      { name: "Kozhikode", lat: 11.2588, lng: 75.7804, population: 609224 },
      { name: "Thrissur", lat: 10.5276, lng: 76.2144, population: 315596 },
      { name: "Kollam", lat: 8.8932, lng: 76.6141, population: 397419 },
      { name: "Kannur", lat: 11.8745, lng: 75.3704, population: 232486 }
    ],
    trafficHotspots: [
      { name: "Kochi Marine Drive", severity: "HIGH", type: "TOURIST" },
      { name: "NH-66 Coastal Highway", severity: "MEDIUM", type: "HIGHWAY" },
      { name: "Thiruvananthapuram Airport Road", severity: "MEDIUM", type: "AIRPORT" }
    ]
  },

  "Madhya Pradesh": {
    code: "MP",
    capital: "Bhopal",
    type: "state",
    coordinates: { lat: 22.9734, lng: 78.6569 },
    bounds: { 
      north: 26.8770, south: 17.7800, 
      east: 82.8681, west: 74.0894 
    },
    population: 72626809,
    area: 308245,
    districts: 55,
    majorCities: [
      { name: "Indore", lat: 22.7196, lng: 75.8577, population: 3276697 },
      { name: "Bhopal", lat: 23.2599, lng: 77.4126, population: 2368145 },
      { name: "Jabalpur", lat: 23.1815, lng: 79.9864, population: 1267564 },
      { name: "Gwalior", lat: 26.2183, lng: 78.1828, population: 1101981 },
      { name: "Ujjain", lat: 23.1765, lng: 75.7885, population: 515215 },
      { name: "Sagar", lat: 23.8388, lng: 78.7378, population: 273357 }
    ],
    trafficHotspots: [
      { name: "Indore AB Road", severity: "HIGH", type: "COMMERCIAL" },
      { name: "Bhopal New Market Area", severity: "HIGH", type: "COMMERCIAL" },
      { name: "NH-3 Agra-Mumbai Highway", severity: "MEDIUM", type: "HIGHWAY" }
    ]
  },

  "Maharashtra": {
    code: "MH",
    capital: "Mumbai",
    type: "state",
    coordinates: { lat: 19.7515, lng: 75.7139 },
    bounds: { 
      north: 22.0278, south: 15.6024, 
      east: 80.8913, west: 72.6589 
    },
    population: 112374333,
    area: 307713,
    districts: 36,
    majorCities: [
      { name: "Mumbai", lat: 19.0760, lng: 72.8777, population: 20411274 },
      { name: "Pune", lat: 18.5204, lng: 73.8567, population: 7541946 },
      { name: "Nagpur", lat: 21.1458, lng: 79.0882, population: 2497777 },
      { name: "Nashik", lat: 19.9975, lng: 73.7898, population: 1695134 },
      { name: "Aurangabad", lat: 19.8762, lng: 75.3433, population: 1175116 },
      { name: "Solapur", lat: 17.6599, lng: 75.9064, population: 951118 }
    ],
    trafficHotspots: [
      { name: "Mumbai Western Express Highway", severity: "HIGH", type: "HIGHWAY" },
      { name: "Pune-Mumbai Expressway", severity: "HIGH", type: "HIGHWAY" },
      { name: "Mumbai Bandra-Kurla Complex", severity: "HIGH", type: "COMMERCIAL" }
    ]
  },

  "Manipur": {
    code: "MN",
    capital: "Imphal",
    type: "state",
    coordinates: { lat: 24.6637, lng: 93.9063 },
    bounds: { 
      north: 25.6837, south: 23.8347, 
      east: 94.7800, west: 93.0300 
    },
    population: 2855794,
    area: 22327,
    districts: 16,
    majorCities: [
      { name: "Imphal", lat: 24.8170, lng: 93.9368, population: 414288 },
      { name: "Thoubal", lat: 24.6340, lng: 93.9900, population: 35311 },
      { name: "Bishnupur", lat: 24.6464, lng: 93.7717, population: 16652 }
    ],
    trafficHotspots: [
      { name: "Imphal Main Market", severity: "MEDIUM", type: "COMMERCIAL" },
      { name: "NH-37 Imphal Section", severity: "LOW", type: "HIGHWAY" }
    ]
  },

  "Meghalaya": {
    code: "ML",
    capital: "Shillong",
    type: "state",
    coordinates: { lat: 25.4670, lng: 91.3662 },
    bounds: { 
      north: 26.1146, south: 25.0070, 
      east: 92.7985, west: 89.8380 
    },
    population: 2966889,
    area: 22429,
    districts: 11,
    majorCities: [
      { name: "Shillong", lat: 25.5788, lng: 91.8933, population: 354325 },
      { name: "Tura", lat: 25.5138, lng: 90.2022, population: 65540 },
      { name: "Jowai", lat: 25.4500, lng: 92.2000, population: 35000 }
    ],
    trafficHotspots: [
      { name: "Shillong Police Bazar", severity: "MEDIUM", type: "COMMERCIAL" },
      { name: "Guwahati-Shillong Highway", severity: "MEDIUM", type: "HIGHWAY" }
    ]
  },

  "Mizoram": {
    code: "MZ",
    capital: "Aizawl",
    type: "state",
    coordinates: { lat: 23.1645, lng: 92.9376 },
    bounds: { 
      north: 24.6354, south: 21.9577, 
      east: 93.6260, west: 92.1585 
    },
    population: 1097206,
    area: 21081,
    districts: 11,
    majorCities: [
      { name: "Aizawl", lat: 23.7271, lng: 92.7176, population: 293416 },
      { name: "Lunglei", lat: 22.8800, lng: 92.7300, population: 57011 },
      { name: "Saiha", lat: 22.4900, lng: 92.9700, population: 25000 }
    ],
    trafficHotspots: [
      { name: "Aizawl Bara Bazar", severity: "LOW", type: "COMMERCIAL" },
      { name: "NH-54 Aizawl Section", severity: "LOW", type: "HIGHWAY" }
    ]
  },

  "Nagaland": {
    code: "NL",
    capital: "Kohima",
    type: "state",
    coordinates: { lat: 26.1584, lng: 94.5624 },
    bounds: { 
      north: 27.0440, south: 25.2070, 
      east: 95.1560, west: 93.3260 
    },
    population: 1978502,
    area: 16579,
    districts: 16,
    majorCities: [
      { name: "Dimapur", lat: 25.9044, lng: 93.7267, population: 378811 },
      { name: "Kohima", lat: 25.6751, lng: 94.1086, population: 267988 },
      { name: "Mokokchung", lat: 26.3200, lng: 94.5200, population: 35913 }
    ],
    trafficHotspots: [
      { name: "Dimapur Railway Station Area", severity: "MEDIUM", type: "TRANSPORT" },
      { name: "Kohima Main Town", severity: "LOW", type: "URBAN" }
    ]
  },

  "Odisha": {
    code: "OR",
    capital: "Bhubaneswar",
    type: "state",
    coordinates: { lat: 20.9517, lng: 85.0985 },
    bounds: { 
      north: 22.5670, south: 17.7800, 
      east: 87.5277, west: 81.3370 
    },
    population: 42033054,
    area: 155707,
    districts: 30,
    majorCities: [
      { name: "Bhubaneswar", lat: 20.2961, lng: 85.8245, population: 837737 },
      { name: "Cuttack", lat: 20.4625, lng: 85.8828, population: 663849 },
      { name: "Rourkela", lat: 22.2604, lng: 84.8536, population: 483418 },
      { name: "Berhampur", lat: 19.3149, lng: 84.7941, population: 356598 },
      { name: "Sambalpur", lat: 21.4669, lng: 83.9812, population: 335761 }
    ],
    trafficHotspots: [
      { name: "Bhubaneswar-Cuttack Twin City", severity: "HIGH", type: "URBAN" },
      { name: "Rourkela Steel Plant Area", severity: "MEDIUM", type: "INDUSTRIAL" },
      { name: "NH-16 Coastal Highway", severity: "MEDIUM", type: "HIGHWAY" }
    ]
  },

  "Punjab": {
    code: "PB",
    capital: "Chandigarh",
    type: "state",
    coordinates: { lat: 31.1471, lng: 75.3412 },
    bounds: { 
      north: 32.5019, south: 29.5370, 
      east: 76.5881, west: 73.8770 
    },
    population: 27743338,
    area: 50362,
    districts: 23,
    majorCities: [
      { name: "Ludhiana", lat: 30.9010, lng: 75.8573, population: 1618879 },
      { name: "Amritsar", lat: 31.6340, lng: 74.8723, population: 1183705 },
      { name: "Jalandhar", lat: 31.3260, lng: 75.5762, population: 873725 },
      { name: "Patiala", lat: 30.3398, lng: 76.3869, population: 446246 },
      { name: "Bathinda", lat: 30.2110, lng: 74.9455, population: 285813 }
    ],
    trafficHotspots: [
      { name: "Ludhiana Industrial Area", severity: "HIGH", type: "INDUSTRIAL" },
      { name: "Amritsar Golden Temple Area", severity: "HIGH", type: "RELIGIOUS" },
      { name: "GT Road Punjab Section", severity: "MEDIUM", type: "HIGHWAY" }
    ]
  },

  "Rajasthan": {
    code: "RJ",
    capital: "Jaipur",
    type: "state",
    coordinates: { lat: 27.0238, lng: 74.2179 },
    bounds: { 
      north: 30.1800, south: 23.0300, 
      east: 78.2700, west: 69.3000 
    },
    population: 68548437,
    area: 342239,
    districts: 50,
    majorCities: [
      { name: "Jaipur", lat: 26.9124, lng: 75.7873, population: 3073350 },
      { name: "Jodhpur", lat: 26.2389, lng: 73.0243, population: 1033756 },
      { name: "Kota", lat: 25.2138, lng: 75.8648, population: 1001365 },
      { name: "Bikaner", lat: 28.0229, lng: 73.3119, population: 644406 },
      { name: "Udaipur", lat: 24.5854, lng: 73.7125, population: 598679 },
      { name: "Ajmer", lat: 26.4499, lng: 74.6399, population: 551360 }
    ],
    trafficHotspots: [
      { name: "Jaipur Pink City Area", severity: "HIGH", type: "TOURIST" },
      { name: "Delhi-Jaipur Highway", severity: "HIGH", type: "HIGHWAY" },
      { name: "Jodhpur Clock Tower Market", severity: "MEDIUM", type: "COMMERCIAL" }
    ]
  },

  "Sikkim": {
    code: "SK",
    capital: "Gangtok",
    type: "state",
    coordinates: { lat: 27.5330, lng: 88.5122 },
    bounds: { 
      north: 28.1280, south: 27.0440, 
      east: 88.9060, west: 88.0580 
    },
    population: 610577,
    area: 7096,
    districts: 6,
    majorCities: [
      { name: "Gangtok", lat: 27.3389, lng: 88.6065, population: 100286 },
      { name: "Namchi", lat: 27.1667, lng: 88.3667, population: 12190 },
      { name: "Gyalshing", lat: 27.2833, lng: 88.2667, population: 9909 }
    ],
    trafficHotspots: [
      { name: "Gangtok MG Marg", severity: "MEDIUM", type: "TOURIST" },
      { name: "Siliguri-Gangtok Highway", severity: "MEDIUM", type: "HIGHWAY" }
    ]
  },

  "Tamil Nadu": {
    code: "TN",
    capital: "Chennai",
    type: "state",
    coordinates: { lat: 11.1271, lng: 78.6569 },
    bounds: { 
      north: 13.4203, south: 8.0681, 
      east: 80.3480, west: 76.2300 
    },
    population: 72147030,
    area: 130060,
    districts: 38,
    majorCities: [
      { name: "Chennai", lat: 13.0827, lng: 80.2707, population: 11503293 },
      { name: "Coimbatore", lat: 11.0168, lng: 76.9558, population: 2151466 },
      { name: "Madurai", lat: 9.9252, lng: 78.1198, population: 1561129 },
      { name: "Tiruchirappalli", lat: 10.7905, lng: 78.7047, population: 1021717 },
      { name: "Salem", lat: 11.6643, lng: 78.1460, population: 896267 },
      { name: "Tirunelveli", lat: 8.7139, lng: 77.7567, population: 473637 }
    ],
    trafficHotspots: [
      { name: "Chennai IT Corridor OMR", severity: "HIGH", type: "COMMERCIAL" },
      { name: "Chennai Anna Salai", severity: "HIGH", type: "COMMERCIAL" },
      { name: "Coimbatore Avinashi Road", severity: "MEDIUM", type: "INDUSTRIAL" }
    ]
  },

  "Telangana": {
    code: "TG",
    capital: "Hyderabad",
    type: "state",
    coordinates: { lat: 18.1124, lng: 79.0193 },
    bounds: { 
      north: 19.9158, south: 15.8532, 
      east: 81.7780, west: 77.2700 
    },
    population: 35003674,
    area: 112077,
    districts: 33,
    majorCities: [
      { name: "Hyderabad", lat: 17.3850, lng: 78.4867, population: 10004608 },
      { name: "Warangal", lat: 17.9689, lng: 79.5941, population: 811844 },
      { name: "Nizamabad", lat: 18.6725, lng: 78.0941, population: 311152 },
      { name: "Khammam", lat: 17.2473, lng: 80.1514, population: 262255 },
      { name: "Karimnagar", lat: 18.4386, lng: 79.1288, population: 261185 }
    ],
    trafficHotspots: [
      { name: "Hyderabad HITEC City", severity: "HIGH", type: "COMMERCIAL" },
      { name: "Outer Ring Road Hyderabad", severity: "HIGH", type: "HIGHWAY" },
      { name: "Secunderabad Railway Station", severity: "HIGH", type: "TRANSPORT" }
    ]
  },

  "Tripura": {
    code: "TR",
    capital: "Agartala",
    type: "state",
    coordinates: { lat: 23.9408, lng: 91.9882 },
    bounds: { 
      north: 24.6327, south: 22.9565, 
      east: 92.6730, west: 91.0940 
    },
    population: 3673917,
    area: 10486,
    districts: 8,
    majorCities: [
      { name: "Agartala", lat: 23.8315, lng: 91.2868, population: 522613 },
      { name: "Dharmanagar", lat: 24.3667, lng: 92.1667, population: 53858 },
      { name: "Udaipur", lat: 23.5333, lng: 91.4833, population: 41941 }
    ],
    trafficHotspots: [
      { name: "Agartala Airport Road", severity: "MEDIUM", type: "AIRPORT" },
      { name: "Agartala Main Market", severity: "MEDIUM", type: "COMMERCIAL" }
    ]
  },

  "Uttar Pradesh": {
    code: "UP",
    capital: "Lucknow",
    type: "state",
    coordinates: { lat: 26.8467, lng: 80.9462 },
    bounds: { 
      north: 30.4280, south: 23.8520, 
      east: 84.6350, west: 77.0580 
    },
    population: 199812341,
    area: 240928,
    districts: 75,
    majorCities: [
      { name: "Lucknow", lat: 26.8467, lng: 80.9462, population: 3382559 },
      { name: "Kanpur", lat: 26.4499, lng: 80.3319, population: 3038000 },
      { name: "Ghaziabad", lat: 28.6692, lng: 77.4538, population: 2358525 },
      { name: "Agra", lat: 27.1767, lng: 78.0081, population: 1760285 },
      { name: "Meerut", lat: 28.9845, lng: 77.7064, population: 1424908 },
      { name: "Varanasi", lat: 25.3176, lng: 82.9739, population: 1435113 }
    ],
    trafficHotspots: [
      { name: "Noida-Greater Noida Expressway", severity: "HIGH", type: "HIGHWAY" },
      { name: "Lucknow Hazratganj", severity: "HIGH", type: "COMMERCIAL" },
      { name: "Agra Taj Mahal Area", severity: "HIGH", type: "TOURIST" }
    ]
  },

  "Uttarakhand": {
    code: "UK",
    capital: "Dehradun",
    type: "state",
    coordinates: { lat: 30.0668, lng: 79.0193 },
    bounds: { 
      north: 31.4490, south: 28.4300, 
      east: 81.0290, west: 77.3400 
    },
    population: 10086292,
    area: 53483,
    districts: 13,
    majorCities: [
      { name: "Dehradun", lat: 30.3165, lng: 78.0322, population: 803983 },
      { name: "Haridwar", lat: 29.9457, lng: 78.1642, population: 314447 },
      { name: "Roorkee", lat: 29.8543, lng: 77.8880, population: 185000 },
      { name: "Haldwani", lat: 29.2183, lng: 79.5130, population: 204355 },
      { name: "Rudrapur", lat: 28.9845, lng: 79.4070, population: 154485 }
    ],
    trafficHotspots: [
      { name: "Dehradun Clock Tower", severity: "MEDIUM", type: "COMMERCIAL" },
      { name: "Haridwar Har Ki Pauri", severity: "HIGH", type: "RELIGIOUS" },
      { name: "Delhi-Dehradun Highway", severity: "MEDIUM", type: "HIGHWAY" }
    ]
  },

  "West Bengal": {
    code: "WB",
    capital: "Kolkata",
    type: "state",
    coordinates: { lat: 22.9868, lng: 87.8550 },
    bounds: { 
      north: 27.2314, south: 21.2500, 
      east: 89.8530, west: 85.8200 
    },
    population: 91276115,
    area: 88752,
    districts: 23,
    majorCities: [
      { name: "Kolkata", lat: 22.5726, lng: 88.3639, population: 14850066 },
      { name: "Howrah", lat: 22.5958, lng: 88.2636, population: 1077075 },
      { name: "Durgapur", lat: 23.5204, lng: 87.3119, population: 581409 },
      { name: "Asansol", lat: 23.6739, lng: 86.9524, population: 563917 },
      { name: "Siliguri", lat: 26.7271, lng: 88.3953, population: 513264 },
      { name: "Malda", lat: 25.0000, lng: 88.1333, population: 324237 }
    ],
    trafficHotspots: [
      { name: "Kolkata Park Street", severity: "HIGH", type: "COMMERCIAL" },
      { name: "Howrah Bridge Area", severity: "HIGH", type: "TRANSPORT" },
      { name: "EM Bypass Kolkata", severity: "HIGH", type: "HIGHWAY" }
    ]
  },

  // Union Territories
  "Andaman and Nicobar Islands": {
    code: "AN",
    capital: "Port Blair",
    type: "union_territory",
    coordinates: { lat: 11.7401, lng: 92.6586 },
    bounds: { 
      north: 13.6830, south: 6.7450, 
      east: 93.9063, west: 92.2340 
    },
    population: 380581,
    area: 8249,
    districts: 3,
    majorCities: [
      { name: "Port Blair", lat: 11.6234, lng: 92.7265, population: 140572 }
    ],
    trafficHotspots: [
      { name: "Port Blair Aberdeen Bazaar", severity: "LOW", type: "COMMERCIAL" }
    ]
  },

  "Chandigarh": {
    code: "CH",
    capital: "Chandigarh",
    type: "union_territory",
    coordinates: { lat: 30.7333, lng: 76.7794 },
    bounds: { 
      north: 30.7617, south: 30.7047, 
      east: 76.8382, west: 76.7206 
    },
    population: 1055450,
    area: 114,
    districts: 1,
    majorCities: [
      { name: "Chandigarh", lat: 30.7333, lng: 76.7794, population: 1055450 }
    ],
    trafficHotspots: [
      { name: "Sector 17 Plaza", severity: "HIGH", type: "COMMERCIAL" },
      { name: "Chandigarh Railway Station", severity: "MEDIUM", type: "TRANSPORT" }
    ]
  },

  "Dadra and Nagar Haveli and Daman and Diu": {
    code: "DH",
    capital: "Daman",
    type: "union_territory",
    coordinates: { lat: 20.3974, lng: 72.8328 },
    bounds: { 
      north: 20.4300, south: 20.3600, 
      east: 72.8700, west: 72.7900 
    },
    population: 585764,
    area: 603,
    districts: 3,
    majorCities: [
      { name: "Daman", lat: 20.3974, lng: 72.8328, population: 44282 },
      { name: "Silvassa", lat: 20.2738, lng: 73.0140, population: 98032 }
    ],
    trafficHotspots: [
      { name: "Daman Seaface", severity: "LOW", type: "TOURIST" }
    ]
  },

  "Delhi": {
    code: "DL",
    capital: "New Delhi",
    type: "union_territory",
    coordinates: { lat: 28.7041, lng: 77.1025 },
    bounds: { 
      north: 28.8833, south: 28.4041, 
      east: 77.3465, west: 76.8389 
    },
    population: 32941309,
    area: 1484,
    districts: 11,
    majorCities: [
      { name: "New Delhi", lat: 28.6139, lng: 77.2090, population: 32941309 }
    ],
    trafficHotspots: [
      { name: "Connaught Place", severity: "HIGH", type: "COMMERCIAL" },
      { name: "Delhi Airport T3", severity: "HIGH", type: "AIRPORT" },
      { name: "Ring Road Delhi", severity: "HIGH", type: "HIGHWAY" },
      { name: "ITO Intersection", severity: "HIGH", type: "JUNCTION" }
    ]
  },

  "Jammu and Kashmir": {
    code: "JK",
    capital: "Srinagar (Summer), Jammu (Winter)",
    type: "union_territory",
    coordinates: { lat: 34.0837, lng: 74.7973 },
    bounds: { 
      north: 37.0841, south: 32.2689, 
      east: 80.3094, west: 72.5000 
    },
    population: 12267032,
    area: 42241,
    districts: 20,
    majorCities: [
      { name: "Srinagar", lat: 34.0837, lng: 74.7973, population: 1273312 },
      { name: "Jammu", lat: 32.7266, lng: 74.8570, population: 651826 },
      { name: "Anantnag", lat: 33.7311, lng: 75.1480, population: 159838 }
    ],
    trafficHotspots: [
      { name: "Srinagar Lal Chowk", severity: "MEDIUM", type: "COMMERCIAL" },
      { name: "Jammu Railway Station", severity: "MEDIUM", type: "TRANSPORT" },
      { name: "Srinagar-Jammu Highway", severity: "MEDIUM", type: "HIGHWAY" }
    ]
  },

  "Ladakh": {
    code: "LA",
    capital: "Leh",
    type: "union_territory",
    coordinates: { lat: 34.1526, lng: 77.5770 },
    bounds: { 
      north: 36.0000, south: 32.0000, 
      east: 80.1300, west: 75.0000 
    },
    population: 274000,
    area: 59146,
    districts: 2,
    majorCities: [
      { name: "Leh", lat: 34.1642, lng: 77.5840, population: 30870 },
      { name: "Kargil", lat: 34.5539, lng: 76.1313, population: 10887 }
    ],
    trafficHotspots: [
      { name: "Leh Main Bazaar", severity: "LOW", type: "TOURIST" },
      { name: "Manali-Leh Highway", severity: "LOW", type: "HIGHWAY" }
    ]
  },

  "Lakshadweep": {
    code: "LD",
    capital: "Kavaratti",
    type: "union_territory",
    coordinates: { lat: 10.5667, lng: 72.6417 },
    bounds: { 
      north: 12.2833, south: 8.0000, 
      east: 74.0000, west: 71.0000 
    },
    population: 64473,
    area: 32,
    districts: 1,
    majorCities: [
      { name: "Kavaratti", lat: 10.5669, lng: 72.6420, population: 11210 }
    ],
    trafficHotspots: [
      { name: "Kavaratti Island Roads", severity: "LOW", type: "ISLAND" }
    ]
  },

  "Puducherry": {
    code: "PY",
    capital: "Puducherry",
    type: "union_territory",
    coordinates: { lat: 11.9416, lng: 79.8083 },
    bounds: { 
      north: 12.0500, south: 11.7500, 
      east: 79.8700, west: 79.7500 
    },
    population: 1247953,
    area: 492,
    districts: 4,
    majorCities: [
      { name: "Puducherry", lat: 11.9416, lng: 79.8083, population: 657209 },
      { name: "Karaikal", lat: 10.9254, lng: 79.8380, population: 86838 },
      { name: "Mahe", lat: 11.7000, lng: 75.5340, population: 41816 },
      { name: "Yanam", lat: 16.7333, lng: 82.2167, population: 32000 }
    ],
    trafficHotspots: [
      { name: "Puducherry Beach Road", severity: "MEDIUM", type: "TOURIST" },
      { name: "Puducherry White Town", severity: "MEDIUM", type: "HERITAGE" }
    ]
  }
};

// Export the main data object
export { indiaStatesData };

// Helper functions for data access
export const getStateByCode = (code) => {
  return Object.entries(indiaStatesData).find(([name, data]) => data.code === code);
};

export const getStatesByType = (type) => {
  return Object.entries(indiaStatesData).filter(([name, data]) => data.type === type);
};

export const getAllStates = () => {
  return getStatesByType('state');
};

export const getAllUnionTerritories = () => {
  return getStatesByType('union_territory');
};

export const searchStatesByName = (searchTerm) => {
  const term = searchTerm.toLowerCase();
  return Object.entries(indiaStatesData).filter(([name, data]) => 
    name.toLowerCase().includes(term) || 
    data.capital.toLowerCase().includes(term) ||
    data.majorCities.some(city => city.name.toLowerCase().includes(term))
  );
};

export const getTrafficHotspotsByState = (stateName) => {
  const state = indiaStatesData[stateName];
  return state ? state.trafficHotspots : [];
};

export const getAllTrafficHotspots = () => {
  const hotspots = [];
  Object.entries(indiaStatesData).forEach(([stateName, stateData]) => {
    stateData.trafficHotspots.forEach(hotspot => {
      hotspots.push({
        ...hotspot,
        state: stateName,
        stateCode: stateData.code
      });
    });
  });
  return hotspots;
};

export const getStatesInBounds = (bounds) => {
  const { north, south, east, west } = bounds;
  return Object.entries(indiaStatesData).filter(([name, data]) => {
    const stateBounds = data.bounds;
    return (
      stateBounds.south <= north &&
      stateBounds.north >= south &&
      stateBounds.west <= east &&
      stateBounds.east >= west
    );
  });
};