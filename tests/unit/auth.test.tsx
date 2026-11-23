import { act, renderHook } from '@testing-library/react-native';
import { AuthProvider, useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';

jest.mock('@/lib/supabase', () => ({
  supabase: { from: jest.fn(), auth: { getSession: jest.fn(), onAuthStateChange: jest.fn(), signOut: jest.fn() } },
}));

type Reply = { data: object | null; error: object | null };
let reply: Reply;
let emit: (event: string, session: object | null) => void;
const session = (id = 'u1') => ({ user: { id } });
const flush = () => act(async () => { await new Promise((r) => setTimeout(r, 10)); });

beforeEach(() => {
  reply = { data: { id: 'u1', role: 'instructor', status: 'active' }, error: null };
  (supabase.from as jest.Mock).mockReturnValue({
    select: () => ({ eq: () => ({ maybeSingle: async () => reply }) }),
    update: () => ({ eq: async () => ({}) }),
  });
  (supabase.auth.getSession as jest.Mock).mockResolvedValue({ data: { session: session() } });
  (supabase.auth.onAuthStateChange as jest.Mock).mockImplementation((cb) => {
    emit = cb;
    return { data: { subscription: { unsubscribe: jest.fn() } } };
  });
});

const setup = async () => {
  const { result } = renderHook(() => useAuth(), { wrapper: AuthProvider });
  await flush();
  return result;
};

it('keeps the same session object when the same user is re-emitted (tab focus, token refresh)', async () => {
  const auth = await setup();
  const before = auth.current.session;
  act(() => emit('SIGNED_IN', session()));
  await flush();
  expect(auth.current.session).toBe(before);
});

it('switches session for another user and clears it on sign out', async () => {
  const auth = await setup();
  act(() => emit('SIGNED_IN', session('u2')));
  await flush();
  expect(auth.current.session?.user.id).toBe('u2');
  act(() => emit('SIGNED_OUT', null));
  await flush();
  expect(auth.current.session).toBeNull();
  expect(auth.current.profile).toBeNull();
});

it('keeps the profile when a background refresh fails', async () => {
  const auth = await setup();
  reply = { data: null, error: { message: 'Failed to fetch' } };
  act(() => emit('TOKEN_REFRESHED', session()));
  await flush();
  expect(auth.current.role).toBe('instructor');
});
