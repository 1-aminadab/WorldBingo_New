import React from 'react';
import { View, Text, StyleSheet, useWindowDimensions } from 'react-native';
import { useGameTheme } from './ThemeProvider';

interface DerashMedebInfoProps {
  derashShown: number;
  gameMedebAmount: number;
  medebAmount: number;
  numPlayers: number;
  isLandscape?: boolean;
  showPlayers?: boolean;
}

export const DerashMedebInfo: React.FC<DerashMedebInfoProps> = ({
  derashShown,
  gameMedebAmount,
  medebAmount,
  numPlayers,
  isLandscape = false,
  showPlayers = true,
}) => {
  const { theme } = useGameTheme();
  const { width } = useWindowDimensions();

  const medebValue = gameMedebAmount > 0 ? gameMedebAmount : (medebAmount ?? 0);

  if (isLandscape) {
    return (
      <View style={[styles.landscapeContainer, { transform: [{ rotate: '90deg' }] }]}>
        {/* Derash - Main Prize */}
        <View style={[styles.derashHighlightBoxLandscape, { backgroundColor: theme.colors.primary }]}>
          <Text style={[
            styles.derashLabelLandscape,
            {
              fontSize: derashShown > 999 ? 13 : 16
            }
          ]}>
            💰 {derashShown} Birr
          </Text>
        </View>

        {/* Medeb Info */}
        <View style={[styles.medebContainerLandscape, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
          <Text style={[
            styles.medebText,
            {
              color: theme.colors.text,
              fontSize: medebValue > 999 ? 11 : 14
            }
          ]}>
            💵 Entry Fee: {medebValue} Birr
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.portraitContainer}>
      {/* Derash - Main Prize */}
      <View style={[styles.derashHighlightBox, {gap: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: theme.colors.primary }]}>
        <Text style={styles.derashLabel}>💰</Text>
        <View style={{ alignItems: 'center', justifyContent: 'center' }}>
          <Text style={[
            styles.derashAmount,
            {
              fontSize: width > 400 ? (derashShown > 999 ? 16 : 20) : (derashShown > 999 ? 14 : 16)
            }
          ]}>
            {derashShown} <Text style={{ fontSize: 10 }}>Birr</Text>
          </Text>
          <Text style={[styles.profitLabel, { color: theme.colors.textSecondary }]}>Profit</Text>
        </View>

      </View>

      {/* Secondary Info */}
      <View style={styles.secondaryInfoContainer}>
        <View style={[styles.medebInfoBox, {gap: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
          <Text style={[styles.medebIcon, { color: theme.colors.text }]}>💵</Text>
          <View>
            <Text style={[
              styles.medebValue,
              {
                color: theme.colors.text,
                fontSize: medebValue > 999 ? 10 : 12
              }
            ]}>
              {medebValue} Birr
            </Text>
            <Text style={[styles.medebLabel, { color: theme.colors.textSecondary }]}>Entry Fee</Text>

          </View>

        </View>

        {showPlayers && numPlayers > 1 && (
          <View style={[styles.playersInfoBox, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
            <Text style={[styles.playersLabel, { color: theme.colors.textSecondary }]}>Players</Text>
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
  derashLabelLandscape: {
    fontSize: 16,
    fontWeight: '700',
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
  medebText: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
});
