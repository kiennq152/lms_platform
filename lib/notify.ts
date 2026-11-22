import { Alert, Platform } from 'react-native';

/** Alert that also works on web (react-native-web's Alert.alert is a no-op). */
export function notify(title: string, message?: string) {
  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined') window.alert(message ? `${title}\n\n${message}` : title);
    return;
  }
  Alert.alert(title, message);
}

export function confirmAsync(title: string, message = '', okText = 'Đồng ý', destructive = false): Promise<boolean> {
  if (Platform.OS === 'web') {
    if (typeof window === 'undefined') return Promise.resolve(false);
    return Promise.resolve(window.confirm(message ? `${title}\n\n${message}` : title));
  }
  return new Promise((resolve) => {
    Alert.alert(title, message, [
      { text: 'Huỷ', style: 'cancel', onPress: () => resolve(false) },
      { text: okText, style: destructive ? 'destructive' : 'default', onPress: () => resolve(true) },
    ], { cancelable: true, onDismiss: () => resolve(false) });
  });
}

/** Turns a Supabase/Postgres error into a readable Vietnamese message. */
export function errorMessage(err: unknown): string {
  const e = err as { message?: string; code?: string } | null;
  const msg = e?.message ?? String(err ?? 'Đã có lỗi xảy ra');
  if (e?.code === '42501' || /row-level security/i.test(msg)) return 'Bạn không có quyền thực hiện thao tác này.';
  if (e?.code === '23505' || /duplicate key/i.test(msg)) return 'Dữ liệu đã tồn tại.';
  if (/Invalid login credentials/i.test(msg)) return 'Email hoặc mật khẩu không đúng.';
  if (/Email not confirmed/i.test(msg)) return 'Email chưa được xác thực. Vui lòng kiểm tra hộp thư.';
  if (/Password should be at least/i.test(msg)) return 'Mật khẩu phải có ít nhất 6 ký tự.';
  if (/User already registered/i.test(msg)) return 'Email này đã được đăng ký.';
  if (/rate limit/i.test(msg)) return 'Bạn thao tác quá nhanh, vui lòng thử lại sau ít phút.';
  return msg;
}
