import { Dimensions, StyleSheet } from "react-native";

const { width } = Dimensions.get('window');
export const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginTop: 18
  },
  header: {
    flexDirection: 'column',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginVertical: 8,
  },
  subtitle: {
    textAlign: 'center',
    color: 'gray',
  },
  searchContainer: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10,
  },
  searchInput: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 10,
    backgroundColor: 'white',
    flex: 1,
  },
  numberGrid: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  numberButton: {
    width: width / 5-12,
    height: width / 5-12,
    borderRadius: 8,
    borderColor: 'rgb(1, 150, 63)',
    backgroundColor: '#e7f1ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedNumber: {
    borderColor: 'rgb(1, 150, 63)',
    backgroundColor: 'rgb(1, 150, 63)',
  },
  numberText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#dddd'
  },
  selectedNumberText: {
    color: 'white',
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
    backgroundColor: '#efefef',
    paddingHorizontal: 10,
    borderRadius: 50,
    padding: 5,
  },
  paginationButton: {
    padding: 7,
    borderRadius: 100,
    backgroundColor: '#cfcfcf',
  },
  disabledButton: {
    opacity: 0.3,
  },
  paginationNumber: {
    padding: 10,
    marginHorizontal: 5,
    borderRadius: 8,
  },
  activePaginationNumber: {
    backgroundColor: 'black',
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 100
  },
  paginationText: {
    fontSize: 16,
    color: '#333',
  },
  activePaginationText: {
    color: 'white',
  },
  selectedNumbersButton: {
    backgroundColor: 'white',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 5,
    height: 30,
    width: 30,
    borderWidth: 2,
    borderColor: 'rgb(1, 150, 63)',
    elevation: 5
  },
  selectedNumbersButtonText: {
    fontSize: 16,
    color: 'rgb(1, 150, 63)',
    fontWeight: 'bold',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  bottomSheet: {
    backgroundColor: 'white',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 16,
    maxHeight: Dimensions.get('window').height * 0.7,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  selectedNumberItem: {
    width: width / 5 - 10,
    height: width / 5 - 10,
    margin: 5,
    borderWidth: 2,
    borderRadius: 8,
    borderColor: 'rgb(1, 150, 63)',
    backgroundColor: '#ffebee',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeModalButton: {
    backgroundColor: 'rgb(1, 150, 63)',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  closeModalButtonText: {
    fontSize: 18,
    color: 'white',
    fontWeight: 'bold',
  },
  startButton: {
    backgroundColor: 'rgb(1, 150, 63)',
    padding: 5,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 5,
    elevation: 5
  },
  startButtonText: {
    fontSize: 18,
    color: 'white',
    fontWeight: 'bold',
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,

  },
  codeInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    marginTop: 3,
    paddingHorizontal: 10,
    marginBottom: 10,
    backgroundColor: "#efefef",
    width: 200,
    paddingVertical: 5,
    alignSelf: "flex-end",
    borderRadius: 15,
    borderTopRightRadius: 0,
    elevation: 5
  },
  codeInput: {
    height: 45,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 16,
    backgroundColor: "#fff",
    width: 100,
  },
  submitButton: {
    marginLeft: 5,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  submitButtonText: {
    color: "#4caf50",
    fontSize: 16,
    fontWeight: "bold",
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    elevation: 5,
  },

  modalSubtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 10,
    color: '#333',
  },
});