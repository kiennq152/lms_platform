import React, { useCallback, useMemo, useState } from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '@/components/ui/button';
import { Avatar, Badge, BRAND, Card, Chips, EmptyState, Loading, Muted, Notice, Row, Screen, statusTone } from '@/components/ui/kit';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import { formatDate, fullName, ROLE_LABEL, USER_STATUS_LABEL } from '@/lib/format';
import { confirmAsync, errorMessage, notify } from '@/lib/notify';
import { exportCsv } from '@/lib/export';
import type { Profile, Role, UserStatus } from '@/lib/types';

type RoleFilter = 'all' | Role | 'pending';
type StatusFilter = 'all' | UserStatus;

/** User administration (FR-010..014). */
export default function AdminUsers() {
  const { session } = useAuth();
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [role, setRole] = useState<RoleFilter>('all');
  const [status, setStatus] = useState<StatusFilter>('all');
  const [expanded, setExpanded] = useState<string | null>(null);

  const load = useCallback(async () => {
    const { data, error } = await supabase.from('users').select('*').order('created_at', { ascending: false }).limit(1000);
    if (error) notify('Lỗi', errorMessage(error));
    setUsers((data as Profile[]) ?? []);
    setLoading(false);
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return users.filter((u) => {
      if (role === 'pending') { if (!(u.role === 'instructor' && !u.admin_approved)) return false; }
      else if (role !== 'all' && (u.role ?? 'student') !== role) return false;
      if (status !== 'all' && u.status !== status) return false;
      if (q && !`${fullName(u, '')} ${u.email} ${u.phone ?? ''}`.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [users, search, role, status]);

  const update = async (u: Profile, patch: Partial<Profile>, confirmText?: string) => {
    if (confirmText && !(await confirmAsync(confirmText))) return;
    const { error } = await supabase.from('users').update(patch).eq('id', u.id);
    if (error) return notify('Không cập nhật được', errorMessage(error));
    setUsers((list) => list.map((x) => (x.id === u.id ? { ...x, ...patch } : x)));
  };

  const doExport = () => exportCsv(
    `vian-users-${new Date().toISOString().slice(0, 10)}.csv`,
    ['ID', 'Họ tên', 'Email', 'Điện thoại', 'Vai trò', 'Trạng thái', 'Đã duyệt', 'Ngày tạo', 'Đăng nhập cuối'],
    visible.map((u) => [u.id, fullName(u, ''), u.email, u.phone, ROLE_LABEL[u.role ?? 'student'], USER_STATUS_LABEL[u.status], u.admin_approved ? 'Có' : 'Không', u.created_at, u.last_login]),
  );

  if (loading) return <Loading />;
  const pendingCount = users.filter((u) => u.role === 'instructor' && !u.admin_approved).length;

  return (
    <Screen wide>
      <Row style={{ justifyContent: 'space-between', marginBottom: 12 }} wrap>
        <Muted>{visible.length} / {users.length} người dùng</Muted>
        <Button title="Xuất CSV" size="sm" variant="outline" icon="download-outline" onPress={doExport} />
      </Row>
      <View style={styles.search}>
        <Ionicons name="search" size={18} color="#999" />
        <TextInput style={{ flex: 1, paddingVertical: 10 }} placeholder="Tìm theo tên, email, số điện thoại" value={search} onChangeText={setSearch} />
      </View>
      <Chips<RoleFilter>
        options={[
          { value: 'all', label: 'Mọi vai trò' },
          { value: 'pending', label: `Chờ duyệt GV (${pendingCount})` },
          { value: 'student', label: 'Học viên' },
          { value: 'instructor', label: 'Giảng viên' },
          { value: 'admin', label: 'Admin' },
        ]}
        value={role}
        onChange={setRole}
      />
      <View style={{ height: 8 }} />
      <Chips<StatusFilter>
        options={[{ value: 'all', label: 'Mọi trạng thái' }, { value: 'active', label: 'Hoạt động' }, { value: 'suspended', label: 'Bị khoá' }, { value: 'inactive', label: 'Không hoạt động' }]}
        value={status}
        onChange={setStatus}
        style={{ marginBottom: 12 }}
      />
      <Notice tone="gray" icon="information-circle-outline">
        Tài khoản được tạo qua trang Đăng ký. Xoá vĩnh viễn tài khoản thực hiện trong Supabase Dashboard → Authentication; ở đây dùng “Khoá tài khoản” để chặn truy cập.
      </Notice>

      {visible.length === 0 ? <EmptyState icon="people-outline" title="Không có người dùng phù hợp" /> : visible.map((u) => {
        const isSelf = u.id === session?.user?.id;
        const r = (u.role ?? 'student') as Role;
        const open = expanded === u.id;
        return (
          <Card key={u.id} style={{ paddingVertical: 12 }}>
            <Row gap={12} wrap>
              <Avatar uri={u.avatar_url} user={u} size={42} />
              <View style={{ flex: 1, minWidth: 200 }}>
                <Text style={{ fontWeight: '700', color: BRAND.text }}>{fullName(u)} {isSelf ? '(bạn)' : ''}</Text>
                <Muted style={{ fontSize: 12 }}>{u.email}{u.phone ? ` · ${u.phone}` : ''} · tham gia {formatDate(u.created_at)}</Muted>
              </View>
              <Row gap={6} wrap>
                <Badge label={ROLE_LABEL[r]} tone={r === 'admin' ? 'red' : r === 'instructor' ? 'purple' : 'blue'} />
                {r === 'instructor' && !u.admin_approved && <Badge label="Chờ duyệt" tone="orange" />}
                <Badge label={USER_STATUS_LABEL[u.status]} tone={statusTone(u.status)} />
              </Row>
              <Button size="sm" variant="ghost" title={open ? 'Đóng' : 'Thao tác'} onPress={() => setExpanded(open ? null : u.id)} />
            </Row>

            {open && (
              <View style={styles.actions}>
                {r === 'instructor' && (u.degree || u.experience_years) ? (
                  <Muted style={{ marginBottom: 8 }}>Hồ sơ: {u.degree ?? '—'} · {u.experience_years ?? 0} năm kinh nghiệm{u.bio ? ` · ${u.bio}` : ''}</Muted>
                ) : null}
                <Row wrap>
                  {r === 'instructor' && !u.admin_approved && (
                    <Button size="sm" variant="success" icon="checkmark" title="Duyệt giảng viên" onPress={() => update(u, { admin_approved: true })} />
                  )}
                  {r === 'instructor' && u.admin_approved && (
                    <Button size="sm" variant="outline" title="Thu hồi duyệt" onPress={() => update(u, { admin_approved: false }, 'Thu hồi quyền tạo khoá học của giảng viên này?')} />
                  )}
                  {!isSelf && (u.status === 'suspended' ? (
                    <Button size="sm" variant="success" icon="lock-open-outline" title="Mở khoá tài khoản" onPress={() => update(u, { status: 'active' })} />
                  ) : (
                    <Button size="sm" variant="danger" icon="lock-closed-outline" title="Khoá tài khoản" onPress={() => update(u, { status: 'suspended' }, `Khoá tài khoản ${u.email}? Người dùng sẽ bị đăng xuất và không thể đăng nhập.`)} />
                  ))}
                </Row>
                {!isSelf && (
                  <>
                    <Muted style={{ marginTop: 10, marginBottom: 6, fontSize: 12 }}>Đổi vai trò</Muted>
                    <Chips<Role>
                      options={[{ value: 'student', label: 'Học viên' }, { value: 'instructor', label: 'Giảng viên' }, { value: 'admin', label: 'Admin' }]}
                      value={r}
                      onChange={(next) => next !== r && update(u, { role: next, ...(next === 'instructor' ? { admin_approved: true } : {}) }, `Đổi vai trò của ${u.email} thành "${ROLE_LABEL[next]}"?`)}
                    />
                  </>
                )}
              </View>
            )}
          </Card>
        );
      })}
    </Screen>
  );
}

const styles = StyleSheet.create({
  search: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#F5F5F5', borderRadius: 10, paddingHorizontal: 12, marginBottom: 12 },
  actions: { marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#F0F0F0' },
});
