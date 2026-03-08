import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';

interface CourseCardProps {
    title: string;
    instructor: string;
    price: string;
    rating: number;
    image: string;
    onPress: () => void;
}

export function CourseCard({ title, instructor, price, rating, image, onPress }: CourseCardProps) {
    return (
        <TouchableOpacity style={styles.card} onPress={onPress}>
            <Image source={{ uri: image }} style={styles.image} />
            <View style={styles.content}>
                <Text style={styles.title} numberOfLines={2}>{title}</Text>
                <Text style={styles.instructor}>{instructor}</Text>
                <View style={styles.footer}>
                    <View style={styles.ratingContainer}>
                        <FontAwesome name="star" size={14} color="#FFD700" />
                        <Text style={styles.ratingText}>{rating.toFixed(1)}</Text>
                    </View>
                    <Text style={styles.price}>{price}</Text>
                </View>
            </View>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    card: {
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#EEE',
        overflow: 'hidden',
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    image: {
        width: '100%',
        height: 150,
    },
    content: {
        padding: 12,
    },
    title: {
        fontSize: 16,
        fontWeight: '700',
        color: '#001A33',
        marginBottom: 4,
        height: 48,
    },
    instructor: {
        fontSize: 13,
        color: '#666',
        marginBottom: 8,
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 'auto',
    },
    ratingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    ratingText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#444',
    },
    price: {
        fontSize: 16,
        fontWeight: '800',
        color: '#D84A4A',
    },
});
