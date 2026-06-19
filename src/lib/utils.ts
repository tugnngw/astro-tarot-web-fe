// src/lib/utils.ts
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Chuyển đổi nhiều định dạng ngày sang YYYY-MM-DD (ISO)
 * Hỗ trợ: DD/MM/YYYY, DD-MM-YYYY, DDMMYYYY, YYYY-MM-DD
 */
export function convertToISODate(dateStr: string): string {
  if (!dateStr) return "";

  // Remove all non-numeric characters except hyphens and slashes
  const clean = dateStr.replace(/[^0-9/-]/g, "");

  // Nếu đã ở định dạng YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(clean)) {
    return clean;
  }

  // Nếu ở định dạng DD/MM/YYYY
  if (clean.includes("/")) {
    const parts = clean.split("/");
    if (parts.length === 3) {
      const day = parts[0].padStart(2, "0");
      const month = parts[1].padStart(2, "0");
      const year = parts[2];
      const fullYear = year.length === 2 ? `20${year}` : year;
      return `${fullYear}-${month}-${day}`;
    }
  }

  // Nếu ở định dạng DD-MM-YYYY
  if (clean.includes("-")) {
    const parts = clean.split("-");
    if (parts.length === 3) {
      const day = parts[0].padStart(2, "0");
      const month = parts[1].padStart(2, "0");
      const year = parts[2];
      const fullYear = year.length === 2 ? `20${year}` : year;
      return `${fullYear}-${month}-${day}`;
    }
  }

  // Nếu ở định dạng DDMMYYYY (8 số liên tiếp)
  if (/^\d{8}$/.test(clean)) {
    const day = clean.substring(0, 2);
    const month = clean.substring(2, 4);
    const year = clean.substring(4, 8);
    return `${year}-${month}-${day}`;
  }

  // Nếu ở định dạng DDMMYY (6 số)
  if (/^\d{6}$/.test(clean)) {
    const day = clean.substring(0, 2);
    const month = clean.substring(2, 4);
    const year = `20${clean.substring(4, 6)}`;
    return `${year}-${month}-${day}`;
  }

  // Fallback: trả về nguyên bản
  return dateStr;
}

/**
 * Chuyển đổi nhiều định dạng giờ sang HH:mm:ss
 * Hỗ trợ: HH:mm, HH:mm:ss, HHmm, HHmmss, Hmm
 */
export function convertToISOTime(timeStr: string): string | undefined {
  if (!timeStr) return undefined;

  // Remove all non-numeric characters
  const clean = timeStr.replace(/[^0-9]/g, "");

  // Nếu đã ở định dạng HH:mm:ss
  if (/^\d{2}:\d{2}:\d{2}$/.test(timeStr)) {
    return timeStr;
  }

  // Nếu ở định dạng HH:mm
  if (/^\d{2}:\d{2}$/.test(timeStr)) {
    return `${timeStr}:00`;
  }

  // Nếu ở định dạng HHmmss (6 số)
  if (clean.length === 6) {
    const hour = clean.substring(0, 2);
    const minute = clean.substring(2, 4);
    const second = clean.substring(4, 6);
    return `${hour}:${minute}:${second}`;
  }

  // Nếu ở định dạng HHmm (4 số)
  if (clean.length === 4) {
    const hour = clean.substring(0, 2);
    const minute = clean.substring(2, 4);
    return `${hour}:${minute}:00`;
  }

  // Nếu ở định dạng Hmm (3 số, ví dụ: 900 -> 09:00)
  if (clean.length === 3) {
    const hour = clean.substring(0, 1).padStart(2, "0");
    const minute = clean.substring(1, 3);
    return `${hour}:${minute}:00`;
  }

  // Nếu ở định dạng HH (2 số)
  if (clean.length === 2) {
    return `${clean}:00:00`;
  }

  // Nếu ở định dạng H (1 số)
  if (clean.length === 1) {
    return `0${clean}:00:00`;
  }

  return undefined;
}

/**
 * Lấy timezone hiện tại của user
 */
export function getUserTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch {
    return "Asia/Ho_Chi_Minh";
  }
}