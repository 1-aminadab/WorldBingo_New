import React from 'react';
import { TouchableOpacity, StyleSheet } from 'react-native';
import { PowerCircle } from 'lucide-react-native';

interface EndGameButtonProps {
  onPress: () => void;
  size?: number;
  style?: any;
  
}

export const EndGameButton: React.FC<EndGameButtonProps> = ({
  onPress,
  size = 20,
  style,
}) => {
  const handlePress = () => {
    console.log('🛑 END GAME BUTTON PRESSED - Ending game...');
    onPress();
  };

  return (
    <TouchableOpacity
      onPress={handlePress}
      style={[styles.button, style]}
    >
      <PowerCircle size={size} color={'red'} />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor:'red',
  },
});
