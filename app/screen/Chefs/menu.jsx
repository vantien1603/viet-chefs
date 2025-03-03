import React, { useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  View,
  Text,
  Image,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from "react-native";
import Header from "../../../components/header";
import { MaterialIcons } from "@expo/vector-icons";
import {
  GestureHandlerRootView,
  Swipeable,
} from "react-native-gesture-handler";
import { router } from "expo-router";

const initialFoodItems = [
  {
    id: "1",
    name: "Chicken Thai Biriyani",
    image: require("../../../assets/images/1.jpg"),
    type: "Non-Veg",
    category: "Rice Dish", // Món cơm
    cookingTime: 30,
  },
  {
    id: "2",
    name: "Chicken Bhuna",
    image: require("../../../assets/images/1.jpg"),
    type: "Non-Veg",
    category: "Stir-fried", // Món xào
    cookingTime: 45,
  },
  {
    id: "3",
    name: "Mazalichiken Halim",
    image: require("../../../assets/images/1.jpg"),
    type: "Non-Veg",
    category: "Soup", // Món súp
    cookingTime: 40,
  },
];

const MenuChefScreen = () => {
  const [foodItems, setFoodItems] = useState(initialFoodItems);
  
  const handleRemove = (id) => {
    Alert.alert("Confirm remove", "Are you sure you want to remove this item?", [
      {
        text: "Cancel",
        style: "cancel",
      }, 
      {
        text: "Yes",
        onPress: () => {
          setFoodItems(foodItems.filter((item) => item.id !== id));
        }
      }
    ])
  };

  const renderRightActions = (id) => (
    <TouchableOpacity
      style={styles.deleteButton}
      onPress={() => handleRemove(id)}
    >
      <Text style={styles.deleteText}>Remove</Text>
    </TouchableOpacity>
  );

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaView style={styles.container}>
        <Header
          title="My Food List"
          onRightPress={() => router.push("screen/Chefs/addFood")}
          rightIcon={"add"}
        />

        <Text style={styles.totalItems}>Total {foodItems.length} items</Text>
        <FlatList
          data={foodItems}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <Swipeable renderRightActions={() => renderRightActions(item.id)}>
              <TouchableOpacity
                onPress={() =>
                  router.push("screen/Chefs/foodDetail")
                }
              >
                <View style={styles.itemContainer}>
                  <Image source={item.image} style={styles.image} />
                  <View style={styles.detailsContainer}>
                    <Text style={styles.foodName}>{item.name}</Text>
                    
                    <View style={styles.infoRow}>
                      <Text style={styles.label}>Type: </Text>
                      <Text style={styles.infoText}>{item.type}</Text>
                    </View>

                    <View style={styles.infoRow}>
                      <Text style={styles.label}>Category: </Text>
                      <Text style={styles.infoText}>{item.category}</Text>
                    </View>

                    <View style={styles.timeContainer}>
                      <MaterialIcons name="timer" size={18} color="gray" />
                      <Text style={styles.cookingTime}>
                        {item.cookingTime} minutes
                      </Text>
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            </Swipeable>
          )}
        />
      </SafeAreaView>
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: "#F9F9F9",
  },
  totalItems: {
    fontSize: 14,
    color: "#666",
    marginVertical: 5,
  },
  itemContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF",
    padding: 10,
    borderRadius: 10,
    marginBottom: 5,
  },
  image: {
    width: 100,
    height: 100,
    borderRadius: 10,
    backgroundColor: "#CCC",
  },
  detailsContainer: {
    flex: 1,
    marginLeft: 10,
  },
  foodName: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 5,
  },
  infoRow: {
    flexDirection: "row",
    marginBottom: 2,
  },
  label: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#444",
  },
  infoText: {
    fontSize: 14,
    color: "#666",
  },
  timeContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 5,
  },
  cookingTime: {
    fontSize: 16,
    color: "gray",
  },
  deleteButton: {
    backgroundColor: "#CC0000",
    justifyContent: "center",
    alignItems: "center",
    width: 80,
    borderRadius: 10,
    marginLeft: 5,
    marginTop: 5,
  },
  deleteText: {
    color: "#FFF",
    fontWeight: "bold",
    fontSize: 16,
  },
});

export default MenuChefScreen;
