import React, { useState } from 'react';
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, Alert, TouchableOpacity } from 'react-native';
import { useRouter, Link } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function LoginScreen() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    async function signInWithEmail() {
        setLoading(true);
        const { error, data } = await supabase.auth.signInWithPassword({
            email: email,
            password: password,
        });

        if (error) {
            console.error('Login Error Object:', JSON.stringify(error, null, 2));
            Alert.alert('Login Error', error.message);
            setLoading(false);
            return;
        }

        // Role-based navigation
        if (data.user) {
            const { data: profile } = await supabase
                .from('profiles')
                .select('role')
                .eq('id', data.user.id)
                .single();

            const role = profile?.role || 'student';

            // Redirect based on role
            if (role === 'admin') {
                router.replace('/(admin)/dashboard' as any);
            } else if (role === 'instructor') {
                router.replace('/(instructor)/dashboard' as any);
            } else {
                router.replace('/(tabs)');
            }
        }
        setLoading(false);
    }

    async function signInWithOtp() {
        if (!email) {
            Alert.alert('Error', 'Please enter your email address');
            return;
        }
        setLoading(true);
        const { error } = await supabase.auth.signInWithOtp({
            email: email,
        });

        if (error) {
            console.error('OTP Request Error Object:', JSON.stringify(error, null, 2));
            Alert.alert('Error', error.message);
            setLoading(false);
            return;
        }

        Alert.alert('Success', 'Check your email for the verification code.');
        router.push({
            pathname: '/(auth)/verify-otp' as any,
            params: { email: email }
        });
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
                    <Text style={styles.subtitle}>Welcome Back</Text>
                    <Text style={styles.description}>Sign in to your account to continue</Text>
                </View>

                <View style={styles.form}>
                    <Input
                        label="Email Address"
                        placeholder="your.email@example.com"
                        value={email}
                        onChangeText={setEmail}
                        autoCapitalize="none"
                        keyboardType="email-address"
                    />
                    <Input
                        label="Password"
                        placeholder="Enter your password"
                        value={password}
                        onChangeText={setPassword}
                        secureTextEntry
                    />

                    <TouchableOpacity style={styles.forgotPassword}>
                        <Text style={styles.forgotPasswordText}>Forgot password?</Text>
                    </TouchableOpacity>

                    <Button
                        title="Sign In with Password"
                        onPress={signInWithEmail}
                        loading={loading}
                        style={styles.signInButton}
                    />

                    <View style={styles.divider}>
                        <View style={styles.dividerLine} />
                        <Text style={styles.dividerText}>OR</Text>
                        <View style={styles.dividerLine} />
                    </View>

                    <Button
                        title="Sign In with OTP"
                        onPress={signInWithOtp}
                        loading={loading}
                        variant="outline"
                        style={styles.otpButton}
                    />

                    <View style={styles.footer}>
                        <Text style={styles.footerText}>Don't have an account? </Text>
                        <Link href="/(auth)/register" asChild>
                            <TouchableOpacity>
                                <Text style={styles.signUpLink}>Sign up here</Text>
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
