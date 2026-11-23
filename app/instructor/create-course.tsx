import React, { useEffect, useState } from 'react';
import { Image, View } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { Button } from '@/components/ui/button';
import { BRAND, Card, Chips, Field, H2, Loading, Muted, Notice, Row, Screen } from '@/components/ui/kit';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import { DEFAULT_THUMBNAIL, fetchCategories, pickAndUploadImage } from '@/lib/api';
import { COURSE_STATUS_LABEL, LEVEL_LABEL } from '@/lib/format';
import { errorMessage, notify } from '@/lib/notify';
import type { Category, Course, CourseLevel } from '@/lib/types';

/** Create a new course (id absent) or edit an existing one (?id=) — FR-020, FR-021. */
export default function CreateCourseScreen() {
    const router = useRouter();
    const { id } = useLocalSearchParams<{ id?: string }>();
    const editId = id ? Number(id) : null;
    const { session, profile, role } = useAuth();

    const [loading, setLoading] = useState(!!editId);
    const [saving, setSaving] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [categories, setCategories] = useState<Category[]>([]);
    const [status, setStatus] = useState<Course['status']>('draft');

    const [title, setTitle] = useState('');
    const [shortDesc, setShortDesc] = useState('');
    const [description, setDescription] = useState('');
    const [outcomes, setOutcomes] = useState('');
    const [requirements, setRequirements] = useState('');
    const [price, setPrice] = useState('0');
    const [thumbnail, setThumbnail] = useState('');
    const [categoryId, setCategoryId] = useState<number>(0);
    const [level, setLevel] = useState<CourseLevel>('beginner');
    const [language, setLanguage] = useState('Tiếng Việt');

    useEffect(() => {
        fetchCategories().then((cats) => {
            setCategories(cats);
            setCategoryId((prev) => prev || cats[0]?.category_id || 0);
        });
    }, []);

    useEffect(() => {
        if (!editId) return;
        supabase.from('courses').select('*').eq('course_id', editId).maybeSingle().then(({ data }) => {
            const c = data as Course | null;
            if (c) {
                setTitle(c.title);
                setShortDesc(c.short_description ?? '');
                setDescription(c.description ?? '');
                setOutcomes(c.learning_outcomes ?? '');
                setRequirements(c.requirements ?? '');
                setPrice(String(Number(c.price)));
                setThumbnail(c.thumbnail_url ?? '');
                setCategoryId(c.category_id ?? 0);
                setLevel((c.level as CourseLevel) ?? 'beginner');
                setLanguage(c.language ?? 'Tiếng Việt');
                setStatus(c.status);
            }
            setLoading(false);
        });
    }, [editId]);

    const upload = async () => {
        try {
            setUploading(true);
            const url = await pickAndUploadImage('thumbnails', [16, 9]);
            if (url) setThumbnail(url);
        } catch (e) {
            notify('Không tải được ảnh', errorMessage(e));
        } finally {
            setUploading(false);
        }
    };

    const handleSubmit = async () => {
        const priceNum = Number(price.replace(/[^\d]/g, ''));
        if (!title.trim() || !description.trim()) {
            return notify('Thiếu thông tin', 'Vui lòng nhập tên khoá học và mô tả chi tiết.');
        }
        if (!Number.isFinite(priceNum) || priceNum < 0) {
            return notify('Giá không hợp lệ', 'Giá phải là số ≥ 0 (nhập 0 cho khoá miễn phí).');
        }
        if (!session?.user) return;

        setSaving(true);
        const payload = {
            title: title.trim(),
            short_description: shortDesc.trim() || null,
            description: description.trim(),
            learning_outcomes: outcomes.trim() || null,
            requirements: requirements.trim() || null,
            price: priceNum,
            category_id: categoryId || null,
            thumbnail_url: thumbnail.trim() || DEFAULT_THUMBNAIL,
            level,
            language: language.trim() || null,
        };

        const res = editId
            ? await supabase.from('courses').update(payload).eq('course_id', editId).select('course_id').single()
            : await supabase.from('courses').insert({ ...payload, instructor_id: session.user.id, status: 'draft' }).select('course_id').single();
        setSaving(false);

        if (res.error) return notify('Không lưu được khoá học', errorMessage(res.error));
        if (editId) {
            notify('Đã lưu', 'Thông tin khoá học đã được cập nhật.');
            router.back();
        } else {
            notify('Đã tạo khoá học', 'Tiếp theo, hãy thêm chương và bài học. Khi hoàn tất, gửi duyệt để xuất bản.');
            router.replace(`/instructor/curriculum/${res.data.course_id}` as any);
        }
    };

    if (loading) return <Loading />;
    const approved = role === 'admin' || !!profile?.admin_approved;

    return (
        <Screen>
            <Stack.Screen options={{ title: editId ? 'Chỉnh sửa khoá học' : 'Tạo khoá học mới' }} />
            {!approved && !editId && (
                <Notice tone="orange" icon="time-outline">Tài khoản của bạn chưa được duyệt nên chưa thể tạo khoá học.</Notice>
            )}
            {editId && status === 'published' && (
                <Notice>Khoá học đang được xuất bản. Thay đổi sẽ hiển thị ngay với học viên.</Notice>
            )}
            {editId && status !== 'published' && (
                <Muted style={{ marginBottom: 12 }}>Trạng thái hiện tại: {COURSE_STATUS_LABEL[status]}</Muted>
            )}

            <H2>Thông tin cơ bản</H2>
            <Field label="Tên khoá học *" placeholder="VD: Lập trình React Native cơ bản" value={title} onChangeText={setTitle} maxLength={150} />
            <Field label="Mô tả ngắn" placeholder="Một câu giới thiệu hấp dẫn" value={shortDesc} onChangeText={setShortDesc} maxLength={200} />
            <Field label="Mô tả chi tiết *" placeholder="Khoá học dành cho ai, nội dung chính..." value={description} onChangeText={setDescription} multiline />
            <Field label="Học viên sẽ học được gì" placeholder={'Mỗi dòng một ý, VD:\nXây dựng ứng dụng di động hoàn chỉnh\nKết nối Supabase'} value={outcomes} onChangeText={setOutcomes} multiline />
            <Field label="Yêu cầu đầu vào" placeholder={'Mỗi dòng một ý, VD:\nBiết JavaScript cơ bản'} value={requirements} onChangeText={setRequirements} multiline />

            <H2>Phân loại</H2>
            <Muted style={{ marginBottom: 6 }}>Danh mục</Muted>
            <Chips options={categories.map((c) => ({ value: c.category_id, label: c.name }))} value={categoryId} onChange={setCategoryId} />
            <Muted style={{ marginTop: 12, marginBottom: 6 }}>Trình độ</Muted>
            <Chips<CourseLevel>
                options={Object.entries(LEVEL_LABEL).map(([value, label]) => ({ value: value as CourseLevel, label }))}
                value={level}
                onChange={setLevel}
            />
            <View style={{ height: 12 }} />
            <Row style={{ alignItems: 'flex-start' }}>
                <Field label="Giá (VND) *" hint="Nhập 0 cho khoá miễn phí" value={price} onChangeText={setPrice} keyboardType="numeric" containerStyle={{ flex: 1 }} />
                <Field label="Ngôn ngữ" value={language} onChangeText={setLanguage} containerStyle={{ flex: 1 }} />
            </Row>

            <H2>Ảnh bìa</H2>
            <Card style={{ padding: 10 }}>
                <Image source={{ uri: thumbnail || DEFAULT_THUMBNAIL }} style={{ width: '100%', aspectRatio: 16 / 9, borderRadius: 8, backgroundColor: '#EEE' }} />
                <Row style={{ marginTop: 10 }}>
                    <Button title="Tải ảnh lên" size="sm" variant="secondary" icon="cloud-upload-outline" onPress={upload} loading={uploading} />
                    {thumbnail ? <Button title="Dùng ảnh mặc định" size="sm" variant="ghost" onPress={() => setThumbnail('')} /> : null}
                </Row>
            </Card>
            <Field label="Hoặc dán URL ảnh" placeholder="https://..." value={thumbnail} onChangeText={setThumbnail} autoCapitalize="none" />

            <Button
                title={editId ? 'Lưu thay đổi' : 'Tạo khoá học & thêm bài giảng'}
                onPress={handleSubmit}
                loading={saving}
                disabled={!approved && !editId}
                style={{ marginTop: 8 }}
            />
            <Button title="Huỷ" variant="ghost" onPress={() => router.back()} style={{ marginTop: 10 }} />
            <Muted style={{ marginTop: 12, fontSize: 12, color: BRAND.muted }}>
                Khoá học mới luôn ở trạng thái “Bản nháp”. Sau khi thêm nội dung, bấm “Gửi duyệt” ở bảng điều khiển để quản trị viên xét duyệt và xuất bản.
            </Muted>
        </Screen>
    );
}
