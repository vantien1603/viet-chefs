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
  Modal,
  Image,
} from "react-native";
import { commonStyles } from "../../style";
import Toast from "react-native-toast-message";
import { Modalize } from "react-native-modalize";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { MaterialIcons } from "@expo/vector-icons";
import { t } from "i18next";

const ViewDetailBookingDetails = () => {
  const { bookingDetailsId } = useLocalSearchParams();
  const axiosInstance = useAxios();
  const [bookingDetails, setBookingDetails] = useState(null);
  const [reportReasonDetail, setReportReasonDetail] = useState("");
  const [isReported, setIsReported] = useState(false);
  const modalizeRef = useRef(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);

  useEffect(() => {
    const fetchBookingDetails = async () => {
      try {
        const response = await axiosInstance.get(
          `/bookings/booking-details/${bookingDetailsId}`
        );
        setBookingDetails(response.data);
        setIsReported(response.data.reported || false);
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
      console.log(
        "Error confirming completion:",
        error?.response?.data?.message
      );
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
    setReportReasonDetail("");
  };

  const openImageModal = (imageUrl) => {
    setSelectedImage(imageUrl);
    setModalVisible(true);
  };

  const closeImageModal = () => {
    setModalVisible(false);
    setSelectedImage(null);
  };

  const handleSubmitReport = async () => {
    try {
      const reporterId = bookingDetails?.booking?.customer?.id;
      if (!reporterId) {
        throw new Error("Reporter ID not found");
      }

      const reportedChefId = bookingDetails?.booking?.chef?.id;
      if (!reportedChefId) {
        throw new Error("Reported chef id not found");
      }
      const reportRequest = {
        reportedChefId,
        reason: "CHEF_NO_SHOW",
        reasonDetail: reportReasonDetail.trim() || null,
        bookingDetailId: bookingDetailsId,
      };

      const response = await axiosInstance.post(
        `/reports?reporterId=${reporterId}`,
        reportRequest
      );

      if (response.status === 200) {
        Toast.show({
          type: "success",
          text1: "Success",
          text2: "Report submitted successfully",
        });

        try {
          const updatedResponse = await axiosInstance.get(
            `/bookings/booking-details/${bookingDetailsId}`
          );
          setBookingDetails(updatedResponse.data);
          setIsReported(updatedResponse.data.reported || true);
        } catch (fetchError) {
          console.log("Error fetching updated booking details:", fetchError);
          setBookingDetails({ ...bookingDetails, status: "REPORTED" });
          setIsReported(true);
        }

        closeReportModal();
        router.replace("(tabs)/schedule");
      }
    } catch (error) {
      console.log("Error submitting report:", error?.response?.data?.message);
      Toast.show({
        type: "error",
        text1: "Error",
        text2: error?.response?.data?.message || "Failed to submit report",
      });
    }
  };

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
              Phí áp dụng:{" "}
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
                    {dish.notes || "N/A"})
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
          {/* Images Section */}
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>{t("images")}</Text>
            {!bookingDetails?.images || bookingDetails?.images.length === 0 ? (
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
                {bookingDetails?.images.map((image, index) => (
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
        <View style={styles.footer}>
          {!isReported &&
            bookingDetails.status === "WAITING_FOR_CONFIRMATION" && (
              <TouchableOpacity
                style={[styles.button, { backgroundColor: "#dc3545" }]}
                onPress={openReportModal}
              >
                <Text style={styles.buttonText}>Report</Text>
              </TouchableOpacity>
            )}
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
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
    color: "#333",
  },
  noDataContainer: {
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
  },
  detailValue: {
    fontSize: 14,
    color: "#666",
    flex: 1,
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
    justifyContent: "space-between",
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

export default ViewDetailBookingDetails;
