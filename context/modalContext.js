import React, { createContext, useContext, useRef, useState } from 'react';
import { Modalize } from 'react-native-modalize';
import { View, Text, Button } from 'react-native';

const ModalContext = createContext();

export const ModalProvider = ({ children }) => {
  const modalizeRef = useRef(null);
  const [modalContent, setModalContent] = useState({ title: '', message: '', isLogin: false });

  const showModal = (title, message, isLogin = false) => {
    setModalContent({ title, message, isLogin });
    modalizeRef.current?.open();
  };

  return (
    <ModalContext.Provider value={{ showModal }}>
      {children}
      <Modalize ref={modalizeRef} adjustToContentHeight>
        <View style={{ padding: 20 }}>
          <Text style={{ fontSize: 18, fontWeight: 'bold' }}>{modalContent.title}</Text>
          <Text style={{ marginVertical: 10 }}>{modalContent.message}</Text>
          {modalContent.isLogin ? (
            <Button title="Đăng nhập" onPress={() => { modalizeRef.current?.close(); }} />
          ) : (
            <Button title="Đóng" onPress={() => modalizeRef.current?.close()} />
          )}
        </View>
      </Modalize>
    </ModalContext.Provider>
  );
};

export const useGlobalModal = () => useContext(ModalContext);
