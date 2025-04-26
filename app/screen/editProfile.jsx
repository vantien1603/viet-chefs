import React, { useState, useContext } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { AuthContext } from "../../config/AuthContext";
import Header from "../../components/header";
import * as ImagePicker from "expo-image-picker";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { commonStyles } from "../../style";
import { SafeAreaView } from "react-native-safe-area-context";
import useAxiosFormData from "../../config/AXIOS_API_FORM";
import Toast from "react-native-toast-message";

const EditProfile = () => {
  const router = useRouter();
  const { user } = useContext(AuthContext);
  const params = useLocalSearchParams();
  const axiosInstance = useAxiosFormData();

  const profileData = params.profileData ? JSON.parse(params.profileData) : {};

  const mapGenderToDisplay = (apiGender) => {
    switch (apiGender) {
      case "Male":
        return "Nam";
      case "Female":
        return "Nữ";
      default:
        return "Nam";
    }
  };

  const mapGenderToApi = (displayGender) => {
    return displayGender === "Nam" ? "Male" : "Female";
  };

  // State
  const [username] = useState(profileData.username || "");
  const [name, setName] = useState(profileData.fullName || "");
  const [email] = useState(profileData.email || "");
  const [phone, setPhone] = useState(profileData.phone || "");
  const [dob, setDob] = useState(profileData.dob || "");
  const [gender, setGender] = useState(
    mapGenderToDisplay(profileData.gender) || "Nam"
  );
  const [avatar, setAvatar] = useState(profileData.avatarUrl || null);
  const [isLoading, setIsLoading] = useState(false);

  // Pick image with compression
  const pickImage = async () => {
    const permissionResult =
      await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permissionResult.granted === false) {
      Toast.show({
        type: "error",
        text1: "Lỗi",
        text2: "Cần cấp quyền truy cập thư viện ảnh!",
      });
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5, // Compress image
    });

    if (!result.canceled) {
      setAvatar(result.assets[0].uri);
    }
  };

  // Update profile
  const handleUpdateProfile = async () => {
    if (isLoading) return; // Ngăn spam nút Lưu

    if (!name || !phone || !dob) {
      Toast.show({
        type: "error",
        text1: "Lỗi",
        text2: "Vui lòng điền đầy đủ thông tin bắt buộc!",
      });
      return;
    }

    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append("fullName", name);
      formData.append("dob", dob);
      formData.append("gender", mapGenderToApi(gender));
      formData.append("phone", phone);

      // Only append new avatar
      if (avatar && avatar !== profileData.avatarUrl) {
        const filename = avatar.split("/").pop();
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : "image";

        formData.append("file", {
          uri: avatar,
          name: filename,
          type,
        });
      }

      const response = await axiosInstance.put("/users/profile", formData);

      if (response.status === 200) {
        await AsyncStorage.setItem("@fullName", name);
        await AsyncStorage.setItem("@phone", phone);
        await AsyncStorage.setItem("@dob", dob);
        await AsyncStorage.setItem("@gender", mapGenderToApi(gender));
        if (avatar && avatar !== profileData.avatarUrl) {
          await AsyncStorage.setItem("@avatar", avatar);
        }

        Toast.show({
          type: "success",
          text1: "Thành công",
          text2: "Cập nhật hồ sơ thành công!",
        });
        setTimeout(() => {
          router.back();
        }, 1500); // Delay để hiển thị toast
      }
    } catch (error) {
      console.log("Lỗi cập nhật hồ sơ:", error?.response?.data || error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={commonStyles.containerContent}>
      <Header title="Chỉnh sửa hồ sơ" />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.avatarContainer}>
          <Image
            source={{ uri: avatar }}
            style={styles.avatar}
          />
          <TouchableOpacity onPress={pickImage} disabled={isLoading}>
            <Text
              style={[styles.changeImageText, isLoading && styles.disabledText]}
            >
              Thay đổi ảnh
            </Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.label}>Username</Text>
        <TextInput
          style={[styles.input, styles.disabledInput]}
          value={username}
          editable={false}
        />

        <Text style={styles.label}>Họ và tên *</Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          editable={!isLoading}
          placeholder="Nhập họ và tên"
        />

        <Text style={styles.label}>Email</Text>
        <TextInput
          style={[styles.input, styles.disabledInput]}
          value={email}
          editable={false}
        />

        <Text style={styles.label}>Số điện thoại *</Text>
        <TextInput
          style={styles.input}
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
          editable={!isLoading}
          placeholder="Nhập số điện thoại"
        />

        <Text style={styles.label}>Ngày sinh *</Text>
        <TextInput
          style={styles.input}
          value={dob}
          onChangeText={setDob}
          placeholder="YYYY-MM-DD"
          keyboardType="numeric"
          editable={!isLoading}
        />

        <Text style={styles.label}>Giới tính</Text>
        <View style={styles.genderContainer}>
          <TouchableOpacity
            style={[
              styles.genderButton,
              gender === "Nam" && styles.genderSelected,
            ]}
            onPress={() => setGender("Nam")}
            disabled={isLoading}
          >
            <Text
              style={
                gender === "Nam" ? styles.genderTextSelected : styles.genderText
              }
            >
              Nam
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.genderButton,
              gender === "Nữ" && styles.genderSelected,
            ]}
            onPress={() => setGender("Nữ")}
            disabled={isLoading}
          >
            <Text
              style={
                gender === "Nữ" ? styles.genderTextSelected : styles.genderText
              }
            >
              Nữ
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <View style={styles.fixedButtonContainer}>
        <TouchableOpacity
          style={[styles.saveButton, isLoading && styles.saveButtonDisabled]}
          onPress={handleUpdateProfile}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color="#FFF" />
          ) : (
            <Text style={styles.saveButtonText}>Lưu</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  scrollContent: {
    padding: 15,
    paddingBottom: 100,
  },
  avatarContainer: {
    alignItems: "center",
    marginBottom: 20,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#EEE",
  },
  changeImageText: {
    color: "#A9411D",
    fontSize: 16,
    marginTop: 10,
  },
  disabledText: {
    color: "#AAA",
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: "#DDD",
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
    marginBottom: 16,
    backgroundColor: "#FFF",
  },
  disabledInput: {
    backgroundColor: "#F5F5F5",
    color: "#666",
  },
  genderContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  genderButton: {
    flex: 1,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: "#DDD",
    borderRadius: 10,
    alignItems: "center",
    marginHorizontal: 5,
    backgroundColor: "#FFF",
  },
  genderSelected: {
    backgroundColor: "#A9411D",
    borderColor: "#A9411D",
  },
  genderText: {
    fontSize: 16,
    color: "#333",
  },
  genderTextSelected: {
    fontSize: 16,
    color: "#FFF",
    fontWeight: "600",
  },
  fixedButtonContainer: {
    position: "absolute",
    bottom: 20,
    left: 15,
    right: 15,
  },
  saveButton: {
    backgroundColor: "#A9411D",
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
    flexDirection: "row", // Để căn giữa ActivityIndicator và text
    justifyContent: "center",
  },
  saveButtonDisabled: {
    backgroundColor: "#AAA",
    opacity: 0.7, // Làm mờ nút khi disabled
  },
  saveButtonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "600",
  },
});

export default EditProfile;
