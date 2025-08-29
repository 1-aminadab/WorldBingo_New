import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, SafeAreaView, StyleSheet, TouchableOpacity, useWindowDimensions, Modal, TextInput, Alert, ScrollView, Image } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Animated, { useSharedValue, withTiming, useAnimatedStyle } from 'react-native-reanimated';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useTheme } from '../../components/ui/ThemeProvider';
import { useSettingsStore } from '../../store/settingsStore';
import { PatternPreview } from '../../components/game/PatternPreview';
import { DrawnNumber, BingoLetter } from '../../types';
import { audioManager } from '../../utils/audioManager';

export const GameScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { theme } = useTheme();
  const { rtpPercentage, derashAmount, medebAmount, customCardTypes, selectedCardTypeName, patternCategory, selectedPattern, classicLinesTarget, classicSelectedLineTypes, voiceGender, voiceLanguage } = useSettingsStore();
  const [calledNumbers, setCalledNumbers] = useState<DrawnNumber[]>([]);
  const [current, setCurrent] = useState<DrawnNumber | null>(null);
  const [paused, setPaused] = useState(false);
  const startTimeRef = useRef<number>(Date.now());
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const calledNumbersRef = useRef<DrawnNumber[]>([]);
  const [checkVisible, setCheckVisible] = useState(false);
  const [cardIndexText, setCardIndexText] = useState('');
  const [checkMessage, setCheckMessage] = useState<string | null>(null);
  const [checkingPlayerIndex, setCheckingPlayerIndex] = useState<number | null>(null);
  const [previewGridNumbers, setPreviewGridNumbers] = useState<(number | null)[][] | null>(null);
  const [previewMatched, setPreviewMatched] = useState<boolean[][] | null>(null);
  const [previewWon, setPreviewWon] = useState<boolean>(false);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [gameOverVisible, setGameOverVisible] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [animationNumber, setAnimationNumber] = useState(0);
  const [finalNumber, setFinalNumber] = useState<number | null>(null);
  const [winningPattern, setWinningPattern] = useState<boolean[][]>([]);
  const [playerCartelaNumbers, setPlayerCartelaNumbers] = useState<number[]>([]);
  const [selectedCardNumbers, setSelectedCardNumbers] = useState<number[]>([]);
  const [groupSelectedNumbers, setGroupSelectedNumbers] = useState<number[]>([]);
  const [singleSelectedNumbers, setSingleSelectedNumbers] = useState<number[]>([]);
  const [gameMedebAmount, setGameMedebAmount] = useState<number>(0);
  const [gameDerashValue, setGameDerashValue] = useState<number>(0);
  const [numPlayers, setNumPlayers] = useState(1);
  const [gameSelectedCardTypeName, setGameSelectedCardTypeName] = useState<string>('');
  const [gameCustomCardTypes, setGameCustomCardTypes] = useState<any[]>([]);
  const [showConfetti, setShowConfetti] = useState(false);
  const [bingoFound, setBingoFound] = useState(false);
  const [forcedOrientation, setForcedOrientation] = useState<'portrait' | 'landscape' | null>(null);
  const canCheck = useMemo(() => /^\d+$/.test(cardIndexText) && parseInt(cardIndexText, 10) > 0, [cardIndexText]);

  const ballPulse = useSharedValue(0);
  const ballBounce = useSharedValue(0);
  const ballAnim = useAnimatedStyle(() => ({ 
    transform: [{ scale: 1 + 0.05 * ballPulse.value + 0.1 * ballBounce.value }] 
  }));

  const derashShown = gameDerashValue > 0 ? gameDerashValue : Math.round(((derashAmount ?? 0) * (rtpPercentage ?? 0)) / 100);

  // Extract player cartela data from route params
  useEffect(() => {
    const params = route.params as any;
    if (params?.playerCartelaNumbers) {
      setPlayerCartelaNumbers(params.playerCartelaNumbers);
    }
    if (params?.numPlayers) {
      setNumPlayers(params.numPlayers);
    }
    if (params?.selectedCardNumbers) {
      setSelectedCardNumbers(params.selectedCardNumbers);
    }
    if (params?.groupSelectedNumbers) {
      setGroupSelectedNumbers(params.groupSelectedNumbers);
    }
    if (params?.singleSelectedNumbers) {
      setSingleSelectedNumbers(params.singleSelectedNumbers);
    }
    if (params?.medebAmount) {
      setGameMedebAmount(params.medebAmount);
    }
    if (params?.derashValue) {
      setGameDerashValue(params.derashValue);
    }
    if (params?.selectedCardTypeName) {
      setGameSelectedCardTypeName(params.selectedCardTypeName);
    }
    if (params?.customCardTypes) {
      setGameCustomCardTypes(params.customCardTypes);
    }
    
    console.log('GameScreen received params:', {
      selectedCardNumbers: params?.selectedCardNumbers,
      medebAmount: params?.medebAmount,
      derashValue: params?.derashValue,
      selectedCardTypeName: params?.selectedCardTypeName,
      customCardTypes: params?.customCardTypes?.length || 0,
    });
  }, [route.params]);

  // Sync voice settings with audioManager
  useEffect(() => {
    audioManager.setVoiceSettings(voiceGender, voiceLanguage);
  }, [voiceGender, voiceLanguage]);

  useEffect(() => {
    // initial and every 10s draw
    if (paused) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current as any);
        intervalRef.current = null;
      }
      return;
    }
    drawNext();
    intervalRef.current = setInterval(drawNext, 10000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current as any);
    };
  }, [paused]);

  // Keep a ref of called numbers for always-fresh reads in timers
  useEffect(() => {
    calledNumbersRef.current = calledNumbers;
  }, [calledNumbers]);

  const drawNext = () => {
    const available: Array<{ letter: BingoLetter; number: number }> = [];
    const ranges: Record<BingoLetter, [number, number]> = { B: [1, 15], I: [16, 30], N: [31, 45], G: [46, 60], O: [61, 75] };
    const taken = calledNumbersRef.current;
    (Object.keys(ranges) as BingoLetter[]).forEach((letter) => {
      const [min, max] = ranges[letter];
      for (let n = min; n <= max; n++) {
        if (!taken.some((d) => d.letter === letter && d.number === n)) {
          available.push({ letter, number: n });
        }
      }
    });
    if (available.length === 0) {
      // All numbers exhausted → game over
      if (!gameOverVisible) {
        setPaused(true);
        setGameOverVisible(true);
        if (intervalRef.current) { clearInterval(intervalRef.current as any); intervalRef.current = null; }
      }
      return;
    }
    const pick = available[Math.floor(Math.random() * available.length)];
    const drawn: DrawnNumber = { letter: pick.letter, number: pick.number, timestamp: new Date() };
    
    // Start animation sequence
    setIsAnimating(true);
    setFinalNumber(pick.number);
    
    // Show very fast random numbers for 1.5 seconds
    const animationInterval = setInterval(() => {
      setAnimationNumber(Math.floor(Math.random() * 75) + 1);
    }, 20);
    
    setTimeout(() => {
      clearInterval(animationInterval);
      setIsAnimating(false);
      
      // Show final number with bounce
      setCalledNumbers((prev) => {
        const next = [...prev, drawn];
        if (next.length >= 75) {
          setPaused(true);
          setGameOverVisible(true);
          if (intervalRef.current) { clearInterval(intervalRef.current as any); intervalRef.current = null; }
        }
        return next;
      });
      setCurrent(drawn);
      
      // Play audio for the drawn number
      console.log('About to call audio for number:', drawn.number, 'with settings:', { voiceGender, voiceLanguage });
      audioManager.setVoiceSettings(voiceGender, voiceLanguage);
      audioManager.callNumber(drawn.letter, drawn.number);
      
      // Bounce animation
      ballBounce.value = 0;
      ballBounce.value = withTiming(1, { duration: 300 }, () => {
        ballBounce.value = withTiming(0, { duration: 300 });
      });
      
      ballPulse.value = 0;
      ballPulse.value = withTiming(1, { duration: 600 });
    }, 1500);
  };

  const endGame = () => {
    const duration = Math.floor((Date.now() - startTimeRef.current) / 1000);
    (navigation as any).navigate('GameSummary', {
      totalDrawn: calledNumbers.length,
      derashShownBirr: derashShown,
      medebBirr: medebAmount ?? 0,
      durationSeconds: duration,
      history: calledNumbers,
    });
  };

  const openCheck = (playerIndex?: number) => {
    setCheckMessage(null);
    setCheckingPlayerIndex(playerIndex ?? null);
    if (playerIndex !== undefined && playerCartelaNumbers[playerIndex]) {
      setCardIndexText(String(playerCartelaNumbers[playerIndex]));
    } else {
      setCardIndexText('');
    }
    setCheckVisible(true);
    setPaused(true); // pause drawing while checking
  };

  const submitCheck = () => {
    // Use game-specific card types and selection, fallback to settings if not available
    const cardTypes = gameCustomCardTypes.length > 0 ? gameCustomCardTypes : customCardTypes;
    
    console.log('submitCheck debug:');
    console.log('gameCustomCardTypes.length:', gameCustomCardTypes.length);
    console.log('customCardTypes.length:', customCardTypes.length);
    console.log('gameSelectedCardTypeName:', gameSelectedCardTypeName);
    console.log('selectedCardTypeName:', selectedCardTypeName);
    console.log('cardTypes:', cardTypes);
    
    // If we have card types, use the first one (since there's usually only one active cartela)
    const cartela = cardTypes.length > 0 ? cardTypes[0] : null;
    console.log('found cartela:', cartela);
    
    if (!cartela) {
      setPreviewError('No cartela selected - please check settings or restart game');
      return;
    }
    const idxRaw = parseInt(cardIndexText || '0', 10);
    if (!Number.isFinite(idxRaw) || idxRaw <= 0) {
      setPreviewError('Enter a positive card number');
      setPreviewGridNumbers(null); setPreviewMatched(null); setPreviewWon(false);
      return;
    }
    const idx = idxRaw;
    if (idx < 1 || idx > cartela.cards.length) {
      setPreviewError(`Card ${idx} does not exist (1..${cartela.cards.length})`);
      setPreviewGridNumbers(null); setPreviewMatched(null); setPreviewWon(false);
      return;
    }
    
    // Check if this card number is in the selected cards
    console.log('Card validation debug:');
    console.log('idx (card number entered):', idx, typeof idx);
    console.log('selectedCardNumbers:', selectedCardNumbers, selectedCardNumbers.map(n => typeof n));
    console.log('selectedCardNumbers.includes(idx):', selectedCardNumbers.includes(idx));
    
    if (selectedCardNumbers.length > 0 && !selectedCardNumbers.includes(idx)) {
      setPreviewError(`Card ${idx} not found - only selected cards can be checked`);
      setPreviewGridNumbers(null); setPreviewMatched(null); setPreviewWon(false);
      return;
    }
    const numbers24 = cartela.cards[idx - 1];
    const gridNumbers: (number | null)[][] = Array(5).fill(null).map(() => Array(5).fill(null));
    let p = 0;
    for (let r = 0; r < 5; r++) {
      for (let c = 0; c < 5; c++) {
        if (r === 2 && c === 2) continue; // free center
        gridNumbers[r][c] = numbers24[p++] ?? null;
      }
    }
    const isCalled = (num: number): boolean => {
      let letter: BingoLetter = 'B';
      if (num >= 1 && num <= 15) letter = 'B'; else if (num <= 30) letter = 'I'; else if (num <= 45) letter = 'N'; else if (num <= 60) letter = 'G'; else letter = 'O';
      return calledNumbers.some(d => d.number === num && d.letter === letter);
    };
    const matched: boolean[][] = Array(5).fill(null).map(() => Array(5).fill(false));
    for (let r = 0; r < 5; r++) {
      for (let c = 0; c < 5; c++) {
        if (r === 2 && c === 2) { matched[r][c] = true; continue; }
        const num = gridNumbers[r][c];
        matched[r][c] = num != null ? isCalled(num) : false;
      }
    }
    const winResult = evaluateGridWinWithPattern(matched, {
      patternCategory,
      selectedPattern,
      classicLinesTarget: classicLinesTarget || 1,
      classicSelectedLineTypes: classicSelectedLineTypes || [],
    });
    setPreviewGridNumbers(gridNumbers);
    setPreviewMatched(matched);
    setPreviewWon(winResult.won);
    setWinningPattern(winResult.pattern);
    setPreviewError(null);
    setCheckMessage(winResult.won ? 'Bingo! This card meets the winning pattern.' : 'Not yet. This card does not meet the current winning pattern.');
    
    // Handle bingo celebration
    if (winResult.won) {
      setShowConfetti(true);
      setBingoFound(true);
      setPaused(true);
      
      // Hide confetti after 3 seconds
      setTimeout(() => {
        setShowConfetti(false);
      }, 3000);
    }
  };

  const { width } = useWindowDimensions();
  const isLandscape = forcedOrientation ? forcedOrientation === 'landscape' : width > 640; // Use forced orientation or fallback to width heuristic
  const recent = useMemo(() => {
    if (calledNumbers.length <= 1) return [];
    return calledNumbers.slice(-4, -1).reverse(); // Get 3 previous numbers, excluding current
  }, [calledNumbers]);
  const letters: BingoLetter[] = ['B', 'I', 'N', 'G', 'O'];

  const renderLetterBox = (letter: BingoLetter, horizontal: boolean) => {
    const isActive = current?.letter === letter;
    return (
      <View
        key={letter}
        style={[
          styles.letterBox,
          horizontal ? styles.letterBoxHorizontal : undefined,
          {
            backgroundColor: isActive ? theme.colors.primary : theme.colors.card,
            borderColor: isActive ? theme.colors.primary : theme.colors.border,
          },
        ]}
      >
        <Text style={[styles.letterText, { color: isActive ? '#fff' : theme.colors.text }]}>{letter}</Text>
      </View>
    );
  };

  const groupedByLetter = useMemo(() => {
    const map: Record<BingoLetter, number[]> = { B: [], I: [], N: [], G: [], O: [] };
    calledNumbers.forEach((d) => {
      map[d.letter].push(d.number);
    });
    return map;
  }, [calledNumbers]);

  const AnimatedNumCell: React.FC<{ value: number; isNew: boolean }> = ({ value, isNew }) => {
    const s = useSharedValue(isNew ? 0.6 : 1);
    const a = useAnimatedStyle(() => ({ transform: [{ scale: s.value }] }));
    useEffect(() => {
      if (isNew) {
        s.value = 0.6;
        s.value = withTiming(1, { duration: 300 });
      }
    }, [isNew]);
    return (
      <Animated.View style={[styles.calledCell, a]}>
        <Text style={styles.calledCellText}>{value}</Text>
      </Animated.View>
    );
  };

  const renderLettersColumns = (horizontal: boolean) => {
    const letterRanges: Record<BingoLetter, [number, number]> = { B: [1, 15], I: [16, 30], N: [31, 45], G: [46, 60], O: [61, 75] };

    return (
      <View style={[horizontal ? styles.lettersColumnsRow : styles.lettersColumnsRow, { marginTop: 8 }]}>
        {letters.map((l) => {
          const [min, max] = letterRanges[l];
          const calledNumbersForLetter = groupedByLetter[l];

          return (
            <View key={l} style={styles.letterColumn}>
              {renderLetterBox(l, horizontal)}
              <View style={styles.letterNumbersScroll} >
                {Array.from({ length: max - min + 1 }, (_, i) => {
                  const num = min + i;
                  const isCalled = calledNumbersForLetter.includes(num);
                  const isNew = current?.letter === l && current?.number === num;

                  return (
                    <View
                      key={`${l}-${num}`}
                      style={[
                        styles.calledCell,
                        {
                          backgroundColor: isCalled ? theme.colors.primary : theme.colors.surface,
                          borderColor: isCalled ? theme.colors.primary : theme.colors.border,
                        }
                      ]}
                    >
                      <Text style={[
                        styles.calledCellText,
                        { color: isCalled ? '#fff' : theme.colors.text }
                      ]}>
                        {num}
                      </Text>
                    </View>
                  );
                })}
              </View>
            </View>
          );
        })}
      </View>
    );
  };

  return (
    <LinearGradient colors={[theme.colors.surface, theme.colors.background]} style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        {/* Confetti Effect */}
        {showConfetti && (
          <View style={styles.confettiContainer}>
            {Array.from({ length: 30 }).map((_, i) => (
              <View
                key={i}
                style={[
                  styles.confettiPiece,
                  {
                    backgroundColor: ['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7'][i % 6],
                    left: Math.random() * width,
                    animationDelay: `${Math.random() * 2}s`
                  }
                ]}
              />
            ))}
          </View>
        )}
        {/* Portrait Layout */}
        {!isLandscape ? (
          <View style={{ flex: 1 }}>


            <View style={styles.portraitRoot}>
              <View style={[styles.portraitHeaderRow]}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Text style={[styles.counter, { color: theme.colors.text }]}>{calledNumbers.length}/75</Text>
                  
                  {/* Orientation Toggle Buttons */}
                  <TouchableOpacity 
                    onPress={() => setForcedOrientation('portrait')}
                    style={[
                      styles.orientationBtn, 
                      { 
                        backgroundColor: forcedOrientation === 'portrait' ? theme.colors.primary : theme.colors.surface,
                        borderColor: theme.colors.primary 
                      }
                    ]}
                  >
                    <Text style={[
                      styles.orientationBtnText, 
                      { color: forcedOrientation === 'portrait' ? '#fff' : theme.colors.text }
                    ]}>P</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    onPress={() => setForcedOrientation('landscape')}
                    style={[
                      styles.orientationBtn, 
                      { 
                        backgroundColor: forcedOrientation === 'landscape' ? theme.colors.primary : theme.colors.surface,
                        borderColor: theme.colors.primary 
                      }
                    ]}
                  >
                    <Text style={[
                      styles.orientationBtnText, 
                      { color: forcedOrientation === 'landscape' ? '#fff' : theme.colors.text }
                    ]}>L</Text>
                  </TouchableOpacity>
                </View>

                <View style={{ flex: 1, marginRight: 10, }}>{renderLettersColumns(true)}</View>
              </View>

              <View style={styles.portraitMain}>
                <View style={styles.verticalGroupsContainer}>
                  {/* Group 1: Ball and Recent Numbers */}
                  <View style={styles.groupContainer}>
                    <View style={styles.ballArea}>
                      <Animated.View style={[styles.ballOuterSm, ballAnim]}>
                        <View style={[styles.ballInnerSm, { borderColor: theme.colors.primary }]}>
                          <Text style={[styles.ballNumberSm, { 
                            color: isAnimating ? '#999' : (current ? theme.colors.primary : '#666'),
                            opacity: isAnimating ? 0.3 : 1
                          }]}>
                            {isAnimating ? animationNumber : (current ? current.number : '--')}
                          </Text>
                        </View>
                      </Animated.View>
                      <View style={styles.recentRow}>
                        {recent.map((n, idx) => (
                          <View key={`${n.number}-${idx}`} style={[styles.recentCircleSm, { borderColor: theme.colors.border }]}>
                            <Text style={styles.recentTextSm}>{n.number}</Text>
                          </View>
                        ))}
                      </View>
                    </View>
                  </View>

                  {/* Group 2: Derash and Medeb Info */}
                  <View style={styles.groupContainer}>
                    <View style={styles.infoGrid}>
                      <View style={styles.infoRow}>
                        <Text style={[styles.infoLabel, { color: theme.colors.textSecondary }]}>Derash:</Text>
                        <Text style={[styles.infoValue, { color: theme.colors.text }]}>{derashShown} Birr</Text>
                      </View>
                      <View style={styles.infoRow}>
                        <Text style={[styles.infoLabel, { color: theme.colors.textSecondary }]}>Medeb:</Text>
                        <Text style={[styles.infoValue, { color: theme.colors.text }]}>{gameMedebAmount > 0 ? gameMedebAmount : (medebAmount ?? 0)} Birr</Text>
                      </View>
                      {numPlayers > 1 && (
                        <View style={styles.infoRow}>
                          <Text style={[styles.infoLabel, { color: theme.colors.textSecondary }]}>Players:</Text>
                          <Text style={[styles.infoValue, { color: theme.colors.text }]}>{numPlayers}</Text>
                        </View>
                      )}
                    </View>
                  </View>

                  {/* Group 3: BINGO Logo */}
                  <View style={[styles.groupContainer, {backgroundColor:'transparent'}]}>
                    <View style={styles.logoBoxSm}>
                      <Image 
                        source={require('../../assets/images/world-Bingo-Logo.png')}
                        style={styles.logoImageSm}
                        resizeMode="contain"
                      />
                    </View>
                  </View>

                  {/* Group 4: Pattern Animation */}
                  <View style={styles.groupContainer}>
                    <View style={styles.patternBox}>
                      <Text style={[styles.patternTitle, { color: theme.colors.text }]}>Pattern</Text>
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
                      <PatternPreview size={110} />
                    </View>
                  </View>
                </View>
              </View>

            </View>
            <View style={styles.bottomActions}>
              <TouchableOpacity onPress={endGame} style={[styles.actionBtn, { backgroundColor: theme.colors.primary }]}>
                <Text style={[styles.actionText, { color: '#fff' }]}>End</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => {
                if (bingoFound) {
                  setBingoFound(false);
                  setPaused(false);
                } else {
                  setPaused((p) => !p);
                }
              }} style={[styles.actionBtn, { backgroundColor: theme.colors.primary }]}>
                <Text style={[styles.actionText, { color: '#fff' }]}>{bingoFound ? 'Continue' : (paused ? 'Resume' : 'Pause')}</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => openCheck()} style={[styles.actionBtn, { backgroundColor: theme.colors.primary }]}>
                <Text style={[styles.actionText, { color: '#fff' }]}>Check</Text>
              </TouchableOpacity>
              
              {/* Quick check buttons for each player */}
              {numPlayers > 1 && (
                <View style={styles.quickCheckContainer}>
                  <Text style={[styles.quickCheckLabel, { color: theme.colors.text }]}>Quick Check:</Text>
                  <View style={styles.quickCheckButtons}>
                    {Array.from({ length: numPlayers }).map((_, index) => (
                      <TouchableOpacity
                        key={index}
                        onPress={() => openCheck(index)}
                        style={[styles.quickCheckBtn, { backgroundColor: theme.colors.primary }]}
                      >
                        <Text style={[styles.quickCheckBtnText, { color: '#fff' }]}>
                          P{index + 1}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}
            </View>
          </View>
        ) : (
          // Landscape Layout
          <View style={styles.landscape}>
            {/* Left rail with vertical B I N G O */}

            {/* Middle area */}
            <View style={styles.centerArea}>
              <View style={{ flexDirection: 'row', gap: 10 }}>


                <View style={{ flexDirection: 'column', gap: 10 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Text style={[styles.counter, { color: theme.colors.text }]}>{calledNumbers.length}/75</Text>
                    
                    {/* Orientation Toggle Buttons */}
                    <TouchableOpacity 
                      onPress={() => setForcedOrientation('portrait')}
                      style={[
                        styles.orientationBtn, 
                        { 
                          backgroundColor: forcedOrientation === 'portrait' ? theme.colors.primary : theme.colors.surface,
                          borderColor: theme.colors.primary 
                        }
                      ]}
                    >
                      <Text style={[
                        styles.orientationBtnText, 
                        { color: forcedOrientation === 'portrait' ? '#fff' : theme.colors.text }
                      ]}>P</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity 
                      onPress={() => setForcedOrientation('landscape')}
                      style={[
                        styles.orientationBtn, 
                        { 
                          backgroundColor: forcedOrientation === 'landscape' ? theme.colors.primary : theme.colors.surface,
                          borderColor: theme.colors.primary 
                        }
                      ]}
                    >
                      <Text style={[
                        styles.orientationBtnText, 
                        { color: forcedOrientation === 'landscape' ? '#fff' : theme.colors.text }
                      ]}>L</Text>
                    </TouchableOpacity>
                  </View>
                  <View style={styles.ballArea}>
                    <Animated.View style={[styles.ballOuter, ballAnim]}>
                      <View style={[styles.ballInner, { borderColor: theme.colors.primary }]}>
                        <Text style={[styles.ballNumber, { 
                          color: isAnimating ? '#666' : (current ? theme.colors.primary : '#666') 
                        }]}>
                          {isAnimating ? animationNumber : (current ? current.number : '--')}
                        </Text>
                      </View>
                    </Animated.View>
                    <View style={styles.recentRow}>
                      {recent.map((n, idx) => (
                        <View key={`${n.number}-${idx}`} style={[styles.recentCircle, { borderColor: theme.colors.border }]}>
                          <Text style={styles.recentText}>{n.number}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                </View>
                <View style={{ transform: [{ rotate: '-90deg' }], marginLeft: 30 }}>
                  {renderLettersColumns(true)}
                </View>
              </View>
            
            </View>


           <View style={{flexDirection:'row', gap: 10, paddingHorizontal:20, justifyContent:'space-between'}}>
           <View style={styles.infoRow}>
                <View style={{flexDirection:'column', gap: 8, }}>
                  <Text style={[styles.infoText, { color: theme.colors.text }]}>Derash: {derashShown} Birr</Text>
                  <Text style={[styles.infoText, { color: theme.colors.text }]}>Medeb: {gameMedebAmount > 0 ? gameMedebAmount : (medebAmount ?? 0)} Birr</Text>
                  {numPlayers > 1 && (
                    <Text style={[styles.infoText, { color: theme.colors.text }]}>Players: {numPlayers}</Text>
                  )}
                  {singleSelectedNumbers.length > 0 && (
                    <Text style={[styles.infoText, { color: theme.colors.text }]}>Single: {singleSelectedNumbers.length} cards</Text>
                  )}
                </View>
                <View style={{ alignItems: 'center', marginLeft: 30, gap: 10, flexDirection: 'row'}}>
                  <View style={styles.logoBoxSmall}>
                    <Image 
                      source={require('../../assets/images/world-Bingo-Logo.png')}
                      style={styles.logoImageSmall}
                      resizeMode="contain"
                    />
                  </View>
                  {/* <View style={styles.patternHeaderRowLandscape}>
                    {letters.map((l) => (
                      <Text key={`phl-${l}`} style={styles.patternHeaderLetter}>{l}</Text>
                    ))}
                  </View> */}
                  <PatternPreview size={120} />
                </View>
              </View>
             {/* Right rail with actions */}
            <View style={styles.rightRail}>
              <View style={{gap: 10}}>
                <TouchableOpacity onPress={() => {
                if (bingoFound) {
                  setBingoFound(false);
                  setPaused(false);
                } else {
                  setPaused((p) => !p);
                }
              }} style={[styles.actionBtn, { backgroundColor: theme.colors.primary }]}>
                <Text style={[styles.actionText, { color: '#fff' }]}>{bingoFound ? 'Continue' : (paused ? 'Resume' : 'Pause')}</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={endGame} style={[styles.actionBtn, { backgroundColor: theme.colors.primary }]}>
                <Text style={[styles.actionText, { color: '#fff' }]}>{bingoFound ? 'End' : 'End'}</Text>
              </TouchableOpacity>
              </View>
          
              <TouchableOpacity onPress={() => openCheck()} style={[styles.actionBtn, { backgroundColor: theme.colors.primary }]}>
                <Text style={[styles.actionText, { color: '#fff' }]}>Check</Text>
              </TouchableOpacity>
              
              {/* Quick check buttons for each player */}
              {numPlayers > 1 && (
                <View style={styles.quickCheckContainer}>
                  <Text style={[styles.quickCheckLabel, { color: theme.colors.text }]}>Quick Check:</Text>
                  <View style={styles.quickCheckButtons}>
                    {Array.from({ length: numPlayers }).map((_, index) => (
                      <TouchableOpacity
                        key={index}
                        onPress={() => openCheck(index)}
                        style={[styles.quickCheckBtn, { backgroundColor: theme.colors.primary }]}
                      >
                        <Text style={[styles.quickCheckBtnText, { color: '#fff' }]}>
                          P{index + 1}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}
            </View>
           </View>
           
          </View>
        )}
        {/* Check Modal */}
        <Modal visible={checkVisible} transparent animationType="fade" onRequestClose={() => setCheckVisible(false)}>
          <View style={styles.modalBackdrop}>
            <View style={[styles.modalCard, { backgroundColor: theme.colors.card }]}>
              <Text style={[styles.modalTitle, { color: theme.colors.text }]}>
                {checkingPlayerIndex !== null ? `Check Player ${checkingPlayerIndex + 1} Cartela` : 'Check Cartela'}
              </Text>
              <Text style={[styles.modalHelper, { color: theme.colors.textSecondary }]}>
                {checkingPlayerIndex !== null 
                  ? `Player ${checkingPlayerIndex + 1} is using cartela ${playerCartelaNumbers[checkingPlayerIndex]}`
                  : 'Enter card number for selected cartela'
                }
              </Text>
              <TextInput
                placeholder="e.g. 3"
                placeholderTextColor={theme.colors.textSecondary}
                keyboardType="number-pad"
                value={cardIndexText}
                onChangeText={(t) => setCardIndexText(t.replace(/[^0-9]/g, ''))}
                style={[styles.modalInput, { borderColor: theme.colors.border, color: theme.colors.text }]}
              />
              {/* 5x5 Preview Grid */}
              <View style={styles.previewGridWrap}>
                {previewGridNumbers ? (
                  <View>
                    {/* Header letters */}
                    <View style={[styles.patternHeaderRow, { alignSelf: 'center', width: 170 }]}>
                      {['B', 'I', 'N', 'G', 'O'].map((l) => (
                        <View key={`phc-${l}`} style={[styles.previewHeaderLetterBox, { borderColor: theme.colors.border }]}>
                          <Text style={[styles.patternHeaderLetter, { color: theme.colors.text }]}>{l}</Text>
                        </View>
                      ))}
                    </View>
                    {Array.from({ length: 5 }).map((_, r) => (
                      <View key={`r-${r}`} style={{ flexDirection: 'row', justifyContent: 'center' }}>
                        {Array.from({ length: 5 }).map((__, c) => {
                          const isCenter = r === 2 && c === 2;
                          const value = isCenter ? null : previewGridNumbers[r][c];
                          const isMatch = previewMatched?.[r]?.[c] ?? false;
                          const isWinningCell = winningPattern[r] && winningPattern[r][c];
                          const cellColor = previewWon && isWinningCell ? '#D4AF37' : isMatch ? theme.colors.primary : theme.colors.surface;
                          const textColor = isMatch ? '#fff' : theme.colors.text;
                          return (
                            <View key={`c-${c}`} style={[styles.previewCell, { borderColor: theme.colors.border, backgroundColor: cellColor }]}>
                              <Text style={[styles.previewCellText, { color: textColor }]}>{isCenter ? '' : value}</Text>
                            </View>
                          );
                        })}
                      </View>
                    ))}
                  </View>
                ) : (
                  <Text style={[styles.modalHelper, { color: theme.colors.textSecondary }]}>{previewError ? previewError : 'Card preview will appear here'}</Text>
                )}
              </View>
              {checkMessage && (
                <Text style={[styles.modalResult, { color: checkMessage.startsWith('Bingo') ? theme.colors.success : theme.colors.text }]}>{checkMessage}</Text>
              )}
              <View style={styles.modalActions}>
                <TouchableOpacity onPress={() => {
                  setCheckVisible(false);
                  setCheckingPlayerIndex(null);
                }} style={[styles.actionBtn, { backgroundColor: theme.colors.surface }]}>
                  <Text style={styles.actionText}>Close</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={submitCheck} disabled={!canCheck} style={[styles.actionBtn, { backgroundColor: canCheck ? theme.colors.primary : theme.colors.border }]}>
                  <Text style={[styles.actionText, { color: canCheck ? '#fff' : theme.colors.textSecondary }]}>Check</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
        {/* Game Over Modal */}
        <Modal visible={gameOverVisible} transparent animationType="fade" onRequestClose={() => setGameOverVisible(false)}>
          <View style={styles.modalBackdrop}>
            <View style={[styles.modalCard, { backgroundColor: theme.colors.card }]}>
              <Text style={[styles.modalTitle, { color: theme.colors.text }]}>Game Over</Text>
              <Text style={[styles.modalHelper, { color: theme.colors.textSecondary }]}>All 75 numbers have been drawn.</Text>
              <View style={styles.modalActions}>
                <TouchableOpacity onPress={() => setGameOverVisible(false)} style={[styles.actionBtn, { backgroundColor: theme.colors.surface }]}>
                  <Text style={styles.actionText}>Close</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={endGame} style={[styles.actionBtn, { backgroundColor: theme.colors.primary }]}>
                  <Text style={[styles.actionText, { color: '#fff' }]}>Summary</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, },
  safeArea: { flex: 1, },
  portrait: { flex: 1, flexDirection: 'row' },
  landscape: { flex: 1, flexDirection: 'column' },
  leftRail: { width: 60, alignItems: 'center', paddingVertical: 12 },
  letterBox: { width: 22, height: 22, borderRadius: 6, marginVertical: 6, justifyContent: 'center', alignItems: 'center', borderWidth: 1 },
  letterBoxHorizontal: { marginHorizontal: 6, marginVertical: 0 },
  letterText: { fontWeight: '800', fontSize: 18 },
  centerArea: { flex: 1, paddingHorizontal: 12, paddingVertical: 8 },
  counter: { fontSize: 14, fontWeight: '700', marginTop: 8 },
  ballArea: { alignItems: 'center', paddingVertical: 6 },
  ballOuter: { width: 140, height: 140, borderRadius: 70, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff', shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 8 },
  ballInner: { width: 100, height: 100, borderRadius: 50, borderWidth: 8, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' },
  ballNumber: { fontSize: 40, fontWeight: '900' },
  // compact sizes for portrait
  ballOuterSm: { width: 120, height: 120, borderRadius: 60, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff', shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 8 },
  ballInnerSm: { width: 86, height: 86, borderRadius: 43, borderWidth: 7, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' },
  ballNumberSm: { fontSize: 34, fontWeight: '900' },
  recentRow: { flexDirection: 'row', marginTop: 6 },
  recentCircle: { width: 34, height: 34, borderRadius: 17, borderWidth: 2, marginHorizontal: 6, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' },
  recentCircleSm: { width: 28, height: 28, borderRadius: 14, borderWidth: 2, marginHorizontal: 4, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' },
  recentText: { fontWeight: '700' },
  recentTextSm: { fontWeight: '700', fontSize: 12 },
  infoRow: { marginTop: 16, gap: 20, flexDirection: 'row', alignItems: 'center', gap:30, justifyContent: 'space-between',  },
  infoText: { fontSize: 14, fontWeight: '600', marginBottom: 4 },
  rightRail: {flexDirection:'row', gap: 10, justifyContent: 'center', alignItems: 'center' },
  actionBtn: { width: 110, paddingVertical: 12, borderRadius: 10, alignItems: 'center', marginVertical: 8 },
  actionText: { fontWeight: '700' },
  // Portrait-specific pieces
  portraitRoot: { flex: 1, paddingHorizontal: 12, flexDirection: 'row', },
  portraitHeaderRow: { justifyContent: 'space-between', marginTop: 8 },
  bingoRow: { flexDirection: 'row', alignItems: 'center' },
  portraitMain: { flex: 1, marginTop: 8 },
  verticalGroupsContainer: { flex: 1, flexDirection: 'column', alignItems: 'center', paddingHorizontal: 10, marginTop: 20 },
  portraitInfoColumn: { width: '100%', justifyContent: 'flex-start' },
  derashBox: { paddingVertical: 8 },
  logoBox: { height: 80, borderRadius: 12, marginBottom: 8, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff' },
  logoBoxSmall: { height: 60, borderRadius: 12, marginBottom: 8, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 8 },
  logoBoxSm: { height: 52, borderRadius: 10, marginBottom: 8, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 8 },
  logoText: { fontSize: 28, fontWeight: '900' },
  logoTextSm: { fontSize: 22, fontWeight: '900' },
  logoImageSm: { width: 90, height: 90 },
  logoImageSmall: { width: 90, height: 90 },
  patternBox: { alignItems: 'center' },
  patternTitle: { fontSize: 14, fontWeight: '700', marginBottom: 6 },
  bottomActions: { flexDirection: 'row', justifyContent: 'space-around', paddingVertical: 5, },
  // Called numbers under letters
  lettersColumnsRow: { flexDirection: 'row', alignItems: 'flex-start' },
  letterColumn: { marginRight: 0, alignItems: 'center' },
  calledCell: { minWidth: 27, height: 27, borderRadius: 6, backgroundColor: '#e5e7eb', justifyContent: 'center', alignItems: 'center', marginVertical: 3, paddingHorizontal: 6 },
  calledCellText: { fontWeight: '700' },
  // Pattern header letters
  patternHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', width: 110, marginBottom: 6 },
  patternHeaderRowLandscape: { flexDirection: 'row', justifyContent: 'space-between', width: 160, marginBottom: 6 },
  patternHeaderLetter: { fontSize: 12, fontWeight: '700' },
  patternLetterBox: {
    width: 18,
    height: 18,
    borderWidth: 1,
    borderRadius: 3,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  // Modal
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalCard: { width: '100%', borderRadius: 16, padding: 16 },
  modalTitle: { fontSize: 18, fontWeight: '700', marginBottom: 6 },
  modalHelper: { fontSize: 12, marginBottom: 10 },
  modalInput: { height: 48, borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, marginBottom: 10 },
  modalActions: { flexDirection: 'row', justifyContent: 'space-between' },
  modalResult: { textAlign: 'center', marginBottom: 10, fontWeight: '700' },
  previewGridWrap: { alignItems: 'center', marginBottom: 10 },
  previewCell: { width: 34, height: 34, borderRadius: 6, borderWidth: 1, margin: 2, alignItems: 'center', justifyContent: 'center' },
  previewCellText: { fontWeight: '700', fontSize: 12 },
  // called numbers scroll
  letterNumbersScroll: { maxHeight: 180 },
  letterNumbersContent: { paddingBottom: 6, alignItems: 'center' },
  // Quick check styles
  quickCheckContainer: { 
    marginTop: 10,
    alignItems: 'center'
  },
  quickCheckLabel: { 
    fontSize: 12, 
    fontWeight: '600', 
    marginBottom: 6 
  },
  quickCheckButtons: { 
    flexDirection: 'row', 
    gap: 6 
  },
  quickCheckBtn: { 
    width: 32, 
    height: 32, 
    borderRadius: 16, 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  quickCheckBtnText: { 
    fontSize: 10, 
    fontWeight: '700' 
  },
  // Group container styles
  groupContainer: {
    // backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 12,
    marginVertical: 6,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
    width: '95%',
    alignItems: 'center',
  },
  // Check mark for completed letters
  checkMark: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#28A745',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkMarkText: {
    color: 'white',
    fontSize: 8,
    fontWeight: 'bold',
  },
  // Preview header letter box
  previewHeaderLetterBox: {
    width: 30,
    height: 24,
    borderWidth: 1,
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  // Info grid styles
  infoGrid: {
    width: '100%',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 8,
    marginVertical: 2,
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '700',
  },
  // Confetti styles
  confettiContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 9999,
    pointerEvents: 'none',
  },
  confettiPiece: {
    position: 'absolute',
    width: 8,
    height: 8,
    top: -10,
  },
  // Orientation button styles
  orientationBtn: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  orientationBtnText: {
    fontSize: 10,
    fontWeight: '700',
  },
});

// Helper to evaluate grid win against current settings and return winning pattern
function evaluateGridWinWithPattern(
  grid: boolean[][],
  opts: { patternCategory: any; selectedPattern: any; classicLinesTarget: number; classicSelectedLineTypes: string[] }
): { won: boolean; pattern: boolean[][] } {
  const emptyPattern = Array(5).fill(null).map(() => Array(5).fill(false));
  
  // Classic
  if (opts.patternCategory === 'classic') {
    if (opts.selectedPattern === 'full_house') {
      const won = grid.every(row => row.every(cell => cell));
      return { 
        won, 
        pattern: won ? Array(5).fill(null).map(() => Array(5).fill(true)) : emptyPattern 
      };
    }
    const allowed = new Set(opts.classicSelectedLineTypes || []);
    let achieved = 0;
    let winningPattern = Array(5).fill(null).map(() => Array(5).fill(false));
    
    if (allowed.has('horizontal')) {
      for (let r = 0; r < 5; r++) {
        if (grid[r].every(cell => cell)) {
          achieved++;
          for (let c = 0; c < 5; c++) winningPattern[r][c] = true;
          if (achieved >= (opts.classicLinesTarget || 1)) break;
        }
      }
    }
    if (achieved < (opts.classicLinesTarget || 1) && allowed.has('vertical')) {
      for (let c = 0; c < 5; c++) {
        if (grid.every(row => row[c])) {
          achieved++;
          for (let r = 0; r < 5; r++) winningPattern[r][c] = true;
          if (achieved >= (opts.classicLinesTarget || 1)) break;
        }
      }
    }
    if (achieved < (opts.classicLinesTarget || 1) && allowed.has('diagonal')) {
      if (grid.every((row, i) => row[i])) {
        achieved++;
        for (let i = 0; i < 5; i++) winningPattern[i][i] = true;
      }
      if (achieved < (opts.classicLinesTarget || 1) && grid.every((row, i) => row[4 - i])) {
        achieved++;
        for (let i = 0; i < 5; i++) winningPattern[i][4 - i] = true;
      }
    }
    return { won: achieved >= (opts.classicLinesTarget || 1), pattern: winningPattern };
  }
  
  // Modern patterns
  const won = evaluateGridWin(grid, opts);
  if (!won) return { won: false, pattern: emptyPattern };
  
  let pattern = Array(5).fill(null).map(() => Array(5).fill(false));
  switch (opts.selectedPattern) {
    case 'full_house': 
      pattern = Array(5).fill(null).map(() => Array(5).fill(true));
      break;
    case 'x_shape':
      for (let i = 0; i < 5; i++) {
        pattern[i][i] = true;
        pattern[i][4 - i] = true;
      }
      break;
    case 'plus_sign':
      for (let i = 0; i < 5; i++) {
        pattern[2][i] = true; // horizontal line
        pattern[i][2] = true; // vertical line
      }
      break;
    // Add more patterns as needed
    default:
      pattern = Array(5).fill(null).map(() => Array(5).fill(true)); // fallback
  }
  
  return { won, pattern };
}

// Original helper function (kept for compatibility)
function evaluateGridWin(
  grid: boolean[][],
  opts: { patternCategory: any; selectedPattern: any; classicLinesTarget: number; classicSelectedLineTypes: string[] }
): boolean {
  // Classic
  if (opts.patternCategory === 'classic') {
    if (opts.selectedPattern === 'full_house') {
      return grid.every(row => row.every(cell => cell));
    }
    const allowed = new Set(opts.classicSelectedLineTypes || []);
    let achieved = 0;
    if (allowed.has('horizontal')) achieved += countRows(grid);
    if (allowed.has('vertical')) achieved += countCols(grid);
    if (allowed.has('diagonal')) achieved += countDiags(grid);
    if (allowed.has('four_corners') && fourCorners(grid)) achieved += 1;
    if (allowed.has('plus') && plusSign(grid)) achieved += 1;
    if (allowed.has('x') && xShape(grid)) achieved += 1;
    return achieved >= (opts.classicLinesTarget || 1);
  }
  // Modern
  switch (opts.selectedPattern) {
    case 'full_house': return grid.every(r => r.every(c => c));
    case 't_shape': return tShape(grid);
    case 'u_shape': return uShape(grid);
    case 'x_shape': return xShape(grid);
    case 'plus_sign': return plusSign(grid);
    case 'diamond': return diamond(grid);
    case 'one_line': return oneLine(grid);
    case 'two_lines': return countRows(grid) >= 2;
    case 'three_lines': return countRows(grid) >= 3;
    default: return false;
  }
}

function oneLine(grid: boolean[][]): boolean {
  if (countRows(grid) >= 1) return true;
  if (countCols(grid) >= 1) return true;
  if (grid.every((row, i) => row[i])) return true;
  if (grid.every((row, i) => row[4 - i])) return true;
  return false;
}
function countRows(grid: boolean[][]): number { let c = 0; for (let r = 0; r < 5; r++) if (grid[r].every(v => v)) c++; return c; }
function countCols(grid: boolean[][]): number { let c = 0; for (let col = 0; col < 5; col++) if (grid.every(r => r[col])) c++; return c; }
function countDiags(grid: boolean[][]): number { let c = 0; if (grid.every((row, i) => row[i])) c++; if (grid.every((row, i) => row[4 - i])) c++; return c; }
function fourCorners(grid: boolean[][]): boolean { return grid[0][0] && grid[0][4] && grid[4][0] && grid[4][4]; }
function plusSign(grid: boolean[][]): boolean { return grid[2].every(v => v) && grid.every(r => r[2]); }
function xShape(grid: boolean[][]): boolean { return grid.every((row, i) => row[i]) && grid.every((row, i) => row[4 - i]); }
function tShape(grid: boolean[][]): boolean { return grid[0].every(v => v) && grid.every(r => r[2]); }
function uShape(grid: boolean[][]): boolean { return grid.every(r => r[0]) && grid.every(r => r[4]) && grid[4].every(v => v); }
function diamond(grid: boolean[][]): boolean { const pts = [[0, 2], [1, 1], [1, 3], [2, 0], [2, 2], [2, 4], [3, 1], [3, 3], [4, 2]]; return pts.every(([r, c]) => grid[r][c]); }