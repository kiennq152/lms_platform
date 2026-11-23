import React, { useCallback, useMemo, useState } from 'react';
import { StyleSheet, View, Text, ScrollView, Image, TouchableOpacity, Platform } from 'react-native';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '@/components/ui/button';
import { WebLayout } from '@/components/ui/web-layout';
import { Footer } from '@/components/ui/footer';
import { Avatar, Badge, BRAND, Card, EmptyState, ErrorState, Field, Loading, Muted, Notice, Row, Stars, statusTone } from '@/components/ui/kit';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import { useCart } from '@/lib/cart';
import { COURSE_DETAIL_SELECT, DEFAULT_THUMBNAIL } from '@/lib/api';
import { COURSE_STATUS_LABEL, formatDate, formatDuration, formatVND, fullName, LEVEL_LABEL, lines } from '@/lib/format';
import { confirmAsync, errorMessage, notify } from '@/lib/notify';
import type { Course, Enrollment, Module, OutlineLesson, Review } from '@/lib/types';

export default function CourseDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const courseId = Number(id);
  const router = useRouter();
  const { session, profile, role } = useAuth();
  const cart = useCart();

  const [loading, setLoading] = useState(true);
  const [course, setCourse] = useState<Course | null>(null);
  const [modules, setModules] = useState<Module[]>([]);
  const [outline, setOutline] = useState<OutlineLesson[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [enrollment, setEnrollment] = useState<Enrollment | null>(null);
  const [expanded, setExpanded] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const [myRating, setMyRating] = useState(5);
  const [myComment, setMyComment] = useState('');
  const [savingReview, setSavingReview] = useState(false);

  const load = useCallback(async () => {
    if (!courseId) {
      setLoading(false);
      return;
    }
    const [c, m, o, r] = await Promise.all([
      supabase.from('courses').select(COURSE_DETAIL_SELECT).eq('course_id', courseId).maybeSingle(),
      supabase.from('modules').select('*').eq('course_id', courseId).order('order_index'),
      supabase.from('course_outline').select('*').eq('course_id', courseId).order('order_index'),
      supabase.from('reviews').select('*, student:public_profiles!reviews_student_id_fkey(first_name, last_name, avatar_url)')
        .eq('course_id', courseId).order('created_at', { ascending: false }),
    ]);
    const failed = c.error ?? m.error ?? o.error ?? r.error;
    setError(failed ? errorMessage(failed) : null);
    setCourse((c.data as unknown as Course) ?? null);
    setModules((m.data as Module[]) ?? []);
    setOutline((o.data as OutlineLesson[]) ?? []);
    setReviews((r.data as unknown as Review[]) ?? []);
    if (m.data?.length) setExpanded((prev) => prev ?? m.data[0].module_id);

    if (session?.user) {
      const { data: e } = await supabase.from('enrollments').select('*')
        .eq('course_id', courseId).eq('student_id', session.user.id).maybeSingle();
      setEnrollment((e as Enrollment) ?? null);
      const mine = (r.data as unknown as Review[] | null)?.find((x) => x.student_id === session.user.id);
      if (mine) {
        setMyRating(mine.rating);
        setMyComment(mine.comment ?? '');
      }
    } else {
      setEnrollment(null);
    }
    setLoading(false);
  }, [courseId, session?.user]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const isOwner = !!course && !!session?.user && course.instructor_id === session.user.id;
  const isEnrolled = !!enrollment && enrollment.status !== 'dropped';
  const isFree = Number(course?.price ?? 0) === 0;
  const myReview = reviews.find((r) => r.student_id === session?.user?.id);
  const totalDuration = useMemo(() => outline.reduce((s, l) => s + (l.video_duration || 0), 0), [outline]);

  const requireLogin = () => {
    notify('Cần đăng nhập', 'Vui lòng đăng nhập để tiếp tục.');
    router.push('/(auth)/login');
  };

  const enrollFree = async () => {
    if (!session) return requireLogin();
    setBusy(true);
    const { error } = await supabase.from('enrollments').insert({ student_id: session.user.id, course_id: courseId });
    setBusy(false);
    if (error) return notify('Không thể đăng ký', errorMessage(error));
    notify('Đăng ký thành công', 'Bạn có thể bắt đầu học ngay bây giờ.');
    router.push({ pathname: '/(details)/course-player', params: { id: String(courseId) } });
  };

  const addToCart = () => {
    cart.add(courseId);
    notify('Đã thêm vào giỏ hàng', course?.title);
  };

  const buyNow = () => {
    cart.add(courseId);
    if (!session) return requireLogin();
    router.push({ pathname: '/(details)/checkout', params: { ids: String(courseId) } });
  };

  const saveReview = async () => {
    if (!session) return requireLogin();
    setSavingReview(true);
    const payload = { course_id: courseId, student_id: session.user.id, rating: myRating, comment: myComment.trim() || null };
    const { error } = myReview
      ? await supabase.from('reviews').update({ rating: myRating, comment: payload.comment, updated_at: new Date().toISOString() }).eq('review_id', myReview.review_id)
      : await supabase.from('reviews').insert(payload);
    setSavingReview(false);
    if (error) return notify('Không lưu được đánh giá', errorMessage(error));
    notify('Cảm ơn bạn!', 'Đánh giá của bạn đã được ghi nhận.');
    load();
  };

  const deleteReview = async (review: Review) => {
    if (!(await confirmAsync('Xoá đánh giá?', 'Thao tác này không thể hoàn tác.', 'Xoá', true))) return;
    const { error } = await supabase.from('reviews').delete().eq('review_id', review.review_id);
    if (error) return notify('Lỗi', errorMessage(error));
    if (review.student_id === session?.user?.id) { setMyComment(''); setMyRating(5); }
    load();
  };

  if (loading) return <Loading />;
  if (error) return <WebLayout><ErrorState message={error} onRetry={load} /></WebLayout>;
  if (!course) {
    return (
      <WebLayout>
        <EmptyState
          icon="alert-circle-outline"
          title="Không tìm thấy khoá học"
          message="Khoá học không tồn tại hoặc chưa được xuất bản."
          action={<Button title="Xem các khoá học khác" onPress={() => router.replace('/(tabs)/courses')} />}
        />
      </WebLayout>
    );
  }

  const outcomes = lines(course.learning_outcomes);
  const requirements = lines(course.requirements);

  const primaryActions = () => {
    if (isOwner || role === 'admin') {
      return (
        <>
          <Button title="Xem nội dung (chế độ xem trước)" icon="eye-outline" onPress={() => router.push({ pathname: '/(details)/course-player', params: { id: String(courseId) } })} />
          {isOwner && <Button title="Chỉnh sửa nội dung" variant="outline" icon="create-outline" onPress={() => router.push(`/instructor/curriculum/${courseId}` as any)} />}
        </>
      );
    }
    if (isEnrolled) {
      return (
        <Button
          title={enrollment!.status === 'completed' ? 'Ôn lại khoá học' : Number(enrollment!.progress_percentage) > 0 ? 'Tiếp tục học' : 'Bắt đầu học'}
          icon="play"
          onPress={() => router.push({ pathname: '/(details)/course-player', params: { id: String(courseId) } })}
        />
      );
    }
    if (course.status !== 'published') return null;
    if (isFree) return <Button title="Đăng ký học miễn phí" icon="school-outline" onPress={enrollFree} loading={busy} />;
    return (
      <>
        <Button title="Mua ngay" icon="flash-outline" onPress={buyNow} />
        <Button
          title={cart.has(courseId) ? 'Đã có trong giỏ hàng' : 'Thêm vào giỏ hàng'}
          variant="outline"
          icon="cart-outline"
          onPress={cart.has(courseId) ? () => router.push('/(tabs)/cart') : addToCart}
        />
      </>
    );
  };

  return (
    <WebLayout>
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        <View style={styles.banner}>
          <Image source={{ uri: course.thumbnail_url || DEFAULT_THUMBNAIL }} style={styles.bannerImage} />
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)/courses'))}
            accessibilityLabel="Quay lại"
          >
            <Ionicons name="arrow-back" size={22} color="#FFF" />
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          <Row wrap style={{ marginBottom: 10 }}>
            {course.category?.name ? <Badge label={course.category.name} tone="blue" /> : null}
            {course.level ? <Badge label={LEVEL_LABEL[course.level]} tone="gray" /> : null}
            {course.status !== 'published' ? <Badge label={COURSE_STATUS_LABEL[course.status]} tone={statusTone(course.status)} /> : null}
            {isEnrolled ? <Badge label={enrollment!.status === 'completed' ? 'Đã hoàn thành' : 'Đã đăng ký'} tone="green" /> : null}
          </Row>

          <Text style={styles.title}>{course.title}</Text>
          {course.short_description ? <Text style={styles.subtitle}>{course.short_description}</Text> : null}

          <Row wrap gap={12} style={{ marginBottom: 12 }}>
            <Row gap={6}>
              <Text style={styles.ratingText}>{Number(course.rating).toFixed(1)}</Text>
              <Stars value={Number(course.rating)} />
              <Muted>({reviews.length} đánh giá)</Muted>
            </Row>
            <Muted>{course.total_enrollments} học viên</Muted>
          </Row>

          <Muted style={{ marginBottom: 16 }}>
            Giảng viên <Text style={{ fontWeight: '700', color: BRAND.text }}>{fullName(course.instructor, 'VIAN Academy')}</Text>
            {course.language ? ` · ${course.language}` : ''} · Cập nhật {formatDate(course.updated_at)}
          </Muted>

          {!isEnrolled && !isOwner && <Text style={styles.price}>{formatVND(course.price)}</Text>}

          {enrollment?.status === 'dropped' && (
            <Notice tone="orange" icon="alert-circle-outline">Quyền truy cập khoá học này đã bị thu hồi (hoàn tiền). Bạn có thể mua lại.</Notice>
          )}
          {isOwner && course.status === 'rejected' && course.rejection_reason ? (
            <Notice tone="red" icon="close-circle-outline">Lý do bị từ chối: {course.rejection_reason}</Notice>
          ) : null}

          <View style={styles.actions}>{primaryActions()}</View>

          {outcomes.length > 0 && (
            <Card>
              <Text style={styles.sectionTitle}>Bạn sẽ học được gì</Text>
              {outcomes.map((item, i) => (
                <Row key={i} style={{ alignItems: 'flex-start', marginBottom: 8 }}>
                  <Ionicons name="checkmark" size={18} color={BRAND.red} />
                  <Text style={styles.bodyText}>{item}</Text>
                </Row>
              ))}
            </Card>
          )}

          <Text style={styles.sectionTitle}>Nội dung khóa học</Text>
          <Muted style={{ marginBottom: 10 }}>
            {modules.length} chương · {outline.length} bài học{totalDuration ? ` · ${formatDuration(totalDuration)} video` : ''}
          </Muted>
          {modules.length === 0 && <Muted>Giảng viên đang cập nhật nội dung.</Muted>}
          {modules.map((mod, idx) => {
            const ls = outline.filter((l) => l.module_id === mod.module_id);
            const open = expanded === mod.module_id;
            return (
              <View key={mod.module_id} style={styles.accordion}>
                <TouchableOpacity style={styles.accordionHeader} onPress={() => setExpanded(open ? null : mod.module_id)}>
                  <Text style={styles.accordionTitle}>Chương {idx + 1}: {mod.title}</Text>
                  <Muted>{ls.length} bài</Muted>
                  <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={18} color="#666" />
                </TouchableOpacity>
                {open && (
                  <View style={styles.accordionContent}>
                    {ls.map((lesson) => {
                      const canOpen = lesson.is_preview || isEnrolled || isOwner || role === 'admin';
                      return (
                        <TouchableOpacity
                          key={lesson.lesson_id}
                          style={styles.lessonItem}
                          disabled={!canOpen}
                          onPress={() => router.push({ pathname: '/(details)/course-player', params: { id: String(courseId), lesson: String(lesson.lesson_id) } })}
                        >
                          <Ionicons name={lesson.content_type === 'video' ? 'play-circle-outline' : 'document-text-outline'} size={18} color="#666" />
                          <Text style={[styles.lessonTitle, canOpen && { color: BRAND.text }]}>{lesson.title}</Text>
                          {lesson.is_preview && !isEnrolled ? <Text style={styles.previewTag}>Xem thử</Text> : null}
                          {!canOpen ? <Ionicons name="lock-closed-outline" size={14} color="#AAA" /> : null}
                          {lesson.video_duration ? <Muted style={{ fontSize: 12 }}>{formatDuration(lesson.video_duration)}</Muted> : null}
                        </TouchableOpacity>
                      );
                    })}
                    {ls.length === 0 && <Muted>Chưa có bài học.</Muted>}
                  </View>
                )}
              </View>
            );
          })}

          {requirements.length > 0 && (
            <View style={{ marginTop: 20 }}>
              <Text style={styles.sectionTitle}>Yêu cầu</Text>
              {requirements.map((r, i) => (
                <Row key={i} style={{ alignItems: 'flex-start', marginBottom: 6 }}>
                  <Text style={{ color: BRAND.muted }}>•</Text>
                  <Text style={styles.bodyText}>{r}</Text>
                </Row>
              ))}
            </View>
          )}

          <View style={{ marginTop: 20 }}>
            <Text style={styles.sectionTitle}>Mô tả</Text>
            <Text style={[styles.bodyText, { flex: 0 }]}>{course.description}</Text>
          </View>

          <View style={{ marginTop: 20 }}>
            <Text style={styles.sectionTitle}>Giảng viên</Text>
            <Card>
              <Row gap={12}>
                <Avatar uri={course.instructor?.avatar_url} user={course.instructor} size={56} />
                <View style={{ flex: 1 }}>
                  <Text style={{ fontWeight: '700', fontSize: 16, color: BRAND.text }}>{fullName(course.instructor, 'VIAN Academy')}</Text>
                  {course.instructor?.degree ? <Muted>{course.instructor.degree}</Muted> : null}
                  {course.instructor?.experience_years ? <Muted>{course.instructor.experience_years} năm kinh nghiệm</Muted> : null}
                </View>
              </Row>
              {course.instructor?.bio ? <Text style={[styles.bodyText, { marginTop: 10, flex: 0 }]}>{course.instructor.bio}</Text> : null}
            </Card>
          </View>

          <View style={{ marginTop: 20 }}>
            <Text style={styles.sectionTitle}>Đánh giá của học viên</Text>
            {isEnrolled && (
              <Card style={{ backgroundColor: '#FAFBFF' }}>
                <Text style={{ fontWeight: '700', marginBottom: 6, color: BRAND.text }}>{myReview ? 'Đánh giá của bạn' : 'Viết đánh giá'}</Text>
                <Stars value={myRating} size={26} onChange={setMyRating} />
                <Field
                  placeholder="Chia sẻ cảm nhận của bạn về khoá học..."
                  value={myComment}
                  onChangeText={setMyComment}
                  multiline
                  containerStyle={{ marginTop: 10 }}
                />
                <Row>
                  <Button title={myReview ? 'Cập nhật đánh giá' : 'Gửi đánh giá'} size="sm" onPress={saveReview} loading={savingReview} />
                  {myReview && <Button title="Xoá" size="sm" variant="ghost" onPress={() => deleteReview(myReview)} />}
                </Row>
              </Card>
            )}
            {reviews.length === 0 && <Muted>Chưa có đánh giá nào.</Muted>}
            {reviews.map((r) => (
              <View key={r.review_id} style={styles.review}>
                <Row gap={10}>
                  <Avatar uri={r.student?.avatar_url} user={r.student} size={36} />
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontWeight: '700', color: BRAND.text }}>{fullName(r.student)}</Text>
                    <Row gap={6}><Stars value={r.rating} size={12} /><Muted style={{ fontSize: 12 }}>{formatDate(r.created_at)}</Muted></Row>
                  </View>
                  {role === 'admin' && r.student_id !== session?.user?.id && (
                    <TouchableOpacity onPress={() => deleteReview(r)} accessibilityLabel="Xoá đánh giá">
                      <Ionicons name="trash-outline" size={18} color={BRAND.red} />
                    </TouchableOpacity>
                  )}
                </Row>
                {r.comment ? <Text style={[styles.bodyText, { marginTop: 6, flex: 0 }]}>{r.comment}</Text> : null}
              </View>
            ))}
          </View>

          {!profile && Platform.OS === 'web' && (
            <Notice tone="blue">Đăng nhập để đăng ký khoá học, theo dõi tiến độ và nhận chứng chỉ.</Notice>
          )}
        </View>
        <Footer />
      </ScrollView>
    </WebLayout>
  );
}

const styles = StyleSheet.create({
  banner: { width: '100%', height: 240, backgroundColor: '#DDD' },
  bannerImage: { width: '100%', height: '100%' },
  backButton: {
    position: 'absolute', top: 16, left: 16, backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 20, padding: 8,
  },
  content: { padding: 20 },
  title: { fontSize: 24, fontWeight: 'bold', lineHeight: 32, marginBottom: 8, color: BRAND.text },
  subtitle: { fontSize: 16, color: '#555', lineHeight: 24, marginBottom: 12 },
  ratingText: { fontSize: 16, fontWeight: 'bold', color: '#E08A00' },
  price: { fontSize: 28, fontWeight: '900', color: BRAND.red, marginBottom: 16 },
  actions: { gap: 10, marginBottom: 24 },
  sectionTitle: { fontSize: 19, fontWeight: 'bold', marginBottom: 12, color: BRAND.text },
  bodyText: { fontSize: 15, color: '#444', flex: 1, lineHeight: 22 },
  accordion: { borderWidth: 1, borderColor: '#EEE', borderRadius: 8, marginBottom: 8, overflow: 'hidden' },
  accordionHeader: { padding: 14, backgroundColor: '#F9F9F9', flexDirection: 'row', alignItems: 'center', gap: 8 },
  accordionTitle: { fontSize: 15, fontWeight: 'bold', color: '#333', flex: 1 },
  accordionContent: { padding: 14, backgroundColor: '#FFF', gap: 14 },
  lessonItem: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  lessonTitle: { fontSize: 14, color: '#888', flex: 1 },
  previewTag: { color: BRAND.blue, fontSize: 12, fontWeight: '700' },
  review: { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
});
