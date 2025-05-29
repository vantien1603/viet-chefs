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
  Image,
} from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import Header from "../../components/header";
import { commonStyles } from "../../style";
import useAxios from "../../config/AXIOS_API";
import axios from "axios";
import { t } from "i18next";
import { useCommonNoification } from "../../context/commonNoti";
import { useSelectedItems } from "../../context/itemContext";

const ConfirmBookingDetail = () => {
  const { bookingDetailId, updateData } = useLocalSearchParams();
  const axiosInstance = useAxios();
  const { showModal } = useCommonNoification();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [bookingDetails, setBookingDetails] = useState(null);
  const [dishDetails, setDishDetails] = useState({});
  const { ingredientPrep } = useSelectedItems();

  // Parse updateData and fetch dish details
  useEffect(() => {
    console.log("Received updateData:", updateData);
    try {
      const parsedData = JSON.parse(updateData);
      console.log(
        "Parsed bookingDetails:",
        JSON.stringify(parsedData, null, 2)
      );
      setBookingDetails(parsedData);

      if (parsedData.dishes && Array.isArray(parsedData.dishes)) {
        const fetchDishDetails = async () => {
          try {
            const dishPromises = parsedData.dishes.map(async (dish) => {
              const dishId = dish.dishId;
              try {
                const response = await axiosInstance.get(`/dishes/${dishId}`);
                return {
                  dishId,
                  name: response.data.name,
                  imageUrl: response.data.imageUrl,
                };
              } catch (error) {
                console.error(`Error fetching dish ${dishId}:`, error);
                return { dishId, name: `Dish ${dishId}`, imageUrl: null };
              }
            });
            const results = await Promise.all(dishPromises);
            const dishMap = results.reduce(
              (acc, { dishId, name, imageUrl }) => {
                acc[dishId] = { name, imageUrl };
                return acc;
              },
              {}
            );
            setDishDetails(dishMap);
          } catch (error) {
            console.error("Error fetching dish details:", error);
            showModal(t("modal.error"), t("errors.fetchDishFailed"), "Failed");
          } finally {
            setLoading(false);
          }
        };
        fetchDishDetails();
      } else {
        console.warn("No dishes found in bookingDetails");
        setLoading(false);
      }
    } catch (error) {
      console.error("Error parsing updateData:", error);
      showModal(t("modal.error"), t("errors.invalidDataFormat"), "Failed");
      setLoading(false);
    }
  }, [updateData]);

  // Handle confirm action
  const handleConfirm = async () => {
    setSubmitting(true);
    try {
      const payload = {
        dishes: bookingDetails.dishes,
        totalPrice: bookingDetails.totalPrice,
        chefCookingFee: bookingDetails.chefCookingFee,
        priceOfDishes: bookingDetails.priceOfDishes,
        arrivalFee: bookingDetails.arrivalFee,
        platformFee: bookingDetails.platformFee,
        totalChefFeePrice: bookingDetails.totalChefFeePrice,
        discountAmount: bookingDetails.discountAmout, // Fixed typo
        timeBeginCook: bookingDetails.timeBeginCook,
        timeBeginTravel: bookingDetails.timeBeginTravel,
        menuId: bookingDetails.menuId || null,
        chefBringIngredients: ingredientPrep === "chef",
      };

      console.log("Confirm PUT payload:", JSON.stringify(payload, null, 2));

      await axiosInstance.put(
        `/bookings/booking-details/${bookingDetailId}`,
        payload
      );

      showModal(t("modal.success"), t("bookingUpdated"), "Success");
      router.replace("/screen/history");
    } catch (error) {
      console.error("Update error:", error.response?.data || error);
      if (error.response?.status === 401) {
        return;
      }
      if (axios.isCancel(error)) {
        return;
      }
      showModal(
        t("modal.error"),
        error.response?.data?.message || t("errors.updateFailed"),
        "Failed"
      );
    } finally {
      setSubmitting(false);
    }
  };

  // Handle back action
  const handleBack = () => {
    router.push({
      pathname: "/screen/updateBookingDetail",
      params: { bookingDetailId, chefId: bookingDetails?.chefId || "" },
    });
  };

  // Render dish item
  const renderDishItem = ({ item }) => {
    const dishId = item.dishId;
    const dishInfo = dishDetails[dishId];
    return (
      <View style={styles.dishItem}>
        <View style={styles.dishContainer}>
          <Image
            source={{ uri: dishInfo?.imageUrl }}
            style={styles.dishImage}
            resizeMode="cover"
            accessible={true}
            accessibilityLabel={dishInfo.name}
            onError={(error) =>
              console.error(`Failed to load image for dish ${dishId}:`, error)
            }
          />

          <View style={styles.dishDetails}>
            <Text style={styles.dishText}>{dishInfo.name}</Text>
            {item.notes && (
              <Text style={styles.notesText}>
                {t("notes")}: {item.notes}
              </Text>
            )}
          </View>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={commonStyles.containerContent}>
        <Header title={t("confirmBooking")} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#A64B2A" />
          <Text style={styles.loadingText}>{t("loading")}</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!bookingDetails) {
    return (
      <SafeAreaView style={commonStyles.containerContent}>
        <Header title={t("confirmBooking")} />
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{t("noDataAvailable")}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={commonStyles.containerContent}>
      <Header title={t("confirmBooking")} />
      <ScrollView
        style={commonStyles.containerContent}
        contentContainerStyle={{ paddingBottom: 50 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Selected Dishes */}
        <Text style={styles.sectionTitle}>{t("dishes")}</Text>
        {bookingDetails?.dishes && bookingDetails.dishes.length > 0 ? (
          <View>
            {bookingDetails.dishes.map((item, index) => (
              <View key={item.dish?.id?.toString() || `dish-${index}`}>
                {renderDishItem({ item })}
              </View>
            ))}
          </View>
        ) : (
          <Text style={styles.noDataText}>{t("noDishesSelected")}</Text>
        )}

        <Text style={styles.sectionTitle}>{t("feeDetails")}</Text>
        <View style={styles.infoContainer}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>{t("totalPrice")}</Text>
            <Text style={styles.infoValue}>
              ${bookingDetails.totalPrice?.toFixed(2) || "0.00"}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>{t("chefCookingFee")}</Text>
            <Text style={styles.infoValue}>
              ${bookingDetails.chefCookingFee?.toFixed(2) || "0.00"}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>{t("priceOfDishes")}</Text>
            <Text style={styles.infoValue}>
              ${bookingDetails.priceOfDishes?.toFixed(2) || "0.00"}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>{t("arrivalFee")}</Text>
            <Text style={styles.infoValue}>
              ${bookingDetails.arrivalFee?.toFixed(2) || "0.00"}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>{t("platformFee")}</Text>
            <Text style={styles.infoValue}>
              ${bookingDetails.platformFee?.toFixed(2) || "0.00"}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>{t("totalChefFee")}</Text>
            <Text style={styles.infoValue}>
              ${bookingDetails.totalChefFeePrice?.toFixed(2) || "0.00"}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>{t("discountAmount")}</Text>
            <Text style={styles.infoValue}>
              ${bookingDetails.discountAmout?.toFixed(2) || "0.00"}
            </Text>
          </View>
        </View>

        {/* Timing Information */}
        <Text style={styles.sectionTitle}>{t("schedule")}</Text>
        <View style={styles.infoContainer}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>{t("timeBeginTravel")}</Text>
            <Text style={styles.infoValue}>
              {bookingDetails.timeBeginTravel || "N/A"}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>{t("timeBeginCook")}</Text>
            <Text style={styles.infoValue}>
              {bookingDetails.timeBeginCook || "N/A"}
            </Text>
          </View>
        </View>

        {/* Menu Status */}
        <Text style={styles.sectionTitle}>{t("menu")}</Text>
        <View style={styles.infoContainer}>
          <Text style={styles.infoText}>
            {bookingDetails.menuId
              ? `${t("menuSelected")}: Menu ${bookingDetails.menuId}`
              : t("noMenuSelected")}
          </Text>
        </View>

        <View style={{ flexDirection: "row" }}>
          <Text style={{ fontSize: 18, flex: 1, fontFamily: "nunito-bold" }}>
            {t("ingredients")}
          </Text>
          <Text
            style={{
              textAlign: "right",
              fontSize: 14,
              fontFamily: "nunito-regular",
            }}
          >
            {ingredientPrep === "customer"
              ? t("customerBringIngredients")
              : t("chefWillPrepareIngredients")}
          </Text>
        </View>
      </ScrollView>

      {/* Action Buttons */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.actionButton, styles.confirmButton]}
          onPress={handleConfirm}
          disabled={submitting}
          accessible={true}
          accessibilityLabel={t("confirm")}
        >
          {submitting ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <Text style={styles.actionButtonText}>{t("confirm")}</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: "nunito-bold",
    color: "#333",
    marginTop: 10,
    marginBottom: 10,
  },
  dishItem: {
    marginBottom: 15,
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    padding: 10,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  dishContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  dishImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 10,
  },
  placeholderImage: {
    backgroundColor: "#F0F0F0",
    justifyContent: "center",
    alignItems: "center",
  },
  placeholderText: {
    fontSize: 12,
    color: "#666",
    fontFamily: "nunito-regular",
  },
  dishDetails: {
    flex: 1,
  },
  dishText: {
    fontSize: 16,
    color: "#333",
    fontFamily: "nunito-bold",
  },
  notesText: {
    fontSize: 14,
    color: "#666",
    fontFamily: "nunito-regular",
    marginTop: 5,
  },
  infoContainer: {
    backgroundColor: "#F9F9F9",
    borderRadius: 8,
    padding: 15,
    marginBottom: 15,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  infoLabel: {
    fontSize: 14,
    color: "#333",
    fontFamily: "nunito-regular",
  },
  infoValue: {
    fontSize: 14,
    color: "#A64B2A",
    fontFamily: "nunito-bold",
  },
  infoText: {
    fontSize: 14,
    color: "#333",
    fontFamily: "nunito-regular",
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  actionButton: {
    flex: 1,
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
    marginHorizontal: 5,
  },
  backButton: {
    backgroundColor: "#666",
  },
  confirmButton: {
    backgroundColor: "#A64B2A",
  },
  actionButtonText: {
    color: "white",
    fontFamily: "nunito-bold",
    fontSize: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    fontSize: 16,
    color: "#333",
    fontFamily: "nunito-regular",
    marginTop: 10,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: "#9C583F",
    fontFamily: "nunito-regular",
    marginBottom: 20,
    textAlign: "center",
  },
  noDataText: {
    fontSize: 14,
    color: "#9C583F",
    textAlign: "center",
    marginVertical: 10,
    fontFamily: "nunito-regular",
  },
});

export default ConfirmBookingDetail;
