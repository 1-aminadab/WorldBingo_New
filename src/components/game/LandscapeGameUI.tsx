import React from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet } from 'react-native';
import Animated from 'react-native-reanimated';
import { useGameTheme } from '../ui/ThemeProvider';
import { PatternPreview } from './PatternPreview';
import { Ball } from './Ball';
import { PlayPauseButton } from '../ui/PlayPauseButton';
import { CheckButton } from '../ui/CheckButton';
import { EndGameButton } from '../ui/EndGameButton';
import { DerashMedebInfo } from '../ui/DerashMedebInfo';
import { DrawnNumber, BingoLetter } from '../../types';

interface LandscapeGameUIProps {
  // Game state
  current: DrawnNumber | null;
  calledNumbers: DrawnNumber[];
  recent: DrawnNumber[];
  isAnimating: boolean;
  animationNumber: number;
  paused: boolean;
  bingoFound: boolean;

  // Player/game info
  numPlayers: number;
  gameMedebAmount: number;
  medebAmount: number;
  derashShown: string;
  singleSelectedNumbers: number[];

  // Pattern info
  patternCategory: string;
  selectedPattern: string;
  classicLinesTarget: number;

  // Settings
  numberCallingMode: string;
  forcedOrientation: 'portrait' | 'landscape';

  // Animation
  ballAnim: any;

  // Functions
  endGame: () => void;
  setForcedOrientation: (orientation: 'portrait' | 'landscape') => void;
  drawNext: () => void;
  setPaused: (paused: boolean | ((prev: boolean) => boolean)) => void;
  setBingoFound: (found: boolean) => void;
  openCheck: (playerIndex?: number) => void;
  renderLettersColumns: (compact?: boolean, forPortrait?: boolean) => React.ReactNode;
  getPatternDisplayName: (category: any, pattern: any, linesTarget?: number) => string;
  setIsLandscape: (value: boolean) => void;
}

export const LandscapeGameUI: React.FC<LandscapeGameUIProps> = ({
  current,
  calledNumbers,
  recent,
  isAnimating,
  animationNumber,
  paused,
  bingoFound,
  numPlayers,
  gameMedebAmount,
  medebAmount,
  derashShown,
  singleSelectedNumbers,
  patternCategory,
  selectedPattern,
  classicLinesTarget,
  numberCallingMode,
  forcedOrientation,
  ballAnim,
  endGame,
  setForcedOrientation,
  drawNext,
  setPaused,
  setBingoFound,
  openCheck,
  renderLettersColumns,
  getPatternDisplayName,
  setIsLandscape
}) => {
  const { theme } = useGameTheme();
  const letters: BingoLetter[] = ['B', 'I', 'N', 'G', 'O'];

  return (
    <View style={styles.landscape}>
      {/* Top header with controls */}

      {/* Main landscape layout */}
      <View style={styles.mainLandscape}>
        {/* Left: Balls section */}

        {/* Right: Info and controls */}
        <View style={[styles.infoControlsSection, { width: '25%', height:'100%', marginTop: 30}]}>
          {/* Prize info */}
          <DerashMedebInfo
            derashShown={parseInt(derashShown)}
            gameMedebAmount={gameMedebAmount}
            medebAmount={medebAmount}
            numPlayers={numPlayers}
            isLandscape={true}
            showPlayers={false}
          />
       
          {/* Logo and pattern */}
          <View style={[styles.logoPatternRow, {transform:[{rotate: '90deg'}]}]}>
            <Image
              source={require('../../assets/images/world-Bingo-Logo.png')}
              style={styles.logoImageSmall}
              resizeMode="contain"
            />
              {/* Pattern info */}
            <View style={styles.patternBox}>
              <Text style={[styles.patternTitle, { color: theme.colors.text }]}>{classicLinesTarget} line</Text>
              <View style={styles.patternHeaderRow}>
                {letters.map((l, index) => {
                  const ranges: Record<BingoLetter, [number, number]> = { B: [1, 15], I: [16, 30], N: [31, 45], G: [46, 60], O: [61, 75] };
                  const [min, max] = ranges[l];
                  const calledInRange = calledNumbers.filter(n => n.letter === l).length;
                  const isComplete = calledInRange === (max - min + 1);
                  
                  return (
                    <View key={`ph-${l}`} style={[
                      styles.patternLetterBox, 
                      { 
                        borderColor: isComplete ? theme.colors.primary : theme.colors.border,
                        backgroundColor: isComplete ? theme.colors.primary : 'rgba(255, 255, 255, 0.1)'
                      }
                    ]}>
                      <Text style={[
                        styles.patternHeaderLetter, 
                        { color: isComplete ? '#fff' : theme.colors.text }
                      ]}>{l}</Text>
                    </View>
                  );
                })}
              </View>
              <PatternPreview size={80} />
            </View>
           
          </View>

          {/* Action buttons */}
          <View style={[styles.actionButtons,  {transform:[{rotate: '90deg'}]}]}>
          <EndGameButton onPress={endGame} size={28} />

            <PlayPauseButton
              paused={paused}
              bingoFound={bingoFound}
              onPress={() => {
                if (bingoFound) {
                  setBingoFound(false);
                  setPaused(false);
                } else {
                  setPaused((p) => !p);
                }
              }}
              style={styles.playPauseBtn}
            />

            <CheckButton
              onPress={() => openCheck()}
              style={styles.checkBtn}
            />
          </View>
        </View>
        {/* Center: BINGO number grid horizontal */}
        <View style={[styles.bingoGridSection, { flex:1, marginTop: -30,  justifyContent:'flex-start' }]}>
          {/*  top controller and the ball */}
          <View style= {{transform:[{rotate: '90deg'}], marginRight: -45,  alignItems:'center', justifyContent:'center'}}>


            <View style={[styles.topControls, { alignItems:'center', justifyContent:'center'}]}>

              <Text style={[styles.counter, { color: theme.colors.text }]}>{calledNumbers.length}/75</Text>

              <TouchableOpacity
                onPress={() => {
                  setIsLandscape(false)
                }}
                style={[styles.orientationBtn, { borderColor: theme.colors.primary }]}
              >
                <Text style={[styles.orientationBtnText, { color: theme.colors.text }]}>
                  P
                </Text>
              </TouchableOpacity>
            </View>

             <View style={[styles.ballsSection]}>
                <Ball
                  current={current}
                  recent={recent}
                  isAnimating={isAnimating}
                  animationNumber={animationNumber}
                  paused={paused}
                  numberCallingMode={numberCallingMode}
                  ballAnim={ballAnim}
                  drawNext={drawNext}
                  showRecent={true}
                  showManualHint={true}
                />
             </View>
          </View>
          <View style={{ marginTop: -37 }}>
                      {renderLettersColumns(true, false)}

          </View>
        </View>


      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  landscape: {
    flex: 1,
    flexDirection: 'column',
  },
  topControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 12,
  },
  counter: {
    fontSize: 16,
    fontWeight: '700',
  },
  closeBtn: {
    padding: 8,
    borderRadius: 6,
  },
  orientationBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  orientationBtnText: {
    fontSize: 12,
    fontWeight: '600',
  },
  mainLandscape: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap:5,
  },
   // ballsSection: {
   //   alignItems: 'center',
   //   justifyContent: 'center',
   //   width: 200,
   //   gap: 12,
   // },
   // ballOuter: {
   //   width: 125,
   //   height: 125,
   //   borderRadius: 70,
   //   justifyContent: 'center',
   //   alignItems: 'center',
   //   backgroundColor: '#4caf50',
   //   shadowColor: '#000',
   //   shadowOpacity: 0.3,
   //   shadowRadius: 8,
   //   elevation: 8,
   // },
   // ballInner: {
   //   width: 80,
   //   height: 80,
   //   borderRadius: 50,
   //   borderWidth: 6,
   //   justifyContent: 'center',
   //   alignItems: 'center',
   //   backgroundColor: '#fff',
   // },
   // ballNumber: {
   //   fontSize: 36,
   //   fontWeight: '900',
   // },
   // manualHint: {
   //   fontSize: 10,
   //   textAlign: 'center',
   //   fontStyle: 'italic',
   // },
   // recentRow: {
   //   flexDirection: 'row',
   //   gap: 6,
   //   flexWrap: 'wrap',
   //   justifyContent: 'center',
   // },
   // recentCircle: {
   //   width: 30,
   //   height: 30,
   //   borderRadius: 15,
   //   borderWidth: 2,
   //   justifyContent: 'center',
   //   alignItems: 'center',
   //   backgroundColor: '#fff',
   // },
   // recentText: {
   //   fontWeight: '700',
   //   fontSize: 11,
   // },
  bingoGridSection: {
   paddingTop: -60,
  },
  infoControlsSection: {
    justifyContent:'space-evenly',
    alignItems: 'center',
    // height:'100%',
    gap: 66,
  },
  patternText: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  logoPatternRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  logoImageSmall: {
    width: 80,
    height: 80,
    marginLeft: 30
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  playPauseBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  checkBtn: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 80,
  },
  checkText: {
    fontSize: 16,
    fontWeight: '700',
  },
  patternBox: {
    alignItems: 'center',
    marginLeft: 20,
    paddingBottom: 12
  },
  patternTitle: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 4,
  },
  patternHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: 80,
    marginBottom: 4,
  },
  patternHeaderLetter: {
    fontSize: 10,
    fontWeight: '700',
  },
  patternLetterBox: {
    width: 14,
    height: 14,
    borderWidth: 1,
    borderRadius: 2,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  ballsSection: {
    alignItems: 'flex-start',
    justifyContent: 'flex-start',
  },
});