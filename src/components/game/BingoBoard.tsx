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
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import { useTheme } from '../ui/ThemeProvider';
import { BingoCard, DrawnNumber, BingoLetter } from '../../types';

interface BingoBoardProps {
  card: BingoCard;
  drawnNumbers: DrawnNumber[];
  lastDrawnNumber?: DrawnNumber;
}

interface CellProps {
  number: number;
  isDrawn: boolean;
  isLastDrawn: boolean;
  letter: BingoLetter;
}

const BingoCell: React.FC<CellProps> = ({ number, isDrawn, isLastDrawn, letter }) => {
  const { theme } = useTheme();
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);
  const glowOpacity = useSharedValue(0);

  React.useEffect(() => {
    if (isLastDrawn) {
      // Animate when this cell becomes the last drawn
      scale.value = withSequence(
        withSpring(1.2, { damping: 8 }),
        withSpring(1, { damping: 10 })
      );
      glowOpacity.value = withSequence(
        withTiming(1, { duration: 300 }),
        withTiming(0, { duration: 1000 })
      );
    }
  }, [isLastDrawn]);

  React.useEffect(() => {
    if (isDrawn && !isLastDrawn) {
      // Subtle animation for drawn numbers
      opacity.value = withTiming(0.8, { duration: 200 });
    }
  }, [isDrawn]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
      opacity: opacity.value,
    };
  });

  const glowStyle = useAnimatedStyle(() => {
    return {
      opacity: glowOpacity.value,
    };
  });

  return (
    <View style={styles.cellContainer}>
      {isLastDrawn && (
        <Animated.View style={[styles.cellGlow, glowStyle, { backgroundColor: theme.colors.primary }]} />
      )}
      <Animated.View
        style={[
          styles.cell,
          {
            backgroundColor: isDrawn 
              ? (isLastDrawn ? theme.colors.primary : theme.colors.success)
              : theme.colors.card,
            borderColor: isDrawn ? 'transparent' : theme.colors.border,
          },
          animatedStyle,
        ]}
      >
        <Text
          style={[
            styles.cellNumber,
            {
              color: isDrawn ? '#FFFFFF' : theme.colors.text,
              fontWeight: isDrawn ? 'bold' : '500',
            },
          ]}
        >
          {number}
        </Text>
      </Animated.View>
    </View>
  );
};

export const BingoBoard: React.FC<BingoBoardProps> = ({
  card,
  drawnNumbers,
  lastDrawnNumber,
}) => {
  const { theme } = useTheme();

  const isNumberDrawn = (letter: BingoLetter, number: number): boolean => {
    return drawnNumbers.some(drawn => drawn.letter === letter && drawn.number === number);
  };

  const isLastDrawn = (letter: BingoLetter, number: number): boolean => {
    return lastDrawnNumber?.letter === letter && lastDrawnNumber?.number === number;
  };

  const renderColumn = (letter: BingoLetter, numbers: number[]) => (
    <View key={letter} style={styles.column}>
      <View style={[styles.columnHeader, { backgroundColor: theme.colors.primary }]}>
        <Text style={styles.columnHeaderText}>{letter}</Text>
      </View>
      {numbers.map((number, index) => (
        <BingoCell
          key={`${letter}-${number}`}
          number={number}
          letter={letter}
          isDrawn={isNumberDrawn(letter, number)}
          isLastDrawn={isLastDrawn(letter, number)}
        />
      ))}
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.card }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.colors.text }]}>Your Bingo Card</Text>
      </View>
      
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.board}>
          {renderColumn('B', card.B)}
          {renderColumn('I', card.I)}
          {renderColumn('N', card.N)}
          {renderColumn('G', card.G)}
          {renderColumn('O', card.O)}
        </View>
      </ScrollView>

      {/* Stats */}
      <View style={styles.stats}>
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: theme.colors.primary }]}>
            {drawnNumbers.length}
          </Text>
          <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
            Called
          </Text>
        </View>
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: theme.colors.success }]}>
            {drawnNumbers.filter(drawn => 
              Object.entries(card).some(([letter, numbers]) => 
                letter === drawn.letter && numbers.includes(drawn.number)
              )
            ).length}
          </Text>
          <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
            Matched
          </Text>
        </View>
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: theme.colors.secondary }]}>
            {25 - drawnNumbers.filter(drawn => 
              Object.entries(card).some(([letter, numbers]) => 
                letter === drawn.letter && numbers.includes(drawn.number)
              )
            ).length}
          </Text>
          <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
            Remaining
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  header: {
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
  },
  scrollContent: {
    paddingHorizontal: 8,
  },
  board: {
    flexDirection: 'row',
    gap: 4,
  },
  column: {
    alignItems: 'center',
  },
  columnHeader: {
    width: 50,
    height: 40,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  columnHeaderText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  cellContainer: {
    position: 'relative',
    marginBottom: 4,
  },
  cell: {
    width: 50,
    height: 50,
    borderRadius: 8,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cellGlow: {
    position: 'absolute',
    top: -4,
    left: -4,
    right: -4,
    bottom: -4,
    borderRadius: 12,
    zIndex: -1,
  },
  cellNumber: {
    fontSize: 16,
    textAlign: 'center',
  },
  stats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
});