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
    <SafeAreaView style={commonStyles.containerContent}>
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
        data={groupedDishes}
        keyExtractor={(item, index) => index.toString()}
        renderItem={({ item }) => (
          <View style={styles.row}>
            {item.map((dish) => (
              <View key={dish.id} style={styles.cardContainer}>
                <TouchableOpacity
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
                        resizeMode="cover"
                      />
                    </View>
                    <Text style={styles.title}>{dish.name}</Text>
                    <Text style={{ color: "#F8BF40" }}>{dish.description}</Text>
                    <Text style={{ color: "#FFF" }}>
                      ~ {dish.cookTime} {t("minutes")}
                    </Text>
                  </View>
                </TouchableOpacity>
              </View>
            ))}
          </View>
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
  },
  card: {
    backgroundColor: "#A9411D",
    borderRadius: 16,
    paddingTop: 90,
    paddingBottom: 20,
    paddingHorizontal: 12,
    alignItems: "center",
    width: "100%",
    position: "relative",
    minHeight: 200,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    marginTop: 30,
  },
  imageContainer: {
    width: 130,
    height: 130,
    borderRadius: 65,
    backgroundColor: "#FFF",
    overflow: "hidden",
    position: "absolute",
    top: -30,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#EAEAEA",
  },
  image: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  title: {
    fontSize: 17,
    fontWeight: "bold",
    color: "#FFF",
    marginTop: 12,
    textAlign: "center",
    marginBottom: 6,
  },
});


export default AllDishScreen;
