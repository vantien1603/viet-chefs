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
import Ionicons from '@expo/vector-icons/Ionicons';
import useAxios from "../../config/AXIOS_API";
import { commonStyles } from "../../style";
import Header from "../../components/header";
import { t } from "i18next";
import { useCommonNoification } from "../../context/commonNoti";
import axios from "axios";

const DishCard = ({ item, selectedList, onToggle, note, }) => (
  <View style={[styles.dishCard, { flexDirection: 'row', alignItems: 'center', paddingRight: 50 }, selectedList[item.id] && styles.selectedDishes,]}>
    <TouchableOpacity onPress={onToggle} style={{ flexDirection: 'row' }}>
      <Image
        source={{ uri: item.imageUrl || "https://via.placeholder.com/80" }}
        style={styles.image}
        resizeMode="cover"
      />
      <View style={styles.cardContent}>
        <Text style={styles.title}>{item.name}</Text>
        <Text style={styles.desc}>{item.description || t("noInformation")}</Text>
        {note ? <Text style={styles.note}>{t("note")}: {note}</Text> : null}
      </View>
    </TouchableOpacity>
    <TouchableOpacity style={{ padding: 10, backgroundColor: 'transparent' }}>
      <Ionicons name="information-outline" size={24} color="black" />
    </TouchableOpacity>
  </View>

);


const MenuCard = ({ item, isSelected, onSelect }) => (
  <TouchableOpacity onPress={onSelect} style={[styles.menuCard, isSelected && styles.selectedMenu]}>
    <Image
      source={{
        uri: item?.imageUrl,
      }}
      style={styles.image}
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
  const { showModal } = useCommonNoification();
  const { chefId, selectedMenu: selectedMenuParam, selectedDishes: selectedDishesParam, dishNotes: dishNotesParam, } = params;
  const [selectedMenu, setSelectedMenu] = useState(selectedMenuParam && selectedMenuParam !== "" ? JSON.parse(selectedMenuParam)?.id : null);
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
  const [menus, setMenus] = useState([]);
  const [dishes, setDishes] = useState([]);
  const axiosInstance = useAxios();

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
        showModal("Error", "Có lỗi xảy ra trong quá trình tải danh sách menu", "Failed");
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
        showModal("Error", "Có lỗi xảy ra trong quá trình tải danh sách món ăn", "Failed");
        setDishes([]);
      }
    };
    fetchDishes();
  }, [selectedMenu]);

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
      Object.values(selectedDishes).filter(Boolean).length;
    if (selectedDishesCount > 0) {
      showModal("Error", "Bạn phải bỏ chọn tất cả món ăn trước khi chọn menu.", "Failed");
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
      showModal("Error", "Vui lòng chọn ít nhất một menu hoặc món ăn.", "Failed");
      return;
    }

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
      ? extraDishIds[item.id]
      : selectedDishes[item.id];
    return (
      <View style={{ marginBottom: 12 }}>
        <DishCard
          item={item}
          selectedList={selectedDishes}
          onToggle={() => toggleDish(item.id)}
        />
      </View>
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
    <SafeAreaView style={commonStyles.container}>
      <Header title={t("selectDish")} onLeftPress={handleBack} />
      <View style={commonStyles.containerContent}>
        <Text style={styles.sectionTitle}>{t("selectAvailableMenu")}:</Text>
        <View>
          <FlatList
            ref={menuFlatListRef}
            data={menus}
            horizontal
            keyExtractor={(item) => item.id.toString()}
            renderItem={renderMenu}
            contentContainerStyle={{ paddingHorizontal: 16 }}
            ListEmptyComponent={
              <Text style={styles.emptyText}>{t("noMenuAvailable")}</Text>
            }
          />
        </View>

        <Text style={styles.sectionTitle}>
          {selectedMenu ? t("chooseMoreDishes") : t("selectDishesManually")}
        </Text>
        <FlatList
          ref={dishesFlatListRef}
          data={dishes}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderDish}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 120, paddingHorizontal: 10, marginTop: 5 }}
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
      </View>

    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  selectedMenu: {
    borderWidth: 2,
    borderColor: "#F8BF40",
    // backgroundColor: '#000'
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
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 16,
    paddingVertical: 20,
    paddingHorizontal: 10,
    elevation: 3,
    marginRight: 16,
    marginBottom: 50,
    width: 340,
    overflow: "hidden",
  },
  dishCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 16,
    elevation: 3,
    marginBottom: 5,
    width: "100%",
    overflow: "hidden",
  },
  selectedDishes: {
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

export default SelectFood;
