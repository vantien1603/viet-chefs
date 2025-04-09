import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TabView, SceneMap, TabBar } from 'react-native-tab-view';
import { router } from 'expo-router';
import Header from '../../components/header';
import { commonStyles } from '../../style';
import useAxios from '../../config/AXIOS_API';

const BookingCard = ({ booking, status }) => (
  <TouchableOpacity
    style={styles.card}
    onPress={
      booking.status === 'PENDING' && booking.bookingType === 'LONG_TERM'
        ? () =>
            router.push({
              pathname: '/screen/longTermDetails',
              params: { bookingId: booking.id },
            })
        : null
    }
  >
    <View style={styles.leftSection}>
      <Text style={styles.packageName}>{booking.bookingPackage?.name || 'N/A'}</Text>
      <Text style={styles.guestCount}>{booking.guestCount} guests</Text>
      <Text style={styles.chefName}>Chef: {booking.chef.user.fullName}</Text>
      <Text style={styles.phone}>Phone: {booking.chef.user.phone}</Text>
    </View>
    <View style={styles.rightSection}>
      <Text style={styles.address}>{booking.bookingDetails?.[0]?.location || 'N/A'}</Text>
      {booking.bookingDetails?.[0] && (
        <>
          <Text style={styles.date}>Date: {booking.bookingDetails[0].sessionDate}</Text>
          <Text style={styles.time}>Time: {booking.bookingDetails[0].startTime}</Text>
        </>
      )}
      <Text style={styles.totalPrice}>Total Price: ${booking.totalPrice}</Text>
      <Text style={styles.status}>Status: {status}</Text>
    </View>
  </TouchableOpacity>
);

const BookingList = ({ bookings, onRefresh, refreshing, onEndReached, status, isLoading }) => (
  <FlatList
    contentContainerStyle={{ padding: 20 }}
    data={bookings}
    keyExtractor={(item) => item.id.toString()}
    renderItem={({ item }) => <BookingCard booking={item} status={status} />}
    ListEmptyComponent={<Text style={styles.noOrders}>No {status.toLowerCase()} orders</Text>}
    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    onEndReached={onEndReached}
    onEndReachedThreshold={0.2}
    initialNumToRender={10}
    ListFooterComponent={isLoading ? <Text style={styles.loading}>Loading more...</Text> : null}
  />
);

const OrderHistories = () => {
  const [index, setIndex] = useState(0);
  const [routes] = useState([
    { key: 'new', title: 'Waiting' },
    { key: 'processing', title: 'Repeat' },
    { key: 'completed', title: 'Completed' },
  ]);
  const [newBookings, setNewBookings] = useState([]);
  const [processingBookings, setProcessingBookings] = useState([]);
  const [completedBookings, setCompletedBookings] = useState([]);
  const [pageNo, setPageNo] = useState({ new: 0, processing: 0, completed: 0 });
  const [totalPages, setTotalPages] = useState({ new: 1, processing: 1, completed: 1 });
  const [isLoading, setIsLoading] = useState({ new: false, processing: false, completed: false });
  const [refreshing, setRefreshing] = useState({ new: false, processing: false, completed: false });
  const PAGE_SIZE = 10;
  const axiosInstance = useAxios();

  const fetchBookingDetails = async (page, statusFilter, isRefresh = false) => {
    const key = statusFilter.toLowerCase();
    if (isLoading[key] || refreshing[key]) return;

    if (isRefresh) {
      setRefreshing((prev) => ({ ...prev, [key]: true }));
    } else {
      setIsLoading((prev) => ({ ...prev, [key]: true }));
    }

    try {
      const response = await axiosInstance.get('/bookings/users/my-bookings', {
        params: {
          pageNo: page,
          pageSize: PAGE_SIZE,
          sortBy: 'id',
          sortDir: 'desc',
          status: statusFilter,
        },
      });

      const bookingData = response.data.content || [];
      if (key === 'pending') {
        if (isRefresh || page === 0) setNewBookings(bookingData);
        else setNewBookings((prev) => [...prev, ...bookingData]);
      } else if (key === 'processing') {
        if (isRefresh || page === 0) setProcessingBookings(bookingData);
        else setProcessingBookings((prev) => [...prev, ...bookingData]);
      } else if (key === 'completed') {
        if (isRefresh || page === 0) setCompletedBookings(bookingData);
        else setCompletedBookings((prev) => [...prev, ...bookingData]);
      }

      setTotalPages((prev) => ({ ...prev, [key]: response.data.totalPages || 1 }));
      setPageNo((prev) => ({ ...prev, [key]: page }));
    } catch (error) {
      console.error(`Error fetching ${statusFilter} bookings:`, error.message);
    } finally {
      if (isRefresh) setRefreshing((prev) => ({ ...prev, [key]: false }));
      else setIsLoading((prev) => ({ ...prev, [key]: false }));
    }
  };

  useEffect(() => {
    fetchBookingDetails(0, 'PENDING');
    fetchBookingDetails(0, 'PROCESSING');
    fetchBookingDetails(0, 'COMPLETED');
  }, []);

  const handleRefresh = (status) => {
    fetchBookingDetails(0, status, true);
  };

  const handleLoadMore = (status) => {
    const key = status.toLowerCase();
    if (isLoading[key] || pageNo[key] + 1 >= totalPages[key]) return;
    fetchBookingDetails(pageNo[key] + 1, status);
  };

  const renderScene = SceneMap({
    new: () => (
      <BookingList
        bookings={newBookings}
        refreshing={refreshing.new}
        onRefresh={() => handleRefresh('PENDING')}
        onEndReached={() => handleLoadMore('PENDING')}
        status="PENDING"
        isLoading={isLoading.new}
      />
    ),
    processing: () => (
      <BookingList
        bookings={processingBookings}
        refreshing={refreshing.processing}
        onRefresh={() => handleRefresh('PROCESSING')}
        onEndReached={() => handleLoadMore('PROCESSING')}
        status="PROCESSING"
        isLoading={isLoading.processing}
      />
    ),
    completed: () => (
      <BookingList
        bookings={completedBookings}
        refreshing={refreshing.completed}
        onRefresh={() => handleRefresh('COMPLETED')}
        onEndReached={() => handleLoadMore('COMPLETED')}
        status="COMPLETED"
        isLoading={isLoading.completed}
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
  card: {
    backgroundColor: '#B9603F',
    flexDirection: 'row',
    borderRadius: 15,
    width: '100%',
    padding: 12,
    marginBottom: 15,
  },
  leftSection: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRightWidth: 1,
    borderRightColor: 'white',
    paddingRight: 15,
    width: '50%',
  },
  rightSection: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  packageName: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
    textAlign: 'center',
  },
  guestCount: {
    color: 'white',
    fontSize: 12,
    textAlign: 'center',
  },
  chefName: {
    color: 'white',
    fontStyle: 'italic',
    marginTop: 5,
  },
  phone: {
    color: 'white',
  },
  address: {
    color: 'white',
    textAlign: 'center',
  },
  date: {
    color: 'white',
    textAlign: 'center',
  },
  time: {
    color: 'white',
    textAlign: 'center',
  },
  totalPrice: {
    color: 'white',
    marginVertical: 5,
    textAlign: 'center',
  },
  status: {
    color: 'white',
    fontWeight: 'bold',
    marginTop: 5,
    textAlign: 'center',
  },
  noOrders: {
    color: '#9C583F',
    textAlign: 'center',
    marginTop: 20,
  },
  loading: {
    color: '#9C583F',
    textAlign: 'center',
    padding: 10,
  },
});

export default OrderHistories;