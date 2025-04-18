import React, { useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Pressable,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from "react-native";
import { router } from "expo-router";
import Toast from "react-native-toast-message";
import { Ionicons } from "@expo/vector-icons";
import useAxios from "../config/AXIOS_API"; // Import useAxios

// Custom hook for cancellation logic
const useBookingCancellation = () => {
  const axiosInstance = useAxios(); // Use useAxios inside hook

  const handleCancel = async (bookingId, onRefresh) => {
    try {
      const response = await axiosInstance.put(
        `/bookings/single/cancel/${bookingId}`
      );
      if (response.status === 200) {
        Toast.show({
          type: "success",
          text1: "Success",
          text2: "Single booking cancelled successfully",
          visibilityTime: 4000,
        });
        onRefresh();
      }
    } catch (error) {
      const errorMessage =
        error.response?.data?.message || "Failed to cancel single booking";
      console.error("Error cancelling single booking:", error?.response?.data);
      throw new Error(errorMessage);
    }
  };

  const handleCancelBookingLongterm = async (bookingId, onRefresh) => {
    try {
      const response = await axiosInstance.put(
        `/bookings/long-term/cancel/${bookingId}`
      );
      if (response.status === 200) {
        console.log("Long-term cancel success:", response.data);
        Toast.show({
          type: "success",
          text1: "Success",
          text2: "Long-term booking cancelled successfully",
          visibilityTime: 4000,
        });
        onRefresh();
      }
    } catch (error) {
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "Failed to cancel long-term booking";
      console.error(
        "Error cancelling long-term booking:",
        error?.response?.data
      );
      throw new Error(errorMessage);
    }
  };

  const handleCancelBooking = (bookingId, bookingType, onRefresh) => {
    return new Promise((resolve, reject) => {
      // Validate bookingType
      if (
        !bookingType ||
        !["SINGLE", "LONG_TERM"].includes(bookingType.toUpperCase())
      ) {
        console.error(
          "Invalid bookingType:",
          bookingType,
          "for bookingId:",
          bookingId
        );
        Toast.show({
          type: "error",
          text1: "Error",
          text2: "Invalid booking type",
          visibilityTime: 4000,
        });
        return reject(new Error("Invalid booking type"));
      }

      Alert.alert(
        "Cancel Booking",
        "Are you sure you want to cancel this booking?",
        [
          { text: "No", style: "cancel", onPress: () => resolve(false) },
          {
            text: "Yes",
            onPress: async () => {
              try {
                if (bookingType === "SINGLE") {
                  await handleCancel(bookingId, onRefresh);
                } else if (bookingType === "LONG_TERM") {
                  await handleCancelBookingLongterm(bookingId, onRefresh);
                }
                resolve(true);
              } catch (error) {
                Toast.show({
                  type: "error",
                  text1: "Error",
                  text2: error.message,
                  visibilityTime: 4000,
                });
                reject(error);
              }
            },
          },
        ]
      );
    });
  };

  return { handleCancelBooking };
};

const BookingCard = ({
  booking,
  role,
  onCancel,
  onAccept,
  onReject,
  onRebook,
  onReview,
  onViewReview,
  refreshing,
  reviewed,
  onPayment,
}) => {
  const isSingleBooking = booking.bookingType === "SINGLE";
  const status = booking.status;
  const [cancellingId, setCancellingId] = useState(null);

  const handlePress = () => {
    router.push({
      pathname:
        status === "PENDING"
          ? "/screen/viewBookingDetails"
          : status === "DEPOSITED" || booking.bookingType === "LONG_TERM"
          ? "/screen/longTermDetails"
          : "/screen/viewBookingDetails",
      params: {
        bookingId: booking.id,
        chefId: booking.chef.id,
        bookingType: booking.bookingType,
        refreshing: refreshing.toString(),
      },
    });
  };

  const getStatusStyle = (status) => {
    switch (status) {
      case "PENDING":
      case "PENDING_FIRST_CYCLE":
        return { backgroundColor: "#fed7aa", textColor: "#7c2d12" };
      case "CONFIRMED":
      case "CONFIRMED_PARTIALLY_PAID":
      case "CONFIRMED_PAID":
      case "PAID":
      case "PAID_FIRST_CYCLE":
      case "DEPOSITED":
        return { backgroundColor: "#a7f3d0", textColor: "#064e3b" };
      case "COMPLETED":
        return { backgroundColor: "#bfdbfe", textColor: "#1e3a8a" };
      case "CANCELED":
      case "OVERDUE":
        return { backgroundColor: "#fecaca", textColor: "#991b1b" };
      default:
        return { backgroundColor: "#e5e7eb", textColor: "#4b5563" };
    }
  };

  const renderButtons = () => {
    const buttons = [];

    if (
      ["PENDING", "PENDING_FIRST_CYCLE"].includes(status) &&
      booking.bookingType === "LONG_TERM" &&
      onPayment
    ) {
      buttons.push(
        <TouchableOpacity
          key="payment"
          style={[styles.button, styles.secondaryButton]}
          onPress={() => onPayment(booking.id)}
        >
          <Text style={styles.buttonText}>Pay</Text>
        </TouchableOpacity>
      );
    }

    if (
      [
        "PENDING",
        "PENDING_FIRST_CYCLE",
        "CONFIRMED",
        "CONFIRMED_PARTIALLY_PAID",
        "CONFIRMED_PAID",
        "PAID",
        "DEPOSITED",
        "PAID_FIRST_CYCLE",
      ].includes(status) &&
      onCancel
    ) {
      buttons.push(
        <TouchableOpacity
          key="cancel"
          style={[styles.button, styles.cancelButton]}
          onPress={async () => {
            setCancellingId(booking.id);
            try {
              await onCancel(booking.id);
            } finally {
              setCancellingId(null);
            }
          }}
          disabled={cancellingId === booking.id}
        >
          {cancellingId === booking.id ? (
            <ActivityIndicator size="small" color="#ffffff" />
          ) : (
            <Text style={styles.buttonText}>Cancel</Text>
          )}
        </TouchableOpacity>
      );
    }

    if (
      role === "ROLE_CHEF" &&
      ["PAID", "PAID_FIRST_CYCLE"].includes(status) &&
      onAccept &&
      onReject
    ) {
      buttons.push(
        <TouchableOpacity
          key="accept"
          style={[styles.button, styles.primaryButton]}
          onPress={() => onAccept(booking.id)}
        >
          <Text style={styles.buttonText}>Accept</Text>
        </TouchableOpacity>,
        <TouchableOpacity
          key="reject"
          style={[styles.button, styles.cancelButton]}
          onPress={() => onReject(booking.id)}
        >
          <Text style={styles.buttonText}>Reject</Text>
        </TouchableOpacity>
      );
    }

    if (status === "COMPLETED") {
      if (reviewed && onViewReview) {
        buttons.push(
          <TouchableOpacity
            key="viewReview"
            style={[styles.button, styles.secondaryButton]}
            onPress={() => onViewReview(booking.id, booking.chef.id)}
          >
            <Text style={styles.buttonText}>View Review</Text>
          </TouchableOpacity>
        );
      } else if (onReview) {
        buttons.push(
          <TouchableOpacity
            key="review"
            style={[styles.button, styles.secondaryButton]}
            onPress={() => onReview(booking.id, booking.chef.id)}
          >
            <Text style={styles.buttonText}>Review</Text>
          </TouchableOpacity>
        );
      }
      if (onRebook) {
        buttons.push(
          <TouchableOpacity
            key="rebook"
            style={[styles.button, styles.primaryButton]}
            onPress={() => onRebook(booking)}
          >
            <Text style={styles.buttonText}>Rebook</Text>
          </TouchableOpacity>
        );
      }
    }

    return buttons.length > 0 ? (
      <View style={styles.buttonContainer}>{buttons}</View>
    ) : null;
  };

  return (
    <Pressable
      style={({ pressed }) => [
        styles.cardContainer,
        pressed && styles.cardPressed,
      ]}
      onPress={handlePress}
    >
      <View style={styles.card}>
        <View style={styles.cardContent}>
          <View style={styles.cardHeader}>
            <Text style={styles.packageName} numberOfLines={1}>
              {booking.bookingPackage?.name || "One day"}
            </Text>
            <View
              style={[
                styles.statusBadge,
                { backgroundColor: getStatusStyle(status).backgroundColor },
              ]}
            >
              <Text
                style={[
                  styles.statusText,
                  { color: getStatusStyle(status).textColor },
                ]}
              >
                {status}
              </Text>
            </View>
          </View>
          <Text style={styles.detailText}>
            <Ionicons name="person-outline" size={14} color="#64748b" /> Chef:{" "}
            {booking.chef.user.fullName}
          </Text>
          <Text style={styles.detailText}>
            <Ionicons name="people-outline" size={14} color="#64748b" />{" "}
            {booking.guestCount} guests
          </Text>
          <Text style={styles.detailText} numberOfLines={1}>
            <Ionicons name="location-outline" size={14} color="#64748b" />{" "}
            {booking.bookingDetails?.[0]?.location || "N/A"}
          </Text>
          {booking.bookingDetails?.[0] && (
            <Text style={styles.detailText}>
              <Ionicons name="calendar-outline" size={14} color="#64748b" />{" "}
              {booking.bookingDetails[0].sessionDate} at{" "}
              {booking.bookingDetails[0].startTime}
            </Text>
          )}
          <Text style={styles.price}>${booking.totalPrice}</Text>
        </View>
      </View>
      {renderButtons()}
    </Pressable>
  );
};

const BookingList = ({
  bookings,
  onLoadMore,
  refreshing,
  onRefresh,
  role,
  onAccept,
  onReject,
  onPayment,
}) => {
  const axiosInstance = useAxios(); // Use useAxios for rebooking
  const [loadingBookingId, setLoadingBookingId] = useState(null);
  const [reviewed, setReviewed] = useState(false);
  const { handleCancelBooking } = useBookingCancellation(); // Use custom hook

  const handleRebook = async (booking) => {
    setLoadingBookingId(booking.id);
    try {
      const bookingDetailId = booking.bookingDetails?.[0]?.id;
      if (!bookingDetailId) {
        throw new Error("Booking detail ID not found");
      }
      const response = await axiosInstance.get(
        `/bookings/booking-details/${bookingDetailId}`
      );
      const bookingDetails = response.data;

      let selectedMenu = null;
      if (bookingDetails.menuId) {
        const allowedDishIds = bookingDetails.dishes.map(({ dish }) => dish.id);

        const menuValidationResponse = await axiosInstance.post(
          `/menus/${bookingDetails.menuId}/validate`,
          allowedDishIds
        );
        const isMenuValid = menuValidationResponse.data.success;
        if (!isMenuValid) {
          throw new Error(
            menuValidationResponse.data.message ||
              "Selected menu has changed or is no longer valid"
          );
        }

        selectedMenu = {
          id: bookingDetails.menuId,
          name: `Menu ${bookingDetails.menuId}`,
          menuItems: [],
        };
      }

      const selectedDishes = bookingDetails.dishes.map(({ dish }) => ({
        id: dish.id,
        name: dish.name,
        imageUrl: dish.imageUrl || null,
      }));

      const dishNotes = {};
      bookingDetails.dishes.forEach(({ dish, notes }) => {
        dishNotes[dish.id] = notes || "";
      });

      router.push({
        pathname: "/screen/booking",
        params: {
          chefId: booking.chef.id,
          selectedMenu: selectedMenu ? JSON.stringify(selectedMenu) : null,
          selectedDishes:
            selectedDishes.length > 0 ? JSON.stringify(selectedDishes) : null,
          dishNotes: JSON.stringify(dishNotes),
          numPeople: booking.guestCount.toString(),
          address: bookingDetails.location || null,
        },
      });
    } catch (error) {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Failed to initiate rebooking.",
        visibilityTime: 4000,
      });
    } finally {
      setLoadingBookingId(null);
    }
  };

  const handleReview = (bookingId, chefId) => {
    router.push({
      pathname: "/screen/review",
      params: { bookingId, chefId },
    });
  };

  const handleViewReview = (bookingId, chefId) => {
    router.push({
      pathname: "/screen/viewReview",
      params: { bookingId, chefId },
    });
  };

  return (
    <View style={styles.listContainer}>
      <FlatList
        data={bookings}
        renderItem={({ item }) => {
          return (
            <BookingCard
              booking={{ ...item, status: item.status || "UNKNOWN" }}
              role={role}
              onCancel={(bookingId) =>
                handleCancelBooking(bookingId, item.bookingType, onRefresh)
              }
              onAccept={onAccept}
              onReject={onReject}
              onRebook={handleRebook}
              onReview={handleReview}
              onViewReview={handleViewReview}
              reviewed={reviewed}
              refreshing={refreshing}
              onPayment={onPayment}
            />
          );
        }}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContent}
        onEndReached={onLoadMore}
        onEndReachedThreshold={0.1}
        refreshing={refreshing}
        onRefresh={onRefresh}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="calendar-outline" size={48} color="#64748b" />
            <Text style={styles.emptyText}>No bookings available</Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  listContainer: {
    flex: 1,
  },
  listContent: {
    padding: 16,
  },
  cardContainer: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    marginBottom: 12,
  },
  cardPressed: {
    transform: [{ scale: 0.98 }],
  },
  card: {
    flexDirection: "row",
    padding: 12,
    alignItems: "center",
  },
  cardContent: {
    flex: 1,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  packageName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1e293b",
    flex: 1,
  },
  statusBadge: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "500",
  },
  detailText: {
    fontSize: 13,
    color: "#64748b",
    marginBottom: 4,
  },
  price: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1e293b",
    marginTop: 4,
  },
  buttonContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
    gap: 8,
    justifyContent: "flex-end",
  },
  button: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    minWidth: 80,
    alignItems: "center",
  },
  buttonText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#ffffff",
  },
  primaryButton: {
    backgroundColor: "#2dd4bf",
  },
  secondaryButton: {
    backgroundColor: "#6366f1",
  },
  cancelButton: {
    backgroundColor: "#fb7185",
  },
  emptyContainer: {
    alignItems: "center",
    paddingVertical: 48,
  },
  emptyText: {
    fontSize: 16,
    color: "#64748b",
    marginTop: 12,
  },
});

export default BookingList;
