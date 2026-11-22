import React, { useCallback, useMemo, useState } from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '@/components/ui/button';
import { Badge, BRAND, Card, Chips, EmptyState, Loading, Muted, Row, Screen, StatCard, StatGrid, statusTone } from '@/components/ui/kit';
import { supabase } from '@/lib/supabase';
import { formatDateTime, formatMoney, fullName, PAYMENT_METHOD_LABEL, PAYMENT_STATUS_LABEL } from '@/lib/format';
import { confirmAsync, errorMessage, notify } from '@/lib/notify';
import { exportCsv } from '@/lib/export';
import type { Transaction } from '@/lib/types';

type StatusFilter = 'all' | Transaction['payment_status'];
type Period = 'all' | 'today' | '7d' | '30d' | 'year';

const PERIOD_START: Record<Period, () => Date | null> = {
  all: () => null,
  today: () => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; },
  '7d': () => new Date(Date.now() - 7 * 86400000),
  '30d': () => new Date(Date.now() - 30 * 86400000),
  year: () => new Date(new Date().getFullYear(), 0, 1),
};

/** Transaction management & refunds (FR-083..086). */
export default function AdminTransactions() {
  const [txs, setTxs] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<StatusFilter>('all');
  const [period, setPeriod] = useState<Period>('30d');
  const [search, setSearch] = useState('');
  const [refunding, setRefunding] = useState<number | null>(null);

  const load = useCallback(async () => {
    const { data, error } = await supabase.from('transactions')
      .select('*, course:courses(title), student:users!transactions_student_id_fkey(first_name, last_name, email)')
      .order('transaction_date', { ascending: false }).limit(2000);
    if (error) notify('Lỗi', errorMessage(error));
    setTxs((data as unknown as Transaction[]) ?? []);
    setLoading(false);
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const visible = useMemo(() => {
    const start = PERIOD_START[period]();
    const q = search.trim().toLowerCase();
    return txs.filter((t) => {
      if (status !== 'all' && t.payment_status !== status) return false;
      if (start && new Date(t.transaction_date) < start) return false;
      if (q) {
        const hay = `${t.transaction_id} ${t.payment_gateway_transaction_id ?? ''} ${t.course?.title ?? ''} ${fullName(t.student, '')} ${t.student?.email ?? ''} ${t.coupon_code ?? ''}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [txs, status, period, search]);

  const totals = useMemo(() => {
    const completed = visible.filter((t) => t.payment_status === 'completed');
    return {
      revenue: completed.reduce((s, t) => s + Number(t.amount), 0),
      discount: completed.reduce((s, t) => s + Number(t.discount_amount || 0), 0),
      refunded: visible.filter((t) => t.payment_status === 'refunded').reduce((s, t) => s + Number(t.amount), 0),
      count: completed.length,
    };
  }, [visible]);

  const refund = async (t: Transaction) => {
    if (!(await confirmAsync('Hoàn tiền giao dịch?', `${formatMoney(t.amount)} cho ${fullName(t.student)} – "${t.course?.title}". Học viên sẽ mất quyền truy cập khoá học.`, 'Hoàn tiền', true))) return;
    setRefunding(t.transaction_id);
    const { error } = await supabase.rpc('refund_transaction', { p_transaction_id: t.transaction_id });
    setRefunding(null);
    if (error) return notify('Không hoàn tiền được', errorMessage(error));
    notify('Đã hoàn tiền', 'Giao dịch đã được đánh dấu hoàn tiền.');
    load();
  };

  const doExport = () => exportCsv(
    `vian-transactions-${new Date().toISOString().slice(0, 10)}.csv`,
    ['ID', 'Mã GD', 'Thời gian', 'Học viên', 'Email', 'Khoá học', 'Số tiền', 'Giảm giá', 'Mã giảm giá', 'Phương thức', 'Trạng thái'],
    visible.map((t) => [t.transaction_id, t.payment_gateway_transaction_id, t.transaction_date, fullName(t.student, ''), t.student?.email, t.course?.title,
      t.amount, t.discount_amount, t.coupon_code, PAYMENT_METHOD_LABEL[t.payment_method], PAYMENT_STATUS_LABEL[t.payment_status]]),
  );

  if (loading) return <Loading />;

  return (
    <Screen wide>
      <StatGrid>
        <StatCard label="Doanh thu (lọc)" value={formatMoney(totals.revenue)} sub={`${totals.count} giao dịch`} icon="cash-outline" highlight />
        <StatCard label="Đã giảm giá" value={formatMoney(totals.discount)} icon="pricetag-outline" tone="orange" />
        <StatCard label="Đã hoàn tiền" value={formatMoney(totals.refunded)} icon="return-down-back-outline" tone="purple" />
      </StatGrid>

      <Row style={{ marginBottom: 12 }} wrap>
        <View style={[styles.search, { flex: 1, minWidth: 240, marginBottom: 0 }]}>
          <Ionicons name="search" size={18} color="#999" />
          <TextInput style={{ flex: 1, paddingVertical: 10 }} placeholder="Mã GD, học viên, email, khoá học, mã giảm giá" value={search} onChangeText={setSearch} />
        </View>
        <Button title="Xuất CSV" size="sm" variant="outline" icon="download-outline" onPress={doExport} />
      </Row>
      <Chips<Period>
        options={[{ value: 'today', label: 'Hôm nay' }, { value: '7d', label: '7 ngày' }, { value: '30d', label: '30 ngày' }, { value: 'year', label: 'Năm nay' }, { value: 'all', label: 'Tất cả' }]}
        value={period}
        onChange={setPeriod}
      />
      <View style={{ height: 8 }} />
      <Chips<StatusFilter>
        options={[{ value: 'all', label: 'Mọi trạng thái' }, ...(['completed', 'refunded', 'pending', 'failed'] as const).map((s) => ({ value: s, label: PAYMENT_STATUS_LABEL[s] }))]}
        value={status}
        onChange={setStatus}
        style={{ marginBottom: 12 }}
      />

      {visible.length === 0 ? <EmptyState icon="receipt-outline" title="Không có giao dịch phù hợp" /> : visible.map((t) => (
        <Card key={t.transaction_id} style={{ paddingVertical: 12 }}>
          <Row wrap gap={12} style={{ alignItems: 'flex-start' }}>
            <View style={{ flex: 1, minWidth: 240 }}>
              <Text style={{ fontWeight: '700', color: BRAND.text }} numberOfLines={1}>{t.course?.title ?? 'Khoá học đã xoá'}</Text>
              <Muted style={{ fontSize: 12 }}>{fullName(t.student)} · {t.student?.email}</Muted>
              <Muted style={{ fontSize: 12 }}>
                #{t.transaction_id} · {t.payment_gateway_transaction_id ?? '—'} · {formatDateTime(t.transaction_date)} · {PAYMENT_METHOD_LABEL[t.payment_method]}
                {t.coupon_code ? ` · ${t.coupon_code} (−${formatMoney(t.discount_amount)})` : ''}
              </Muted>
            </View>
            <View style={{ alignItems: 'flex-end', gap: 6 }}>
              <Text style={{ fontWeight: '800', fontSize: 16, color: BRAND.text }}>{formatMoney(t.amount)}</Text>
              <Badge label={PAYMENT_STATUS_LABEL[t.payment_status]} tone={statusTone(t.payment_status)} />
              {t.payment_status === 'completed' && (
                <Button size="sm" variant="ghost" title="Hoàn tiền" icon="return-down-back-outline" textStyle={{ color: BRAND.red }} loading={refunding === t.transaction_id} onPress={() => refund(t)} />
              )}
            </View>
          </Row>
        </Card>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  search: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#F5F5F5', borderRadius: 10, paddingHorizontal: 12, marginBottom: 12 },
});
