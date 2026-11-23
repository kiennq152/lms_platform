import React, { useCallback, useMemo, useState } from 'react';
import { View, Text, Image, TextInput, StyleSheet } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '@/components/ui/button';
import { Badge, BRAND, Card, Chips, EmptyState, Field, Loading, Muted, Row, Screen, statusTone } from '@/components/ui/kit';
import { supabase } from '@/lib/supabase';
import { COURSE_CARD_SELECT, DEFAULT_THUMBNAIL } from '@/lib/api';
import { COURSE_STATUS_LABEL, formatDate, formatVND, fullName, LEVEL_LABEL } from '@/lib/format';
import { confirmAsync, errorMessage, notify } from '@/lib/notify';
import type { Course, CourseStatus } from '@/lib/types';

type Filter = 'all' | CourseStatus;

/** Course moderation (FR-026..029). */
export default function AdminCourses() {
  const router = useRouter();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>('pending');
  const [search, setSearch] = useState('');
  const [rejecting, setRejecting] = useState<{ id: number; reason: string } | null>(null);

  const load = useCallback(async () => {
    const { data, error } = await supabase.from('courses').select(COURSE_CARD_SELECT).order('updated_at', { ascending: false }).limit(1000);
    if (error) notify('Lỗi', errorMessage(error));
    setCourses((data as unknown as Course[]) ?? []);
    setLoading(false);
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    courses.forEach((x) => { c[x.status] = (c[x.status] ?? 0) + 1; });
    return c;
  }, [courses]);

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return courses.filter((c) => (filter === 'all' || c.status === filter)
      && (!q || `${c.title} ${fullName(c.instructor, '')}`.toLowerCase().includes(q)));
  }, [courses, filter, search]);

  const setStatus = async (c: Course, status: CourseStatus, extra: Partial<Course> = {}, confirmText?: string) => {
    if (confirmText && !(await confirmAsync(confirmText))) return;
    const { error } = await supabase.from('courses').update({ status, ...extra }).eq('course_id', c.course_id);
    if (error) return notify('Không cập nhật được', errorMessage(error));
    setRejecting(null);
    load();
  };

  const remove = async (c: Course) => {
    if (!(await confirmAsync('Xoá vĩnh viễn khoá học?', `"${c.title}" cùng toàn bộ bài học, lượt đăng ký và đánh giá sẽ bị xoá. Giao dịch được giữ lại.`, 'Xoá', true))) return;
    const { error } = await supabase.from('courses').delete().eq('course_id', c.course_id);
    if (error) return notify('Không xoá được', errorMessage(error));
    load();
  };

  if (loading) return <Loading />;

  return (
    <Screen wide>
      <View style={styles.search}>
        <Ionicons name="search" size={18} color="#999" />
        <TextInput style={{ flex: 1, paddingVertical: 10 }} placeholder="Tìm theo tên khoá học hoặc giảng viên" value={search} onChangeText={setSearch} />
      </View>
      <Chips<Filter>
        options={[
          { value: 'pending', label: `Chờ duyệt (${counts.pending ?? 0})` },
          { value: 'published', label: `Đã xuất bản (${counts.published ?? 0})` },
          { value: 'rejected', label: `Bị từ chối (${counts.rejected ?? 0})` },
          { value: 'draft', label: `Bản nháp (${counts.draft ?? 0})` },
          { value: 'all', label: `Tất cả (${courses.length})` },
        ]}
        value={filter}
        onChange={setFilter}
        style={{ marginBottom: 14 }}
      />

      {visible.length === 0 ? (
        <EmptyState icon="checkmark-done-outline" title={filter === 'pending' ? 'Không có khoá học nào chờ duyệt' : 'Không có khoá học'} />
      ) : visible.map((c) => (
        <Card key={c.course_id}>
          <Row gap={12} wrap style={{ alignItems: 'flex-start' }}>
            <Image source={{ uri: c.thumbnail_url || DEFAULT_THUMBNAIL }} style={styles.thumb} />
            <View style={{ flex: 1, minWidth: 220, gap: 4 }}>
              <Row wrap gap={6}>
                <Badge label={COURSE_STATUS_LABEL[c.status]} tone={statusTone(c.status)} />
                {c.category?.name ? <Badge label={c.category.name} tone="gray" /> : null}
                {c.level ? <Badge label={LEVEL_LABEL[c.level]} tone="gray" /> : null}
              </Row>
              <Text style={{ fontWeight: '700', fontSize: 16, color: BRAND.text }}>{c.title}</Text>
              <Muted style={{ fontSize: 13 }}>
                {fullName(c.instructor, '—')} · {formatVND(c.price)} · {c.total_lessons} bài · {c.total_enrollments} học viên · cập nhật {formatDate((c as any).updated_at ?? c.created_at)}
              </Muted>
              {c.short_description ? <Muted numberOfLines={2}>{c.short_description}</Muted> : null}
              {c.status === 'rejected' && c.rejection_reason ? <Text style={{ color: BRAND.red, fontSize: 13 }}>Lý do: {c.rejection_reason}</Text> : null}
            </View>
          </Row>

          {rejecting?.id === c.course_id ? (
            <View style={{ marginTop: 12 }}>
              <Field label="Lý do từ chối (giảng viên sẽ thấy)" value={rejecting.reason} onChangeText={(t) => setRejecting({ id: c.course_id, reason: t })} multiline placeholder="VD: Video bài 2 không phát được; mô tả còn sơ sài..." />
              <Row>
                <Button size="sm" variant="danger" title="Xác nhận từ chối"
                  onPress={() => rejecting.reason.trim() ? setStatus(c, 'rejected', { rejection_reason: rejecting.reason.trim() }) : notify('Thiếu lý do', 'Vui lòng nhập lý do từ chối.')} />
                <Button size="sm" variant="ghost" title="Huỷ" onPress={() => setRejecting(null)} />
              </Row>
            </View>
          ) : (
            <Row wrap style={{ marginTop: 12 }}>
              <Button size="sm" variant="ghost" icon="eye-outline" title="Xem trang" onPress={() => router.push({ pathname: '/(details)/course-detail', params: { id: String(c.course_id) } })} />
              <Button size="sm" variant="ghost" icon="play-outline" title="Xem nội dung" onPress={() => router.push({ pathname: '/(details)/course-player', params: { id: String(c.course_id) } })} />
              <Button size="sm" variant="ghost" icon="create-outline" title="Sửa thông tin" onPress={() => router.push({ pathname: '/instructor/create-course', params: { id: String(c.course_id) } })} />
              {c.status !== 'published' && (
                <Button size="sm" variant="success" icon="checkmark" title="Duyệt & xuất bản" onPress={() => setStatus(c, 'published', { rejection_reason: null }, `Xuất bản "${c.title}"?`)} />
              )}
              {c.status !== 'rejected' && c.status !== 'draft' && (
                <Button size="sm" variant="danger" icon="close" title={c.status === 'published' ? 'Gỡ & từ chối' : 'Từ chối'} onPress={() => setRejecting({ id: c.course_id, reason: '' })} />
              )}
              {c.status === 'published' && (
                <Button size="sm" variant="outline" title="Chuyển về nháp" onPress={() => setStatus(c, 'draft', {}, 'Gỡ khoá học khỏi danh mục và chuyển về bản nháp?')} />
              )}
              <Button size="sm" variant="ghost" icon="trash-outline" title="Xoá" textStyle={{ color: BRAND.red }} onPress={() => remove(c)} />
            </Row>
          )}
        </Card>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  search: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#F5F5F5', borderRadius: 10, paddingHorizontal: 12, marginBottom: 12 },
  thumb: { width: 140, height: 84, borderRadius: 8, backgroundColor: '#EEE' },
});
