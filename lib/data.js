export const businessData = {
  Restaurant: { searchVolume: 15000, avgCtrTop3: 0.35 },
  Plumber: { searchVolume: 2500, avgCtrTop3: 0.48 },
  HVAC: { searchVolume: 1000, avgCtrTop3: 0.47 },
  Electrician: { searchVolume: 600, avgCtrTop3: 0.47 },
  Roofer: { searchVolume: 500, avgCtrTop3: 0.48 },
  Dentist: { searchVolume: 2200, avgCtrTop3: 0.42 },
  'Lawyer (General/PI)': { searchVolume: 300, avgCtrTop3: 0.4 },
  'Real Estate Agent': { searchVolume: 1400, avgCtrTop3: 0.38 },
  'Mechanic / Auto Repair': { searchVolume: 500, avgCtrTop3: 0.45 },
  Hotel: { searchVolume: 6000, avgCtrTop3: 0.36 },
  'Landscaper / Lawn Care': { searchVolume: 500, avgCtrTop3: 0.45 },
  Handyman: { searchVolume: 400, avgCtrTop3: 0.46 },
  'Pest Control': { searchVolume: 400, avgCtrTop3: 0.47 },
  'Gym / Fitness Center': { searchVolume: 1000, avgCtrTop3: 0.4 },
  'Hair Salon': { searchVolume: 1400, avgCtrTop3: 0.42 },
  Pizza: { searchVolume: 3500, avgCtrTop3: 0.38 },
  'Car Wash': { searchVolume: 700, avgCtrTop3: 0.43 },
  Veterinarian: { searchVolume: 1100, avgCtrTop3: 0.44 },
  Chiropractor: { searchVolume: 300, avgCtrTop3: 0.43 },
  Painter: { searchVolume: 300, avgCtrTop3: 0.45 },
  'Insurance Agent': { searchVolume: 500, avgCtrTop3: 0.4 },
  Florist: { searchVolume: 500, avgCtrTop3: 0.42 },
  Locksmith: { searchVolume: 900, avgCtrTop3: 0.5 },
  'Cleaning Service': { searchVolume: 300, avgCtrTop3: 0.44 },
  'Tire Shop': { searchVolume: 850, avgCtrTop3: 0.45 },
  Pharmacy: { searchVolume: 900, avgCtrTop3: 0.4 },
  'Daycare / Childcare': { searchVolume: 1500, avgCtrTop3: 0.41 },
  'Waste Management': { searchVolume: 1300, avgCtrTop3: 0.46 },
  'Junk Removal': { searchVolume: 400, avgCtrTop3: 0.47 },
};

export const categories = Object.keys(businessData).sort();

// --- Assumptions for Revenue Calculation ---
export const clickToLeadRate = 0.1; // 10% of clicks become leads
export const leadToCustomerRate = 0.16; // 16% of leads become customers
