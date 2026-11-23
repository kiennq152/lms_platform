import React, { useCallback, useState } from 'react';
import { StyleSheet, ScrollView, View, Text, Image, TouchableOpacity } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { CourseCard } from '@/components/course-card';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { WebLayout } from '@/components/ui/web-layout';
import { Footer } from '@/components/ui/footer';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import { COURSE_CARD_SELECT } from '@/lib/api';
import { formatVND, fullName } from '@/lib/format';
import { errorMessage } from '@/lib/notify';
import { ErrorState, ProgressBar } from '@/components/ui/kit';
import { YoutubeVideo } from '@/components/ui/youtube-video';
import type { Course, Enrollment } from '@/lib/types';

export default function HomeScreen() {
  const colorScheme = useColorScheme();
  const themeColors = Colors[colorScheme ?? 'light'];
  const router = useRouter();
  const { session, profile } = useAuth();
  const [featured, setFeatured] = useState<Course[]>([]);
  const [newest, setNewest] = useState<Course[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [continueList, setContinueList] = useState<Enrollment[]>([]);

  useFocusEffect(
    useCallback(() => {
      supabase.from('courses').select(COURSE_CARD_SELECT).eq('status', 'published')
        .order('total_enrollments', { ascending: false }).order('rating', { ascending: false }).limit(4)
        .then(({ data, error: e }) => {
          setError(e ? errorMessage(e) : null);
          if (data) setFeatured(data as unknown as Course[]);
        });
      supabase.from('courses').select(COURSE_CARD_SELECT).eq('status', 'published')
        .order('published_at', { ascending: false, nullsFirst: false }).limit(4)
        .then(({ data }) => setNewest((data as unknown as Course[]) ?? []));
      if (session?.user) {
        supabase.from('enrollments')
          .select('*, course:courses(course_id, title, thumbnail_url)')
          .eq('student_id', session.user.id).eq('status', 'active')
          .order('last_accessed_at', { ascending: false, nullsFirst: false }).limit(3)
          .then(({ data }) => setContinueList((data as unknown as Enrollment[]) ?? []));
      } else {
        setContinueList([]);
      }
    }, [session?.user, reloadKey]) // eslint-disable-line react-hooks/exhaustive-deps
  );

  const renderCourse = (course: Course) => (
    <CourseCard
      key={course.course_id}
      title={course.title}
      instructor={fullName(course.instructor, 'VIAN Academy')}
      price={formatVND(course.price)}
      rating={Number(course.rating)}
      students={course.total_enrollments}
      image={course.thumbnail_url}
      onPress={() => router.push({ pathname: '/(details)/course-detail', params: { id: String(course.course_id) } })}
    />
  );

  return (
    <WebLayout>
      <ScrollView style={[styles.container, { backgroundColor: themeColors.background }]}>
      {/* Hero Section */}
      <View style={[styles.hero, { backgroundColor: themeColors.secondary }]}>
        <View style={styles.heroContent}>
          <Text style={styles.heroTitle}>
            Chinh Phục IT Hàn Quốc Cùng <Text style={styles.heroHighlight}>VIAN Academy</Text>
          </Text>
          <Text style={styles.heroSubtitle}>
            Nền tảng đào tạo IT hàng đầu từ VIAN Solution. Trang bị kỹ năng IT chuyên sâu.
          </Text>
          <TouchableOpacity
            style={[styles.heroButton, { backgroundColor: themeColors.primary }]}
            onPress={() => router.push('/courses')}
          >
            <Text style={styles.heroButtonText}>Khám Phá Khóa Học</Text>
          </TouchableOpacity>
        </View>
      </View>

      {continueList.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: themeColors.text }]}>
              Tiếp tục học{profile?.first_name ? `, ${profile.first_name}` : ''}
            </Text>
            <TouchableOpacity onPress={() => router.push('/student/dashboard')}>
              <Text style={[styles.seeAll, { color: themeColors.primary }]}>Học tập của tôi</Text>
            </TouchableOpacity>
          </View>
          {continueList.map((e) => (
            <TouchableOpacity
              key={e.enrollment_id}
              style={styles.continueCard}
              onPress={() => router.push({ pathname: '/(details)/course-player', params: { id: String(e.course_id) } })}
            >
              <Image source={{ uri: e.course?.thumbnail_url ?? undefined }} style={styles.continueThumb} />
              <View style={{ flex: 1, gap: 6 }}>
                <Text style={{ fontWeight: '700', color: '#1A2233' }} numberOfLines={2}>{e.course?.title}</Text>
                <ProgressBar value={Number(e.progress_percentage)} />
                <Text style={{ color: '#666', fontSize: 12 }}>Hoàn thành {Math.round(Number(e.progress_percentage))}%</Text>
              </View>
              <Ionicons name="play-circle" size={32} color={themeColors.primary} />
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Latest Lecture Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: themeColors.text }]}>Bài Giảng Mới Nhất</Text>
        </View>

        <View style={[styles.latestLectureContainer, { backgroundColor: colorScheme === 'dark' ? '#1A1A1A' : '#F9F9F9' }]}>
          <View style={styles.videoWrapper}>
            <YoutubeVideo videoId="jBzwzrDvZ18" />
          </View>
          
          <View style={styles.instructorInfo}>
            <View style={styles.instructorHeader}>
              <Image 
                source={{ uri: 'https://i.pravatar.cc/150?u=a042581f4e29026704d' }} 
                style={styles.instructorAvatar} 
              />
              <View>
                <Text style={[styles.instructorName, { color: themeColors.text }]}>Trần Văn Lập Trình</Text>
                <View style={styles.ratingContainer}>
                  <Ionicons name="star" size={16} color="#FFD700" />
                  <Text style={[styles.ratingText, { color: themeColors.text }]}>4.9 (120 đánh giá)</Text>
                </View>
              </View>
            </View>
            <Text style={[styles.instructorSummary, { color: colorScheme === 'dark' ? '#AAAAAA' : '#666666' }]}>
              Giảng viên có hơn 10 năm kinh nghiệm trong lĩnh vực phát triển phần mềm và đào tạo lập trình viên chuyên nghiệp. Từng dẫn dắt nhiều dự án thực tế lớn.
            </Text>
          </View>
        </View>
      </View>

      {/* Featured Courses Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: themeColors.text }]}>Khóa Học Nổi Bật</Text>
          <TouchableOpacity onPress={() => router.push('/courses')}>
            <Text style={[styles.seeAll, { color: themeColors.primary }]}>Xem tất cả</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.courseList}>
          {error ? <ErrorState message={error} onRetry={() => setReloadKey((k) => k + 1)} /> : featured.length ? featured.map(renderCourse) : (
            <Text style={{ color: '#888' }}>Chưa có khoá học nào được xuất bản.</Text>
          )}
        </View>
      </View>

      {newest.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: themeColors.text }]}>Khóa Học Mới</Text>
          </View>
          <View style={styles.courseList}>{newest.map(renderCourse)}</View>
        </View>
      )}

      {/* Why Choose Us */}
      <View style={[styles.section, styles.whySection]}>
        <Text style={[styles.sectionTitle, { color: themeColors.text, textAlign: 'center' }]}>Tại Sao Chọn VIAN Academy?</Text>
        <View style={styles.featureGrid}>
          <View style={styles.featureItem}>
            <View style={[styles.featureIcon, { backgroundColor: themeColors.secondary }]}>
              <Text style={styles.featureIconText}>📚</Text>
            </View>
            <Text style={[styles.featureTitle, { color: themeColors.text }]}>Lộ Trình Sát Thực Tế</Text>
          </View>
          <View style={styles.featureItem}>
            <View style={[styles.featureIcon, { backgroundColor: themeColors.primary }]}>
              <Text style={styles.featureIconText}>💻</Text>
            </View>
            <Text style={[styles.featureTitle, { color: themeColors.text }]}>Virtual Classroom</Text>
          </View>
        </View>
      </View>

      <View style={{ height: 40 }} />
      <Footer />
      <View style={{ height: 90 }} />
    </ScrollView>
    </WebLayout>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  hero: {
    padding: 24,
    paddingTop: 60,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  heroContent: {
    alignItems: 'center',
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: '#FFFFFF',
    textAlign: 'center',
    lineHeight: 36,
    marginBottom: 12,
  },
  heroHighlight: {
    color: '#FFD700',
  },
  heroSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  heroButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  heroButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  section: {
    padding: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  seeAll: {
    fontSize: 14,
    fontWeight: '600',
  },
  courseList: {
    width: '100%',
  },
  continueCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#EEE',
    marginBottom: 10,
    backgroundColor: '#FFF',
  },
  continueThumb: {
    width: 72,
    height: 48,
    borderRadius: 8,
    backgroundColor: '#EEE',
  },
  latestLectureContainer: {
    borderRadius: 16,
    overflow: 'hidden',
    marginTop: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  videoWrapper: {
    width: '100%',
    backgroundColor: '#000',
  },
  instructorInfo: {
    padding: 16,
  },
  instructorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  instructorAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
  },
  instructorName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    fontSize: 14,
    marginLeft: 4,
  },
  instructorSummary: {
    fontSize: 14,
    lineHeight: 20,
  },
  whySection: {
    backgroundColor: 'rgba(27, 71, 164, 0.05)',
  },
  featureGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 20,
  },
  featureItem: {
    alignItems: 'center',
    width: '45%',
  },
  featureIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  featureIconText: {
    fontSize: 30,
  },
  featureTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});
