import React from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  View,
  Text,
  Image,
  FlatList,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import Header from "../../../components/header";
import { FontAwesome, MaterialIcons } from "@expo/vector-icons";
import { router } from "expo-router";

const foodItems = [
  {
    id: "1",
    name: "Chicken Thai Biriyani",
    image: require("../../../assets/images/1.jpg"),
    cookingTime: 30,
  },
  {
    id: "2",
    name: "Chicken Bhuna",
    image: require("../../../assets/images/1.jpg"),
    cookingTime: 45,
  },
  {
    id: "3",
    name: "Mazalichiken Halim",
    image: require("../../../assets/images/1.jpg"),
    cookingTime: 40,
  },
];

const MenuChefScreen = () => {
  return (
    <SafeAreaView style={styles.container}>
      <Header title="My Food List" onRightPress={() => router.push('screen/Chefs/addFood')} rightIcon={"add"}/>

      <Text style={styles.totalItems}>Total {foodItems.length} items</Text>
      <FlatList
        data={foodItems}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.itemContainer}>
            <Image source={item.image} style={styles.image} />
            <View style={styles.detailsContainer}>
              <Text style={styles.foodName}>{item.name}</Text>
              <View style={styles.timeContainer}>
                <MaterialIcons name="timer" size={18} color="gray" />
                <Text style={styles.cookingTime}>
                  {" "}
                  {item.cookingTime} minutes
                </Text>
              </View>
            </View>
          </View>
        )}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: "#F9F9F9",
  },
  tabContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginVertical: 10,
  },
  tabText: {
    fontSize: 16,
    color: "#999",
  },
  activeTab: {
    color: "orange",
    fontWeight: "bold",
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
    marginBottom: 10,
  },
  timeContainer: {
    flexDirection: 'row', 
    alignItems: 'center',
  },
  cookingTime: {
    fontSize: 16,
    color: 'gray',
  },
});

export default MenuChefScreen;
