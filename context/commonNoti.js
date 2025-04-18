import React, { createContext, useContext, useRef, useState } from 'react';
import { Modalize } from 'react-native-modalize';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

const NotiContext = createContext();

export const ModalNotiProvider = ({ children }) => {
  const modalizeRef = useRef(null);
  const [modalContent, setModalContent] = useState({ title: '', message: '', status: '' });

  const showModal = (title, message, status = 'Success') => {
    setModalContent({ title, message, status });
    modalizeRef.current?.open();
  };

  const getStatusStyle = (status) => {
    switch (status) {
      case 'Success':
        return {
          icon: 'check-circle',
          color: '#4CAF50',
        };
      case 'Failed':
        return {
          icon: 'error',
          color: '#F44336',
        };
      case 'Warning':
        return {
          icon: 'warning',
          color: '#FF9800',
        };
      default:
        return {
          icon: 'info',
          color: '#2196F3',
        };
    }
  };

  const { icon, color } = getStatusStyle(modalContent.status);

  return (
    <NotiContext.Provider value={{ showModal }}>
      {children}
      <Modalize ref={modalizeRef} adjustToContentHeight>
        <View style={[styles.container]}>
          <View style={styles.iconContainer}>
            <MaterialIcons name={icon} size={48} color={color} />
          </View>
          <Text style={[styles.title, { color }]}>{modalContent.title}</Text>
          <Text style={styles.message}>{modalContent.message}</Text>
        </View>
      </Modalize>
    </NotiContext.Provider>
  );
};

export const useCommonNoification = () => useContext(NotiContext);

const styles = StyleSheet.create({
  container: {
    padding: 24,
    alignItems: 'center',
  },
  iconContainer: {
    marginBottom: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  message: {
    fontSize: 16,
    textAlign: 'center',
    color: '#444',
  },
});
