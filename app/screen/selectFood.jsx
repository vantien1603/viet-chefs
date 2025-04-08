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
import { useRouter } from "expo-router";
import Toast from "react-native-toast-message";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import Header from "../../components/header";
import useAxios from "../../config/AXIOS_API";

const SelectFood = () => {
  const router = useRouter();
  const [selectedItems, setSelectedItems] = useState({});
  const [menu, setMenu] = useState([]);
  const axiosInstance = useAxios();

  useEffect(() => {
    const fetchMenuFood = async () => {
      try {
        const response = await axiosInstance.get("/menus");
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

  const handleContinue = () => {
    // Lấy danh sách món ăn đã chọn
    const selectedDishes = menu
      .filter((food) => selectedItems[food.id])
      .map((food) => food.name);

    // if (selectedDishes.length === 0) {
    //   Toast.show({
    //     type: "error",
    //     text1: "Error",
    //     text2: "Please select at least one dish.",
    //   });
    //   return;
    // }

    // Truyền danh sách món ăn đã chọn qua query params
    router.push({
      pathname: "/screen/booking",
      params: { selectedDishes: JSON.stringify(selectedDishes) },
    });
  };

  // Chia danh sách menu thành nhóm 2 item mỗi hàng
  const groupedMenu = [];
  for (let i = 0; i < menu.length; i += 2) {
    groupedMenu.push(menu.slice(i, i + 2));
  }

  return (
    <SafeAreaView style={styles.container}>
      <Header title="Select Food" />

      <FlatList
        data={groupedMenu}
        keyExtractor={(item, index) => index.toString()}
        renderItem={({ item }) => (
          <View style={styles.row}>
            {item.map((food) => (
              <TouchableOpacity
                key={food.id}
                style={styles.cardContainer}
                onPress={() => toggleCheckbox(food.id)}
                activeOpacity={0.8}
              >
                <View style={styles.card}>
                  <View
                    style={[
                      styles.checkbox,
                      {
                        backgroundColor: selectedItems[food.id]
                          ? "#F8BF40"
                          : "transparent",
                        borderColor: selectedItems[food.id] ? "#F8BF40" : "#FFF",
                      },
                    ]}
                  >
                    {selectedItems[food.id] && (
                      <MaterialIcons
                        name="check"
                        size={20}
                        color="white"
                        style={styles.checkIcon}
                      />
                    )}
                  </View>

                  <View style={styles.imageContainer}>
                    <Image
                      // source={{ uri: food.imageUrl }}
                      source={require("../../assets/images/1.jpg")}
                      style={styles.image}
                    />
                  </View>

                  <Text style={styles.title}>{food.name}</Text>
                  <Text style={{ color: "#F8BF40" }}>{food.description}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      />

      <TouchableOpacity style={styles.continueButton} onPress={handleContinue}>
        <Text style={styles.continueButtonText}>Continue</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

export default SelectFood;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FDFBF6",
  },
  menuTitle: {
    textAlign: "center",
    fontSize: 20,
    fontWeight: "bold",
    marginVertical: 10,
    color: "#4EA0B7",
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 10,
    marginBottom: 10,
    marginTop: 10,
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
    borderRadius: 4,
    borderWidth: 2,
    justifyContent: "center",
    alignItems: "center",
  },
  checkIcon: {
    position: "absolute",
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