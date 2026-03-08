import React from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

const OVERVIEW_STATS = [
    { label: 'Total Revenue', value: '$125,430', change: '+2.5%', icon: 'trending-up', color: '#4CAF50' },
    { label: 'New Users', value: '82', change: '+5.1%', icon: 'account-plus', color: '#2196F3' },
    { label: 'Courses Pending', value: '15', change: 'Awaiting', icon: 'clock-outline', color: '#FFB300' },
    { label: 'System Errors', value: '3', change: 'Attention', icon: 'alert-circle-outline', color: '#F44336' },
];

const ACTIVITIES = [
    { id: '1', user: 'John Doe', email: 'john.doe@example.com', action: 'Submitted a new course for review', status: 'Pending', time: '2 hours ago', color: '#FFB300' },
    { id: '2', user: 'Jane Smith', email: 'jane.smith@example.com', action: 'Completed a transaction of $49.99', status: 'Success', time: '5 hours ago', color: '#4CAF50' },
    { id: '3', user: 'Mike Johnson', email: 'mike.j@example.com', action: 'Account login failed (3 attempts)', status: 'Locked', time: 'Yesterday', color: '#F44336' },
];

export default function AdminDashboard() {
    const colorScheme = useColorScheme();
    const themeColors = Colors[colorScheme ?? 'light'];
    const router = useRouter();

    return (
        <ScrollView style={[styles.container, { backgroundColor: themeColors.background }]}>
            <View style={styles.header}>
                <View>
                    <Text style={[styles.welcomeText, { color: themeColors.text }]}>Admin Dashboard</Text>
                    <Text style={styles.subtitle}>Welcome back, Super Admin!</Text>
                </View>
                <TouchableOpacity style={styles.notificationBtn}>
                    <Ionicons name="notifications-outline" size={24} color={themeColors.text} />
                </TouchableOpacity>
            </View>

            {/* Overview Stats */}
            <View style={styles.statsGrid}>
                {OVERVIEW_STATS.map((stat, index) => (
                    <View key={index} style={styles.statCard}>
                        <View style={styles.statHeader}>
                            <Text style={styles.statLabel}>{stat.label}</Text>
                            <MaterialCommunityIcons name={stat.icon as any} size={18} color={stat.color} />
                        </View>
                        <Text style={[styles.statValue, { color: themeColors.text }]}>{stat.value}</Text>
                        <Text style={[styles.statChange, { color: stat.color }]}>{stat.change}</Text>
                    </View>
                ))}
            </View>

            {/* Revenue Chart Placeholder */}
            <View style={styles.section}>
                <View style={styles.chartContainer}>
                    <Text style={styles.chartTitle}>Revenue Over Time</Text>
                    <View style={styles.chartContent}>
                        <View style={styles.chartBars}>
                            {[60, 40, 80, 50, 90, 70, 85].map((h, i) => (
                                <View key={i} style={[styles.chartBar, { height: `${h}%`, backgroundColor: themeColors.primary }]} />
                            ))}
                        </View>
                    </View>
                </View>
            </View>

            {/* Course Distribution */}
            <View style={styles.section}>
                <View style={styles.chartContainer}>
                    <Text style={styles.chartTitle}>Course Status Distribution</Text>
                    <View style={styles.pieContainer}>
                        <View style={styles.piePlaceholder}>
                            <View style={[styles.pieSegment, { backgroundColor: themeColors.primary, transform: [{ rotate: '0deg' }] }]} />
                            <View style={[styles.pieSegment, { backgroundColor: themeColors.secondary, transform: [{ rotate: '120deg' }] }]} />
                            <View style={[styles.pieSegment, { backgroundColor: '#FFD700', transform: [{ rotate: '240deg' }] }]} />
                            <View style={styles.pieCenter}>
                                <Text style={styles.pieValue}>1,520</Text>
                                <Text style={styles.pieLabel}>Total</Text>
                            </View>
                        </View>
                        <View style={styles.legend}>
                            <View style={styles.legendItem}><View style={[styles.dot, { backgroundColor: themeColors.secondary }]} /><Text style={styles.legendText}>Approved (75%)</Text></View>
                            <View style={styles.legendItem}><View style={[styles.dot, { backgroundColor: '#FFD700' }]} /><Text style={styles.legendText}>Pending (15%)</Text></View>
                            <View style={styles.legendItem}><View style={[styles.dot, { backgroundColor: themeColors.primary }]} /><Text style={styles.legendText}>Rejected (10%)</Text></View>
                        </View>
                    </View>
                </View>
            </View>

            {/* Recent Activities */}
            <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: themeColors.text }]}>RECENT USER ACTIVITIES</Text>
                <View style={styles.activityList}>
                    {ACTIVITIES.map(activity => (
                        <View key={activity.id} style={styles.activityItem}>
                            <View style={styles.activityHeader}>
                                <View style={styles.userInfo}>
                                    <Text style={styles.userName}>{activity.user}</Text>
                                    <Text style={styles.userEmail}>{activity.email}</Text>
                                </View>
                                <View style={[styles.statusBadge, { backgroundColor: `${activity.color}15` }]}>
                                    <Text style={[styles.statusText, { color: activity.color }]}>{activity.status}</Text>
                                </View>
                            </View>
                            <Text style={styles.activityAction}>{activity.action}</Text>
                            <Text style={styles.activityTime}>{activity.time}</Text>
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
        padding: 8,
        backgroundColor: '#F0F0F0',
        borderRadius: 20,
    },
    statsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        paddingHorizontal: 15,
        marginBottom: 20,
    },
    statCard: {
        width: (width - 40) / 2 - 10,
        margin: 5,
        backgroundColor: '#FFF',
        padding: 15,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#EEE',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    statHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    statLabel: {
        fontSize: 12,
        color: '#666',
        fontWeight: '600',
    },
    statValue: {
        fontSize: 22,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    statChange: {
        fontSize: 11,
        fontWeight: 'bold',
    },
    section: {
        paddingHorizontal: 20,
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: '900',
        marginBottom: 16,
        letterSpacing: 1,
    },
    chartContainer: {
        backgroundColor: '#FFF',
        borderRadius: 16,
        padding: 20,
        borderWidth: 1,
        borderColor: '#EEE',
        elevation: 1,
    },
    chartTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 20,
        color: '#333',
    },
    chartContent: {
        height: 150,
        justifyContent: 'flex-end',
    },
    chartBars: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        justifyContent: 'space-between',
        height: '100%',
    },
    chartBar: {
        width: 25,
        borderRadius: 6,
        opacity: 0.8,
    },
    pieContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-around',
    },
    piePlaceholder: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: '#EEE',
        overflow: 'hidden',
        justifyContent: 'center',
        alignItems: 'center',
    },
    pieSegment: {
        position: 'absolute',
        width: '100%',
        height: '100%',
    },
    pieCenter: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: '#FFF',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 10,
    },
    pieValue: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    pieLabel: {
        fontSize: 10,
        color: '#999',
    },
    legend: {
        gap: 8,
    },
    legendItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    dot: {
        width: 10,
        height: 10,
        borderRadius: 5,
    },
    legendText: {
        fontSize: 12,
        color: '#666',
    },
    activityList: {
        gap: 12,
    },
    activityItem: {
        backgroundColor: '#FFF',
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: '#EEE',
    },
    activityHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 8,
    },
    userInfo: {},
    userName: {
        fontSize: 15,
        fontWeight: 'bold',
        color: '#333',
    },
    userEmail: {
        fontSize: 12,
        color: '#999',
    },
    statusBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
    },
    statusText: {
        fontSize: 10,
        fontWeight: 'bold',
    },
    activityAction: {
        fontSize: 14,
        color: '#444',
        marginBottom: 4,
    },
    activityTime: {
        fontSize: 11,
        color: '#BBB',
    },
});
