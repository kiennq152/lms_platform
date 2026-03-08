import React, { useState } from 'react';
import { StyleSheet, View, Text, ScrollView, TextInput, Alert, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { WebLayout } from '@/components/ui/web-layout';
import { Footer } from '@/components/ui/footer';

export default function CreateCourseScreen() {
    const colorScheme = useColorScheme();
    const themeColors = Colors[colorScheme ?? 'light'];
    const router = useRouter();

    const [loading, setLoading] = useState(false);
    const [title, setTitle] = useState('');
    const [shortDesc, setShortDesc] = useState('');
    const [description, setDescription] = useState('');
    const [price, setPrice] = useState('');
    const [thumbnail, setThumbnail] = useState('https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=800&q=80');
    // Default to 'Lập Trình' which typically maps to ID 1 in seeds
    const [categoryId, setCategoryId] = useState('1'); 
    const [level, setLevel] = useState('beginner');

    const handleSubmit = async () => {
        if (!title || !description || !price) {
            Alert.alert('Lỗi', 'Vui lòng điền đầy đủ Tiêu đề, Mô tả và Giá tiền.');
            return;
        }

        setLoading(true);

        try {
            // Get current instructor ID
            const { data: { user } } = await supabase.auth.getUser();
            
            if (!user) {
                Alert.alert('Lỗi', 'Không tìm thấy thông tin đăng nhập.');
                setLoading(false);
                return;
            }

            // Insert into Supabase
            const { error } = await supabase.from('courses').insert({
                instructor_id: user.id,
                title: title,
                short_description: shortDesc,
                description: description,
                price: parseFloat(price) || 0,
                category_id: parseInt(categoryId),
                thumbnail_url: thumbnail,
                level: level,
                status: 'published' // Publish immediately for testing
            });

            if (error) {
                console.error("Lỗi khi thêm khóa học:", error);
                Alert.alert('Lỗi Database', error.message);
            } else {
                if (Platform.OS === 'web') {
                    window.alert('Thêm khóa học thành công!');
                } else {
                    Alert.alert('Thành công', 'Đã thêm khóa học mới!');
                }
                router.dismiss(); // Navigate back
            }
        } catch (err: any) {
             Alert.alert('Lỗi ngoại lệ', err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <WebLayout>
            <ScrollView style={[styles.container, { backgroundColor: themeColors.background }]}>
                <View style={styles.formContainer}>
                    <Text style={styles.headerTitle}>Thông Tin Cơ Bản</Text>

                    <Text style={styles.label}>Tên Khóa Học *</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="VD: Lập trình di động cơ bản..."
                        value={title}
                        onChangeText={setTitle}
                    />

                    <Text style={styles.label}>Mô Tả Ngắn (Slogan)</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="VD: Làm quen với code trong 30 ngày..."
                        value={shortDesc}
                        onChangeText={setShortDesc}
                    />

                    <Text style={styles.label}>Nội Dung Chi Tiết *</Text>
                    <TextInput
                        style={[styles.input, styles.textArea]}
                        placeholder="Mô tả kỹ về những gì học viên sẽ được học..."
                        value={description}
                        onChangeText={setDescription}
                        multiline
                        numberOfLines={4}
                    />

                    <Text style={styles.label}>Giá Tiền (VND) *</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="VD: 500000"
                        value={price}
                        onChangeText={setPrice}
                        keyboardType="numeric"
                    />

                    <Text style={styles.label}>ID Danh Mục (1=Lập trình, 2=Thiết kế, 3=Marketing, 4=Kinh doanh)</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Bấm số 1, 2, 3 hoặc 4..."
                        value={categoryId}
                        onChangeText={setCategoryId}
                        keyboardType="numeric"
                    />

                    <Text style={styles.label}>Trình Độ (beginner, intermediate, advanced)</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="VD: beginner"
                        value={level}
                        onChangeText={setLevel}
                        autoCapitalize="none"
                    />

                    <Text style={styles.label}>Đường Dẫn Ảnh Mẫu (Bỏ qua nếu dùng ảnh mặc định)</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="https://..."
                        value={thumbnail}
                        onChangeText={setThumbnail}
                    />

                    <Button
                        title="Đăng Khóa Học Này Lên"
                        onPress={handleSubmit}
                        loading={loading}
                        style={styles.submitBtn}
                    />
                     <Button
                        title="Hủy Bỏ"
                        variant="outline"
                        onPress={() => router.dismiss()}
                        style={styles.cancelBtn}
                    />
                </View>
                <Footer />
            </ScrollView>
        </WebLayout>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    formContainer: {
        padding: 24,
        paddingTop: Platform.OS === 'web' ? 40 : 24,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 24,
        color: '#1B47A4',
    },
    label: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 8,
    },
    input: {
        borderWidth: 1,
        borderColor: '#DDD',
        borderRadius: 8,
        paddingHorizontal: 16,
        paddingVertical: 12,
        fontSize: 16,
        marginBottom: 20,
        backgroundColor: '#FFF',
    },
    textArea: {
        height: 120,
        textAlignVertical: 'top',
    },
    submitBtn: {
        marginTop: 10,
        backgroundColor: '#4CAF50',
    },
    cancelBtn: {
        marginTop: 12,
        marginBottom: 30,
    }
});
