import React from 'react';
import { TouchableOpacity, TouchableOpacityProps } from 'react-native';
import { audioService } from '../../services/audioService';

interface TouchableWithSoundProps extends TouchableOpacityProps {
  onPress?: () => void;
  enableSound?: boolean;
}

export const TouchableWithSound: React.FC<TouchableWithSoundProps> = ({
  onPress,
  enableSound = true,
  ...props
}) => {
  const handlePress = () => {
    if (enableSound) {
      audioService.playClickSound();
    }
    if (onPress) {
      onPress();
    }
  };

  return (
    <TouchableOpacity
      {...props}
      onPress={handlePress}
    />
  );
};