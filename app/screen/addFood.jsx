import React, { useContext, useEffect, useState } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TextInput
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
        showModal("Error", "Có lỗi xảy ra trong quá trình tải dữ liệu loại món ăn.", "Failed");
      } finally {
        setLoading(false)
      }
    };
    fetchFoodTypes();
  }, []);

  const handleSave = async () => {
    let newError = {};
    if (!foodName.trim()) newError.foodName = "Food Name is required";
    if (!cookTime.trim()) newError.cookTime = "Cook Time is required";
    if (!details.trim()) newError.details = "Details is required";
    if (!estimatedCookGroup) newError.estimatedCookGroup = "Estimate Cook Group is required";
    if (selectedFoodTypeIds.length === 0) newError.type = "Food Type is required";
    if (!cuisineType) newError.cuisineType = "Cuisine Type is required";
    if (!basePrice.trim()) newError.basePrice = "Base Price is required";

    if (Object.keys(newError).length > 0) {
      setErrors(newError);
      showModal("Error", `Please fill in all the required fields`, "Failed");
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
      console.log("tao toa")
      if (response.status === 201 || response.status === 200) {
        showModal("Success", "Added new dish successfully", "Success");
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
      showModal("Error", "Failed to add food. Please try again.", "Failed");
    } finally {
      setLoading(false)
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
        <MultiSelect
          disable={loading}
          style={[styles.dropdown, errors.type && styles.inputError]}
          placeholder="Select Food Types"
          data={foodTypes}
          labelField="label"
          valueField="value"
          value={Array.isArray(selectedFoodTypeIds) ? selectedFoodTypeIds : []}
          onChange={(selectedIds) => {
            const safeSelectedIds = Array.isArray(selectedIds) ? selectedIds : [];
            setSelectedFoodTypeIds(safeSelectedIds);
            setSelectedFoodTypeIds(prev => safeSelectedIds);
          }}
          renderItem={(item) => {
            const isSelected = Array.isArray(selectedFoodTypeIds) && selectedFoodTypeIds.includes(item.value);
            return (
              <View style={{
                padding: 10,
                backgroundColor: isSelected ? '#F9F5F0' : 'white',
                borderWidth: 2,
                borderRadius: 6,
                borderColor: isSelected ? '#F8BF40' : 'transparent',
                flexDirection: 'row',
                alignItems: 'center'
              }}>
                <Text style={{ color: 'black' }}>{item.label}</Text>
              </View>
            );
          }}
          selectedStyle={{
            backgroundColor: '#f5f5f5',
            borderRadius: 10,
            color: 'black'
          }}
        />



        <Text style={styles.label}>Cuisine type</Text>
        <Dropdown
          style={[styles.dropdown, errors.cuisineType && styles.inputError]}
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
          style={[styles.dropdown, errors.estimatedCookGroup && styles.inputError]}
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
          style={[styles.textArea, errors.details && styles.inputError]}
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
  dropdown: {
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ccc',
    paddingHorizontal: 12,
    paddingVertical: 10,
    // marginLeft: 10,
    flex: 1,
  },
  input: {
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    // paddingVertical: 8,
    paddingHorizontal: 12,
    fontSize: 15,
    borderWidth: 1,
    borderColor: '#ccc',
    flex: 1,
    color: '#333',
  },
  inputError: {
    borderColor: "red",
  },
  textArea: {
    backgroundColor: '#f5f5f5',
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: '#333',
    minHeight: 120,
    textAlignVertical: 'top',
    marginBottom: 10,
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
