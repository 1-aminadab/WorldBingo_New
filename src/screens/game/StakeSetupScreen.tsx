import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import LinearGradient from 'react-native-linear-gradient';
import { useTheme } from '../../components/ui/ThemeProvider';
import { useSettingsStore } from '../../store/settingsStore';
import { ScreenNames } from '../../constants/ScreenNames';


export const StakeSetupScreen: React.FC = () => {
  const navigation = useNavigation();
  const { theme } = useTheme();
  const { derashAmount, medebAmount, setDerashAmount, setMedebAmount, rtpPercentage } = useSettingsStore();
  const [derash, setDerash] = useState(String(derashAmount ?? 100));
  const [medeb, setMedeb] = useState(String(medebAmount ?? 20));

  // Auto-fill with persisted values on component mount
  React.useEffect(() => {
    if (derashAmount) {
      setDerash(String(derashAmount));
    }
    if (medebAmount) {
      setMedeb(String(medebAmount));
    }
  }, [derashAmount, medebAmount]);

  const startGame = () => {
    const d = Math.max(0, parseInt(derash || '0', 10));
    const m = Math.max(0, parseInt(medeb || '0', 10));
    setDerashAmount(d);
    setMedebAmount(m);
    navigation.navigate(ScreenNames.PLAYER_CARTELA_SELECTION as never);
  };

  const shownDerash = Math.round((parseInt(derash || '0', 10) * (rtpPercentage || 0)) / 100);

  return (
    <LinearGradient colors={[theme.colors.surface, theme.colors.background]} style={styles.container}>
      <KeyboardAvoidingScreen>
        <View style={[{ backgroundColor: theme.colors.surface, borderRadius: 8, padding: 16 }]}>
          <ScrollView style={styles.card}> 
          <Text style={[styles.title, { color: theme.colors.text }]}>Enter Stakes</Text>

          <View style={styles.row}> 
            <Text style={[styles.label, { color: theme.colors.textSecondary }]}>Derash (Birr)</Text>
            <TextInput
              keyboardType="number-pad"
              value={derash}
              onChangeText={setDerash}
              style={[styles.input, { borderColor: theme.colors.border, color: theme.colors.text }]}
              placeholder="100"
              placeholderTextColor={theme.colors.textSecondary}
            />
            <Text style={[styles.helper, { color: theme.colors.success }]}>Shown in game: {shownDerash} Birr (RTP)</Text>
          </View>

          <View style={styles.row}> 
            <Text style={[styles.label, { color: theme.colors.textSecondary }]}>Medeb (Birr)</Text>
            <TextInput
              keyboardType="number-pad"
              value={medeb}
              onChangeText={setMedeb}
              style={[styles.input, { borderColor: theme.colors.border, color: theme.colors.text }]}
              placeholder="20"
              placeholderTextColor={theme.colors.textSecondary}
            />
          </View>

          <TouchableOpacity onPress={startGame} style={[styles.startButton, { backgroundColor: theme.colors.primary }]}> 
            <Text style={styles.startText}>Start Game</Text>
          </TouchableOpacity>
          </ScrollView>
        </View>
      </KeyboardAvoidingScreen>
    </LinearGradient>
  );
};

const KeyboardAvoidingScreen: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      {children}
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 20, alignItems: 'center' },
  cardContainer: { alignSelf: 'center' },
  card: { flex: 1 },
  title: { fontSize: 20, fontWeight: '700', marginBottom: 12, textAlign: 'center' },
  row: { marginBottom: 16 },
  label: { fontSize: 14, marginBottom: 6 },
  input: { height: 48, borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, fontSize: 16 },
  helper: { fontSize: 12, marginTop: 6 },
  startButton: { marginTop: 4, paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  startText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});

