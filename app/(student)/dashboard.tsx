import React from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

const MY_COURSES = [
    {
        id: '1',
        title: 'Lập trình Web Full-stack (Java/Spring)',
        progress: 75,
        image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA-3uw2Kla8uuKV6zMiW1uIN3mACpXzj-frdESLKaer8Nb_eZOjxHmUYU_QN4wph7VvQm-Kd-eeWOJ-xYmqPnGclwpzk46uZirIvBIXFvGu8QRMnC12wa_qNv3B9_l3UdAZyNDA7O_lcRItz2vyiUjCqacs2p0bcoLlG1AkcFTklF32o8dWFeyYNVt8OXXOKI-cydyseL3Mxu2NLbdSbjqKuchzyY_NBpXC5BT7BFZKJ8AdgjbAQ-qlysTU1oP28gbLuuhv8Dfa2HQ',
    },
    {
        id: '2',
        title: 'UI/UX Design Masterclass',
        progress: 30,
        image: 'https://images.unsplash.com/photo-1587614382346-4ec892f9aca3?auto=format&fit=crop&w=900&q=80',
    }
];

const RECOMMENDED = [
    {
        id: '3',
        title: 'An ninh mạng cho Doanh nghiệp',
        instructor: 'Kim Min-jun',
        price: '$89.99',
        rating: 4.7,
        image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBMwT9RsakcoOhUTPWMbfnqlQuPFnTJMXcd3xyFBEgOJWncPa65T8E_xd8cdiFYHg0kX2KybSx5nkjRMr6IRngQ9CgritV7bXpiWCTq4QW3iDS9jFHPolujdFu5urAtDh1VLNFQiSJe8EVYcsLtKlQShElG6Y-t7q0Uuqh0m5gyBCWcGL4wKayAZl0GRGfSBE9nPUFO25zjobAXiV2eMhvV3X4YePSW2uNXbQ0E90C5qesWt2Y7_tP7_26MELGvHqBIwA3reECS5k4',
    }
];

export default function StudentDashboard() {
    const colorScheme = useColorScheme();
    const themeColors = Colors[colorScheme ?? 'light'];
    const router = useRouter();

    return (
        <ScrollView style={[styles.container, { backgroundColor: themeColors.background }]}>
            <View style={styles.header}>
                <View>
                    <Text style={[styles.welcomeText, { color: themeColors.text }]}>Chào mừng, Minh Anh!</Text>
                    <Text style={styles.subtitle}>Bảng điều khiển học tập của bạn</Text>
                </View>
                <TouchableOpacity style={styles.notificationBtn}>
                    <Ionicons name="notifications-outline" size={24} color={themeColors.text} />
                    <View style={[styles.badge, { backgroundColor: themeColors.primary }]} />
                </TouchableOpacity>
            </View>

            {/* Stats Row */}
            <View style={styles.statsGrid}>
                <View style={styles.statCard}>
                    <Text style={styles.statNumber}>12</Text>
                    <Text style={styles.statLabel}>Khóa học</Text>
                </View>
                <View style={styles.statCard}>
                    <Text style={styles.statNumber}>5</Text>
                    <Text style={styles.statLabel}>Chứng chỉ</Text>
                </View>
                <View style={styles.statCard}>
                    <Text style={styles.statNumber}>84%</Text>
                    <Text style={styles.statLabel}>Tiến độ TB</Text>
                </View>
            </View>

            {/* My Courses */}
            <View style={styles.section}>
                <View style={styles.sectionHeader}>
                    <Text style={[styles.sectionTitle, { color: themeColors.text }]}>KHÓA HỌC CỦA TÔI</Text>
                    <TouchableOpacity onPress={() => { }}>
                        <Text style={[styles.seeAll, { color: themeColors.primary }]}>Xem tất cả</Text>
                    </TouchableOpacity>
                </View>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll}>
                    {MY_COURSES.map(course => (
                        <TouchableOpacity key={course.id} style={styles.courseCard} onPress={() => { }}>
                            <Image source={{ uri: course.image }} style={styles.courseImage} />
                            <View style={styles.courseInfo}>
                                <Text style={styles.courseTitle} numberOfLines={2}>{course.title}</Text>
                                <View style={styles.progressContainer}>
                                    <View style={[styles.progressBar, { width: `${course.progress}%`, backgroundColor: themeColors.primary }]} />
                                </View>
                                <Text style={styles.progressText}>Đã hoàn thành {course.progress}%</Text>
                            </View>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>

            {/* Upcoming Sessions */}
            <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: themeColors.text }]}>BUỔI HỌC SẮP TỚI</Text>
                <View style={styles.upcomingCard}>
                    <View style={[styles.dateBox, { backgroundColor: themeColors.secondary }]}>
                        <Text style={styles.dateMonth}>T07</Text>
                        <Text style={styles.dateDay}>25</Text>
                    </View>
                    <View style={styles.upcomingInfo}>
                        <Text style={styles.upcomingTitle}>Hỏi đáp trực tiếp: UX Design</Text>
                        <Text style={styles.upcomingTime}>19:00 - 20:00</Text>
                    </View>
                    <TouchableOpacity style={[styles.joinBtn, { backgroundColor: themeColors.primary }]}>
                        <Text style={styles.joinBtnText}>Tham gia</Text>
                    </TouchableOpacity>
                </View>
            </View>

            {/* Recommended */}
            <View style={styles.section}>
                <View style={styles.sectionHeader}>
                    <Text style={[styles.sectionTitle, { color: themeColors.text }]}>KHÓA HỌC ĐỀ XUẤT</Text>
                    <TouchableOpacity onPress={() => router.push('/courses')}>
                        <Text style={[styles.seeAll, { color: themeColors.primary }]}>Xem tất cả</Text>
                    </TouchableOpacity>
                </View>
                {RECOMMENDED.map(course => (
                    <TouchableOpacity key={course.id} style={styles.recCard}>
                        <Image source={{ uri: course.image }} style={styles.recImage} />
                        <View style={styles.recInfo}>
                            <Text style={styles.recTitle}>{course.title}</Text>
                            <Text style={styles.recInstructor}>{course.instructor}</Text>
                            <View style={styles.recFooter}>
                                <Text style={[styles.recPrice, { color: themeColors.primary }]}>{course.price}</Text>
                                <View style={styles.ratingRow}>
                                    <Ionicons name="star" size={12} color="#FFD700" />
                                    <Text style={styles.ratingText}>{course.rating}</Text>
                                </View>
                            </View>
                        </View>
                    </TouchableOpacity>
                ))}
            </View>

            <View style={{ height: 40 }} />
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        paddingTop: 60,
        paddingHorizontal: 20,
        paddingBottom: 20,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    welcomeText: {
        fontSize: 22,
        fontWeight: 'bold',
    },
    subtitle: {
        fontSize: 14,
        color: '#666',
        marginTop: 2,
    },
    notificationBtn: {
        position: 'relative',
        padding: 8,
        backgroundColor: '#F0F0F0',
        borderRadius: 20,
    },
    badge: {
        position: 'absolute',
        top: 10,
        right: 10,
        width: 8,
        height: 8,
        borderRadius: 4,
        borderWidth: 1,
        borderColor: '#FFF',
    },
    statsGrid: {
        flexDirection: 'row',
        paddingHorizontal: 20,
        gap: 12,
        marginBottom: 24,
    },
    statCard: {
        flex: 1,
        backgroundColor: '#FFF',
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#EEE',
        alignItems: 'center',
    },
    statNumber: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
    },
    statLabel: {
        fontSize: 12,
        color: '#666',
        marginTop: 4,
    },
    section: {
        paddingHorizontal: 20,
        marginBottom: 24,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '900',
    },
    seeAll: {
        fontSize: 13,
        fontWeight: '600',
    },
    horizontalScroll: {
        marginLeft: -20,
        paddingLeft: 20,
    },
    courseCard: {
        width: 250,
        backgroundColor: '#FFF',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#EEE',
        marginRight: 16,
        overflow: 'hidden',
    },
    courseImage: {
        width: '100%',
        height: 120,
    },
    courseInfo: {
        padding: 12,
    },
    courseTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#333',
        height: 36,
        marginBottom: 8,
    },
    progressContainer: {
        height: 6,
        backgroundColor: '#EEE',
        borderRadius: 3,
        marginBottom: 6,
    },
    progressBar: {
        height: '100%',
        borderRadius: 3,
    },
    progressText: {
        fontSize: 11,
        color: '#999',
    },
    upcomingCard: {
        flexDirection: 'row',
        backgroundColor: '#FFF',
        padding: 12,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#EEE',
        alignItems: 'center',
    },
    dateBox: {
        width: 60,
        height: 60,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
    },
    dateMonth: {
        color: '#FFF',
        fontSize: 10,
        fontWeight: 'bold',
    },
    dateDay: {
        color: '#FFF',
        fontSize: 24,
        fontWeight: '900',
    },
    upcomingInfo: {
        flex: 1,
        marginLeft: 12,
    },
    upcomingTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#333',
    },
    upcomingTime: {
        fontSize: 12,
        color: '#666',
        marginTop: 2,
    },
    joinBtn: {
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 8,
    },
    joinBtnText: {
        color: '#FFF',
        fontSize: 12,
        fontWeight: 'bold',
    },
    recCard: {
        flexDirection: 'row',
        backgroundColor: '#FFF',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#EEE',
        overflow: 'hidden',
        padding: 10,
        marginBottom: 12,
    },
    recImage: {
        width: 80,
        height: 80,
        borderRadius: 8,
    },
    recInfo: {
        flex: 1,
        marginLeft: 12,
        justifyContent: 'center',
    },
    recTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#333',
    },
    recInstructor: {
        fontSize: 12,
        color: '#666',
        marginBottom: 6,
    },
    recFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    recPrice: {
        fontSize: 14,
        fontWeight: 'bold',
    },
    ratingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    ratingText: {
        fontSize: 12,
        color: '#444',
        fontWeight: 'bold',
    },
});
