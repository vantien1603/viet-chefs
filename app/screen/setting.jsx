import React, { useContext, useEffect, useRef, useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, BackHandler } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { commonStyles } from '../../style';
import { Modalize } from "react-native-modalize";
import { AntDesign } from "@expo/vector-icons";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import Header from "../../components/header";
import { AuthContext } from "../../config/AuthContext";
import { useTranslation } from 'react-i18next';
import i18n from '../../i18n';
import * as SecureStore from "expo-secure-store";

const Setting = () => {
  const { t, i18n } = useTranslation();
  const modalLangRef = useRef(null);
  const modalCountryRef = useRef(null);
  const [selectedLang, setSelectedLang] = useState(i18n.language);
  const country = SecureStore.getItem('country');
  const [selectedCountry, setSelectedCountry] = useState(country || "us");
  const [langModalKey, setLangModalKey] = useState(0);
  const [counModalKey, setCounModalKey] = useState(0);

  const openModalLang = () => {
    setLangModalKey(prev => prev + 1);
    setTimeout(() => {
      modalLangRef.current?.open();
    }, 100);
  };
  const closeModalLang = () => modalLangRef.current?.close();
  const openModalCountry = () => {
    setCounModalKey(pre => pre + 1);
    setTimeout(() => {
      modalCountryRef.current?.open()
    }, 100);
  };
  const closeModalCountry = () => modalCountryRef.current?.close();

  const { isGuest, logout } = useContext(AuthContext);
  console.log(i18n.language);
  const selectLanguage = (id) => {
    setSelectedLang(id);
    i18n.changeLanguage(id);
    closeModalLang();
  };
  const selectCountry = (id) => {
    setSelectedCountry(id);
    SecureStore.setItemAsync('country', id);
    closeModalCountry();
  };



  return (
    <GestureHandlerRootView style={commonStyles.container}>
      <Header title={'Setting'} />
      <View style={styles.menuCard}>
        <TouchableOpacity
          onPress={() => openModalCountry()}
          style={styles.menuItem}
        >
          <Ionicons name='flag-outline' size={24} color="black" style={{ marginRight: 16 }} />
          <Text style={{ flex: 1, fontSize: 16 }}>{t('country')}</Text>
          <View style={{
            backgroundColor: '#FFA500',
            paddingHorizontal: 8,
            borderRadius: 12,
            marginRight: 8
          }}>
            <Text style={{ color: 'white', fontWeight: 'bold' ,fontFamily: "nunito-bold"}}>{(selectedCountry == 'us' ? 'American' : 'Việt Nam')}</Text>
          </View>


          <Ionicons name="chevron-forward" size={20} color="gray" />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => openModalLang()}
          style={styles.menuItem}

        >
          <Ionicons name='language' size={24} color="black" style={{ marginRight: 16 }} />
          <Text style={{ flex: 1, fontSize: 16, fontFamily: "nunito-regular" }}>{t('language')}</Text>
          {selectedLang && (
            <>
              <View style={{
                backgroundColor: '#FFA500',
                paddingHorizontal: 8,
                borderRadius: 12,
                marginRight: 8
              }}>
                <Text style={{ color: 'white', fontFamily: "nunito-bold" }}>{(selectedLang == 'en' ? 'English' : selectedLang == 'vi' && 'Tiếng Việt')}</Text>
              </View>
            </>
          )}



          <Ionicons name="chevron-forward" size={20} color="gray" />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.menuItem}

          onPress={logout}
        >
          <Ionicons name='log-out-outline' size={24} color="black" style={{ marginRight: 16 }} />
          <Text style={{ flex: 1, fontSize: 16, fontFamily: "nunito-regular" }}>{isGuest ? (t("login")/t("signup")) : t('logout')}</Text>

          <Ionicons name="chevron-forward" size={20} color="gray" />
        </TouchableOpacity>
      </View>


      <Modalize ref={modalLangRef} adjustToContentHeight key={'country' + langModalKey}>
        <View style={styles.modalContainer}>
          <Text style={styles.title}>{t("selectLanguage")}</Text>

          <TouchableOpacity
            style={styles.languageItem}
            onPress={() => selectLanguage('vi')}
          >
            <Text style={styles.flag}>🇻🇳</Text>
            <Text style={styles.languageName}>{t("vietnamese")}</Text>
            {selectedLang === 'vi' && (
              <AntDesign name="check" size={18} color="green" />
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.languageItem}
            onPress={() => selectLanguage('en')}
          >
            <Text style={styles.flag}>🇺🇸</Text>
            <Text style={styles.languageName}>{t("english")}</Text>
            {selectedLang === 'en' && (
              <AntDesign name="check" size={18} color="green" />
            )}
          </TouchableOpacity>
        </View>
      </Modalize>

      <Modalize ref={modalCountryRef} adjustToContentHeight key={counModalKey}>
        <View style={styles.modalContainer}>
          <Text style={styles.title}>{t("selectCountry")}</Text>

          <TouchableOpacity
            style={styles.languageItem}
            onPress={() => selectCountry('vn')}
          >
            <Text style={styles.flag}>🇻🇳</Text>
            <Text style={styles.languageName}>{t("vietnam")}</Text>
            {selectedCountry === 'vn' && (
              <AntDesign name="check" size={18} color="green" />
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.languageItem}
            onPress={() => selectCountry('us')}
          >
            <Text style={styles.flag}>🇺🇸</Text>
            <Text style={styles.languageName}>{t("america")}</Text>
            {selectedCountry === 'us' && (
              <AntDesign name="check" size={18} color="green" />
            )}
          </TouchableOpacity>
        </View>
      </Modalize>
    </GestureHandlerRootView>
  )
}

export default Setting;

const styles = StyleSheet.create({
  languageButton: {
    backgroundColor: "#ddd",
    padding: 10,
    borderRadius: 5,
  },
  languageText: {
    fontSize: 16,
  },
  modalContainer: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 18,
    fontFamily: "nunito-bold",
    marginBottom: 15,
  },
  languageItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
  },
  flag: {
    fontSize: 22,
    marginRight: 10,
  },
  languageName: {
    flex: 1,
    fontSize: 16,
  },


  card: {
    backgroundColor: "#F9F5F0",
    padding: 16,
    margin: 12,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#ddd",
  },
  userName: {
    fontSize: 18,
    fontFamily: "nunito-bold",
  },
  viewProfile: {
    color: "#A9411D",
    marginTop: 4,
    fontFamily: "nunito-bold",
  },
  menuCard: {
    backgroundColor: "#F9F5F0",
    marginHorizontal: 12,
    marginTop: 8,
    borderRadius: 12,
    overflow: "hidden",
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  iconWrapper: {
    width: 32,
    alignItems: "center",
    marginRight: 12,
  },
  menuText: {
    fontSize: 16,
    flex: 1,
    color: "#333",
  },
});
