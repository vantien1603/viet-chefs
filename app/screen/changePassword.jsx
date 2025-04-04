import React, { useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Header from "../../components/header";
import AXIOS_API from "../../config/AXIOS_API";
import { useRouter } from "expo-router";
import { commonStyles } from "../../style";
import { SafeAreaView } from "react-native-safe-area-context";

const ChangePasswordScreen = () => {
  const router = useRouter();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [newPasswordError, setNewPasswordError] = useState(""); // Error for new password
  const [confirmPasswordError, setConfirmPasswordError] = useState(""); // Error for confirm password

  // Validate new password against current password
  const validateNewPassword = (newPass, currentPass = currentPassword) => {
    if (newPass && currentPass && newPass === currentPass) {
      setNewPasswordError("Mật khẩu mới không được trùng với mật khẩu hiện tại!");
      return false;
    }
    setNewPasswordError("");
    return true;
  };

  // Validate confirm password against new password
  const validateConfirmPassword = (newPass = newPassword, confirmPass = confirmPassword) => {
    if (newPass && confirmPass && newPass !== confirmPass) {
      setConfirmPasswordError("Xác nhận mật khẩu không khớp với mật khẩu mới!");
      return false;
    }
    setConfirmPasswordError("");
    return true;
  };

  // Handle password change API call
  const handleChangePassword = async () => {
    const isNewPasswordValid = validateNewPassword(newPassword);
    const isConfirmPasswordValid = validateConfirmPassword();

    if (!isNewPasswordValid || !isConfirmPasswordValid) {
      return;
    }

    try {
      const passwordData = {
        currentPassword: currentPassword,
        newPassword: newPassword,
        confirmPassword: confirmPassword,
      };

      const response = await AXIOS_API.put("/users/change-password", passwordData);

      if (response.status === 200 || response.status === 201) {
        alert("Đổi mật khẩu thành công!");
        router.back();
      }
    } catch (error) {
      console.error("Error changing password:", error);
      setConfirmPasswordError(
        error.response?.data?.message || "Có lỗi khi đổi mật khẩu. Vui lòng thử lại."
      );
    }
  };

  return (
    <SafeAreaView style={commonStyles.containerContent}>
      <Header title="Đổi mật khẩu" />
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Mật khẩu hiện tại</Text>
          <TextInput
            style={styles.input}
            value={currentPassword}
            onChangeText={setCurrentPassword}
            secureTextEntry
            placeholder="Nhập mật khẩu hiện tại"
          />

          <Text style={styles.label}>Mật khẩu mới</Text>
          <TextInput
            style={styles.input}
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
            placeholder="Nhập mật khẩu mới"
          />
          {newPasswordError ? <Text style={styles.errorText}>{newPasswordError}</Text> : null}

          <Text style={styles.label}>Xác nhận mật khẩu mới</Text>
          <TextInput
            style={styles.input}
            value={confirmPassword}
            onChangeText={(text) => {
              setConfirmPassword(text);
              if (newPassword && text) {
                validateConfirmPassword(newPassword, text); // Validate immediately
              }
            }}
            secureTextEntry
            placeholder="Xác nhận mật khẩu mới"
          />
          {confirmPasswordError ? (
            <Text style={styles.errorText}>{confirmPasswordError}</Text>
          ) : null}
        </View>

        <TouchableOpacity style={styles.saveButton} onPress={handleChangePassword}>
          <Text style={styles.saveButtonText}>Lưu</Text>
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
    fontWeight: "bold",
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
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
    fontWeight: "bold",
  },
});

export default ChangePasswordScreen;