// src/api/astrology.ts
import { apiFetch } from "./client";

// ============================================================
// TYPES - Khớp với BE DTOs
// ============================================================

export type ProfileType = "SELF" | "OTHER" | "COUPLE";

export interface AstrologyProfile {
    id: string;
    title: string;
    targetName: string | null;
    birthDate: string;        // YYYY-MM-DD
    birthTime: string | null; // HH:mm:ss
    birthPlace: string;
    latitude: number | null;
    longitude: number | null;
    timezone: string | null;
    profileType: ProfileType;
    isPrimary: boolean;
}

// ============================================================
// REQUEST DTOs
// ============================================================

export interface CreateAstrologyProfileRequest {
    title: string;
    targetName?: string;
    birthDate: string;        // YYYY-MM-DD
    birthTime?: string;       // HH:mm:ss
    birthPlace: string;
    latitude: number;
    longitude: number;
    timezone?: string;
    profileType: ProfileType;
    isPrimary?: boolean;
}

export interface UpdateAstrologyProfileRequest {
    title?: string;
    targetName?: string;
    birthDate?: string;
    birthTime?: string;
    birthPlace?: string;
    latitude?: number;
    longitude?: number;
    timezone?: string;
    profileType?: ProfileType;
    isPrimary?: boolean;
}

// ============================================================
// API FUNCTIONS
// ============================================================

/**
 * Tạo mới profile chiêm tinh
 * POST /api/me/astrology/profiles
 */
export async function createAstrologyProfile(
    data: CreateAstrologyProfileRequest
): Promise<AstrologyProfile> {
    return apiFetch<AstrologyProfile>("/api/me/astrology/profiles", {
        method: "POST",
        body: JSON.stringify(data),
    });
}

/**
 * Lấy tất cả profile của user
 * GET /api/me/astrology/profiles
 */
export async function getAstrologyProfiles(): Promise<AstrologyProfile[]> {
    return apiFetch<AstrologyProfile[]>("/api/me/astrology/profiles", {
        method: "GET",
    });
}

/**
 * Lấy profile chính (primary)
 * GET /api/me/astrology/profiles/primary
 */
export async function getPrimaryAstrologyProfile(): Promise<AstrologyProfile> {
    return apiFetch<AstrologyProfile>("/api/me/astrology/profiles/primary", {
        method: "GET",
    });
}

/**
 * Cập nhật profile
 * PUT /api/me/astrology/profiles/{profileId}
 */
export async function updateAstrologyProfile(
    profileId: string,
    data: UpdateAstrologyProfileRequest
): Promise<AstrologyProfile> {
    return apiFetch<AstrologyProfile>(`/api/me/astrology/profiles/${profileId}`, {
        method: "PUT",
        body: JSON.stringify(data),
    });
}

/**
 * Xóa profile
 * DELETE /api/me/astrology/profiles/{profileId}
 */
export async function deleteAstrologyProfile(profileId: string): Promise<void> {
    return apiFetch<void>(`/api/me/astrology/profiles/${profileId}`, {
        method: "DELETE",
    });
}