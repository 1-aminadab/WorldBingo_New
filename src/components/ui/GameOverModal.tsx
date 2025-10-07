import React from 'react';
import { View, Text, Modal, TouchableOpacity, StyleSheet } from 'react-native';
import { useGameTheme } from './ThemeProvider';


interface GameOverModalProps {
  visible: boolean;
  onClose: () => void;
  onSummary: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  visible,
  onClose,
  onSummary,
}) => {
  const { theme } = useGameTheme();

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalBackdrop}>
        <View style={[{ backgroundColor: theme.colors.surface, borderRadius: 8, padding: 16 }]}>
          <Text style={[styles.modalTitle, { color: theme.colors.text }]}>Game Over</Text>
          <Text style={[styles.modalHelper, { color: theme.colors.textSecondary }]}>
            All 75 numbers have been drawn.
          </Text>
          <View style={styles.modalActions}>
            <TouchableOpacity onPress={onClose} style={[styles.modalBtn, { backgroundColor: theme.colors.surface }]}>
              <Text style={styles.modalBtnText}>Close</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={onSummary} style={[styles.modalBtn, { backgroundColor: theme.colors.primary }]}>
              <Text style={[styles.modalBtnText, { color: '#fff' }]}>Summary</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalBackdrop: { 
    flex: 1, 
    backgroundColor: 'rgba(0,0,0,0.45)', 
    justifyContent: 'center', 
    alignItems: 'center', 
    padding: 20 
  },
  modalCard: { 
    alignSelf: 'center'
  },
  modalTitle: { 
    fontSize: 18, 
    fontWeight: '700', 
    marginBottom: 6 
  },
  modalHelper: { 
    fontSize: 12, 
    marginBottom: 10 
  },
  modalActions: { 
    flexDirection: 'row', 
    justifyContent: 'space-between' 
  },
  modalBtn: { 
    paddingVertical: 12, 
    paddingHorizontal: 20, 
    borderRadius: 10, 
    minWidth: 80, 
    alignItems: 'center' 
  },
  modalBtnText: { 
    fontWeight: '700' 
  },
});
