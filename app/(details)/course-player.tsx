import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, Platform, Linking, useWindowDimensions } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import YoutubePlayer from 'react-native-youtube-iframe';
import { Button } from '@/components/ui/button';
import { WebLayout } from '@/components/ui/web-layout';
import { Badge, BRAND, Card, EmptyState, Field, Loading, Muted, Notice, ProgressBar, Row, Tabs } from '@/components/ui/kit';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import { formatDuration, fullName, timeAgo, youtubeId } from '@/lib/format';
import { errorMessage, notify } from '@/lib/notify';
import type { Course, Enrollment, ForumTopic, Lesson, Module } from '@/lib/types';

type Tab = 'lessons' | 'overview' | 'qa';

function VideoBlock({ lesson, width, onEnded }: { lesson: Lesson; width: number; onEnded: () => void }) {
  const ytId = youtubeId(lesson.youtube_url) ?? youtubeId(lesson.video_url);
  const height = Math.round((width * 9) / 16);
  if (ytId) {
    return (
      <View style={{ backgroundColor: '#000' }}>
        <YoutubePlayer
          key={ytId}
          height={height}
          width={width}
          videoId={ytId}
          play={false}
          onChangeState={(state: string) => { if (state === 'ended') onEnded(); }}
        />
      </View>
    );
  }
  const url = lesson.video_url;
  if (url && Platform.OS === 'web') {
    return React.createElement('video', {
      key: url,
      src: url,
      controls: true,
      onEnded,
      style: { width: '100%', height, backgroundColor: '#000' },
    });
  }
  if (url) {
    return (
      <TouchableOpacity style={[styles.videoPlaceholder, { height }]} onPress={() => Linking.openURL(url)}>
        <Ionicons name="play-circle" size={64} color="#FFF" />
        <Text style={{ color: '#FFF', marginTop: 8 }}>Mở video</Text>
      </TouchableOpacity>
    );
  }
  return (
    <View style={[styles.videoPlaceholder, { height }]}>
      <Ionicons name="videocam-off-outline" size={48} color="#AAA" />
      <Text style={{ color: '#CCC', marginTop: 8 }}>Bài học chưa có video</Text>
    </View>
  );
}

export default function CoursePlayerScreen() {
  const { id, lesson: lessonParam } = useLocalSearchParams<{ id: string; lesson?: string }>();
  const courseId = Number(id);
  const router = useRouter();
  const { session, role } = useAuth();
  const { width: winWidth } = useWindowDimensions();
  const wide = Platform.OS === 'web' && winWidth >= 960;
  const frameWidth = Math.min(winWidth, 1200);
  const videoWidth = wide ? Math.round(frameWidth * 0.64) : Math.min(winWidth, 768);

  const [loading, setLoading] = useState(true);
  const [course, setCourse] = useState<Course | null>(null);
  const [modules, setModules] = useState<Module[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [enrollment, setEnrollment] = useState<Enrollment | null>(null);
  const [completed, setCompleted] = useState<Set<number>>(new Set());
  const [currentId, setCurrentId] = useState<number | null>(null);
  const [tab, setTab] = useState<Tab>('lessons');
  const [marking, setMarking] = useState(false);

  const [questions, setQuestions] = useState<ForumTopic[]>([]);
  const [qTitle, setQTitle] = useState('');
  const [qContent, setQContent] = useState('');
  const [posting, setPosting] = useState(false);

  const isOwner = !!course && course.instructor_id === session?.user?.id;
  const canTrack = !!enrollment && enrollment.status !== 'dropped';

  const ordered = useMemo(() => {
    const out: Lesson[] = [];
    modules.forEach((m) => lessons.filter((l) => l.module_id === m.module_id).sort((a, b) => a.order_index - b.order_index).forEach((l) => out.push(l)));
    return out;
  }, [modules, lessons]);

  const loadQuestions = useCallback(async () => {
    const { data } = await supabase.from('forum_topics')
      .select('*, author:users!forum_topics_author_id_fkey(first_name, last_name, avatar_url, role)')
      .eq('course_id', courseId).order('created_at', { ascending: false });
    setQuestions((data as unknown as ForumTopic[]) ?? []);
  }, [courseId]);

  useEffect(() => {
    (async () => {
      const [c, m, l] = await Promise.all([
        supabase.from('courses').select('course_id, title, description, instructor_id, status, total_lessons').eq('course_id', courseId).maybeSingle(),
        supabase.from('modules').select('*').eq('course_id', courseId).order('order_index'),
        supabase.from('lessons').select('*, module:modules!inner(course_id)').eq('module.course_id', courseId).order('order_index'),
      ]);
      setCourse((c.data as unknown as Course) ?? null);
      setModules((m.data as Module[]) ?? []);
      const ls = ((l.data as unknown as Lesson[]) ?? []);
      setLessons(ls);

      let done = new Set<number>();
      let resumeId: number | null = null;
      if (session?.user) {
        const { data: e } = await supabase.from('enrollments').select('*')
          .eq('course_id', courseId).eq('student_id', session.user.id).maybeSingle();
        setEnrollment((e as Enrollment) ?? null);
        if (e) {
          const { data: p } = await supabase.from('lesson_progress').select('lesson_id, is_completed, updated_at')
            .eq('enrollment_id', e.enrollment_id).order('updated_at', { ascending: false });
          done = new Set((p ?? []).filter((x) => x.is_completed).map((x) => x.lesson_id));
          resumeId = p?.[0]?.lesson_id ?? null;
        }
      }
      setCompleted(done);

      // Pick the lesson to show: explicit param > last touched (FR-051) > first unfinished > first.
      const sorted: Lesson[] = [];
      ((m.data as Module[]) ?? []).forEach((mod) => ls.filter((x) => x.module_id === mod.module_id).sort((a, b) => a.order_index - b.order_index).forEach((x) => sorted.push(x)));
      const wanted = Number(lessonParam) || null;
      const pick = (wanted && sorted.find((x) => x.lesson_id === wanted))
        || (resumeId && sorted.find((x) => x.lesson_id === resumeId && !done.has(x.lesson_id)))
        || sorted.find((x) => !done.has(x.lesson_id))
        || sorted[0];
      setCurrentId(pick?.lesson_id ?? null);
      setLoading(false);
    })();
    loadQuestions();
  }, [courseId, lessonParam, session?.user, loadQuestions]);

  const current = ordered.find((l) => l.lesson_id === currentId) ?? null;
  const currentIndex = current ? ordered.indexOf(current) : -1;
  const progress = ordered.length ? Math.round((completed.size / Math.max(course?.total_lessons || ordered.length, ordered.length)) * 100) : 0;

  const touch = useCallback(async (lessonId: number, isCompleted?: boolean) => {
    if (!enrollment || !canTrack) return;
    const row: Record<string, unknown> = { enrollment_id: enrollment.enrollment_id, lesson_id: lessonId };
    if (isCompleted !== undefined) row.is_completed = isCompleted;
    return supabase.from('lesson_progress').upsert(row, { onConflict: 'enrollment_id,lesson_id' });
  }, [enrollment, canTrack]);

  // Record "last opened lesson" so the student resumes here next time.
  useEffect(() => {
    if (currentId && canTrack && !completed.has(currentId)) touch(currentId);
  }, [currentId, canTrack]); // eslint-disable-line react-hooks/exhaustive-deps

  const setDone = async (lessonId: number, value: boolean) => {
    if (!canTrack) return;
    setMarking(true);
    const res = await touch(lessonId, value);
    setMarking(false);
    if (res?.error) return notify('Không lưu được tiến độ', errorMessage(res.error));
    const next = new Set(completed);
    if (value) next.add(lessonId); else next.delete(lessonId);
    setCompleted(next);

    const { data: e } = await supabase.from('enrollments').select('*').eq('enrollment_id', enrollment!.enrollment_id).maybeSingle();
    if (e) {
      const justCompleted = e.status === 'completed' && enrollment!.status !== 'completed';
      setEnrollment(e as Enrollment);
      if (justCompleted) {
        notify('🎉 Chúc mừng!', 'Bạn đã hoàn thành khoá học. Chứng chỉ đã được cấp trong mục "Học tập của tôi".');
        return;
      }
    }
    if (value && currentIndex >= 0 && currentIndex < ordered.length - 1) setCurrentId(ordered[currentIndex + 1].lesson_id);
  };

  const askQuestion = async () => {
    if (!session) return notify('Cần đăng nhập', 'Vui lòng đăng nhập để đặt câu hỏi.');
    if (!qTitle.trim() || !qContent.trim()) return notify('Thiếu nội dung', 'Vui lòng nhập tiêu đề và nội dung câu hỏi.');
    setPosting(true);
    const { error } = await supabase.from('forum_topics').insert({
      course_id: courseId, author_id: session.user.id, title: qTitle.trim(), content: qContent.trim(), type: 'question',
    });
    setPosting(false);
    if (error) return notify('Không gửi được câu hỏi', errorMessage(error));
    setQTitle('');
    setQContent('');
    loadQuestions();
  };

  if (loading) return <Loading />;
  if (!course) return <EmptyState icon="alert-circle-outline" title="Không tìm thấy khoá học" />;

  const lockedForViewer = !canTrack && !isOwner && role !== 'admin';

  const lessonList = (
    <View>
      {modules.map((mod, mIdx) => {
        const ls = ordered.filter((l) => l.module_id === mod.module_id);
        return (
          <View key={mod.module_id} style={{ marginBottom: 16 }}>
            <Text style={styles.moduleTitle}>Chương {mIdx + 1}: {mod.title}</Text>
            {ls.map((l) => {
              const active = l.lesson_id === currentId;
              const isDone = completed.has(l.lesson_id);
              return (
                <TouchableOpacity key={l.lesson_id} style={[styles.lessonItem, active && styles.activeLesson]} onPress={() => setCurrentId(l.lesson_id)}>
                  <Ionicons
                    name={isDone ? 'checkmark-circle' : l.content_type === 'video' ? 'play-circle-outline' : 'document-text-outline'}
                    size={20}
                    color={isDone ? BRAND.green : active ? BRAND.blue : '#888'}
                  />
                  <Text style={[styles.lessonText, active && { color: BRAND.blue, fontWeight: '700' }]} numberOfLines={2}>{l.title}</Text>
                  {l.video_duration ? <Muted style={{ fontSize: 12 }}>{formatDuration(l.video_duration)}</Muted> : null}
                </TouchableOpacity>
              );
            })}
          </View>
        );
      })}
      {lockedForViewer && (
        <Notice tone="orange" icon="lock-closed-outline">
          Bạn đang xem thử. Đăng ký khoá học để mở toàn bộ bài học và theo dõi tiến độ.
        </Notice>
      )}
    </View>
  );

  const main = (
    <View style={{ flex: 1 }}>
      {current ? (
        <>
          {current.content_type === 'video' && <VideoBlock lesson={current} width={videoWidth} onEnded={() => !completed.has(current.lesson_id) && setDone(current.lesson_id, true)} />}
          <View style={{ padding: 20 }}>
            <Muted style={{ fontSize: 12 }}>Bài {currentIndex + 1}/{ordered.length}</Muted>
            <Text style={styles.lessonHeading}>{current.title}</Text>
            {current.description ? <Text style={styles.body}>{current.description}</Text> : null}
            {current.content_type !== 'video' && current.content_text ? (
              <Card style={{ marginTop: 12 }}><Text style={styles.body}>{current.content_text}</Text></Card>
            ) : null}
            {current.content_type !== 'video' && !current.content_text && !current.description ? (
              <Muted>Bài học này chưa có nội dung văn bản.</Muted>
            ) : null}
            {current.attachment_url ? (
              <Button title="Tải tài liệu đính kèm" variant="ghost" icon="download-outline" size="sm" style={{ alignSelf: 'flex-start', marginTop: 12 }}
                onPress={() => Linking.openURL(current.attachment_url!)} />
            ) : null}

            <Row wrap style={{ marginTop: 16 }}>
              <Button title="Bài trước" size="sm" variant="outline" icon="chevron-back" disabled={currentIndex <= 0}
                onPress={() => setCurrentId(ordered[currentIndex - 1].lesson_id)} />
              {canTrack && (
                completed.has(current.lesson_id) ? (
                  <Button title="Đã hoàn thành ✓" size="sm" variant="success" loading={marking} onPress={() => setDone(current.lesson_id, false)} />
                ) : (
                  <Button title="Đánh dấu hoàn thành" size="sm" icon="checkmark" loading={marking} onPress={() => setDone(current.lesson_id, true)} />
                )
              )}
              <Button title="Bài tiếp" size="sm" variant="outline" disabled={currentIndex < 0 || currentIndex >= ordered.length - 1}
                onPress={() => setCurrentId(ordered[currentIndex + 1].lesson_id)} />
            </Row>
          </View>
        </>
      ) : (
        <EmptyState icon="lock-closed-outline" title={lockedForViewer ? 'Nội dung bị khoá' : 'Khoá học chưa có bài học'}
          message={lockedForViewer ? 'Hãy đăng ký khoá học để xem bài giảng.' : undefined}
          action={lockedForViewer ? <Button title="Xem khoá học" onPress={() => router.replace({ pathname: '/(details)/course-detail', params: { id: String(courseId) } })} /> : undefined} />
      )}
    </View>
  );

  const side = (
    <View style={{ padding: 20 }}>
      {canTrack && (
        <Card>
          <Row style={{ justifyContent: 'space-between', marginBottom: 8 }}>
            <Text style={{ fontWeight: '700', color: BRAND.text }}>Tiến độ: {Math.round(Number(enrollment!.progress_percentage ?? progress))}%</Text>
            {enrollment!.status === 'completed' && <Badge label="Hoàn thành" tone="green" />}
          </Row>
          <ProgressBar value={Number(enrollment!.progress_percentage ?? progress)} />
          {enrollment!.status === 'completed' && (
            <Button title="Xem chứng chỉ" size="sm" variant="ghost" icon="ribbon-outline" style={{ marginTop: 10, alignSelf: 'flex-start' }}
              onPress={() => router.push({ pathname: '/(details)/certificate', params: { enrollment: String(enrollment!.enrollment_id) } })} />
          )}
        </Card>
      )}
      <Tabs<Tab>
        tabs={[{ value: 'lessons', label: 'Bài học' }, { value: 'overview', label: 'Tổng quan' }, { value: 'qa', label: `Hỏi đáp (${questions.length})` }]}
        value={tab}
        onChange={setTab}
      />
      {tab === 'lessons' && lessonList}
      {tab === 'overview' && <Text style={styles.body}>{course.description}</Text>}
      {tab === 'qa' && (
        <View>
          {(canTrack || isOwner) && (
            <Card style={{ backgroundColor: '#FAFBFF' }}>
              <Text style={{ fontWeight: '700', marginBottom: 8, color: BRAND.text }}>Đặt câu hỏi cho giảng viên</Text>
              <Field placeholder="Tiêu đề câu hỏi" value={qTitle} onChangeText={setQTitle} />
              <Field placeholder="Mô tả chi tiết vấn đề bạn gặp..." value={qContent} onChangeText={setQContent} multiline />
              <Button title="Gửi câu hỏi" size="sm" onPress={askQuestion} loading={posting} style={{ alignSelf: 'flex-start' }} />
            </Card>
          )}
          {questions.length === 0 && <Muted>Chưa có câu hỏi nào cho khoá học này.</Muted>}
          {questions.map((q) => (
            <TouchableOpacity key={q.topic_id} style={styles.question} onPress={() => router.push({ pathname: '/(details)/topic', params: { id: String(q.topic_id) } })}>
              <Text style={{ fontWeight: '700', color: BRAND.text }}>{q.title}</Text>
              <Muted style={{ fontSize: 12 }}>{fullName(q.author)} · {timeAgo(q.created_at)} · {q.reply_count} trả lời</Muted>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );

  return (
    <WebLayout maxWidth={wide ? 1200 : 768}>
      <Stack.Screen options={{ title: course.title }} />
      <ScrollView>
        {wide ? (
          <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
            <View style={{ width: videoWidth }}>{main}</View>
            <View style={{ flex: 1, borderLeftWidth: 1, borderLeftColor: BRAND.border }}>{side}</View>
          </View>
        ) : (
          <>
            {main}
            {side}
          </>
        )}
      </ScrollView>
    </WebLayout>
  );
}

const styles = StyleSheet.create({
  videoPlaceholder: { backgroundColor: '#111', alignItems: 'center', justifyContent: 'center', width: '100%' },
  lessonHeading: { fontSize: 20, fontWeight: '800', color: BRAND.text, marginVertical: 6 },
  body: { fontSize: 15, color: '#444', lineHeight: 23 },
  moduleTitle: { fontSize: 13, fontWeight: '800', color: BRAND.muted, textTransform: 'uppercase', marginBottom: 6 },
  lessonItem: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10, paddingHorizontal: 8, borderRadius: 8 },
  activeLesson: { backgroundColor: '#EEF3FD' },
  lessonText: { flex: 1, color: '#333', fontSize: 14 },
  question: { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F0F0F0', gap: 4 },
});
