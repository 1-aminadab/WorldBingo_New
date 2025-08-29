import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../components/ui/ThemeProvider';

interface GameSession {
  id: string;
  date: string;
  duration: number; // in minutes
  players: number;
  winners: number;
  totalPayout: number;
  pattern: string;
  status: 'completed' | 'ongoing' | 'cancelled';
}

const mockGameSessions: GameSession[] = [
  {
    id: '1',
    date: 'Today',
    duration: 25,
    players: 12,
    winners: 1,
    totalPayout: 200,
    pattern: 'Horizontal Line',
    status: 'completed',
  },
  {
    id: '2',
    date: 'Yesterday',
    duration: 18,
    players: 8,
    winners: 1,
    totalPayout: 150,
    pattern: 'Diagonal',
    status: 'completed',
  },
  {
    id: '3',
    date: '2 days ago',
    duration: 32,
    players: 15,
    winners: 2,
    totalPayout: 300,
    pattern: 'Full House',
    status: 'completed',
  },
  {
    id: '4',
    date: '3 days ago',
    duration: 15,
    players: 6,
    winners: 0,
    totalPayout: 0,
    pattern: 'T Shape',
    status: 'cancelled',
  },
  {
    id: '5',
    date: '1 week ago',
    duration: 28,
    players: 10,
    winners: 1,
    totalPayout: 180,
    pattern: 'U Shape',
    status: 'completed',
  },
];

export const GameReport: React.FC = () => {
  const navigation = useNavigation();
  const { theme } = useTheme();

  const totalGames = mockGameSessions.length;
  const completedGames = mockGameSessions.filter(g => g.status === 'completed').length;
  const totalWinners = mockGameSessions.reduce((sum, g) => sum + g.winners, 0);
  const totalPayouts = mockGameSessions.reduce((sum, g) => sum + g.totalPayout, 0);
  const totalDuration = mockGameSessions.reduce((sum, g) => sum + g.duration, 0);
  const totalPlayers = mockGameSessions.reduce((sum, g) => sum + g.players, 0);
  const successRate = totalGames > 0 ? Math.round((completedGames / totalGames) * 100) : 0;
  const averageDuration = totalGames > 0 ? Math.round(totalDuration / totalGames) : 0;

  const renderGameSession = (session: GameSession) => (
    <View
      key={session.id}
      style={[
        styles.sessionItem,
        { backgroundColor: theme.colors.card },
      ]}
    >
      <View style={styles.sessionHeader}>
        <Text style={[styles.sessionDate, { color: theme.colors.textSecondary }]}>
          {session.date}
        </Text>
        <View
          style={[
            styles.statusBadge,
            {
              backgroundColor:
                session.status === 'completed' ? '#10B981' :
                session.status === 'ongoing' ? '#F59E0B' : '#EF4444',
            },
          ]}
        >
          <Text style={styles.statusText}>
            {session.status === 'completed' ? '✅' :
             session.status === 'ongoing' ? '🔄' : '❌'}
          </Text>
        </View>
      </View>

      <View style={styles.sessionStats}>
        <View style={styles.statRow}>
          <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
            Duration:
          </Text>
          <Text style={[styles.statValue, { color: theme.colors.text }]}>
            {session.duration} min
          </Text>
        </View>

        <View style={styles.statRow}>
          <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
            Players:
          </Text>
          <Text style={[styles.statValue, { color: theme.colors.text }]}>
            {session.players}
          </Text>
        </View>

        <View style={styles.statRow}>
          <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
            Winners:
          </Text>
          <Text style={[styles.statValue, { color: '#10B981' }]}>
            {session.winners}
          </Text>
        </View>

        <View style={styles.statRow}>
          <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
            Payout:
          </Text>
          <Text style={[styles.statValue, { color: '#F59E0B' }]}>
            {session.totalPayout} Birr
          </Text>
        </View>

        <View style={styles.statRow}>
          <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
            Pattern:
          </Text>
          <Text style={[styles.statValue, { color: theme.colors.primary }]}>
            {session.pattern}
          </Text>
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <StatusBar backgroundColor={theme.colors.primary} barStyle="light-content" />
      
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.colors.primary }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>🎯 Game Report</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Summary Cards */}
        <View style={styles.summaryContainer}>
          <View style={[styles.summaryCard, { backgroundColor: '#3B82F6' }]}>
            <Text style={styles.summaryLabel}>Games Hosted</Text>
            <Text style={styles.summaryAmount}>{totalGames}</Text>
          </View>
          
          <View style={[styles.summaryCard, { backgroundColor: '#10B981' }]}>
            <Text style={styles.summaryLabel}>Success Rate</Text>
            <Text style={styles.summaryAmount}>{successRate}%</Text>
          </View>
          
          <View style={[styles.summaryCard, { backgroundColor: '#F59E0B' }]}>
            <Text style={styles.summaryLabel}>Total Payouts</Text>
            <Text style={styles.summaryAmount}>{totalPayouts} Birr</Text>
          </View>
        </View>

        {/* Key Statistics */}
        <View style={[styles.statsContainer, { backgroundColor: theme.colors.card }]}>
          <Text style={[styles.statsTitle, { color: theme.colors.text }]}>
            📊 Key Statistics
          </Text>
          
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: '#10B981' }]}>
                {totalWinners}
              </Text>
              <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
                Total Winners
              </Text>
            </View>
            
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: '#3B82F6' }]}>
                {totalPlayers}
              </Text>
              <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
                Total Players
              </Text>
            </View>
            
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: '#F59E0B' }]}>
                {averageDuration}
              </Text>
              <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
                Avg Duration (min)
              </Text>
            </View>
            
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: '#8B5CF6' }]}>
                {Math.round(totalPayouts / totalWinners || 0)}
              </Text>
              <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
                Avg Payout (Birr)
              </Text>
            </View>
          </View>
        </View>

        {/* Game Sessions */}
        <View style={styles.sessionsContainer}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            Recent Game Sessions
          </Text>
          
          {mockGameSessions.map(renderGameSession)}
        </View>

        {/* Performance Metrics */}
        <View style={[styles.performanceContainer, { backgroundColor: theme.colors.card }]}>
          <Text style={[styles.performanceTitle, { color: theme.colors.text }]}>
            🏆 Performance Metrics
          </Text>
          
          <View style={styles.metricRow}>
            <Text style={[styles.metricLabel, { color: theme.colors.textSecondary }]}>
              Host Rating:
            </Text>
            <Text style={[styles.metricValue, { color: '#F59E0B' }]}>
              ⭐ 4.8/5
            </Text>
          </View>
          
          <View style={styles.metricRow}>
            <Text style={[styles.metricLabel, { color: theme.colors.textSecondary }]}>
              Best Pattern:
            </Text>
            <Text style={[styles.metricValue, { color: theme.colors.primary }]}>
              Full House
            </Text>
          </View>
          
          <View style={styles.metricRow}>
            <Text style={[styles.metricLabel, { color: theme.colors.textSecondary }]}>
              Longest Session:
            </Text>
            <Text style={[styles.metricValue, { color: '#10B981' }]}>
              32 minutes
            </Text>
          </View>
          
          <View style={styles.metricRow}>
            <Text style={[styles.metricLabel, { color: theme.colors.textSecondary }]}>
              Highest Payout:
            </Text>
            <Text style={[styles.metricValue, { color: '#F59E0B' }]}>
              300 Birr
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingTop: 60,
  },
  backButton: {
    padding: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  backIcon: {
    fontSize: 24,
    color: 'white',
    fontWeight: 'bold',
  },
  headerTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
  },
  headerSpacer: {
    width: 48,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  summaryContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  summaryCard: {
    flex: 1,
    padding: 16,
    borderRadius: 16,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 4,
  },
  summaryAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
  statsContainer: {
    padding: 20,
    borderRadius: 16,
    marginBottom: 24,
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statItem: {
    width: '48%',
    alignItems: 'center',
    padding: 12,
    marginBottom: 8,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    textAlign: 'center',
  },
  sessionsContainer: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  sessionItem: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sessionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sessionDate: {
    fontSize: 14,
    fontWeight: '600',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  sessionStats: {
    gap: 8,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 14,
  },
  statValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  performanceContainer: {
    padding: 20,
    borderRadius: 16,
    marginBottom: 20,
  },
  performanceTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  metricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  metricLabel: {
    fontSize: 14,
  },
  metricValue: {
    fontSize: 14,
    fontWeight: '600',
  },
}); 