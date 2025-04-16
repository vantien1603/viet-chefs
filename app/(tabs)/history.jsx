import React, { useState, useEffect, useCallback, useContext } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TabView, SceneMap, TabBar } from 'react-native-tab-view';
import { router } from 'expo-router';
import Header from '../../components/header';
import { commonStyles } from '../../style';
import useAxios from '../../config/AXIOS_API';
import { AuthContext } from '../../config/AuthContext';
import { useCommonNoification } from '../../context/commonNoti';

const PendingRoute = ({ bookings, onLoadMore, refreshing, onRefresh, payment }) => {
  const renderItem = ({ item: booking }) => (
    <View style={{
      backgroundColor: "#B9603F",
      borderRadius: 15,
      width: "100%",
      justifyContent: 'center',
      padding: 12,
      marginBottom: 15,
      // height: 300,
    }}>
      <TouchableOpacity
        key={booking.id}
        style={styles.card}
        onPress={() => {
          ((booking.status === "PENDING" ||
            booking.status === "PENDING_FIRST_CYCLE") &&
            booking.bookingType === "SINGLE") ?
            payment(booking.id)
            :
            (booking.bookingType === "LONG_TERM") &&
            router.push({
              pathname: "/screen/longTermDetails",
              params: {
                bookingId: booking.id,
                chefId: booking.chef.id,
              },
            })
        }
          // (booking.status === "PENDING" || booking.status === "PENDING_FIRST_CYCLE") &&
          //   booking.bookingType === "LONG_TERM"
          // ? () =>
          //   router.push({
          //     pathname: "/screen/longTermDetails",
          //     params: {
          //       bookingId: booking.id,
          //       chefId: booking.chef.id,
          //     },
          //   })
          // : null

        }
      >
        <View style={styles.leftSection}>
          <Text style={styles.packageName}>{booking.bookingPackage?.name || ""}</Text>
          <Text style={styles.guestCount}>{booking.guestCount} guests</Text>
          <Text style={styles.chefName}>Chef: {booking.chef.user.fullName}</Text>
          <Text style={styles.phone}>Phone: {booking.chef.user.phone}</Text>
        </View>
        <View style={styles.rightSection}>
          <Text numberOfLines={2} ellipsizeMode="tail" style={styles.address}>
            {booking.bookingDetails?.[0]?.location || ""}
          </Text>
          {booking.bookingDetails && booking.bookingDetails[0] && (
            <>
              <Text style={styles.date}>Date: {booking.bookingDetails[0].sessionDate}</Text>
              <Text style={styles.time}>Time: {booking.bookingDetails[0].startTime}</Text>
            </>
          )}
          <Text style={styles.guestCount}>Type: {booking.bookingType}</Text>
          <Text style={styles.totalPrice}>Total Price: ${booking.totalPrice}</Text>
          <Text style={styles.status}>
            Status: {booking.status === "PENDING" ? "PENDING" : "PENDING_FIRST_CYCLE"}
          </Text>
        </View>


      </TouchableOpacity>

    </View >

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
        ListEmptyComponent={<Text style={styles.noOrders}>No pending orders</Text>}
      />
    </View>
  );
};

const PaidDepositRoute = ({ bookings, onLoadMore, refreshing, onRefresh, onAccept, onReject }) => {
  const renderItem = ({ item: booking }) => (
    <View style={{
      backgroundColor: "#B9603F",
      // flexDirection: "row",
      borderRadius: 15,
      width: "100%",
      // height: 300,

      padding: 12,
      marginBottom: 15,
    }}>
      <TouchableOpacity key={booking.id} style={{ flexDirection: "row" }}>
        <View style={styles.leftSection}>
          <Text style={styles.packageName}>{booking.bookingPackage?.name || ""}</Text>
          <Text style={styles.guestCount}>{booking.guestCount} guests</Text>
          <Text style={styles.chefName}>Chef: {booking.chef.user.fullName}</Text>
          <Text style={styles.phone}>Phone: {booking.chef.user.phone}</Text>
        </View>
        <View style={styles.rightSection}>
          <Text style={styles.address}>{booking.bookingDetails?.[0]?.location || ""}</Text>
          {booking.bookingDetails && booking.bookingDetails[0] && (
            <>
              <Text style={styles.date}>Date: {booking.bookingDetails[0].sessionDate}</Text>
              <Text style={styles.time}>Time: {booking.bookingDetails[0].startTime}</Text>
            </>
          )}
          <Text style={styles.totalPrice}>Total Price: ${booking.totalPrice}</Text>
          <Text style={styles.status}>
            STATUS: {booking.status === "PAID" ? "PAID" : booking.status === "DEPOSIT" ? "DEPOSITED" : "PAID_FIRST_CYCLE"}
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
        contentContainerStyle={{ padding: 20 }}
        onEndReached={onLoadMore}
        onEndReachedThreshold={0.1}
        refreshing={refreshing}
        onRefresh={onRefresh}
        ListEmptyComponent={<Text style={styles.noOrders}>No paid/deposit orders</Text>}
      />
    </View>
  );
};

const CompletedRoute = ({ bookings, onLoadMore, refreshing, onRefresh }) => {
  const renderItem = ({ item: booking }) => (
    <View key={booking.id} style={styles.card}>
      <View style={styles.leftSection}>
        <Text style={styles.packageName}>{booking.bookingPackage?.name || ""}</Text>
        <Text style={styles.guestCount}>{booking.guestCount} guests</Text>
        <Text style={styles.chefName}>Chef: {booking.chef.user.fullName}</Text>
        <Text style={styles.phone}>Phone: {booking.chef.user.phone}</Text>
      </View>
      <View style={styles.rightSection}>
        <Text style={styles.address}>{booking.bookingDetails?.[0]?.location || "N/A"}</Text>
        {booking.bookingDetails && booking.bookingDetails[0] && (
          <>
            <Text style={styles.date}>Date: {booking.bookingDetails[0].sessionDate}</Text>
            <Text style={styles.time}>Time: {booking.bookingDetails[0].startTime}</Text>
          </>
        )}
        <Text style={styles.totalPrice}>Total Price: ${booking.totalPrice}</Text>
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
  );

  return (
    <View style={{ flex: 1 }}>
      <FlatList
        data={bookings}
        renderItem={renderItem}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={{ padding: 20 }}
        onEndReached={onLoadMore}
        onEndReachedThreshold={0.1}
        refreshing={refreshing}
        onRefresh={onRefresh}
        ListEmptyComponent={<Text style={styles.noOrders}>No completed orders</Text>}
      />
    </View>
  );
};

const ConfirmRoute = ({ bookings, onLoadMore, refreshing, onRefresh }) => {
  const renderItem = ({ item: booking }) => (
    <TouchableOpacity key={booking.id} style={styles.card}>
      <View style={styles.leftSection}>
        <Text style={styles.packageName}>{booking.bookingPackage?.name || ""}</Text>
        <Text style={styles.guestCount}>{booking.guestCount} guests</Text>
        <Text style={styles.chefName}>Chef: {booking.chef.user.fullName}</Text>
        <Text style={styles.phone}>Phone: {booking.chef.user.phone}</Text>
      </View>
      <View style={styles.rightSection}>
        <Text style={styles.address}>{booking.bookingDetails?.[0]?.location || ""}</Text>
        {booking.bookingDetails && booking.bookingDetails[0] && (
          <>
            <Text style={styles.date}>Date: {booking.bookingDetails[0].sessionDate}</Text>
            <Text style={styles.time}>Time: {booking.bookingDetails[0].startTime}</Text>
          </>
        )}
        <Text style={styles.totalPrice}>Total Price: ${booking.totalPrice}</Text>
        <Text style={styles.status}>
          Status: {booking.status === "CONFIRMED_PARTIALLY_PAID" ? "CONFIRMED_PARTIALLY_PAID" : booking.status === "CONFIRMED" ? "CONFIRMED" : "CONFIRMED_PAID"}
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={{ flex: 1 }}>
      <FlatList
        data={bookings}
        renderItem={renderItem}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={{ padding: 20 }}
        onEndReached={onLoadMore}
        onEndReachedThreshold={0.1}
        refreshing={refreshing}
        onRefresh={onRefresh}
        ListEmptyComponent={<Text style={styles.noOrders}>No confirmed orders</Text>}
      />
    </View>
  );
};

const CancelRoute = ({ bookings, onLoadMore, refreshing, onRefresh }) => {
  const renderItem = ({ item: booking }) => (
    <TouchableOpacity key={booking.id} style={styles.card}>
      <Text>{booking.id}</Text>
      <View style={styles.leftSection}>
        <Text style={styles.packageName}>{booking.bookingPackage?.name || ""}</Text>
        <Text style={styles.guestCount}>{booking.guestCount} guests</Text>
        <Text style={styles.chefName}>Chef: {booking.chef.user.fullName}</Text>
        <Text style={styles.phone}>Phone: {booking.chef.user.phone}</Text>
      </View>
      <View style={styles.rightSection}>
        <Text style={styles.address}>{booking.bookingDetails?.[0]?.location || ""}</Text>
        {booking.bookingDetails && booking.bookingDetails[0] && (
          <>
            <Text style={styles.date}>Date: {booking.bookingDetails[0].sessionDate}</Text>
            <Text style={styles.time}>Time: {booking.bookingDetails[0].startTime}</Text>
          </>
        )}
        <Text style={styles.totalPrice}>Total Price: ${booking.totalPrice}</Text>
        <Text style={styles.status}>
          Status: {booking.status === "CANCELED" ? "CANCELED" : "OVERDUE"}
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={{ flex: 1 }}>
      <FlatList
        data={bookings}
        renderItem={renderItem}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={{ padding: 20 }}
        onEndReached={onLoadMore}
        onEndReachedThreshold={0.1}
        refreshing={refreshing}
        onRefresh={onRefresh}
        ListEmptyComponent={<Text style={styles.noOrders}>No cancelled orders</Text>}
      />
    </View>
  );
};

const OrderHistories = () => {
  const { user } = useContext(AuthContext);

  const [index, setIndex] = useState(0);
  const [routes] = useState([
    { key: "pending", title: "Pending" },
    { key: "paidDeposit", title: "Paid/Deposit" },
    { key: "completed", title: "Completed" },
    { key: "confirm", title: "Confirm" },
    { key: "cancel", title: "Cancel" },
  ]);
  const [bookings, setBookings] = useState([]);
  const [pageNo, setPageNo] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const axiosInstance = useAxios();
  const [loading, setLoading] = useState(false);
  const PAGE_SIZE = 10;
  const { showModal } = useCommonNoification();
  const fetchRequestBooking = async (page, isRefresh = false) => {
    console.log("Request");
    if (isLoading && !isRefresh) return;
    setIsLoading(true);
    try {
      const response = await axiosInstance.get("/bookings/chefs/my-bookings", {
        params: {
          pageNo: page,
          pageSize: PAGE_SIZE,
          sortBy: "id",
          sortDir: "desc",
        },
      });



      const bookingData = response.data.content || response.data || [];
      setBookings(prev => {
        const newData = isRefresh ? bookingData : [...prev, ...bookingData];
        const uniqueData = Array.from(new Map(newData.map(item => [item.id, item])).values());
        return uniqueData;
      });
      setTotalPages(
        response.data.totalPages ||
        Math.ceil((response.data.totalElements || bookingData.length) / PAGE_SIZE)
      );
      setPageNo(page);
    } catch (error) {
      console.error("Error fetching booking details:", error.message);
    } finally {
      setIsLoading(false);
      if (isRefresh) setRefreshing(false);
    }
  }


  const fetchBookingDetails = async (page, isRefresh = false) => {
    console.log("Booking");

    if (isLoading && !isRefresh) return;
    setIsLoading(true);
    try {
      const response = await axiosInstance.get("/bookings/my-bookings", {
        params: {
          pageNo: page,
          pageSize: PAGE_SIZE,
          sortBy: "id",
          sortDir: "desc",
        },
      });



      const bookingData = response.data.content || response.data || [];
      // setBookings(prev => isRefresh ? bookingData : [...prev, ...bookingData]);
      setBookings(prev => {
        const newData = isRefresh ? bookingData : [...prev, ...bookingData];
        const uniqueData = Array.from(new Map(newData.map(item => [item.id, item])).values());
        return uniqueData;
      });
      setTotalPages(
        response.data.totalPages ||
        Math.ceil((response.data.totalElements || bookingData.length) / PAGE_SIZE)
      );
      setPageNo(page);
    } catch (error) {
      console.error("Error fetching booking details:", error.message);
    } finally {
      setIsLoading(false);
      if (isRefresh) setRefreshing(false);
    }
  };

  const handleReject = (id) => {
    try {
      setLoading(true);
      const response = axiosInstance.put(`/bookings/${id}/reject`);
      fetchRequestBooking(0, true)
      showModal("Success", "Reject successfully");

    } catch (error) {
      if (error.response) {
        console.error(`Lỗi ${error.response.status}:`, error.response.data);
      }
      else {
        console.error(error.message);
      }
    } finally {
      setLoading(false);
    }
  }

  const handleAccept = (id) => {
    try {
      setLoading(true);
      const response = axiosInstance.put(`/bookings/${id}/confirm`);
      showModal("Success", "Confirmed successfully");
      fetchRequestBooking(0, true)
    } catch (error) {
      if (error.response) {
        console.error(`Lỗi ${error.response.status}:`, error.response.data);
      }
      else {
        console.error(error.message);
      }
    } finally {
      setLoading(false);
    }
  }

  const handlePayment = async (id) => {
    // try {
    //   setLoading(true);
    //   const response = await axiosInstance.post(`/bookings/${id}/payment`, {});
    //   if (response.status === 200) {
    //     showModal("Success", "Payment successfully");
    //     fetchBookingDetails(0, true);
    //   }
    // } catch (error) {
    //   if (error.response) {
    //     console.error(`Lỗi ${error.response.status}:`, error.response.data);
    //   }
    //   else {
    //     console.error(error.message);
    //   }
    // } finally {
    //   setLoading(false);
    // }

  }

  useEffect(() => {
      fetchBookingDetails(0);
  }, []);

  const handleLoadMore = () => {
    if (pageNo < totalPages - 1 && !isLoading) {
     fetchBookingDetails(pageNo + 1);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setBookings([]);
    fetchBookingDetails(0, true);
  }, []);

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

  const renderScene = SceneMap({
    pending: () => (
      <PendingRoute
        bookings={pendingBookings}
        onLoadMore={handleLoadMore}
        refreshing={refreshing}
        onRefresh={onRefresh}
        payment={handlePayment}
      />
    ),
    paidDeposit: () => (
      <PaidDepositRoute
        bookings={paidDepositBookings}
        onLoadMore={handleLoadMore}
        refreshing={refreshing}
        onRefresh={onRefresh}
        onAccept={handleAccept}
        onReject={handleReject}
      />
    ),

    confirm: () => (
      <ConfirmRoute
        bookings={confirmedBookings}
        onLoadMore={handleLoadMore}
        refreshing={refreshing}
        onRefresh={onRefresh}

      />
    ),
    completed: () => (
      <CompletedRoute
        bookings={completedBookings}
        onLoadMore={handleLoadMore}
        refreshing={refreshing}
        onRefresh={onRefresh}

      />
    ),
    cancel: () => (
      <CancelRoute
        bookings={cancelledBookings}
        onLoadMore={handleLoadMore}
        refreshing={refreshing}
        onRefresh={onRefresh}

      />
    ),
  });

  return (
    <SafeAreaView style={commonStyles.containerContent}>
      <Header title={'History'} />
      <View style={{ flex: 1 }}>
        <TabView
          navigationState={{ index, routes }}
          renderScene={renderScene}
          onIndexChange={setIndex}
          renderTabBar={(props) => (
            <TabBar
              {...props}
              scrollEnabled={true}
              indicatorStyle={{ backgroundColor: '#9C583F', height: 3 }}
              style={{
                backgroundColor: '#EBE5DD',
                elevation: 0,
                shadowOpacity: 0,
                borderBottomWidth: 0,
              }}
              activeColor="#9C583F"
              inactiveColor="gray"
              labelStyle={{ fontWeight: 'bold' }}
            />
          )}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  tabContainer: {
    flexGrow: 0,
    backgroundColor: "#EBE5DD",
    flexDirection: "row",
    flexDirection: "row",
  },
  tabButton: {
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderBottomWidth: 0,
    borderBottomWidth: 0,
  },
  activeTabButton: {
    borderBottomWidth: 3,
    borderBottomColor: "#9C583F",
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
    color: "#9C583F",
  },
  card: {
    backgroundColor: "#B9603F",
    flexDirection: "row",
    borderRadius: 15,
    width: "100%",
    // height: 300,

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
  }, acceptButton: {
    backgroundColor: "#4CAF50", // Màu xanh cho nút Đồng ý
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 5,
    marginRight: 5,
  },
  rejectButton: {
    backgroundColor: "#F44336", // Màu đỏ cho nút Từ chối
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 5,
  },
  buttonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "bold",
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 10,
  },
});

export default OrderHistories;