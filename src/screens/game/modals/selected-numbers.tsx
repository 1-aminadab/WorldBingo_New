import { View, Text, Modal, TouchableOpacity, FlatList } from 'react-native'
import React from 'react'
import { styles as globalStyles} from '../number-list-style';
import { X } from 'lucide-react-native';
import { useTheme } from '../../../components/ui/ThemeProvider';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

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
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  console.log('SelectedNumbersModal render - isModalVisible:', isModalVisible);
  
  return (
    <Modal visible={isModalVisible} animationType="slide" transparent>
      <View style={globalStyles.modalContainer}>
        <TouchableOpacity 
          style={{ flex: 1 }}
          activeOpacity={1}
          onPress={() => setIsModalVisible(false)}
        />
        <View style={[globalStyles.bottomSheet, { paddingBottom: insets.bottom || 0 }]}>
          {/* Header with title and close button */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <Text style={globalStyles.modalTitle}>Selected Numbers - {selectionMode === 'group' ? 'Group' : 'Single'}</Text>
            <TouchableOpacity
              onPress={() => setIsModalVisible(false)}
              style={{ padding: 8 }}
            >
              <X size={24} color="#333" />
            </TouchableOpacity>
          </View>
        
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
                <View style={[globalStyles.selectedNumberItem, { backgroundColor: '#2196F3' + '20', borderColor: '#2196F3' }]}>
                  <Text style={[globalStyles.selectedNumberText, {color:'black'}]}>{item}</Text>
                  <TouchableOpacity
                    onPress={() => {
                      if (selectionMode === 'group') {
                        setSelectedNumbers(selectedNumbers.filter((n: any) => n !== item));
                      }
                    }}
                    disabled={selectionMode !== 'group'}
                  >
                    <X size={20} color={selectionMode === 'group' ? '#2196F3' : '#ccc'} />
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
                <View style={[globalStyles.selectedNumberItem, { backgroundColor: '#FF9800' + '20', borderColor: '#FF9800' }]}>
                  <Text style={[globalStyles.selectedNumberText, {color:'black'}]}>{item}</Text>
                  <TouchableOpacity
                    onPress={() => {
                      if (selectionMode === 'single') {
                        setSelectedNumbers(selectedNumbers.filter((n: any) => n !== item));
                      }
                    }}
                    disabled={selectionMode !== 'single'}
                  >
                    <X size={20} color={selectionMode === 'single' ? '#FF9800' : '#ccc'} />
                  </TouchableOpacity>
                </View>
              )}
            />
          </View>
        )}
        </View>
      </View>
    </Modal>
  )
}

export default SelectedNumbersModal