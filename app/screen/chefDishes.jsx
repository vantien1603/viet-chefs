import {
  View,
  Text,
  Image,
  FlatList,
  Alert,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  TextInput,
} from "react-native";
import React, { useCallback, useContext, useEffect, useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import Header from "../../components/header";
import useAxios from "../../config/AXIOS_API";
import { AuthContext } from "../../config/AuthContext";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useFocusEffect, useRouter } from "expo-router";
import { useCommonNoification } from "../../context/commonNoti";
import useRequireAuthAndNetwork from "../../hooks/useRequireAuthAndNetwork";
import { useConfirmModal } from "../../context/commonConfirm";
import { t } from "i18next";

const ChefDishes = () => {
  const [dishes, setDishes] = useState([]);
  const [filteredDishes, setFilteredDishes] = useState([]);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedDishes, setSelectedDishes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const router = useRouter();
  const axiosInstance = useAxios();
  const { user } = useContext(AuthContext);
  const { showModal } = useCommonNoification();
  const requireAuthAndNetWork = useRequireAuthAndNetwork();
  const { showConfirm } = useConfirmModal();

  useFocusEffect(
    useCallback(() => {
      fetchDishes();
    }, [])
  );

  const fetchDishes = async () => {
    setLoading(true);
    try {
      const response = await axiosInstance.get("/dishes", {
        params: { chefId: user.chefId },
      });
      setDishes(response.data.content);
      setFilteredDishes(response.data.content);
    } catch (error) {
      if (error.response?.status === 401) {
        return;
      }
      if (axios.isCancel(error)) {
        return;
      }
      showModal(t("modal.error"), t("errors.fetchDishesError"), "Failed");
    } finally {
      setLoading(false);
    }
  };

  const filterDishes = (query) => {
    setSearchQuery(query);
    if (query === "") {
      setFilteredDishes(dishes);
    } else {
      const filtered = dishes.filter(
        (dish) =>
          dish.name.toLowerCase().includes(query.toLowerCase()) ||
          dish.description.toLowerCase().includes(query.toLowerCase())
      );
      setFilteredDishes(filtered);
    }
  };

  const toggleSelection = (dishId) => {
    if (selectedDishes.includes(dishId)) {
      setSelectedDishes(selectedDishes.filter((id) => id !== dishId));
    } else {
      setSelectedDishes([...selectedDishes, dishId]);
    }
  };

  const handleLongPress = (dishId) => {
    setSelectionMode(true);
    setSelectedDishes([dishId]);
  };

  const selectAll = () => {
    const allIds = dishes.map((d) => d.id);
    setSelectedDishes(allIds);
  };

  const cancelSelection = () => {
    setSelectionMode(false);
    setSelectedDishes([]);
  };

  const handleDelete = async () => {
    if (selectedDishes.length === 0) return;
    showConfirm(
      t("deleteConfirmTitle"),
      t("deleteConfirmMessageDish", { count: selectedDishes.length }),
      () =>
        requireAuthAndNetWork(async () => {
          let successCount = 0;
          let errorCount = 0;
          setLoading(true);
          try {
            const promises = selectedDishes.map((item) =>
              axiosInstance.delete(`/dishes/${item}`)
            );
            const results = await Promise.allSettled(promises);

            fetchDishes();
            setSelectedDishes([]);
            results.forEach((result) => {
              if (result.status === "fulfilled") {
                successCount++;
              } else {
                errorCount++;
              }
            });
            if (successCount === results.length) {
              showModal(t("modal.success"), t("success.deleteAllSuccess"),);
            } else if (errorCount === results.length) {
              showModal(t("modal.error"), t("errors.deleteAllFailed"), "Failed");
            } else {
              showModal(
                "Warning",
                t("errors.deleteSomeFailed", { successCount, errorCount }),
                "Warning"
              );
            }
          } catch (error) {
            if (error.response?.status === 401) {
              return;
            }
            if (axios.isCancel(error)) {
              return;
            }
            showModal(t("modal.error"), t("errors.deleteDishesError"), "Failed");
          } finally {
            setLoading(false);
          }
        })
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <Header
        title={t("allDishes")}
        rightIcon={user.roleName === "ROLE_CHEF" && "add"}
        onRightPress={() =>
          user.roleName === "ROLE_CHEF" && router.push("/screen/addFood")
        }
      />

      <View style={styles.searchBarContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder={t("searchDishesPlaceholder")}
          value={searchQuery}
          onChangeText={filterDishes}
        />
      </View>

      {selectionMode && user.roleName === "ROLE_CHEF" && (
        <View style={styles.floatingActions}>
          <TouchableOpacity
            style={[
              styles.floatingButton,
              { flexDirection: "row", alignItems: "center" },
            ]}
            onPress={selectAll}
          >
            <Text style={[styles.floatingText, { color: "grey" }]}>
              {t("all")} ({selectedDishes.length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.floatingButton,
              {
                backgroundColor: "#FFCDD2",
                flexDirection: "row",
                alignItems: "center",
              },
            ]}
            onPress={() => handleDelete()}
          >
            <MaterialIcons name="delete" size={24} color="red" />
            <Text style={[styles.floatingText, { color: "red" }]}>
              ({selectedDishes.length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.floatingButton, { backgroundColor: "#E0E0E0" }]}
            onPress={cancelSelection}
          >
            <MaterialIcons name="cancel" size={24} color="black" />
          </TouchableOpacity>
        </View>
      )}

      <FlatList
        data={filteredDishes} // Use filtered dishes here
        keyExtractor={(item) => item.id.toString()}
        numColumns={2}
        contentContainerStyle={{ padding: 10, gap: 20, paddingVertical: 30 }}
        columnWrapperStyle={{ justifyContent: "space-between", marginBottom: 15 }}
        ListEmptyComponent={<Text style={{ textAlign: "center", fontSize: 16 }}>{t("noDishAvailable")}</Text>}
        ListHeaderComponent={loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#6c5ce7" />
          </View>
        )}
        renderItem={({ item: dish }) => (
          <TouchableOpacity
            style={[styles.cardContainer, selectedDishes.includes(dish.id) && styles.selectedCard]}
            onLongPress={() => user.roleName === "ROLE_CHEF" && handleLongPress(dish.id)}
            onPress={() => {
              if (selectionMode) {
                toggleSelection(dish.id);
              } else {
                router.push({ pathname: "/screen/dishDetails", params: { dishId: dish.id } });
              }
            }}
          >
            <View style={styles.card}>
              <View style={styles.imageContainer}>
                <Image source={{ uri: dish.imageUrl }} style={styles.image} defaultSource={require("../../assets/images/1.jpg")} />
              </View>
              <Text style={styles.title}>{dish.name}</Text>
              <Text numberOfLines={2} ellipsizeMode="tail" style={styles.description}>{dish.description}</Text>
              <Text style={styles.cookTime}>~ {dish.cookTime} {t("minutes")}</Text>
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
  searchBarContainer: {
    padding: 10,
    backgroundColor: "#FFF",
  },
  searchInput: {
    height: 50,
    borderColor: "#F8BF40",
    borderWidth: 1,
    borderRadius: 20,
    paddingLeft: 10,
  },
  cardContainer: {
    width: "48%",
    alignItems: "center",
  },
  selectedCard: {
    borderWidth: 3,
    borderColor: "#F8BF40",
    borderRadius: 16,
    backgroundColor: "#A9411D",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 10,
    transform: [{ scale: 1.03 }],
  },
  card: {
    backgroundColor: "#A9411D",
    borderRadius: 16,
    padding: 16,
    paddingTop: 50,
    alignItems: "center",
    width: "100%",
    height: 220,
    position: "relative",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
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
  floatingActions: {
    position: "absolute",
    bottom: 20,
    right: 20,
    zIndex: 999,
    gap: 10,
  },
  floatingButton: {
    backgroundColor: "#FFF9C4",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 6,
    alignItems: "center",
  },
  floatingText: {
    fontSize: 16,
    color: "#333",
    fontWeight: "bold",
  },
});

export default ChefDishes;
