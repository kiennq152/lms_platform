import React, { useState } from 'react';
import { StyleSheet, View, Text, ScrollView, Image, TouchableOpacity, Dimensions } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Ionicons, FontAwesome } from '@expo/vector-icons';
import { Button } from '@/components/ui/button';

const { width } = Dimensions.get('window');

const CURRICULUM = [
    {
        title: 'Chương 1: Giới thiệu về Lập trình Full-stack',
        lessons: [
            { id: '1.1', title: 'Lập trình Full-stack là gì?', duration: '12:30', type: 'video' },
            { id: '1.2', title: 'Cài đặt môi trường phát triển', duration: '25:00', type: 'video' },
            { id: '1.3', title: 'Các thuật ngữ chính', type: 'doc' },
        ]
    },
    {
        title: 'Chương 2: Lập trình Backend với Node.js',
        lessons: [
            { id: '2.1', title: 'JavaScript cơ bản', duration: '45:10', type: 'video' },
            { id: '2.2', title: 'Express.js và APIs', duration: '1:15:30', type: 'video' },
        ]
    }
];

export default function CourseDetailScreen() {
    const { id } = useLocalSearchParams();
    const colorScheme = useColorScheme();
    const themeColors = Colors[colorScheme ?? 'light'];
    const router = useRouter();
    const [expandedSection, setExpandedSection] = useState<string | null>(CURRICULUM[0].title);

    return (
        <View style={[styles.container, { backgroundColor: themeColors.background }]}>
            <ScrollView contentContainerStyle={styles.scrollContent}>
                {/* Header/Banner Section */}
                <View style={styles.bannerContainer}>
                    <Image
                        source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCJ-T57G7JjeuAeMNcRJUAnbAg2wrr-flAR1mmZvHD81pMM6jXSEijB3UB7MZ_hFNHpAE8Ydc7MZ9iD-wQ7Ln6-Wlvv2qky1mPxajy1MftbmmOzosrFoT41PsQosprW5P0xdCB1hZXoQrcJPNwWDx8zwbeQ-COyTQP5pL8-rNJODaSwIPNjhWabiTG1Fc_LLrF8Kr9v4A6OqnKgOtHNSlT0L5-r4k3clNZjA2_Ouf0gsP0HVNw9_9nNRnPaj-zAglhIxs0D1Io5ens' }}
                        style={styles.bannerImage}
                    />
                    <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                        <Ionicons name="arrow-back" size={24} color="#FFF" />
                    </TouchableOpacity>
                    <View style={styles.playButtonContainer}>
                        <TouchableOpacity style={styles.playButton}>
                            <Ionicons name="play" size={40} color="#FFF" />
                        </TouchableOpacity>
                    </View>
                </View>

                <View style={styles.content}>
                    <View style={styles.tagContainer}>
                        <Text style={styles.bestSellerTag}>Bán chạy nhất</Text>
                        <Text style={styles.newTag}>Mới</Text>
                    </View>

                    <Text style={[styles.title, { color: themeColors.text }]}>
                        Lập trình viên Full-stack chuyên nghiệp - Xuất khẩu lao động Hàn Quốc
                    </Text>

                    <Text style={styles.description}>
                        Trở thành một lập trình viên chuyên nghiệp sẵn sàng cho thị trường IT Hàn Quốc! Nắm vững React, Node.js, SQL và xây dựng portfolio ấn tượng.
                    </Text>

                    <View style={styles.statsRow}>
                        <View style={styles.ratingContainer}>
                            <Text style={styles.ratingText}>4.7</Text>
                            <View style={styles.stars}>
                                {[1, 2, 3, 4, 5].map(s => (
                                    <FontAwesome key={s} name={s <= 4 ? "star" : "star-half-o"} size={14} color="#FFD700" />
                                ))}
                            </View>
                            <Text style={styles.reviewCount}>(12,450 đánh giá)</Text>
                        </View>
                        <Text style={styles.studentCount}>21,887 học viên</Text>
                    </View>

                    <View style={styles.instructorContainer}>
                        <Text style={styles.instructorText}>Giảng viên <Text style={styles.instructorName}>VIAN Academy</Text></Text>
                    </View>

                    <View style={styles.priceContainer}>
                        <Text style={[styles.price, { color: themeColors.primary }]}>4.500.000₫</Text>
                        <Text style={styles.oldPrice}>22.500.000₫</Text>
                        <View style={styles.discountBadge}>
                            <Text style={styles.discountText}>Giảm 80%</Text>
                        </View>
                    </View>

                    {/* Action Buttons */}
                    <View style={styles.actions}>
                        <Button title="Thêm vào giỏ hàng" onPress={() => { }} style={styles.cartButton} />
                        <Button title="Mua ngay" onPress={() => { }} variant="outline" style={styles.buyButton} />
                    </View>

                    {/* Learnings Section */}
                    <View style={styles.section}>
                        <Text style={[styles.sectionTitle, { color: themeColors.text }]}>Bạn sẽ học được gì</Text>
                        {[
                            'Làm chủ các kỹ thuật và thuật toán lập trình hiện đại.',
                            'Xây dựng và triển khai các ứng dụng web full-stack từ đầu.',
                            'Làm việc hiệu quả với các công nghệ Frontend và Backend.',
                            'Thực hiện phân tích dữ liệu phức tạp bằng Python và SQL.',
                        ].map((item, index) => (
                            <View key={index} style={styles.learningItem}>
                                <Ionicons name="checkmark" size={20} color={themeColors.primary} />
                                <Text style={styles.learningText}>{item}</Text>
                            </View>
                        ))}
                    </View>

                    {/* Curriculum Section */}
                    <View style={styles.section}>
                        <Text style={[styles.sectionTitle, { color: themeColors.text }]}>Nội dung khóa học</Text>
                        {CURRICULUM.map((section) => (
                            <View key={section.title} style={styles.accordion}>
                                <TouchableOpacity
                                    style={styles.accordionHeader}
                                    onPress={() => setExpandedSection(expandedSection === section.title ? null : section.title)}
                                >
                                    <Text style={styles.accordionTitle}>{section.title}</Text>
                                    <Ionicons
                                        name={expandedSection === section.title ? "chevron-up" : "chevron-down"}
                                        size={20}
                                        color="#666"
                                    />
                                </TouchableOpacity>
                                {expandedSection === section.title && (
                                    <View style={styles.accordionContent}>
                                        {section.lessons.map((lesson) => (
                                            <View key={lesson.id} style={styles.lessonItem}>
                                                <Ionicons name={lesson.type === 'video' ? "play-circle" : "document-text"} size={18} color="#666" />
                                                <Text style={styles.lessonTitle}>{lesson.title}</Text>
                                                {lesson.duration && <Text style={styles.lessonDuration}>{lesson.duration}</Text>}
                                            </View>
                                        ))}
                                    </View>
                                )}
                            </View>
                        ))}
                    </View>

                    {/* Course Features */}
                    <View style={styles.section}>
                        <Text style={[styles.sectionTitle, { color: themeColors.text }]}>Khóa học này bao gồm:</Text>
                        <View style={styles.featureItem}>
                            <Ionicons name="videocam-outline" size={20} color={themeColors.secondary} />
                            <Text style={styles.featureText}>52 giờ video theo yêu cầu</Text>
                        </View>
                        <View style={styles.featureItem}>
                            <Ionicons name="document-text-outline" size={20} color={themeColors.secondary} />
                            <Text style={styles.featureText}>35 bài viết & tài liệu</Text>
                        </View>
                        <View style={styles.featureItem}>
                            <Ionicons name="infinite" size={20} color={themeColors.secondary} />
                            <Text style={styles.featureText}>Truy cập trọn đời</Text>
                        </View>
                        <View style={styles.featureItem}>
                            <Ionicons name="ribbon-outline" size={20} color={themeColors.secondary} />
                            <Text style={styles.featureText}>Chứng chỉ hoàn thành</Text>
                        </View>
                    </View>
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollContent: {
        paddingBottom: 40,
    },
    bannerContainer: {
        width: '100%',
        height: 220,
        position: 'relative',
    },
    bannerImage: {
        width: '100%',
        height: '100%',
    },
    backButton: {
        position: 'absolute',
        top: 50,
        left: 20,
        backgroundColor: 'rgba(0,0,0,0.5)',
        borderRadius: 20,
        padding: 8,
    },
    playButtonContainer: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        justifyContent: 'center',
        alignItems: 'center',
    },
    playButton: {
        backgroundColor: 'rgba(0,0,0,0.4)',
        width: 70,
        height: 70,
        borderRadius: 35,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#FFF',
    },
    content: {
        padding: 20,
    },
    tagContainer: {
        flexDirection: 'row',
        gap: 8,
        marginBottom: 12,
    },
    bestSellerTag: {
        backgroundColor: 'rgba(255, 165, 0, 0.1)',
        color: '#FF8C00',
        fontSize: 12,
        fontWeight: 'bold',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
    },
    newTag: {
        backgroundColor: '#D84A4A',
        color: '#FFF',
        fontSize: 12,
        fontWeight: 'bold',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        lineHeight: 32,
        marginBottom: 12,
    },
    description: {
        fontSize: 16,
        color: '#666',
        lineHeight: 24,
        marginBottom: 16,
    },
    statsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    ratingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    ratingText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#FF8C00',
    },
    stars: {
        flexDirection: 'row',
        gap: 2,
    },
    reviewCount: {
        fontSize: 14,
        color: '#999',
    },
    studentCount: {
        fontSize: 14,
        color: '#999',
    },
    instructorContainer: {
        marginBottom: 20,
    },
    instructorText: {
        fontSize: 14,
        color: '#666',
    },
    instructorName: {
        fontWeight: 'bold',
        textDecorationLine: 'underline',
    },
    priceContainer: {
        flexDirection: 'row',
        alignItems: 'baseline',
        gap: 12,
        marginBottom: 20,
    },
    price: {
        fontSize: 28,
        fontWeight: '900',
    },
    oldPrice: {
        fontSize: 16,
        color: '#999',
        textDecorationLine: 'line-through',
    },
    discountBadge: {
        backgroundColor: '#FFF0F0',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 4,
    },
    discountText: {
        color: '#D84A4A',
        fontWeight: 'bold',
        fontSize: 12,
    },
    actions: {
        gap: 12,
        marginBottom: 32,
    },
    cartButton: {
        backgroundColor: '#D84A4A',
        paddingVertical: 14,
    },
    buyButton: {
        borderColor: '#1B47A4',
        paddingVertical: 14,
    },
    section: {
        marginBottom: 32,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 16,
    },
    learningItem: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 12,
        alignItems: 'flex-start',
    },
    learningText: {
        fontSize: 15,
        color: '#444',
        flex: 1,
    },
    accordion: {
        borderWidth: 1,
        borderColor: '#EEE',
        borderRadius: 8,
        marginBottom: 8,
        overflow: 'hidden',
    },
    accordionHeader: {
        padding: 16,
        backgroundColor: '#F9F9F9',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    accordionTitle: {
        fontSize: 15,
        fontWeight: 'bold',
        color: '#333',
        flex: 1,
    },
    accordionContent: {
        padding: 16,
        backgroundColor: '#FFF',
        gap: 16,
    },
    lessonItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    lessonTitle: {
        fontSize: 14,
        color: '#666',
        flex: 1,
    },
    lessonDuration: {
        fontSize: 12,
        color: '#999',
    },
    featureItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginBottom: 12,
    },
    featureText: {
        fontSize: 15,
        color: '#555',
    },
});
