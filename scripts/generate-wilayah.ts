/**
 * Generate static wilayah (area) JSON files from idn-area-data package.
 *
 * Output structure in public/data/wilayah/:
 *   provinces.json
 *   regencies/{province_code}.json
 *   districts/{regency_code}.json
 *   villages/{regency_code}.json  (all villages in that regency, filter by district_code client-side)
 *
 * Run: npx tsx scripts/generate-wilayah.ts
 */

import { getProvinces, getRegencies, getDistricts, getVillages } from "idn-area-data";
import { mkdirSync, writeFileSync } from "fs";
import { join } from "path";

const OUT = join(process.cwd(), "public", "data", "wilayah");

function titleCase(str: string): string {
  return str
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

async function main() {
  console.log("Generating wilayah data...\n");

  // 1. Provinces
  const provinces = await getProvinces();
  const provList = provinces
    .map((p) => ({ id: p.code, name: titleCase(p.name) }))
    .sort((a, b) => a.name.localeCompare(b.name));

  mkdirSync(OUT, { recursive: true });
  writeFileSync(join(OUT, "provinces.json"), JSON.stringify(provList));
  console.log(`  provinces.json (${provList.length} items)`);

  // 2. Regencies grouped by province
  const allRegencies = await getRegencies();
  const regByProv = new Map<string, { id: string; name: string }[]>();
  for (const r of allRegencies) {
    const list = regByProv.get(r.province_code) || [];
    list.push({ id: r.code, name: titleCase(r.name) });
    regByProv.set(r.province_code, list);
  }

  const regDir = join(OUT, "regencies");
  mkdirSync(regDir, { recursive: true });
  let regFileCount = 0;
  for (const [provCode, regs] of regByProv) {
    regs.sort((a, b) => a.name.localeCompare(b.name));
    writeFileSync(join(regDir, `${provCode}.json`), JSON.stringify(regs));
    regFileCount++;
  }
  console.log(`  regencies/ (${regFileCount} files, ${allRegencies.length} total items)`);

  // 2b. Flat list of all regency names for city filter
  const allRegencyNames = allRegencies
    .map((r) => titleCase(r.name))
    .sort((a, b) => a.localeCompare(b));
  writeFileSync(join(OUT, "all-regencies.json"), JSON.stringify(allRegencyNames));
  console.log(`  all-regencies.json (${allRegencyNames.length} items)`);

  // 3. Districts grouped by regency
  const allDistricts = await getDistricts();
  const distByReg = new Map<string, { id: string; name: string }[]>();
  for (const d of allDistricts) {
    const list = distByReg.get(d.regency_code) || [];
    list.push({ id: d.code, name: titleCase(d.name) });
    distByReg.set(d.regency_code, list);
  }

  const distDir = join(OUT, "districts");
  mkdirSync(distDir, { recursive: true });
  let distFileCount = 0;
  for (const [regCode, dists] of distByReg) {
    dists.sort((a, b) => a.name.localeCompare(b.name));
    writeFileSync(join(distDir, `${regCode}.json`), JSON.stringify(dists));
    distFileCount++;
  }
  console.log(`  districts/ (${distFileCount} files, ${allDistricts.length} total items)`);

  // 4. Villages grouped by regency (not by district — keeps file count manageable)
  //    Client filters by district_code prefix.
  const allVillages = await getVillages();
  const vilByReg = new Map<string, { id: string; d: string; name: string }[]>();
  for (const v of allVillages) {
    // district_code is like "32.01.01", regency_code is "32.01"
    const regCode = v.district_code.split(".").slice(0, 2).join(".");
    const list = vilByReg.get(regCode) || [];
    list.push({ id: v.code, d: v.district_code, name: titleCase(v.name) });
    vilByReg.set(regCode, list);
  }

  const vilDir = join(OUT, "villages");
  mkdirSync(vilDir, { recursive: true });
  let vilFileCount = 0;
  for (const [regCode, vils] of vilByReg) {
    vils.sort((a, b) => a.name.localeCompare(b.name));
    writeFileSync(join(vilDir, `${regCode}.json`), JSON.stringify(vils));
    vilFileCount++;
  }
  console.log(`  villages/ (${vilFileCount} files, ${allVillages.length} total items)`);

  console.log(`\nDone! Files written to public/data/wilayah/`);
}

main().catch(console.error);
