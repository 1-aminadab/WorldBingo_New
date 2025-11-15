import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, SafeAreaView, StyleSheet, TouchableOpacity, useWindowDimensions, Modal, TextInput, Alert, ScrollView, Image, Dimensions } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Animated, { useSharedValue, withTiming, useAnimatedStyle } from 'react-native-reanimated';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import { useGameTheme } from '../../components/ui/ThemeProvider';
import { Pause, Play, Power, PowerCircle, X } from 'lucide-react-native';
import Orientation from 'react-native-orientation-locker';
import { useSettingsStore } from '../../store/settingsStore';
import { PatternPreview } from '../../components/game/PatternPreview';
import { CheckModal } from '../../components/ui/CheckModal';
import { GameOverModal } from '../../components/ui/GameOverModal';
import { PlayPauseButton } from '../../components/ui/PlayPauseButton';
import { CheckButton } from '../../components/ui/CheckButton';
import { EndGameButton } from '../../components/ui/EndGameButton';
import { BingoGrid } from '../../components/game/BingoGrid';
import { DrawnNumber, BingoLetter } from '../../types';
import { audioManager } from '../../utils/audioManager';
import { audioQueue } from '../../utils/audioQueue';
import { useGameReportStore } from '../../store/gameReportStore';
import { transactionApiService } from '../../api/services/transaction';
import { useAuthStore } from '../../store/authStore';
import { getCardArrayForGame } from '../../utils/cardTypeManager';
import { reportApiService } from '../../api/services/report';
import { NumberAnnouncementService } from '../../services/numberAnnouncementService';
import { audioService } from '../../services/audioService';
import { LoadingOverlay } from '../../components/ui/LoadingOverlay';
import { GameLoadingOverlay } from '../../components/ui/GameLoadingOverlay';
import { ReportStorageManager } from '../../utils/reportStorage';
import { useReportSyncStore } from '../../sync/reportSyncStore';
import { ScreenNames } from '../../constants/ScreenNames';

// Utility function to generate unique report ID
const generateReportId = () => {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000);
  return `RPT_${timestamp}_${random}`;
};

// Helper function to get pattern display name
const getPatternDisplayName = (category: any, pattern: any, linesTarget?: number) => {
  if (category === 'classic') {
    if (pattern === 'full_house') return 'Full House';
    const target = linesTarget || 1;
    return `${target} Line${target > 1 ? 's' : ''}`;
  }
  
  switch (pattern) {
    case 'full_house': return 'Full House';
    case 't_shape': return 'T Shape';
    case 'u_shape': return 'U Shape';
    case 'l_shape': return 'L Shape';
    case 'x_shape': return 'X Shape';
    case 'plus_sign': return 'Plus Sign';
    case 'diamond': return 'Diamond';
    case 'one_line': return '1 Line';
    case 'two_lines': return '2 Lines';
    case 'three_lines': return '3 Lines';
    default: return '1 Line';
  }
};

export const SinglePlayerGameScreen: React.FC = () => {
  console.log('🎮 SINGLE PLAYER GAME SCREEN MOUNTED');
  const navigation = useNavigation();
  const route = useRoute();
  const { theme } = useGameTheme();
  const { user } = useAuthStore();
  const { addReport } = useReportSyncStore();
  // Remove all backend game report sync functionality

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
  const { rtpPercentage, derashAmount, medebAmount, customCardTypes, selectedCardTypeName, patternCategory, selectedPattern, classicLinesTarget, classicSelectedLineTypes, voiceLanguage, selectedVoice, numberCallingMode, gameDuration } = useSettingsStore();
  const [calledNumbers, setCalledNumbers] = useState<DrawnNumber[]>([]);
  const [current, setCurrent] = useState<DrawnNumber | null>(null);
  const [paused, setPaused] = useState(false);
  const startTimeRef = useRef<number>(Date.now());
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const calledNumbersRef = useRef<DrawnNumber[]>([]);
  const [checkVisible, setCheckVisible] = useState(false);
  const [checkMessage, setCheckMessage] = useState<string | null>(null);
  const [previewGridNumbers, setPreviewGridNumbers] = useState<(number | null)[][] | null>(null);
  const [previewMatched, setPreviewMatched] = useState<boolean[][] | null>(null);
  const [previewWon, setPreviewWon] = useState<boolean>(false);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [gameOverVisible, setGameOverVisible] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [animationNumber, setAnimationNumber] = useState(0);
  const [finalNumber, setFinalNumber] = useState<number | null>(null);
  const [winningPattern, setWinningPattern] = useState<boolean[][]>([]);
  const [selectedCardNumbers, setSelectedCardNumbers] = useState<number[]>([]);
  const [singleSelectedNumbers, setSingleSelectedNumbers] = useState<number[]>([]);
  const [gameMedebAmount, setGameMedebAmount] = useState<number>(0);
  const [gameDerashValue, setGameDerashValue] = useState<number>(0);
  const [gameSelectedCardTypeName, setGameSelectedCardTypeName] = useState<string>('');
  const [gameCustomCardTypes, setGameCustomCardTypes] = useState<any[]>([]);
  const [showConfetti, setShowConfetti] = useState(false);
  const [bingoFound, setBingoFound] = useState(false);
  const [userClickedNumbers, setUserClickedNumbers] = useState<Set<number>>(new Set());
  const [isEndingGame, setIsEndingGame] = useState(false);
  const [reportsCreated, setReportsCreated] = useState(false);
  const [gameStartReportCreated, setGameStartReportCreated] = useState(false);
  const [gameReportId, setGameReportId] = useState<string | null>(null);
  const canCheck = useMemo(() => true, []); // Always allow checking, validation happens in submitCheck

  const ballPulse = useSharedValue(0);
  const ballBounce = useSharedValue(0);
  const ballAnim = useAnimatedStyle(() => ({ 
    transform: [{ scale: 1 + 0.05 * ballPulse.value + 0.1 * ballBounce.value }] 
  }));

  // Calculate profit display using same logic as game end
  const totalCardsSoldForDisplay = singleSelectedNumbers.length;
  const effectiveMedebAmountForDisplay = gameMedebAmount > 0 ? gameMedebAmount : (medebAmount ?? 0);
  const totalCollectedAmountForDisplay = effectiveMedebAmountForDisplay * totalCardsSoldForDisplay;
  const effectiveRtpPercentageForDisplay = totalCardsSoldForDisplay <= 4 ? 100 : (rtpPercentage ?? 60);
  const profitShown = Math.round(totalCollectedAmountForDisplay * (100 - effectiveRtpPercentageForDisplay) / 100);

  // Extract player cartela data from route params
  useEffect(() => {
    const params = route.params as any;
    if (params?.selectedCardNumbers) {
      setSelectedCardNumbers(params.selectedCardNumbers);
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
  }, [route.params]);

  // Create game report when game starts
  useEffect(() => {
    // Create game start report after route params are loaded
    if (singleSelectedNumbers.length > 0 && !gameStartReportCreated) {
      createGameStartReport();
    }
  }, [singleSelectedNumbers, gameStartReportCreated]);

  // Create complete game report when game starts with all necessary data
  const createGameStartReport = async () => {
    if (gameStartReportCreated) return;
    
    try {
      const totalCardsSold = singleSelectedNumbers.length;
      const effectiveMedebAmount = gameMedebAmount > 0 ? gameMedebAmount : (medebAmount ?? 0);
      const totalCollectedAmount = effectiveMedebAmount * totalCardsSold;
      const patternDisplayName = getPatternDisplayName(patternCategory, selectedPattern, classicLinesTarget);
      const effectiveRtpPercentage = totalCardsSold <= 4 ? 100 : (rtpPercentage ?? 60);
      const payout = totalCollectedAmount * effectiveRtpPercentage / 100; // Calculate payout at start
      
      const userId = useAuthStore.getState().getUserId();
      
      // Create complete report with all necessary data at start
      const reportId = await ReportStorageManager.addGameEntry({
        cardsSold: totalCardsSold,
        collectedAmount: totalCollectedAmount,
        rtpPercentage: effectiveRtpPercentage,
        gameDurationMinutes: 0, // Will be updated when game ends
        totalNumbersCalled: 0, // Will be updated when game ends
        pattern: patternDisplayName,
        winnerFound: false, // Will be updated when game ends
        userId: userId || undefined,
        gameStatus: 'started',
        gameMode: 'single_player'
      });
      
      setGameReportId(reportId); // Store the ID for later updates
      setGameStartReportCreated(true);

      // Create sync report immediately at game start
      console.log('🎮 SINGLE PLAYER GAME STARTED - Creating sync report at start');
      addReport({
        id: generateReportId(),
        numberOfGames: 1,
        numberOfCards: totalCardsSold,
        totalPayin: totalCollectedAmount,
        totalPayout: payout,
        balance: totalCollectedAmount - payout
      });

      // Backend sync removed - only local reports now
    } catch (error) {
      console.error('❌ Error creating complete SinglePlayer game start report:', error);
    }
  };

  // Pause background music when entering game, resume when leaving
  useEffect(() => {
    audioService.pauseMusic();
    
    return () => {
      audioService.resumeMusic();
      // Clear audio queue when leaving the screen
      audioQueue.clear();
    };
  }, []);

  // Sync voice settings with audioManager
  useEffect(() => {
    // Update audio manager whenever selected voice changes
    if (selectedVoice) {
      audioManager.setVoice(selectedVoice);
    }
  }, [selectedVoice]);

  // Initialize orientation on mount
  useEffect(() => {
    Orientation.lockToPortrait();
    return () => {
      Orientation.lockToPortrait();
    };
  }, []);

  useEffect(() => {
    // Always use automatic mode in SinglePlayerGameScreen - ignore numberCallingMode setting
    if (paused) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current as any);
        intervalRef.current = null;
      }
      return;
    }
    drawNext();
    const duration = gameDuration || 10; // Always use automatic timing
    intervalRef.current = setInterval(drawNext, duration * 1000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current as any);
    };
  }, [paused, gameDuration]); // Remove numberCallingMode dependency

  // Initial number draw - always start immediately in SinglePlayerGameScreen
  useEffect(() => {
    if (calledNumbers.length === 0) {
      // Play game start sound
      if (selectedVoice) {
        audioManager.setVoice(selectedVoice);
        audioManager.playGameStartSound();
      }
      
      // Add delay before first number like in GameScreen
      setTimeout(() => {
        drawNext();
      }, 3000);
    }
  }, [selectedVoice]); // Add selectedVoice dependency

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
    
    // Start ball animation immediately
    ballBounce.value = 0;
    ballBounce.value = withTiming(1, { duration: 200 }, () => {
      ballBounce.value = withTiming(0, { duration: 200 });
    });
    
    ballPulse.value = 0;
    ballPulse.value = withTiming(1, { duration: 1500 });
    
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
      
      // Queue audio for the drawn number to prevent overlap
      audioQueue.enqueue(drawn.letter, drawn.number);
      
      // Final bounce animation when number is revealed
      ballBounce.value = 0;
      ballBounce.value = withTiming(1.5, { duration: 400 }, () => {
        ballBounce.value = withTiming(0, { duration: 400 });
      });
      
      ballPulse.value = 0;
      ballPulse.value = withTiming(1.2, { duration: 800 });
    }, 1500);
  };

  const endGame = async () => {
    // Stop all intervals and audio
    if (intervalRef.current) {
      clearInterval(intervalRef.current as any);
      intervalRef.current = null;
    }
    
    // Stop any ongoing audio and clear the queue
    audioManager.stopAllSounds();
    audioQueue.clear();
    
    // Show loading overlay
    setIsEndingGame(true);
    
    const duration = Math.floor((Date.now() - startTimeRef.current) / 1000);
    const durationMinutes = Math.floor(duration / 60);
    
    // Calculate game data for reporting
    const totalCardsSold = singleSelectedNumbers.length;
    const effectiveMedebAmount = gameMedebAmount > 0 ? gameMedebAmount : (medebAmount ?? 0);
    const totalCollectedAmount = effectiveMedebAmount * totalCardsSold;
    const patternDisplayName = getPatternDisplayName(patternCategory, selectedPattern, classicLinesTarget);
    
    // Only update existing report if it hasn't been updated yet
    console.log('🏁 SINGLE PLAYER GAME ENDED - Processing report...');
    
    if (!reportsCreated) {
      if (gameReportId) {
      try {
        const gameId = `game_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        // Apply RTP only if more than 4 cards/players, otherwise 100% payout
        const effectiveRtpPercentage = totalCardsSold <= 4 ? 100 : (rtpPercentage ?? 60);
        const payout = bingoFound ? (totalCollectedAmount * effectiveRtpPercentage / 100) : 0;
        
        // Update existing game report with completion data
        console.log('🎮 Updating existing SinglePlayer game report with COMPLETION data using ReportStorageManager');
        const userId = useAuthStore.getState().getUserId();
        
        console.log('🎮 SinglePlayer game COMPLETION update data:', {
          reportId: gameReportId,
          gameDurationMinutes: durationMinutes,
          totalNumbersCalled: calledNumbers.length,
          winnerFound: bingoFound,
          gameStatus: 'completed',
          userId: userId || undefined
        });
        
        await ReportStorageManager.updateGameEntry(gameReportId, {
          gameDurationMinutes: durationMinutes,
          totalNumbersCalled: calledNumbers.length,
          winnerFound: bingoFound,
          gameStatus: 'completed'
        }, userId || undefined);
        
        console.log('✅ Existing SinglePlayer game report UPDATED with completion data successfully');

        // Sync report already created at game start

        // Backend sync removed - only local reports now

        // Record payout transaction if user won and there's a payout
        if (user?.id && payout > 0) {
          try {
            const userId = useAuthStore.getState().getUserId();
            if (!userId) {
              throw new Error('No user ID available');
            }
            
            // Only create payout transaction (payin was already created at game start)
            await transactionApiService.createTransaction({
              userId: userId, // Keep as string to match payin transaction
              gameId,
              type: 'payout',
              amount: payout,
              description: `Game payout - won ${payout.toFixed(0)} Birr (${patternDisplayName})`
            });
            
          } catch (transactionError) {
            // Transaction error handled silently
          }
        }

        // Mark reports as created
        setReportsCreated(true);
      } catch (error) {
        console.error('❌ Error saving game report to backend:', error);
      }
      } else {
        console.error('❌ NO GAME REPORT ID IN SINGLE PLAYER - Report will not be created!');
        console.log('🚨 This means createGameStartReport() was not called or failed in single player mode');
      }
    } else {
      console.log('📊 Reports already created, skipping report update');
    }
    
    // Calculate profit amount based on effective RTP (100% for 4 or less cards, otherwise configured RTP)
    const effectiveRtpPercentage = totalCardsSold <= 4 ? 100 : (rtpPercentage ?? 60);
    const profitAmount = totalCollectedAmount * (100 - effectiveRtpPercentage) / 100;
    
    // Add delay for loading effect before navigating
    setTimeout(() => {
      setIsEndingGame(false);
      
      (navigation as any).navigate(ScreenNames.GAME_SUMMARY, {
        totalDrawn: calledNumbers.length,
        derashShownBirr: profitShown,
        medebBirr: medebAmount ?? 0,
        durationSeconds: duration,
        history: calledNumbers,
        // Add additional data for enhanced summary
        totalCardsSold,
        totalCollectedAmount,
        profitAmount,
      });
    }, 1500); // 1.5 second loading effect
  };

  const openCheck = () => {
    // Play check cartela sound
    audioManager.announceCheckWinner();
    
    setCheckMessage(null);
    setPreviewGridNumbers(null);
    setPreviewMatched(null);
    setPreviewWon(false);
    setPreviewError(null);
    setCheckVisible(true);
    setPaused(true); // pause drawing while checking
  };

  const submitCheck = (cardIndex: number) => {
    // Get the correct card data using the card type manager
    const availableCards = getCardArrayForGame(
      gameSelectedCardTypeName || selectedCardTypeName, 
      gameCustomCardTypes,
      customCardTypes
    );
    
    if (cardIndex < 1 || cardIndex > availableCards.length) {
      setPreviewError(`Card ${cardIndex} does not exist (1..${availableCards.length})`);
      setPreviewGridNumbers(null); setPreviewMatched(null); setPreviewWon(false);
      return;
    }
    
    if (selectedCardNumbers.length > 0 && !selectedCardNumbers.includes(cardIndex)) {
      setPreviewError(`Card ${cardIndex} not found - only selected cards can be checked`);
      setPreviewGridNumbers(null); setPreviewMatched(null); setPreviewWon(false);
      return;
    }
    
    const numbers24 = availableCards[cardIndex - 1];
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
      
      // Play winner audio sequence after a short delay to avoid conflict
      setTimeout(() => {
        if (selectedVoice) {
          // Stop any ongoing audio first
          audioManager.stopAllSounds();
          NumberAnnouncementService.announceWinnerCartela(cardIndex, selectedVoice);
        }
      }, 1000); // Wait 1 second to let current number announcement finish
      
      // Hide confetti after 3 seconds
      setTimeout(() => {
        setShowConfetti(false);
      }, 3000);
    }
  };

  const { width } = useWindowDimensions();
  const lastThreeNumbers = useMemo(() => {
    if (calledNumbers.length === 0) return [null, null, null];
    if (calledNumbers.length === 1) return [calledNumbers[0], null, null];
    if (calledNumbers.length === 2) return [calledNumbers[1], calledNumbers[0], null];
    return calledNumbers.slice(-3).reverse(); // Most recent first
  }, [calledNumbers]);
  const letters: BingoLetter[] = ['B', 'I', 'N', 'G', 'O'];

  const groupedByLetter = useMemo(() => {
    const map: Record<BingoLetter, number[]> = { B: [], I: [], N: [], G: [], O: [] };
    calledNumbers.forEach((d) => {
      map[d.letter].push(d.number);
    });
    return map;
  }, [calledNumbers]);

  const handleNumberClick = (number: number) => {
    // Allow clicking any number, not just called ones
    setUserClickedNumbers(prev => {
      const newSet = new Set(prev);
      if (newSet.has(number)) {
        newSet.delete(number); // Unmark if already marked
      } else {
        newSet.add(number); // Mark the number
      }
      return newSet;
    });
    
    // Check for bingo after clicking with a delay to avoid audio conflicts
    setTimeout(() => checkForBingo(), 2000); // Wait 2 seconds to avoid conflicts with number calling
  };
  
  const checkForBingo = () => {
    // Get the correct card data using the card type manager
    const availableCards = getCardArrayForGame(
      gameSelectedCardTypeName || selectedCardTypeName, 
      gameCustomCardTypes,
      customCardTypes
    );
    
    for (const cardNumber of singleSelectedNumbers) {
      const cardIndex = cardNumber - 1;
      if (cardIndex >= availableCards.length) continue;
      
      const numbers24 = availableCards[cardIndex];
      const gridNumbers: (number | null)[][] = Array(5).fill(null).map(() => Array(5).fill(null));
      let p = 0;
      for (let r = 0; r < 5; r++) {
        for (let c = 0; c < 5; c++) {
          if (r === 2 && c === 2) continue; // free center
          gridNumbers[r][c] = numbers24[p++] ?? null;
        }
      }
      
      const matched: boolean[][] = Array(5).fill(null).map(() => Array(5).fill(false));
      for (let r = 0; r < 5; r++) {
        for (let c = 0; c < 5; c++) {
          if (r === 2 && c === 2) { 
            matched[r][c] = true; // Free center
            continue; 
          }
          const num = gridNumbers[r][c];
          if (num != null) {
            // Check if number was called in the game
            const isNumberCalled = calledNumbers.some(d => {
              let letter: BingoLetter = 'B';
              if (num >= 1 && num <= 15) letter = 'B';
              else if (num <= 30) letter = 'I';
              else if (num <= 45) letter = 'N';
              else if (num <= 60) letter = 'G';
              else letter = 'O';
              return d.number === num && d.letter === letter;
            });
            matched[r][c] = isNumberCalled;
          }
        }
      }
      
      const winResult = evaluateGridWinWithPattern(matched, {
        patternCategory,
        selectedPattern,
        classicLinesTarget: classicLinesTarget || 1,
        classicSelectedLineTypes: classicSelectedLineTypes || [],
      });
      
      if (winResult.won) {
        setShowConfetti(true);
        setBingoFound(true);
        setPaused(true);
        
        // Play winner audio after delay to avoid conflicts
        setTimeout(() => {
          if (selectedVoice) {
            // Stop any ongoing audio first
            audioManager.stopAllSounds();
            NumberAnnouncementService.announceWinnerCartela(cardNumber, selectedVoice);
          }
        }, 1000); // Wait 1 second to let current number announcement finish
        
        // Hide confetti after 3 seconds
        setTimeout(() => {
          setShowConfetti(false);
        }, 3000);
        
        return; // Stop checking other cards
      }
    }
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
                  }
                ]}
              />
            ))}
          </View>
        )}

        {/* Game Progress Indicator with Profit/Entry Info - Absolute positioned */}
        <View style={styles.progressIndicator}>
          <View style={styles.progressRow}>
            <Text style={[styles.progressText, { color: theme.colors.text }]}>
              {calledNumbers.length}/75
            </Text>
            <View style={styles.profitEntryRow}>
              <View style={styles.profitEntryItem}>
                <Text style={[styles.profitEntryLabel, { color: theme.colors.text }]}>Profit: </Text>
                <Text style={[styles.profitEntryValue, { color: theme.colors.text }]}>
                  {profitShown} Birr
                </Text>
              </View>
              <View style={styles.profitEntryItem}>
                <Text style={[styles.profitEntryLabel, { color: theme.colors.text }]}>Total Players: </Text>
                <Text style={[styles.profitEntryValue, { color: theme.colors.text }]}>
                  {totalCardsSoldForDisplay}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Horizontal Game UI Bar */}
        <View style={styles.horizontalGameBar}>
          {/* Three Bingo Balls - Center */}
          <View style={styles.bingoBallsContainer}>
            {Array.from({ length: 3 }).map((_, index) => {
              const ballNumber = lastThreeNumbers[index];
              const isMainBall = index === 0;
              const ballColors = ['#1E90FF', '#FF1493', '#DC143C']; // Light blue, magenta, red
              const ballColor = ballColors[index % ballColors.length];
              
              return (
                <View key={index} style={styles.bingoBallWrapper}>
                  <Animated.View style={[
                    styles.bingoBallOuter, 
                    { borderColor: ballColor },
                    isMainBall ? ballAnim : undefined
                  ]}>
                    <View style={[styles.bingoBallInner, { backgroundColor: theme.colors.card }]}>
                      { ballNumber && (
                        <Text style={[styles.bingoBallLetter, { color: theme.colors.text }]}>
                          {ballNumber.letter}
                        </Text>
                      )}
                      <View style={{ marginBottom: 10 }}>
                           <Text style={[styles.bingoBallNumber, { 
                        color: isAnimating && isMainBall ? theme.colors.textSecondary : (ballNumber ? ballColor : theme.colors.text),
                        opacity: isAnimating && isMainBall ? 0.3 : 1,
                        marginTop: (!isAnimating && ballNumber) ? -4 : 0
                      }]}>
                        {isAnimating && isMainBall ? animationNumber : 
                         ballNumber ? ballNumber.number : '--'}
                      </Text>
                      </View>
                   
                    </View>
                  </Animated.View>
                </View>
              );
            })}
          </View>
          
          {/* Winning Pattern Preview - Far Right */}
           {/* Pattern info */}
           <View style={[{ position:'absolute', top: -25, right: 0, borderRadius: 8, padding: 0, width: 90, height: 80 }, styles.patternCardContainer]}
           >
             <View style={styles.patternCardContent}>
               <Text style={[styles.patternTitle, { color: theme.colors.text }]}>{getPatternDisplayName(patternCategory, selectedPattern, classicLinesTarget)}</Text>
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
               <PatternPreview size={60} />
             </View>
           </View>
        </View>

    
        {/* BINGO Numbers Grid */}
        <View style={styles.bingoNumbersGrid}>
          {letters.map((letter) => {
            const letterRanges: Record<BingoLetter, [number, number]> = { 
              B: [1, 15], I: [16, 30], N: [31, 45], G: [46, 60], O: [61, 75] 
            };
            const [min, max] = letterRanges[letter];
            const calledNumbersForLetter = groupedByLetter[letter];
            const letterColors = {
              B: '#1E90FF', // Light blue
              I: '#FFD700', // Yellow
              N: '#FF1493', // Magenta/Pink
              G: '#32CD32', // Green
              O: '#DC143C'  // Red
            };

            return (
              <View key={letter} style={styles.bingoNumberRow}>
                {/* Letter header */}
                <View style={[styles.bingoLetterHeader, { 
                  borderWidth: 1, 
                  borderColor: letterColors[letter]
                }]}>
                  <Text style={[styles.bingoLetterHeaderText, { color: theme.colors.text }]}>{letter}</Text>
                </View>
                
                {/* Numbers row */}
                <View style={styles.numbersRow}>
                  {Array.from({ length: max - min + 1 }, (_, i) => {
                    const num = min + i;
                    const isCalled = calledNumbersForLetter.includes(num);

                    return (
                      <View
                        key={`${letter}-${num}`}
                        style={[
                          styles.numberCell,
                          {
                            backgroundColor: isCalled ? letterColors[letter] : theme.colors.surface,
                          }
                        ]}
                      >
                        <Text style={[
                          styles.numberCellText,
                          { color: theme.colors.text }
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

        {/* BINGO Cards - 2 per row */}
        <View style={styles.bingoCardsSection}>
          <ScrollView showsVerticalScrollIndicator={false} style={styles.cardsScrollView}>
            <View style={styles.cardsGrid}>
              {singleSelectedNumbers.slice(0, 4).map((cardNumber, index) => (
                <View key={cardNumber} style={styles.cardWrapper}>
                  <BingoGrid
                    cardIndex={cardNumber - 1}
                    cards={getCardArrayForGame(
                      gameSelectedCardTypeName || selectedCardTypeName, 
                      gameCustomCardTypes,
                      customCardTypes
                    )}
                    calledNumbers={calledNumbers}
                    userClickedNumbers={userClickedNumbers}
                    onNumberClick={handleNumberClick}
                    cardNumber={cardNumber}
                  />
                </View>
              ))}
            </View>
          </ScrollView>
        </View>

        {/* Bottom Controls */}
        <View style={styles.bottomControls}>
          <EndGameButton onPress={endGame} />

          <PlayPauseButton
            paused={paused}
            bingoFound={bingoFound}
            onPress={() => {
              if (bingoFound) {
                setBingoFound(false);
                setPaused(false);
                audioManager.announceGameResume();
              } else {
                const willBePaused = !paused;
                setPaused(willBePaused);
                if (willBePaused) {
                  audioManager.announceGamePause();
                } else {
                  audioManager.announceGameResume();
                }
              }
            }}
          />

          <CheckButton
            onPress={openCheck}
            style={{ flex: 1 }}
          />
        </View>

        {/* Check Modal */}
        <CheckModal
          visible={checkVisible}
          onClose={() => setCheckVisible(false)}
          onSubmit={submitCheck}
          canCheck={canCheck}
          previewGridNumbers={previewGridNumbers}
          previewMatched={previewMatched}
          previewWon={previewWon}
          previewError={previewError}
          checkMessage={checkMessage}
          winningPattern={winningPattern}
          isLandscape={false}
        />

        {/* Game Over Modal */}
        <GameOverModal
          visible={gameOverVisible}
          onClose={() => setGameOverVisible(false)}
          onSummary={endGame}
        />

        {/* Loading Overlay for Game End */}
        <GameLoadingOverlay 
          visible={isEndingGame} 
          type="game_end"
          size="large"
        />
      </SafeAreaView>
    </LinearGradient>
  );
};

const { width } = Dimensions.get('window');
const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 15 },
  safeArea: { flex: 1 },
  
  // Horizontal Game Bar Styles
  horizontalGameBar: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 4,
    marginHorizontal: 5,
    marginVertical: 6,
    minHeight: 60,
    marginTop: 30,
  },
  progressIndicator: {
    position: 'absolute',
    top: 10,
    left: 10,
    right: 10,
    zIndex: 100,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
  },
  progressText: {
    fontSize: 12,
    fontWeight: '700',
  },
  patternSection: {
    alignItems: 'center',
    gap: 4,
  },
  patternPreviewTop: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  patternSectionTop: {
    alignItems: 'center',
  },
  patternTitleTop: {
    fontSize: 11,
    fontWeight: '600',
    opacity: 0.9,
  },
  profitEntryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
  },
  bingoBallsLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
    justifyContent: 'flex-start',
  },
  bingoBallsCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  profitEntryItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profitEntryLabel: {
    fontSize: 10,
    fontWeight: '600',
    opacity: 0.8,
  },
  profitEntryValue: {
    fontSize: 11,
    fontWeight: '700',
  },
  bingoBallsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    flex: 1,
    justifyContent: 'flex-start',
  },
  bingoBallWrapper: {
    alignItems: 'center',
  },
  bingoBallOuter: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 3,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  bingoBallInner: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  bingoBallLetter: {
    fontSize: 14,
    fontWeight: '900',
    
  },
  bingoBallNumber: {
    fontSize: 16,
    fontWeight: '900',
  },
  prizeInfoContainer: {
    alignItems: 'flex-end',
    minWidth: 80,
  },
  coinIcon: {
    fontSize: 14,
    marginRight: 4,
  },
  prizeAmount: {
    fontSize: 12,
    fontWeight: '700',
    color: '#8B4513',
  },
  medebInfo: {
    fontSize: 10,
    fontWeight: '600',
    marginTop: 2,
    color: '#8B4513',
  },
  patternPreviewContainer: {
    alignItems: 'center',
    minWidth: 80,
  },
  patternCardContainer: {
    margin: 0,
    marginVertical: 0,
    marginLeft: 5,
  },
  patternCardContent: {
    alignItems: 'center',
    padding: 4,
  },
  patternBox: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 6,
    padding: 0,
    marginLeft: 5,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  patternTitle: {
    fontSize: 8,
    fontWeight: '700',
    marginBottom: 3,
    textAlign: 'center',
  },
  patternLabel: {
    fontSize: 8,
    fontWeight: '600',
    marginBottom: 2,
  },
  patternGrid: {
    alignItems: 'center',
  },
  patternHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: 50,
    marginBottom: 4,
  },
  patternLetterBox: {
    width: 8,
    height: 8,
    borderWidth: 1,
    borderRadius: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  patternHeaderLetter: {
    fontSize: 6,
    fontWeight: '700',
  },
  patternHeaderCell: {
    width: 8,
    height: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  patternHeaderText: {
    fontSize: 6,
    fontWeight: '700',
  },
  patternGridRow: {
    flexDirection: 'row',
  },
  patternGridCell: {
    width: 8,
    height: 8,
    borderWidth: 0.5,
    borderColor: '#ccc',
    justifyContent: 'center',
    alignItems: 'center',
  },
  patternCenterText: {
    fontSize: 6,
    fontWeight: '700',
  },

  // Legacy styles (keeping for compatibility)
  topHeaderSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    marginHorizontal: 10,
    marginVertical: 8,
  },
  counterText: {
    fontSize: 12,
    fontWeight: '700',
    minWidth: 50,
  },
  ballsRowHorizontal: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
    justifyContent: 'center',
  },
  ballContainerSmall: {
    alignItems: 'center',
  },
  ballOuterSmall: { 
    width: 65, 
    height: 65, 
    borderRadius: 32.5, 
    justifyContent: 'center', 
    alignItems: 'center',
    shadowColor: '#000', 
    shadowOpacity: 0.2, 
    shadowRadius: 4,
    elevation: 4,
  },
  ballNumberSmall: { 
    fontSize: 22, 
    fontWeight: '900',
    color: '#fff',
  },
  rightInfoSection: {
    alignItems: 'flex-end',
    flexDirection:'row'
  },
  prizeCardContainer: {
    margin: 0,
    marginVertical: 0,
  },
  prizeCardContent: {
    padding: 4,
    alignItems: 'flex-end',
  },
  prizeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  prizeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E3A8A', // Dark blue background
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginBottom: 2,
  },
  prizeIcon: {
    fontSize: 16,
    marginRight: 4,
  },
  prizeText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
  },
  medebTextSmall: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
  },
  patternContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  patternLabelSmall: {
    fontSize: 12,
    fontWeight: '600',
  },

  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginHorizontal: 10,
    borderRadius: 10,
  },
  statText: {
    fontSize: 16,
    fontWeight: '700',
  },

  // BINGO Numbers Grid Styles
  bingoNumbersGrid: {
    paddingHorizontal: 10,
    paddingVertical: 15,
    marginHorizontal: 10,
    borderRadius: 8,
    marginBottom: 10,
  },
  bingoNumberRow: {
    flexDirection: 'row',
    marginBottom: 8,
    alignItems: 'center',
  },
  bingoLetterHeader: {
    width: (width - 92) / 15 - 1, // Match number cell width
    height: 30, // Match number cell height
    borderRadius: 6,
    marginRight: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bingoLetterHeaderText: {
    fontWeight: '800',
    fontSize: 16,
    color: '#fff',
  },
  numbersRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    flex: 1,
    gap: 2,
  },
  numberCell: {
    width: (width - 92) / 15 - 1, // Reduced width to fit on one line
    height: 30,
    borderRadius: 4,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight:0.5,
  },
  numberCellText: {
    fontWeight: '700',
    fontSize: 12,
  },

  // Legacy styles (keeping for compatibility)
  bingoLettersSection: {
    paddingHorizontal: 10,
    paddingVertical: 15,
  },
  bingoLetterColumn: {
    marginBottom: 10,
    flexDirection:'row'
  },
  bingoLetterBox: {
    height: 35,
    width: 35,
    borderRadius: 8,
    marginBottom: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    marginRight:5
  },
  bingoLetterText: {
    fontWeight: '800',
    fontSize: 18,
    color: '#fff',
    
  },

  bingoCardsSection: {
    flex: 1,
    paddingHorizontal: 10,
  },
  cardsScrollView: {
    flex: 1,
  },
  cardsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 5,
  },
  cardWrapper: {
    width: '48%', // Exactly 48% width for each card
    marginBottom: 15,
  },

  bottomControls: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 15,
    gap: 10,
  },
  endGameBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  controlBtn: {
    height: 40,
    paddingHorizontal: 15,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  controlText: {
    fontWeight: '700',
    fontSize: 16,
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

});

// Helper functions (same as in GameScreen)
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