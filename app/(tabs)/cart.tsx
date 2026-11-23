import React, { useCallback, useState } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '@/components/ui/button';
import { BRAND, Card, EmptyState, ErrorState, H1, Loading, Muted, Notice, Row, Screen } from '@/components/ui/kit';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import { useCart } from '@/lib/cart';
import { DEFAULT_THUMBNAIL } from '@/lib/api';
import { formatMoney, formatVND, fullName } from '@/lib/format';
import { errorMessage } from '@/lib/notify';
import type { Course } from '@/lib/types';

export default function CartScreen() {
  const router = useRouter();
  const { session } = useAuth();
  const cart = useCart();
  const [courses, setCourses] = useState<Course[]>([]);
  const [owned, setOwned] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!cart.ids.length) {
      setCourses([]);
      setError(null);
      setLoading(false);
      return;
    }
    const { data, error: e1 } = await supabase.from('courses')
      .select('course_id, title, price, thumbnail_url, instructor_id, status, instructor:public_profiles!courses_instructor_id_fkey(first_name, last_name)')
      .in('course_id', cart.ids);
    // A failed request must not be mistaken for "these courses no longer exist".
    setError(e1 ? errorMessage(e1) : null);
    if (e1) {
      setLoading(false);
      return;
    }
    const list = ((data as unknown as Course[]) ?? []).filter((c) => c.status === 'published');
    // Drop ids that no longer exist / are unpublished.
    const valid = new Set(list.map((c) => c.course_id));
    const stale = cart.ids.filter((x) => !valid.has(x));
    if (stale.length) cart.removeMany(stale);

    let ownedSet = new Set<number>();
    if (session?.user && list.length) {
      const { data: e } = await supabase.from('enrollments').select('course_id, status')
        .eq('student_id', session.user.id).in('course_id', list.map((c) => c.course_id));
      ownedSet = new Set((e ?? []).filter((x) => x.status !== 'dropped').map((x) => x.course_id));
      list.forEach((c) => { if (c.instructor_id === session.user.id) ownedSet.add(c.course_id); });
    }
    setOwned(ownedSet);
    setCourses(list);
    setLoading(false);
  }, [cart.ids.join(','), session?.user]); // eslint-disable-line react-hooks/exhaustive-deps

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const payable = courses.filter((c) => !owned.has(c.course_id));
  const total = payable.reduce((s, c) => s + Number(c.price), 0);

  if (loading) return <Loading />;

  return (
    <Screen tabBarInset>
      <View style={{ paddingTop: 28 }}>
        <H1>Giỏ hàng</H1>
        <Muted style={{ marginBottom: 16 }}>{courses.length} khoá học</Muted>
      </View>

      {error ? <ErrorState message={error} onRetry={load} /> : courses.length === 0 ? (
        <EmptyState
          icon="cart-outline"
          title="Giỏ hàng trống"
          message="Hãy khám phá các khoá học và thêm vào giỏ hàng."
          action={<Button title="Khám phá khoá học" onPress={() => router.push('/(tabs)/courses')} />}
        />
      ) : (
        <>
          {courses.map((c) => (
            <Card key={c.course_id} style={{ padding: 12 }}>
              <Row gap={12} style={{ alignItems: 'flex-start' }}>
                <TouchableOpacity onPress={() => router.push({ pathname: '/(details)/course-detail', params: { id: String(c.course_id) } })}>
                  <Image source={{ uri: c.thumbnail_url || DEFAULT_THUMBNAIL }} style={styles.thumb} />
                </TouchableOpacity>
                <View style={{ flex: 1 }}>
                  <Text style={styles.title} numberOfLines={2}>{c.title}</Text>
                  <Muted style={{ fontSize: 13 }}>{fullName(c.instructor, 'VIAN Academy')}</Muted>
                  {owned.has(c.course_id) ? (
                    <Text style={{ color: BRAND.green, fontWeight: '700', marginTop: 4 }}>Bạn đã sở hữu khoá học này</Text>
                  ) : (
                    <Text style={styles.price}>{formatVND(c.price)}</Text>
                  )}
                </View>
                <TouchableOpacity onPress={() => cart.remove(c.course_id)} accessibilityLabel="Xoá khỏi giỏ hàng" style={{ padding: 4 }}>
                  <Ionicons name="trash-outline" size={20} color={BRAND.red} />
                </TouchableOpacity>
              </Row>
            </Card>
          ))}

          <Card style={{ backgroundColor: '#FAFBFF' }}>
            <Row style={{ justifyContent: 'space-between' }}>
              <Text style={{ fontSize: 16, color: BRAND.text }}>Tạm tính ({payable.length} khoá)</Text>
              <Text style={{ fontSize: 22, fontWeight: '900', color: BRAND.red }}>{formatMoney(total)}</Text>
            </Row>
            <Muted style={{ fontSize: 12, marginTop: 4 }}>Mã giảm giá có thể áp dụng ở bước thanh toán.</Muted>
          </Card>

          {!session && <Notice>Bạn cần đăng nhập để thanh toán. Giỏ hàng sẽ được giữ lại trên thiết bị này.</Notice>}

          <Button
            title={session ? 'Tiến hành thanh toán' : 'Đăng nhập để thanh toán'}
            icon={session ? 'card-outline' : 'log-in-outline'}
            disabled={session ? payable.length === 0 : false}
            onPress={() => (session ? router.push('/(details)/checkout') : router.push('/(auth)/login'))}
          />
          <Button title="Tiếp tục mua sắm" variant="ghost" onPress={() => router.push('/(tabs)/courses')} style={{ marginTop: 10 }} />
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  thumb: { width: 96, height: 64, borderRadius: 8, backgroundColor: '#EEE' },
  title: { fontWeight: '700', color: BRAND.text, fontSize: 15, marginBottom: 2 },
  price: { color: BRAND.red, fontWeight: '800', fontSize: 16, marginTop: 4 },
});
