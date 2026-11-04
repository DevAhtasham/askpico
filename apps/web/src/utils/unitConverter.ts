export type UnitCategory = 'length' | 'mass' | 'data' | 'temperature';

// Factor to the base unit of each category (base: m, kg, byte). Temperature is handled separately.
const factors: Record<UnitCategory, Record<string, number>> = {
  length: { m: 1, km: 1000, cm: 0.01, mm: 0.001, mi: 1609.344, ft: 0.3048, in: 0.0254 },
  mass: { kg: 1, g: 0.001, mg: 0.000001, lb: 0.45359237, oz: 0.028349523125 },
  data: { B: 1, KB: 1024, MB: 1024 ** 2, GB: 1024 ** 3, TB: 1024 ** 4 },
  temperature: { C: 1, F: 1, K: 1 },
};

export const unitsFor = (category: UnitCategory): string[] => Object.keys(factors[category]);

const toCelsius = (value: number, unit: string): number => {
  if (unit === 'F') return ((value - 32) * 5) / 9;
  if (unit === 'K') return value - 273.15;
  return value;
};

const fromCelsius = (value: number, unit: string): number => {
  if (unit === 'F') return (value * 9) / 5 + 32;
  if (unit === 'K') return value + 273.15;
  return value;
};

export const convert = (
  category: UnitCategory,
  value: number,
  from: string,
  to: string
): number => {
  if (category === 'temperature') return fromCelsius(toCelsius(value, from), to);
  const table = factors[category];
  return (value * table[from]) / table[to];
};
