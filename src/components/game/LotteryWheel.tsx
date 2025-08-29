import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  withRepeat,
  runOnJS,
  interpolate,
  Extrapolate,
} from 'react-native-reanimated';
import { useTheme } from '../ui/ThemeProvider';
import { BingoLetter } from '../../types';

const { width } = Dimensions.get('window');

interface LotteryWheelProps {
  isSpinning: boolean;
  onSpinComplete: (letter: BingoLetter, number: number) => void;
}

export const LotteryWheel: React.FC<LotteryWheelProps> = ({
  isSpinning,
  onSpinComplete,
}) => {
  const { theme } = useTheme();
  const rotation = useSharedValue(0);
  const letterRotation = useSharedValue(0);
  const numberRotation = useSharedValue(0);
  const scale = useSharedValue(1);

  const letters: BingoLetter[] = ['B', 'I', 'N', 'G', 'O'];
  
  const getNumberRange = (letter: BingoLetter): [number, number] => {
    switch (letter) {
      case 'B': return [1, 15];
      case 'I': return [16, 30];
      case 'N': return [31, 45];
      case 'G': return [46, 60];
      case 'O': return [61, 75];
    }
  };

  const spinComplete = () => {
    const finalLetterIndex = Math.floor(Math.random() * 5);
    const selectedLetter = letters[finalLetterIndex];
    const [min, max] = getNumberRange(selectedLetter);
    const selectedNumber = Math.floor(Math.random() * (max - min + 1)) + min;
    
    onSpinComplete(selectedLetter, selectedNumber);
  };

  useEffect(() => {
    if (isSpinning) {
      // Start spinning with excitement
      scale.value = withSequence(
        withTiming(1.2, { duration: 200 }),
        withTiming(1, { duration: 200 })
      );

      // Spin the main wheel
      rotation.value = withSequence(
        withRepeat(
          withTiming(360, { duration: 100 }),
          8,
          false
        ),
        withTiming(0, { duration: 500 }, () => {
          runOnJS(spinComplete)();
        })
      );

      // Spin letter wheel
      letterRotation.value = withSequence(
        withRepeat(
          withTiming(360, { duration: 150 }),
          6,
          false
        ),
        withTiming(0, { duration: 400 })
      );

      // Spin number wheel
      numberRotation.value = withSequence(
        withRepeat(
          withTiming(360, { duration: 120 }),
          7,
          false
        ),
        withTiming(0, { duration: 600 })
      );
    }
  }, [isSpinning]);

  const wheelStyle = useAnimatedStyle(() => ({
    transform: [
      { rotate: `${rotation.value}deg` },
      { scale: scale.value },
    ],
  }));

  const letterWheelStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${letterRotation.value}deg` }],
  }));

  const numberWheelStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${numberRotation.value}deg` }],
  }));

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.wheel, wheelStyle]}>
        {/* Outer Ring - Letters */}
        <Animated.View style={[styles.letterWheel, letterWheelStyle]}>
          {letters.map((letter, index) => (
            <View
              key={letter}
              style={[
                styles.letterSegment,
                {
                  backgroundColor: getLetterColor(letter),
                  transform: [{ rotate: `${index * 72}deg` }],
                },
              ]}
            >
              <Text style={styles.letterText}>{letter}</Text>
            </View>
          ))}
        </Animated.View>

        {/* Inner Ring - Random Numbers during spin */}
        <Animated.View style={[styles.numberWheel, numberWheelStyle]}>
          {Array.from({ length: 10 }, (_, index) => {
            const randomNum = isSpinning 
              ? Math.floor(Math.random() * 75) + 1 
              : ((index + 1) * 7) % 75 + 1;
            
            return (
              <View
                key={`${index}-${isSpinning ? Math.random() : 'static'}`}
                style={[
                  styles.numberSegment,
                  {
                    backgroundColor: isSpinning ? '#FF6B6B' : theme.colors.surface,
                    transform: [{ rotate: `${index * 36}deg` }],
                  },
                ]}
              >
                <Text style={[styles.numberText, { 
                  color: isSpinning ? 'white' : theme.colors.text,
                  fontWeight: isSpinning ? 'bold' : 'normal',
                }]}>
                  {randomNum}
                </Text>
              </View>
            );
          })}
        </Animated.View>

        {/* Center Circle */}
        <View style={[styles.center, { backgroundColor: theme.colors.primary }]}>
          <Text style={styles.centerText}>🎰</Text>
        </View>
      </Animated.View>

      {/* Pointer */}
      <View style={[styles.pointer, { backgroundColor: theme.colors.accent }]} />
    </View>
  );
};

const getLetterColor = (letter: BingoLetter): string => {
  const colors = {
    B: '#2563EB',
    I: '#3B82F6', 
    N: '#1D4ED8',
    G: '#10B981',
    O: '#F59E0B',
  };
  return colors[letter];
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    height: width * 0.8,
    width: width * 0.8,
  },
  wheel: {
    width: width * 0.7,
    height: width * 0.7,
    borderRadius: (width * 0.7) / 2,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  letterWheel: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderRadius: (width * 0.7) / 2,
  },
  numberWheel: {
    position: 'absolute',
    width: '60%',
    height: '60%',
    borderRadius: (width * 0.42) / 2,
  },
  letterSegment: {
    position: 'absolute',
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    top: 10,
    left: '50%',
    marginLeft: -30,
  },
  numberSegment: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    top: 5,
    left: '50%',
    marginLeft: -20,
  },
  letterText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  numberText: {
    fontSize: 16,
    fontWeight: '600',
  },
  center: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  centerText: {
    fontSize: 32,
  },
  pointer: {
    position: 'absolute',
    top: -10,
    width: 0,
    height: 0,
    borderLeftWidth: 15,
    borderRightWidth: 15,
    borderBottomWidth: 30,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
  },
});