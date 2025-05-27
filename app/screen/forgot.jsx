import React, { useState } from "react";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { commonStyles } from "../../style";
import Header from "../../components/header";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useRouter } from "expo-router";
import { t } from "i18next";
const ForgotPasswordScreen = () => {
  const router = useRouter();
  const [mail, setMail] = useState();
  const handleForgot = () => {
    router.push({
      pathname: "screen/verify",
      params: { mail, mode: "forgot" },
    });
  };
  return (
    <SafeAreaView style={commonStyles.containerContent}>
      <Header title={t("forgot")} />
      <Text
        style={{
          fontSize: 16,
          paddingVertical: 20,
          fontFamily: "nunito-regular",
        }}
      >
        {t("contactDetails")}
      </Text>
      <View>
        <TouchableOpacity
          style={styles.optionRow}
          onPress={() => router.push("/screen/forgotPassword")}
        >
          <Ionicons name="mail-sharp" size={40} color="#A9411D" />
          <View style={{ marginLeft: 15 }}>
            <Text style={styles.contentText}>{t("viaEmail")}</Text>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Text style={{ fontSize: 40, fontFamily: "nunito-regular" }}>
                •••••••
              </Text>
              <Text style={{ fontSize: 22, fontFamily: "nunito-regular" }}>
                @gmail.com
              </Text>
            </View>
          </View>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  contentText: {
    fontSize: 18,
    fontFamily: "nunito-regular",
  },
  optionRow: {
    borderRadius: 20,
    padding: 10,
    flexDirection: "row",
    backgroundColor: "#FFF8EF",
    alignItems: "center",
    marginBottom: 20,
  },
});

export default ForgotPasswordScreen;
