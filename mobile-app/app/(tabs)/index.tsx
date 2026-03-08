import React from 'react';
import { StyleSheet, ScrollView, View, Text, Image, TouchableOpacity, FlatList } from 'react-native';
import { useRouter } from 'expo-router';
import { CourseCard } from '@/components/course-card';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

const FEATURED_COURSES = [
  {
    id: '1',
    title: 'Lập trình Web Full-stack (Java/Spring)',
    instructor: 'Park Ji-eun',
    price: '$99.99',
    rating: 4.8,
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA-3uw2Kla8uuKV6zMiW1uIN3mACpXzj-frdESLKaer8Nb_eZOjxHmUYU_QN4wph7VvQm-Kd-eeWOJ-xYmqPnGclwpzk46uZirIvBIXFvGu8QRMnC12wa_qNv3B9_l3UdAZyNDA7O_lcRItz2vyiUjCqacs2p0bcoLlG1AkcFTklF32o8dWFeyYNVt8OXXOKI-cydyseL3Mxu2NLbdSbjqKuchzyY_NBpXC5BT7BFZKJ8AdgjbAQ-qlysTU1oP28gbLuuhv8Dfa2HQ',
  },
  {
    id: '2',
    title: 'Khoa học Dữ liệu & AI ứng dụng',
    instructor: 'Dr. Ahn Sang-chul',
    price: '$119.99',
    rating: 4.9,
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCZaPOfqYfFNyCT_Et0lHf4pFhucE5BK8Z_cwXWFHHBxpGUy6uVYln1zVoA8P7VlwDduB4vEpRNrS_AoclwZnoIkTPDfbMEOvTtyp7duJx5K4T3q7GEd4Fh9kQ9D2cE3PhbaBvXiDKr1hk7IQ5wFcHlozEtSmiPUV-VDq-wybPdLWR9NF7wFD0ZAlBOH4FeYbGp07CecE9Un171aqRfbMfCpVXTz71KJWqPPxrfsQAaiTKMvSCfQcehmTcwPFI644-y0uvlFl8XRcg',
  },
  {
    id: '3',
    title: 'An ninh mạng cho Doanh nghiệp',
    instructor: 'Kim Min-jun',
    price: '$89.99',
    rating: 4.7,
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBMwT9RsakcoOhUTPWMbfnqlQuPFnTJMXcd3xyFBEgOJWncPa65T8E_xd8cdiFYHg0kX2KybSx5nkjRMr6IRngQ9CgritV7bXpiWCTq4QW3iDS9jFHPolujdFu5urAtDh1VLNFQiSJe8EVYcsLtKlQShElG6Y-t7q0Uuqh0m5gyBCWcGL4wKayAZl0GRGfSBE9nPUFO25zjobAXiV2eMhvV3X4YePSW2uNXbQ0E90C5qesWt2Y7_tP7_26MELGvHqBIwA3reECS5k4',
  },
];

export default function HomeScreen() {
  const colorScheme = useColorScheme();
  const themeColors = Colors[colorScheme ?? 'light'];
  const router = useRouter();

  return (
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

      {/* Featured Courses Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: themeColors.text }]}>Khóa Học Nổi Bật</Text>
          <TouchableOpacity onPress={() => router.push('/courses')}>
            <Text style={[styles.seeAll, { color: themeColors.primary }]}>Xem tất cả</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.courseList}>
          {FEATURED_COURSES.map((course) => (
            <CourseCard
              key={course.id}
              title={course.id === '1' ? 'Web Full-stack (Java/Spring)' : course.title}
              instructor={course.instructor}
              price={course.price}
              rating={course.rating}
              image={course.image}
              onPress={() => { }} // Navigate to detail
            />
          ))}
        </View>
      </View>

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
    </ScrollView>
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
