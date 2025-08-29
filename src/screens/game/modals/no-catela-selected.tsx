import { View, Text, Modal, Animated, TouchableOpacity } from 'react-native'
import React from 'react'
import { styles as globalStyles} from '../number-list-style';

interface modalProp {
    visible: boolean;
    setNoCartelaModalVisible: (visibility:boolean)=> void;

}
const NoCartelaSelected:React.FC<modalProp> = ({visible, setNoCartelaModalVisible}) => {
  return (
      <Modal
           visible={visible}
           animationType="slide"
           transparent
           onRequestClose={() => setNoCartelaModalVisible(false)}
         >
           <View style={globalStyles.modalOverlay}>
             <View style={globalStyles.modalContent}>
               <Text style={globalStyles.modalTitle}>No Cartela Selected</Text>
               <Text style={globalStyles.modalSubtitle}>
                 Please select at least one cartela to start playing.
               </Text>
               <Text style={globalStyles.modalSubtitle}>
                 እባክዎ መጫወት ለመጀመር ቢያንስ አንድ ካርቴላ ይምረጡ።
               </Text>
               <TouchableOpacity
                 style={globalStyles.closeModalButton}
                 onPress={() => setNoCartelaModalVisible(false)}
               >
                 <Text style={globalStyles.closeModalButtonText}>OK</Text>
               </TouchableOpacity>
             </View>
           </View>
         </Modal>
  )
}

export default NoCartelaSelected