import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, SafeAreaView, StyleSheet, TouchableOpacity, useWindowDimensions, Alert, ScrollView, Image, Dimensions, Platform } from 'react-native';
import Sound from 'react-native-sound';
import LinearGradient from 'react-native-linear-gradient';
import Animated, { useSharedValue, withTiming, useAnimatedStyle } from 'react-native-reanimated';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import { useGameTheme } from '../../components/ui/ThemeProvider';
import { Pause, Play, Power, PowerCircle, X } from 'lucide-react-native';
import Orientation from 'react-native-orientation-locker';
import { useSettingsStore } from '../../store/settingsStore';
import { PatternPreview } from '../../components/game/PatternPreview';
import { LandscapeGameUI } from '../../components/game/LandscapeGameUI';
import { Ball } from '../../components/game/Ball';
import { CheckModal } from '../../components/ui/CheckModal';
import { GameOverModal } from '../../components/ui/GameOverModal';
import { PlayPauseButton } from '../../components/ui/PlayPauseButton';
import { CheckButton } from '../../components/ui/CheckButton';
import { EndGameButton } from '../../components/ui/EndGameButton';
import { DerashMedebInfo } from '../../components/ui/DerashMedebInfo';
import { DrawnNumber, BingoLetter } from '../../types';
import { audioManager } from '../../utils/audioManager';
import { audioQueue } from '../../utils/audioQueue';
import { useGameReportStore } from '../../store/gameReportStore';
import { transactionApiService } from '../../api/services/transaction';
import { useAuthStore } from '../../store/authStore';
import { NumberAnnouncementService } from '../../services/numberAnnouncementService';
import { getCardArrayForGame } from '../../utils/cardTypeManager';
import { reportApiService } from '../../api/services/report';
import { audioService } from '../../services/audioService';
import { LoadingOverlay } from '../../components/ui/LoadingOverlay';
import { GameLoadingOverlay } from '../../components/ui/GameLoadingOverlay';
import { ReportStorageManager } from '../../utils/reportStorage';
import { useReportSyncStore } from '../../sync/reportSyncStore';
import { ScreenNames } from '../../constants/ScreenNames';

const { height } = Dimensions.get('window');

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

export const GameScreen: React.FC = () => {
  console.log('🎮 GAME SCREEN MOUNTED');
  const navigation = useNavigation();
  const route = useRoute();
  const { theme } = useGameTheme();
  // Remove all backend game report sync functionality
  const { user } = useAuthStore();
  const { addReport } = useReportSyncStore();

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
  const { rtpPercentage, derashAmount, medebAmount, customCardTypes, selectedCardTypeName, patternCategory, selectedPattern, classicLinesTarget, classicSelectedLineTypes, voiceLanguage, selectedVoice, numberCallingMode, gameDuration, allowedLateCalls } = useSettingsStore();
  const [calledNumbers, setCalledNumbers] = useState<DrawnNumber[]>([]);
  const [current, setCurrent] = useState<DrawnNumber | null>(null);
  const [paused, setPaused] = useState(false);
  const startTimeRef = useRef<number>(Date.now());
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const calledNumbersRef = useRef<DrawnNumber[]>([]);
  const [checkVisible, setCheckVisible] = useState(false);
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
  const [forcedOrientation, setForcedOrientation] = useState<'portrait' | 'landscape'>('portrait');
  const [gameStarted, setGameStarted] = useState(false);
  const [initialDelayComplete, setInitialDelayComplete] = useState(false);
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
  const totalCardsSoldForDisplay = selectedCardNumbers.length;
  const effectiveMedebAmountForDisplay = gameMedebAmount > 0 ? gameMedebAmount : (medebAmount ?? 0);
  const totalCollectedAmountForDisplay = effectiveMedebAmountForDisplay * totalCardsSoldForDisplay;
  const effectiveRtpPercentageForDisplay = totalCardsSoldForDisplay <= 4 ? 100 : (rtpPercentage ?? 60);
  const profitShown = Math.round(totalCollectedAmountForDisplay * (100 - effectiveRtpPercentageForDisplay) / 100);

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
    
  }, [route.params]);

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

  // Game initialization with delay
  useEffect(() => {
    if (!gameStarted) {
      setGameStarted(true);
      
      // Play game start sound
      if (selectedVoice) {
        audioManager.setVoice(selectedVoice);
        audioManager.playGameStartSound();
      }
      
      // Add 3 second delay before first number
      setTimeout(() => {
        setInitialDelayComplete(true);
      }, 3000);
    }
  }, [selectedVoice, gameStarted]);

  // Create game report when params are loaded and game has started
  useEffect(() => {
    // Only create report after game is started and params are loaded (selectedCardNumbers > 0)
    if (gameStarted && selectedCardNumbers.length > 0 && !gameStartReportCreated) {
      createGameStartReport();
    }
  }, [gameStarted, selectedCardNumbers, gameStartReportCreated]);

  // Create game report when game starts with complete data
  const createGameStartReport = async () => {
    if (gameStartReportCreated) return;
    
    try {
      const totalCardsSold = selectedCardNumbers.length;
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
        gameMode: 'multi_player'
      });
      
      setGameReportId(reportId); // Store the ID for later updates
      setGameStartReportCreated(true);

      // Create sync report immediately at game start
      console.log('🎮 GAME STARTED - Creating sync report at start');
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
      console.error('❌ Error creating complete game start report:', error);
    }
  };

  useEffect(() => {
    // Only set up automatic timer if in automatic mode and initial delay is complete
    if (numberCallingMode === 'manual' || !initialDelayComplete) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current as any);
        intervalRef.current = null;
      }
      return;
    }
    
    // Automatic mode: initial and every 10s draw
    if (paused) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current as any);
        intervalRef.current = null;
      }
      return;
    }
    drawNext();
    const duration = gameDuration || 10;
    intervalRef.current = setInterval(drawNext, duration * 1000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current as any);
    };
  }, [paused, numberCallingMode, gameDuration, initialDelayComplete]);

  // Initial number draw for manual mode
  useEffect(() => {
    if (numberCallingMode === 'manual' && calledNumbers.length === 0 && initialDelayComplete) {
      drawNext();
    }
  }, [numberCallingMode, initialDelayComplete]);

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
      
        // Queue audio for the drawn number to prevent overlap
        if (selectedVoice) {
          audioManager.setVoice(selectedVoice);
        }
        audioQueue.enqueue(drawn.letter, drawn.number);
      
      // Bounce animation
      ballBounce.value = 0;
      ballBounce.value = withTiming(1, { duration: 300 }, () => {
        ballBounce.value = withTiming(0, { duration: 300 });
      });
      
      ballPulse.value = 0;
      ballPulse.value = withTiming(1, { duration: 600 });
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
    const totalCardsSold = selectedCardNumbers.length;
    const effectiveMedebAmount = gameMedebAmount > 0 ? gameMedebAmount : (medebAmount ?? 0);
    const totalCollectedAmount = effectiveMedebAmount * totalCardsSold;
    const patternDisplayName = getPatternDisplayName(patternCategory, selectedPattern, classicLinesTarget);
    
    // Update the existing start report with completion data (only if not already done and report exists)
    console.log('🏁 GAME ENDED - Processing report...');
    
    if (!reportsCreated) {
      if (gameReportId) {
      try {
        const gameId = `game_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        // Apply RTP only if more than 4 cards/players, otherwise 100% payout
        const effectiveRtpPercentage = totalCardsSold <= 4 ? 100 : (rtpPercentage ?? 60);
        const payout = bingoFound ? (totalCollectedAmount * effectiveRtpPercentage / 100) : 0;
        
        // Update the existing game report with completion data
        console.log('🎮 Updating existing game report with COMPLETION data using ReportStorageManager');
        const userId = useAuthStore.getState().getUserId();
        console.log('🎮 Game COMPLETION update data:', {
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
        
        console.log('✅ Existing game report UPDATED with completion data successfully');

        // Add report to sync store for backend synchronization
        addReport({
          id: generateReportId(),
          numberOfGames: 1,
          numberOfCards: totalCardsSold,
          totalPayin: totalCollectedAmount,
          totalPayout: payout,
          balance: totalCollectedAmount - payout
        });

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
          }
        }

        // Mark reports as created
        setReportsCreated(true);
      } catch (error) {
        console.error('❌ Error saving game report to backend:', error);
      }
      } else {
        console.error('❌ NO GAME REPORT ID - Report will not be created!');
        console.log('🚨 This means createGameStartReport() was not called or failed');
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

  const validateBingoCallTiming = (
    gridNumbers: (number | null)[][],
    matched: boolean[][],
    calledNumbers: DrawnNumber[],
    allowedLateCalls: number | 'off'
  ) => {
    // If timing validation is disabled, always allow
    if (allowedLateCalls === 'off') {
      return { isValid: true, errorMessage: '' };
    }

    // Find when the winning pattern was first achieved
    let winningNumberIndex = -1;
    const tempMatched: boolean[][] = Array(5).fill(null).map(() => Array(5).fill(false));
    
    // Set center as always matched (free space)
    tempMatched[2][2] = true;
    
    for (let callIndex = 0; callIndex < calledNumbers.length; callIndex++) {
      const calledNumber = calledNumbers[callIndex];
      
      // Update matched grid with this called number
      for (let r = 0; r < 5; r++) {
        for (let c = 0; c < 5; c++) {
          if (r === 2 && c === 2) continue; // skip center
          const num = gridNumbers[r][c];
          if (num === calledNumber.number) {
            // Verify letter matches
            let expectedLetter: BingoLetter = 'B';
            if (num >= 1 && num <= 15) expectedLetter = 'B';
            else if (num <= 30) expectedLetter = 'I';
            else if (num <= 45) expectedLetter = 'N';
            else if (num <= 60) expectedLetter = 'G';
            else expectedLetter = 'O';
            
            if (calledNumber.letter === expectedLetter) {
              tempMatched[r][c] = true;
            }
          }
        }
      }
      
      // Check if pattern is achieved at this point
      const winResult = evaluateGridWinWithPattern(tempMatched, {
        patternCategory,
        selectedPattern,
        classicLinesTarget: classicLinesTarget || 1,
        classicSelectedLineTypes: classicSelectedLineTypes || [],
      });
      
      if (winResult.won) {
        winningNumberIndex = callIndex;
        break;
      }
    }
    
    if (winningNumberIndex === -1) {
      return { isValid: false, errorMessage: 'Pattern not achieved yet' };
    }
    
    const currentCallIndex = calledNumbers.length - 1;
    const ballsAfterWinning = currentCallIndex - winningNumberIndex;
    
    if (ballsAfterWinning > allowedLateCalls) {
      return {
        isValid: false,
        errorMessage: `Too late! You can only call bingo within ${allowedLateCalls} ball${allowedLateCalls !== 1 ? 's' : ''} after your winning number. Your pattern was completed ${ballsAfterWinning} ball${ballsAfterWinning !== 1 ? 's' : ''} ago.`
      };
    }
    
    return { isValid: true, errorMessage: '' };
  };

  const openCheck = (playerIndex?: number) => {
    // Play check cartela sound
    playCheckSound();
    
    setCheckMessage(null);
    setCheckingPlayerIndex(playerIndex ?? null);
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
    
    // Check timing validation for late bingo calls
    if (winResult.won) {
      const timingValidation = validateBingoCallTiming(gridNumbers, matched, calledNumbers, allowedLateCalls || 'off');
      
      if (!timingValidation.isValid) {
        setPreviewWon(false);
        setPreviewError(timingValidation.errorMessage);
        setCheckMessage(timingValidation.errorMessage);
        return;
      }
      
      setCheckMessage('Bingo! This card meets the winning pattern.');
      
      // Play winner audio sequence
      if (selectedVoice) {
        NumberAnnouncementService.announceWinnerCartela(cardIndex, selectedVoice);
      } else {
      }
      
      // Handle bingo celebration
      setShowConfetti(true);
      setBingoFound(true);
      setPaused(true);
      
      // Hide confetti after 3 seconds
      setTimeout(() => {
        setShowConfetti(false);
      }, 3000);
    } else {
      setCheckMessage('Not yet. This card does not meet the current winning pattern.');
      
      // Play no-winner audio
      if (true) {
        NumberAnnouncementService.announceNoWinner(selectedVoice);
      } else {
      }
    }
  };

  const { width, height: screenHeight } = useWindowDimensions();
  const [isLandscape, setIsLandscape] = useState(false);
  const recent = useMemo(() => {
    if (calledNumbers.length <= 1) return [];
    return calledNumbers.slice(-4, -1).reverse(); // Get 3 previous numbers, excluding current
  }, [calledNumbers]);
  const letters: {value: BingoLetter, color: string}[] = [
    {value:'B', color:'rgb(0, 86, 177)'}, 
    {value:'I', color:'rgba(207, 181, 32, 0.95)'}, 
    {value:'N', color:'rgb(255, 20, 149)'}, 
    {value:'G', color:'rgb(50, 205, 50)'}, 
    {value:'O', color:'rgb(220, 20, 60)'}
  ];
  
  const renderLetterBox = (letter: {value: BingoLetter, color: string}, horizontal: boolean, isPortrait: boolean) => {
    const isActive = current?.letter === letter.value;
    return (
      <View
        key={letter.value}
        style={[
          styles.letterHeaderBox,
          horizontal ? styles.letterBoxHorizontal : undefined,
          {
            borderColor: letter.color,
            backgroundColor: isActive ? letter.color : 'transparent',
            transform: isPortrait ? [] : [{ rotate: '-90deg' }, { scaleX: -1 }],
            shadowColor: isActive ? letter.color : 'transparent',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 8,
            elevation: 6,
          },
        ]}
      >
        <Text style={[
          styles.letterText, 
          { 
            color: isActive ? '#fff' : letter.color,
            textShadowColor: isActive ? 'rgba(0,0,0,0.3)' : 'transparent',
            textShadowOffset: { width: 1, height: 1 }, 
            textShadowRadius: 2 
          }
        ]}>
          {letter.value}
        </Text>
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
      <View style={[styles.calledCell]}>
        <Text style={styles.calledCellText}>{value}</Text>
      </View>
    );
  };

  // Play pause/resume sounds using audioManager
  const playPauseSound = () => {
    audioManager.announceGamePause();
  };

  const playResumeSound = () => {
    audioManager.announceGameResume();
  };


  // Play check cartela sound using audioManager
  const playCheckSound = () => {
    audioManager.announceCheckWinner();
  };


  const renderLettersColumns = (horizontal: boolean, isPortrait = true) => {
    const letterRanges: Record<BingoLetter, [number, number]> = { B: [1, 15], I: [16, 30], N: [31, 45], G: [46, 60], O: [61, 75] };
    
    // Calculate appropriate cell width based on orientation
    const cellWidth = !isPortrait ? width / 8 - 7 : screenHeight / 15 - 15;

    return (
      <View style={[
        horizontal ? styles.lettersColumnsRow : styles.lettersColumnsRow, 
        { 
          marginTop: isPortrait ? 10 : 10,
          flex: !isPortrait ? 0 : 1,
          width: !isPortrait ? 'auto' : '90%',
          justifyContent: !isPortrait ? 'flex-start' : 'space-evenly',
          paddingHorizontal: !isPortrait ? 0 : 5,
          transform: isPortrait ? [] : [ { scaleX: -1 }],
        }
      ]}>
        {letters.map((l) => {
          const [min, max] = letterRanges[l.value];
          const calledNumbersForLetter = groupedByLetter[l.value];

          return (
            <View key={l.value} style={[
              styles.letterColumn,
              { 
                flex: !isPortrait ? 0 : 1,
                alignItems: 'center',
                marginHorizontal: !isPortrait ? -5 : 0
              }
            ]}>
              <View style={{marginBottom: 0,}}>
                           {renderLetterBox(l, horizontal, isPortrait)}
   
              </View>
              <View style={styles.letterNumbersScroll} >
                {Array.from({ length: max - min + 1 }, (_, i) => {
                  const num = min + i;
                  const isCalled = calledNumbersForLetter.includes(num);
                  const isNew = current?.letter === l.value && current?.number === num;

                  return (
                    <View
                      key={`${l.value}-${num}`}
                      style={[
                        styles.calledCell,
                        {
                          backgroundColor: isCalled ? l.color : theme.colors.surface,
                          borderColor: isCalled ? l.color : theme.colors.border,
                          width: cellWidth,       
                          marginVertical: isPortrait ? 2 : 2,
                          marginHorizontal: isPortrait ? 1 : 0,
                        }
                      ]}
                    >
                      <Text style={[
                        styles.calledCellText,
                        { color: isCalled ? '#fff' : theme.colors.text },
                        { transform: isPortrait ? [] : [{ rotate: '-90deg' }, { scaleX: -1 }] }
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
                  {/* End Game Button with Close Icon */}
                  <EndGameButton onPress={endGame} size={23} style={{borderWidth: 0}} />
                  
                  
                  {/* Orientation Toggle Button */}
                  <TouchableOpacity 
                    onPress={() => setIsLandscape(true)}
                    style={[
                      styles.orientationBtn, 
                      { 
                        borderColor: theme.colors.primary 
                      }
                    ]}
                  >
                    <Text style={[
                      styles.orientationBtnText, 
                      { color: theme.colors.text }
                    ]}>{forcedOrientation === 'portrait' ? 'L' : 'P'}</Text>
                  </TouchableOpacity>
                </View>

                <View style={{ flex: 1, marginRight: 10 }}>{renderLettersColumns(true)}</View>
              </View>

              <View style={styles.portraitMain}>
              <Text style={[styles.counter, { color: theme.colors.text, textAlign:'right' }]}>{calledNumbers.length}/75</Text>

                <View style={styles.verticalGroupsContainer}>

                  {/* Group 1: Ball and Recent Numbers */}
                  <View style={styles.groupContainer}>
                    <View style={[styles.ballArea, { height: height * 0.22 }]}>
                      <Ball
                        current={current}
                        recent={recent}
                        isAnimating={isAnimating}
                        animationNumber={animationNumber}
                        paused={paused}
                        numberCallingMode={numberCallingMode || 'automatic'}
                        ballAnim={ballAnim}
                        drawNext={drawNext}
                        showRecent={true}
                        showManualHint={true}
                        isPortrait={true}
                        
                      />
                    </View>
                  </View>

                  {/* Group 2: Derash and Medeb Info */}
                  <View style={styles.groupContainer}>
                    <DerashMedebInfo
                      derashShown={profitShown}
                      gameMedebAmount={gameMedebAmount}
                      medebAmount={medebAmount ?? 0}
                      numPlayers={numPlayers}
                      totalCollectedAmount={totalCollectedAmountForDisplay}
                      isLandscape={false}
                      showPlayers={true}
                    />
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
                      <Text style={[styles.patternTitle, { color: theme.colors.text }]}>{getPatternDisplayName(patternCategory, selectedPattern, classicLinesTarget)}</Text>
                      <View style={styles.patternHeaderRow}>
                        {letters.map((l, index) => {
                          const ranges: Record<BingoLetter, [number, number]> = { B: [1, 15], I: [16, 30], N: [31, 45], G: [46, 60], O: [61, 75] };
                          const [min, max] = ranges[l.value];
                          const calledInRange = calledNumbers.filter(n => n.letter === l.value).length;
                          const isComplete = calledInRange === (max - min + 1);
                          
                          return (
                            <View key={`ph-${l.value}`} style={[
                              styles.patternLetterBox, 
                              { 
                                borderColor: isComplete ? l.color : theme.colors.border,
                                backgroundColor: isComplete ? l.color : 'rgba(255, 255, 255, 0.1)'
                              }
                            ]}>
                              <Text style={[
                                styles.patternHeaderLetter, 
                                { color: isComplete ? '#fff' : theme.colors.text }
                              ]}>{l.value}</Text>
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
            <View style={[styles.bottomActions, {paddingHorizontal: 20, gap: 10, flexDirection: isLandscape ? 'column' : 'row'}]}>
              <View style={{ flexDirection: 'row', gap: 10, flex: isLandscape ? 0 : 1 }}>
                <PlayPauseButton
                  paused={paused}
                  bingoFound={bingoFound}
                  onPress={() => {
                    if (bingoFound) {
                      setBingoFound(false);
                      setPaused(false);
                      playResumeSound();
                    } else {
                      const willBePaused = !paused;
                      setPaused(willBePaused);
                      if (willBePaused) {
                        playPauseSound();
                      } else {
                        playResumeSound();
                      }
                    }
                  }}
                  style={{ width: 50 }}
                />
                {!isLandscape && (
                  <CheckButton
                    onPress={() => openCheck()}
                    style={{ flex: 1 }}
                  />
                )}
              </View>
              
              {isLandscape && (
                <CheckButton
                  onPress={() => openCheck()}
                  style={{ width: '100%' }}
                />
              )}
              
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
          // <View style={{flex: 1, backgroundColor: 'red'}}>
          //   <Text>Landscape Game</Text>
          //   <TouchableOpacity onPress={() => setIsLandscape(true)}>
          //     <Text>Switch to Landscape</Text>
          //   </TouchableOpacity>
          // </View>
          <LandscapeGameUI
            current={current}
            calledNumbers={calledNumbers}
            recent={recent}
            isAnimating={isAnimating}
            animationNumber={animationNumber}
            paused={paused}
            bingoFound={bingoFound}
            numPlayers={numPlayers}
            gameMedebAmount={gameMedebAmount}
            medebAmount={medebAmount ?? 0}
            derashShown={ profitShown.toString()}
            totalCollectedAmount={totalCollectedAmountForDisplay}
            singleSelectedNumbers={singleSelectedNumbers}
            patternCategory={patternCategory}
            selectedPattern={selectedPattern!}
            classicLinesTarget={classicLinesTarget!}
            numberCallingMode={numberCallingMode!}
            forcedOrientation={forcedOrientation}
            ballAnim={ballAnim}
            endGame={endGame}
            setForcedOrientation={setForcedOrientation}
            drawNext={drawNext}
            setPaused={setPaused}
            setBingoFound={setBingoFound}
            openCheck={openCheck}
            renderLettersColumns={renderLettersColumns as any}
            getPatternDisplayName={getPatternDisplayName}
            setIsLandscape = {setIsLandscape}
          />
        )}
        {/* Check Modal */}
        <CheckModal
          visible={checkVisible}
          onClose={() => {
            setCheckVisible(false);
            setCheckingPlayerIndex(null);
          }}
          onSubmit={submitCheck}
          canCheck={canCheck}
          previewGridNumbers={previewGridNumbers}
          previewMatched={previewMatched}
          previewWon={previewWon}
          previewError={previewError}
          checkMessage={checkMessage}
          winningPattern={winningPattern}
          isLandscape={isLandscape}
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
  container: { flex: 1, paddingTop: 0, marginTop: 0 },
  safeArea: { flex: 1, },
  portrait: { flex: 1, flexDirection: 'row' },
  landscape: { flex: 1, flexDirection: 'column' },
  leftRail: { width: 60, alignItems: 'center', paddingVertical: 12 },
  letterHeaderBox: { 
    width: width / 8 - 7, 
    minHeight: width / 7 - 12,
    borderRadius: 12, 
    marginVertical: 6, 
    justifyContent: 'center', 
    alignItems: 'center', 
    borderWidth: 2,
    marginHorizontal: 4,
    minWidth: 40,
    
    
  },
  letterBoxHorizontal: { marginHorizontal: 6, marginVertical: 0 },
  letterText: { fontWeight: '800', fontSize: 20 },
  separatorLine: {
    height: 2,
    width: '80%',
    marginVertical: 4,
    borderRadius: 1,
  },
  centerArea: { flex: 1, paddingHorizontal: 12, paddingVertical: 8 },
  counter: { fontSize: 14, fontWeight: '700', marginTop: 8 },
  ballArea: { alignItems: 'center', paddingVertical: 6, paddingRight: 15 },
  ballOuter: { width: 140, height: 140, borderRadius: 70, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff', shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 8 },
  ballInner: { width: 100, height: 100, borderRadius: 50, borderWidth: 8, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' },
  ballNumber: { fontSize: 40, fontWeight: '900' },
  // compact sizes for portrait
  ballOuterSm: { width: 120, height: 120, borderRadius: 60, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff', shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 8 },
  ballInnerSm: { width: 86, height: 86, borderRadius: 43, borderWidth: 7, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' },
  ballNumberSm: { fontSize: 34, fontWeight: '900' },
  ballLetterSm: { fontSize: 16, fontWeight: '600', position: 'absolute', top: 8 },
  recentRow: { flexDirection: 'row', marginTop: 6 },
  recentCircle: { width: 34, height: 34, borderRadius: 17, borderWidth: 2, marginHorizontal: 6, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' },
  recentCircleSm: { width: 28, height: 28, borderRadius: 14, borderWidth: 2, marginHorizontal: 4, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' },
  recentText: { fontWeight: '700' },
  recentTextSm: { fontWeight: '700', fontSize: 12 },
  infoRow: { marginTop: 16, gap: 30, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',  },
  infoText: { fontSize: 14, fontWeight: '600', marginBottom: 4 },
  rightRail: {flexDirection:'row', gap: 10, justifyContent: 'center', alignItems: 'center' },
  actionBtn: { width: 110, paddingVertical: 12, borderRadius: 10, alignItems: 'center', marginVertical: 8 },
  actionText: { fontWeight: '700' },
  // Portrait-specific pieces
  portraitRoot: { flex: 1, paddingHorizontal: 12, flexDirection: 'row', },
  portraitHeaderRow: { justifyContent: 'space-between', marginTop: 8 },
  bingoRow: { flexDirection: 'row', alignItems: 'center' },
  portraitMain: { flex: 1, marginTop: 45, marginRight: 15, alignItems: 'center' },
  verticalGroupsContainer: { flex: 1, flexDirection: 'column', alignItems: 'center', paddingHorizontal: 10, marginTop: 0 },
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
  patternTitle: { fontSize: 14, fontWeight: '700', marginBottom: 2, width:'100%', alignItems:'flex-end' },
  bottomActions: { flexDirection: 'row', justifyContent: 'space-around', paddingVertical: 5, },
  // Called numbers under letters
  lettersColumnsRow: { flexDirection: 'row', alignItems: 'flex-start' },
  letterColumn: { marginRight: -2, alignItems: 'center', justifyContent: 'flex-start' },
  calledCell: { height: width / 8 - 12, marginRight: 0, borderRadius: 6, backgroundColor: '#e5e7eb', justifyContent: 'center', alignItems: 'center',  paddingHorizontal: 0, },
  calledCellText: { fontWeight: '700' },
  // Pattern header letters
  patternHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', width: 103, marginBottom: 2 },
  patternHeaderRowLandscape: { flexDirection: 'row', justifyContent: 'space-between', width: 160, marginBottom: 6 },
  patternHeaderLetter: { fontSize: 12, fontWeight: '700' },
  // Pattern animation container styles
  patternAnimationContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  patternNameText: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
    textAlign: 'center',
  },
  patternWithStar: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  starContainer: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -12 }, { translateY: -12 }],
    zIndex: 1,
  },
  starIcon: {
    fontSize: 24,
    textAlign: 'center',
  },
  patternLetterBox: {
    width: 18,
    height: 18,
    borderWidth: 1,
    borderRadius: 3,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  // called numbers scroll
  letterNumbersScroll: { maxHeight: 180, paddingVertical: 2 },
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
  // 1000609458961
  // Group container styles
  groupContainer: {
    // backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 12,
    marginVertical: 6,
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
  derashHighlightBoxLandscape: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 4,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  derashLabelLandscape: {
    fontSize: 16,
    fontWeight: '800',
    color: '#fff',
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
  manualHint: {
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
    marginTop: 4,
  },
  closeBtn: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
    
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
    if (achieved < (opts.classicLinesTarget || 1) && allowed.has('four_corners') && fourCorners(grid)) {
      achieved++;
      winningPattern[0][0] = winningPattern[0][4] = winningPattern[4][0] = winningPattern[4][4] = true;
    }
    if (achieved < (opts.classicLinesTarget || 1) && allowed.has('small_corners') && smallCorners(grid)) {
      achieved++;
      winningPattern[1][1] = winningPattern[1][3] = winningPattern[3][1] = winningPattern[3][3] = true;
    }
    if (achieved < (opts.classicLinesTarget || 1) && allowed.has('plus') && plusSign(grid)) {
      achieved++;
      for (let i = 0; i < 5; i++) {
        winningPattern[2][i] = true;
        winningPattern[i][2] = true;
      }
    }
    if (achieved < (opts.classicLinesTarget || 1) && allowed.has('x') && xShape(grid)) {
      achieved++;
      for (let i = 0; i < 5; i++) {
        winningPattern[i][i] = true;
        winningPattern[i][4 - i] = true;
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
    case 't_shape':
      for (let i = 0; i < 5; i++) {
        pattern[0][i] = true; // top row
        pattern[i][2] = true; // middle column
      }
      break;
    case 'u_shape':
      for (let i = 0; i < 5; i++) {
        pattern[i][0] = true; // left column
        pattern[i][4] = true; // right column
        pattern[4][i] = true; // bottom row
      }
      break;
    case 'l_shape':
      for (let i = 0; i < 5; i++) {
        pattern[i][0] = true; // left column
        pattern[4][i] = true; // bottom row
      }
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
    case 'diamond':
      pattern[0][2] = true;
      pattern[1][1] = pattern[1][3] = true;
      pattern[2][0] = pattern[2][2] = pattern[2][4] = true;
      pattern[3][1] = pattern[3][3] = true;
      pattern[4][2] = true;
      break;
    case 'one_line':
    case 'two_lines':
    case 'three_lines':
      // Show horizontal lines for these patterns
      const lineCount = opts.selectedPattern === 'one_line' ? 1 : opts.selectedPattern === 'two_lines' ? 2 : 3;
      for (let r = 0; r < lineCount; r++) {
        for (let c = 0; c < 5; c++) {
          pattern[r][c] = true;
        }
      }
      break;
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
    if (allowed.has('small_corners') && smallCorners(grid)) achieved += 1;
    if (allowed.has('plus') && plusSign(grid)) achieved += 1;
    if (allowed.has('x') && xShape(grid)) achieved += 1;
    return achieved >= (opts.classicLinesTarget || 1);
  }
  // Modern
  switch (opts.selectedPattern) {
    case 'full_house': return grid.every(r => r.every(c => c));
    case 't_shape': return tShape(grid);
    case 'u_shape': return uShape(grid);
    case 'l_shape': return lShape(grid);
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
function smallCorners(grid: boolean[][]): boolean { return grid[1][1] && grid[1][3] && grid[3][1] && grid[3][3]; }
function plusSign(grid: boolean[][]): boolean { return grid[2].every(v => v) && grid.every(r => r[2]); }
function xShape(grid: boolean[][]): boolean { return grid.every((row, i) => row[i]) && grid.every((row, i) => row[4 - i]); }
function tShape(grid: boolean[][]): boolean { return grid[0].every(v => v) && grid.every(r => r[2]); }
function uShape(grid: boolean[][]): boolean { return grid.every(r => r[0]) && grid.every(r => r[4]) && grid[4].every(v => v); }
function lShape(grid: boolean[][]): boolean { return grid.every(r => r[0]) && grid[4].every(v => v); }
function diamond(grid: boolean[][]): boolean { const pts = [[0, 2], [1, 1], [1, 3], [2, 0], [2, 2], [2, 4], [3, 1], [3, 3], [4, 2]]; return pts.every(([r, c]) => grid[r][c]); }