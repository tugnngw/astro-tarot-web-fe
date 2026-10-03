// src/api/wallet.ts
// API client cho Ví cá nhân ASTROTAROT
import { apiFetch } from './client';

export type WalletTransactionType =
  | 'TOPUP'
  | 'AI_SUBSCRIPTION'
  | 'BOOKING_PAYMENT'
  | 'BOOKING_REFUND'
  | 'ADMIN_ADJUSTMENT';

export interface UserWallet {
  id: string;
  userId: string;
  balance: number;
  createdAt: string;
  updatedAt: string;
}

export interface WalletTransaction {
  id: string;
  type: WalletTransactionType;
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  status: 'PENDING' | 'SUCCESS' | 'FAILED' | 'CANCELLED';
  referenceId?: string;
  paymentMethod?: string;
  description?: string;
  createdAt: string;
}

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

export interface TopupInstruction {
  transactionId: string;
  amount: number;
  paymentMethod: string;
  paymentPhase: string;
  referenceCode: string;
  bankName?: string;
  bankAccountNumber?: string;
  bankAccountHolder?: string;
  transferContent?: string;
  checkoutUrl?: string;
  qrCode?: string;
  status: string;
}

export const walletApi = {
  /** Lấy thông tin ví và số dư khả dụng */
  getMyWallet: (): Promise<UserWallet> =>
    apiFetch<UserWallet>('/api/v1/wallet/me'),

  /** Tạo yêu cầu nạp tiền vào ví qua cổng PayOS VietQR */
  createTopup: (amount: number): Promise<TopupInstruction> =>
    apiFetch<TopupInstruction>('/api/v1/wallet/topup', {
      method: 'POST',
      body: JSON.stringify({ amount }),
    }),

  /** Lấy lịch sử biến động số dư ví (phân trang) */
  getTransactions: (
    page = 0,
    size = 10,
  ): Promise<PageResponse<WalletTransaction>> =>
    apiFetch<PageResponse<WalletTransaction>>(
      `/api/v1/wallet/transactions?page=${page}&size=${size}`,
    ),

  /** Thanh toán lịch hẹn Reader bằng số dư ví */
  payBooking: (bookingId: string): Promise<string> =>
    apiFetch<string>(`/api/v1/wallet/pay-booking/${bookingId}`, {
      method: 'POST',
    }),
};
