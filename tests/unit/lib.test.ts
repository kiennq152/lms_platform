import {
  formatCompact, formatDate, formatDuration, formatMoney, formatVND, fullName, initials, lines, timeAgo, youtubeId,
} from '@/lib/format';
import { errorMessage } from '@/lib/notify';
import { toCsv } from '@/lib/export';
import { homeForRole } from '@/lib/auth';

jest.mock('@/lib/supabase', () => ({ supabase: {} }));

describe('money', () => {
  it('formats VND with dot separators', () => {
    expect(formatVND(1500000)).toBe('1.500.000₫');
    expect(formatVND('499000.4')).toBe('499.000₫');
  });
  it('shows "Miễn phí" for free courses but 0₫ for totals', () => {
    expect(formatVND(0)).toBe('Miễn phí');
    expect(formatVND(null)).toBe('Miễn phí');
    expect(formatMoney(0)).toBe('0₫');
  });
  it.each([[999, '999'], [1500, '2k'], [2_500_000, '2.5 tr'], [3_000_000, '3 tr'], [1_200_000_000, '1.2 tỷ']])('compacts %d', (n, s) => {
    expect(formatCompact(n)).toBe(s);
  });
});

describe('dates and durations', () => {
  it('falls back to a dash on bad dates', () => {
    expect(formatDate(null)).toBe('—');
    expect(formatDate('not a date')).toBe('—');
  });
  it.each([[0, ''], [65, '01:05'], [3661, '1:01:01'], [-5, '']])('formats %d seconds', (n, s) => {
    expect(formatDuration(n)).toBe(s);
  });
  it('describes recent times', () => {
    const ago = (sec: number) => new Date(Date.now() - sec * 1000).toISOString();
    expect(timeAgo(ago(5))).toBe('vừa xong');
    expect(timeAgo(ago(125))).toBe('2 phút trước');
    expect(timeAgo(ago(7300))).toBe('2 giờ trước');
    expect(timeAgo(ago(86400 * 3 + 60))).toBe('3 ngày trước');
  });
});

describe('names', () => {
  it('joins names, then falls back to email, then to the default', () => {
    expect(fullName({ first_name: 'Nguyễn', last_name: 'An' })).toBe('Nguyễn An');
    expect(fullName({ first_name: null, last_name: null, email: 'a@x.vn' })).toBe('a@x.vn');
    expect(fullName(null, 'VIAN')).toBe('VIAN');
  });
  it('builds initials', () => {
    expect(initials({ first_name: 'nguyễn văn', last_name: 'an' })).toBe('NA');
    expect(initials(null)).toBe('?');
  });
  it('splits non-empty lines', () => expect(lines(' a \n\n b')).toEqual(['a', 'b']));
});

describe('youtubeId', () => {
  it.each([
    'https://youtu.be/abcdefghijk',
    'https://www.youtube.com/watch?v=abcdefghijk',
    'https://www.youtube.com/watch?list=x&v=abcdefghijk&t=3',
    'https://www.youtube.com/embed/abcdefghijk',
    'https://youtube.com/shorts/abcdefghijk',
    'abcdefghijk',
  ])('reads %s', (url) => expect(youtubeId(url)).toBe('abcdefghijk'));
  it('rejects other urls', () => {
    expect(youtubeId('https://vimeo.com/123')).toBeNull();
    expect(youtubeId(null)).toBeNull();
  });
});

describe('errorMessage', () => {
  it.each([
    [{ code: '42501', message: 'permission denied for schema public' }, 'Bạn không có quyền thực hiện thao tác này.'],
    [{ code: '23505', message: 'duplicate key value' }, 'Dữ liệu đã tồn tại.'],
    [{ message: 'TypeError: Failed to fetch' }, 'Không kết nối được máy chủ. Vui lòng kiểm tra mạng và thử lại.'],
    [{ message: 'Invalid login credentials' }, 'Email hoặc mật khẩu không đúng.'],
    [{ message: 'Mã giảm giá đã hết hạn' }, 'Mã giảm giá đã hết hạn'],
  ])('translates %j', (err, msg) => expect(errorMessage(err)).toBe(msg));
});

describe('toCsv', () => {
  it('quotes commas, quotes and newlines', () => {
    expect(toCsv(['a', 'b'], [['x,y', 'say "hi"'], ['1\n2', null]])).toBe('a,b\n"x,y","say ""hi"""\n"1\n2",');
  });
  it('neutralises formulas in user text but keeps negative numbers', () => {
    expect(toCsv(['n'], [['=HYPERLINK(1)'], ['@x'], [-5]])).toBe("n\n'=HYPERLINK(1)\n'@x\n-5");
  });
});

describe('homeForRole', () => {
  it('routes each role to its own area', () => {
    expect(homeForRole('admin')).toBe('/admin/dashboard');
    expect(homeForRole('instructor')).toBe('/instructor/dashboard');
    expect(homeForRole('student')).toBe('/(tabs)');
    expect(homeForRole(null)).toBe('/(tabs)');
  });
});
