import React, { useState, useContext } from "react";
import { View, Text, TextInput, TouchableOpacity, Image, StyleSheet, ScrollView, SafeAreaView } from 'react-native';
import { commonStyles } from '../../style';
import { useRouter } from "expo-router";
import { AuthContext } from "../../config/AuthContext";
import Header from "../../components/header";
import * as ImagePicker from 'expo-image-picker';

const EditProfile = () => {
  const router = useRouter();
  const { user } = useContext(AuthContext);

  // State để lưu thông tin hồ sơ có thể chỉnh sửa
  const [name, setName] = useState("Huỳnh Văn Tiến");
  const [email, setEmail] = useState("tien@example.com");
  const [phone, setPhone] = useState("0123456789");
  const [dob, setDob] = useState("01/01/1990");
  const [gender, setGender] = useState("Nam");
  const [avatar, setAvatar] = useState("https://cosmic.vn/wp-content/uploads/2023/06/tt-1.png");

  // Hàm chọn ảnh từ thư viện
  const pickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permissionResult.granted === false) {
      alert("Cần cấp quyền truy cập thư viện ảnh để thay đổi ảnh đại diện!");
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

  const handleSave = () => {
    console.log("Thông tin đã lưu:", { name, email, phone, dob, gender, avatar });
    router.back(); // Quay lại màn hình ProfileDetail sau khi lưu
  };

  return (
    <SafeAreaView style={commonStyles.containerContent}>
      <Header title="Chỉnh sửa hồ sơ" />
      <ScrollView contentContainerStyle={{ padding: 10, paddingBottom: 80 }}>
        <View style={{ alignItems: 'center', marginBottom: 20 }}>
          <Image
            source={{ uri: avatar }}
            style={{ width: 100, height: 100, borderRadius: 50 }}
          />
          <TouchableOpacity onPress={pickImage}>
            <Text style={{ color: '#A9411D', marginTop: 8 }}>Thay đổi ảnh</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.label}>Họ và tên</Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
        />

        <Text style={styles.label}>Email</Text>
        <TextInput
          style={styles.input}
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
        />

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
          placeholder="DD/MM/YYYY"
          keyboardType="numeric"
        />

        <Text style={styles.label}>Giới tính</Text>
        <View style={styles.genderContainer}>
          <TouchableOpacity
            style={[styles.genderButton, gender === "Nam" && styles.genderButtonSelected]}
            onPress={() => setGender("Nam")}
          >
            <Text style={gender === "Nam" ? styles.genderTextSelected : styles.genderText}>Nam</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.genderButton, gender === "Nữ" && styles.genderButtonSelected]}
            onPress={() => setGender("Nữ")}
          >
            <Text style={gender === "Nữ" ? styles.genderTextSelected : styles.genderText}>Nữ</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <View style={styles.fixedButtonContainer}>
        <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
          <Text style={styles.saveButtonText}>Lưu</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 10,
    fontSize: 16,
    marginBottom: 16,
  },
  genderContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  genderButton: {
    flex: 1,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  genderButtonSelected: {
    backgroundColor: '#A9411D',
    borderColor: '#A9411D',
  },
  genderText: {
    fontSize: 16,
    color: 'black',
  },
  genderTextSelected: {
    fontSize: 16,
    color: 'white',
  },
  fixedButtonContainer: {
    position: 'absolute',
    bottom: 20,
    left: 10,
    right: 10,
  },
  saveButton: {
    backgroundColor: '#A9411D',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default EditProfile;