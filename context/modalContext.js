import React, { createContext, useContext, useRef, useState } from 'react';
import { Modalize } from 'react-native-modalize';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native';

const ModalContext = createContext();

export const ModalProvider = ({ children }) => {
  const modalizeRef = useRef(null);
  const [modalContent, setModalContent] = useState({
    title: '',
    message: '',
    isLogin: false,
  });
  const [modalKey, setModalKey] = useState(0);
  const showModal = (title, message, isLogin = false) => {
    setModalContent({ title, message, isLogin });
    setModalKey(prev => prev + 1);

    setTimeout(() => {
      modalizeRef.current?.open();
    }, 100);
  };

  const handleClose = () => {
    modalizeRef.current?.close();
  };

  return (
    <ModalContext.Provider value={{ showModal }}>
      {children}
      <Modalize ref={modalizeRef} adjustToContentHeight>
        <View style={styles.modalContainer}>
          <Text style={styles.icon}>⚠️</Text>
          <Text style={styles.title}>{modalContent.title}</Text>
          <Text style={styles.message}>{modalContent.message}</Text>
        </View>
      </Modalize>
    </ModalContext.Provider>
  );
};

export const useGlobalModal = () => useContext(ModalContext);

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  modalContainer: {
    padding: 24,
    alignItems: 'center',
  },
  icon: {
    fontSize: 36,
    marginBottom: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 12,
  },
  message: {
    fontSize: 16,
    textAlign: 'center',
    color: '#555',
    marginBottom: 24,
  },
  button: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 32,
    minWidth: width * 0.5,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
