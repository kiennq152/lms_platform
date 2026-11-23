import React from 'react';
import { View, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { Button } from '@/components/ui/button';
import { Avatar, Badge, BRAND, Card, H1, ListItem, Muted, Notice, Row, Screen } from '@/components/ui/kit';
import { useAuth } from '@/lib/auth';
import { formatDate, fullName, ROLE_LABEL } from '@/lib/format';
import { confirmAsync } from '@/lib/notify';

export default function ProfileScreen() {
  const router = useRouter();
  const { session, profile, role, signOut } = useAuth();

  if (!session) {
    return (
      <Screen tabBarInset>
        <View style={{ alignItems: 'center', paddingVertical: 40 }}>
          <Avatar size={80} user={{ first_name: '?' }} />
          <H1 style={{ marginTop: 16 }}>Chào mừng đến VIAN Academy</H1>
          <Muted style={{ textAlign: 'center', marginBottom: 20 }}>Đăng nhập để theo dõi tiến độ học tập, nhận chứng chỉ và tham gia cộng đồng.</Muted>
          <Button title="Đăng nhập" onPress={() => router.push('/(auth)/login')} style={{ alignSelf: 'stretch' }} />
          <Button title="Tạo tài khoản mới" variant="outline" onPress={() => router.push('/(auth)/register')} style={{ alignSelf: 'stretch', marginTop: 10 }} />
        </View>
        <Card>
          <ListItem icon="help-circle-outline" title="Trợ giúp & Hỗ trợ" onPress={() => router.push('/(details)/support')} />
          <ListItem icon="document-text-outline" title="Điều khoản & Chính sách" onPress={() => router.push('/(details)/legal')} last />
        </Card>
      </Screen>
    );
  }

  const logout = async () => {
    if (!(await confirmAsync('Đăng xuất?', 'Bạn có chắc muốn đăng xuất khỏi tài khoản?', 'Đăng xuất'))) return;
    await signOut();
    router.replace('/(tabs)');
  };

  return (
    <Screen tabBarInset>
      <View style={{ alignItems: 'center', paddingTop: 28, paddingBottom: 20 }}>
        <Avatar uri={profile?.avatar_url} user={profile} size={88} />
        <Text style={{ fontSize: 22, fontWeight: '800', color: BRAND.text, marginTop: 12 }}>{fullName(profile)}</Text>
        <Muted>{profile?.email ?? session.user.email}</Muted>
        <Row style={{ marginTop: 8 }}>
          <Badge label={ROLE_LABEL[role ?? 'student']} tone={role === 'admin' ? 'red' : role === 'instructor' ? 'purple' : 'blue'} />
          <Muted style={{ fontSize: 12 }}>Thành viên từ {formatDate(profile?.created_at)}</Muted>
        </Row>
      </View>

      {role === 'instructor' && profile && !profile.admin_approved && (
        <Notice tone="orange" icon="time-outline">Tài khoản giảng viên của bạn đang chờ quản trị viên phê duyệt. Bạn sẽ có thể tạo khoá học sau khi được duyệt.</Notice>
      )}

      <Card>
        {role === 'admin' && <ListItem icon="speedometer-outline" title="Trang quản trị" subtitle="Người dùng, khoá học, doanh thu" onPress={() => router.push('/admin/dashboard')} />}
        {(role === 'instructor' || role === 'admin') && (
          <ListItem icon="easel-outline" title="Bảng điều khiển giảng viên" subtitle="Khoá học, học viên, doanh thu" onPress={() => router.push('/instructor/dashboard')} />
        )}
        <ListItem icon="school-outline" title="Học tập của tôi" subtitle="Khoá học, chứng chỉ, lịch sử thanh toán" onPress={() => router.push('/student/dashboard')} />
        <ListItem icon="person-outline" title="Chỉnh sửa hồ sơ" onPress={() => router.push('/(details)/edit-profile')} />
        <ListItem icon="key-outline" title="Đổi mật khẩu" onPress={() => router.push('/(details)/change-password')} last />
      </Card>

      <Card>
        <ListItem icon="help-circle-outline" title="Trợ giúp & Hỗ trợ" subtitle="Câu hỏi thường gặp, gửi yêu cầu hỗ trợ" onPress={() => router.push('/(details)/support')} />
        <ListItem icon="document-text-outline" title="Điều khoản & Chính sách" onPress={() => router.push('/(details)/legal')} last />
      </Card>

      <Button title="Đăng xuất" variant="danger" icon="log-out-outline" onPress={logout} />
    </Screen>
  );
}
