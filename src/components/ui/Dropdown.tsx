import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme } from './ThemeProvider';

interface DropdownProps<T extends string> {
  label?: string;
  value: T;
  options: T[];
  getLabel?: (v: T) => string;
  onChange: (v: T) => void;
}

export function Dropdown<T extends string>({ label, value, options, getLabel, onChange }: DropdownProps<T>) {
  const { theme } = useTheme();
  const [open, setOpen] = useState(false);
  const resolve = (v: T) => (getLabel ? getLabel(v) : v);

  return (
    <View style={styles.container}>
      {label && <Text style={[styles.label, { color: theme.colors.text }]}>{label}</Text>}
      <TouchableOpacity
        style={[styles.control, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}
        onPress={() => setOpen(!open)}
        activeOpacity={0.8}
      >
        <Text style={{ color: theme.colors.text }}>{resolve(value)}</Text>
        <Text style={{ color: theme.colors.textSecondary }}>{open ? '▲' : '▼'}</Text>
      </TouchableOpacity>
      {open && (
        <View style={[styles.menu, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}> 
          {options.map((opt) => (
            <TouchableOpacity key={opt} style={styles.item} onPress={() => { onChange(opt); setOpen(false); }}>
              <Text style={{ color: theme.colors.text }}>{resolve(opt)}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { width: '100%' },
  label: { marginBottom: 6, fontWeight: '600' },
  control: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12, height: 44, borderRadius: 8, borderWidth: 1 },
  menu: { borderWidth: 1, borderRadius: 8, marginTop: 6, overflow: 'hidden' },
  item: { paddingHorizontal: 12, paddingVertical: 10 },
});

