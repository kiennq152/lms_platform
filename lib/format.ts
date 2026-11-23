export function formatVND(value: number | string | null | undefined, freeLabel = 'Miễn phí'): string {
  const n = Number(value ?? 0);
  if (!n) return freeLabel;
  return new Intl.NumberFormat('vi-VN').format(Math.round(n)) + '₫';
}

/** Same as formatVND but shows 0₫ instead of "Miễn phí" (for money totals). */
export function formatMoney(value: number | string | null | undefined): string {
  return new Intl.NumberFormat('vi-VN').format(Math.round(Number(value ?? 0))) + '₫';
}

export function formatCompact(value: number | string | null | undefined): string {
  const n = Number(value ?? 0);
  if (n >= 1_000_000_000) return (n / 1_000_000_000).toFixed(1).replace(/\.0$/, '') + ' tỷ';
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, '') + ' tr';
  if (n >= 1_000) return (n / 1_000).toFixed(0) + 'k';
  return String(Math.round(n));
}

export function formatDate(value: string | null | undefined): string {
  if (!value) return '—';
  const d = new Date(value);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export function formatDateTime(value: string | null | undefined): string {
  if (!value) return '—';
  const d = new Date(value);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export function timeAgo(value: string | null | undefined): string {
  if (!value) return '';
  const diff = (Date.now() - new Date(value).getTime()) / 1000;
  if (diff < 60) return 'vừa xong';
  if (diff < 3600) return `${Math.floor(diff / 60)} phút trước`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} giờ trước`;
  if (diff < 86400 * 30) return `${Math.floor(diff / 86400)} ngày trước`;
  return formatDate(value);
}

/** Seconds -> "mm:ss" or "h:mm:ss". */
export function formatDuration(seconds: number | null | undefined): string {
  const s = Math.max(0, Math.round(Number(seconds ?? 0)));
  if (!s) return '';
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const pad = (x: number) => String(x).padStart(2, '0');
  return h ? `${h}:${pad(m)}:${pad(sec)}` : `${pad(m)}:${pad(sec)}`;
}

type NameLike = { first_name?: string | null; last_name?: string | null; email?: string | null };

export function fullName(u?: NameLike | null, fallback = 'Người dùng'): string {
  if (!u) return fallback;
  const name = [u.first_name, u.last_name].filter(Boolean).join(' ').trim();
  return name || u.email || fallback;
}

export function initials(u?: NameLike | null): string {
  const name = fullName(u, '?');
  const parts = name.split(/\s+/).filter(Boolean);
  return ((parts[0]?.[0] ?? '') + (parts.length > 1 ? parts[parts.length - 1][0] : '')).toUpperCase() || '?';
}

/** Extracts an 11-char YouTube id from any common URL form (or a bare id). */
export function youtubeId(url: string | null | undefined): string | null {
  if (!url) return null;
  const trimmed = url.trim();
  if (/^[\w-]{11}$/.test(trimmed)) return trimmed;
  const m = trimmed.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/|live\/|v\/))([\w-]{11})/);
  return m ? m[1] : null;
}

export const LEVEL_LABEL: Record<string, string> = {
  beginner: 'Cơ bản',
  intermediate: 'Trung cấp',
  advanced: 'Nâng cao',
};

export const COURSE_STATUS_LABEL: Record<string, string> = {
  draft: 'Bản nháp',
  pending: 'Chờ duyệt',
  approved: 'Đã duyệt',
  rejected: 'Bị từ chối',
  published: 'Đã xuất bản',
};

export const PAYMENT_METHOD_LABEL: Record<string, string> = {
  credit_card: 'Thẻ tín dụng',
  paypal: 'PayPal',
  bank_transfer: 'Chuyển khoản',
};

export const PAYMENT_STATUS_LABEL: Record<string, string> = {
  pending: 'Đang xử lý',
  completed: 'Thành công',
  failed: 'Thất bại',
  refunded: 'Đã hoàn tiền',
};

export const ROLE_LABEL: Record<string, string> = {
  student: 'Học viên',
  instructor: 'Giảng viên',
  admin: 'Quản trị viên',
};

export const USER_STATUS_LABEL: Record<string, string> = {
  active: 'Hoạt động',
  inactive: 'Không hoạt động',
  suspended: 'Bị khoá',
};

export const TICKET_STATUS_LABEL: Record<string, string> = {
  open: 'Mới',
  in_progress: 'Đang xử lý',
  resolved: 'Đã giải quyết',
  closed: 'Đã đóng',
};

export function lines(text: string | null | undefined): string[] {
  return (text ?? '').split('\n').map((s) => s.trim()).filter(Boolean);
}
