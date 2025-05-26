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
import { t } from 'i18next';

const ScheduleRender = ({ bookings, onLoadMore, refreshing, onRefresh, onViewDetail, loading }) => {
    const renderItem = ({ item }) => {
        return (
            <TouchableOpacity key={item.id} style={[styles.section]} onPress={() => onViewDetail(item.id)}>
                <View style={{ flexDirection: 'row', padding: 1, justifyContent: 'space-between' }}>
                    <Text style={{ fontSize: 16, fontWeight: 'bold' }}>{item.booking?.customer?.fullName}</Text>
                    <Text style={{ fontSize: 14, fontWeight: 'bold' }}>{t("date")}: {item.sessionDate}</Text>
                </View>
                <Text numberOfLines={1} ellipsizeMode="tail">
                    <Text style={styles.itemContentLabel}>{t("address")}: </Text>
                    <Text style={styles.itemContent}>{item.location}</Text>
                </Text>
                <Text>
                    <Text style={styles.itemContentLabel}>{t("mealTime")}: </Text>
                    <Text style={styles.itemContent}>{item.startTime}</Text>
                </Text>
                <Text>
                    <Text style={styles.itemContentLabel}>{t("travelTime")}: </Text>
                    <Text style={styles.itemContent}>{item.timeBeginTravel}</Text>
                </Text>
                <Text numberOfLines={2} ellipsizeMode="tail">
                    <Text style={styles.itemContentLabel}>{t("dishes")}: </Text>
                    {item.dishes?.length === 0 && (
                        <Text style={styles.itemContent}>
                            {t("notYet")}
                        </Text>
                    )}
                    {item.dishes && item.dishes.map((dish) => (
                        <Text key={dish.id} style={styles.itemContent}>{dish.dish?.name}, </Text>
                    ))}

                </Text>
                <Text style={styles.itemContentLabel}>{t("totalPrice")}: {item.totalPrice}</Text>
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
                ListEmptyComponent={<Text style={{ textAlign: 'center', fontSize: 16 }}>{t('noPendingOrders')}</Text>}
                ListFooterComponent={(loading ? <ActivityIndicator size="large" /> : <View style={{ height: 100 }} />)}
            />
        </View>
    );
};

const ScheduleCompleted = () => {
    const axiosInstance = useAxios();
    const [page, setPage] = useState({
        COMPLETED: 0,
        CANCELED: 0
    });
    const [schedules, setSchedules] = useState({
        COMPLETED: 0,
        CANCELED: []
    });
    const [loading, setLoading] = useState(false);
    const [refresh, setRefresh] = useState(false);
    const [totalPages, setTotalPages] = useState({
        COMPLETED: 0,
        CANCELED: 0
    }); const [index, setIndex] = useState(0);
    const navigation = useNavigation();
    const { showModal } = useCommonNoification();
    const PAGE_SIZE = 20;

    const routes = [
    { key: 'completed', title: t('completed') },
    { key: 'cancelled', title: t('cancelled') },
  ];

    const fetchBookingDetails = async (pageNum, status, isRefresh = false) => {
        if (loading && !isRefresh) return;
        setLoading(true);
        try {
            const response = await axiosInstance.get('/bookings/booking-details/chefs', {
                params: {
                    status: status,
                    pageNo: pageNum,
                    pageSize: PAGE_SIZE,
                    sortBy: 'id',
                    sortDir: 'asc',
                },
            });

            if (response.status === 200) {
                const data = response.data.content || [];
                setTotalPages(prev => ({
                    ...prev,
                    [status]: response.data.totalPages
                }));
                // setSchedules(isRefresh ? data : (prev) => [...prev, ...data]);

                setSchedules(prev => ({
                    ...prev,
                    [status]: isRefresh ? data : [...prev[status], ...data]
                }));
            }
        } catch (error) {
            if (error.response?.status === 401) return;
            if (axios.isCancel(error)) return;
            showModal(t("modal.error"), t('errors.fetchBookingsFailed'), t("modal.failed"));
        } finally {
            setLoading(false);
            setRefresh(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            fetchBookingDetails(0, "COMPLETED", true);
            fetchBookingDetails(0, "CANCELED", true);
        }, [])
    );

    const loadMoreData = async () => {
        if (!loading) {
            if (index === 0 && page.COMPLETED + 1 < totalPages.COMPLETED - 1) {
                const nextPage = page.COMPLETED + 1;
                setPage(prev => ({
                    ...prev,
                    COMPLETED: prev.COMPLETED + 1
                }));

                await fetchBookingDetails(nextPage, 'COMPLETED');
            } else if (index === 1 && page.CANCELED + 1 < totalPages.CANCELED - 1) {
                const nextPage = page.CANCELED + 1;
                setPage(prev => ({
                    ...prev,
                    CANCELED: prev.CANCELED + 1
                }));
                await fetchBookingDetails(nextPage, 'CANCELED');
            }
        }
    };

    const handleRefresh = async () => {
        setRefresh(true);
        if (index === 0) {
            setPage(prev => ({
                ...prev,
                COMPLETED: 0
            }));
            await fetchBookingDetails(0, 'COMPLETED', true);
        } else if (index === 1) {
            setPage(prev => ({
                ...prev,
                CANCELED: 0
            }));
            await fetchRequestBooking(0, 'CANCELED', true);
        }
    };

    const viewDetail = useCallback((id) => {
        navigation.navigate('screen/detailsScheduleBooking', { bookingId: id });
    }, [navigation]);

    const renderScene = ({ route }) => {
        let filtered = [];
        if (route.key === 'completed') {
            filtered = schedules.COMPLETED || [];
        } else if (route.key === 'cancelled') {
            filtered = schedules.CANCELED || [];
        }
        const sortedBookings = filtered?.sort((a, b) => new Date(a.sessionDate) - new Date(b.sessionDate));

        return (
            <ScheduleRender
                bookings={sortedBookings}
                onLoadMore={loadMoreData}
                refreshing={refresh}
                onRefresh={handleRefresh}
                onViewDetail={viewDetail}
                loading={loading}
            />
        );
    };

    return (
        <SafeAreaView style={commonStyles.container}>
            <Header title={t('schedule')} />
            <TabView
                navigationState={{ index, routes }}
                renderScene={renderScene}
                onIndexChange={setIndex}
                initialLayout={{ width: 300 }}
                renderTabBar={(props) => (
                    <TabBar
                        {...props}
                        inactiveColor="gray"
                        activeColor="#9C583F"
                        indicatorStyle={{ backgroundColor: '#A9411D' }}
                        style={{ backgroundColor: '#EBE5DD' }}
                        labelStyle={{ fontWeight: 'bold' }}
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

export default ScheduleCompleted;