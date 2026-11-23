import React, { useState } from 'react';
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { notify, errorMessage } from '@/lib/notify';
import { homeForRole } from '@/lib/auth';

export default function VerifyOtpScreen() {
    // next=change-password is used by the "Quên mật khẩu" flow (FR-003).
    const { email, next } = useLocalSearchParams<{ email: string; next?: string }>();
    const [token, setToken] = useState('');
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    async function verifyOtp() {
        if (!token) {
            notify('Thiếu mã', 'Vui lòng nhập mã xác thực đã gửi tới email.');
            return;
        }
        setLoading(true);
        const { error, data } = await supabase.auth.verifyOtp({
            email: email,
            token: token.trim(),
            type: 'email',
        });

        if (error) {
            notify('Xác thực thất bại', errorMessage(error));
            setLoading(false);
            return;
        }

        if (data.user) {
            if (next === 'change-password') {
                router.replace({ pathname: '/(details)/change-password' as any, params: { reset: '1' } });
                setLoading(false);
                return;
            }
            const { data: profile } = await supabase
                .from('users')
                .select('role')
                .eq('id', data.user.id)
                .maybeSingle();
            router.replace(homeForRole(profile?.role) as any);
        }
        setLoading(false);
    }

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.container}
        >
            <ScrollView contentContainerStyle={styles.scrollContainer}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Text style={styles.backButtonText}>← Quay lại đăng nhập</Text>
                </TouchableOpacity>

                <View style={styles.header}>
                    <Text style={styles.title}>{next === 'change-password' ? 'Khôi phục mật khẩu' : 'Xác thực email'}</Text>
                    <Text style={styles.description}>
                        Chúng tôi đã gửi mã xác thực tới{"\n"}
                        <Text style={styles.emailText}>{email}</Text>
                    </Text>
                </View>

                <View style={styles.form}>
                    <Input
                        label="Mã xác thực"
                        placeholder="123456"
                        value={token}
                        onChangeText={setToken}
                        keyboardType="number-pad"
                        maxLength={8}
                    />

                    <Button
                        title={next === 'change-password' ? 'Xác thực & đặt mật khẩu mới' : 'Xác thực & đăng nhập'}
                        onPress={verifyOtp}
                        loading={loading}
                        style={styles.verifyButton}
                    />

                    <TouchableOpacity
                        style={styles.resendButton}
                        onPress={async () => {
                            const { error } = await supabase.auth.signInWithOtp({ email, options: { shouldCreateUser: false } });
                            notify(error ? 'Lỗi' : 'Đã gửi lại mã', error ? errorMessage(error) : 'Vui lòng kiểm tra hộp thư.');
                        }}
                    >
                        <Text style={styles.resendText}>Chưa nhận được mã? Gửi lại</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8F9FA',
    },
    scrollContainer: {
        flexGrow: 1,
        padding: 24,
        justifyContent: 'center',
    },
    backButton: {
        position: 'absolute',
        top: 60,
        left: 24,
    },
    backButtonText: {
        color: '#1B47A4',
        fontSize: 16,
        fontWeight: '600',
    },
    header: {
        alignItems: 'center',
        marginBottom: 40,
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 12,
    },
    description: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
        lineHeight: 24,
    },
    emailText: {
        color: '#1B47A4',
        fontWeight: 'bold',
    },
    form: {
        backgroundColor: '#FFFFFF',
        padding: 24,
        borderRadius: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
    },
    verifyButton: {
        marginTop: 24,
        backgroundColor: '#1B47A4',
    },
    resendButton: {
        marginTop: 24,
        alignItems: 'center',
    },
    resendText: {
        color: '#666',
        fontSize: 14,
    },
});
