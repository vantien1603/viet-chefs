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
  ActivityIndicator,
} from "react-native";
import { commonStyles } from "../../style";
import { useRouter, useFocusEffect } from "expo-router";
import { AuthContext } from "../../config/AuthContext";
import Header from "../../components/header";
import useAxios from "../../config/AXIOS_API";
import { Feather } from "@expo/vector-icons";
import useAxiosFormData from "../../config/AXIOS_API_FORM";
import { useCommonNoification } from "../../context/commonNoti";
import * as ImagePicker from "expo-image-picker";
import { TabBar, TabView } from "react-native-tab-view";
import axios from "axios";
import DateTimePicker from "@react-native-community/datetimepicker";
import { t } from "i18next";
import * as SecureStore from "expo-secure-store";

const ProfileDetail = () => {
  const [loading, setLoading] = useState();
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
  // const country = SecureStore.getItem('country');
  const [suggestions, setSuggestions] = useState([]);

  const [routes] = useState([
    { key: "profile", title: t("personalInformation") },
    { key: "chef", title: t("chefInformation") },
  ]);
  const [errors, setErrors] = useState({
    name: false,
    phone: false,
    dob: false,
  });
  const [showDatePicker, setShowDatePicker] = useState(false);

  const handleProfile = async () => {
    setLoading(true);
    try {
      const response = await axiosInstance.get("/users/profile");
      if (response.status === 200) {
        setData(response.data);
        setUpdateData(response.data);
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
        t("errors.fetchProfileFailed"),
        "Failed"
      );
    } finally {
      setLoading(false);
    }
  };

  const fetchChefDetail = async () => {
    setLoading(true);
    try {
      const response = await axiosInstance.get(`/chefs/${user.chefId}`);
      console.log(user.chefId);
      if (response.status === 200) {
        setDataChef(response.data);
        setUpdateDataChef(response.data);
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
        t("errors.fetchChefProfileFailed"),
      );
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      handleProfile();
      user?.roleName === "ROLE_CHEF" && fetchChefDetail();
    }, [])
  );

  const pickImage = async () => {
    const permissionResult =
      await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permissionResult.granted === false) {
      showModal(
        t("modal.warning"),
        t("errors.imagePermissionRequired"),
        t("Warning")
      );
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
        return t("male");
      case "Female":
        return t("female");
      default:
        return t("male");
    }
  };

  const mapGenderToApi = (displayGender) => {
    return displayGender === t("male") ? "Male" : "Female";
  };

  const handleSaveProfile = async () => {
    const phoneRegex = /^\d{10}$/;
    const dobRegex = /^\d{4}-\d{2}-\d{2}$/;
    const nameRegex = /^[a-zA-ZÀÁÂÃÈÉÊÌÍÒÓÔÕÙÚĂĐĨŨƠàáâãèéêìíòóôõùúăđĩũơƯĂÊÔƠƯàáảãạâấầẩẫậăắằẳẵặèéẻẽẹêếềểễệìíỉĩịòóỏõọôốồổỗộơớờởỡợùúủũụưứừửữựýỳỷỹỵ\s]+$/; console.log(updateData.dob);
    const localErrors = {
      name: false,
      phone: false,
      dob: false,
    };

    if (!updateData.phone || !phoneRegex.test(updateData.phone)) {
      localErrors.phone = true;
    }
    if (!updateData.dob || !dobRegex.test(updateData.dob)) {
      localErrors.dob = true;
    }
    if (!updateData.fullName || !nameRegex.test(updateData.fullName)) {
      localErrors.name = true;
    }

    setErrors(localErrors);
    const hasAnyError = Object.values(localErrors).some((v) => v === true);
    if (hasAnyError) {
      showModal(t("modal.error"), t("errors.invalidData"), "Failed");
      return;
    }

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
        showModal(t("modal.success"),
          t("updateProfileSuccess"),
        );
      }
    } catch (error) {
      if (error.response?.status === 401) {
        return;
      }
      if (axios.isCancel(error)) {
        return;
      }
      console.log("err", error.response.data);
      showModal(
        t("modal.error"),
        t("errors.updateProfileFailed"),
        t("Failed")
      );
      if (error.response?.data?.message) {
        showModal(
          t("modal.error"),
          error.response.data.message,
          t("Failed")
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDateChange = (event, selectedDate) => {
    if (event.type === "dismissed") {
      setShowDatePicker(false);
      return;
    }
    if (selectedDate) {
      const formattedDate = selectedDate.toISOString().split("T")[0];
      setUpdateData((prev) => ({ ...prev, dob: formattedDate }));
    }
    setErrors((prev) => ({ ...prev, dob: false }));
    setShowDatePicker(false);
  };

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
        certification: updateDataChef.certification,
      };

      console.log(payload);
      const response = await axiosInstance.put(
        `chefs/my-chef`,
        payload
      );
      if (response.status === 200) {
        showModal(t("modal.success"),
          t("updateChefProfileSuccess"),
        );
        setIsEditing(false);
      }
    } catch (error) {
      if (error.response?.status === 401) {
        return;
      }
      if (axios.isCancel(error)) {
        return;
      }
      console.log(error.response.data);
      showModal(
        // t("modal.error"), t("errors.updateChefProfileFailed"), "Failed");
        t("modal.error"), error.response.data.message, "Failed");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (query) => {
    setUpdateDataChef((prev) => ({ ...prev, address: query }))
    fetchAddressSuggestions(query);
  };


  const fetchAddressSuggestions = async (query) => {
    if (query.length < 3) {
      setSuggestions([]);
      return;
    }
    try {
      const params = {
        input: query,
        key: process.env.API_GEO_KEY,
        language: "vi",
      };


      // if (country) {
      //   params.components = `country:${country}`;
      // }

      console.log(params)

      const response = await axios.get(
        `https://maps.googleapis.com/maps/api/place/autocomplete/json`,
        { params }
      );

      console.log("Suggestions response:", response.data);
      if (response.data.status === "OK") {
        setSuggestions(response.data.predictions);
      }
    } catch (error) {
      showModal(
        t("modal.error"),
        t("errors.fetchSuggestionsFailed"),
        "Failed"
      );
    }
  };

  const selectAddress = async (prediction) => {
    const formattedAddress = await getPlaceDetails(prediction.place_id);
    if (formattedAddress) {
      setUpdateDataChef((prev) => ({ ...prev, address: formattedAddress }))
      setSuggestions([]);
    }
  };

  const getPlaceDetails = async (placeId) => {
    try {
      const response = await axios.get(
        `https://maps.googleapis.com/maps/api/place/details/json`,
        {
          params: {
            place_id: placeId,
            key: process.env.API_GEO_KEY,
            fields: "formatted_address",
            language: "vi",
          },
        }
      );
      return response.data.result.formatted_address;
    } catch (error) {
      showModal(
        t("modal.error"),
        t("errors.fetchPlaceDetailsFailed"),
        "Failed"
      );
      return null;
    }
  };

  const renderProfileTab = () => (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ padding: 10, paddingBottom: 50, paddingTop: 20 }}
    >
      {isEditing ? (
        <View style={{ alignItems: "center", marginBottom: 20 }}>
          <TouchableOpacity onPress={pickImage}>
            <View style={{ position: "relative" }}>
              <Image
                source={{ uri: updateData.avatarUrl }}
                style={styles.avatar}
              />
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
            source={{
              uri: updateData.avatarUrl,
            }}
            style={{ width: 100, height: 100, borderRadius: 50 }}
          />
        </View>
      )}

      <Text style={styles.label}>{t("username")}</Text>
      {isEditing ? (
        <TextInput
          style={styles.input}
          value={updateData.username}
          editable={false}
        />
      ) : (
        <Text style={styles.text}>{updateData.username}</Text>
      )}

      <Text style={styles.label}>{t("fullName")}</Text>
      {isEditing ? (
        <TextInput
          style={[styles.input, errors.name && styles.errorInput]}
          value={updateData.fullName}
          onChangeText={(text) => {
            setUpdateData((prev) => ({ ...prev, fullName: text }));
            setErrors((prev) => ({ ...prev, name: false }));
          }}
        />
      ) : (
        <Text style={styles.text}>{updateData.fullName}</Text>
      )}

      <Text style={styles.label}>{t("email")}</Text>
      {isEditing ? (
        <TextInput
          style={styles.input}
          value={updateData.email}
          editable={false}
        />
      ) : (
        <Text style={styles.text}>{updateData.email}</Text>
      )}

      <Text style={styles.label}>{t("phone")}</Text>
      {isEditing ? (
        <TextInput
          style={[styles.input, errors.phone && styles.errorInput]}
          value={updateData.phone}
          onChangeText={(text) => {
            setUpdateData((prev) => ({ ...prev, phone: text }));
            setErrors((prev) => ({ ...prev, phone: false }));
          }}
          keyboardType="phone-pad"
        />
      ) : (
        <Text style={styles.text}>{updateData.phone}</Text>
      )}

      <Text style={styles.label}>{t("dob")}</Text>
      {isEditing ? (
        <TouchableOpacity
          onPress={() => setShowDatePicker(true)}
          disabled={loading}
        >
          <TextInput
            style={[styles.input, errors.dob && styles.errorInput]}
            value={updateData.dob}
            editable={false}
          />
        </TouchableOpacity>
      ) : (
        <Text style={styles.text}>{updateData.dob}</Text>
      )}
      {showDatePicker && (
        <DateTimePicker
          value={updateData.dob ? new Date(updateData.dob) : new Date()}
          mode="date"
          maximumDate={new Date()}
          onChange={handleDateChange}
          locale="vi-VN"
        />
      )}

      <Text style={styles.label}>{t("gender")}</Text>
      {isEditing ? (
        <View style={styles.genderContainer}>
          <TouchableOpacity
            style={[
              styles.genderButton,
              updateData.gender === "Male" && styles.genderSelected,
            ]}
            onPress={() =>
              setUpdateData((prev) => ({ ...prev, gender: "Male" }))
            }
          >
            <Text
              style={
                updateData.gender === "Male"
                  ? styles.genderTextSelected
                  : styles.genderText
              }
            >
              {t("male")}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.genderButton,
              updateData.gender === "Female" && styles.genderSelected,
            ]}
            onPress={() =>
              setUpdateData((prev) => ({ ...prev, gender: "Female" }))
            }
          >
            <Text
              style={
                updateData.gender === "Female"
                  ? styles.genderTextSelected
                  : styles.genderText
              }
            >
              {t("female")}
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        <Text style={styles.text}>{updateData.gender}</Text>
      )}
      <View style={{ marginTop: 20 }}>
        {isEditing ? (
          <View
            style={{ flexDirection: "row", justifyContent: "space-around" }}
          >
            <TouchableOpacity
              style={{
                backgroundColor: "orange",
                paddingVertical: 12,
                borderRadius: 8,
                alignItems: "center",
                width: "30%",
              }}
              onPress={() => handleSaveProfile()}
            >
              <Text style={styles.editButtonText}>{t("save")}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={{
                backgroundColor: "red",
                paddingVertical: 12,
                borderRadius: 8,
                alignItems: "center",
                width: "30%",
              }}
              onPress={() => {
                setIsEditing(false), setUpdateData(data);
              }}
            >
              <Text style={styles.editButtonText}>{t("cancel")}</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            style={styles.editButton}
            onPress={() => setIsEditing(true)}
          >
            <Text style={styles.editButtonText}>{t("editProfile")}</Text>
          </TouchableOpacity>
        )}
      </View>
    </ScrollView>
  );

  const renderChefTab = () => (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ padding: 10, paddingBottom: 50, paddingTop: 20 }}
    >
      <Text style={styles.label}>{t("bio")}</Text>
      {isEditing ? (
        // <TextInput
        //   style={styles.input}
        //   value={updateDataChef.bio}
        //   onChangeText={(text) =>
        //     setUpdateDataChef((prev) => ({ ...prev, bio: text }))
        //   }
        // />
        <TextInput
          multiline
          numberOfLines={3}
          style={styles.textArea}
          value={updateDataChef.bio}
          onChangeText={(text) =>
            setUpdateDataChef((prev) => ({ ...prev, bio: text }))
          }
        />
      ) : (
        <Text style={styles.text}>{updateDataChef.bio}</Text>
      )}

      <Text style={styles.label}>{t("description")}</Text>
      {isEditing ? (
        <TextInput
          multiline
          numberOfLines={3}
          style={styles.textArea}
          value={updateDataChef.description}
          onChangeText={(text) =>
            setUpdateDataChef((prev) => ({ ...prev, description: text }))
          }
        />
      ) : (
        <Text style={styles.text}>{updateDataChef.description}</Text>
      )}

      <Text style={styles.label}>{t("address")}</Text>
      {isEditing ? (
        <View style={{ position: 'relative' }}>
          <TextInput
            style={styles.input}
            value={updateDataChef.address}
            onChangeText={handleSearch}
            onSubmitEditing={(event) => {
              event.persist();
              fetchAddressSuggestions(event.nativeEvent.text);
            }}
            returnKeyType="search"
          />
          {suggestions.length > 0 && (
            <View style={styles.suggestionContainer}>
              <ScrollView nestedScrollEnabled={true}>
                {suggestions.map((item, index) => (
                  <TouchableOpacity
                    key={`${item.place_id}-${index}`}
                    onPress={() => selectAddress(item)}
                    style={styles.suggestionItem}
                  >
                    <Text style={styles.suggestionText}>
                      {item.description}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}
        </View>


      ) : (
        <Text style={styles.text}>{updateDataChef.address}</Text>
      )}

      <Text style={styles.label}>{t("country")}</Text>
      {isEditing ? (
        <TextInput
          style={styles.input}
          value={updateDataChef.country}
          onChangeText={(text) =>
            setUpdateDataChef((prev) => ({ ...prev, country: text }))
          }
        />
      ) : (
        <Text style={styles.text}>{updateDataChef.country}</Text>
      )}

      <Text style={styles.label}>{t("price")}</Text>
      {isEditing ? (
        <TextInput
          style={styles.input}
          value={String(updateDataChef.price)}
          onChangeText={(text) =>
            setUpdateDataChef((prev) => ({ ...prev, price: text }))
          }
          keyboardType="phone-pad"
        />
      ) : (
        <Text style={styles.text}>{updateDataChef.price}</Text>
      )}

      <Text style={styles.label}>{t("maxServingSize")}</Text>
      {isEditing ? (
        <TextInput
          style={styles.input}
          value={String(updateDataChef.maxServingSize)}
          onChangeText={(text) =>
            setUpdateDataChef((prev) => ({ ...prev, maxServingSize: text }))
          }
          keyboardType="phone-pad"
        />
      ) : (
        <Text style={styles.text}>{updateDataChef.maxServingSize}</Text>
      )}

      <Text style={styles.label}>{t("specialization")}</Text>
      {isEditing ? (
        <TextInput
          style={styles.input}
          value={updateDataChef.specialization}
          onChangeText={(text) =>
            setUpdateDataChef((prev) => ({ ...prev, specialization: text }))
          }
        />
      ) : (
        <Text style={styles.text}>{updateDataChef.specialization}</Text>
      )}

      <Text style={styles.label}>{t("yearsOfExperience")}</Text>
      {isEditing ? (
        <TextInput
          style={styles.input}
          value={String(updateDataChef.yearsOfExperience)}
          onChangeText={(text) =>
            setUpdateDataChef((prev) => ({ ...prev, yearsOfExperience: text }))
          }
          keyboardType="phone-pad"
        />
      ) : (
        <Text style={styles.text}>{updateDataChef.yearsOfExperience}</Text>
      )}

      <Text style={styles.label}>{t("certification")}</Text>
      {isEditing ? (
        <TextInput
          style={styles.input}
          value={updateDataChef.certification}
          onChangeText={(text) =>
            setUpdateDataChef((prev) => ({ ...prev, certification: text }))
          }
          keyboardType="phone-pad"
        />
      ) : (
        <Text style={styles.text}>{updateDataChef.certification}</Text>
      )}
      <View style={{ marginTop: 20 }}>
        {isEditing ? (
          <View
            style={{ flexDirection: "row", justifyContent: "space-around" }}
          >
            <TouchableOpacity
              style={{
                backgroundColor: "orange",
                paddingVertical: 12,
                borderRadius: 8,
                alignItems: "center",
                width: "30%",
              }}
              onPress={() => handleSaveChefProfile()}
            >
              <Text style={styles.editButtonText}>{t("save")}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={{
                backgroundColor: "red",
                paddingVertical: 12,
                borderRadius: 8,
                alignItems: "center",
                width: "30%",
              }}
              onPress={() => {
                setIsEditing(false), setUpdateDataChef(dataChef);
              }}
            >
              <Text style={styles.editButtonText}>{t("cancel")}</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            style={styles.editButton}
            onPress={() => setIsEditing(true)}
          >
            <Text style={styles.editButtonText}>{t("editProfile")}</Text>
          </TouchableOpacity>
        )}
      </View>
    </ScrollView>
  );
  const renderScene = ({ route }) => {
    switch (route.key) {
      case "profile":
        return renderProfileTab();
      case "chef":
        return renderChefTab();
      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={commonStyles.containerContent}>
      <Header title={t("titleP")} />
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
              indicatorStyle={{ backgroundColor: "#A9411D" }}
              style={{
                backgroundColor: "#EBE5DD",
                elevation: 0,
                shadowOpacity: 0,
                borderBottomWidth: 0,
              }}
              labelStyle={{ color: "#A9411D", fontFamily: "nunito-bold" }}
            />
          )}
        />
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ padding: 10, paddingBottom: 80 }}
        >
          {isEditing ? (
            <View style={{ alignItems: "center", marginBottom: 20 }}>
              <TouchableOpacity onPress={pickImage}>
                <View style={{ position: "relative" }}>
                  <Image
                    source={{ uri: updateData.avatarUrl }}
                    style={styles.avatar}
                  />
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
                source={{
                  uri:
                    updateData.avatarUrl || "https://via.placeholder.com/100",
                }}
                style={{ width: 100, height: 100, borderRadius: 50 }}
              />
            </View>
          )}

          <Text style={styles.label}>{t("username")}</Text>
          {isEditing ? (
            <TextInput
              style={styles.input}
              value={updateData.username}
              editable={false}
            />
          ) : (
            <Text style={styles.text}>{updateData.username}</Text>
          )}

          <Text style={styles.label}>{t("fullName")}</Text>
          {isEditing ? (
            <TextInput
              style={[styles.input, errors.name && styles.errorInput]}
              value={updateData.fullName}
              onChangeText={(text) =>
                setUpdateData((prev) => ({ ...prev, fullName: text }))
              }
            />
          ) : (
            <Text style={styles.text}>{updateData.fullName}</Text>
          )}

          <Text style={styles.label}>Email</Text>
          {isEditing ? (
            <TextInput
              style={styles.input}
              value={updateData.email}
              editable={false}
            />
          ) : (
            <Text style={styles.text}>{updateData.email}</Text>
          )}

          <Text style={styles.label}>{t("phone")}</Text>
          {isEditing ? (
            <TextInput
              style={[styles.input, errors.phone && styles.errorInput]}
              value={updateData.phone}
              onChangeText={(text) =>
                setUpdateData((prev) => ({ ...prev, phone: text }))
              }
              keyboardType="phone-pad"
            />
          ) : (
            <Text style={styles.text}>{updateData.phone}</Text>
          )}

          <Text style={styles.label}>{t("dob")}</Text>
          {isEditing ? (
            <TextInput
              style={[styles.input, errors.dob && styles.errorInput]}
              value={updateData.dob}
              onChangeText={(text) =>
                setUpdateData((prev) => ({ ...prev, dob: text }))
              }
            />
          ) : (
            <Text style={styles.text}>{updateData.dob}</Text>
          )}

          <Text style={styles.label}>{t("gender")}</Text>
          {isEditing ? (
            <View style={styles.genderContainer}>
              <TouchableOpacity
                style={[
                  styles.genderButton,
                  mapGenderToDisplay(updateData.gender) === "Nam" &&
                  styles.genderSelected,
                ]}
                onPress={() =>
                  setUpdateData((prev) => ({ ...prev, gender: "Male" }))
                }
              >
                <Text
                  style={
                    updateData.gender === "Male"
                      ? styles.genderTextSelected
                      : styles.genderText
                  }
                >
                  {t("male")}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.genderButton,
                  mapGenderToDisplay(updateData.gender) === "Nữ" &&
                  styles.genderSelected,
                ]}
                onPress={() =>
                  setUpdateData((prev) => ({ ...prev, gender: "Female" }))
                }
              >
                <Text
                  style={
                    updateData.gender === "Female"
                      ? styles.genderTextSelected
                      : styles.genderText
                  }
                >
                  {t("female")}
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <Text style={styles.text}>{updateData.gender}</Text>
          )}
          <View style={{ marginTop: 20 }}>
            {isEditing ? (
              <View
                style={{ flexDirection: "row", justifyContent: "space-around" }}
              >
                <TouchableOpacity
                  style={{
                    backgroundColor: "orange",
                    paddingVertical: 12,
                    borderRadius: 8,
                    alignItems: "center",
                    width: "30%",
                  }}
                  onPress={() => handleSaveProfile()}
                >
                  {loading ? (
                    <ActivityIndicator size={"small"} color={"white"} />
                  ) : (
                    <Text style={styles.editButtonText}>{t("save")}</Text>
                  )}
                </TouchableOpacity>
                <TouchableOpacity
                  style={{
                    backgroundColor: "red",
                    paddingVertical: 12,
                    borderRadius: 8,
                    alignItems: "center",
                    width: "30%",
                  }}
                  onPress={() => {
                    setIsEditing(false), setUpdateData(data);
                  }}
                >
                  <Text style={styles.editButtonText}>{t("cancel")}</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                style={styles.editButton}
                onPress={() => setIsEditing(true)}
              >
                <Text style={styles.editButtonText}>{t("editProfile")}</Text>
              </TouchableOpacity>
            )}
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  label: { fontSize: 16, fontFamily: "nunito-bold", marginBottom: 8 },
  text: {
    fontSize: 16,
    padding: 10,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    marginBottom: 16,
    color: "#333",
    fontFamily: "nunito-regular",
  },
  editButton: {
    backgroundColor: "#A9411D",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  editButtonText: { color: "white", fontSize: 16, fontFamily: "nunito-bold" },

  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 10,
    fontSize: 16,
    marginBottom: 16,
    color: "#333",
    zIndex: 10,
    fontFamily: "nunito-regular",
  },
  errorInput: {
    borderColor: "red",
    fontFamily: "nunito-regular",
  },
  textArea: {
    borderColor: "#ccc",
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: "#333",
    minHeight: 120,
    textAlignVertical: "top",
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
    fontFamily: "nunito-regular",
  },
  genderTextSelected: {
    fontSize: 16,
    color: "white",
    fontFamily: "nunito-regular",
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  suggestionContainer: {
    position: 'absolute',
    top: 45, // hoặc bằng height của TextInput + margin
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    maxHeight: 200,
    zIndex: 20,
    elevation: 5, // Android
    shadowColor: '#000', // iOS
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },

  suggestionItem: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },

  suggestionText: {
    fontSize: 14,
    color: '#333',
  },
});

export default ProfileDetail;
