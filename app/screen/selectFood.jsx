import React, { useEffect, useState } from "react";
import {
  Image,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  FlatList,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import AXIOS_API from "../../config/AXIOS_API";
import Header from "../../components/header";
import ProgressBar from "../../components/progressBar";
import { TabView, SceneMap, TabBar } from "react-native-tab-view";
import Toast from "react-native-toast-message";

const initialLayout = { width: Dimensions.get("window").width };

const SelectFood = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  const {
    chefId,
    date,
    isLongTerm,
    currentStep,
    totalSteps,
    selectedMenu: selectedMenuParam,
    selectedDishes: selectedDishesParam,
    dishNotes: dishNotesParam,
    selectedPackage,
    selectedDates,
    numPeople,
    address: location,
  } = params;

  const [selectedMenu, setSelectedMenu] = useState(
    selectedMenuParam && selectedMenuParam !== ""
      ? JSON.parse(selectedMenuParam)?.id
      : null
  );
  const [selectedDishes, setSelectedDishes] = useState(() => {
    if (selectedDishesParam && selectedDishesParam !== "") {
      const dishes = JSON.parse(selectedDishesParam);
      return dishes.reduce((acc, dish) => {
        acc[dish.id] = true;
        return acc;
      }, {});
    }
    return {};
  });
  const [extraDishIds, setExtraDishIds] = useState({});
  const [dishNotes, setDishNotes] = useState(
    dishNotesParam && dishNotesParam !== "" ? JSON.parse(dishNotesParam) : {}
  );
  const [menu, setMenu] = useState([]);
  const [dishes, setDishes] = useState([]);

  const [index, setIndex] = useState(0);
  const [routes] = useState([
    { key: "menu", title: "Menu" },
    { key: "dishes", title: "Dishes" },
  ]);

  const progressStep = isLongTerm === "true" ? parseInt(currentStep || "3") : 2;
  const progressTotal = isLongTerm === "true" ? parseInt(totalSteps || "4") : 4;
  const progressTitle =
    isLongTerm === "true"
      ? `Chọn món ăn cho ngày ${date}`
      : "Chọn menu hoặc món ăn";

  useEffect(() => {
    const fetchMenus = async () => {
      try {
        const menuResponse = await AXIOS_API.get(`/menus?chefId=${chefId}`);
        setMenu(menuResponse.data.content || []);
      } catch (error) {
        console.log("Error fetching menus:", error);
        Toast.show({
          type: "error",
          text1: "Error",
          text2: "Failed to fetch menus.",
        });
      }
    };
    fetchMenus();
  }, [chefId]);

  useEffect(() => {
    const fetchDishes = async () => {
      try {
        let dishesResponse;
        if (selectedMenu) {
          dishesResponse = await AXIOS_API.get(
            `/dishes/not-in-menu?menuId=${selectedMenu}`
          );
        } else {
          dishesResponse = await AXIOS_API.get(`/dishes`);
        }
        setDishes(dishesResponse.data.content || []);
      } catch (error) {
        console.log("Error fetching dishes:", error);
        Toast.show({
          type: "error",
          text1: "Error",
          text2: "Failed to fetch dishes.",
        });
        setDishes([]);
      }
    };
    fetchDishes();
  }, [selectedMenu]);

  const toggleMenuCheckbox = (id) => {
    const selectedDishesCount =
      Object.values(selectedDishes).filter(Boolean).length;
    if (selectedDishesCount > 0) {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Please deselect all dishes before selecting a menu.",
      });
      return;
    }

    setSelectedMenu((prev) => {
      const newMenu = prev === id ? null : id;
      if (!newMenu) {
        setExtraDishIds({});
        setIndex(0);
      } else {
        setSelectedDishes({});
        setIndex(1);
      }
      return newMenu;
    });
  };

  const toggleDishCheckbox = (id) => {
    if (selectedMenu) {
      setExtraDishIds((prev) => ({
        ...prev,
        [id]: !prev[id],
      }));
    } else {
      setSelectedDishes((prev) => ({
        ...prev,
        [id]: !prev[id],
      }));
    }
  };

  const handleMenuPress = (menuItem) => {
    router.push({
      pathname: "/screen/menuDetail",
      params: { menuId: menuItem.id, menuName: menuItem.name, chefId },
    });
  };

  const handleContinue = () => {
    const selectedMenuData = selectedMenu
      ? menu.find((item) => item.id === selectedMenu)
      : null;
    const selectedDishesData = selectedMenu
      ? dishes.filter((dish) => extraDishIds[dish.id])
      : dishes.filter((dish) => selectedDishes[dish.id]);
  
    if (!selectedMenuData && selectedDishesData.length === 0) {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Please select at least one menu or dish.",
      });
      return;
    }
  
    if (isLongTerm === "true") {
      router.push({
        pathname: "/screen/longTermSelect", // Sửa đường dẫn
        params: {
          chefId,
          date,
          selectedPackage,
          selectedDates,
          selectedMenu: selectedMenuData ? JSON.stringify(selectedMenuData) : "",
          selectedDishes: selectedDishesData.length > 0 ? JSON.stringify(selectedDishesData) : "",
          dishNotes: JSON.stringify(dishNotes),
          numPeople: numPeople || "", // Đảm bảo truyền numPeople
          address: location || "", // Sử dụng 'address' thay vì 'location' để đồng bộ
        },
      });
    } else {
      router.push({
        pathname: "/screen/booking",
        params: {
          selectedMenu: selectedMenuData ? JSON.stringify(selectedMenuData) : "",
          selectedDishes: selectedDishesData.length > 0 ? JSON.stringify(selectedDishesData) : "",
          chefId,
          dishNotes: JSON.stringify(dishNotes),
        },
      });
    }
  };

  const getContinueButtonText = () => {
    const selectedMenuData = selectedMenu
      ? menu.find((item) => item.id === selectedMenu)
      : null;
    const selectedDishesData = selectedMenu
      ? dishes.filter((dish) => extraDishIds[dish.id])
      : dishes.filter((dish) => selectedDishes[dish.id]);

    if (selectedMenuData && selectedDishesData.length > 0) {
      return `Continue with Menu: ${selectedMenuData.name} & ${
        selectedDishesData.length
      } Extra Dish${selectedDishesData.length > 1 ? "es" : ""}`;
    } else if (selectedMenuData) {
      return `Continue with Menu: ${selectedMenuData.name}`;
    } else if (selectedDishesData.length > 0) {
      return `Continue with ${selectedDishesData.length} Dish${
        selectedDishesData.length > 1 ? "es" : ""
      }`;
    }
    return "Continue";
  };

  const isContinueButtonVisible = () => {
    const selectedDishesData = selectedMenu
      ? dishes.filter((dish) => extraDishIds[dish.id])
      : dishes.filter((dish) => selectedDishes[dish.id]);
    return selectedMenu !== null || selectedDishesData.length > 0;
  };

  const handleIndexChange = (newIndex) => {
    if (selectedMenu && newIndex === 0) {
      Toast.show({
        type: "info",
        text1: "Menu Selected",
        text2: "Deselect the current menu to choose a different one.",
      });
      return;
    }
    setIndex(newIndex);
  };

  const shouldShowMenuCheckboxes = () => {
    const selectedDishesCount =
      Object.values(selectedDishes).filter(Boolean).length;
    return !selectedMenu && selectedDishesCount === 0;
  };

  const MenuTab = () => (
    <FlatList
      data={menu}
      keyExtractor={(item) => item.id.toString()}
      contentContainerStyle={styles.flatListContent}
      renderItem={({ item }) => (
        <TouchableOpacity
          style={styles.cardContainer}
          onPress={() => handleMenuPress(item)}
          activeOpacity={0.8}
        >
          <View style={styles.card}>
            {shouldShowMenuCheckboxes() && (
              <TouchableOpacity
                style={styles.checkboxContainer}
                onPress={(e) => {
                  e.stopPropagation();
                  toggleMenuCheckbox(item.id);
                }}
              >
                <View
                  style={[
                    styles.checkbox,
                    {
                      backgroundColor:
                        selectedMenu === item.id ? "#F8BF40" : "transparent",
                      borderColor:
                        selectedMenu === item.id ? "#F8BF40" : "#FFF",
                    },
                  ]}
                >
                  {selectedMenu === item.id && (
                    <MaterialIcons name="check" size={20} color="white" />
                  )}
                </View>
              </TouchableOpacity>
            )}
            <View style={styles.contentRow}>
              <View style={styles.imageContainer}>
                <Image
                  source={require("../../assets/images/1.jpg")}
                  style={styles.image}
                />
              </View>
              <View style={styles.textContainer}>
                <Text style={styles.title}>{item.name}</Text>
                <Text style={styles.description}>{item.description}</Text>
              </View>
            </View>
          </View>
        </TouchableOpacity>
      )}
    />
  );

  const DishesTab = () => (
    <View style={{ flex: 1 }}>
      {selectedMenu && (
        <View style={styles.selectedMenuContainer}>
          <Text style={styles.selectedMenuText}>
            Selected Menu: {menu.find((item) => item.id === selectedMenu)?.name}
          </Text>
          <TouchableOpacity
            onPress={() => toggleMenuCheckbox(selectedMenu)}
            style={styles.deselectButton}
          >
            <Text style={styles.deselectButtonText}>Deselect Menu</Text>
          </TouchableOpacity>
        </View>
      )}
      <FlatList
        data={dishes}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.flatListContent}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.cardContainer} activeOpacity={0.8}>
            <View style={styles.card}>
              <TouchableOpacity
                style={styles.checkboxContainer}
                onPress={(e) => {
                  e.stopPropagation();
                  toggleDishCheckbox(item.id);
                }}
              >
                <View
                  style={[
                    styles.checkbox,
                    {
                      backgroundColor: (
                        selectedMenu
                          ? extraDishIds[item.id]
                          : selectedDishes[item.id]
                      )
                        ? "#F8BF40"
                        : "transparent",
                      borderColor: (
                        selectedMenu
                          ? extraDishIds[item.id]
                          : selectedDishes[item.id]
                      )
                        ? "#F8BF40"
                        : "#FFF",
                    },
                  ]}
                >
                  {(selectedMenu
                    ? extraDishIds[item.id]
                    : selectedDishes[item.id]) && (
                    <MaterialIcons name="check" size={20} color="white" />
                  )}
                </View>
              </TouchableOpacity>
              <View style={styles.contentRow}>
                <View style={styles.imageContainer}>
                  <Image
                    source={{ uri: item.imageUrl }}
                    style={styles.image}
                    resizeMode="cover"
                  />
                </View>
                <View style={styles.textContainer}>
                  <Text style={styles.title}>{item.name}</Text>
                  <Text style={styles.description}>
                    {item.description || "No description"}
                  </Text>
                  {dishNotes[item.id] && (
                    <Text style={styles.noteText}>
                      Note: {dishNotes[item.id]}
                    </Text>
                  )}
                </View>
              </View>
            </View>
          </TouchableOpacity>
        )}
      />
    </View>
  );

  const renderScene = SceneMap({
    menu: MenuTab,
    dishes: DishesTab,
  });

  const handleBackToChefDetail = () => {
    router.push({
      pathname: "/screen/chefDetail",
      params: { id: chefId },
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <Header onLeftPress={handleBackToChefDetail} />
      <ProgressBar
        title={progressTitle}
        currentStep={progressStep}
        totalSteps={progressTotal}
      />
      <TabView
        navigationState={{ index, routes }}
        renderScene={renderScene}
        onIndexChange={handleIndexChange}
        initialLayout={initialLayout}
        renderTabBar={(props) => (
          <TabBar
            {...props}
            indicatorStyle={{ backgroundColor: "#9C583F", height: 3 }}
            style={{ backgroundColor: "#EBE5DD" }}
            activeColor="#9C583F"
            inactiveColor="gray"
            labelStyle={{ fontWeight: "bold" }}
          />
        )}
        style={styles.tabView}
      />
      {isContinueButtonVisible() && (
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.continueButton}
            onPress={handleContinue}
          >
            <Text style={styles.continueButtonText}>
              {getContinueButtonText()}
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#EBE5DD" },
  tabView: { flex: 1 },
  flatListContent: { paddingBottom: 80 },
  cardContainer: { paddingHorizontal: 20, marginVertical: 10 },
  card: {
    backgroundColor: "#A9411D",
    borderRadius: 16,
    padding: 16,
    position: "relative",
  },
  contentRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingLeft: 40,
  },
  imageContainer: {
    width: 100,
    height: 100,
    borderRadius: 20,
    backgroundColor: "#FFF",
    overflow: "hidden",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
    borderWidth: 1,
    borderColor: "#F8BF40",
  },
  image: { width: "100%", height: "100%" },
  textContainer: { flex: 1 },
  title: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#FFF",
    textAlign: "left",
    marginBottom: 5,
  },
  description: {
    fontSize: 14,
    color: "#F8BF40",
    textAlign: "left",
    marginBottom: 5,
  },
  noteText: {
    fontSize: 12,
    color: "#FFF",
    textAlign: "left",
    fontStyle: "italic",
  },
  checkboxContainer: { position: "absolute", top: 10, left: 10, zIndex: 1 },
  checkbox: {
    width: 28,
    height: 28,
    borderRadius: 4,
    borderWidth: 2,
    justifyContent: "center",
    alignItems: "center",
  },
  buttonContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#EBE5DD",
    padding: 10,
    alignItems: "center",
  },
  continueButton: {
    backgroundColor: "#A64B2A",
    paddingVertical: 15,
    paddingHorizontal: 40,
    borderRadius: 12,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5,
    width: "100%",
  },
  continueButtonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 18,
    textAlign: "center",
  },
  selectedMenuContainer: {
    padding: 10,
    backgroundColor: "#FFF",
    borderBottomWidth: 1,
    borderBottomColor: "#ccc",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  selectedMenuText: { fontSize: 16, fontWeight: "bold", color: "#333" },
  deselectButton: { backgroundColor: "#A64B2A", padding: 8, borderRadius: 8 },
  deselectButtonText: { color: "white", fontWeight: "bold" },
});

export default SelectFood;
