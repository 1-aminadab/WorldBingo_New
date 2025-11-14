import React from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { useCoinSyncStore } from '../../store/coinSyncStore';
import { useTheme } from './ThemeProvider';

export const CoinSyncIndicator: React.FC = () => {
  const { isLoading, message } = useCoinSyncStore();
  const { theme } = useTheme();

  if (!isLoading) {
    return null;
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.surface }]}>
      <ActivityIndicator size="small" color={theme.colors.primary} />
      <Text style={[styles.text, { color: theme.colors.text }]}>
        {message || 'Syncing coins...'}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    margin: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
  },
  text: {
    marginLeft: 8,
    fontSize: 12,
    fontWeight: '500',
  },
});