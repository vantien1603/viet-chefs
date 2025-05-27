import React, { useRef, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { commonStyles } from "../../style";
import { SafeAreaView } from "react-native-safe-area-context";
import AXIOS_BASE from "../../config/AXIOS_BASE";
import Header from "../../components/header";
import useAxiosBase from "../../config/AXIOS_BASE";
import { t } from "i18next";

const VerifyScreen = () => {
  const router = useRouter();
  const { username, fullName, phone, mail, mode } = useLocalSearchParams();
  const [code, setCode] = useState(["", "", "", ""]);
  const inputRefs = useRef([]);
  const axiosInstanceBase = useAxiosBase();


  if (mode == "register") {
    console.log("register");
  } else if (mode == "forgot") console.log('forgot');

  const handleInputChange = (value, index) => {
    if (/^\d?$/.test(value)) {
      const newCode = [...code];
      newCode[index] = value;
      setCode(newCode);

      if (value && index < 3) {
        inputRefs.current[index + 1]?.focus();
      }
    }
  };

  const handleKeyPress = (e, index) => {
    if (e.nativeEvent.key === "Backspace" && code[index] === "" && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async () => {
    const verificationCode = code.join("");
    try {
      const response = await axiosInstanceBase.post(
        `/verify-code?email=${encodeURIComponent(
          mail
        )}&code=${encodeURIComponent(verificationCode)}`
      );
      if (response.status === 200) {
        console.log("Verify success");
        // router.push("screen/login");
        router.push({ pathname: "screen/setPassword", params: { username, fullName, phone, mail, mode: "register" } });

        // }
      }
    } catch (error) {
      if (axios.isCancel(error)) {
        return;
      }
      showModal(t("modal.error"), t("verifyFailed"), t("modal.failed"));
    }
  };

  const handleSendAgain = async () => {
    try {
      const response = await AXIOS_BASE.post(
        `/resend-code?email=${encodeURIComponent(mail)}`
      );
      if (response.status === 200) {
        showModal(t("modal.success"), t("resendCode"), t("modal.success"));

      }
    } catch (error) {
      const message = error.response.data.message;
      console.log("Resend failed", message);
    }
  };

  return (
    <SafeAreaView style={commonStyles.container}>
      <Header title={t("verifyAccount")} />
      <View style={commonStyles.containerContent}>
        {/* <Image
          source={require("../../assets/images/logo.png")}
          style={{ width: 400, height: 250 }}
          resizeMode="cover"
        /> */}
        <Text style={{ textAlign: "center", fontSize: 16, fontFamily: "nunito-bold" }}>
          {t("enter4digit")}
        </Text>

        <View style={styles.inputCode}>
          {code.map((digit, index) => (
            <TextInput
              key={index}
              ref={(el) => (inputRefs.current[index] = el)}
              style={styles.box}
              value={digit}
              onChangeText={(value) => handleInputChange(value, index)}
              onKeyPress={(e) => handleKeyPress(e, index)}
              keyboardType="numeric"
              maxLength={1}
              autoFocus={index === 0}
            />
          ))}
        </View>

        <TouchableOpacity
          style={{ alignItems: "center", marginBottom: 10 }}
          onPress={handleSendAgain}
        >
          <Text style={{ color: "#383737", fontSize: 16, fontFamily: "nunito-regular" }}>
            {t("notReceiveCode")}
          </Text>
        </TouchableOpacity>
        <View style={commonStyles.mainButtonContainer}>
          <TouchableOpacity
            onPress={() => handleVerify()}
            style={commonStyles.mainButton}
          >
            <Text style={[commonStyles.textMainButton, {fontFamily: "nunito-regular"}]}>{t("verify")}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  inputCode: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  box: {
    width: 60,
    height: 60,
    borderWidth: 1,
    borderColor: "#CCCCCC",
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    fontSize: 24,
    textAlign: "center",
    fontFamily: "nunito-bold",
  },
});

export default VerifyScreen;
