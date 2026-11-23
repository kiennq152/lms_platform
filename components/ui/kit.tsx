/**
 * Shared building blocks for every screen (cards, badges, stats, charts, inputs...).
 * Keep visuals consistent with the VIAN brand: blue #1B47A4, red #D84A4A.
 */
import React from 'react';
import {
  ActivityIndicator,
  Image,
  RefreshControl,
  ScrollView,
  StyleProp,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  TextStyle,
  TouchableOpacity,
  View,
  ViewStyle,
  Platform,
} from 'react-native';
import { FontAwesome, Ionicons } from '@expo/vector-icons';
import { Button } from './button';
import { WebLayout } from './web-layout';
import { Footer } from './footer';
import { initials } from '@/lib/format';

export const BRAND = {
  blue: '#1B47A4',
  red: '#D84A4A',
  text: '#1A2233',
  muted: '#6B7280',
  border: '#E5E7EB',
  bg: '#F7F8FA',
  green: '#2E7D32',
  orange: '#EF6C00',
};

// ---------------------------------------------------------------- Screen
interface ScreenProps {
  children: React.ReactNode;
  /** Wider frame for dashboards and admin tables. */
  wide?: boolean;
  footer?: boolean;
  padded?: boolean;
  refreshing?: boolean;
  onRefresh?: () => void;
  /** Extra bottom space so content clears the floating web tab bar. */
  tabBarInset?: boolean;
  contentStyle?: StyleProp<ViewStyle>;
}

export function Screen({ children, wide, footer = true, padded = true, refreshing, onRefresh, tabBarInset, contentStyle }: ScreenProps) {
  return (
    <WebLayout maxWidth={wide ? 1200 : 768}>
      <ScrollView
        style={{ flex: 1, backgroundColor: '#FFFFFF' }}
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
        refreshControl={onRefresh ? <RefreshControl refreshing={!!refreshing} onRefresh={onRefresh} /> : undefined}
      >
        <View style={[padded && styles.padded, contentStyle]}>{children}</View>
        <View style={{ flex: 1 }} />
        {footer ? <Footer /> : null}
        {tabBarInset ? <View style={{ height: Platform.OS === 'web' ? 100 : 16 }} /> : null}
      </ScrollView>
    </WebLayout>
  );
}

// ---------------------------------------------------------------- Text
export function H1({ children, style }: { children: React.ReactNode; style?: StyleProp<TextStyle> }) {
  return <Text style={[styles.h1, style]} accessibilityRole="header">{children}</Text>;
}
export function H2({ children, style, right }: { children: React.ReactNode; style?: StyleProp<TextStyle>; right?: React.ReactNode }) {
  return (
    <View style={styles.h2Row}>
      <Text style={[styles.h2, style]} accessibilityRole="header">{children}</Text>
      {right}
    </View>
  );
}
export function Muted({ children, style, numberOfLines }: { children: React.ReactNode; style?: StyleProp<TextStyle>; numberOfLines?: number }) {
  return <Text style={[styles.muted, style]} numberOfLines={numberOfLines}>{children}</Text>;
}
export function Link({ title, onPress, style }: { title: string; onPress: () => void; style?: StyleProp<TextStyle> }) {
  return (
    <TouchableOpacity onPress={onPress} accessibilityRole="link">
      <Text style={[styles.link, style]}>{title}</Text>
    </TouchableOpacity>
  );
}

// ---------------------------------------------------------------- Layout
export function Card({ children, style, onPress }: { children: React.ReactNode; style?: StyleProp<ViewStyle>; onPress?: () => void }) {
  if (onPress) {
    return <TouchableOpacity style={[styles.card, style]} onPress={onPress}>{children}</TouchableOpacity>;
  }
  return <View style={[styles.card, style]}>{children}</View>;
}

export function Row({ children, style, gap = 8, wrap }: { children: React.ReactNode; style?: StyleProp<ViewStyle>; gap?: number; wrap?: boolean }) {
  return <View style={[{ flexDirection: 'row', alignItems: 'center', gap }, wrap && { flexWrap: 'wrap' }, style]}>{children}</View>;
}

export function Divider({ style }: { style?: StyleProp<ViewStyle> }) {
  return <View style={[{ height: 1, backgroundColor: BRAND.border, marginVertical: 12 }, style]} />;
}

// ---------------------------------------------------------------- Badge
export type Tone = 'blue' | 'green' | 'orange' | 'red' | 'gray' | 'purple';
const TONES: Record<Tone, { bg: string; fg: string }> = {
  blue: { bg: '#E8EEFB', fg: '#1B47A4' },
  green: { bg: '#E8F5E9', fg: '#2E7D32' },
  orange: { bg: '#FFF3E0', fg: '#E65100' },
  red: { bg: '#FDECEC', fg: '#C62828' },
  gray: { bg: '#F1F3F5', fg: '#555' },
  purple: { bg: '#F3E8FD', fg: '#6A1B9A' },
};

export function statusTone(status: string | null | undefined): Tone {
  switch (status) {
    case 'published':
    case 'completed':
    case 'active':
    case 'resolved':
    case 'approved':
      return 'green';
    case 'pending':
    case 'in_progress':
      return 'orange';
    case 'rejected':
    case 'failed':
    case 'suspended':
    case 'dropped':
      return 'red';
    case 'refunded':
      return 'purple';
    case 'open':
      return 'blue';
    default:
      return 'gray';
  }
}

export function Badge({ label, tone = 'gray', style }: { label: string; tone?: Tone; style?: StyleProp<ViewStyle> }) {
  const t = TONES[tone];
  return (
    <View style={[styles.badge, { backgroundColor: t.bg }, style]}>
      <Text style={[styles.badgeText, { color: t.fg }]}>{label}</Text>
    </View>
  );
}

// ---------------------------------------------------------------- Stats
export function StatCard({ label, value, icon, tone = 'blue', sub, highlight }: {
  label: string; value: string | number; icon?: keyof typeof Ionicons.glyphMap; tone?: Tone; sub?: string; highlight?: boolean;
}) {
  const t = TONES[tone];
  return (
    <View style={[styles.stat, highlight && { backgroundColor: BRAND.blue, borderColor: BRAND.blue }]}>
      <Row style={{ justifyContent: 'space-between' }}>
        <Text style={[styles.statLabel, highlight && { color: 'rgba(255,255,255,0.8)' }]} numberOfLines={1}>{label}</Text>
        {icon ? (
          <View style={[styles.statIcon, { backgroundColor: highlight ? 'rgba(255,255,255,0.15)' : t.bg }]}>
            <Ionicons name={icon} size={16} color={highlight ? '#FFF' : t.fg} />
          </View>
        ) : null}
      </Row>
      <Text style={[styles.statValue, highlight && { color: '#FFF' }]} numberOfLines={1} adjustsFontSizeToFit>{value}</Text>
      {sub ? <Text style={[styles.statSub, highlight && { color: 'rgba(255,255,255,0.8)' }]}>{sub}</Text> : null}
    </View>
  );
}

export function StatGrid({ children }: { children: React.ReactNode }) {
  return <View style={styles.statGrid}>{children}</View>;
}

/** Minimal bar chart; values are drawn relative to the max. */
export function BarChart({ data, format = (v: number) => String(v), height = 160 }: {
  data: { label: string; value: number }[]; format?: (v: number) => string; height?: number;
}) {
  const max = Math.max(1, ...data.map((d) => Number(d.value) || 0));
  const lastIdx = data.length - 1;
  return (
    <View>
      <View style={[styles.chart, { height }]}>
        {data.map((d, i) => {
          const pct = ((Number(d.value) || 0) / max) * 100;
          return (
            <View key={d.label + i} style={styles.chartCol} accessibilityLabel={`${d.label}: ${format(Number(d.value) || 0)}`}>
              <Text style={styles.chartValue} numberOfLines={1}>{Number(d.value) ? format(Number(d.value)) : ''}</Text>
              <View style={[styles.chartBar, { height: `${Math.max(pct, 2)}%`, backgroundColor: i === lastIdx ? BRAND.red : BRAND.blue, opacity: i === lastIdx ? 1 : 0.75 }]} />
            </View>
          );
        })}
      </View>
      <View style={styles.chartAxis}>
        {data.map((d, i) => (
          <Text key={d.label + i} style={styles.chartLabel} numberOfLines={1}>{d.label}</Text>
        ))}
      </View>
    </View>
  );
}

// ---------------------------------------------------------------- Feedback
export function Loading({ label = 'Đang tải...' }: { label?: string }) {
  return (
    <View style={styles.center}>
      <ActivityIndicator size="large" color={BRAND.blue} />
      <Text style={[styles.muted, { marginTop: 8 }]}>{label}</Text>
    </View>
  );
}

export function EmptyState({ icon = 'file-tray-outline', title, message, action }: {
  icon?: keyof typeof Ionicons.glyphMap; title: string; message?: string; action?: React.ReactNode;
}) {
  return (
    <View style={styles.empty}>
      <Ionicons name={icon} size={44} color="#C0C6D0" />
      <Text style={styles.emptyTitle}>{title}</Text>
      {message ? <Text style={[styles.muted, { textAlign: 'center' }]}>{message}</Text> : null}
      {action ? <View style={{ marginTop: 12 }}>{action}</View> : null}
    </View>
  );
}

/** Shown when data could not be loaded, so a failed request never looks like "no data". */
export function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <EmptyState
      icon="cloud-offline-outline"
      title="Không tải được dữ liệu"
      message={message}
      action={<Button title="Thử lại" size="sm" variant="outline" icon="refresh" onPress={onRetry} />}
    />
  );
}

export function Notice({ tone = 'blue', icon = 'information-circle-outline', children }: {
  tone?: Tone; icon?: keyof typeof Ionicons.glyphMap; children: React.ReactNode;
}) {
  const t = TONES[tone];
  return (
    <View style={[styles.notice, { backgroundColor: t.bg }]}>
      <Ionicons name={icon} size={18} color={t.fg} />
      <Text style={{ color: t.fg, flex: 1, lineHeight: 20 }}>{children}</Text>
    </View>
  );
}

// ---------------------------------------------------------------- Inputs
interface FieldProps extends TextInputProps {
  label?: string;
  hint?: string;
  error?: string;
  containerStyle?: StyleProp<ViewStyle>;
}
export function Field({ label, hint, error, containerStyle, multiline, style, ...props }: FieldProps) {
  return (
    <View style={[{ marginBottom: 14 }, containerStyle]}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <TextInput
        placeholderTextColor="#9AA0A6"
        multiline={multiline}
        style={[styles.input, multiline && { minHeight: 96, textAlignVertical: 'top' }, error ? { borderColor: BRAND.red } : null, style]}
        accessibilityLabel={label}
        {...props}
      />
      {error ? <Text style={styles.error}>{error}</Text> : hint ? <Text style={styles.hint}>{hint}</Text> : null}
    </View>
  );
}

export function Chips<T extends string | number>({ options, value, onChange, style }: {
  options: { value: T; label: string }[]; value: T; onChange: (v: T) => void; style?: StyleProp<ViewStyle>;
}) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={style} contentContainerStyle={{ gap: 8, paddingVertical: 2 }}>
      {options.map((o) => {
        const active = o.value === value;
        return (
          <TouchableOpacity
            key={String(o.value)}
            onPress={() => onChange(o.value)}
            style={[styles.chip, active && styles.chipActive]}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
          >
            <Text style={[styles.chipText, active && styles.chipTextActive]}>{o.label}</Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

export function Tabs<T extends string>({ tabs, value, onChange }: { tabs: { value: T; label: string }[]; value: T; onChange: (v: T) => void }) {
  return (
    <View style={styles.tabs}>
      {tabs.map((t) => {
        const active = t.value === value;
        return (
          <TouchableOpacity key={t.value} onPress={() => onChange(t.value)} style={[styles.tab, active && styles.tabActive]} accessibilityRole="tab" accessibilityState={{ selected: active }}>
            <Text style={[styles.tabText, active && styles.tabTextActive]}>{t.label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

export function Toggle({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <TouchableOpacity onPress={() => onChange(!value)} style={styles.toggleRow} accessibilityRole="switch" accessibilityState={{ checked: value }}>
      <Ionicons name={value ? 'checkbox' : 'square-outline'} size={22} color={value ? BRAND.blue : '#999'} />
      <Text style={{ color: BRAND.text, flex: 1 }}>{label}</Text>
    </TouchableOpacity>
  );
}

// ---------------------------------------------------------------- Misc
export function ProgressBar({ value, color = BRAND.blue, height = 8 }: { value: number; color?: string; height?: number }) {
  const pct = Math.max(0, Math.min(100, Number(value) || 0));
  return (
    <View style={[styles.progressTrack, { height, borderRadius: height / 2 }]} accessibilityRole="progressbar" accessibilityValue={{ min: 0, max: 100, now: pct }}>
      <View style={{ width: `${pct}%`, height: '100%', backgroundColor: color, borderRadius: height / 2 }} />
    </View>
  );
}

export function Avatar({ uri, user, size = 40 }: { uri?: string | null; user?: { first_name?: string | null; last_name?: string | null; email?: string | null } | null; size?: number }) {
  if (uri) return <Image source={{ uri }} style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: '#EEE' }} />;
  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: '#E8EEFB', alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ color: BRAND.blue, fontWeight: '800', fontSize: size * 0.38 }}>{initials(user)}</Text>
    </View>
  );
}

export function Stars({ value, size = 14, onChange }: { value: number; size?: number; onChange?: (v: number) => void }) {
  return (
    <Row gap={2}>
      {[1, 2, 3, 4, 5].map((s) => {
        const name = value >= s ? 'star' : value >= s - 0.5 ? 'star-half-o' : 'star-o';
        const icon = <FontAwesome name={name as any} size={size} color="#F5A623" />;
        return onChange ? (
          <TouchableOpacity key={s} onPress={() => onChange(s)} accessibilityLabel={`${s} sao`} style={{ padding: 2 }}>{icon}</TouchableOpacity>
        ) : (
          <View key={s}>{icon}</View>
        );
      })}
    </Row>
  );
}

export function ListItem({ icon, title, subtitle, right, onPress, last }: {
  icon?: keyof typeof Ionicons.glyphMap; title: string; subtitle?: string; right?: React.ReactNode; onPress?: () => void; last?: boolean;
}) {
  const content = (
    <View style={[styles.listItem, last && { borderBottomWidth: 0 }]}>
      {icon ? <Ionicons name={icon} size={20} color={BRAND.blue} /> : null}
      <View style={{ flex: 1 }}>
        <Text style={{ color: BRAND.text, fontSize: 15 }}>{title}</Text>
        {subtitle ? <Text style={[styles.muted, { fontSize: 13 }]}>{subtitle}</Text> : null}
      </View>
      {right ?? (onPress ? <Ionicons name="chevron-forward" size={18} color="#BBB" /> : null)}
    </View>
  );
  return onPress ? <TouchableOpacity onPress={onPress}>{content}</TouchableOpacity> : content;
}

const styles = StyleSheet.create({
  padded: { padding: 20 },
  h1: { fontSize: 24, fontWeight: '800', color: BRAND.text, marginBottom: 4 },
  h2Row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8, marginBottom: 12 },
  h2: { fontSize: 18, fontWeight: '700', color: BRAND.text },
  muted: { color: BRAND.muted, fontSize: 14, lineHeight: 20 },
  link: { color: BRAND.blue, fontWeight: '600', fontSize: 14 },
  card: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: BRAND.border,
    padding: 16,
    marginBottom: 12,
  },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999, alignSelf: 'flex-start' },
  badgeText: { fontSize: 12, fontWeight: '700' },
  statGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 16 },
  stat: {
    flexGrow: 1,
    flexBasis: 160,
    backgroundColor: '#FFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: BRAND.border,
    padding: 14,
  },
  statLabel: { color: BRAND.muted, fontSize: 13, fontWeight: '600', flex: 1 },
  statIcon: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  statValue: { fontSize: 22, fontWeight: '800', color: BRAND.text, marginTop: 8 },
  statSub: { fontSize: 12, color: BRAND.muted, marginTop: 2 },
  chart: { flexDirection: 'row', alignItems: 'flex-end', gap: 6 },
  chartCol: { flex: 1, height: '100%', justifyContent: 'flex-end', alignItems: 'center' },
  chartBar: { width: '70%', borderTopLeftRadius: 4, borderTopRightRadius: 4 },
  chartValue: { fontSize: 9, color: BRAND.muted, marginBottom: 2 },
  chartAxis: { flexDirection: 'row', gap: 6, marginTop: 6 },
  chartLabel: { flex: 1, textAlign: 'center', fontSize: 10, color: BRAND.muted },
  center: { padding: 40, alignItems: 'center', justifyContent: 'center' },
  empty: { padding: 32, alignItems: 'center', gap: 6 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: BRAND.text, marginTop: 4 },
  notice: { flexDirection: 'row', gap: 8, padding: 12, borderRadius: 10, marginBottom: 12, alignItems: 'flex-start' },
  label: { fontSize: 14, fontWeight: '600', color: '#333', marginBottom: 6 },
  input: {
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#D9DDE3',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: '#111',
  },
  hint: { color: BRAND.muted, fontSize: 12, marginTop: 4 },
  error: { color: BRAND.red, fontSize: 12, marginTop: 4 },
  chip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 999, backgroundColor: '#F1F3F5' },
  chipActive: { backgroundColor: BRAND.blue },
  chipText: { fontSize: 13, fontWeight: '600', color: '#555' },
  chipTextActive: { color: '#FFF' },
  tabs: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: BRAND.border, marginBottom: 16 },
  tab: { paddingVertical: 10, paddingHorizontal: 14, borderBottomWidth: 2, borderBottomColor: 'transparent', marginBottom: -1 },
  tabActive: { borderBottomColor: BRAND.red },
  tabText: { color: BRAND.muted, fontWeight: '600' },
  tabTextActive: { color: BRAND.red },
  toggleRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8 },
  progressTrack: { width: '100%', backgroundColor: '#E9ECF1', overflow: 'hidden' },
  listItem: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#F0F1F3' },
});
