import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, ViewStyle, TextStyle } from 'react-native';

interface ButtonProps {
    onPress: () => void;
    title: string;
    loading?: boolean;
    style?: ViewStyle;
    textStyle?: TextStyle;
    disabled?: boolean;
    variant?: 'primary' | 'secondary' | 'outline';
}

export function Button({
    onPress,
    title,
    loading = false,
    style,
    textStyle,
    disabled = false,
    variant = 'primary'
}: ButtonProps) {
    const isSecondary = variant === 'secondary';
    const isOutline = variant === 'outline';

    return (
        <TouchableOpacity
            onPress={onPress}
            disabled={disabled || loading}
            style={[
                styles.button,
                isSecondary && styles.secondaryButton,
                isOutline && styles.outlineButton,
                disabled && styles.disabledButton,
                style
            ]}
        >
            {loading ? (
                <ActivityIndicator color={isOutline ? '#1B47A4' : '#FFFFFF'} />
            ) : (
                <Text style={[
                    styles.text,
                    isOutline && styles.outlineText,
                    textStyle
                ]}>
                    {title}
                </Text>
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
    secondaryButton: {
        backgroundColor: '#1B47A4',
    },
    outlineButton: {
        backgroundColor: 'transparent',
        borderWidth: 2,
        borderColor: '#1B47A4',
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
    outlineText: {
        color: '#1B47A4',
    }
});
