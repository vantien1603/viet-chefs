import React, { useContext, useRef, useState, useEffect } from "react";
import {
  SafeAreaView,
  ScrollView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import Header from "../../components/header";
import { useRouter } from "expo-router";
import useAxios from "../../config/AXIOS_API";
import { AuthContext } from "../../config/AuthContext";
import { Ionicons } from "@expo/vector-icons";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { Modalize } from "react-native-modalize";
import { t } from "i18next";
import axios from "axios";
import { useCommonNoification } from "../../context/commonNoti";
import { useSelectedItems } from "../../context/itemContext";
import { commonStyles } from "../../style";

const ReviewBookingScreen = () => {
  const router = useRouter();
  const axiosInstance = useAxios();
  const { showModal } = useCommonNoification();
  const { user } = useContext(AuthContext);
  const platformFeeModalRef = useRef(null);
  const { numPeople, address, chefId, selectedPackage,
    startTime,
    ingredientPrep,
    dishNotes,
    selectedMenuLong,
    selectedDishes,
    extraDishIds,
    selectedDates,
    isSelected, setTotalPrice, setLocation } = useSelectedItems();

  const [loading, setLoading] = useState(false);
  const [calcuResult, setCalcuResult] = useState({});
  useEffect(() => {
    calculatorLong();
  }, []);

  const calculatorLong = async () => {
    setLoading(true);
    try {
      const bookingDetails = selectedDates.map((date) => {
        const menuItems = Array.isArray(selectedMenuLong[date]?.menuItems)
          ? selectedMenuLong[date].menuItems
          : [];

        const extra = extraDishIds[date] ? Object.values(extraDishIds[date]) : [];

        const selected = selectedDishes[date]
          ? Object.values(selectedDishes[date])
          : [];

        const allDishIds = selectedMenuLong[date]
          ? [...menuItems, ...extra].map((dish) => dish.id || dish.dishId)
          : [...selected].map((dish) => dish.id || dish.dishId);
        console.log("menu", selectedMenuLong[date]);
        console.log("extra", extraDishIds[date]);
        console.log("dishes", selectedDishes[date]);

        console.log("vo calcu 1");
        return {
          sessionDate: date,
          startTime: `${startTime[date]}:00`,
          menuId: selectedMenuLong[date]?.id || null,
          extraDishIds: allDishIds || null,
          isDishSelected: (isSelected[date]) ? true : false,
          dishes: allDishIds?.map((id) => ({
            dishId: id,
            notes: dishNotes[date]?.[id] || "",
          })),
          chefBringIngredients: ingredientPrep[date],
        };
      });
      console.log("vo calcu 2");

      const payload = {
        chefId: chefId,
        packageId: selectedPackage.id,
        guestCount: numPeople,
        location: address.address,
        bookingDetails,
      };
      console.log("vo calcu 3");
      console.log("payload 3", payload);

      const response = await axiosInstance.post("/bookings/calculate-long-term-booking", payload);
      console.log("répóne 4", response.data);
      setCalcuResult(response.data);
    } catch (error) {
      if (error.response?.status === 401 || axios.isCancel(error)) {
        return;
      }
      showModal("Error", error.response.data.message, "Failed");
    } finally {
      setLoading(false);
    }
  }


  const openPlatformFeeModal = () => {
    platformFeeModalRef.current?.open();
  };

  const closePlatformFeeModal = () => {
    platformFeeModalRef.current?.close();
  };

  const handleConfirmBooking = async () => {
    setLoading(true);
    try {
      const payload = {
        customerId: user?.userId,
        chefId: chefId,
        requestDetails: "",
        guestCount: numPeople || 0,
        packageId: selectedPackage.id,
        bookingDetails: calcuResult.bookingDetails?.map((detail, index) => {
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

      console.log(payload);
      const response = await axiosInstance.post("/bookings/long-term", payload);
      if (response.status === 200 || response.status === 201) {
        showModal("Success", "Đặt chỗ dài hạn đã được xác nhận!", "Success");
        setTotalPrice(calcuResult.totalPrice);
        setLocation(calcuResult.bookingDetails?.[0]?.location);
        router.replace({
          pathname: "/screen/paymentLongterm",
          params: {
            bookingId: response.data.id,
          },
        });
      }

    } catch (error) {
      if (error.response?.status === 401 || axios.isCancel(error)) {
        return;
      }
      showModal("Error", error.response.data.message || "Có lỗi xảy ra trong quá trình đặt chổ.", "Failed");
    }
  };

  const handleBack = () => {
    router.replace('/screen/longTermSelect');
  }

  return (
    <GestureHandlerRootView style={commonStyles.container}>
      <SafeAreaView style={commonStyles.containerContent}>
        <Header title={t("confirmBooking")} onLeftPress={() => handleBack()} />
        {loading ? (<ActivityIndicator size={'large'} color={'white'} />) : (
          <>
            <ScrollView style={styles.container}>
              <Text style={styles.title}>{t("longTermBookingDetails")}</Text>
              <View style={styles.infoContainer}>
                <Text style={styles.infoLabel}>{t("location")}:</Text>
                <Text style={styles.infoValue}>
                  {calcuResult.bookingDetails?.[0]?.location || "N/A"}
                </Text>
              </View>
              {calcuResult.bookingDetails?.map((detail, index) => (
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
                        {ingredientPrep[detail.sessionDate]
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
                    <View style={styles.dishSection}>
                      {selectedMenuLong[detail.sessionDate] && (
                        <View>
                          <View style={styles.detailRow}>
                            <Text style={styles.detailLabel}>{t("menu")}:</Text>
                            <Text style={styles.detailValue}>
                              {selectedMenuLong[detail.sessionDate].name}
                            </Text>
                          </View>
                          {selectedMenuLong[detail.sessionDate].menuItems.map((dish, idx) => (
                            <View key={idx} style={{ alignItems: 'flex-end', marginBottom: 10 }}>
                              <Text style={styles.dishName}>{dish.dishName}</Text>
                            </View>
                          ))}
                        </View>
                      )}

                      {extraDishIds[detail.sessionDate] && (
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 }}>
                          <Text style={styles.detailLabel}>
                            {t("extraDishes")}:
                          </Text>
                          <View>
                            {Object.values(extraDishIds[detail.sessionDate]).map((dish, idx) => (
                              <View key={idx} style={{ alignItems: 'flex-end', marginBottom: 10 }}>
                                <Text style={styles.dishName}>{dish.name}</Text>
                              </View>
                            ))}
                          </View>
                        </View>
                      )}
                      {selectedDishes[detail.sessionDate] && (
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 }}>
                          <Text style={styles.detailLabel}>
                            {t("dishes")}:
                          </Text>
                          <View>
                            {Object.values(selectedDishes[detail.sessionDate]).map((dish, idx) => (
                              <View key={idx} style={{ alignItems: 'flex-end', marginBottom: 10 }}>
                                <Text style={styles.dishName}>{dish.name}</Text>
                              </View>
                            ))}
                          </View>
                        </View>
                      )}
                    </View>

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
              ))}
              <View style={styles.summaryContainer}>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>{t("discount")}:</Text>
                  <Text style={[styles.summaryValue, styles.discount]}>
                    -${(calcuResult.discountAmount || 0).toFixed(2)}
                  </Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={[styles.summaryLabel, styles.totalLabel]}>
                    {t("total")}:
                  </Text>
                  <Text style={[styles.summaryValue, styles.totalValue]}>
                    ${(calcuResult.totalPrice || 0).toFixed(2)}
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
          </>
        )}

        <Modalize
          ref={platformFeeModalRef}
          adjustToContentHeight={true}
          handlePosition="outside"
          modalStyle={styles.modalStyle}
        // onClose={closePlatformFeeModal}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Phí áp dụng là gì?</Text>
            <Text style={styles.modalText}>
              Phí áp dụng là khoản phí được thu để hỗ trợ cải thiện và duy
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
}
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#EBE5DD",
  },
  container: {
    // padding: 20,
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
