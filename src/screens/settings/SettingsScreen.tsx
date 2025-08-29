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
import { Check, Download, Volume2, Trash2 } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { ClassicLineType } from '../../types';

export const SettingsScreen: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { theme } = useTheme();
  const navigation = useNavigation();
  const {
    selectedPattern,
    patternCategory,
    voiceGender,
    voiceLanguage,
    selectedVoiceName,
    maleVoiceNames,
    femaleVoiceNames,
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
    setPattern,
    setPatternCategory,
    setVoiceGender,
    setVoiceLanguage,
    setSelectedVoiceName,
    setAppLanguage,
    setRtpPercentage,
    setTheme,
    setRewardAmount,
    setPlayerBinding,
    setCardTheme,
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
  } = useSettingsStore();

  const [activeTab, setActiveTab] = useState<'classic' | 'modern'>(patternCategory);
  const [tempRewardAmount, setTempRewardAmount] = useState(rewardAmount?.toString() || '');
  const [tempPlayerBinding, setTempPlayerBinding] = useState(playerBinding || '');
  const [isCardModalOpen, setIsCardModalOpen] = useState(false);
  const [newCardName, setNewCardName] = useState('');
  const [csvNumbers, setCsvNumbers] = useState('');
  const [singleNumber, setSingleNumber] = useState('');
  const [currentCardNumbers, setCurrentCardNumbers] = useState<number[]>([]);
  const [tempRtpPercentage, setTempRtpPercentage] = useState(rtpPercentage?.toString() || '');
  const [isEditingRtp, setIsEditingRtp] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [cardToDelete, setCardToDelete] = useState<string | null>(null);
  const callerLanguages = useMemo(() => ['amharic','english','arabic','french'] as const, []);
  const appLanguages = useMemo(() => ['am','en'] as const, []);
  const themeOptions = useMemo(() => ['light','dark','system'] as const, []);
  const cardThemeOptions = useMemo(() => ['default','black_white'] as const, []);
  const isClassicTab = activeTab === 'classic';
  const selectMale = () => setVoiceGender('male');
  const selectFemale = () => setVoiceGender('female');
  const selectDefaultCardName = () => selectCardTypeByName('default');
  const currentVoiceNames = useMemo(
    () => (voiceGender === 'male' ? maleVoiceNames : femaleVoiceNames),
    [voiceGender, maleVoiceNames, femaleVoiceNames]
  );
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

  const handleLanguageChange = (language: string) => {
    const newLang = language as 'en' | 'am';
    setAppLanguage(newLang);
    i18n.changeLanguage(newLang);
  };

  const handleVoicePreview = () => {
    audioManager.setVoiceSettings(voiceGender, voiceLanguage);
    audioManager.previewVoice('B 15');
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

  const handleSaveRtp = () => {
    const percentage = parseFloat(tempRtpPercentage);
    if (!isNaN(percentage) && percentage >= 0 && percentage <= 100) {
      setRtpPercentage(percentage);
      setIsEditingRtp(false);
    } else {
      Alert.alert('Invalid Percentage', 'Please enter a valid RTP percentage between 0-100.');
      setTempRtpPercentage(rtpPercentage?.toString() || '');
    }
  };

  const handleDeleteCard = (cardName: string) => {
    setCardToDelete(cardName);
    setDeleteModalVisible(true);
  };

  const confirmDelete = () => {
    if (cardToDelete) {
      removeCustomCardType(cardToDelete);
      setDeleteModalVisible(false);
      setCardToDelete(null);
    }
  };

  const renderPatternSection = () => (
    <View style={[styles.section, { backgroundColor: theme.colors.card }]}> 
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
            <Text style={[styles.classicStepperTitle, { color: theme.colors.textSecondary }]}>Number of pattern required</Text>
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

  const renderVoiceSection = () => (
    <View style={[styles.section, { backgroundColor: theme.colors.card }]}> 
      <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Bingo caller language</Text>

      {/* Caller language dropdown */}
      <View style={styles.settingItem}>
        <Dropdown
          value={voiceLanguage as any}
          options={["english", "amharic"] as any}
          onChange={(v: any) => setVoiceLanguage(v)}
          getLabel={(v: any) => v.charAt(0).toUpperCase() + v.slice(1)}
        />
      </View>

      {/* Gender tabs */}
      <View style={[styles.tabContainer, { backgroundColor: theme.colors.surface }]}> 
        <TouchableOpacity
          style={[styles.tab, voiceGender === 'male' && { backgroundColor: theme.colors.primary }]}
          onPress={selectMale}
        >
          <Text style={[styles.tabText, { color: voiceGender === 'male' ? '#FFFFFF' : theme.colors.text }]}>Male</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, voiceGender === 'female' && { backgroundColor: theme.colors.primary }]}
          onPress={selectFemale}
        >
          <Text style={[styles.tabText, { color: voiceGender === 'female' ? '#FFFFFF' : theme.colors.text }]}>Women</Text>
        </TouchableOpacity>
      </View>

      {/* Voice list */}
      <View>
        {currentVoiceNames.slice(0,5).map((name) => {
          const isJohn = name === 'John' && voiceGender === 'male';
          const isSelectable = isJohn; // John is selectable for both English and Amharic
          
          return (
            <TouchableOpacity 
              key={name} 
              onPress={() => isSelectable ? setSelectedVoiceName(name) : undefined} 
              style={[styles.voiceRow, { opacity: isSelectable ? 1 : 0.6 }]}
            >
              {/* Selection/Download Icon */}
              {isSelectable ? (
                <View style={[styles.radioOuter, { borderColor: theme.colors.border }]}>
                  {selectedVoiceName === name && <View style={[styles.radioInner, { backgroundColor: theme.colors.primary }]} />}
                </View>
              ) : (
                <View style={styles.downloadIconContainer}>
                  <Download size={20} color={theme.colors.text} />
                </View>
              )}
              
              {/* Voice Name */}
              <Text style={[styles.radioLabel, { color: theme.colors.text, flex: 1 }]}>
                {`${voiceLanguage.charAt(0).toUpperCase()+voiceLanguage.slice(1)} ${name}`}
              </Text>
              
              {/* Voice Preview Icon */}
              <TouchableOpacity 
                onPress={() => {
                  console.log('Voice preview clicked for:', name, voiceGender, voiceLanguage);
                  audioManager.setVoiceSettings(voiceGender, voiceLanguage);
                  audioManager.previewVoice('B 15');
                }}
                style={styles.voicePreviewBtn}
              >
                <Volume2 size={16} color={theme.colors.text} />
              </TouchableOpacity>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );

  const renderAppSettingsSection = () => (
    <View style={[styles.section, { backgroundColor: theme.colors.card }]}>
      <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
        App Settings
      </Text>
    </View>
  );

  const renderRTPSection = () => (
    <View style={[styles.section, { backgroundColor: theme.colors.card }]}> 
      <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>{t('settings.rtp')}</Text>
      <Text style={[styles.sectionDescription, { color: theme.colors.textSecondary }]}>{t('settings.rtpInfo')}</Text>
      
      <View style={styles.rtpRow}>
        <TouchableOpacity onPress={() => useSettingsStore.getState().decreaseRtp()} style={[styles.stepperButton, { borderColor: theme.colors.border }]}>
          <Text style={[styles.stepperButtonText, { color: theme.colors.text }]}>-</Text>
        </TouchableOpacity>
        
        {/* Editable RTP Value */}
        <TouchableOpacity 
          onPress={() => {
            setIsEditingRtp(true);
            setTempRtpPercentage(rtpPercentage?.toString() || '');
          }}
          style={[styles.rtpValuePill, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}
        >
          {isEditingRtp ? (
            <TextInput
              style={[styles.rtpEditInput, { color: theme.colors.text }]}
              value={tempRtpPercentage}
              onChangeText={setTempRtpPercentage}
              onBlur={handleSaveRtp}
              onSubmitEditing={handleSaveRtp}
              keyboardType="numeric"
              autoFocus
              selectTextOnFocus
            />
          ) : (
            <Text style={[styles.rtpValueText, { color: theme.colors.text }]}>{rtpPercentage}%</Text>
          )}
        </TouchableOpacity>
        
        <TouchableOpacity onPress={() => useSettingsStore.getState().increaseRtp()} style={[styles.stepperButton, { borderColor: theme.colors.border }]}>
          <Text style={[styles.stepperButtonText, { color: theme.colors.text }]}>+</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderHostSettingsSection = () => (
    <View style={[styles.section, { backgroundColor: theme.colors.card }]}> 
      <Text style={[styles.sectionTitle, { color: theme.colors.text }]}> 
        🎯 {t('settings.title')}
      </Text>
      <Text style={[styles.sectionDescription, { color: theme.colors.textSecondary }]}> 
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

  const renderLanguageSection = () => (
    <View style={[styles.section, { backgroundColor: theme.colors.card }]}> 
      <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>{t('language')}</Text>
      <View style={styles.settingItem}>
        <Dropdown
          value={appLanguage as any}
          options={["am","en","ar","fr"] as any}
          onChange={(v: any) => handleLanguageChange(v)}
          getLabel={(v: any) => v === 'am' ? 'Amharic' : v === 'en' ? 'English' : v === 'ar' ? 'Arabic' : 'French'}
        />
      </View>
    </View>
  );

  const renderGameThemeSection = () => (
    <View style={[styles.section, { backgroundColor: theme.colors.card }]}> 
      <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>App theme</Text>
      {/* Toggle between Default (System/Light/Dark) vs Black & White */}
      <View style={styles.radioHorizontal}>
        <TouchableOpacity style={styles.radioRow} onPress={() => setCardTheme(THEME_DEFAULT)}> 
          <View style={[styles.radioOuter, { borderColor: theme.colors.border }]}>
            {isDefaultCardTheme && <View style={[styles.radioInner, { backgroundColor: theme.colors.primary }]} />} 
          </View>
          <Text style={[styles.radioLabel, { color: theme.colors.text }]}>Default</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.radioRow} onPress={() => setCardTheme(THEME_BW)}> 
          <View style={[styles.radioOuter, { borderColor: theme.colors.border }]}>
            {isBWCardTheme && <View style={[styles.radioInner, { backgroundColor: theme.colors.primary }]} />} 
          </View>
          <Text style={[styles.radioLabel, { color: theme.colors.text }]}>Black & White</Text>
        </TouchableOpacity>
      </View>

      {/* Show theme previews only when Default is selected */}
      {isDefaultCardTheme && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.themePreviewScroll}>
          {/* System preview (half light, half dark) */}
          <TouchableOpacity onPress={() => setTheme('system')}>
            <View style={[styles.themePreviewCard, { borderColor: themeMode === 'system' ? theme.colors.primary : theme.colors.border, borderWidth: themeMode === 'system' ? 2 : 1 }]}> 
              <View style={styles.systemRow}>
                <View style={[styles.systemHalf, { backgroundColor: '#FFFFFF' }]} />
                <View style={[styles.systemHalf, { backgroundColor: '#1A202C' }]} />
              </View>
              <Text style={styles.themePreviewLabel}>System</Text>
            </View>
          </TouchableOpacity>
          {/* Light preview */}
          <TouchableOpacity onPress={() => setTheme('light')}>
            <View style={[styles.themePreviewCard, { borderColor: themeMode === 'light' ? theme.colors.primary : theme.colors.border, borderWidth: themeMode === 'light' ? 2 : 1 }]}> 
              <View style={[styles.lightPreview]} />
              <Text style={styles.themePreviewLabel}>Light</Text>
            </View>
          </TouchableOpacity>
          {/* Dark preview */}
          <TouchableOpacity onPress={() => setTheme('dark')}>
            <View style={[styles.themePreviewCard, { borderColor: themeMode === 'dark' ? theme.colors.primary : theme.colors.border, borderWidth: themeMode === 'dark' ? 2 : 1 }]}> 
              <View style={[styles.darkPreview]} />
              <Text style={styles.themePreviewLabel}>Dark</Text>
            </View>
          </TouchableOpacity>
        </ScrollView>
      )}
    </View>
  );

  const renderCardTypeSection = () => (
    <View style={[styles.section, { backgroundColor: theme.colors.card }]}> 
      <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Bingo Card Type</Text>
      <View style={styles.radioHorizontal}>
        <TouchableOpacity style={styles.radioRow} onPress={selectDefaultCardName}> 
          <View style={[styles.radioOuter, { borderColor: theme.colors.border }]}>
            {isDefaultCardSelected && <View style={[styles.radioInner, { backgroundColor: theme.colors.primary }]} />}
          </View>
          <Text style={[styles.radioLabel, { color: theme.colors.text }]}>Default</Text>
        </TouchableOpacity>
      </View>
      {customCardTypes.length === 0 && (
        <View style={{ alignItems: 'flex-end', marginTop: 8 }}>
          <Button title="Add New" onPress={() => (navigation as any).navigate('CardTypeEditor', { mode: 'create' })} />
        </View>
      )}
      {customCardTypes.length > 0 && (
        <View style={{ marginTop: 12 }}>
          {customCardTypes.map(c => (
            <View key={c.name} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <TouchableOpacity style={styles.radioRow} onPress={() => selectCardTypeByName(c.name)}>
                <View style={[styles.radioOuter, { borderColor: theme.colors.border }]}>
                  {useSettingsStore.getState().selectedCardTypeName === c.name && <View style={[styles.radioInner, { backgroundColor: theme.colors.primary }]} />}
                </View>
                <Text style={[styles.radioLabel, { color: theme.colors.text }]}>{c.name}</Text>
              </TouchableOpacity>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <Button title="Show" variant="outline" onPress={() => (navigation as any).navigate('CardTypeEditor', { mode: 'manage', name: c.name })} />
                <TouchableOpacity 
                  onPress={() => handleDeleteCard(c.name)}
                  style={[styles.deleteButton, { borderColor: '#dc3545' }]}
                >
                  <Trash2 size={16} color="#dc3545" />
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>
      )}
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {renderLanguageSection()}
        {renderPatternSection()}
        {renderVoiceSection()}
        {renderRTPSection()}
        {renderGameThemeSection()}
        {renderCardTypeSection()}
      </ScrollView>
      
      {/* Delete Confirmation Modal */}
      <Modal visible={deleteModalVisible} transparent animationType="fade" onRequestClose={() => setDeleteModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.colors.card }]}>
            <Text style={[styles.modalTitle, { color: theme.colors.text }]}>Delete Cartela</Text>
            <Text style={[styles.modalMessage, { color: theme.colors.textSecondary }]}>
              Are you sure you want to delete "{cardToDelete}"? This action cannot be undone.
            </Text>
            <View style={styles.modalActions}>
              <TouchableOpacity 
                onPress={() => setDeleteModalVisible(false)}
                style={[styles.modalButton, { backgroundColor: theme.colors.surface }]}
              >
                <Text style={[styles.modalButtonText, { color: theme.colors.text }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                onPress={confirmDelete}
                style={[styles.modalButton, { backgroundColor: '#dc3545' }]}
              >
                <Text style={[styles.modalButtonText, { color: '#fff' }]}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  section: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
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
  checkboxRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  checkboxBox: { width: 24, height: 24, borderRadius: 6, borderWidth: 1 },
  checkboxLabel: { fontSize: 16, fontWeight: '500' },
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
  listRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10 },
  checkIcon: { width: 22, height: 22, borderRadius: 11, borderWidth: 1, alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  listLabel: { fontSize: 16, fontWeight: '500' },
  radioRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  radioOuter: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  radioInner: { width: 10, height: 10, borderRadius: 5 },
  radioLabel: { fontSize: 16 },
  radioHorizontal: { marginTop: 6 },
  rtpRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 8 },
  rtpValuePill: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 18, borderWidth: 1 },
  rtpValueText: { fontWeight: '700' },
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
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
  modalContent: { borderRadius: 12, padding: 16 },
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
  rtpEditInput: {
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
    minWidth: 40,
  },
  deleteButton: {
    width: 40,
    height: 44,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(220, 53, 69, 0.1)',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    textAlign: 'center',
  },
  modalMessage: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 20,
    textAlign: 'center',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
