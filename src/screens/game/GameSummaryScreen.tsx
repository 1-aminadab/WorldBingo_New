import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, Dimensions } from 'react-native';
import { useRoute, useNavigation, useFocusEffect } from '@react-navigation/native';
import LinearGradient from 'react-native-linear-gradient';
import { DrawnNumber, GameStackParamList } from '../../types';
import { useTheme } from '../../components/ui/ThemeProvider';

import { ArrowLeft, Clock, Trophy, Target, DollarSign, TrendingUp } from 'lucide-react-native';

const { width } = Dimensions.get('window');

type RouteParam = {
  params: GameStackParamList['GameSummary'];
};

export const GameSummaryScreen: React.FC = () => {
  const route = useRoute<RouteParam>();
  const navigation = useNavigation();
  const { theme } = useTheme();
  const data = route.params;

  // Hide tab bar when this screen is focused
  useFocusEffect(
    React.useCallback(() => {
      const parent = navigation.getParent();
      if (parent) {
        parent.setOptions({
          tabBarStyle: { display: 'none' }
        });
      }

      return () => {
        // Show tab bar again when leaving
        if (parent) {
          parent.setOptions({
            tabBarStyle: {
              backgroundColor: theme.colors.card,
              borderTopColor: theme.colors.border,
              borderTopWidth: 1,
              paddingBottom: 8,
              paddingTop: 8,
              height: 70,
              marginBottom: 42
            }
          });
        }
      };
    }, [navigation, theme])
  );

  const goHome = () => navigation.getParent()?.navigate('MainTabs' as never);

  const letterColors = {
    B: '#1E90FF', // Blue
    I: '#FFD700', // Gold
    N: '#FF1493', // Deep Pink
    G: '#32CD32', // Lime Green
    O: '#DC143C'  // Crimson
  };

  const renderCategorizedNumbers = (numbers: DrawnNumber[], theme: any) => {
    const grouped = numbers.reduce((acc, num) => {
      if (!acc[num.letter]) acc[num.letter] = [];
      acc[num.letter].push(num.number);
      return acc;
    }, {} as Record<string, number[]>);

    const orderedLetters = ['B', 'I', 'N', 'G', 'O'];
    
    return (
      <View style={styles.modernNumbersContainer}>
        {orderedLetters.map((letter) => {
          const nums = grouped[letter] || [];
          return (
            <View key={letter} style={styles.letterColumn}>
              <View style={[styles.letterBadge, { backgroundColor: letterColors[letter as keyof typeof letterColors] }]}>
                <Text style={styles.letterBadgeText}>{letter}</Text>
              </View>
              <View style={styles.numbersColumn}>
                {nums.map((num, idx) => (
                  <Text 
                    key={`${letter}-${num}`} 
                    style={[styles.numberItem, { color: theme.colors.text }]}
                  >
                    {num}
                  </Text>
                ))}
              </View>
            </View>
          );
        })}
      </View>
    );
  };

  return (
    <LinearGradient
      colors={[theme.colors.primary, theme.colors.primaryDark, '#1e3c72', '#2a5298']}
      locations={[0, 0.4, 0.7, 1]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      {/* Background Decorative Elements */}
      <View style={styles.backgroundDecorations}>
        <View style={[styles.decorativeCircle, styles.circle1]} />
        <View style={[styles.decorativeCircle, styles.circle2]} />
        <View style={[styles.decorativeCircle, styles.circle3]} />
        <View style={[styles.decorativeCircle, styles.circle4]} />
      </View>
      
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={goHome} style={styles.backButton}>
            <ArrowLeft size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Game Summary</Text>
          <View style={styles.headerSpacer} />
        </View>

        {/* Scrollable Content */}
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
          {/* Hero Stats */}
       

          {/* Stats Grid */}
          <View style={styles.statsGrid}>
            {/* Numbers Drawn Card */}
            <View style={[styles.statCard, { backgroundColor: theme.colors.surface }]}>
              <View style={styles.statIconContainer}>
                <Target size={24} color={theme.colors.primary} />
              </View>
              <Text style={[styles.statValue, { color: theme.colors.text }]}>
                {data?.totalDrawn ?? 0}
              </Text>
              <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
                Numbers Drawn
              </Text>
              <Text style={[styles.statSubtext, { color: theme.colors.textSecondary }]}>
                out of 75
              </Text>
            </View>

            {/* Duration Card */}
            <View style={[styles.statCard, { backgroundColor: theme.colors.surface }]}>
              <View style={styles.statIconContainer}>
                <Clock size={24} color={theme.colors.primary} />
              </View>
              <Text style={[styles.statValue, { color: theme.colors.text }]}>
                {Math.floor((data?.durationSeconds ?? 0) / 60)}:{((data?.durationSeconds ?? 0) % 60).toString().padStart(2, '0')}
              </Text>
              <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
                Duration
              </Text>
              <Text style={[styles.statSubtext, { color: theme.colors.textSecondary }]}>
                minutes
              </Text>
            </View>
          </View>

          {/* Financial Cards */}
          <View style={styles.financialSection}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Financial Summary</Text>
            
            <View style={styles.financialGrid}>
              {/* Derash Card */}
              <View style={[styles.financialCard, { backgroundColor: theme.colors.surface }]}>
                <LinearGradient
                  colors={['#FF6B6B', '#FF8E53']}
                  style={styles.financialIconBg}
                >
                  <DollarSign size={20} color="#fff" />
                </LinearGradient>
                <View style={styles.financialContent}>
                  <Text style={[styles.financialValue, { color: theme.colors.primary }]}>
                    {data?.derashShownBirr ?? 0} Birr
                  </Text>
                  <Text style={[styles.financialLabel, { color: theme.colors.textSecondary }]}>
                    Prize Amount
                  </Text>
                </View>
              </View>

              {/* Medeb Card */}
              <View style={[styles.financialCard, { backgroundColor: theme.colors.surface }]}>
                <LinearGradient
                  colors={['#4ECDC4', '#44A08D']}
                  style={styles.financialIconBg}
                >
                  <TrendingUp size={20} color="#fff" />
                </LinearGradient>
                <View style={styles.financialContent}>
                  <Text style={[styles.financialValue, { color: theme.colors.text }]}>
                    {data?.medebBirr ?? 0} Birr
                  </Text>
                  <Text style={[styles.financialLabel, { color: theme.colors.textSecondary }]}>
                    Stake per Card
                  </Text>
                </View>
              </View>
            </View>

            {/* Additional Financial Info */}
            {data?.totalCardsSold && (
              <View style={[styles.additionalFinancialCard, { backgroundColor: theme.colors.surface }]}>
                <View style={styles.additionalFinancialRow}>
                  <Text style={[styles.additionalLabel, { color: theme.colors.textSecondary }]}>Cards Sold</Text>
                  <Text style={[styles.additionalValue, { color: theme.colors.text }]}>{data.totalCardsSold}</Text>
                </View>
                <View style={styles.additionalFinancialRow}>
                  <Text style={[styles.additionalLabel, { color: theme.colors.textSecondary }]}>Total Collected</Text>
                  <Text style={[styles.additionalValue, { color: theme.colors.text }]}>{data.totalCollectedAmount?.toFixed(2) ?? 0} Birr</Text>
                </View>
                <View style={styles.additionalFinancialRow}>
                  <Text style={[styles.additionalLabel, { color: theme.colors.textSecondary }]}>Total Profit</Text>
                  <Text style={[styles.additionalValue, { color: theme.colors.success || '#4CAF50' }]}>{data.profitAmount?.toFixed(2) ?? 0} Birr</Text>
                </View>
              </View>
            )}
          </View>

          {/* Called Numbers - Keep Original Design */}
          {data?.history && data.history.length > 0 && (
            <View style={[styles.numbersSection, { backgroundColor: theme.colors.surface }]}>
              <Text style={[styles.numbersTitle, { color: theme.colors.text }]}>Called Numbers</Text>
              {renderCategorizedNumbers(data.history, theme)}
            </View>
          )}
        </ScrollView>

        {/* Fixed Bottom Button */}
        <View style={[styles.bottomButton, { backgroundColor: theme.colors.surface }]}>
          <TouchableOpacity onPress={goHome} style={[styles.actionButton, { backgroundColor: theme.colors.primary }]}>
            <Text style={styles.actionButtonText}>Back to Home</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1 ,
    paddingTop:10
  },
  safeArea: {
    flex: 1,
  },
  
  // Background Decorations
  backgroundDecorations: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    overflow: 'hidden',
  },
  decorativeCircle: {
    position: 'absolute',
    borderRadius: 999,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  circle1: {
    width: 200,
    height: 200,
    top: -100,
    right: -50,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  circle2: {
    width: 150,
    height: 150,
    top: 100,
    left: -75,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
  },
  circle3: {
    width: 120,
    height: 120,
    bottom: 200,
    right: -30,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
  },
  circle4: {
    width: 180,
    height: 180,
    bottom: -90,
    left: -60,
    backgroundColor: 'rgba(255, 255, 255, 0.07)',
  },
  
  // Header Styles
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingTop: 8,
  },
  backButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  headerTitle: {
    flex: 1,
    fontSize: 24,
    fontWeight: '800',
    color: '#fff',
    textAlign: 'center',
  },
  headerSpacer: {
    width: 40,
  },

  // Scroll Styles
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 100,
  },

  // Hero Section
  heroSection: {
    marginBottom: 24,
  },
  heroCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  heroGradientBg: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FFD700',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    elevation: 4,
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 8,
  },
  heroSubtitle: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 12,
  },
  heroSparkles: {
    flexDirection: 'row',
    gap: 8,
  },
  sparkle: {
    fontSize: 20,
  },

  // Stats Grid
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 24,
    paddingHorizontal: 4,
  },
  statCard: {
    flex: 1,
    maxWidth: (width - 64) / 2, // Ensure cards don't stretch beyond reasonable width
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    minHeight: 140,
  },
  statIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(0, 150, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  statValue: {
    fontSize: 28,
    fontWeight: '800',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 2,
  },
  statSubtext: {
    fontSize: 12,
    textAlign: 'center',
  },

  // Financial Section
  financialSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 16,
    paddingLeft: 4,
  },
  financialGrid: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 16,
  },
  financialCard: {
    flex: 1,
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  financialIconBg: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  financialContent: {
    flex: 1,
  },
  financialValue: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 2,
  },
  financialLabel: {
    fontSize: 12,
    fontWeight: '600',
  },

  // Additional Financial Card
  additionalFinancialCard: {
    borderRadius: 16,
    padding: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  additionalFinancialRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  additionalLabel: {
    fontSize: 15,
    fontWeight: '500',
  },
  additionalValue: {
    fontSize: 16,
    fontWeight: '700',
  },

  // Numbers Section - Keep Original Design
  numbersSection: {
    borderRadius: 16,
    padding: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  numbersTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 20,
    textAlign: 'center',
  },
  
  // Modern Numbers Container (Keep Original)
  modernNumbersContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-start',
  },
  letterColumn: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  letterBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  letterBadgeText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#fff',
  },
  numbersColumn: {
    alignItems: 'center',
    minHeight: 100,
  },
  numberItem: {
    fontSize: 16,
    fontWeight: '600',
    marginVertical: 2,
    paddingHorizontal: 8,
    paddingVertical: 4,
    minWidth: 30,
    textAlign: 'center',
  },

  // Bottom Button Styles
  bottomButton: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingVertical: 16,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  actionButton: { 
    paddingVertical: 16, 
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  actionButtonText: { 
    color: '#fff', 
    fontWeight: '700', 
    fontSize: 17 
  },
});

