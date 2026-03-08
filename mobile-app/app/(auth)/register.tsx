import React, { useState } from 'react';
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, Alert, TouchableOpacity } from 'react-native';
import { useRouter, Link } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function RegisterScreen() {
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [role, setRole] = useState<'student' | 'instructor'>('student');
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    async function signUpWithEmail() {
        if (password !== confirmPassword) {
            Alert.alert('Error', 'Passwords do not match');
            return;
        }

        setLoading(true);
        const { error, data } = await supabase.auth.signUp({
            email: email,
            password: password,
            options: {
                data: {
                    first_name: firstName,
                    last_name: lastName,
                    role: role,
                },
            },
        });

        if (error) {
            Alert.alert('Registration Error', error.message);
            setLoading(false);
            return;
        }

        if (data.user) {
            Alert.alert('Success', 'Please check your email for verification.');
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
                    <Text style={styles.subtitle}>Create Account</Text>
                    <Text style={styles.description}>Join our learning community</Text>
                </View>

                <View style={styles.roleContainer}>
                    <TouchableOpacity
                        style={[styles.roleButton, role === 'student' && styles.activeRoleButton]}
                        onPress={() => setRole('student')}
                    >
                        <Text style={[styles.roleButtonText, role === 'student' && styles.activeRoleButtonText]}>Student</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.roleButton, role === 'instructor' && styles.activeRoleButton]}
                        onPress={() => setRole('instructor')}
                    >
                        <Text style={[styles.roleButtonText, role === 'instructor' && styles.activeRoleButtonText]}>Instructor</Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.form}>
                    <View style={styles.row}>
                        <Input
                            label="First Name"
                            placeholder="John"
                            value={firstName}
                            onChangeText={setFirstName}
                            containerStyle={{ flex: 1, marginRight: 8 }}
                        />
                        <Input
                            label="Last Name"
                            placeholder="Doe"
                            value={lastName}
                            onChangeText={setLastName}
                            containerStyle={{ flex: 1, marginLeft: 8 }}
                        />
                    </View>
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
                        placeholder="Min. 8 characters"
                        value={password}
                        onChangeText={setPassword}
                        secureTextEntry
                    />
                    <Input
                        label="Confirm Password"
                        placeholder="Re-enter password"
                        value={confirmPassword}
                        onChangeText={setConfirmPassword}
                        secureTextEntry
                    />

                    <Button
                        title="Create Account"
                        onPress={signUpWithEmail}
                        loading={loading}
                        style={styles.registerButton}
                    />

                    <View style={styles.footer}>
                        <Text style={styles.footerText}>Already have an account? </Text>
                        <Link href="/(auth)/login" asChild>
                            <TouchableOpacity>
                                <Text style={styles.signInLink}>Sign in here</Text>
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
});
