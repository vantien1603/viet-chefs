import React, { useContext, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TextInput,
} from "react-native";
import { commonStyles } from "../../style";
import { useRouter, useFocusEffect } from "expo-router"; // Thêm useFocusEffect
import { AuthContext } from "../../config/AuthContext";
import Header from "../../components/header";
import useAxios from "../../config/AXIOS_API";
import { Feather } from "@expo/vector-icons";
import useAxiosFormData from "../../config/AXIOS_API_FORM";
import { useCommonNoification } from "../../context/commonNoti";
import * as ImagePicker from "expo-image-picker";
import { SceneMap, TabBar, TabView } from "react-native-tab-view";

const ProfileDetail = () => {
  const [loading, setLoading] = useState();
  const router = useRouter();
  const { user, setUser } = useContext(AuthContext);
  const axiosInstance = useAxios();
  const [data, setData] = useState({});
  const [dataChef, setDataChef] = useState({});
  const [updateData, setUpdateData] = useState({});
  const [updateDataChef, setUpdateDataChef] = useState({});
  const [isEditing, setIsEditing] = useState(false);
  const axiosInstanceForm = useAxiosFormData();
  const { showModal } = useCommonNoification();
  const [index, setIndex] = useState(0);
  const [routes] = useState([
    { key: 'profile', title: 'Thông tin cá nhân' },
    { key: 'chef', title: 'Thông tin đầu bếp' },
  ]
  );



  const handleProfile = async () => {
    setLoading(true);
    try {
      const response = await axiosInstance.get("/users/profile");
      if (response.status === 200) {
        setData(response.data);
        setUpdateData(response.data);
      }
    } catch (error) {
      console.error("Error fetching profile data:", error);
    } finally {
      setLoading(false)
    }
  };


  const fetchChefDetail = async () => {
    setLoading(true);
    try {
      const response = await axiosInstance.get(`/chefs/${user.chefId}`);
      if (response.status === 200) {
        setDataChef(response.data);
        setUpdateDataChef(response.data);
      }
    } catch (error) {
      console.error("Error fetching chef data:", error);
    } finally {
      setLoading(false)
    }
  }

  useFocusEffect(
    React.useCallback(() => {
      handleProfile();
      user?.roleName === "ROLE_CHEF" && fetchChefDetail();
    }, [])
  );

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
          avatarUrl,
        }),
      },
    });
  };


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
      setUpdateData((prev) => ({
        ...prev,
        avatarUrl: result.assets[0].uri,
      }));
    }
  };

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

  const handleSaveProfile = async () => {
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("fullName", updateData.fullName);
      formData.append("dob", updateData.dob);
      formData.append("gender", mapGenderToApi(updateData.gender));
      formData.append("phone", updateData.phone);

      if (updateData.avatarUrl != data.avatarUrl) {
        const filename = updateData.avatarUrl.split("/").pop();
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : "image";

        formData.append("file", {
          uri: updateData.avatarUrl,
          name: filename,
          type,
        });
      }

      const response = await axiosInstanceForm.put("/users/profile", formData);
      if (response.status === 200) {
        setIsEditing(false);
        setUser((prevUser) => ({
          ...prevUser,
          fullName: response.data.fullName,
          avatarUrl: response.data.avatarUrl,
        }));
        showModal("Success", "Update profile successfully")
      }
    } catch (error) {
      if (error.response) {
        console.error(`Lỗi ${error.response.status}:`, error.response.data);
      }
      else {
        console.error(error.message);
        showModal("Faild", "Checkout failed");
      }
    } finally {
      setLoading(false);
    }
  }

  const handleSaveChefProfile = async () => {
    setLoading(true);
    try {
      const payload = {
        bio: updateDataChef.bio,
        description: updateDataChef.description,
        address: updateDataChef.address,
        country: updateDataChef.country,
        price: updateDataChef.price,
        maxServingSize: updateDataChef.maxServingSize,
        specialization: updateDataChef.specialization,
        yearsOfExperience: updateDataChef.yearsOfExperience,
        certification: updateDataChef.certification
      }
      const response = await axiosInstance.put(`/chefs/${user.chefId}`, payload);
      if (response.status === 200) {
        showModal("Success", "Update chef profile successfully")
        setIsEditing(false);
      }
    } catch (error) {
      if (error.response) {
        console.error(`Lỗi ${error.response.status}:`, error.response.data);
      }
      else {
        console.error(error.message);
        showModal("Faild", "Checkout failed");
      }
    } finally {
      setLoading(false);
    }
  }


  const renderProfileTab = () => (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 10, paddingBottom: 50, paddingTop: 20 }}>
      {isEditing ? (
        <View style={{ alignItems: "center", marginBottom: 20 }}>
          <TouchableOpacity onPress={pickImage}>
            <View style={{ position: "relative" }}>
              <Image source={{ uri: updateData.avatarUrl }} style={styles.avatar} />
              <Feather
                name="camera"
                size={32}
                color="white"
                style={{
                  position: "absolute",
                  top: "50%",
                  left: "50%",
                  transform: [{ translateX: -16 }, { translateY: -16 }],
                }}
              />
            </View>
          </TouchableOpacity>
        </View>

      ) : (
        <View style={{ alignItems: "center", marginBottom: 20 }}>
          <Image
            source={{ uri: updateData.avatarUrl || "https://via.placeholder.com/100" }}
            style={{ width: 100, height: 100, borderRadius: 50 }}
          />
        </View>)}

      <Text style={styles.label}>Username</Text>
      {isEditing ? (
        <TextInput style={styles.input} value={updateData.username} editable={false} />
      ) : (
        <Text style={styles.text}>{updateData.username}</Text>
      )}

      <Text style={styles.label}>Họ và tên</Text>
      {isEditing ? (
        <TextInput style={styles.input} value={updateData.fullName} onChangeText={(text) => setUpdateData((prev) => ({ ...prev, fullName: text }))} />
      ) : (
        <Text style={styles.text}>{updateData.fullName}</Text>
      )}

      <Text style={styles.label}>Email</Text>
      {isEditing ? (
        <TextInput style={styles.input} value={updateData.email} editable={false} />
      ) : (
        <Text style={styles.text}>{updateData.email}</Text>
      )}

      <Text style={styles.label}>Số điện thoại</Text>
      {isEditing ? (
        <TextInput style={styles.input} value={updateData.phone} onChangeText={(text) => setUpdateData((prev) => ({ ...prev, phone: text }))} keyboardType="phone-pad" />
      ) : (
        <Text style={styles.text}>{updateData.phone}</Text>
      )}

      <Text style={styles.label}>Ngày sinh</Text>
      {isEditing ? (
        <TextInput style={styles.input} value={updateData.dob} onChangeText={(text) => setUpdateData((prev) => ({ ...prev, dob: text }))} />
      ) : (
        <Text style={styles.text}>{updateData.dob}</Text>
      )}

      <Text style={styles.label}>Giới tính</Text>
      {isEditing ? (
        <View style={styles.genderContainer}>
          <TouchableOpacity
            style={[
              styles.genderButton,
              mapGenderToDisplay(updateData.gender) === "Nam" && styles.genderSelected,
            ]}
            onPress={() => setUpdateData((prev) => ({ ...prev, gender: "Nam" }))}
          >
            <Text
              style={
                mapGenderToDisplay(updateData.gender) === "Nam" ? styles.genderTextSelected : styles.genderText
              }
            >
              Nam
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.genderButton,
              mapGenderToDisplay(updateData.gender) === "Nữ" && styles.genderSelected,
            ]}
            onPress={() => setUpdateData((prev) => ({ ...prev, gender: "Nữ" }))}
          >
            <Text
              style={
                mapGenderToDisplay(updateData.gender) === "Nữ" ? styles.genderTextSelected : styles.genderText
              }
            >
              Nữ
            </Text>
          </TouchableOpacity>
        </View>) : (
        <Text style={styles.text}>{updateData.gender}</Text>
      )}
      <View style={{ marginTop: 20 }}>
        {isEditing ? (
          <View style={{ flexDirection: 'row', justifyContent: 'space-around' }}>
            <TouchableOpacity style={{
              backgroundColor: "orange",
              paddingVertical: 12,
              borderRadius: 8,
              alignItems: "center",
              width: '30%'
            }}
              onPress={() => handleSaveProfile()}>
              <Text style={styles.editButtonText}>Save</Text>
            </TouchableOpacity>
            <TouchableOpacity style={{
              backgroundColor: "red",
              paddingVertical: 12,
              borderRadius: 8,
              alignItems: "center",
              width: '30%'
            }}
              onPress={() => { setIsEditing(false), setUpdateData(data) }}>
              <Text style={styles.editButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>

        ) : (
          <TouchableOpacity style={styles.editButton} onPress={() => setIsEditing(true)}>
            <Text style={styles.editButtonText}>Chỉnh sửa hồ sơ</Text>
          </TouchableOpacity>
        )}

      </View>
    </ScrollView>
  );

  const renderChefTab = () => (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 10, paddingBottom: 50, paddingTop: 20 }}>
      <Text style={styles.label}>Bio</Text>
      {isEditing ? (
        <TextInput style={styles.input} value={updateDataChef.bio} onChangeText={(text) => setUpdateDataChef((prev) => ({ ...prev, bio: text }))} />
      ) : (
        <Text style={styles.text}>{updateDataChef.bio}</Text>
      )}

      <Text style={styles.label}>Description</Text>
      {isEditing ? (
        <TextInput
          multiline
          numberOfLines={3}
          style={styles.textArea} value={updateDataChef.description} onChangeText={(text) => setUpdateDataChef((prev) => ({ ...prev, description: text }))} />
      ) : (
        <Text style={styles.text}>{updateDataChef.description}</Text>
      )}

      <Text style={styles.label}>Country</Text>
      {isEditing ? (
        <TextInput style={styles.input} value={updateDataChef.country} onChangeText={(text) => setUpdateDataChef((prev) => ({ ...prev, country: text }))} />
      ) : (
        <Text style={styles.text}>{updateDataChef.country}</Text>
      )}

      <Text style={styles.label}>Price</Text>
      {isEditing ? (
        <TextInput style={styles.input} value={String(updateDataChef.price)} onChangeText={(text) => setUpdateDataChef((prev) => ({ ...prev, price: text }))} keyboardType="phone-pad" />
      ) : (
        <Text style={styles.text}>{updateDataChef.price}</Text>
      )}

      <Text style={styles.label}>Max Serving Size</Text>
      {isEditing ? (
        <TextInput style={styles.input} value={String(updateDataChef.maxServingSize)} onChangeText={(text) => setUpdateDataChef((prev) => ({ ...prev, maxServingSize: text }))} keyboardType="phone-pad" />
      ) : (
        <Text style={styles.text}>{updateDataChef.maxServingSize}</Text>
      )}

      <Text style={styles.label}>Specialization</Text>
      {isEditing ? (
        <TextInput style={styles.input} value={updateDataChef.specialization} onChangeText={(text) => setUpdateDataChef((prev) => ({ ...prev, specialization: text }))} />
      ) : (
        <Text style={styles.text}>{updateDataChef.specialization}</Text>
      )}

      <Text style={styles.label}>Years of experience</Text>
      {isEditing ? (
        <TextInput style={styles.input} value={String(updateDataChef.yearsOfExperience)} onChangeText={(text) => setUpdateDataChef((prev) => ({ ...prev, yearsOfExperience: text }))} keyboardType="phone-pad" />
      ) : (
        <Text style={styles.text}>{updateDataChef.yearsOfExperience}</Text>
      )}

      <Text style={styles.label}>Certification</Text>
      {isEditing ? (
        <TextInput style={styles.input} value={updateDataChef.certification} onChangeText={(text) => setUpdateDataChef((prev) => ({ ...prev, certification: text }))} keyboardType="phone-pad" />
      ) : (
        <Text style={styles.text}>{updateDataChef.certification}</Text>
      )}
      <View style={{ marginTop: 20 }}>
        {isEditing ? (
          <View style={{ flexDirection: 'row', justifyContent: 'space-around' }}>
            <TouchableOpacity style={{
              backgroundColor: "orange",
              paddingVertical: 12,
              borderRadius: 8,
              alignItems: "center",
              width: '30%'
            }}
              onPress={() => handleSaveChefProfile()}>
              <Text style={styles.editButtonText}>Save</Text>
            </TouchableOpacity>
            <TouchableOpacity style={{
              backgroundColor: "red",
              paddingVertical: 12,
              borderRadius: 8,
              alignItems: "center",
              width: '30%'
            }}
              onPress={() => { setIsEditing(false), setUpdateDataChef(dataChef) }}>
              <Text style={styles.editButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>

        ) : (
          <TouchableOpacity style={styles.editButton} onPress={() => setIsEditing(true)}>
            <Text style={styles.editButtonText}>Chỉnh sửa hồ sơ</Text>
          </TouchableOpacity>
        )}

      </View>
    </ScrollView>
  );
  const renderScene = ({ route }) => {
    switch (route.key) {
      case 'profile':
        return renderProfileTab();
      case 'chef':
        return renderChefTab();
      default:
        return null;
    }
  };


  return (
    <SafeAreaView style={commonStyles.containerContent}>
      <Header title="Profile" />
      {user?.roleName === "ROLE_CHEF" ? (
        <TabView
          navigationState={{ index, routes }}
          renderScene={renderScene}
          onIndexChange={(index) => {
            setIndex(index);
            setIsEditing(false);
          }}
          renderTabBar={(props) => (
            <TabBar
              {...props}
              inactiveColor="gray"
              activeColor="#9C583F"
              indicatorStyle={{ backgroundColor: '#A9411D' }}
              style={{ backgroundColor: '#EBE5DD', elevation: 0, shadowOpacity: 0, borderBottomWidth: 0 }}
              labelStyle={{ color: '#A9411D', fontWeight: 'bold' }}
            />
          )}
        />
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 10, paddingBottom: 80 }}>
          {isEditing ? (
            <View style={{ alignItems: "center", marginBottom: 20 }}>
              <TouchableOpacity onPress={pickImage}>
                <View style={{ position: "relative" }}>
                  <Image source={{ uri: updateData.avatarUrl }} style={styles.avatar} />
                  <Feather
                    name="camera"
                    size={32}
                    color="white"
                    style={{
                      position: "absolute",
                      top: "50%",
                      left: "50%",
                      transform: [{ translateX: -16 }, { translateY: -16 }],
                    }}
                  />
                </View>
              </TouchableOpacity>
            </View>

          ) : (
            <View style={{ alignItems: "center", marginBottom: 20 }}>
              <Image
                source={{ uri: updateData.avatarUrl || "https://via.placeholder.com/100" }}
                style={{ width: 100, height: 100, borderRadius: 50 }}
              />
            </View>)}

          <Text style={styles.label}>Username</Text>
          {isEditing ? (
            <TextInput style={styles.input} value={updateData.username} editable={false} />
          ) : (
            <Text style={styles.text}>{updateData.username}</Text>
          )}

          <Text style={styles.label}>Họ và tên</Text>
          {isEditing ? (
            <TextInput style={styles.input} value={updateData.fullName} onChangeText={(text) => setUpdateData((prev) => ({ ...prev, fullName: text }))} />
          ) : (
            <Text style={styles.text}>{updateData.fullName}</Text>
          )}

          <Text style={styles.label}>Email</Text>
          {isEditing ? (
            <TextInput style={styles.input} value={updateData.email} editable={false} />
          ) : (
            <Text style={styles.text}>{updateData.email}</Text>
          )}

          <Text style={styles.label}>Số điện thoại</Text>
          {isEditing ? (
            <TextInput style={styles.input} value={updateData.phone} onChangeText={(text) => setUpdateData((prev) => ({ ...prev, phone: text }))} keyboardType="phone-pad" />
          ) : (
            <Text style={styles.text}>{updateData.phone}</Text>
          )}

          <Text style={styles.label}>Ngày sinh</Text>
          {isEditing ? (
            <TextInput style={styles.input} value={updateData.dob} onChangeText={(text) => setUpdateData((prev) => ({ ...prev, dob: text }))} />
          ) : (
            <Text style={styles.text}>{updateData.dob}</Text>
          )}

          <Text style={styles.label}>Giới tính</Text>
          {isEditing ? (
            <View style={styles.genderContainer}>
              <TouchableOpacity
                style={[
                  styles.genderButton,
                  mapGenderToDisplay(updateData.gender) === "Nam" && styles.genderSelected,
                ]}
                onPress={() => setUpdateData((prev) => ({ ...prev, gender: "Nam" }))}
              >
                <Text
                  style={
                    mapGenderToDisplay(updateData.gender) === "Nam" ? styles.genderTextSelected : styles.genderText
                  }
                >
                  Nam
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.genderButton,
                  mapGenderToDisplay(updateData.gender) === "Nữ" && styles.genderSelected,
                ]}
                onPress={() => setUpdateData((prev) => ({ ...prev, gender: "Nữ" }))}
              >
                <Text
                  style={
                    mapGenderToDisplay(updateData.gender) === "Nữ" ? styles.genderTextSelected : styles.genderText
                  }
                >
                  Nữ
                </Text>
              </TouchableOpacity>
            </View>) : (
            <Text style={styles.text}>{updateData.gender}</Text>
          )}
          <View style={{ marginTop: 20 }}>
            {isEditing ? (
              <View style={{ flexDirection: 'row', justifyContent: 'space-around' }}>
                <TouchableOpacity style={{
                  backgroundColor: "orange",
                  paddingVertical: 12,
                  borderRadius: 8,
                  alignItems: "center",
                  width: '30%'
                }}
                  onPress={() => handleSaveProfile()}>
                  <Text style={styles.editButtonText}>Save</Text>
                </TouchableOpacity>
                <TouchableOpacity style={{
                  backgroundColor: "red",
                  paddingVertical: 12,
                  borderRadius: 8,
                  alignItems: "center",
                  width: '30%'
                }}
                  onPress={() => { setIsEditing(false), setUpdateData(data) }}>
                  <Text style={styles.editButtonText}>Cancel</Text>
                </TouchableOpacity>
              </View>

            ) : (
              <TouchableOpacity style={styles.editButton} onPress={() => setIsEditing(true)}>
                <Text style={styles.editButtonText}>Chỉnh sửa hồ sơ</Text>
              </TouchableOpacity>
            )}

          </View>
        </ScrollView>
      )}

    </SafeAreaView >
  );
};

const styles = StyleSheet.create({
  label: { fontSize: 16, fontWeight: "bold", marginBottom: 8 },
  text: {
    fontSize: 16,
    padding: 10,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    marginBottom: 16,
    color: "#333",
  },
  editButton: {
    backgroundColor: "#A9411D",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  editButtonText: { color: "white", fontSize: 16, fontWeight: "bold" },

  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 10,
    fontSize: 16,
    marginBottom: 16,
    color: '#333',
  },
  textArea: {
    borderColor: "#ccc",
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: '#333',
    minHeight: 120,
    textAlignVertical: 'top',
    marginBottom: 10,
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
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
});

export default ProfileDetail;
