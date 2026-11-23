import React, { useCallback, useMemo, useState } from 'react';
import { View, Text, Linking } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Button } from '@/components/ui/button';
import { Badge, BRAND, Card, Chips, EmptyState, Field, Loading, Muted, Row, Screen, statusTone } from '@/components/ui/kit';
import { supabase } from '@/lib/supabase';
import { formatDateTime, TICKET_STATUS_LABEL } from '@/lib/format';
import { errorMessage, notify } from '@/lib/notify';
import type { SupportTicket } from '@/lib/types';

type Filter = 'active' | SupportTicket['status'] | 'all';

/** Support request handling (FR-101). */
export default function AdminTickets() {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>('active');
  const [open, setOpen] = useState<number | null>(null);
  const [note, setNote] = useState('');

  const load = useCallback(async () => {
    const { data, error } = await supabase.from('support_tickets').select('*').order('created_at', { ascending: false }).limit(500);
    if (error) notify('Lỗi', errorMessage(error));
    setTickets((data as SupportTicket[]) ?? []);
    setLoading(false);
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const visible = useMemo(() => tickets.filter((t) =>
    filter === 'all' ? true : filter === 'active' ? t.status === 'open' || t.status === 'in_progress' : t.status === filter), [tickets, filter]);

  const update = async (t: SupportTicket, patch: Partial<SupportTicket>) => {
    const { error } = await supabase.from('support_tickets').update(patch).eq('ticket_id', t.ticket_id);
    if (error) return notify('Lỗi', errorMessage(error));
    setTickets((list) => list.map((x) => (x.ticket_id === t.ticket_id ? { ...x, ...patch } : x)));
  };

  if (loading) return <Loading />;

  return (
    <Screen wide>
      <Chips<Filter>
        options={[
          { value: 'active', label: 'Cần xử lý' },
          { value: 'open', label: 'Mới' },
          { value: 'in_progress', label: 'Đang xử lý' },
          { value: 'resolved', label: 'Đã giải quyết' },
          { value: 'closed', label: 'Đã đóng' },
          { value: 'all', label: 'Tất cả' },
        ]}
        value={filter}
        onChange={setFilter}
        style={{ marginBottom: 14 }}
      />
      {visible.length === 0 ? <EmptyState icon="happy-outline" title="Không có yêu cầu nào" /> : visible.map((t) => (
        <Card key={t.ticket_id}>
          <Row style={{ justifyContent: 'space-between', alignItems: 'flex-start' }} wrap>
            <View style={{ flex: 1, minWidth: 220 }}>
              <Text style={{ fontWeight: '700', color: BRAND.text }}>#{t.ticket_id} · {t.subject}</Text>
              <Muted style={{ fontSize: 12 }}>{t.name ? `${t.name} · ` : ''}{t.email} · {formatDateTime(t.created_at)}{t.user_id ? '' : ' · khách'}</Muted>
            </View>
            <Badge label={TICKET_STATUS_LABEL[t.status]} tone={statusTone(t.status)} />
          </Row>
          <Text style={{ color: '#333', marginTop: 8, lineHeight: 21 }}>{t.message}</Text>
          {t.admin_note && open !== t.ticket_id ? (
            <View style={{ marginTop: 8, padding: 10, backgroundColor: '#F5F8FF', borderRadius: 8 }}>
              <Text style={{ fontWeight: '700', color: BRAND.blue, marginBottom: 2 }}>Phản hồi</Text>
              <Text style={{ color: '#333' }}>{t.admin_note}</Text>
            </View>
          ) : null}
          {open === t.ticket_id ? (
            <View style={{ marginTop: 10 }}>
              <Field label="Phản hồi cho người dùng (hiển thị ở trang Hỗ trợ của họ)" value={note} onChangeText={setNote} multiline />
              <Row wrap>
                <Button size="sm" title="Lưu & đánh dấu đã giải quyết" variant="success" onPress={async () => { await update(t, { admin_note: note.trim() || null, status: 'resolved' }); setOpen(null); }} />
                <Button size="sm" title="Lưu phản hồi" onPress={async () => { await update(t, { admin_note: note.trim() || null, status: t.status === 'open' ? 'in_progress' : t.status }); setOpen(null); }} />
                <Button size="sm" title="Huỷ" variant="ghost" onPress={() => setOpen(null)} />
              </Row>
            </View>
          ) : (
            <Row wrap style={{ marginTop: 10 }}>
              <Button size="sm" variant="ghost" icon="chatbox-ellipses-outline" title="Phản hồi" onPress={() => { setOpen(t.ticket_id); setNote(t.admin_note ?? ''); }} />
              <Button size="sm" variant="ghost" icon="mail-outline" title="Gửi email" onPress={() => Linking.openURL(`mailto:${t.email}?subject=${encodeURIComponent('Re: ' + t.subject)}`)} />
              {t.status === 'open' && <Button size="sm" variant="outline" title="Nhận xử lý" onPress={() => update(t, { status: 'in_progress' })} />}
              {t.status !== 'closed' && <Button size="sm" variant="ghost" title="Đóng" onPress={() => update(t, { status: 'closed' })} />}
              {t.status === 'closed' && <Button size="sm" variant="ghost" title="Mở lại" onPress={() => update(t, { status: 'open' })} />}
            </Row>
          )}
        </Card>
      ))}
    </Screen>
  );
}
