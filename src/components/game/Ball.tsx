import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Animated from 'react-native-reanimated';
import { useGameTheme } from '../ui/ThemeProvider';
import { DrawnNumber } from '../../types';

interface BallProps {
  // Game state
  current: DrawnNumber | null;
  recent: DrawnNumber[];
  isAnimating: boolean;
  animationNumber: number;
  paused: boolean;
  
  // Settings
  numberCallingMode: string;
  
  // Animation
  ballAnim: any;
  
  // Functions
  drawNext: () => void;
  
  // Styling options
  showRecent?: boolean;
  showManualHint?: boolean;
  containerStyle?: any;
  isPortrait?: boolean;
}

export const Ball: React.FC<BallProps> = ({
  current,
  recent,
  isAnimating,
  animationNumber,
  paused,
  numberCallingMode,
  ballAnim,
  drawNext,
  showRecent = true,
  showManualHint = true,
  containerStyle,
  isPortrait = false
}) => {
  const { theme } = useGameTheme();

  // Get color based on BINGO letter
  const getLetterColor = (letter: string) => {
    switch (letter) {
      case 'B': return '#E53E3E'; // Strong Red
      case 'I': return '#00B5A8'; // Strong Teal
      case 'N': return '#3182CE'; // Strong Blue
      case 'G': return '#38A169'; // Strong Green
      case 'O': return '#D69E2E'; // Strong Yellow/Orange
      default: return theme.colors.primary;
    }
  };

  return (
    <TouchableOpacity
    onPress={numberCallingMode === 'manual' ? drawNext : undefined}
    activeOpacity={numberCallingMode === 'manual' ? 0.7 : 1}


     style={[styles.ballContainer, containerStyle]}>
      {/* Main Ball */}
      <TouchableOpacity 
        onPress={numberCallingMode === 'manual' ? drawNext : undefined}
        disabled={isAnimating || (numberCallingMode === 'manual' && paused)}
        activeOpacity={numberCallingMode === 'manual' ? 0.7 : 1}
      >
        <Animated.View style={[styles.ballOuter, ballAnim]}>
          <View style={[styles.ballInner, { 
            borderColor: current ? getLetterColor(current.letter) : theme.colors.primary 
          }]}>

            {!isAnimating && current && (
              <View style={{ paddingBottom: 10}}>
                   <Text style={[styles.ballLetter, { 
                color: getLetterColor(current.letter),
              }]}>
                {current.letter}
              </Text>
              </View>
           
            )}
            <Text style={[styles.ballNumber, { 
              color: isAnimating ? '#999' : (current ? getLetterColor(current.letter) : '#666'),
              opacity: isAnimating ? 0.3 : 1,
              marginTop: (!isAnimating && current) ? -4 : 0
            }]}>
              {isAnimating ? animationNumber : (current ? current.number : '--')}
            </Text>
          </View>
        </Animated.View>
      </TouchableOpacity>

     
      <View style={{ marginTop: isPortrait ? 22 : 10}}>
          {showRecent && (
        <View style={[styles.recentRow, { width: 110, paddingTop: recent.length === 3 ? 0 : 15, marginTop: isPortrait ? -15 : 0, transform: isPortrait ? [{ rotate: '-0deg' }] : [] }]}>
          {recent.map((n, idx) => (
            <View key={`${n.number}-${idx}`} style={[styles.recentCircle, { borderColor: theme.colors.border }]}>
              <Text style={[styles.recentText, { transform: isPortrait ? [{ rotate: '0deg' }] : [] }]}>{n.number}</Text>
            </View>
          ))}
        </View>
      )}
       {/* Manual Hint */}
       {showManualHint && numberCallingMode === 'manual' && !isAnimating && (
        <View style={{  width: 100, marginTop: isAnimating ?  -25 : 0}}>
        <Text style={[styles.manualHint, { color: theme.colors.textSecondary }]}>
          Tap to call next number
        </Text>
        </View>
      )}
      </View>
      {/* Recent Numbers */}
    
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  ballContainer: {
    alignItems: 'center',
    
    gap: 0,
    
  },
  
  // Ball styles (medium size)
  ballOuter: { 
    width: 125, 
    height: 125, 
    borderRadius: 62.5, 
    justifyContent: 'center', 
    alignItems: 'center', 
    backgroundColor: '#fff', 
    shadowColor: '#000', 
    shadowOpacity: 0.3, 
    shadowRadius: 8,
    elevation: 8,
    marginRight: 6

  },
  ballInner: { 
    width: 80, 
    height: 80, 
    borderRadius: 40, 
    borderWidth: 6, 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    
  },
  ballNumber: { 
    marginTop: 2,
    fontSize: 36, 
    fontWeight: '900',
  },
  ballLetter: { 
    fontSize: 18, 
    fontWeight: '600', 
    position: 'absolute', 
    top: 2,
    left: -6
  },
  recentCircle: { 
    width: 30, 
    height: 30, 
    borderRadius: 15, 
    borderWidth: 2, 
    justifyContent: 'center', 
    alignItems: 'center', 
    backgroundColor: '#fff',
  },
  recentText: { 
    fontWeight: '700',
    fontSize: 11,
  },
  manualHint: { 
    fontSize: 10, 
    textAlign: 'center', 
    fontStyle: 'italic',
  },
  recentRow: { 
    flexDirection: 'row', 
    gap: 6,
    flexWrap: 'wrap',
    justifyContent: 'center',
    paddingTop: 10,
    width: 100
  },
});
