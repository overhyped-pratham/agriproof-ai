/**
 * onboardService.ts
 * Data abstraction for the farmer onboarding wizard.
 * Uses sessionStorage so data persists across steps but clears on tab close.
 */

export type FarmerLocation = {
  lat: number;
  lon: number;
  label: string;
};

export type FarmerSession = {
  location: FarmerLocation | null;
  selectedFarmIds: string[];
  cropSelections: Record<string, string[]>;
};

const KEY = "agriproof_onboard_session";

export const AVAILABLE_CROPS = [
  "Wheat","Soybean","Cotton","Rice","Maize","Sugarcane","Groundnut","Mustard",
];

function emptySession(): FarmerSession {
  return { location: null, selectedFarmIds: [], cropSelections: {} };
}

export const onboardService = {
  get(): FarmerSession {
    try {
      const raw = sessionStorage.getItem(KEY);
      return raw ? JSON.parse(raw) : emptySession();
    } catch { return emptySession(); }
  },
  save(session: FarmerSession): void {
    sessionStorage.setItem(KEY, JSON.stringify(session));
  },
  setLocation(location: FarmerLocation): void {
    const s = this.get(); this.save({ ...s, location });
  },
  toggleFarm(farmId: string): void {
    const s = this.get();
    const already = s.selectedFarmIds.includes(farmId);
    const selectedFarmIds = already
      ? s.selectedFarmIds.filter((id) => id !== farmId)
      : [...s.selectedFarmIds, farmId];
    this.save({ ...s, selectedFarmIds });
  },
  setCrops(farmId: string, crops: string[]): void {
    const s = this.get();
    this.save({ ...s, cropSelections: { ...s.cropSelections, [farmId]: crops } });
  },
  clear(): void { sessionStorage.removeItem(KEY); },

  async reverseGeocode(lat: number, lon: number): Promise<string> {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=10&addressdetails=1`,
        { headers: { "Accept-Language": "en" } }
      );
      if (!res.ok) throw new Error("fail");
      const data = await res.json();
      const addr = data.address || {};
      return addr.village || addr.town || addr.city || addr.county || addr.state_district || addr.state || `${lat.toFixed(4)}, ${lon.toFixed(4)}`;
    } catch {
      return `${lat.toFixed(4)}, ${lon.toFixed(4)}`;
    }
  },
};
