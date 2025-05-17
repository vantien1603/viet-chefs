import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Image,
  StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import useAxios from "../../config/AXIOS_API";
import { commonStyles } from "../../style";
import Header from "../../components/header";
import { t } from "i18next";
import { useCommonNoification } from "../../context/commonNoti";
import axios from "axios";
import { useSelectedItems } from "../../context/itemContext";
import { Modalize } from "react-native-modalize";
import { GestureHandlerRootView } from "react-native-gesture-handler";

const DishCard = ({ item, selectedList, onToggle, note, viewDetails }) => (
  <View style={[styles.dishCard, { flexDirection: 'row', alignItems: 'center', paddingRight: 50 }, selectedList && styles.selectedDishes,]}>
    <TouchableOpacity onPress={() => onToggle()} style={{ flexDirection: 'row' }}>
      <Image
        source={{ uri: item.imageUrl || "https://via.placeholder.com/80" }}
        style={styles.image}
        resizeMode="cover"
      />
      <View style={styles.cardContent}>
        <Text style={styles.title}>{item.name}</Text>
        <Text numberOfLines={1} ellipsizeMode="tail"  style={styles.desc}>{item.description || t("noInformation")}</Text>
        {note ? <Text style={styles.note}>{t("note")}: {note}</Text> : null}
      </View>
    </TouchableOpacity>
    <TouchableOpacity style={{ position: 'absolute', top: 10, right: 10 }} onPress={() => viewDetails(item.id)}>
      <Ionicons name="information-circle-outline" size={24} color="black" />
    </TouchableOpacity>
  </View>
);

const MenuCard = ({ item, isSelected, onSelect, onViewDetails }) => (
  <View >
    <TouchableOpacity style={[styles.menuCard, isSelected && styles.selectedMenu]} onPress={onSelect} >
      <Image
        source={{
          uri: item?.imageUrl,
        }}
        style={styles.image}
        resizeMode="cover"
      />
      <View style={styles.cardContent}>
        <Text style={styles.title}>{item.name}</Text>
        <Text numberOfLines={1} ellipsizeMode="tail"  style={styles.desc}>{item.description || t("noInformation")}</Text>
      </View>
    </TouchableOpacity>
    <TouchableOpacity style={{ position: 'absolute', top: 5, right: 20 }} onPress={() => onViewDetails(item)}>
      <Ionicons name="information-circle-outline" size={24} color="black" />
    </TouchableOpacity>
  </View>
);

const ChooseFoodForLongterm = () => {
  const router = useRouter();
  const {
    chefId, selectedDay,
    selectedMenuLong, setSelectedMenuLong,
    selectedDishes, setSelectedDishes,
    extraDishIds, setExtraDishIds,
    setIsLoop, setIsLong
  } = useSelectedItems();

  const menuDetailModalRef = useRef(null);
  const [menus, setMenus] = useState([]);
  const [dishes, setDishes] = useState([]);
  const [selectedMenuDetail, setSelectedMenuDetail] = useState(null);
  const [modalKey, setModalKey] = useState(0);
  const axiosInstance = useAxios();
  const { showModal } = useCommonNoification();
  useEffect(() => {
    const fetchMenus = async () => {
      try {
        const menuResponse = await axiosInstance.get(`/menus?chefId=${chefId}`);
        setMenus(menuResponse.data.content || []);

      } catch (error) {
        if (!axios.isCancel(error) && error.response?.status !== 401) {
          showModal("Error", "Có lỗi khi tải menu.", "Failed");
        }
      }
    };
    fetchMenus();
  }, [chefId]);

  useEffect(() => {
    const fetchDishes = async () => {
      try {
        const res = selectedMenuLong[selectedDay]
          ? await axiosInstance.get(`/dishes/not-in-menu?menuId=${selectedMenuLong[selectedDay].id}`)
          : await axiosInstance.get(`/dishes?chefId=${chefId}`);
        setDishes(res.data.content || []);
      } catch (error) {
        if (!axios.isCancel(error) && error.response?.status !== 401) {
          showModal("Error", "Có lỗi khi tải món ăn.", "Failed");
        }
        setDishes([]);
      }
    };
    fetchDishes();
  }, [chefId, selectedMenuLong, selectedDay]);

  const handleSelectMenu = useCallback((menu) => {
    const dishCount = selectedDishes[selectedDay] ? Object.keys(selectedDishes[selectedDay])?.length : 0;
    if (dishCount > 0) {
      showModal("Error", "Bạn phải bỏ chọn tất cả món ăn trước khi chọn menu.", "Failed");
      return;
    }

    const { id, name, imageUrl, menuItems } = menu;
    const trimmed = { id, name, imageUrl, menuItems };

    setSelectedMenuLong((prev) =>
      prev[selectedDay]?.id === id ? {} : { ...prev, [selectedDay]: trimmed }
    );

    setSelectedDishes(prev => {
      const newSelected = { ...prev };
      delete newSelected[selectedDay];
      return newSelected;
    });

    setExtraDishIds(prev => {
      const newExtra = { ...prev };
      delete newExtra[selectedDay];
      return newExtra;
    });
  }, [selectedDay, selectedDishes, extraDishIds]);


  const toggleDish = useCallback((dish) => {
    const { id, name, imageUrl } = dish;

    const targetSetter = selectedMenuLong[selectedDay] ? setExtraDishIds : setSelectedDishes;

    targetSetter((prev) => {
      const updated = { ...prev };
      const dayDishes = { ...(prev[selectedDay] || {}) };
      if (dayDishes[id]) {
        delete dayDishes[id];
      } else {
        dayDishes[id] = { id, name, imageUrl };
      }
      updated[selectedDay] = dayDishes;

      return updated;
    });

  }, [selectedDay, selectedMenuLong]);


  // const toggleDish = useCallback((dish) => {
  //   const { id, name, imageUrl } = dish;
  //   const targetSetter = selectedMenuLong[selectedDay] ? setExtraDishIds : setSelectedDishes;

  //   targetSetter((prev) => {
  //     const dayDishes = { ...(prev[selectedDay] || {}) };
  //     if (dayDishes[id]) delete dayDishes[id];
  //     else dayDishes[id] = { id, name, imageUrl };
  //     return { ...prev, [selectedDay]: dayDishes };
  //   });
  // }, [selectedDay, selectedMenuLong]);

  const handleViewMenuDetails = useCallback((menu) => {
    setSelectedMenuDetail(menu);
    setModalKey((k) => k + 1);
    setTimeout(() => menuDetailModalRef.current?.open(), 100);
  }, []);

  const renderMenu = useCallback(({ item }) => (
    <MenuCard
      item={item}
      isSelected={selectedMenuLong[selectedDay]?.id === item.id}
      onSelect={() => handleSelectMenu(item)}
      onViewDetails={handleViewMenuDetails}
    />
  ), [selectedDay, selectedMenuLong, handleSelectMenu, handleViewMenuDetails]);

  const renderDish = ({ item }) => {
    const dishMap = selectedMenuLong[selectedDay] ? extraDishIds[selectedDay] : selectedDishes[selectedDay];
    const isSelected = !!(dishMap && dishMap[item.id]);
    return (
      <View style={{ marginBottom: 12 }}>
        <DishCard
          item={item}
          selectedList={isSelected}
          onToggle={() => toggleDish(item)}
          viewDetails={handleViewDetails}
        />
      </View>
    );
  };

  const handleViewDetails = (id) => {
    setIsLoop(true);
    setIsLong(true);
    router.replace({
      pathname: "/screen/dishDetails",
      params: {
        dishId: id
      }
    })
  }

  const handleConfirm = () => {
    if (!selectedMenuLong[selectedDay] && !selectedDishes[selectedDay]) {
      showModal("Error", "Vui lòng chọn ít nhất một menu hoặc món ăn.", "Failed")
      return;
    }
    router.replace("/screen/longTermSelect");
  };

  const handleBack = () => {
    router.replace("/screen/longTermSelect");
  }



  return (
    <GestureHandlerRootView>
      <SafeAreaView style={commonStyles.container}>
        <Header
          title={t("selectDish")}
          subtitle={t("selectDishFor", selectedDay)}
          onLeftPress={() => handleBack()}
        />
        <View style={commonStyles.containerContent}>
          <Text style={styles.sectionTitle}>{t("selectAvailableMenu")}:</Text>
          <View>
            <FlatList
              data={menus}
              horizontal
              renderItem={renderMenu}
              keyExtractor={(item) => item.id.toString()}
              contentContainerStyle={{ paddingHorizontal: 16 }}
              ListEmptyComponent={<Text style={styles.emptyText}>{t("noMenuAvailable")}</Text>}
              initialNumToRender={2}
              maxToRenderPerBatch={5}
              windowSize={3}
            />
          </View>

          <Text style={styles.sectionTitle}>
            {selectedMenuLong[selectedDay] ? t("chooseMoreDishes") : t("selectDishesManually")}
          </Text>
          <FlatList
            data={dishes}
            renderItem={renderDish}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={{ padding: 16 }}
            initialNumToRender={5}
            maxToRenderPerBatch={10}
            windowSize={5}
          />

          {(!!selectedMenuLong[selectedDay] ||
            (selectedDishes[selectedDay] && Object.keys(selectedDishes[selectedDay]).length > 0) ||
            (extraDishIds[selectedDay] && Object.keys(extraDishIds[selectedDay]).length > 0)) && (
              <TouchableOpacity style={styles.button} onPress={handleConfirm}>
                <Text style={styles.buttonText}>{t("confirmDishSelection")}</Text>
              </TouchableOpacity>
            )}
        </View>


        <Modalize ref={menuDetailModalRef} key={modalKey} adjustToContentHeight>
          <View style={{ padding: 20 }}>
            {selectedMenuDetail ? (
              <>
                <Image source={{ uri: selectedMenuDetail.imageUrl }} style={{ width: '100%', height: 300, borderRadius: 10 }} resizeMode="cover" />
                <Text style={{ fontSize: 20, fontWeight: 'bold', marginTop: 15 }}>{selectedMenuDetail.name}</Text>
                <Text style={{ marginTop: 10 }}>{selectedMenuDetail.description || t("noInformation")}</Text>
                <Text>
                  <Text>Dishes: </Text>
                  <Text style={[styles.itemContent]}>
                    {selectedMenuDetail.menuItems.map((dish) => dish.dishName).join(", ")}
                  </Text>
                </Text>
              </>
            ) : (
              <Text>{t("noInformation")}</Text>
            )}
          </View>
        </Modalize>
      </SafeAreaView>
    </GestureHandlerRootView>
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
  selectedMenu: {
    borderWidth: 2,
    borderColor: "#F8BF40",
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
  image: {
    width: 80,
    height: 80,
    borderRadius: 10,
    marginRight: 16,
  },

  menuImage: {
    width: 72,
    height: 72,
    borderRadius: 12,
    marginRight: 12,
    backgroundColor: "#f0f0f0",
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

export default ChooseFoodForLongterm;