import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from './ThemeProvider';
import { Button } from './Button';
import { VoiceGender, VoiceLanguage } from '../../types';

interface VoiceSettingsProps {
  gender: VoiceGender;
  language: VoiceLanguage;
  selectedVoiceName: string;
  maleVoiceNames: string[];
  femaleVoiceNames: string[];
  onGenderChange: (gender: VoiceGender) => void;
  onLanguageChange: (language: VoiceLanguage) => void;
  onVoiceNameChange: (name: string) => void;
  onPreview: () => void;
}

export const VoiceSettings: React.FC<VoiceSettingsProps> = ({
  gender,
  language,
  selectedVoiceName,
  maleVoiceNames,
  femaleVoiceNames,
  onGenderChange,
  onLanguageChange,
  onVoiceNameChange,
  onPreview,
}) => {
  const { t } = useTranslation();
  const { theme } = useTheme();

  const renderGenderSelection = () => (
    <View style={styles.settingGroup}>
      <Text style={[styles.settingLabel, { color: theme.colors.text }]}>
        {t('settings.gender')}
      </Text>
      <View style={styles.optionButtons}>
        <TouchableOpacity
          style={[
            styles.optionButton,
            gender === 'male' && { backgroundColor: theme.colors.primary },
            { borderColor: theme.colors.border },
          ]}
          onPress={() => onGenderChange('male')}
        >
          <Text style={styles.genderEmoji}>👨</Text>
          <Text
            style={[
              styles.optionText,
              { color: gender === 'male' ? '#FFFFFF' : theme.colors.text },
            ]}
          >
            {t('settings.male')}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.optionButton,
            gender === 'female' && { backgroundColor: theme.colors.primary },
            { borderColor: theme.colors.border },
          ]}
          onPress={() => onGenderChange('female')}
        >
          <Text style={styles.genderEmoji}>👩</Text>
          <Text
            style={[
              styles.optionText,
              { color: gender === 'female' ? '#FFFFFF' : theme.colors.text },
            ]}
          >
            {t('settings.female')}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderLanguageSelection = () => (
    <View style={styles.settingGroup}>
      <Text style={[styles.settingLabel, { color: theme.colors.text }]}>
        {t('settings.language')}
      </Text>
      <View style={styles.optionButtons}>
        <TouchableOpacity
          style={[
            styles.optionButton,
            language === 'english' && { backgroundColor: theme.colors.primary },
            { borderColor: theme.colors.border },
          ]}
          onPress={() => onLanguageChange('english')}
        >
          <Text style={styles.languageEmoji}>🇺🇸</Text>
          <Text
            style={[
              styles.optionText,
              { color: language === 'english' ? '#FFFFFF' : theme.colors.text },
            ]}
          >
            {t('settings.english')}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.optionButton,
            language === 'amharic' && { backgroundColor: theme.colors.primary },
            { borderColor: theme.colors.border },
          ]}
          onPress={() => onLanguageChange('amharic')}
        >
          <Text style={styles.languageEmoji}>🇪🇹</Text>
          <Text
            style={[
              styles.optionText,
              { color: language === 'amharic' ? '#FFFFFF' : theme.colors.text },
            ]}
          >
            {t('settings.amharic')}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderVoiceNameSelection = () => {
    const voiceNames = gender === 'male' ? maleVoiceNames : femaleVoiceNames;
    
    return (
      <View style={styles.settingGroup}>
        <Text style={[styles.settingLabel, { color: theme.colors.text }]}>
          Voice Name ({gender === 'male' ? 'Male' : 'Female'})
        </Text>
        <View style={styles.voiceNameContainer}>
          {voiceNames.map((name) => (
            <TouchableOpacity
              key={name}
              style={[
                styles.voiceNameButton,
                selectedVoiceName === name && { backgroundColor: theme.colors.primary },
                { borderColor: theme.colors.border },
              ]}
              onPress={() => onVoiceNameChange(name)}
            >
              <Text
                style={[
                  styles.voiceNameText,
                  { color: selectedVoiceName === name ? '#FFFFFF' : theme.colors.text },
                ]}
              >
                {name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  };

  return (
    <View>
            {renderLanguageSelection()}

      {renderGenderSelection()}
      {renderVoiceNameSelection()}
      
      <Button
        title={t('settings.previewVoice')}
        onPress={onPreview}
        variant="outline"
        style={styles.previewButton}
        icon="🔊"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  settingGroup: {
    marginBottom: 20,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 12,
  },
  optionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  optionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    gap: 8,
  },
  optionText: {
    fontSize: 16,
    fontWeight: '500',
  },
  genderEmoji: {
    fontSize: 20,
  },
  languageEmoji: {
    fontSize: 18,
  },
  previewButton: {
    marginTop: 8,
  },
  voiceNameContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  voiceNameButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    borderWidth: 1,
    minWidth: 80,
    alignItems: 'center',
  },
  voiceNameText: {
    fontSize: 14,
    fontWeight: '500',
  },
});