import React, { useState } from 'react';
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter, Link } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { notify, errorMessage } from '@/lib/notify';
import { homeForRole } from '@/lib/auth';

export default function LoginScreen() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    async function signInWithEmail() {
        if (!email || !password) {
            notify('Thiếu thông tin', 'Vui lòng nhập email và mật khẩu.');
            return;
        }
        setLoading(true);
        const { error, data } = await supabase.auth.signInWithPassword({
            email: email.trim(),
            password: password,
        });

        if (error) {
            notify('Đăng nhập thất bại', errorMessage(error));
            setLoading(false);
            return;
        }

        if (data.user) {
            const { data: profile } = await supabase
                .from('users')
                .select('role, status')
                .eq('id', data.user.id)
                .maybeSingle();

            if (profile?.status === 'suspended') {
                // AuthProvider signs suspended users out and tells them why.
                setLoading(false);
                return;
            }
            router.replace(homeForRole(profile?.role) as any);
        }
        setLoading(false);
    }

    async function sendOtp(next?: 'change-password') {
        if (!email) {
            notify('Thiếu email', 'Vui lòng nhập địa chỉ email trước.');
            return;
        }
        setLoading(true);
        const { error } = await supabase.auth.signInWithOtp({
            email: email.trim(),
            options: { shouldCreateUser: false },
        });
        setLoading(false);

        if (error) {
            notify('Không gửi được mã', errorMessage(error));
            return;
        }

        notify('Đã gửi mã', 'Vui lòng kiểm tra email để lấy mã xác thực.');
        router.push({
            pathname: '/(auth)/verify-otp' as any,
            params: next ? { email: email.trim(), next } : { email: email.trim() },
        });
    }

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.container}
        >
            <ScrollView contentContainerStyle={styles.scrollContainer}>
                <View style={styles.header}>
                    <Text style={styles.title}>VIAN Academy</Text>
                    <Text style={styles.subtitle}>Chào mừng trở lại</Text>
                    <Text style={styles.description}>Đăng nhập để tiếp tục học tập</Text>
                </View>

                <View style={styles.form}>
                    <Input
                        label="Email"
                        placeholder="email@example.com"
                        value={email}
                        onChangeText={setEmail}
                        autoCapitalize="none"
                        keyboardType="email-address"
                    />
                    <Input
                        label="Mật khẩu"
                        placeholder="Nhập mật khẩu"
                        value={password}
                        onChangeText={setPassword}
                        secureTextEntry
                        onSubmitEditing={signInWithEmail}
                    />

                    <TouchableOpacity style={styles.forgotPassword} onPress={() => sendOtp('change-password')}>
                        <Text style={styles.forgotPasswordText}>Quên mật khẩu?</Text>
                    </TouchableOpacity>

                    <Button
                        title="Đăng nhập"
                        onPress={signInWithEmail}
                        loading={loading}
                        style={styles.signInButton}
                    />

                    <View style={styles.divider}>
                        <View style={styles.dividerLine} />
                        <Text style={styles.dividerText}>HOẶC</Text>
                        <View style={styles.dividerLine} />
                    </View>

                    <Button
                        title="Đăng nhập bằng mã OTP qua email"
                        onPress={() => sendOtp()}
                        loading={loading}
                        variant="outline"
                        style={styles.otpButton}
                    />

                    <View style={styles.footer}>
                        <Text style={styles.footerText}>Chưa có tài khoản? </Text>
                        <Link href="/(auth)/register" asChild>
                            <TouchableOpacity>
                                <Text style={styles.signUpLink}>Đăng ký ngay</Text>
                            </TouchableOpacity>
                        </Link>
                    </View>
                    <TouchableOpacity onPress={() => router.replace('/(tabs)')} style={{ alignSelf: 'center', marginTop: 16 }}>
                        <Text style={styles.footerText}>← Tiếp tục xem khoá học không cần đăng nhập</Text>
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
    header: {
        alignItems: 'center',
        marginBottom: 40,
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#1B47A4',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 4,
    },
    description: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
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
        width: '100%',
        maxWidth: 400,
        alignSelf: 'center',
    },
    forgotPassword: {
        alignSelf: 'flex-end',
        marginBottom: 24,
    },
    forgotPasswordText: {
        color: '#1B47A4',
        fontSize: 14,
        fontWeight: '600',
    },
    signInButton: {
        marginTop: 8,
        backgroundColor: '#1B47A4',
    },
    divider: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 20,
    },
    dividerLine: {
        flex: 1,
        height: 1,
        backgroundColor: '#EEE',
    },
    dividerText: {
        marginHorizontal: 10,
        color: '#999',
        fontSize: 12,
        fontWeight: 'bold',
    },
    otpButton: {
        borderColor: '#1B47A4',
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: 24,
    },
    footerText: {
        color: '#666',
        fontSize: 14,
    },
    signUpLink: {
        color: '#1B47A4',
        fontSize: 14,
        fontWeight: 'bold',
    },
});
