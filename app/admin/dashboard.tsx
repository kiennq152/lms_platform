import React, { useCallback, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { BarChart, BRAND, Card, H2, Loading, Muted, Notice, Row, Screen, StatCard, StatGrid } from '@/components/ui/kit';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import { formatCompact, formatMoney } from '@/lib/format';
import { errorMessage } from '@/lib/notify';

interface AdminStats {
  total_revenue: number; today_revenue: number; week_revenue: number; month_revenue: number; year_revenue: number;
  refunded_amount: number; transactions_count: number;
  users_total: number; users_by_role: Record<string, number>; new_users_30d: number; suspended_users: number; pending_instructors: number;
  courses_by_status: Record<string, number>;
  total_enrollments: number; completed_enrollments: number; certificates: number; open_tickets: number;
  revenue_by_month: { month: string; revenue: number }[];
  revenue_by_course: { course_id: number; title: string; revenue: number; sales: number }[];
  revenue_by_instructor: { id: string; name: string; email: string; revenue: number; sales: number }[];
}

const NAV: { route: string; icon: keyof typeof Ionicons.glyphMap; label: string; badge?: (s: AdminStats) => number }[] = [
  { route: '/admin/users', icon: 'people-outline', label: 'Người dùng', badge: (s) => s.pending_instructors },
  { route: '/admin/courses', icon: 'albums-outline', label: 'Kiểm duyệt khoá học', badge: (s) => s.courses_by_status?.pending ?? 0 },
  { route: '/admin/transactions', icon: 'receipt-outline', label: 'Giao dịch & Hoàn tiền' },
  { route: '/admin/coupons', icon: 'pricetag-outline', label: 'Mã giảm giá' },
  { route: '/admin/categories', icon: 'grid-outline', label: 'Danh mục' },
  { route: '/admin/tickets', icon: 'help-buoy-outline', label: 'Yêu cầu hỗ trợ', badge: (s) => s.open_tickets },
  { route: '/admin/settings', icon: 'settings-outline', label: 'Cài đặt hệ thống' },
];

export default function AdminDashboard() {
  const router = useRouter();
  const { settings } = useAuth();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const { data, error: e } = await supabase.rpc('admin_stats');
    setError(e ? errorMessage(e) : null);
    setStats((data as AdminStats) ?? null);
    setLoading(false);
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  if (loading) return <Loading />;

  const s = stats;
  const completion = s && s.total_enrollments ? Math.round((s.completed_enrollments / s.total_enrollments) * 100) : 0;

  return (
    <Screen wide refreshing={refreshing} onRefresh={async () => { setRefreshing(true); await load(); setRefreshing(false); }}>
      {settings?.maintenance_mode && (
        <Notice tone="orange" icon="construct-outline">Chế độ bảo trì đang BẬT – người dùng thường không truy cập được hệ thống.</Notice>
      )}
      {error && <Notice tone="red" icon="alert-circle-outline">{error} (Đã chạy migration SRS MVP chưa?)</Notice>}

      <View style={styles.nav}>
        {NAV.map((n) => {
          const count = s && n.badge ? n.badge(s) : 0;
          return (
            <TouchableOpacity key={n.route} style={styles.navItem} onPress={() => router.push(n.route as any)}>
              <Ionicons name={n.icon} size={24} color={BRAND.blue} />
              <Text style={styles.navLabel}>{n.label}</Text>
              {count > 0 && <View style={styles.navBadge}><Text style={styles.navBadgeText}>{count}</Text></View>}
            </TouchableOpacity>
          );
        })}
      </View>

      {s && (
        <>
          <H2>Doanh thu</H2>
          <StatGrid>
            <StatCard label="Tổng doanh thu" value={formatMoney(s.total_revenue)} sub={`${s.transactions_count} giao dịch thành công`} icon="cash-outline" highlight />
            <StatCard label="Hôm nay" value={formatMoney(s.today_revenue)} icon="today-outline" tone="green" />
            <StatCard label="Tuần này" value={formatMoney(s.week_revenue)} icon="calendar-outline" tone="blue" />
            <StatCard label="Tháng này" value={formatMoney(s.month_revenue)} sub={`Năm nay: ${formatMoney(s.year_revenue)}`} icon="stats-chart-outline" tone="orange" />
            <StatCard label="Đã hoàn tiền" value={formatMoney(s.refunded_amount)} icon="return-down-back-outline" tone="purple" />
          </StatGrid>

          <Card>
            <Text style={styles.cardTitle}>Doanh thu 12 tháng</Text>
            <BarChart data={s.revenue_by_month.map((m) => ({ label: m.month.slice(0, 2), value: Number(m.revenue) }))} format={formatCompact} height={180} />
          </Card>

          <H2>Người dùng & Học tập</H2>
          <StatGrid>
            <StatCard label="Tổng người dùng" value={s.users_total} sub={`+${s.new_users_30d} trong 30 ngày`} icon="people-outline" tone="blue" />
            <StatCard label="Học viên / Giảng viên" value={`${s.users_by_role?.student ?? 0} / ${s.users_by_role?.instructor ?? 0}`} sub={`${s.users_by_role?.admin ?? 0} admin · ${s.suspended_users} bị khoá`} icon="school-outline" tone="gray" />
            <StatCard label="Lượt đăng ký" value={s.total_enrollments} sub={`Tỉ lệ hoàn thành ${completion}%`} icon="book-outline" tone="green" />
            <StatCard label="Chứng chỉ đã cấp" value={s.certificates} icon="ribbon-outline" tone="purple" />
          </StatGrid>

          <H2>Khoá học</H2>
          <StatGrid>
            <StatCard label="Đã xuất bản" value={s.courses_by_status?.published ?? 0} icon="checkmark-circle-outline" tone="green" />
            <StatCard label="Chờ duyệt" value={s.courses_by_status?.pending ?? 0} icon="time-outline" tone="orange" />
            <StatCard label="Bản nháp" value={s.courses_by_status?.draft ?? 0} icon="document-outline" tone="gray" />
            <StatCard label="Bị từ chối" value={s.courses_by_status?.rejected ?? 0} icon="close-circle-outline" tone="red" />
          </StatGrid>

          <View style={styles.cols}>
            <Card style={styles.col}>
              <Text style={styles.cardTitle}>Top khoá học theo doanh thu</Text>
              {s.revenue_by_course.length === 0 && <Muted>Chưa có dữ liệu.</Muted>}
              {s.revenue_by_course.map((c, i) => (
                <Row key={c.course_id} style={styles.rankRow}>
                  <Text style={styles.rank}>{i + 1}</Text>
                  <Text style={{ flex: 1, color: BRAND.text }} numberOfLines={1}>{c.title}</Text>
                  <Muted style={{ fontSize: 12 }}>{c.sales} lượt</Muted>
                  <Text style={styles.amount}>{formatCompact(c.revenue)}</Text>
                </Row>
              ))}
            </Card>
            <Card style={styles.col}>
              <Text style={styles.cardTitle}>Doanh thu theo giảng viên</Text>
              {s.revenue_by_instructor.length === 0 && <Muted>Chưa có dữ liệu.</Muted>}
              {s.revenue_by_instructor.map((u, i) => (
                <Row key={u.id} style={styles.rankRow}>
                  <Text style={styles.rank}>{i + 1}</Text>
                  <Text style={{ flex: 1, color: BRAND.text }} numberOfLines={1}>{u.name || u.email}</Text>
                  <Muted style={{ fontSize: 12 }}>{u.sales} lượt</Muted>
                  <Text style={styles.amount}>{formatCompact(u.revenue)}</Text>
                </Row>
              ))}
            </Card>
          </View>
          <Muted style={{ fontSize: 12, marginTop: 8 }}>
            Giám sát máy chủ, log hệ thống và sao lưu được cung cấp bởi Supabase Dashboard (Logs, Reports, Backups).
          </Muted>
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  nav: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 12 },
  navItem: {
    flexGrow: 1, flexBasis: 150, alignItems: 'center', gap: 6, paddingVertical: 16, paddingHorizontal: 8,
    borderRadius: 12, borderWidth: 1, borderColor: BRAND.border, backgroundColor: '#FAFBFF',
  },
  navLabel: { fontWeight: '700', color: BRAND.text, fontSize: 13, textAlign: 'center' },
  navBadge: { position: 'absolute', top: 8, right: 8, backgroundColor: BRAND.red, borderRadius: 10, minWidth: 20, paddingHorizontal: 5, height: 20, alignItems: 'center', justifyContent: 'center' },
  navBadgeText: { color: '#FFF', fontSize: 11, fontWeight: '800' },
  cardTitle: { fontWeight: '800', color: BRAND.text, marginBottom: 12, fontSize: 15 },
  cols: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  col: { flexGrow: 1, flexBasis: 340 },
  rankRow: { paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#F3F3F3' },
  rank: { width: 22, fontWeight: '800', color: BRAND.blue },
  amount: { fontWeight: '800', color: BRAND.text, width: 64, textAlign: 'right' },
});
