import React, { useState, useEffect } from "react";
import {
  SafeAreaView,
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Image,
  Modal,
} from "react-native";
import { useLocalSearchParams, router, useNavigation } from "expo-router";
import Toast from "react-native-toast-message";
import Header from "../../components/header";
import { commonStyles } from "../../style";
import useAxios from "../../config/AXIOS_API";
import { useTranslation } from "react-i18next";
import { MaterialIcons } from "@expo/vector-icons";

const BookingDetailScreen = () => {
  const { t } = useTranslation();
  const { bookingDetailId, updateData, chefId } = useLocalSearchParams();
  const [bookingDetail, setBookingDetail] = useState(null);
  const [dishNames, setDishNames] = useState({});
  const [loading, setLoading] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const navigation = useNavigation();
  const axiosInstance = useAxios();

  const fetchBookingDetail = async () => {
    setLoading(true);
    try {
      const response = await axiosInstance.get(
        `/bookings/booking-details/${bookingDetailId}`
      );
      console.log(
        "Booking detail 111:",
        JSON.stringify(response.data, null, 2)
      );
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
            console.error(`Error fetching dish ${dish.dish.id}:`, error);
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
      console.error("Error fetching detail:", error);
      Toast.show({
        type: "error",
        text1: t("error"),
        text2: t("failedToLoadBookingDetail"),
      });
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

      setBookingDetail((prev) => ({
        ...prev,
        ...parsedUpdateData,
        isUpdated: true,
      }));

      await axiosInstance.put(
        `/bookings/booking-details/${bookingDetailId}`,
        parsedUpdateData
      );

      Toast.show({
        type: "success",
        text1: t("success"),
        text2: t("bookingDetailUpdated"),
      });

      if (parsedUpdateData.dishes && parsedUpdateData.dishes.length > 0) {
        const dishPromises = parsedUpdateData.dishes.map(async (dish) => {
          try {
            const dishResponse = await axiosInstance.get(
              `/dishes/${dish.dish.dishId || dish.dish.id}`
            );
            return {
              dishId: dish.dishId || dish.dish.id,
              dishName: dishResponse.data.name,
            };
          } catch (error) {
            console.error(
              `Error fetching dish ${dish.dishId || dish.dish.id}:`,
              error
            );
            return {
              dishId: dish.dishId || dish.dish.id,
              dishName: `Dish ${dish.dishId || dish.dish.id}`,
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
    } catch (error) {
      console.error("Error updating booking detail:", error);
      Toast.show({
        type: "error",
        text1: t("error"),
        text2:
          error.response?.data?.message || t("failedToUpdateBookingDetail"),
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

  const openImageModal = (imageUrl) => {
    setSelectedImage(imageUrl);
    setModalVisible(true);
  };

  const closeImageModal = () => {
    setModalVisible(false);
    setSelectedImage(null);
  };

  if (loading) {
    return (
      <SafeAreaView style={commonStyles.containerContent}>
        <Header title={t("bookingDetail")} />
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
        <Header title={t("bookingDetail")} />
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
        {/* Log images for debugging */}
        {console.log("Booking Detail Images:", bookingDetail?.images)}

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

        {/* Images Section */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>{t("images")}</Text>
          {!bookingDetail?.images || bookingDetail?.images.length === 0 ? (
            <View style={styles.noDataContainer}>
              <MaterialIcons
                name="image-not-supported"
                size={24}
                color="#A64B2A"
              />
              <Text style={[styles.detailValue, { color: "#A64B2A" }]}>
                {t("noImagesAvailable")}
              </Text>
            </View>
          ) : (
            <View style={styles.imageContainer}>
              {bookingDetail?.images.map((image, index) => (
                <TouchableOpacity
                  key={index}
                  onPress={() => openImageModal(image?.imageUrl)}
                  style={styles.imageWrapper}
                >
                  <Image
                    source={{
                      uri: image?.imageUrl,
                    }}
                    style={styles.image}
                    resizeMode="cover"
                    onError={() =>
                      console.log(`Failed to load image: ${image?.imageUrl}`)
                    }
                  />
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Image Zoom Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={closeImageModal}
      >
        <View style={styles.modalContainer}>
          <TouchableOpacity
            style={styles.modalBackground}
            onPress={closeImageModal}
          >
            <Image
              source={{
                uri: selectedImage,
              }}
              style={styles.zoomedImage}
              resizeMode="contain"
              onError={() =>
                console.log(`Failed to load zoomed image: ${selectedImage}`)
              }
            />
            <TouchableOpacity
              style={styles.closeButton}
              onPress={closeImageModal}
            >
              <MaterialIcons name="close" size={24} color="#FFF" />
            </TouchableOpacity>
          </TouchableOpacity>
        </View>
      </Modal>

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

      <Toast />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  scrollContent: {
    padding: 16,
    paddingBottom: 100,
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
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
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
    fontWeight: "600",
    color: "#333",
    marginLeft: 8,
    width: 150,
  },
  detailValue: {
    fontSize: 14,
    color: "#666",
    flex: 1,
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
    fontWeight: "700",
    fontSize: 16,
  },
  imageContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  imageWrapper: {
    width: "48%",
    marginBottom: 10,
  },
  image: {
    width: "100%",
    height: 150,
    borderRadius: 8,
    backgroundColor: "#f0f0f0", // Debug background
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.8)",
  },
  modalBackground: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
  },
  zoomedImage: {
    width: "90%",
    height: "70%",
    borderRadius: 8,
  },
  closeButton: {
    position: "absolute",
    top: 40,
    right: 20,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    borderRadius: 20,
    padding: 8,
  },
});

export default BookingDetailScreen;