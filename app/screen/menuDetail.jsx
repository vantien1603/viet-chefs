import React, { useEffect, useState } from "react";
import {
  Image,
  StyleSheet,
  Text,
  View,
  FlatList,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import Header from "../../components/header";
import useAxios from "../../config/AXIOS_API";

const MenuDetails = () => {
  const router = useRouter();
  const { menuId, menuName, chefId } = useLocalSearchParams();
  const [menuDetails, setMenuDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const axiosInstance = useAxios();

  useEffect(() => {
    const fetchMenuDetails = async () => {
      try {
        const response = await axiosInstance.get(`/menus/${menuId}`);
        setMenuDetails(response.data);
        console.log("Menu details:", response.data);
      } catch (error) {
        console.log("Error fetching menu details:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchMenuDetails();
  }, [menuId]);

  // const handleDishPress = (dish) => {
  //   router.push({
  //     pathname: "/screen/dishDetails",
  //     params: {
  //       dishId: dish.dishId,
  //       dishName: dish.dishName,
  //       menuId,
  //       chefId,
  //     },
  //   });
  // };

  const renderDishItem = ({ item }) => (
    <TouchableOpacity
      style={styles.dishCard}
      // onPress={() => handleDishPress(item)}
      activeOpacity={0.8}
    >
      <View style={styles.dishImageContainer}>
        <Image
          source={require("../../assets/images/1.jpg")} //ảnh mặc định
          style={styles.dishImage}
        />
      </View>
      <View style={styles.dishTextContainer}>
        <Text style={styles.dishName}>{item.dishName || "Unnamed Dish"}</Text>
        <Text style={styles.dishDescription}>
          {item.description || ""}
        </Text>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <Header title="Menu Details" />
        <View style={styles.loadingContainer}>
          <Text>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!menuDetails) {
    return (
      <SafeAreaView style={styles.container}>
        <Header title="Menu Details" />
        <View style={styles.loadingContainer}>
          <Text>No menu details available.</Text>
        </View>
      </SafeAreaView>
    );
  }

  const menuItems = Array.isArray(menuDetails.menuItems)
    ? menuDetails.menuItems
    : [];

  return (
    <SafeAreaView style={styles.container}>
      <Header title={menuName || "Menu Details"} />
      <View style={styles.contentContainer}>
        <FlatList
          data={menuItems}
          keyExtractor={(item, index) =>
            item && item.dishId ? item.dishId.toString() : index.toString()
          }
          renderItem={renderDishItem}
          numColumns={2}
          key="two-columns"
          ListHeaderComponent={
            <View style={styles.menuHeader}>
              <Text style={styles.menuDescription}>
                {menuDetails.description || "No description available."}
              </Text>
            </View>
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>
                No dishes available in this menu.
              </Text>
            </View>
          }
          contentContainerStyle={styles.flatListContent}
          showsVerticalScrollIndicator={true}
        />
      </View>
    </SafeAreaView>
  );
};

export default MenuDetails;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FDFBF6",
  },
  contentContainer: {
    flex: 1,
  },
  flatListContent: {
    paddingBottom: 100,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  menuHeader: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#F8BF40",
  },
  menuDescription: {
    fontSize: 16,
    color: "#A9411D",
    textAlign: "center",
  },
  dishCard: {
    flex: 1,
    backgroundColor: "#A9411D",
    borderRadius: 16,
    padding: 16,
    margin: 10,
    alignItems: "center",
    maxWidth: "45%",
  },
  dishImageContainer: {
    width: 80,
    height: 80,
    borderRadius: 20,
    backgroundColor: "#FFF",
    overflow: "hidden",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#F8BF40",
  },
  dishImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  dishTextContainer: {
    alignItems: "center",
  },
  dishName: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#FFF",
    marginBottom: 5,
    textAlign: "center",
  },
  dishDescription: {
    fontSize: 12,
    color: "#F8BF40",
    textAlign: "center",
  },
  emptyContainer: {
    padding: 20,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 16,
    color: "#A9411D",
  },
});
