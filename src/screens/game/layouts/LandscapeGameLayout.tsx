import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Animated from 'react-native-reanimated';
import { PatternPreview } from '../../../components/game/PatternPreview';
import { DrawnNumber } from '../../../types';

type Props = {
  theme: any;
  lettersRail: React.ReactNode;
  calledCount: number;
  current: DrawnNumber | null;
  ballAnimStyle: any;
  recent: DrawnNumber[];
  derashShown: number;
  medebAmount: number;
  paused: boolean;
  onTogglePause: () => void;
  onEnd: () => void;
  onOpenCheck: () => void;
};

const bingoLetters = [
  { letter: 'B', color: '#E91E63' }, // Pink
  { letter: 'I', color: '#8BC34A' }, // Light green
  { letter: 'N', color: '#E91E63' }, // Pink
  { letter: 'G', color: '#4CAF50' }, // Green
  { letter: 'O', color: '#E91E63' }, // Pink
];

export const LandscapeGameLayout: React.FC<Props> = ({
  theme,
  lettersRail,
  calledCount,
  current,
  ballAnimStyle,
  recent,
  derashShown,
  medebAmount,
  paused,
  onTogglePause,
  onEnd,
  onOpenCheck,
}) => {
  return (
    <View style={styles.root}>
      {/* Top Section */}
      <View style={styles.topSection}>
        {/* Counter */}
        <Text style={styles.counter}>{calledCount}/75</Text>
        
        {/* Colorful BINGO letters */}
        <View style={styles.bingoLettersContainer}>
          {bingoLetters.map((item, index) => (
            <View key={index} style={[styles.bingoLetter, { backgroundColor: item.color }]}>
              <Text style={styles.bingoLetterText}>{item.letter}</Text>
            </View>
          ))}
          {/* Recent numbers */}
          <View style={styles.recentNumbers}>
            {recent.slice(0, 2).map((n, idx) => (
              <View key={`${n.number}-${idx}`} style={styles.recentCircle}>
                <Text style={styles.recentText}>{n.number}</Text>
              </View>
            ))}
          </View>
        </View>
      </View>

      {/* Middle Section */}
      <View style={styles.middleSection}>
        {/* Green ball with current number */}
        <View style={styles.ballContainer}>
          <Animated.View style={[styles.ballOuter, ballAnimStyle]}>
            <View style={styles.ballInner}>
              <Text style={styles.ballNumber}>{current ? current.number : '57'}</Text>
            </View>
          </Animated.View>
          <View style={styles.threeDots}>
            {[1, 2, 3].map((_, idx) => (
              <View key={idx} style={styles.dot} />
            ))}
          </View>
        </View>

        {/* Horizontal BINGO numbers list */}
        <View style={styles.numbersListContainer}>
          <View style={styles.numbersListHeader}>
            {bingoLetters.map((item, index) => (
              <View key={index} style={[styles.numberHeaderLetter, { backgroundColor: item.color }]}>
                <Text style={styles.numberHeaderText}>{item.letter}</Text>
              </View>
            ))}
          </View>
          
          <Text style={styles.lineLabel}>2 line</Text>
          
          <View style={styles.bingoGrid}>
            {['B', 'I', 'N', 'G', 'O'].map(letter => (
              <Text key={letter} style={styles.gridLetter}>{letter}</Text>
            ))}
          </View>
        </View>
      </View>

      {/* Bottom Section */}
      <View style={styles.bottomSection}>
        {/* Left info */}
        <View style={styles.infoContainer}>
          <Text style={styles.infoText}>Derash: {derashShown} Birr</Text>
          <Text style={styles.infoText}>Medeb: {medebAmount ?? 20} Birr</Text>
        </View>

        {/* Center BINGO logo */}
        <View style={styles.logoContainer}>
          <View style={styles.logoCircles}>
            <View style={[styles.logoCircle, { backgroundColor: '#F44336' }]}>
              <Text style={styles.logoCircleText}>C</Text>
            </View>
            <View style={[styles.logoCircle, { backgroundColor: '#2196F3' }]}>
              <Text style={styles.logoCircleText}>7</Text>
            </View>
            <View style={[styles.logoCircle, { backgroundColor: '#FF9800' }]}>
              <Text style={styles.logoCircleText}>9</Text>
            </View>
          </View>
          <Text style={styles.bingoText}>BINGO!</Text>
        </View>

        {/* Right action buttons */}
        <View style={styles.actionButtonsContainer}>
          <View style={styles.topButtons}>
            <TouchableOpacity onPress={onTogglePause} style={styles.actionBtn}>
              <Text style={styles.actionText}>Pose</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={onEnd} style={styles.actionBtn}>
              <Text style={styles.actionText}>End</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity onPress={onOpenCheck} style={styles.checkBtn}>
            <Text style={styles.checkText}></Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  root: { 
    flex: 1, 
    flexDirection: 'column',
    backgroundColor: '#f5f5f5',
    padding: 16,
  },
  
  // Top Section
  topSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  counter: { 
    fontSize: 18, 
    fontWeight: '700', 
    color: '#000',
    marginTop: 8,
  },
  bingoLettersContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bingoLetter: {
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 4,
  },
  bingoLetterText: {
    fontSize: 24,
    fontWeight: '900',
    color: '#fff',
  },
  recentNumbers: {
    flexDirection: 'row',
    marginLeft: 16,
  },
  recentCircle: { 
    width: 40, 
    height: 40, 
    borderRadius: 20, 
    backgroundColor: '#d0d0d0', 
    marginHorizontal: 4, 
    justifyContent: 'center', 
    alignItems: 'center',
  },
  recentText: { 
    fontWeight: '700',
    fontSize: 16,
    color: '#000',
  },

  // Middle Section
  middleSection: {
    flexDirection: 'row',
    flex: 1,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  ballContainer: {
    alignItems: 'center',
    flex: 1,
  },
  ballOuter: { 
    width: 120, 
    height: 120, 
    borderRadius: 60, 
    justifyContent: 'center', 
    alignItems: 'center', 
    backgroundColor: '#4CAF50',
    shadowColor: '#000', 
    shadowOpacity: 0.2, 
    shadowRadius: 8,
    borderWidth: 4,
    borderColor: '#fff',
  },
  ballInner: { 
    width: 100, 
    height: 100, 
    borderRadius: 50, 
    justifyContent: 'center', 
    alignItems: 'center', 
    backgroundColor: '#4CAF50',
  },
  ballNumber: { 
    fontSize: 36, 
    fontWeight: '900',
    color: '#fff',
  },
  threeDots: {
    flexDirection: 'row',
    marginTop: 16,
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#d0d0d0',
    marginHorizontal: 4,
  },

  // Numbers List
  numbersListContainer: {
    flex: 2,
    marginLeft: 40,
  },
  numbersListHeader: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  numberHeaderLetter: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 2,
  },
  numberHeaderText: {
    fontSize: 18,
    fontWeight: '900',
    color: '#fff',
  },
  lineLabel: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    marginVertical: 8,
    color: '#000',
  },
  bingoGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    height: 120,
    alignItems: 'center',
  },
  gridLetter: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000',
  },

  // Bottom Section
  bottomSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 20,
  },
  infoContainer: {
    flex: 1,
  },
  infoText: { 
    fontSize: 16, 
    fontWeight: '600', 
    marginBottom: 4,
    color: '#000',
  },
  logoContainer: {
    alignItems: 'center',
    flex: 1,
  },
  logoCircles: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  logoCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 2,
  },
  logoCircleText: {
    fontSize: 16,
    fontWeight: '900',
    color: '#fff',
  },
  bingoText: {
    fontSize: 24,
    fontWeight: '900',
    color: '#000',
  },
  actionButtonsContainer: {
    flex: 1,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  topButtons: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  actionBtn: { 
    width: 80, 
    paddingVertical: 8, 
    borderRadius: 8, 
    alignItems: 'center',
    backgroundColor: '#d0d0d0',
  },
  actionText: { 
    fontWeight: '700',
    fontSize: 14,
    color: '#000',
  },
  checkBtn: {
    width: 168,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: '#4CAF50',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
  checkText: {
    fontWeight: '900',
    fontSize: 18,
    color: '#fff',
  },
});

