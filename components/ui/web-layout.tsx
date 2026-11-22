import React from 'react';
import { View, StyleSheet, StyleProp, ViewStyle, Platform } from 'react-native';

interface WebLayoutProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  containerStyle?: StyleProp<ViewStyle>;
  /** Max content width on large screens. Dashboards use a wider frame. */
  maxWidth?: number;
}

export function WebLayout({ children, style, containerStyle, maxWidth = 768 }: WebLayoutProps) {
  return (
    <View style={[styles.root, containerStyle]}>
      <View style={[styles.container, { maxWidth }, style]}>
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
    alignSelf: 'center',
    backgroundColor: '#ffffff',
    ...Platform.select({
      web: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
      },
    }),
  },
});
