import React, { useState } from "react";
import {
  Text,
  TextInput,
  View,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Header from "../../../components/header";
import { Picker } from "@react-native-picker/picker";
import Toast from "react-native-toast-message";
import * as ImagePicker from "expo-image-picker";
import { MaterialIcons } from "@expo/vector-icons";

const EditFoodScreen = () => {
  const [foodName, setFoodName] = useState("");
  const [image, setImage] = useState(null);
  const [cookingTime, setCookingTime] = useState("");
  const [foodType, setFoodType] = useState("Non-Veg");
  const [category, setCategory] = useState("Mon xao");
  const [description, setDescription] = useState("");

  const [errors, setErrors] = useState({});

  const categories = [
    "Món xào",
    "Món chiên",
    "Món hấp",
    "Món canh",
    "Món nướng",
  ];

  const handleSave = () => {
    let newErrors = {};
    if (!foodName.trim()) newErrors.foodName = "Food Name is required";
    if (!cookingTime.trim()) newErrors.cookingTime = "Cooking Time is required";
    if (!description.trim()) newErrors.description = "Description is required";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      Toast.show({
        type: t("modal.error"),
        text1: t("modal.error"),
        text2: "Please fill in all the required fields",
        position: "top",
      });
      return;
    }

    console.log({
      foodName,
      cookingTime,
      foodType,
      category,
      description,
    });

    // Toast.show({
    //   type:,
    //   text1:,
    //   text2: "Food updated successfully",
    //   position: "top",
    // });
    setErrors({});
  };

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [4, 4],
      quality: 1,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  const handleCookingTime = (text) => {
    if (/^\d*$/.test(text)) {
      setCookingTime(text);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Header title="Edit Food" />
      <View style={styles.form}>
        <Text style={styles.label}>Food Name</Text>
        <TextInput
          style={[styles.input, errors.foodName && styles.inputError]}
          value={foodName}
          onChangeText={setFoodName}
          placeholder="Enter food name"
        />
        {errors.foodName && (
          <Text style={styles.errorText}>{errors.foodName}</Text>
        )}

        <Text style={styles.label}>UPLOAD PHOTO</Text>
        <View style={styles.uploadContainer}>
          <TouchableOpacity style={styles.uploadBox} onPress={pickImage}>
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

        <Text style={styles.label}>Cooking Time (minutes)</Text>
        <TextInput
          style={[styles.input, errors.cookingTime && styles.inputError]}
          value={cookingTime}
          onChangeText={handleCookingTime}
          keyboardType="numeric"
          placeholder="Enter cooking time"
        />
        {errors.cookingTime && (
          <Text style={styles.errorText}>{errors.cookingTime}</Text>
        )}

        <Text style={styles.label}>Food Type</Text>
        <View style={styles.radioContainer}>
          <TouchableOpacity
            style={styles.radioOption}
            onPress={() => setFoodType("Veg")}
          >
            <View
              style={[
                styles.radioCircle,
                foodType === "Veg" && styles.radioSelected,
              ]}
            />
            <Text style={styles.radioText}>Veg</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.radioOption}
            onPress={() => setFoodType("Non-Veg")}
          >
            <View
              style={[
                styles.radioCircle,
                foodType === "Non-Veg" && styles.radioSelected,
              ]}
            />
            <Text style={styles.radioText}>Non-Veg</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.label}>Category</Text>
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={category}
            onValueChange={(itemValue) => setCategory(itemValue)}
          >
            <Picker.Item label="Select a category" value="" />
            {categories.map((cat, index) => (
              <Picker.Item key={index} label={cat} value={cat} />
            ))}
          </Picker>
        </View>

        <Text style={styles.label}>Description</Text>
        <TextInput
          style={[
            styles.input,
            styles.textArea,
            errors.description && styles.inputError,
          ]}
          value={description}
          onChangeText={setDescription}
          multiline
          placeholder="Enter food description"
        />
        {errors.description && (
          <Text style={styles.errorText}>{errors.description}</Text>
        )}
      </View>

      <TouchableOpacity
        style={styles.saveButton}
        activeOpacity={0.8}
        onPress={handleSave}
      >
        <Text style={styles.saveButtonText}>Save Changes</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  form: {
    marginTop: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 5,
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
  input: {
    borderWidth: 1,
    borderColor: "#CCCCCC",
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
    fontSize: 16,
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
  radioContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
  },
  radioOption: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 20,
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#333",
    marginRight: 8,
  },
  radioSelected: {
    backgroundColor: "#333",
  },
  radioText: {
    fontSize: 16,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: "#CCCCCC",
    borderRadius: 8,
    marginBottom: 15,
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
  },
  saveButtonText: {
    fontSize: 17,
    fontWeight: "bold",
    color: "white",
    textAlign: "center",
    width: "100%",
  },
});

export default EditFoodScreen;
