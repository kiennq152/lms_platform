import React, { useState } from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

const SECTIONS = [
    {
        title: 'Chương 1: Cơ Bản',
        lessons: [
            { id: '1', title: 'Bài 1: Giới Thiệu', duration: '05:20', completed: true, active: true },
            { id: '2', title: 'Bài 2: Cài Đặt', duration: '12:45', completed: true },
            { id: '3', title: 'Bài 3: Biến & Kiểu', duration: '15:10', locked: true },
        ]
    },
    {
        title: 'Chương 2: Nâng Cao',
        lessons: [
            { id: '4', title: 'Bài 1: Hàm', duration: '20:30', locked: true },
            { id: '5', title: 'Bài 2: Lớp & Đối Tượng', duration: '45:00', locked: true },
        ]
    }
];

export default function CoursePlayerScreen() {
    const [activeTab, setActiveTab] = useState('Overview');
    const colorScheme = useColorScheme();
    const themeColors = Colors[colorScheme ?? 'light'];
    const router = useRouter();

    return (
        <View style={[styles.container, { backgroundColor: themeColors.background }]}>
            {/* Video Player Placeholder */}
            <View style={styles.videoContainer}>
                <View style={styles.videoPlayer}>
                    <Ionicons name="play-circle" size={80} color="#FFF" />
                    <View style={styles.videoControls}>
                        <View style={styles.progressBar}>
                            <View style={[styles.progressLine, { width: '35%', backgroundColor: themeColors.primary }]} />
                        </View>
                        <View style={styles.controlInfo}>
                            <Text style={styles.timeText}>12:30 / 45:00</Text>
                            <View style={styles.rightControls}>
                                <Ionicons name="chatbox-ellipses-outline" size={20} color="#FFF" />
                                <Ionicons name="settings-outline" size={20} color="#FFF" style={{ marginLeft: 15 }} />
                                <Ionicons name="scan-outline" size={20} color="#FFF" style={{ marginLeft: 15 }} />
                            </View>
                        </View>
                    </View>
                </View>
            </View>

            <ScrollView style={styles.content}>
                <View style={styles.tabs}>
                    {['Overview', 'Lessons', 'Resources', 'Q&A'].map(tab => (
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

                {activeTab === 'Overview' && (
                    <View style={styles.tabContent}>
                        <Text style={styles.lessonTitle}>Bài 1: Giới Thiệu Pandas</Text>
                        <Text style={styles.lessonDescription}>
                            Trong bài học này, chúng ta sẽ bắt đầu làm quen với Pandas - thư viện phân tích dữ liệu hàng đầu trong Python.
                        </Text>
                        <View style={styles.divider} />
                        <Text style={styles.sectionHeading}>Bạn sẽ học được gì:</Text>
                        <View style={styles.learningPoints}>
                            {['Cách cài đặt thư viện', 'Cấu trúc Series & DataFrame', 'Đọc dữ liệu từ file CSV', 'Xử lý dữ liệu cơ bản'].map((point, idx) => (
                                <View key={idx} style={styles.pointItem}>
                                    <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
                                    <Text style={styles.pointText}>{point}</Text>
                                </View>
                            ))}
                        </View>
                    </View>
                )}

                {activeTab === 'Lessons' && (
                    <View style={styles.curriculumContainer}>
                        {SECTIONS.map((section, sIdx) => (
                            <View key={sIdx} style={styles.section}>
                                <Text style={styles.sectionTitle}>{section.title}</Text>
                                {section.lessons.map(lesson => (
                                    <TouchableOpacity key={lesson.id} style={[styles.lessonItem, lesson.active && styles.activeLesson]}>
                                        <View style={styles.lessonStatus}>
                                            {lesson.completed ? (
                                                <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
                                            ) : lesson.locked ? (
                                                <Ionicons name="lock-closed" size={20} color="#999" />
                                            ) : (
                                                <Ionicons name="play-circle-outline" size={20} color="#666" />
                                            )}
                                        </View>
                                        <View style={styles.lessonInfo}>
                                            <Text style={[styles.lessonName, lesson.active && { color: themeColors.primary }, lesson.locked && { color: '#999' }]}>
                                                {lesson.title}
                                            </Text>
                                            <Text style={styles.lessonDuration}>{lesson.duration}</Text>
                                        </View>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        ))}
                    </View>
                )}

                {activeTab === 'Resources' && (
                    <View style={styles.tabContent}>
                        <Text style={styles.sectionHeading}>Tài nguyên đính kèm:</Text>
                        {['Document.pdf', 'Code_Sample.py', 'Dataset.csv'].map((file, idx) => (
                            <TouchableOpacity key={idx} style={styles.resourceItem}>
                                <Ionicons name="download-outline" size={20} color={themeColors.primary} />
                                <Text style={styles.resourceName}>{file}</Text>
                            </TouchableOpacity>
                        ))}
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
    videoContainer: {
        width: '100%',
        aspectRatio: 16 / 9,
        backgroundColor: '#000',
    },
    videoPlayer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    videoControls: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: 15,
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    progressBar: {
        height: 3,
        backgroundColor: 'rgba(255,255,255,0.3)',
        borderRadius: 2,
        marginBottom: 10,
    },
    progressLine: {
        height: '100%',
        borderRadius: 2,
    },
    controlInfo: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    timeText: {
        color: '#FFF',
        fontSize: 12,
    },
    rightControls: {
        flexDirection: 'row',
    },
    content: {
        flex: 1,
    },
    tabs: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderBottomColor: '#EEE',
        backgroundColor: '#FFF',
    },
    tab: {
        flex: 1,
        paddingVertical: 14,
        alignItems: 'center',
        borderBottomWidth: 2,
        borderBottomColor: 'transparent',
    },
    tabText: {
        fontSize: 13,
        color: '#666',
    },
    tabContent: {
        padding: 20,
    },
    lessonTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 10,
    },
    lessonDescription: {
        fontSize: 14,
        color: '#666',
        lineHeight: 22,
        marginBottom: 20,
    },
    divider: {
        height: 1,
        backgroundColor: '#EEE',
        marginBottom: 20,
    },
    sectionHeading: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 12,
    },
    learningPoints: {
        gap: 10,
    },
    pointItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    pointText: {
        fontSize: 14,
        color: '#444',
    },
    curriculumContainer: {
        padding: 20,
    },
    section: {
        marginBottom: 20,
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 12,
        backgroundColor: '#F5F5F5',
        padding: 8,
        borderRadius: 4,
    },
    lessonItem: {
        flexDirection: 'row',
        paddingVertical: 12,
        paddingHorizontal: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#F5F5F5',
        alignItems: 'center',
    },
    activeLesson: {
        backgroundColor: 'rgba(29, 58, 138, 0.05)',
    },
    lessonStatus: {
        width: 30,
    },
    lessonInfo: {
        flex: 1,
        marginLeft: 10,
    },
    lessonName: {
        fontSize: 14,
        fontWeight: '500',
        color: '#444',
    },
    lessonDuration: {
        fontSize: 11,
        color: '#999',
        marginTop: 2,
    },
    resourceItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        backgroundColor: '#F9FAFB',
        borderRadius: 8,
        marginBottom: 10,
        gap: 10,
        borderWidth: 1,
        borderColor: '#EEE',
    },
    resourceName: {
        fontSize: 14,
        color: '#1B47A4',
        fontWeight: '500',
    },
});
