import React, { useEffect, useState } from "react";
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
  ScrollView,
  TextInput,
  Image,
} from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import Header from "../../components/header";
import { commonStyles } from "../../style";
import { Dropdown } from "react-native-element-dropdown";
import useAxios from "../../config/AXIOS_API";
import { useCommonNoification } from "../../context/commonNoti";
import axios from "axios";
import { t } from "i18next";
import { useSelectedItems } from "../../context/itemContext";
import { MaterialIcons } from "@expo/vector-icons";

const UpdateBookingDetailScreen = () => {
  const { bookingDetailId, chefId } = useLocalSearchParams();
  const [loading, setLoading] = useState(false);
  const [menus, setMenus] = useState([]);
  const [selectedMenu, setSelectedMenu] = useState(null);
  const [menuDishes, setMenuDishes] = useState([]);
  const [extraDishes, setExtraDishes] = useState([]);
  const [selectedExtraDishIds, setSelectedExtraDishIds] = useState([]);
  const [allDishes, setAllDishes] = useState([]);
  const [selectedDishes, setSelectedDishes] = useState([]);
  const axiosInstance = useAxios();
  const { showModal } = useCommonNoification();
  const [selectedMenuDetails, setSelectedMenuDetails] = useState(null);
  const { ingredientPrep, setIngredientPrep } = useSelectedItems();

  // Fetch danh sách menu
  useEffect(() => {
    const fetchMenus = async () => {
      try {
        const menuResponse = await axiosInstance.get(`/menus?chefId=${chefId}`);
        console.log(
          "Menu response:",
          JSON.stringify(menuResponse.data.content, null, 2)
        );
        setMenus(menuResponse.data.content || []);
      } catch (error) {
        if (error.response?.status === 401) {
          return;
        }
        if (axios.isCancel(error)) {
          return;
        }
        showModal(t("modal.error"), t("errors.fetchMenusFailed"), "Failed");
      }
    };
    fetchMenus();
  }, [chefId]);

  useEffect(() => {
    if (selectedMenu) {
      console.log("Selected menu:", selectedMenu);
      const selectedMenuData = menus.find((menu) => menu.id === selectedMenu);
      if (selectedMenuData && selectedMenuData.menuItems) {
        setMenuDishes(selectedMenuData.menuItems || []);
        setSelectedMenuDetails({
          beforePrice: selectedMenuData.beforePrice,
          afterPrice: selectedMenuData.afterPrice,
          name: selectedMenuData.name,
        });
      } else {
        setMenuDishes([]);
        setSelectedMenuDetails(null);
      }
    } else {
      setMenuDishes([]);
      setSelectedMenuDetails(null);
    }
  }, [selectedMenu, menus]);

  useEffect(() => {
    const fetchExtraDishes = async () => {
      if (selectedMenu) {
        try {
          const dishesResponse = await axiosInstance.get(
            `/dishes/not-in-menu?menuId=${selectedMenu}`
          );
          setExtraDishes(dishesResponse.data.content || []);
          // console.log("extra", dishesResponse.data.content);
        } catch (error) {
          if (error.response?.status === 401) {
            return;
          }
          if (axios.isCancel(error)) {
            return;
          }
          showModal(t("modal.error"), t("errors.fetchDishFailed"), "Failed");
          setExtraDishes([]);
        }
      } else {
        setExtraDishes([]);
        setSelectedExtraDishIds([]);
      }
    };
    fetchExtraDishes();
  }, [selectedMenu]);

  useEffect(() => {
    const fetchDishes = async () => {
      if (!selectedMenu) {
        try {
          const dishesResponse = await axiosInstance.get(
            `/dishes?chefId=${chefId}`
          );
          setAllDishes(dishesResponse.data.content || []);
        } catch (error) {
          if (error.response?.status === 401) {
            return;
          }
          if (axios.isCancel(error)) {
            return;
          }
          showModal(t("modal.error"), t("errors.fetchDishFailed"), "Failed");
          setAllDishes([]);
        }
      } else {
        setAllDishes([]);
        setSelectedDishes([]);
      }
    };
    fetchDishes();
  }, [selectedMenu]);

  const toggleExtraDish = (dishId) => {
    if (selectedExtraDishIds.includes(dishId)) {
      setSelectedExtraDishIds(
        selectedExtraDishIds.filter((id) => id !== dishId)
      );
    } else {
      setSelectedExtraDishIds([...selectedExtraDishIds, dishId]);
    }
  };

  const toggleDish = (dishId) => {
    if (selectedDishes.some((dish) => dish.dishId === dishId)) {
      // Xóa món ăn khỏi selectedDishes và selectedExtraDishIds
      setSelectedDishes(
        selectedDishes.filter((dish) => dish.dishId !== dishId)
      );
      setSelectedExtraDishIds(
        selectedExtraDishIds.filter((id) => id !== dishId)
      );
    } else {
      // Thêm món ăn vào selectedDishes và selectedExtraDishIds
      setSelectedDishes([...selectedDishes, { dishId, notes: "" }]);
      setSelectedExtraDishIds([...selectedExtraDishIds, dishId]);
    }
  };

  const updateDishNotes = (dishId, notes) => {
    setSelectedDishes(
      selectedDishes.map((dish) =>
        dish.dishId === dishId ? { ...dish, notes } : dish
      )
    );
  };

  const handleCalculate = async () => {
    setLoading(true);
    try {
      const calculateData = {
        menuId: selectedMenu ? parseInt(selectedMenu) : null,
        extraDishIds: selectedExtraDishIds,
        dishes: selectedDishes,
      };

      console.log("Calculate data:", JSON.stringify(calculateData, null, 2));

      const response = await axiosInstance.post(
        `/bookings/booking-details/${bookingDetailId}/calculate`,
        calculateData
      );

      // showModal(t('modal.success')success"), "Calculation compt('modal.success')t('modal.success'));

      const updateData = {
        dishes: selectedDishes.map((dish) => ({
          dishId: dish.dishId, // Chuẩn hóa cấu trúc
          notes: dish.notes,
        })),
        totalPrice: response.data.totalPrice || 0,
        chefCookingFee: response.data.chefCookingFee || 0,
        priceOfDishes: response.data.priceOfDishes || 0,
        arrivalFee: response.data.arrivalFee || 0,
        platformFee: response.data.platformFee || 0,
        totalChefFeePrice: response.data.totalChefFeePrice || 0,
        discountAmout: response.data.discountAmout || 0,
        timeBeginCook: response.data.timeBeginCook,
        timeBeginTravel: response.data.timeBeginTravel,
        menuId: selectedMenu ? parseInt(selectedMenu) : null, // Cho phép menuId là null
        extraDishIds: selectedExtraDishIds,
        chefBringIngredients: ingredientPrep === "chef",
      };

      console.log("Update data:", JSON.stringify(updateData, null, 2));

      router.push({
        pathname: "/screen/confirmBookingDetail",
        params: { bookingDetailId, updateData: JSON.stringify(updateData) },
      });
    } catch (error) {
      console.log("er", error.response?.data);
      if (error.response?.status === 401) {
        return;
      }
      if (axios.isCancel(error)) {
        return;
      }
      showModal(t("modal.error"), t("errors.calculateFailed"), "Failed");
    } finally {
      setLoading(false);
    }
  };

  const renderMenuDishItem = ({ item }) => (
    <View style={styles.menuDishItem}>
      <View style={styles.dishContainer}>
        <Image
          source={{ uri: item.dishImageUrl }}
          style={styles.dishImage}
          resizeMode="cover"
        />
        <Text style={styles.menuDishText}>
          {item.dishName || `Dish ${item.dishId}`}
        </Text>
      </View>
    </View>
  );

  const renderExtraDishItem = ({ item }) => (
    <View style={styles.dishItem}>
      <View style={styles.dishContainer}>
        <Image
          source={{ uri: item.imageUrl }}
          style={styles.dishImage}
          resizeMode="cover"
        />
        <View style={styles.dishDetails}>
          <TouchableOpacity
            style={styles.checkboxContainer}
            onPress={() => toggleDish(item.id)}
          >
            <View style={styles.checkbox}>
              {selectedDishes.some((dish) => dish.dishId === item.id) && (
                <Text style={styles.checkmark}>✔</Text>
              )}
            </View>
            <Text style={styles.dishText}>
              {item.name || `Dish ${item.id}`}
            </Text>
          </TouchableOpacity>

          {/* Base Price and Cook Time */}
          <View style={styles.dishInfo}>
            <Text style={styles.dishInfoText}>
              {t("basePrice")}: ${item.basePrice || "N/A"}
            </Text>
            <Text style={styles.dishInfoText}>
              {t("cookTime")}: {item.cookTime || "N/A"} min
            </Text>
          </View>

          {/* Notes Input */}
          {selectedDishes.some((dish) => dish.dishId === item.id) && (
            <TextInput
              style={styles.input}
              placeholder={t("note")}
              value={
                selectedDishes.find((dish) => dish.dishId === item.id)?.notes ||
                ""
              }
              onChangeText={(text) => updateDishNotes(item.id, text)}
            />
          )}
        </View>
      </View>
    </View>
  );

  const renderDishItem = ({ item }) => (
    <View style={styles.dishItem}>
      <View style={styles.dishContainer}>
        <Image
          source={{ uri: item.imageUrl }}
          style={styles.dishImage}
          resizeMode="cover"
        />
        <View style={styles.dishDetails}>
          <TouchableOpacity
            style={styles.checkboxContainer}
            onPress={() => toggleDish(item.id)}
          >
            <View style={styles.checkbox}>
              {selectedDishes.some((dish) => dish.dishId === item.id) && (
                <Text style={styles.checkmark}>✔</Text>
              )}
            </View>
            <Text style={styles.dishText}>
              {item.name || `Dish ${item.id}`}
            </Text>
          </TouchableOpacity>

          {/* Base Price and Cook Time */}
          <View style={styles.dishInfo}>
            <Text style={styles.dishInfoText}>
              {t("basePrice")}: ${item.basePrice || "N/A"}
            </Text>
            <Text style={styles.dishInfoText}>
              {t("cookTime")}: {item.cookTime || "N/A"} min
            </Text>
          </View>

          {/* Notes Input */}
          {selectedDishes.some((dish) => dish.dishId === item.id) && (
            <TextInput
              style={styles.input}
              placeholder={t("note")}
              value={
                selectedDishes.find((dish) => dish.dishId === item.id)?.notes ||
                ""
              }
              onChangeText={(text) => updateDishNotes(item.id, text)}
            />
          )}
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={commonStyles.containerContent}>
      <Header title={t("updateBookingDetail")} />
      <ScrollView style={{ padding: 20 }}>
        {/* Menu Dropdown */}
        <Text style={styles.sectionTitle}>{t("selectMenu")}</Text>
        <View style={styles.dropdownContainer}>
          <Dropdown
            style={styles.dropdown}
            placeholderStyle={styles.placeholderStyle}
            selectedTextStyle={styles.selectedTextStyle}
            data={[
              { label: t("selectAMenu"), value: null },
              ...menus.map((menu) => ({
                label: menu.name || `Menu ${menu.id}`,
                value: menu.id,
              })),
            ]}
            labelField="label"
            valueField="value"
            placeholder={t("selectAMenu")}
            value={selectedMenu}
            onChange={(item) => {
              setSelectedMenu(item.value);
              if (item.value) {
                setSelectedDishes([]);
                setSelectedExtraDishIds([]);
              } else {
                setSelectedExtraDishIds(
                  selectedDishes.map((dish) => dish.dishId)
                );
              }
            }}
            disable={selectedDishes.length > 0}
          />
        </View>

        {/* Dishes của Menu (chỉ hiển thị khi chọn menu) */}
        {selectedMenu && selectedMenuDetails && (
          <>
            <Text style={styles.sectionTitle}>{t("dishesInMenu")}</Text>
            {/* Menu Prices */}
            <View style={styles.priceContainer}>
              {selectedMenuDetails.beforePrice && (
                <Text style={styles.beforePrice}>
                  ${selectedMenuDetails.beforePrice.toFixed(2)}
                </Text>
              )}
              <Text style={styles.afterPrice}>
                ${selectedMenuDetails.afterPrice?.toFixed(2) || "N/A"}
              </Text>
            </View>
            {/* Menu Dishes */}
            {menuDishes.length > 0 ? (
              <FlatList
                data={menuDishes}
                renderItem={renderMenuDishItem}
                keyExtractor={(item) => item.dishId.toString()}
                scrollEnabled={false}
              />
            ) : (
              <Text style={styles.noDataText}>{t("noDishesInMenu")}</Text>
            )}
          </>
        )}

        {/* Extra Dishes (chỉ hiển thị khi chọn menu) */}
        {selectedMenu && (
          <>
            <Text style={styles.sectionTitle}>{t("selectExtraDishes")}</Text>
            {extraDishes.length > 0 ? (
              <FlatList
                data={extraDishes}
                renderItem={renderExtraDishItem}
                keyExtractor={(item) => item.id.toString()}
                scrollEnabled={false}
              />
            ) : (
              <Text style={styles.noDataText}>{t("noExtraDishes")}</Text>
            )}
          </>
        )}

        {!selectedMenu && (
          <>
            <Text style={styles.sectionTitle}>{t("selectDishes")}</Text>
            {allDishes.length > 0 ? (
              <FlatList
                data={allDishes}
                renderItem={renderDishItem}
                keyExtractor={(item) => item.id.toString()}
                scrollEnabled={false}
              />
            ) : (
              <Text style={styles.noDataText}>{t("noDishesAvailable")}</Text>
            )}
          </>
        )}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t("ingredientPreparation")}</Text>
          <View>
            <TouchableOpacity
              style={{
                flexDirection: "row",
                alignItems: "center",
                marginBottom: 5,
              }}
              onPress={() => setIngredientPrep("customer")}
            >
              <MaterialIcons
                name={
                  ingredientPrep === "customer"
                    ? "check-box"
                    : "check-box-outline-blank"
                }
                size={24}
                color={ingredientPrep === "customer" ? "#A64B2A" : "#333"}
              />
              <Text style={styles.checkboxText}>
                {t("customerBringIngredients")}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={{ flexDirection: "row", alignItems: "center" }}
              onPress={() => setIngredientPrep("chef")}
            >
              <MaterialIcons
                name={
                  ingredientPrep === "chef"
                    ? "check-box"
                    : "check-box-outline-blank"
                }
                size={24}
                color={ingredientPrep === "chef" ? "#A64B2A" : "#333"}
              />
              <Text style={styles.checkboxText}>
                {t("chefWillPrepareIngredients")}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      <TouchableOpacity
        style={styles.doneButton}
        onPress={handleCalculate}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator size="small" color="white" />
        ) : (
          <Text style={styles.doneButtonText}>{t("done")}</Text>
        )}
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  sectionTitle: {
    fontSize: 18,
    fontFamily: "nunito-bold",
    color: "#333",
    marginTop: 10,
    marginBottom: 10,
  },
  dropdownContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  dropdown: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#DDD",
    borderRadius: 5,
    padding: 10,
  },
  placeholderStyle: {
    fontSize: 14,
    color: "#999",
    fontFamily: "nunito-regular",
  },
  selectedTextStyle: {
    fontSize: 14,
    color: "#333",
    fontFamily: "nunito-regular",
  },
  clearButton: {
    marginLeft: 10,
    backgroundColor: "#FF4D4F",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 5,
  },
  clearButtonText: {
    color: "white",
    fontSize: 14,
    fontFamily: "nunito-bold",
  },
  dishItem: {
    marginBottom: 10,
  },
  checkboxContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 5,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 1,
    borderColor: "#666",
    borderRadius: 3,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  checkmark: {
    color: "#A64B2A",
    fontSize: 14,
  },
  dishContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  dishImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 10,
  },
  dishDetails: {
    flex: 1,
  },
  dishInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 5,
    marginBottom: 5,
  },
  dishInfoText: {
    fontSize: 14,
    color: "#666",
    fontFamily: "nunito-regular",
  },
  dishText: {
    fontSize: 14,
    color: "#333",
    fontFamily: "nunito-regular",
  },
  input: {
    borderWidth: 1,
    borderColor: "#DDD",
    borderRadius: 5,
    padding: 10,
    marginBottom: 10,
    fontSize: 14,
    fontFamily: "nunito-regular",
  },
  doneButton: {
    backgroundColor: "#A64B2A",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
    marginVertical: 20,
    marginHorizontal: 20,
  },
  doneButtonText: {
    color: "white",
    fontFamily: "nunito-bold",
    fontSize: 16,
  },
  noDataText: {
    fontSize: 14,
    color: "#9C583F",
    textAlign: "center",
    marginVertical: 10,
    fontFamily: "nunito-regular",
  },
  priceContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  beforePrice: {
    fontSize: 16,
    color: "#999",
    fontFamily: "nunito-regular",
    textDecorationLine: "line-through",
    marginRight: 10,
  },
  afterPrice: {
    fontSize: 16,
    color: "#A64B2A",
    fontFamily: "nunito-bold",
  },
  menuDishItem: {
    marginBottom: 10,
    backgroundColor: "#F9F9F9",
    borderRadius: 8,
    padding: 10,
  },
  menuDishText: {
    fontSize: 14,
    color: "#333",
    fontFamily: "nunito-regular",
    flex: 1,
  },
  section: {
    borderTopColor: "#E5E5E5",
    borderTopWidth: 1,
    paddingVertical: 20,
  },
  checkboxText: {
    fontSize: 16,
    color: "#333",
    marginLeft: 10,
    fontFamily: "nunito-regular",
  },
});

export default UpdateBookingDetailScreen;
