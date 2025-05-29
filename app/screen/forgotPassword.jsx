import React, { useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  View,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
} from "react-native";
import { commonStyles } from "../../style";
import Header from "../../components/header";
import { router } from "expo-router";
import AXIOS_BASE from "../../config/AXIOS_BASE";
import { useCommonNoification } from "../../context/commonNoti";
import axios from "axios";
import { t } from "i18next";
import useAxiosBase from "../../config/AXIOS_BASE";

const ForgotPasswordScreen = () => {
  const [email, setEmail] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const { showModal } = useCommonNoification();
  const axiosInstanceBase = useAxiosBase();
  const handleSend = async () => {
    if (!email) {
      setErrorMessage(t("errors.invalidEmail"));
      return;
    }
    console.log("asd", email);

    try {
      const response = await axiosInstanceBase.post(`/forgot-password?email=${email}`);

      if (response.status === 200) {
        showModal(t("modal.success"), t("sendResetTokenSuccess"),);
        router.push({
          pathname: "/screen/resetPassword",
          params: { email },
        });
        setErrorMessage("");
      }
    } catch (error) {
      console.log(error.response);
      if (axios.isCancel(error)) {
        return;
      }
      // showModal(t("modal.error"), t("errors.sendResetTokenFailed"), "Failed");
      showModal(t("modal.error"), error.response.data.message, "Failed");
    }
  };

  return (
    <SafeAreaView style={commonStyles.containerContent}>
      <Header title={t("forgot")} />
      <View style={styles.container}>
        <Text style={styles.description}>
          {t("enterEmailToResetPassword")}
        </Text>
        <Text style={styles.textLabel}>Email</Text>
        <TextInput
          placeholder="example@gmail.com"
          style={[styles.input, errorMessage ? styles.inputError : null]}
          keyboardType="email-address"
          autoCapitalize="none"
          value={email}
          onChangeText={(text) => {
            setEmail(text);
            setErrorMessage(""); // Xóa lỗi khi người dùng nhập lại
          }}
        />
        {errorMessage ? (
          <Text style={styles.errorText}>{errorMessage}</Text>
        ) : null}

        <TouchableOpacity style={styles.button} onPress={handleSend}>
          <Text style={styles.buttonText}>{t("sendCode")}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    alignItems: "center",
  },
  description: {
    fontSize: 16,
    textAlign: "center",
    color: "#666",
    marginBottom: 20,
    paddingHorizontal: 10,
    fontFamily: "nunito-regular"
  },
  textLabel: {
    fontSize: 16,
    alignSelf: "flex-start",
    marginBottom: 5,
    color: "#444",
    fontFamily: "nunito-regular"
  },
  input: {
    height: 50,
    width: "100%",
    borderColor: "#CCCCCC",
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 15,
    backgroundColor: "#f9f9f9",
    fontSize: 16,
    marginBottom: 5,
    fontFamily: "nunito-regular"
  },
  inputError: {
    borderColor: "red",
  },
  errorText: {
    alignSelf: "flex-start",
    color: "red",
    fontSize: 14,
    marginBottom: 10,
    fontFamily: "nunito-regular"
  },
  button: {
    height: 50,
    width: "70%",
    backgroundColor: "#FF7622",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
    marginTop: 10,
  },
  buttonText: {
    fontSize: 18,
    fontFamily: "nunito-bold",
    color: "white",
  },
});

export default ForgotPasswordScreen;
