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
import { router } from "expo-router";




const Setting = () => {
  const { t, i18n } = useTranslation();
  const modalLangRef = useRef(null);
  const modalCountryRef = useRef(null);
  const [selectedLang, setSelectedLang] = useState("vi");
  const [selectedCountry, setSelectedCountry] = useState("my");
  const openModalLang = () => modalLangRef.current?.open();
  const closeModalLang = () => modalLangRef.current?.close();
  const openModalCountry = () => modalCountryRef.current?.open();
  const closeModalCountry = () => modalCountryRef.current?.close();

  const { user, logout } = useContext(AuthContext);

  const selectLanguage = (id) => {
    setSelectedLang(id);
    i18n.changeLanguage(id);
    closeModalLang();
  };
  const selectCountry = (id) => {
    setSelectedCountry(id);
    closeModalCountry();
  };

  return (
    <GestureHandlerRootView style={commonStyles.container}>
      <Header title={'Setting'} />
      <View style={styles.menuCard}>
        <TouchableOpacity
          onPress={() => openModalCountry()}
          style={styles.menuItem}
        // {
        //   flexDirection: 'row',
        //   alignItems: 'center',
        //   paddingVertical: 12,
        //   borderBottomWidth: 1,
        //   borderBottomColor: '#ddd'
        // }
        >
          <Ionicons name='flag-outline' size={24} color="black" style={{ marginRight: 16 }} />
          <Text style={{ flex: 1, fontSize: 16 }}>{t('country')}</Text>
          <View style={{
            backgroundColor: '#FFA500',
            paddingHorizontal: 8,
            borderRadius: 12,
            marginRight: 8
          }}>
            <Text style={{ color: 'white', fontWeight: 'bold' }}>{(selectedCountry == 'my' ? 'American' : 'Việt Nam')}</Text>
          </View>


          <Ionicons name="chevron-forward" size={20} color="gray" />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => openModalLang()}
          style={styles.menuItem}

        >
          <Ionicons name='language' size={24} color="black" style={{ marginRight: 16 }} />
          <Text style={{ flex: 1, fontSize: 16 }}>{t('language')}</Text>
          <View style={{
            backgroundColor: '#FFA500',
            paddingHorizontal: 8,
            borderRadius: 12,
            marginRight: 8
          }}>
            <Text style={{ color: 'white', fontWeight: 'bold' }}>{(selectedLang == 'en' ? 'English' : 'Tiếng Việt')}</Text>
          </View>


          <Ionicons name="chevron-forward" size={20} color="gray" />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.menuItem}

          onPress={logout}
        >
          <Ionicons name='log-out-outline' size={24} color="black" style={{ marginRight: 16 }} />
          <Text style={{ flex: 1, fontSize: 16 }}>{t('logout')}</Text>

          <Ionicons name="chevron-forward" size={20} color="gray" />
        </TouchableOpacity>
      </View>


      <Modalize ref={modalLangRef} adjustToContentHeight>
        <View style={styles.modalContainer}>
          <Text style={styles.title}>Chọn ngôn ngữ</Text>

          <TouchableOpacity
            style={styles.languageItem}
            onPress={() => selectLanguage('vi')}
          >
            <Text style={styles.flag}>🇻🇳</Text>
            <Text style={styles.languageName}>Tiếng Việt</Text>
            {selectedLang === 'vi' && (
              <AntDesign name="check" size={18} color="green" />
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.languageItem}
            onPress={() => selectLanguage('en')}
          >
            <Text style={styles.flag}>🇬🇧</Text>
            <Text style={styles.languageName}>English</Text>
            {selectedLang === 'en' && (
              <AntDesign name="check" size={18} color="green" />
            )}
          </TouchableOpacity>
        </View>
      </Modalize>

      <Modalize ref={modalCountryRef} adjustToContentHeight>
        <View style={styles.modalContainer}>
          <Text style={styles.title}>Chọn quốc gia</Text>

          <TouchableOpacity
            style={styles.languageItem}
            onPress={() => selectCountry('vi')}
          >
            <Text style={styles.flag}>🇻🇳</Text>
            <Text style={styles.languageName}>Tiếng Việt</Text>
            {selectedCountry === 'vi' && (
              <AntDesign name="check" size={18} color="green" />
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.languageItem}
            onPress={() => selectCountry('my')}
          >
            <Text style={styles.flag}>🇬🇧</Text>
            <Text style={styles.languageName}>English</Text>
            {selectedCountry === 'my' && (
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
    fontWeight: "bold",
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
    fontWeight: "600",
  },
  viewProfile: {
    color: "#A9411D",
    marginTop: 4,
    fontWeight: "500",
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
