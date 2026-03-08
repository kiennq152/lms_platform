import React, { useState } from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, TextInput, LayoutAnimation } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const FAQ = [
    {
        question: 'Làm sao để đăng ký khóa học?',
        answer: 'Để đăng ký khóa học, bạn chỉ cần tìm khóa học muốn học, thêm vào giỏ hàng và hoàn thành thanh toán. Sau đó khóa học sẽ xuất hiện trong mục "Khóa học của tôi".'
    },
    {
        question: 'Có thể hoàn lại tiền không?',
        answer: 'Có, chúng tôi hỗ trợ hoàn tiền trong vòng 30 ngày nếu bạn không hài lòng với nội dung khóa học. Vui lòng liên hệ hỗ trợ để được hướng dẫn.'
    },
    {
        question: 'Làm sao để lấy chứng chỉ?',
        answer: 'Bạn sẽ nhận được chứng chỉ tự động sau khi hoàn thành 100% các bài học và bài kiểm tra của khóa học.'
    }
];

export default function SupportScreen() {
    const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
    const colorScheme = useColorScheme();
    const themeColors = Colors[colorScheme ?? 'light'];
    const router = useRouter();

    const toggleExpand = (index: number) => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setExpandedIndex(expandedIndex === index ? null : index);
    };

    return (
        <View style={[styles.container, { backgroundColor: themeColors.background }]}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()}>
                    <Ionicons name="arrow-back" size={24} color={themeColors.text} />
                </TouchableOpacity>
                <Text style={[styles.title, { color: themeColors.text }]}>Trung tâm hỗ trợ</Text>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.searchSection}>
                    <Text style={styles.searchLabel}>Chúng tôi có thể giúp gì cho bạn?</Text>
                    <View style={styles.searchBar}>
                        <Ionicons name="search" size={20} color="#999" />
                        <TextInput
                            placeholder="Tìm kiếm vấn đề..."
                            style={styles.searchInput}
                            placeholderTextColor="#999"
                        />
                    </View>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Câu hỏi thường gặp</Text>
                    {FAQ.map((item, index) => (
                        <TouchableOpacity
                            key={index}
                            style={styles.faqCard}
                            onPress={() => toggleExpand(index)}
                        >
                            <View style={styles.faqHeader}>
                                <Text style={styles.question}>{item.question}</Text>
                                <Ionicons
                                    name={expandedIndex === index ? "chevron-up" : "chevron-down"}
                                    size={18}
                                    color="#666"
                                />
                            </View>
                            {expandedIndex === index && (
                                <Text style={styles.answer}>{item.answer}</Text>
                            )}
                        </TouchableOpacity>
                    ))}
                </View>

                <View style={styles.contactCard}>
                    <Text style={styles.contactTitle}>Bạn vẫn cần hỗ trợ?</Text>
                    <Text style={styles.contactSubtitle}>Gửi lời nhắn cho chúng tôi, chúng tôi sẽ phản hồi trong vòng 24 giờ.</Text>

                    <Input placeholder="Tiêu đề vấn đề" style={styles.contactInput} />
                    <TextInput
                        placeholder="Mô tả chi tiết..."
                        style={[styles.contactInput, styles.textArea]}
                        multiline
                        numberOfLines={4}
                        placeholderTextColor="#999"
                    />
                    <Button title="Gửi yêu cầu" onPress={() => alert('Đã gửi yêu cầu hỗ trợ!')} />
                </View>

                <View style={styles.contactLinks}>
                    <TouchableOpacity style={styles.linkItem}>
                        <Ionicons name="mail-outline" size={24} color={themeColors.primary} />
                        <Text style={styles.linkText}>support@vian.edu.vn</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.linkItem}>
                        <Ionicons name="call-outline" size={24} color={themeColors.primary} />
                        <Text style={styles.linkText}>1900 123 456</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
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
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#FFF',
        borderBottomWidth: 1,
        borderBottomColor: '#EEE',
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
    },
    scrollContent: {
        padding: 20,
    },
    searchSection: {
        marginBottom: 30,
    },
    searchLabel: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 12,
    },
    searchBar: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F5F5F5',
        paddingHorizontal: 15,
        borderRadius: 12,
    },
    searchInput: {
        flex: 1,
        paddingVertical: 12,
        marginLeft: 10,
        fontSize: 15,
    },
    section: {
        marginBottom: 30,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 16,
    },
    faqCard: {
        backgroundColor: '#FFF',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#EEE',
    },
    faqHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    question: {
        fontSize: 15,
        fontWeight: 'bold',
        color: '#444',
        flex: 1,
    },
    answer: {
        fontSize: 14,
        color: '#666',
        lineHeight: 20,
        marginTop: 12,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: '#F5F5F5',
    },
    contactCard: {
        backgroundColor: '#1E3A8A',
        borderRadius: 16,
        padding: 24,
        marginBottom: 30,
    },
    contactTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#FFF',
        marginBottom: 8,
    },
    contactSubtitle: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.7)',
        marginBottom: 20,
        lineHeight: 20,
    },
    contactInput: {
        backgroundColor: '#FFF',
        marginBottom: 12,
        borderRadius: 8,
    },
    textArea: {
        height: 100,
        padding: 12,
        textAlignVertical: 'top',
    },
    contactLinks: {
        gap: 16,
        marginBottom: 40,
    },
    linkItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        backgroundColor: '#FFF',
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#EEE',
    },
    linkText: {
        fontSize: 15,
        color: '#333',
        fontWeight: '500',
    },
});
