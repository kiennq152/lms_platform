import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '@/components/ui/button';
import { Badge, BRAND, Card, Field, H2, Muted, Row, Screen, statusTone } from '@/components/ui/kit';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import { formatDateTime, fullName, TICKET_STATUS_LABEL } from '@/lib/format';
import { errorMessage, notify } from '@/lib/notify';
import type { SupportTicket } from '@/lib/types';

const FAQ = [
  { q: 'Làm sao để đăng ký khoá học?', a: 'Mở trang chi tiết khoá học, chọn "Đăng ký học miễn phí" (khoá miễn phí) hoặc "Mua ngay" / "Thêm vào giỏ hàng" (khoá trả phí), sau đó hoàn tất thanh toán.' },
  { q: 'Tôi có được truy cập khoá học trọn đời không?', a: 'Có. Sau khi đăng ký, bạn có thể học lại bất cứ lúc nào trong mục "Học tập của tôi".' },
  { q: 'Khi nào tôi nhận được chứng chỉ?', a: 'Chứng chỉ được cấp tự động ngay khi bạn hoàn thành 100% bài học của khoá. Bạn có thể xem và chia sẻ mã chứng chỉ trong "Học tập của tôi".' },
  { q: 'Tôi có thể sử dụng mã giảm giá thế nào?', a: 'Nhập mã ở bước thanh toán và bấm "Áp dụng". Mỗi mã có thể có giới hạn số lượt dùng và hạn sử dụng.' },
  { q: 'Chính sách hoàn tiền ra sao?', a: 'Gửi yêu cầu hỗ trợ kèm mã giao dịch. Sau khi hoàn tiền, quyền truy cập khoá học tương ứng sẽ bị thu hồi.' },
  { q: 'Làm sao để trở thành giảng viên?', a: 'Đăng ký tài khoản với vai trò "Giảng viên". Quản trị viên sẽ xét duyệt hồ sơ trước khi bạn có thể tạo khoá học. Mỗi khoá học cũng được kiểm duyệt trước khi xuất bản.' },
  { q: 'Tôi quên mật khẩu?', a: 'Ở màn hình đăng nhập, nhập email rồi chọn "Quên mật khẩu?". Bạn sẽ nhận mã xác thực qua email để đặt mật khẩu mới.' },
];

export default function SupportScreen() {
  const { session, profile, settings } = useAuth();
  const [open, setOpen] = useState<number | null>(0);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [mine, setMine] = useState<SupportTicket[]>([]);

  useEffect(() => {
    if (profile) {
      setName(fullName(profile, ''));
      setEmail(profile.email);
    }
  }, [profile]);

  const loadMine = useCallback(async () => {
    if (!session?.user) return setMine([]);
    const { data } = await supabase.from('support_tickets').select('*').eq('user_id', session.user.id).order('created_at', { ascending: false });
    setMine((data as SupportTicket[]) ?? []);
  }, [session?.user]);

  useEffect(() => { loadMine(); }, [loadMine]);

  const submit = async () => {
    if (!email.trim() || !subject.trim() || !message.trim()) return notify('Thiếu thông tin', 'Vui lòng nhập email, tiêu đề và nội dung.');
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) return notify('Email không hợp lệ', 'Vui lòng kiểm tra lại địa chỉ email.');
    setSending(true);
    const { error } = await supabase.from('support_tickets').insert({
      user_id: session?.user?.id ?? null,
      name: name.trim() || null,
      email: email.trim(),
      subject: subject.trim(),
      message: message.trim(),
    });
    setSending(false);
    if (error) return notify('Không gửi được yêu cầu', errorMessage(error));
    setSubject('');
    setMessage('');
    notify('Đã gửi yêu cầu', 'Chúng tôi sẽ phản hồi qua email trong thời gian sớm nhất.');
    loadMine();
  };

  return (
    <Screen>
      <H2>Câu hỏi thường gặp</H2>
      {FAQ.map((f, i) => (
        <TouchableOpacity key={i} onPress={() => setOpen(open === i ? null : i)} style={{ borderBottomWidth: 1, borderBottomColor: '#EEE', paddingVertical: 12 }}>
          <Row style={{ justifyContent: 'space-between' }}>
            <Text style={{ fontWeight: '700', color: BRAND.text, flex: 1 }}>{f.q}</Text>
            <Ionicons name={open === i ? 'remove' : 'add'} size={18} color={BRAND.blue} />
          </Row>
          {open === i && <Text style={{ color: '#555', marginTop: 8, lineHeight: 21 }}>{f.a}</Text>}
        </TouchableOpacity>
      ))}

      <H2 style={{ marginTop: 24 }}>Liên hệ trực tiếp</H2>
      <Card>
        {settings?.support_email ? (
          <TouchableOpacity onPress={() => Linking.openURL(`mailto:${settings.support_email}`)}>
            <Row><Ionicons name="mail-outline" size={18} color={BRAND.blue} /><Text style={{ color: BRAND.blue }}>{settings.support_email}</Text></Row>
          </TouchableOpacity>
        ) : null}
        {settings?.support_phone ? (
          <Row style={{ marginTop: 8 }}><Ionicons name="call-outline" size={18} color={BRAND.blue} /><Text>{settings.support_phone}</Text></Row>
        ) : null}
        <Row style={{ marginTop: 8 }}><Ionicons name="time-outline" size={18} color={BRAND.blue} /><Muted>Thứ 2 – Thứ 6, 8:00 – 17:30</Muted></Row>
      </Card>

      <H2 style={{ marginTop: 12 }}>Gửi yêu cầu hỗ trợ</H2>
      <Card>
        <Field label="Họ tên" value={name} onChangeText={setName} />
        <Field label="Email *" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />
        <Field label="Tiêu đề *" value={subject} onChangeText={setSubject} placeholder="VD: Không xem được video bài 3" />
        <Field label="Nội dung *" value={message} onChangeText={setMessage} multiline placeholder="Mô tả chi tiết vấn đề, kèm mã giao dịch nếu có" />
        <Button title="Gửi yêu cầu" icon="send-outline" onPress={submit} loading={sending} />
      </Card>

      {mine.length > 0 && (
        <>
          <H2 style={{ marginTop: 12 }}>Yêu cầu của tôi</H2>
          {mine.map((t) => (
            <Card key={t.ticket_id}>
              <Row style={{ justifyContent: 'space-between' }}>
                <Text style={{ fontWeight: '700', color: BRAND.text, flex: 1 }}>#{t.ticket_id} · {t.subject}</Text>
                <Badge label={TICKET_STATUS_LABEL[t.status]} tone={statusTone(t.status)} />
              </Row>
              <Muted style={{ fontSize: 12, marginTop: 4 }}>{formatDateTime(t.created_at)}</Muted>
              {t.admin_note ? (
                <View style={{ marginTop: 8, padding: 10, backgroundColor: '#F5F8FF', borderRadius: 8 }}>
                  <Text style={{ fontWeight: '700', color: BRAND.blue, marginBottom: 2 }}>Phản hồi từ VIAN</Text>
                  <Text style={{ color: '#333' }}>{t.admin_note}</Text>
                </View>
              ) : null}
            </Card>
          ))}
        </>
      )}
    </Screen>
  );
}
