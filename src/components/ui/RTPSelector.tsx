import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  TextInput,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from './ThemeProvider';

interface RTPSelectorProps {
  value: number;
  onChange: (value: number) => void;
}

export const RTPSelector: React.FC<RTPSelectorProps> = ({
  value,
  onChange,
}) => {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const [inputValue, setInputValue] = useState(value.toString());

  const handleIncrease = () => {
    const newValue = Math.min(85, value + 1);
    onChange(newValue);
    setInputValue(newValue.toString());
  };

  const handleDecrease = () => {
    const newValue = Math.max(35, value - 1);
    onChange(newValue);
    setInputValue(newValue.toString());
  };

  const handleInputChange = (text: string) => {
    setInputValue(text);
    const numValue = parseInt(text, 10);
    if (!isNaN(numValue) && numValue >= 35 && numValue <= 85) {
      onChange(numValue);
    }
  };

  const handleInputBlur = () => {
    const numValue = parseInt(inputValue, 10);
    if (isNaN(numValue) || numValue < 35 || numValue > 85) {
      setInputValue(value.toString());
    }
  };

  const getRTPColor = (rtp: number): string => {
    if (rtp < 50) return theme.colors.error;
    if (rtp < 70) return theme.colors.warning;
    return theme.colors.success;
  };

  const getRTPDescription = (rtp: number): string => {
    if (rtp < 50) return 'Low payout rate';
    if (rtp < 70) return 'Moderate payout rate';
    return 'High payout rate';
  };

  return (
    <View style={styles.container}>
      {/* RTP Display */}
      <View style={styles.rtpDisplay}>
        <Text style={[styles.rtpValue, { color: getRTPColor(value) }]}>
          {value}%
        </Text>
        <Text style={[styles.rtpDescription, { color: theme.colors.textSecondary }]}>
          {getRTPDescription(value)}
        </Text>
      </View>

      {/* Controls */}
      <View style={styles.controls}>
        <TouchableOpacity
          style={[
            styles.controlButton,
            { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
          ]}
          onPress={handleDecrease}
          disabled={value <= 35}
        >
          <Text style={[
            styles.controlButtonText,
            { color: value <= 35 ? theme.colors.disabled : theme.colors.text }
          ]}>
            −
          </Text>
        </TouchableOpacity>

        <View style={[styles.inputContainer, { backgroundColor: theme.colors.surface }]}>
          <TextInput
            style={[styles.input, { color: theme.colors.text }]}
            value={inputValue}
            onChangeText={handleInputChange}
            onBlur={handleInputBlur}
            keyboardType="numeric"
            maxLength={2}
            textAlign="center"
          />
          <Text style={[styles.percentage, { color: theme.colors.textSecondary }]}>
            %
          </Text>
        </View>

        <TouchableOpacity
          style={[
            styles.controlButton,
            { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
          ]}
          onPress={handleIncrease}
          disabled={value >= 85}
        >
          <Text style={[
            styles.controlButtonText,
            { color: value >= 85 ? theme.colors.disabled : theme.colors.text }
          ]}>
            +
          </Text>
        </TouchableOpacity>
      </View>

      {/* Range Indicator */}
      <View style={styles.rangeContainer}>
        <View style={[styles.rangeTrack, { backgroundColor: theme.colors.surface }]}>
          <View
            style={[
              styles.rangeProgress,
              {
                backgroundColor: getRTPColor(value),
                width: `${((value - 35) / (85 - 35)) * 100}%`,
              },
            ]}
          />
          <View
            style={[
              styles.rangeThumb,
              {
                backgroundColor: getRTPColor(value),
                left: `${((value - 35) / (85 - 35)) * 100}%`,
              },
            ]}
          />
        </View>
        <View style={styles.rangeLabels}>
          <Text style={[styles.rangeLabel, { color: theme.colors.textSecondary }]}>
            35%
          </Text>
          <Text style={[styles.rangeLabel, { color: theme.colors.textSecondary }]}>
            85%
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  rtpDisplay: {
    alignItems: 'center',
    marginBottom: 24,
  },
  rtpValue: {
    fontSize: 48,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  rtpDescription: {
    fontSize: 14,
    fontWeight: '500',
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    gap: 16,
  },
  controlButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  controlButtonText: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    minWidth: 80,
  },
  input: {
    fontSize: 24,
    fontWeight: '600',
    minWidth: 40,
  },
  percentage: {
    fontSize: 18,
    marginLeft: 4,
  },
  rangeContainer: {
    width: '100%',
    maxWidth: 280,
  },
  rangeTrack: {
    height: 8,
    borderRadius: 4,
    position: 'relative',
    marginBottom: 8,
  },
  rangeProgress: {
    height: '100%',
    borderRadius: 4,
  },
  rangeThumb: {
    position: 'absolute',
    top: -4,
    width: 16,
    height: 16,
    borderRadius: 8,
    marginLeft: -8,
  },
  rangeLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  rangeLabel: {
    fontSize: 12,
  },
});