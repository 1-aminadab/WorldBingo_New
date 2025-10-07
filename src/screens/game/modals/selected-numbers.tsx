import { View, Text, Modal, Animated, TouchableOpacity, FlatList } from 'react-native'
import React from 'react'
import { styles as globalStyles} from '../number-list-style';
import { X } from 'lucide-react-native';

interface modalProp {
    isModalVisible: boolean;
    selectedNumbers: any;
    groupSelectedNumbers: any;
    singleSelectedNumbers: any;
    selectionMode: 'group' | 'single';
    setSelectedNumbers: any;
    setIsModalVisible: any
}
const SelectedNumbersModal:React.FC<modalProp> = ({isModalVisible, selectedNumbers, groupSelectedNumbers, singleSelectedNumbers, selectionMode, setSelectedNumbers, setIsModalVisible}) => {
  return (
    <Modal visible={isModalVisible} animationType="slide" transparent>
    <View style={globalStyles.modalContainer}>
      <View style={globalStyles.bottomSheet}>
        <Text style={globalStyles.modalTitle}>Selected Numbers - {selectionMode === 'group' ? 'Group' : 'Single'}</Text>
        
        {/* Show Group Selected Numbers */}
        {groupSelectedNumbers.length > 0 && (
          <View style={{ marginBottom: 16 }}>
            <Text style={[globalStyles.modalTitle, { fontSize: 16, marginBottom: 8 }]}>Group Mode ({groupSelectedNumbers.length})</Text>
            <FlatList
              data={groupSelectedNumbers}
              keyExtractor={(item) => `group-${item.toString()}`}
              numColumns={4}
              contentContainerStyle={globalStyles.numberGrid}
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) => (
                <View style={[globalStyles.selectedNumberItem, { backgroundColor: '#E3F2FD' }]}>
                  <Text style={[globalStyles.selectedNumberText, {color:'black'}]}>{item}</Text>
                  <TouchableOpacity
                    onPress={() => {
                      if (selectionMode === 'group') {
                        setSelectedNumbers(selectedNumbers.filter((n) => n !== item));
                      }
                    }}
                    disabled={selectionMode !== 'group'}
                  >
                    <X size={20} color={selectionMode === 'group' ? 'rgb(1, 150, 63)' : '#ccc'} />
                  </TouchableOpacity>
                </View>
              )}
            />
          </View>
        )}
        
        {/* Show Single Selected Numbers */}
        {singleSelectedNumbers.length > 0 && (
          <View style={{ marginBottom: 16 }}>
            <Text style={[globalStyles.modalTitle, { fontSize: 16, marginBottom: 8 }]}>Single Mode ({singleSelectedNumbers.length})</Text>
            <FlatList
              data={singleSelectedNumbers}
              keyExtractor={(item) => `single-${item.toString()}`}
              numColumns={4}
              contentContainerStyle={globalStyles.numberGrid}
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) => (
                <View style={[globalStyles.selectedNumberItem, { backgroundColor: '#FFF3E0' }]}>
                  <Text style={[globalStyles.selectedNumberText, {color:'black'}]}>{item}</Text>
                  <TouchableOpacity
                    onPress={() => {
                      if (selectionMode === 'single') {
                        setSelectedNumbers(selectedNumbers.filter((n) => n !== item));
                      }
                    }}
                    disabled={selectionMode !== 'single'}
                  >
                    <X size={20} color={selectionMode === 'single' ? 'rgb(1, 150, 63)' : '#ccc'} />
                  </TouchableOpacity>
                </View>
              )}
            />
          </View>
        )}
        
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