import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useGameTheme } from '../ui/ThemeProvider';
import { DrawnNumber, BingoLetter } from '../../types';


interface BingoGridProps {
  cardIndex: number;
  cardTypes?: any[]; // Legacy prop for backward compatibility
  cards?: number[][]; // New prop for direct card data
  calledNumbers: DrawnNumber[];
  userClickedNumbers: Set<number>;
  onNumberClick: (number: number) => void;
  style?: any;
  cardNumber?: number;
}

export const BingoGrid: React.FC<BingoGridProps> = ({
  cardIndex,
  cardTypes,
  cards,
  calledNumbers,
  userClickedNumbers,
  onNumberClick,
  style,
  cardNumber,
}) => {
  const { theme } = useGameTheme();

  // Use direct cards prop if provided, otherwise fall back to legacy cardTypes prop
  let gameCards: number[][];
  
  if (cards && cards.length > 0) {
    gameCards = cards;
  } else if (cardTypes && cardTypes.length > 0) {
    // Legacy support: assume first cardType has cards property
    const cartela = cardTypes[0];
    if (!cartela || !cartela.cards || !Array.isArray(cartela.cards)) {
      return null;
    }
    gameCards = cartela.cards;
  } else {
    return null;
  }
  
  if (cardIndex >= gameCards.length) {
    return null;
  }
  
  const numbers24 = gameCards[cardIndex];
  
  const gridNumbers: (number | null)[][] = Array(5).fill(null).map(() => Array(5).fill(null));
  let p = 0;
  for (let r = 0; r < 5; r++) {
    for (let c = 0; c < 5; c++) {
      if (r === 2 && c === 2) continue; // free center
      gridNumbers[r][c] = numbers24[p++] ?? null;
    }
  }

  const isCalled = (num: number): boolean => {
    let letter: BingoLetter = 'B';
    if (num >= 1 && num <= 15) letter = 'B'; 
    else if (num <= 30) letter = 'I'; 
    else if (num <= 45) letter = 'N'; 
    else if (num <= 60) letter = 'G'; 
    else letter = 'O';
    return calledNumbers.some(d => d.number === num && d.letter === letter);
  };

  return (
    <View style={[{ backgroundColor: theme.colors.surface, borderRadius: 8, padding: 8 }, style]}>
      <View style={styles.bingoCardContent}>
        {/* Card number at the top */}
        {cardNumber && (
          <View style={styles.cardNumberHeader}>
            <Text style={[styles.cardNumberText, { color: theme.colors.text }]}>Card #{cardNumber}</Text>
          </View>
        )}
        
        {/* Header letters */}
        <View style={styles.bingoCardHeader}>
          {['B', 'I', 'N', 'G', 'O'].map((letter) => (
            <View key={letter} style={styles.bingoHeaderCell}>
              <Text style={[styles.bingoHeaderText, { color: theme.colors.text }]}>{letter}</Text>
            </View>
          ))}
        </View>
        
        {/* Grid */}
        {Array.from({ length: 5 }).map((_, r) => (
          <View key={`r-${r}`} style={styles.bingoRow}>
            {Array.from({ length: 5 }).map((_, c) => {
              const isCenter = r === 2 && c === 2;
              const value = isCenter ? null : gridNumbers[r][c];
              const isCalledNumber = value != null && isCalled(value);
              const isClickedByUser = isCenter ? userClickedNumbers.has(0) : (value != null && userClickedNumbers.has(value));
              const isHighlighted = isClickedByUser;
              
              const cellColor = isHighlighted ? theme.colors.primary : theme.colors.background;
              const textColor = isHighlighted ? '#fff' : theme.colors.text;
              
              return (
                <TouchableOpacity 
                  key={`c-${c}`} 
                  style={[styles.bingoCell, { 
                    backgroundColor: cellColor, 
                    borderColor: theme.colors.border 
                  }]}
                  onPress={() => {
                    if (isCenter) {
                      onNumberClick(0);
                    } else if (value != null) {
                      onNumberClick(value);
                    }
                  }}
                  disabled={false}
                >
                  <Text style={[styles.bingoCellText, { color: textColor }]}>
                    {isCenter ? '★' : value}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  bingoCardContent: {
    width: '100%',
    flex: 1,
  },
  cardNumberHeader: {
    alignItems: 'center',
    paddingVertical: 4,
    marginBottom: 2,
  },
  cardNumberText: {
    fontSize: 12,
    fontWeight: '700',
  },
  bingoCardHeader: {
    flexDirection: 'row',
    marginBottom: 2,
  },
  bingoHeaderCell: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 4,
  },
  bingoHeaderText: {
    fontSize: 14,
    fontWeight: '800',
  },
  bingoRow: {
    flexDirection: 'row',
  },
  bingoCell: {
    flex: 1,
    borderWidth: 1,
    margin: 0.5,
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 4,
    height: 35,
    minHeight: 35,
  },
  bingoCellText: {
    fontSize: 14,
    fontWeight: '700',
  },
});
