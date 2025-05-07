import React, { useEffect, useState, useRef } from "react";
import {
  Image,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  FlatList,
  TextInput,
  BackHandler,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";
import Toast from "react-native-toast-message";
import useAxios from "../../config/AXIOS_API";
import { commonStyles } from "../../style";
import Header from "../../components/header";
import { t } from "i18next";

const DishCard = ({ item, isSelected, onToggle }) => (
  <TouchableOpacity style={styles.dishCard} onPress={onToggle}>
    <View style={styles.checkbox(isSelected)}>
      {isSelected && <MaterialIcons name="check" size={22} color="#fff" />}
    </View>
    <Image
      source={{ uri: item.imageUrl }}
      style={styles.image}
      resizeMode="cover"
    />
    <View style={styles.cardContent}>
      <Text style={styles.title}>{item.name}</Text>
      <Text style={styles.desc}>{item.description || t("noInformation")}</Text>
    </View>
  </TouchableOpacity>
);

const MenuCard = ({ item, isSelected, onSelect }) => (
  <TouchableOpacity
    style={[
      styles.menuCard,
      {
        borderColor: isSelected ? "#F8BF40" : "transparent",
      },
    ]}
    onPress={onSelect}
  >
    <Image
      source={{
        uri: item?.imageUrl,
      }}
      style={styles.menuImage}
      resizeMode="cover"
    />
    <View style={styles.cardContent}>
      <Text style={styles.title}>{item.name}</Text>
      <Text style={styles.desc}>{item.description || t("noInformation")}</Text>
    </View>
  </TouchableOpacity>
);

const SelectFood = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  const {
    chefId,
    selectedMenu: selectedMenuParam,
    selectedDishes: selectedDishesParam,
    dishNotes: dishNotesParam,
  } = params;

  const [selectedMenu, setSelectedMenu] = useState(null);
  const [selectedDishes, setSelectedDishes] = useState({});
  const [extraDishIds, setExtraDishIds] = useState({});
  const [dishNotes, setDishNotes] = useState({});
  const [menus, setMenus] = useState([]);
  const [dishes, setDishes] = useState([]);
  const axiosInstance = useAxios();

  const menuFlatListRef = useRef(null);
  const dishesFlatListRef = useRef(null);

  // Đồng bộ hóa state với params khi params thay đổi
  useEffect(() => {
    // Đồng bộ selectedMenu
    if (selectedMenuParam && selectedMenuParam !== "") {
      const parsedMenu = JSON.parse(selectedMenuParam);
      setSelectedMenu(parsedMenu?.id || null);
    } else {
      setSelectedMenu(null);
    }

    // Đồng bộ selectedDishes và extraDishIds
    if (selectedDishesParam && selectedDishesParam !== "") {
      const parsedDishes = JSON.parse(selectedDishesParam);
      const dishState = parsedDishes.reduce((acc, dish) => {
        acc[dish.id] = true;
        return acc;
      }, {});

      if (selectedMenu) {
        // Nếu đã có selectedMenu, chuyển dữ liệu sang extraDishIds
        setExtraDishIds(dishState);
        setSelectedDishes({}); // Reset selectedDishes
      } else {
        setSelectedDishes(dishState);
        setExtraDishIds({}); // Reset extraDishIds
      }
    } else {
      setSelectedDishes({});
      setExtraDishIds({});
    }

    // Đồng bộ dishNotes
    if (dishNotesParam && dishNotesParam !== "") {
      setDishNotes(JSON.parse(dishNotesParam));
    } else {
      setDishNotes({});
    }
  }, [selectedMenuParam, selectedDishesParam, dishNotesParam]);

  // Fetch menus
  useEffect(() => {
    const fetchMenus = async () => {
      try {
        const menuResponse = await axiosInstance.get(`/menus?chefId=${chefId}`);
        setMenus(menuResponse.data.content || []);
      } catch (error) {
        console.warn("Error fetching menus:", error);
      }
    };
    fetchMenus();
  }, [chefId]);

  // Fetch dishes
  useEffect(() => {
    const fetchDishes = async () => {
      try {
        let dishesResponse;
        if (selectedMenu) {
          // Gọi API để lấy các món ngoài menu
          dishesResponse = await axiosInstance.get(
            `/dishes/not-in-menu?menuId=${selectedMenu}`
          );
        } else {
          // Gọi API để lấy tất cả món ăn của chef
          dishesResponse = await axiosInstance.get(`/dishes?chefId=${chefId}`);
        }
        setDishes(dishesResponse.data.content || []);
      } catch (error) {
        console.error("Error fetching dishes:", error);
        Toast.show({
          type: "error",
          text1: "Error",
          text2: "Failed to fetch dishes.",
        });
        setDishes([]);
      }
    };
    fetchDishes();
  }, [selectedMenu, chefId]); // Thêm chefId vào dependencies để đảm bảo fetch lại nếu cần

  // Handle physical back button
  useEffect(() => {
    const backAction = () => {
      router.push({
        pathname: "/screen/chefDetail",
        params: { chefId: chefId },
      });
      return true;
    };

    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      backAction
    );

    return () => backHandler.remove();
  }, [chefId, selectedMenu, selectedDishes, extraDishIds, dishNotes]);

  const toggleDish = (id) => {
    if (selectedMenu) {
      setExtraDishIds((prev) => {
        const newState = { ...prev, [id]: !prev[id] }; // Giữ nguyên các món khác, chỉ toggle món hiện tại
        return newState;
      });
    } else {
      setSelectedDishes((prev) => {
        const newState = { ...prev, [id]: !prev[id] }; // Giữ nguyên các món khác, chỉ toggle món hiện tại
        return newState;
      });
    }
  };

  const handleSelectMenu = (menuId) => {
    const selectedDishesCount = Object.values(selectedDishes).filter(Boolean).length;
    if (selectedDishesCount > 0) {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Bạn phải bỏ chọn tất cả món ăn trước khi chọn menu.",
      });
      return;
    }
    setSelectedMenu((prev) => (prev === menuId ? null : menuId));
    setSelectedDishes({});
    setExtraDishIds({});
    setDishNotes({});
  };

  const handleBack = () => {
    router.push({
      pathname: "/screen/chefDetail",
      params: { chefId },
    });
  };

  const handleContinue = () => {
    const selectedMenuData = selectedMenu
      ? menus.find((item) => item.id === selectedMenu)
      : null;
    const selectedDishesData = selectedMenu
      ? dishes.filter((dish) => extraDishIds[dish.id])
      : dishes.filter((dish) => selectedDishes[dish.id]);

    if (!selectedMenuData && selectedDishesData.length === 0) {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Vui lòng chọn ít nhất một menu hoặc món ăn.",
      });
      return;
    }

    console.log("Selected dishes data in handleContinue:", selectedDishesData);

    router.push({
      pathname: "/screen/booking",
      params: {
        selectedMenu: selectedMenuData ? JSON.stringify(selectedMenuData) : "",
        selectedDishes:
          selectedDishesData.length > 0
            ? JSON.stringify(selectedDishesData)
            : "",
        chefId,
        dishNotes: JSON.stringify(dishNotes),
      },
    });
  };

  const renderDish = ({ item }) => {
    const isSelected = selectedMenu
      ? extraDishIds[item.id] || false
      : selectedDishes[item.id] || false;
    return (
      <DishCard
        item={item}
        isSelected={isSelected}
        onToggle={() => toggleDish(item.id)}
      />
    );
  };

  const renderMenu = ({ item }) => (
    <MenuCard
      item={item}
      isSelected={selectedMenu === item.id}
      onSelect={() => handleSelectMenu(item.id)}
    />
  );

  return (
    <SafeAreaView style={commonStyles.containerContent}>
      <Header title={t("selectDish")} onLeftPress={handleBack} />
      <Text style={styles.sectionTitle}>{t("selectAvailableMenu")}:</Text>
      <FlatList
        ref={menuFlatListRef}
        data={menus}
        horizontal
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderMenu}
        ListEmptyComponent={
          <Text style={styles.emptyText}>{t("noMenuAvailable")}</Text>
        }
      />
      <Text style={styles.sectionTitle}>
        {selectedMenu ? t("chooseMoreDishes") : t("selectDishesManually")}
      </Text>
      <FlatList
        ref={dishesFlatListRef}
        data={dishes}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderDish}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 120 }}
        ListEmptyComponent={
          <Text style={styles.emptyText}>{t("noDishesAvailable")}</Text>
        }
      />
      {(selectedMenu ||
        Object.values(selectedDishes).some((val) => val) ||
        Object.values(extraDishIds).some((val) => val)) && (
        <TouchableOpacity style={styles.button} onPress={handleContinue}>
          <Text style={styles.buttonText}>{t("confirmDishSelection")}</Text>
        </TouchableOpacity>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  headerContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 10,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    marginLeft: 10,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 10,
    marginHorizontal: 16,
  },
  menuCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 12,
    marginRight: 16,
    marginBottom: 50,
    width: 340,
    height: 100,
    borderWidth: 2,
    borderColor: "transparent",
  },
  menuImage: {
    width: 72,
    height: 72,
    borderRadius: 12,
    marginRight: 12,
    backgroundColor: "#f0f0f0",
  },
  dishCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 16,
    elevation: 3,
    marginBottom: 12,
    width: "100%",
    overflow: "hidden",
  },
  checkbox: (selected) => ({
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: selected ? "#F8BF40" : "#fff",
    borderWidth: 2,
    borderColor: selected ? "#F8BF40" : "#CCCCCC",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
    marginTop: 6,
  }),
  image: {
    width: 80,
    height: 80,
    borderRadius: 10,
    marginRight: 16,
  },
  cardContent: {
    flex: 1,
    justifyContent: "center",
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
  },
  desc: {
    color: "#555",
    fontSize: 16,
    marginTop: 6,
  },
  note: {
    marginTop: 8,
    fontStyle: "italic",
    color: "#E76F51",
    fontSize: 15,
  },
  input: {
    borderWidth: 1,
    borderColor: "#CCCCCC",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 16,
    marginTop: 6,
    marginLeft: 44,
    backgroundColor: "#fff",
    marginHorizontal: 16,
  },
  button: {
    position: "absolute",
    bottom: 16,
    left: 16,
    right: 16,
    backgroundColor: "#F8BF40",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    elevation: 4,
  },
  buttonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
  },
  emptyText: {
    fontSize: 18,
    color: "#555",
    textAlign: "center",
    marginTop: 24,
  },
});

export default SelectFood;