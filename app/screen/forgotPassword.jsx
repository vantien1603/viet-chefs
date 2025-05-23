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
import useAxios from "../../config/AXIOS_API";
import { useCommonNoification } from "../../context/commonNoti";
import axios from "axios";
import { t } from "i18next";

const ForgotPasswordScreen = () => {
  const [email, setEmail] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const { showModal } = useCommonNoification();
  const handleSend = async () => {
    if (!email) {
      setErrorMessage("Please enter your email");
      return;
    }
    try {
      const response = await AXIOS_BASE.post(`/forgot-password?email=${email}`);
      if (response.status === 200) {
        showModal("Success", "Password reset token sent to your email.", "Success");
        router.push({
          pathname: "/screen/resetPassword",
          params: { email },
        });
        setErrorMessage("");
      }
    } catch (error) {
      if (axios.isCancel(error)) {
        return;
      }
      showModal("Error", "Có lỗi xảy ra trong quá trình gửi mã đặt lại mật khẩu.", "Failed");
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
  },
  textLabel: {
    fontSize: 16,
    alignSelf: "flex-start",
    marginBottom: 5,
    color: "#444",
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
  },
  inputError: {
    borderColor: "red",
  },
  errorText: {
    alignSelf: "flex-start",
    color: "red",
    fontSize: 14,
    marginBottom: 10,
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
    fontWeight: "bold",
    color: "white",
  },
});

export default ForgotPasswordScreen;
