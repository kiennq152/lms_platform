import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '@/components/ui/button';
import { BRAND, Card, Divider, EmptyState, Field, H2, Loading, Muted, Notice, Row, Screen } from '@/components/ui/kit';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import { useCart } from '@/lib/cart';
import { formatMoney, PAYMENT_METHOD_LABEL } from '@/lib/format';
import { errorMessage, notify } from '@/lib/notify';
import type { Quote } from '@/lib/types';

type Method = 'credit_card' | 'paypal' | 'bank_transfer';
const METHODS: { id: Method; icon: keyof typeof Ionicons.glyphMap; hint: string }[] = [
  { id: 'credit_card', icon: 'card-outline', hint: 'Visa, Mastercard, JCB' },
  { id: 'paypal', icon: 'logo-paypal', hint: 'Thanh toán qua tài khoản PayPal' },
  { id: 'bank_transfer', icon: 'business-outline', hint: 'Chuyển khoản ngân hàng nội địa' },
];

export default function CheckoutScreen() {
  const router = useRouter();
  const { ids: idsParam } = useLocalSearchParams<{ ids?: string }>();
  const { session, loading: authLoading } = useAuth();
  const cart = useCart();
  const courseIds = idsParam ? idsParam.split(',').map(Number).filter(Boolean) : cart.ids;

  const [quote, setQuote] = useState<Quote | null>(null);
  const [coupon, setCoupon] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null);
  const [method, setMethod] = useState<Method>('credit_card');
  const [cardName, setCardName] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [result, setResult] = useState<{ reference: string; total: number; items: { course_id: number; title: string }[] } | null>(null);

  const fetchQuote = useCallback(async (code: string | null) => {
    const { data, error } = await supabase.rpc('quote_checkout', { p_course_ids: courseIds, p_coupon: code });
    if (error) {
      notify('Không tính được giá', errorMessage(error));
      return null;
    }
    setQuote(data as Quote);
    return data as Quote;
  }, [courseIds.join(',')]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!session) return;
    fetchQuote(null).finally(() => setLoading(false));
  }, [session, fetchQuote]);

  const applyCoupon = async () => {
    const code = coupon.trim();
    if (!code) {
      setAppliedCoupon(null);
      await fetchQuote(null);
      return;
    }
    const q = await fetchQuote(code);
    if (q?.coupon_valid) setAppliedCoupon(code);
    else {
      setAppliedCoupon(null);
      notify('Mã không hợp lệ', q?.coupon_message ?? 'Không áp dụng được mã giảm giá.');
      await fetchQuote(null);
    }
  };

  const pay = async () => {
    if (!quote?.items.length) return;
    if (method === 'credit_card' && quote.total > 0 && (cardName.trim().length < 2 || cardNumber.replace(/\D/g, '').length < 12)) {
      return notify('Thiếu thông tin thẻ', 'Vui lòng nhập tên chủ thẻ và số thẻ hợp lệ (môi trường thử nghiệm – không trừ tiền thật).');
    }
    setPaying(true);
    const { data, error } = await supabase.rpc('checkout', {
      p_course_ids: quote.items.map((i) => i.course_id),
      p_coupon: appliedCoupon,
      p_payment_method: method,
    });
    setPaying(false);
    if (error) return notify('Thanh toán thất bại', errorMessage(error));
    cart.removeMany(courseIds);
    setResult(data as typeof result);
  };

  if (authLoading) return <Loading />;
  if (!session) return <Redirect href="/(auth)/login" />;
  if (loading) return <Loading />;

  if (result) {
    return (
      <Screen>
        <View style={{ alignItems: 'center', paddingVertical: 24 }}>
          <Ionicons name="checkmark-circle" size={72} color={BRAND.green} />
          <Text style={styles.successTitle}>Thanh toán thành công!</Text>
          <Muted>Mã giao dịch: {result.reference}</Muted>
          <Muted>Tổng thanh toán: {formatMoney(result.total)}</Muted>
        </View>
        {result.items.map((i) => (
          <Card key={i.course_id}>
            <Row style={{ justifyContent: 'space-between' }}>
              <Text style={{ flex: 1, fontWeight: '700', color: BRAND.text }}>{i.title}</Text>
              <Button title="Vào học" size="sm" onPress={() => router.replace({ pathname: '/(details)/course-player', params: { id: String(i.course_id) } })} />
            </Row>
          </Card>
        ))}
        <Button title="Xem lịch sử giao dịch" variant="outline" onPress={() => router.replace('/student/dashboard')} style={{ marginTop: 8 }} />
      </Screen>
    );
  }

  if (!quote || quote.items.length === 0) {
    return (
      <Screen>
        <EmptyState
          icon="cart-outline"
          title="Không có khoá học cần thanh toán"
          message="Giỏ hàng trống hoặc bạn đã sở hữu các khoá học này."
          action={<Button title="Về giỏ hàng" onPress={() => router.replace('/(tabs)/cart')} />}
        />
      </Screen>
    );
  }

  return (
    <Screen>
      <Notice tone="orange" icon="flask-outline">
        Môi trường thử nghiệm: cổng thanh toán được mô phỏng, không có khoản tiền thật nào bị trừ.
      </Notice>

      <H2>Đơn hàng ({quote.items.length})</H2>
      <Card>
        {quote.items.map((i) => (
          <Row key={i.course_id} style={{ justifyContent: 'space-between', marginBottom: 8, alignItems: 'flex-start' }}>
            <Text style={{ flex: 1, color: BRAND.text }} numberOfLines={2}>{i.title}</Text>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={{ fontWeight: '700', color: BRAND.text }}>{formatMoney(i.amount)}</Text>
              {i.discount > 0 && <Text style={styles.strike}>{formatMoney(i.price)}</Text>}
            </View>
          </Row>
        ))}
        <Divider />
        <Row style={{ justifyContent: 'space-between' }}><Muted>Tạm tính</Muted><Text>{formatMoney(quote.subtotal)}</Text></Row>
        {quote.discount > 0 && (
          <Row style={{ justifyContent: 'space-between', marginTop: 4 }}>
            <Text style={{ color: BRAND.green }}>Giảm giá ({appliedCoupon?.toUpperCase()})</Text>
            <Text style={{ color: BRAND.green }}>−{formatMoney(quote.discount)}</Text>
          </Row>
        )}
        <Row style={{ justifyContent: 'space-between', marginTop: 8 }}>
          <Text style={{ fontWeight: '800', fontSize: 16, color: BRAND.text }}>Tổng cộng</Text>
          <Text style={{ fontWeight: '900', fontSize: 22, color: BRAND.red }}>{formatMoney(quote.total)}</Text>
        </Row>
      </Card>

      <H2>Mã giảm giá</H2>
      <Row style={{ alignItems: 'flex-start' }}>
        <Field placeholder="Nhập mã (VD: WELCOME10)" value={coupon} onChangeText={setCoupon} autoCapitalize="characters" containerStyle={{ flex: 1, marginBottom: 0 }} />
        <Button title={appliedCoupon ? 'Đổi mã' : 'Áp dụng'} variant="secondary" onPress={applyCoupon} />
      </Row>
      {appliedCoupon && quote.coupon_message ? <Text style={{ color: BRAND.green, marginTop: 6 }}>{quote.coupon_message}</Text> : null}

      <H2 style={{ marginTop: 12 }}>Phương thức thanh toán</H2>
      {METHODS.map((m) => {
        const active = m.id === method;
        return (
          <TouchableOpacity key={m.id} onPress={() => setMethod(m.id)} style={[styles.method, active && styles.methodActive]} accessibilityRole="radio" accessibilityState={{ checked: active }}>
            <Ionicons name={m.icon} size={22} color={active ? BRAND.blue : '#666'} />
            <View style={{ flex: 1 }}>
              <Text style={{ fontWeight: '700', color: active ? BRAND.blue : BRAND.text }}>{PAYMENT_METHOD_LABEL[m.id]}</Text>
              <Muted style={{ fontSize: 12 }}>{m.hint}</Muted>
            </View>
            <Ionicons name={active ? 'radio-button-on' : 'radio-button-off'} size={20} color={active ? BRAND.blue : '#BBB'} />
          </TouchableOpacity>
        );
      })}

      {method === 'credit_card' && quote.total > 0 && (
        <Card style={{ marginTop: 4 }}>
          <Field label="Tên chủ thẻ" placeholder="NGUYEN VAN A" value={cardName} onChangeText={setCardName} autoCapitalize="characters" />
          <Field label="Số thẻ" placeholder="4242 4242 4242 4242" value={cardNumber} onChangeText={setCardNumber} keyboardType="number-pad" maxLength={23} />
        </Card>
      )}
      {method === 'bank_transfer' && (
        <Notice>Sau khi xác nhận, hệ thống ghi nhận giao dịch và mở khoá học ngay (mô phỏng).</Notice>
      )}

      <Button
        title={quote.total > 0 ? `Thanh toán ${formatMoney(quote.total)}` : 'Xác nhận đăng ký (0₫)'}
        icon="lock-closed-outline"
        onPress={pay}
        loading={paying}
        style={{ marginTop: 12, paddingVertical: 14 }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  strike: { color: '#999', textDecorationLine: 'line-through', fontSize: 12 },
  method: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 10, borderWidth: 1, borderColor: BRAND.border, marginBottom: 8 },
  methodActive: { borderColor: BRAND.blue, backgroundColor: '#F5F8FF' },
  successTitle: { fontSize: 22, fontWeight: '800', color: BRAND.text, marginTop: 12, marginBottom: 6 },
});
