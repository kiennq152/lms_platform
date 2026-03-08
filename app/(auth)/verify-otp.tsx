import React, { useState } from 'react';
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, Alert, TouchableOpacity } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function VerifyOtpScreen() {
    const { email } = useLocalSearchParams<{ email: string }>();
    const [token, setToken] = useState('');
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    async function verifyOtp() {
        if (!token) {
            Alert.alert('Error', 'Please enter the verification code');
            return;
        }
        setLoading(true);
        const { error, data } = await supabase.auth.verifyOtp({
            email: email,
            token: token,
            type: 'email',
        });

        if (error) {
            console.error('Verify OTP Error Object:', JSON.stringify(error, null, 2));
            Alert.alert('Verification Error', error.message);
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

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.container}
        >
            <ScrollView contentContainerStyle={styles.scrollContainer}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Text style={styles.backButtonText}>← Back to Login</Text>
                </TouchableOpacity>

                <View style={styles.header}>
                    <Text style={styles.title}>Verify Email</Text>
                    <Text style={styles.description}>
                        We&apos;ve sent a 6-digit verification code to{"\n"}
                        <Text style={styles.emailText}>{email}</Text>
                    </Text>
                </View>

                <View style={styles.form}>
                    <Input
                        label="Verification Code"
                        placeholder="123456"
                        value={token}
                        onChangeText={setToken}
                        keyboardType="number-pad"
                        maxLength={6}
                    />

                    <Button
                        title="Verify & Sign In"
                        onPress={verifyOtp}
                        loading={loading}
                        style={styles.verifyButton}
                    />

                    <TouchableOpacity style={styles.resendButton}>
                        <Text style={styles.resendText}>Didn&apos;t receive the code? Resend</Text>
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
