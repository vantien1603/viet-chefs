import React, { useCallback, useEffect, useState } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    TextInput,
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
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import axios from 'axios';

const ScheduleRender = ({ bookings, onLoadMore, refreshing, onRefresh, onViewDetail, loading }) => {
    const renderItem = ({ item }) => {
        return (
            <TouchableOpacity key={item.id} style={[styles.section]} onPress={() => onViewDetail(item.id)}>
                <View style={{ flexDirection: 'row', padding: 1, justifyContent: 'space-between' }}>
                    <Text style={{ fontSize: 16, fontWeight: 'bold' }}>{item.booking?.customer?.fullName}</Text>
                    <Text style={{ fontSize: 14, fontWeight: 'bold' }}>Date: {item.sessionDate}</Text>
                </View>
                <Text numberOfLines={1} ellipsizeMode="tail">
                    <Text style={styles.itemContentLabel}>Address: </Text>
                    <Text style={styles.itemContent}>{item.location}</Text>
                </Text>
                <Text>
                    <Text style={styles.itemContentLabel}>Dinner time: </Text>
                    <Text style={styles.itemContent}>{item.startTime}</Text>
                </Text>
                <Text>
                    <Text style={styles.itemContentLabel}>Travel time: </Text>
                    <Text style={styles.itemContent}>{item.timeBeginTravel}</Text>
                </Text>
                <Text numberOfLines={2} ellipsizeMode="tail">
                    <Text style={styles.itemContentLabel}>Dishes: </Text>
                    {item.dishes?.length === 0 && (
                        <Text style={styles.itemContent}>
                            Not yet
                        </Text>
                    )}
                    {item.dishes && item.dishes.map((dish) => (
                        <Text key={dish.id} style={styles.itemContent}>{dish.dish?.name}, </Text>
                    ))}

                </Text>
                <Text style={styles.itemContentLabel}>Price: {item.totalPrice}</Text>
            </TouchableOpacity>
        )

        // );
    }
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
                ListFooterComponent={(loading ? <ActivityIndicator size="large" /> : <View style={{ height: 100 }} />)}
            />
        </View>
    );
};

const Schedule = () => {
    const axiosInstance = useAxios();
    const [page, setPage] = useState(0);
    const [schedules, setSchedules] = useState([]);
    const [loading, setLoading] = useState(false);
    const [refresh, setRefresh] = useState(false);
    const navigation = useNavigation();
    const [totalPages, setTotalPages] = useState(0);
    const {showModal} = useCommonNoification();
    const PAGE_SIZE = 20;

    const fetchBookingDetails = async (pageNum, isRefresh = false) => {
        if (loading && !isRefresh) return;
        setLoading(true);
        try {
            const response = await axiosInstance.get('/bookings/booking-details/chefs', {
                params: {
                    pageNo: pageNum,
                    pageSize: PAGE_SIZE,
                    sortBy: 'id',
                    sortDir: 'asc',
                },
            });

            if (response.status === 200) {
                const data = response.data.content || [];
                setTotalPages(response.data.totalPages);
                const filterData = data.filter((booking) => booking.status === 'WAITING_FOR_CONFIRMATION' || booking.status === 'COMPLETED');
                setSchedules(isRefresh ? filterData : (prev) => [...prev, ...filterData]);
            }
        } catch (error) {
            if (error.response?.status === 401) {
                return;
            }
            if (axios.isCancel(error)) {
                return;
            }
            showModal("Error", "Có lỗi xảy ra khi tải dữ liệu.", "Failed");
        } finally {
            setLoading(false);
            setRefresh(false);
        }
    };

    useFocusEffect(
        React.useCallback(() => {
            fetchBookingDetails(0, true);
        }, [])
    );

    const loadMoreData = async () => {
        if (!loading && page + 1 <= totalPages - 1) {
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
        const sortedBookings = schedules.sort((a, b) => new Date(a.sessionDate) - new Date(b.sessionDate));

        return (
            <ScheduleRender
                bookings={sortedBookings}
                onLoadMore={loadMoreData}
                refreshing={refresh}
                onRefresh={handleRefresh}
                onViewDetail={viewDetail}
            />
        );
    };

    const viewDetail = useCallback((id) => {
        navigation.navigate('screen/detailsScheduleBooking', { bookingId: id });
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
        maxHeight: 250,
        backgroundColor: '#F9F5F0',
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
    highlighted: {
        borderWidth: 3,
        borderColor: "#F8BF40",
    }
});

export default Schedule;