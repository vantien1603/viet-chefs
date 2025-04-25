import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Image,
  StyleSheet,
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
import { useCommonNoification } from "../../context/commonNoti";
import axios from "axios";

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
      {/* {note ? <Text style={styles.note}>{t("note")}: {note}</Text> : null} */}
    </View>
  </TouchableOpacity>
);

const ChooseFoodForLongterm = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  const {
    chefId,
    date,
    selectedPackage,
    selectedDates,
    selectedMenu: selectedMenuParam,
    selectedDishes: selectedDishesParam,
    dishNotes: dishNotesParam,
    numPeople,
    address,
  } = params;


  const [selectedMenu, setSelectedMenu] = useState(
    selectedMenuParam && selectedMenuParam !== ""
      ? JSON.parse(selectedMenuParam)?.id
      : null
  );
  const [selectedDishes, setSelectedDishes] = useState(() => {
    if (!selectedMenu && selectedDishesParam && selectedDishesParam !== "") {
      const dishes = JSON.parse(selectedDishesParam);
      return dishes.reduce((acc, dish) => {
        acc[dish.id] = true;
        return acc;
      }, {});
    }
    return {};
  });
  const [selectedExtraDishIds, setSelectedExtraDishIds] = useState(() => {
    if (selectedMenu && selectedDishesParam && selectedDishesParam !== "") {
      const dishes = JSON.parse(selectedDishesParam);
      return dishes.reduce((acc, dish) => {
        acc[dish.id] = true;
        return acc;
      }, {});
    }
    return {};
  });
  const [dishNotes, setDishNotes] = useState(
    dishNotesParam && dishNotesParam !== "" ? JSON.parse(dishNotesParam) : {}
  );
  const [menus, setMenus] = useState([]);
  const [dishes, setDishes] = useState([]);
  const axiosInstance = useAxios();
  const { showModal } = useCommonNoification();
  const menuFlatListRef = useRef(null);
  const dishesFlatListRef = useRef(null);

  useEffect(() => {
    const fetchMenus = async () => {
      try {
        const menuResponse = await axiosInstance.get(`/menus?chefId=${chefId}`);
        setMenus(menuResponse.data.content || []);
      } catch (error) {
        if (error.response?.status === 401) {
          return;
        }
        if (axios.isCancel(error)) {
          return;
        }
        showModal("Error", "Có lỗi xảy ra khi tải danh sách menu.", "Failed");
      }
    };
    fetchMenus();
  }, [chefId]);

  useEffect(() => {
    const fetchDishes = async () => {
      try {
        let dishesResponse;
        if (selectedMenu) {
          dishesResponse = await axiosInstance.get(
            `/dishes/not-in-menu?menuId=${selectedMenu}`
          );
        } else {
          dishesResponse = await axiosInstance.get(`/dishes?chefId=${chefId}`);
        }
        setDishes(dishesResponse.data.content || []);
      } catch (error) {
        if (error.response?.status === 401) {
          return;
        }
        if (axios.isCancel(error)) {
          return;
        }
        showModal("Error", "Có lỗi xảy ra khi tải danh sách món ăn.", "Failed");
        setDishes([]);
      }
    };
    fetchDishes();
  }, [selectedMenu, chefId]);

  useEffect(() => {
    const backAction = () => {
      handleBack();
      return true;
    };

    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      backAction
    );

    return () => backHandler.remove();
  }, [
    chefId,
    date,
    selectedPackage,
    selectedDates,
    selectedMenu,
    selectedDishes,
    selectedExtraDishIds,
    dishNotes,
    numPeople,
    address,
    dishes,
    menus,
  ]);

  const toggleDish = (id) => {
    if (selectedMenu) {
      setSelectedExtraDishIds((prev) => {
        const newState = { ...prev, [id]: !prev[id] };
        if (!newState[id]) {
          setDishNotes((prevNotes) => {
            const updatedNotes = { ...prevNotes };
            delete updatedNotes[id];
            return updatedNotes;
          });
        }
        return newState;
      });
    } else {
      setSelectedDishes((prev) => {
        const newState = { ...prev, [id]: !prev[id] };
        if (!newState[id]) {
          setDishNotes((prevNotes) => {
            const updatedNotes = { ...prevNotes };
            delete updatedNotes[id];
            return updatedNotes;
          });
        }
        return newState;
      });
    }
  };

  const handleSelectMenu = (menuId) => {
    const selectedDishesCount =
      Object.values(selectedDishes).filter(Boolean).length +
      Object.values(selectedExtraDishIds).filter(Boolean).length;
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
    setSelectedExtraDishIds({});
    setDishNotes({});
  };

  const handleAddNote = (id, text) => {
    setDishNotes((prev) => ({
      ...prev,
      [id]: text,
    }));
  };

  const handleBack = () => {
    const selectedMenuData = selectedMenu
      ? menus.find((item) => item.id === selectedMenu)
      : null;
    const selectedDishesData = selectedMenu
      ? dishes.filter((dish) => selectedExtraDishIds[dish.id])
      : dishes.filter((dish) => selectedDishes[dish.id]);

    router.push({
      pathname: "/screen/longTermSelect",
      params: {
        chefId,
        date,
        selectedPackage,
        selectedDates,
        selectedMenu: selectedMenuData ? JSON.stringify(selectedMenuData) : "",
        selectedDishes:
          selectedDishesData.length > 0
            ? JSON.stringify(selectedDishesData)
            : "",
        dishNotes: JSON.stringify(dishNotes),
        numPeople: numPeople || "",
        address: address || "",
        isRepeatEnabled: params.isRepeatEnabled || "",
        selectedWeekdays: params.selectedWeekdays || "",
      },
    });
  };

  const handleConfirm = () => {
    const selectedMenuData = selectedMenu
      ? menus.find((item) => item.id === selectedMenu)
      : null;
    const selectedDishesData = selectedMenu
      ? dishes.filter((dish) => selectedExtraDishIds[dish.id])
      : dishes.filter((dish) => selectedDishes[dish.id]);

    if (!selectedMenuData && selectedDishesData.length === 0) {
      showModal("Error", "Vui lòng chọn ít nhất một menu hoặc món ăn.", "Failed")
      return;
    }

    router.push({
      pathname: "/screen/longTermSelect",
      params: {
        chefId,
        date,
        selectedPackage,
        selectedDates,
        selectedMenu: selectedMenuData ? JSON.stringify(selectedMenuData) : "",
        selectedDishes:
          selectedDishesData.length > 0
            ? JSON.stringify(selectedDishesData)
            : "",
        dishNotes: JSON.stringify(dishNotes),
        numPeople: numPeople || "",
        address: address || "",
        isRepeatEnabled: params.isRepeatEnabled || "",
        selectedWeekdays: params.selectedWeekdays || "",
      },
    });
  };

  const renderDish = ({ item }) => {
    const isSelected = selectedMenu
      ? selectedExtraDishIds[item.id]
      : selectedDishes[item.id];
    return (
      <View style={{ marginBottom: 12 }}>
        <DishCard
          item={item}
          isSelected={isSelected}
          onToggle={() => toggleDish(item.id)}
        />
      </View>
    );
  };

  const renderMenu = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.menuCard,
        {
          borderWidth: 2,
          borderColor: selectedMenu === item.id ? "#F8BF40" : "transparent",
        },
      ]}
      onPress={() => handleSelectMenu(item.id)}
    >
      <Image
        source={{
          uri:
            item.imageUrl ||
            "https://i.etsystatic.com/9684337/r/il/5c0f82/726795730/il_fullxfull.726795730_km9q.jpg",
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

  return (
    <SafeAreaView style={commonStyles.containerContent}>
      <Header
        title={t("selectDish")}
        onLeftPress={handleBack}
        subtitle={t("selectDishFor", { date })}
      />
      <Text style={styles.sectionTitle}>{t("selectAvailableMenu")}:</Text>
      <FlatList
        ref={menuFlatListRef}
        data={menus}
        horizontal
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderMenu}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 12 }}
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
        Object.values(selectedExtraDishIds).some((val) => val)) && (
          <TouchableOpacity style={styles.button} onPress={handleConfirm}>
            <Text style={styles.buttonText}>{t("confirmDishSelection")}</Text>
          </TouchableOpacity>
        )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
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
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 16,
    elevation: 3,
    marginRight: 16,
    marginBottom: 12,
    width: 360,
    overflow: "hidden",
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
    borderColor: selected ? "#F8BF40" : "#ccc",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
    marginTop: 6,
  }),
  menuImage: {
    width: 80,
    height: 80,
    borderRadius: 12,
    marginRight: 16,
  },
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
    borderColor: "#ccc",
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

export default ChooseFoodForLongterm;