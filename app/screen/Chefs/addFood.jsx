import React, { useState } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  FlatList,
} from "react-native";
import { TextInput, Button } from "react-native-paper";
import * as ImagePicker from "expo-image-picker";
import { MaterialIcons } from "@expo/vector-icons";
import Header from "../../../components/header";
import Toast from "react-native-toast-message";

const ingredientsList = [
  { id: "1", name: "Salt", icon: "🧂" },
  { id: "2", name: "Chicken", icon: "🍗" },
  { id: "3", name: "Onion", icon: "🧅" },
  { id: "4", name: "Garlic", icon: "🧄" },
  { id: "5", name: "Peppers", icon: "🌶️" },
  { id: "6", name: "Ginger", icon: "🫚" },
];

const AddNewFoodScreen = () => {
  const [foodName, setFoodName] = useState("");
  const [image, setImage] = useState(null);
  const [details, setDetails] = useState("");
  const [cookTime, setCookTime] = useState("");
  const [selectedIngredients, setSelectedIngredients] = useState([]);

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
    Toast.show({
        type: "success",
        text1: "Success",
        text2: "Food added successfully",
        position: "top",
      });
    
      // Reset lại các state về giá trị ban đầu
      setFoodName("");
      setImage(null);
      setDetails("");
      setCookTime("");
      setSelectedIngredients([]);
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

  const toggleIngredient = (id) => {
    setSelectedIngredients((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  return (
    <View style={styles.container}>
      <Header title="Add New Foods" />

      <Text style={styles.label}>FOOD NAME</Text>
      <TextInput
        mode="outlined"
        value={foodName}
        onChangeText={setFoodName}
        placeholder="Enter food name"
        style={styles.input}
      />

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

      <Text style={styles.label}>COOK TIME (minutes)</Text>
      <TextInput
        mode="outlined"
        value={cookTime}
        placeholder="Enter time"
        keyboardType="numeric"
        style={styles.input}
        onChangeText={handleCookTime}
      />

      <View>
        <Text style={styles.label}>INGREDIENTS</Text>
        <FlatList
          data={ingredientsList}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.ingredientItem,
                selectedIngredients.includes(item.id) &&
                  styles.ingredientSelected,
              ]}
              onPress={() => toggleIngredient(item.id)}
            >
              <Text style={styles.ingredientIcon}>{item.icon}</Text>
              <Text style={styles.ingredientText}>{item.name}</Text>
            </TouchableOpacity>
          )}
        />
      </View>

      <Text style={styles.label}>DETAILS</Text>
      <TextInput
        mode="outlined"
        value={details}
        onChangeText={setDetails}
        placeholder="Enter food details"
        multiline
        numberOfLines={5}
        style={[styles.input, { textAlignVertical: "top", height: 100 }]}
      />

      <TouchableOpacity
        style={styles.saveButton}
        activeOpacity={0.8}
        onPress={handleSave}
      >
        <Text style={styles.saveButtonText}>SAVE</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: "#F9F9F9",
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
  ingredientItem: {
    width: 80,
    height: 80,
    alignItems: "center",
    padding: 10,
    marginRight: 10,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: "#ddd",
    backgroundColor: "white",
  },
  ingredientSelected: {
    backgroundColor: "#FFEDD5",
    borderColor: "orange",
  },
  ingredientIcon: {
    fontSize: 24,
  },
  ingredientText: {
    fontSize: 12,
    color: "#333",
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
