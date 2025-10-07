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
import { WORLD_BINGO_CARDS } from '../../data/worldbingodata';

const { width } = Dimensions.get('window');

const PlayerCartelaSelectionScreen = () => {
  const { theme } = useTheme();
  const navigation = useNavigation();

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
  const { customCardTypes, selectedCardTypeName, rtpPercentage, lastEnteredAmount, setLastEnteredAmount, worldBingoCardsLimit, getMaxCardsForSelectedType, setWorldBingoCardsLimit, selectedVoice, forceRefreshWorldBingoCards } = useSettingsStore();
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

  console.log('Group Selected Numbers:', Array.from(groupSelectedNumbers));
  console.log('Single Selected Numbers:', Array.from(singleSelectedNumbers));
  console.log('Current Selection Mode:', selectionMode);

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

  // Populate selectedArray from settings with limit
  useEffect(() => {
    const loadCards = async () => {
      setIsLoading(true);
      console.log('=== LOADING CARDS ===');
      console.log('WORLD_BINGO_CARDS.length (direct import):', WORLD_BINGO_CARDS.length);
      console.log('customCardTypes length:', customCardTypes.length);
      console.log('selectedCardTypeName:', selectedCardTypeName);
      console.log('worldBingoCardsLimit:', worldBingoCardsLimit);
      console.log('🔍 DEBUGGING CARD LIMITS:');
      console.log('  - Store worldBingoCardsLimit:', worldBingoCardsLimit);
      console.log('  - Store getMaxCardsForSelectedType():', getMaxCardsForSelectedType());
      console.log('🔍 DEBUGGING CUSTOM CARD TYPES:');
      console.log('  - customCardTypes:', customCardTypes);
      console.log('  - customCardTypes details:', customCardTypes.map(c => ({ name: c.name, cardCount: c.cards?.length || 0 })));
      
      // ALWAYS use direct WORLD_BINGO_CARDS for reliable behavior
      // This ensures we always have access to the full dataset regardless of store state
      console.log('🎯 USING DIRECT WORLD_BINGO_CARDS for reliable card loading');
      console.log('Direct WORLD_BINGO_CARDS length:', WORLD_BINGO_CARDS.length);
      console.log('Requested limit:', worldBingoCardsLimit);
      
      const limitToUse = Math.min(worldBingoCardsLimit, WORLD_BINGO_CARDS.length);
      const limitedCards = WORLD_BINGO_CARDS.slice(0, limitToUse);
      
      setTimeout(() => {
        setSelectedArray(limitedCards);
        setIsLoading(false);
        console.log('🎯 DIRECT LOAD RESULT:');
        console.log(`  - Setting selectedArray with ${limitedCards.length} cards from direct import`);
        console.log(`  - Used limit: ${limitToUse} (worldBingoCardsLimit: ${worldBingoCardsLimit}, available: ${WORLD_BINGO_CARDS.length})`);
        console.log('  - Cards will be numbered 1 through', limitedCards.length);
        console.log('  - First 5 cards sample:', limitedCards.slice(0, 5));
      }, 0);
      
      // Also try to refresh the store in the background for future use
      if (customCardTypes.length === 0 || 
          !customCardTypes.find(c => c.name === 'default') ||
          customCardTypes.find(c => c.name === 'default')?.cards?.length < 100) {
        console.log('🔄 Background: Refreshing store data for future use');
        forceRefreshWorldBingoCards();
      }
      
      return; // Always use direct approach for now
      
      if (customCardTypes.length > 0) {
        // Get the selected card type
        let selectedCardType = customCardTypes.find(c => c.name === selectedCardTypeName);
        console.log('Found selectedCardType:', selectedCardType);
        
        // Fallback: if no card type found and we're looking for 'default', try to find any World Bingo type
        if (!selectedCardType && (selectedCardTypeName === 'default' || selectedCardTypeName === 'World Bingo')) {
          selectedCardType = customCardTypes.find(c => c.name === 'default') || customCardTypes[0];
          console.log('Fallback: Using card type:', selectedCardType?.name);
        }
        
        if (selectedCardType && selectedCardType.cards && selectedCardType.cards.length > 0) {
          const maxCards = selectedCardType.cards.length;
          console.log('✅ Found valid selectedCardType with', maxCards, 'cards');
          console.log('🔍 BEFORE LIMIT LOGIC:');
          console.log('  - maxCards (from data):', maxCards);
          console.log('  - worldBingoCardsLimit (from store):', worldBingoCardsLimit);
          console.log('  - Math.min(worldBingoCardsLimit, maxCards):', Math.min(worldBingoCardsLimit, maxCards));
          
          // Apply the worldBingoCardsLimit - ensure we show all requested cards up to the limit
          const limitToUse = Math.min(worldBingoCardsLimit, maxCards);
          const limitedCards = selectedCardType.cards.slice(0, limitToUse);
          
          // Use setTimeout to prevent blocking the UI
          setTimeout(() => {
            setSelectedArray(limitedCards);
            setIsLoading(false);
            console.log('🎯 FINAL RESULT:');
            console.log(`  - Setting selectedArray with ${limitedCards.length} cards (limited from ${maxCards})`);
            console.log(`  - Used limit: ${limitToUse} (worldBingoCardsLimit: ${worldBingoCardsLimit}, maxCards: ${maxCards})`);
            console.log('  - First few cards:', limitedCards.slice(0, 5).map((_, i) => i + 1));
          }, 0);
        } else {
          console.log('ERROR: Could not find valid selectedCardType with name:', selectedCardTypeName);
          console.log('Available card types:', customCardTypes.map(c => ({ name: c.name, cardCount: c.cards?.length || 0 })));
          console.log('Will show empty state with helpful message');
          setSelectedArray([]);
          setIsLoading(false);
        }
      } else {
        console.log('ERROR: No customCardTypes available - settings may not be initialized');
        setSelectedArray([]);
        setIsLoading(false);
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
      navigation.getParent()?.navigate('MainTabs' as never);
      return true;
    };
    const backHandler = BackHandler.addEventListener('hardwareBackPress', handleBackPress);
    
    return () => backHandler.remove();
  }, [navigation]);

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
    const rtpDecimal = rtpPercentage / 100;
    const derash = Math.floor(medeb * totalSelections * rtpDecimal);
    return derash;
  }, [medebAmount, getTotalSelectedCount, rtpPercentage]);


  const handleStartPlay = useCallback(() => {
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

    // Save the entered amount for future use
    setLastEnteredAmount(medeb);
    
    // Ensure audioManager has the current voice set and play game start sound
    console.log('Setting voice in audioManager:', selectedVoice);
    audioManager.setVoice(selectedVoice);
    // Wait a moment before playing game start sound to avoid overlapping audio
    setTimeout(() => {
      audioManager.playGameStartSound();
    }, 100);
    
    const allUniqueNumbers = getAllSelectedNumbers();
    const derashValue = calculateDerashValue();
    
    console.log('Starting game with:');
    console.log('All selections:', Array.from(allUniqueNumbers));
    console.log('Medeb amount:', medeb);
    console.log('Total selections:', totalSelected);
    console.log('Derash value:', derashValue);
    console.log('Selected card type name:', selectedCardTypeName);
    console.log('Custom card types:', customCardTypes);
    console.log('Selection mode:', selectionMode);
    
    // Navigate to different screens based on selection mode
    if (selectionMode === 'single' && singleSelectedNumbers.size > 0) {
      // Navigate to SinglePlayerGameScreen for individual selections
      navigation.navigate('SinglePlayerGame' as never, {
        selectedCardNumbers: Array.from(allUniqueNumbers),
        singleSelectedNumbers: Array.from(singleSelectedNumbers),
        medebAmount: medeb,
        derashValue: derashValue,
        totalSelections: totalSelected,
        selectedCardTypeName: selectedCardTypeName,
        customCardTypes: customCardTypes,
      } as any);
    } else {
      // Navigate to regular GameScreen for group selections
      navigation.navigate('GamePlay' as never, {
        selectedCardNumbers: Array.from(allUniqueNumbers),
        groupSelectedNumbers: Array.from(groupSelectedNumbers),
        singleSelectedNumbers: Array.from(singleSelectedNumbers),
        selectionMode: selectionMode,
        medebAmount: medeb,
        derashValue: derashValue,
        totalSelections: totalSelected,
        selectedCardTypeName: selectedCardTypeName,
        customCardTypes: customCardTypes,
      } as any);
    }
  }, [getTotalSelectedCount, medebAmount, getAllSelectedNumbers, groupSelectedNumbers, singleSelectedNumbers, selectionMode, calculateDerashValue, navigation, selectedCardTypeName, customCardTypes, setLastEnteredAmount]);
  
  const gradientColors = ['rgba(0, 163, 141, 0.61)', 'rgba(0, 103, 221, 0.63)']

  const renderNumberItem = useCallback(
    ({ item }: { item: any}) => {
      const isSelected = selectedNumbers.has(item);
      const isDisabledInGroup = selectionMode === 'single' && groupSelectedNumbers.has(item);
      const isDisabledInSingle = selectionMode === 'group' && singleSelectedNumbers.has(item);
      const isDisabled = isDisabledInGroup || isDisabledInSingle;
      
      let backgroundColor = theme.colors.surface || '#e7f1ff';
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
    
    // Detect swipe direction for bottom pagination visibility
    const scrollDelta = scrollY - lastScrollY;
    if (Math.abs(scrollDelta) > 5) { // Only respond to significant scroll movements
      if (scrollDelta > 0) {
        // Scrolling down/swiping up - hide pagination
        setShowBottomPagination(false);
        Animated.timing(paginationAnimValue, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }).start();
      } else {
        // Scrolling up/swiping down - show pagination
        setShowBottomPagination(true);
        Animated.timing(paginationAnimValue, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }).start();
      }
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
    <View style={[globalStyles.container, { backgroundColor: theme.colors.background, flex: 1 }]}>
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
            onPress={() => navigation.getParent()?.navigate('MainTabs' as never)}
            style={{ 
              padding: 8,
              marginRight: 12,
            }}
          >
            <ArrowLeft size={24} color={theme.colors.text} />
          </TouchableOpacity>
          
          <View style={{ flex: 1, alignItems: 'center' }}>
            <Text style={{fontSize: 17, color: theme.colors.text}}>Wrold Bingo</Text>
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
                backgroundColor: theme.colors.surface,
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
            onPress={() => setIsModalVisible(true)}
          >
            <Eye size={20} color={theme.colors.text} />
          </TouchableOpacity>
        </View>

      </View>
      

      {/* Scrollable Numbers Grid */}
      <View style={{ flex: 1, marginBottom: 0, paddingHorizontal: 16 }}>
        {isLoading ? (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text style={{ fontSize: 16, color: theme.colors.textSecondary, marginTop: 12, textAlign: 'center' }}>
              Loading {worldBingoCardsLimit} cards...
            </Text>
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

      {/* Enhanced Bottom Pagination Component */}
      {filteredArray.length > itemsPerPageBottom && (
        <Animated.View style={{
          flexDirection: 'row',
          justifyContent: 'center',
          
          alignItems: 'center',
          paddingVertical: paginationAnimValue.interpolate({
            inputRange: [0, 1],
            outputRange: [0, 8]
          }),
          paddingHorizontal: 12,
          backgroundColor: theme.colors.surface,
          borderTopWidth: paginationAnimValue.interpolate({
            inputRange: [0, 1],
            outputRange: [0, 1]
          }),
          borderTopColor: theme.colors.border || theme.colors.textSecondary + '20',
          gap: 4,
          opacity: paginationAnimValue,
          height: paginationAnimValue.interpolate({
            inputRange: [0, 1],
            outputRange: [0, 60]
          }),
          overflow: 'hidden',
          transform: [{
            translateY: paginationAnimValue.interpolate({
              inputRange: [0, 1],
              outputRange: [30, 0]
            })
          }]
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
                backgroundColor: pageNum === currentPageBottom ? theme.colors.primary : theme.colors.background,
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
        </Animated.View>
      )}


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

      {/* Bottom Section: Medeb Input and Start Game */}
      <View style={{ 
        padding: 16, 
        backgroundColor: 'transparent',
        borderTopWidth: 0,
        borderTopColor: 'transparent',
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
              backgroundColor: theme.colors.background,
              fontSize: 16,
              color: theme.colors.text,
              borderWidth: 1,
              borderColor: theme.colors.border,
              width: 140,
            }}
            placeholder="Enter amount"
            placeholderTextColor={theme.colors.textSecondary}
            value={medebAmount}
            onChangeText={setMedebAmount}
            keyboardType="numeric"
          />
          
          <TouchableOpacity
            style={{
              backgroundColor: (getTotalSelectedCount() > 0 && parseFloat(medebAmount) > 0) ? theme.colors.primary : '#888888',
              paddingVertical: 12,
              paddingHorizontal: 20,
              borderRadius: 10,
              flex: 1,
              minWidth: 180,
            }}
            onPress={handleStartPlay}
            disabled={getTotalSelectedCount() === 0 || parseFloat(medebAmount) <= 0}
          >
            <Text style={{ 
              fontSize: 16, 
              fontWeight: '600', 
              color: (getTotalSelectedCount() > 0 && parseFloat(medebAmount) > 0) ? theme.colors.text : '#FFFFFF',
              textAlign: 'center' 
            }}>
              Start Game
            </Text>
          </TouchableOpacity>
        </View>
      </View>
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