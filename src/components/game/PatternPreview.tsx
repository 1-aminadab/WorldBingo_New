import React, { useEffect, useMemo, useState } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import Animated, { useSharedValue, withTiming, useAnimatedStyle } from 'react-native-reanimated';
import { BingoPattern, ClassicLineType, PatternCategory } from '../../types';
import { useSettingsStore } from '../../store/settingsStore';
import { useGameTheme } from '../ui/ThemeProvider';

type Props = {
  size?: number; // pixel size for the square preview
};

export const PatternPreview: React.FC<Props> = ({ size = 120 }) => {
  const { theme } = useGameTheme();
  const { patternCategory, selectedPattern, classicSelectedLineTypes, classicLinesTarget } = useSettingsStore();

  const [activeCells, setActiveCells] = useState<boolean[][]>(Array(5).fill(null).map(() => Array(5).fill(false)));
  const pulse = useSharedValue(0);

  useEffect(() => {
    const id = setInterval(() => {
      setActiveCells(createPreview(patternCategory, selectedPattern, classicSelectedLineTypes || [], classicLinesTarget || 1));
      pulse.value = 0;
      pulse.value = withTiming(1, { duration: 600 });
    }, 1400);
    // first render immediately
    setActiveCells(createPreview(patternCategory, selectedPattern, classicSelectedLineTypes || [], classicLinesTarget || 1));
    pulse.value = withTiming(1, { duration: 600 });
    return () => clearInterval(id);
  }, [patternCategory, selectedPattern, classicSelectedLineTypes, classicLinesTarget]);

  const cellSize = useMemo(() => (size - 16) / 5, [size]);
  const animated = useAnimatedStyle(() => ({ opacity: 0.6 + 0.4 * pulse.value }));

  return (
    <Animated.View style={[styles.container, { width: size, height: size, backgroundColor: theme.colors.card }, animated]}>
      {Array.from({ length: 5 }).map((_, r) => (
        <View key={r} style={styles.row}>
          {Array.from({ length: 5 }).map((_, c) => {
            const isCenter = r === 2 && c === 2;
            return (
              <View
                key={`${r}-${c}`}
                style={[
                  styles.cell,
                  {
                    width: cellSize,
                    height: cellSize,
                    backgroundColor: activeCells[r][c] ? theme.colors.primary : theme.colors.surface,
                    borderColor: theme.colors.border,
                    justifyContent: 'center',
                    alignItems: 'center',
                  },
                ]}
              >
                {isCenter && (
                  <Text style={[styles.starIcon, { fontSize: cellSize * 0.6, color: theme.colors.text }]}>⭐</Text>
                )}
              </View>
            );
          })}
        </View>
      ))}
    </Animated.View>
  );
};

function createPreview(
  category: PatternCategory,
  selected: BingoPattern | null,
  classicTypes: ClassicLineType[],
  linesTarget: number,
): boolean[][] {
  const g = Array(5).fill(null).map(() => Array(5).fill(false));
  const pick = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

  const markRow = (r: number) => { for (let c = 0; c < 5; c++) g[r][c] = true; };
  const markCol = (c: number) => { for (let r = 0; r < 5; r++) g[r][c] = true; };
  const markDiag = (type: 'main' | 'anti') => {
    for (let i = 0; i < 5; i++) g[i][type === 'main' ? i : 4 - i] = true;
  };
  const markFourCorners = () => { g[0][0] = g[0][4] = g[4][0] = g[4][4] = true; };
  const markSmallCorners = () => { g[1][1] = g[1][3] = g[3][1] = g[3][3] = true; };
  const markPlus = () => { markRow(2); markCol(2); };
  const markX = () => { markDiag('main'); markDiag('anti'); };
  const markFull = () => { for (let r = 0; r < 5; r++) for (let c = 0; c < 5; c++) g[r][c] = true; };
  const markT = () => { markRow(0); markCol(2); };
  const markU = () => { markCol(0); markCol(4); markRow(4); };
  const markL = () => { markCol(0); markRow(4); };
  const markDiamond = () => {
    const pts = [ [0,2], [1,1],[1,3], [2,0],[2,2],[2,4], [3,1],[3,3], [4,2] ];
    pts.forEach(([r,c]) => g[r][c] = true);
  };

  if (category === 'classic') {
    if (selected === 'full_house') {
      markFull();
      return g;
    }
    const choices: Array<() => void> = [];
    if (classicTypes?.includes('horizontal')) choices.push(() => markRow(pick([0,1,2,3,4])));
    if (classicTypes?.includes('vertical')) choices.push(() => markCol(pick([0,1,2,3,4])));
    if (classicTypes?.includes('diagonal')) choices.push(() => markDiag((pick(['main','anti']) as 'main' | 'anti')));
    if (classicTypes?.includes('four_corners')) choices.push(markFourCorners);
    if (classicTypes?.includes('small_corners')) choices.push(markSmallCorners);
    if (classicTypes?.includes('plus')) choices.push(markPlus);
    if (classicTypes?.includes('x')) choices.push(markX);
    // Draw only one pattern at a time
    const n = 1;
    for (let i = 0; i < n && choices.length > 0; i++) {
      const fn = choices.splice(Math.floor(Math.random() * choices.length), 1)[0];
      fn();
    }
    return g;
  }

  // modern
  switch (selected) {
    case 'full_house': markFull(); break;
    case 't_shape': markT(); break;
    case 'u_shape': markU(); break;
    case 'l_shape': markL(); break;
    case 'x_shape': markX(); break;
    case 'plus_sign': markPlus(); break;
    case 'diamond': markDiamond(); break;
    case 'one_line': markRow(pick([0,1,2,3,4])); break;
    case 'two_lines': markRow(1); markRow(3); break; // simple two rows
    case 'three_lines': markRow(0); markRow(2); markRow(4); break;
    default: markRow(2); break;
  }
  return g;
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 8,
    padding: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  row: { 
    flexDirection: 'row',
    justifyContent: 'center',
  },
  cell: {
    borderWidth: 1,
    margin: 1,
    borderRadius: 3,
  },
  starIcon: {
    textAlign: 'center',
    fontWeight: 'bold',
  },
});

