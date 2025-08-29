import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  withDelay,
  runOnJS,
  Easing,
  withSpring,
} from 'react-native-reanimated';
import LinearGradient from 'react-native-linear-gradient';
import { useTheme } from '../ui/ThemeProvider';
import { BingoLetter, DrawnNumber } from '../../types';

const { width } = Dimensions.get('window');

interface SlotMachineProps {
  onDrawComplete: (result: DrawnNumber) => void;
  isSpinning: boolean;
  triggerSpin: boolean;
}

const LETTERS: BingoLetter[] = ['B', 'I', 'N', 'G', 'O'];
const NUMBERS = Array.from({ length: 75 }, (_, i) => i + 1);

export const SlotMachine: React.FC<SlotMachineProps> = ({
  onDrawComplete,
  isSpinning,
  triggerSpin,
}) => {
  const { theme } = useTheme();
  
  // Animation values
  const letterTranslateY = useSharedValue(0);
  const numberTranslateY = useSharedValue(0);
  const letterScale = useSharedValue(1);
  const numberScale = useSharedValue(1);
  const containerScale = useSharedValue(1);
  const glowOpacity = useSharedValue(0);
  
  // Display values
  const [displayLetter, setDisplayLetter] = useState<BingoLetter>('B');
  const [displayNumber, setDisplayNumber] = useState<number>(1);
  const [finalResult, setFinalResult] = useState<DrawnNumber | null>(null);

  useEffect(() => {
    if (triggerSpin && !isSpinning) {
      startSpinAnimation();
    }
  }, [triggerSpin]);

  const generateRandomResult = (): DrawnNumber => {
    const letter = LETTERS[Math.floor(Math.random() * LETTERS.length)];
    let numberRange: [number, number];
    
    switch (letter) {
      case 'B': numberRange = [1, 15]; break;
      case 'I': numberRange = [16, 30]; break;
      case 'N': numberRange = [31, 45]; break;
      case 'G': numberRange = [46, 60]; break;
      case 'O': numberRange = [61, 75]; break;
      default: numberRange = [1, 15];
    }
    
    const number = Math.floor(Math.random() * (numberRange[1] - numberRange[0] + 1)) + numberRange[0];
    
    return {
      letter,
      number,
      timestamp: new Date(),
    };
  };

  const animateSpinningValues = () => {
    // Rapidly change displayed values during spin
    const interval = setInterval(() => {
      setDisplayLetter(LETTERS[Math.floor(Math.random() * LETTERS.length)]);
      setDisplayNumber(NUMBERS[Math.floor(Math.random() * NUMBERS.length)]);
    }, 50);

    return interval;
  };

  const startSpinAnimation = () => {
    const result = generateRandomResult();
    setFinalResult(result);

    // Start rapid value changes
    const spinInterval = animateSpinningValues();

    // Container entrance animation
    containerScale.value = withSpring(1.1, { damping: 8 });

    // Start spinning animations
    letterTranslateY.value = withTiming(-300, { 
      duration: 100, 
      easing: Easing.out(Easing.quad) 
    });
    numberTranslateY.value = withTiming(-300, { 
      duration: 100, 
      easing: Easing.out(Easing.quad) 
    });

    // Spin phase - multiple rotations
    letterTranslateY.value = withSequence(
      withTiming(-300, { duration: 100 }),
      withTiming(1500, { duration: 2000, easing: Easing.out(Easing.cubic) }),
      withTiming(0, { duration: 800, easing: Easing.out(Easing.bounce) })
    );

    numberTranslateY.value = withSequence(
      withTiming(-300, { duration: 100 }),
      withTiming(1800, { duration: 2200, easing: Easing.out(Easing.cubic) }),
      withTiming(0, { duration: 800, easing: Easing.out(Easing.bounce) })
    );

    // Stop spinning and show result
    setTimeout(() => {
      clearInterval(spinInterval);
      runOnJS(setDisplayLetter)(result.letter);
      runOnJS(setDisplayNumber)(result.number);
    }, 2300);

    // Scale and glow effects for result reveal
    setTimeout(() => {
      letterScale.value = withSequence(
        withTiming(1.3, { duration: 300 }),
        withTiming(1, { duration: 300 })
      );
      numberScale.value = withSequence(
        withTiming(1.3, { duration: 300 }),
        withTiming(1, { duration: 300 })
      );
      glowOpacity.value = withSequence(
        withTiming(1, { duration: 200 }),
        withTiming(0, { duration: 800 })
      );
      containerScale.value = withSpring(1, { damping: 10 });
    }, 3100);

    // Complete animation and notify parent
    setTimeout(() => {
      runOnJS(onDrawComplete)(result);
    }, 3500);
  };

  const letterAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateY: letterTranslateY.value },
        { scale: letterScale.value },
      ],
    };
  });

  const numberAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateY: numberTranslateY.value },
        { scale: numberScale.value },
      ],
    };
  });

  const containerAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: containerScale.value }],
    };
  });

  const glowAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: glowOpacity.value,
    };
  });

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.slotMachine, containerAnimatedStyle]}>
        <LinearGradient
          colors={[theme.colors.primary, theme.colors.primaryDark]}
          style={styles.machineBody}
        >
          {/* Glow Effect */}
          <Animated.View style={[styles.glow, glowAnimatedStyle]} />
          
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerText}>BINGO CALLER</Text>
            <View style={styles.lights}>
              {[1, 2, 3].map((i) => (
                <View key={i} style={[styles.light, { backgroundColor: theme.colors.accent }]} />
              ))}
            </View>
          </View>

          {/* Display Area */}
          <View style={[styles.display, { backgroundColor: theme.colors.card }]}>
            <View style={styles.resultContainer}>
              {/* Letter Reel */}
              <View style={styles.reel}>
                <View style={styles.reelWindow}>
                  <Animated.Text style={[styles.letterText, letterAnimatedStyle, { color: theme.colors.primary }]}>
                    {displayLetter}
                  </Animated.Text>
                </View>
                <Text style={[styles.reelLabel, { color: theme.colors.textSecondary }]}>LETTER</Text>
              </View>

              {/* Separator */}
              <View style={[styles.separator, { backgroundColor: theme.colors.border }]} />

              {/* Number Reel */}
              <View style={styles.reel}>
                <View style={styles.reelWindow}>
                  <Animated.Text style={[styles.numberText, numberAnimatedStyle, { color: theme.colors.primary }]}>
                    {displayNumber}
                  </Animated.Text>
                </View>
                <Text style={[styles.reelLabel, { color: theme.colors.textSecondary }]}>NUMBER</Text>
              </View>
            </View>
          </View>

          {/* Status Indicator */}
          <View style={styles.statusContainer}>
            <View style={[
              styles.statusLight,
              { backgroundColor: isSpinning ? theme.colors.warning : theme.colors.success }
            ]} />
            <Text style={[styles.statusText, { color: '#FFFFFF' }]}>
              {isSpinning ? 'DRAWING...' : 'READY'}
            </Text>
          </View>
        </LinearGradient>
      </Animated.View>

      {/* Decorative elements */}
      <View style={styles.decorations}>
        <Text style={styles.decorativeText}>🎰</Text>
        <Text style={styles.decorativeText}>🎯</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  slotMachine: {
    width: width * 0.85,
    maxWidth: 320,
  },
  machineBody: {
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
    position: 'relative',
    overflow: 'hidden',
  },
  glow: {
    position: 'absolute',
    top: -10,
    left: -10,
    right: -10,
    bottom: -10,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 30,
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
  },
  headerText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    letterSpacing: 2,
    marginBottom: 8,
  },
  lights: {
    flexDirection: 'row',
    gap: 8,
  },
  light: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  display: {
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  resultContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  reel: {
    alignItems: 'center',
    flex: 1,
  },
  reelWindow: {
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  letterText: {
    fontSize: 56,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  numberText: {
    fontSize: 48,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  reelLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 8,
    letterSpacing: 1,
  },
  separator: {
    width: 2,
    height: 60,
    marginHorizontal: 20,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  statusLight: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 1,
  },
  decorations: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 40,
    marginTop: 20,
  },
  decorativeText: {
    fontSize: 24,
    opacity: 0.3,
  },
});