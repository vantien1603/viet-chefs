import React, { useEffect, useState } from "react";
import {
  Image,
  StyleSheet,
  Text,
  View,
  FlatList,
  TouchableOpacity,
  BackHandler,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import useAxios from "../../config/AXIOS_API";
import Header from "../../components/header";

const MenuDetails = () => {
  const router = useRouter();
  const {
    menuId,
    menuName,
    chefId,
    selectedDishes: paramSelectedDishes,
    latestDishId,
  } = useLocalSearchParams();
  const [menuDetails, setMenuDetails] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedDishes, setSelectedDishes] = useState([]);
  const axiosInstance = useAxios();

  useEffect(() => {
    const fetchMenuDetails = async () => {
      setLoading(true);
      try {
        const response = await axiosInstance.get(`/menus/${menuId}`);
        setMenuDetails(response.data);
        console.log("Menu details:", response.data);
      } catch (error) {
        if (error.response?.status === 401) {
          return;
        }
        if (axios.isCancel(error)) {
          return;
        }
        showModal("Error", "Có lỗi xảy ra trong quá trình tải dữ liệu.", "Failed");
      } finally {
        setLoading(false);
      }
    };
    fetchMenuDetails();
  }, [menuId]);

  useEffect(() => {
    if (paramSelectedDishes) {
      try {
        const parsedDishes = JSON.parse(paramSelectedDishes);
        setSelectedDishes((prev) => {
          const newDishes = parsedDishes.filter(
            (dish) => !prev.some((existing) => existing.id === dish.id)
          );
          return [...prev, ...newDishes];
        });
      } catch (error) {
        console.error("Error parsing selectedDishes:", error);
      }
    }
  }, [paramSelectedDishes]);

  useEffect(() => {
    const backAction = () => {
      router.push({
        pathname: "/screen/selectFood",
        params: {
          chefId,
          selectedMenu: JSON.stringify({
            id: parseInt(menuId),
            // name: menuName,
          }),
          selectedDishes: JSON.stringify(selectedDishes),
          latestDishId,
        },
      });
      return true;
    };

    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      backAction
    );

    return () => backHandler.remove();
  }, [router, chefId, menuId, menuName, selectedDishes, latestDishId]);

  const handleDishPress = (dish) => {
    router.push({
      pathname: "/screen/dishDetails",
      params: {
        dishId: dish.dishId,
        dishName: dish.dishName,
        menuId,
        chefId,
      },
    });
  };

  const handleBack = () => {
    router.push({
      pathname: "/screen/selectFood",
      params: {
        chefId,
        selectedMenu: JSON.stringify({ id: parseInt(menuId), name: menuName }),
        selectedDishes: JSON.stringify(selectedDishes),
        latestDishId,
      },
    });
  };

  const handleBooking = () => {
    router.push({
      pathname: "/screen/booking",
      params: {
        chefId,
        selectedMenu: JSON.stringify({ id: parseInt(menuId), name: menuName }),
        selectedDishes: JSON.stringify(selectedDishes),
        latestDishId,
        menuId,
      },
    });
  };

  const renderDishItem = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.dishCard,
        latestDishId &&
        item.dishId === parseInt(latestDishId) &&
        styles.latestDish,
      ]}
      onPress={() => handleDishPress(item)}
      activeOpacity={0.8}
    >
      <View style={styles.dishImageContainer}>
        <Image
          source={
            item.imageUrl
              ? { uri: item.imageUrl }
              : require("../../assets/images/1.jpg")
          }
          style={styles.dishImage}
        />
      </View>
      <View style={styles.dishTextContainer}>
        <Text style={styles.dishName}>{item.dishName || "Unnamed Dish"}</Text>
        <Text style={styles.dishDescription}>
          {item.description || t("noInformation")}
        </Text>
        {latestDishId && item.dishId === parseInt(latestDishId) && (
          <Text style={styles.latestTag}>Mới chọn</Text>
        )}
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <Header title={menuName || "Menu Details"} onLeftPress={handleBack} />

        <View style={styles.loadingContainer}>
          <Text>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!menuDetails) {
    return (
      <SafeAreaView style={styles.container}>
        <Header title={menuName || "Menu Details"} onLeftPress={handleBack} />

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
      <Header title={menuName || "Menu Details"} onLeftPress={handleBack} />

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
      {selectedDishes.length > 0 && (
        <View style={styles.footer}>
          <TouchableOpacity style={styles.actionButton} onPress={handleBooking}>
            <Text style={styles.actionButtonText}>
              Booking - {selectedDishes.length} item
              {selectedDishes.length > 1 ? "s" : ""}
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FDFBF6",
  },
  headerContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#F8BF40",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#A9411D",
    marginLeft: 10,
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
  latestDish: {
    borderWidth: 2,
    borderColor: "#F8BF40",
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
  latestTag: {
    fontSize: 12,
    color: "#FFF",
    backgroundColor: "#F8BF40",
    padding: 4,
    borderRadius: 4,
    marginTop: 5,
  },
  emptyContainer: {
    padding: 20,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 16,
    color: "#A9411D",
  },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#FDFBF6",
    padding: 20,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  actionButton: {
    width: "100%",
    backgroundColor: "#A64B2A",
    padding: 15,
    borderRadius: 12,
    alignItems: "center",
  },
  actionButtonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 18,
  },
});

export default MenuDetails;