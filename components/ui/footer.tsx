import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking, Platform } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export function Footer() {
    const colorScheme = useColorScheme();
    const themeColors = Colors[colorScheme ?? 'light'];

    const handleOpenFacebook = () => {
        Linking.openURL('https://www.facebook.com/vianedu');
    };

    return (
        <View style={[styles.container, { backgroundColor: '#F8F9FA', borderTopColor: '#EEE' }]}>
            <View style={styles.content}>
                <View style={styles.companyInfo}>
                    <Text style={[styles.companyName, { color: themeColors.secondary }]}>
                        VIAN Academy
                    </Text>
                    <TouchableOpacity onPress={() => Linking.openURL('https://viansolution.com/edu')}>
                        <Text style={[styles.contactText, { color: themeColors.primary, marginBottom: 4, fontWeight: 'bold' }]}>
                            🌐 viansolution.com/edu
                        </Text>
                    </TouchableOpacity>
                    <Text style={styles.contactText}>
                        ✉️ viansolutions.kr@gmail.com
                    </Text>
                    <Text style={styles.contactText}>
                        🇻🇳 Hotline VN: 0988 917 990
                    </Text>
                    <Text style={styles.contactText}>
                        🇰🇷 Hotline KR: 010 8688 1590
                    </Text>
                </View>

                <View style={styles.socialSection}>
                    <Text style={styles.socialLabel}>Kết nối với chúng tôi:</Text>
                    <View style={styles.socialIcons}>
                        <TouchableOpacity onPress={handleOpenFacebook} style={styles.iconButton}>
                            <MaterialCommunityIcons name="facebook" size={28} color="#1877F2" />
                        </TouchableOpacity>
                        {/* You can add more icons here like YouTube, LinkedIn, etc. */}
                    </View>
                </View>
            </View>

            <View style={styles.bottomBar}>
                <Text style={styles.copyrightText}>
                    &copy; {new Date().getFullYear()} VIAN Solution. All rights reserved.
                </Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        width: '100%',
        paddingTop: 32,
        borderTopWidth: 1,
        // Ensure the footer doesn't get hidden behind the floating absolute bottom bar
        paddingBottom: Platform.OS === 'web' ? 100 : 40,
    },
    content: {
        flexDirection: Platform.select({ web: 'row', default: 'column' }) as any,
        justifyContent: 'space-between',
        paddingHorizontal: 24,
        marginBottom: 24,
        gap: 24,
    },
    companyInfo: {
        flex: 1,
    },
    companyName: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 8,
    },
    addressText: {
        fontSize: 14,
        color: '#666',
        marginBottom: 4,
        lineHeight: 20,
    },
    contactText: {
        fontSize: 14,
        color: '#666',
        lineHeight: 20,
    },
    socialSection: {
        alignItems: Platform.select({ web: 'flex-end', default: 'flex-start' }) as any,
    },
    socialLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#333',
        marginBottom: 12,
    },
    socialIcons: {
        flexDirection: 'row',
        gap: 16,
    },
    iconButton: {
        padding: 4,
    },
    bottomBar: {
        paddingVertical: 16,
        paddingHorizontal: 24,
        backgroundColor: 'rgba(0,0,0,0.02)',
        alignItems: 'center',
    },
    copyrightText: {
        fontSize: 12,
        color: '#999',
    },
});
