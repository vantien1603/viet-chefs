import React, { useContext, useEffect, useState } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
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
import useAxios from "../../config/AXIOS_API";
import { commonStyles } from "../../style";
import { AuthContext } from "../../config/AuthContext";

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
  const [loading, setLoading] = useState(false);
  const axiosInstance = useAxios();
  const { user } = useContext(AuthContext);
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
      try {
        const response = await axiosInstance.get("/food-types");
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

    if (!user?.userId) {
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
      const response = await axiosInstance.post("/dishes", formData);

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
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Failed to add food. Please try again.",
        position: "top",
      });
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
      <Header title="Add New Food" />
      <ScrollView
        style={commonStyles.containerContent}
        contentContainerStyle={styles.scrollViewContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.label}>Food name</Text>
        <TextInput
          value={foodName}
          onChangeText={handleFoodName}
          placeholder="Canh chua, xx"
          style={[styles.input, errors.foodName && styles.inputError]}
          disabled={loading}
        />

        <Text style={styles.label}>Upload photo</Text>
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

        <Text style={styles.label}>Cook time</Text>
        <TextInput
          value={cookTime}
          placeholder="Enter time"
          keyboardType="numeric"
          style={[styles.input, errors.cookTime && styles.inputError]}
          onChangeText={handleCookTime}
          disabled={loading}
        />

        <Text style={styles.label}>Food type</Text>
        <Dropdown
          style={[commonStyles.input, errors.type && styles.inputError]}
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

        <Text style={styles.label}>Cuisine type</Text>
        <Dropdown
          style={[commonStyles.input, errors.cuisineType && styles.inputError]}
          data={cuisineTypes}
          labelField="label"
          valueField="value"
          placeholder="Select cuisine type"
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

        <Text style={styles.label}>Estimated cook group</Text>
        <Dropdown
          style={[commonStyles.input, errors.estimatedCookGroup && styles.inputError]}
          data={cookGroups}
          labelField="label"
          valueField="value"
          placeholder="Select cook group"
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

        <Text style={styles.label}>Details</Text>
        <TextInput
          value={details}
          onChangeText={handleDetails}
          placeholder="Add details"
          multiline
          numberOfLines={4}
          style={[styles.input, styles.textArea, errors.details && styles.inputError]}
          disabled={loading}
        />

        <Text style={styles.label}>Base price</Text>
        <TextInput
          value={basePrice}
          placeholder="Enter base price"
          keyboardType="numeric"
          style={[styles.input, errors.basePrice && styles.inputError]}
          onChangeText={handleBasePrice}
          disabled={loading}
        />
      </ScrollView>
      <TouchableOpacity
        onPress={handleSave}
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
          <ActivityIndicator size={'small'} color={'white'} />
        ) : (
          <Text style={{ color: "white", fontWeight: "bold", fontSize: 16 }}>
            Save
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
    fontWeight: "600",
    color: "#333",
    marginBottom: 6,
    marginTop: 12,
  },
  input: {
    height: 48,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "#D1C7BC",
    paddingHorizontal: 12,
    backgroundColor: "#FFF8EF",
    fontSize: 15,
    marginBottom: 10,
  },
  inputError: {
    borderColor: "red",
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: "top",
  },
  errorText: {
    color: "red",
    fontSize: 13,
    marginTop: -8,
    marginBottom: 10,
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
    fontWeight: "600",
  },
  dropdownMenu: {
    marginBottom: 10,
  },
  itemTextStyle: {
    fontSize: 15,
  },
  selectedTextStyle: {
    fontSize: 15,
    color: "#333",
  },
  placeholderStyle: {
    fontSize: 15,
    color: "#999",
  },
});

export default AddNewFoodScreen;
