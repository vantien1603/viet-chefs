import React, { useEffect, useState } from "react";
import {
  Image,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  FlatList,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Header from "../../components/header";
import { commonStyles } from "../../style";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import AXIOS_API from "../../config/AXIOS_API";

const SelectFood = () => {
  const [selectedItems, setSelectedItems] = useState({});
  const [menu, setMenu] = useState([]);

  useEffect(() => {
    const fetchMenuFood = async () => {
      try {
        const response = await AXIOS_API.get("/menus");
        setMenu(response.data.content);
      } catch (error) {
        console.log("Error fetching menu:", error);
      }
    };
    fetchMenuFood();
  }, []);

  const toggleCheckbox = (id) => {
    setSelectedItems((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  // Chia danh sách menu thành nhóm 2 item mỗi hàng
  const groupedMenu = [];
  for (let i = 0; i < menu.length; i += 2) {
    groupedMenu.push(menu.slice(i, i + 2));
  }

  return (
    <SafeAreaView style={commonStyles.containerContent}>
      <Header title="Select food" />
      <Text style={styles.menuTitle}>Menu</Text>

      <FlatList
        data={groupedMenu}
        keyExtractor={(item, index) => index.toString()}
        renderItem={({ item }) => (
          <View style={styles.row}>
            {item.map((food) => (
              <View key={food.id} style={styles.cardContainer}>
                <View style={styles.card}>
                  <TouchableOpacity
                    style={[
                      styles.checkbox,
                      {
                        backgroundColor: selectedItems[food.id]
                          ? "#F8BF40"
                          : "transparent",
                      },
                    ]}
                    onPress={() => toggleCheckbox(food.id)}
                  >
                    <MaterialIcons
                      name={
                        selectedItems[food.id]
                          ? "check-box"
                          : "check-box-outline-blank"
                      }
                      size={24}
                      color="white"
                    />
                  </TouchableOpacity>

                  <View style={styles.imageContainer}>
                    <Image source={{ uri: food.imageUrl }} style={styles.image} />
                  </View>

                  <Text style={styles.title}>{food.name}</Text>
                  <Text style={{ color: "#F8BF40" }}>{food.description}</Text>
                </View>
              </View>
            ))}
          </View>
        )}
      />

      <TouchableOpacity style={styles.continueButton}>
        <Text style={styles.continueButtonText}>Continue</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

export default SelectFood;

const styles = StyleSheet.create({
  menuTitle: {
    textAlign: "center",
    fontSize: 20,
    fontWeight: "bold",
    marginVertical: 10,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 10,
    marginBottom: 10,
  },
  cardContainer: {
    width: "48%",
    alignItems: "center",
  },
  card: {
    backgroundColor: "#A9411D",
    borderRadius: 16,
    padding: 16,
    paddingTop: 50,
    alignItems: "center",
    width: "100%",
    position: "relative",
  },
  imageContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#FFF",
    overflow: "hidden",
    marginBottom: 8,
    position: "absolute",
    top: -10,
    justifyContent: "center",
    alignItems: "center",
  },
  image: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  title: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#FFF",
    marginTop: 60,
    textAlign: "center",
    marginBottom: 5,
  },
  checkbox: {
    position: "absolute",
    top: 10,
    left: 10,
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: "#FFF",
    justifyContent: "center",
    alignItems: "center",
  },
  continueButton: {
    position: "absolute",
    bottom: 50,
    left: 20,
    right: 20,
    backgroundColor: "#A64B2A",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
  },
  continueButtonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
  },
});
