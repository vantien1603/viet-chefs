import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import useAxios from "../../config/AXIOS_API";
import { router, useLocalSearchParams } from "expo-router";

const DishDetails = () => {
  const navigation = useNavigation();
  const { dishId, dishName, menuId, chefId } = useLocalSearchParams();
  const [dish, setDish] = useState({});
  const [chef, setChef] = useState(null);
  const axiosInstance = useAxios();
  const [selectedDishes, setSelectedDishes] = useState([]);
  const [dishNotes, setDishNotes] = useState({});

  useEffect(() => {
    let isMounted = true;
    const fetchDishDetails = async () => {
      try {
        const response = await axiosInstance.get(`/dishes/${dishId}`);
        if (isMounted) {
          setDish(response.data);
          // Auto-add dish only if from MenuDetails (menuId present)
          if (menuId && response.data.id && !selectedDishes.some((item) => item.id === response.data.id)) {
            setSelectedDishes([
              {
                id: response.data.id,
                name: response.data.name || dishName,
                imageUrl: response.data.imageUrl,
              },
            ]);
          }
          console.log("dish details", response.data);
        }
      } catch (error) {
        console.error("Error fetching dish details:", error);
      }
    };
    fetchDishDetails();
    return () => {
      isMounted = false;
    };
  }, [dishId, dishName, menuId]);

  useEffect(() => {
    let isMounted = true;
    const fetchChefDetails = async () => {
      const chefIdToFetch = dish.chefId || chefId;
      if (chefIdToFetch) {
        try {
          const response = await axiosInstance.get(`/chefs/${chefIdToFetch}`);
          if (isMounted) {
            setChef(response.data);
            console.log("chef details", response.data);
          }
        } catch (error) {
          console.error("Error fetching chef details:", error);
        }
      }
    };
    fetchChefDetails();
    return () => {
      isMounted = false;
    };
  }, [dish.chefId, chefId]);

  const handleAddItem = () => {
    if (dish.id && !selectedDishes.some((item) => item.id === dish.id)) {
      setSelectedDishes((prev) => [
        ...prev,
        {
          id: dish.id,
          name: dish.name || dishName,
          imageUrl: dish.imageUrl,
        },
      ]);
    }
  };

  const handleBooking = () => {
    router.push({
      pathname: "/screen/booking",
      params: {
        chefId: dish.chefId?.toString() || chefId,
        selectedDishes: JSON.stringify(selectedDishes),
        dishNotes: JSON.stringify(dishNotes),
        latestDishId: dish.id?.toString(),
      },
    });
  };

  const handleBack = () => {
    if (menuId) {
      router.push({
        pathname: "/screen/menuDetails",
        params: {
          menuId,
          menuName,
          chefId,
          selectedDishes: JSON.stringify(selectedDishes),
          latestDishId: dish.id?.toString(),
        },
      });
    } else {
      navigation.goBack();
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: dish?.imageUrl }}
            style={styles.dishImage}
            resizeMode="cover"
          />
          <TouchableOpacity
            style={styles.backButton}
            onPress={handleBack}
          >
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
        </View>

        <View style={styles.header}>
          <Text style={styles.dishName}>{dish.name || dishName}</Text>
        </View>

        <Text style={styles.description}>{dish.description}</Text>

        <View style={styles.detailsContainer}>
          <View style={styles.detailItem}>
            <Ionicons name="restaurant-outline" size={20} color="#555" />
            <Text style={styles.detailText}>Cuisine: {dish.cuisineType}</Text>
          </View>
          <View style={styles.detailItem}>
            <Ionicons name="home-outline" size={20} color="#555" />
            <Text style={styles.detailText}>Type: {dish.serviceType}</Text>
          </View>
          <View style={styles.detailItem}>
            <Ionicons name="time-outline" size={20} color="#555" />
            <Text style={styles.detailText}>
              Cook Time: {dish.cookTime} mins
            </Text>
          </View>
        </View>

        {chef && (
          <View style={styles.chefContainer}>
            <Text style={styles.sectionTitle}>Đầu bếp</Text>
            <View style={styles.chefInfo}>
              <Image
                source={{
                  uri:
                    chef.user?.avatarUrl && chef.user.avatarUrl !== "default"
                      ? chef.user.avatarUrl
                      : "https://via.placeholder.com/50",
                }}
                style={styles.chefAvatar}
                resizeMode="cover"
              />
              <View style={styles.chefText}>
                <Text style={styles.chefName}>
                  {chef.user?.fullName || "Đầu bếp"}
                </Text>
                <Text style={styles.chefBio} numberOfLines={2}>
                  {chef.bio || "Không có thông tin"}
                </Text>
              </View>
            </View>
          </View>
        )}
      </ScrollView>

      {!menuId && (
        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={selectedDishes.length > 0 ? handleBooking : handleAddItem}
          >
            <Text style={styles.actionButtonText}>
              {selectedDishes.length > 0
                ? `Booking - ${selectedDishes.length} item${selectedDishes.length > 1 ? "s" : ""}`
                : "Add Item"}
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
    backgroundColor: "#EBE5DD",
  },
  imageContainer: {
    position: "relative",
  },
  dishImage: {
    width: "100%",
    height: 250,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  backButton: {
    position: "absolute",
    top: 16,
    left: 16,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    borderRadius: 20,
    padding: 8,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
  },
  dishName: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
  },
  description: {
    fontSize: 16,
    color: "#666",
    paddingHorizontal: 16,
    marginBottom: 16,
    lineHeight: 24,
  },
  detailsContainer: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  detailItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  detailText: {
    fontSize: 16,
    color: "#555",
    marginLeft: 8,
  },
  chefContainer: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 12,
  },
  chefInfo: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF",
    borderRadius: 12,
    padding: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  chefAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
  },
  chefText: {
    flex: 1,
  },
  chefName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
  },
  chefBio: {
    fontSize: 14,
    color: "#666",
    marginTop: 4,
  },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#EBE5DD",
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

export default DishDetails;