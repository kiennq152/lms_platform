import React, { useCallback, useState } from 'react';
import { View, Text } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Button } from '@/components/ui/button';
import { Badge, BRAND, Card, Chips, EmptyState, Field, H2, Loading, Muted, Row, Screen, Toggle } from '@/components/ui/kit';
import { supabase } from '@/lib/supabase';
import { formatDate, formatMoney } from '@/lib/format';
import { confirmAsync, errorMessage, notify } from '@/lib/notify';
import type { Coupon } from '@/lib/types';

interface Draft {
  coupon_id?: number;
  code: string;
  description: string;
  discount_type: 'percent' | 'fixed';
  discount_value: string;
  max_uses: string;
  expires_at: string; // YYYY-MM-DD
  is_active: boolean;
}

const empty = (): Draft => ({ code: '', description: '', discount_type: 'percent', discount_value: '10', max_uses: '', expires_at: '', is_active: true });

/** Coupon management (FR-040). */
export default function AdminCoupons() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    const { data, error } = await supabase.from('coupons').select('*').order('created_at', { ascending: false });
    if (error) notify('Lỗi', errorMessage(error));
    setCoupons((data as Coupon[]) ?? []);
    setLoading(false);
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const edit = (c: Coupon) => setDraft({
    coupon_id: c.coupon_id,
    code: c.code,
    description: c.description ?? '',
    discount_type: c.discount_type,
    discount_value: String(Number(c.discount_value)),
    max_uses: c.max_uses ? String(c.max_uses) : '',
    expires_at: c.expires_at ? c.expires_at.slice(0, 10) : '',
    is_active: c.is_active,
  });

  const save = async () => {
    if (!draft) return;
    const code = draft.code.trim().toUpperCase().replace(/\s+/g, '');
    const value = Number(draft.discount_value);
    if (!/^[A-Z0-9_-]{3,30}$/.test(code)) return notify('Mã không hợp lệ', 'Mã gồm 3–30 ký tự chữ, số, gạch ngang hoặc gạch dưới.');
    if (!(value > 0) || (draft.discount_type === 'percent' && value > 100)) return notify('Giá trị không hợp lệ', 'Phần trăm từ 1–100, số tiền phải lớn hơn 0.');
    if (draft.expires_at && isNaN(new Date(draft.expires_at).getTime())) return notify('Ngày không hợp lệ', 'Định dạng ngày: YYYY-MM-DD');
    const payload = {
      code,
      description: draft.description.trim() || null,
      discount_type: draft.discount_type,
      discount_value: value,
      max_uses: draft.max_uses ? parseInt(draft.max_uses, 10) || null : null,
      expires_at: draft.expires_at ? new Date(`${draft.expires_at}T23:59:59`).toISOString() : null,
      is_active: draft.is_active,
    };
    setSaving(true);
    const { error } = draft.coupon_id
      ? await supabase.from('coupons').update(payload).eq('coupon_id', draft.coupon_id)
      : await supabase.from('coupons').insert(payload);
    setSaving(false);
    if (error) return notify('Không lưu được', errorMessage(error));
    setDraft(null);
    load();
  };

  const remove = async (c: Coupon) => {
    if (!(await confirmAsync(`Xoá mã ${c.code}?`, '', 'Xoá', true))) return;
    const { error } = await supabase.from('coupons').delete().eq('coupon_id', c.coupon_id);
    if (error) return notify('Lỗi', errorMessage(error));
    load();
  };

  if (loading) return <Loading />;

  return (
    <Screen wide>
      {draft ? (
        <Card style={{ backgroundColor: '#FAFBFF' }}>
          <H2>{draft.coupon_id ? `Sửa mã ${draft.code}` : 'Tạo mã giảm giá'}</H2>
          <Row wrap style={{ alignItems: 'flex-start' }}>
            <Field label="Mã *" value={draft.code} onChangeText={(v) => setDraft({ ...draft, code: v })} autoCapitalize="characters" placeholder="WELCOME10" containerStyle={{ flex: 1, minWidth: 200 }} />
            <Field label="Mô tả" value={draft.description} onChangeText={(v) => setDraft({ ...draft, description: v })} containerStyle={{ flex: 2, minWidth: 200 }} />
          </Row>
          <Muted style={{ marginBottom: 6 }}>Loại giảm giá</Muted>
          <Chips<'percent' | 'fixed'>
            options={[{ value: 'percent', label: 'Phần trăm (%)' }, { value: 'fixed', label: 'Số tiền cố định (₫)' }]}
            value={draft.discount_type}
            onChange={(v) => setDraft({ ...draft, discount_type: v })}
          />
          <View style={{ height: 10 }} />
          <Row wrap style={{ alignItems: 'flex-start' }}>
            <Field label={draft.discount_type === 'percent' ? 'Giảm (%) *' : 'Giảm (₫) *'} value={draft.discount_value} onChangeText={(v) => setDraft({ ...draft, discount_value: v })} keyboardType="numeric" containerStyle={{ flex: 1, minWidth: 140 }} />
            <Field label="Số lượt tối đa" hint="Để trống = không giới hạn" value={draft.max_uses} onChangeText={(v) => setDraft({ ...draft, max_uses: v })} keyboardType="number-pad" containerStyle={{ flex: 1, minWidth: 140 }} />
            <Field label="Hết hạn (YYYY-MM-DD)" hint="Để trống = không hết hạn" value={draft.expires_at} onChangeText={(v) => setDraft({ ...draft, expires_at: v })} containerStyle={{ flex: 1, minWidth: 160 }} />
          </Row>
          <Toggle label="Đang kích hoạt" value={draft.is_active} onChange={(v) => setDraft({ ...draft, is_active: v })} />
          <Row style={{ marginTop: 8 }}>
            <Button title="Lưu" onPress={save} loading={saving} />
            <Button title="Huỷ" variant="ghost" onPress={() => setDraft(null)} />
          </Row>
        </Card>
      ) : (
        <Button title="Tạo mã giảm giá" icon="add" onPress={() => setDraft(empty())} style={{ alignSelf: 'flex-start', marginBottom: 16 }} />
      )}

      {coupons.length === 0 ? <EmptyState icon="pricetag-outline" title="Chưa có mã giảm giá" /> : coupons.map((c) => {
        const expired = c.expires_at && new Date(c.expires_at) < new Date();
        const usedUp = c.max_uses !== null && c.used_count >= c.max_uses;
        return (
          <Card key={c.coupon_id} style={{ paddingVertical: 12 }}>
            <Row wrap gap={12}>
              <View style={{ flex: 1, minWidth: 220 }}>
                <Row gap={8}>
                  <Text style={{ fontWeight: '900', fontSize: 16, color: BRAND.blue, letterSpacing: 1 }}>{c.code}</Text>
                  <Badge label={c.discount_type === 'percent' ? `−${Number(c.discount_value)}%` : `−${formatMoney(c.discount_value)}`} tone="red" />
                  {!c.is_active ? <Badge label="Tắt" tone="gray" /> : expired ? <Badge label="Hết hạn" tone="orange" /> : usedUp ? <Badge label="Hết lượt" tone="orange" /> : <Badge label="Đang chạy" tone="green" />}
                </Row>
                {c.description ? <Muted style={{ fontSize: 13 }}>{c.description}</Muted> : null}
                <Muted style={{ fontSize: 12 }}>
                  Đã dùng {c.used_count}{c.max_uses ? `/${c.max_uses}` : ''} lượt · {c.expires_at ? `hết hạn ${formatDate(c.expires_at)}` : 'không hết hạn'}
                </Muted>
              </View>
              <Row>
                <Button size="sm" variant="ghost" title={c.is_active ? 'Tắt' : 'Bật'} onPress={async () => {
                  const { error } = await supabase.from('coupons').update({ is_active: !c.is_active }).eq('coupon_id', c.coupon_id);
                  if (error) notify('Lỗi', errorMessage(error)); else load();
                }} />
                <Button size="sm" variant="ghost" icon="create-outline" title="Sửa" onPress={() => edit(c)} />
                <Button size="sm" variant="ghost" icon="trash-outline" title="Xoá" textStyle={{ color: BRAND.red }} onPress={() => remove(c)} />
              </Row>
            </Row>
          </Card>
        );
      })}
    </Screen>
  );
}
