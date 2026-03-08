import React, { useState } from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, TextInput, Image } from 'react-native';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

const TOPICS = [
    {
        id: '1',
        title: 'Làm sao để chuẩn bị hồ sơ IT sang Hàn Quốc?',
        author: 'Minh Tuấn',
        avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAGrTHmQf9dUMLCAKVlCNR5IwZFKNPlP_I6Pd5o6YETB9VHGsGMv_giowUTs9D--M86FGud2YIOin1Y_hq2s5NjWdQTAqu5IGkCVycXMJD3dL1GUpDc3MumskZ5FC7GiW_FUeEaQvKxiIJh5_9oACcG9Jy7UHpXo-zNCnu2QBznh2GV3X8F2NVenIgBYkUz9oEiWugYEBq88ok7lpq0m2FNWUrOvTgs8atAc_RIOOJp_J7ZwxLjhBvIOlFIVxt-QqSU8LEhCr25GUM',
        time: '2 giờ trước',
        replies: 12,
        views: 450,
        category: 'Hỗ Trợ',
        isPinned: true,
    },
    {
        id: '2',
        title: 'Thảo luận về lộ trình Full-stack 2024 tại VIAN',
        author: 'Hương Giang',
        avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuB1WTFm-xwtHq8b_43zDypyfN44CDtCGEbAv7jRuQnZIwVzh9VRSnWv6egbKHiD4tYDBuIK9_JxWL8ewjv_SQapBdS5N71SXE08LJZS3yOO18yKrAtTXIpRJS2rl2psdqR3gE-69tgN9BuZOHbBpT4SpiGFffT6XDvtuLxcQdMZ81P0XaFm4HtYJyhwu_jhj6oH47Xldf3Ub4HrPgvEVs9NGuujv7GmKZKjf9oq1a5b84LqbtyD8agVHNZikOFReWjSxfWoMy3ntXI',
        time: '5 giờ trước',
        replies: 8,
        views: 231,
        category: 'Thảo Luận',
        hasSolution: true,
    },
    {
        id: '3',
        title: 'Lỗi khi cài đặt SQL Server trên Macbook M1',
        author: 'Quốc Bảo',
        avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAeZgX-ScIZ6ZsUWgD8K0D_gcpKOEGl99hsnpYLUgKzWkDz9BtO2xYPD3WbXyGmTDYWtvNnN8TlR3HzI1zcVb5-w3o8Hjh0thVIxjSiLHRBaye8IrxS_2TwFvB-fbowRHr4NHi-V5vvm1Z2sazxTOUIU8CKddxVPOksqls65Ego3G7X6CcqknWQuXbqv7-iG6Fn7riN03i35tTL4bdD5n4I8zSNcVVUo8oEcyXK53bKZLpFBn4dXPg-ZS5z0youWw__xi2L9FELL0A',
        time: '1 ngày trước',
        replies: 24,
        views: 890,
        category: 'Hỏi Đáp',
    }
];

export default function CommunityScreen() {
    const colorScheme = useColorScheme();
    const themeColors = Colors[colorScheme ?? 'light'];
    const [activeTab, setActiveTab] = useState('Diễn Đàn');

    return (
        <View style={[styles.container, { backgroundColor: themeColors.background }]}>
            <View style={styles.header}>
                <Text style={[styles.title, { color: themeColors.text }]}>VIAN Community</Text>
                <TouchableOpacity style={[styles.createBtn, { backgroundColor: themeColors.primary }]}>
                    <Ionicons name="add" size={24} color="#FFF" />
                    <Text style={styles.createBtnText}>Tạo Chủ Đề</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.tabs}>
                {['Diễn Đàn', 'Hỏi Đáp', 'Tin Tức'].map(tab => (
                    <TouchableOpacity
                        key={tab}
                        style={[styles.tab, activeTab === tab && { borderBottomColor: themeColors.primary }]}
                        onPress={() => setActiveTab(tab)}
                    >
                        <Text style={[styles.tabText, activeTab === tab && { color: themeColors.primary, fontWeight: 'bold' }]}>
                            {tab}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            <View style={styles.searchBar}>
                <Ionicons name="search" size={20} color="#999" />
                <TextInput
                    placeholder="Tìm chủ đề..."
                    style={styles.searchInput}
                    placeholderTextColor="#999"
                />
            </View>

            <ScrollView contentContainerStyle={styles.listContent}>
                {TOPICS.map(topic => (
                    <TouchableOpacity key={topic.id} style={styles.topicCard}>
                        <View style={styles.topicHeader}>
                            <Image source={{ uri: topic.avatar }} style={styles.authorAvatar} />
                            <View style={styles.authorInfo}>
                                <Text style={styles.authorName}>{topic.author}</Text>
                                <Text style={styles.topicTime}>{topic.time}</Text>
                            </View>
                            {topic.isPinned && (
                                <View style={styles.pinnedBadge}>
                                    <Ionicons name="pin" size={12} color={themeColors.primary} />
                                    <Text style={[styles.pinnedText, { color: themeColors.primary }]}>Đã ghim</Text>
                                </View>
                            )}
                        </View>

                        <Text style={styles.topicTitle}>{topic.title}</Text>

                        <View style={styles.topicFooter}>
                            <View style={styles.categoryBadge}>
                                <Text style={styles.categoryText}>{topic.category}</Text>
                            </View>
                            <View style={styles.statsRow}>
                                <View style={styles.statItem}>
                                    <Ionicons name="chatbubble-outline" size={14} color="#666" />
                                    <Text style={styles.statText}>{topic.replies}</Text>
                                </View>
                                <View style={styles.statItem}>
                                    <Ionicons name="eye-outline" size={16} color="#666" />
                                    <Text style={styles.statText}>{topic.views}</Text>
                                </View>
                                {topic.hasSolution && (
                                    <View style={styles.solvedBadge}>
                                        <Ionicons name="checkmark-circle" size={14} color="#4CAF50" />
                                        <Text style={styles.solvedText}>Đã giải quyết</Text>
                                    </View>
                                )}
                            </View>
                        </View>
                    </TouchableOpacity>
                ))}
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
    },
    title: {
        fontSize: 22,
        fontWeight: 'bold',
    },
    createBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 8,
        gap: 4,
    },
    createBtnText: {
        color: '#FFF',
        fontSize: 14,
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
    searchBar: {
        margin: 20,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F5F5F5',
        paddingHorizontal: 12,
        borderRadius: 10,
    },
    searchInput: {
        flex: 1,
        paddingVertical: 10,
        marginLeft: 8,
        fontSize: 15,
    },
    listContent: {
        paddingHorizontal: 20,
        paddingBottom: 40,
    },
    topicCard: {
        backgroundColor: '#FFF',
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#EEE',
    },
    topicHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    authorAvatar: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#EEE',
    },
    authorInfo: {
        marginLeft: 10,
        flex: 1,
    },
    authorName: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#333',
    },
    topicTime: {
        fontSize: 11,
        color: '#999',
    },
    pinnedBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(29, 58, 138, 0.05)',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
        gap: 4,
    },
    pinnedText: {
        fontSize: 10,
        fontWeight: 'bold',
    },
    topicTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
        lineHeight: 22,
        marginBottom: 16,
    },
    topicFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    categoryBadge: {
        backgroundColor: '#F0F0F0',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 4,
    },
    categoryText: {
        fontSize: 11,
        color: '#666',
        fontWeight: '600',
    },
    statsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
    },
    statItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    statText: {
        fontSize: 12,
        color: '#666',
    },
    solvedBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginLeft: 4,
    },
    solvedText: {
        fontSize: 11,
        color: '#4CAF50',
        fontWeight: 'bold',
    },
});
