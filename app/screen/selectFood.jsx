import React, { useEffect, useState, useRef } from "react";
import {
  Image,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  FlatList,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import Ionicons from '@expo/vector-icons/Ionicons';
import useAxios from "../../config/AXIOS_API";
import { commonStyles } from "../../style";
import Header from "../../components/header";
import { t } from "i18next";
import { useCommonNoification } from "../../context/commonNoti";
import axios from "axios";
import { Modalize } from 'react-native-modalize';
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { useSelectedItems } from "../../context/itemContext";
import * as SecureStore from "expo-secure-store";

const DishCard = ({ item, selectedList, onToggle, note, viewDetails }) => (
  <View style={[styles.dishCard, { flexDirection: 'row', alignItems: 'center', paddingRight: 50 }, selectedList[item.id] && styles.selectedDishes,]}>
    <TouchableOpacity onPress={() => onToggle()} style={{ flexDirection: 'row' }}>
      <Image
        source={{ uri: item.imageUrl }}
        style={styles.image}
        resizeMode="cover"
      />
      <View style={styles.cardContent}>
        <Text style={styles.title}>{item.name}</Text>
        <Text style={styles.desc}>{item.description || t("noInformation")}</Text>
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
        <Text style={styles.desc}>{item.description || t("noInformation")}</Text>
      </View>
    </TouchableOpacity>
    <TouchableOpacity style={{ position: 'absolute', top: 5, right: 20 }} onPress={() => onViewDetails(item)}>
      <Ionicons name="information-circle-outline" size={24} color="black" />
    </TouchableOpacity>
  </View>
);

const SelectFood = () => {
  const router = useRouter();
  const { showModal } = useCommonNoification();
  const [menus, setMenus] = useState([]);
  const [dishes, setDishes] = useState([]);
  const axiosInstance = useAxios();
  const [loading, setLoading] = useState(false);
  const menuFlatListRef = useRef(null);
  const dishesFlatListRef = useRef(null);
  const menuDetailModalRef = useRef(null);
  const [selectedMenuDetail, setSelectedMenuDetail] = useState(null);
  const [modalKey, setModalKey] = useState(0);
  const { selectedMenu, setSelectedMenu, selectedDishes, setSelectedDishes, extraDishIds, setExtraDishIds, chefId, setIsLoop, routeBefore, setRouteBefore } = useSelectedItems();
  const startDish = SecureStore.getItem("firstDish");
  const startChef = SecureStore.getItem("firstChef");

  useEffect(() => {
    fetchMenus();
  }, [])

  useEffect(() => {
    fetchDishes();
  }, [selectedMenu]);


  const handleViewMenuDetails = (menu) => {
    setSelectedMenuDetail(menu);
    setModalKey(prev => prev + 1);
    setTimeout(() => {
      menuDetailModalRef.current?.open();
    }, 100);
  };



  const fetchMenus = async () => {
    setLoading(true);
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
      showModal(t("modal.error"), t("fetchMenusFailed"), "Failed");
    } finally {
      setLoading(false);
    }
  };
  const fetchDishes = async () => {
    setLoading(true);
    try {
      let dishesResponse;
      if (selectedMenu) {
        dishesResponse = await axiosInstance.get(
          `/dishes/not-in-menu?menuId=${selectedMenu.id}`
        );
      } else {
        dishesResponse = await axiosInstance.get(`/dishes?chefId=${chefId}`);
      }
      setDishes(
        (dishesResponse.data.content || []).map(({ id, name, imageUrl, description }) => ({
          id,
          name,
          description,
          imageUrl,
        }))
      );
    } catch (error) {
      if (error.response?.status === 401) {
        return;
      }
      if (axios.isCancel(error)) {
        return;
      }
      showModal(t("modal.error"), t("fetchDishesFailed"), "Failed");
      setDishes([]);
    } finally {
      setLoading(false);
    }
  };

  const toggleDish = (item) => {
    const id = item.id;
    if (selectedMenu) {
      setExtraDishIds((prev) => {
        const newState = { ...prev };
        if (newState[id]) {
          delete newState[id];
        } else {
          newState[id] = item;
        }
        return newState;
      })
    } else {
      setSelectedDishes((prev) => {
        const newState = { ...prev };
        if (newState[id]) {
          delete newState[id];
        } else {
          newState[id] = item;
        }
        return newState;
      })
    }
  };

  const handleSelectMenu = (menu) => {
    const selectedDishesCount =
      Object.values(selectedDishes).filter(Boolean).length;
    if (selectedDishesCount > 0) {
      showModal(t("modal.error"), t("menuSelectError"), "Failed");
      return;
    }
    setSelectedMenu((prev) => (prev?.id === menu.id ? null : menu));
    setSelectedDishes({});
    setExtraDishIds({});
  };

  const handleContinue = () => {
    if (!selectedMenu && selectedDishes.length === 0) {
      showModal(t("modal.error"), t("selectionRequired"), "Failed");
      return;
    }
    // router.push("/screen/booking");
    // setRouteBefore(segment);
    router.replace("/screen/booking");
  };

  const handleViewDetails = (id) => {
    setIsLoop(true);
    router.replace({
      pathname: "/screen/dishDetails",
      params: {
        dishId: id
      }
    })
  }

  const handleBack = () => {
    if (routeBefore[1] === "dishDetails") {
      router.replace({
        pathname: `${routeBefore[0]}/${routeBefore[1]}`,
        params: {
          dishId: startDish
        }
      })

    } else if (routeBefore[1] === "chefDetail") {
      router.replace({
        pathname: `${routeBefore[0]}/${routeBefore[1]}`,
        params: {
          chefId: startChef
        }
      })
    } else {
      router.replace(`${routeBefore[0]}/${routeBefore[1]}`);
    }
  }

  const renderDish = ({ item }) => {
    return (
      <View style={{ marginBottom: 12 }}>
        <DishCard
          item={item}
          selectedList={selectedMenu ? extraDishIds : selectedDishes}
          onToggle={() => toggleDish(item)}
          viewDetails={handleViewDetails}
        />
      </View>
    );
  };

  const renderMenu = ({ item }) => (
    <MenuCard
      item={item}
      isSelected={selectedMenu?.id === item.id}
      onSelect={() => handleSelectMenu(item)}
      onViewDetails={handleViewMenuDetails}
    />
  );

  return (
    <GestureHandlerRootView >
      <SafeAreaView style={commonStyles.container}>
        <Header title={t("selectDish")} onLeftPress={() => handleBack()} />
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
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  selectedMenu: {
    borderWidth: 2,
    borderColor: "#F8BF40",
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