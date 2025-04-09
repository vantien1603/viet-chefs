import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { TextInput, Button, RadioButton } from "react-native-paper";
import * as ImagePicker from "expo-image-picker";
import { MaterialIcons } from "@expo/vector-icons";
import { Dropdown } from "react-native-element-dropdown";
import Header from "../../components/header";
import Toast from "react-native-toast-message";
import { SafeAreaView } from "react-native-safe-area-context";
import AXIOS_API from "../../config/AXIOS_API";
import { router } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";

const AddNewFoodScreen = () => {
  const [foodName, setFoodName] = useState("");
  const [image, setImage] = useState(null);
  const [details, setDetails] = useState("");
  const [cookTime, setCookTime] = useState("");
  const [type, setType] = useState("");
  const [cuisineType, setCuisineType] = useState("");
  const [basePrice, setBasePrice] = useState("");
  const [estimatedCookGroup, setEstimatedCookGroup] = useState("");
  const [errors, setErrors] = useState({});
  const [dishes, setDishes] = useState([]);
  const [foodTypes, setFoodTypes] = useState([]);
  const [chefId, setChefId] = useState(null);
  const [loading, setLoading] = useState(true);

  const cookGroups = [
    { label: "1. Nấu riêng", value: "1" },
    { label: "2. Nấu chung với 1 món", value: "2" },
    { label: "3. Nấu chung với 2 món", value: "3" },
    { label: "4. Nấu chung với 3 món", value: "4" },
  ];

  const cuisineTypes = [
    { label: "Miền Bắc", value: "Northern" },
    { label: "Miền Trung", value: "Central" },
    { label: "Miền Nam", value: "Southern" },
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
  };

  const handleBasePrice = (text) => {
    if (validatePrice(text)) {
      setBasePrice(text);
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
    const fetchChefId = async () => {
      try {
        setLoading(true);
        const userId = await AsyncStorage.getItem("@userId");
        if (!userId) {
          Toast.show({
            type: "error",
            text1: "Error",
            text2: "User not logged in.",
            position: "top",
          });
          return;
        }

        // Gọi API GET /api/v1/chefs để lấy danh sách chef
        const response = await AXIOS_API.get("/chefs", {
          params: {
            pageNo: 0,
            pageSize: 100,
            sortBy: "id",
            sortDir: "asc",
          },
        });

        // Tìm chef có userId khớp với userId hiện tại
        const chefs = response.data.content; // Dựa trên cấu trúc trả về của ChefsResponse
        const currentUserId = parseInt(userId);
        const chef = chefs.find((chef) => chef.user.id === currentUserId);

        if (!chef) {
          throw new Error("Chef not found for this user.");
        }

        setChefId(chef.id);
        console.log("Chef ID:", chef.id);
      } catch (error) {
        console.error("Error fetching chef ID:", error.response ? error.response.data : error.message);
        Toast.show({
          type: "error",
          text1: "Error",
          text2: "Failed to fetch chef ID.",
          position: "top",
        });
      } finally {
        setLoading(false);
      }
    };

    const fetchFoodTypes = async () => {
      try {
        const response = await AXIOS_API.get("/food-types");
        const formattedFoodTypes = response.data.map((item) => ({
          label: item.name,
          value: item.id.toString(),
        }));
        setFoodTypes(formattedFoodTypes);
      } catch (error) {
        console.error("Error fetching food types:", error);
        Toast.show({
          type: "error",
          text1: "Error",
          text2: "Failed to load food types.",
          position: "top",
        });
      }
    };

    fetchChefId();
    fetchFoodTypes();
  }, []);

  const handleSave = async () => {
    if (loading) {
      Toast.show({
        type: "info",
        text1: "Please wait",
        text2: "Fetching chef ID...",
        position: "top",
      });
      return;
    }

    if (!chefId) {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Chef ID not available.",
        position: "top",
      });
      return;
    }

    let newError = {};
    if (!foodName.trim()) newError.foodName = "Food Name is required";
    if (!cookTime.trim()) newError.cookTime = "Cook Time is required";
    if (!details.trim()) newError.details = "Details is required";
    if (!estimatedCookGroup) newError.estimatedCookGroup = "Estimate Cook Group is required";
    if (!type) newError.type = "Food Type is required";
    if (!cuisineType) newError.cuisineType = "Cuisine Type is required";
    if (!basePrice.trim()) newError.basePrice = "Base Price is required";

    if (Object.keys(newError).length > 0) {
      setErrors(newError);
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Please fill in all the required fields",
        position: "top",
      });
      return;
    }

    const formData = new FormData();
    formData.append("name", foodName);
    formData.append("description", details);
    formData.append("cookTime", cookTime);
    formData.append("estimatedCookGroup", estimatedCookGroup);
    formData.append("foodTypeId", type);
    formData.append("cuisineType", cuisineType);
    formData.append("serviceType", "Home Cooking");
    formData.append("basePrice", basePrice);
    formData.append("chefId", chefId);

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

    try {
      console.log("Form data values:", {
        name: foodName,
        description: details,
        cookTime,
        estimatedCookGroup,
        foodTypeId: type,
        cuisineType,
        serviceType: "Home Cooking",
        basePrice,
        chefId,
        file: image ? { uri: image, name: image.split("/").pop() } : null,
      });

      const response = await AXIOS_API.post("/dishes", formData);
      console.log("API response:", response.data);

      if (response.status === 201) {
        Toast.show({
          type: "success",
          text1: "Success",
          text2: "Food added successfully",
          position: "top",
        });

        setTimeout(() => {
          router.back();
        }, 1000);

        setFoodName("");
        setImage(null);
        setDetails("");
        setCookTime("");
        setType("");
        setCuisineType("");
        setBasePrice("");
        setEstimatedCookGroup("");
        setErrors({});
        setDishes((prev) => [...prev, response.data]);
      }
    } catch (error) {
      console.error(
        "Error creating dish:",
        error.response ? error.response.data : error.message
      );
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Failed to add food. Please try again.",
        position: "top",
      });
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <Header title="Add New Food" />
        <ScrollView
          contentContainerStyle={styles.scrollViewContent}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.label}>FOOD NAME</Text>
          <TextInput
            mode="outlined"
            value={foodName}
            onChangeText={setFoodName}
            placeholder="Enter food name"
            style={[styles.input, errors.foodName && styles.inputError]}
            disabled={loading}
          />
          {errors.foodName && (
            <Text style={styles.errorText}>{errors.foodName}</Text>
          )}

          <Text style={styles.label}>UPLOAD PHOTO</Text>
          <View style={styles.uploadContainer}>
            <TouchableOpacity style={styles.uploadBox} onPress={pickImage} disabled={loading}>
              {image ? (
                <Image source={{ uri: image }} style={styles.image} />
              ) : (
                <>
                  <MaterialIcons name="cloud-upload" size={24} color="#A18CD1" />
                  <Text style={styles.uploadText}>Add</Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          <Text style={styles.label}>COOK TIME (minutes)</Text>
          <TextInput
            mode="outlined"
            value={cookTime}
            placeholder="Enter time"
            keyboardType="numeric"
            style={[styles.input, errors.cookTime && styles.inputError]}
            onChangeText={handleCookTime}
            disabled={loading}
          />
          {errors.cookTime && (
            <Text style={styles.errorText}>{errors.cookTime}</Text>
          )}

          <Text style={styles.label}>FOOD TYPE</Text>
          <View style={styles.dropdownContainer}>
            <Dropdown
              style={[styles.dropdown, errors.type && styles.inputError]}
              data={foodTypes}
              labelField="label"
              valueField="value"
              placeholder="Select a food type"
              value={type}
              onChange={(item) => setType(item.value)}
              renderRightIcon={() => (
                <MaterialIcons name="arrow-drop-down" size={24} color="#555" />
              )}
              selectedTextStyle={styles.selectedTextStyle}
              placeholderStyle={styles.placeholderStyle}
              containerStyle={styles.dropdownMenu}
              itemTextStyle={styles.itemTextStyle}
              disabled={loading}
            />
          </View>
          {errors.type && <Text style={styles.errorText}>{errors.type}</Text>}

          <Text style={styles.label}>CUISINE TYPE</Text>
          <View style={styles.dropdownContainer}>
            <Dropdown
              style={[styles.dropdown, errors.cuisineType && styles.inputError]}
              data={cuisineTypes}
              labelField="label"
              valueField="value"
              placeholder="Select a cuisine type"
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
          </View>
          {errors.cuisineType && (
            <Text style={styles.errorText}>{errors.cuisineType}</Text>
          )}

          <Text style={styles.label}>BASE PRICE</Text>
          <TextInput
            mode="outlined"
            value={basePrice}
            placeholder="Enter base price"
            keyboardType="numeric"
            style={[styles.input, errors.basePrice && styles.inputError]}
            onChangeText={handleBasePrice}
            disabled={loading}
          />
          {errors.basePrice && (
            <Text style={styles.errorText}>{errors.basePrice}</Text>
          )}

          <Text style={styles.label}>ESTIMATE COOK GROUP</Text>
          <View style={styles.dropdownContainer}>
            <Dropdown
              style={[styles.dropdown, errors.estimatedCookGroup && styles.inputError]}
              data={cookGroups}
              labelField="label"
              valueField="value"
              placeholder="Select an estimate cook group"
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
          </View>
          {errors.estimatedCookGroup && (
            <Text style={styles.errorText}>{errors.estimatedCookGroup}</Text>
          )}

          <Text style={styles.label}>DETAILS</Text>
          <TextInput
            mode="outlined"
            value={details}
            onChangeText={setDetails}
            placeholder="Enter food details"
            multiline
            numberOfLines={5}
            style={[
              styles.input,
              styles.textArea,
              errors.details && styles.inputError,
              { textAlignVertical: "top", height: 100 },
            ]}
            disabled={loading}
          />
          {errors.details && (
            <Text style={styles.errorText}>{errors.details}</Text>
          )}
        </ScrollView>
      </KeyboardAvoidingView>

      <TouchableOpacity
        style={styles.saveButton}
        activeOpacity={0.8}
        onPress={handleSave}
        disabled={loading}
      >
        <Text style={styles.saveButtonText}>{loading ? "LOADING..." : "SAVE"}</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9F9F9",
  },
  scrollViewContent: {
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  label: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#555",
    marginBottom: 5,
    marginTop: 10,
  },
  input: {
    marginBottom: 15,
  },
  inputError: {
    borderColor: "red",
  },
  textArea: {
    height: 100,
  },
  errorText: {
    color: "red",
    fontSize: 14,
    marginBottom: 10,
  },
  uploadContainer: {
    flexDirection: "row",
    gap: 10,
  },
  uploadBox: {
    width: 100,
    height: 100,
    backgroundColor: "#E0E0E0",
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  uploadText: {
    fontSize: 12,
    color: "#A18CD1",
  },
  image: {
    width: "100%",
    height: "100%",
    borderRadius: 10,
  },
  dropdownContainer: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 5,
    marginBottom: 15,
  },
  dropdown: {
    height: 50,
    paddingHorizontal: 10,
  },
  selectedTextStyle: {
    fontSize: 14,
    color: "#555",
  },
  placeholderStyle: {
    fontSize: 14,
    color: "#999",
  },
  dropdownMenu: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 5,
  },
  itemTextStyle: {
    fontSize: 14,
    color: "#555",
  },
  saveButton: {
    position: "absolute",
    bottom: 20,
    left: 16,
    right: 16,
    backgroundColor: "#FF7622",
    borderRadius: 12,
    height: 60,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 20,
    zIndex: 10,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
  saveButtonText: {
    fontSize: 17,
    fontWeight: "bold",
    color: "white",
    textAlign: "center",
    width: "100%",
  },
});

export default AddNewFoodScreen;