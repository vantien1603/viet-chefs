import React, { useState } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import { router } from "expo-router";
import useAxios from "../config/AXIOS_API";

// Component PendingRoute
export const PendingRoute = ({
  bookings,
  onLoadMore,
  refreshing,
  onRefresh,
  role,
  payment,
}) => {
  const renderItem = ({ item: booking }) => (
    <View style={styles.cardContainer}>
      <TouchableOpacity
        key={booking.id}
        style={styles.card}
        onPress={() => {
          // if (
          //   (booking.status === "PENDING" ||
          //     booking.status === "PENDING_FIRST_CYCLE") &&
          //   booking.bookingType === "SINGLE"
          // ) {
          //   payment(booking.id);
          // } else 
          if (booking.bookingType === "LONG_TERM") {
            router.push({
              pathname: "/screen/viewBookingDetails",
              params: {
                bookingId: booking.id,
                chefId: booking.chef.id,
                bookingType: booking.bookingType,
                refreshing: refreshing.toString(),
              },
            });
          }
        }}
      >
        <View style={styles.leftSection}>
          <Text style={styles.packageName}>
            {booking.bookingPackage?.name || ""}
          </Text>
          <Text style={styles.guestCount}>{booking.guestCount} guests</Text>
          <Text style={styles.chefName}>
            Chef: {booking.chef.user.fullName}
          </Text>
          <Text style={styles.phone}>Phone: {booking.chef.user.phone}</Text>
        </View>
        <View style={styles.rightSection}>
          <Text numberOfLines={2} ellipsizeMode="tail" style={styles.address}>
            {booking.bookingDetails?.[0]?.location || ""}
          </Text>
          {booking.bookingDetails && booking.bookingDetails[0] && (
            <>
              <Text style={styles.date}>
                Date: {booking.bookingDetails[0].sessionDate}
              </Text>
              <Text style={styles.time}>
                Time: {booking.bookingDetails[0].startTime}
              </Text>
            </>
          )}
          <Text style={styles.guestCount}>Type: {booking.bookingType}</Text>
          <Text style={styles.totalPrice}>
            Total Price: ${booking.totalPrice}
          </Text>
          <Text style={styles.status}>
            Status: {booking.status === "PENDING" ? "PENDING" : "PENDING_FIRST_CYCLE"}
          </Text>
        </View>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={{ flex: 1 }}>
      <FlatList
        data={bookings}
        renderItem={renderItem}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={{ padding: 10 }}
        onEndReached={onLoadMore}
        onEndReachedThreshold={0.1}
        refreshing={refreshing}
        onRefresh={onRefresh}
        ListEmptyComponent={
          <Text style={styles.noOrders}>No pending orders</Text>
        }
      />
    </View>
  );
};

// Component CompletedRoute

export const CompletedRoute = ({
  bookings,
  onLoadMore,
  refreshing,
  onRefresh,
  role,
}) => {
  const [loadingBookingId, setLoadingBookingId] = useState(null);
  const axiosInstance = useAxios();

  const fetchBookingDetails = async (bookingId) => {
    try {
      const response = await axiosInstance.get(`/bookings/${bookingId}/booking-details`);
      const details = response.data.content?.[0]; // Lấy phần tử đầu tiên trong content
      const dishIds = details?.dishes?.map(d => d.dish?.id) || [];
      console.log("bot ngu di", dishIds);
      return dishIds;
    } catch (error) {
      console.error("Error fetching booking details:", error);
      return [];
    }
  };
  

  const handleRebook = async (booking) => {
    setLoadingBookingId(booking.id);
    try {
      const dishIds = await fetchBookingDetails(booking.id);
      router.push({
        pathname: "/screen/booking",
        params: {
          chefId: booking.chef.id,
          bookingPackageId: booking.bookingPackage?.id,
          previousBookingId: booking.id,
          dishIds: JSON.stringify(dishIds),
        },
      });
    } finally {
      setLoadingBookingId(null);
    }
  };

  const renderItem = ({ item: booking }) => (
    <View style={styles.cardContainer}>
      <TouchableOpacity key={booking.id} style={styles.card}>
        <View style={styles.leftSection}>
          <Text style={styles.packageName}>
            {booking.bookingPackage?.name || ""}
          </Text>
          <Text style={styles.guestCount}>{booking.guestCount} guests</Text>
          <Text style={styles.chefName}>
            Chef: {booking.chef.user.fullName}
          </Text>
          <Text style={styles.phone}>Phone: {booking.chef.user.phone}</Text>
        </View>
        <View style={styles.rightSection}>
          <Text style={styles.address}>
            {booking.bookingDetails?.[0]?.location || "N/A"}
          </Text>
          {booking.bookingDetails && booking.bookingDetails[0] && (
            <>
              <Text style={styles.date}>
                Date: {booking.bookingDetails[0].sessionDate}
              </Text>
              <Text style={styles.time}>
                Time: {booking.bookingDetails[0].startTime}
              </Text>
            </>
          )}
          <Text style={styles.totalPrice}>
            Total Price: ${booking.totalPrice}
          </Text>
          <Text style={styles.status}>Status: COMPLETED</Text>
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={styles.reviewButton}
              onPress={() =>
                router.push({
                  pathname: "/screen/review",
                  params: { bookingId: booking.id, chefId: booking.chef.id },
                })
              }
            >
              <Text style={styles.buttonText}>Review</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.rebookButton,
                loadingBookingId === booking.id && styles.disabledButton,
              ]}
              onPress={() => handleRebook(booking)}
              disabled={loadingBookingId === booking.id}
            >
              <Text style={styles.buttonText}>
                {loadingBookingId === booking.id ? "Loading..." : "Rebook"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={{ flex: 1 }}>
      <FlatList
        data={bookings}
        renderItem={renderItem}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={{ padding: 10 }}
        onEndReached={onLoadMore}
        onEndReachedThreshold={0.1}
        refreshing={refreshing}
        onRefresh={onRefresh}
        ListEmptyComponent={
          <Text style={styles.noOrders}>No completed orders</Text>
        }
      />
    </View>
  );
};

// Component ConfirmRoute
export const ConfirmRoute = ({
  bookings,
  onLoadMore,
  refreshing,
  onRefresh,
  role,
}) => {
  const renderItem = ({ item: booking }) => (
    <View style={styles.cardContainer}>
      <TouchableOpacity key={booking.id} style={styles.card}>
        <View style={styles.leftSection}>
          <Text style={styles.packageName}>
            {booking.bookingPackage?.name || ""}
          </Text>
          <Text style={styles.guestCount}>{booking.guestCount} guests</Text>
          <Text style={styles.chefName}>
            Chef: {booking.chef.user.fullName}
          </Text>
          <Text style={styles.phone}>Phone: {booking.chef.user.phone}</Text>
        </View>
        <View style={styles.rightSection}>
          <Text style={styles.address}>
            {booking.bookingDetails?.[0]?.location || ""}
          </Text>
          {booking.bookingDetails && booking.bookingDetails[0] && (
            <>
              <Text style={styles.date}>
                Date: {booking.bookingDetails[0].sessionDate}
              </Text>
              <Text style={styles.time}>
                Time: {booking.bookingDetails[0].startTime}
              </Text>
            </>
          )}
          <Text style={styles.totalPrice}>
            Total Price: ${booking.totalPrice}
          </Text>
          <Text style={styles.status}>
            Status:{" "}
            {booking.status === "CONFIRMED_PARTIALLY_PAID"
              ? "CONFIRMED_PARTIALLY_PAID"
              : booking.status === "CONFIRMED"
              ? "CONFIRMED"
              : "CONFIRMED_PAID"}
          </Text>
        </View>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={{ flex: 1 }}>
      <FlatList
        data={bookings}
        renderItem={renderItem}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={{ padding: 10 }}
        onEndReached={onLoadMore}
        onEndReachedThreshold={0.1}
        refreshing={refreshing}
        onRefresh={onRefresh}
        ListEmptyComponent={
          <Text style={styles.noOrders}>No confirmed orders</Text>
        }
      />
    </View>
  );
};

// Component CancelRoute
export const CancelRoute = ({ bookings, onLoadMore, refreshing, onRefresh, role }) => {
  const renderItem = ({ item: booking }) => (
    <View style={styles.cardContainer}>
      <TouchableOpacity key={booking.id} style={styles.card}>
        <View style={styles.leftSection}>
          <Text style={styles.packageName}>
            {booking.bookingPackage?.name || ""}
          </Text>
          <Text style={styles.guestCount}>{booking.guestCount} guests</Text>
          <Text style={styles.chefName}>
            Chef: {booking.chef.user.fullName}
          </Text>
          <Text style={styles.phone}>Phone: {booking.chef.user.phone}</Text>
        </View>
        <View style={styles.rightSection}>
          <Text style={styles.address}>
            {booking.bookingDetails?.[0]?.location || ""}
          </Text>
          {booking.bookingDetails && booking.bookingDetails[0] && (
            <>
              <Text style={styles.date}>
                Date: {booking.bookingDetails[0].sessionDate}
              </Text>
              <Text style={styles.time}>
                Time: {booking.bookingDetails[0].startTime}
              </Text>
            </>
          )}
          <Text style={styles.totalPrice}>
            Total Price: ${booking.totalPrice}
          </Text>
          <Text style={styles.status}>
            Status: {booking.status === "CANCELED" ? "CANCELED" : "OVERDUE"}
          </Text>
        </View>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={{ flex: 1 }}>
      <FlatList
        data={bookings}
        renderItem={renderItem}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={{ padding: 10 }}
        onEndReached={onLoadMore}
        onEndReachedThreshold={0.1}
        refreshing={refreshing}
        onRefresh={onRefresh}
        ListEmptyComponent={
          <Text style={styles.noOrders}>No cancelled orders</Text>
        }
      />
    </View>
  );
};

// Component PaidDepositRoute
export const PaidDepositRoute = ({
  bookings,
  onLoadMore,
  refreshing,
  onRefresh,
  role,
  onAccept,
  onReject,
}) => {
  const renderItem = ({ item: booking }) => (
    <View style={styles.cardContainer}>
      <TouchableOpacity
        key={booking.id}
        style={{ flexDirection: "row" }}
        onPress={() => {
          if (booking.status === "DEPOSITED") {
            router.push({
              pathname: "/screen/longTermDetails",
              params: {
                bookingId: booking.id,
                chefId: booking.chef.id,
                bookingType: booking.bookingType,
                refreshing: refreshing.toString(),
              },
            });
          }
        }}
      >
        <View style={styles.leftSection}>
          <Text style={styles.packageName}>
            {booking.bookingPackage?.name || ""}
          </Text>
          <Text style={styles.guestCount}>{booking.guestCount} guests</Text>
          <Text style={styles.chefName}>
            Chef: {booking.chef.user.fullName}
          </Text>
          <Text style={styles.phone}>Phone: {booking.chef.user.phone}</Text>
        </View>
        <View style={styles.rightSection}>
          <Text style={styles.address}>
            {booking.bookingDetails?.[0]?.location || ""}
          </Text>
          {booking.bookingDetails && booking.bookingDetails[0] && (
            <>
              <Text style={styles.date}>
                Date: {booking.bookingDetails[0].sessionDate}
              </Text>
              <Text style={styles.time}>
                Time: {booking.bookingDetails[0].startTime}
              </Text>
            </>
          )}
          <Text style={styles.totalPrice}>
            Total Price: ${booking.totalPrice}
          </Text>
          <Text style={styles.status}>
            STATUS:{" "}
            {booking.status === "PAID"
              ? "PAID"
              : booking.status === "DEPOSITED"
              ? "DEPOSITED"
              : "PAID_FIRST_CYCLE"}
          </Text>
        </View>
      </TouchableOpacity>
      {role === "ROLE_CHEF" &&
        (booking.status === "PAID" ||
          booking.status === "PAID_FIRST_CYCLE") && (
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={styles.acceptButton}
              onPress={() => onAccept(booking.id)}
            >
              <Text style={styles.buttonText}>Đồng ý</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.rejectButton}
              onPress={() => onReject(booking.id)}
            >
              <Text style={styles.buttonText}>Từ chối</Text>
            </TouchableOpacity>
          </View>
        )}
    </View>
  );

  return (
    <View style={{ flex: 1 }}>
      <FlatList
        data={bookings}
        renderItem={renderItem}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={{ padding: 10 }}
        onEndReached={onLoadMore}
        onEndReachedThreshold={0.1}
        refreshing={refreshing}
        onRefresh={onRefresh}
        ListEmptyComponent={
          <Text style={styles.noOrders}>No paid/deposit orders</Text>
        }
      />
    </View>
  );
};

// Styles
const styles = StyleSheet.create({
  cardContainer: {
    backgroundColor: "#A9411D",
    borderRadius: 15,
    width: "100%",
    padding: 12,
    marginBottom: 8,
  },
  card: {
    flexDirection: "row",
    width: "100%",
  },
  leftSection: {
    alignItems: "center",
    justifyContent: "center",
    borderRightWidth: 1,
    borderRightColor: "white",
    paddingRight: 15,
    width: "50%",
  },
  rightSection: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  packageName: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
    textAlign: "center",
  },
  guestCount: {
    color: "white",
    fontSize: 12,
    textAlign: "center",
  },
  chefName: {
    color: "white",
    fontStyle: "italic",
    marginTop: 5,
  },
  phone: {
    color: "white",
  },
  address: {
    color: "white",
    textAlign: "center",
  },
  date: {
    color: "white",
    textAlign: "center",
  },
  time: {
    color: "white",
    textAlign: "center",
  },
  totalPrice: {
    color: "white",
    marginVertical: 5,
    textAlign: "center",
  },
  status: {
    color: "white",
    fontWeight: "bold",
    marginTop: 5,
    textAlign: "center",
  },
  noOrders: {
    color: "#9C583F",
    textAlign: "center",
  },
  reviewButton: {
    backgroundColor: "#4CAF50",
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 5,
    marginRight: 5,
  },
  rebookButton: {
    backgroundColor: "#2196F3",
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 5,
  },
  buttonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 14,
  },
  acceptButton: {
    backgroundColor: "#4CAF50",
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 5,
    marginRight: 5,
  },
  rejectButton: {
    backgroundColor: "#F44336",
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 5,
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 10,
  },
});