import React, { useCallback, useMemo, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { Stack, useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import {
  Avatar, Badge, BRAND, Card, EmptyState, Loading, Muted, ProgressBar, Row, Screen, StatCard, StatGrid, Tabs, statusTone,
} from '@/components/ui/kit';
import { supabase } from '@/lib/supabase';
import { formatDate, formatMoney, fullName, timeAgo } from '@/lib/format';
import { errorMessage, notify } from '@/lib/notify';
import type { Course, Enrollment, ForumTopic, Profile } from '@/lib/types';

type Tab = 'students' | 'qa';
type Row_ = Enrollment & { student: Pick<Profile, 'first_name' | 'last_name' | 'email' | 'avatar_url'> | null };

/** Instructor view of one course: enrollments + progress (FR-070) and student questions (FR-061). */
export default function CourseStudentsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const courseId = Number(id);
  const router = useRouter();
  const [tab, setTab] = useState<Tab>('students');
  const [course, setCourse] = useState<Course | null>(null);
  const [rows, setRows] = useState<Row_[]>([]);
  const [questions, setQuestions] = useState<(ForumTopic & { forum_replies: { is_solution: boolean }[] })[]>([]);
  const [revenue, setRevenue] = useState(0);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const [c, e, q, t, em] = await Promise.all([
      supabase.from('courses').select('course_id, title, total_lessons').eq('course_id', courseId).maybeSingle(),
      supabase.from('enrollments').select('*, student:public_profiles!enrollments_student_id_fkey(first_name, last_name, avatar_url)')
        .eq('course_id', courseId).order('created_at', { ascending: false }),
      supabase.from('forum_topics').select('*, author:public_profiles!forum_topics_author_id_fkey(first_name, last_name, avatar_url, role), forum_replies(is_solution)')
        .eq('course_id', courseId).order('created_at', { ascending: false }),
      supabase.from('transactions').select('amount').eq('course_id', courseId).eq('payment_status', 'completed'),
      supabase.rpc('course_student_emails', { p_course: courseId }),
    ]);
    const failed = c.error ?? e.error ?? q.error ?? t.error ?? em.error;
    if (failed) notify('Không tải được dữ liệu', errorMessage(failed));
    const emails = new Map(((em.data ?? []) as { student_id: string; email: string }[]).map((x) => [x.student_id, x.email]));
    setCourse((c.data as Course) ?? null);
    setRows(((e.data as unknown as Row_[]) ?? []).map((r) => ({
      ...r,
      student: r.student && { ...r.student, email: emails.get(r.student_id) ?? '' },
    })));
    setQuestions((q.data as any) ?? []);
    setRevenue((t.data ?? []).reduce((s, x) => s + Number(x.amount), 0));
    setLoading(false);
  }, [courseId]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const filtered = useMemo(() => {
    const s = search.trim().toLowerCase();
    if (!s) return rows;
    return rows.filter((r) => `${fullName(r.student, '')} ${r.student?.email ?? ''}`.toLowerCase().includes(s));
  }, [rows, search]);

  if (loading) return <Loading />;

  const active = rows.filter((r) => r.status !== 'dropped');
  const completed = rows.filter((r) => r.status === 'completed').length;
  const avg = active.length ? Math.round(active.reduce((s, r) => s + Number(r.progress_percentage), 0) / active.length) : 0;
  const unanswered = questions.filter((q) => q.type === 'question' && !q.forum_replies?.some((r) => r.is_solution)).length;

  return (
    <Screen wide>
      <Stack.Screen options={{ title: course?.title ?? 'Học viên' }} />
      <StatGrid>
        <StatCard label="Học viên" value={active.length} icon="people-outline" highlight />
        <StatCard label="Hoàn thành" value={completed} icon="ribbon-outline" tone="green" />
        <StatCard label="Tiến độ TB" value={`${avg}%`} icon="trending-up-outline" tone="orange" />
        <StatCard label="Doanh thu" value={formatMoney(revenue)} icon="cash-outline" tone="purple" />
      </StatGrid>

      <Tabs<Tab>
        tabs={[{ value: 'students', label: `Học viên (${rows.length})` }, { value: 'qa', label: `Hỏi đáp (${unanswered} chưa giải đáp)` }]}
        value={tab}
        onChange={setTab}
      />

      {tab === 'students' && (
        <>
          <View style={styles.search}>
            <Ionicons name="search" size={18} color="#999" />
            <TextInput style={{ flex: 1, paddingVertical: 10 }} placeholder="Tìm học viên theo tên hoặc email" value={search} onChangeText={setSearch} />
          </View>
          {filtered.length === 0 ? <EmptyState icon="people-outline" title="Chưa có học viên" /> : filtered.map((r) => (
            <Card key={r.enrollment_id} style={{ paddingVertical: 12 }}>
              <Row gap={12} wrap>
                <Avatar uri={r.student?.avatar_url} user={r.student} size={40} />
                <View style={{ flex: 1, minWidth: 180 }}>
                  <Text style={{ fontWeight: '700', color: BRAND.text }}>{fullName(r.student)}</Text>
                  <Muted style={{ fontSize: 12 }}>{r.student?.email} · đăng ký {formatDate(r.enrollment_date)}</Muted>
                </View>
                <View style={{ width: 180, gap: 4 }}>
                  <ProgressBar value={Number(r.progress_percentage)} color={r.status === 'completed' ? BRAND.green : BRAND.blue} />
                  <Row style={{ justifyContent: 'space-between' }}>
                    <Muted style={{ fontSize: 12 }}>{Math.round(Number(r.progress_percentage))}%</Muted>
                    <Muted style={{ fontSize: 12 }}>{r.last_accessed_at ? timeAgo(r.last_accessed_at) : 'Chưa học'}</Muted>
                  </Row>
                </View>
                <Badge label={r.status === 'completed' ? 'Hoàn thành' : r.status === 'dropped' ? 'Đã huỷ' : 'Đang học'} tone={statusTone(r.status)} />
              </Row>
            </Card>
          ))}
        </>
      )}

      {tab === 'qa' && (questions.length === 0 ? (
        <EmptyState icon="chatbubbles-outline" title="Chưa có câu hỏi" message="Câu hỏi của học viên trong trình phát bài học sẽ hiển thị ở đây." />
      ) : questions.map((q) => {
        const solved = q.forum_replies?.some((r) => r.is_solution);
        return (
          <TouchableOpacity key={q.topic_id} onPress={() => router.push({ pathname: '/(details)/topic', params: { id: String(q.topic_id) } } as any)}>
            <Card>
              <Row style={{ justifyContent: 'space-between' }}>
                <Text style={{ fontWeight: '700', color: BRAND.text, flex: 1 }}>{q.title}</Text>
                <Badge label={solved ? 'Đã giải đáp' : `${q.reply_count} trả lời`} tone={solved ? 'green' : q.reply_count ? 'blue' : 'orange'} />
              </Row>
              <Muted numberOfLines={2} style={{ marginTop: 4 }}>{q.content}</Muted>
              <Muted style={{ fontSize: 12, marginTop: 4 }}>{fullName(q.author)} · {timeAgo(q.created_at)}</Muted>
            </Card>
          </TouchableOpacity>
        );
      }))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  search: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#F5F5F5', borderRadius: 10, paddingHorizontal: 12, marginBottom: 12 },
});
