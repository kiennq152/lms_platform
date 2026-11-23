import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { StyleSheet, View, Text, FlatList, TextInput, RefreshControl } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { CourseCard } from '@/components/course-card';
import { WebLayout } from '@/components/ui/web-layout';
import { Footer } from '@/components/ui/footer';
import { Chips, EmptyState, ErrorState, Loading, BRAND } from '@/components/ui/kit';
import { supabase } from '@/lib/supabase';
import { COURSE_CARD_SELECT, fetchCategories } from '@/lib/api';
import { errorMessage } from '@/lib/notify';
import { formatVND, fullName, LEVEL_LABEL } from '@/lib/format';
import type { Category, Course } from '@/lib/types';

type Sort = 'popular' | 'rating' | 'newest' | 'price_asc' | 'price_desc';
type PriceFilter = 'all' | 'free' | 'paid';

const SORTS: { value: Sort; label: string }[] = [
  { value: 'popular', label: 'Phổ biến' },
  { value: 'rating', label: 'Đánh giá cao' },
  { value: 'newest', label: 'Mới nhất' },
  { value: 'price_asc', label: 'Giá tăng dần' },
  { value: 'price_desc', label: 'Giá giảm dần' },
];

function normalize(s: string) {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').toLowerCase();
}

export default function CoursesScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ category?: string }>();
  const [courses, setCourses] = useState<Course[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<number>(params.category ? Number(params.category) : 0);
  const [level, setLevel] = useState<string>('all');
  const [price, setPrice] = useState<PriceFilter>('all');
  const [minRating, setMinRating] = useState<number>(0);
  const [sort, setSort] = useState<Sort>('popular');

  const load = useCallback(async () => {
    const [{ data, error: e }, cats] = await Promise.all([
      supabase.from('courses').select(COURSE_CARD_SELECT).eq('status', 'published').limit(500),
      fetchCategories(),
    ]);
    setError(e ? errorMessage(e) : null);
    if (data) setCourses(data as unknown as Course[]);
    setCategories(cats);
  }, []);

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, [load]);

  const filtered = useMemo(() => {
    const q = normalize(search.trim());
    const list = courses.filter((c) => {
      if (q) {
        const hay = normalize(`${c.title} ${c.short_description ?? ''} ${fullName(c.instructor, '')} ${c.category?.name ?? ''}`);
        if (!hay.includes(q)) return false;
      }
      if (category && c.category_id !== category) return false;
      if (level !== 'all' && c.level !== level) return false;
      if (price === 'free' && Number(c.price) > 0) return false;
      if (price === 'paid' && Number(c.price) === 0) return false;
      if (minRating && Number(c.rating) < minRating) return false;
      return true;
    });
    const by: Record<Sort, (a: Course, b: Course) => number> = {
      popular: (a, b) => b.total_enrollments - a.total_enrollments,
      rating: (a, b) => Number(b.rating) - Number(a.rating),
      newest: (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      price_asc: (a, b) => Number(a.price) - Number(b.price),
      price_desc: (a, b) => Number(b.price) - Number(a.price),
    };
    return list.sort(by[sort]);
  }, [courses, search, category, level, price, minRating, sort]);

  const header = (
    <View style={styles.header}>
      <Text style={styles.title}>Danh Mục Khóa Học</Text>
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#999" style={{ marginRight: 8 }} />
        <TextInput
          style={styles.searchInput}
          placeholder="Tìm theo tên khoá học, giảng viên..."
          value={search}
          onChangeText={setSearch}
          placeholderTextColor="#999"
          accessibilityLabel="Tìm kiếm khoá học"
        />
        {search ? <Ionicons name="close-circle" size={18} color="#BBB" onPress={() => setSearch('')} /> : null}
      </View>
      <Chips
        options={[{ value: 0, label: 'Tất cả' }, ...categories.map((c) => ({ value: c.category_id, label: c.name }))]}
        value={category}
        onChange={setCategory}
      />
      <View style={{ height: 8 }} />
      <Chips
        options={[
          { value: 'all', label: 'Mọi trình độ' },
          ...Object.entries(LEVEL_LABEL).map(([value, label]) => ({ value, label })),
        ]}
        value={level}
        onChange={setLevel}
      />
      <View style={{ height: 8 }} />
      <Chips
        options={[
          { value: 'all', label: 'Mọi mức giá' },
          { value: 'free', label: 'Miễn phí' },
          { value: 'paid', label: 'Trả phí' },
        ] as { value: PriceFilter; label: string }[]}
        value={price}
        onChange={setPrice}
      />
      <View style={{ height: 8 }} />
      <Chips
        options={[{ value: 0, label: 'Mọi đánh giá' }, { value: 4, label: '★ 4.0+' }, { value: 4.5, label: '★ 4.5+' }]}
        value={minRating}
        onChange={setMinRating}
      />
      <View style={styles.sortRow}>
        <Text style={styles.count}>{filtered.length} khoá học</Text>
      </View>
      <Chips options={SORTS} value={sort} onChange={setSort} />
    </View>
  );

  return (
    <WebLayout>
      <FlatList
        data={loading ? [] : filtered}
        keyExtractor={(item) => String(item.course_id)}
        ListHeaderComponent={header}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={async () => { setRefreshing(true); await load(); setRefreshing(false); }} />}
        renderItem={({ item }) => (
          <View style={{ paddingHorizontal: 20 }}>
            <CourseCard
              title={item.title}
              instructor={fullName(item.instructor, 'VIAN Academy')}
              price={formatVND(item.price)}
              rating={Number(item.rating)}
              students={item.total_enrollments}
              meta={[item.category?.name, item.level ? LEVEL_LABEL[item.level] : null, item.total_lessons ? `${item.total_lessons} bài học` : null].filter(Boolean).join(' · ')}
              image={item.thumbnail_url}
              onPress={() => router.push({ pathname: '/(details)/course-detail', params: { id: String(item.course_id) } })}
            />
          </View>
        )}
        ListEmptyComponent={
          loading ? <Loading /> : error ? <ErrorState message={error} onRetry={load} /> : (
            <EmptyState icon="search-outline" title="Không tìm thấy khóa học nào" message="Hãy thử từ khoá khác hoặc bỏ bớt bộ lọc." />
          )
        }
        ListFooterComponent={
          <>
            <View style={{ height: 20 }} />
            <Footer />
            <View style={{ height: 90 }} />
          </>
        }
      />
    </WebLayout>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingTop: 48,
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    color: BRAND.text,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    color: '#333',
  },
  sortRow: {
    marginTop: 14,
    marginBottom: 8,
  },
  count: {
    color: BRAND.muted,
    fontWeight: '600',
  },
});
