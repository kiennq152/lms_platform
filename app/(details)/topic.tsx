import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '@/components/ui/button';
import { Avatar, Badge, BRAND, Card, EmptyState, Field, Loading, Muted, Notice, Row, Screen } from '@/components/ui/kit';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import { fullName, ROLE_LABEL, timeAgo } from '@/lib/format';
import { confirmAsync, errorMessage, notify } from '@/lib/notify';
import type { ForumReply, ForumTopic } from '@/lib/types';

const AUTHOR = 'author:users!forum_topics_author_id_fkey(first_name, last_name, avatar_url, role)';
const REPLY_AUTHOR = 'author:users!forum_replies_author_id_fkey(first_name, last_name, avatar_url, role)';

export default function TopicScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const topicId = Number(id);
  const router = useRouter();
  const { session, role } = useAuth();
  const [topic, setTopic] = useState<ForumTopic | null>(null);
  const [replies, setReplies] = useState<ForumReply[]>([]);
  const [loading, setLoading] = useState(true);
  const [reply, setReply] = useState('');
  const [posting, setPosting] = useState(false);

  const load = useCallback(async () => {
    const [t, r] = await Promise.all([
      supabase.from('forum_topics').select(`*, ${AUTHOR}, course:courses(title, instructor_id)`).eq('topic_id', topicId).maybeSingle(),
      supabase.from('forum_replies').select(`*, ${REPLY_AUTHOR}`).eq('topic_id', topicId).order('is_solution', { ascending: false }).order('created_at'),
    ]);
    setTopic((t.data as unknown as ForumTopic) ?? null);
    setReplies((r.data as unknown as ForumReply[]) ?? []);
    setLoading(false);
  }, [topicId]);

  useEffect(() => {
    load();
    supabase.rpc('increment_topic_view', { p_topic_id: topicId }).then(() => {});
  }, [load, topicId]);

  if (loading) return <Loading />;
  if (!topic) return <EmptyState icon="alert-circle-outline" title="Bài viết không tồn tại hoặc đã bị xoá" />;

  const uid = session?.user?.id;
  const isAdmin = role === 'admin';
  const isAuthor = uid === topic.author_id;
  const isCourseInstructor = !!topic.course && topic.course.instructor_id === uid;
  const canMarkSolution = topic.type === 'question' && (isAuthor || isAdmin || isCourseInstructor);

  const send = async () => {
    if (!session) return router.push('/(auth)/login');
    if (!reply.trim()) return;
    setPosting(true);
    const { error } = await supabase.from('forum_replies').insert({ topic_id: topicId, author_id: session.user.id, content: reply.trim() });
    setPosting(false);
    if (error) return notify('Không gửi được trả lời', errorMessage(error));
    setReply('');
    load();
  };

  const markSolution = async (r: ForumReply) => {
    const { error } = await supabase.rpc('mark_solution', { p_reply_id: r.reply_id });
    if (error) return notify('Lỗi', errorMessage(error));
    load();
  };

  const removeReply = async (r: ForumReply) => {
    if (!(await confirmAsync('Xoá câu trả lời?', '', 'Xoá', true))) return;
    const { error } = await supabase.from('forum_replies').delete().eq('reply_id', r.reply_id);
    if (error) return notify('Lỗi', errorMessage(error));
    load();
  };

  const removeTopic = async () => {
    if (!(await confirmAsync('Xoá bài viết?', 'Toàn bộ câu trả lời cũng sẽ bị xoá.', 'Xoá', true))) return;
    const { error } = await supabase.from('forum_topics').delete().eq('topic_id', topicId);
    if (error) return notify('Lỗi', errorMessage(error));
    router.back();
  };

  const moderate = async (patch: Partial<ForumTopic>) => {
    const { error } = await supabase.from('forum_topics').update(patch).eq('topic_id', topicId);
    if (error) return notify('Lỗi', errorMessage(error));
    load();
  };

  return (
    <Screen>
      <Row wrap gap={6} style={{ marginBottom: 8 }}>
        {topic.is_pinned && <Badge label="📌 Ghim" tone="orange" />}
        <Badge label={topic.type === 'question' ? 'Hỏi đáp' : 'Thảo luận'} tone={topic.type === 'question' ? 'purple' : 'blue'} />
        {topic.course?.title ? <Badge label={topic.course.title} tone="gray" /> : null}
        {topic.is_locked && <Badge label="Đã khoá" tone="red" />}
      </Row>
      <Text style={{ fontSize: 22, fontWeight: '800', color: BRAND.text, marginBottom: 10 }}>{topic.title}</Text>
      <Row gap={10} style={{ marginBottom: 12 }}>
        <Avatar uri={topic.author?.avatar_url} user={topic.author} size={36} />
        <View style={{ flex: 1 }}>
          <Text style={{ fontWeight: '700', color: BRAND.text }}>{fullName(topic.author)}</Text>
          <Muted style={{ fontSize: 12 }}>{timeAgo(topic.created_at)} · {topic.view_count} lượt xem</Muted>
        </View>
      </Row>
      <Text style={{ fontSize: 15, lineHeight: 23, color: '#333' }}>{topic.content}</Text>

      {(isAuthor || isAdmin) && (
        <Row wrap style={{ marginTop: 14 }}>
          {isAdmin && <Button size="sm" variant="ghost" title={topic.is_pinned ? 'Bỏ ghim' : 'Ghim'} icon="pin-outline" onPress={() => moderate({ is_pinned: !topic.is_pinned })} />}
          {isAdmin && <Button size="sm" variant="ghost" title={topic.is_locked ? 'Mở khoá' : 'Khoá thảo luận'} icon="lock-closed-outline" onPress={() => moderate({ is_locked: !topic.is_locked })} />}
          <Button size="sm" variant="ghost" title="Xoá bài" icon="trash-outline" textStyle={{ color: BRAND.red }} onPress={removeTopic} />
        </Row>
      )}

      <Text style={{ fontSize: 17, fontWeight: '700', color: BRAND.text, marginTop: 24, marginBottom: 8 }}>{replies.length} câu trả lời</Text>
      {replies.map((r) => (
        <Card key={r.reply_id} style={r.is_solution ? { borderColor: BRAND.green, backgroundColor: '#F3FAF3' } : undefined}>
          <Row gap={10} style={{ marginBottom: 6 }}>
            <Avatar uri={r.author?.avatar_url} user={r.author} size={30} />
            <View style={{ flex: 1 }}>
              <Row gap={6}>
                <Text style={{ fontWeight: '700', color: BRAND.text }}>{fullName(r.author)}</Text>
                {r.author?.role && r.author.role !== 'student' ? <Badge label={ROLE_LABEL[r.author.role]} tone="blue" /> : null}
              </Row>
              <Muted style={{ fontSize: 12 }}>{timeAgo(r.created_at)}</Muted>
            </View>
            {r.is_solution && <Badge label="✓ Câu trả lời hay nhất" tone="green" />}
          </Row>
          <Text style={{ color: '#333', lineHeight: 21 }}>{r.content}</Text>
          <Row style={{ marginTop: 8 }}>
            {canMarkSolution && (
              <TouchableOpacity onPress={() => markSolution(r)}>
                <Text style={{ color: BRAND.green, fontWeight: '600', fontSize: 13 }}>{r.is_solution ? 'Bỏ đánh dấu' : 'Đánh dấu là lời giải'}</Text>
              </TouchableOpacity>
            )}
            {(r.author_id === uid || isAdmin) && (
              <TouchableOpacity onPress={() => removeReply(r)} style={{ marginLeft: 12 }}>
                <Ionicons name="trash-outline" size={16} color={BRAND.red} />
              </TouchableOpacity>
            )}
          </Row>
        </Card>
      ))}

      {topic.is_locked ? (
        <Notice tone="gray" icon="lock-closed-outline">Bài viết đã bị khoá, không thể trả lời thêm.</Notice>
      ) : session ? (
        <Card style={{ backgroundColor: '#FAFBFF' }}>
          <Field placeholder="Viết câu trả lời của bạn..." value={reply} onChangeText={setReply} multiline />
          <Button title="Gửi trả lời" size="sm" onPress={send} loading={posting} style={{ alignSelf: 'flex-start' }} />
        </Card>
      ) : (
        <Button title="Đăng nhập để trả lời" variant="outline" onPress={() => router.push('/(auth)/login')} />
      )}
    </Screen>
  );
}
