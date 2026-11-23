import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { Redirect, useRouter } from 'expo-router';
import { Button } from '@/components/ui/button';
import { Avatar, Field, Loading, Muted, Row, Screen } from '@/components/ui/kit';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import { pickAndUploadImage } from '@/lib/api';
import { errorMessage, notify } from '@/lib/notify';

export default function EditProfileScreen() {
  const router = useRouter();
  const { session, profile, role, loading, refreshProfile } = useAuth();
  const [form, setForm] = useState({
    first_name: '', last_name: '', phone: '', bio: '', social_link: '', degree: '', experience_years: '', avatar_url: '',
  });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (!profile) return;
    setForm({
      first_name: profile.first_name ?? '',
      last_name: profile.last_name ?? '',
      phone: profile.phone ?? '',
      bio: profile.bio ?? '',
      social_link: profile.social_link ?? '',
      degree: profile.degree ?? '',
      experience_years: profile.experience_years != null ? String(profile.experience_years) : '',
      avatar_url: profile.avatar_url ?? '',
    });
  }, [profile]);

  if (loading) return <Loading />;
  if (!session) return <Redirect href="/(auth)/login" />;

  const set = (key: keyof typeof form) => (value: string) => setForm((f) => ({ ...f, [key]: value }));

  const upload = async () => {
    try {
      setUploading(true);
      const url = await pickAndUploadImage('avatars', [1, 1]);
      if (url) setForm((f) => ({ ...f, avatar_url: url }));
    } catch (e) {
      notify('Không tải được ảnh', errorMessage(e));
    } finally {
      setUploading(false);
    }
  };

  const save = async () => {
    if (!form.first_name.trim()) return notify('Thiếu thông tin', 'Vui lòng nhập họ.');
    setSaving(true);
    const { error } = await supabase.from('users').update({
      first_name: form.first_name.trim(),
      last_name: form.last_name.trim() || null,
      phone: form.phone.trim() || null,
      bio: form.bio.trim() || null,
      social_link: form.social_link.trim() || null,
      degree: form.degree.trim() || null,
      experience_years: form.experience_years ? parseInt(form.experience_years, 10) || 0 : null,
      avatar_url: form.avatar_url.trim() || null,
    }).eq('id', session.user.id);
    setSaving(false);
    if (error) return notify('Không lưu được', errorMessage(error));
    await refreshProfile();
    notify('Đã lưu', 'Hồ sơ của bạn đã được cập nhật.');
    router.back();
  };

  return (
    <Screen>
      <View style={{ alignItems: 'center', marginBottom: 20 }}>
        <Avatar uri={form.avatar_url} user={form} size={96} />
        <Button title="Đổi ảnh đại diện" size="sm" variant="ghost" icon="camera-outline" onPress={upload} loading={uploading} style={{ marginTop: 10 }} />
      </View>
      <Row style={{ alignItems: 'flex-start' }}>
        <Field label="Họ *" value={form.first_name} onChangeText={set('first_name')} containerStyle={{ flex: 1 }} />
        <Field label="Tên" value={form.last_name} onChangeText={set('last_name')} containerStyle={{ flex: 1 }} />
      </Row>
      <Field label="Email" value={profile?.email ?? ''} editable={false} hint="Email đăng nhập không thể thay đổi." style={{ backgroundColor: '#F5F5F5' }} />
      <Field label="Số điện thoại" value={form.phone} onChangeText={set('phone')} keyboardType="phone-pad" />
      <Field label="Giới thiệu bản thân" value={form.bio} onChangeText={set('bio')} multiline />
      <Field label="Liên kết mạng xã hội / Website" value={form.social_link} onChangeText={set('social_link')} autoCapitalize="none" />
      {(role === 'instructor' || role === 'admin') && (
        <>
          <Field label="Bằng cấp / Chứng chỉ" value={form.degree} onChangeText={set('degree')} />
          <Field label="Số năm kinh nghiệm" value={form.experience_years} onChangeText={set('experience_years')} keyboardType="number-pad" />
        </>
      )}
      <Field label="Hoặc dán URL ảnh đại diện" value={form.avatar_url} onChangeText={set('avatar_url')} autoCapitalize="none" />
      <Muted style={{ marginBottom: 12, fontSize: 12 }}>Thông tin công khai (tên, ảnh, giới thiệu) sẽ hiển thị cho học viên khác.</Muted>
      <Button title="Lưu thay đổi" onPress={save} loading={saving} />
    </Screen>
  );
}
