import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  BackHandler,
  Dimensions,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  Image,
  Animated,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
} from 'react-native';

import { styles as globalStyles } from './number-list-style';
import NoCartelaSelected from './modals/no-catela-selected';
import SelectedNumbersModal from './modals/selected-numbers';
import {useNavigation, useFocusEffect } from '@react-navigation/native';
import LinearGradient from 'react-native-linear-gradient';
import { Check, GroupIcon, LucideGroup, PersonStanding, X, ArrowLeft, Users, User, Eye } from 'lucide-react-native';
import { useTheme } from '../../components/ui/ThemeProvider';
import { useSettingsStore } from '../../store/settingsStore';
import { audioManager } from '../../utils/audioManager';
import { getCardTypeInfo, getDefaultLimitForCardType } from '../../utils/cardTypeManager';
import { useAuthStore } from '../../store/authStore';
import { useGameReportStore } from '../../store/gameReportStore';
import { transactionApiService } from '../../api/services/transaction';
import { Alert } from 'react-native';
import { InsufficientCoinsModal } from '../../components/ui/InsufficientCoinsModal';
import { LoadingOverlay } from '../../components/ui/LoadingOverlay';
import { ReportStorageManager } from '../../utils/reportStorage';
import { ScreenNames } from '../../constants/ScreenNames';

const { width } = Dimensions.get('window');

const PlayerCartelaSelectionScreen = () => {
  const { theme } = useTheme();
  const navigation = useNavigation();
  const { userCoins, deductCoins, user, getUserId } = useAuthStore();
  const { createInitialGameReport } = useGameReportStore();

  // Hide tab bar when this screen is focused and reset selections
  useFocusEffect(
    React.useCallback(() => {
      const parent = navigation.getParent();
      if (parent) {
        parent.setOptions({
          tabBarStyle: { display: 'none' }
        });
      }

      // Reset all selections when screen is focused (coming back from game)
      setGroupSelectedNumbers(new Set());
      setSingleSelectedNumbers(new Set());
      setSelectionMode('group'); // Reset to default mode
      console.log('🔄 Screen focused - resetting all selections');

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
  const { customCardTypes, selectedCardTypeName, rtpPercentage, lastEnteredAmount, setLastEnteredAmount, worldBingoCardsLimit, getMaxCardsForSelectedType, setWorldBingoCardsLimit, selectedVoice, forceRefreshWorldBingoCards, resetLimitToMax } = useSettingsStore();
  console.log('custom card ====================================');
  console.log(customCardTypes);
  console.log('====================================');
  const [search, setSearch] = useState('');
  const [selectedArray, setSelectedArray] = useState<number[][]>([]);
  const [filteredArray, setFilteredArray] = useState<{ id: number; data: number[] }[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [scrollPosition, setScrollPosition] = useState(0);
  const [isScrolling, setIsScrolling] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [showPagination, setShowPagination] = useState(false);
  const [currentPageBottom, setCurrentPageBottom] = useState(1);
  const [showBottomPagination, setShowBottomPagination] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const paginationAnimValue = useRef(new Animated.Value(1)).current;
  const [groupSelectedNumbers, setGroupSelectedNumbers] = useState<Set<number | string>>(new Set());
  const [singleSelectedNumbers, setSingleSelectedNumbers] = useState<Set<number | string>>(new Set());
  const [selectionMode, setSelectionMode] = useState<'group' | 'single'>('group');
  
  // Get current active selected numbers based on mode
  const selectedNumbers = selectionMode === 'group' ? groupSelectedNumbers : singleSelectedNumbers;
  const setSelectedNumbers = selectionMode === 'group' ? setGroupSelectedNumbers : setSingleSelectedNumbers;
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [noCartelaModalVisible, setNoCartelaModalVisible] = useState(false);
  const [medebAmount, setMedebAmount] = useState<string>('');
  const [insufficientCoinsModalVisible, setInsufficientCoinsModalVisible] = useState(false);
  const [requiredCoins, setRequiredCoins] = useState(0);
  const [cardTypeInfo, setCardTypeInfo] = useState(() => getCardTypeInfo(selectedCardTypeName, customCardTypes));
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const keyboardAnimatedValue = useRef(new Animated.Value(0)).current;

  console.log('Group Selected Numbers:', Array.from(groupSelectedNumbers));
  console.log('Single Selected Numbers:', Array.from(singleSelectedNumbers));
  console.log('Current Selection Mode:', selectionMode);

  // Update card limit when card type changes
  useEffect(() => {
    const currentCardTypeInfo = getCardTypeInfo(selectedCardTypeName, customCardTypes);
    const currentMaxCards = currentCardTypeInfo.maxLimit;
    const defaultLimit = getDefaultLimitForCardType(selectedCardTypeName);
    
    console.log('🔄 Card type changed:', {
      selectedCardTypeName,
      currentMaxCards,
      defaultLimit,
      currentLimit: worldBingoCardsLimit
    });

    // If current limit exceeds what's available for this card type, reset it
    if (worldBingoCardsLimit > currentMaxCards) {
      console.log('🔧 Resetting limit from', worldBingoCardsLimit, 'to', Math.min(defaultLimit, currentMaxCards));
      setWorldBingoCardsLimit(Math.min(defaultLimit, currentMaxCards));
    }
  }, [selectedCardTypeName, customCardTypes]);

  const handleNumberSelect = useCallback((num: any) => {
    // Check if number is disabled (selected in other mode)
    const isDisabledInGroup = selectionMode === 'single' && groupSelectedNumbers.has(num);
    const isDisabledInSingle = selectionMode === 'group' && singleSelectedNumbers.has(num);
    
    if (isDisabledInGroup || isDisabledInSingle) {
      return; // Do nothing if disabled
    }
    
    const currentSet = selectionMode === 'group' ? groupSelectedNumbers : singleSelectedNumbers;
    const setCurrentSet = selectionMode === 'group' ? setGroupSelectedNumbers : setSingleSelectedNumbers;
    
    setCurrentSet((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(num)) {
        newSet.delete(num);
      } else if (selectionMode === 'single' && newSet.size >= 4) {
        // Limit single player to max 4 cards
        console.log('Single player limited to 4 cards maximum');
        return prev;
      } else {
        newSet.add(num);
      }
      console.log('Updated Selection:', Array.from(newSet));
      return newSet;
    });
  }, [selectionMode, groupSelectedNumbers, singleSelectedNumbers]);

  // Populate selectedArray from settings with correct card type
  useEffect(() => {
    const loadCards = async () => {
      setIsLoading(true);
      console.log('=== LOADING CARDS DYNAMICALLY ===');
      console.log('selectedCardTypeName:', selectedCardTypeName);
      console.log('worldBingoCardsLimit:', worldBingoCardsLimit);
      
      // Get the correct card type info
      const currentCardTypeInfo = getCardTypeInfo(selectedCardTypeName, customCardTypes);
      setCardTypeInfo(currentCardTypeInfo);
      
      console.log('🃏 Card Type Info:', {
        name: currentCardTypeInfo.name,
        maxLimit: currentCardTypeInfo.maxLimit,
        cardsLength: currentCardTypeInfo.cards.length,
        requestedLimit: worldBingoCardsLimit
      });
      
      // Apply the limit
      const limitToUse = Math.min(worldBingoCardsLimit, currentCardTypeInfo.maxLimit);
      const limitedCards = currentCardTypeInfo.cards.slice(0, limitToUse);
      
      setTimeout(() => {
        setSelectedArray(limitedCards);
        setIsLoading(false);
        console.log('🎯 DYNAMIC LOAD RESULT:');
        console.log(`  - Card Type: ${currentCardTypeInfo.name}`);
        console.log(`  - Setting selectedArray with ${limitedCards.length} cards`);
        console.log(`  - Used limit: ${limitToUse} (requested: ${worldBingoCardsLimit}, max available: ${currentCardTypeInfo.maxLimit})`);
        console.log('  - Cards will be numbered 1 through', limitedCards.length);
      }, 0);
      
      // Refresh store in background if needed
      if (customCardTypes.length === 0 || 
          !customCardTypes.find(c => c.name === 'default') ||
          customCardTypes.find(c => c.name === 'default')?.cards?.length < 100) {
        console.log('🔄 Background: Refreshing store data for future use');
        forceRefreshWorldBingoCards();
      }
    };
    
    loadCards();
  }, [customCardTypes, worldBingoCardsLimit, selectedCardTypeName, setWorldBingoCardsLimit, forceRefreshWorldBingoCards]);

  // Pre-fill medeb amount with last entered amount
  useEffect(() => {
    if (lastEnteredAmount && lastEnteredAmount > 0) {
      setMedebAmount(lastEnteredAmount.toString());
    }
  }, [lastEnteredAmount]);

  useEffect(() => {
    const handleBackPress = () => {
      // Navigate back to MainTabs instead of exiting app
      navigation.getParent()?.navigate(ScreenNames.MAIN_TABS as never);
      return true;
    };
    const backHandler = BackHandler.addEventListener('hardwareBackPress', handleBackPress);
    
    return () => backHandler.remove();
  }, [navigation]);

  // Keyboard listeners
  useEffect(() => {
    const keyboardWillShow = (e: any) => {
      const newHeight = e.endCoordinates.height;
      // Adjust the offset to position slightly higher above keyboard
      const adjustedHeight = Platform.OS === 'ios' ? newHeight + 10 : newHeight;
      setKeyboardHeight(newHeight);
      setIsKeyboardVisible(true);
      Animated.timing(keyboardAnimatedValue, {
        toValue: adjustedHeight,
        duration: Platform.OS === 'ios' ? e.duration || 250 : 250,
        useNativeDriver: false,
      }).start();
    };

    const keyboardWillHide = () => {
      setKeyboardHeight(0);
      setIsKeyboardVisible(false);
      Animated.timing(keyboardAnimatedValue, {
        toValue: 0,
        duration: Platform.OS === 'ios' ? 250 : 250,
        useNativeDriver: false,
      }).start();
    };

    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const keyboardShowListener = Keyboard.addListener(showEvent, keyboardWillShow);
    const keyboardHideListener = Keyboard.addListener(hideEvent, keyboardWillHide);

    return () => {
      keyboardShowListener.remove();
      keyboardHideListener.remove();
    };
  }, []);

  useEffect(() => {
    console.log('🎨 FILTERING LOGIC:');
    console.log('  - selectedArray.length:', selectedArray.length);
    console.log('  - search query:', search);
    
    // Map each card (not individual numbers) for display
    const filtered = selectedArray
      .map((card, index) => ({ id: index + 1, data: card })) // Each item represents a card
      .filter((item) => {
        if (!search) return true; // Show all if no search
        return item.id.toString().includes(search); // Allow partial search
      });
    
    setFilteredArray(filtered);
    
    console.log('🎯 FILTERING RESULT:');
    console.log(`  - Filtered ${filtered.length} cards out of ${selectedArray.length} total cards`);
    console.log(`  - Search: "${search}"`);
    console.log('  - Showing first 10 cards:', filtered.slice(0, 10).map(item => item.id));
    if (selectedArray.length === 0) {
      console.log('⚠️  selectedArray is EMPTY - this is why no numbers are showing');
    }
  }, [selectedArray, search]);

  const getCurrentSelectedNumbers = useCallback(() => {
    return selectedNumbers;
  }, [selectedNumbers]);
  
  const getAllSelectedNumbers = useCallback(() => {
    return new Set([...groupSelectedNumbers, ...singleSelectedNumbers]);
  }, [groupSelectedNumbers, singleSelectedNumbers]);

  const getTotalSelectedCount = useCallback(() => {
    return getAllSelectedNumbers().size;
  }, [getAllSelectedNumbers]);

  const calculateDerashValue = useCallback(() => {
    const medeb = parseFloat(medebAmount) || 0;
    const totalSelections = getTotalSelectedCount();
    // Apply RTP only if more than 4 cards/players, otherwise 100% payout
    const effectiveRtpPercentage = totalSelections <= 4 ? 100 : rtpPercentage;
    const rtpDecimal = effectiveRtpPercentage / 100;
    const derash = Math.floor(medeb * totalSelections * rtpDecimal);
    console.log(`💰 Derash Calculation: ${totalSelections} cards - ${effectiveRtpPercentage}% RTP - Prize: ${derash} Birr`);
    return derash;
  }, [medebAmount, getTotalSelectedCount, rtpPercentage]);

  const handleBuyCoin = useCallback(() => {
    setInsufficientCoinsModalVisible(false);
    // Navigate to PaymentWebView screen (same as in ProfileScreen)
    navigation.navigate(ScreenNames.PAYMENT_WEBVIEW as never);
  }, [navigation]);

  const handleCloseInsufficientCoins = useCallback(() => {
    setInsufficientCoinsModalVisible(false);
  }, []);


  const handleStartPlay = useCallback(async () => {
    const totalSelected = getTotalSelectedCount();
    const medeb = parseFloat(medebAmount) || 0;
    
    // Validation
    if (totalSelected === 0) {
      setNoCartelaModalVisible(true);
      return;
    }
    
    if (medeb <= 0) {
      // Could show a specific error for invalid medeb
      setNoCartelaModalVisible(true);
      return;
    }

    // Calculate transaction amounts first (before loading)
    const total = medeb * totalSelected;
    const derashValue = calculateDerashValue();
    const houseAmount = total - derashValue; // Amount to deduct from coins
    
    console.log('💰 Transaction Calculation:', {
      medeb,
      totalSelected,
      total,
      rtpPercentage,
      derashValue,
      houseAmount,
      currentCoins: userCoins
    });

    // Check if user has enough coins BEFORE showing loading
    if (userCoins < houseAmount) {
      setRequiredCoins(houseAmount);
      setInsufficientCoinsModalVisible(true);
      return;
    }

    // Show loading overlay only after coin check passes
    setIsLoading(true);

    // Deduct coins
    const deductionSuccess = deductCoins(houseAmount);
    if (!deductionSuccess) {
      setIsLoading(false); // Reset loading state on failure
      Alert.alert(
        'Transaction Failed',
        'Failed to deduct coins. Please try again.',
        [{ text: 'OK' }]
      );
      return;
    }

    // Create transaction record
    try {
      const userId = getUserId();
      const gameId = `GAME_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      console.log('💳 DEBUG: getUserId() returned:', userId);
      console.log('💳 DEBUG: user object:', user);
      console.log('💳 Creating payin transaction:', {
        userId,
        gameId,
        amount: houseAmount,
        type: 'payin'
      });

      if (userId) {
        const result = await transactionApiService.createTransaction({
          userId: userId, // Keep as string to avoid parsing issues
          gameId,
          type: 'payin',
          amount: houseAmount,
          description: `Game start - ${totalSelected} cards @ ${medeb} Birr each (House: ${houseAmount.toFixed(0)} Birr, Prize Pool: ${derashValue.toFixed(0)} Birr)`
        });
        
        console.log('✅ Transaction created successfully:', result);
      } else {
        console.warn('⚠️ No userId found - transaction not created');
      }
    } catch (error) {
      console.error('❌ Failed to create transaction:', error);
      // Transaction failed, but we already deducted coins, so we continue
      // In a real app, you might want to refund the coins or handle this differently
    }

    // Report will be created when game ends with actual game data

    // Save the entered amount for future use
    setLastEnteredAmount(medeb);
    
    // Ensure audioManager has the current voice set
    console.log('Setting voice in audioManager:', selectedVoice);
    audioManager.setVoice(selectedVoice);
    
    const allUniqueNumbers = getAllSelectedNumbers();
    const finalDerashValue = calculateDerashValue();
    
    console.log('Starting game with:');
    console.log('All selections:', Array.from(allUniqueNumbers));
    console.log('Medeb amount:', medeb);
    console.log('Total selections:', totalSelected);
    console.log('Derash value:', finalDerashValue);
    console.log('Selected card type name:', selectedCardTypeName);
    console.log('Custom card types:', customCardTypes);
    console.log('Selection mode:', selectionMode);
    
    // Add delay for loading effect before navigating
    setTimeout(() => {
      setIsLoading(false);
      
      // Navigate to different screens based on selection mode
      if (selectionMode === 'single' && singleSelectedNumbers.size > 0) {
        // Navigate to SinglePlayerGameScreen for individual selections
        navigation.navigate(ScreenNames.SINGLE_PLAYER_GAME as never, {
          selectedCardNumbers: Array.from(allUniqueNumbers),
          singleSelectedNumbers: Array.from(singleSelectedNumbers),
          medebAmount: medeb,
          derashValue: finalDerashValue,
          totalSelections: totalSelected,
          selectedCardTypeName: selectedCardTypeName,
          customCardTypes: customCardTypes,
        } as any);
      } else {
        // Navigate to regular GameScreen for group selections
        navigation.navigate(ScreenNames.GAME_PLAY as never, {
          selectedCardNumbers: Array.from(allUniqueNumbers),
          groupSelectedNumbers: Array.from(groupSelectedNumbers),
          singleSelectedNumbers: Array.from(singleSelectedNumbers),
          selectionMode: selectionMode,
          medebAmount: medeb,
          derashValue: finalDerashValue,
          totalSelections: totalSelected,
          selectedCardTypeName: selectedCardTypeName,
          customCardTypes: customCardTypes,
        } as any);
      }
    }, 1500); // 1.5 second loading effect
  }, [getTotalSelectedCount, medebAmount, getAllSelectedNumbers, groupSelectedNumbers, singleSelectedNumbers, selectionMode, calculateDerashValue, navigation, selectedCardTypeName, customCardTypes, setLastEnteredAmount, userCoins, deductCoins, getUserId, rtpPercentage]);
  
  const gradientColors = ['rgba(0, 163, 141, 0.61)', 'rgba(0, 103, 221, 0.63)']

  const renderNumberItem = useCallback(
    ({ item }: { item: any}) => {
      const isSelected = selectedNumbers.has(item);
      const isDisabledInGroup = selectionMode === 'single' && groupSelectedNumbers.has(item);
      const isDisabledInSingle = selectionMode === 'group' && singleSelectedNumbers.has(item);
      const isDisabled = isDisabledInGroup || isDisabledInSingle;
      
      let backgroundColor = 'rgb(0, 42, 81)';
      if (isSelected) {
        backgroundColor = selectionMode === 'group' ? theme.colors.primary : '#FF9800'; // Primary for group, Orange for single
      }
      
      return (
        <TouchableOpacity 
          activeOpacity={isDisabled ? 1 : 0.7} 
          onPress={isDisabled ? undefined : () => handleNumberSelect(item)}
          disabled={isDisabled}
        >
          <LinearGradient
            colors={gradientColors}
            style={{ 
              padding: 1, 
              borderRadius: 8, 
              margin: 2,
              opacity: isDisabled ? 0.3 : 1
            }}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View
              style={[
                globalStyles.numberButton,
                { backgroundColor },
              ]}
            >
              <Text
                style={[
                  globalStyles.numberText,
                  { 
                    color: isSelected ? 'white' : (theme.colors.text || '#333333'),
                    fontSize: item.toString().length >= 4 ? 19 : 26,
                    fontWeight: 'bold'
                  },
                  isDisabled && { opacity: 0.5 },
                ]}
              >
                {item}
              </Text>
            </View>
          </LinearGradient>
        </TouchableOpacity>
      );
    },
    [handleNumberSelect, selectedNumbers, selectionMode, theme, groupSelectedNumbers, singleSelectedNumbers, gradientColors]
  );
  
  // Memoize the FlatList data to prevent unnecessary re-renders
  const memoizedFilteredArray = useMemo(() => filteredArray, [filteredArray]);
  
  // Memoize the card count display text
  const cardCountText = useMemo(() => {
    const total = selectedArray.length;
    const filteredTotal = filteredArray.length;
    
    if (filteredTotal > itemsPerPageBottom) {
      const startCard = ((currentPageBottom - 1) * itemsPerPageBottom) + 1;
      const endCard = Math.min(currentPageBottom * itemsPerPageBottom, filteredTotal);
      return `Showing cards ${startCard}-${endCard} of ${filteredTotal} (Total: ${total}, Limit: ${worldBingoCardsLimit})`;
    } else {
      return `Showing ${filteredTotal} of ${total} cards (Limit: ${worldBingoCardsLimit})`;
    }
  }, [isLoading, filteredArray.length, selectedArray.length, worldBingoCardsLimit, currentPageBottom, itemsPerPageBottom]);

  // Calculate pagination info
  const itemsPerPage = 25; // 5 columns x 5 rows visible at once (for scroll indicator)
  const itemsPerPageBottom = 100; // Items per page for bottom pagination
  const totalPages = Math.ceil(filteredArray.length / itemsPerPage);
  const totalPagesBottom = Math.ceil(filteredArray.length / itemsPerPageBottom);
  
  // Calculate paginated data for bottom pagination
  const paginatedData = useMemo(() => {
    const startIndex = (currentPageBottom - 1) * itemsPerPageBottom;
    const endIndex = startIndex + itemsPerPageBottom;
    return filteredArray.slice(startIndex, endIndex);
  }, [filteredArray, currentPageBottom, itemsPerPageBottom]);
  
  // Handle scroll events with swipe detection
  const handleScroll = useCallback((event: any) => {
    const { contentOffset, layoutMeasurement, contentSize } = event.nativeEvent;
    const scrollY = contentOffset.y;
    const viewHeight = layoutMeasurement.height;
    const contentHeight = contentSize.height;
    
    // Calculate current page based on scroll position
    const currentPageNum = Math.floor(scrollY / (viewHeight * 0.8)) + 1;
    setCurrentPage(Math.min(currentPageNum, totalPages));
    setScrollPosition(scrollY);
    
    // Check if scrolled to bottom (with small tolerance)
    const isAtBottom = scrollY + viewHeight >= contentHeight - 10;
    
    // Detect swipe direction for bottom pagination visibility
    const scrollDelta = scrollY - lastScrollY;
    if (Math.abs(scrollDelta) > 5) { // Only respond to significant scroll movements
      if (scrollDelta > 0) {
        // Scrolling down/swiping up - hide pagination
        setShowBottomPagination(false);
      } else if (!isAtBottom) {
        // Scrolling up/swiping down - show pagination only if not at bottom
        setShowBottomPagination(true);
      }
    }
    
    // Hide pagination if at bottom
    if (isAtBottom) {
      setShowBottomPagination(false);
    }
    
    setLastScrollY(scrollY);
    
    // Show top pagination indicator when scrolling
    setIsScrolling(true);
    setShowPagination(true);
  }, [totalPages, lastScrollY]);

  // Hide pagination indicator after scrolling stops
  const hideScrollPagination = useCallback(() => {
    setIsScrolling(false);
    setTimeout(() => {
      if (!isScrolling) {
        setShowPagination(false);
      }
    }, 2000); // Hide after 2 seconds of no scrolling
  }, [isScrolling]);

  // Bottom pagination navigation functions
  const goToPage = useCallback((page: number) => {
    if (page >= 1 && page <= totalPagesBottom) {
      setCurrentPageBottom(page);
    }
  }, [totalPagesBottom]);

  const goToFirstPage = useCallback(() => {
    setCurrentPageBottom(1);
  }, []);

  const goToLastPage = useCallback(() => {
    setCurrentPageBottom(totalPagesBottom);
  }, [totalPagesBottom]);

  const goToPreviousPage = useCallback(() => {
    if (currentPageBottom > 1) {
      setCurrentPageBottom(currentPageBottom - 1);
    }
  }, [currentPageBottom]);

  const goToNextPage = useCallback(() => {
    if (currentPageBottom < totalPagesBottom) {
      setCurrentPageBottom(currentPageBottom + 1);
    }
  }, [currentPageBottom, totalPagesBottom]);

  // Generate page numbers to display (max 5 page numbers)
  const getVisiblePages = useCallback(() => {
    const totalPages = totalPagesBottom;
    const currentPage = currentPageBottom;
    const maxVisible = 5;
    
    if (totalPages <= maxVisible) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    
    let start = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    let end = Math.min(totalPages, start + maxVisible - 1);
    
    if (end - start + 1 < maxVisible) {
      start = Math.max(1, end - maxVisible + 1);
    }
    
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  }, [currentPageBottom, totalPagesBottom]);

  // Reset to first page when filtered data changes
  useEffect(() => {
    setCurrentPageBottom(1);
  }, [filteredArray.length]);

  
  return (
    <View style={[globalStyles.container, { backgroundColor: 'rgb(28, 42, 89)', flex: 1 }]}>
      <View style={{ padding: 2, paddingHorizontal: 10 }}>
        {/* Custom Header with Back Button */}
        <View style={{ 
          flexDirection: 'row', 
          alignItems: 'center', 
          paddingVertical: 0, 
          marginBottom: 8,
          paddingTop: 2
        }}>
          <TouchableOpacity 
            onPress={() => navigation.getParent()?.navigate(ScreenNames.MAIN_TABS as never)}
            style={{ 
              padding: 8,
              marginRight: 12,
            }}
          >
            <ArrowLeft size={24} color={theme.colors.text} />
          </TouchableOpacity>
          
          <View style={{ flex: 1, alignItems: 'center' }}>
            <Text style={{fontSize: 17, color: theme.colors.text}}>{selectedCardTypeName || 'World Bingo'}</Text>
            {/* <Image 
              source={require('../../assets/images/world-Bingo-Logo.png')}
              style={{ width: 60, height: 30 }}
              resizeMode="contain"
            /> */}
          </View>
          
          {/* Placeholder to center the title */}
          <View style={{ width: 40 }} />
        </View>

        {/* Search Input */}
        
        {/* Search Input and Mode Buttons */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 0, paddingBottom: 5 }}>
          <View style={{ flex: 1, position: 'relative' }}>
            <TextInput
              style={{
                height: 42,
                paddingHorizontal: 14,
                borderRadius: 10,
                backgroundColor: 'rgb(0, 20, 60)',
                fontSize: 16,
                color: theme.colors.text,
                paddingRight: 35,
              }}
              placeholder="Search"
              placeholderTextColor={theme.colors.text}
              value={search}
              onChangeText={setSearch}
              keyboardType="numeric"
            />
            {search.length > 0 && (
              <TouchableOpacity
                style={{ position: 'absolute', right: 10, top: 10 }}
                onPress={() => setSearch('')}
              >
                <X size={20} color={theme.colors.text} />
              </TouchableOpacity>
            )}
          </View>
          
          <TouchableOpacity
            style={{
              backgroundColor: selectionMode === 'group' ? theme.colors.primary : theme.colors.surface,
              paddingVertical: 8,
              paddingHorizontal: 12,
              borderRadius: 8,
              position: 'relative',
              alignItems: 'center',
              justifyContent: 'center',
              borderWidth: 2,
              borderColor: theme.colors.primary,
              minWidth: 50,
            }}
            onPress={() => setSelectionMode('group')}
          >
            <Users size={20} color={theme.colors.text} />
            {groupSelectedNumbers.size > 0 && (
              <View style={{
                position: 'absolute',
                top: -5,
                right: -5,
                backgroundColor: theme.colors.primary,
                borderRadius: 12,
                minWidth: 18,
                height: 18,
                alignItems: 'center',
                justifyContent: 'center',
                paddingHorizontal: 2,
              }}>
                <Text style={{ fontSize: 10, fontWeight: 'bold', color: 'white' }}>
                  {groupSelectedNumbers.size}
                </Text>
              </View>
            )}
          </TouchableOpacity>
          
          <TouchableOpacity
            style={{
              backgroundColor: selectionMode === 'single' ? '#FF9800' : theme.colors.surface,
              paddingVertical: 8,
              paddingHorizontal: 12,
              borderRadius: 8,
              position: 'relative',
              alignItems: 'center',
              justifyContent: 'center',
              borderWidth: 2,
              borderColor: '#FF9800',
              minWidth: 50,
            }}
            onPress={() => setSelectionMode('single')}
          >
            <User size={20} color={theme.colors.text} />
            {singleSelectedNumbers.size > 0 && (
              <View style={{
                position: 'absolute',
                top: -5,
                right: -5,
                backgroundColor: '#FF9800',
                borderRadius: 12,
                minWidth: 18,
                height: 18,
                alignItems: 'center',
                justifyContent: 'center',
                paddingHorizontal: 2,
              }}>
                <Text style={{ fontSize: 10, fontWeight: 'bold', color: 'white' }}>
                  {singleSelectedNumbers.size}
                </Text>
              </View>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={{
              backgroundColor: theme.colors.surface,
              paddingVertical: 8,
              paddingHorizontal: 12,
              borderRadius: 8,
              position: 'relative',
              alignItems: 'center',
              justifyContent: 'center',
              borderWidth: 2,
              borderColor: selectionMode === 'group' ? theme.colors.primary : '#FF9800',
              minWidth: 50,
            }}
            onPress={() => {
              console.log('Show button pressed, setting modal visible to true');
              setIsModalVisible(true);
            }}
          >
            <Eye size={20} color={theme.colors.text} />
          </TouchableOpacity>
        </View>

      </View>
      

      {/* Scrollable Numbers Grid */}
      <View style={{ flex: 1, marginBottom: 0, paddingHorizontal: 16 }}>
        {isLoading ? (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            {/* <ActivityIndicator size="large" color={theme.colors.primary} /> */}
           
          </View>
        ) : filteredArray.length === 0 ? (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <Text style={{ fontSize: 16, color: theme.colors.textSecondary, textAlign: 'center', paddingHorizontal: 20 }}>
              {selectedArray.length === 0 ? 
                `No cards loaded.\n\nSelected: "${selectedCardTypeName}"\nLimit: ${worldBingoCardsLimit}\n\nTry going to Settings → Card Types to reset or check your selection.` :
                `No cards match your search "${search}"`
              }
            </Text>
            {selectedArray.length > 0 && search && (
              <TouchableOpacity 
                onPress={() => setSearch('')}
                style={{ marginTop: 12, padding: 8 }}
              >
                <Text style={{ color: theme.colors.primary }}>Clear Search</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <FlatList
            data={paginatedData}
            keyExtractor={(item) => `card_${item.id}`}
            numColumns={5}
            contentContainerStyle={{ 
              paddingVertical: 10,
              justifyContent: 'flex-start',
              alignItems: 'flex-start'
            }}
            columnWrapperStyle={{ 
              justifyContent: 'flex-start',
              paddingHorizontal: 0
            }}
            showsVerticalScrollIndicator={true}
            indicatorStyle={theme.theme === 'dark' ? 'white' : 'black'}
            initialNumToRender={100}
            maxToRenderPerBatch={200}
            windowSize={15}
            removeClippedSubviews={true}
            getItemLayout={(data, index) => ({
              length: 60,
              offset: 60 * Math.floor(index / 5),
              index,
            })}
            updateCellsBatchingPeriod={100}
            legacyImplementation={false}
            disableVirtualization={false}
            onScroll={handleScroll}
            onScrollEndDrag={hideScrollPagination}
            onMomentumScrollEnd={hideScrollPagination}
            scrollEventThrottle={16}
            renderItem={({ item }) => {
              // item.id represents the card number (1-720+)
              // item.data represents the actual bingo card numbers array
              return renderNumberItem({ item: item.id });
            }}
          />
        )}
      </View>

      {/* Bottom Section: Medeb Input and Start Game */}
      <Animated.View 
        style={{ 
          position: 'absolute',
          bottom: keyboardAnimatedValue,
          left: 0,
          right: 0,
          zIndex: 15,
          paddingBottom: Platform.OS === 'ios' ? 20 : 0, // Add bottom padding for safe area
        }}
      >
        {/* Enhanced Bottom Pagination Component - Positioned above input */}
        {filteredArray.length > itemsPerPageBottom && showBottomPagination && (
          <View style={{
            marginBottom: 0,
            opacity: showBottomPagination ? 1 : 0,
          }}>
            <View style={{
              flexDirection: 'row',
              justifyContent: 'center',
              alignItems: 'center',
              paddingVertical: 8,
              paddingHorizontal: 12,
              backgroundColor: 'rgb(0, 42, 81)',
              borderTopWidth: 1,
              borderTopColor: 'rgba(255, 255, 255, 0.1)',
              borderRadius: 12,
              gap: 6,
              shadowColor: '#000',
              shadowOffset: {
                width: 0,
                height: -2,
              },
              shadowOpacity: 0.25,
              shadowRadius: 3.84,
              elevation: 5,
            }}>
          {/* First Page Button */}
          <TouchableOpacity
            onPress={goToFirstPage}
            disabled={currentPageBottom === 1}
            style={{
              paddingHorizontal: 8,
              paddingVertical: 6,
              borderRadius: 4,
              backgroundColor: currentPageBottom === 1 ? theme.colors.textSecondary + '20' : theme.colors.primary,
              minWidth: 32,
              opacity: currentPageBottom === 1 ? 0.5 : 1
            }}
          >
            <Text style={{
              color: currentPageBottom === 1 ? theme.colors.textSecondary : 'white',
              fontWeight: '600',
              textAlign: 'center',
              fontSize: 12
            }}>
              ≪
            </Text>
          </TouchableOpacity>

          {/* Previous Button */}
          <TouchableOpacity
            onPress={goToPreviousPage}
            disabled={currentPageBottom === 1}
            style={{
              paddingHorizontal: 8,
              paddingVertical: 6,
              borderRadius: 4,
              backgroundColor: currentPageBottom === 1 ? theme.colors.textSecondary + '20' : theme.colors.primary,
              minWidth: 32,
              opacity: currentPageBottom === 1 ? 0.5 : 1
            }}
          >
            <Text style={{
              color: currentPageBottom === 1 ? theme.colors.textSecondary : 'white',
              fontWeight: '600',
              textAlign: 'center',
              fontSize: 12
            }}>
              ‹
            </Text>
          </TouchableOpacity>

          {/* Page Numbers */}
          {getVisiblePages().map((pageNum) => (
            <TouchableOpacity
              key={pageNum}
              onPress={() => goToPage(pageNum)}
              style={{
                paddingHorizontal: 8,
                paddingVertical: 6,
                borderRadius: 4,
                backgroundColor: pageNum === currentPageBottom ? theme.colors.primary : 'rgba(28, 42, 89, 0.8)',
                minWidth: 32,
                borderWidth: 1,
                borderColor: pageNum === currentPageBottom ? theme.colors.primary : theme.colors.border || theme.colors.textSecondary + '30'
              }}
            >
              <Text style={{
                color: pageNum === currentPageBottom ? 'white' : theme.colors.text,
                fontWeight: pageNum === currentPageBottom ? '700' : '500',
                textAlign: 'center',
                fontSize: 12
              }}>
                {pageNum}
              </Text>
            </TouchableOpacity>
          ))}

          {/* Next Button */}
          <TouchableOpacity
            onPress={goToNextPage}
            disabled={currentPageBottom === totalPagesBottom}
            style={{
              paddingHorizontal: 8,
              paddingVertical: 6,
              borderRadius: 4,
              backgroundColor: currentPageBottom === totalPagesBottom ? theme.colors.textSecondary + '20' : theme.colors.primary,
              minWidth: 32,
              opacity: currentPageBottom === totalPagesBottom ? 0.5 : 1
            }}
          >
            <Text style={{
              color: currentPageBottom === totalPagesBottom ? theme.colors.textSecondary : 'white',
              fontWeight: '600',
              textAlign: 'center',
              fontSize: 12
            }}>
              ›
            </Text>
          </TouchableOpacity>

          {/* Last Page Button */}
          <TouchableOpacity
            onPress={goToLastPage}
            disabled={currentPageBottom === totalPagesBottom}
            style={{
              paddingHorizontal: 8,
              paddingVertical: 6,
              borderRadius: 4,
              backgroundColor: currentPageBottom === totalPagesBottom ? theme.colors.textSecondary + '20' : theme.colors.primary,
              minWidth: 32,
              opacity: currentPageBottom === totalPagesBottom ? 0.5 : 1
            }}
          >
            <Text style={{
              color: currentPageBottom === totalPagesBottom ? theme.colors.textSecondary : 'white',
              fontWeight: '600',
              textAlign: 'center',
              fontSize: 12
            }}>
              ≫
            </Text>
          </TouchableOpacity>
            </View>
          </View>
        )}

        <View style={{ 
          padding: 16, 
          paddingVertical:5,
          backgroundColor: 'rgb(28, 42, 89)',
          borderTopWidth: 1,
          borderTopColor: 'rgba(255, 255, 255, 0.1)',
          shadowColor: '#000',
          shadowOffset: {
            width: 0,
            height: -2,
          },
          shadowOpacity: 0.25,
          shadowRadius: 3.84,
          elevation: 5,
        }}>
          <View style={{ 
            flexDirection: 'row', 
            alignItems: 'center', 
            gap: 12, 
            justifyContent: 'center'
          }}>
            <TextInput
              style={{
                height: 42,
                paddingHorizontal: 14,
                borderRadius: 10,
                backgroundColor: 'rgb(0, 20, 60)',
                fontSize: 16,
                color: theme.colors.text,
                borderWidth: 1,
                borderColor: theme.colors.border,
                width: 140,
                shadowColor: '#000',
                shadowOffset: {
                  width: 0,
                  height: 1,
                },
                shadowOpacity: 0.2,
                shadowRadius: 1.41,
                elevation: 2,
              }}
              placeholder="Enter amount"
              placeholderTextColor={theme.colors.textSecondary}
              value={medebAmount}
              onChangeText={setMedebAmount}
              keyboardType="numeric"
              returnKeyType="done"
            />
            
            <TouchableOpacity
              style={{
                backgroundColor: (getTotalSelectedCount() >= 2 && parseFloat(medebAmount) > 0) ? theme.colors.primary : '#888888',
                paddingVertical: 12,
                paddingHorizontal: 20,
                borderRadius: 10,
                flex: 1,
                minWidth: 180,
                shadowColor: '#000',
                shadowOffset: {
                  width: 0,
                  height: 2,
                },
                shadowOpacity: 0.25,
                shadowRadius: 3.84,
                elevation: 5,
              }}
              onPress={handleStartPlay}
              disabled={getTotalSelectedCount() < 2 || parseFloat(medebAmount) <= 0}
            >
              <Text style={{ 
                fontSize: 16, 
                fontWeight: '600', 
                color: (getTotalSelectedCount() >= 2 && parseFloat(medebAmount) > 0) ? theme.colors.text : '#FFFFFF',
                textAlign: 'center' 
              }}>
                Start Game
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Animated.View>


      <SelectedNumbersModal
        isModalVisible={isModalVisible}
        selectedNumbers={Array.from(getCurrentSelectedNumbers())}
        groupSelectedNumbers={Array.from(groupSelectedNumbers)}
        singleSelectedNumbers={Array.from(singleSelectedNumbers)}
        selectionMode={selectionMode}
        setSelectedNumbers={(newNumbers: any) => {
          if (selectionMode === 'group') {
            setGroupSelectedNumbers(new Set(newNumbers));
          } else {
            setSingleSelectedNumbers(new Set(newNumbers));
          }
        }}
        setIsModalVisible={setIsModalVisible}
      />

      <NoCartelaSelected
        visible={noCartelaModalVisible}
        setNoCartelaModalVisible={setNoCartelaModalVisible}
      />

      <InsufficientCoinsModal
        visible={insufficientCoinsModalVisible}
        requiredAmount={requiredCoins}
        currentBalance={userCoins}
        onClose={handleCloseInsufficientCoins}
        onBuyCoin={handleBuyCoin}
      />

      {/* Loading Overlay */}
      <LoadingOverlay visible={isLoading} message={`Starting ${cardTypeInfo.displayName} Game`} />
    </View>
  );
};

const styles = StyleSheet.create({
  dropdownContainer: {
    zIndex: 12,
    borderRadius: 12,
    marginTop: 6,
    width: '100%',
    padding: 12,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
    marginBottom: 10,
  },
  dropdownOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  dropdownText: {
    marginLeft: 12,
    fontSize: 16,
  },
});

export default React.memo(PlayerCartelaSelectionScreen);