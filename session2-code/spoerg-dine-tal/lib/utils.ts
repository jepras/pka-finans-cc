import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const kr = (v: number) =>
  v.toLocaleString("da-DK", { maximumFractionDigits: 0 }) + " kr.";

export const tal = (v: number, decimaler = 0) =>
  v.toLocaleString("da-DK", { minimumFractionDigits: decimaler, maximumFractionDigits: decimaler });
