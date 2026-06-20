// src/routes/tarot.tsx
import { createFileRoute } from "@tanstack/react-router";
import { lazy, memo, Suspense, useCallback, useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Send, Sparkles, RotateCcw, Users, Search, ChevronLeft, ChevronRight, Loader2, Wand2, MapPin, Loader, Clock, Globe, Trash2 } from "lucide-react";
import { Header } from "@/components/Header";
import { StarField } from "@/components/StarField";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-context";
import { TAROT_DECK, getCardMeaning } from "@/lib/mock-data";
import { startAiTarotReading, type TarotReadingResult } from "@/api/tarot";
import { createAstrologyProfile } from "@/api/astrology";
import { convertToISODate, convertToISOTime, getUserTimezone } from "@/lib/utils";

const DrawStage = lazy(() => import("@/components/TarotDraw").then((m) => ({ default: m.TarotDraw })));

export const Route = createFileRoute("/tarot")({
  head: () => ({
    meta: [
      { title: "Tarot AI Reader — ASTROTAROT" },
      { name: "description", content: "Trò chuyện cùng AI Tarot cá nhân hoá dựa trên bản đồ sao của bạn." },
    ],
  }),
  component: TarotPageWithErrorBoundary,
});

interface ChatMessage { id: string; role: "user" | "ai"; content: string; ts: number }
interface Person {
  id: string;
  name: string;
  dob: string;
  birthTime: string;
  birthPlace: string;
  lat: number;
  lng: number;
  altitude: number;
  timezone: string;
  timezoneOffset: number;
}
type Stage = "info" | "chat";

interface Suggestion {
  displayName: string;
  lat: number;
  lng: number;
  placeId?: string;
}

interface TimezoneInfo {
  timezoneName: string;
  offset: number;
}

const MOCK_REPLIES = [
  "Vũ trụ đang gửi đến bạn những tín hiệu tích cực ✦ Hãy mở lòng đón nhận.",
  "Mình cảm nhận được năng lượng ấm áp từ cậu 🌙 — hãy tiếp tục giữ vững niềm tin.",
  "Đôi khi im lặng cũng là một câu trả lời. Hãy lắng nghe trái tim mình.",
  "Mỗi ngày mới là một cơ hội để bắt đầu lại. Cậu có điều gì muốn bắt đầu không?",
  "Hãy nhớ rằng, những điều tốt đẹp nhất thường đến khi ta ít ngờ tới nhất.",
  "Cậu đang làm rất tốt, đừng quá khắt khe với bản thân nhé.",
  "Nếu cậu muốn, mình có thể rút bài Tarot để xem thêm về tình hình của cậu.",
];

function storageKey(uid: string) { return `astrotarot_chat_${uid}`; }

// ============================================================
// CLEAN OLD SESSIONS - Xóa session cũ
// ============================================================
function cleanOldSessions(currentUid: string) {
  try {
    const currentKey = storageKey(currentUid);
    Object.keys(localStorage)
        .filter(key => key.startsWith('astrotarot_chat_') && key !== currentKey)
        .forEach(key => {
          console.log('🗑️ Removing old session:', key);
          localStorage.removeItem(key);
        });
  } catch (e) {
    console.warn('Failed to clean old sessions:', e);
  }
}

// ============================================================
// UUID GENERATOR
// ============================================================
function generateUUID(): string {
  try {
    if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
      const uuid = crypto.randomUUID();
      if (uuid && typeof uuid === "string" && uuid.length > 0) {
        return uuid;
      }
    }
  } catch (e) {
    console.warn('crypto.randomUUID() failed, using fallback', e);
  }

  const timestamp = Date.now().toString(36);
  const randomPart1 = Math.random().toString(36).substring(2, 10);

  let uuid = "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });

  return uuid + '-' + timestamp + '-' + randomPart1;
}

// ============================================================
// WRAPPER ERROR BOUNDARY
// ============================================================
function TarotPageWithErrorBoundary() {
  try {
    return <TarotPage />;
  } catch (error: any) {
    console.error('TarotPage error:', error);
    return (
        <div className="relative min-h-screen">
          <Header />
          <StarField count={30} />
          <div className="mx-auto max-w-4xl px-6 py-20 text-center">
            <h1 className="font-display text-3xl text-gradient-gold">Có lỗi xảy ra</h1>
            <p className="mt-4 text-muted-foreground">
              {error?.message || 'Vui lòng tải lại trang hoặc thử lại sau.'}
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <button
                  onClick={() => window.location.reload()}
                  className="rounded-full bg-gold px-6 py-2.5 text-sm font-medium text-primary-foreground glow-gold transition hover:scale-105"
              >
                Tải lại
              </button>
              <a
                  href="/"
                  className="rounded-full border border-gold/40 px-6 py-2.5 text-sm font-medium text-gold transition hover:bg-gold/10"
              >
                Về trang chủ
              </a>
            </div>
          </div>
        </div>
    );
  }
}

// ============================================================
// VALIDATION FUNCTIONS
// ============================================================

function isValidDate(day: number, month: number, year: number): boolean {
  if (year < 1900 || year > 2100) return false;
  if (month < 1 || month > 12) return false;
  const daysInMonth = new Date(year, month, 0).getDate();
  if (day < 1 || day > daysInMonth) return false;
  return true;
}

function isValidTime(hour: number, minute: number): boolean {
  if (hour < 0 || hour > 23) return false;
  if (minute < 0 || minute > 59) return false;
  return true;
}

function formatAndValidateDate(value: string): { formatted: string; isValid: boolean; error?: string } {
  if (!value) return { formatted: '', isValid: false, error: 'Vui lòng nhập ngày sinh' };

  const digits = value.replace(/\D/g, '');
  if (digits.length === 0) return { formatted: '', isValid: false, error: 'Vui lòng nhập ngày sinh' };

  if (digits.length < 8) {
    let formatted = digits;
    if (digits.length >= 5) {
      const d = digits.slice(0, 2);
      const m = digits.slice(2, 4);
      const y = digits.slice(4, 8);
      formatted = d + '-' + m + (y ? '-' + y : '');
    } else if (digits.length >= 3) {
      const d = digits.slice(0, 2);
      const m = digits.slice(2, 4);
      formatted = d + (m ? '-' + m : '');
    }
    return { formatted, isValid: false, error: 'Nhập đủ DD-MM-YYYY (ví dụ: 04-10-2000)' };
  }

  const day = parseInt(digits.slice(0, 2));
  const month = parseInt(digits.slice(2, 4));
  const year = parseInt(digits.slice(4, 8));

  if (!isValidDate(day, month, year)) {
    let error = '';
    if (month < 1 || month > 12) {
      error = 'Tháng không hợp lệ (1-12)';
    } else if (year < 1900 || year > 2100) {
      error = 'Năm không hợp lệ (1900-2100)';
    } else {
      const daysInMonth = new Date(year, month, 0).getDate();
      error = `Ngày không hợp lệ (tháng ${month} có ${daysInMonth} ngày)`;
    }
    return {
      formatted: `${String(day).padStart(2, '0')}-${String(month).padStart(2, '0')}-${year}`,
      isValid: false,
      error
    };
  }

  return {
    formatted: `${String(day).padStart(2, '0')}-${String(month).padStart(2, '0')}-${year}`,
    isValid: true
  };
}

function formatAndValidateTime(value: string): { formatted: string; isValid: boolean; error?: string } {
  if (!value) return { formatted: '', isValid: false, error: 'Vui lòng nhập giờ sinh' };

  const digits = value.replace(/\D/g, '');
  if (digits.length === 0) return { formatted: '', isValid: false, error: 'Vui lòng nhập giờ sinh' };

  if (digits.length < 4) {
    let formatted = digits;
    if (digits.length === 3) {
      formatted = digits.slice(0, 1) + ':' + digits.slice(1, 3);
    }
    return { formatted, isValid: false, error: 'Nhập đủ HH:MM (ví dụ: 09:00 hoặc 900)' };
  }

  let hour, minute;
  if (digits.length === 3) {
    hour = parseInt(digits.slice(0, 1));
    minute = parseInt(digits.slice(1, 3));
  } else {
    hour = parseInt(digits.slice(0, 2));
    minute = parseInt(digits.slice(2, 4));
  }

  if (!isValidTime(hour, minute)) {
    let error = '';
    if (hour < 0 || hour > 23) {
      error = 'Giờ không hợp lệ (0-23)';
    } else {
      error = 'Phút không hợp lệ (0-59)';
    }
    const h = String(hour).padStart(2, '0');
    const m = String(minute).padStart(2, '0');
    return { formatted: `${h}:${m}`, isValid: false, error };
  }

  const h = String(hour).padStart(2, '0');
  const m = String(minute).padStart(2, '0');
  return { formatted: `${h}:${m}`, isValid: true };
}

// ============================================================
// SEARCH PLACE - AUTOCOMPLETE
// ============================================================
let searchTimeout: NodeJS.Timeout | null = null;

async function searchPlaces(query: string): Promise<Suggestion[]> {
  if (!query || query.length < 2) return [];

  try {
    const response = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=5&countrycodes=vn&accept-language=vi`,
        {
          headers: {
            'User-Agent': 'ASTROTAROT/1.0 (https://astrotarot.vn)',
          }
        }
    );

    if (!response.ok) return [];

    const data = await response.json();
    if (data && data.length > 0) {
      return data.map((item: any) => ({
        displayName: item.display_name,
        lat: parseFloat(item.lat),
        lng: parseFloat(item.lon),
        placeId: item.place_id,
      }));
    }
    return [];
  } catch (error) {
    console.error('Search places error:', error);
    return [];
  }
}

// ============================================================
// GET ELEVATION
// ============================================================
async function getElevation(lat: number, lng: number): Promise<number> {
  try {
    const response = await fetch(
        `https://api.open-elevation.com/api/v1/lookup?locations=${lat},${lng}`
    );
    if (!response.ok) return 0;
    const data = await response.json();
    if (data.results && data.results.length > 0) {
      return data.results[0].elevation || 0;
    }
    return 0;
  } catch (error) {
    console.error('Get elevation error:', error);
    return 0;
  }
}

// ============================================================
// GET TIMEZONE
// ============================================================
async function getTimezoneInfo(lat: number, lng: number): Promise<TimezoneInfo> {
  try {
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const now = new Date();
    const offset = -now.getTimezoneOffset() / 60;
    return {
      timezoneName: timezone,
      offset: offset,
    };
  } catch (error) {
    console.error('Get timezone error:', error);
    return {
      timezoneName: 'Asia/Ho_Chi_Minh',
      offset: 7,
    };
  }
}

function TarotPage() {
  const { user, openAuth } = useAuth();
  const uid = user?.id || "guest";
  const [stage, setStage] = useState<Stage>("info");
  const [count, setCount] = useState(1);
  const [people, setPeople] = useState<Person[]>([{
    id: "p1",
    name: "",
    dob: "",
    birthTime: "",
    birthPlace: "",
    lat: 0,
    lng: 0,
    altitude: 0,
    timezone: "",
    timezoneOffset: 7
  }]);
  const [drawnCards, setDrawnCards] = useState<string[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const [loading, setLoading] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [drawing, setDrawing] = useState(false);
  const [cardsDrawn, setCardsDrawn] = useState(false);
  const [readingResult, setReadingResult] = useState<TarotReadingResult | null>(null);
  const [showCards, setShowCards] = useState(false);
  const lastMsgRef = useRef<HTMLDivElement>(null);

  const [dateErrors, setDateErrors] = useState<{ [key: string]: string }>({});
  const [timeErrors, setTimeErrors] = useState<{ [key: string]: string }>({});

  const [suggestions, setSuggestions] = useState<{ [key: string]: Suggestion[] }>({});
  const [showSuggestions, setShowSuggestions] = useState<{ [key: string]: boolean }>({});
  const [searchingPlace, setSearchingPlace] = useState<{ [key: string]: boolean }>({});
  const [selectedPlace, setSelectedPlace] = useState<{ [key: string]: Suggestion | null }>({});
  const [gettingLocationDetails, setGettingLocationDetails] = useState<{ [key: string]: boolean }>({});

  // ✅ Clean old sessions when user changes
  useEffect(() => {
    if (user) {
      cleanOldSessions(user.id);
    }
  }, [user]);

  // Load history - chỉ khi đã đăng nhập
  useEffect(() => {
    if (!user) {
      setMessages([]);
      setReadingResult(null);
      setDrawnCards([]);
      setStage("info");
      setCardsDrawn(false);
      return;
    }

    try {
      const raw = localStorage.getItem(storageKey(uid));
      if (raw) {
        const data = JSON.parse(raw);
        if (Array.isArray(data?.messages) && data.messages.length) {
          setMessages(data.messages);
          if (data.people) setPeople(data.people);
          if (data.drawnCards) setDrawnCards(data.drawnCards);
          if (data.readingResult) setReadingResult(data.readingResult);
          if (data.cardsDrawn) setCardsDrawn(data.cardsDrawn);
          setStage("chat");
        }
      }
    } catch {}
  }, [uid, user]);

  // Persist - chỉ khi đã đăng nhập và đang ở stage chat
  useEffect(() => {
    if (stage === "chat" && user) {
      localStorage.setItem(storageKey(uid), JSON.stringify({
        messages,
        people,
        drawnCards,
        readingResult,
        cardsDrawn
      }));
    }
  }, [messages, stage, uid, people, drawnCards, readingResult, user, cardsDrawn]);

  // Scroll to last message
  useEffect(() => {
    lastMsgRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, thinking]);

  const updateCount = (n: number) => {
    setCount(n);
    setPeople((prev) => {
      const arr = [...prev];
      while (arr.length < n) arr.push({
        id: `p${arr.length + 1}`,
        name: "",
        dob: "",
        birthTime: "",
        birthPlace: "",
        lat: 0,
        lng: 0,
        altitude: 0,
        timezone: "",
        timezoneOffset: 7
      });
      return arr.slice(0, n);
    });
  };

  const updatePerson = (i: number, patch: Partial<Person>) =>
      setPeople((arr) => arr.map((p, idx) => (idx === i ? { ...p, ...patch } : p)));

  // ============================================================
  // XỬ LÝ NGÀY SINH
  // ============================================================
  const handleDateChange = (i: number, value: string) => {
    if (value === '') {
      updatePerson(i, { dob: '' });
      setDateErrors(prev => ({ ...prev, [i]: '' }));
      return;
    }

    const result = formatAndValidateDate(value);
    updatePerson(i, { dob: result.formatted });
    setDateErrors(prev => ({ ...prev, [i]: result.error || '' }));
  };

  // ============================================================
  // XỬ LÝ GIỜ SINH
  // ============================================================
  const handleTimeChange = (i: number, value: string) => {
    if (value === '') {
      updatePerson(i, { birthTime: '' });
      setTimeErrors(prev => ({ ...prev, [i]: '' }));
      return;
    }

    const result = formatAndValidateTime(value);
    updatePerson(i, { birthTime: result.formatted });
    setTimeErrors(prev => ({ ...prev, [i]: result.error || '' }));
  };

  const handleTimeBlur = (i: number, value: string) => {
    if (!value || value === '') return;

    const digits = value.replace(/\D/g, '');
    if (digits.length === 0) return;

    let formatted = '';
    if (digits.length === 1) {
      formatted = '0' + digits + ':00';
    } else if (digits.length === 2) {
      formatted = digits + ':00';
    } else if (digits.length === 3) {
      formatted = digits.slice(0, 1) + ':' + digits.slice(1, 3);
    } else {
      formatted = digits.slice(0, 2) + ':' + digits.slice(2, 4);
    }

    const result = formatAndValidateTime(formatted);
    updatePerson(i, { birthTime: result.formatted });
    setTimeErrors(prev => ({ ...prev, [i]: result.error || '' }));
  };

  // ============================================================
  // XỬ LÝ NƠI SINH - AUTOCOMPLETE
  // ============================================================
  const handlePlaceInput = async (i: number, value: string) => {
    updatePerson(i, { birthPlace: value });
    setSelectedPlace(prev => ({ ...prev, [i]: null }));

    if (value.length < 2) {
      setSuggestions(prev => ({ ...prev, [i]: [] }));
      setShowSuggestions(prev => ({ ...prev, [i]: false }));
      return;
    }

    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }

    setSearchingPlace(prev => ({ ...prev, [i]: true }));

    searchTimeout = setTimeout(async () => {
      try {
        const results = await searchPlaces(value);
        setSuggestions(prev => ({ ...prev, [i]: results }));
        setShowSuggestions(prev => ({ ...prev, [i]: results.length > 0 }));
      } catch (error) {
        console.error('Search error:', error);
      } finally {
        setSearchingPlace(prev => ({ ...prev, [i]: false }));
      }
    }, 500);
  };

  const handleSelectPlace = async (i: number, suggestion: Suggestion) => {
    setGettingLocationDetails(prev => ({ ...prev, [i]: true }));

    try {
      const altitude = await getElevation(suggestion.lat, suggestion.lng);
      const timezoneInfo = await getTimezoneInfo(suggestion.lat, suggestion.lng);

      updatePerson(i, {
        birthPlace: suggestion.displayName,
        lat: suggestion.lat,
        lng: suggestion.lng,
        altitude: altitude,
        timezone: timezoneInfo.timezoneName,
        timezoneOffset: timezoneInfo.offset,
      });

      setSelectedPlace(prev => ({ ...prev, [i]: suggestion }));
      setShowSuggestions(prev => ({ ...prev, [i]: false }));
      setSuggestions(prev => ({ ...prev, [i]: [] }));

      const placeName = suggestion.displayName.split(',')[0];
      const timezoneDisplay = timezoneInfo ? `UTC${timezoneInfo.offset >= 0 ? '+' : ''}${timezoneInfo.offset}` : 'Chưa xác định';

      toast.success(
          `📍 Đã chọn: ${placeName}\n🌐 Múi giờ: ${timezoneDisplay}\n⛰️ Độ cao: ${altitude}m`
      );

    } catch (error) {
      console.error('Error getting location details:', error);
      toast.warning('⚠️ Không thể lấy đầy đủ thông tin địa điểm');

      updatePerson(i, {
        birthPlace: suggestion.displayName,
        lat: suggestion.lat,
        lng: suggestion.lng,
        timezoneOffset: 7
      });
      setSelectedPlace(prev => ({ ...prev, [i]: suggestion }));
      setShowSuggestions(prev => ({ ...prev, [i]: false }));
      setSuggestions(prev => ({ ...prev, [i]: [] }));

    } finally {
      setGettingLocationDetails(prev => ({ ...prev, [i]: false }));
    }
  };

  const handlePlaceBlur = (i: number) => {
    setTimeout(() => {
      setShowSuggestions(prev => ({ ...prev, [i]: false }));
    }, 200);
  };

  const handlePlaceFocus = (i: number) => {
    const currentValue = people[i]?.birthPlace || '';
    if (currentValue.length >= 2 && suggestions[i]?.length > 0) {
      setShowSuggestions(prev => ({ ...prev, [i]: true }));
    }
  };

  // ============================================================
  // KIỂM TRA VALIDATION
  // ============================================================
  const validateAll = (): boolean => {
    let hasError = false;
    const newDateErrors: { [key: string]: string } = {};
    const newTimeErrors: { [key: string]: string } = {};

    people.forEach((p, i) => {
      if (!p.dob) {
        newDateErrors[i] = 'Vui lòng nhập ngày sinh';
        hasError = true;
      } else {
        const dateResult = formatAndValidateDate(p.dob);
        if (!dateResult.isValid) {
          newDateErrors[i] = dateResult.error || 'Ngày sinh không hợp lệ';
          hasError = true;
        }
      }

      if (p.birthTime) {
        const timeResult = formatAndValidateTime(p.birthTime);
        if (!timeResult.isValid) {
          newTimeErrors[i] = timeResult.error || 'Giờ sinh không hợp lệ';
          hasError = true;
        }
      }
    });

    setDateErrors(newDateErrors);
    setTimeErrors(newTimeErrors);
    return !hasError;
  };

  // ============================================================
  // CLEAR CHAT HISTORY - Xóa lịch sử chat
  // ============================================================
  const clearChatHistory = () => {
    if (user) {
      localStorage.removeItem(storageKey(uid));
      // ✅ Xóa tất cả session cũ
      cleanOldSessions(user.id);
    }
    setStage("info");
    setMessages([]);
    setInput("");
    setDrawnCards([]);
    setReadingResult(null);
    setPeople([{
      id: "p1",
      name: "",
      dob: "",
      birthTime: "",
      birthPlace: "",
      lat: 0,
      lng: 0,
      altitude: 0,
      timezone: "",
      timezoneOffset: 7
    }]);
    setCount(1);
    setCardsDrawn(false);
    setShowCards(false);
    setDateErrors({});
    setTimeErrors({});
    setSuggestions({});
    setShowSuggestions({});
    setSelectedPlace({});
    toast.success("🗑️ Đã xóa lịch sử chat");
  };

  // ============================================================
  // VÀO CHAT
  // ============================================================
  const enterChat = async () => {
    if (!user) {
      toast.error("Vui lòng đăng nhập để sử dụng Tarot AI");
      openAuth("login");
      return;
    }

    if (!validateAll()) {
      toast.error("Vui lòng kiểm tra lại thông tin ngày sinh và giờ sinh");
      return;
    }

    for (const p of people) {
      if (!p.name.trim()) {
        toast.error("Vui lòng nhập họ tên cho tất cả mọi người.");
        return;
      }
    }

    setLoading(true);
    setSavingProfile(true);

    try {
      const primaryPerson = people[0];

      const birthDateISO = convertToISODate(primaryPerson.dob);
      const birthTimeISO = convertToISOTime(primaryPerson.birthTime);

      if (!birthDateISO || !/^\d{4}-\d{2}-\d{2}$/.test(birthDateISO)) {
        toast.error("Ngày sinh không hợp lệ. Vui lòng nhập DD-MM-YYYY");
        setLoading(false);
        setSavingProfile(false);
        return;
      }

      const profileData = {
        title: `Profile của ${primaryPerson.name}`,
        targetName: primaryPerson.name,
        birthDate: birthDateISO,
        birthTime: birthTimeISO || "00:00:00",
        birthPlace: primaryPerson.birthPlace || "Chưa xác định",
        latitude: primaryPerson.lat || 0,
        longitude: primaryPerson.lng || 0,
        altitude: primaryPerson.altitude || 0,
        timezone: primaryPerson.timezone || "Asia/Ho_Chi_Minh",
        timezoneOffset: primaryPerson.timezoneOffset ?? 7,
        profileType: "SELF" as const,
        isPrimary: true,
      };

      console.log("📤 Sending profile data:", profileData);

      await createAstrologyProfile(profileData);
      toast.success("📊 Đã lưu thông tin chiêm tinh!");

      // ✅ Clean old sessions before starting new chat
      cleanOldSessions(user.id);

      setMessages([{
        id: generateUUID(),
        role: "ai",
        content: `Chào cậu, hôm nay mọi việc có suôn sẻ không, và trong lòng cậu có đang bình yên không? Mình biết đôi khi cuộc sống có nhiều áp lực và những điều không như ý khiến cậu mệt nhọc. Nếu lúc nào đó cậu cảm thấy chông chênh hay có điều gì muốn tâm sự, đừng ngần ngại nhắn cho mình nhé. Mình không hứa sẽ giải quyết được mọi vấn đề, nhưng mình hứa sẽ luôn ở đây, lắng nghe cậu bằng cả trái tim để cậu không bao giờ phải chịu đựng mọi thứ một mình.`,
        ts: Date.now(),
      }]);
      setStage("chat");
      setCardsDrawn(false);
      setDrawnCards([]);
      setReadingResult(null);

    } catch (error: any) {
      console.error("Error:", error);
      toast.error(error?.message || "Có lỗi xảy ra, vui lòng thử lại");
    } finally {
      setLoading(false);
      setSavingProfile(false);
    }
  };

  // ============================================================
  // RÚT BÀI
  // ============================================================
  const drawCards = async () => {
    if (cardsDrawn || drawing) return;

    if (!user) {
      toast.error("Vui lòng đăng nhập để rút bài");
      openAuth("login");
      return;
    }

    setDrawing(true);
    setShowCards(false);

    try {
      const primaryPerson = people[0];
      const name = primaryPerson?.name || "bạn";

      setMessages((m) => [...m, {
        id: generateUUID(),
        role: "user",
        content: "Mình muốn rút bài Tarot để xem thử.",
        ts: Date.now(),
      }]);

      setMessages((m) => [...m, {
        id: generateUUID(),
        role: "ai",
        content: "✨ Đang kết nối với vũ trụ để rút bài cho cậu...",
        ts: Date.now(),
      }]);

      const result = await startAiTarotReading({
        question: `Xin chào, tôi là ${name}`,
        numberOfCards: 3,
        includeReversed: true,
        spreadName: "Past-Present-Future",
      });

      setReadingResult(result);
      const cardNames = result.drawnCards.map(c => c.cardName);
      setDrawnCards(cardNames);
      setCardsDrawn(true);
      setShowCards(true);

      const cardLines = result.drawnCards.map((c, i) => {
        const positions = ["Quá khứ", "Hiện tại", "Tương lai"];
        const status = c.reversed ? '🔄 Đảo ngược' : '⬆️ Xuôi';
        return `📌 **${positions[i] || i+1}**: ${c.cardName} — ${status}`;
      }).join('\n');

      setMessages((m) => {
        const filtered = m.filter(msg => !msg.content.includes("Đang kết nối với vũ trụ"));
        return [...filtered, {
          id: generateUUID(),
          role: "ai",
          content: `✨ **Mình đã rút bài cho cậu đây!** ✨\n\n${cardLines}\n\n---\n\n📖 **Điều Tarot muốn nói với cậu:**\n\n${result.aiInterpretation}\n\n💫 Cậu có thắc mắc gì về bài đọc này không? Mình sẵn sàng giải thích thêm nhé!`,
          ts: Date.now(),
        }];
      });

      toast.success("✨ Đã rút bài thành công!");

    } catch (error: any) {
      console.error("Tarot API error:", error);

      const shuffled = [...TAROT_DECK].sort(() => Math.random() - 0.5).slice(0, 3);
      setDrawnCards(shuffled);
      setCardsDrawn(true);
      setShowCards(true);

      const cardLines = shuffled.map((c, i) => {
        const positions = ["Quá khứ", "Hiện tại", "Tương lai"];
        return `📌 **${positions[i] || i+1}**: ${c}`;
      }).join('\n');

      setMessages((m) => {
        const filtered = m.filter(msg => !msg.content.includes("Đang kết nối với vũ trụ"));
        return [...filtered, {
          id: generateUUID(),
          role: "ai",
          content: `✨ **Mình đã rút bài cho cậu đây!** ✨\n\n${cardLines}\n\n---\n\n📖 **Thông điệp từ các lá bài:**\n\n${shuffled.map((c, i) =>
              `**${["Quá khứ", "Hiện tại", "Tương lai"][i]}**: ${getCardMeaning(c)}`
          ).join('\n\n')}\n\n💫 Cậu có thắc mắc gì không?`,
          ts: Date.now(),
        }];
      });

      if (error?.message?.includes("503")) {
        toast.warning("🔮 Dịch vụ Tarot AI đang quá tải. Mình dùng bài dự phòng cho cậu nhé!");
      } else {
        toast.error(error?.message || "Không thể rút bài, mình dùng bài dự phòng nhé!");
      }
    } finally {
      setDrawing(false);
    }
  };

  // ============================================================
  // GỬI TIN NHẮN
  // ============================================================
  const send = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const text = input.trim();
    if (!text || thinking) return;

    const messageId = generateUUID();
    setMessages((m) => [...m, {
      id: messageId,
      role: "user",
      content: text,
      ts: Date.now()
    }]);
    setInput("");
    setThinking(true);

    const lower = text.toLowerCase();
    if (lower.includes("cảm ơn") || lower.includes("tạm biệt") || lower.includes("ngủ ngon") || lower.includes("kết thúc")) {
      await new Promise(r => setTimeout(r, 600));
      setMessages((m) => [...m, {
        id: generateUUID(),
        role: "ai",
        content: `Cảm ơn cậu vì đã tin tưởng và chia sẻ những điều này với mình. Dù phía trước có khó khăn thế nào, hãy luôn nhớ rằng cậu không bước đi một mình, mình vẫn luôn ở đây ủng hộ cậu. Giờ thì gác lại mọi âu lo và ngủ thật ngoan nhé. Mọi chuyện rồi sẽ ổn thôi.`,
        ts: Date.now()
      }]);
      setThinking(false);
      return;
    }

    if (lower.includes("rút bài") || lower.includes("tarot") || lower.includes("bói")) {
      setThinking(false);
      await drawCards();
      return;
    }

    await new Promise(r => setTimeout(r, 600 + Math.random() * 400));

    let reply = MOCK_REPLIES[Math.floor(Math.random() * MOCK_REPLIES.length)];

    if (!cardsDrawn && Math.random() > 0.7) {
      reply = "Cậu có muốn mình rút bài Tarot để xem thêm về tình hình của cậu không? Chỉ cần nói 'rút bài' là được nhé! 🃏";
    }

    setMessages((m) => [...m, {
      id: generateUUID(),
      role: "ai",
      content: reply,
      ts: Date.now()
    }]);
    setThinking(false);
  };

  // ============================================================
  // RESET - Chỉ reset UI, không xóa storage
  // ============================================================
  const resetAll = () => {
    setStage("info");
    setMessages([]);
    setInput("");
    setDrawnCards([]);
    setReadingResult(null);
    setPeople([{
      id: "p1",
      name: "",
      dob: "",
      birthTime: "",
      birthPlace: "",
      lat: 0,
      lng: 0,
      altitude: 0,
      timezone: "",
      timezoneOffset: 7
    }]);
    setCount(1);
    setCardsDrawn(false);
    setShowCards(false);
    setDateErrors({});
    setTimeErrors({});
    setSuggestions({});
    setShowSuggestions({});
    setSelectedPlace({});
    toast.success("Đã bắt đầu phiên mới");
  };

  const headerName = useMemo(() => people.map((p) => p.name).filter(Boolean).join(", ") || "Bạn", [people]);

  // ============================================================
  // RENDER
  // ============================================================
  return (
      <div className="relative min-h-screen">
        <Header />
        <StarField count={50} />

        <div className="mx-auto max-w-6xl px-4 py-6">
          <div className="mb-4 text-center">
            <h1 className="font-display text-3xl"><span className="text-gradient-gold">AI Tarot</span> Reader</h1>
            <p className="mt-1 text-sm text-muted-foreground">Trò chuyện cùng AI Tarot — cá nhân hoá theo bản đồ sao</p>
            {!user && (
                <button
                    onClick={() => openAuth("login")}
                    className="mt-2 text-xs text-gold hover:underline"
                >
                  🔐 Đăng nhập để lưu lịch sử
                </button>
            )}
          </div>

          {stage === "info" && (
              <div className="glass rounded-2xl p-6 max-w-3xl mx-auto">
                <div className="mb-5 flex items-center gap-2 rounded-lg border border-border bg-card/40 px-4 py-2 text-xs text-muted-foreground">
                  🔐 Ngày sinh được mã hoá end-to-end.
                </div>

                <div className="mb-4">
              <span className="mb-2 flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground">
                <Users className="h-3.5 w-3.5" /> Số người tham gia
              </span>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4].map((n) => (
                        <button
                            key={n}
                            onClick={() => updateCount(n)}
                            className={`flex-1 rounded-lg border py-2 text-sm transition ${
                                count === n ? "border-gold bg-gold/10 text-gold" : "border-border text-muted-foreground hover:border-gold/40"
                            }`}
                        >
                          {n} người
                        </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  {people.map((p, i) => (
                      <div key={p.id} className="rounded-xl border border-gold/20 bg-background/30 p-4">
                        <div className="mb-2 text-xs uppercase tracking-wider text-gold">Người #{i + 1}</div>
                        <div className="grid gap-3">
                          <Field
                              label="Họ tên"
                              value={p.name}
                              onChange={(v) => updatePerson(i, { name: v })}
                              placeholder="Nguyễn Văn A"
                          />
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="mb-1 block text-xs uppercase tracking-wider text-muted-foreground">Ngày sinh</label>
                              <input
                                  value={p.dob}
                                  onChange={(e) => handleDateChange(i, e.target.value)}
                                  placeholder="DD-MM-YYYY (vd: 4-10-2000)"
                                  className={`w-full rounded-lg border px-4 py-2.5 text-sm outline-none transition focus:border-gold bg-input/60 ${
                                      dateErrors[i] ? 'border-red-500 focus:border-red-500' : 'border-border'
                                  }`}
                              />
                              {dateErrors[i] ? (
                                  <p className="mt-1 text-[10px] text-red-400">{dateErrors[i]}</p>
                              ) : (
                                  <p className="mt-1 text-[10px] text-muted-foreground/60">
                                    💡 4102000 → 04-10-2000
                                  </p>
                              )}
                            </div>
                            <div>
                              <label className="mb-1 block text-xs uppercase tracking-wider text-muted-foreground">Giờ sinh</label>
                              <input
                                  value={p.birthTime}
                                  onChange={(e) => handleTimeChange(i, e.target.value)}
                                  onBlur={(e) => handleTimeBlur(i, e.target.value)}
                                  placeholder="HH:MM (vd: 9:00 hoặc 900)"
                                  className={`w-full rounded-lg border px-4 py-2.5 text-sm outline-none transition focus:border-gold bg-input/60 ${
                                      timeErrors[i] ? 'border-red-500 focus:border-red-500' : 'border-border'
                                  }`}
                              />
                              {timeErrors[i] ? (
                                  <p className="mt-1 text-[10px] text-red-400">{timeErrors[i]}</p>
                              ) : (
                                  <p className="mt-1 text-[10px] text-muted-foreground/60">
                                    💡 900 → 9:00 | 930 → 9:30 | 9 → 09:00 (khi rời)
                                  </p>
                              )}
                            </div>
                          </div>

                          <div className="relative">
                            <label className="mb-1 block text-xs uppercase tracking-wider text-muted-foreground">Nơi sinh</label>
                            <div className="relative">
                              <input
                                  value={p.birthPlace}
                                  onChange={(e) => handlePlaceInput(i, e.target.value)}
                                  onFocus={() => handlePlaceFocus(i)}
                                  onBlur={() => handlePlaceBlur(i)}
                                  placeholder="Nhập tên thành phố (vd: Hà Nội)"
                                  className="w-full rounded-lg border border-border bg-input/60 px-4 py-2.5 pr-10 text-sm outline-none transition focus:border-gold"
                                  autoComplete="off"
                              />
                              {searchingPlace[i] || gettingLocationDetails[i] ? (
                                  <Loader className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-gold" />
                              ) : selectedPlace[i] ? (
                                  <MapPin className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-emerald-400" />
                              ) : null}
                            </div>

                            {showSuggestions[i] && suggestions[i] && suggestions[i].length > 0 && (
                                <div className="absolute z-50 mt-1 w-full max-h-60 overflow-y-auto rounded-lg border border-gold/30 bg-card/95 backdrop-blur shadow-lg">
                                  {suggestions[i].map((suggestion, idx) => (
                                      <button
                                          key={idx}
                                          onClick={() => handleSelectPlace(i, suggestion)}
                                          className="flex w-full items-start gap-2 px-4 py-2 text-left text-sm hover:bg-gold/10 transition-colors border-b border-border/40 last:border-0"
                                      >
                                        <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-gold" />
                                        <div className="flex-1 min-w-0">
                                          <div className="truncate text-foreground">
                                            {suggestion.displayName.split(',')[0]}
                                          </div>
                                          <div className="truncate text-[10px] text-muted-foreground">
                                            {suggestion.displayName.split(',').slice(1).join(',').trim()}
                                          </div>
                                        </div>
                                      </button>
                                  ))}
                                </div>
                            )}

                            {selectedPlace[i] && (
                                <div className="mt-1 flex flex-wrap gap-2 text-[10px]">
                          <span className="inline-flex items-center gap-1 text-emerald-400">
                            <MapPin className="h-3 w-3" /> {selectedPlace[i]?.displayName.split(',')[0]}
                          </span>
                                  {p.timezone && (
                                      <span className="inline-flex items-center gap-1 text-blue-400">
                              <Clock className="h-3 w-3" /> UTC{p.timezoneOffset >= 0 ? '+' : ''}{p.timezoneOffset}
                            </span>
                                  )}
                                  {p.altitude > 0 && (
                                      <span className="inline-flex items-center gap-1 text-purple-400">
                              <Globe className="h-3 w-3" /> {p.altitude}m
                            </span>
                                  )}
                                </div>
                            )}

                            {!selectedPlace[i] && p.birthPlace && p.birthPlace.length >= 2 && (
                                <p className="mt-1 text-[10px] text-muted-foreground/60">
                                  🔍 Chọn địa điểm từ danh sách gợi ý
                                </p>
                            )}
                            {!selectedPlace[i] && (!p.birthPlace || p.birthPlace.length < 2) && (
                                <p className="mt-1 text-[10px] text-muted-foreground/60">
                                  📍 Nhập tên thành phố để tìm gợi ý
                                </p>
                            )}
                          </div>
                        </div>
                      </div>
                  ))}
                </div>

                <button
                    onClick={enterChat}
                    disabled={loading}
                    className="mt-6 w-full rounded-full bg-gold py-3 font-medium text-primary-foreground glow-gold transition hover:scale-[1.02] disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {loading ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin" />
                        {savingProfile ? "Đang lưu thông tin chiêm tinh..." : "Đang kết nối..."}
                      </>
                  ) : (
                      "✦ Bắt đầu trò chuyện với AI"
                  )}
                </button>
              </div>
          )}

          {stage === "chat" && (
              <div className="w-full">
                <ChatPanel
                    messages={messages}
                    thinking={thinking}
                    input={input}
                    setInput={setInput}
                    send={send}
                    resetAll={resetAll}
                    clearChatHistory={clearChatHistory}
                    headerName={headerName}
                    lastMsgRef={lastMsgRef}
                    cardsDrawn={cardsDrawn}
                    drawing={drawing}
                    onDrawCards={drawCards}
                    showCards={showCards}
                    drawnCards={drawnCards}
                />
              </div>
          )}
        </div>
      </div>
  );
}

// ============================================================
// CHAT PANEL
// ============================================================
interface ChatPanelProps {
  messages: ChatMessage[];
  thinking: boolean;
  input: string;
  setInput: (v: string) => void;
  send: (e?: React.FormEvent) => void;
  resetAll: () => void;
  clearChatHistory: () => void;
  headerName: string;
  lastMsgRef: React.RefObject<HTMLDivElement | null>;
  cardsDrawn: boolean;
  drawing: boolean;
  onDrawCards: () => void;
  showCards: boolean;
  drawnCards: string[];
}

const PAGE_SIZE = 50;

function ChatPanel({
                     messages,
                     thinking,
                     input,
                     setInput,
                     send,
                     resetAll,
                     clearChatHistory,
                     headerName,
                     lastMsgRef,
                     cardsDrawn,
                     drawing,
                     onDrawCards,
                     showCards,
                     drawnCards,
                   }: ChatPanelProps) {
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query);
  const [page, setPage] = useState(0);

  const filtered = useMemo(() => {
    if (!deferredQuery.trim()) return messages;
    const q = deferredQuery.toLowerCase();
    return messages.filter((m) => m.content.toLowerCase().includes(q));
  }, [messages, deferredQuery]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageSafe = Math.min(page, totalPages - 1);
  const start = Math.max(0, filtered.length - (pageSafe + 1) * PAGE_SIZE);
  const end = filtered.length - pageSafe * PAGE_SIZE;
  const view = filtered.slice(start, end);

  const onSearch = useCallback((v: string) => { setQuery(v); setPage(0); }, []);

  return (
      <div className="glass flex h-[calc(100vh-160px)] min-h-[520px] w-full flex-col overflow-hidden rounded-2xl">
        <div className="flex items-center justify-between border-b border-gold/20 px-5 py-3 bg-background/30 shrink-0">
          <div className="flex items-center gap-2">
            <div className="relative">
              <div className="grid h-8 w-8 place-items-center rounded-full bg-gold/20 text-gold">
                <Sparkles className="h-4 w-4" />
              </div>
              <span className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-400 ring-1 ring-background"></span>
            </div>
            <div>
              <div className="font-display text-base text-gold-soft">Tarot AI</div>
              <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-400"></span>
                Đang trực tuyến • {headerName}
                {cardsDrawn && (
                    <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-gold/20 px-2 py-0.5 text-[9px] text-gold">
                  🃏 Đã rút bài
                </span>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {!cardsDrawn && !drawing && (
                <button
                    onClick={onDrawCards}
                    className="inline-flex items-center gap-1.5 rounded-full bg-gold px-3 py-1.5 text-xs font-medium text-primary-foreground glow-gold transition hover:scale-105"
                >
                  <Wand2 className="h-3 w-3" /> Rút bài
                </button>
            )}
            {drawing && (
                <button
                    disabled
                    className="inline-flex items-center gap-1.5 rounded-full bg-gold/60 px-3 py-1.5 text-xs font-medium text-primary-foreground"
                >
                  <Loader2 className="h-3 w-3 animate-spin" /> Đang rút...
                </button>
            )}
            <button
                onClick={resetAll}
                className="inline-flex items-center gap-1.5 rounded-full border border-gold/40 px-3 py-1.5 text-xs text-gold transition hover:bg-gold/10 hover:border-gold"
            >
              <RotateCcw className="h-3 w-3" /> Phiên mới
            </button>
            <button
                onClick={() => {
                  if (confirm("Bạn có muốn xóa toàn bộ lịch sử chat?")) {
                    clearChatHistory();
                  }
                }}
                className="inline-flex items-center gap-1.5 rounded-full border border-red-500/40 px-3 py-1.5 text-xs text-red-400 transition hover:bg-red-500/10 hover:border-red-500"
            >
              <Trash2 className="h-3 w-3" /> Xóa lịch sử
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2 border-b border-gold/15 bg-background/30 px-3 py-2 shrink-0">
          <div className="flex flex-1 items-center gap-2 rounded-full border border-gold/30 bg-input/50 px-3 focus-within:border-gold/70 transition-colors">
            <Search className="h-3.5 w-3.5 text-muted-foreground" />
            <input
                value={query}
                onChange={(e) => onSearch(e.target.value)}
                placeholder="Tìm trong lịch sử chat…"
                className="flex-1 bg-transparent py-1.5 text-xs outline-none placeholder:text-muted-foreground/60"
            />
          </div>
          <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
            <button
                disabled={pageSafe >= totalPages - 1}
                onClick={() => setPage((p) => p + 1)}
                className="rounded p-1 hover:bg-gold/10 disabled:opacity-30 transition"
            >
              <ChevronLeft className="h-3 w-3" />
            </button>
            <span className="min-w-[40px] text-center text-xs">
            {pageSafe + 1}/{totalPages}
          </span>
            <button
                disabled={pageSafe <= 0}
                onClick={() => setPage((p) => p - 1)}
                className="rounded p-1 hover:bg-gold/10 disabled:opacity-30 transition"
            >
              <ChevronRight className="h-3 w-3" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-1 bg-gradient-to-b from-background/10 to-background/5 min-h-[300px]">
          {view.length === 0 && (
              <div className="flex h-full min-h-[300px] flex-col items-center justify-center text-center">
                <div className="text-4xl mb-3">💬</div>
                <p className="text-sm text-muted-foreground">Chưa có tin nhắn nào</p>
                <p className="text-xs text-muted-foreground/60">Hãy đặt câu hỏi để bắt đầu</p>
              </div>
          )}
          {view.map((m, idx) => (
              <div
                  key={m.id}
                  ref={idx === view.length - 1 && pageSafe === 0 ? lastMsgRef : null}
                  className="animate-in fade-in slide-in-from-bottom-2 duration-300"
                  style={{ animationDelay: `${idx * 50}ms` }}
              >
                <Bubble role={m.role} content={m.content} />
              </div>
          ))}
          {pageSafe === 0 && thinking && (
              <div className="flex justify-start animate-in fade-in duration-200">
                <div className="inline-flex items-center gap-2 rounded-2xl rounded-bl-sm border border-gold/25 bg-card/60 px-4 py-2.5 text-sm text-muted-foreground">
                  <div className="flex gap-1">
                    <span className="h-2 w-2 rounded-full bg-gold animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="h-2 w-2 rounded-full bg-gold animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="h-2 w-2 rounded-full bg-gold animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                  <span className="ml-1 text-xs">Đang suy ngẫm...</span>
                </div>
              </div>
          )}
        </div>

        <form onSubmit={send} className="flex gap-2 border-t border-gold/20 bg-background/30 p-3 shrink-0">
          <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Nhập câu hỏi của bạn cho vũ trụ…"
              className="flex-1 rounded-full border border-gold/30 bg-input/60 px-4 py-2.5 text-sm outline-none transition focus:border-gold focus:ring-1 focus:ring-gold/30 placeholder:text-muted-foreground/60"
          />
          <button
              type="submit"
              disabled={!input.trim() || thinking}
              className="inline-flex items-center justify-center gap-1.5 rounded-full bg-gold px-6 py-2.5 text-sm font-medium text-primary-foreground glow-gold transition hover:scale-[1.02] hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100"
          >
            <Send className="h-4 w-4" />
            <span className="hidden sm:inline">Gửi</span>
          </button>
        </form>
      </div>
  );
}

// ============================================================
// BUBBLE
// ============================================================
const Bubble = memo(function Bubble({ role, content }: { role: "user" | "ai"; content: string }) {
  const formattedContent = content
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\n/g, '<br />');

  return (
      <div className={`flex ${role === "user" ? "justify-end" : "justify-start"} mb-3`}>
        <div
            className={`max-w-[80%] px-4 py-3 text-sm leading-relaxed ${
                role === "user"
                    ? "rounded-2xl rounded-br-sm bg-gold text-primary-foreground"
                    : "rounded-2xl rounded-bl-sm border border-gold/20 bg-card/80 text-foreground/90"
            }`}
        >
          <div
              className="whitespace-pre-wrap break-words"
              dangerouslySetInnerHTML={{ __html: formattedContent }}
          />
        </div>
      </div>
  );
});

// ============================================================
// FIELD
// ============================================================
function Field({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder: string }) {
  return (
      <label className="block">
        <span className="mb-1 block text-xs uppercase tracking-wider text-muted-foreground">{label}</span>
        <input
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className="w-full rounded-lg border border-border bg-input/60 px-4 py-2.5 text-sm outline-none transition focus:border-gold"
        />
      </label>
  );
}