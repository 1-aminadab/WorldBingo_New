import React, { useState, useCallback, useEffect } from 'react';
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
} from 'react-native';

import { styles as globalStyles } from './number-list-style';
import NoCartelaSelected from './modals/no-catela-selected';
import SelectedNumbersModal from './modals/selected-numbers';
import {useNavigation } from '@react-navigation/native';
import LinearGradient from 'react-native-linear-gradient';
import { Check, GroupIcon, LucideGroup, PersonStanding, X, ArrowLeft, Users, User, Eye } from 'lucide-react-native';
import { useTheme } from '../../components/ui/ThemeProvider';
import { useSettingsStore } from '../../store/settingsStore';

const { width } = Dimensions.get('window');

const PlayerCartelaSelectionScreen = () => {
  const { theme } = useTheme();
  const navigation = useNavigation();
  const { customCardTypes, selectedCardTypeName, rtpPercentage } = useSettingsStore();
 
  const [search, setSearch] = useState('');
  const [selectedArray, setSelectedArray] = useState<number[][]>([]);
  const [filteredArray, setFilteredArray] = useState<{ id: number; data: number[] }[]>([]);
  const [selectedNumbers, setSelectedNumbers] = useState<Set<number | string>>(new Set());
  const [selectionMode, setSelectionMode] = useState<'group' | 'single'>('group');
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [noCartelaModalVisible, setNoCartelaModalVisible] = useState(false);
  const [medebAmount, setMedebAmount] = useState<string>('');

  console.log('Selected Numbers:', Array.from(selectedNumbers));
  console.log('Current Selection Mode:', selectionMode);

  const handleNumberSelect = useCallback((num: any) => {
    setSelectedNumbers((prev) => {
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
  }, [selectionMode]);

  // Populate selectedArray from settings
  useEffect(() => {
    console.log('customCardTypes====================================');
    console.log(customCardTypes);
    console.log('====================================');
    if (customCardTypes.length > 0) {
      // Flatten all cards from all card types into a single array
      const allCards = customCardTypes.flatMap(cardType => cardType.cards);
      setSelectedArray(allCards);
    }
  }, [customCardTypes]);

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
    // Map each card (not individual numbers) for display
    const filtered = selectedArray
      .map((card, index) => ({ id: index + 1, data: card })) // Each item represents a card
      .filter((item) => !search || item.id.toString() === search);
    setFilteredArray(filtered);
  }, [selectedArray, search]);

  const getCurrentSelectedNumbers = useCallback(() => {
    return selectedNumbers;
  }, [selectedNumbers]);

  const getTotalSelectedCount = useCallback(() => {
    return selectedNumbers.size;
  }, [selectedNumbers]);

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
    
    const allUniqueNumbers = selectedNumbers;
    const derashValue = calculateDerashValue();
    
    console.log('Starting game with:');
    console.log('All selections:', Array.from(allUniqueNumbers));
    console.log('Medeb amount:', medeb);
    console.log('Total selections:', totalSelected);
    console.log('Derash value:', derashValue);
    console.log('Selected card type name:', selectedCardTypeName);
    console.log('Custom card types:', customCardTypes);
    
    // Pass selected card numbers and game data to GameScreen
    navigation.navigate('GamePlay' as never, {
      selectedCardNumbers: Array.from(allUniqueNumbers),
      selectionMode: selectionMode,
      medebAmount: medeb,
      derashValue: derashValue,
      totalSelections: totalSelected,
      selectedCardTypeName: selectedCardTypeName,
      customCardTypes: customCardTypes,
    } as never);
  }, [getTotalSelectedCount, medebAmount, selectedNumbers, selectionMode, calculateDerashValue, navigation, selectedCardTypeName, customCardTypes]);
  
  const gradientColors = ['rgba(0, 163, 141, 0.61)', 'rgba(0, 103, 221, 0.63)']

  const renderNumberItem = useCallback(
    ({ item }: { item: any}) => {
      const isSelected = selectedNumbers.has(item);
      
      let backgroundColor = theme.colors.surface;
      if (isSelected) {
        backgroundColor = selectionMode === 'group' ? theme.colors.primary : '#FF9800'; // Primary for group, Orange for single
      }
      
      return (
        <TouchableOpacity activeOpacity={1} onPress={() => handleNumberSelect(item)}>
          <LinearGradient
            colors={gradientColors}
            style={{ padding: 1, borderRadius: 8, margin: 2 }}
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
                  { color: theme.colors.text },
                  isSelected && { color: 'white' },
                  { fontSize: item.toString().length >= 4 ? 19 : 26 },
                ]}
              >
                {item}
              </Text>
            </View>
          </LinearGradient>
        </TouchableOpacity>
      );
    },
    [handleNumberSelect, selectedNumbers, selectionMode, theme]
  );

  
  return (
    <View style={[globalStyles.container, { backgroundColor: theme.colors.background, flex: 1 }]}>
      <View style={{ padding: 2, paddingHorizontal: 16 }}>
        {/* Custom Header with Back Button */}
        <View style={{ 
          flexDirection: 'row', 
          alignItems: 'center', 
          paddingVertical: 12, 
          marginBottom: 8,
          paddingTop: 8
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
            <Image 
              source={require('../../assets/images/world-Bingo-Logo.png')}
              style={{ width: 60, height: 30 }}
              resizeMode="contain"
            />
          </View>
          
          {/* Placeholder to center the title */}
          <View style={{ width: 40 }} />
        </View>

        {/* Search Input and Mode Buttons */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 10 }}>
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
            {selectedNumbers.size > 0 && selectionMode === 'group' && (
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
                  {selectedNumbers.size}
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
            {selectedNumbers.size > 0 && selectionMode === 'single' && (
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
                  {selectedNumbers.size}
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
            {getCurrentSelectedNumbers().size > 0 && (
              <View style={{
                position: 'absolute',
                top: -5,
                right: -5,
                backgroundColor: selectionMode === 'group' ? theme.colors.primary : '#FF9800',
                borderRadius: 12,
                minWidth: 18,
                height: 18,
                alignItems: 'center',
                justifyContent: 'center',
                paddingHorizontal: 2,
              }}>
                <Text style={{ fontSize: 10, fontWeight: 'bold', color: 'white' }}>
                  {getCurrentSelectedNumbers().size}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

      </View>
      
      {/* Scrollable Numbers Grid */}
      <View style={{ flex: 1, marginBottom: 12, paddingHorizontal: 16 }}>
          <FlatList
            data={filteredArray}
            keyExtractor={(item) => item.id.toString()}
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
            showsVerticalScrollIndicator={false}
            initialNumToRender={20}
            maxToRenderPerBatch={20}
            windowSize={10}
            renderItem={({ item }) => renderNumberItem({ item: item.id })}
          />
      </View>

      <SelectedNumbersModal
        isModalVisible={isModalVisible}
        selectedNumbers={Array.from(getCurrentSelectedNumbers())}
        setSelectedNumbers={(newNumbers: any) => {
          setSelectedNumbers(new Set(newNumbers));
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
        backgroundColor: theme.colors.surface,
        borderTopWidth: 1,
        borderTopColor: theme.colors.border,
      }}>
        <Text style={{ fontSize: 14, fontWeight: '600', color: theme.colors.text, marginBottom: 8, textAlign: 'center' }}>
          Medeb Amount (ETB):
        </Text>
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