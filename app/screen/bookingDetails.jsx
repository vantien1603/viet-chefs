import React, { useState, useEffect } from "react";
import {
  SafeAreaView,
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
} from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import Header from "../../components/header";
import { commonStyles } from "../../style";
import useAxios from "../../config/AXIOS_API";
import { useTranslation } from "react-i18next";
import { MaterialIcons } from "@expo/vector-icons"; // Thêm icon
import axios from "axios";

const BookingDetailScreen = () => {
  const { t } = useTranslation();
  const { bookingDetailId, updateData, chefId } = useLocalSearchParams();
  const [bookingDetail, setBookingDetail] = useState(null);
  const [dishNames, setDishNames] = useState({});
  const [loading, setLoading] = useState(false);
  const [updating, setUpdating] = useState(false);
  const axiosInstance = useAxios();

  const fetchBookingDetail = async () => {
    setLoading(true);
    try {
      const response = await axiosInstance.get(
        `/bookings/booking-details/${bookingDetailId}`
      );
      console.log("Booking detail:", JSON.stringify(response.data, null, 2));
      setBookingDetail(response.data);

      if (response.data.dishes && response.data.dishes.length > 0) {
        const dishPromises = response.data.dishes.map(async (dish) => {
          try {
            console.log(dish.dish.id);
            const dishResponse = await axiosInstance.get(
              `/dishes/${dish.dish.id}`
            );
            return { dishId: dish.dish.id, dishName: dishResponse.data.name };
          } catch (error) {
            showModal(
              t("modal.error"),
              `Error fetching dish ${dish.dish.id}`,
              "Failed"
            );
            return { dishId: dish.dish.id, dishName: `Dish ${dish.dish.id}` };
          }
        });
        const dishResults = await Promise.all(dishPromises);
        const dishNamesMap = dishResults.reduce((acc, { dishId, dishName }) => {
          acc[dishId] = dishName;
          return acc;
        }, {});
        setDishNames(dishNamesMap);
      }
    } catch (error) {
      if (error.response?.status === 401) {
        return;
      }
      if (axios.isCancel(error)) {
        return;
      }
      showModal(t("modal.error"), t("failedToLoadBookingDetail"), "Failed");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (data) => {
    setUpdating(true);
    try {
      const parsedUpdateData = JSON.parse(data);
      console.log(
        "Parsed update data:",
        JSON.stringify(parsedUpdateData, null, 2)
      );

      // Cập nhật bookingDetail
      setBookingDetail((prev) => ({
        ...prev,
        ...parsedUpdateData,
        isUpdated: true,
      }));

      // Gửi yêu cầu cập nhật
      await axiosInstance.put(
        `/bookings/booking-details/${bookingDetailId}`,
        parsedUpdateData
      );

      showModal(t("modal.success"), t("bookingDetailUpdated"));

      // Lấy tên món ăn từ dishes
      if (parsedUpdateData.dishes && parsedUpdateData.dishes.length > 0) {
        const dishPromises = parsedUpdateData.dishes.map(async (dish) => {
          try {
            const dishResponse = await axiosInstance.get(
              `/dishes/${dish.dish.id}`
            );
            return {
              dishId: dish.dish.id,
              dishName: dishResponse.data.name || `Dish ${dish.dish.id}`,
            };
          } catch (error) {
            console.error(`Error fetching dish ${dish.dish.id}:`, error);
            return {
              dishId: dish.dish.id,
              dishName: `Dish ${dish.dish.id}`,
            };
          }
        });
        const dishResults = await Promise.all(dishPromises);
        const dishNamesMap = dishResults.reduce((acc, { dishId, dishName }) => {
          acc[dishId] = dishName;
          return acc;
        }, {});
        setDishNames(dishNamesMap);
      }

      // Lấy tên món ăn từ extraDishIds (nếu có)
      if (
        parsedUpdateData.extraDishIds &&
        parsedUpdateData.extraDishIds.length > 0
      ) {
        const extraDishPromises = parsedUpdateData.extraDishIds.map(
          async (dishId) => {
            try {
              const dishResponse = await axiosInstance.get(`/dishes/${dishId}`);
              return {
                dishId,
                dishName: dishResponse.data.name || `Dish ${dishId}`,
              };
            } catch (error) {
              console.error(`Error fetching extra dish ${dishId}:`, error);
              return {
                dishId,
                dishName: `Dish ${dishId}`,
              };
            }
          }
        );
        const extraDishResults = await Promise.all(extraDishPromises);
        const extraDishNamesMap = extraDishResults.reduce(
          (acc, { dishId, dishName }) => {
            acc[dishId] = dishName;
            return acc;
          },
          {}
        );
        setDishNames((prev) => ({ ...prev, ...extraDishNamesMap }));
        console.log(
          "Extra dish names map:",
          JSON.stringify(extraDishNamesMap, null, 2)
        );
      }
    } catch (error) {
      if (error.response?.status === 401) {
        return;
      }
      if (axios.isCancel(error)) {
        return;
      }
      showModal(t("modal.error"), t("failedToUpdateBookingDetail"), "Failed");
    } finally {
      setUpdating(false);
    }
  };

  useEffect(() => {
    if (bookingDetailId) {
      fetchBookingDetail();
    }
  }, []);

  useEffect(() => {
    if (updateData) {
      handleUpdate(updateData);
    }
  }, [updateData]);

  const navigateToUpdateScreen = () => {
    router.push({
      pathname: "/screen/updateBookingDetail",
      params: { bookingDetailId, chefId },
    });
  };

  if (loading) {
    return (
      <SafeAreaView style={commonStyles.containerContent}>
        <Header title={t("sessionDetail")} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#A64B2A" />
          <Text style={styles.loadingText}>{t("loading")}</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!bookingDetail) {
    return (
      <SafeAreaView style={commonStyles.containerContent}>
        <Header title={t("sessionDetail")} />
        <View style={styles.noDataContainer}>
          <MaterialIcons name="error-outline" size={40} color="#A64B2A" />
          <Text style={styles.noDataText}>{t("noBookingDetailAvailable")}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[commonStyles.container, { backgroundColor: "#EBE5DD" }]}
    >
      <Header title={t("sessionDetail")} />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Booking Info */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>{t("bookingInfo")}</Text>
          <View style={styles.detailRow}>
            <MaterialIcons name="calendar-today" size={18} color="#A64B2A" />
            <Text style={styles.detailLabel}>{t("sessionDate")}: </Text>
            <Text style={styles.detailValue}>{bookingDetail.sessionDate}</Text>
          </View>
          <View style={styles.detailRow}>
            <MaterialIcons name="access-time" size={18} color="#A64B2A" />
            <Text style={styles.detailLabel}>{t("startTime")}: </Text>
            <Text style={styles.detailValue}>{bookingDetail.startTime}</Text>
          </View>
          <View style={styles.detailRow}>
            <MaterialIcons name="location-on" size={18} color="#A64B2A" />
            <Text style={styles.detailLabel}>{t("location")}: </Text>
            <Text style={styles.detailValue}>{bookingDetail.location}</Text>
          </View>
          <View style={styles.detailRow}>
            <MaterialIcons name="info" size={18} color="#A64B2A" />
            <Text style={styles.detailLabel}>{t("status")}: </Text>
            <Text
              style={[
                styles.detailValue,
                {
                  color:
                    bookingDetail.status === "COMPLETED"
                      ? "#2ECC71"
                      : "#E74C3C",
                },
              ]}
            >
              {bookingDetail.status}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <MaterialIcons name="attach-money" size={18} color="#A64B2A" />
            <Text style={styles.detailLabel}>{t("totalPrice")}: </Text>
            <Text style={styles.detailValue}>${bookingDetail.totalPrice}</Text>
          </View>
        </View>

        {/* Fee Details */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>{t("feeDetails")}</Text>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>{t("chefCookingFee")}: </Text>
            <Text style={styles.detailValue}>
              ${bookingDetail.chefCookingFee}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>{t("priceOfDishes")}: </Text>
            <Text style={styles.detailValue}>
              ${bookingDetail.priceOfDishes}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>{t("arrivalFee")}: </Text>
            <Text style={styles.detailValue}>${bookingDetail.arrivalFee}</Text>
          </View>
          {bookingDetail.chefServingFee && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>{t("chefServingFee")}: </Text>
              <Text style={styles.detailValue}>
                ${bookingDetail.chefServingFee}
              </Text>
            </View>
          )}
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>{t("platformFee")}: </Text>
            <Text style={styles.detailValue}>${bookingDetail.platformFee}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>{t("totalChefFee")}: </Text>
            <Text style={styles.detailValue}>
              ${bookingDetail.totalChefFeePrice}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>{t("discountAmount")}: </Text>
            <Text style={styles.detailValue}>
              ${bookingDetail.discountAmout}
            </Text>
          </View>
        </View>

        {/* Schedule */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>{t("schedule")}</Text>
          <View style={styles.detailRow}>
            <MaterialIcons name="kitchen" size={18} color="#A64B2A" />
            <Text style={styles.detailLabel}>{t("timeBeginCook")}: </Text>
            <Text style={styles.detailValue}>
              {bookingDetail.timeBeginCook}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <MaterialIcons name="directions-car" size={18} color="#A64B2A" />
            <Text style={styles.detailLabel}>{t("timeBeginTravel")}: </Text>
            <Text style={styles.detailValue}>
              {bookingDetail.timeBeginTravel}
            </Text>
          </View>
        </View>

        {/* Menu */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>{t("menu")}</Text>
          <View style={styles.detailRow}>
            <MaterialIcons name="restaurant-menu" size={18} color="#A64B2A" />
            <Text style={styles.detailLabel}>{t("menuId")}: </Text>
            <Text
              style={[
                styles.detailValue,
                !bookingDetail.menuId && { color: "#A64B2A" },
              ]}
            >
              {bookingDetail.menuId || t("notSelected")}
            </Text>
          </View>
        </View>

        {/* Dishes */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>{t("dishes")}</Text>
          {!bookingDetail.dishes || bookingDetail.dishes.length === 0 ? (
            <View style={styles.noDataContainer}>
              <MaterialIcons name="restaurant" size={24} color="#A64B2A" />
              <Text style={[styles.detailValue, { color: "#A64B2A" }]}>
                {t("noFoodYet")}
              </Text>
            </View>
          ) : (
            bookingDetail.dishes.map((dish, index) => (
              <View key={index} style={styles.dishItem}>
                <View style={styles.dishRow}>
                  <MaterialIcons
                    name="fiber-manual-record"
                    size={10}
                    color="#A64B2A"
                  />
                  <Text style={styles.detailLabel}>{t("dishName")}: </Text>
                  <Text style={styles.detailValue}>
                    {dishNames[dish.dish.id] || t("loading")}
                  </Text>
                </View>
                {dish.notes && (
                  <View style={[styles.dishRow, { marginLeft: 20 }]}>
                    <MaterialIcons name="note" size={16} color="#666" />
                    <Text style={styles.detailLabel}>{t("note")}: </Text>
                    <Text style={styles.detailValue}>{dish.dish.notes}</Text>
                  </View>
                )}
              </View>
            ))
          )}
          {bookingDetail.extraDishIds &&
            bookingDetail.extraDishIds.length > 0 && (
              <View style={styles.card}>
                <Text style={styles.sectionTitle}>{t("extraDishes")}</Text>
                {bookingDetail.extraDishIds.map((dishId, index) => (
                  <View key={index} style={styles.dishItem}>
                    <View style={styles.dishRow}>
                      <MaterialIcons
                        name="fiber-manual-record"
                        size={10}
                        color="#A64B2A"
                      />
                      <Text style={styles.detailLabel}>{t("dishName")}: </Text>
                      <Text style={styles.detailValue}>
                        {dishNames[dishId] || t("loading")}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            )}
        </View>

        {/* Ingredients */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>{t("ingredients")}</Text>
          <View style={styles.detailRow}>
            <MaterialIcons name="shopping-basket" size={18} color="#A64B2A" />
            <Text style={styles.detailLabel}>{t("ingredients")}: </Text>
            <Text style={styles.detailValue}>
              {bookingDetail.chefBringIngredients
                ? t("chefBringIngredients")
                : t("customerBringIngredients")}
            </Text>
          </View>
        </View>
      </ScrollView>

      {!bookingDetail.isUpdated && (
        <TouchableOpacity
          style={[styles.updateButton, updating && styles.disabledButton]}
          onPress={navigateToUpdateScreen}
          disabled={updating}
        >
          {updating ? (
            <ActivityIndicator size="small" color="#FFF" />
          ) : (
            <Text style={styles.updateButtonText}>{t("update")}</Text>
          )}
        </TouchableOpacity>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  scrollContent: {
    padding: 16,
    paddingBottom: 100,
  },
  sectionTitle: {
    fontSize: 20,
    fontFamily: "nunito-bold",
    color: "#333",
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 14,
    fontFamily: "nunito-bold",
    color: "#333",
    marginLeft: 8,
    width: 150,
  },
  detailValue: {
    fontSize: 14,
    color: "#666",
    flex: 1,
    fontFamily: "nunito-regular",
  },
  dishItem: {
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: "#E5E5E5",
    marginTop: 8,
  },
  dishRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  noDataContainer: {
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
  },
  noDataText: {
    fontSize: 16,
    color: "#A64B2A",
    textAlign: "center",
    marginTop: 8,
    fontFamily: "nunito-regular",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    fontSize: 16,
    color: "#A64B2A",
    marginTop: 8,
    fontFamily: "nunito-regular",
  },
  updateButton: {
    backgroundColor: "#A64B2A",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    margin: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  disabledButton: {
    backgroundColor: "#B0B0B0",
  },
  updateButtonText: {
    color: "#FFFFFF",
    fontFamily: "nunito-bold",
    fontSize: 16,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
});

export default BookingDetailScreen;
