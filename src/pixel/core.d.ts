import type { Crop, Grid } from './types';
export function toSVG(g: Grid, crop?: Crop, label?: string): string;
export const ICONS: Record<string, string[]>;
export function iconGrid(name: string, c?: string, ink?: string): Grid;
