import React, { useContext, useEffect, useState } from "react";
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Header from "../../components/header"; // Assuming this is your custom header component
import { commonStyles } from "../../style"; // Common styles for your app
import useAxios from "../../config/AXIOS_API";
import { AuthContext } from "../../config/AuthContext";

const FavoriteScreen = () => {
  const axiosInstance = useAxios();
  const [favorites, setFavorites] = useState([]);
  const { user } = useContext(AuthContext);

  const fetchFavorite = async () => {
    try {
      const response = await axiosInstance.get(
        `/favorite-chefs/${user.userId}`
      );
      setFavorites(response.data.content);
      console.log("c", response.data.content);
    } catch (error) {
      console.log("err", error);
    }
  };
  useEffect(() => {
    fetchFavorite();
  }, []);
  return (
    <SafeAreaView style={commonStyles.containerContent}>
      <Header title="Favorite List" />
      <ScrollView>
        {favorites.length > 0 ? (
          favorites.map((chef) => (
            <TouchableOpacity key={chef.id} style={styles.card}>
              <View style={styles.row}>
                <Image
                  source={{ uri: chef?.chefAvatar }}
                  style={styles.avatar}
                  resizeMode="cover"
                />
                <View style={styles.infoContainer}>
                  <Text style={styles.chefName}>{chef.chefName}</Text>
                  <Text style={styles.specification}>
                    {chef.chefSpecialization}
                  </Text>
                  <Text style={styles.address}>{chef.chefAddress}</Text>
                  <Text style={styles.createdAt}>
                    Added on: {new Date(chef.createdAt).toLocaleDateString()}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          ))
        ) : (
          <Text style={styles.emptyText}>No favorite chefs yet!</Text>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    padding: 16,
    marginBottom: 16,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 1,
    borderColor: "#CCCCCC",
  },
  infoContainer: {
    flex: 1,
    marginLeft: 12,
  },
  chefName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  specification: {
    fontSize: 14,
    color: "#666",
    marginTop: 4,
  },
  address: {
    fontSize: 12,
    color: "#888",
    marginTop: 4,
  },
  createdAt: {
    fontSize: 12,
    color: "#AAA",
    marginTop: 4,
  },
  emptyText: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginTop: 20,
  },
});

export default FavoriteScreen;
