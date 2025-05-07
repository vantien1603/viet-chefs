import React, { useContext, useRef, useState, useEffect } from "react";
import {
  SafeAreaView,
  ScrollView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import Header from "../../components/header";
import { useLocalSearchParams, useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import useAxios from "../../config/AXIOS_API";
import { AuthContext } from "../../config/AuthContext";
import Toast from "react-native-toast-message";
import { Ionicons } from "@expo/vector-icons";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { Modalize } from "react-native-modalize";
import { t } from "i18next";

const ReviewBookingScreen = () => {
  const params = useLocalSearchParams();
  const router = useRouter();
  const bookingData = JSON.parse(params.bookingData || "{}");
  const chefId = parseInt(params.chefId);
  const selectedPackage = JSON.parse(params.selectedPackage);
  const guestCount = parseInt(params.numPeople);
  const selectedDates = JSON.parse(params.selectedDates || "{}");
  const dishes = params.dishes ? JSON.parse(params.dishes) : []; // Dishes array from params
  const axiosInstance = useAxios();
  const { user } = useContext(AuthContext);
  const [isPlatformFeeModalVisible, setIsPlatformFeeModalVisible] =
    useState(false);
  const platformFeeModalRef = useRef(null);
  const [menus, setMenus] = useState({}); // State to store menu details

  // Fetch menu details
  useEffect(() => {
    const fetchMenus = async () => {
      try {
        const menuIds = Object.values(selectedDates)
          .filter((date) => date.menuId)
          .map((date) => date.menuId);
        const uniqueMenuIds = [...new Set(menuIds)];

        const menuPromises = uniqueMenuIds.map(async (menuId) => {
          const response = await axiosInstance.get(`/menus/${menuId}`);
          return { id: menuId, data: response.data };
        });

        const menuResults = await Promise.all(menuPromises);
        const menuMap = menuResults.reduce((acc, { id, data }) => {
          acc[id] = data;
          return acc;
        }, {});

        setMenus(menuMap);
      } catch (error) {
        console.error("Error fetching menus:", error);
        Toast.show({
          type: "error",
          text1: t("error"),
          text2: t("unableToFetchMenus"),
        });
      }
    };

    if (Object.values(selectedDates).some((date) => date.menuId)) {
      fetchMenus();
    }
  }, [selectedDates, axiosInstance]);

  const openPlatformFeeModal = () => {
    setIsPlatformFeeModalVisible(true);
    platformFeeModalRef.current?.open();
  };

  const closePlatformFeeModal = () => {
    setIsPlatformFeeModalVisible(false);
    platformFeeModalRef.current?.close();
  };

  const handleConfirmBooking = async () => {
    try {
      if (!user) {
        throw new Error(t("noUserInfoFound"));
      }
      const payload = {
        customerId: parseInt(user?.userId),
        chefId: chefId,
        requestDetails: bookingData.requestDetails || "",
        guestCount: guestCount || 0,
        packageId: selectedPackage.id,
        bookingDetails: bookingData.bookingDetails?.map((detail, index) => {
          const dateKey = detail.sessionDate;
          return {
            sessionDate: detail.sessionDate,
            startTime: detail.startTime,
            location: detail.location,
            totalPrice: detail.totalPrice || 0,
            chefCookingFee: detail.chefCookingFee || 0,
            priceOfDishes: detail.priceOfDishes || 0,
            arrivalFee: detail.arrivalFee || 0,
            timeBeginCook: detail.timeBeginCook || null,
            timeBeginTravel: detail.timeBeginTravel || null,
            platformFee: detail.platformFee || 0,
            totalChefFeePrice: detail.totalChefFeePrice || 0,
            totalCookTime: (detail.totalCookTime || 0) / 60,
            discountAmout: detail.discountAmout || 0,
            isUpdated: detail.isUpdated || false,
            menuId: selectedDates[dateKey]?.menuId || null,
            dishes: detail.dishes?.map((dish) => ({
              dishId: dish.dishId,
              notes: dish.notes || "",
            })),
            chefBringIngredients:
              selectedDates[dateKey]?.chefBringIngredients ?? false,
          };
        }),
      };

      const response = await axiosInstance.post("/bookings/long-term", payload);
      Toast.show({
        type: "success",
        text1: t("success"),
        text2: t("longTermBookingConfirmed"),
      });
      router.push({
        pathname: "/screen/paymentLongterm",
        params: {
          bookingId: response.data.id,
          bookingData: JSON.stringify(bookingData),
        },
      });
    } catch (error) {
      const errorMessage =
        error?.response?.data?.message || t("failedToConfirmBooking");
      console.error("Error confirming booking:", errorMessage);
    }
  };

  const handleBackPress = () => {
    router.push({
      pathname: "/screen/longTermSelect",
      params: {
        bookingData: JSON.stringify(bookingData),
        chefId: chefId.toString(),
        selectedPackage: JSON.stringify(selectedPackage),
        numPeople: guestCount.toString(),
        selectedDates: JSON.stringify(selectedDates),
        dishes: JSON.stringify(dishes), 
      },
    });
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaView style={styles.safeArea}>
        <Header title={t("confirmBooking")} onLeftPress={handleBackPress} />
        <ScrollView style={styles.container}>
          <Text style={styles.title}>{t("longTermBookingDetails")}</Text>

          <View style={styles.infoContainer}>
            <Text style={styles.infoLabel}>{t("location")}:</Text>
            <Text style={styles.infoValue}>
              {bookingData.bookingDetails?.[0]?.location || "N/A"}
            </Text>
          </View>

          {bookingData.bookingDetails?.map((detail, index) => {
            const dateKey = detail.sessionDate;
            const menuId = selectedDates[dateKey]?.menuId;
            const menu = menus[menuId];
            const menuDishes = menu?.menuItems || [];
            const extraDishes =
              detail.dishes?.filter(
                (dish) =>
                  !menuDishes.some(
                    (menuDish) => menuDish.dishId === dish.dishId
                  )
              ) || [];
            const hasMenu = menuId && menu;
            const hasExtraDishes = extraDishes.length > 0;

            return (
              <View key={index} style={styles.dateContainer}>
                <Text style={styles.dateTitle}>{detail.sessionDate}</Text>
                <View style={styles.detailCard}>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>{t("time")}:</Text>
                    <Text style={styles.detailValue}>
                      {detail.startTime.slice(0, 5)}
                    </Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>{t("travelFee")}:</Text>
                    <Text style={styles.detailValue}>
                      ${(detail.arrivalFee || 0).toFixed(2)}
                    </Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>{t("cookingFee")}:</Text>
                    <Text style={styles.detailValue}>
                      ${(detail.chefCookingFee || 0).toFixed(2)}
                    </Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>{t("dishFee")}:</Text>
                    <Text style={styles.detailValue}>
                      ${(detail.priceOfDishes || 0).toFixed(2)}
                    </Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>{t("discount")}:</Text>
                    <Text style={styles.detailValue}>
                      -${(detail.discountAmout || 0).toFixed(2)}
                    </Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>
                      {t("totalCookTime")}:
                    </Text>
                    <Text style={styles.detailValue}>
                      {detail.totalCookTime} {t("minutes")}
                    </Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>{t("ingredients")}:</Text>
                    <Text style={styles.detailValue}>
                      {selectedDates[detail.sessionDate]?.chefBringIngredients
                        ? t("chefBringIngredients")
                        : t("customerBringIngredients")}
                    </Text>
                  </View>
                  <View style={styles.detailRow}>
                    <View style={styles.labelWithIcon}>
                      <Text style={styles.detailLabel}>
                        {t("platformFee")}:
                      </Text>
                      <TouchableOpacity onPress={openPlatformFeeModal}>
                        <Ionicons
                          name="information-circle-outline"
                          size={16}
                          color="#666"
                          style={styles.labelIcon}
                        />
                      </TouchableOpacity>
                    </View>
                    <View style={styles.valueWithIcon}>
                      <Text style={styles.detailValue}>
                        ${(detail.platformFee || 0).toFixed(2)}
                      </Text>
                    </View>
                  </View>
                  {/* Dish List Section */}
                  {(hasMenu || hasExtraDishes) && (
                    <View style={styles.dishSection}>
                      {hasMenu && (
                        <>
                          <View style={styles.detailRow}>
                            <Text style={styles.detailLabel}>{t("menu")}:</Text>
                            <Text style={styles.detailValue}>
                              {menu.name}
                            </Text>
                          </View>
                          {menuDishes.map((dish, idx) => (
                            <View key={idx} style={styles.dishRow}>
                              <Text style={styles.dishName}>
                                - {dish.dishName}
                              </Text>
                              {detail.dishes?.find(
                                (d) => d.dishId === dish.dishId
                              )?.notes && (
                                <Text style={styles.dishNote}>
                                  ({t("note")}:{" "}
                                  {
                                    detail.dishes?.find(
                                      (d) => d.dishId === dish.dishId
                                    )?.notes
                                  }
                                  )
                                </Text>
                              )}
                            </View>
                          ))}
                        </>
                      )}
                      {hasExtraDishes && (
                        <>
                          <View style={styles.detailRow}>
                            <Text style={styles.detailLabel}>
                              {hasMenu ? t("extraDishes") : t("dishes")}:
                            </Text>
                            <Text style={styles.detailValue}>
                              {extraDishes.length} {t("items")}
                            </Text>
                          </View>
                          {extraDishes.map((dish, idx) => {
                            // Fallback to dishes array if name is missing
                            const dishName =
                              dish.name ||
                              dishes.find((d) => d.id === dish.dishId)?.name
                            return (
                              <View key={idx} style={styles.dishRow}>
                                <Text style={styles.dishName}>
                                  - {dishName}
                                </Text>
                                {dish.notes && (
                                  <Text style={styles.dishNote}>
                                    ({t("note")}: {dish.notes})
                                  </Text>
                                )}
                              </View>
                            );
                          })}
                        </>
                      )}
                    </View>
                  )}
                  <View style={styles.detailRow}>
                    <Text style={[styles.detailLabel, styles.totalLabel]}>
                      {t("totalPerDay")}:
                    </Text>
                    <Text style={[styles.detailValue, styles.totalValue]}>
                      ${(detail.totalPrice || 0).toFixed(2)}
                    </Text>
                  </View>
                </View>
              </View>
            );
          })}

          <View style={styles.summaryContainer}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>{t("discount")}:</Text>
              <Text style={[styles.summaryValue, styles.discount]}>
                -${(bookingData.discountAmount || 0).toFixed(2)}
              </Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={[styles.summaryLabel, styles.totalLabel]}>
                {t("total")}:
              </Text>
              <Text style={[styles.summaryValue, styles.totalValue]}>
                ${(bookingData.totalPrice || 0).toFixed(2)}
              </Text>
            </View>
          </View>

          <View style={styles.spacer} />
        </ScrollView>
        <View style={styles.buttonArea}>
          <TouchableOpacity
            style={styles.confirmButton}
            onPress={handleConfirmBooking}
          >
            <Text style={styles.confirmButtonText}>{t("confirmBooking")}</Text>
          </TouchableOpacity>
        </View>
        <Modalize
          ref={platformFeeModalRef}
          adjustToContentHeight={true}
          handlePosition="outside"
          modalStyle={styles.modalStyle}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Phí áp dụng là gì?</Text>
            <Text style={styles.modalText}>
              Phí áp dụng là khoản phí nhỏ được thu để hỗ trợ cải thiện và duy
              trì ứng dụng, đảm bảo bạn có trải nghiệm đặt đầu bếp tốt nhất.
              Chúng tôi sử dụng phí này để nâng cấp tính năng, bảo trì hệ thống
              và mang đến nhiều dịch vụ chất lượng hơn cho bạn.
            </Text>
            <TouchableOpacity
              style={styles.modalButton}
              onPress={closePlatformFeeModal}
            >
              <Text style={styles.modalButtonText}>{t("close")}</Text>
            </TouchableOpacity>
          </View>
        </Modalize>
      </SafeAreaView>
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#EBE5DD",
  },
  container: {
    padding: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 20,
  },
  dateContainer: {
    marginBottom: 20,
  },
  dateTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#A64B2A",
    marginBottom: 10,
  },
  detailCard: {
    backgroundColor: "#fff",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#CCCCCC",
    padding: 15,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
    alignItems: "center",
  },
  labelWithIcon: {
    flexDirection: "row",
    alignItems: "center",
  },
  valueWithIcon: {
    flexDirection: "row",
    alignItems: "center",
  },
  detailLabel: {
    fontSize: 14,
    color: "#666",
  },
  detailValue: {
    fontSize: 14,
    fontWeight: "bold",
  },
  dishSection: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#E5E5E5",
  },
  dishRow: {
    marginLeft: 10,
    marginBottom: 5,
  },
  dishName: {
    fontSize: 14,
    color: "#333",
  },
  dishNote: {
    fontSize: 12,
    color: "#777",
    marginLeft: 10,
  },
  separator: {
    fontSize: 14,
    color: "#333",
    textAlign: "center",
    marginVertical: 5,
  },
  summaryContainer: {
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#CCCCCC",
    marginBottom: 20,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  summaryLabel: {
    fontSize: 16,
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: "bold",
  },
  discount: {
    color: "#FF5733",
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: "bold",
  },
  totalValue: {
    fontSize: 18,
    color: "#A64B2A",
    fontWeight: "bold",
  },
  infoContainer: {
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#CCCCCC",
    marginBottom: 20,
  },
  infoLabel: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 5,
  },
  infoValue: {
    fontSize: 16,
    marginBottom: 10,
  },
  confirmButton: {
    backgroundColor: "#A64B2A",
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: "center",
  },
  confirmButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  buttonArea: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#EBE5DD",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderTopWidth: 1,
    borderTopColor: "#CCCCCC",
  },
  spacer: {
    height: 100,
  },
  infoIcon: {
    marginLeft: 5,
  },
  labelIcon: {
    marginLeft: 5,
  },
  modalStyle: {
    backgroundColor: "#FFF",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  modalContent: {
    padding: 20,
    paddingBottom: 30,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 15,
    textAlign: "center",
  },
  modalText: {
    fontSize: 14,
    color: "#666",
    lineHeight: 20,
    marginBottom: 20,
    textAlign: "center",
  },
  modalButton: {
    backgroundColor: "#A64B2A",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  modalButtonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "bold",
  },
});

export default ReviewBookingScreen;
