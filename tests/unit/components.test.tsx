import React from 'react';
import { Text } from 'react-native';
import { act, fireEvent, render, renderHook, screen, waitFor } from '@testing-library/react-native';
import { RoleGuard } from '@/components/role-guard';
import { CourseCard } from '@/components/course-card';
import { ErrorState } from '@/components/ui/kit';
import { CartProvider, useCart } from '@/lib/cart';
import { useAuth } from '@/lib/auth';
import { kv } from '@/lib/storage';
import CartScreen from '@/app/(tabs)/cart';
import { supabase } from '@/lib/supabase';

jest.mock('@/lib/supabase', () => ({ supabase: { from: jest.fn() } }));
jest.mock('@/lib/auth', () => ({ ...jest.requireActual('@/lib/auth'), useAuth: jest.fn() }));
jest.mock('@/lib/storage', () => ({ kv: { get: jest.fn(), set: jest.fn() } }));
jest.mock('@expo/vector-icons', () => ({ Ionicons: () => null, FontAwesome: () => null, MaterialIcons: () => null }));
jest.mock('expo-router', () => {
  const { Text: T } = jest.requireActual('react-native');
  const { useEffect } = jest.requireActual('react');
  return {
    Redirect: ({ href }: { href: string }) => <T>redirect:{href}</T>,
    useRouter: () => ({ push: jest.fn() }),
    useFocusEffect: (cb: () => void) => useEffect(cb, [cb]),
  };
});

const mockAuth = (v: object) => (useAuth as jest.Mock).mockReturnValue({ session: null, role: null, profile: null, loading: false, ...v });
const signedIn = (role: string) => mockAuth({ session: { user: { id: 'u' } }, profile: { role }, role });

beforeEach(() => {
  (kv.get as jest.Mock).mockReset().mockResolvedValue(null);
  (kv.set as jest.Mock).mockReset().mockResolvedValue(undefined);
});

describe('RoleGuard', () => {
  const show = () => render(<RoleGuard roles={['instructor']}><Text>secret</Text></RoleGuard>);

  it('sends guests to login', () => {
    mockAuth({});
    show();
    expect(screen.queryByText('secret')).toBeNull();
    expect(screen.getByText('redirect:/(auth)/login')).toBeTruthy();
  });
  it('sends other roles home', () => {
    signedIn('student');
    show();
    expect(screen.queryByText('secret')).toBeNull();
    expect(screen.getByText('redirect:/(tabs)')).toBeTruthy();
  });
  it.each(['instructor', 'admin'])('lets %s in', (role) => {
    signedIn(role);
    show();
    expect(screen.getByText('secret')).toBeTruthy();
  });
  it('waits for the profile before deciding', () => {
    mockAuth({ session: { user: { id: 'u' } }, role: 'student' });
    show();
    expect(screen.queryByText(/secret|redirect/)).toBeNull();
  });
});

describe('cart', () => {
  const setup = async () => {
    const h = renderHook(() => useCart(), { wrapper: CartProvider });
    await act(async () => {});
    return h.result;
  };

  it('adds without duplicates, removes and persists', async () => {
    const cart = await setup();
    act(() => { cart.current.add(1); cart.current.add(1); cart.current.add(2); });
    expect(cart.current.ids).toEqual([1, 2]);
    act(() => cart.current.remove(1));
    expect(cart.current.has(1)).toBe(false);
    expect(kv.set).toHaveBeenLastCalledWith('vian_cart_v1', '[2]');
  });
  it('restores a saved cart and ignores bad entries', async () => {
    (kv.get as jest.Mock).mockResolvedValue('[3,"x",null,4]');
    expect((await setup()).current.ids).toEqual([3, 4]);
  });
  it('survives corrupted storage', async () => {
    (kv.get as jest.Mock).mockResolvedValue('{oops');
    expect((await setup()).current.ids).toEqual([]);
  });
});

describe('CartScreen', () => {
  const reply = (res: object) => (supabase.from as jest.Mock).mockReturnValue({ select: () => ({ in: async () => res }) });
  const show = async () => {
    mockAuth({});
    (kv.get as jest.Mock).mockResolvedValue('[7]');
    render(<CartProvider><CartScreen /></CartProvider>);
    await waitFor(() => expect(supabase.from).toHaveBeenCalled());
  };

  it('keeps the cart and shows an error when the request fails', async () => {
    reply({ data: null, error: { message: 'Failed to fetch' } });
    await show();
    expect(await screen.findByText('Không tải được dữ liệu')).toBeTruthy();
    expect(kv.set).not.toHaveBeenCalledWith('vian_cart_v1', '[]');
  });
  it('drops courses that really no longer exist', async () => {
    reply({ data: [], error: null });
    await show();
    await waitFor(() => expect(kv.set).toHaveBeenLastCalledWith('vian_cart_v1', '[]'));
  });
});

it('ErrorState retries', () => {
  const retry = jest.fn();
  render(<ErrorState message="lỗi" onRetry={retry} />);
  fireEvent.press(screen.getByText('Thử lại'));
  expect(retry).toHaveBeenCalledTimes(1);
});

it('CourseCard shows its data and opens on press', () => {
  const open = jest.fn();
  render(<CourseCard title="React" instructor="An" price="Miễn phí" rating={4.5} onPress={open} />);
  expect(screen.getByText('Miễn phí')).toBeTruthy();
  fireEvent.press(screen.getByText('React'));
  expect(open).toHaveBeenCalled();
});
