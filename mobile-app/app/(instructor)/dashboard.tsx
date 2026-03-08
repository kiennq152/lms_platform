import React from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Button } from '@/components/ui/button';

const { width } = Dimensions.get('window');

const STATS = [
    { label: 'Total Revenue', value: '$12,850', change: '+5.2%', color: '#1B47A4' },
    { label: 'New Enrollments', value: '256', change: '+10.1%', color: '#D84A4A' },
    { label: 'Active Courses', value: '12', change: '', color: '#333' },
    { label: 'Pending Reviews', value: '8', change: '', color: '#333' },
];

const RECENT_ACTIVITY = [
    { id: '1', message: 'John Doe enrolled in "Advanced CSS"', time: '5 mins ago', icon: 'account-plus', color: '#1B47A4' },
    { id: '2', message: 'You\'ve received a payment of $49.99', time: '1 hour ago', icon: 'currency-usd', color: '#4CAF50' },
    { id: '3', message: 'Jane Smith left a 5-star review', time: '3 hours ago', icon: 'star', color: '#FFD700' },
];

const MANAGED_COURSES = [
    { id: '1', title: 'Lập trình Web Full-stack', students: 1245, price: '$99.99', status: 'Published' },
    { id: '2', title: 'UI/UX Design Masterclass', students: 843, price: '$79.99', status: 'Published' },
    { id: '3', title: 'Advanced React patterns', students: 0, price: '$119.99', status: 'Draft' },
];

export default function InstructorDashboard() {
    const colorScheme = useColorScheme();
    const themeColors = Colors[colorScheme ?? 'light'];
    const router = useRouter();

    return (
        <ScrollView style={[styles.container, { backgroundColor: themeColors.background }]}>
            <View style={styles.header}>
                <View>
                    <Text style={[styles.welcomeText, { color: themeColors.text }]}>Welcome back, Instructor!</Text>
                    <Text style={styles.subtitle}>Snapshot of your performance</Text>
                </View>
                <Button
                    title="New Course"
                    onPress={() => { }}
                    style={styles.newCourseBtn}
                    textStyle={{ fontSize: 13 }}
                />
            </View>

            {/* Stats Grid */}
            <View style={styles.statsGrid}>
                {STATS.map((stat, index) => (
                    <View key={index} style={[styles.statCard, index === 0 && { backgroundColor: themeColors.secondary }]}>
                        <Text style={[styles.statLabel, index === 0 && { color: 'rgba(255,255,255,0.7)' }]}>{stat.label}</Text>
                        <Text style={[styles.statValue, index === 0 && { color: '#FFF' }]}>{stat.value}</Text>
                        {stat.change ? (
                            <Text style={[styles.statChange, { color: index === 0 ? '#4CAF50' : '#4CAF50' }]}>{stat.change}</Text>
                        ) : null}
                    </View>
                ))}
            </View>

            {/* Chart Placeholder */}
            <View style={styles.section}>
                <View style={styles.chartContainer}>
                    <Text style={styles.chartTitle}>Monthly Revenue</Text>
                    <View style={styles.chartBars}>
                        {[40, 75, 90, 60, 45, 80].map((height, i) => (
                            <View key={i} style={styles.chartBarWrapper}>
                                <View style={[styles.chartBar, { height: `${height}%`, backgroundColor: i === 2 ? themeColors.primary : '#E0E0E0' }]} />
                                <Text style={styles.chartAxis}>W{i + 1}</Text>
                            </View>
                        ))}
                    </View>
                </View>
            </View>

            {/* Recent Activity */}
            <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: themeColors.text }]}>RECENT ACTIVITY</Text>
                <View style={styles.activityList}>
                    {RECENT_ACTIVITY.map(item => (
                        <View key={item.id} style={styles.activityItem}>
                            <View style={[styles.activityIcon, { backgroundColor: `${item.color}20` }]}>
                                <MaterialCommunityIcons name={item.icon as any} size={20} color={item.color} />
                            </View>
                            <View style={styles.activityInfo}>
                                <Text style={styles.activityText}>{item.message}</Text>
                                <Text style={styles.activityTime}>{item.time}</Text>
                            </View>
                        </View>
                    ))}
                </View>
            </View>

            {/* Manage Courses */}
            <View style={styles.section}>
                <View style={styles.sectionHeader}>
                    <Text style={[styles.sectionTitle, { color: themeColors.text }]}>MANAGE COURSES</Text>
                    <TouchableOpacity onPress={() => { }}>
                        <Text style={[styles.seeAll, { color: themeColors.primary }]}>View all</Text>
                    </TouchableOpacity>
                </View>
                <View style={styles.courseTable}>
                    {MANAGED_COURSES.map(course => (
                        <View key={course.id} style={styles.courseRow}>
                            <View style={styles.courseMain}>
                                <Text style={styles.courseTitle}>{course.title}</Text>
                                <Text style={styles.courseDetail}>{course.students} students • {course.price}</Text>
                            </View>
                            <View style={[styles.statusBadge, { backgroundColor: course.status === 'Published' ? '#E8F5E9' : '#FFF3E0' }]}>
                                <Text style={[styles.statusText, { color: course.status === 'Published' ? '#2E7D32' : '#EF6C00' }]}>
                                    {course.status}
                                </Text>
                            </View>
                        </View>
                    ))}
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
    header: {
        paddingTop: 60,
        paddingHorizontal: 20,
        paddingBottom: 24,
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
    newCourseBtn: {
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 8,
    },
    statsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        paddingHorizontal: 14,
        marginBottom: 24,
    },
    statCard: {
        width: (width - 40) / 2 - 6,
        margin: 6,
        backgroundColor: '#FFF',
        padding: 16,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#EEE',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 2,
    },
    statLabel: {
        fontSize: 12,
        color: '#666',
        marginBottom: 8,
    },
    statValue: {
        fontSize: 20,
        fontWeight: '900',
        color: '#333',
    },
    statChange: {
        fontSize: 11,
        fontWeight: 'bold',
        marginTop: 4,
    },
    section: {
        paddingHorizontal: 20,
        marginBottom: 32,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: '900',
        color: '#333',
        letterSpacing: 1,
    },
    seeAll: {
        fontSize: 13,
        fontWeight: 'bold',
    },
    chartContainer: {
        backgroundColor: '#FFF',
        padding: 20,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#EEE',
    },
    chartTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 20,
    },
    chartBars: {
        flexDirection: 'row',
        height: 150,
        alignItems: 'flex-end',
        justifyContent: 'space-between',
    },
    chartBarWrapper: {
        alignItems: 'center',
        width: 30,
    },
    chartBar: {
        width: 20,
        borderRadius: 4,
    },
    chartAxis: {
        fontSize: 10,
        color: '#999',
        marginTop: 8,
    },
    activityList: {
        backgroundColor: '#FFF',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#EEE',
        padding: 16,
    },
    activityItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#F5F5F5',
    },
    activityIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    activityInfo: {
        flex: 1,
        marginLeft: 12,
    },
    activityText: {
        fontSize: 13,
        color: '#333',
        fontWeight: '500',
    },
    activityTime: {
        fontSize: 11,
        color: '#999',
        marginTop: 2,
    },
    courseTable: {
        backgroundColor: '#FFF',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#EEE',
        overflow: 'hidden',
    },
    courseRow: {
        flexDirection: 'row',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#EEE',
        alignItems: 'center',
    },
    courseMain: {
        flex: 1,
    },
    courseTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#333',
    },
    courseDetail: {
        fontSize: 12,
        color: '#666',
        marginTop: 2,
    },
    statusBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
    },
    statusText: {
        fontSize: 10,
        fontWeight: 'bold',
    },
});
