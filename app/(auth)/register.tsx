import React, { useState } from 'react';
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter, Link } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { notify, errorMessage } from '@/lib/notify';
import { useAuth } from '@/lib/auth';

export default function RegisterScreen() {
    const { settings } = useAuth();
    const instructorSignupOpen = settings?.allow_instructor_signup !== false;
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [role, setRole] = useState<'student' | 'instructor'>('student');
    const [degree, setDegree] = useState('');
    const [experience, setExperience] = useState('');
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    async function signUpWithEmail() {
        if (!firstName.trim() || !email.trim() || !password) {
            notify('Thiếu thông tin', 'Vui lòng nhập họ tên, email và mật khẩu.');
            return;
        }
        if (password.length < 6) {
            notify('Mật khẩu quá ngắn', 'Mật khẩu phải có ít nhất 6 ký tự.');
            return;
        }
        if (password !== confirmPassword) {
            notify('Mật khẩu không khớp', 'Vui lòng nhập lại mật khẩu xác nhận.');
            return;
        }

        setLoading(true);
        const { error, data } = await supabase.auth.signUp({
            email: email.trim(),
            password: password,
            options: {
                data: {
                    first_name: firstName,
                    last_name: lastName,
                    role: role,
                    ...(role === 'instructor' && {
                        degree: degree,
                        experience_years: parseInt(experience) || 0,
                    }),
                },
            },
        });

        if (error) {
            notify('Đăng ký thất bại', errorMessage(error));
            setLoading(false);
            return;
        }

        if (data.user) {
            const extra = role === 'instructor'
                ? '\n\nTài khoản giảng viên cần được quản trị viên phê duyệt trước khi tạo khoá học.'
                : '';
            const confirm = data.session ? '' : '\n\nVui lòng kiểm tra email để xác thực tài khoản trước khi đăng nhập.';
            notify('Đăng ký thành công', `Tài khoản đã được tạo.${confirm}${extra}`);
            if (data.session) await supabase.auth.signOut();
            router.replace('/(auth)/login');
        }
        setLoading(false);
    }

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.container}
        >
            <ScrollView contentContainerStyle={styles.scrollContainer}>
                <View style={styles.header}>
                    <Text style={styles.title}>VIAN Academy</Text>
                    <Text style={styles.subtitle}>Tạo tài khoản</Text>
                    <Text style={styles.description}>Tham gia cộng đồng học tập VIAN</Text>
                </View>

                <View style={styles.roleContainer}>
                    <TouchableOpacity
                        style={[styles.roleButton, role === 'student' && styles.activeRoleButton]}
                        onPress={() => setRole('student')}
                    >
                        <Text style={[styles.roleButtonText, role === 'student' && styles.activeRoleButtonText]}>Học viên</Text>
                    </TouchableOpacity>
                    {instructorSignupOpen && (
                        <TouchableOpacity
                            style={[styles.roleButton, role === 'instructor' && styles.activeRoleButton]}
                            onPress={() => setRole('instructor')}
                        >
                            <Text style={[styles.roleButtonText, role === 'instructor' && styles.activeRoleButtonText]}>Giảng viên</Text>
                        </TouchableOpacity>
                    )}
                </View>

                <View style={styles.form}>
                    <View style={styles.row}>
                        <Input
                            label="Họ"
                            placeholder="Nguyễn"
                            value={firstName}
                            onChangeText={setFirstName}
                            containerStyle={{ flex: 1, marginRight: 8 }}
                        />
                        <Input
                            label="Tên"
                            placeholder="Văn A"
                            value={lastName}
                            onChangeText={setLastName}
                            containerStyle={{ flex: 1, marginLeft: 8 }}
                        />
                    </View>
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
                        placeholder="Tối thiểu 6 ký tự"
                        value={password}
                        onChangeText={setPassword}
                        secureTextEntry
                    />
                    <Input
                        label="Xác nhận mật khẩu"
                        placeholder="Nhập lại mật khẩu"
                        value={confirmPassword}
                        onChangeText={setConfirmPassword}
                        secureTextEntry
                    />

                    {role === 'instructor' && (
                        <View style={styles.instructorFields}>
                            <Text style={styles.sectionTitle}>Thông tin giảng viên</Text>
                            <Input
                                label="Bằng cấp / Chứng chỉ"
                                placeholder="VD: Thạc sĩ Khoa học Máy tính"
                                value={degree}
                                onChangeText={setDegree}
                            />
                            <Input
                                label="Số năm kinh nghiệm"
                                placeholder="VD: 5"
                                value={experience}
                                onChangeText={setExperience}
                                keyboardType="numeric"
                            />
                            <Text style={{ color: '#666', fontSize: 13 }}>
                                Tài khoản giảng viên sẽ được quản trị viên xét duyệt trước khi được tạo khoá học.
                            </Text>
                        </View>
                    )}

                    <Button
                        title="Tạo tài khoản"
                        onPress={signUpWithEmail}
                        loading={loading}
                        style={styles.registerButton}
                    />

                    <View style={styles.footer}>
                        <Text style={styles.footerText}>Đã có tài khoản? </Text>
                        <Link href="/(auth)/login" asChild>
                            <TouchableOpacity>
                                <Text style={styles.signInLink}>Đăng nhập</Text>
                            </TouchableOpacity>
                        </Link>
                    </View>
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
    },
    header: {
        alignItems: 'center',
        marginBottom: 24,
        marginTop: 40,
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
    roleContainer: {
        flexDirection: 'row',
        marginBottom: 24,
        backgroundColor: '#EEE',
        borderRadius: 8,
        padding: 4,
    },
    roleButton: {
        flex: 1,
        paddingVertical: 10,
        alignItems: 'center',
        borderRadius: 6,
    },
    activeRoleButton: {
        backgroundColor: '#FFFFFF',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    roleButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#666',
    },
    activeRoleButtonText: {
        color: '#1B47A4',
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
    row: {
        flexDirection: 'row',
    },
    registerButton: {
        marginTop: 8,
        backgroundColor: '#1B47A4',
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
    signInLink: {
        color: '#1B47A4',
        fontSize: 14,
        fontWeight: 'bold',
    },
    instructorFields: {
        marginTop: 8,
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: '#EEE',
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 12,
    },
});
