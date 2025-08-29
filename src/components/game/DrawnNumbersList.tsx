import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  Layout,
  FadeInLeft,
} from 'react-native-reanimated';
import { useTheme } from '../ui/ThemeProvider';
import { DrawnNumber } from '../../types';

interface DrawnNumbersListProps {
  drawnNumbers: DrawnNumber[];
  maxVisible?: number;
}

interface NumberBadgeProps {
  drawnNumber: DrawnNumber;
  isLatest: boolean;
}

const NumberBadge: React.FC<NumberBadgeProps> = ({ drawnNumber, isLatest }) => {
  const { theme } = useTheme();
  const scale = useSharedValue(1);

  React.useEffect(() => {
    if (isLatest) {
      scale.value = withSequence(
        withSpring(1.2, { damping: 8 }),
        withSpring(1, { damping: 10 })
      );
    }
  }, [isLatest]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
    };
  });

  const getLetterColor = (letter: string): string => {
    const colors = {
      B: '#2563EB',
      I: '#3B82F6',
      N: '#1D4ED8',
      G: '#10B981',
      O: '#F59E0B',
    };
    return colors[letter as keyof typeof colors] || theme.colors.primary;
  };

  return (
    <Animated.View
      entering={FadeInLeft.delay(100)}
      layout={Layout.springify()}
      style={[
        styles.numberBadge,
        {
          backgroundColor: isLatest ? theme.colors.primary : theme.colors.surface,
          borderColor: isLatest ? theme.colors.primary : getLetterColor(drawnNumber.letter),
        },
        animatedStyle,
      ]}
    >
      <Text
        style={[
          styles.letterText,
          {
            color: isLatest ? '#FFFFFF' : getLetterColor(drawnNumber.letter),
          },
        ]}
      >
        {drawnNumber.letter}
      </Text>
      <Text
        style={[
          styles.numberText,
          {
            color: isLatest ? '#FFFFFF' : theme.colors.text,
          },
        ]}
      >
        {drawnNumber.number}
      </Text>
    </Animated.View>
  );
};

export const DrawnNumbersList: React.FC<DrawnNumbersListProps> = ({
  drawnNumbers,
  maxVisible = 10,
}) => {
  const { theme } = useTheme();

  const visibleNumbers = drawnNumbers.slice(-maxVisible).reverse();
  const latestNumber = drawnNumbers[drawnNumbers.length - 1];

  if (drawnNumbers.length === 0) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.card }]}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.colors.text }]}>
            Drawn Numbers
          </Text>
          <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
            Numbers will appear here as they're called
          </Text>
        </View>
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>🎱</Text>
          <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
            Waiting for first draw...
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.card }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.colors.text }]}>
          Drawn Numbers
        </Text>
        <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
          {drawnNumbers.length} number{drawnNumbers.length !== 1 ? 's' : ''} called
        </Text>
      </View>

      {latestNumber && (
        <View style={styles.latestContainer}>
          <Text style={[styles.latestLabel, { color: theme.colors.textSecondary }]}>
            Latest Call
          </Text>
          <View style={[styles.latestBadge, { backgroundColor: theme.colors.primary }]}>
            <Text style={styles.latestLetter}>{latestNumber.letter}</Text>
            <Text style={styles.latestNumber}>{latestNumber.number}</Text>
          </View>
        </View>
      )}

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        style={styles.scrollView}
      >
        <View style={styles.numbersContainer}>
          {visibleNumbers.map((drawnNumber, index) => (
            <NumberBadge
              key={`${drawnNumber.letter}-${drawnNumber.number}-${drawnNumber.timestamp.getTime()}`}
              drawnNumber={drawnNumber}
              isLatest={index === 0 && drawnNumber === latestNumber}
            />
          ))}
        </View>
      </ScrollView>

      {drawnNumbers.length > maxVisible && (
        <Text style={[styles.moreText, { color: theme.colors.textSecondary }]}>
          +{drawnNumbers.length - maxVisible} more numbers
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  header: {
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
  },
  latestContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  latestLabel: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  latestBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  latestLetter: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: 'bold',
  },
  latestNumber: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: 'bold',
  },
  scrollView: {
    maxHeight: 80,
  },
  scrollContent: {
    paddingHorizontal: 4,
  },
  numbersContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  numberBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    gap: 4,
  },
  letterText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  numberText: {
    fontSize: 16,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  emptyIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    fontStyle: 'italic',
  },
  moreText: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 8,
    fontStyle: 'italic',
  },
});