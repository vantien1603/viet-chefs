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
} from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import Header from "../../components/header";
import { commonStyles } from "../../style";
import { Dropdown } from "react-native-element-dropdown";
import useAxios from "../../config/AXIOS_API";
import { useCommonNoification } from "../../context/commonNoti";
import axios from "axios";

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

console.log("cc", chefId);
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
        showModal("Error", "Có lỗi xảy ra trong quá trình tải danh sách menu.", "Failed");
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
      } else {
        setMenuDishes([]);
      }
    } else {
      setMenuDishes([]);
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
        } catch (error) {
          if (error.response?.status === 401) {
            return;
          }
          if (axios.isCancel(error)) {
            return;
          }
          showModal("Error", "Có lỗi xảy ra trong quá trình tải dữ liệu.", "Failed");
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
          const dishesResponse = await axiosInstance.get(`/dishes`);
          setAllDishes(dishesResponse.data.content || []);
        } catch (error) {
          if (error.response?.status === 401) {
            return;
          }
          if (axios.isCancel(error)) {
            return;
          }
          showModal("Error", "Có lỗi xảy ra trong quá trình tải dữ liệu.", "Failed");
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
      setSelectedDishes(
        selectedDishes.filter((dish) => dish.dishId !== dishId)
      );
    } else {
      setSelectedDishes([...selectedDishes, { dishId, notes: "" }]);
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

      // console.log("Calculate data:", JSON.stringify(calculateData, null, 2));

      const response = await axiosInstance.post(
        `/bookings/booking-details/${bookingDetailId}/calculate`,
        calculateData
      );

      // showModal("Success", "Calculation completed.", "Success");

      const updateData = {
        dishes: selectedDishes,
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
      };

      console.log("Update data:", JSON.stringify(updateData, null, 2));

      router.push({
        pathname: "/screen/bookingDetails",
        params: { bookingDetailId, updateData: JSON.stringify(updateData) },
      });
    } catch (error) {
      if (error.response?.status === 401) {
        return;
      }
      if (axios.isCancel(error)) {
        return;
      }
      showModal("Error", "Có lỗi xảy ra trong quá trình xử lí.", "Failed");
    } finally {
      setLoading(false);
    }
  };


  const renderMenuDishItem = ({ item }) => (
    <View style={styles.dishItem}>
      <Text style={styles.dishText}>
        {item.dishName || `Dish ${item.dishId}`}
      </Text>
    </View>
  );

  const renderExtraDishItem = ({ item }) => (
    <View style={styles.dishItem}>
      <TouchableOpacity
        style={styles.checkboxContainer}
        onPress={() => toggleExtraDish(item.id)}
      >
        <View style={styles.checkbox}>
          {selectedExtraDishIds.includes(item.id) && (
            <Text style={styles.checkmark}>✔</Text>
          )}
        </View>
        <Text style={styles.dishText}>{item.name || `Dish ${item.id}`}</Text>
      </TouchableOpacity>
    </View>
  );

  const renderDishItem = ({ item }) => (
    <View style={styles.dishItem}>
      <TouchableOpacity
        style={styles.checkboxContainer}
        onPress={() => toggleDish(item.id)}
      >
        <View style={styles.checkbox}>
          {selectedDishes.some((dish) => dish.dishId === item.id) && (
            <Text style={styles.checkmark}>✔</Text>
          )}
        </View>
        <Text style={styles.dishText}>{item.name || `Dish ${item.id}`}</Text>
      </TouchableOpacity>
      {selectedDishes.some((dish) => dish.dishId === item.id) && (
        <TextInput
          style={styles.input}
          placeholder="Notes"
          value={
            selectedDishes.find((dish) => dish.dishId === item.id)?.notes || ""
          }
          onChangeText={(text) => updateDishNotes(item.id, text)}
        />
      )}
    </View>
  );

  return (
    <SafeAreaView style={commonStyles.containerContent}>
      <Header title="Update Booking Detail" />
      <ScrollView style={{ padding: 20 }}>
        {/* Menu Dropdown */}
        <Text style={styles.sectionTitle}>Select Menu</Text>
        <View style={styles.dropdownContainer}>
          <Dropdown
            style={styles.dropdown}
            placeholderStyle={styles.placeholderStyle}
            selectedTextStyle={styles.selectedTextStyle}
            data={[
              { label: "Select a menu", value: null },
              ...menus.map((menu) => ({
                label: menu.name || `Menu ${menu.id}`,
                value: menu.id,
              })),
            ]}
            labelField="label"
            valueField="value"
            placeholder="Select a menu"
            value={selectedMenu}
            onChange={(item) => {
              setSelectedMenu(item.value);
              if (item.value) {
                setSelectedDishes([]); // Xóa danh sách dishes nếu chọn menu
              } else {
                setSelectedExtraDishIds([]); // Xóa danh sách extra dishes nếu bỏ chọn menu
              }
            }}
            disable={selectedDishes.length > 0} // Vô hiệu hóa nếu đã chọn dishes
          />
        </View>

        {/* Dishes của Menu (chỉ hiển thị khi chọn menu) */}
        {selectedMenu && (
          <>
            <Text style={styles.sectionTitle}>Dishes in Menu</Text>
            {menuDishes.length > 0 ? (
              <FlatList
                data={menuDishes}
                renderItem={renderMenuDishItem}
                keyExtractor={(item) => item.dishId.toString()}
                scrollEnabled={false}
              />
            ) : (
              <Text style={styles.noDataText}>No dishes in this menu</Text>
            )}
          </>
        )}

        {/* Extra Dishes (chỉ hiển thị khi chọn menu) */}
        {selectedMenu && (
          <>
            <Text style={styles.sectionTitle}>Select Extra Dishes</Text>
            {extraDishes.length > 0 ? (
              <FlatList
                data={extraDishes}
                renderItem={renderExtraDishItem}
                keyExtractor={(item) => item.id.toString()}
                scrollEnabled={false}
              />
            ) : (
              <Text style={styles.noDataText}>No extra dishes available</Text>
            )}
          </>
        )}

        {/* Dishes (chỉ hiển thị khi không chọn menu) */}
        {!selectedMenu && (
          <>
            <Text style={styles.sectionTitle}>Select Dishes</Text>
            {allDishes.length > 0 ? (
              <FlatList
                data={allDishes}
                renderItem={renderDishItem}
                keyExtractor={(item) => item.id.toString()}
                scrollEnabled={false}
              />
            ) : (
              <Text style={styles.noDataText}>No dishes available</Text>
            )}
          </>
        )}
      </ScrollView>

      <TouchableOpacity
        style={styles.doneButton}
        onPress={handleCalculate}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator size="small" color="white" />
        ) : (
          <Text style={styles.doneButtonText}>Done</Text>
        )}
      </TouchableOpacity>

    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
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
  },
  selectedTextStyle: {
    fontSize: 14,
    color: "#333",
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
    fontWeight: "bold",
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
  dishText: {
    fontSize: 14,
    color: "#333",
  },
  input: {
    borderWidth: 1,
    borderColor: "#DDD",
    borderRadius: 5,
    padding: 10,
    marginBottom: 10,
    fontSize: 14,
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
    fontWeight: "bold",
    fontSize: 16,
  },
  noDataText: {
    fontSize: 14,
    color: "#9C583F",
    textAlign: "center",
    marginVertical: 10,
  },
});

export default UpdateBookingDetailScreen;