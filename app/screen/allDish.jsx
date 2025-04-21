import {
  View,
  Text,
  Image,
  FlatList,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  ScrollView,
} from "react-native";
import React, { useEffect, useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import Header from "../../components/header";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import useAxios from "../../config/AXIOS_API";
import { router } from "expo-router";
import { commonStyles } from "../../style";
import { t } from "i18next";

const AllDishScreen = () => {
  const [dishes, setDishes] = useState([]);
  const [filteredDishes, setFilteredDishes] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const axiosInstance = useAxios();

  useEffect(() => {
    const fetchDishes = async () => {
      try {
        const response = await axiosInstance.get("/dishes");
        setDishes(response.data.content);
        setFilteredDishes(response.data.content);
      } catch (error) {
        console.log("Error dishes:", error);
      }
    };
    fetchDishes();
  }, []);

  // Hàm xử lý tìm kiếm
  const handleSearch = (query) => {
    setSearchQuery(query);
    if (query.trim() === "") {
      setFilteredDishes(dishes); // Nếu không có từ khóa, hiển thị tất cả món
    } else {
      const filtered = dishes.filter((item) =>
        item.name.toLowerCase().includes(query.toLowerCase())
      );
      setFilteredDishes(filtered);
    }
  };

  // Hàm xử lý khi nhấn icon search
  const toggleSearch = () => {
    setIsSearching(!isSearching);
    if (isSearching) {
      setSearchQuery(""); // Xóa từ khóa khi đóng tìm kiếm
      setFilteredDishes(dishes); // Hiển thị lại tất cả món
    }
  };

  // Chia danh sách món ăn thành nhóm 2 món mỗi hàng
  const groupedDishes = [];
  for (let i = 0; i < filteredDishes.length; i += 2) {
    groupedDishes.push(filteredDishes.slice(i, i + 2));
  }

  return (
    <SafeAreaView style={commonStyles.container}>
      <Header
        title={t("allDishes")}
        rightIcon={"search"}
        onRightPress={toggleSearch}
      />

      {isSearching && (
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search dishes..."
            value={searchQuery}
            onChangeText={handleSearch}
            autoFocus={true}
          />
          <TouchableOpacity onPress={toggleSearch} style={styles.closeSearch}>
            <MaterialIcons name="close" size={24} color="#4EA0B7" />
          </TouchableOpacity>
        </View>
      )}

      <FlatList
        data={dishes}
        keyExtractor={(item) => item.id.toString()}
        numColumns={2}
        columnWrapperStyle={{ justifyContent: "space-between", marginBottom: 15 }}
        contentContainerStyle={{ padding: 10, gap: 20, paddingVertical: 30 }}

        renderItem={({ item: dish }) => (
          <TouchableOpacity
            style={[
              styles.cardContainer,
            ]}
            onPress={() =>
              router.push({
                pathname: "/screen/dishDetails",
                params: { dishId: dish.id },
              })
            }
          >
            <View style={styles.card}>
              <View style={styles.imageContainer}>
                <Image
                  source={{ uri: dish.imageUrl }}
                  style={styles.image}
                  defaultSource={require("../../assets/images/1.jpg")}
                />
              </View>
              <Text style={styles.title}>{dish.name}</Text>
              <Text style={styles.description}>{dish.description}</Text>
              <Text style={styles.cookTime}>~ {dish.cookTime} minutes</Text>
            </View>
          </TouchableOpacity>
        )}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FDFBF6",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    marginVertical: 10,
  },
  searchInput: {
    flex: 1,
    backgroundColor: "#FFF",
    borderRadius: 10,
    padding: 10,
    fontSize: 16,
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  closeSearch: {
    marginLeft: 10,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    marginBottom: 24,
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
    //   height:'100%',
    height: 220,
    position: "relative",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    //   elevation: 5,
  },
  imageContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#FFF",
    overflow: "hidden",
    position: "absolute",
    top: -30,
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
    marginBottom: 4,
  },
  description: {
    fontSize: 13,
    color: "#F8BF40",
    textAlign: "center",
    marginBottom: 6,
  },
  cookTime: {
    fontSize: 13,
    color: "#FFFFFFAA",
    textAlign: "center",
  },
});


export default AllDishScreen;
