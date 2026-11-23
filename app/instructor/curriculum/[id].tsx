import React, { useCallback, useEffect, useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '@/components/ui/button';
import { Badge, BRAND, Card, Chips, Field, Loading, Muted, Notice, Row, Screen, Toggle, statusTone } from '@/components/ui/kit';
import { supabase } from '@/lib/supabase';
import { COURSE_STATUS_LABEL, formatDuration, youtubeId } from '@/lib/format';
import { confirmAsync, errorMessage, notify } from '@/lib/notify';
import type { Course, Lesson, LessonType, Module } from '@/lib/types';

type ModuleWithLessons = Module & { lessons: Lesson[] };

interface LessonDraft {
    lesson_id?: number;
    title: string;
    description: string;
    content_type: LessonType;
    video: string;
    minutes: string;
    content_text: string;
    attachment_url: string;
    is_preview: boolean;
}

const emptyDraft = (): LessonDraft => ({
    title: '', description: '', content_type: 'video', video: '', minutes: '', content_text: '', attachment_url: '', is_preview: false,
});

function LessonEditor({ draft, onChange, onCancel, onSave, saving }: {
    draft: LessonDraft; onChange: (d: LessonDraft) => void; onCancel: () => void; onSave: () => void; saving: boolean;
}) {
    const set = <K extends keyof LessonDraft>(k: K) => (v: LessonDraft[K]) => onChange({ ...draft, [k]: v });
    const yt = youtubeId(draft.video);
    return (
        <View style={styles.editor}>
            <Text style={styles.editorTitle}>{draft.lesson_id ? 'Sửa bài học' : 'Thêm bài học mới'}</Text>
            <Field placeholder="Tên bài học *" value={draft.title} onChangeText={set('title')} />
            <Chips<LessonType>
                options={[{ value: 'video', label: '🎬 Video' }, { value: 'text', label: '📄 Bài đọc' }]}
                value={draft.content_type}
                onChange={set('content_type')}
            />
            <View style={{ height: 10 }} />
            {draft.content_type === 'video' && (
                <>
                    <Field
                        label="Link video"
                        placeholder="https://youtube.com/watch?v=... hoặc link .mp4"
                        value={draft.video}
                        onChangeText={set('video')}
                        autoCapitalize="none"
                        hint={draft.video ? (yt ? `✓ Nhận diện video YouTube (${yt})` : 'Sẽ phát như link video trực tiếp') : 'Hỗ trợ YouTube (công khai / không công khai) hoặc link file video'}
                    />
                    <Field label="Thời lượng (phút)" placeholder="VD: 12.5" value={draft.minutes} onChangeText={set('minutes')} keyboardType="decimal-pad" />
                </>
            )}
            <Field label="Mô tả ngắn" value={draft.description} onChangeText={set('description')} multiline />
            {draft.content_type === 'text' && (
                <Field label="Nội dung bài đọc" value={draft.content_text} onChangeText={set('content_text')} multiline style={{ minHeight: 160 }} />
            )}
            <Field label="Link tài liệu đính kèm" placeholder="https://drive.google.com/..." value={draft.attachment_url} onChangeText={set('attachment_url')} autoCapitalize="none" />
            <Toggle label="Cho phép xem thử miễn phí (không cần đăng ký)" value={draft.is_preview} onChange={set('is_preview')} />
            <Row style={{ marginTop: 10 }}>
                <Button title="Huỷ" variant="outline" size="sm" onPress={onCancel} />
                <Button title="Lưu bài học" size="sm" onPress={onSave} loading={saving} />
            </Row>
        </View>
    );
}

/** Curriculum builder (FR-022, FR-023). */
export default function CurriculumBuilderScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const courseId = Number(id);
    const router = useRouter();

    const [loading, setLoading] = useState(true);
    const [course, setCourse] = useState<Course | null>(null);
    const [modules, setModules] = useState<ModuleWithLessons[]>([]);

    const [newModuleTitle, setNewModuleTitle] = useState('');
    const [creatingModule, setCreatingModule] = useState(false);
    const [renaming, setRenaming] = useState<{ id: number; title: string } | null>(null);

    const [editingModule, setEditingModule] = useState<number | null>(null);
    const [draft, setDraft] = useState<LessonDraft>(emptyDraft());
    const [savingLesson, setSavingLesson] = useState(false);

    const fetchCourseData = useCallback(async () => {
        const [c, m] = await Promise.all([
            supabase.from('courses').select('*').eq('course_id', courseId).maybeSingle(),
            supabase.from('modules').select('*, lessons(*)').eq('course_id', courseId).order('order_index', { ascending: true }),
        ]);
        if (m.error) notify('Lỗi', 'Không thể tải danh sách chương học.');
        const mods = ((m.data as ModuleWithLessons[]) ?? []).map((mod) => ({
            ...mod,
            lessons: [...(mod.lessons ?? [])].sort((a, b) => a.order_index - b.order_index),
        }));
        setCourse((c.data as Course) ?? null);
        setModules(mods);
        setLoading(false);
    }, [courseId]);

    useEffect(() => { fetchCourseData(); }, [fetchCourseData]);

    const handleCreateModule = async () => {
        if (!newModuleTitle.trim()) return;
        setCreatingModule(true);
        const nextIndex = modules.length ? Math.max(...modules.map((m) => m.order_index)) + 1 : 0;
        const { error } = await supabase.from('modules').insert({ course_id: courseId, title: newModuleTitle.trim(), order_index: nextIndex });
        setCreatingModule(false);
        if (error) return notify('Lỗi', errorMessage(error));
        setNewModuleTitle('');
        fetchCourseData();
    };

    const renameModule = async () => {
        if (!renaming?.title.trim()) return;
        const { error } = await supabase.from('modules').update({ title: renaming.title.trim(), updated_at: new Date().toISOString() }).eq('module_id', renaming.id);
        if (error) return notify('Lỗi', errorMessage(error));
        setRenaming(null);
        fetchCourseData();
    };

    const deleteModule = async (mod: ModuleWithLessons) => {
        if (!(await confirmAsync('Xoá chương?', `"${mod.title}" và ${mod.lessons.length} bài học bên trong sẽ bị xoá.`, 'Xoá', true))) return;
        const { error } = await supabase.from('modules').delete().eq('module_id', mod.module_id);
        if (error) return notify('Lỗi', errorMessage(error));
        fetchCourseData();
    };

    /** Swap order_index with the neighbour (dir = -1 up, +1 down). */
    const move = async (table: 'modules' | 'lessons', list: { order_index: number; module_id?: number; lesson_id?: number }[], index: number, dir: -1 | 1) => {
        const a = list[index];
        const b = list[index + dir];
        if (!a || !b) return;
        const key = table === 'modules' ? 'module_id' : 'lesson_id';
        const ai = a.order_index === b.order_index ? index : a.order_index;
        const bi = a.order_index === b.order_index ? index + dir : b.order_index;
        const r1 = await supabase.from(table).update({ order_index: bi }).eq(key, (a as any)[key]);
        const r2 = await supabase.from(table).update({ order_index: ai }).eq(key, (b as any)[key]);
        if (r1.error || r2.error) notify('Lỗi', errorMessage(r1.error ?? r2.error));
        fetchCourseData();
    };

    const startNewLesson = (moduleId: number) => {
        setEditingModule(moduleId);
        setDraft(emptyDraft());
    };

    const startEditLesson = (lesson: Lesson) => {
        setEditingModule(lesson.module_id);
        setDraft({
            lesson_id: lesson.lesson_id,
            title: lesson.title,
            description: lesson.description ?? '',
            content_type: lesson.content_type === 'text' ? 'text' : 'video',
            video: lesson.youtube_url || lesson.video_url || '',
            minutes: lesson.video_duration ? String(Math.round((lesson.video_duration / 60) * 10) / 10) : '',
            content_text: lesson.content_text ?? '',
            attachment_url: lesson.attachment_url ?? '',
            is_preview: lesson.is_preview,
        });
    };

    const saveLesson = async () => {
        if (!editingModule) return;
        if (!draft.title.trim()) return notify('Thiếu thông tin', 'Vui lòng nhập tên bài học.');
        const video = draft.video.trim();
        const isYt = !!youtubeId(video);
        const payload = {
            module_id: editingModule,
            title: draft.title.trim(),
            description: draft.description.trim() || null,
            content_type: draft.content_type,
            youtube_url: draft.content_type === 'video' && isYt ? video : null,
            video_url: draft.content_type === 'video' && !isYt ? video || null : null,
            video_duration: draft.content_type === 'video' ? Math.round((parseFloat(draft.minutes.replace(',', '.')) || 0) * 60) : 0,
            content_text: draft.content_type === 'text' ? draft.content_text.trim() || null : null,
            attachment_url: draft.attachment_url.trim() || null,
            is_preview: draft.is_preview,
            updated_at: new Date().toISOString(),
        };
        setSavingLesson(true);
        let error;
        if (draft.lesson_id) {
            ({ error } = await supabase.from('lessons').update(payload).eq('lesson_id', draft.lesson_id));
        } else {
            const mod = modules.find((m) => m.module_id === editingModule);
            const nextIndex = mod?.lessons.length ? Math.max(...mod.lessons.map((l) => l.order_index)) + 1 : 0;
            ({ error } = await supabase.from('lessons').insert({ ...payload, order_index: nextIndex }));
        }
        setSavingLesson(false);
        if (error) return notify('Không lưu được bài học', errorMessage(error));
        setEditingModule(null);
        setDraft(emptyDraft());
        fetchCourseData();
    };

    const deleteLesson = async (lesson: Lesson) => {
        if (!(await confirmAsync('Xoá bài học?', `"${lesson.title}"`, 'Xoá', true))) return;
        const { error } = await supabase.from('lessons').delete().eq('lesson_id', lesson.lesson_id);
        if (error) return notify('Lỗi', errorMessage(error));
        fetchCourseData();
    };

    const submitForReview = async () => {
        const total = modules.reduce((s, m) => s + m.lessons.length, 0);
        if (!total) return notify('Chưa có bài học', 'Hãy thêm ít nhất một bài học trước khi gửi duyệt.');
        if (!(await confirmAsync('Gửi duyệt khoá học?', 'Quản trị viên sẽ xem xét và xuất bản khoá học.'))) return;
        const { error } = await supabase.from('courses').update({ status: 'pending' }).eq('course_id', courseId);
        if (error) return notify('Lỗi', errorMessage(error));
        notify('Đã gửi duyệt', 'Bạn sẽ thấy trạng thái cập nhật trong bảng điều khiển.');
        fetchCourseData();
    };

    if (loading) return <Loading />;
    if (!course) return <Notice tone="red">Không tìm thấy khoá học hoặc bạn không có quyền chỉnh sửa.</Notice>;

    const totalLessons = modules.reduce((s, m) => s + m.lessons.length, 0);
    const totalSeconds = modules.reduce((s, m) => s + m.lessons.reduce((x, l) => x + (l.video_duration || 0), 0), 0);

    return (
        <Screen>
            <Row wrap style={{ marginBottom: 6 }}>
                <Badge label={COURSE_STATUS_LABEL[course.status]} tone={statusTone(course.status)} />
                <Muted>{modules.length} chương · {totalLessons} bài học{totalSeconds ? ` · ${formatDuration(totalSeconds)}` : ''}</Muted>
            </Row>
            <Text style={styles.headerTitle}>{course.title}</Text>
            {course.status === 'rejected' && course.rejection_reason ? (
                <Notice tone="red" icon="close-circle-outline">Lý do bị từ chối: {course.rejection_reason}. Hãy chỉnh sửa và gửi duyệt lại.</Notice>
            ) : null}
            {course.status === 'pending' && <Notice tone="orange" icon="time-outline">Khoá học đang chờ duyệt. Bạn vẫn có thể chỉnh sửa nội dung.</Notice>}

            {modules.map((mod, index) => (
                <View key={mod.module_id} style={styles.moduleCard}>
                    <View style={styles.moduleHeader}>
                        {renaming?.id === mod.module_id ? (
                            <Row style={{ flex: 1 }}>
                                <Field value={renaming.title} onChangeText={(t) => setRenaming({ id: mod.module_id, title: t })} containerStyle={{ flex: 1, marginBottom: 0 }} autoFocus onSubmitEditing={renameModule} />
                                <Button title="Lưu" size="sm" onPress={renameModule} />
                                <Button title="Huỷ" size="sm" variant="ghost" onPress={() => setRenaming(null)} />
                            </Row>
                        ) : (
                            <>
                                <Text style={styles.moduleTitle}>Chương {index + 1}: {mod.title}</Text>
                                <Row gap={2}>
                                    <IconBtn icon="arrow-up" label="Lên" disabled={index === 0} onPress={() => move('modules', modules, index, -1)} />
                                    <IconBtn icon="arrow-down" label="Xuống" disabled={index === modules.length - 1} onPress={() => move('modules', modules, index, 1)} />
                                    <IconBtn icon="create-outline" label="Đổi tên" onPress={() => setRenaming({ id: mod.module_id, title: mod.title })} />
                                    <IconBtn icon="trash-outline" label="Xoá chương" color={BRAND.red} onPress={() => deleteModule(mod)} />
                                </Row>
                            </>
                        )}
                    </View>

                    <View style={styles.lessonsContainer}>
                        {mod.lessons.map((lesson, lIndex) => (
                            editingModule === mod.module_id && draft.lesson_id === lesson.lesson_id ? (
                                <LessonEditor key={lesson.lesson_id} draft={draft} onChange={setDraft} onCancel={() => setEditingModule(null)} onSave={saveLesson} saving={savingLesson} />
                            ) : (
                                <View key={lesson.lesson_id} style={styles.lessonItem}>
                                    <Ionicons name={lesson.content_type === 'video' ? 'play-circle-outline' : 'document-text-outline'} size={20} color="#666" />
                                    <View style={{ flex: 1 }}>
                                        <Text style={styles.lessonTitle}>{index + 1}.{lIndex + 1} {lesson.title}</Text>
                                        <Row gap={6}>
                                            {lesson.video_duration ? <Muted style={{ fontSize: 12 }}>{formatDuration(lesson.video_duration)}</Muted> : null}
                                            {lesson.is_preview ? <Text style={{ color: BRAND.blue, fontSize: 12, fontWeight: '700' }}>Xem thử</Text> : null}
                                            {lesson.content_type === 'video' && !lesson.youtube_url && !lesson.video_url ? <Text style={{ color: BRAND.orange, fontSize: 12 }}>Chưa có video</Text> : null}
                                        </Row>
                                    </View>
                                    <IconBtn icon="arrow-up" label="Lên" disabled={lIndex === 0} onPress={() => move('lessons', mod.lessons, lIndex, -1)} />
                                    <IconBtn icon="arrow-down" label="Xuống" disabled={lIndex === mod.lessons.length - 1} onPress={() => move('lessons', mod.lessons, lIndex, 1)} />
                                    <IconBtn icon="create-outline" label="Sửa" onPress={() => startEditLesson(lesson)} />
                                    <IconBtn icon="trash-outline" label="Xoá" color={BRAND.red} onPress={() => deleteLesson(lesson)} />
                                </View>
                            )
                        ))}
                        {mod.lessons.length === 0 && <Muted style={{ paddingVertical: 6 }}>Chương chưa có bài học.</Muted>}

                        {editingModule === mod.module_id && !draft.lesson_id ? (
                            <LessonEditor draft={draft} onChange={setDraft} onCancel={() => setEditingModule(null)} onSave={saveLesson} saving={savingLesson} />
                        ) : (
                            <TouchableOpacity style={styles.addLessonBtn} onPress={() => startNewLesson(mod.module_id)}>
                                <Ionicons name="add-circle-outline" size={20} color={BRAND.red} />
                                <Text style={styles.addLessonText}>Thêm bài học mới</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                </View>
            ))}

            <Card style={{ backgroundColor: '#F9FAFB', borderStyle: 'dashed' }}>
                <Text style={styles.editorTitle}>Thêm chương học mới</Text>
                <Field placeholder="Tên chương (VD: Phần 1 - Giới thiệu cơ bản)" value={newModuleTitle} onChangeText={setNewModuleTitle} onSubmitEditing={handleCreateModule} />
                <Button title="Tạo chương mới" icon="add" onPress={handleCreateModule} loading={creatingModule} />
            </Card>

            <Row wrap style={{ marginTop: 8 }}>
                {(course.status === 'draft' || course.status === 'rejected') && (
                    <Button title="Gửi duyệt khoá học" icon="send-outline" onPress={submitForReview} />
                )}
                <Button title="Xem trước như học viên" variant="outline" icon="eye-outline"
                    onPress={() => router.push({ pathname: '/(details)/course-detail', params: { id: String(courseId) } })} />
                <Button title="Về bảng điều khiển" variant="ghost" onPress={() => router.replace('/instructor/dashboard')} />
            </Row>
        </Screen>
    );
}

function IconBtn({ icon, label, onPress, disabled, color = '#555' }: {
    icon: keyof typeof Ionicons.glyphMap; label: string; onPress: () => void; disabled?: boolean; color?: string;
}) {
    return (
        <TouchableOpacity onPress={onPress} disabled={disabled} accessibilityLabel={label} style={{ padding: 6, opacity: disabled ? 0.3 : 1 }}>
            <Ionicons name={icon} size={18} color={color} />
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    headerTitle: { fontSize: 22, fontWeight: '800', color: BRAND.text, marginBottom: 16 },
    moduleCard: { borderWidth: 1, borderColor: '#D6E0F7', borderRadius: 12, marginBottom: 16, overflow: 'hidden' },
    moduleHeader: { padding: 12, backgroundColor: 'rgba(27, 71, 164, 0.05)', flexDirection: 'row', alignItems: 'center', gap: 8 },
    moduleTitle: { fontSize: 16, fontWeight: 'bold', color: BRAND.blue, flex: 1 },
    lessonsContainer: { padding: 12 },
    lessonItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#F0F0F0', gap: 8 },
    lessonTitle: { fontSize: 15, color: '#333' },
    addLessonBtn: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, gap: 8 },
    addLessonText: { fontSize: 15, fontWeight: '600', color: BRAND.red },
    editor: { padding: 14, borderRadius: 10, borderWidth: 1, borderColor: '#E0E0E0', backgroundColor: '#FFF', marginVertical: 10 },
    editorTitle: { fontSize: 15, fontWeight: '700', color: BRAND.text, marginBottom: 12 },
});
