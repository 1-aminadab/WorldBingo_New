import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { useTheme } from './ThemeProvider';
import { useSettingsStore } from '../../store/settingsStore';
import { VoiceOption, VoiceLanguage } from '../../types';
import { AVAILABLE_VOICES, getVoicesByLanguage, LANGUAGE_DISPLAY_NAMES } from '../../utils/voiceConfig';
import { audioManager } from '../../utils/audioManager';
import { Play, Pause, ChevronDown, ChevronUp } from 'lucide-react-native';

interface VoiceLanguageSelectorProps {
  onSelectionChange?: (language: VoiceLanguage, voice: VoiceOption) => void;
}

const VoiceLanguageSelector: React.FC<VoiceLanguageSelectorProps> = ({
  onSelectionChange,
}) => {
  const { theme } = useTheme();
  const { 
    voiceLanguage, 
    selectedVoice, 
    setVoiceLanguage, 
    setSelectedVoice 
  } = useSettingsStore();
  
  const [isLanguageDropdownOpen, setIsLanguageDropdownOpen] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState<VoiceLanguage>(voiceLanguage);
  const [selectedVoiceId, setSelectedVoiceId] = useState(selectedVoice.id);
  const [activeGenderTab, setActiveGenderTab] = useState<'male' | 'female'>('male');
  const [playingVoiceId, setPlayingVoiceId] = useState<string | null>(null);

  const languages: VoiceLanguage[] = ['amharic', 'english', 'spanish'];

  const handleLanguageSelect = (language: VoiceLanguage) => {
    setSelectedLanguage(language);
    setVoiceLanguage(language);
    setIsLanguageDropdownOpen(false);
    
    // Auto-select first voice for the selected language
    const voicesForLanguage = getVoicesByLanguage(language);
    if (voicesForLanguage.length > 0) {
      const newVoice = voicesForLanguage[0];
      setSelectedVoiceId(newVoice.id);
      setSelectedVoice(newVoice.id);
      audioManager.setVoice(newVoice);
      
      if (onSelectionChange) {
        onSelectionChange(language, newVoice);
      }
    }
  };

  const handleVoiceSelect = (voiceId: string) => {
    setSelectedVoiceId(voiceId);
    setSelectedVoice(voiceId);
    
    const voice = AVAILABLE_VOICES.find(v => v.id === voiceId);
    if (voice) {
      audioManager.setVoice(voice);
      if (onSelectionChange) {
        onSelectionChange(selectedLanguage, voice);
      }
    }
  };

  const handlePreviewVoice = (voiceId: string) => {
    if (playingVoiceId === voiceId) {
      // If this voice is already playing, pause it
      audioManager.stopPreview();
      setPlayingVoiceId(null);
    } else {
      // Stop any currently playing voice and start the new one
      if (playingVoiceId) {
        audioManager.stopPreview();
      }
      audioManager.previewVoiceById(voiceId);
      setPlayingVoiceId(voiceId);
      
      // Set a timeout to reset the playing state when preview ends
      // Assuming preview duration is around 3-5 seconds
      setTimeout(() => {
        setPlayingVoiceId(null);
      }, 4000);
    }
  };

  const selectedLanguageVoices = getVoicesByLanguage(selectedLanguage);
  const maleVoices = selectedLanguageVoices.filter(voice => voice.gender === 'male');
  const femaleVoices = selectedLanguageVoices.filter(voice => voice.gender === 'female');
  
  const hasGenderedVoices = selectedLanguage === 'amharic';

  const renderVoiceItem = (voice: VoiceOption) => {
    const isPlaying = playingVoiceId === voice.id;
    
    return (
      <View key={voice.id} style={styles.voiceItem}>
        <TouchableOpacity
          style={[
            styles.voiceButton,
            {
              backgroundColor: selectedVoiceId === voice.id 
                ? theme.colors.primary 
                : theme.colors.background,
              borderColor: theme.colors.border,
            }
          ]}
          onPress={() => handleVoiceSelect(voice.id)}
        >
          <Text style={[
            styles.voiceName,
            { 
              color: selectedVoiceId === voice.id 
                ? '#fff' 
                : theme.colors.text 
            }
          ]}>
            {hasGenderedVoices ? voice.name : voice.displayName}
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.previewButton, 
            { 
              borderColor: theme.colors.border,
              backgroundColor: isPlaying ? theme.colors.primary : 'transparent'
            }
          ]}
          onPress={() => handlePreviewVoice(voice.id)}
        >
          {isPlaying ? (
            <Pause size={16} color="#fff" />
          ) : (
            <Play size={16} color={theme.colors.primary} />
          )}
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Language Dropdown */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
          Language
        </Text>
        <TouchableOpacity
          style={[
            styles.dropdownButton,
            {
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.border,
            }
          ]}
          onPress={() => setIsLanguageDropdownOpen(!isLanguageDropdownOpen)}
        >
          <Text style={[styles.dropdownText, { color: theme.colors.text }]}>
            {LANGUAGE_DISPLAY_NAMES[selectedLanguage]}
          </Text>
          {isLanguageDropdownOpen ? (
            <ChevronUp size={20} color={theme.colors.text} />
          ) : (
            <ChevronDown size={20} color={theme.colors.text} />
          )}
        </TouchableOpacity>
        
        {isLanguageDropdownOpen && (
          <View style={[styles.dropdownList, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
            {languages.map((language) => (
              <TouchableOpacity
                key={language}
                style={[
                  styles.dropdownItem,
                  {
                    backgroundColor: selectedLanguage === language 
                      ? theme.colors.primary 
                      : 'transparent',
                  }
                ]}
                onPress={() => handleLanguageSelect(language)}
              >
                <Text style={[
                  styles.dropdownItemText,
                  { 
                    color: selectedLanguage === language 
                      ? '#fff' 
                      : theme.colors.text 
                  }
                ]}>
                  {LANGUAGE_DISPLAY_NAMES[language]}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      {/* Voice Selection */}
      <ScrollView style={styles.voicesContainer} showsVerticalScrollIndicator={false}>
        {hasGenderedVoices ? (
          <>
            {/* Gender Tabs */}
            <View style={styles.tabsContainer}>
              <TouchableOpacity
                style={[
                  styles.tab,
                  {
                    backgroundColor: activeGenderTab === 'male' 
                      ? theme.colors.primary 
                      : 'transparent',
                    borderColor: theme.colors.border,
                  }
                ]}
                onPress={() => setActiveGenderTab('male')}
              >
                <Text style={[
                  styles.tabText,
                  { 
                    color: activeGenderTab === 'male' 
                      ? '#fff' 
                      : theme.colors.text 
                  }
                ]}>
                  Male ♂
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.tab,
                  {
                    backgroundColor: activeGenderTab === 'female' 
                      ? theme.colors.primary 
                      : 'transparent',
                    borderColor: theme.colors.border,
                  }
                ]}
                onPress={() => setActiveGenderTab('female')}
              >
                <Text style={[
                  styles.tabText,
                  { 
                    color: activeGenderTab === 'female' 
                      ? '#fff' 
                      : theme.colors.text 
                  }
                ]}>
                  Female ♀
                </Text>
              </TouchableOpacity>
            </View>
            
            {/* Tab Content */}
            <View style={styles.tabContent}>
              {activeGenderTab === 'male' ? (
                maleVoices.map(renderVoiceItem)
              ) : (
                femaleVoices.map(renderVoiceItem)
              )}
            </View>
          </>
        ) : (
          /* Non-gendered voices - just list the sounds */
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
              Available Sounds
            </Text>
            {selectedLanguageVoices.map(renderVoiceItem)}
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  dropdownButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
  },
  dropdownText: {
    fontSize: 16,
    fontWeight: '500',
  },
  dropdownList: {
    position: 'absolute',
    top: 60,
    left: 0,
    right: 0,
    borderRadius: 8,
    borderWidth: 1,
    zIndex: 1000,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  dropdownItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  dropdownItemText: {
    fontSize: 16,
    fontWeight: '500',
  },
  voicesContainer: {
    flex: 1,
  },
  tabsContainer: {
    flexDirection: 'row',
    marginBottom: 16,
    gap: 8,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
  },
  tabContent: {
    flex: 1,
  },
  voiceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  voiceButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
  },
  voiceName: {
    fontSize: 14,
    fontWeight: '500',
  },
  previewButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default VoiceLanguageSelector;