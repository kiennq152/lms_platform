import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { DEFAULT_THUMBNAIL } from '@/lib/api';

interface CourseCardProps {
    title: string;
    instructor: string;
    price: string;
    rating: number;
    image?: string | null;
    onPress: () => void;
    students?: number;
    meta?: string;
    badge?: React.ReactNode;
}

export function CourseCard({ title, instructor, price, rating, image, onPress, students, meta, badge }: CourseCardProps) {
    return (
        <TouchableOpacity style={styles.card} onPress={onPress} accessibilityRole="button" accessibilityLabel={title}>
            <Image source={{ uri: image || DEFAULT_THUMBNAIL }} style={styles.image} />
            {badge ? <View style={styles.badge}>{badge}</View> : null}
            <View style={styles.content}>
                <Text style={styles.title} numberOfLines={2}>{title}</Text>
                <Text style={styles.instructor} numberOfLines={1}>{instructor}</Text>
                {meta ? <Text style={styles.meta} numberOfLines={1}>{meta}</Text> : null}
                <View style={styles.footer}>
                    <View style={styles.ratingContainer}>
                        <FontAwesome name="star" size={14} color="#FFD700" />
                        <Text style={styles.ratingText}>{Number(rating || 0).toFixed(1)}</Text>
                        {students !== undefined ? <Text style={styles.students}>· {students} học viên</Text> : null}
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
        backgroundColor: '#EEE',
    },
    badge: {
        position: 'absolute',
        top: 10,
        left: 10,
    },
    content: {
        padding: 12,
    },
    title: {
        fontSize: 16,
        fontWeight: '700',
        color: '#001A33',
        marginBottom: 4,
        minHeight: 44,
    },
    instructor: {
        fontSize: 13,
        color: '#666',
        marginBottom: 4,
    },
    meta: {
        fontSize: 12,
        color: '#888',
        marginBottom: 4,
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 4,
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
    students: {
        fontSize: 12,
        color: '#888',
    },
    price: {
        fontSize: 16,
        fontWeight: '800',
        color: '#D84A4A',
    },
});
