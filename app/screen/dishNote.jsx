// File: screen/DishNoteScreen.jsx
import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  SafeAreaView,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";

const DishNoteScreen = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  const {
    dishId,
    dishName,
    note: initialNote,
    chefId,
    selectedMenu,
    selectedDishes,
    dishNotes,
    imageUrl, // Add imageUrl to params if available
  } = params;
  const [currentNote, setCurrentNote] = useState(initialNote || "");

  const handleBack = () => {
    router.back();
  };

  const handleSave = () => {
    // Update the note in the dishNotes object
    const updatedDishNotes = JSON.parse(dishNotes || "{}");
    updatedDishNotes[dishId] = currentNote;

    router.push({
      pathname: "/screen/booking",
      params: {
        chefId,
        selectedMenu,
        selectedDishes,
        dishNotes: JSON.stringify(updatedDishNotes),
        updatedDishId: dishId,
        updatedNote: currentNote,
      },
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack}>
          <MaterialIcons name="close" size={24} color="black" />
        </TouchableOpacity>
      </View>

      <View style={styles.imageContainer}>
        <Image
          source={
            imageUrl
              ? { uri: imageUrl }
              : require("../../assets/images/1.jpg") // Use a placeholder if imageUrl is unavailable
          }
          style={styles.image}
        />
      </View>

      <View style={styles.dishInfo}>
        <Text style={styles.dishName}>{dishName || "Unnamed Dish"}</Text>
      </View>

      <View style={styles.noteContainer}>
        <View style={styles.noteHeader}>
          <Text style={styles.noteLabel}>Note to chef</Text>
          <View style={{ backgroundColor: "#CCCCCC", borderRadius: 10, padding: 5 }}>
            <Text style={styles.noteOptional}>Optional</Text>
          </View>
        </View>

        <TextInput
          style={styles.noteInput}
          placeholder="Add your request here..."
          value={currentNote}
          onChangeText={setCurrentNote}
          multiline
        />
      </View>

      <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
        <Text style={styles.saveButtonText}>Save Note</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFF",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 20,
  },
  imageContainer: {
    width: "100%",
    height: 200,
    justifyContent: "center",
    alignItems: "center",
  },
  image: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  dishInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderBottomColor: "#DDD",
    borderBottomWidth: 2,
  },
  dishName: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#000",
  },
  noteContainer: {
    paddingHorizontal: 20,
    marginVertical: 20,
  },
  noteHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 5,
  },
  noteLabel: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#000",
  },
  noteOptional: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#000",
  },
  noteInput: {
    borderWidth: 1,
    borderColor: "#AAAAAA",
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
    minHeight: 80,
    textAlignVertical: "top",
    marginTop: 10,
  },
  saveButton: {
    position: "absolute",
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: "#A64B2A",
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5,
  },
  saveButtonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 18,
    letterSpacing: 1,
  },
});

export default DishNoteScreen;