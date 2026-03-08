import React from 'react';
import { View, StyleSheet, StyleProp, ViewStyle, Platform } from 'react-native';

interface WebLayoutProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  containerStyle?: StyleProp<ViewStyle>;
}

export function WebLayout({ children, style, containerStyle }: WebLayoutProps) {
  return (
    <View style={[styles.root, containerStyle]}>
      <View style={[styles.container, style]}>
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    width: '100%',
    // On web we center the layout and give it a clean background behind the max-width container
    backgroundColor: Platform.OS === 'web' ? '#f0f2f5' : 'transparent',
  },
  container: {
    flex: 1,
    width: '100%',
    // Limit width on large screens to make it feel like an optimized app, not a stretched webpage
    maxWidth: 768, 
    alignSelf: 'center',
    // Apply background color inside the limited frame
    backgroundColor: '#ffffff',
    // On web, it's nice to add subtle shadow or borders to frame the app content
    ...Platform.select({
      web: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        // Remove border radius if you prefer a flat edge-to-edge look even in the center
      },
    }),
  },
});
