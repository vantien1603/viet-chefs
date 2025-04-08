import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TabView, SceneMap, TabBar } from 'react-native-tab-view';
import { router } from 'expo-router'; // Thêm import để điều hướng
import Header from '../../components/header';
import { commonStyles } from '../../style';
import AXIOS_API from "../../config/AXIOS_API";

const NewRoute = ({ bookings, currentPage, totalPages, onPageChange }) => (
  <View style={{ flex: 1 }}>
    <ScrollView style={{ padding: 20 }}>
      {bookings.length > 0 ? (
        bookings.map((booking) => (
          <TouchableOpacity
            key={booking.id}
            style={styles.card}
            onPress={
              booking.status === 'PENDING' && booking.bookingType === 'LONG_TERM'
                ? () => router.push({
                    pathname: '/screen/longTermDetails', // Đường dẫn đến LongTermDetailsScreen
                    params: { bookingId: booking.id },
                  })
                : null
            }
          >
            <View style={styles.leftSection}>
              <Text style={styles.packageName}>{booking.bookingPackage?.name || ''}</Text>
              <Text style={styles.guestCount}>{booking.guestCount} guests</Text>
              <Text style={styles.chefName}>Chef: {booking.chef.user.fullName}</Text>
              <Text style={styles.phone}>Phone: {booking.chef.user.phone}</Text>
            </View>
            <View style={styles.rightSection}>
              <Text style={styles.address}>
                {booking.bookingDetails?.[0]?.location || ''}
              </Text>
              {booking.bookingDetails && booking.bookingDetails[0] && (
                <>
                  <Text style={styles.date}>Date: {booking.bookingDetails[0].sessionDate}</Text>
                  <Text style={styles.time}>Time: {booking.bookingDetails[0].startTime}</Text>
                </>
              )}
              <Text style={styles.guestCount}>Type: {booking.bookingType}</Text>
              <Text style={styles.totalPrice}>Total Price: ${booking.totalPrice}</Text>
              <Text style={styles.status}>Status: PENDING</Text>
            </View>
          </TouchableOpacity>
        ))
      ) : (
        <Text style={styles.noOrders}>No new orders</Text>
      )}
    </ScrollView>
    <View style={styles.paginationContainer}>
      {Array.from({ length: totalPages }, (_, i) => (
        <TouchableOpacity
          key={i}
          style={[styles.pageButton, currentPage === i ? styles.activePageButton : null]}
          onPress={() => onPageChange(i)}
        >
          <Text style={styles.pageText}>{i + 1}</Text>
        </TouchableOpacity>
      ))}
    </View>
  </View>
);

// ProcessingRoute và CompletedRoute giữ nguyên như cũ
const ProcessingRoute = ({ bookings, currentPage, totalPages, onPageChange }) => (
  <View style={{ flex: 1 }}>
    <ScrollView style={{ padding: 20 }}>
      {bookings.length > 0 ? (
        bookings.map((booking) => (
          <TouchableOpacity key={booking.id} style={styles.card}>
            <View style={styles.leftSection}>
              <Text style={styles.packageName}>{booking.bookingPackage?.name || 'N/A'}</Text>
              <Text style={styles.guestCount}>{booking.guestCount} guests</Text>
              <Text style={styles.chefName}>Chef: {booking.chef.user.fullName}</Text>
              <Text style={styles.phone}>Phone: {booking.chef.user.phone}</Text>
            </View>
            <View style={styles.rightSection}>
              <Text style={styles.address}>
                {booking.bookingDetails?.[0]?.location || 'N/A'}
              </Text>
              {booking.bookingDetails && booking.bookingDetails[0] && (
                <>
                  <Text style={styles.date}>Date: {booking.bookingDetails[0].sessionDate}</Text>
                  <Text style={styles.time}>Time: {booking.bookingDetails[0].startTime}</Text>
                </>
              )}
              <Text style={styles.totalPrice}>Total Price: ${booking.totalPrice}</Text>
              <Text style={styles.status}>Status: PROCESSING</Text>
            </View>
          </TouchableOpacity>
        ))
      ) : (
        <Text style={styles.noOrders}>No processing orders</Text>
      )}
    </ScrollView>
    <View style={styles.paginationContainer}>
      {Array.from({ length: totalPages }, (_, i) => (
        <TouchableOpacity
          key={i}
          style={[styles.pageButton, currentPage === i ? styles.activePageButton : null]}
          onPress={() => onPageChange(i)}
        >
          <Text style={styles.pageText}>{i + 1}</Text>
        </TouchableOpacity>
      ))}
    </View>
  </View>
);

const CompletedRoute = ({ bookings, currentPage, totalPages, onPageChange }) => (
  <View style={{ flex: 1 }}>
    <ScrollView style={{ padding: 20 }}>
      {bookings.length > 0 ? (
        bookings.map((booking) => (
          <TouchableOpacity key={booking.id} style={styles.card}>
            <View style={styles.leftSection}>
              <Text style={styles.packageName}>{booking.bookingPackage?.name || 'N/A'}</Text>
              <Text style={styles.guestCount}>{booking.guestCount} guests</Text>
              <Text style={styles.chefName}>Chef: {booking.chef.user.fullName}</Text>
              <Text style={styles.phone}>Phone: {booking.chef.user.phone}</Text>
            </View>
            <View style={styles.rightSection}>
              <Text style={styles.address}>
                {booking.bookingDetails?.[0]?.location || 'N/A'}
              </Text>
              {booking.bookingDetails && booking.bookingDetails[0] && (
                <>
                  <Text style={styles.date}>Date: {booking.bookingDetails[0].sessionDate}</Text>
                  <Text style={styles.time}>Time: {booking.bookingDetails[0].startTime}</Text>
                </>
              )}
              <Text style={styles.totalPrice}>Total Price: ${booking.totalPrice}</Text>
              <Text style={styles.status}>Status: COMPLETED</Text>
            </View>
          </TouchableOpacity>
        ))
      ) : (
        <Text style={styles.noOrders}>No completed orders</Text>
      )}
    </ScrollView>
    <View style={styles.paginationContainer}>
      {Array.from({ length: totalPages }, (_, i) => (
        <TouchableOpacity
          key={i}
          style={[styles.pageButton, currentPage === i ? styles.activePageButton : null]}
          onPress={() => onPageChange(i)}
        >
          <Text style={styles.pageText}>{i + 1}</Text>
        </TouchableOpacity>
      ))}
    </View>
  </View>
);

const OrderHistories = () => {
  const [index, setIndex] = useState(1);
  const [routes] = useState([
    { key: 'new', title: 'New' },
    { key: 'processing', title: 'Processing' },
    { key: 'completed', title: 'Completed' },
  ]);
  const [bookings, setBookings] = useState([]);
  const [pageNo, setPageNo] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  const PAGE_SIZE = 10;

  const fetchBookingDetails = async (page) => {
    if (isLoading) return;
    setIsLoading(true);
    try {
      const response = await AXIOS_API.get('/bookings/users/my-bookings', {
        params: {
          pageNo: page,
          pageSize: PAGE_SIZE,
          sortBy: 'id',
          sortDir: 'desc',
        },
      });

      const bookingData = response.data.content || response.data || [];
      setBookings(bookingData);
      setTotalPages(response.data.totalPages || Math.ceil((response.data.totalElements || bookingData.length) / PAGE_SIZE));
      setPageNo(page);
    } catch (error) {
      console.error('Error fetching booking details:', error.message);
      if (error.response) {
        console.error('Error response:', JSON.stringify(error.response.data, null, 2));
      }
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

  const newBookings = bookings.filter((booking) => booking.status === 'PENDING');
  const processingBookings = bookings.filter((booking) => booking.status === 'PROCESSING');
  const completedBookings = bookings.filter((booking) => booking.status === 'COMPLETED');

  const renderScene = SceneMap({
    new: () => (
      <NewRoute
        bookings={newBookings}
        currentPage={pageNo}
        totalPages={totalPages}
        onPageChange={handlePageChange}
      />
    ),
    processing: () => (
      <ProcessingRoute
        bookings={processingBookings}
        currentPage={pageNo}
        totalPages={totalPages}
        onPageChange={handlePageChange}
      />
    ),
    completed: () => (
      <CompletedRoute
        bookings={completedBookings}
        currentPage={pageNo}
        totalPages={totalPages}
        onPageChange={handlePageChange}
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
  },
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingVertical: 10,
  },
  pageButton: {
    padding: 10,
    marginHorizontal: 5,
    backgroundColor: '#EBE5DD',
    borderRadius: 5,
  },
  activePageButton: {
    backgroundColor: '#9C583F',
  },
  pageText: {
    color: '#000',
    fontWeight: 'bold',
  },
});

export default OrderHistories;