import React, { useCallback, useState } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '@/components/ui/button';
import {
  Badge, BRAND, Card, EmptyState, ErrorState, Loading, Muted, ProgressBar, Row, Screen, StatCard, StatGrid, Tabs, statusTone,
} from '@/components/ui/kit';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import { DEFAULT_THUMBNAIL } from '@/lib/api';
import { formatDate, formatDateTime, formatMoney, fullName, PAYMENT_METHOD_LABEL, PAYMENT_STATUS_LABEL, timeAgo } from '@/lib/format';
import { errorMessage } from '@/lib/notify';
import type { Certificate, Enrollment, Transaction } from '@/lib/types';

type Tab = 'courses' | 'certificates' | 'payments';

/** Student dashboard (FR-033, FR-063..067). */
export default function StudentDashboard() {
  const router = useRouter();
  const { session, profile } = useAuth();
  const [tab, setTab] = useState<Tab>('courses');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [certs, setCerts] = useState<Certificate[]>([]);
  const [txs, setTxs] = useState<Transaction[]>([]);

  const load = useCallback(async () => {
    if (!session?.user) return;
    const uid = session.user.id;
    const [e, c, t] = await Promise.all([
      supabase.from('enrollments')
        .select('*, course:courses(course_id, title, thumbnail_url, total_lessons, instructor:public_profiles!courses_instructor_id_fkey(first_name, last_name))')
        .eq('student_id', uid).neq('status', 'dropped')
        .order('last_accessed_at', { ascending: false, nullsFirst: false }),
      supabase.from('certificates').select('*, course:courses(title)').eq('student_id', uid).order('issued_at', { ascending: false }),
      supabase.from('transactions').select('*, course:courses(title)').eq('student_id', uid).order('transaction_date', { ascending: false }),
    ]);
    const failed = e.error ?? c.error ?? t.error;
    setError(failed ? errorMessage(failed) : null);
    setEnrollments((e.data as unknown as Enrollment[]) ?? []);
    setCerts((c.data as unknown as Certificate[]) ?? []);
    setTxs((t.data as unknown as Transaction[]) ?? []);
    setLoading(false);
  }, [session?.user]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  if (loading) return <Loading />;
  if (error) return <Screen wide><ErrorState message={error} onRetry={load} /></Screen>;

  const active = enrollments.filter((e) => e.status === 'active');
  const completed = enrollments.filter((e) => e.status === 'completed');
  const avg = enrollments.length ? Math.round(enrollments.reduce((s, e) => s + Number(e.progress_percentage), 0) / enrollments.length) : 0;
  const spent = txs.filter((t) => t.payment_status === 'completed').reduce((s, t) => s + Number(t.amount), 0);
  const next = active[0];

  return (
    <Screen wide>
      <Text style={styles.hello}>Xin chào, {fullName(profile)} 👋</Text>
      <Muted style={{ marginBottom: 16 }}>Theo dõi tiến độ học tập, chứng chỉ và lịch sử thanh toán của bạn.</Muted>

      <StatGrid>
        <StatCard label="Đang học" value={active.length} icon="book-outline" highlight />
        <StatCard label="Đã hoàn thành" value={completed.length} icon="checkmark-done-outline" tone="green" />
        <StatCard label="Tiến độ trung bình" value={`${avg}%`} icon="trending-up-outline" tone="orange" />
        <StatCard label="Chứng chỉ" value={certs.length} icon="ribbon-outline" tone="purple" />
      </StatGrid>

      {next && (
        <Card style={{ backgroundColor: '#F5F8FF', borderColor: '#D6E0F7' }}>
          <Text style={{ fontWeight: '800', color: BRAND.blue, marginBottom: 6 }}>Bài học tiếp theo</Text>
          <Row gap={12}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontWeight: '700', color: BRAND.text, fontSize: 16 }} numberOfLines={2}>{next.course?.title}</Text>
              <Muted style={{ fontSize: 12 }}>Truy cập lần cuối {timeAgo(next.last_accessed_at ?? next.created_at)}</Muted>
            </View>
            <Button title="Tiếp tục" icon="play" size="sm" onPress={() => router.push({ pathname: '/(details)/course-player', params: { id: String(next.course_id) } })} />
          </Row>
        </Card>
      )}

      <Tabs<Tab>
        tabs={[
          { value: 'courses', label: `Khoá học (${enrollments.length})` },
          { value: 'certificates', label: `Chứng chỉ (${certs.length})` },
          { value: 'payments', label: 'Thanh toán' },
        ]}
        value={tab}
        onChange={setTab}
      />

      {tab === 'courses' && (enrollments.length === 0 ? (
        <EmptyState icon="school-outline" title="Bạn chưa đăng ký khoá học nào"
          action={<Button title="Khám phá khoá học" onPress={() => router.push('/(tabs)/courses')} />} />
      ) : (
        <View style={styles.grid}>
          {enrollments.map((e) => (
            <TouchableOpacity key={e.enrollment_id} style={styles.courseCard}
              onPress={() => router.push({ pathname: '/(details)/course-player', params: { id: String(e.course_id) } })}>
              <Image source={{ uri: e.course?.thumbnail_url || DEFAULT_THUMBNAIL }} style={styles.thumb} />
              <View style={{ padding: 12, gap: 6 }}>
                <Text style={{ fontWeight: '700', color: BRAND.text }} numberOfLines={2}>{e.course?.title}</Text>
                <Muted style={{ fontSize: 12 }}>{fullName(e.course?.instructor, 'VIAN Academy')}</Muted>
                <ProgressBar value={Number(e.progress_percentage)} color={e.status === 'completed' ? BRAND.green : BRAND.blue} />
                <Row style={{ justifyContent: 'space-between' }}>
                  <Muted style={{ fontSize: 12 }}>{Math.round(Number(e.progress_percentage))}% hoàn thành</Muted>
                  {e.status === 'completed' ? <Badge label="Hoàn thành" tone="green" /> : null}
                </Row>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      ))}

      {tab === 'certificates' && (certs.length === 0 ? (
        <EmptyState icon="ribbon-outline" title="Chưa có chứng chỉ" message="Hoàn thành 100% bài học của một khoá để nhận chứng chỉ." />
      ) : certs.map((c) => (
        <Card key={c.certificate_id} onPress={() => router.push({ pathname: '/(details)/certificate', params: { enrollment: String(c.enrollment_id) } })}>
          <Row gap={12}>
            <Ionicons name="ribbon" size={32} color={BRAND.red} />
            <View style={{ flex: 1 }}>
              <Text style={{ fontWeight: '700', color: BRAND.text }}>{c.course?.title}</Text>
              <Muted style={{ fontSize: 12 }}>Cấp ngày {formatDate(c.issued_at)} · Mã {c.certificate_code}</Muted>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#BBB" />
          </Row>
        </Card>
      )))}

      {tab === 'payments' && (
        <>
          <Muted style={{ marginBottom: 10 }}>Tổng chi tiêu: <Text style={{ fontWeight: '800', color: BRAND.text }}>{formatMoney(spent)}</Text></Muted>
          {txs.length === 0 ? <EmptyState icon="receipt-outline" title="Chưa có giao dịch" /> : txs.map((t) => (
            <Card key={t.transaction_id}>
              <Row style={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontWeight: '700', color: BRAND.text }} numberOfLines={2}>{t.course?.title ?? 'Khoá học đã xoá'}</Text>
                  <Muted style={{ fontSize: 12 }}>
                    {formatDateTime(t.transaction_date)} · {PAYMENT_METHOD_LABEL[t.payment_method]}
                    {t.coupon_code ? ` · Mã ${t.coupon_code}` : ''}
                  </Muted>
                  <Muted style={{ fontSize: 12 }}>Mã GD: {t.payment_gateway_transaction_id ?? `#${t.transaction_id}`}</Muted>
                </View>
                <View style={{ alignItems: 'flex-end', gap: 4 }}>
                  <Text style={{ fontWeight: '800', color: BRAND.text }}>{formatMoney(t.amount)}</Text>
                  <Badge label={PAYMENT_STATUS_LABEL[t.payment_status]} tone={statusTone(t.payment_status)} />
                </View>
              </Row>
            </Card>
          ))}
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  hello: { fontSize: 24, fontWeight: '800', color: BRAND.text, marginBottom: 4 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 14 },
  courseCard: { flexGrow: 1, flexBasis: 260, maxWidth: 400, borderWidth: 1, borderColor: BRAND.border, borderRadius: 12, overflow: 'hidden', backgroundColor: '#FFF' },
  thumb: { width: '100%', height: 130, backgroundColor: '#EEE' },
});
