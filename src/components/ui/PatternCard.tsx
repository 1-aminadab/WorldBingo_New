import React from 'react';
import {
  TouchableOpacity,
  Text,
  View,
  StyleSheet,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from './ThemeProvider';
import { BingoPattern } from '../../types';

interface PatternCardProps {
  pattern: {
    key: BingoPattern;
    name: string;
    description: string;
  };
  isSelected: boolean;
  onSelect: () => void;
}

export const PatternCard: React.FC<PatternCardProps> = ({
  pattern,
  isSelected,
  onSelect,
}) => {
  const { t } = useTranslation();
  const { theme } = useTheme();

  const getPatternEmoji = (patternKey: BingoPattern): string => {
    const emojiMap = {
      one_line: '📏',
      two_lines: '📐',
      three_lines: '📊',
      full_house: '🏠',
      t_shape: '🔤',
      u_shape: '🔄',
      x_shape: '❌',
      plus_sign: '➕',
      diamond: '💎',
    };
    return emojiMap[patternKey] || '🎯';
  };

  const renderPatternPreview = (patternKey: BingoPattern) => {
    // Create a 5x5 grid to show pattern preview
    const grid = Array(5).fill(null).map(() => Array(5).fill(false));
    
    // Fill the grid based on pattern
    switch (patternKey) {
      case 'one_line':
      case 'two_lines':
      case 'three_lines':
        // Keep minimal preview for legacy classic presets: show a single row
        for (let i = 0; i < 5; i++) grid[0][i] = true;
        break;
      case 'full_house':
        // Fill entire grid
        for (let i = 0; i < 5; i++) {
          for (let j = 0; j < 5; j++) {
            grid[i][j] = true;
          }
        }
        break;
      case 't_shape':
        // Top row and middle column
        for (let i = 0; i < 5; i++) grid[0][i] = true;
        for (let i = 0; i < 5; i++) grid[i][2] = true;
        break;
      case 'u_shape':
        // Left column, right column, bottom row
        for (let i = 0; i < 5; i++) {
          grid[i][0] = true;
          grid[i][4] = true;
          grid[4][i] = true;
        }
        break;
      case 'l_shape':
        // Left column and bottom row
        for (let i = 0; i < 5; i++) {
          grid[i][0] = true;
          grid[4][i] = true;
        }
        break;
      case 'x_shape':
        // Both diagonals
        for (let i = 0; i < 5; i++) {
          grid[i][i] = true;
          grid[i][4 - i] = true;
        }
        break;
      case 'plus_sign':
        // Middle row and middle column
        for (let i = 0; i < 5; i++) {
          grid[2][i] = true;
          grid[i][2] = true;
        }
        break;
      case 'diamond':
        // Diamond pattern
        grid[0][2] = true;
        grid[1][1] = grid[1][3] = true;
        grid[2][0] = grid[2][2] = grid[2][4] = true;
        grid[3][1] = grid[3][3] = true;
        grid[4][2] = true;
        break;
    }

    return (
      <View style={styles.previewGrid}>
        {grid.map((row, rowIndex) => (
          <View key={rowIndex} style={styles.previewRow}>
            {row.map((cell, colIndex) => (
              <View
                key={colIndex}
                style={[
                  styles.previewCell,
                  {
                    backgroundColor: cell 
                      ? theme.colors.primary 
                      : theme.colors.surface,
                  },
                ]}
              />
            ))}
          </View>
        ))}
      </View>
    );
  };

  return (
    <TouchableOpacity
      style={[
        styles.container,
        {
          backgroundColor: isSelected ? theme.colors.primary : theme.colors.surface,
          borderColor: isSelected ? theme.colors.primary : theme.colors.border,
        },
      ]}
      onPress={onSelect}
      activeOpacity={0.8}
    >
      <View style={styles.header}>
        {/* <Text style={styles.emoji}>{getPatternEmoji(pattern.key)}</Text> */}
        <Text
          style={[
            styles.title,
            { color: isSelected ? '#FFFFFF' : theme.colors.text },
          ]}
        >
          {t(`patterns.${pattern.key}`)}
        </Text>
      </View>

      {renderPatternPreview(pattern.key)}

      <Text
        style={[
          styles.description,
          { color: isSelected ? 'rgba(255,255,255,0.9)' : theme.colors.textSecondary },
        ]}
        numberOfLines={2}
      >
        {t(`patterns.descriptions.${pattern.key}`)}
      </Text>

      {isSelected && (
        <View style={styles.selectedIndicator}>
          <Text style={styles.selectedIcon}>✓</Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '48%',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 2,
    position: 'relative',
  },
  header: {
    alignItems: 'center',
    marginBottom: 12,
  },
  emoji: {
    fontSize: 24,
    marginBottom: 4,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  previewGrid: {
    alignSelf: 'center',
    marginBottom: 12,
  },
  previewRow: {
    flexDirection: 'row',
  },
  previewCell: {
    width: 8,
    height: 8,
    marginRight: 1,
    marginBottom: 1,
    borderRadius: 1,
  },
  description: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 16,
  },
  selectedIndicator: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedIcon: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
});