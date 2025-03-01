import React, { useState } from "react";
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
import { Picker } from "@react-native-picker/picker";
import Header from "../../../components/header";
import Toast from "react-native-toast-message";
import { SafeAreaView } from "react-native-safe-area-context";

const AddNewFoodScreen = () => {
  const [foodName, setFoodName] = useState("");
  const [image, setImage] = useState(null);
  const [details, setDetails] = useState("");
  const [cookTime, setCookTime] = useState("");
  const [type, setType] = useState("non-vegetarian");
  const [category, setCategory] = useState("");
  const [errors, setErrors] = useState({});

  const categories = [
    "Món xào",
    "Món chiên",
    "Món hấp",
    "Món canh",
    "Món nướng",
  ];

  const validateCookTime = (text) => {
    const regex = /^[0-9]*$/;
    return regex.test(text) && (text === "" || Number(text) > 0);
  };

  const handleCookTime = (text) => {
    if (validateCookTime(text)) {
      setCookTime(text);
    }
  };

  const handleSave = () => {
    let newError = {};
    if (!foodName.trim()) newError.foodName = "Food Name is required";
    if (!cookTime.trim()) newError.cookTime = "Cook Time is required";
    if (!details.trim()) newError.details = "Details is required";
    // if(!image) newError.image = "Image is required";

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
    Toast.show({
      type: "success",
      text1: "Success",
      text2: "Food added successfully",
      position: "top",
    });
    setErrors({});

    setFoodName("");
    setImage(null);
    setDetails("");
    setCookTime("");
    setType("non-vegetarian");
    setCategory("");
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
                  <MaterialIcons
                    name="cloud-upload"
                    size={24}
                    color="#A18CD1"
                  />
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
          />
          {errors.cookTime && (
            <Text style={styles.errorText}>{errors.cookTime}</Text>
          )}

          <Text style={styles.label}>TYPE</Text>
          <View style={styles.radioGroup}>
            <RadioButton.Group
              onValueChange={(newValue) => setType(newValue)}
              value={type}
            >
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <View style={styles.radioItem}>
                  <RadioButton value="vegetarian" />
                  <Text style={styles.radioText}>Vegetarian</Text>
                </View>
                <View style={styles.radioItem}>
                  <RadioButton value="non-vegetarian" />
                  <Text style={styles.radioText}>Non-Vegetarian</Text>
                </View>
              </View>
            </RadioButton.Group>
          </View>

          <Text style={styles.label}>CATEGORY</Text>
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

          <Text style={styles.label}>DETAILS</Text>
          <TextInput
            mode="outlined"
            value={details}
            onChangeText={setDetails}
            placeholder="Enter food details"
            multiline
            numberOfLines={5}
            // style={[styles.input, { textAlignVertical: "top", height: 100 }]}
            style={[
              styles.input,
              styles.textArea,
              errors.details && styles.inputError,
              { textAlignVertical: "top", height: 100 },
            ]}
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
      >
        <Text style={styles.saveButtonText}>SAVE</Text>
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
    paddingBottom: 100, // Để tránh bị che mất bởi nút SAVE
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
  radioGroup: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
  },
  radioItem: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 20,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 5,
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

export default AddNewFoodScreen;
