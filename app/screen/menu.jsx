import React, { useEffect, useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  View,
  Text,
  Image,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import Header from "../../components/header";
import { MaterialIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import useAxios from "../../config/AXIOS_API";
import { commonStyles } from "../../style";
import { useCommonNoification } from "../../context/commonNoti";


const ChefMenu = () => {
  const [menus, setMenus] = useState([]);
  const [loading, setLoading] = useState(false);
  const axiosInstance = useAxios();
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedMenus, setSelectedMenus] = useState([]);
  const { showModal } = useCommonNoification();



  useEffect(() => {
    fetchMenu();
  }, [])

  const fetchMenu = async () => {
    setLoading(true);
    try {
      const response = await axiosInstance.get("/menus", {
        params: { chefId: 1 },
      });
      setMenus(response.data.content);
    } catch (error) {
      if (error.response) {
        console.error(`Lỗi ${error.response.status}:`, error.response.data);
      } else {
        console.error(error.message);
      }
    } finally {
      setLoading(false);
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
    let successCount = 0;
    let errorCount = 0;
    setLoading(true);
    try {
      console.log("hehe", selectedMenus);
      const promises = selectedMenus.map((item) => axiosInstance.delete(`/menus/${item}`));
      const results = await Promise.allSettled(promises);

      fetchMenu();
      setSelectedMenus([]);
      results.forEach((result) => {
        if (result.status === "fulfilled") {
          successCount++;
        } else {
          errorCount++;
        }
      });
      if (successCount === results.length) {
        showModal("Success", "All dishes delete successfully.");
      } else if (errorCount === results.length) {
        showModal("Error", "All dishes delete failed.");
      } else {
        showModal("Warning", `Some dishes created failed. Number of dishes success: ${successCount}, Number of dishes failed: ${errorCount}`);
      }
    } catch (error) {
      console.error("Lỗi khi xóa:", error.response?.data || error.message);
      alert("Có lỗi xảy ra khi xóa món ăn.");
    } finally {
      setLoading(false);
    }
  }

  const renderRightActions = (id) => (
    <TouchableOpacity
      style={styles.deleteButton}
      onPress={() => handleRemove(id)}
    >
      <Text style={styles.deleteText}>Remove</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={commonStyles.container}>
      <Header title="Menu" />

      {selectionMode && (
        <View style={styles.floatingActions}>
          <TouchableOpacity style={[styles.floatingButton, { flexDirection: 'row', alignItems: 'center' }]} onPress={selectAll}>
            <Text style={[styles.floatingText, { color: "grey" }]}>All ({selectedMenus.length})</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.floatingButton, { backgroundColor: "#FFCDD2", flexDirection: 'row', alignItems: 'center' }]} onPress={() => handleDelete()}>
            <MaterialIcons name="delete" size={24} color="red" />
            <Text style={[styles.floatingText, { color: "red" }]}>({selectedMenus.length})</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.floatingButton, { backgroundColor: "#E0E0E0" }]} onPress={cancelSelection}>
            {/* <Text style={[styles.floatingText, { color: "#333" }]}>Hủy</Text> */}
            <MaterialIcons name="cancel" size={24} color="black" />
          </TouchableOpacity>
        </View>
      )}

      <FlatList
        data={menus}
        style={commonStyles.containerContent}
        contentContainerStyle={{ paddingBottom: 100 }}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            onLongPress={() => handleLongPress(item.id)}
            onPress={() => {
              if (selectionMode) {
                toggleSelection(item.id);
              } else {
                // navigation.navigate("screen/menuDetail", {
                //   menuId: {
                //     id: item.id
                //   }
                // })
                router.replace({
                  pathname: "/screen/menuDetail",
                  params: { id: item.id },
                });
              }
            }}
            key={item.id}
            style={[styles.section, selectedMenus.includes(item.id) && styles.selectedCard]}
          >
            <Text numberOfLines={1} ellipsizeMode="tail">
              <Text style={styles.itemContentLabel}>Menu name: </Text>
              <Text style={{ fontSize: 16, fontWeight: "bold" }}>{item.name}</Text>
            </Text>
            <Text numberOfLines={1} ellipsizeMode="tail">
              <Text style={styles.itemContentLabel}>Description: </Text>
              <Text style={styles.itemContent}>{item.description}</Text>
            </Text>
            <Text numberOfLines={2} ellipsizeMode="tail">
              <Text style={styles.itemContentLabel}>Dishes: </Text>
              {item.menuItems && item.menuItems.map((dish) => (
                <Text key={dish.dishId} style={styles.itemContent}>{dish.dishName}, </Text>
              ))}
            </Text>
            <Text numberOfLines={1} ellipsizeMode="tail">
              <Text style={styles.itemContentLabel}>Price: </Text>
              {item.hasDiscount ? (
                <Text>
                  <Text style={{ textDecorationLine: 'line-through', fontSize: 15 }}>${item.beforePrice}</Text>
                  <Text style={{ fontSize: 16, fontWeight: 'bold' }}>  ${item.afterPrice}</Text>
                </Text>) : (
                <Text style={styles.itemContent}>${item.afterPrice}</Text>
              )}
            </Text>
          </TouchableOpacity>
        )}
      />
    </SafeAreaView>


  );
};

const styles = StyleSheet.create({
  section: {
    gap: 5,
    maxHeight: 300,
    backgroundColor: "#F9F5F0",
    marginVertical: 10,
    padding: 25,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
  },
  itemContentLabel: {
    fontWeight: 'bold'
  },
  itemContent: {
    fontSize: 14
  },
  selectedCard: {
    borderWidth: 3,
    borderColor: "#F8BF40",
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 10,
    transform: [{ scale: 1.03 }],
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
    alignItems: 'center'
  },

  floatingText: {
    fontSize: 16,
    color: "#333",
    fontWeight: "bold",
  },
});

export default ChefMenu;
