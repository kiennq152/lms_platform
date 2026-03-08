import React, { useState } from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const PAYMENT_METHODS = [
    { id: 'card', label: 'Thẻ Tín dụng/Ghi nợ', icon: 'credit-card-outline' },
    { id: 'ewallet', label: 'Ví điện tử (Momo, ZaloPay)', icon: 'wallet-outline' },
    { id: 'bank', label: 'Chuyển khoản ngân hàng', icon: 'bank-outline' },
];

export default function CheckoutScreen() {
    const [paymentMethod, setPaymentMethod] = useState('card');
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        address: '',
    });
    const colorScheme = useColorScheme();
    const themeColors = Colors[colorScheme ?? 'light'];
    const router = useRouter();

    const handlePlaceOrder = () => {
        alert('✓ Đặt hàng thành công! Kiểm tra email để xem chi tiết.');
        router.replace('/(tabs)');
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={[styles.container, { backgroundColor: themeColors.background }]}
        >
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()}>
                    <Ionicons name="arrow-back" size={24} color={themeColors.text} />
                </TouchableOpacity>
                <Text style={[styles.title, { color: themeColors.text }]}>Thanh toán</Text>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Chi tiết thanh toán</Text>
                    <Input
                        label="Họ và tên"
                        placeholder="John Doe"
                        value={formData.name}
                        onChangeText={(text) => setFormData({ ...formData, name: text })}
                    />
                    <Input
                        label="Địa chỉ Email"
                        placeholder="you@example.com"
                        value={formData.email}
                        onChangeText={(text) => setFormData({ ...formData, email: text })}
                        keyboardType="email-address"
                    />
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Phương thức thanh toán</Text>
                    {PAYMENT_METHODS.map((method) => (
                        <TouchableOpacity
                            key={method.id}
                            style={[
                                styles.paymentOption,
                                paymentMethod === method.id && { borderColor: themeColors.primary, backgroundColor: '#F9FAFB' }
                            ]}
                            onPress={() => setPaymentMethod(method.id)}
                        >
                            <MaterialCommunityIcons
                                name={method.icon as any}
                                size={22}
                                color={paymentMethod === method.id ? themeColors.primary : '#666'}
                            />
                            <Text style={[
                                styles.paymentLabel,
                                paymentMethod === method.id && { color: themeColors.primary, fontWeight: 'bold' }
                            ]}>
                                {method.label}
                            </Text>
                            {paymentMethod === method.id && (
                                <Ionicons name="checkmark-circle" size={20} color={themeColors.primary} />
                            )}
                        </TouchableOpacity>
                    ))}
                </View>

                {paymentMethod === 'card' && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Thông tin thẻ</Text>
                        <Input label="Số thẻ" placeholder="0000 0000 0000 0000" />
                        <View style={styles.row}>
                            <View style={{ flex: 1 }}>
                                <Input label="Hết hạn" placeholder="MM/YY" />
                            </View>
                            <View style={{ width: 20 }} />
                            <View style={{ flex: 1 }}>
                                <Input label="CVC" placeholder="000" />
                            </View>
                        </View>
                    </View>
                )}

                <View style={styles.summaryBox}>
                    <View style={styles.summaryRow}>
                        <Text style={styles.summaryLabel}>Tạm tính</Text>
                        <Text style={styles.summaryValue}>7.000.000₫</Text>
                    </View>
                    <View style={[styles.summaryRow, styles.totalRow]}>
                        <Text style={styles.totalLabel}>TỔNG CỘNG</Text>
                        <Text style={[styles.totalValue, { color: themeColors.primary }]}>7.000.000₫</Text>
                    </View>
                </View>

                <Text style={styles.termsText}>
                    Tôi đồng ý với <Text style={styles.link}>Điều khoản Dịch vụ</Text> và <Text style={styles.link}>Chính sách Bảo mật</Text>.
                </Text>
            </ScrollView>

            <View style={styles.footer}>
                <Button
                    title="Đặt hàng ngay"
                    onPress={handlePlaceOrder}
                    disabled={!formData.name || !formData.email}
                />
            </View>
        </KeyboardAvoidingView>
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
        paddingBottom: 100,
    },
    section: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: '900',
        color: '#333',
        marginBottom: 16,
        textTransform: 'uppercase',
    },
    paymentOption: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: '#EEE',
        marginBottom: 10,
        gap: 12,
    },
    paymentLabel: {
        flex: 1,
        fontSize: 14,
        color: '#444',
    },
    row: {
        flexDirection: 'row',
    },
    summaryBox: {
        backgroundColor: '#F9FAFB',
        padding: 20,
        borderRadius: 12,
        marginBottom: 20,
    },
    summaryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 10,
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
        marginTop: 10,
        paddingTop: 10,
        borderTopWidth: 1,
        borderTopColor: '#EEE',
    },
    totalLabel: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
    },
    totalValue: {
        fontSize: 20,
        fontWeight: '900',
    },
    termsText: {
        fontSize: 12,
        color: '#999',
        textAlign: 'center',
        lineHeight: 18,
    },
    link: {
        color: '#1B47A4',
        fontWeight: 'bold',
    },
    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: '#FFF',
        padding: 20,
        paddingBottom: 30,
        borderTopWidth: 1,
        borderTopColor: '#EEE',
    },
});
