"use client";

import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";

const BASE = "/data/wilayah";

interface Area {
  id: string;
  name: string;
}

interface Village {
  id: string;
  d: string; // district_code
  name: string;
}

export interface AreaSelection {
  province: string;
  city: string;
  district: string;
  village?: string;
  full: string;
}

interface AreaSelectorProps {
  onSelect: (area: AreaSelection) => void;
}

async function fetchJson<T>(path: string): Promise<T> {
  const res = await fetch(path);
  return res.json();
}

export function AreaSelector({ onSelect }: AreaSelectorProps) {
  const [provinces, setProvinces] = useState<Area[]>([]);
  const [cities, setCities] = useState<Area[]>([]);
  const [districts, setDistricts] = useState<Area[]>([]);
  const [villages, setVillages] = useState<Area[]>([]);

  // raw village data for the current regency (filtered client-side by district)
  const [rawVillages, setRawVillages] = useState<Village[]>([]);

  const [provinceId, setProvinceId] = useState("");
  const [cityId, setCityId] = useState("");
  const [districtId, setDistrictId] = useState("");
  const [villageId, setVillageId] = useState("");

  const [loadingProvinces, setLoadingProvinces] = useState(true);
  const [loadingCities, setLoadingCities] = useState(false);
  const [loadingDistricts, setLoadingDistricts] = useState(false);
  const [loadingVillages, setLoadingVillages] = useState(false);

  // Fetch provinces on mount
  useEffect(() => {
    fetchJson<Area[]>(`${BASE}/provinces.json`)
      .then(setProvinces)
      .catch(() => setProvinces([]))
      .finally(() => setLoadingProvinces(false));
  }, []);

  // Fetch cities when province changes
  useEffect(() => {
    if (!provinceId) {
      setCities([]);
      setCityId("");
      setDistricts([]);
      setDistrictId("");
      setRawVillages([]);
      setVillages([]);
      setVillageId("");
      return;
    }
    setLoadingCities(true);
    setCityId("");
    setDistricts([]);
    setDistrictId("");
    setRawVillages([]);
    setVillages([]);
    setVillageId("");
    fetchJson<Area[]>(`${BASE}/regencies/${provinceId}.json`)
      .then(setCities)
      .catch(() => setCities([]))
      .finally(() => setLoadingCities(false));
  }, [provinceId]);

  // Fetch districts + raw villages when city changes
  useEffect(() => {
    if (!cityId) {
      setDistricts([]);
      setDistrictId("");
      setRawVillages([]);
      setVillages([]);
      setVillageId("");
      return;
    }
    setLoadingDistricts(true);
    setDistrictId("");
    setVillages([]);
    setVillageId("");

    // Fetch districts and raw villages in parallel
    Promise.all([
      fetchJson<Area[]>(`${BASE}/districts/${cityId}.json`),
      fetchJson<Village[]>(`${BASE}/villages/${cityId}.json`).catch(() => [] as Village[]),
    ])
      .then(([dists, vils]) => {
        setDistricts(dists);
        setRawVillages(vils);
      })
      .catch(() => {
        setDistricts([]);
        setRawVillages([]);
      })
      .finally(() => setLoadingDistricts(false));
  }, [cityId]);

  // Filter villages client-side when district changes
  useEffect(() => {
    if (!districtId) {
      setVillages([]);
      setVillageId("");
      return;
    }
    setLoadingVillages(true);
    setVillageId("");
    const filtered = rawVillages
      .filter((v) => v.d === districtId)
      .map((v) => ({ id: v.id, name: v.name }));
    setVillages(filtered);
    setLoadingVillages(false);
  }, [districtId, rawVillages]);

  // Notify parent when district is selected (village is optional)
  useEffect(() => {
    if (!districtId) return;
    const province = provinces.find((p) => p.id === provinceId);
    const city = cities.find((c) => c.id === cityId);
    const district = districts.find((d) => d.id === districtId);
    const village = villageId ? villages.find((v) => v.id === villageId) : undefined;
    if (province && city && district) {
      const parts = [
        village?.name,
        district.name,
        city.name,
        province.name,
      ].filter(Boolean);
      onSelect({
        province: province.name,
        city: city.name,
        district: district.name,
        village: village?.name,
        full: parts.join(", "),
      });
    }
  }, [districtId, villageId, provinceId, cityId, provinces, cities, districts, villages, onSelect]);

  const selectClass =
    "w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 outline-none h-10 disabled:opacity-50 disabled:cursor-not-allowed";

  return (
    <div className="space-y-3">
      {/* Province */}
      <div className="space-y-1.5">
        <label className="text-sm font-semibold text-bark">Provinsi</label>
        <div className="relative">
          <select
            value={provinceId}
            onChange={(e) => setProvinceId(e.target.value)}
            disabled={loadingProvinces}
            className={selectClass}
          >
            <option value="">
              {loadingProvinces ? "Memuat..." : "Pilih provinsi..."}
            </option>
            {provinces.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
          {loadingProvinces && (
            <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-warm-gray animate-spin" />
          )}
        </div>
      </div>

      {/* City */}
      <div className="space-y-1.5">
        <label className="text-sm font-semibold text-bark">Kota / Kabupaten</label>
        <div className="relative">
          <select
            value={cityId}
            onChange={(e) => setCityId(e.target.value)}
            disabled={!provinceId || loadingCities}
            className={selectClass}
          >
            <option value="">
              {loadingCities ? "Memuat..." : !provinceId ? "Pilih provinsi dulu" : "Pilih kota/kabupaten..."}
            </option>
            {cities.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          {loadingCities && (
            <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-warm-gray animate-spin" />
          )}
        </div>
      </div>

      {/* District */}
      <div className="space-y-1.5">
        <label className="text-sm font-semibold text-bark">Kecamatan</label>
        <div className="relative">
          <select
            value={districtId}
            onChange={(e) => setDistrictId(e.target.value)}
            disabled={!cityId || loadingDistricts}
            className={selectClass}
          >
            <option value="">
              {loadingDistricts ? "Memuat..." : !cityId ? "Pilih kota dulu" : "Pilih kecamatan..."}
            </option>
            {districts.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
          {loadingDistricts && (
            <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-warm-gray animate-spin" />
          )}
        </div>
      </div>

      {/* Village (optional) */}
      <div className="space-y-1.5">
        <label className="text-sm font-semibold text-bark">
          Kelurahan / Desa
          <span className="ml-1 text-xs font-normal text-warm-gray">(opsional)</span>
        </label>
        <div className="relative">
          <select
            value={villageId}
            onChange={(e) => setVillageId(e.target.value)}
            disabled={!districtId || loadingVillages}
            className={selectClass}
          >
            <option value="">
              {loadingVillages ? "Memuat..." : !districtId ? "Pilih kecamatan dulu" : "Pilih kelurahan..."}
            </option>
            {villages.map((v) => (
              <option key={v.id} value={v.id}>
                {v.name}
              </option>
            ))}
          </select>
          {loadingVillages && (
            <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-warm-gray animate-spin" />
          )}
        </div>
      </div>
    </div>
  );
}
