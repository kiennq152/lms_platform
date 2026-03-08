import React from 'react';
import { View, TextInput, Text, StyleSheet, ViewStyle, TextInputProps } from 'react-native';

interface InputProps extends TextInputProps {
    label?: string;
    error?: string;
    containerStyle?: ViewStyle;
}

export function Input({ label, error, containerStyle, ...props }: InputProps) {
    return (
        <View style={[styles.container, containerStyle]}>
            {label && <Text style={styles.label}>{label}</Text>}
            <TextInput
                style={[styles.input, error ? styles.inputError : null]}
                placeholderTextColor="#999"
                {...props}
            />
            {error && <Text style={styles.errorText}>{error}</Text>}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        marginBottom: 16,
        width: '100%',
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: '#333',
        marginBottom: 8,
    },
    input: {
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#DDD',
        borderRadius: 8,
        paddingHorizontal: 16,
        paddingVertical: 12,
        fontSize: 16,
        color: '#000',
    },
    inputError: {
        borderColor: '#D84A4A',
    },
    errorText: {
        color: '#D84A4A',
        fontSize: 12,
        marginTop: 4,
    },
});
