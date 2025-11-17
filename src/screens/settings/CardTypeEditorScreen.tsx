import React, { useEffect, useMemo, useState, useCallback, useRef, createRef, memo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Alert, Modal, BackHandler, SectionList } from 'react-native';
import { useTheme } from '../../components/ui/ThemeProvider';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { useSettingsStore } from '../../store/settingsStore';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import { WORLD_BINGO_CARDS } from '../../data/worldbingodata';
import { AFRICA_BINGO_CARDS } from '../../data/africabingodata';
import { getCardTypeInfo, getDefaultLimitForCardType } from '../../utils/cardTypeManager';
import Slider from '@react-native-community/slider';

type CardRow = number[]; // 24 numbers

// Completely isolated input component that NEVER re-renders
const IsolatedNumberInput = memo<{
  index: number;
  columnIndex: number;
  initialValue: string | null;
  placeholder: string;
  onValueChange: (index: number, value: string | null) => void;
  theme: any;
}>(({ index, columnIndex, initialValue, placeholder, onValueChange, theme }) => {
  const [localValue, setLocalValue] = useState(initialValue || '');
  const inputRef = useRef<TextInput>(null);

  // Validate for column ranges
  const getValidationState = (value: string) => {
    if (!value || value === '') return 'empty';
    const n = Number(value);
    if (!Number.isFinite(n) || n <= 0) return 'invalid';
    
    const columnRanges = [
      { min: 1, max: 15 },   // B column: 1-15
      { min: 16, max: 30 },  // I column: 16-30
      { min: 31, max: 45 },  // N column: 31-45
      { min: 46, max: 60 },  // G column: 46-60
      { min: 61, max: 75 }   // O column: 61-75
    ];
    const { min, max } = columnRanges[columnIndex];
    return (n >= min && n <= max) ? 'valid' : 'invalid';
  };

  const validationState = getValidationState(localValue);

  return (
    <TextInput
      ref={inputRef}
      value={localValue}
      onChangeText={(text) => {
        // Only numeric, max 2 digits
        const numericText = text.replace(/[^0-9]/g, '').slice(0, 2);
        setLocalValue(numericText);
      }}
      onBlur={() => {
        // Only sync to parent on blur
        onValueChange(index, localValue === '' ? null : localValue);
      }}
      keyboardType="numeric"
      maxLength={2}
      blurOnSubmit={false}
      returnKeyType="next"
      autoCorrect={false}
      autoComplete="off"
      style={{
        width: 50,
        height: 50,
        borderWidth: 1,
        borderRadius: 6,
        textAlign: 'center',
        fontSize: 14,
        fontWeight: '600',
        borderColor: validationState === 'invalid' ? '#ff6b6b' : theme.colors.border,
        backgroundColor: validationState === 'invalid' ? '#ffe6e6' : theme.colors.surface,
        color: theme.colors.text,
      }}
      placeholder={placeholder}
      placeholderTextColor={theme.colors.textSecondary}
    />
  );
}, (prevProps, nextProps) => {
  // Only re-render if these specific props change
  return (
    prevProps.index === nextProps.index &&
    prevProps.columnIndex === nextProps.columnIndex &&
    prevProps.initialValue === nextProps.initialValue &&
    prevProps.placeholder === nextProps.placeholder
  );
});

// Isolated CSV input that never re-renders and never closes keyboard
const IsolatedCSVInput = memo<{
  placeholder: string;
  onValueChange: (value: string) => void;
  theme: any;
}>(({ placeholder, onValueChange, theme }) => {
  const [localValue, setLocalValue] = useState('');
  const inputRef = useRef<TextInput>(null);

  // BINGO column validation ranges
  const columnRanges = [
    { min: 1, max: 15, name: 'B' },   // Positions 0-4: B column (1-15)
    { min: 16, max: 30, name: 'I' },  // Positions 5-9: I column (16-30)  
    { min: 31, max: 45, name: 'N' },  // Positions 10-14: N column (31-45)
    { min: 46, max: 60, name: 'G' },  // Positions 15-19: G column (46-60)
    { min: 61, max: 75, name: 'O' }   // Positions 20-23: O column (61-75)
  ];

  const validateAndFormatInput = (text: string): string => {
    // Just clean up and return - main validation is in onChangeText now
    return text.replace(/[^0-9,]/g, '');
  };

  return (
    <TextInput
      ref={inputRef}
      value={localValue}
      onChangeText={(text) => {
        // Only allow numbers and commas
        let filtered = text.replace(/[^0-9,]/g, '');
        
        // Split by commas and limit each number to 2 digits
        const parts = filtered.split(',');
        const seenNumbers = new Set();
        const limitedParts = parts.map((part, index) => {
          if (part === '') return ''; // Allow empty parts
          
          // Limit to 2 digits per number
          let limited = part.slice(0, 2);
          
          // Don't allow numbers > 75 while typing
          const num = parseInt(limited);
          if (!isNaN(num) && num > 75) {
            limited = '75';
          }
          
          // Check for duplicates - if number already exists, remove it
          if (limited !== '' && seenNumbers.has(limited)) {
            return ''; // Remove duplicate
          }
          
          if (limited !== '') {
            seenNumbers.add(limited);
          }
          
          return limited;
        });
        
        // Remove empty parts except trailing commas
        const cleanedParts = [];
        for (let i = 0; i < limitedParts.length; i++) {
          if (limitedParts[i] !== '' || i === limitedParts.length - 1) {
            cleanedParts.push(limitedParts[i]);
          }
        }
        
        // Limit to 24 numbers max
        const result = cleanedParts.slice(0, 24).join(',');
        setLocalValue(result);
      }}
      onBlur={() => {
        // Validate and sync to parent only on blur
        const validatedText = validateAndFormatInput(localValue);
        setLocalValue(validatedText);
        onValueChange(validatedText);
      }}
      placeholder={placeholder}
      placeholderTextColor={theme.colors.textSecondary}
      keyboardType="numeric"
      multiline
      blurOnSubmit={false}
      returnKeyType="done"
      autoCorrect={false}
      autoComplete="off"
      style={{
        borderWidth: 1,
        borderColor: theme.colors.border,
        borderRadius: 8,
        padding: 12,
        minHeight: 80,
        maxHeight: 120,
        backgroundColor: theme.colors.background,
        color: theme.colors.text,
        fontSize: 16,
        textAlignVertical: 'top',
      }}
    />
  );
}, (prevProps, nextProps) => {
  // Only re-render if placeholder changes - theme and onValueChange should be stable
  return prevProps.placeholder === nextProps.placeholder;
});

export const CardTypeEditorScreen: React.FC = () => {
  const { theme } = useTheme();
  const { 
    customCardTypes, 
    addCustomCardType, 
    updateCustomCardType, 
    selectCardTypeByName, 
    worldBingoCardsLimit,
    getMaxCardsForSelectedType,
    resetLimitToMax,
    forceRefreshWorldBingoCards,
    setWorldBingoCardsLimit
  } = useSettingsStore();
  const navigation = useNavigation();
  const route = useRoute<any>();

  const [name, setName] = useState('');
  const isWorldBingo = route.params?.name === 'default' || route.params?.name === 'World Bingo';
  const isAfricaBingo = route.params?.name === 'africa' || route.params?.name === 'Africa Bingo';
  const isCustomCardType = route.params?.mode === 'create' || route.params?.name === 'custom';
  const MODE_CSV = 'csv' as const;
  const MODE_MANUAL = 'manual' as const;
  const [mode, setMode] = useState<typeof MODE_CSV | typeof MODE_MANUAL>(MODE_CSV);
  const [csv, setCsv] = useState('');
  const [cards, setCards] = useState<CardRow[]>([]);
  const [currentManual, setCurrentManual] = useState<(number | null)[]>(Array(24).fill(null));
  const [unsavedChangesModal, setUnsavedChangesModal] = useState(false);
  const [originalCards, setOriginalCards] = useState<CardRow[]>([]);
  const [originalName, setOriginalName] = useState('');
  const [highlightedCard, setHighlightedCard] = useState<number | null>(null);
  const [searchNumber, setSearchNumber] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [tempSliderValue, setTempSliderValue] = useState(worldBingoCardsLimit);
  const sliderTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  

  // Callback for isolated input components
  const handleInputValueChange = useCallback((index: number, value: string | null) => {
    setCurrentManual(prev => {
      const next = [...prev];
      next[index] = value === null || value === '' ? null : value;
      return next;
    });
  }, []);

  // Callback for isolated CSV input
  const handleCSVValueChange = useCallback((value: string) => {
    setCsv(value);
  }, []);

  // Update tempSliderValue when worldBingoCardsLimit changes from external sources
  useEffect(() => {
    setTempSliderValue(worldBingoCardsLimit);
  }, [worldBingoCardsLimit]);

  // Debounced function to update the actual limit
  const handleSliderChange = useCallback((value: number) => {
    setTempSliderValue(value);
    
    // Clear existing timeout
    if (sliderTimeoutRef.current) {
      clearTimeout(sliderTimeoutRef.current);
    }
    
    // Set new timeout for debounced update
    sliderTimeoutRef.current = setTimeout(() => {
      setWorldBingoCardsLimit(value);
    }, 100); // 100ms debounce
  }, [setWorldBingoCardsLimit]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (sliderTimeoutRef.current) {
        clearTimeout(sliderTimeoutRef.current);
      }
    };
  }, []);

  // Generate cards dynamically based on worldBingoCardsLimit (same logic as PlayerCartelaSelectionScreen)
  const generateLimitedCards = useMemo(() => {
    if (!isWorldBingo && !isAfricaBingo) {
      // For custom cards, apply search filter
      if (searchNumber && searchNumber.trim() !== '') {
        const searchNum = parseInt(searchNumber.trim());
        if (!isNaN(searchNum) && searchNum >= 1 && searchNum <= cards.length) {
          // Show only the specific card at index (searchNum - 1)
          return [cards[searchNum - 1]];
        } else if (!isNaN(searchNum)) {
          // If number is out of range, show no cards
          return [];
        }
      }
      return cards;
    }

    const generateRandomCard = (): number[] => {
      const numbers: number[] = [];
      const used = new Set<number>();
      
      while (numbers.length < 24) {
        const num = Math.floor(Math.random() * 75) + 1;
        if (!used.has(num)) {
          used.add(num);
          numbers.push(num);
        }
      }
      
      return numbers.sort((a, b) => a - b);
    };

    const generateCards = (count: number): number[][] => {
      const cardsList: number[][] = [];
      
      // Get the correct card type info using the manager
      const cardTypeName = isAfricaBingo ? 'Africa Bingo' : 'World Bingo';
      const cardTypeInfo = getCardTypeInfo(cardTypeName, customCardTypes);
      const sourceCards = cardTypeInfo.cards;
      
      // First, use the predefined cards (up to available count)
      const predefinedCount = Math.min(count, sourceCards.length);
      for (let i = 0; i < predefinedCount; i++) {
        cardsList.push(sourceCards[i]);
      }
      
      // If we need more cards than available, generate additional random cards
      if (count > sourceCards.length) {
        const additionalCount = count - sourceCards.length;
        for (let i = 0; i < additionalCount; i++) {
          cardsList.push(generateRandomCard());
        }
      }
      
      return cardsList;
    };
    
    let generatedCards = generateCards(worldBingoCardsLimit);
    
    // Apply search filter if search number is provided
    if (searchNumber && searchNumber.trim() !== '') {
      const searchNum = parseInt(searchNumber.trim());
      if (!isNaN(searchNum) && searchNum >= 1 && searchNum <= generatedCards.length) {
        // Show only the specific card at index (searchNum - 1)
        generatedCards = [generatedCards[searchNum - 1]];
      } else if (!isNaN(searchNum)) {
        // If number is out of range, show no cards
        generatedCards = [];
      }
    }
    
    return generatedCards;
  }, [isWorldBingo, isAfricaBingo, cards, worldBingoCardsLimit, searchNumber]);

  // Pagination logic
  const itemsPerPage = 50;
  const totalPages = Math.ceil(generateLimitedCards.length / itemsPerPage);
  
  // Calculate paginated data
  const paginatedCards = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return generateLimitedCards.slice(startIndex, endIndex);
  }, [generateLimitedCards, currentPage, itemsPerPage]);

  // Reset to first page when filtered data changes
  useEffect(() => {
    setCurrentPage(1);
  }, [generateLimitedCards.length]);

  // Pagination navigation functions
  const goToPage = useCallback((page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  }, [totalPages]);

  const goToFirstPage = useCallback(() => {
    setCurrentPage(1);
  }, []);

  const goToLastPage = useCallback(() => {
    setCurrentPage(totalPages);
  }, [totalPages]);

  const goToPreviousPage = useCallback(() => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  }, [currentPage]);

  const goToNextPage = useCallback(() => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  }, [currentPage, totalPages]);

  // Generate page numbers to display (max 5 page numbers)
  const getVisiblePages = useCallback(() => {
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
  }, [currentPage, totalPages]);

  // Render function for each card in FlatList
  const renderCard = ({ item: row, index: idx }: { item: number[], index: number }) => {
    const grid = getGridFromNumbers(row);
    
    // Calculate the actual card number based on pagination and search
    const actualCardNumber = searchNumber 
      ? searchNumber 
      : ((currentPage - 1) * itemsPerPage) + idx + 1;
    
    return (
      <View key={idx} style={[
        styles.cardRow, 
        { 
          borderColor: highlightedCard === idx ? theme.colors.primary : theme.colors.border,
          backgroundColor: highlightedCard === idx ? `${theme.colors.primary}20` : 'transparent',
          borderWidth: highlightedCard === idx ? 2 : 1
        }
      ]}> 
        <View style={styles.cardRowHeader}>
          <View style={[styles.cardNumberBadge, { backgroundColor: theme.colors.primary }]}>
            <Text style={[styles.cardNumberText, { color: '#fff' }]}>#{actualCardNumber}</Text>
          </View>
          {!isWorldBingo && !isAfricaBingo && (
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {idx > 0 && (
                <Button title="↑" onPress={() => moveCard(idx, idx - 1)} size="sm" />
              )}
              {idx < cards.length - 1 && (
                <Button title="↓" onPress={() => moveCard(idx, idx + 1)} size="sm" />
              )}
              <Button title="✎" onPress={() => {
                setMode(MODE_MANUAL);
                setCurrentManual(row.map(x => x));
                const next = [...cards]; next.splice(idx, 1); setCards(next);
                setEditIndex(idx);
              }} size="sm" />
              <Button title="✕" onPress={() => removeCard(idx)} size="sm" />
            </View>
          )}
        </View>
        
        {/* BINGO Header for this card */}
        <View style={styles.bingoHeader}>
          {['B', 'I', 'N', 'G', 'O'].map((letter, letterIdx) => (
            <View key={letter} style={[styles.bingoLetterBoxSmall, { borderColor: theme.colors.border, backgroundColor: theme.colors.primary }]}>
              <Text style={[styles.bingoLetterSmall, { color: '#fff' }]}>{letter}</Text>
            </View>
          ))}
        </View>
        
        {/* 5x5 Grid for this card */}
        <View style={styles.cardGrid5x5Small}>
          {grid.map((gridRow, rowIdx) => (
            <View key={rowIdx} style={styles.gridRowSmall}>
              {gridRow.map((cell, colIdx) => {
                const isCenter = rowIdx === 2 && colIdx === 2;
                return (
                  <View key={`${rowIdx}-${colIdx}`} style={[
                    styles.gridCellSmall,
                    { 
                      borderColor: theme.colors.border, 
                      backgroundColor: isCenter ? theme.colors.surface : theme.colors.background 
                    }
                  ]}>
                    <Text style={[
                      styles.gridCellTextSmall, 
                      { 
                        color: isCenter ? theme.colors.textSecondary : theme.colors.text,
                        fontWeight: isCenter ? 'normal' : 'bold'
                      }
                    ]}>
                      {isCenter ? 'FREE' : cell}
                    </Text>
                  </View>
                );
              })}
            </View>
          ))}
        </View>
      </View>
    );
  };
  
  // Convert 24-number array to 5x5 grid with center free space
  const getGridFromNumbers = (numbers: (number | null)[]) => {
    const grid: (number | null)[][] = Array(5).fill(null).map(() => Array(5).fill(null));
    let numberIndex = 0;
    
    for (let row = 0; row < 5; row++) {
      for (let col = 0; col < 5; col++) {
        if (row === 2 && col === 2) {
          // Center cell is free
          grid[row][col] = null;
        } else {
          grid[row][col] = numbers[numberIndex] || null;
          numberIndex++;
        }
      }
    }
    return grid;
  };
  
  // Convert 5x5 grid back to 24-number array
  const getNumbersFromGrid = (grid: (number | null)[][]) => {
    const numbers: (number | null)[] = [];
    
    for (let row = 0; row < 5; row++) {
      for (let col = 0; col < 5; col++) {
        if (row === 2 && col === 2) {
          // Skip center cell
          continue;
        }
        numbers.push(grid[row][col]);
      }
    }
    return numbers;
  };
  const [editIndex, setEditIndex] = useState<number | null>(null);
  const [confirmVisible, setConfirmVisible] = useState(false);

  // Reset screen for "create" mode or filter by provided name in manage mode
  useEffect(() => {
    if (route.params?.mode === 'create') {
      // Load existing custom cards if they exist
      const existingCustom = customCardTypes.find(c => c.name === 'custom');
      setName('custom');
      setOriginalName('custom');
      setMode(MODE_CSV); // Default to CSV mode
      setCsv('');
      setCards(existingCustom ? existingCustom.cards : []);
      setOriginalCards(existingCustom ? [...existingCustom.cards] : []);
      setCurrentManual(Array(24).fill(null));
      setEditIndex(null);
      return;
    }
    if (route.params?.mode === 'manage' && route.params?.name) {
      if (route.params.name === 'default' || route.params.name === 'World Bingo') {
        // For World Bingo, just set the name and don't show any edit options
        setName('World Bingo');
        setOriginalName('World Bingo');
        setCards([]);
        setOriginalCards([]);
        setMode(MODE_MANUAL);
        setCurrentManual(Array(24).fill(null));
        setEditIndex(null);
      } else if (route.params.name === 'africa' || route.params.name === 'Africa Bingo') {
        // For Africa Bingo, just set the name and don't show any edit options
        setName('Africa Bingo');
        setOriginalName('Africa Bingo');
        setCards([]);
        setOriginalCards([]);
        setMode(MODE_MANUAL);
        setCurrentManual(Array(24).fill(null));
        setEditIndex(null);
      } else {
        // For custom cards, always load existing custom cards or initialize empty
        const found = customCardTypes.find(c => c.name === 'custom');
        setName('custom');
        setOriginalName('custom');
        setCards(found ? found.cards : []);
        setOriginalCards(found ? [...found.cards] : []);
        setMode(MODE_CSV); // Default to CSV mode
        setCurrentManual(Array(24).fill(null));
        setEditIndex(null);
      }
    }
  }, [route.params, customCardTypes]);

  const isValidCard = (row: number[]) => new Set(row).size === 24 && row.length === 24;

  const addFromCsv = () => {
    const parsed = csv.split(',').map(s => parseInt(s.trim(), 10)).filter(n => !isNaN(n));
    if (parsed.length !== 24) {
      Alert.alert('Invalid', 'A card must contain exactly 24 numbers.');
      return;
    }
    if (new Set(parsed).size !== 24) {
      Alert.alert('Invalid', 'All 24 numbers must be different.');
      return;
    }
    
    // Validate BINGO column ranges for CSV input
    const columnRanges = [
      { min: 1, max: 15, name: 'B' },   // B column: 1-15
      { min: 16, max: 30, name: 'I' },  // I column: 16-30
      { min: 31, max: 45, name: 'N' },  // N column: 31-45
      { min: 46, max: 60, name: 'G' },  // G column: 46-60
      { min: 61, max: 75, name: 'O' }   // O column: 61-75
    ];
    
    // Check each position in the 24-number array according to BINGO column layout
    for (let i = 0; i < 24; i++) {
      // Map 24-number linear array to BINGO column position
      let col;
      if (i < 5) col = 0;        // B column: positions 0-4
      else if (i < 10) col = 1;  // I column: positions 5-9
      else if (i < 14) col = 2;  // N column: positions 10-13 (only 4 numbers)
      else if (i < 19) col = 3;  // G column: positions 14-18
      else col = 4;              // O column: positions 19-23
      
      const { min, max, name } = columnRanges[col];
      const value = parsed[i];
      if (value < min || value > max) {
        Alert.alert('Invalid Range', `${name} column numbers must be between ${min}-${max}. Found ${value} in position ${i + 1} (${name} column).`);
        return;
      }
    }
    const duplicateArrangement = cards.some(row => row.join(',') === parsed.join(','));
    if (duplicateArrangement) {
      Alert.alert('Duplicate', 'Card with same arrangement already exists.');
      return;
    }
    const newCards = [...cards, parsed];
    setCards(newCards);
    setCsv('');
    
    // Auto-save after adding card
    const isExisting = customCardTypes.some(c => c.name === 'custom');
    if (isExisting) {
      updateCustomCardType({ name: 'custom', cards: newCards });
    } else {
      addCustomCardType({ name: 'custom', cards: newCards });
    }
    selectCardTypeByName('custom');
  };

  const saveManualCard = () => {
    const values = currentManual.map(n => {
      if (n === null) return NaN;
      return Number(n);
    });
    
    if (values.some(v => !Number.isFinite(v))) { 
      Alert.alert('Missing or Invalid', 'Please fill all 24 inputs with valid numbers.'); 
      return; 
    }
    
    // Validate BINGO column ranges
    const columnRanges = [
      { min: 1, max: 15, name: 'B' },   // B column: 1-15
      { min: 16, max: 30, name: 'I' },  // I column: 16-30
      { min: 31, max: 45, name: 'N' },  // N column: 31-45
      { min: 46, max: 60, name: 'G' },  // G column: 46-60
      { min: 61, max: 75, name: 'O' }   // O column: 61-75
    ];
    
    // Check each column's number ranges
    for (let col = 0; col < 5; col++) {
      const { min, max, name } = columnRanges[col];
      for (let row = 0; row < 5; row++) {
        if (row === 2 && col === 2) continue; // Skip center cell
        
        let numberIndex = row * 5 + col;
        if (numberIndex > 12) numberIndex--; // Adjust for center cell
        
        const value = values[numberIndex];
        if (value < min || value > max) {
          Alert.alert('Invalid Range', `${name} column numbers must be between ${min}-${max}. Found ${value} in ${name} column.`);
          return;
        }
      }
    }
    
    if (!isValidCard(values)) { Alert.alert('Invalid', 'Manual card must include exactly 24 different numbers.'); return; }
    const duplicateArrangement = cards.some(row => row.join(',') === values.join(','));
    if (duplicateArrangement && editIndex === null) { Alert.alert('Duplicate', 'Card with same arrangement already exists.'); return; }
    // Save in place if editing
    let newCards;
    if (editIndex !== null) {
      newCards = [...cards];
      newCards[editIndex] = values;
      setCards(newCards);
      setEditIndex(null);
    } else {
      newCards = [...cards, values];
      setCards(newCards);
    }
    setCurrentManual(Array(24).fill(null));
    
    // Auto-save after adding/editing card
    const isExisting = customCardTypes.some(c => c.name === 'custom');
    if (isExisting) {
      updateCustomCardType({ name: 'custom', cards: newCards });
    } else {
      addCustomCardType({ name: 'custom', cards: newCards });
    }
    selectCardTypeByName('custom');
  };

  const removeCard = (index: number) => {
    Alert.alert('Delete card', 'Are you sure you want to delete this card?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => {
        const next = [...cards];
        next.splice(index, 1);
        setCards(next);
        
        // Auto-save after removing card
        const isExisting = customCardTypes.some(c => c.name === 'custom');
        if (isExisting) {
          updateCustomCardType({ name: 'custom', cards: next });
        } else if (next.length > 0) {
          addCustomCardType({ name: 'custom', cards: next });
        }
        if (next.length > 0) {
          selectCardTypeByName('custom');
        }
      }}
    ]);
  };

  const moveCard = (from: number, to: number) => {
    const next = [...cards];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    setCards(next);
    setHighlightedCard(to);
    setTimeout(() => setHighlightedCard(null), 1500);
    
    // Auto-save after moving card
    const isExisting = customCardTypes.some(c => c.name === 'custom');
    if (isExisting) {
      updateCustomCardType({ name: 'custom', cards: next });
    } else {
      addCustomCardType({ name: 'custom', cards: next });
    }
    selectCardTypeByName('custom');
  };

  const canSubmit = cards.length > 0;


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

  const submit = () => {
    if (!canSubmit) { Alert.alert('Missing', 'Add at least one card.'); return; }
    setConfirmVisible(true);
  };

  const renderHeader = () => (
    <View style={[{ padding: 16 }]}>

      {!isWorldBingo && !isAfricaBingo && (
        <View style={[{ backgroundColor: theme.colors.surface, borderRadius: 8, padding: 16 }]}>
          <View style={styles.modeRow}> 
          <TouchableOpacity style={[styles.modeBtn, { backgroundColor: mode === MODE_CSV ? theme.colors.primary : 'transparent', borderColor: mode === MODE_CSV ? theme.colors.primary : 'transparent' }]} onPress={() => setMode(MODE_CSV)}>
            <Text style={{ color: mode === MODE_CSV ? '#fff' : theme.colors.text }}>CSV</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.modeBtn, { backgroundColor: mode === MODE_MANUAL ? theme.colors.primary : 'transparent', borderColor: mode === MODE_MANUAL ? theme.colors.primary : 'transparent' }]} onPress={() => setMode(MODE_MANUAL)}>
            <Text style={{ color: mode === MODE_MANUAL ? '#fff' : theme.colors.text }}>Manual (24 inputs)</Text>
          </TouchableOpacity>
          </View>
        </View>
      )}

      {!isWorldBingo && !isAfricaBingo && (
        mode === MODE_CSV ? (
          <View style={[{ backgroundColor: theme.colors.surface, borderRadius: 8, padding: 16, marginTop: 10 }]}>
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Add card by CSV (24 numbers)</Text>
              <Text style={[styles.rangeHelper, { color: theme.colors.textSecondary }]}>
                B: 1-15, I: 16-30, N: 31-45, G: 46-60, O: 61-75
              </Text>
              <IsolatedCSVInput
                placeholder="11,24,31,... (24 numbers)"
                onValueChange={handleCSVValueChange}
                theme={theme}
              />
              <View style={{ marginTop: 12 }}>
                <Button title="Add Card From CSV" onPress={addFromCsv} />
              </View>
            </View>
          </View>
        ) : (
          <View style={[{ backgroundColor: theme.colors.surface, borderRadius: 8, padding: 16, marginTop:10 }]}>
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Build card manually</Text>
              <Text style={[styles.rangeHelper, { color: theme.colors.textSecondary }]}>
                Enter numbers in correct ranges: B(1-15), I(16-30), N(31-45), G(46-60), O(61-75)
              </Text>
          
          {/* BINGO Header */}
          <View style={styles.bingoHeader}>
            {['B', 'I', 'N', 'G', 'O'].map((letter, index) => (
              <View key={letter} style={[styles.bingoLetterBox, { borderColor: theme.colors.border, backgroundColor: theme.colors.primary }]}>
                <Text style={[styles.bingoLetter, { color: '#fff' }]}>{letter}</Text>
              </View>
            ))}
          </View>
          
          {/* 5x5 Grid */}
          <View style={styles.cardGrid5x5}>
            {Array.from({ length: 5 }).map((_, row) => (
              <View key={row} style={styles.gridRow}>
                {Array.from({ length: 5 }).map((_, col) => {
                  const isCenter = row === 2 && col === 2;
                  
                  if (isCenter) {
                    return (
                      <View key={`${row}-${col}`} style={[styles.gridCell, styles.centerCell, { borderColor: theme.colors.border, backgroundColor: theme.colors.surface }]}>
                        <Text style={[styles.centerText, { color: theme.colors.textSecondary }]}>FREE</Text>
                      </View>
                    );
                  }
                  
                  // Calculate the index in the 24-number array
                  let numberIndex = row * 5 + col;
                  if (numberIndex > 12) numberIndex--; // Adjust for center cell
                  
                  const currentValue = currentManual[numberIndex];
                  const placeholder = col === 0 ? '1-15' : col === 1 ? '16-30' : col === 2 ? '31-45' : col === 3 ? '46-60' : '61-75';
                  
                  return (
                    <IsolatedNumberInput
                      key={`input-${row}-${col}`}
                      index={numberIndex}
                      columnIndex={col}
                      initialValue={currentValue === null ? null : String(currentValue)}
                      placeholder={placeholder}
                      onValueChange={handleInputValueChange}
                      theme={theme}
                    />
                  );
                })}
              </View>
            ))}
          </View>
          
            <Text style={[styles.helper, { color: theme.colors.textSecondary }]}>Filled: {currentManual.filter(n => Number.isFinite(n as number)).length} / 24</Text>
            <View style={{ flexDirection: 'row', justifyContent: 'flex-end' }}>
              <Button title={editIndex !== null ? 'Update Card' : 'Save This Card'} onPress={saveManualCard} />
            </View>
            </View>
          </View>
        )
      )}

      {/* Display Limit Control for World Bingo and Africa Cards */}
      {(isWorldBingo || isAfricaBingo) && (
        <View style={[styles.section, { backgroundColor: theme.colors.surface, borderRadius: 8, padding: 16, marginBottom: 16 }]}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Display Limit</Text>
          <Text style={[styles.sectionDescription, { color: theme.colors.textSecondary, marginBottom: 12 }]}>
            Control how many {isAfricaBingo ? 'Africa Bingo' : 'World Bingo'} cards are displayed to improve performance. Maximum for this card type: {getCardTypeInfo(isAfricaBingo ? 'Africa Bingo' : 'World Bingo', customCardTypes).maxLimit}.
          </Text>
          
          <View style={styles.sliderWithButtonsContainer}>
            <Text style={[styles.sliderTitleLabel, { color: theme.colors.text }]}>
              Display Limit: {tempSliderValue} / {getMaxCardsForSelectedType()} cards
            </Text>
            
            <View style={styles.sliderWithSideButtons}>
              <TouchableOpacity 
                onPress={() => {
                  const newValue = Math.max(1, tempSliderValue - 50);
                  handleSliderChange(newValue);
                }} 
                style={[styles.sliderSideButton, { borderColor: theme.colors.border }]}
              >
                <Text style={[styles.sliderButtonText, { color: theme.colors.text }]}>-</Text>
              </TouchableOpacity>
              
              <Slider
                style={styles.sliderWithButtons}
                minimumValue={1}
                maximumValue={getMaxCardsForSelectedType()}
                value={tempSliderValue}
                onValueChange={handleSliderChange}
                step={1}
                minimumTrackTintColor={theme.colors.primary}
                maximumTrackTintColor={theme.colors.border}
              />
              
              <TouchableOpacity 
                onPress={() => {
                  const newValue = Math.min(getMaxCardsForSelectedType(), tempSliderValue + 50);
                  handleSliderChange(newValue);
                }} 
                style={[styles.sliderSideButton, { borderColor: theme.colors.border }]}
              >
                <Text style={[styles.sliderButtonText, { color: theme.colors.text }]}>+</Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.sliderLabels}>
              <Text style={[styles.sliderEndLabel, { color: theme.colors.textSecondary }]}>1</Text>
              <Text style={[styles.sliderEndLabel, { color: theme.colors.textSecondary }]}>{getMaxCardsForSelectedType()}</Text>
            </View>
            
          </View>
        </View>
      )}


      {/* Search by Number */}
      <View style={[styles.section, { backgroundColor: theme.colors.surface, borderRadius: 8, padding: 16, marginBottom: 16 }]}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Search by Number</Text>
        <Text style={[styles.sectionDescription, { color: theme.colors.textSecondary, marginBottom: 12 }]}>
          Enter a card number to show only that specific card (e.g., enter "23" to show the 23rd card).
        </Text>
        <View style={[styles.searchInputContainer, { 
          backgroundColor: theme.colors.background,
          borderColor: theme.colors.border,
        }]}>
          <TextInput
            style={[styles.searchInputField, { 
              color: theme.colors.text,
            }]}
            placeholder="Enter card number (e.g., 23)"
            placeholderTextColor={theme.colors.textSecondary}
            value={searchNumber}
            onChangeText={(text) => {
              // Only allow numbers
              const numericText = text.replace(/[^0-9]/g, '');
              setSearchNumber(numericText);
            }}
            keyboardType="numeric"
            maxLength={4}
          />
          {searchNumber && (
            <TouchableOpacity
              style={styles.clearIcon}
              onPress={() => setSearchNumber('')}
            >
              <Text style={[styles.clearIconText, { color: theme.colors.textSecondary }]}>×</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

    </View>
  );

  const renderFooter = () => {
    return (
      <View style={{ padding: 16 }}>
        {/* Pagination */}
        {totalPages > 1 && (
          <View style={[styles.paginationContainer, { 
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.border,
            marginBottom: 16
          }]}>
            {/* First Page Button */}
            <TouchableOpacity
              onPress={goToFirstPage}
              disabled={currentPage === 1}
              style={[styles.paginationButton, {
                backgroundColor: currentPage === 1 ? theme.colors.textSecondary + '20' : theme.colors.primary,
                opacity: currentPage === 1 ? 0.5 : 1
              }]}
            >
              <Text style={[styles.paginationButtonText, {
                color: currentPage === 1 ? theme.colors.textSecondary : 'white'
              }]}>≪</Text>
            </TouchableOpacity>

            {/* Previous Button */}
            <TouchableOpacity
              onPress={goToPreviousPage}
              disabled={currentPage === 1}
              style={[styles.paginationButton, {
                backgroundColor: currentPage === 1 ? theme.colors.textSecondary + '20' : theme.colors.primary,
                opacity: currentPage === 1 ? 0.5 : 1
              }]}
            >
              <Text style={[styles.paginationButtonText, {
                color: currentPage === 1 ? theme.colors.textSecondary : 'white'
              }]}>‹</Text>
            </TouchableOpacity>

            {/* Page Numbers */}
            {getVisiblePages().map((pageNum) => (
              <TouchableOpacity
                key={pageNum}
                onPress={() => goToPage(pageNum)}
                style={[styles.paginationButton, {
                  backgroundColor: pageNum === currentPage ? theme.colors.primary : theme.colors.background,
                  borderWidth: 1,
                  borderColor: pageNum === currentPage ? theme.colors.primary : theme.colors.border
                }]}
              >
                <Text style={[styles.paginationButtonText, {
                  color: pageNum === currentPage ? 'white' : theme.colors.text
                }]}>{pageNum}</Text>
              </TouchableOpacity>
            ))}

            {/* Next Button */}
            <TouchableOpacity
              onPress={goToNextPage}
              disabled={currentPage === totalPages}
              style={[styles.paginationButton, {
                backgroundColor: currentPage === totalPages ? theme.colors.textSecondary + '20' : theme.colors.primary,
                opacity: currentPage === totalPages ? 0.5 : 1
              }]}
            >
              <Text style={[styles.paginationButtonText, {
                color: currentPage === totalPages ? theme.colors.textSecondary : 'white'
              }]}>›</Text>
            </TouchableOpacity>

            {/* Last Page Button */}
            <TouchableOpacity
              onPress={goToLastPage}
              disabled={currentPage === totalPages}
              style={[styles.paginationButton, {
                backgroundColor: currentPage === totalPages ? theme.colors.textSecondary + '20' : theme.colors.primary,
                opacity: currentPage === totalPages ? 0.5 : 1
              }]}
            >
              <Text style={[styles.paginationButtonText, {
                color: currentPage === totalPages ? theme.colors.textSecondary : 'white'
              }]}>≫</Text>
            </TouchableOpacity>
          </View>
        )}

      </View>
    );
  };

  const renderSectionHeader = () => (
    <View style={[styles.stickyHeader, { 
      backgroundColor: theme.colors.background,
      borderBottomColor: theme.colors.border,
      paddingHorizontal: 16,
      paddingVertical: 8
    }]}>
      <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
        {isWorldBingo 
          ? searchNumber 
            ? `World Bingo Card ${searchNumber} ${generateLimitedCards.length > 0 ? '(found)' : '(not found)'}`
            : totalPages > 1 
              ? `World Bingo Cards (Page ${currentPage} of ${totalPages}) - ${paginatedCards.length} of ${generateLimitedCards.length} total`
              : `World Bingo Cards (${generateLimitedCards.length} of ${worldBingoCardsLimit} limit)`
          : isAfricaBingo
            ? searchNumber 
              ? `Africa Bingo Card ${searchNumber} ${generateLimitedCards.length > 0 ? '(found)' : '(not found)'}`
              : totalPages > 1 
                ? `Africa Bingo Cards (Page ${currentPage} of ${totalPages}) - ${paginatedCards.length} of ${generateLimitedCards.length} total`
                : `Africa Bingo Cards (${generateLimitedCards.length} of ${worldBingoCardsLimit} limit)`
            : searchNumber
              ? `Card ${searchNumber} ${generateLimitedCards.length > 0 ? '(found)' : '(not found)'}`
              : totalPages > 1
                ? `Cards in this Cartela (Page ${currentPage} of ${totalPages}) - ${paginatedCards.length} of ${cards.length} total`
                : `Cards in this Cartela (${cards.length})`
        }
      </Text>
    </View>
  );

  const renderListHeader = () => (
    <View style={[{ padding: 16, backgroundColor: theme.colors.background }]}>
      <Text style={[styles.title, { color: theme.colors.text }]}>
        {isWorldBingo ? 'World Bingo Cards' : isAfricaBingo ? 'Africa Bingo Cards' : 'Custom Cards'}
      </Text>
      {renderHeader()}
    </View>
  );

  // Prepare data for SectionList
  const sectionData = useMemo(() => {
    return [{
      title: 'cards',
      data: paginatedCards
    }];
  }, [paginatedCards]);

  return (
    <View style={[{ flex: 1, backgroundColor: theme.colors.background }]}>
      <SectionList
        sections={sectionData}
        renderItem={({ item, index }) => renderCard({ item, index })}
        renderSectionHeader={renderSectionHeader}
        keyExtractor={(item, index) => `card-${index}`}
        ListHeaderComponent={renderListHeader}
        ListFooterComponent={renderFooter}
        showsVerticalScrollIndicator={true}
        contentContainerStyle={{ flexGrow: 1 }}
        stickySectionHeadersEnabled={true}
      />
      
      <Modal visible={confirmVisible} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={[{ backgroundColor: theme.colors.surface, borderRadius: 8, padding: 16, width: 280 }]}>
            <View style={styles.modalCard}>
              <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Save cartela?</Text>
              <Text style={{ color: theme.colors.textSecondary, marginBottom: 12 }}>Custom Cards: {cards.length}</Text>
              <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 12 }}>
                <Button title="Cancel" variant="outline" onPress={() => setConfirmVisible(false)} />
                <Button title="Confirm" onPress={() => {
                  const isExisting = customCardTypes.some(c => c.name === 'custom');
                  if (isExisting) {
                    updateCustomCardType({ name: 'custom', cards });
                  } else {
                    addCustomCardType({ name: 'custom', cards });
                  }
                  selectCardTypeByName('custom');
                  setConfirmVisible(false);
                  Alert.alert('Saved', 'Custom cards saved successfully.');
                  navigation.goBack();
                }} />
              </View>
            </View>
          </View>
        </View>
      </Modal>

    </View>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1 
    },
  title: { 
    fontSize: 20, 
    fontWeight: '700', 
    marginBottom: 12 
  },
  section: { 
    padding: 12, 
    marginTop: 12 
  },
  sectionTitle: { fontSize: 16, fontWeight: '600', marginBottom: 8 },
  helper: { marginTop: 6, fontSize: 12 },
  rangeHelper: { fontSize: 12, marginBottom: 8, fontStyle: 'italic' },
  modeRow: { flexDirection: 'row', gap: 8, padding: 6, marginTop: 12 },
  modeBtn: { flex: 1, alignItems: 'center', justifyContent: 'center', height: 40, borderRadius: 8, borderWidth: 1 },
  gridInputs: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  inputBox: { width: 64, height: 44, borderWidth: 1, borderRadius: 8, textAlign: 'center' },
  cardRow: { borderWidth: 1, borderRadius: 10, padding: 12, marginTop: 8, flexDirection: 'column' },
  cardRowHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  cardNumberBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    minWidth: 50,
    alignItems: 'center',
  },
  cardNumberText: {
    fontSize: 14,
    fontWeight: '700',
  },
  cardGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, flex: 1 },
  cardCell: { width: 54, height: 40, borderWidth: 1, borderRadius: 6, alignItems: 'center', justifyContent: 'center' },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
  modalCard: { padding: 16 },
  
  // 5x5 Grid styles
  bingoHeader: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 8,
    gap: 2,
  },
  bingoLetterBox: {
    width: 50,
    height: 32,
    borderWidth: 1,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bingoLetter: {
    fontSize: 16,
    fontWeight: '700',
  },
  cardGrid5x5: {
    alignItems: 'center',
    marginBottom: 12,
  },
  gridRow: {
    flexDirection: 'row',
    gap: 2,
    marginBottom: 2,
  },
  gridCell: {
    width: 50,
    height: 50,
    borderWidth: 1,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '600',
  },
  centerCell: {
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
  },
  centerText: {
    fontSize: 10,
    fontWeight: '700',
  },
  
  // Small card display styles
  bingoLetterBoxSmall: {
    width: 50,
    height: 30,
    borderWidth: 1,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bingoLetterSmall: {
    fontSize: 14,
    fontWeight: '700',
  },
  cardGrid5x5Small: {
    alignItems: 'center',
    marginBottom: 12,
  },
  gridRowSmall: {
    flexDirection: 'row',
    gap: 2,
    marginBottom: 2,
  },
  gridCellSmall: {
    width: 50,
    height: 50,
    borderWidth: 1,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerCellSmall: {
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
  },
  gridCellTextSmall: {
    fontSize: 12,
    fontWeight: '600',
  },
  
  // Display limit and search styles
  sectionDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
  },
  sliderWithButtonsContainer: {
    marginTop: 16,
  },
  sliderTitleLabel: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 12,
    textAlign: 'center',
  },
  sliderWithSideButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  sliderSideButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sliderWithButtons: {
    flex: 1,
    height: 40,
  },
  sliderButtonText: {
    fontSize: 18,
    fontWeight: '700',
  },
  sliderLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
    paddingHorizontal: 8,
  },
  sliderEndLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  warningContainer: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    width: '100%',
    maxWidth: 600,
  },
  warningText: {
    fontSize: 12,
    fontWeight: '500',
  },
  searchInputContainer: {
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  searchInputField: {
    flex: 1,
    fontSize: 16,
    height: '100%',
  },
  clearIcon: {
    paddingLeft: 8,
    paddingVertical: 4,
  },
  clearIconText: {
    fontSize: 20,
    fontWeight: '300',
  },
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    gap: 6,
  },
  paginationButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    minWidth: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  paginationButtonText: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  stickyHeader: {
    borderBottomWidth: 1,
    elevation: 2,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
});

