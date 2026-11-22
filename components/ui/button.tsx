import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, StyleProp, ViewStyle, TextStyle, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface ButtonProps {
    onPress: () => void;
    title: string;
    loading?: boolean;
    style?: StyleProp<ViewStyle>;
    textStyle?: StyleProp<TextStyle>;
    disabled?: boolean;
    variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost' | 'success';
    size?: 'md' | 'sm';
    icon?: keyof typeof Ionicons.glyphMap;
}

const FG: Record<string, string> = {
    primary: '#FFFFFF',
    secondary: '#FFFFFF',
    danger: '#FFFFFF',
    success: '#FFFFFF',
    outline: '#1B47A4',
    ghost: '#1B47A4',
};

export function Button({
    onPress,
    title,
    loading = false,
    style,
    textStyle,
    disabled = false,
    variant = 'primary',
    size = 'md',
    icon,
}: ButtonProps) {
    const fg = disabled ? '#FFFFFF' : FG[variant];
    return (
        <TouchableOpacity
            onPress={onPress}
            disabled={disabled || loading}
            accessibilityRole="button"
            accessibilityState={{ disabled: disabled || loading }}
            style={[
                styles.button,
                size === 'sm' && styles.small,
                variant === 'secondary' && styles.secondaryButton,
                variant === 'outline' && styles.outlineButton,
                variant === 'danger' && styles.dangerButton,
                variant === 'success' && styles.successButton,
                variant === 'ghost' && styles.ghostButton,
                disabled && styles.disabledButton,
                style,
            ]}
        >
            {loading ? (
                <ActivityIndicator color={fg} />
            ) : (
                <View style={styles.inner}>
                    {icon ? <Ionicons name={icon} size={size === 'sm' ? 15 : 18} color={fg} /> : null}
                    <Text style={[styles.text, size === 'sm' && styles.smallText, { color: fg }, textStyle]}>{title}</Text>
                </View>
            )}
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    button: {
        backgroundColor: '#D84A4A',
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
    },
    small: {
        paddingVertical: 7,
        paddingHorizontal: 12,
        borderRadius: 6,
    },
    inner: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    secondaryButton: {
        backgroundColor: '#1B47A4',
    },
    outlineButton: {
        backgroundColor: 'transparent',
        borderWidth: 2,
        borderColor: '#1B47A4',
    },
    dangerButton: {
        backgroundColor: '#C62828',
    },
    successButton: {
        backgroundColor: '#2E7D32',
    },
    ghostButton: {
        backgroundColor: 'rgba(27, 71, 164, 0.08)',
    },
    disabledButton: {
        backgroundColor: '#CCCCCC',
        borderColor: '#CCCCCC',
    },
    text: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: 'bold',
    },
    smallText: {
        fontSize: 13,
    },
});
