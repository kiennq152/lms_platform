import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, Field, H2, Loading, Muted, Notice, Screen, Toggle } from '@/components/ui/kit';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import { errorMessage, notify } from '@/lib/notify';
import type { AppSettings } from '@/lib/types';

/** System settings (FR-087..091). Security & email delivery live in Supabase Dashboard → Authentication. */
export default function AdminSettings() {
  const { settings, refreshSettings } = useAuth();
  const [form, setForm] = useState<AppSettings | null>(settings);
  const [saving, setSaving] = useState(false);

  useEffect(() => { if (settings) setForm(settings); }, [settings]);

  if (!form) return <Loading />;

  const save = async () => {
    if (!form.site_name.trim()) return notify('Thiếu tên', 'Vui lòng nhập tên hệ thống.');
    setSaving(true);
    const { error } = await supabase.from('app_settings').update({
      site_name: form.site_name.trim(),
      support_email: form.support_email?.trim() || null,
      support_phone: form.support_phone?.trim() || null,
      maintenance_mode: form.maintenance_mode,
      maintenance_message: form.maintenance_message?.trim() || null,
      allow_instructor_signup: form.allow_instructor_signup,
    }).eq('id', 1);
    setSaving(false);
    if (error) return notify('Không lưu được', errorMessage(error));
    await refreshSettings();
    notify('Đã lưu', 'Cài đặt hệ thống đã được cập nhật.');
  };

  return (
    <Screen>
      <H2>Thông tin chung</H2>
      <Card>
        <Field label="Tên hệ thống" value={form.site_name} onChangeText={(v) => setForm({ ...form, site_name: v })} />
        <Field label="Email hỗ trợ" value={form.support_email ?? ''} onChangeText={(v) => setForm({ ...form, support_email: v })} autoCapitalize="none" keyboardType="email-address" />
        <Field label="Hotline hỗ trợ" value={form.support_phone ?? ''} onChangeText={(v) => setForm({ ...form, support_phone: v })} keyboardType="phone-pad" />
      </Card>

      <H2>Đăng ký</H2>
      <Card>
        <Toggle label="Cho phép đăng ký tài khoản giảng viên" value={form.allow_instructor_signup} onChange={(v) => setForm({ ...form, allow_instructor_signup: v })} />
        <Muted style={{ fontSize: 12 }}>Giảng viên mới vẫn cần được duyệt ở mục Người dùng trước khi tạo khoá học.</Muted>
      </Card>

      <H2>Bảo trì</H2>
      <Card>
        <Toggle label="Bật chế độ bảo trì (chỉ admin truy cập được)" value={form.maintenance_mode} onChange={(v) => setForm({ ...form, maintenance_mode: v })} />
        <Field label="Thông báo bảo trì" value={form.maintenance_message ?? ''} onChangeText={(v) => setForm({ ...form, maintenance_message: v })} multiline />
      </Card>

      <Notice tone="gray" icon="shield-checkmark-outline">
        Bảo mật (độ dài mật khẩu, giới hạn đăng nhập, thời gian phiên, OTP) và cấu hình gửi email (SMTP) được quản lý tại Supabase Dashboard → Authentication.
      </Notice>

      <Button title="Lưu cài đặt" onPress={save} loading={saving} />
    </Screen>
  );
}
