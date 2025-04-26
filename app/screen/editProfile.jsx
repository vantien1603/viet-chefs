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
import { SceneMap, TabBar, TabView } from "react-native-tab-view";
import { useCommonNoification } from "../../context/commonNoti";




const EditProfile = () => {
  const router = useRouter();
  const { user } = useContext(AuthContext);
  const params = useLocalSearchParams();
  const [index, setIndex] = useState(0);
  const { showModal } = useCommonNoification();
  const [loading, setLoading] = useState(false);
  const [routes] = useState(
    user?.roleName === "ROLE_CHEF"
      ? [
        { key: 'profile', title: 'Thông tin cá nhân' },
        { key: 'chef', title: 'Thông tin đầu bếp' },
      ]
      : [{ key: 'profile', title: 'Thông tin cá nhân' }]
  );
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

  const [username, setUserName] = useState(profileData.username || "");
  const [name, setName] = useState(profileData.fullName || "");
  const [email] = useState(profileData.email || "");
  const [phone, setPhone] = useState(profileData.phone || "");
  const [dob, setDob] = useState(profileData.dob || "");
  const [gender, setGender] = useState(
    mapGenderToDisplay(profileData.gender) || "Nam"
  );
  const [avatar, setAvatar] = useState(profileData.avatarUrl || null);
  const axiosInstanceForm = useAxiosFormData();

  const pickImage = async () => {
    const permissionResult =
      await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permissionResult.granted === false) {
      showModal("Warning", "Cần cấp quyền truy cập thư viện ảnh!", "Warning")
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });

    if (!result.canceled) {
      setAvatar(result.assets[0].uri);
    }
  };

  const handleUpdateProfile = async () => {
    if (isLoading) return; // Ngăn spam nút Lưu

    if (!name || !phone || !dob) {
      showModal("Error", "Vui lòng điền đầy đủ thông tin bắt buộc!", "Failed")

      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("fullName", name);
      formData.append("dob", dob);
      formData.append("gender", mapGenderToApi(gender));
      formData.append("phone", phone);

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

      const response = await axiosInstanceForm.put("/users/profile", formData);

      if (response.status === 200) {
        await AsyncStorage.setItem("@fullName", name);
        await AsyncStorage.setItem("@phone", phone);
        await AsyncStorage.setItem("@dob", dob);
        await AsyncStorage.setItem("@gender", mapGenderToApi(gender));
        if (avatar && avatar !== profileData.avatarUrl) {
          await AsyncStorage.setItem("@avatar", avatar);
        }

        showModal("Success", "Cập nhật hồ sơ thành công!", "Success")

        setTimeout(() => {
          router.back();
        }, 1500);
      }
    } catch (error) {
      console.error("Lỗi cập nhật hồ sơ:", error.response?.data || error);
      alert("Có lỗi khi cập nhật hồ sơ. Vui lòng thử lại.");
    }
  };

  const renderProfileTab = () => (
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
      <TextInput style={styles.input} value={dob} onChangeText={setDob} placeholder="YYYY-MM-DD" keyboardType="numeric" />

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
  );

  const renderChefTab = () => (
    <ScrollView contentContainerStyle={{ padding: 10, paddingBottom: 80 }}>
      <Text style={styles.label}>Bio</Text>
      <TextInput
        placeholder="Bio"
        style={styles.input}
      // onChangeText, value...
      />
      <Text style={styles.label}>Description</Text>
      <TextInput
        placeholder="Description"
        style={styles.input}
      // onChangeText, value...
      />
      <Text style={styles.label}>Country</Text>
      <TextInput
        placeholder="Country"
        style={styles.input}
      // onChangeText, value...
      />
      <Text style={styles.label}>Price</Text>
      <TextInput
        placeholder="Price"
        style={styles.input}
      // onChangeText, value...
      />
      <Text style={styles.label}>Max Serving Size</Text>
      <TextInput
        placeholder="Max Serving Size"
        style={styles.input}
      // onChangeText, value...
      />
      <Text style={styles.label}>Specialization</Text>
      <TextInput
        placeholder="Specialization"
        style={styles.input}
      // onChangeText, value...
      />
      <Text style={styles.label}>Years of experience</Text>
      <TextInput
        placeholder="Years of experience"
        style={styles.input}
      // onChangeText, value...
      />
      <Text style={styles.label}>Certification</Text>
      <TextInput
        placeholder="Specialization"
        style={styles.input}
      // onChangeText, value...
      />
    </ScrollView>
  );
  const renderScene = SceneMap({
    profile: renderProfileTab,
    chef: renderChefTab,
  });

  return (
    <SafeAreaView style={commonStyles.containerContent}>
      <Header title="Chỉnh sửa hồ sơ" />
      {user?.roleName === "ROLE_CHEF" ? (
        <TabView
          navigationState={{ index, routes }}
          renderScene={renderScene}
          onIndexChange={setIndex}
          renderTabBar={(props) => (
            <TabBar
              {...props}
              indicatorStyle={{ backgroundColor: '#A9411D' }}
              style={{ backgroundColor: '#fff' }}
              activeColor="#A9411D"
              inactiveColor="gray"
              labelStyle={{ fontWeight: 'bold' }}
            />
          )}
        />
      ) : (
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
          <TouchableOpacity
            style={styles.saveButton}
            onPress={handleUpdateProfile}
          >
            <Text style={styles.saveButtonText}>Lưu</Text>
          </TouchableOpacity>
        </ScrollView>
      )}

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
