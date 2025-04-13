import React, { useContext } from "react";
import {
  SafeAreaView,
  ScrollView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from "react-native";
import Header from "../../components/header";
// import ProgressBar from "../../components/progressBar";
import { useLocalSearchParams, useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import useAxios from "../../config/AXIOS_API";
import { AuthContext } from "../../config/AuthContext";

const ReviewBookingScreen = () => {
  const params = useLocalSearchParams();
  const router = useRouter();
  const bookingData = JSON.parse(params.bookingData || "{}");
  const chefId = parseInt(params.chefId);
  const selectedPackage = JSON.parse(params.selectedPackage);
  const guestCount = parseInt(params.numPeople);
  const selectedDates = JSON.parse(params.selectedDates || "{}");
  const axiosInstance = useAxios();
  const { user } = useContext(AuthContext);

  const calculateSubtotal = () => {
    return (
      bookingData.bookingDetails?.reduce(
        (sum, detail) => sum + detail.totalPrice,
        0
      ) || 0
    );
  };

  const handleConfirmBooking = async () => {
    try {
      const customerId = await AsyncStorage.getItem("@userId");
      if (!user) {
        console.log("user befor booo",user);
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
          };
        }),
      };

      console.log(
        "Payload for booking confirmation:",
        JSON.stringify(payload, null, 2)
      );

      const response = await axiosInstance.post("/bookings/long-term", payload);

      if (response.status === 201 || response.status === 200) {
        router.push("/(tabs)/home");
      }
    } catch (error) {
      console.error("Error confirming booking:", error);
      const errorMessage =
        error.response?.data?.message ||
        "Có lỗi khi xác nhận đặt chỗ. Vui lòng thử lại.";
      Alert.alert("Lỗi", errorMessage);
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
      },
    });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header title="Confirm Booking" onLeftPress={handleBackPress}/>
      {/* <ProgressBar title="Xác nhận" currentStep={4} totalSteps={4} /> */}
      <ScrollView style={styles.container}>
        <Text style={styles.title}>Chi tiết đặt chỗ dài hạn</Text>

        {/* Booking Details for Each Date */}
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

              {/* <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Phí nền tảng:</Text>
                <Text style={styles.detailValue}>${(detail.platformFee || 0).toFixed(2)}</Text>
              </View> */}
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Discount:</Text>
                <Text style={styles.detailValue}>
                  -${(detail.discountAmout || 0).toFixed(2)}
                </Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Total cook time:</Text>
                <Text style={styles.detailValue}>{detail.totalCookTime}</Text>
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

        {/* Summary Section */}
        <View style={styles.summaryContainer}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Tạm tính:</Text>
            <Text style={styles.summaryValue}>
              ${calculateSubtotal().toFixed(2)}
            </Text>
          </View>
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

        {/* Additional Information */}
        <View style={styles.infoContainer}>
          <Text style={styles.infoLabel}>Địa điểm:</Text>
          <Text style={styles.infoValue}>
            {bookingData.bookingDetails?.[0]?.location || "N/A"}
          </Text>
        </View>

        {/* Spacer to ensure content scrolls past the fixed button */}
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
    </SafeAreaView>
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
});

export default ReviewBookingScreen;
