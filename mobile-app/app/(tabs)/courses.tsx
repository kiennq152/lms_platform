import React, { useState, useMemo } from 'react';
import { StyleSheet, View, Text, FlatList, TextInput, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { CourseCard } from '@/components/course-card';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Ionicons } from '@expo/vector-icons';

const ALL_COURSES = [
  {
    id: '1',
    title: 'Advanced Python for Data Science',
    instructor: 'Dr. Angela Yu',
    image: 'https://images.unsplash.com/photo-1517430816045-df4b7de11d1d?auto=format&fit=crop&w=900&q=80',
    price: '$129.99',
    rating: 4.8,
    category: 'Lập Trình',
    level: 'Nâng Cao',
  },
  {
    id: '2',
    title: 'Web Development Bootcamp 2024',
    instructor: 'Colt Steele',
    image: 'https://images.unsplash.com/photo-1488590528505-98d2b5aba04b?auto=format&fit=crop&w=900&q=80',
    price: '$99.99',
    rating: 4.9,
    category: 'Lập Trình',
    level: 'Cơ Bản',
  },
  {
    id: '3',
    title: 'UI/UX Design Masterclass',
    instructor: 'Sarah Johnson',
    image: 'https://images.unsplash.com/photo-1587614382346-4ec892f9aca3?auto=format&fit=crop&w=900&q=80',
    price: '$79.99',
    rating: 4.6,
    category: 'Thiết Kế',
    level: 'Trung Cấp',
  },
  {
    id: '4',
    title: 'Growth Marketing 360°',
    instructor: 'Neil Patel',
    image: 'https://images.unsplash.com/photo-1501504905252-473c47e087f8?auto=format&fit=crop&w=900&q=80',
    price: '$69.99',
    rating: 4.5,
    category: 'Marketing',
    level: 'Cơ Bản',
  },
  {
    id: '5',
    title: 'Business Strategy & Management',
    instructor: 'Michael Porter',
    image: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=900&q=80',
    price: '$89.99',
    rating: 4.7,
    category: 'Kinh Doanh',
    level: 'Trung Cấp',
  },
  {
    id: '6',
    title: 'Data Analytics with SQL & Tableau',
    instructor: 'Emily Chen',
    image: 'https://images.unsplash.com/photo-1545239351-1141bd82e8a6?auto=format&fit=crop&w=900&q=80',
    price: '$119.00',
    rating: 4.8,
    category: 'Dữ Liệu',
    level: 'Nâng Cao',
  }
];

const CATEGORIES = ['Tất cả', 'Lập Trình', 'Thiết Kế', 'Marketing', 'Kinh Doanh', 'Dữ Liệu'];

export default function CoursesScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Tất cả');
  const colorScheme = useColorScheme();
  const themeColors = Colors[colorScheme ?? 'light'];
  const router = useRouter();

  const filteredCourses = useMemo(() => {
    return ALL_COURSES.filter(course => {
      const matchesSearch = course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        course.instructor.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === 'Tất cả' || course.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [searchQuery, selectedCategory]);

  return (
    <View style={[styles.container, { backgroundColor: themeColors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: themeColors.text }]}>Danh Mục Khóa Học</Text>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#999" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Tìm kiếm khóa học..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#999"
          />
        </View>

        {/* Category Filter */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.categoryScroll}
          contentContainerStyle={styles.categoryContent}
        >
          {CATEGORIES.map(category => (
            <TouchableOpacity
              key={category}
              style={[
                styles.categoryButton,
                selectedCategory === category && { backgroundColor: themeColors.primary }
              ]}
              onPress={() => setSelectedCategory(category)}
            >
              <Text style={[
                styles.categoryText,
                selectedCategory === category && styles.activeCategoryText
              ]}>
                {category}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <FlatList
        data={filteredCourses}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <CourseCard
            title={item.title}
            instructor={item.instructor}
            price={item.price}
            rating={item.rating}
            image={item.image}
            onPress={() => router.push(`/(details)/course-detail?id=${item.id}`)}
          />
        )}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Không tìm thấy khóa học nào</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 16,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    paddingHorizontal: 12,
    marginBottom: 16,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    color: '#333',
  },
  categoryScroll: {
    marginBottom: 4,
  },
  categoryContent: {
    paddingRight: 20,
  },
  categoryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F0F0F0',
    marginRight: 8,
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  activeCategoryText: {
    color: '#FFF',
  },
  listContent: {
    padding: 20,
    paddingBottom: 40,
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
  },
});
