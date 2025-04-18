import React, { createContext, useContext, useRef, useState } from 'react';
import { Modalize } from 'react-native-modalize';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

const ConfirmContext = createContext();

export const ConfirmModalProvider = ({ children }) => {
  const modalRef = useRef(null);
  const [modalContent, setModalContent] = useState({
    title: '',
    message: '',
    onConfirm: () => {}
  });

  const showConfirm = (title, message, onConfirm) => {
    setModalContent({ title, message, onConfirm });
    modalRef.current?.open();
  };

  const handleConfirm = () => {
    modalRef.current?.close();
    modalContent.onConfirm && modalContent.onConfirm();
  };

  return (
    <ConfirmContext.Provider value={{ showConfirm }}>
      {children}
      <Modalize ref={modalRef} adjustToContentHeight closeOnOverlayTap={false}>
        <View style={styles.container}>
          <Text style={styles.title}>{modalContent.title || 'Confirm'}</Text>
          <Text style={styles.message}>{modalContent.message || 'Are you sure?'}</Text>
          <View style={styles.buttonContainer}>
            <TouchableOpacity style={[styles.button, styles.cancel]} onPress={() => modalRef.current?.close()}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.button, styles.confirm]} onPress={handleConfirm}>
              <Text style={styles.confirmText}>Confirm</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modalize>
    </ConfirmContext.Provider>
  );
};

export const useConfirmModal = () => useContext(ConfirmContext);

const styles = StyleSheet.create({
  container: {
    padding: 20,
    paddingBottom: 30
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center'
  },
  message: {
    fontSize: 16,
    color: '#333',
    marginBottom: 20,
    textAlign: 'center'
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around'
  },
  button: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginLeft: 10
  },
  cancel: {
    backgroundColor: '#ccc'
  },
  confirm: {
    backgroundColor: '#e74c3c'
  },
  cancelText: {
    color: '#333'
  },
  confirmText: {
    color: '#fff'
  }
});
