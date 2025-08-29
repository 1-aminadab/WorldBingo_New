import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { DrawnNumber, GameStackParamList } from '../../types';
import { useTheme } from '../../components/ui/ThemeProvider';

type RouteParam = {
  params: GameStackParamList['GameSummary'];
};

export const GameSummaryScreen: React.FC = () => {
  const route = useRoute<RouteParam>();
  const navigation = useNavigation();
  const { theme } = useTheme();
  const data = route.params;

  const goHome = () => navigation.getParent()?.navigate('MainTabs' as never);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={[styles.card, { backgroundColor: theme.colors.card }]}> 
        <Text style={[styles.title, { color: theme.colors.text }]}>Session Summary</Text>
        <Text style={[styles.row, { color: theme.colors.text }]}>Drawn: {data?.totalDrawn ?? 0} / 75</Text>
        <Text style={[styles.row, { color: theme.colors.text }]}>Derash (shown): {data?.derashShownBirr ?? 0} Birr</Text>
        <Text style={[styles.row, { color: theme.colors.text }]}>Medeb: {data?.medebBirr ?? 0} Birr</Text>
        <Text style={[styles.row, { color: theme.colors.textSecondary }]}>Duration: {Math.floor((data?.durationSeconds ?? 0) / 60)}:{((data?.durationSeconds ?? 0)%60).toString().padStart(2,'0')}</Text>
      </View>
      <View style={[styles.card, { backgroundColor: theme.colors.card }]}> 
        <Text style={[styles.subtitle, { color: theme.colors.text }]}>Numbers</Text>
        <View style={styles.grid}>
          {data?.history?.map((n, idx) => (
            <View key={idx} style={[styles.chip, { borderColor: theme.colors.border }]}> 
              <Text>{n.letter} {n.number}</Text>
            </View>
          ))}
        </View>
      </View>

      <TouchableOpacity onPress={goHome} style={[styles.button, { backgroundColor: theme.colors.primary }]}> 
        <Text style={styles.buttonText}>Back to Home</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { padding: 20 },
  card: { borderRadius: 16, padding: 16, marginBottom: 16 },
  title: { fontSize: 20, fontWeight: '700', marginBottom: 8 },
  subtitle: { fontSize: 16, fontWeight: '600', marginBottom: 8 },
  row: { fontSize: 14, marginBottom: 4 },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  chip: { paddingVertical: 6, paddingHorizontal: 10, borderRadius: 16, borderWidth: 1, margin: 4 },
  button: { alignItems: 'center', paddingVertical: 14, borderRadius: 12 },
  buttonText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});

