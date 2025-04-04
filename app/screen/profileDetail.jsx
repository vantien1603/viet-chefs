import React, { useContext, useEffect, useState } from "react";
import { View, Text, TouchableOpacity, Image, StyleSheet, ScrollView, SafeAreaView } from 'react-native';
import { commonStyles } from '../../style';
import { useRouter } from "expo-router";
import { AuthContext } from "../../config/AuthContext";
import Header from "../../components/header";
import AXIOS_API from "../../config/AXIOS_API";

const ProfileDetail = () => {
  const router = useRouter();
  const { user } = useContext(AuthContext);

  // const name = "Huỳnh Văn Tiến";
  // const email = "tien@example.com";
  // const phone = "0123456789";
  // const dob = "01/01/1990";
  // const gender = "Nam";
  const avatar = "https://cosmic.vn/wp-content/uploads/2023/06/tt-1.png";

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [dob, setDob] = useState("");
  const [gender, setGender] = useState("");
  const [username, setUsername] = useState("");

  const handleProfile = async () => {
    try {
      const response = await AXIOS_API.get("/users/profile");
      if(response.status === 200){
        setFullName(response.data.fullName);
        setEmail(response.data.email);
        setPhone(response.data.phone);
        setDob(response.data.dob);
        setGender(response.data.gender);
        setUsername(response.data.username);
      }
    } catch (error) {
      console.error("Error fetching profile data:", error);
    }
  }

  useEffect(() => {
    handleProfile();
  }, [])

  const handleEditProfile = () => {
    router.push({
      pathname: "/screen/editProfile",
      params: {
        profileData: JSON.stringify({
          fullName,
          email,
          phone,
          dob,
          gender,
          username,
          avatar,
        }),
      },
    });
  };

  return (
    <SafeAreaView style={commonStyles.containerContent}>
      <Header title="Thông tin cá nhân"/>
      <ScrollView contentContainerStyle={{ padding: 10, paddingBottom: 80 }}>
        <View style={{ alignItems: 'center', marginBottom: 20 }}>
          <Image
            source={{ uri: avatar }}
            style={{ width: 100, height: 100, borderRadius: 50 }}
          />
        </View>

        <Text style={styles.label}>Username</Text>
        <Text style={styles.text}>{username}</Text>

        <Text style={styles.label}>Họ và tên</Text>
        <Text style={styles.text}>{fullName}</Text>

        <Text style={styles.label}>Email</Text>
        <Text style={styles.text}>{email}</Text>

        <Text style={styles.label}>Số điện thoại</Text>
        <Text style={styles.text}>{phone}</Text>

        <Text style={styles.label}>Ngày sinh</Text>
        <Text style={styles.text}>{dob}</Text>

        <Text style={styles.label}>Giới tính</Text>
        <Text style={styles.text}>{gender}</Text>
      </ScrollView>

      {/* Nút Edit Profile */}
      <View style={styles.fixedButtonContainer}>
        <TouchableOpacity
          style={styles.editButton}
          onPress={handleEditProfile}
        >
          <Text style={styles.editButtonText}>Chỉnh sửa hồ sơ</Text>
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
  text: {
    fontSize: 16,
    padding: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    marginBottom: 16,
    color: '#333',
  },
  fixedButtonContainer: {
    position: 'absolute',
    bottom: 20,
    left: 10,
    right: 10,
  },
  editButton: {
    backgroundColor: '#A9411D',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  editButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default ProfileDetail;