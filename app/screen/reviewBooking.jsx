import React, { useContext, useRef, useState } from "react";
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
import axios from "axios";
import { useCommonNoification } from "../../context/commonNoti";

const ReviewBookingScreen = () => {
  const params = useLocalSearchParams();
  const router = useRouter();
  const bookingData = JSON.parse(params.bookingData || "{}");
  const chefId = parseInt(params.chefId);
  const selectedPackage = JSON.parse(params.selectedPackage);
  const guestCount = parseInt(params.numPeople);
  const selectedDates = JSON.parse(params.selectedDates || "{}");
  const axiosInstance = useAxios();
  const { showModal } = useCommonNoification();
  const { user } = useContext(AuthContext);
  const [isPlatformFeeModalVisible, setIsPlatformFeeModalVisible] =
    useState(false);
  const platformFeeModalRef = useRef(null);

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
        throw new Error(
          "Không tìm thấy thông tin người dùng. Vui lòng đăng nhập lại."
        );
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

      // console.log(
      //   "Payload for booking confirmation:",
      //   JSON.stringify(payload, null, 2)
      // );

      const response = await axiosInstance.post("/bookings/long-term", payload);
      if (response.status === 200 || response.status === 201) {
        showModal("Success", "Đặt chỗ dài hạn đã được xác nhận!", "Success")
        router.push({
          pathname: "/screen/paymentLongterm",
          params: {
            bookingId: response.data.id,
            bookingData: JSON.stringify(bookingData),
          },
        });
      }

    } catch (error) {
      if (error.response?.status === 401) {
        return;
      }
      if (axios.isCancel(error)) {
        return;
      }
      showModal("Error", "Có lỗi xảy ra trong quá trình đặt chổ.", "Failed");
    }
  };

  const handleBackPress = () => {
    // Toast.show({
    //   type: "info",
    //   text1: "Quay lại",
    //   text2: "Đã quay lại màn hình chọn ngày.",
    //   visibilityTime: 2000,
    // });
    router.push({
      pathname: "/screen/longTermSelect",
      params: {
        bookingData: JSON.stringify(bookingData),
        chefId: chefId.toString(),
        selectedPackage: JSON.stringify(selectedPackage),
        numPeople: guestCount.toString(),
        selectedDates: JSON.stringify(selectedDates),
      },
    });
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaView style={styles.safeArea}>
        <Header title="Confirm Booking" onLeftPress={handleBackPress} />
        <ScrollView style={styles.container}>
          <Text style={styles.title}>Chi tiết đặt chỗ dài hạn</Text>

          <View style={styles.infoContainer}>
            <Text style={styles.infoLabel}>Địa điểm:</Text>
            <Text style={styles.infoValue}>
              {bookingData.bookingDetails?.[0]?.location || "N/A"}
            </Text>
          </View>

          {bookingData.bookingDetails?.map((detail, index) => (
            <View key={index} style={styles.dateContainer}>
              <Text style={styles.dateTitle}>{detail.sessionDate}</Text>
              <View style={styles.detailCard}>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Thời gian:</Text>
                  <Text style={styles.detailValue}>
                    {detail.startTime.slice(0, 5)}
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Phí di chuyển:</Text>
                  <Text style={styles.detailValue}>
                    ${(detail.arrivalFee || 0).toFixed(2)}
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Phí nấu ăn:</Text>
                  <Text style={styles.detailValue}>
                    ${(detail.chefCookingFee || 0).toFixed(2)}
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Phí món ăn:</Text>
                  <Text style={styles.detailValue}>
                    ${(detail.priceOfDishes || 0).toFixed(2)}
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Discount:</Text>
                  <Text style={styles.detailValue}>
                    -${(detail.discountAmout || 0).toFixed(2)}
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Total cook time:</Text>
                  <Text style={styles.detailValue}>
                    {detail.totalCookTime} minutes
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Nguyên liệu:</Text>
                  <Text style={styles.detailValue}>
                    {selectedDates[detail.sessionDate]?.chefBringIngredients
                      ? "Đầu bếp chuẩn bị"
                      : "Khách hàng chuẩn bị"}
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <View style={styles.labelWithIcon}>
                    <Text style={styles.detailLabel}>Phí áp dụng:</Text>
                    <TouchableOpacity onPress={openPlatformFeeModal}>
                      <Ionicons
                        name="information-circle-outline"
                        size={16}
                        color="#A64B2A"
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
                <View style={styles.detailRow}>
                  <Text style={[styles.detailLabel, styles.totalLabel]}>
                    Tổng cộng ngày:
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
              <Text style={styles.summaryLabel}>Giảm giá:</Text>
              <Text style={[styles.summaryValue, styles.discount]}>
                -${(bookingData.discountAmount || 0).toFixed(2)}
              </Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={[styles.summaryLabel, styles.totalLabel]}>
                Tổng cộng:
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
            <Text style={styles.confirmButtonText}>Xác nhận đặt chỗ</Text>
          </TouchableOpacity>
        </View>
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
              Phí áp dụng là khoản phí nhỏ được thu để hỗ trợ cải thiện và duy
              trì ứng dụng, đảm bảo bạn có trải nghiệm đặt đầu bếp tốt nhất.
              Chúng tôi sử dụng phí này để nâng cấp tính năng, bảo trì hệ thống
              và mang đến nhiều dịch vụ chất lượng hơn cho bạn.
            </Text>
            <TouchableOpacity
              style={styles.modalButton}
              onPress={closePlatformFeeModal}
            >
              <Text style={styles.modalButtonText}>Đóng</Text>
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
    borderColor: "#ccc",
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
  summaryContainer: {
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ccc",
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
    borderColor: "#ccc",
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
    borderTopColor: "#ccc",
  },
  spacer: {
    height: 100,
  },
  infoIcon: {
    marginLeft: 5, // Spacing after the value
  },
  labelIcon: {
    marginLeft: 5, // Spacing after the label
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
