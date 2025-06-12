import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(timestamp: string) {
  try {
    let date: Date;
    // If it's all digits, treat as Unix timestamp (seconds)
    if (/^\d+$/.test(timestamp)) {
      date = new Date(Number(timestamp) * 1000);
    } else {
      date = new Date(timestamp);
    }
    if (isNaN(date.getTime())) throw new Error("Invalid date");
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch (error) {
    return "Date unavailable";
  }
}

export interface FormattedMediaType {
  type: string;
  format: string | null;
}

export function formatMediaType(
  mediaType: string | undefined
): FormattedMediaType {
  if (!mediaType) {
    return { type: "IMAGE", format: null };
  }

  // If there's no slash, the whole string is the type
  if (!mediaType.includes("/")) {
    return {
      type: mediaType.toUpperCase(),
      format: null,
    };
  }

  // Split into type and format
  const [type, format] = mediaType.split("/");
  return {
    type: type.toUpperCase(),
    format: format ? format.toUpperCase() : null,
  };
}
