import React, { createContext, useContext, useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import Modal from 'react-native-modal';

const NotiContext = createContext();

export const ModalNotiProvider = ({ children }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [modalContent, setModalContent] = useState({
    title: '',
    message: '',
    status: 'Success',
    onPress: null,
    buttons: null
  });

  const showModal = useCallback((title, message, status = 'Success', onPress = null, buttons = null) => {
    setModalContent({
      title: title || '',
      message: message || '',
      status: status || 'Success',
      onPress: typeof onPress === 'function' ? onPress : null,
      buttons: Array.isArray(buttons) ? buttons : null
    });

    setIsVisible(true);
  }, []);

  const getStatusStyle = (status) => {
    switch (status) {
      case 'Success':
        return { icon: 'check-circle', color: '#4CAF50' };
      case 'Failed':
        return { icon: 'error', color: '#F44336' };
      case 'Warning':
        return { icon: 'warning', color: '#FF9800' };
      default:
        return { icon: 'info', color: '#2196F3' };
    }
  };

  const { icon, color } = getStatusStyle(modalContent.status);

  const handleButtonPress = useCallback(() => {
    const callback = modalContent.onPress;

    setIsVisible(false);

    setTimeout(() => {
      if (callback && typeof callback === 'function') {
        callback();
      }
    }, 300);
  }, [modalContent.onPress]);

  return (
    <NotiContext.Provider value={{ showModal }}>
      {children}
      <Modal
        isVisible={isVisible}
        onBackdropPress={() => setIsVisible(false)}
        onBackButtonPress={() => setIsVisible(false)}
        swipeDirection="down"
        onSwipeComplete={() => setIsVisible(false)}
        style={styles.modal}
        backdropOpacity={0.5}
        animationIn="slideInUp"
        animationOut="slideOutDown"
        useNativeDriver={true}
        statusBarTranslucent
      >
        <View style={styles.modalContent}>
          <View style={styles.indicator} />
          <View style={styles.iconContainer}>
            <MaterialIcons name={icon} size={48} color={color} />
          </View>
          <Text style={[styles.title, { color }]}>{modalContent.title}</Text>
          <Text style={styles.message}>{modalContent.message}</Text>
          {(modalContent.buttons && modalContent.buttons.length > 0) && (
            <View style={styles.buttonGroup}>
              {modalContent.buttons.map((btn, index) => (
                <TouchableOpacity
                  key={index}
                  style={[styles.button, btn.style || {}]}
                  onPress={() => {
                    setIsVisible(false);
                    setTimeout(() => {
                      if (btn.onPress) btn.onPress();
                    }, 300);
                  }}
                >
                  <Text style={styles.buttonText}>{btn.label || 'OK'}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      </Modal>
    </NotiContext.Provider>
  );
};

export const useCommonNoification = () => useContext(NotiContext);

const styles = StyleSheet.create({
  modal: {
    justifyContent: 'flex-end',
    margin: 0,
  },
  modalContent: {
    backgroundColor: 'white',
    padding: 24,
    borderTopLeftRadius: 15,
    borderTopRightRadius: 15,
    alignItems: 'center',
  },
  indicator: {
    width: 40,
    height: 5,
    backgroundColor: '#DDDDDD',
    borderRadius: 5,
    marginBottom: 16,
    alignSelf: 'center',
  },
  iconContainer: {
    marginBottom: 5,
  },
  title: {
    fontSize: 20,
    fontFamily: "nunito-bold",
    textAlign: 'center',
    marginBottom: 8,
  },
  message: {
    fontSize: 14,
    textAlign: 'center',
    color: '#444',
    marginBottom: 16,
    fontFamily: "nunito-regular"
  },
  button: {
    padding: 5,
    // marginTop: 12,
    borderWidth: 1,
    backgroundColor: "#383737",
    borderColor: "#383737",
    borderRadius: 50,
    width: 150,
  },
  buttonText: {
    textAlign: "center",
    fontSize: 18,
    color: "#fff",
    fontFamily: "nunito-bold"
  },
  buttonGroup: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },

});