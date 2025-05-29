import React, { useState, useRef } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from "react-native";
import Header from "../../components/header";
import { router, useLocalSearchParams } from "expo-router";
import AXIOS_BASE from "../../config/AXIOS_BASE";
import axios from "axios";
import { useCommonNoification } from "../../context/commonNoti";
import { t } from "i18next";
import useAxiosBase from "../../config/AXIOS_BASE";

const ResetPasswordScreen = () => {
  const [loading, setLoading] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [code, setCode] = useState(["", "", "", ""]);
  const inputRefs = useRef([]);
  const { email } = useLocalSearchParams();
  const { showModal } = useCommonNoification();
  const axiosInstanceBase = useAxiosBase();
  const handleInputChange = (value, index) => {
    if (/^\d?$/.test(value)) {
      const newCode = [...code];
      newCode[index] = value;
      setCode(newCode);

      if (value !== "" && index < code.length - 1) {
        inputRefs.current[index + 1].focus();
      }
    }
  };

  const handleKeyPress = (e, index) => {
    if (e.nativeEvent.key === "Backspace" && index > 0 && code[index] === "") {
      inputRefs.current[index - 1].focus();
    }
  };

  const handleReset = async () => {
    if (!newPassword || !confirmPassword) {
      showModal(t("modal.error"), t("errors.emptyPassword"), "Failed");
      return;
    }

    if (newPassword !== confirmPassword) {
      showModal(
        t("modal.error"),
        t("errors.passwordMismatch"),
        "Failed"
      );
      return;
    }

    const token = code.join("");

    if (token.length !== 4) {
      showModal(
        t("modal.error"),
        t("errors.invalidToken"),
        "Failed"
      );

      return;
    }
    console.log("Sending data:", { email, newPassword, token });
    setLoading(true);

    try {
      const response = await axiosInstanceBase.post("/reset-password", {
        email,
        newPassword,
        token,
      });

      if (response.status === 200) {
        showModal(t("modal.success"),
          t("resetPasswordSuccess"),
        );

        router.push("/screen/login");
      }
    } catch (error) {
      if (error.response?.status === 401) {
        return;
      }
      if (axios.isCancel(error)) {
        return;
      }
      showModal(
        t("modal.error"),
        // t("errors.resetPasswordFailed"),
        error.response.data.message,
        "Failed"
      );
    } finally {
      setLoading(false)
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Header title={t("resetPassword")} />
      <Text style={styles.description}>
        {t("wehaveSentACodeToYourEmail")}
        <Text style={{ fontFamily: "nunito-bold" }}>{email}</Text>
      </Text>
      <View style={styles.content}>
        <Text style={styles.label}>{t("newPass")}</Text>
        <TextInput
          style={styles.input}
          placeholder={t("enterNewPass")}
          secureTextEntry
          value={newPassword}
          onChangeText={setNewPassword}
        />

        <Text style={styles.label}>{t("confirmNewPass")}</Text>
        <TextInput
          style={styles.input}
          placeholder={t("confirmNewPass")}
          secureTextEntry
          value={confirmPassword}
          onChangeText={setConfirmPassword}
        />

        <Text style={styles.label}>{t("token")}</Text>
        <View style={styles.inputCodeContainer}>
          {code.map((digit, index) => (
            <TextInput
              key={index}
              ref={(el) => (inputRefs.current[index] = el)}
              style={styles.codeBox}
              value={digit}
              onChangeText={(value) => handleInputChange(value, index)}
              onKeyPress={(e) => handleKeyPress(e, index)}
              keyboardType="numeric"
              maxLength={1}
              autoFocus={index === 0}
            />
          ))}
        </View>

        <TouchableOpacity disabled={loading} style={styles.button} onPress={handleReset}>
          {loading ? (<ActivityIndicator size={'small'} />) : (
            <Text style={styles.buttonText}>{t("resetPassword")}</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
    padding: 20,
  },
  content: {
    marginTop: 20,
  },
  description: {
    fontSize: 18,
    textAlign: "center",
    color: "#666",
    marginBottom: 20,
    paddingHorizontal: 10,
    fontFamily: "nunito-regular"
  },
  label: {
    fontSize: 16,
    fontFamily: "nunito-bold",
    marginBottom: 5,
  },
  input: {
    height: 50,
    borderColor: "gray",
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 15,
    backgroundColor: "#fff",
    marginBottom: 15,
    fontFamily: "nunito-regular"
  },
  inputCodeContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  codeBox: {
    width: 50,
    height: 50,
    borderColor: "gray",
    borderWidth: 1,
    borderRadius: 10,
    textAlign: "center",
    fontSize: 18,
    backgroundColor: "#fff",
  },
  button: {
    backgroundColor: "#FF7622",
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontFamily: "nunito-bold",
  },
});

export default ResetPasswordScreen;
