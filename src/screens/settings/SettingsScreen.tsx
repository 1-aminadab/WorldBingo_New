/* eslint-disable react-native/no-raw-text */
import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
  Modal,
  Image,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../components/ui/ThemeProvider';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { useSettingsStore } from '../../store/settingsStore';
import { CLASSIC_PATTERNS, MODERN_PATTERNS } from './patterns';
import { audioManager } from '../../utils/audioManager';
import { PatternCard } from '../../components/ui/PatternCard';
import { Dropdown } from '../../components/ui/Dropdown';
import { Check, Download, Volume2, Mic } from 'lucide-react-native';
import Slider from '@react-native-community/slider';
import { useNavigation } from '@react-navigation/native';
import { ClassicLineType } from '../../types';
import VoiceLanguageSelector from '../../components/ui/VoiceLanguageSelector';

export const SettingsScreen: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { theme } = useTheme();
  const navigation = useNavigation();
  const {
    selectedPattern,
    patternCategory,
    voiceLanguage,
    selectedVoice,
    appLanguage,
    rtpPercentage,
    theme: themeMode,
    rewardAmount,
    playerBinding,
    classicLinesTarget,
    classicSelectedLineTypes,
    cardTheme,
    customCardTypes,
    selectedCardTypeName,
    allowedLateCalls,
    setPattern,
    setPatternCategory,
    setVoiceLanguage,
    setSelectedVoice,
    setAppLanguage,
    setRtpPercentage,
    setTheme,
    setRewardAmount,
    setPlayerBinding,
    setCardTheme,
    setAllowedLateCalls,
    setClassicLinesTarget,
    incrementClassicLinesTarget,
    decrementClassicLinesTarget,
    toggleClassicLineType,
    clearClassicLineTypes,
    selectCardTypeByName,
    addCustomCardType,
    removeCustomCardType,
    clearPattern,
    isGameReadyToStart,
    numberCallingMode,
    setNumberCallingMode,
    gameDuration,
    setGameDuration,
  } = useSettingsStore();

  const [activeTab, setActiveTab] = useState<'classic' | 'modern'>(patternCategory);
  const [tempRewardAmount, setTempRewardAmount] = useState(rewardAmount?.toString() || '');
  const [tempPlayerBinding, setTempPlayerBinding] = useState(playerBinding || '');
  const [isCardModalOpen, setIsCardModalOpen] = useState(false);
  const [newCardName, setNewCardName] = useState('');
  const [csvNumbers, setCsvNumbers] = useState('');
  const [singleNumber, setSingleNumber] = useState('');
  const [currentCardNumbers, setCurrentCardNumbers] = useState<number[]>([]);
  const callerLanguages = useMemo(() => ['amharic','english','arabic','french'] as const, []);
  const appLanguages = useMemo(() => ['am','en'] as const, []);
  const themeOptions = useMemo(() => ['dark'] as const, []);
  const cardThemeOptions = useMemo(() => ['default','black_white'] as const, []);
  const isClassicTab = activeTab === 'classic';
  const selectDefaultCardName = () => selectCardTypeByName('default');
  const isDefaultCardSelected = useMemo(
    () => (!selectedCardTypeName || selectedCardTypeName === 'default'),
    [selectedCardTypeName]
  );
  const THEME_DEFAULT = 'default' as const;
  const THEME_BW = 'black_white' as const;
  const isDefaultCardTheme = cardTheme === THEME_DEFAULT;
  const isBWCardTheme = cardTheme === THEME_BW;
  const FULL_HOUSE = 'full_house' as const;

  const handlePatternCategoryChange = (category: 'classic' | 'modern') => {
    setActiveTab(category);
    setPatternCategory(category);
    clearPattern();
    clearClassicLineTypes();
    setClassicLinesTarget(1);
  };

  const handlePatternSelect = (patternKey: string) => {
    setPattern(patternKey as any);
  };


  const handleVoicePreview = () => {
    audioManager.previewVoice();
  };

  // Classic checkbox row renderer
  const renderClassicCheckbox = (key: ClassicLineType, label: string) => {
    const isChecked = (classicSelectedLineTypes || []).includes(key);
    const disabled = selectedPattern === 'full_house';
    return (
      <TouchableOpacity
        onPress={() => {
          if (disabled) return; // disabled when full house
          toggleClassicLineType(key);
        }}
        disabled={disabled}
        style={[styles.checkboxRow, { opacity: disabled ? 0.5 : 1 }]}
      >
        <View style={[styles.checkIcon, { borderColor: theme.colors.border, backgroundColor: isChecked ? theme.colors.primary : 'transparent' }]}>
          {isChecked && <Check size={16} color="#fff" />}
        </View>
        <Text style={[styles.checkboxLabel, { color: theme.colors.text }]}>{label}</Text>
      </TouchableOpacity>
    );
  };

  const handleSaveRewards = () => {
    const amount = parseFloat(tempRewardAmount);
    if (!isNaN(amount) && amount >= 0) {
      setRewardAmount(amount);
      Alert.alert('Success', 'Reward amount saved successfully!');
    } else {
      Alert.alert('Invalid Amount', 'Please enter a valid reward amount.');
    }
  };

  const handleSaveBinding = () => {
    setPlayerBinding(tempPlayerBinding);
    Alert.alert('Success', 'Player binding saved successfully!');
  };



  const renderPatternSection = () => (
    <View style={[styles.section, { backgroundColor: theme.colors.surface }]}>
      <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
        {t('Pattern Selection Options')}
      </Text>
      

      {/* Tabs */}
      <View style={[styles.tabContainer, { backgroundColor: theme.colors.surface }]}>
        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === 'classic' && { backgroundColor: theme.colors.primary },
          ]}
          onPress={() => handlePatternCategoryChange('classic')}
        >
          <Text
            style={[
              styles.tabText,
              {
                color: activeTab === 'classic' ? '#FFFFFF' : theme.colors.text,
              },
            ]}
          >
            {t('Classic Patterns')}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === 'modern' && { backgroundColor: theme.colors.primary },
          ]}
          onPress={() => handlePatternCategoryChange('modern')}
        >
          <Text
            style={[
              styles.tabText,
              {
                color: activeTab === 'modern' ? '#FFFFFF' : theme.colors.text,
              },
            ]}
          >
            {t('Modern')}
          </Text>
        </TouchableOpacity>
      </View>
      {isClassicTab ? (
        <View>
          {/* Classic lines stepper */}
          <View style={[styles.classicStepperRow, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}> 
            <Text style={[styles.classicStepperTitle, { color: theme.colors.textSecondary }]}>Pattern required</Text>
            <View style={styles.stepperControls}>
              <TouchableOpacity
                onPress={decrementClassicLinesTarget}
                style={[styles.stepperButton, { borderColor: theme.colors.border }]}>
                <Text style={[styles.stepperButtonText, { color: theme.colors.text }]}>-</Text>
              </TouchableOpacity>
              <Text style={[styles.stepperValue, { color: theme.colors.text }]}>{selectedPattern === 'full_house' ? '-' : (classicLinesTarget || 1)}</Text>
              <TouchableOpacity
                onPress={incrementClassicLinesTarget}
                disabled={selectedPattern === 'full_house'}
                style={[styles.stepperButton, { borderColor: theme.colors.border, opacity: selectedPattern === 'full_house' ? 0.5 : 1 }]}
              >
                <Text style={[styles.stepperButtonText, { color: theme.colors.text }]}>+</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Line type checkboxes */}
          {renderClassicCheckbox('horizontal', 'Straight Line – Horizontal')}
          {renderClassicCheckbox('vertical', 'Straight Line – Vertical')}
          {renderClassicCheckbox('diagonal', 'Diagonal (Left to Right or Right to Left)')}
          {renderClassicCheckbox('four_corners', 'Large Corners')}
          {renderClassicCheckbox('small_corners', 'Small Corner')}
          {renderClassicCheckbox('plus', '+ Pattern')}

          {/* Full House toggle */}
          <TouchableOpacity
            onPress={() => {
              if ((selectedPattern as any) === FULL_HOUSE) { clearPattern(); } else { setPattern(FULL_HOUSE as any); }
            }}
            style={[styles.checkboxRow, { opacity: 1 }]}
          >
            <View style={[styles.checkIcon, { borderColor: theme.colors.border, backgroundColor: (selectedPattern as any) === FULL_HOUSE ? theme.colors.primary : 'transparent' }]}>
              {(selectedPattern as any) === FULL_HOUSE && <Check size={16} color="#fff" />}
            </View>
            <Text style={[styles.checkboxLabel, { color: theme.colors.text }]}>Full House (All cells)</Text>
          </TouchableOpacity>

          {selectedPattern === 'full_house' && (
            <Text style={[styles.helperNote, { color: theme.colors.textSecondary }]}>Line count and other options are disabled for Full House.</Text>
          )}
        </View>
      ) : (
        <View style={{ marginTop: 8 }}>
          {MODERN_PATTERNS.map((pattern) => {
            const sel = selectedPattern === pattern.key;
            return (
              <TouchableOpacity key={pattern.key} onPress={() => handlePatternSelect(pattern.key)} style={styles.listRow}>
                <View style={[styles.checkIcon, { borderColor: theme.colors.border, backgroundColor: sel ? theme.colors.primary : 'transparent' }]}>
                  {sel && <Check size={16} color="#fff" />}
                </View>
                <Text style={[styles.listLabel, { color: theme.colors.text }]}>{t(`patterns.${pattern.key}`)}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      )}
    </View>
  );

  const renderNumberCallingSection = () => (
    <View style={[styles.section, { backgroundColor: theme.colors.surface }]}>
      <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Number Calling Mode</Text>
      <Text style={[styles.sectionDescription, { color: theme.colors.textSecondary, marginBottom: 12 }]}>
        Choose how numbers are called during the game
      </Text>
      
      <View style={[styles.tabContainer, { backgroundColor: theme.colors.surface }]}>
        <TouchableOpacity
          style={[
            styles.tab,
            numberCallingMode === 'automatic' && { backgroundColor: theme.colors.primary },
          ]}
          onPress={() => setNumberCallingMode('automatic')}
        >
          <Text
            style={[
              styles.tabText,
              {
                color: numberCallingMode === 'automatic' ? '#FFFFFF' : theme.colors.text,
              },
            ]}
          >
            Automatic
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.tab,
            numberCallingMode === 'manual' && { backgroundColor: theme.colors.primary },
          ]}
          onPress={() => setNumberCallingMode('manual')}
        >
          <Text
            style={[
              styles.tabText,
              {
                color: numberCallingMode === 'manual' ? '#FFFFFF' : theme.colors.text,
              },
            ]}
          >
            Manual
          </Text>
        </TouchableOpacity>
      </View>
      
      <Text style={[styles.helpText, { color: theme.colors.textSecondary }]}>
        {numberCallingMode === 'automatic' 
          ? 'Numbers will be called automatically with a timer' 
          : 'Click the lottery ball to call the next number manually'
        }
      </Text>
      
      {numberCallingMode === 'manual' && (
        <View style={[styles.warningContainer, { backgroundColor: '#FFF3CD', borderColor: '#FFEAA7' }]}>
          <Text style={[styles.warningText, { color: '#856404' }]}>
            ⚠️ Note: Single Player mode will always use automatic calling regardless of this setting.
          </Text>
        </View>
      )}
      
      {numberCallingMode === 'automatic' && (
        <View style={styles.sliderWithButtonsContainer}>
          <Text style={[styles.sliderTitleLabel, { color: theme.colors.text }]}>
            Call Duration: {gameDuration || 10} seconds
          </Text>
          
          <View style={styles.sliderWithSideButtons}>
            <TouchableOpacity 
              onPress={() => setGameDuration(Math.max(3, (gameDuration || 10) - 1))} 
              style={[styles.sliderSideButton, { borderColor: theme.colors.border }]}
            >
              <Text style={[styles.sliderButtonText, { color: theme.colors.text }]}>-</Text>
            </TouchableOpacity>
            
            <Slider
              style={styles.sliderWithButtons}
              minimumValue={3}
              maximumValue={60}
              value={gameDuration || 10}
              onValueChange={setGameDuration}
              step={1}
              minimumTrackTintColor={theme.colors.primary}
              maximumTrackTintColor={theme.colors.border}
            />
            
            <TouchableOpacity 
              onPress={() => setGameDuration(Math.min(60, (gameDuration || 10) + 1))} 
              style={[styles.sliderSideButton, { borderColor: theme.colors.border }]}
            >
              <Text style={[styles.sliderButtonText, { color: theme.colors.text }]}>+</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.sliderLabels}>
            <Text style={[styles.sliderEndLabel, { color: theme.colors.textSecondary }]}>3s</Text>
            <Text style={[styles.sliderEndLabel, { color: theme.colors.textSecondary }]}>60s</Text>
          </View>
        </View>
      )}
    </View>
  );

  const renderVoiceSection = () => (
    <View style={[styles.section, { backgroundColor: theme.colors.surface }]}>
      <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Bingo Caller Voice & Language</Text>
      
      {/* Embedded Voice Language Selector */}
      <View style={styles.voiceContainer}>
        <VoiceLanguageSelector />
      </View>
    </View>
  );

  const renderAppSettingsSection = () => (
    <View style={[styles.section, { backgroundColor: theme.colors.surface }]}>
      <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
        App Settings
      </Text>
    </View>
  );

  const renderRTPSection = () => (
    <View style={[styles.section, { backgroundColor: theme.colors.surface }]}>
      <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>{t('settings.rtp')}</Text>
      <Text style={[styles.sectionDescription, { color: theme.colors.textSecondary, marginBottom: 12 }]}>{t('settings.rtpInfo')}</Text>
      
      <View style={styles.sliderWithButtonsContainer}>
        <Text style={[styles.sliderTitleLabel, { color: theme.colors.text }]}>
          RTP: {rtpPercentage}%
        </Text>
        
        <View style={styles.sliderWithSideButtons}>
          <TouchableOpacity 
            onPress={() => useSettingsStore.getState().decreaseRtp()} 
            style={[styles.sliderSideButton, { borderColor: theme.colors.border }]}
          >
            <Text style={[styles.sliderButtonText, { color: theme.colors.text }]}>-</Text>
          </TouchableOpacity>
          
          <Slider
            style={styles.sliderWithButtons}
            minimumValue={0}
            maximumValue={100}
            value={rtpPercentage || 60}
            onValueChange={setRtpPercentage}
            step={1}
            minimumTrackTintColor={theme.colors.primary}
            maximumTrackTintColor={theme.colors.border}
          />
          
          <TouchableOpacity 
            onPress={() => useSettingsStore.getState().increaseRtp()} 
            style={[styles.sliderSideButton, { borderColor: theme.colors.border }]}
          >
            <Text style={[styles.sliderButtonText, { color: theme.colors.text }]}>+</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.sliderLabels}>
          <Text style={[styles.sliderEndLabel, { color: theme.colors.textSecondary }]}>0%</Text>
          <Text style={[styles.sliderEndLabel, { color: theme.colors.textSecondary }]}>100%</Text>
        </View>
      </View>
    </View>
  );

  const renderBingoCallTimingSection = () => {
    const options = ['off', '0', '1', '2', '3', '4', '5'] as const;
    
    const getLabel = (value: string) => {
      switch (value) {
        case 'off': return 'Off (Unlimited)';
        case '0': return '0 (Immediate Only)';
        case '1': return '1 Ball After';
        case '2': return '2 Balls After';
        case '3': return '3 Balls After';
        case '4': return '4 Balls After';
        case '5': return '5 Balls After';
        default: return value;
      }
    };

    return (
      <View style={[styles.section, { backgroundColor: theme.colors.surface }]}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Bingo Call Timing</Text>
        <Text style={[styles.sectionDescription, { color: theme.colors.textSecondary, marginBottom: 12 }]}>
          Set how many balls after the winning number a player can still call "Bingo!" and be accepted. This prevents delayed calls to see better patterns.
        </Text>
        
        <Dropdown
          value={String(allowedLateCalls) as any}
          options={options as any}
          getLabel={getLabel}
          onChange={(value: string) => {
            if (value === 'off') {
              setAllowedLateCalls('off');
            } else {
              setAllowedLateCalls(parseInt(value));
            }
          }}
        />
        
        <View style={styles.timingExplanation}>
          <Text style={[styles.timingTitle, { color: theme.colors.text }]}>Current Setting:</Text>
          <Text style={[styles.timingDescription, { color: theme.colors.textSecondary }]}>
            {allowedLateCalls === 'off' 
              ? 'Players can call bingo at any time (no time limit)'
              : allowedLateCalls === 0
              ? 'Players must call bingo immediately when their winning number is called'
              : `Players can call bingo up to ${allowedLateCalls} ball${allowedLateCalls !== 1 ? 's' : ''} after their winning number`
            }
          </Text>
        </View>
      </View>
    );
  };

  const renderHostSettingsSection = () => (
    <View style={[styles.section, { backgroundColor: theme.colors.surface }]}>
      <Text style={[styles.sectionTitle, { color: theme.colors.text }]}> 
        🎯 {t('settings.title')}
      </Text>
      <Text style={[styles.sectionDescription, { color: theme.colors.textSecondary, marginBottom: 12 }]}> 
        {t('settings.selectPattern')}
      </Text>

      {/* Reward Amount */}
      <View style={styles.settingItem}>
        <Text style={[styles.settingLabel, { color: theme.colors.text }]}>
          💰 Reward Amount ($)
        </Text>
        <View style={styles.inputWithButton}>
          <TextInput
            style={[styles.rewardInput, { 
              backgroundColor: theme.colors.surface,
              color: theme.colors.text,
              borderColor: theme.colors.border,
            }]}
            placeholder="Enter reward amount..."
            placeholderTextColor={theme.colors.textSecondary}
            value={tempRewardAmount}
            onChangeText={setTempRewardAmount}
            keyboardType="numeric"
          />
          <Button
            title="Save"
            onPress={handleSaveRewards}
            size="sm"
            style={styles.saveButton}
          />
        </View>
        {rewardAmount && (
          <Text style={[styles.currentValue, { color: theme.colors.success }]}>
            Current: ${rewardAmount}
          </Text>
        )}
      </View>

      {/* Player Binding */}
      <View style={styles.settingItem}>
        <Text style={[styles.settingLabel, { color: theme.colors.text }]}>
          👥 Player Binding
        </Text>
        <View style={styles.inputWithButton}>
          <TextInput
            style={[styles.bindingInput, { 
              backgroundColor: theme.colors.surface,
              color: theme.colors.text,
              borderColor: theme.colors.border,
            }]}
            placeholder="Enter player binding ID..."
            placeholderTextColor={theme.colors.textSecondary}
            value={tempPlayerBinding}
            onChangeText={setTempPlayerBinding}
          />
          <Button
            title="Bind"
            onPress={handleSaveBinding}
            size="sm"
            style={styles.saveButton}
          />
        </View>
        {playerBinding && (
          <Text style={[styles.currentValue, { color: theme.colors.success }]}>
            Current: {playerBinding}
          </Text>
        )}
        <Text style={[styles.helpText, { color: theme.colors.textSecondary }]}>
          Bind specific players to track their cards and winnings
        </Text>
      </View>
    </View>
  );

  const renderGameReadyStatus = () => {
    const isReady = isGameReadyToStart();
    
    return (
      <View style={[
        styles.statusSection,
        { backgroundColor: isReady ? theme.colors.success : theme.colors.warning }
      ]}>
        <Text style={styles.statusText}>
          {isReady 
            ? '✅ Ready to host! All settings configured.'
            : '⚠️ Please select a pattern to start hosting.'
          }
        </Text>
        {rewardAmount && (
          <Text style={styles.statusSubtext}>
            Reward: ${rewardAmount} | RTP: {rtpPercentage}%
          </Text>
        )}
      </View>
    );
  };


  const renderGameThemeSection = () => (
    <View style={[styles.section, { backgroundColor: theme.colors.surface }]}>
      <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Game Theme</Text>
      {/* Toggle between Default (Dark) vs Black & White */}
      <View style={styles.radioHorizontal}>
        <TouchableOpacity style={styles.radioRow} onPress={() => setCardTheme(THEME_DEFAULT)}> 
          <View style={[styles.radioOuter, { borderColor: theme.colors.border }]}>
            {isDefaultCardTheme && <View style={[styles.radioInner, { backgroundColor: theme.colors.primary }]} />} 
          </View>
          <Text style={[styles.radioLabel, { color: theme.colors.text }]}>Default (Dark)</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.radioRow} onPress={() => setCardTheme(THEME_BW)}> 
          <View style={[styles.radioOuter, { borderColor: theme.colors.border }]}>
            {isBWCardTheme && <View style={[styles.radioInner, { backgroundColor: theme.colors.primary }]} />} 
          </View>
          <Text style={[styles.radioLabel, { color: theme.colors.text }]}>Black & White</Text>
        </TouchableOpacity>
      </View>

      {/* Theme information for Default selection */}
      {isDefaultCardTheme && (
        <View style={styles.themeInfo}>
          <Text style={[styles.themeInfoText, { color: theme.colors.textSecondary }]}>
            Default theme uses dark colors for optimal gaming experience.
          </Text>
        </View>
      )}
    </View>
  );

  const renderCardTypeSection = () => {
    // Find default and custom card types
    const defaultCardType = customCardTypes.find(c => c.name === 'default');
    const customCardType = customCardTypes.find(c => c.name === 'custom');
    
    // Check if custom cards have any cards in them
    const hasCustomCards = customCardType && customCardType.cards && customCardType.cards.length > 0;
    
    // Determine button text and action based on selected card type
    const getButtonConfig = () => {
      if (selectedCardTypeName === 'default') {
        return {
          title: 'Show World Bingo Cards',
          variant: 'outline' as const,
          onPress: () => (navigation as any).navigate('CardTypeEditor', { mode: 'manage', name: 'default' })
        };
      } else {
        // Custom is selected
        if (hasCustomCards) {
          return {
            title: 'Show Custom Cards',
            variant: 'outline' as const,
            onPress: () => (navigation as any).navigate('CardTypeEditor', { mode: 'manage', name: 'custom' })
          };
        } else {
          return {
            title: 'Create Custom Cards',
            variant: undefined,
            onPress: () => (navigation as any).navigate('CardTypeEditor', { mode: 'create', name: 'custom' })
          };
        }
      }
    };
    
    const buttonConfig = getButtonConfig();
    
    return (
      <View style={[styles.section, { backgroundColor: theme.colors.surface }]}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Bingo Card Type</Text>
        
        {/* World Bingo Cards Option */}
        <View style={styles.radioHorizontal}>
          <TouchableOpacity style={styles.radioRow} onPress={() => selectCardTypeByName('default')}> 
            <View style={[styles.radioOuter, { borderColor: theme.colors.border }]}>
              {selectedCardTypeName === 'default' && <View style={[styles.radioInner, { backgroundColor: theme.colors.primary }]} />}
            </View>
            <Text style={[styles.radioLabel, { color: theme.colors.text }]}>World Bingo</Text>
          </TouchableOpacity>
        </View>
        
        {/* Custom Cards Option */}
        <View style={styles.radioHorizontal}>
          <TouchableOpacity style={styles.radioRow} onPress={() => selectCardTypeByName('custom')}> 
            <View style={[styles.radioOuter, { borderColor: theme.colors.border }]}>
              {selectedCardTypeName === 'custom' && <View style={[styles.radioInner, { backgroundColor: theme.colors.primary }]} />}
            </View>
            <Text style={[styles.radioLabel, { color: theme.colors.text }]}>Custom</Text>
          </TouchableOpacity>
        </View>
        
        {/* Single Show/Create Button */}
        <View style={styles.showButtonsContainer}>
          <Button 
            title={buttonConfig.title}
            variant={buttonConfig.variant}
            onPress={buttonConfig.onPress}
            style={styles.showButton}
          />
        </View>
      </View>
    );
  };


  return (
    <View style={styles.container}>
      <Image 
        source={require('../../assets/images/app-bgaround.png')}
        style={styles.backgroundImage}
        resizeMode="cover"
      />
      <ScrollView 
        contentContainerStyle={styles.scrollContent} 
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Game Configuration Group */}
        {renderPatternSection()}
        {renderNumberCallingSection()}
        <View style={styles.groupSeparator} />
        
        {/* Audio & Voice Group */}
        {renderVoiceSection()}
        <View style={styles.groupSeparator} />
        
        {/* Game Rules Group */}
        {renderRTPSection()}
        {renderBingoCallTimingSection()}
        <View style={styles.groupSeparator} />
        
        {/* Appearance Group */}
        {renderGameThemeSection()}
        <View style={styles.groupSeparator} />
        
        {/* Card Management Group */}
        {renderCardTypeSection()}
      </ScrollView>
      
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backgroundImage: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  scrollContent: {
    flexGrow: 1,
    alignItems: 'center',
    padding: 20,
    paddingBottom: 40,
    paddingTop: 35,
  },
  section: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    width: '100%',
    maxWidth: 600,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
    flexWrap: 'wrap',
  },
  tabContainer: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  tabText: {
    fontSize: 16,
    fontWeight: '600',
  },
  classicStepperRow: {
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  classicStepperTitle: { fontSize: 14, fontWeight: '600' },
  stepperControls: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  stepperButton: { width: 36, height: 36, borderRadius: 18, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  stepperButtonText: { fontSize: 18, fontWeight: '700' },
  stepperValue: { width: 30, textAlign: 'center', fontSize: 16, fontWeight: '700' },
  checkboxRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12, flexWrap: 'wrap' },
  checkboxBox: { width: 24, height: 24, borderRadius: 6, borderWidth: 1 },
  checkboxLabel: { fontSize: 16, fontWeight: '500', flex: 1, flexWrap: 'wrap' },
  helperNote: { fontSize: 12, marginTop: -4, marginBottom: 8 },
  patternGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  selectedPattern: {
    borderRadius: 8,
    padding: 12,
    marginTop: 16,
    alignItems: 'center',
  },
  selectedPatternText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  settingItem: {
    marginBottom: 20,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 12,
  },
  languageButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  languageButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  languageButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  listRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, flexWrap: 'wrap' },
  checkIcon: { width: 22, height: 22, borderRadius: 11, borderWidth: 1, alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  listLabel: { fontSize: 16, fontWeight: '500', flex: 1, flexWrap: 'wrap' },
  radioRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10, flexWrap: 'wrap' },
  radioOuter: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  radioInner: { width: 10, height: 10, borderRadius: 5 },
  radioLabel: { fontSize: 16, flex: 1, flexWrap: 'wrap' },
  radioHorizontal: { marginTop: 6 },
  themeButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  themePickerRow: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  themePreviewBox: { width: 220, height: 100, borderRadius: 8, backgroundColor: '#D9D9D9' },
  themePreviewScroll: { marginTop: 12 },
  themePreviewCard: { width: 180, height: 110, borderRadius: 12, marginRight: 12, padding: 8, borderWidth: 1, backgroundColor: '#F5F5F5', alignItems: 'center', justifyContent: 'center' },
  themePreviewLabel: { marginTop: 6, fontWeight: '600' },
  systemRow: { flexDirection: 'row', width: '100%', height: 70, borderRadius: 8, overflow: 'hidden' },
  systemHalf: { flex: 1 },
  lightPreview: { width: '100%', height: 70, backgroundColor: '#FFFFFF', borderRadius: 8 },
  darkPreview: { width: '100%', height: 70, backgroundColor: '#1A202C', borderRadius: 8 },
  themeButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  themeButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  statusSection: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    alignItems: 'center',
    width: '100%',
    maxWidth: 600,
  },
  statusText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  statusSubtext: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
    marginTop: 4,
    textAlign: 'center',
  },
  inputWithButton: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  rewardInput: {
    flex: 1,
    height: 48,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    fontSize: 16,
  },
  bindingInput: {
    flex: 1,
    height: 48,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    fontSize: 16,
  },
  saveButton: {
    width: 70,
  },
  currentValue: {
    fontSize: 14,
    marginTop: 8,
    fontWeight: '500',
  },
  helpText: {
    fontSize: 12,
    marginTop: 4,
    fontStyle: 'italic',
  },
  warningContainer: {
    marginTop: 8,
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
  voiceRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginBottom: 10,
    paddingRight: 8,
  },
  voicePreviewBtn: {
    padding: 8,
    borderRadius: 6,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  downloadIconContainer: {
    width: 20,
    height: 20,
    marginRight: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sliderLabel: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 12,
    textAlign: 'center',
  },
  slider: {
    width: '100%',
    height: 40,
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
  showButtonsContainer: {
    marginTop: 16,
    gap: 8,
  },
  showButton: {
    width: '100%',
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
  timingExplanation: {
    marginTop: 16,
    padding: 12,
    borderRadius: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  timingTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  timingDescription: {
    fontSize: 13,
    lineHeight: 18,
  },
  dropdown: {
    marginTop: 8,
  },
  themeInfo: {
    marginTop: 12,
    padding: 12,
    borderRadius: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  themeInfoText: {
    fontSize: 14,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  voiceContainer: {
    marginBottom: 12,
  },
  previewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 8,
  },
  previewButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  groupSeparator: {
    height: 6,
    marginVertical: 2,
  },
});
