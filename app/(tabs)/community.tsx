import React, { useCallback, useMemo, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '@/components/ui/button';
import { Avatar, Badge, BRAND, Card, Chips, EmptyState, Field, H1, Loading, Muted, Row, Screen } from '@/components/ui/kit';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import { fullName, timeAgo } from '@/lib/format';
import { errorMessage, notify } from '@/lib/notify';
import type { ForumTopic } from '@/lib/types';

type Filter = 'all' | 'discussion' | 'question' | 'mine';

export default function CommunityScreen() {
  const router = useRouter();
  const { session } = useAuth();
  const [topics, setTopics] = useState<ForumTopic[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<Filter>('all');
  const [search, setSearch] = useState('');

  const [composing, setComposing] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [type, setType] = useState<'discussion' | 'question'>('discussion');
  const [posting, setPosting] = useState(false);

  const load = useCallback(async () => {
    const { data } = await supabase.from('forum_topics')
      .select('*, author:users!forum_topics_author_id_fkey(first_name, last_name, avatar_url, role), course:courses(title)')
      .order('is_pinned', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(200);
    setTopics((data as unknown as ForumTopic[]) ?? []);
    setLoading(false);
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return topics.filter((t) => {
      if (filter === 'mine' && t.author_id !== session?.user?.id) return false;
      if ((filter === 'discussion' || filter === 'question') && t.type !== filter) return false;
      if (q && !`${t.title} ${t.content}`.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [topics, filter, search, session?.user?.id]);

  const post = async () => {
    if (!session) return router.push('/(auth)/login');
    if (!title.trim() || !content.trim()) return notify('Thiếu nội dung', 'Vui lòng nhập tiêu đề và nội dung.');
    setPosting(true);
    const { error } = await supabase.from('forum_topics').insert({ author_id: session.user.id, title: title.trim(), content: content.trim(), type });
    setPosting(false);
    if (error) return notify('Không đăng được bài', errorMessage(error));
    setTitle('');
    setContent('');
    setComposing(false);
    load();
  };

  return (
    <Screen tabBarInset refreshing={refreshing} onRefresh={async () => { setRefreshing(true); await load(); setRefreshing(false); }}>
      <View style={{ paddingTop: 28 }}>
        <H1>Cộng đồng VIAN</H1>
        <Muted style={{ marginBottom: 16 }}>Thảo luận, hỏi đáp và chia sẻ kinh nghiệm học tập.</Muted>
      </View>

      <View style={styles.search}>
        <Ionicons name="search" size={18} color="#999" />
        <TextInput style={styles.searchInput} placeholder="Tìm kiếm bài viết..." value={search} onChangeText={setSearch} placeholderTextColor="#999" />
      </View>
      <Chips<Filter>
        options={[
          { value: 'all', label: 'Tất cả' },
          { value: 'discussion', label: 'Thảo luận' },
          { value: 'question', label: 'Hỏi đáp' },
          ...(session ? [{ value: 'mine' as Filter, label: 'Bài của tôi' }] : []),
        ]}
        value={filter}
        onChange={setFilter}
      />

      <View style={{ marginVertical: 14 }}>
        {composing ? (
          <Card style={{ backgroundColor: '#FAFBFF' }}>
            <Chips
              options={[{ value: 'discussion', label: '💬 Thảo luận' }, { value: 'question', label: '❓ Câu hỏi' }] as { value: 'discussion' | 'question'; label: string }[]}
              value={type}
              onChange={setType}
            />
            <View style={{ height: 10 }} />
            <Field placeholder="Tiêu đề" value={title} onChangeText={setTitle} />
            <Field placeholder="Nội dung bài viết..." value={content} onChangeText={setContent} multiline />
            <Row>
              <Button title="Đăng bài" size="sm" onPress={post} loading={posting} />
              <Button title="Huỷ" size="sm" variant="ghost" onPress={() => setComposing(false)} />
            </Row>
          </Card>
        ) : (
          <Button title={session ? 'Tạo bài viết mới' : 'Đăng nhập để tham gia thảo luận'} icon="create-outline" variant="secondary"
            onPress={() => (session ? setComposing(true) : router.push('/(auth)/login'))} />
        )}
      </View>

      {loading ? <Loading /> : visible.length === 0 ? (
        <EmptyState icon="chatbubbles-outline" title="Chưa có bài viết" message="Hãy là người đầu tiên bắt đầu cuộc thảo luận!" />
      ) : visible.map((t) => (
        <TouchableOpacity key={t.topic_id} style={styles.topic} onPress={() => router.push({ pathname: '/(details)/topic', params: { id: String(t.topic_id) } })}>
          <Row gap={10} style={{ alignItems: 'flex-start' }}>
            <Avatar uri={t.author?.avatar_url} user={t.author} size={38} />
            <View style={{ flex: 1, gap: 4 }}>
              <Row wrap gap={6}>
                {t.is_pinned && <Badge label="📌 Ghim" tone="orange" />}
                <Badge label={t.type === 'question' ? 'Hỏi đáp' : 'Thảo luận'} tone={t.type === 'question' ? 'purple' : 'blue'} />
                {t.course?.title ? <Badge label={t.course.title} tone="gray" /> : null}
                {t.is_locked && <Badge label="Đã khoá" tone="red" />}
              </Row>
              <Text style={styles.topicTitle} numberOfLines={2}>{t.title}</Text>
              <Muted numberOfLines={2}>{t.content}</Muted>
              <Row gap={14}>
                <Muted style={{ fontSize: 12 }}>{fullName(t.author)} · {timeAgo(t.created_at)}</Muted>
                <Row gap={4}><Ionicons name="chatbubble-outline" size={13} color="#888" /><Muted style={{ fontSize: 12 }}>{t.reply_count}</Muted></Row>
                <Row gap={4}><Ionicons name="eye-outline" size={13} color="#888" /><Muted style={{ fontSize: 12 }}>{t.view_count}</Muted></Row>
              </Row>
            </View>
          </Row>
        </TouchableOpacity>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  search: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#F5F5F5', borderRadius: 12, paddingHorizontal: 12, marginBottom: 12 },
  searchInput: { flex: 1, paddingVertical: 11, fontSize: 15, color: '#333' },
  topic: { paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  topicTitle: { fontSize: 16, fontWeight: '700', color: BRAND.text },
});
