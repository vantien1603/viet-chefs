import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Dimensions,
  ActivityIndicator,
  StyleSheet,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import useAxios from '../../config/AXIOS_API';
import { useCommonNoification } from '../../context/commonNoti';
import Header from '../../components/header';
import { TabBar, TabView } from 'react-native-tab-view';
import { commonStyles } from '../../style';
import { useNavigation } from '@react-navigation/native';

const dayInWeek = [
  { id: 0, label: 'Mon', full: 'Monday' },
  { id: 1, label: 'Tue', full: 'Tuesday' },
  { id: 2, label: 'Wed', full: 'Wednesday' },
  { id: 3, label: 'Thu', full: 'Thursday' },
  { id: 4, label: 'Fri', full: 'Friday' },
  { id: 5, label: 'Sat', full: 'Saturday' },
  { id: 6, label: 'Sun', full: 'Sunday' },
];

const ScheduleRender = ({ bookings, onLoadMore, refreshing, onRefresh, onViewDetail,loading }) => {
  const renderItem = ({ item }) => (
    <TouchableOpacity key={item.id} style={styles.section} onPress={() => onViewDetail(item.id)}>
      <View style={{ flexDirection: 'row', padding: 1, justifyContent: 'space-between' }}>
        <Text style={{ fontSize: 16, fontWeight: 'bold' }}>Bui Anh Khoa</Text>
        <Text style={{ fontSize: 14, fontWeight: 'bold' }}>Date: 10/10/2025</Text>
      </View>
      <Text numberOfLines={1} ellipsizeMode="tail">
        <Text style={styles.itemContentLabel}>Address: </Text>
        <Text style={styles.itemContent}>46/1 Tan Hoa 2, Hiep Phu, Q9</Text>
      </Text>
      <Text>
        <Text style={styles.itemContentLabel}>Dinner time: </Text>
        <Text style={styles.itemContent}>10:00</Text>
      </Text>
      <Text>
        <Text style={styles.itemContentLabel}>Travel time: </Text>
        <Text style={styles.itemContent}>9:00</Text>
      </Text>
      <Text numberOfLines={2} ellipsizeMode="tail">
        <Text style={styles.itemContentLabel}>Note: </Text>
        <Text style={styles.itemContent}>
          Nhin lai nguoi con gai anh tung rat nang niu, du ngay dem van khong ngai gio mua
        </Text>
      </Text>
      <Text style={styles.itemContentLabel}>Price: 90.0</Text>
    </TouchableOpacity>
  );

  return (
    <View style={{ flex: 1 }}>
      <FlatList
        data={bookings}
        renderItem={renderItem}
        contentContainerStyle={{ paddingHorizontal: 10 }}
        keyExtractor={(item) => item.id.toString()}
        onEndReached={onLoadMore}
        onEndReachedThreshold={0.5}
        refreshing={refreshing}
        onRefresh={onRefresh}
        ListEmptyComponent={<Text style={{ textAlign: 'center', fontSize: 16 }}>No pending orders</Text>}
        ListFooterComponent={ (loading ? <ActivityIndicator size="large" /> : <View style={{ height: 100 }} />)}
      />
    </View>
  );
};

const Schedule = () => {
  const axiosInstance = useAxios();
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [schedules, setSchedules] = useState(() =>
    dayInWeek.reduce((acc, day) => {
      acc[day.full] = [];
      return acc;
    }, {})
  );
  const [loading, setLoading] = useState(false);
  const [index, setIndex] = useState(0);
  const [refresh, setRefresh] = useState(false);
  const navigation = useNavigation();

  const [routes] = useState(dayInWeek.map((day) => ({ key: day.full, title: day.full })));

  const PAGE_SIZE = 20;

  const getDayOfWeekId = (date) => {
    const day = new Date(date).getDay();
    return day === 0 ? 6 : day - 1;
  };

  const fetchBookingDetails = async (pageNum, isRefresh = false) => {
    if (loading && !isRefresh) return;
    setLoading(true);
    try {
      const response = await axiosInstance.get('/bookings/booking-details/chefs', {
        params: {
          pageNo: pageNum,
          pageSize: PAGE_SIZE,
          sortBy: 'id',
          sortDir: 'desc',
        },
      });

      if (response.status === 200) {
        const data = response.data.content || [];
        setHasMore(data.length >0); 

        const categorizedSchedules = isRefresh
          ? dayInWeek.reduce((acc, day) => {
              acc[day.full] = [];
              return acc;
            }, {})
          : { ...schedules };

        data.forEach((booking) => {
          const dayOfWeekId = getDayOfWeekId(booking.sessionDate);
          const dayName = dayInWeek[dayOfWeekId].full;
          categorizedSchedules[dayName] = [...(categorizedSchedules[dayName] || []), booking];
        });

        setSchedules(categorizedSchedules);
      }
    } catch (error) {
      console.error('Error fetching bookings:', error.response ? error.response.data : error.message);
    } finally {
      setLoading(false);
      setRefresh(false);
    }
  };

  useEffect(() => {
    fetchBookingDetails(0);
  }, []);

  const loadMoreData = async () => {
    if (!loading && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      await fetchBookingDetails(nextPage);
    }
  };

  const handleRefresh = async () => {
    setRefresh(true);
    setPage(0);
    await fetchBookingDetails(0, true);
  };

  const renderScene = ({ route }) => {
    const bookingsOfDay = schedules[route.key] || [];
    return (
      <ScheduleRender
        bookings={bookingsOfDay}
        onLoadMore={loadMoreData}
        refreshing={refresh}
        onRefresh={handleRefresh}
        onViewDetail={viewDetail}
      />
    );
  };

  const viewDetail = useCallback((id) => {
    navigation.navigate('screen/detailsBooking', { bookingId: id });
  }, [navigation]);

  return (
    <SafeAreaView style={commonStyles.container}>
      <Header title={'Schedule'} />
      <TabView
        navigationState={{ index, routes }}
        renderScene={renderScene}
        onIndexChange={setIndex}
        loading={loading}
        renderTabBar={(props) => (
          <TabBar
            {...props}
            scrollEnabled
            inactiveColor="gray"
            activeColor="#9C583F"
            indicatorStyle={{ backgroundColor: '#A9411D' }}
            style={{ backgroundColor: '#EBE5DD', elevation: 0, shadowOpacity: 0, borderBottomWidth: 0 }}
            labelStyle={{ color: '#A9411D', fontWeight: 'bold' }}
            tabStyle={{ paddingVertical: 0, width: 130 }}
          />
        )}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  section: {
    gap: 5,
    maxHeight: 200,
    backgroundColor: '#fff',
    marginVertical: 10,
    padding: 25,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
  },
  itemContentLabel: {
    fontWeight: 'bold',
  },
  itemContent: {
    fontSize: 14,
  },
});

export default Schedule;