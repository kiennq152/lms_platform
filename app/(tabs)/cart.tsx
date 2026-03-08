import React, { useState } from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, Image, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '@/components/ui/button';

const INITIAL_CART = [
    {
        id: '1',
        name: 'Lập trình viên Full-stack chuyên nghiệp - Xuất khẩu lao động Hàn Quốc',
        instructor: 'VIAN Academy',
        price: 4500000,
        image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCJ-T57G7JjeuAeMNcRJUAnbAg2wrr-flAR1mmZvHD81pMM6jXSEijB3UB7MZ_hFNHpAE8Ydc7MZ9iD-wQ7Ln6-Wlvv2qky1mPxajy1MftbmmOzosrFoT41PsQosprW5P0xdCB1hZXoQrcJPNwWDx8zwbeQ-COyTQP5pL8-rNJODaSwIPNjhWabiTG1Fc_LLrF8Kr9v4A6OqnKgOtHNSlT0L5-r4k3clNZjA2_Ouf0gsP0HVNw9_9nNRnPaj-zAglhIxs0D1Io5ens',
    },
    {
        id: '2',
        name: 'Advanced Python for Data Science',
        instructor: 'Dr. Angela Yu',
        price: 2500000,
        image: 'https://images.unsplash.com/photo-1517430816045-df4b7de11d1d?auto=format&fit=crop&w=900&q=80',
    }
];

export default function CartScreen() {
    const [cart, setCart] = useState(INITIAL_CART);
    const [coupon, setCoupon] = useState('');
    const colorScheme = useColorScheme();
    const themeColors = Colors[colorScheme ?? 'light'];
    const router = useRouter();

    const subtotal = cart.reduce((sum, item) => sum + item.price, 0);
    const discount = 0; // Simple for now
    const total = subtotal - discount;

    const removeItem = (id: string) => {
        setCart(cart.filter(item => item.id !== id));
    };

    const formatCurrency = (amount: number) => {
        return amount.toLocaleString('vi-VN') + '₫';
    };

    if (cart.length === 0) {
        return (
            <View style={[styles.container, styles.emptyContainer, { backgroundColor: themeColors.background }]}>
                <Ionicons name="cart-outline" size={80} color="#CCC" />
                <Text style={styles.emptyTitle}>Giỏ hàng trống</Text>
                <Text style={styles.emptySubtitle}>Hãy khám phá các khóa học thú vị và bắt đầu học ngay hôm nay!</Text>
                <Button
                    title="Khám phá khóa học"
                    onPress={() => router.push('/courses')}
                    style={styles.browseBtn}
                />
            </View>
        );
    }

    return (
        <View style={[styles.container, { backgroundColor: themeColors.background }]}>
            <View style={styles.header}>
                <Text style={[styles.title, { color: themeColors.text }]}>Giỏ hàng ({cart.length})</Text>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.itemsList}>
                    {cart.map(item => (
                        <View key={item.id} style={styles.itemCard}>
                            <Image source={{ uri: item.image }} style={styles.itemImage} />
                            <View style={styles.itemInfo}>
                                <Text style={styles.itemName} numberOfLines={2}>{item.name}</Text>
                                <Text style={styles.itemInstructor}>{item.instructor}</Text>
                                <View style={styles.itemFooter}>
                                    <Text style={[styles.itemPrice, { color: themeColors.primary }]}>{formatCurrency(item.price)}</Text>
                                    <TouchableOpacity onPress={() => removeItem(item.id)}>
                                        <Ionicons name="trash-outline" size={20} color="#999" />
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </View>
                    ))}
                </View>

                <View style={styles.couponSection}>
                    <TextInput
                        style={styles.couponInput}
                        placeholder="Mã giảm giá"
                        value={coupon}
                        onChangeText={setCoupon}
                        placeholderTextColor="#999"
                    />
                    <TouchableOpacity style={[styles.couponBtn, { backgroundColor: '#EEE' }]}>
                        <Text style={styles.couponBtnText}>Áp dụng</Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.summaryContainer}>
                    <Text style={styles.summaryTitle}>Tóm tắt đơn hàng</Text>
                    <View style={styles.summaryRow}>
                        <Text style={styles.summaryLabel}>Tạm tính</Text>
                        <Text style={styles.summaryValue}>{formatCurrency(subtotal)}</Text>
                    </View>
                    <View style={styles.summaryRow}>
                        <Text style={styles.summaryLabel}>Giảm giá</Text>
                        <Text style={[styles.summaryValue, { color: '#4CAF50' }]}>-{formatCurrency(discount)}</Text>
                    </View>
                    <View style={[styles.summaryRow, styles.totalRow]}>
                        <Text style={styles.totalLabel}>TỔNG CỘNG</Text>
                        <Text style={[styles.totalValue, { color: themeColors.primary }]}>{formatCurrency(total)}</Text>
                    </View>
                </View>
            </ScrollView>

            <View style={styles.footer}>
                <Button
                    title="Thanh toán"
                    onPress={() => router.push('/(details)/checkout')}
                    style={styles.checkoutBtn}
                />
            </View>
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
        backgroundColor: '#FFF',
        borderBottomWidth: 1,
        borderBottomColor: '#EEE',
    },
    title: {
        fontSize: 22,
        fontWeight: 'bold',
    },
    emptyContainer: {
        justifyContent: 'center',
        alignItems: 'center',
        padding: 40,
    },
    emptyTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginTop: 20,
        color: '#333',
    },
    emptySubtitle: {
        fontSize: 14,
        color: '#666',
        textAlign: 'center',
        marginTop: 8,
        lineHeight: 20,
    },
    browseBtn: {
        marginTop: 24,
        width: '100%',
    },
    scrollContent: {
        padding: 20,
        paddingBottom: 100,
    },
    itemsList: {
        gap: 16,
        marginBottom: 24,
    },
    itemCard: {
        flexDirection: 'row',
        backgroundColor: '#FFF',
        borderRadius: 12,
        padding: 12,
        borderWidth: 1,
        borderColor: '#EEE',
    },
    itemImage: {
        width: 100,
        height: 70,
        borderRadius: 8,
    },
    itemInfo: {
        flex: 1,
        marginLeft: 12,
    },
    itemName: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#333',
        lineHeight: 18,
    },
    itemInstructor: {
        fontSize: 12,
        color: '#666',
        marginTop: 2,
    },
    itemFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 8,
    },
    itemPrice: {
        fontSize: 15,
        fontWeight: 'bold',
    },
    couponSection: {
        flexDirection: 'row',
        gap: 10,
        marginBottom: 24,
    },
    couponInput: {
        flex: 1,
        backgroundColor: '#F5F5F5',
        borderRadius: 8,
        paddingHorizontal: 16,
        paddingVertical: 10,
        fontSize: 14,
    },
    couponBtn: {
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 8,
        justifyContent: 'center',
    },
    couponBtnText: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#333',
    },
    summaryContainer: {
        backgroundColor: '#FFF',
        borderRadius: 12,
        padding: 16,
        borderWidth: 1,
        borderColor: '#EEE',
    },
    summaryTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 16,
        color: '#333',
    },
    summaryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 12,
    },
    summaryLabel: {
        fontSize: 14,
        color: '#666',
    },
    summaryValue: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#333',
    },
    totalRow: {
        marginTop: 12,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: '#EEE',
    },
    totalLabel: {
        fontSize: 16,
        fontWeight: '900',
        color: '#333',
    },
    totalValue: {
        fontSize: 18,
        fontWeight: '900',
    },
    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: '#FFF',
        padding: 20,
        paddingBottom: 30, // Extra for safe area
        borderTopWidth: 1,
        borderTopColor: '#EEE',
    },
    checkoutBtn: {
        width: '100%',
        backgroundColor: '#D84A4A',
    },
});
