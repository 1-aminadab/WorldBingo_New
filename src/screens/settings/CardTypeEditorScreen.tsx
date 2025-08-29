import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, Modal } from 'react-native';
import { useTheme } from '../../components/ui/ThemeProvider';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { useSettingsStore } from '../../store/settingsStore';
import { useNavigation, useRoute } from '@react-navigation/native';

type CardRow = number[]; // 24 numbers

export const CardTypeEditorScreen: React.FC = () => {
  const { theme } = useTheme();
  const { customCardTypes, addCustomCardType, selectCardTypeByName } = useSettingsStore();
  const navigation = useNavigation();
  const route = useRoute<any>();

  const [name, setName] = useState('');
  const MODE_CSV = 'csv' as const;
  const MODE_MANUAL = 'manual' as const;
  const [mode, setMode] = useState<typeof MODE_CSV | typeof MODE_MANUAL>(MODE_CSV);
  const [csv, setCsv] = useState('');
  const [cards, setCards] = useState<CardRow[]>([]);
  const [currentManual, setCurrentManual] = useState<(number | null)[]>(Array(24).fill(null));
  
  // Convert 24-number array to 5x5 grid with center free space
  const getGridFromNumbers = (numbers: (number | null)[]) => {
    const grid: (number | null)[][] = Array(5).fill(null).map(() => Array(5).fill(null));
    let numberIndex = 0;
    
    for (let row = 0; row < 5; row++) {
      for (let col = 0; col < 5; col++) {
        if (row === 2 && col === 2) {
          // Center cell is free
          grid[row][col] = null;
        } else {
          grid[row][col] = numbers[numberIndex] || null;
          numberIndex++;
        }
      }
    }
    return grid;
  };
  
  // Convert 5x5 grid back to 24-number array
  const getNumbersFromGrid = (grid: (number | null)[][]) => {
    const numbers: (number | null)[] = [];
    
    for (let row = 0; row < 5; row++) {
      for (let col = 0; col < 5; col++) {
        if (row === 2 && col === 2) {
          // Skip center cell
          continue;
        }
        numbers.push(grid[row][col]);
      }
    }
    return numbers;
  };
  const [editIndex, setEditIndex] = useState<number | null>(null);
  const [confirmVisible, setConfirmVisible] = useState(false);

  // Reset screen for "create" mode or filter by provided name in manage mode
  useEffect(() => {
    if (route.params?.mode === 'create') {
      setName('');
      setMode(MODE_MANUAL);
      setCsv('');
      setCards([]);
      setCurrentManual(Array(24).fill(null));
      setEditIndex(null);
      return;
    }
    if (route.params?.mode === 'manage' && route.params?.name) {
      const found = customCardTypes.find(c => c.name === route.params.name);
      if (found) {
        setName(found.name);
        setCards(found.cards);
        setMode(MODE_MANUAL);
        setCurrentManual(Array(24).fill(null));
        setEditIndex(null);
      }
    }
  }, [route.params]);

  const isValidCard = (row: number[]) => new Set(row).size === 24 && row.length === 24;

  const addFromCsv = () => {
    const parsed = csv.split(',').map(s => parseInt(s.trim(), 10)).filter(n => !isNaN(n));
    if (parsed.length !== 24) {
      Alert.alert('Invalid', 'A card must contain exactly 24 numbers.');
      return;
    }
    if (new Set(parsed).size !== 24) {
      Alert.alert('Invalid', 'All 24 numbers must be different.');
      return;
    }
    const duplicateArrangement = cards.some(row => row.join(',') === parsed.join(','));
    if (duplicateArrangement) {
      Alert.alert('Duplicate', 'Card with same arrangement already exists.');
      return;
    }
    setCards([...cards, parsed]);
    setCsv('');
  };

  const saveManualCard = () => {
    const values = currentManual.map(n => Number(n));
    if (values.some(v => !Number.isFinite(v))) { Alert.alert('Missing', 'Fill all 24 inputs.'); return; }
    // Validate range 1..75
    if (values.some(v => v < 1 || v > 75)) { Alert.alert('Out of range', 'Numbers must be between 1 and 75.'); return; }
    if (!isValidCard(values)) { Alert.alert('Invalid', 'Manual card must include exactly 24 different numbers.'); return; }
    const duplicateArrangement = cards.some(row => row.join(',') === values.join(','));
    if (duplicateArrangement && editIndex === null) { Alert.alert('Duplicate', 'Card with same arrangement already exists.'); return; }
    // Save in place if editing
    if (editIndex !== null) {
      const next = [...cards];
      next.splice(editIndex, 0, values);
      setCards(next);
      setEditIndex(null);
    } else {
      setCards([...cards, values]);
    }
    setCurrentManual(Array(24).fill(null));
  };

  const removeCard = (index: number) => {
    Alert.alert('Delete card', 'Are you sure you want to delete this card?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => {
        const next = [...cards];
        next.splice(index, 1);
        setCards(next);
      }}
    ]);
  };

  const moveCard = (from: number, to: number) => {
    const next = [...cards];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    setCards(next);
  };

  const canSubmit = name.trim().length > 0 && cards.length > 0;

  const submit = () => {
    if (!canSubmit) { Alert.alert('Missing', 'Enter a name and add at least one card.'); return; }
    setConfirmVisible(true);
  };

  return (
    <ScrollView contentContainerStyle={[styles.container, { backgroundColor: theme.colors.background }]}> 
      <Text style={[styles.title, { color: theme.colors.text }]}>Create / Manage Card Type</Text>
      <Input placeholder="Enter card type name" value={name} onChangeText={setName} />

      <View style={[styles.modeRow, { borderColor: theme.colors.border, backgroundColor: theme.colors.surface }]}> 
        <TouchableOpacity style={[styles.modeBtn, { backgroundColor: mode === MODE_CSV ? theme.colors.primary : 'transparent', borderColor: mode === MODE_CSV ? theme.colors.primary : 'transparent' }]} onPress={() => setMode(MODE_CSV)}>
          <Text style={{ color: mode === MODE_CSV ? '#fff' : theme.colors.text }}>CSV</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.modeBtn, { backgroundColor: mode === MODE_MANUAL ? theme.colors.primary : 'transparent', borderColor: mode === MODE_MANUAL ? theme.colors.primary : 'transparent' }]} onPress={() => setMode(MODE_MANUAL)}>
          <Text style={{ color: mode === MODE_MANUAL ? '#fff' : theme.colors.text }}>Manual (24 inputs)</Text>
        </TouchableOpacity>
      </View>

      {mode === MODE_CSV ? (
        <View style={[styles.section, { borderColor: theme.colors.border }]}> 
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Add card by CSV (24 numbers)</Text>
          <Input placeholder="11,24,31,... (24 numbers)" value={csv} onChangeText={setCsv} multiline />
          <Button title="Add Card From CSV" onPress={addFromCsv} />
        </View>
      ) : (
        <View style={[styles.section, { borderColor: theme.colors.border }]}> 
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Build card manually</Text>
          
          {/* BINGO Header */}
          <View style={styles.bingoHeader}>
            {['B', 'I', 'N', 'G', 'O'].map((letter, index) => (
              <View key={letter} style={[styles.bingoLetterBox, { borderColor: theme.colors.border, backgroundColor: theme.colors.primary }]}>
                <Text style={[styles.bingoLetter, { color: '#fff' }]}>{letter}</Text>
              </View>
            ))}
          </View>
          
          {/* 5x5 Grid */}
          <View style={styles.cardGrid5x5}>
            {Array.from({ length: 5 }).map((_, row) => (
              <View key={row} style={styles.gridRow}>
                {Array.from({ length: 5 }).map((_, col) => {
                  const isCenter = row === 2 && col === 2;
                  
                  if (isCenter) {
                    return (
                      <View key={`${row}-${col}`} style={[styles.gridCell, styles.centerCell, { borderColor: theme.colors.border, backgroundColor: theme.colors.surface }]}>
                        <Text style={[styles.centerText, { color: theme.colors.textSecondary }]}>FREE</Text>
                      </View>
                    );
                  }
                  
                  // Calculate the index in the 24-number array
                  let numberIndex = row * 5 + col;
                  if (numberIndex > 12) numberIndex--; // Adjust for center cell
                  
                  const val = currentManual[numberIndex];
                  
                  return (
                    <TextInput
                      key={`${row}-${col}`}
                      value={val === null ? '' : String(val)}
                      onChangeText={(t) => {
                        const n = t === '' ? null : Number(t);
                        const next = [...currentManual];
                        next[numberIndex] = Number.isFinite(n as number) ? (n as number) : null;
                        setCurrentManual(next);
                      }}
                      keyboardType="numeric"
                      style={[
                        styles.gridCell,
                        {
                          borderColor: val === null ? '#dc3545' : theme.colors.border,
                          backgroundColor: theme.colors.surface,
                          color: theme.colors.text,
                        },
                      ]}
                      placeholderTextColor={theme.colors.textSecondary}
                      placeholder="?"
                    />
                  );
                })}
              </View>
            ))}
          </View>
          
          <Text style={[styles.helper, { color: theme.colors.textSecondary }]}>Filled: {currentManual.filter(n => Number.isFinite(n as number)).length} / 24</Text>
          <View style={{ flexDirection: 'row', justifyContent: 'flex-end' }}>
            <Button title={editIndex !== null ? 'Update Card' : 'Save This Card'} onPress={saveManualCard} />
          </View>
        </View>
      )}

      <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Cards in this Cartela ({cards.length})</Text>
      {cards.map((row, idx) => (
        <View key={idx} style={[styles.cardRow, { borderColor: theme.colors.border }]}> 
          <View style={styles.cardRowHeader}>
            <Text style={[styles.cardIndex, { color: theme.colors.text }]}>{idx + 1}</Text>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {idx > 0 && (
                <Button title="↑" onPress={() => moveCard(idx, idx - 1)} size="sm" />
              )}
              {idx < cards.length - 1 && (
                <Button title="↓" onPress={() => moveCard(idx, idx + 1)} size="sm" />
              )}
              <Button title="✎" onPress={() => {
                setMode(MODE_MANUAL);
                setCurrentManual(row.map(x => x));
                const next = [...cards]; next.splice(idx, 1); setCards(next);
                setEditIndex(idx);
              }} size="sm" />
              <Button title="✕" onPress={() => removeCard(idx)} size="sm" />
            </View>
          </View>
          <View style={styles.cardGrid}>
            {row.map((n, i) => (
              <View key={i} style={[styles.cardCell, { borderColor: theme.colors.border }]}> 
                <Text style={{ color: theme.colors.text }}>{n}</Text>
              </View>
            ))}
          </View>
        </View>
      ))}

      <View style={{ height: 12 }} />
      <View style={{ flexDirection: 'row', justifyContent: 'flex-end' }}>
        <Button title="Save Cartela" onPress={submit} disabled={!canSubmit} />
      </View>
      <Modal visible={confirmVisible} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalCard, { backgroundColor: theme.colors.card }]}> 
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Save cartela?</Text>
            <Text style={{ color: theme.colors.textSecondary, marginBottom: 12 }}>Name: {name.trim()} | Cards: {cards.length}</Text>
            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 12 }}>
              <Button title="Cancel" variant="outline" onPress={() => setConfirmVisible(false)} />
              <Button title="Confirm" onPress={() => {
                addCustomCardType({ name: name.trim(), cards });
                selectCardTypeByName(name.trim());
                setConfirmVisible(false);
                Alert.alert('Saved', 'Card type saved successfully.');
                navigation.goBack();
              }} />
            </View>
          </View>
        </View>
      </Modal>
      <View style={{ height: 36 }} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { 
    padding: 16 
    },
  title: { 
    fontSize: 20, 
    fontWeight: '700', 
    marginBottom: 12 
  },
  section: { 
    borderWidth: 1, 
    borderRadius: 12, 
    padding: 12, 
    marginTop: 12 
  },
  sectionTitle: { fontSize: 16, fontWeight: '600', marginBottom: 8 },
  helper: { marginTop: 6, fontSize: 12 },
  modeRow: { flexDirection: 'row', gap: 8, borderWidth: 1, borderRadius: 10, padding: 6, marginTop: 12 },
  modeBtn: { flex: 1, alignItems: 'center', justifyContent: 'center', height: 40, borderRadius: 8, borderWidth: 1 },
  gridInputs: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  inputBox: { width: 64, height: 44, borderWidth: 1, borderRadius: 8, textAlign: 'center' },
  cardRow: { borderWidth: 1, borderRadius: 10, padding: 12, marginTop: 8, flexDirection: 'column' },
  cardRowHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  cardIndex: { width: 24, textAlign: 'center', fontWeight: '700', marginRight: 8 },
  cardGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, flex: 1 },
  cardCell: { width: 54, height: 40, borderWidth: 1, borderRadius: 6, alignItems: 'center', justifyContent: 'center' },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
  modalCard: { borderRadius: 12, padding: 16 },
  
  // 5x5 Grid styles
  bingoHeader: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 8,
    gap: 2,
  },
  bingoLetterBox: {
    width: 50,
    height: 32,
    borderWidth: 1,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bingoLetter: {
    fontSize: 16,
    fontWeight: '700',
  },
  cardGrid5x5: {
    alignItems: 'center',
    marginBottom: 12,
  },
  gridRow: {
    flexDirection: 'row',
    gap: 2,
    marginBottom: 2,
  },
  gridCell: {
    width: 50,
    height: 50,
    borderWidth: 1,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '600',
  },
  centerCell: {
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
  },
  centerText: {
    fontSize: 10,
    fontWeight: '700',
  },
});

