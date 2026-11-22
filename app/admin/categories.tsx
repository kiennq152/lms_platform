import React, { useCallback, useState } from 'react';
import { View, Text } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Button } from '@/components/ui/button';
import { BRAND, Card, EmptyState, Field, H2, Loading, Muted, Row, Screen } from '@/components/ui/kit';
import { supabase } from '@/lib/supabase';
import { fetchCategories } from '@/lib/api';
import { confirmAsync, errorMessage, notify } from '@/lib/notify';
import type { Category } from '@/lib/types';

function slugify(s: string) {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D')
    .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

export default function AdminCategories() {
  const [items, setItems] = useState<(Category & { courses: { count: number }[] })[]>([]);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState<{ category_id?: number; name: string; description: string } | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    const { data } = await supabase.from('categories').select('*, courses(count)').order('name');
    setItems((data as any) ?? []);
    setLoading(false);
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const save = async () => {
    if (!draft?.name.trim()) return notify('Thiếu tên', 'Vui lòng nhập tên danh mục.');
    const payload = { name: draft.name.trim(), slug: slugify(draft.name), description: draft.description.trim() || null };
    setSaving(true);
    const { error } = draft.category_id
      ? await supabase.from('categories').update(payload).eq('category_id', draft.category_id)
      : await supabase.from('categories').insert(payload);
    setSaving(false);
    if (error) return notify('Không lưu được', errorMessage(error));
    setDraft(null);
    await fetchCategories(true);
    load();
  };

  const remove = async (c: Category & { courses: { count: number }[] }) => {
    const n = c.courses?.[0]?.count ?? 0;
    if (!(await confirmAsync(`Xoá danh mục "${c.name}"?`, n ? `${n} khoá học sẽ không còn danh mục.` : '', 'Xoá', true))) return;
    const { error } = await supabase.from('categories').delete().eq('category_id', c.category_id);
    if (error) return notify('Lỗi', errorMessage(error));
    await fetchCategories(true);
    load();
  };

  if (loading) return <Loading />;

  return (
    <Screen>
      {draft ? (
        <Card style={{ backgroundColor: '#FAFBFF' }}>
          <H2>{draft.category_id ? 'Sửa danh mục' : 'Thêm danh mục'}</H2>
          <Field label="Tên *" value={draft.name} onChangeText={(v) => setDraft({ ...draft, name: v })} hint={draft.name ? `Slug: ${slugify(draft.name)}` : undefined} />
          <Field label="Mô tả" value={draft.description} onChangeText={(v) => setDraft({ ...draft, description: v })} multiline />
          <Row>
            <Button title="Lưu" onPress={save} loading={saving} />
            <Button title="Huỷ" variant="ghost" onPress={() => setDraft(null)} />
          </Row>
        </Card>
      ) : (
        <Button title="Thêm danh mục" icon="add" onPress={() => setDraft({ name: '', description: '' })} style={{ alignSelf: 'flex-start', marginBottom: 16 }} />
      )}
      {items.length === 0 ? <EmptyState icon="grid-outline" title="Chưa có danh mục" /> : items.map((c) => (
        <Card key={c.category_id} style={{ paddingVertical: 12 }}>
          <Row>
            <View style={{ flex: 1 }}>
              <Text style={{ fontWeight: '700', color: BRAND.text }}>{c.name}</Text>
              <Muted style={{ fontSize: 12 }}>/{c.slug} · {c.courses?.[0]?.count ?? 0} khoá học</Muted>
              {c.description ? <Muted style={{ fontSize: 13 }}>{c.description}</Muted> : null}
            </View>
            <Button size="sm" variant="ghost" icon="create-outline" title="Sửa" onPress={() => setDraft({ category_id: c.category_id, name: c.name, description: c.description ?? '' })} />
            <Button size="sm" variant="ghost" icon="trash-outline" title="Xoá" textStyle={{ color: BRAND.red }} onPress={() => remove(c)} />
          </Row>
        </Card>
      ))}
    </Screen>
  );
}
