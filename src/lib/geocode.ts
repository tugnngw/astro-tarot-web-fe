// Tra cứu nơi sinh ra toạ độ.
//
// Backend bắt buộc có latitude/longitude để tính bản đồ sao, mà người dùng thì
// chỉ biết tên nơi mình sinh ra. Tách khỏi routes/tarot.tsx để trang sửa hồ sơ
// chiêm tinh dùng lại đúng một cách tra cứu — hai nơi tự tra theo hai kiểu thì
// sớm muộn cùng một địa danh lại ra hai toạ độ khác nhau.

export interface PlaceSuggestion {
  displayName: string;
  lat: number;
  lng: number;
  placeId: string;
}

/**
 * Gợi ý địa danh từ OpenStreetMap Nominatim.
 *
 * Trả mảng rỗng thay vì ném lỗi: đây là tính năng phụ trợ, mạng hỏng thì người
 * dùng vẫn phải gõ tay được nơi sinh chứ không nên thấy màn hình lỗi.
 */
export async function searchPlaces(query: string): Promise<PlaceSuggestion[]> {
  if (!query || query.trim().length < 2) return [];

  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
        query,
      )}&format=json&limit=5&countrycodes=vn&accept-language=vi`,
      { headers: { "User-Agent": "ASTROTAROT/1.0 (https://astrotarot.vn)" } },
    );
    if (!res.ok) return [];

    const data = (await res.json()) as Array<{
      display_name: string;
      lat: string;
      lon: string;
      place_id: number | string;
    }>;

    return (data ?? []).map((item) => ({
      displayName: item.display_name,
      lat: Number.parseFloat(item.lat),
      lng: Number.parseFloat(item.lon),
      placeId: String(item.place_id),
    }));
  } catch (e) {
    console.error("Tra cứu địa danh hỏng:", e);
    return [];
  }
}
