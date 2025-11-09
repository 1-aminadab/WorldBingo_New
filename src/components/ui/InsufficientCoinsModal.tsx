import React from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Linking,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { Phone, PhoneCall, X } from 'lucide-react-native';
import { useTheme } from './ThemeProvider';
import { handlePhoneCall } from '../../utils/dateUtils';

const { width } = Dimensions.get('window');

interface InsufficientCoinsModalProps {
  visible: boolean;
  requiredAmount: number;
  currentBalance: number;
  onClose: () => void;
  onBuyCoin: () => void;
}

export const InsufficientCoinsModal: React.FC<InsufficientCoinsModalProps> = ({
  visible,
  requiredAmount,
  currentBalance,
  onClose,
  onBuyCoin,
}) => {
  const { theme } = useTheme();
  const shortageAmount = requiredAmount - currentBalance;



  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={[styles.modalContainer, { backgroundColor: theme.colors.card }]}>
          {/* Close Button */}
          <TouchableOpacity
            style={[styles.closeButton, { backgroundColor: theme.colors.background }]}
            onPress={onClose}
          >
            <X size={20} color={theme.colors.text} />
          </TouchableOpacity>

          {/* Icon with Gradient */}
          <LinearGradient
            colors={['#FFD700', '#FFA500']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.iconGradient}
          >
            <Text style={styles.icon}>💰</Text>
          </LinearGradient>

          {/* Title */}
          <Text style={[styles.title, { color: theme.colors.text }]}>
            Insufficient Coins
          </Text>

          {/* Message */}
          <Text style={[styles.message, { color: theme.colors.textSecondary }]}>
            You don't have enough coins to start this game.
          </Text>

          {/* Details Card */}
          <View style={[styles.detailsCard, { backgroundColor: theme.colors.background, borderColor: theme.colors.border }]}>
            <View style={styles.detailRow}>
              <Text style={[styles.detailLabel, { color: theme.colors.textSecondary }]}>
                Required:
              </Text>
              <Text style={[styles.detailValue, { color: '#EF4444' }]}>
                {requiredAmount.toFixed(0)} coins
              </Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={[styles.detailLabel, { color: theme.colors.textSecondary }]}>
                Current Balance:
              </Text>
              <Text style={[styles.detailValue, { color: theme.colors.text }]}>
                {currentBalance.toFixed(0)} coins
              </Text>
            </View>

            <View style={[styles.separator, { backgroundColor: theme.colors.border }]} />

            <View style={styles.detailRow}>
              <Text style={[styles.detailLabel, { color: theme.colors.textSecondary }]}>
                You need:
              </Text>
              <Text style={[styles.detailValue, { color: theme.colors.primary, fontWeight: 'bold' }]}>
                {shortageAmount.toFixed(0)} more coins
              </Text>
            </View>
          </View>

          {/* Suggestion */}
          <Text style={[styles.suggestion, { color: theme.colors.textSecondary }]}>
            💡 Buy more coins and enjoy the game.
          </Text>
          <View style={{marginBottom: 10, gap:10, alignItems:'center'}}>
            <Text style={{ color: 'white' }}>
              እርዳታ ከፈለጉ በዚ ስልክ ይደውሉ
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
              <TouchableOpacity
                onPress={() => handlePhoneCall('0977791828')}
                style={[styles.phoneButton, { borderColor: theme.colors.primary }]}
              >
                <Text style={[styles.phoneText, { color: theme.colors.primary, gap:10 }]}>
                  <Phone color={'white'} size={13}/> {" "}0977791828
                </Text>
              </TouchableOpacity>
              <Text style={{ color: 'white' }}>|</Text>
              <TouchableOpacity
                onPress={() => handlePhoneCall('0940883535')}
                style={[styles.phoneButton, { borderColor: theme.colors.primary }]}
              >
                <Text style={[styles.phoneText, { color: theme.colors.primary }]}>
                <Phone color={'white'} size={13}/> {" "}0940883535
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton, { backgroundColor: theme.colors.background, borderColor: theme.colors.border }]}
              onPress={onClose}
            >
              <Text style={[styles.cancelButtonText, { color: theme.colors.text }]}>
                Cancel
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.buyButton]}
              onPress={onBuyCoin}
            >
              <LinearGradient
                colors={['#4CAF50', '#2E8B57']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.buyButtonGradient}
              >
                <Text style={styles.buyButtonText}>💳 Buy Coins</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    width: width * 0.9,
    maxWidth: 400,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  closeButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  iconGradient: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  icon: {
    fontSize: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  message: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
  },
  detailsCard: {
    width: '100%',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  separator: {
    height: 1,
    width: '100%',
    marginVertical: 8,
  },
  suggestion: {
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 3,
    lineHeight: 18,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  button: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelButton: {
    borderWidth: 2,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  buyButton: {
    overflow: 'hidden',
  },
  buyButtonGradient: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
  },
  buyButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
});

