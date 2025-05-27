import React, { useEffect, useState } from "react";
import {
  BackHandler,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Alert
} from "react-native";
import Header from "../../components/header";
import { useRouter } from "expo-router";
import { commonStyles } from "../../style";
import { SafeAreaView } from "react-native-safe-area-context";
import useAxios from "../../config/AXIOS_API";
import { t } from "i18next";
import { useCommonNoification } from "../../context/commonNoti";

const ChangePasswordScreen = () => {
  const router = useRouter();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [newPasswordError, setNewPasswordError] = useState(""); // Error for new password
  const [confirmPasswordError, setConfirmPasswordError] = useState(""); // Error for confirm password
  const axiosInstance = useAxios();
  const [loading, setLoading] = useState(false);
  const { showModal } = useCommonNoification();
  useEffect(() => {
    const backAction = () => {
      router.push("/(tabs)/profile");
      return true;
    };

    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      backAction
    );

    return () => backHandler.remove();
  }, []);

  const validateNewPassword = (newPass, currentPass = currentPassword) => {
    if (newPass && currentPass && newPass === currentPass) {
      setNewPasswordError(
        "Mật khẩu mới không được trùng với mật khẩu hiện tại!"
      );
      return false;
    }
    setNewPasswordError("");
    return true;
  };

  const validateConfirmPassword = (
    newPass = newPassword,
    confirmPass = confirmPassword
  ) => {
    if (newPass && confirmPass && newPass !== confirmPass) {
      setConfirmPasswordError("Xác nhận mật khẩu không khớp với mật khẩu mới!");
      return false;
    }
    setConfirmPasswordError("");
    return true;
  };

  const handleChangePassword = async () => {
    const isNewPasswordValid = validateNewPassword(newPassword);
    const isConfirmPasswordValid = validateConfirmPassword();

    if (!isNewPasswordValid || !isConfirmPasswordValid) {
      return;
    }
    setLoading(true);
    try {
      const passwordData = {
        currentPassword: currentPassword,
        newPassword: newPassword,
        confirmPassword: confirmPassword,
      };

      const response = await axiosInstance.put(
        "/users/change-password",
        passwordData
      );

      if (response.status === 200 || response.status === 201) {
        showModal(t("modal.success"), "Đổi mật khẩu thành công.",);
        router.back();
      }
    } catch (error) {
      if (error.response?.status === 401) {
        return;
      }
      if (axios.isCancel(error)) {
        return;
      }
      showModal(t("modal.error"), "Có lỗi xảy ra khi thay đổi mật khẩu.", "Failed");
    } finally {
      setLoading(false)
    }
  };

  return (
    <SafeAreaView style={commonStyles.containerContent}>
      <Header title={t("changePassword")} />
      <ScrollView contentContainerStyle={commonStyles.containerContent}>
        <View style={styles.inputContainer}>
          <Text style={styles.label}>{t("currentPass")}</Text>
          <TextInput
            style={[commonStyles.input, { fontFamily: "nunito-regular" }]}
            value={currentPassword}
            onChangeText={setCurrentPassword}
            secureTextEntry
            placeholder={t("enterCurrentPass")}
          />

          <Text style={styles.label}>{t("newPass")}</Text>
          <TextInput
            style={[commonStyles.input, { fontFamily: "nunito-regular" }]}
            value={newPassword}
            onChangeText={(text) => {
              setNewPassword(text);
              if (currentPassword && text) {
                validateNewPassword(text); // Validate immediately
              }
              if (confirmPassword) {
                validateConfirmPassword(text, confirmPassword); // Re-validate confirm if it exists
              }
            }}
            secureTextEntry
            placeholder={t("enterNewPass")}
          />
          {newPasswordError ? (
            <Text style={styles.errorText}>{newPasswordError}</Text>
          ) : null}

          <Text style={styles.label}>{t("confirmNewPass")}</Text>
          <TextInput
            style={[commonStyles.input, { fontFamily: "nunito-regular" }]}
            value={confirmPassword}
            onChangeText={(text) => {
              setConfirmPassword(text);
              if (newPassword && text) {
                validateConfirmPassword(newPassword, text); // Validate immediately
              }
            }}
            secureTextEntry
            placeholder={t("confirmNewPass")}
          />
          {confirmPasswordError ? (
            <Text style={styles.errorText}>{confirmPasswordError}</Text>
          ) : null}
        </View>

        <TouchableOpacity
          style={styles.saveButton}
          onPress={handleChangePassword}
          disabled={loading}
        >
          <Text style={styles.saveButtonText}>{t("save")}</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    paddingBottom: 80,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontFamily: "nunito-bold",
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: "#CCCCCC",
    borderRadius: 8,
    padding: 10,
    fontSize: 16,
    marginBottom: 16,
    backgroundColor: "#f5f5f5",
  },
  errorText: {
    color: "red",
    fontSize: 14,
    marginBottom: 16,
    fontFamily: "nunito-regular",
  },
  saveButton: {
    backgroundColor: "#A9411D",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  saveButtonText: {
    color: "white",
    fontSize: 16,
    fontFamily: "nunito-bold",
  },
});

export default ChangePasswordScreen;
