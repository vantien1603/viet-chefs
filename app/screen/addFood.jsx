import React, { useContext, useEffect, useState } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TextInput,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { MaterialIcons } from "@expo/vector-icons";
import { Dropdown, MultiSelect } from "react-native-element-dropdown";
import Header from "../../components/header";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import useAxios from "../../config/AXIOS_API";
import { commonStyles } from "../../style";
import { AuthContext } from "../../config/AuthContext";
import axios from "axios";
import useAxiosFormData from "../../config/AXIOS_API_FORM";
import { useCommonNoification } from "../../context/commonNoti";
import { t } from "i18next";

const AddNewFoodScreen = () => {
  const [foodName, setFoodName] = useState("");
  const [image, setImage] = useState(null);
  const [details, setDetails] = useState("");
  const [cookTime, setCookTime] = useState("");
  const [selectedFoodTypeIds, setSelectedFoodTypeIds] = useState([]);
  const [cuisineType, setCuisineType] = useState("");
  const [basePrice, setBasePrice] = useState("");
  const [estimatedCookGroup, setEstimatedCookGroup] = useState("");
  const [errors, setErrors] = useState({});
  const [foodTypes, setFoodTypes] = useState([]);
  const [loading, setLoading] = useState(false);
  const axiosInstance = useAxios();
  const axiosInstanceForm = useAxiosFormData();
  const { showModal } = useCommonNoification();
  const { user } = useContext(AuthContext);
  const cookGroups = [
    { label: t("cookGroups.1"), value: "1" },
    { label: t("cookGroups.2"), value: "2" },
    { label: t("cookGroups.3"), value: "3" },
    { label: t("cookGroups.4"), value: "4" },
  ];

  const cuisineTypes = [
    { label: t("cuisineTypes.Northern"), value: "Northern" },
    { label: t("cuisineTypes.Central"), value: "Central" },
    { label: t("cuisineTypes.Southern"), value: "Southern" },
  ];

  const validateCookTime = (text) => {
    const regex = /^[0-9]*$/;
    return regex.test(text) && (text === "" || Number(text) > 0);
  };

  const validatePrice = (text) => {
    const regex = /^[0-9]*\.?[0-9]*$/;
    return regex.test(text) && (text === "" || Number(text) >= 0);
  };

  const handleCookTime = (text) => {
    if (validateCookTime(text)) {
      setCookTime(text);
    }
    if (errors.cookTime && text.trim()) {
      setErrors((prev) => ({ ...prev, cookTime: null }));
    }
  };

  const handleBasePrice = (text) => {
    if (validatePrice(text)) {
      setBasePrice(text);
    }
    if (errors.basePrice && text.trim()) {
      setErrors((prev) => ({ ...prev, basePrice: null }));
    }
  };

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 4],
      quality: 1,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  useEffect(() => {
    const fetchFoodTypes = async () => {
      setLoading(true);
      try {
        const response = await axiosInstance.get("/food-types");
        const formattedFoodTypes = response.data.map((item) => ({
          label: item.name,
          value: item.id.toString(),
        }));
        setFoodTypes(formattedFoodTypes);
      } catch (error) {
        if (error.response?.status === 401) {
          return;
        }
        if (axios.isCancel(error)) {
          return;
        }
        showModal(t("modal.error"), t("errors.dataLoadError"), t("modal.failed"));
      } finally {
        setLoading(false);
      }
    };
    fetchFoodTypes();
  }, []);

  const handleSave = async () => {
    let newError = {};
    if (!foodName.trim()) newError.foodName = t("errors.foodName");
    if (!cookTime.trim()) newError.cookTime = t("errors.cookTime");
    if (!details.trim()) newError.details = t("errors.details");
    if (!estimatedCookGroup)
      newError.estimatedCookGroup = t("errors.estimatedCookGroup");
    if (selectedFoodTypeIds.length === 0) newError.type = t("errors.foodType");
    if (!cuisineType) newError.cuisineType = t("errors.cuisineType");
    if (!basePrice.trim()) newError.basePrice = t("errors.basePrice");

    if (Object.keys(newError).length > 0) {
      setErrors(newError);
      showModal(t("modal.error"), t("errors.failedToAdd"), t("modal.failed"));
      return;
    }

    const formData = new FormData();
    formData.append("name", foodName);
    formData.append("description", details);
    formData.append("cookTime", cookTime);
    formData.append("estimatedCookGroup", estimatedCookGroup);
    formData.append("foodTypeIds", selectedFoodTypeIds);
    formData.append("cuisineType", cuisineType);
    formData.append("serviceType", "Home Cooking");
    formData.append("basePrice", basePrice);
    formData.append("chefId", parseInt(user?.chefId));

    if (image) {
      const filename = image.split("/").pop();
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : "image";

      formData.append("file", {
        uri: image,
        name: filename,
        type,
      });
    }
    setLoading(true);
    try {
      console.log(formData);
      const response = await axiosInstanceForm.post("/dishes", formData);
      console.log("tao toa");
      if (response.status === 201 || response.status === 200) {
        showModal(t("modal.success"), t("addedDish"), t("modal.success"));
        setTimeout(() => {
          router.back();
        }, 1000);

        setFoodName("");
        setImage(null);
        setDetails("");
        setCookTime("");
        setSelectedFoodTypeIds([]);
        setCuisineType("");
        setBasePrice("");
        setEstimatedCookGroup("");
        setErrors({});
      }
    } catch (error) {
      if (error.response?.status === 401) {
        return;
      }
      if (axios.isCancel(error)) {
        return;
      }
      showModal(t("modal.error"), t("errors.failedToAdd"), t("modal.failed"));
    } finally {
      setLoading(false);
    }
  };

  const handleFoodName = (text) => {
    setFoodName(text);
    if (errors.foodName && text.trim()) {
      setErrors((prev) => ({ ...prev, foodName: null }));
    }
  };

  const handleDetails = (text) => {
    setDetails(text);
    if (errors.details && text.trim()) {
      setErrors((prev) => ({ ...prev, details: null }));
    }
  };

  return (
    <SafeAreaView style={commonStyles.container}>
      <Header title={t("addNewFood")} />
      <ScrollView
        style={commonStyles.containerContent}
        contentContainerStyle={styles.scrollViewContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.label}>{t("foodName")}</Text>
        <TextInput
          value={foodName}
          onChangeText={handleFoodName}
          placeholder={t("placeholders.foodName")}
          style={[styles.input, errors.foodName && styles.inputError]}
          disabled={loading}
        />

        <Text style={styles.label}>{t("uploadPhoto")}</Text>
        <View style={styles.uploadContainer}>
          <TouchableOpacity
            style={styles.uploadBox}
            onPress={pickImage}
            disabled={loading}
          >
            {image ? (
              <Image source={{ uri: image }} style={styles.image} />
            ) : (
              <>
                <MaterialIcons name="cloud-upload" size={24} color="#A18CD1" />
                <Text style={styles.uploadText}>
                  {t("add")}
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        <Text style={styles.label}>{t("cookTime")}</Text>
        <TextInput
          value={cookTime}
          placeholder={t("placeholders.cookTime")}
          keyboardType="numeric"
          style={[styles.input, errors.cookTime && styles.inputError]}
          onChangeText={handleCookTime}
          disabled={loading}
        />

        <Text style={styles.label}>{t("foodType")}</Text>
        <MultiSelect
          disable={loading}
          style={[styles.dropdown, errors.type && styles.inputError]}
          placeholder={t("placeholders.foodType")}
          data={foodTypes}
          labelField="label"
          valueField="value"
          value={Array.isArray(selectedFoodTypeIds) ? selectedFoodTypeIds : []}
          onChange={(selectedIds) => {
            const safeSelectedIds = Array.isArray(selectedIds)
              ? selectedIds
              : [];
            setSelectedFoodTypeIds(safeSelectedIds);
            setSelectedFoodTypeIds((prev) => safeSelectedIds);
          }}
          renderItem={(item) => {
            const isSelected =
              Array.isArray(selectedFoodTypeIds) &&
              selectedFoodTypeIds.includes(item.value);
            return (
              <View
                style={{
                  padding: 10,
                  backgroundColor: isSelected ? "#F9F5F0" : "white",
                  borderWidth: 2,
                  borderRadius: 6,
                  borderColor: isSelected ? "#F8BF40" : "transparent",
                  flexDirection: "row",
                  alignItems: "center",
                }}
              >
                <Text style={{ color: "black" }}>{item.label}</Text>
              </View>
            );
          }}
          selectedStyle={{
            backgroundColor: "#f5f5f5",
            borderRadius: 10,
            color: "black",
          }}
        />

        <Text style={styles.label}>{t("cuisineType")}</Text>
        <Dropdown
          style={[styles.dropdown, errors.cuisineType && styles.inputError]}
          data={cuisineTypes}
          labelField="label"
          valueField="value"
          placeholder={t("placeholders.cuisineType")}
          value={cuisineType}
          onChange={(item) => setCuisineType(item.value)}
          renderRightIcon={() => (
            <MaterialIcons name="arrow-drop-down" size={24} color="#555" />
          )}
          selectedTextStyle={styles.selectedTextStyle}
          placeholderStyle={styles.placeholderStyle}
          containerStyle={styles.dropdownMenu}
          itemTextStyle={styles.itemTextStyle}
          disabled={loading}
        />

        <Text style={styles.label}>{t("estimatedCookGroup")}</Text>
        <Dropdown
          style={[
            styles.dropdown,
            errors.estimatedCookGroup && styles.inputError,
          ]}
          data={cookGroups}
          labelField="label"
          valueField="value"
          placeholder={t("placeholders.cookGroup")}
          value={estimatedCookGroup}
          onChange={(item) => setEstimatedCookGroup(item.value)}
          renderRightIcon={() => (
            <MaterialIcons name="arrow-drop-down" size={24} color="#555" />
          )}
          selectedTextStyle={styles.selectedTextStyle}
          placeholderStyle={styles.placeholderStyle}
          containerStyle={styles.dropdownMenu}
          itemTextStyle={styles.itemTextStyle}
          disabled={loading}
        />

        <Text style={styles.label}>{t("details")}</Text>
        <TextInput
          value={details}
          onChangeText={handleDetails}
          placeholder={t("placeholders.details")}
          multiline
          numberOfLines={4}
          style={[styles.textArea, errors.details && styles.inputError]}
          disabled={loading}
        />

        <Text style={styles.label}>{t("basePrice")}</Text>
        <TextInput
          value={basePrice}
          placeholder={t("placeholders.basePrice")}
          keyboardType="numeric"
          style={[styles.input, errors.basePrice && styles.inputError]}
          onChangeText={handleBasePrice}
          disabled={loading}
        />
      </ScrollView>
      <TouchableOpacity
        onPress={() => handleSave()}
        disabled={loading}
        style={{
          position: "absolute",
          bottom: 20,
          left: 20,
          right: 20,
          backgroundColor: "#A64B2A",
          padding: 15,
          borderRadius: 10,
          alignItems: "center",
          elevation: 5,
        }}
      >
        {loading ? (
          <ActivityIndicator size={"small"} color={"white"} />
        ) : (
          <Text style={{ color: "white", fontSize: 16, fontFamily: "nunito-bold" }}>
            {t("save")}
          </Text>
        )}
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFF",
  },
  scrollViewContent: {
    paddingBottom: 100,
  },
  label: {
    fontSize: 16,
    color: "#333",
    marginBottom: 6,
    marginTop: 12,
    fontFamily: "nunito-bold",
  },
  dropdown: {
    backgroundColor: "#f5f5f5",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#ccc",
    paddingHorizontal: 12,
    paddingVertical: 10,
    // marginLeft: 10,
    flex: 1,
  },
  input: {
    backgroundColor: "#f5f5f5",
    borderRadius: 10,
    // paddingVertical: 8,
    paddingHorizontal: 12,
    fontSize: 15,
    borderWidth: 1,
    borderColor: "#ccc",
    flex: 1,
    color: "#333",
    fontFamily: "nunito-regular",
  },
  inputError: {
    borderColor: "red",
  },
  textArea: {
    backgroundColor: "#f5f5f5",
    borderColor: "#ccc",
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: "#333",
    minHeight: 120,
    textAlignVertical: "top",
    marginBottom: 10,
    fontFamily: "nunito-regular",
  },
  errorText: {
    color: "red",
    fontSize: 13,
    marginTop: -8,
    marginBottom: 10,
    fontFamily: "nunito-regular",
  },
  uploadContainer: {
    alignItems: "center",
    marginBottom: 20,
  },
  uploadBox: {
    width: 150,
    height: 150,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#A18CD1",
    borderStyle: "dashed",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F5F5F5",
  },
  image: {
    width: "100%",
    height: "100%",
    borderRadius: 12,
    resizeMode: "cover",
  },
  uploadText: {
    color: "#A18CD1",
    marginTop: 6,
    fontFamily: "nunito-bold",
  },
  dropdownMenu: {
    marginBottom: 10,
  },
  itemTextStyle: {
    fontSize: 15,
    fontFamily: "nunito-regular",
  },
  selectedTextStyle: {
    fontSize: 15,
    color: "#333",
    fontFamily: "nunito-regular",
  },
  placeholderStyle: {
    fontSize: 15,
    color: "#999",
    fontFamily: "nunito-regular",
  },
});

export default AddNewFoodScreen;
