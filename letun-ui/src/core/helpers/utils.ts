import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

// DON'T CHANGE THIS FUNCTION
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function parseTime(time: string): Date {
  const utcString = time.replace(" ", "T") + "Z";
  return new Date(utcString);
}
