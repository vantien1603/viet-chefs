import React, { createContext, useContext, useState, useCallback } from 'react';
import Modal from 'react-native-modal';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { t } from 'i18next';

const ConfirmContext = createContext();

export const ConfirmModalProvider = ({ children }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [modalContent, setModalContent] = useState({
    title: '',
    message: '',
    onConfirm: () => { }
  });

  const showConfirm = useCallback((title, message, onConfirm) => {
    setModalContent({
      title: title || 'Confirm',
      message: message || 'Are you sure?',
      onConfirm: typeof onConfirm === 'function' ? onConfirm : () => { }
    });

    setTimeout(() => {
      setIsVisible(true);
    }, 50);
  }, []);

  const handleConfirm = () => {
    console.log("bam confirm ne");
    const callback = modalContent.onConfirm;
    setIsVisible(false);
    setTimeout(() => {
      if (callback && typeof callback === 'function') {
        callback();
      }
    }, 300);
  };

  const closeModal = () => {
    setIsVisible(false);
  };

  return (
    <ConfirmContext.Provider value={{ showConfirm }}>
      {children}
      <Modal
        isVisible={isVisible}
        onBackButtonPress={closeModal}
        style={styles.modal}
        backdropOpacity={0.5}
        animationIn="slideInUp"
        animationOut="slideOutDown"
        useNativeDriver={true}
        statusBarTranslucent
        backdropTransitionOutTiming={10}
        onBackdropPress={closeModal}
        swipeDirection="down"
        onSwipeComplete={closeModal}

      >
        <View style={styles.modalContent}>
          <View style={styles.indicator} />
          <Text style={styles.title}>{modalContent.title || 'Confirm'}</Text>
          <Text style={styles.message}>{modalContent.message || 'Are you sure?'}</Text>
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.button, styles.cancel]}
              onPress={closeModal}
              activeOpacity={0.7}
            >
              <Text style={styles.cancelText}>{t("cancel")}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.confirm]}
              onPress={handleConfirm}
              activeOpacity={0.7}
            >
              <Text style={styles.confirmText}>{t("confirm")}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ConfirmContext.Provider>
  );
};

export const useConfirmModal = () => useContext(ConfirmContext);

const styles = StyleSheet.create({
  modal: {
    justifyContent: 'flex-end',
    margin: 0,
  },
  modalContent: {
    backgroundColor: 'white',
    padding: 20,
    paddingBottom: 30,
    borderTopLeftRadius: 15,
    borderTopRightRadius: 15,
  },
  indicator: {
    width: 40,
    height: 5,
    backgroundColor: '#DDDDDD',
    borderRadius: 5,
    marginBottom: 16,
    alignSelf: 'center',
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
