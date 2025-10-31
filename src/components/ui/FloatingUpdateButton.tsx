import React, { useState, useRef } from 'react';
import {
  View,
  TouchableOpacity,
  Animated,
  Dimensions,
  StyleSheet,
} from 'react-native';
import { Download } from 'lucide-react-native';
import { useGameTheme } from './ThemeProvider';
import { useVersionStore } from '../../store/versionStore';
import UpdateModal from './UpdateModal';

interface FloatingUpdateButtonProps {
  visible: boolean;
}

export const FloatingUpdateButton: React.FC<FloatingUpdateButtonProps> = ({ visible }) => {
  const { theme } = useGameTheme();
  const { versionInfo, isUpdateAvailable, dismissUpdateModal } = useVersionStore();
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    if (visible) {
      // Animate in
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      // Animate out
      Animated.parallel([
        Animated.timing(scaleAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  const handlePress = () => {
    setShowUpdateModal(true);
  };

  const handleModalClose = () => {
    setShowUpdateModal(false);
    // Don't call any dismiss functions - keep the floating button visible
    // The floating button should remain until update is actually completed
  };

  if (!visible || !versionInfo) {
    return null;
  }

  return (
    <>
      <Animated.View
        style={[
          styles.container,
          {
            opacity: opacityAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        <TouchableOpacity
          style={[
            styles.button,
            {
              backgroundColor: '#1d4ed8', // Beautiful blue color
              shadowColor: '#1d4ed8',
            },
          ]}
          onPress={handlePress}
          activeOpacity={0.8}
        >
          <Download size={24} color="white" />
        </TouchableOpacity>
      </Animated.View>

      {showUpdateModal && (
        <UpdateModal onClose={handleModalClose} />
      )}
    </>
  );
};

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 60, // Below status bar
    right: 20,
    zIndex: 1000,
  },
  button: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
});
