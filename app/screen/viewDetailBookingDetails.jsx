import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useState, useRef } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import useAxios from "../../config/AXIOS_API";
import Header from "../../components/header";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  TextInput,
} from "react-native";
import { commonStyles } from "../../style";
import Toast from "react-native-toast-message";
import { Modalize } from "react-native-modalize";
import { GestureHandlerRootView } from "react-native-gesture-handler";

const ViewDetailBookingDetails = () => {
  const { bookingDetailsId } = useLocalSearchParams();
  const axiosInstance = useAxios();
  const [bookingDetails, setBookingDetails] = useState(null);
  const [reportReasonDetail, setReportReasonDetail] = useState("");
  const modalizeRef = useRef(null);
  console.log("b", bookingDetailsId);

  useEffect(() => {
    const fetchBookingDetails = async () => {
      try {
        const response = await axiosInstance.get(
          `/bookings/booking-details/${bookingDetailsId}`
        );
        setBookingDetails(response.data);
        console.log("Booking details:", response.data);
      } catch (error) {
        console.log("Error fetching booking details:", error);
      }
    };
    fetchBookingDetails();
  }, [bookingDetailsId]);

  const handleCompleted = async () => {
    try {
      const response = await axiosInstance.put(
        `/bookings/booking-details/${bookingDetailsId}/complete-customer`
      );
      if (response.status === 200) {
        Toast.show({
          type: "success",
          text1: "Success",
          text2: "Confirm success",
        });
        setBookingDetails({ ...bookingDetails, status: "COMPLETED" });
      }
    } catch (error) {
      console.log("Error confirming completion:", error?.response?.data?.message);
      Toast.show({
        type: "error",
        text1: "Error",
        text2: error?.response?.data?.message || "Failed to confirm",
      });
    }
  };

  const openReportModal = () => {
    modalizeRef.current?.open();
  };

  const closeReportModal = () => {
    modalizeRef.current?.close();
    setReportReasonDetail(""); // Reset input
  };

  const handleSubmitReport = async () => {
    // console.log("cc", bookingDetails?.booking?.customer?.id);
    try {
      const reporterId = bookingDetails?.booking?.customer?.id;
      if (!reporterId) {
        throw new Error("Reporter ID not found");
      }

      const reportedChefId = bookingDetails?.booking?.chef?.id;
      if(!reportedChefId){
        throw new Error("Reported chef id not found");
      }
      const reportRequest = {
        reportedChefId,
        reason: "CHEF_NO_SHOW",
        reasonDetail: reportReasonDetail.trim() || null,
        bookingDetailId: bookingDetailsId
      };

      const response = await axiosInstance.post(
        `/reports?reporterId=${reporterId}`,
        reportRequest
      );

      Toast.show({
        type: "success",
        text1: "Success",
        text2: "Report submitted successfully",
      });

      closeReportModal();
    } catch (error) {
      console.log("Error submitting report:", error?.response?.data?.message);
      Toast.show({
        type: "error",
        text1: "Error",
        text2: error?.response?.data?.message || "Failed to submit report",
      });
    }
  };

  // Render loading state after all Hooks
  if (!bookingDetails) {
    return (
      <SafeAreaView style={commonStyles.containerContent}>
        <Header />
        <View style={styles.container}>
          <Text style={styles.noData}>Đang tải...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <GestureHandlerRootView style={commonStyles.containerContent}>
      <Header />
      <View style={styles.mainContainer}>
        <ScrollView
          style={styles.scrollContainer}
          contentContainerStyle={styles.scrollContent}
        >
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Thông tin đặt chỗ</Text>
            <Text style={styles.label}>
              Đầu bếp: {bookingDetails.booking?.chef?.user?.fullName || "N/A"}
            </Text>
            <Text style={styles.label}>
              Ngày: {bookingDetails.sessionDate || "N/A"}
            </Text>
            <Text style={styles.label}>
              Giờ bắt đầu: {bookingDetails.startTime || "N/A"}
            </Text>
            <Text style={styles.label}>
              Địa chỉ: {bookingDetails.location || "N/A"}
            </Text>
            <Text style={styles.label}>
              Tổng giá:{" "}
              {bookingDetails.totalPrice
                ? `${bookingDetails.totalPrice.toFixed(2)}`
                : "N/A"}
            </Text>
            <Text style={styles.label}>
              Trạng thái: {bookingDetails.status || "N/A"}
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Chi tiết giá</Text>
            <Text style={styles.label}>
              Phí nấu:{" "}
              {bookingDetails.chefCookingFee
                ? `${bookingDetails.chefCookingFee.toFixed(2)}`
                : "0"}
            </Text>
            <Text style={styles.label}>
              Giá món ăn:{" "}
              {bookingDetails.priceOfDishes
                ? `${bookingDetails.priceOfDishes.toFixed(2)}`
                : "0"}
            </Text>
            <Text style={styles.label}>
              Phí nền tảng:{" "}
              {bookingDetails.platformFee
                ? `${bookingDetails.platformFee.toFixed(2)}`
                : "0"}
            </Text>
            <Text style={styles.label}>
              Giảm giá:{" "}
              {bookingDetails.discountAmout
                ? `${bookingDetails.discountAmout.toFixed(2)}`
                : "0"}
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Món ăn</Text>
            {bookingDetails.dishes?.length > 0 ? (
              bookingDetails.dishes.map((dish) => (
                <View key={dish.id} style={styles.dishItem}>
                  <Text style={styles.label}>
                    - {dish.dish?.name || "N/A"} (Ghi chú:{" "}
                    {dish.notes || "Không có"})
                  </Text>
                </View>
              ))
            ) : (
              <Text style={styles.noData}>Không có món ăn nào.</Text>
            )}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Thông tin bổ sung</Text>
            <Text style={styles.label}>
              Loại đặt chỗ: {bookingDetails.booking?.bookingType || "N/A"}
            </Text>
            <Text style={styles.label}>
              Trạng thái booking: {bookingDetails.booking?.status || "N/A"}
            </Text>
            <Text style={styles.label}>
              Thời gian bắt đầu nấu: {bookingDetails.timeBeginCook || "N/A"}
            </Text>
            <Text style={styles.label}>
              Thời gian bắt đầu di chuyển:{" "}
              {bookingDetails.timeBeginTravel || "N/A"}
            </Text>
          </View>
        </ScrollView>
        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.button, { backgroundColor: "#dc3545" }]}
            onPress={openReportModal}
          >
            <Text style={styles.buttonText}>Report</Text>
          </TouchableOpacity>
          {bookingDetails.status === "WAITING_FOR_CONFIRMATION" && (
            <TouchableOpacity
              style={[styles.button, { backgroundColor: "#28a745" }]}
              onPress={handleCompleted}
            >
              <Text style={styles.buttonText}>Confirm Completed</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <Modalize
        ref={modalizeRef}
        adjustToContentHeight
        modalStyle={styles.modal}
        handlePosition="outside"
      >
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Report Chef No-Show</Text>
          <Text style={styles.modalLabel}>Reason</Text>
          <TextInput
            style={[styles.input, { backgroundColor: "#e0e0e0" }]}
            value="CHEF_NO_SHOW"
            editable={false}
          />
          <Text style={styles.modalLabel}>Detail (Optional)</Text>
          <TextInput
            style={styles.input}
            placeholder="Provide additional details..."
            value={reportReasonDetail}
            onChangeText={setReportReasonDetail}
            multiline
            numberOfLines={4}
          />
          <View style={styles.modalButtons}>
            <TouchableOpacity
              style={[styles.modalButton, { backgroundColor: "#6c757d" }]}
              onPress={closeReportModal}
            >
              <Text style={styles.buttonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalButton, { backgroundColor: "#dc3545" }]}
              onPress={handleSubmitReport}
            >
              <Text style={styles.buttonText}>Submit Report</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modalize>

      <Toast />
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
  },
  scrollContent: {
    padding: 15,
    paddingBottom: 20,
  },
  section: {
    marginBottom: 20,
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 15,
    borderWidth: 1,
    borderColor: "#CCCCCC",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
    color: "#333",
  },
  label: {
    fontSize: 16,
    marginVertical: 5,
    color: "#333",
  },
  dishItem: {
    marginLeft: 10,
  },
  noData: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginVertical: 10,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: "#EBE5DD",
    borderTopWidth: 1,
    borderColor: "#ddd",
  },
  button: {
    flex: 1,
    marginHorizontal: 5,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
  modal: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  modalContent: {
    padding: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
    color: "#333",
  },
  modalLabel: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 5,
    color: "#333",
  },
  input: {
    borderWidth: 1,
    borderColor: "#CCCCCC",
    borderRadius: 8,
    padding: 10,
    fontSize: 16,
    marginBottom: 15,
    backgroundColor: "#fff",
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between"
  },
  modalButton: {
    flex: 1,
    marginHorizontal: 5,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});

export default ViewDetailBookingDetails;