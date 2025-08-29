import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Animated from 'react-native-reanimated';
import { PatternPreview } from '../../../components/game/PatternPreview';
import { DrawnNumber } from '../../../types';

type Props = {
  theme: any;
  lettersArea: React.ReactNode;
  calledCount: number;
  current: DrawnNumber | null;
  ballAnimStyle: any;
  recent: DrawnNumber[];
  derashShown: number;
  medebAmount: number;
  paused: boolean;
  onTogglePause: () => void;
  onEnd: () => void;
  onOpenCheck: () => void;
};

export const PortraitGameLayout: React.FC<Props> = ({
  theme,
  lettersArea,
  calledCount,
  current,
  ballAnimStyle,
  recent,
  derashShown,
  medebAmount,
  paused,
  onTogglePause,
  onEnd,
  onOpenCheck,
}) => {
  return (
    <View style={styles.root}>
      <View style={[styles.headerRow]}> 
        <View style={{ flex: 1 }}>{lettersArea}</View>
        <Text style={[styles.counter, { color: theme.colors.text }]}>{calledCount}/75</Text>
      </View>

      <View style={styles.mainRow}>
        <View style={styles.ballArea}>
          <Animated.View style={[styles.ballOuterSm, ballAnimStyle]}> 
            <View style={[styles.ballInnerSm, { borderColor: theme.colors.primary }]}> 
              <Text style={styles.ballNumberSm}>{current ? current.number : '--'}</Text>
            </View>
          </Animated.View>
          <View style={styles.recentRow}>
            {recent.map((n, idx) => (
              <View key={`${n.number}-${idx}`} style={[styles.recentCircleSm, { borderColor: theme.colors.border }]}> 
                <Text style={styles.recentTextSm}>{n.number}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.infoCol}>
          <View style={styles.derashBox}><Text style={[styles.infoText, { color: theme.colors.text }]}>Derash: {derashShown} Birr</Text><Text style={[styles.infoText, { color: theme.colors.text }]}>Medeb: {medebAmount ?? 0} Birr</Text></View>
          <View style={styles.logoBox}><Text style={styles.logoText}>BINGO!</Text></View>
          <View style={styles.patternBox}>
            <Text style={[styles.patternTitle, { color: theme.colors.text }]}>Pattern</Text>
            <View style={styles.patternHeaderRow}>{['B','I','N','G','O'].map(l => (<Text key={`ph-${l}`} style={styles.patternHeaderLetter}>{l}</Text>))}</View>
            <PatternPreview size={88} />
          </View>
        </View>
      </View>

      <View style={styles.bottomActions}>
        <TouchableOpacity onPress={onEnd} style={[styles.actionBtn, { backgroundColor: theme.colors.card }]}> 
          <Text style={styles.actionText}>End</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={onTogglePause} style={[styles.actionBtn, { backgroundColor: theme.colors.card }]}> 
          <Text style={styles.actionText}>{paused ? 'Resume' : 'Pause'}</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={onOpenCheck} style={[styles.actionBtn, { backgroundColor: theme.colors.card }]}> 
          <Text style={styles.actionText}>Check</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, paddingHorizontal: 12 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 },
  counter: { fontSize: 14, fontWeight: '700' },
  mainRow: { flex: 1, flexDirection: 'row', marginTop: 8 },
  ballArea: { alignItems: 'center', paddingVertical: 6, flex: 1 },
  ballOuterSm: { width: 120, height: 120, borderRadius: 60, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff', shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 8 },
  ballInnerSm: { width: 86, height: 86, borderRadius: 43, borderWidth: 7, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' },
  ballNumberSm: { fontSize: 34, fontWeight: '900' },
  recentRow: { flexDirection: 'row', marginTop: 6 },
  recentCircleSm: { width: 28, height: 28, borderRadius: 14, borderWidth: 2, marginHorizontal: 4, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' },
  recentTextSm: { fontWeight: '700', fontSize: 12 },
  infoCol: { width: 160, paddingLeft: 10, justifyContent: 'flex-start' },
  derashBox: { paddingVertical: 8 },
  logoBox: { height: 52, borderRadius: 10, marginBottom: 8, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff', paddingHorizontal: 8 },
  logoText: { fontSize: 22, fontWeight: '900' },
  patternBox: { alignItems: 'center' },
  patternTitle: { fontSize: 14, fontWeight: '700', marginBottom: 6 },
  patternHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', width: 120, marginBottom: 6 },
  patternHeaderLetter: { fontSize: 12, fontWeight: '700' },
  bottomActions: { flexDirection: 'row', justifyContent: 'space-around', paddingVertical: 12 },
  actionBtn: { width: 110, paddingVertical: 12, borderRadius: 10, alignItems: 'center', marginVertical: 8 },
  actionText: { fontWeight: '700' },
});

