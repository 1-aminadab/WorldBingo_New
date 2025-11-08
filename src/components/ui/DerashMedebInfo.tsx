import React from 'react';
import { View, Text, StyleSheet, useWindowDimensions } from 'react-native';
import { useGameTheme } from './ThemeProvider';

interface DerashMedebInfoProps {
  derashShown: number;
  gameMedebAmount: number;
  medebAmount: number;
  numPlayers: number;
  totalCollectedAmount: number; // Pass the actual total collected amount
  selectedNumbers?: number; // Number of selected numbers/cartelas
  isLandscape?: boolean;
  showPlayers?: boolean;
}

// Format large numbers with commas
const formatNumber = (num: number): string => {
  if (num >= 1000000) {
    return num.toLocaleString('en-US');
  }
  return num.toLocaleString('en-US');
};

// Get dynamic font size based on number length
const getDynamicFontSize = (num: number, baseSize: number): number => {
  const numString = num.toString();
  if (numString.length >= 7) return baseSize - 4; // 1,000,000+
  if (numString.length >= 5) return baseSize - 2; // 10,000+
  if (numString.length >= 4) return baseSize - 1; // 1,000+
  return baseSize;
};

export const DerashMedebInfo: React.FC<DerashMedebInfoProps> = ({
  derashShown,
  gameMedebAmount,
  medebAmount,
  numPlayers,
  totalCollectedAmount,
  selectedNumbers = 1,
  isLandscape = false,
  showPlayers = true,
}) => {
  const { theme } = useGameTheme();
  const { width } = useWindowDimensions();

  const medebValue = gameMedebAmount > 0 ? gameMedebAmount : (medebAmount ?? 0);
  const payinAmount = totalCollectedAmount; // Use the passed total collected amount directly
  // RTP logic: 100% if 4 or less players, otherwise 80%
  const rtp = numPlayers <= 4 ? 1.0 : 0.8;
  const payoutAmount = payinAmount * rtp; // Payout = Total collected * RTP
  const derashFontSize = getDynamicFontSize(payinAmount, 14);
  const medebFontSize = getDynamicFontSize(payoutAmount, 14);

  if (isLandscape) {
    return (
      <View style={[styles.landscapeContainer, { transform: [{ rotate: '90deg' }] }]}>
        {/* Pay in - Total Collected */}
        <View style={[styles.derashHighlightBoxLandscape, { backgroundColor: theme.colors.primary }]}>
          <Text style={[
            styles.derashValueLandscape,
            {
              fontSize: derashFontSize
            }
          ]}>
          
            💰 {formatNumber(payoutAmount)} Birr
          </Text>
          <Text style={styles.derashLabelLandscape}>Win Amount</Text>
        </View>

        {/* Pay out Info */}
        <View style={[styles.medebContainerLandscape, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
          <Text style={[
            styles.medebValueLandscape,
            {
              color: theme.colors.text,
              fontSize: medebFontSize
            }
          ]}>
            💸 {formatNumber(gameMedebAmount)} Birr
          </Text>
          <Text style={[styles.medebLabelLandscape, { color: theme.colors.text }]}>Card fee</Text>
        </View>
      </View>
    );
  }
console.log('====================================');
console.log(typeof medebAmount, derashShown,
  gameMedebAmount,
  medebAmount,
  numPlayers,
  totalCollectedAmount);
console.log('====================================');
  return (
    <View style={styles.portraitContainer}>
      {/* Pay in - Total Collected */}
      <View style={[styles.derashHighlightBox, {gap: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: theme.colors.primary }]}>
        <Text style={styles.derashLabel}>💰</Text>
        <View style={{ alignItems: 'center', justifyContent: 'center' }}>
          <Text style={[
            styles.derashAmount,
            {
              fontSize: getDynamicFontSize(payinAmount, 12)
            }
          ]}>
            {formatNumber(payoutAmount)} <Text style={{ fontSize: 10 }}>Birr</Text>
          </Text>
          <Text style={[styles.profitLabel, { color: theme.colors.textSecondary }]}>Win Amount</Text>
        </View>

      </View>

      {/* Secondary Info */}
      <View style={styles.secondaryInfoContainer}>
        <View style={[styles.medebInfoBox, {gap: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
          <Text style={[styles.medebIcon, { color: theme.colors.text }]}>💸</Text>
          <View>
            <Text style={[
              styles.medebValue,
              {
                color: theme.colors.text,
                fontSize: getDynamicFontSize(payoutAmount, 12)
              }
            ]}>
              {gameMedebAmount} Birr
            </Text>
            <Text style={[styles.medebLabel, { color: theme.colors.textSecondary }]}>Card fee </Text>

          </View>

        </View>

        {showPlayers && numPlayers > 1 && (
          <View style={[styles.playersInfoBox, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
            <Text style={[styles.playersLabel, { color: theme.colors.textSecondary }]}>Total Players</Text>
            <Text style={[styles.playersValue, { color: theme.colors.text }]}>{numPlayers}</Text>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  // Portrait styles
  portraitContainer: {
  },
  derashHighlightBox: {
    paddingVertical: 8,
    paddingHorizontal: 2,
    borderRadius: 2,
    marginBottom: 6,
    alignItems: 'center',
    // minWidth: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
    backgroundColor: 'blue',
    height: 45,
    width: 120,
    borderTopLeftRadius: 50,
    borderBottomLeftRadius: 50,

  },
  derashLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    textAlign: 'center',
  },
  profitLabel: {
    fontSize: 9,
    fontWeight: '500',
    color: '#fff',
    textAlign: 'center',
  },
  derashAmount: {
    fontWeight: '800',
    color: '#fff',
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
    textAlign: 'center',
    flexShrink: 1,
    minWidth: 0,
  },
  secondaryInfoContainer: {
    gap: 8,
    flexDirection: 'row',
  },
  medebInfoBox: {
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 2,
    borderWidth: 1,
    alignItems: 'center',
    flex: 1,
    height: 45,
    width: 120,
    borderTopLeftRadius: 50,
    borderBottomLeftRadius: 50,
  },
  medebLabel: {
    fontSize: 9,
    fontWeight: '500',
    marginBottom: 1,
  },
  medebValue: {
    fontSize: 12,
    fontWeight: '700',
    flexShrink: 1,
    minWidth: 0,
    textAlign: 'center',
  },
  medebIcon: {
    fontSize: 12,
    textAlign: 'center',
  },
  playersInfoBox: {
    flex: 1,
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 6,
    borderWidth: 1,
    alignItems: 'center',
  },
  playersLabel: {
    fontSize: 9,
    fontWeight: '500',
    marginBottom: 1,
  },
  playersValue: {
    fontSize: 12,
    fontWeight: '700',
    flexShrink: 1,
    minWidth: 0,
    textAlign: 'center',
  },

  // Landscape styles
  landscapeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    justifyContent: 'space-between',
  },
  derashHighlightBoxLandscape: {
    flex: 1,
    height: 50,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 2,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
    marginRight: 6,
    minWidth: 120,
  },
  derashValueLandscape: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 2,
  },
  derashLabelLandscape: {
    fontSize: 10,
    fontWeight: '500',
    color: '#fff',
    textAlign: 'center',
  },
  medebContainerLandscape: {
    flex: 1,
    height: 50,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 2,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 6,
    minWidth: 120,
  },
  medebValueLandscape: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 2,
  },
  medebLabelLandscape: {
    fontSize: 10,
    fontWeight: '500',
    textAlign: 'center',
  },
});
