import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useTheme } from '../ui/ThemeProvider';
import { BingoLetter } from '../../types';

interface CalledNumber {
  letter: BingoLetter;
  number: number;
  timestamp: Date;
}

interface CalledNumbersBoardProps {
  calledNumbers: CalledNumber[];
  currentNumber?: CalledNumber;
}

export const CalledNumbersBoard: React.FC<CalledNumbersBoardProps> = ({
  calledNumbers,
  currentNumber,
}) => {
  const { theme } = useTheme();

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

  const getNumbersForLetter = (letter: BingoLetter) => {
    return calledNumbers.filter(num => num.letter === letter);
  };

  const letters: BingoLetter[] = ['B', 'I', 'N', 'G', 'O'];

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.card }]}>
      {/* Current Number Display */}
      {currentNumber && (
        <View style={[styles.currentNumber, { backgroundColor: theme.colors.primary }]}>
          <Text style={styles.currentNumberText}>
            {currentNumber.letter} - {currentNumber.number}
          </Text>
        </View>
      )}

      {/* Header */}
      <View style={styles.header}>
        {letters.map(letter => (
          <View key={letter} style={[styles.columnHeader, { backgroundColor: getLetterColor(letter) }]}>
            <Text style={styles.headerText}>{letter}</Text>
          </View>
        ))}
      </View>

      {/* Numbers Grid */}
      <ScrollView style={styles.numbersContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.numbersGrid}>
          {letters.map(letter => (
            <View key={letter} style={styles.column}>
              {getNumbersForLetter(letter).map((calledNum, index) => (
                <View
                  key={`${calledNum.letter}-${calledNum.number}`}
                  style={[
                    styles.numberCell,
                    { 
                      backgroundColor: getLetterColor(letter),
                      opacity: 0.8 + (index * 0.02), // Newer numbers slightly more opaque
                    },
                  ]}
                >
                  <Text style={styles.numberText}>{calledNum.number}</Text>
                </View>
              ))}
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Stats */}
      <View style={[styles.stats, { backgroundColor: theme.colors.surface }]}>
        <Text style={[styles.statsText, { color: theme.colors.text }]}>
          Total Called: {calledNumbers.length}/75
        </Text>
        <Text style={[styles.statsText, { color: theme.colors.textSecondary }]}>
          Remaining: {75 - calledNumbers.length}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    borderRadius: 16,
    padding: 16,
    margin: 8,
  },
  currentNumber: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 16,
  },
  currentNumberText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
  },
  header: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  columnHeader: {
    flex: 1,
    padding: 12,
    alignItems: 'center',
    marginHorizontal: 2,
    borderRadius: 8,
  },
  headerText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },
  numbersContainer: {
    flex: 1,
    maxHeight: 300,
  },
  numbersGrid: {
    flexDirection: 'row',
  },
  column: {
    flex: 1,
    marginHorizontal: 2,
  },
  numberCell: {
    padding: 8,
    alignItems: 'center',
    marginVertical: 2,
    borderRadius: 6,
  },
  numberText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  stats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
  },
  statsText: {
    fontSize: 14,
    fontWeight: '500',
  },
});