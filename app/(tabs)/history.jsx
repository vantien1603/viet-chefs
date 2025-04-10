import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import Header from "../../components/header";
import { commonStyles } from "../../style";
import AXIOS_API from "../../config/AXIOS_API";

const PendingRoute = ({ bookings, currentPage, totalPages, onPageChange, refreshBookings }) => {
  return (
    <View style={{ flex: 1 }}>
      <ScrollView style={{ padding: 20 }}>
        {bookings.length > 0 ? (
          bookings.map((booking) => (
            <TouchableOpacity
              key={booking.id}
              style={styles.card}
              onPress={
                booking.status === "PENDING"
                  ? () =>
                      router.push({
                        pathname: "/screen/viewBookingDetails",
                        params: {
                          bookingId: booking.id,
                          chefId: booking.chef.id,
                          bookingType: booking.bookingType,
                          refreshBookings: refreshBookings.toString(), // Truyền callback dưới dạng chuỗi
                        },
                      })
                  : null
              }
            >
              <View style={styles.leftSection}>
                <Text style={styles.packageName}>
                  {booking.bookingPackage?.name || ""}
                </Text>
                <Text style={styles.guestCount}>
                  {booking.guestCount} guests
                </Text>
                <Text style={styles.chefName}>
                  Chef: {booking.chef.user.fullName}
                </Text>
                <Text style={styles.phone}>
                  Phone: {booking.chef.user.phone}
                </Text>
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
                <Text style={styles.guestCount}>
                  Type: {booking.bookingType}
                </Text>
                <Text style={styles.totalPrice}>
                  Total Price: ${booking.totalPrice}
                </Text>
                <Text style={styles.status}>
                  Status:{" "}
                  {booking.status === "PENDING"
                    ? "PENDING"
                    : "PENDING_FIRST_CYCLE"}
                </Text>
              </View>
            </TouchableOpacity>
          ))
        ) : (
          <Text style={styles.noOrders}>No pending orders</Text>
        )}
      </ScrollView>
      <View style={styles.paginationContainer}>
        {Array.from({ length: totalPages }, (_, i) => (
          <TouchableOpacity
            key={i}
            style={[
              styles.pageButton,
              currentPage === i ? styles.activePageButton : null,
            ]}
            onPress={() => onPageChange(i)}
          >
            <Text style={styles.pageText}>{i + 1}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};


const PaidDepositRoute = ({
  bookings,
  currentPage,
  totalPages,
  onPageChange,
}) => (
  <View style={{ flex: 1 }}>
    <ScrollView style={{ padding: 20 }}>
      {bookings.length > 0 ? (
        bookings.map((booking) => (
          <TouchableOpacity
            key={booking.id}
            style={styles.card}
            onPress={() =>
              router.push({
                pathname: "/screen/longTermDetails",
                params: {
                  bookingId: booking.id,
                  chefId: booking.chef.id,
                },
              })
            }
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
        ))
      ) : (
        <Text style={styles.noOrders}>No paid/deposit orders</Text>
      )}
    </ScrollView>
    <View style={styles.paginationContainer}>
      {Array.from({ length: totalPages }, (_, i) => (
        <TouchableOpacity
          key={i}
          style={[
            styles.pageButton,
            currentPage === i ? styles.activePageButton : null,
          ]}
          onPress={() => onPageChange(i)}
        >
          <Text style={styles.pageText}>{i + 1}</Text>
        </TouchableOpacity>
      ))}
    </View>
  </View>
);

const CompletedRoute = ({
  bookings,
  currentPage,
  totalPages,
  onPageChange,
}) => (
  <View style={{ flex: 1 }}>
    <ScrollView style={{ padding: 20 }}>
      {bookings.length > 0 ? (
        bookings.map((booking) => (
          <View key={booking.id} style={styles.card}>
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
              <TouchableOpacity
                style={styles.reviewButton}
                onPress={() =>
                  router.push({
                    pathname: "/screen/review",
                    params: { bookingId: booking.id, chefId: booking.chef.id },
                  })
                }
              >
                <Text style={styles.reviewButtonText}>Review</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))
      ) : (
        <Text style={styles.noOrders}>No completed orders</Text>
      )}
    </ScrollView>
    <View style={styles.paginationContainer}>
      {Array.from({ length: totalPages }, (_, i) => (
        <TouchableOpacity
          key={i}
          style={[
            styles.pageButton,
            currentPage === i ? styles.activePageButton : null,
          ]}
          onPress={() => onPageChange(i)}
        >
          <Text style={styles.pageText}>{i + 1}</Text>
        </TouchableOpacity>
      ))}
    </View>
  </View>
);

const ConfirmRoute = ({ bookings, currentPage, totalPages, onPageChange }) => (
  <View style={{ flex: 1 }}>
    <ScrollView style={{ padding: 20 }}>
      {bookings.length > 0 ? (
        bookings.map((booking) => (
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
        ))
      ) : (
        <Text style={styles.noOrders}>No confirmed orders</Text>
      )}
    </ScrollView>
    <View style={styles.paginationContainer}>
      {Array.from({ length: totalPages }, (_, i) => (
        <TouchableOpacity
          key={i}
          style={[
            styles.pageButton,
            currentPage === i ? styles.activePageButton : null,
          ]}
          onPress={() => onPageChange(i)}
        >
          <Text style={styles.pageText}>{i + 1}</Text>
        </TouchableOpacity>
      ))}
    </View>
  </View>
);

const CancelRoute = ({ bookings, currentPage, totalPages, onPageChange }) => (
  <View style={{ flex: 1 }}>
    <ScrollView style={{ padding: 20 }}>
      {bookings.length > 0 ? (
        bookings.map((booking) => (
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
        ))
      ) : (
        <Text style={styles.noOrders}>No cancelled orders</Text>
      )}
    </ScrollView>
    <View style={styles.paginationContainer}>
      {Array.from({ length: totalPages }, (_, i) => (
        <TouchableOpacity
          key={i}
          style={[
            styles.pageButton,
            currentPage === i ? styles.activePageButton : null,
          ]}
          onPress={() => onPageChange(i)}
        >
          <Text style={styles.pageText}>{i + 1}</Text>
        </TouchableOpacity>
      ))}
    </View>
  </View>
);

const OrderHistories = () => {
  const [selectedTab, setSelectedTab] = useState("pending");
  const [bookings, setBookings] = useState([]);
  const [pageNo, setPageNo] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  const tabs = [
    { key: "pending", title: "Pending" },
    { key: "paidDeposit", title: "Paid/Deposit" },
    { key: "completed", title: "Completed" },
    { key: "confirm", title: "Confirm" },
    { key: "cancel", title: "Cancel" },
  ];

  const PAGE_SIZE = 10;

  const fetchBookingDetails = async (page) => {
    if (isLoading) return;
    setIsLoading(true);
    try {
      const response = await AXIOS_API.get("/bookings/my-bookings", {
        params: {
          pageNo: page,
          pageSize: PAGE_SIZE,
          sortBy: "id",
          sortDir: "desc",
        },
      });

      const bookingData = response.data.content || response.data || [];
      setBookings(bookingData);
      setTotalPages(
        response.data.totalPages ||
          Math.ceil(
            (response.data.totalElements || bookingData.length) / PAGE_SIZE
          )
      );
      setPageNo(page);
    } catch (error) {
      console.error("Error fetching booking details:", error.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBookingDetails(0);
  }, []);

  const handlePageChange = (page) => {
    fetchBookingDetails(page);
  };

  const pendingBookings = bookings.filter(
    (booking) =>
      booking.status === "PENDING" || booking.status === "PENDING_FIRST_CYCLE"
  );
  const paidDepositBookings = bookings.filter(
    (booking) =>
      booking.status === "PAID" ||
      booking.status === "DEPOSITED" ||
      booking.status === "PAID_FIRST_CYCLE"
  );
  const completedBookings = bookings.filter(
    (booking) => booking.status === "COMPLETED"
  );
  const confirmedBookings = bookings.filter(
    (booking) =>
      booking.status === "CONFIRMED" ||
      booking.status === "CONFIRMED_PARTIALLY_PAID" ||
      booking.status === "CONFIRMED_PAID"
  );
  const cancelledBookings = bookings.filter(
    (booking) => booking.status === "CANCELLED" || booking.status === "OVERDUE"
  );

  const renderContent = () => {
    switch (selectedTab) {
      case "pending":
        return (
          <PendingRoute
            bookings={pendingBookings}
            currentPage={pageNo}
            totalPages={totalPages}
            onPageChange={handlePageChange}
            refreshBookings={fetchBookingDetails} // Truyền hàm làm mới
          />
        );
      case "paidDeposit":
        return (
          <PaidDepositRoute
            bookings={paidDepositBookings}
            currentPage={pageNo}
            totalPages={totalPages}
            onPageChange={handlePageChange}
          />
        );
      case "completed":
        return (
          <CompletedRoute
            bookings={completedBookings}
            currentPage={pageNo}
            totalPages={totalPages}
            onPageChange={handlePageChange}
          />
        );
      case "confirm":
        return (
          <ConfirmRoute
            bookings={confirmedBookings}
            currentPage={pageNo}
            totalPages={totalPages}
            onPageChange={handlePageChange}
          />
        );
      case "cancel":
        return (
          <CancelRoute
            bookings={cancelledBookings}
            currentPage={pageNo}
            totalPages={totalPages}
            onPageChange={handlePageChange}
          />
        );
      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={commonStyles.containerContent}>
      <Header title={"History"} />
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.tabContainer}
      >
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[
              styles.tabButton,
              selectedTab === tab.key && styles.activeTabButton,
            ]}
            onPress={() => setSelectedTab(tab.key)}
          >
            <Text
              style={[
                styles.tabText,
                selectedTab === tab.key && styles.activeTabText,
              ]}
            >
              {tab.title}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
      <View style={{ flex: 1 }}>{renderContent()}</View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  tabContainer: {
    flexGrow: 0,
    backgroundColor: "#EBE5DD",
    flexDirection: "row",
  },
  tabButton: {
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderBottomWidth: 0,
  },
  activeTabButton: {
    borderBottomWidth: 3,
    borderBottomColor: "#9C583F",
  },
  tabText: {
    color: "gray",
    fontWeight: "bold",
    fontSize: 14,
  },
  activeTabText: {
    color: "#9C583F",
  },
  card: {
    backgroundColor: "#B9603F",
    flexDirection: "row",
    borderRadius: 15,
    width: "100%",
    padding: 12,
    marginBottom: 15,
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
  paginationContainer: {
    flexDirection: "row",
    justifyContent: "center",
    paddingVertical: 10,
  },
  pageButton: {
    padding: 10,
    marginHorizontal: 5,
    backgroundColor: "#EBE5DD",
    borderRadius: 5,
  },
  activePageButton: {
    backgroundColor: "#9C583F",
  },
  pageText: {
    color: "#000",
    fontWeight: "bold",
  },
  reviewButton: {
    backgroundColor: "#9C583F",
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 10,
    marginTop: 10,
  },
  reviewButtonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 14,
  },
});

export default OrderHistories;
