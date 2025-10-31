import React, { useState, useEffect } from 'react';
import { View, Text, Modal, TextInput, TouchableOpacity, StyleSheet, Keyboard } from 'react-native';
import { useGameTheme } from './ThemeProvider';
import { BingoLetter } from '../../types';
import Orientation from 'react-native-orientation-locker';
import { useNavigation } from '@react-navigation/native';
import { ScreenNames } from '../../constants/ScreenNames';
import LottieView from 'lottie-react-native';

interface CheckModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (cardIndex: number) => void;
  canCheck: boolean;
  previewGridNumbers: (number | null)[][] | null;
  previewMatched: boolean[][] | null;
  previewWon: boolean;
  previewError: string | null;
  checkMessage: string | null;
  winningPattern: boolean[][];
  isLandscape: boolean;
}

export const CheckModal: React.FC<CheckModalProps> = ({
  visible,
  onClose,
  onSubmit,
  canCheck,
  previewGridNumbers,
  previewMatched,
  previewWon,
  previewError,
  checkMessage,
  winningPattern,
  isLandscape,
}) => {
  const { theme } = useGameTheme();
  const navigation = useNavigation();
  const [cardIndexText, setCardIndexText] = useState('');
  const [displayedCardNumber, setDisplayedCardNumber] = useState('');

  // Handle orientation changes based on modal visibility and landscape mode
  useEffect(() => {
    if (visible && isLandscape) {
      // Rotate to landscape when modal is visible in landscape mode
      Orientation.lockToLandscape();
    } else if (!visible || !isLandscape) {
      // Return to portrait when modal is closed or not in landscape mode
      Orientation.lockToPortrait();
    }

    // Cleanup function to ensure portrait orientation when component unmounts
    return () => {
      if (!visible) {
        Orientation.lockToPortrait();
      }
    };
  }, [visible, isLandscape]);

  const handleSubmit = () => {
    // Dismiss keyboard when check is clicked
    Keyboard.dismiss();
    
    const cardIndex = parseInt(cardIndexText, 10);
    if (canCheck && cardIndex > 0) {
      setDisplayedCardNumber(cardIndexText);
      onSubmit(cardIndex);
    }
  };

  const handleClose = () => {
    setCardIndexText('');
    setDisplayedCardNumber('');
    onClose();
    // Navigate to PlayerCartelaSelectionScreen
    navigation.getParent()?.navigate(ScreenNames.PLAYER_CARTELA_SELECTION as never);
  };

  const handleContinue = () => {
    setCardIndexText('');
    setDisplayedCardNumber('');
    onClose();
  };

  return (
    <Modal visible={visible} transparent = {!isLandscape} animationType="fade" onRequestClose={handleClose}>
      <View style={[styles.modalBackdrop, { 
        flexDirection: isLandscape ? 'row' : 'column',
        padding: isLandscape ? 0 : 20 
      }]}>
        <View style={[styles.modalCard, { 
          flexDirection: isLandscape ? 'row' : 'column',
          width: isLandscape ? '95%' : '100%',
          maxHeight: isLandscape ? '90%' : 'auto',
          backgroundColor: theme.colors.surface,
          borderRadius: 12,
          padding: 20,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 8,
          elevation: 8,
        }]}>
          {/* Confetti Animation - positioned within modal card behind content */}
          {previewWon && (
            <LottieView
              source={require('../../assets/animations/Confetti.json')}
              autoPlay
              loop={false}
              style={styles.confettiAnimation}
              resizeMode="cover"
            />
          )}
          {/* Left side - Input and controls */}
          <View style={[styles.inputSection, { 
            flex: isLandscape ? 1 : 0,
            marginRight: isLandscape ? 20 : 0,
            marginBottom: isLandscape ? 0 : 16
          }]}>
            <Text style={[styles.modalTitle, { color: theme.colors.text }]}>
              Check Cartela
            </Text>
            <Text style={[styles.modalHelper, { color: theme.colors.textSecondary }]}>
              Enter card number for selected cartela
            </Text>
            {/* Input and Check button on same line */}
            <View style={styles.inputRow}>
              <TextInput
                placeholder="e.g. 3"
                placeholderTextColor={theme.colors.textSecondary}
                keyboardType="number-pad"
                value={cardIndexText}
                onChangeText={(t) => setCardIndexText(t.replace(/[^0-9]/g, ''))}
                style={[styles.modalInput, styles.inputFlex, { borderColor: theme.colors.border, color: theme.colors.text, backgroundColor: theme.colors.background }]}
              />
              <TouchableOpacity 
                onPress={handleSubmit} 
                disabled={!canCheck} 
                style={[styles.checkBtn, { backgroundColor: canCheck ? theme.colors.primary : theme.colors.border }]}
              >
                <Text style={[styles.checkBtnText, { color: canCheck ? '#fff' : theme.colors.textSecondary }]}>
                  Check
                </Text>
              </TouchableOpacity>
            </View>
            
            {checkMessage && (
              <Text style={[styles.modalResult, { color: checkMessage.startsWith('Bingo') ? theme.colors.success : theme.colors.text }]}>
                {checkMessage}
              </Text>
            )}
            
            {/* Exit and Continue buttons */}
            <View style={styles.modalActions}>
              <TouchableOpacity onPress={handleClose} style={[styles.exitBtn, { backgroundColor: '#EF4444', borderColor: '#DC2626', borderWidth: 1 }]}>
                <Text style={[styles.modalBtnText, { color: '#fff' }]}>Exit</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleContinue} style={[styles.continueBtn, { backgroundColor: theme.colors.primary, shadowColor: theme.colors.primary }]}>
                <Text style={[styles.continueBtnText, { color: '#fff' }]}>Continue</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Right side - Card preview */}
          <View style={[styles.previewSection, { 
            flex: isLandscape ? 1 : 0,
            alignItems: 'center'
          }]}>
            {previewGridNumbers ? (
              <View style={styles.cardPreviewContainer}>
                {/* Card number indicator */}
                <View style={[styles.cardNumberIndicator, { backgroundColor: theme.colors.primary }]}>
                  <Text style={styles.cardNumberText}>Card {displayedCardNumber || '?'}</Text>
                </View>
                
                {/* Header letters */}
                <View style={[styles.previewHeaderRow, { 
                  alignSelf: 'center', 
                  width: isLandscape ? 200 : 170,
                  marginBottom: 8
                }]}>
                  {['B', 'I', 'N', 'G', 'O'].map((l) => (
                    <View key={`phc-${l}`} style={[styles.previewHeaderLetterBox, { 
                      borderColor: theme.colors.border,
                      backgroundColor: theme.colors.background,
                      width: isLandscape ? 36 : 30,
                      height: isLandscape ? 28 : 24
                    }]}>
                      <Text style={[styles.previewHeaderLetter, { 
                        color: theme.colors.text,
                        fontSize: isLandscape ? 14 : 12
                      }]}>{l}</Text>
                    </View>
                  ))}
                </View>
                
                {/* Grid */}
                {Array.from({ length: 5 }).map((_, r) => (
                  <View key={`r-${r}`} style={{ flexDirection: 'row', justifyContent: 'center' }}>
                    {Array.from({ length: 5 }).map((__, c) => {
                      const isCenter = r === 2 && c === 2;
                      const value = isCenter ? null : previewGridNumbers[r][c];
                      const isMatch = previewMatched?.[r]?.[c] ?? false;
                      const isWinningCell = winningPattern[r] && winningPattern[r][c];
                      const cellColor = previewWon && isWinningCell ? '#D4AF37' : isMatch ? theme.colors.primary : theme.colors.background;
                      const textColor = isMatch ? '#fff' : theme.colors.text;
                      return (
                        <View key={`c-${c}`} style={[styles.previewCell, { 
                          borderColor: theme.colors.border, 
                          backgroundColor: cellColor,
                          width: isLandscape ? 40 : 34,
                          height: isLandscape ? 40 : 34,
                          margin: isLandscape ? 3 : 2
                        }]}>
                          <Text style={[styles.previewCellText, { 
                            color: textColor,
                            fontSize: isLandscape ? 14 : 12
                          }]}>{isCenter ? '' : value}</Text>
                        </View>
                      );
                    })}
                  </View>
                ))}
              </View>
            ) : (
              <View style={styles.emptyPreview}>
                <Text style={[styles.modalHelper, { color: theme.colors.textSecondary }]}>
                  {previewError ? previewError : 'Card preview will appear here'}
                </Text>
              </View>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalBackdrop: { 
    flex: 1, 
    backgroundColor: 'rgba(0,0,0,0.5)', 
    justifyContent: 'center', 
    alignItems: 'center'
  },
  modalCard: { 
    maxWidth: '100%',
    minHeight: 200,
  },
  inputSection: {
    justifyContent: 'flex-start',
  },
  previewSection: {
    justifyContent: 'center',
  },
  modalTitle: { 
    fontSize: 20, 
    fontWeight: '700', 
    marginBottom: 8,
    textAlign: 'center'
  },
  modalHelper: { 
    fontSize: 14, 
    marginBottom: 12,
    textAlign: 'center'
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 16,
  },
  inputFlex: {
    flex: 1,
    height: 50, 
    borderWidth: 2, 
    borderRadius: 8, 
    paddingHorizontal: 16, 
    fontSize: 16,
    textAlign: 'center',
    textAlignVertical: 'center',
    margin: 0,
    paddingVertical: 0,
  },
  modalInput: { 
    height: 50, 
    borderWidth: 2, 
    borderRadius: 8, 
    paddingHorizontal: 16, 
    marginBottom: 16,
    fontSize: 16,
    textAlign: 'center'
  },
  checkBtn: {
    height: 50,
    paddingHorizontal: 20,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 80,
    borderWidth: 2,
    borderColor: 'transparent',
    display: 'flex',
    flexDirection: 'row',
    margin: 0,
    paddingVertical: 0,
  },
  checkBtnText: {
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
    textAlignVertical: 'center',
  },
  modalActions: { 
    flexDirection: 'row', 
    justifyContent: 'space-between',
    marginTop: 16,
    gap: 12
  },
  exitBtn: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  continueBtn: {
    flex: 2,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 5,
  },
  continueBtnText: {
    fontSize: 18,
    fontWeight: '800',
    textAlign: 'center',
    textAlignVertical: 'center',
  },
  modalResult: { 
    textAlign: 'center', 
    marginBottom: 16, 
    fontWeight: '700',
    fontSize: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8
  },
  modalBtn: { 
    paddingVertical: 14, 
    paddingHorizontal: 24, 
    borderRadius: 8, 
    flex: 1,
    alignItems: 'center'
  },
  modalBtnText: { 
    fontWeight: '700',
    fontSize: 16
  },
  cardPreviewContainer: {
    alignItems: 'center',
    marginTop: 16,
  },
  cardNumberIndicator: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 25,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 5,
  },
  cardNumberText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '800',
    textAlign: 'center',
  },
  emptyPreview: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
    minHeight: 120,
  },
  previewHeaderRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between',
    marginBottom: 12
  },
  previewHeaderLetter: { 
    fontWeight: '800',
    textAlign: 'center'
  },
  previewHeaderLetterBox: {
    borderWidth: 2,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewCell: { 
    borderRadius: 6, 
    borderWidth: 1, 
    alignItems: 'center', 
    justifyContent: 'center'
  },
  previewCellText: { 
    fontWeight: '700',
    textAlign: 'center'
  },
  confettiAnimation: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: -1, // Behind the modal content, not in front
    pointerEvents: 'none', // Allow touches to pass through to modal content
  },
});
