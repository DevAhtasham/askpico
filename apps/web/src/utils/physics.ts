export interface PhysicsConstant {
  name: string;
  symbol: string;
  value: number;
  unit: string;
}

export const physicsConstants: PhysicsConstant[] = [
  { name: 'Speed of light (vacuum)', symbol: 'c', value: 299792458, unit: 'm/s' },
  { name: 'Planck constant', symbol: 'h', value: 6.62607015e-34, unit: 'J·s' },
  { name: 'Reduced Planck constant', symbol: 'ħ', value: 1.054571817e-34, unit: 'J·s' },
  { name: 'Gravitational constant', symbol: 'G', value: 6.67430e-11, unit: 'm³/(kg·s²)' },
  { name: 'Elementary charge', symbol: 'e', value: 1.602176634e-19, unit: 'C' },
  { name: 'Electron mass', symbol: 'mₑ', value: 9.1093837015e-31, unit: 'kg' },
  { name: 'Proton mass', symbol: 'mₚ', value: 1.67262192369e-27, unit: 'kg' },
  { name: 'Boltzmann constant', symbol: 'k', value: 1.380649e-23, unit: 'J/K' },
  { name: 'Avogadro constant', symbol: 'Nₐ', value: 6.02214076e23, unit: '1/mol' },
  { name: 'Gas constant', symbol: 'R', value: 8.314462618, unit: 'J/(mol·K)' },
  { name: 'Vacuum permittivity', symbol: 'ε₀', value: 8.8541878128e-12, unit: 'F/m' },
  { name: 'Vacuum permeability', symbol: 'μ₀', value: 1.25663706212e-6, unit: 'N/A²' },
  { name: 'Standard gravity', symbol: 'g', value: 9.80665, unit: 'm/s²' },
];

export type FormulaId = 'ohm' | 'kinematic_v' | 'kinetic_energy' | 'newton_force';

export interface FormulaDefinition {
  id: FormulaId;
  label: string;
  inputs: { key: string; label: string }[];
  output: { key: string; label: string; unit: string };
  compute: (values: Record<string, number>) => number;
}

export const formulas: FormulaDefinition[] = [
  {
    id: 'ohm',
    label: "Ohm's law (V = I × R)",
    inputs: [
      { key: 'I', label: 'Current I (A)' },
      { key: 'R', label: 'Resistance R (Ω)' },
    ],
    output: { key: 'V', label: 'Voltage V', unit: 'V' },
    compute: ({ I, R }) => I * R,
  },
  {
    id: 'kinematic_v',
    label: 'Kinematics (v = u + a × t)',
    inputs: [
      { key: 'u', label: 'Initial velocity u (m/s)' },
      { key: 'a', label: 'Acceleration a (m/s²)' },
      { key: 't', label: 'Time t (s)' },
    ],
    output: { key: 'v', label: 'Final velocity v', unit: 'm/s' },
    compute: ({ u, a, t }) => u + a * t,
  },
  {
    id: 'kinetic_energy',
    label: 'Kinetic energy (KE = ½ m v²)',
    inputs: [
      { key: 'm', label: 'Mass m (kg)' },
      { key: 'v', label: 'Velocity v (m/s)' },
    ],
    output: { key: 'KE', label: 'Kinetic energy', unit: 'J' },
    compute: ({ m, v }) => 0.5 * m * v * v,
  },
  {
    id: 'newton_force',
    label: "Newton's second law (F = m × a)",
    inputs: [
      { key: 'm', label: 'Mass m (kg)' },
      { key: 'a', label: 'Acceleration a (m/s²)' },
    ],
    output: { key: 'F', label: 'Force F', unit: 'N' },
    compute: ({ m, a }) => m * a,
  },
];
