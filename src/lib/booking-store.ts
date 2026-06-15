// Shared booking store (mock backend with localStorage)
// Supports concurrent users: each browser keeps its own copy, status flow
// pending -> paid -> done | cancelled. Storage keys are public so the same
// device acting as different roles can see the same bookings.

export type BookingStatus = "pending" | "paid" | "cancelled" | "done";

export interface Slot {
  id: string;
  readerId: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
}

export interface Booking {
  id: string;
  slotId: string;
  readerId: string;
  readerName: string;
  userId: string;
  userName: string;
  amount: number;
  status: BookingStatus;
  createdAt: number;
  method?: "vnpay" | "momo";
}

const SLOT_KEY = "astrotarot_slots_v2";
const BOOK_KEY = "astrotarot_bookings_v2";

type Listener = () => void;
const listeners = new Set<Listener>();
export function subscribe(l: Listener) {
  listeners.add(l);
  return () => listeners.delete(l);
}
function emit() {
  listeners.forEach((l) => l());
}

function read<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}
function write<T>(key: string, val: T) {
  if (typeof window === "undefined") return;
  localStorage.setItem(key, JSON.stringify(val));
  emit();
}

// ---------- Seed ----------
function seed() {
  if (typeof window === "undefined") return;
  if (!localStorage.getItem(SLOT_KEY)) {
    const today = new Date();
    const slots: Slot[] = [];
    for (const rid of ["r1", "r2"]) {
      for (let d = 0; d < 7; d++) {
        const day = new Date(today);
        day.setDate(today.getDate() + d);
        const ds = day.toISOString().slice(0, 10);
        ["10:00", "14:30", "20:00"].forEach((t, i) =>
          slots.push({ id: `${rid}-${ds}-${i}`, readerId: rid, date: ds, time: t }),
        );
      }
    }
    write(SLOT_KEY, slots);
  }
  if (!localStorage.getItem(BOOK_KEY)) write(BOOK_KEY, []);
}
seed();

// ---------- Slots ----------
export function getSlots(readerId?: string): Slot[] {
  const all = read<Slot[]>(SLOT_KEY, []);
  return readerId ? all.filter((s) => s.readerId === readerId) : all;
}
export function addSlot(s: Omit<Slot, "id">) {
  const all = read<Slot[]>(SLOT_KEY, []);
  all.push({ ...s, id: crypto.randomUUID() });
  write(SLOT_KEY, all);
}
export function removeSlot(id: string) {
  write(SLOT_KEY, read<Slot[]>(SLOT_KEY, []).filter((s) => s.id !== id));
}

// ---------- Bookings ----------
export function getBookings(): Booking[] {
  return read<Booking[]>(BOOK_KEY, []);
}
export function getReaderBookings(readerId: string): Booking[] {
  return getBookings().filter((b) => b.readerId === readerId);
}
export function getUserBookings(userId: string): Booking[] {
  return getBookings().filter((b) => b.userId === userId);
}
export function isSlotBooked(slotId: string): Booking | undefined {
  return getBookings().find((b) => b.slotId === slotId && b.status !== "cancelled");
}

export function createBooking(b: Omit<Booking, "id" | "createdAt" | "status"> & { status?: BookingStatus }): Booking {
  const booking: Booking = {
    ...b,
    id: crypto.randomUUID(),
    createdAt: Date.now(),
    status: b.status ?? "pending",
  };
  const all = getBookings();
  all.unshift(booking);
  write(BOOK_KEY, all);
  return booking;
}

export function updateBookingStatus(id: string, status: BookingStatus, method?: "vnpay" | "momo") {
  const all = getBookings().map((b) =>
    b.id === id ? { ...b, status, ...(method ? { method } : {}) } : b,
  );
  write(BOOK_KEY, all);
}

// Cross-tab sync
if (typeof window !== "undefined") {
  window.addEventListener("storage", (e) => {
    if (e.key === SLOT_KEY || e.key === BOOK_KEY) emit();
  });
}
