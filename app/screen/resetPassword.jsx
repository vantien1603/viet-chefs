import React, { useState, useRef } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from "react-native";
import Header from "../../components/header";
import { router, useLocalSearchParams } from "expo-router";
import AXIOS_BASE from "../../config/AXIOS_BASE";
import axios from "axios";
import { useCommonNoification } from "../../context/commonNoti";

const ResetPasswordScreen = () => {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [code, setCode] = useState(["", "", "", ""]);
  const inputRefs = useRef([]);
  const { email } = useLocalSearchParams();
  const { showModal } = useCommonNoification();
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
      showModal(t("modal.error"), t("errors.emptyPassword"), t("modal.failed"));
      return;
    }

    if (newPassword !== confirmPassword) {
      showModal(
        t("modal.error"),
        t("errors.passwordMismatch"),
        t("modal.failed")
      );
      return;
    }

    const token = code.join("");

    if (token.length !== 4) {
      showModal(
        t("modal.error"),
        t("errors.invalidToken"),
        t("modal.failed")
      );

      return;
    }
    console.log("Sending data:", { email, newPassword, token });

    try {
      const response = await AXIOS_BASE.post("/reset-password", {
        email,
        newPassword,
        token,
      });
      if (response.status === 200) {
        showModal(
          t("modal.success"),
          t("resetPasswordSuccess"),
          t("modal.succeeded")
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
        t("errors.resetPasswordFailed"),
        t("modal.failed")
      );
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Header title={t("resetPassword")} />
      <Text style={styles.description}>
        {t("wehaveSentACodeToYourEmail")}
        <Text style={{ fontWeight: "bold" }}>{email}</Text>
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

        <TouchableOpacity style={styles.button} onPress={handleReset}>
          <Text style={styles.buttonText}>{t("resetPassword")}</Text>
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
  },
  label: {
    fontSize: 16,
    fontWeight: "bold",
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
    fontWeight: "bold",
  },
});

export default ResetPasswordScreen;
