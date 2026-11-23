import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Platform, Share } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '@/components/ui/button';
import { BRAND, EmptyState, Field, Loading, Muted, Row, Screen } from '@/components/ui/kit';
import { supabase } from '@/lib/supabase';
import { formatDate, fullName } from '@/lib/format';
import { notify } from '@/lib/notify';
import type { Certificate } from '@/lib/types';

const SELECT =
  '*, student:users!certificates_student_id_fkey(first_name, last_name), ' +
  'course:courses(title, duration_hours, total_lessons, instructor_id, instructor:users!courses_instructor_id_fkey(first_name, last_name))';

/** Certificate view & public verification by code (FR-052..055). */
export default function CertificateScreen() {
  const params = useLocalSearchParams<{ enrollment?: string; code?: string }>();
  const [cert, setCert] = useState<Certificate | null>(null);
  const [loading, setLoading] = useState(!!(params.enrollment || params.code));
  const [lookup, setLookup] = useState(params.code ?? '');

  const find = async (by: { enrollment?: number; code?: string }) => {
    setLoading(true);
    let q = supabase.from('certificates').select(SELECT);
    q = by.enrollment ? q.eq('enrollment_id', by.enrollment) : q.eq('certificate_code', (by.code ?? '').trim().toUpperCase());
    const { data } = await q.maybeSingle();
    setCert((data as unknown as Certificate) ?? null);
    setLoading(false);
  };

  useEffect(() => {
    if (params.enrollment) find({ enrollment: Number(params.enrollment) });
    else if (params.code) find({ code: params.code });
  }, [params.enrollment, params.code]);

  const share = async () => {
    if (!cert) return;
    const text = `Chứng chỉ VIAN Academy – ${cert.course?.title}\nHọc viên: ${fullName(cert.student)}\nMã xác thực: ${cert.certificate_code}`;
    if (Platform.OS === 'web') {
      try {
        await navigator.clipboard.writeText(text);
        notify('Đã sao chép', 'Thông tin chứng chỉ đã được sao chép vào clipboard.');
      } catch {
        notify('Mã chứng chỉ', cert.certificate_code);
      }
      return;
    }
    Share.share({ message: text });
  };

  if (loading) return <Loading />;

  return (
    <Screen>
      {cert ? (
        <>
          <View style={styles.cert} nativeID="certificate">
            <View style={styles.inner}>
              <Ionicons name="ribbon" size={48} color={BRAND.red} />
              <Text style={styles.brand}>VIAN ACADEMY</Text>
              <Text style={styles.heading}>CHỨNG NHẬN HOÀN THÀNH</Text>
              <Muted>Chứng nhận rằng</Muted>
              <Text style={styles.name}>{fullName(cert.student)}</Text>
              <Muted>đã hoàn thành xuất sắc khoá học</Muted>
              <Text style={styles.course}>{cert.course?.title}</Text>
              {cert.course?.total_lessons ? (
                <Muted style={{ fontSize: 13 }}>
                  {cert.course.total_lessons} bài học{Number(cert.course.duration_hours) ? ` · ${cert.course.duration_hours} giờ video` : ''}
                </Muted>
              ) : null}
              <Row style={{ justifyContent: 'space-between', alignSelf: 'stretch', marginTop: 28 }}>
                <View>
                  <Muted style={{ fontSize: 12 }}>Ngày cấp</Muted>
                  <Text style={styles.meta}>{formatDate(cert.issued_at)}</Text>
                </View>
                <View style={{ alignItems: 'center' }}>
                  <Muted style={{ fontSize: 12 }}>Giảng viên</Muted>
                  <Text style={styles.meta}>{fullName(cert.course?.instructor, 'VIAN Academy')}</Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Muted style={{ fontSize: 12 }}>Mã xác thực</Muted>
                  <Text style={[styles.meta, { letterSpacing: 1 }]}>{cert.certificate_code}</Text>
                </View>
              </Row>
            </View>
          </View>
          <Row wrap style={{ marginTop: 16 }}>
            {Platform.OS === 'web' && <Button title="In / Lưu PDF" icon="print-outline" onPress={() => window.print()} />}
            <Button title={Platform.OS === 'web' ? 'Sao chép thông tin' : 'Chia sẻ'} variant="outline" icon="share-social-outline" onPress={share} />
          </Row>
        </>
      ) : (
        <>
          {(params.enrollment || params.code) ? (
            <EmptyState icon="alert-circle-outline" title="Không tìm thấy chứng chỉ" message="Mã không hợp lệ hoặc khoá học chưa hoàn thành." />
          ) : null}
          <Text style={{ fontSize: 18, fontWeight: '700', color: BRAND.text, marginBottom: 10 }}>Xác thực chứng chỉ</Text>
          <Field placeholder="Nhập mã chứng chỉ (10 ký tự)" value={lookup} onChangeText={setLookup} autoCapitalize="characters" />
          <Button title="Kiểm tra" onPress={() => find({ code: lookup })} />
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  cert: { borderWidth: 3, borderColor: BRAND.blue, borderRadius: 12, padding: 6, backgroundColor: '#FFF' },
  inner: { borderWidth: 1, borderColor: '#C9A227', borderRadius: 8, padding: 24, alignItems: 'center', gap: 6 },
  brand: { fontSize: 14, fontWeight: '900', color: BRAND.blue, letterSpacing: 3 },
  heading: { fontSize: 22, fontWeight: '900', color: BRAND.text, marginVertical: 8, textAlign: 'center' },
  name: { fontSize: 28, fontWeight: '800', color: BRAND.red, marginVertical: 6, textAlign: 'center' },
  course: { fontSize: 18, fontWeight: '700', color: BRAND.text, textAlign: 'center', marginVertical: 4 },
  meta: { fontWeight: '700', color: BRAND.text, fontSize: 13 },
});
