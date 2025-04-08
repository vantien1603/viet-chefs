import React, { createContext, useContext, useRef, useState } from 'react';
import { Modalize } from 'react-native-modalize';
import { View, Text, Button } from 'react-native';

const NotiContext = createContext();

export const ModalNotiProvider = ({ children }) => {
  const modalizeRef = useRef(null);
  const [modalContent, setModalContent] = useState({ title: '', message: '' });

  const showModal = (title, message) => {
    setModalContent({ title, message });
    modalizeRef.current?.open();
  };

  return (
    <NotiContext.Provider value={{ showModal }}>
      {children}
      <Modalize ref={modalizeRef} adjustToContentHeight>
        <View style={{ padding: 20 }}>
          <Text style={{ fontSize: 18, fontWeight: 'bold' }}>{modalContent.title}</Text>
          <Text style={{ marginVertical: 10 }}>{modalContent.message}</Text>
        </View>
      </Modalize>
    </NotiContext.Provider>
  );
};

export const useCommonNoification = () => useContext(NotiContext);
