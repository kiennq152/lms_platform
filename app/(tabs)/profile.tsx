import React from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { WebLayout } from '@/components/ui/web-layout';
import { Footer } from '@/components/ui/footer';

const SETTINGS_GROUPS = [
    {
        title: 'Tài Khoản',
        items: [
            { id: 'edit-profile', label: 'Thông tin cá nhân', icon: 'person-outline', color: '#2196F3' },
            { id: 'certificates', label: 'Chứng chỉ của tôi', icon: 'school-outline', color: '#4CAF50' },
            { id: 'billing', label: 'Lịch sử hóa đơn', icon: 'receipt-outline', color: '#FF9800' },
            { id: 'payment', label: 'Phương thức thanh toán', icon: 'card-outline', color: '#9C27B0' },
        ]
    },
    {
        title: 'Ứng Dụng',
        items: [
            { id: 'notifications', label: 'Thông báo', icon: 'notifications-outline', color: '#FFB300' },
            { id: 'security', label: 'Bảo mật', icon: 'shield-checkmark-outline', color: '#F44336' },
            { id: 'language', label: 'Ngôn ngữ', icon: 'globe-outline', color: '#00BCD4' },
            { id: 'help', label: 'Hỗ trợ & Trợ giúp', icon: 'help-circle-outline', color: '#607D8B' },
        ]
    }
];

export default function ProfileScreen() {
    const colorScheme = useColorScheme();
    const themeColors = Colors[colorScheme ?? 'light'];
    const router = useRouter();

    const handleLogout = () => {
        alert('✓ Đã đăng xuất thành công.');
        router.replace('/(auth)/login');
    };

    return (
        <WebLayout>
            <ScrollView style={[styles.container, { backgroundColor: themeColors.background }]}>
            <View style={styles.header}>
                <View style={styles.profileInfo}>
                    <Image
                        source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDwQYIjyuUqzYb2DINbsNsCLymY5PTOLPn5me5b-II4TqdWtvyJlP0ENoUXq9J0FW16pZVN5kp-Ho3IbOr43gCUxHewI5ESzZIbNyJvan70Ra7kn9oDU3GVhtLaHoSJAIUq4ppTceVvbXS0AJ1fN2S8g4m7QMsMkEluAQzzKEs0AfQtqAWEbHQ79Ak1b3FkNgFvlNZly90CYAam4wmRo8pxApVp19gLqpvbyb0J395omaN-KqSF5xx9-xGNDMkluyjBbmAGcxmS5OI' }}
                        style={styles.avatar}
                    />
                    <View style={styles.textInfo}>
                        <Text style={[styles.userName, { color: themeColors.text }]}>Nguyễn Văn A</Text>
                        <Text style={styles.userEmail}>nva@email.com</Text>
                        <View style={styles.badge}>
                            <Text style={styles.badgeText}>Học viên Pro</Text>
                        </View>
                    </View>
                </View>
                <TouchableOpacity style={styles.editBtn}>
                    <Ionicons name="pencil" size={18} color={themeColors.primary} />
                </TouchableOpacity>
            </View>

            <View style={styles.statsContainer}>
                <View style={styles.statItem}>
                    <Text style={styles.statValue}>12</Text>
                    <Text style={styles.statLabel}>Khóa học</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                    <Text style={styles.statValue}>5</Text>
                    <Text style={styles.statLabel}>Hoàn thành</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                    <Text style={styles.statValue}>3</Text>
                    <Text style={styles.statLabel}>Chứng chỉ</Text>
                </View>
            </View>

            <View style={styles.settingsSection}>
                {SETTINGS_GROUPS.map((group, gIdx) => (
                    <View key={gIdx} style={styles.group}>
                        <Text style={styles.groupTitle}>{group.title}</Text>
                        <View style={styles.groupBody}>
                            {group.items.map((item, iIdx) => (
                                <TouchableOpacity key={item.id} style={[styles.item, iIdx === group.items.length - 1 && styles.noBorder]}>
                                    <View style={[styles.iconContainer, { backgroundColor: `${item.color}15` }]}>
                                        <Ionicons name={item.icon as any} size={20} color={item.color} />
                                    </View>
                                    <Text style={styles.itemLabel}>{item.label}</Text>
                                    <Ionicons name="chevron-forward" size={18} color="#CCC" />
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>
                ))}
            </View>

            <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
                <Ionicons name="log-out" size={20} color="#F44336" />
                <Text style={styles.logoutText}>Đăng xuất</Text>
            </TouchableOpacity>

            <Text style={styles.versionText}>Phiên bản 1.0.0 (BETA)</Text>
            <View style={{ height: 20 }} />
            <Footer />
        </ScrollView>
        </WebLayout>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        paddingTop: 80,
        paddingHorizontal: 20,
        paddingBottom: 24,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        backgroundColor: '#FFF',
    },
    profileInfo: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    avatar: {
        width: 80,
        height: 80,
        borderRadius: 40,
        borderWidth: 3,
        borderColor: '#F0F0F0',
    },
    textInfo: {
        marginLeft: 16,
    },
    userName: {
        fontSize: 22,
        fontWeight: 'bold',
    },
    userEmail: {
        fontSize: 14,
        color: '#666',
        marginTop: 2,
    },
    badge: {
        backgroundColor: '#FDECEC',
        alignSelf: 'flex-start',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 4,
        marginTop: 6,
    },
    badgeText: {
        fontSize: 11,
        color: '#DC2626',
        fontWeight: 'bold',
    },
    editBtn: {
        backgroundColor: '#F5F5F5',
        padding: 8,
        borderRadius: 20,
    },
    statsContainer: {
        flexDirection: 'row',
        backgroundColor: '#FFF',
        marginHorizontal: 20,
        paddingVertical: 20,
        borderRadius: 16,
        marginTop: -10,
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
    },
    statItem: {
        flex: 1,
        alignItems: 'center',
    },
    statValue: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
    },
    statLabel: {
        fontSize: 12,
        color: '#666',
        marginTop: 2,
    },
    statDivider: {
        width: 1,
        height: '60%',
        backgroundColor: '#EEE',
        alignSelf: 'center',
    },
    settingsSection: {
        padding: 20,
        paddingTop: 30,
    },
    group: {
        marginBottom: 24,
    },
    groupTitle: {
        fontSize: 13,
        fontWeight: '900',
        color: '#999',
        marginBottom: 12,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    groupBody: {
        backgroundColor: '#FFF',
        borderRadius: 16,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#EEE',
    },
    item: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#F5F5F5',
    },
    noBorder: {
        borderBottomWidth: 0,
    },
    iconContainer: {
        width: 36,
        height: 36,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    itemLabel: {
        flex: 1,
        fontSize: 15,
        color: '#333',
        fontWeight: '500',
    },
    logoutBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginHorizontal: 20,
        padding: 16,
        backgroundColor: '#FFF',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#FEE2E2',
        gap: 8,
    },
    logoutText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#F44336',
    },
    versionText: {
        textAlign: 'center',
        fontSize: 12,
        color: '#BBB',
        marginTop: 24,
    },
});
