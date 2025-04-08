import React, { useState, useContext } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  StyleSheet,
  ScrollView,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { AuthContext } from "../../config/AuthContext";
import Header from "../../components/header";
import * as ImagePicker from "expo-image-picker";
import AXIOS_API from "../../config/AXIOS_API";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { commonStyles } from "../../style";
import { SafeAreaView } from "react-native-safe-area-context";

const EditProfile = () => {
  const router = useRouter();
  const { user } = useContext(AuthContext);
  const params = useLocalSearchParams();

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

  // Khởi tạo state
  const [username, setUserName] = useState(profileData.username || "");
  const [name, setName] = useState(profileData.fullName || "");
  const [email, setEmail] = useState(profileData.email || "");
  const [phone, setPhone] = useState(profileData.phone || "");
  const [dob, setDob] = useState(profileData.dob || "");
  const [gender, setGender] = useState(
    mapGenderToDisplay(profileData.gender) || "Nam"
  );
  const [avatar, setAvatar] = useState(profileData.avatarUrl || null);

  // Chọn ảnh từ thư viện
  const pickImage = async () => {
    const permissionResult =
      await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permissionResult.granted === false) {
      alert("Cần cấp quyền truy cập thư viện ảnh!");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!result.canceled) {
      setAvatar(result.assets[0].uri);
    }
  };

  // Cập nhật hồ sơ
  const handleUpdateProfile = async () => {
    try {
      const formData = new FormData();
      formData.append("fullName", name);
      formData.append("dob", dob);
      formData.append("gender", mapGenderToApi(gender));
      formData.append("phone", phone);

      // Kiểm tra nếu có ảnh mới, thêm vào formData
      if (avatar) {
        const filename = avatar.split("/").pop();
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : "image";

        formData.append("file", {
          uri: avatar,
          name: filename,
          type,
        });
      }

      const response = await AXIOS_API.put("/users/profile", formData);

      if (response.status === 200) {
        await AsyncStorage.setItem("@fullName", name);
        await AsyncStorage.setItem("@phone", phone);
        await AsyncStorage.setItem("@dob", dob);
        await AsyncStorage.setItem("@gender", mapGenderToApi(gender));
        await AsyncStorage.setItem("@avatar", avatar);

        alert("Cập nhật hồ sơ thành công!");
        console.log("Ok", response.data);
        setTimeout(() => {
          router.back();
        }, 1000);
      }
    } catch (error) {
      console.error("Lỗi cập nhật hồ sơ:", error.response?.data || error);
      alert("Có lỗi khi cập nhật hồ sơ. Vui lòng thử lại.");
    }
  };

  return (
    <SafeAreaView style={commonStyles.containerContent}>
      <Header title="Chỉnh sửa hồ sơ" />
      <ScrollView contentContainerStyle={{ padding: 10, paddingBottom: 80 }}>
        <View style={{ alignItems: "center", marginBottom: 20 }}>
          <Image source={{ uri: avatar }} style={styles.avatar} />
          <TouchableOpacity onPress={pickImage}>
            <Text style={styles.changeImageText}>Thay đổi ảnh</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.label}>Username</Text>
        <TextInput style={styles.input} value={username} editable={false} />

        <Text style={styles.label}>Họ và tên</Text>
        <TextInput style={styles.input} value={name} onChangeText={setName} />

        <Text style={styles.label}>Email</Text>
        <TextInput style={styles.input} value={email} editable={false} />

        <Text style={styles.label}>Số điện thoại</Text>
        <TextInput
          style={styles.input}
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
        />

        <Text style={styles.label}>Ngày sinh</Text>
        <TextInput
          style={styles.input}
          value={dob}
          onChangeText={setDob}
          placeholder="YYYY-MM-DD"
          keyboardType="numeric"
        />

        <Text style={styles.label}>Giới tính</Text>
        <View style={styles.genderContainer}>
          <TouchableOpacity
            style={[
              styles.genderButton,
              gender === "Nam" && styles.genderSelected,
            ]}
            onPress={() => setGender("Nam")}
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
          style={styles.saveButton}
          onPress={handleUpdateProfile}
        >
          <Text style={styles.saveButtonText}>Lưu</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  changeImageText: {
    color: "#A9411D",
    marginTop: 15,
  },
  label: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 10,
    fontSize: 16,
    marginBottom: 16,
  },
  genderContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  genderButton: {
    flex: 1,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    alignItems: "center",
    marginHorizontal: 5,
  },
  genderSelected: {
    backgroundColor: "#A9411D",
    borderColor: "#A9411D",
  },
  genderText: {
    fontSize: 16,
    color: "black",
  },
  genderTextSelected: {
    fontSize: 16,
    color: "white",
  },
  fixedButtonContainer: {
    position: "absolute",
    bottom: 20,
    left: 10,
    right: 10,
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

export default EditProfile;
