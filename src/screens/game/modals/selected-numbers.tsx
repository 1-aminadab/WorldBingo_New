import { View, Text, Modal, Animated, TouchableOpacity, FlatList } from 'react-native'
import React from 'react'
import { styles as globalStyles} from '../number-list-style';
import { X } from 'lucide-react-native';

interface modalProp {
    isModalVisible: boolean;
    selectedNumbers: any;
    setSelectedNumbers: any;
    setIsModalVisible: any
}
const SelectedNumbersModal:React.FC<modalProp> = ({isModalVisible, selectedNumbers, setSelectedNumbers, setIsModalVisible}) => {
  return (
    <Modal visible={isModalVisible} animationType="slide" transparent>
    <View style={globalStyles.modalContainer}>
      <View style={globalStyles.bottomSheet}>
        <Text style={globalStyles.modalTitle}>Selected Numbers</Text>
        <FlatList
          data={selectedNumbers}
          keyExtractor={(item) => item.toString()}
          numColumns={4}
          contentContainerStyle={globalStyles.numberGrid}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <View style={globalStyles.selectedNumberItem}>
              <Text style={[globalStyles.selectedNumberText, {color:'black'}]}>{item}</Text>
              <TouchableOpacity

                onPress={() =>
                  setSelectedNumbers(selectedNumbers.filter((n) => n !== item))
                }
              >
                <X size={20} color='rgb(1, 150, 63)' />
              </TouchableOpacity>
            </View>
          )}
        />
        <TouchableOpacity
          style={globalStyles.closeModalButton}
          onPress={() => setIsModalVisible(false)}
        >
          <Text style={globalStyles.closeModalButtonText}>Close</Text>
        </TouchableOpacity>
      </View>
    </View>
  </Modal>
  )
}

export default SelectedNumbersModal