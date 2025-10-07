import React from 'react';
import { TouchableOpacity, TouchableOpacityProps, Pressable, PressableProps } from 'react-native';
import { audioService } from '../../services/audioService';

interface TouchableWrapperProps extends TouchableOpacityProps {
  onPress?: () => void;
  enableSound?: boolean;
}

interface PressableWrapperProps extends PressableProps {
  onPress?: () => void;
  enableSound?: boolean;
}

/**
 * Enhanced TouchableOpacity that automatically plays click sounds
 */
export const TouchableOpacityWithSound: React.FC<TouchableWrapperProps> = ({
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

/**
 * Enhanced Pressable that automatically plays click sounds
 */
export const PressableWithSound: React.FC<PressableWrapperProps> = ({
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
    <Pressable
      {...props}
      onPress={handlePress}
    />
  );
};

// Export the enhanced TouchableOpacity as the default export
export default TouchableOpacityWithSound;