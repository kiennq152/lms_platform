import React, { useState } from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Ionicons } from '@expo/vector-icons';

export default function LegalScreen() {
    const [activeTab, setActiveTab] = useState('Terms');
    const colorScheme = useColorScheme();
    const themeColors = Colors[colorScheme ?? 'light'];
    const router = useRouter();

    return (
        <View style={[styles.container, { backgroundColor: themeColors.background }]}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()}>
                    <Ionicons name="arrow-back" size={24} color={themeColors.text} />
                </TouchableOpacity>
                <Text style={[styles.title, { color: themeColors.text }]}>Pháp lý</Text>
                <View style={{ width: 24 }} />
            </View>

            <View style={styles.tabs}>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'Terms' && { borderBottomColor: themeColors.primary }]}
                    onPress={() => setActiveTab('Terms')}
                >
                    <Text style={[styles.tabText, activeTab === 'Terms' && { color: themeColors.primary, fontWeight: 'bold' }]}>
                        Điều khoản dịch vụ
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'Privacy' && { borderBottomColor: themeColors.primary }]}
                    onPress={() => setActiveTab('Privacy')}
                >
                    <Text style={[styles.tabText, activeTab === 'Privacy' && { color: themeColors.primary, fontWeight: 'bold' }]}>
                        Chính sách bảo mật
                    </Text>
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>
                {activeTab === 'Terms' ? (
                    <View>
                        <Text style={styles.lastUpdated}>Cập nhật lần cuối: 24/02/2026</Text>
                        <Text style={styles.contentTitle}>1. Chấp nhận điều khoản</Text>
                        <Text style={styles.contentText}>
                            Bằng việc sử dụng ứng dụng VIAN Academy, bạn đồng ý tuân thủ các điều khoản này.
                            Nếu bạn không đồng ý, vui lòng không sử dụng dịch vụ của chúng tôi.
                        </Text>
                        <Text style={styles.contentTitle}>2. Tài khoản người dùng</Text>
                        <Text style={styles.contentText}>
                            Bạn có trách nhiệm bảo mật thông tin tài khoản và mật khẩu của mình.
                            Bạn phải thông báo ngay cho chúng tôi nếu phát hiện bất kỳ hành vi sử dụng trái phép nào.
                        </Text>
                        <Text style={styles.contentTitle}>3. Nội dung khóa học</Text>
                        <Text style={styles.contentText}>
                            Tất cả nội dung khóa học trên VIAN Academy đều thuộc sở hữu trí tuệ của chúng tôi hoặc các đối tác.
                            Bạn không được phép sao chép, phân phối hoặc bán lại nội dung này.
                        </Text>
                    </View>
                ) : (
                    <View>
                        <Text style={styles.lastUpdated}>Cập nhật lần cuối: 24/02/2026</Text>
                        <Text style={styles.contentTitle}>1. Thông tin chúng tôi thu thập</Text>
                        <Text style={styles.contentText}>
                            Chúng tôi thu thập thông tin cá nhân như tên, email, và dữ liệu sử dụng ứng dụng
                            để cải thiện trải nghiệm học tập của bạn.
                        </Text>
                        <Text style={styles.contentTitle}>2. Sử dụng thông tin</Text>
                        <Text style={styles.contentText}>
                            Thông tin của bạn được sử dụng để quản lý tài khoản, xử lý thanh toán và
                            gửi các thông báo liên quan đến khóa học.
                        </Text>
                        <Text style={styles.contentTitle}>3. Bảo mật dữ liệu</Text>
                        <Text style={styles.contentText}>
                            Chúng tôi sử dụng các biện pháp bảo mật tiêu chuẩn để bảo vệ dữ liệu của bạn
                            trước các hành vi truy cập trái phép.
                        </Text>
                    </View>
                )}
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
    tabs: {
        flexDirection: 'row',
        backgroundColor: '#FFF',
        borderBottomWidth: 1,
        borderBottomColor: '#EEE',
    },
    tab: {
        flex: 1,
        paddingVertical: 14,
        alignItems: 'center',
        borderBottomWidth: 2,
        borderBottomColor: 'transparent',
    },
    tabText: {
        fontSize: 14,
        color: '#666',
    },
    scrollContent: {
        padding: 24,
    },
    lastUpdated: {
        fontSize: 12,
        color: '#999',
        marginBottom: 20,
        fontStyle: 'italic',
    },
    contentTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 10,
        marginTop: 20,
    },
    contentText: {
        fontSize: 14,
        color: '#666',
        lineHeight: 22,
    },
});
