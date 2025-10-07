import React from 'react';
import { TouchableOpacity, StyleSheet } from 'react-native';
import { Pause, Play } from 'lucide-react-native';
import { useGameTheme } from './ThemeProvider';

interface PlayPauseButtonProps {
  paused: boolean;
  bingoFound: boolean;
  onPress: () => void;
  size?: number;
  style?: any;
}

export const PlayPauseButton: React.FC<PlayPauseButtonProps> = ({
  paused,
  bingoFound,
  onPress,
  size = 20,
  style,
}) => {
  const { theme } = useGameTheme();

  const getIcon = () => {
    if (bingoFound) {
      return <Play size={size} color={theme.colors.text} />;
    } else if (paused) {
      return <Play size={size} color={theme.colors.text} />;
    } else {
      return <Pause size={size} color={theme.colors.text} />;
    }
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      style={[
        styles.button,
        {
          borderColor: theme.colors.primary,
          borderWidth: 1,
        },
        style,
      ]}
    >
      {getIcon()}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    height: 40,
    paddingHorizontal: 15,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
