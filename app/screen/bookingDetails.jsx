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
import { useLocalSearchParams, router, useNavigation } from "expo-router";
import Toast from "react-native-toast-message";
import Header from "../../components/header";
import { commonStyles } from "../../style";
import useAxios from "../../config/AXIOS_API";

const BookingDetailScreen = () => {
  const { bookingDetailId, updateData, chefId } = useLocalSearchParams(); // Lấy updateData trực tiếp từ params
  const [bookingDetail, setBookingDetail] = useState(null);
  const [dishNames, setDishNames] = useState({});
  const [loading, setLoading] = useState(false);
  const [updating, setUpdating] = useState(false);
  const navigation = useNavigation();
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
            console.log(dish.dish.id)
            const dishResponse = await axiosInstance.get(`/dishes/${dish.dish.id}`);
            return { dishId: dish.dish.id, dishName: dishResponse.data.name };
          } catch (error) {
            console.error(`Error fetching dish ${dish.id}:`, error);
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
      console.error(" detail 1:", error);
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Failed to load booking detail",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (data) => {
    setUpdating(true);
    try {
      const parsedUpdateData = JSON.parse(data);
      console.log("Parsed update data:", JSON.stringify(parsedUpdateData, null, 2));

      setBookingDetail((prev) => ({
        ...prev,
        ...parsedUpdateData,
        isUpdated: true,
      }));

      await axiosInstance.put(`/bookings/booking-details/${bookingDetailId}`, parsedUpdateData);

      Toast.show({
        type: "success",
        text1: "Success",
        text2: "Booking detail updated successfully",
      });

      if (parsedUpdateData.dishes && parsedUpdateData.dishes.length > 0) {
        const dishPromises = parsedUpdateData.dishes.map(async (dish) => {
          try {
            const dishResponse = await axiosInstance.get(`/dishes/${dish.dish.dish.id}`);
            return { dishId: dish.dishId, dishName: dishResponse.data.name };
          } catch (error) {
            console.error(`Error fetching dish ${dish.dishId}:`, error);
            return { dishId: dish.dishId, dishName: `Dish ${dish.dishId}` };
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
      console.error("Error updating booking detail:", error);
      Toast.show({
        type: "error",
        text1: "Error",
        text2:
          error.response?.data?.message || "Failed to update booking detail",
      });
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
    console.log("useEffect for updateData triggered, updateData:", updateData);
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
        <Header title={t("bookingDetail")} />
        <ActivityIndicator
          size="large"
          color="#A64B2A"
          style={{ marginTop: 20 }}
        />
      </SafeAreaView>
    );
  }

  if (!bookingDetail) {
    return (
      <SafeAreaView style={commonStyles.containerContent}>
        <Header title={t("bookingDetail")} />
        <Text style={styles.noDataText}>No booking detail available</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={commonStyles.container}>
      <Header title={t("bookingDetail")} />
      <ScrollView style={commonStyles.containerContent}>
        <View style={styles.detailCard}>
          <Text style={styles.sectionTitle}>{t("bookingInfo")}</Text>
          <Text style={styles.detailText}>
          {t("sessionDate")}: {bookingDetail.sessionDate}
          </Text>
          <Text style={styles.detailText}>
          {t("startTime")}: {bookingDetail.startTime}
          </Text>
          {/* {bookingDetail.endTime && (
            <Text style={styles.detailText}>
              End Time: {bookingDetail.endTime}
            </Text>
          )} */}
          <Text style={styles.detailText}>
          {t("location")}: {bookingDetail.location}
          </Text>
          <Text style={styles.detailText}>{t("status")}: {bookingDetail.status}</Text>
          <Text style={styles.detailText}>
          {t("totalPrice")}: ${bookingDetail.totalPrice}
          </Text>

          <Text style={styles.sectionTitle}>{t("feeDetails")}</Text>
          <Text style={styles.detailText}>
          {t("chefCookingFee")}: ${bookingDetail.chefCookingFee}
          </Text>
          <Text style={styles.detailText}>
          {t("priceOfDishes")}: ${bookingDetail.priceOfDishes}
          </Text>
          <Text style={styles.detailText}>
          {t("arrivalFee")}: ${bookingDetail.arrivalFee}
          </Text>
          {bookingDetail.chefServingFee && (
            <Text style={styles.detailText}>
              {t("chefServingFee")}: ${bookingDetail.chefServingFee}
            </Text>
          )}
          <Text style={styles.detailText}>
          {t("platformFee")}: ${bookingDetail.platformFee}
          </Text>
          <Text style={styles.detailText}>
          {t("totalChefFee")}: ${bookingDetail.totalChefFeePrice}
          </Text>
          <Text style={styles.detailText}>
          {t("discountAmount")}: ${bookingDetail.discountAmout}
          </Text>

          <Text style={styles.sectionTitle}>{t("schedule")}</Text>
          <Text style={styles.detailText}>
          {t("timeBeginCook")}: {bookingDetail.timeBeginCook}
          </Text>
          <Text style={styles.detailText}>
          {t("timeBeginTravel")}: {bookingDetail.timeBeginTravel}
          </Text>

          <Text style={styles.sectionTitle}>{t("menu")}</Text>
          <Text style={styles.detailText}>
          {t("menuId")}: {bookingDetail.menuId || "Not selected"}
          </Text>

          <Text style={styles.sectionTitle}>{t("dishes")}</Text>
          {!bookingDetail.dishes || bookingDetail.dishes.length === 0 ? (
            <Text style={styles.detailText}>{t("noFoodYet")}</Text>
          ) : (
            bookingDetail.dishes.map((dish, index) => (
              <View key={index} style={styles.dishItem}>
                <Text style={styles.detailText}>
                {t("dishName")}: {dishNames[dish.dish.id] || "Loading..."}
                </Text>
                {dish.notes && (
                  <Text style={styles.detailText}>{t("note")}: {dish.notes}</Text>
                )}
              </View>
            ))
          )}
        </View>
      </ScrollView>

      {!bookingDetail.isUpdated && (
        <TouchableOpacity
          style={styles.updateButton}
          onPress={navigateToUpdateScreen}
          disabled={updating}
        >
          {updating ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <Text style={styles.updateButtonText}>{t("update")}</Text>
          )}
        </TouchableOpacity>
      )}

      <Toast />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  detailCard: {
    // backgroundColor: "#FFF",
    borderRadius: 10,
    marginHorizontal:10
    // padding: 15,
    // marginBottom: 15,
    // elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginTop: 10,
    marginBottom: 10,
  },
  detailText: {
    fontSize: 14,
    color: "#666",
    marginBottom: 5,
  },
  dishItem: {
    borderTopWidth: 1,
    borderTopColor: "#DDD",
    paddingTop: 10,
    marginTop: 5,
  },
  noDataText: {
    fontSize: 16,
    color: "#9C583F",
    textAlign: "center",
    marginTop: 20,
  },
  updateButton: {
    backgroundColor: "#A64B2A",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
    marginVertical: 20,
    marginHorizontal: 20,
  },
  updateButtonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
  },
});

export default BookingDetailScreen;