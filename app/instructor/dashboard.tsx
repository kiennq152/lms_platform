import React, { useCallback, useState } from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { Button } from '@/components/ui/button';
import {
  Badge, BarChart, BRAND, Card, Chips, EmptyState, H2, Loading, Muted, Notice, Row, Screen, StatCard, StatGrid, statusTone,
} from '@/components/ui/kit';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import { COURSE_CARD_SELECT, DEFAULT_THUMBNAIL } from '@/lib/api';
import { COURSE_STATUS_LABEL, formatCompact, formatMoney, formatVND, fullName, timeAgo } from '@/lib/format';
import { confirmAsync, errorMessage, notify } from '@/lib/notify';
import type { Course, CourseStatus } from '@/lib/types';

interface InstructorStats {
  total_revenue: number;
  month_revenue: number;
  total_students: number;
  total_enrollments: number;
  completed_enrollments: number;
  published_courses: number;
  pending_courses: number;
  draft_courses: number;
  avg_rating: number;
  open_questions: number;
  revenue_by_month: { month: string; revenue: number }[];
  revenue_by_course: { course_id: number; title: string; students: number; revenue: number; rating: number }[];
  recent_enrollments: { enrollment_id: number; created_at: string; course_title: string; student_name: string; email: string; progress_percentage: number }[];
}

type Filter = 'all' | CourseStatus;

export default function InstructorDashboard() {
  const router = useRouter();
  const { session, profile, role } = useAuth();
  const [stats, setStats] = useState<InstructorStats | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [filter, setFilter] = useState<Filter>('all');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!session?.user) return;
    const [s, c] = await Promise.all([
      supabase.rpc('instructor_stats'),
      supabase.from('courses').select(COURSE_CARD_SELECT).eq('instructor_id', session.user.id).order('updated_at', { ascending: false }),
    ]);
    if (s.error) notify('Không tải được thống kê', errorMessage(s.error));
    setStats((s.data as InstructorStats) ?? null);
    setCourses((c.data as unknown as Course[]) ?? []);
    setLoading(false);
  }, [session?.user]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const setStatus = async (course: Course, status: CourseStatus, confirmText?: string) => {
    if (confirmText && !(await confirmAsync(confirmText))) return;
    const { error } = await supabase.from('courses').update({ status }).eq('course_id', course.course_id);
    if (error) return notify('Không cập nhật được', errorMessage(error));
    if (status === 'pending') notify('Đã gửi duyệt', 'Quản trị viên sẽ xem xét khoá học của bạn.');
    load();
  };

  const remove = async (course: Course) => {
    if (!(await confirmAsync('Xoá khoá học?', `"${course.title}" và toàn bộ nội dung sẽ bị xoá vĩnh viễn.`, 'Xoá', true))) return;
    const { error } = await supabase.from('courses').delete().eq('course_id', course.course_id);
    if (error) return notify('Không xoá được', errorMessage(error));
    load();
  };

  const submitForReview = (course: Course) => {
    if (!course.total_lessons) {
      return notify('Chưa có bài học', 'Hãy thêm ít nhất một bài học trước khi gửi duyệt.');
    }
    setStatus(course, 'pending', 'Gửi khoá học cho quản trị viên duyệt?');
  };

  if (loading) return <Loading />;

  const approved = role === 'admin' || !!profile?.admin_approved;
  const visible = filter === 'all' ? courses : courses.filter((c) => c.status === filter);

  return (
    <Screen wide refreshing={refreshing} onRefresh={async () => { setRefreshing(true); await load(); setRefreshing(false); }}>
      <Row style={{ justifyContent: 'space-between', marginBottom: 16 }} wrap>
        <View style={{ flex: 1, minWidth: 220 }}>
          <Text style={styles.hello}>Xin chào, {fullName(profile)}!</Text>
          <Muted>Tổng quan hiệu quả giảng dạy của bạn</Muted>
        </View>
        <Button title="Tạo khoá học mới" icon="add" disabled={!approved} onPress={() => router.push('/instructor/create-course')} />
      </Row>

      {!approved && (
        <Notice tone="orange" icon="time-outline">
          Tài khoản giảng viên đang chờ quản trị viên phê duyệt. Bạn sẽ tạo được khoá học sau khi được duyệt.
        </Notice>
      )}

      <StatGrid>
        <StatCard label="Tổng doanh thu" value={formatMoney(stats?.total_revenue)} sub={`Tháng này: ${formatMoney(stats?.month_revenue)}`} icon="cash-outline" highlight />
        <StatCard label="Học viên" value={stats?.total_students ?? 0} sub={`${stats?.total_enrollments ?? 0} lượt đăng ký · ${stats?.completed_enrollments ?? 0} hoàn thành`} icon="people-outline" tone="blue" />
        <StatCard label="Khoá đã xuất bản" value={stats?.published_courses ?? 0} sub={`${stats?.pending_courses ?? 0} chờ duyệt · ${stats?.draft_courses ?? 0} nháp`} icon="albums-outline" tone="green" />
        <StatCard label="Đánh giá trung bình" value={Number(stats?.avg_rating ?? 0).toFixed(1)} sub={`${stats?.open_questions ?? 0} câu hỏi chưa giải đáp`} icon="star-outline" tone="orange" />
      </StatGrid>

      <View style={styles.cols}>
        <Card style={styles.col}>
          <Text style={styles.cardTitle}>Doanh thu 6 tháng gần nhất</Text>
          <BarChart data={(stats?.revenue_by_month ?? []).map((m) => ({ label: m.month.slice(0, 2) + '/' + m.month.slice(5), value: Number(m.revenue) }))} format={formatCompact} />
        </Card>
        <Card style={styles.col}>
          <Text style={styles.cardTitle}>Đăng ký gần đây</Text>
          {(stats?.recent_enrollments ?? []).length === 0 && <Muted>Chưa có học viên đăng ký.</Muted>}
          {(stats?.recent_enrollments ?? []).slice(0, 6).map((e) => (
            <View key={e.enrollment_id} style={styles.activity}>
              <Text style={{ color: BRAND.text }} numberOfLines={1}><Text style={{ fontWeight: '700' }}>{e.student_name || e.email}</Text> đăng ký “{e.course_title}”</Text>
              <Muted style={{ fontSize: 12 }}>{timeAgo(e.created_at)} · tiến độ {Math.round(Number(e.progress_percentage))}%</Muted>
            </View>
          ))}
        </Card>
      </View>

      {(stats?.revenue_by_course ?? []).length > 0 && (
        <Card>
          <Text style={styles.cardTitle}>Hiệu quả theo khoá học</Text>
          <Row style={styles.tableHead}>
            <Text style={[styles.th, { flex: 3 }]}>Khoá học</Text>
            <Text style={styles.th}>Học viên</Text>
            <Text style={styles.th}>Đánh giá</Text>
            <Text style={[styles.th, { textAlign: 'right' }]}>Doanh thu</Text>
          </Row>
          {stats!.revenue_by_course.map((r) => (
            <Row key={r.course_id} style={styles.tr}>
              <Text style={[styles.td, { flex: 3 }]} numberOfLines={1}>{r.title}</Text>
              <Text style={styles.td}>{r.students}</Text>
              <Text style={styles.td}>{Number(r.rating).toFixed(1)}</Text>
              <Text style={[styles.td, { textAlign: 'right', fontWeight: '700' }]}>{formatCompact(r.revenue)}</Text>
            </Row>
          ))}
        </Card>
      )}

      <H2>Khoá học của tôi ({courses.length})</H2>
      <Chips<Filter>
        options={[
          { value: 'all', label: 'Tất cả' },
          { value: 'published', label: 'Đã xuất bản' },
          { value: 'pending', label: 'Chờ duyệt' },
          { value: 'draft', label: 'Bản nháp' },
          { value: 'rejected', label: 'Bị từ chối' },
        ]}
        value={filter}
        onChange={setFilter}
        style={{ marginBottom: 12 }}
      />

      {visible.length === 0 ? (
        <EmptyState icon="albums-outline" title="Chưa có khoá học" message={approved ? 'Bắt đầu bằng việc tạo khoá học đầu tiên của bạn.' : undefined}
          action={approved ? <Button title="Tạo khoá học" onPress={() => router.push('/instructor/create-course')} /> : undefined} />
      ) : visible.map((c) => (
        <Card key={c.course_id}>
          <Row gap={12} style={{ alignItems: 'flex-start' }} wrap>
            <Image source={{ uri: c.thumbnail_url || DEFAULT_THUMBNAIL }} style={styles.thumb} />
            <View style={{ flex: 1, minWidth: 200, gap: 4 }}>
              <Row wrap gap={6}>
                <Badge label={COURSE_STATUS_LABEL[c.status]} tone={statusTone(c.status)} />
                {c.category?.name ? <Badge label={c.category.name} tone="gray" /> : null}
              </Row>
              <Text style={{ fontWeight: '700', fontSize: 16, color: BRAND.text }}>{c.title}</Text>
              <Muted style={{ fontSize: 13 }}>
                {formatVND(c.price)} · {c.total_lessons} bài học · {c.total_enrollments} học viên · ★ {Number(c.rating).toFixed(1)}
              </Muted>
              {c.status === 'rejected' && c.rejection_reason ? (
                <Text style={{ color: BRAND.red, fontSize: 13 }}>Lý do từ chối: {c.rejection_reason}</Text>
              ) : null}
            </View>
          </Row>
          <Row wrap style={{ marginTop: 12 }}>
            <Button size="sm" variant="ghost" icon="create-outline" title="Thông tin" onPress={() => router.push({ pathname: '/instructor/create-course', params: { id: String(c.course_id) } })} />
            <Button size="sm" variant="ghost" icon="list-outline" title="Nội dung" onPress={() => router.push(`/instructor/curriculum/${c.course_id}` as any)} />
            <Button size="sm" variant="ghost" icon="people-outline" title="Học viên & Hỏi đáp" onPress={() => router.push(`/instructor/students/${c.course_id}` as any)} />
            <Button size="sm" variant="ghost" icon="eye-outline" title="Xem trang" onPress={() => router.push({ pathname: '/(details)/course-detail', params: { id: String(c.course_id) } })} />
            {(c.status === 'draft' || c.status === 'rejected') && <Button size="sm" icon="send-outline" title="Gửi duyệt" onPress={() => submitForReview(c)} />}
            {c.status === 'pending' && <Button size="sm" variant="outline" title="Rút lại" onPress={() => setStatus(c, 'draft', 'Rút khoá học về bản nháp?')} />}
            {c.status === 'published' && <Button size="sm" variant="outline" title="Ẩn khoá học" onPress={() => setStatus(c, 'draft', 'Ẩn khoá học? Học viên đã đăng ký vẫn học được, nhưng khoá sẽ không còn trong danh mục. Muốn hiển thị lại cần gửi duyệt.')} />}
            {(c.status === 'draft' || c.status === 'rejected') && <Button size="sm" variant="ghost" icon="trash-outline" title="Xoá" textStyle={{ color: BRAND.red }} onPress={() => remove(c)} />}
          </Row>
        </Card>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  hello: { fontSize: 24, fontWeight: '800', color: BRAND.text },
  cols: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  col: { flexGrow: 1, flexBasis: 320 },
  cardTitle: { fontWeight: '800', color: BRAND.text, marginBottom: 12, fontSize: 15 },
  activity: { paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#F2F2F2' },
  thumb: { width: 120, height: 72, borderRadius: 8, backgroundColor: '#EEE' },
  tableHead: { borderBottomWidth: 1, borderBottomColor: BRAND.border, paddingBottom: 6 },
  th: { flex: 1, fontSize: 12, fontWeight: '700', color: BRAND.muted },
  tr: { paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#F4F4F4' },
  td: { flex: 1, fontSize: 13, color: BRAND.text },
});
