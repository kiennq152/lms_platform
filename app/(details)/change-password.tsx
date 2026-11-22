import React, { useState } from 'react';
import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';
import { Button } from '@/components/ui/button';
import { Field, Loading, Notice, Screen } from '@/components/ui/kit';
import { supabase } from '@/lib/supabase';
import { useAuth, homeForRole } from '@/lib/auth';
import { errorMessage, notify } from '@/lib/notify';

export default function ChangePasswordScreen() {
  const router = useRouter();
  const { reset } = useLocalSearchParams<{ reset?: string }>();
  const { session, loading, role } = useAuth();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [saving, setSaving] = useState(false);

  if (loading) return <Loading />;
  if (!session) return <Redirect href="/(auth)/login" />;

  const save = async () => {
    if (password.length < 6) return notify('Mật khẩu quá ngắn', 'Mật khẩu phải có ít nhất 6 ký tự.');
    if (password !== confirm) return notify('Không khớp', 'Mật khẩu xác nhận không khớp.');
    setSaving(true);
    const { error } = await supabase.auth.updateUser({ password });
    setSaving(false);
    if (error) return notify('Không đổi được mật khẩu', errorMessage(error));
    notify('Thành công', 'Mật khẩu của bạn đã được cập nhật.');
    if (reset) router.replace(homeForRole(role) as any);
    else router.back();
  };

  return (
    <Screen>
      {reset ? <Notice tone="green" icon="shield-checkmark-outline">Xác thực thành công. Hãy đặt mật khẩu mới cho tài khoản của bạn.</Notice> : null}
      <Field label="Mật khẩu mới" value={password} onChangeText={setPassword} secureTextEntry placeholder="Tối thiểu 6 ký tự" />
      <Field label="Xác nhận mật khẩu mới" value={confirm} onChangeText={setConfirm} secureTextEntry onSubmitEditing={save} />
      <Button title="Cập nhật mật khẩu" onPress={save} loading={saving} />
    </Screen>
  );
}
