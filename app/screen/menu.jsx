import React, { useCallback, useContext, useEffect, useState } from "react";
import {
  View,
  Text,
  Image,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  TextInput,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Header from "../../components/header";
import { MaterialIcons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import useAxios from "../../config/AXIOS_API";
import { useCommonNoification } from "../../context/commonNoti";
import useRequireAuthAndNetwork from "../../hooks/useRequireAuthAndNetwork";
import { useConfirmModal } from "../../context/commonConfirm";
import { AuthContext } from "../../config/AuthContext";
import { t } from "i18next";

const ChefMenu = () => {
  const [menus, setMenus] = useState([]);
  const [filteredMenus, setFilteredMenus] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedMenus, setSelectedMenus] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const axiosInstance = useAxios();
  const { showModal } = useCommonNoification();
  const requireAuthAndNetWork = useRequireAuthAndNetwork();
  const { showConfirm } = useConfirmModal();
  const { user } = useContext(AuthContext);

  useFocusEffect(
    useCallback(() => {
      fetchMenu();
    }, [])
  );

  const fetchMenu = async () => {
    setLoading(true);
    try {
      const response = await axiosInstance.get("/menus", {
        params: { chefId: user?.chefId },
      });
      setMenus(response.data.content);
      setFilteredMenus(response.data.content);
    } catch (error) {
      if (error.response?.status === 401) return;
      if (axios.isCancel(error)) return;
      showModal(t("modal.error"), t("errors.fetchMenusFailed"), "Failed");
    } finally {
      setLoading(false);
    }
  };

  const filterMenus = (query) => {
    setSearchQuery(query);
    if (query === "") {
      setFilteredMenus(menus);
    } else {
      const filtered = menus.filter(
        (menu) =>
          menu.name.toLowerCase().includes(query.toLowerCase()) ||
          menu.description.toLowerCase().includes(query.toLowerCase())
      );
      setFilteredMenus(filtered);
    }
  };

  const toggleSelection = (menuId) => {
    if (selectedMenus.includes(menuId)) {
      setSelectedMenus(selectedMenus.filter((id) => id !== menuId));
    } else {
      setSelectedMenus([...selectedMenus, menuId]);
    }
  };

  const handleLongPress = (menuId) => {
    setSelectionMode(true);
    setSelectedMenus([menuId]);
  };

  const selectAll = () => {
    const allIds = menus.map((d) => d.id);
    setSelectedMenus(allIds);
  };

  const cancelSelection = () => {
    setSelectionMode(false);
    setSelectedMenus([]);
  };

  const handleDelete = async () => {
    if (selectedMenus.length === 0) return;
    showConfirm(
      t("deleteConfirmTitle"),
      t("deleteConfirmMessageMenu", { count: selectedMenus.length }),
      () =>
        requireAuthAndNetWork(async () => {
          let successCount = 0;
          let errorCount = 0;
          setLoading(true);
          try {
            const promises = selectedMenus.map((item) =>
              axiosInstance.delete(`/menus/${item}`)
            );
            const results = await Promise.allSettled(promises);
            fetchMenu();
            setSelectedMenus([]);
            results.forEach((result) => {
              if (result.status === "fulfilled") successCount++;
              else errorCount++;
            });
            if (successCount === results.length) {
              showModal(t("modal.success"), t("deleteMenusSuccess"));
            } else if (errorCount === results.length) {
              showModal(t("modal.error"), t("errors.deleteMenusFailed"), "Failed");
            } else {
              showModal(
                t("modal.warning"),
                t("warnings.partialDeleteFailed", { successCount, errorCount }),
                "Warning"
              );
            }
          } catch (error) {
            if (error.response?.status === 401) return;
            if (axios.isCancel(error)) return;
            showModal(t("modal.error"), t("errors.deleteMenusFailed"), "Failed");
          } finally {
            setLoading(false);
          }
        })
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <Header
        title={t("menu")}
        rightIcon={user.roleName === "ROLE_CHEF" && "add"}
        onRightPress={() =>
          user.roleName === "ROLE_CHEF" && router.push("/screen/addMenu")
        }
      />

      <View style={styles.searchBarContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder={t("search")}
          value={searchQuery}
          onChangeText={filterMenus}
          accessibilityLabel={t("search")}
        />
      </View>

      {selectionMode && user.roleName === "ROLE_CHEF" && (
        <View style={styles.floatingActions}>
          <TouchableOpacity
            style={[styles.floatingButton, { flexDirection: "row", alignItems: "center" }]}
            onPress={selectAll}
          >
            <Text style={[styles.floatingText, { color: "grey" }]}>
              {t("all")} ({selectedMenus.length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.floatingButton,
              { backgroundColor: "#FFCDD2", flexDirection: "row", alignItems: "center" },
            ]}
            onPress={handleDelete}
          >
            <MaterialIcons name="delete" size={24} color="red" />
            <Text style={[styles.floatingText, { color: "red" }]}>
              ({selectedMenus.length})
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
        data={filteredMenus}
        key="menu-grid-2" // Added to force re-render for numColumns
        keyExtractor={(item) => item.id.toString()}
        numColumns={2}
        contentContainerStyle={{ padding: 10, paddingVertical: 30 }}
        columnWrapperStyle={{ justifyContent: "space-between", marginBottom: 15 }}
        ListEmptyComponent={
          <Text style={styles.emptyText}>{t("noMenuAvailable")}</Text>
        }
        ListHeaderComponent={
          loading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#6c5ce7" />
            </View>
          )
        }
        renderItem={({ item: menu }) => (
          <TouchableOpacity
            style={[styles.cardContainer, selectedMenus.includes(menu.id) && styles.selectedCard]}
            onLongPress={() => user.roleName === "ROLE_CHEF" && handleLongPress(menu.id)}
            onPress={() => {
              if (selectionMode) {
                toggleSelection(menu.id);
              } else {
                router.push({ pathname: "/screen/menuDetails", params: { id: menu.id } });
              }
            }}
            accessibilityLabel={menu.name}
          >
            <View style={styles.card}>
              <Image
                source={{ uri: menu.imageUrl }}
                style={styles.image}
                defaultSource={require("../../assets/images/1.jpg")}
              />
              <View style={styles.cardContent}>
                <Text numberOfLines={1} ellipsizeMode="tail" style={styles.title}>
                  {menu.name}
                </Text>
                <Text numberOfLines={2} ellipsizeMode="tail" style={styles.description}>
                  {menu.description}
                </Text>
                <View style={styles.infoRow}>
                  <Text style={styles.price}>
                    {menu.hasDiscount ? (
                      <>
                        <Text style={styles.strikethrough}>${menu.beforePrice}</Text>{" "}
                        ${menu.afterPrice}
                      </>
                    ) : (
                      `$${menu.afterPrice}`
                    )}
                  </Text>
                  <View style={styles.dishCountBadge}>
                    <Text style={styles.dishCountText}>
                      {menu.menuItems?.length || 0} {t("dishes")}
                    </Text>
                  </View>
                </View>
              </View>
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
    backgroundColor: "#FFF8E7", // Subtle variation from ChefDishes (#FDFBF6)
  },
  searchBarContainer: {
    padding: 10,
    // backgroundColor: "#FFF",
  },
  searchInput: {
    height: 50,
    borderColor: "#D4A373", // Distinct from #F8BF40
    borderWidth: 1,
    borderRadius: 20,
    paddingLeft: 15,
    fontFamily: "nunito-regular",
    fontSize: 16,
  },
  cardContainer: {
    width: "48%",
    alignItems: "center",
  },
  card: {
    backgroundColor: "#A9411D", // Same as ChefDishes for cohesion
    borderRadius: 12,
    padding: 12,
    width: "100%",
    height: 220, // Compact for grid
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  selectedCard: {
    borderWidth: 3,
    borderColor: "#D4A373", // Distinct from #F8BF40
    borderRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 8,
    transform: [{ scale: 1.02 }],
  },
  image: {
    width: "100%",
    height: 100, // Adjusted for grid
    borderRadius: 10,
    resizeMode: "cover",
  },
  cardContent: {
    paddingTop: 8,
  },
  title: {
    fontSize: 16,
    fontFamily: "nunito-bold",
    color: "#FFF",
    marginBottom: 4,
    textAlign: "center",
  },
  description: {
    fontSize: 12,
    fontFamily: "nunito-regular",
    color: "#F8BF40",
    marginBottom: 6,
    textAlign: "center",
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  price: {
    fontSize: 12,
    fontFamily: "nunito-bold",
    color: "#FFF",
  },
  strikethrough: {
    textDecorationLine: "line-through",
    fontSize: 12,
    fontFamily: "nunito-regular",
    color: "#FFF",
  },
  dishCountBadge: {
    backgroundColor: "#F8BF40",
    borderRadius: 10,
    paddingVertical: 3,
    paddingHorizontal: 6,
  },
  dishCountText: {
    fontSize: 10,
    fontFamily: "nunito-bold",
    color: "#A9411D",
  },
  floatingActions: {
    position: "absolute",
    bottom: 20,
    right: 20,
    zIndex: 999,
    gap: 12,
  },
  floatingButton: {
    backgroundColor: "#FFF9C4",
    paddingVertical: 12,
    paddingHorizontal: 18,
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
    fontFamily: "nunito-bold",
    color: "#333",
  },
  emptyText: {
    textAlign: "center",
    fontSize: 16,
    fontFamily: "nunito-regular",
    color: "#333",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 20,
  },
});

export default ChefMenu;