/**
 * Official Bhu-Aadhaar 14-Digit Alphanumeric ULPIN Helper.
 * Requirement: Exactly 14 alphanumeric characters (A-Z, 0-9), strictly unique.
 * 
 * Layout (14 Characters):
 * - [0:2]   State: 'UP' (2 chars)
 * - [2:6]   District / Geo-Zone Code: '2110' (4 chars, Prayagraj PIN prefix)
 * - [6:9]   Building / Parcel Block: 'B01' .. 'B99' (3 chars)
 * - [9:11]  Floor / Level: '01' .. '99', '00' for ground, 'B1' for basement (2 chars)
 * - [11:14] Unit / Sub-Property: 'A01' .. 'Z99', 'P01', '001' (3 chars)
 * 
 * Example: UP2110B0103A01 (14 alphanumeric characters)
 */

export function isValid14DigitUlpin(ulpin: string): boolean {
  if (!ulpin || typeof ulpin !== 'string') return false;
  return /^[A-Z0-9]{14}$/.test(ulpin.trim().toUpperCase());
}

export function format14DigitUlpin(
  buildingId: string,
  floorId: string,
  propertyId: string,
  stateCode = 'UP',
  zoneCode = '2110'
): string {
  const state = stateCode.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 2).padEnd(2, 'X');
  const zone = zoneCode.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 4).padEnd(4, '0');

  // Building: 3 chars (e.g. B001 -> B01, P001 -> P01)
  const bClean = String(buildingId || 'B001').trim();
  const bNums = bClean.match(/\d+/);
  const bNum = bNums ? parseInt(bNums[0], 10) : 1;
  const bPrefix = bClean[0] && /[A-Za-z]/.test(bClean[0]) ? bClean[0].toUpperCase() : 'B';
  const bldgPart = `${bPrefix}${String(bNum).padStart(2, '0')}`.slice(0, 3);

  // Floor: 2 chars (e.g. F03 -> 03, B001-F03 -> 03, B1 -> B1)
  const fClean = String(floorId || 'F01').trim().toUpperCase().split('-').pop() || '01';
  const fNums = fClean.match(/\d+/);
  const fNum = fNums ? parseInt(fNums[0], 10) : 1;
  let floorPart: string;
  if (fClean.includes('B') && !fClean.startsWith('B00')) {
    floorPart = `B${Math.min(fNum, 9)}`;
  } else {
    floorPart = String(fNum).padStart(2, '0').slice(0, 2);
  }

  // Unit: 3 chars
  const pClean = String(propertyId || 'P01').replace(/[^A-Za-z0-9]/g, '').toUpperCase();
  let unitPart = 'P01';
  if (pClean.includes('APTA') || pClean.endsWith('A')) {
    unitPart = 'A01';
  } else if (pClean.includes('APTB') || pClean.endsWith('B')) {
    unitPart = 'A02';
  } else if (pClean.includes('APTC') || pClean.endsWith('C')) {
    unitPart = 'A03';
  } else if (pClean.includes('APTD') || pClean.endsWith('D')) {
    unitPart = 'A04';
  } else {
    const pNums = pClean.match(/\d+/);
    if (pNums) {
      const num = parseInt(pNums[0], 10);
      const firstChar = /[A-Z]/.test(pClean[0]) ? pClean[0] : 'P';
      unitPart = `${firstChar}${String(num).padStart(2, '0')}`.slice(0, 3);
    } else {
      unitPart = pClean.slice(0, 3).padEnd(3, '1');
    }
  }

  let candidate = `${state}${zone}${bldgPart}${floorPart}${unitPart}`.toUpperCase();
  if (candidate.length > 14) candidate = candidate.slice(0, 14);
  if (candidate.length < 14) candidate = candidate.padEnd(14, '0');
  return candidate;
}

export function generateUnique14DigitUlpin(
  existingUlpins: string[],
  buildingId: string,
  floorId: string,
  propertyId: string
): string {
  const base = format14DigitUlpin(buildingId, floorId, propertyId);
  const upperExisting = new Set(existingUlpins.map(u => u.trim().toUpperCase()));

  if (!upperExisting.has(base)) {
    return base;
  }

  // Collision resolution: cycle last 2 digits
  const prefix12 = base.slice(0, 12);
  for (let seq = 1; seq <= 99; seq++) {
    const candidate = `${prefix12}${String(seq).padStart(2, '0')}`;
    if (!upperExisting.has(candidate)) {
      return candidate;
    }
  }

  // Random base36 fallback
  const salt = Math.floor(Math.random() * 1296).toString(36).padStart(2, '0').toUpperCase();
  return `${prefix12}${salt}`;
}
