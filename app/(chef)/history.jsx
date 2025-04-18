import React, { useCallback, useContext, useEffect, useState } from 'react'
import { FlatList, StyleSheet, Text, View, TouchableOpacity } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import Header from '../../components/header'
import { SceneMap, TabBar, TabView } from 'react-native-tab-view'
import { commonStyles } from '../../style'
import useAxios from '../../config/AXIOS_API'
import { AuthContext } from '../../config/AuthContext'
import { useNavigation } from '@react-navigation/native'
import { useCommonNoification } from '../../context/commonNoti'


const BookingHistories = ({ bookings, onLoadMore, refreshing, onRefresh, onAccept, onReject, onCancel, onViewDetail }) => {
  // console.log("renderrr", bookings);
  const renderItem = ({ item }) => {
    let sessionDateDisplay = '';

    if (
      item.bookingType === 'SINGLE' &&
      Array.isArray(item.bookingDetails) &&
      item.bookingDetails.length > 0
    ) {
      sessionDateDisplay = item.bookingDetails[0]?.sessionDate || '';
    } else if (
      item.bookingType === 'LONG_TERM' &&
      Array.isArray(item.bookingDetails) &&
      item.bookingDetails.length > 0
    ) {
      const details = item.bookingDetails
        .map((d) => d?.sessionDate)
        .filter(Boolean)
        .sort();

      if (details.length <= 5) {
        const grouped = {};

        for (let date of details) {
          const [year, month, day] = date.split('-');
          const key = `${year}-${month}`;
          if (!grouped[key]) grouped[key] = [];
          grouped[key].push(day.replace(/^0/, ''));
        }

        const formatted = Object.entries(grouped)
          .map(([key, days]) => `${key}-${days.join(',')}`)
          .join(' | ');

        sessionDateDisplay = formatted;
      } else {
        const first = details[0];
        const last = details[details.length - 1];
        sessionDateDisplay = `${first} ~ ${last}`;
      }
    }

    return (
      <View key={item.id} style={styles.section}>
        <TouchableOpacity onPress={() => onViewDetail(item.id)} >
          <View style={{ flexDirection: 'row', padding: 1, justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={{ fontSize: 14, fontWeight: 'bold' }}>Date: {sessionDateDisplay}</Text>
            <Text style={[styles.itemContentLabel, { textAlign: 'right', fontSize: 20 }]}>${item.totalPrice}</Text>
          </View>
          <Text numberOfLines={1} ellipsizeMode="tail">
            <Text style={styles.itemContentLabel}>Customer: </Text>
            <Text style={{ fontSize: 16, fontWeight: "bold" }}>{item.customer.fullName}</Text>
          </Text>
          <Text numberOfLines={1} ellipsizeMode="tail">
            <Text style={styles.itemContentLabel}>Phone: </Text>
            <Text style={styles.itemContent}>{item.customer.phone}</Text>
          </Text>
          <Text numberOfLines={1} ellipsizeMode="tail">
            <Text style={styles.itemContentLabel}>Address: </Text>
            <Text style={styles.itemContent}>46/1 Tan Hoa 2, Hiep Phu, Q9</Text>
          </Text>
          <Text>
            <Text style={styles.itemContentLabel}>Booking type: </Text>
            <Text style={styles.itemContent}>{item.bookingType === "LONG_TERM" ? item.bookingPackage.name : item.bookingType}</Text>
          </Text>
          <Text>
            <Text style={styles.itemContentLabel}>Guest: </Text>
            <Text style={styles.itemContent}>{item.guestCount}</Text>
          </Text>
          <Text numberOfLines={2} ellipsizeMode="tail">
            <Text style={styles.itemContentLabel}>Note: </Text>
            <Text style={styles.itemContent}>{item.requestDetails}</Text>
          </Text>
          {/* <Text style={[styles.itemContentLabel,{textAlign:'right', fontSize:20}]}>${item.totalPrice}</Text> */}
        </TouchableOpacity>
        {item.status === "PAID" || item.status === "DEPOSITED" || item.status === "PAID_FIRST_CYCLE" ? (
          <View style={{ flexDirection: 'row', padding: 1, justifyContent: 'space-around' }}>
            <TouchableOpacity style={{ backgroundColor: "green", padding: 10, borderRadius: 10, width: "30%" }} onPress={() => onAccept(item.id)}>
              <Text style={{ textAlign: 'center', color: 'white' }}>Confirm</Text>
            </TouchableOpacity>
            <TouchableOpacity style={{ backgroundColor: "red", padding: 10, borderRadius: 10, width: "30%" }} onPress={() => onReject(item.id)}>
              <Text style={{ textAlign: 'center', color: 'white' }}>Reject</Text>
            </TouchableOpacity>
          </View>
        ) : item.status === "CONFIRMED_PAID" || item.status === "CONFIRMED_PARTIALLY_PAID" || item.status === "CONFIRMED" && (
          <View style={{ flexDirection: 'row', padding: 1, justifyContent: 'flex-end' }}>
            <TouchableOpacity style={{ backgroundColor: "red", padding: 10, borderRadius: 10, width: "30%" }} onPress={() => onCancel(item.id, item.bookingType === "SINGLE" && "single")}>
              <Text style={{ textAlign: 'center', color: 'white' }}>Cancel</Text>
            </TouchableOpacity>
          </View>
        )}

      </View>

    )
  }
  return (
    <View style={{ flex: 1 }}>
      <FlatList
        data={bookings}
        renderItem={renderItem}
        contentContainerStyle={{ paddingHorizontal: 10 }}
        keyExtractor={(item) => item.id.toString()}
        onEndReached={onLoadMore}
        onEndReachedThreshold={0.4}
        refreshing={refreshing}
        onRefresh={onRefresh}
        ListEmptyComponent={<Text style={{ textAlign: 'center', fontSize: 16 }}>No pending orders</Text>}
        ListFooterComponent={() => <View style={{ height: 100 }} />}
      />
    </View>
  );
};

const Histories = () => {
  const { user } = useContext(AuthContext);
  const axiosInstance = useAxios();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refresh, setRefresh] = useState(false);
  const [newBooking, setNewBooking] = useState([]);
  const [confirmBooking, setConfirmBooking] = useState([]);
  const [cancelBooking, setCancelBooking] = useState([]);
  const PAGE_SIZE = 10;
  const [totalPages, setTotalPages] = useState(0);
  const [page, setPage] = useState(0);
  const [index, setIndex] = React.useState(0);
  const navigation = useNavigation();
  const [routes] = React.useState([
    { key: 'new', title: 'New' },
    { key: 'confirmed', title: 'Confirmed' },
    { key: 'canceled', title: 'Canceled' },
  ]);

  const { showModal } = useCommonNoification();

  useEffect(() => {
    fetchRequestBooking(0, true);
  }, []);
  let d = 0

  const fetchRequestBooking = async (page, isRefresh = false) => {

    if (loading && !isRefresh) return;
    setLoading(true);
    try {
      const response = await axiosInstance.get("/bookings/chefs/my-bookings", {
        params: {
          pageNo: page,
          pageSize: PAGE_SIZE,
          sortBy: "id",
          sortDir: "asc",
        },
      });

      if (response.status === 200) {
        const bookingData = response.data.content || response.data || [];
        setTotalPages(response.data.totalPages);

        // setBookings(prev => {
        //   const newData = isRefresh ? bookingData : [...prev, ...bookingData];
        //   const uniqueData = Array.from(new Map(newData.map(item => [item.id, item])).values());
        //   return uniqueData;
        // });

        // const updatedList = (isRefresh ? bookingData : [...bookings, ...bookingData]);
        // const uniqueData = Array.from(new Map(updatedList.map(item => [item.id, item])).values());

        // console.log("kasd", updatedList.length)
        // setBookings((prevList) => {
        //   return isRefresh ? bookingData : [...prevList, ...bookingData];
        // });

        setBookings(isRefresh ? bookingData : (pre) => [...pre, ...bookingData]);

        if (isRefresh) {
          setNewBooking(bookingData.filter((booking) =>
            booking.status === "PAID" ||
            booking.status === "DEPOSITED" ||
            booking.status === "PAID_FIRST_CYCLE"
          ));
          setConfirmBooking(bookingData.filter((booking) =>
            booking.status === "CONFIRMED" ||
            booking.status === "CONFIRMED_PARTIALLY_PAID" ||
            booking.status === "CONFIRMED_PAID"
          ));
          setCancelBooking(bookingData.filter((booking) =>
            booking.status === "CANCELLED" ||
            booking.status === "OVERDUE"
          ));
        } else {
          setNewBooking((pre) => [
            ...pre,
            ...bookingData.filter((booking) =>
              booking.status === "PAID" ||
              booking.status === "DEPOSITED" ||
              booking.status === "PAID_FIRST_CYCLE"
            ),
          ]);

          setConfirmBooking((pre) => [
            ...pre,
            ...bookingData.filter((booking) =>
              booking.status === "CONFIRMED" ||
              booking.status === "CONFIRMED_PARTIALLY_PAID" ||
              booking.status === "CONFIRMED_PAID"
            ),
          ]);

          setCancelBooking((pre) => [
            ...pre,
            ...bookingData.filter((booking) =>
              booking.status === "CANCELED" ||
              booking.status === "OVERDUE"
            ),
          ]);
        }

      }
    } catch (error) {
      console.error("Error fetching booking details:", error.message);
    } finally {
      setLoading(false);
      setRefresh(false);
    }
  }



  const loadMoreData = async () => {
    console.log('cc');
    if (!loading && page + 1 <= totalPages - 1) {
      let c = 1
      console.log("goi load more lan", c++)
      const nextPage = page + 1;
      setPage(nextPage);
      await fetchRequestBooking(nextPage);
    }
  };
  const handleRefresh = async () => {
    setRefresh(true);
    setPage(0);
    await fetchRequestBooking(0, true);
    setRefresh(false);
  };


  const handleReject = async (id) => {
    setLoading(true);
    try {
      setLoading(true);
      const response = await axiosInstance.put(`/bookings/${id}/reject`);
      if (response.status === 200) {
        showModal("Success", "Reject successfully");
        fetchRequestBooking(0, true)
      }

    } catch (error) {
      if (error.response) {
        const mes = error.response.data.message;
        console.log(mes);
        showModal("Error", mes);
      }
      else {
        console.error(error.message);
      }
    } finally {
      setLoading(false);
    }
  }

  const handleAccept = async (id) => {
    setLoading(true);
    try {
      setLoading(true);
      const response = await axiosInstance.put(`/bookings/${id}/confirm`);
      if (response.status === 200) {
        showModal("Success", "Confirmed successfully");
        fetchRequestBooking(0, true)
      }
    } catch (error) {
      if (error.response) {
        const mes = error.response.data.message;
        console.log(mes);
        showModal("Error", mes);
      }
      else {
        console.error(error.message);
      }
    } finally {
      setLoading(false);
    }
  }

  const handleCancel = async (id, type) => {
    console.log("asdasdasd");
    setLoading(true);
    try {
      const response = type = "single" ? await axiosInstance.put(`/bookings/single/cancel/${id}`) : await axiosInstance.put(`/bookings/long-term/cancel/${id}`);
      if (response.status === 200) {
        showModal("Success", "Cancel successfully");
        fetchRequestBooking(0, true)
      }
    } catch (error) {
      if (error.response) {
        const mes = error.response.data.message;
        console.log(mes);
        showModal("Error", mes);
      }
      else {
        console.error(error.message);
      }
    } finally {
      setLoading(false);
    }
  }


  // const viewDetail = (id) => {
  //   navigation.navigate("screen/detailsBooking", { bookingId: id });
  // }
  const viewDetail = useCallback((id) => {
    console.log("goi ne")
    navigation.navigate("screen/detailsBooking", { bookingId: id });
  }, []);




  // const renderScene = SceneMap({
  //   new: () => (
  //     <BookingHistories
  //       bookings={newBooking}
  //       onLoadMore={loadMoreData}
  //       refreshing={refresh}
  //       onRefresh={handleRefresh}
  //       onAccept={handleAccept}
  //       onReject={handleReject}
  //       onViewDetail={viewDetail}
  //     />
  //   ),
  //   confirmed: () => (
  //     <BookingHistories
  //       bookings={confirmBooking}
  //       onLoadMore={loadMoreData}
  //       refreshing={refresh}
  //       onRefresh={handleRefresh}
  //       onCancel={handleRefresh}
  //       onViewDetail={viewDetail}
  //     />
  //   ),

  //   canceled: () => (
  //     <BookingHistories
  //       bookings={cancelBooking}
  //       onLoadMore={loadMoreData}
  //       refreshing={refresh}
  //       onRefresh={handleRefresh}
  //       onViewDetail={viewDetail}
  //     />
  //   ),
  // });

  const renderScene = ({ route }) => {
    switch (route.key) {
      case 'new':
        return (
          <BookingHistories
            bookings={newBooking}
            onLoadMore={loadMoreData}
            refreshing={refresh}
            onRefresh={handleRefresh}
            onAccept={handleAccept}
            onReject={handleReject}
            onViewDetail={viewDetail}
          />
        );
      case 'confirmed':
        return (
          <BookingHistories
            bookings={confirmBooking}
            onLoadMore={loadMoreData}
            refreshing={refresh}
            onRefresh={handleRefresh}
            onCancel={handleCancel}
            onViewDetail={viewDetail}
          />
        );
      case 'canceled':
        return (
          <BookingHistories
            bookings={cancelBooking}
            onLoadMore={loadMoreData}
            refreshing={refresh}
            onRefresh={handleRefresh}
            onViewDetail={viewDetail}
          />
        );
      default:
        return null;
    }
  };


  return (
    <SafeAreaView style={commonStyles.container}>
      <Header title={"Orders"} />
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
  )
}


const styles = StyleSheet.create({
  section: {
    gap: 5,
    maxHeight: 300,
    backgroundColor: "#F9F5F0",
    marginVertical: 10,
    padding: 25,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
    // marginHorizontal: 10,
  },
  itemContentLabel: {
    fontWeight: 'bold'
  },
  itemContent: {
    fontSize: 14
  }
});
export default Histories
