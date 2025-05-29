import React, { useCallback, useContext, useEffect, useState } from 'react';
import { SafeAreaView, Image, StyleSheet, Text, TouchableOpacity, View, ActivityIndicator } from 'react-native';
import { AuthContext } from '../../config/AuthContext';
import { commonStyles } from '../../style';
import { AntDesign, Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Shadow } from 'react-native-shadow-2';
import useAxios from '../../config/AXIOS_API';
import { useFocusEffect } from '@react-navigation/native';
import axios from 'axios';
import { t } from 'i18next';
import { ScrollView } from 'react-native';
import { SocketContext } from '../../config/SocketContext';
import { Tooltip } from "react-native-elements";
import { ChefContext } from '../../context/ChefContext';

const Home = () => {
    const { user, isGuest } = useContext(AuthContext);
    const { chefInfo } = useContext(ChefContext);
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [schedules, setSchedules] = useState([]);
    const [pendings, setPendings] = useState([]);
    const axiosInstance = useAxios();
    const { registerNotificationCallback } = useContext(SocketContext);
    const [unreadCount, setUnreadCount] = useState(0);


    useFocusEffect(
        useCallback(() => {
            fetchPending();
            fetchDetails();
        }, [])
    );


    useEffect(() => {
        if (!isGuest) {
            registerNotificationCallback(() => {
                fetchUnreadCount();
            });
        }

    }, []);


    const fetchUnreadCount = async () => {
        setLoading(true);
        try {
            const response = await axiosInstance.get("/notifications/my/count");
            if (response.status === 200) {
                const unread = response.data.notiNotChat;
                setUnreadCount(unread);
            }
        } catch (error) {
            if (axios.isCancel(error)) {
                return;
            }
            showModal(t("modal.error"), "Có lỗi xảy ra trong quá trình xử lý", "Failed");
        } finally {
            setLoading(false);
        }
    };

    const fetchDetails = async () => {
        setLoading(true);
        try {
            const response = await axiosInstance.get('/bookings/booking-details/chefs', {
                params: {
                    status: 'SCHEDULED_COMPLETE',
                },
            })
            if (response.status === 200) setSchedules(response.data.content.length);
        } catch (error) {
            if (axios.isCancel(error)) {
                return;
            }
            showModal(t("modal.error"), "Có lỗi xảy ra trong quá trình tải dữ liệu", "Failed");
        } finally {
            setLoading(false);
        }
    }



    const fetchPending = async () => {
        setLoading(true);
        try {
            const response = await axiosInstance.get("/bookings/chefs/my-bookings", {
                params: {
                    status: 'PAID',
                },
            })
            if (response.status === 200)
                setPendings(response.data.content.length);
        } catch (error) {
            if (axios.isCancel(error)) {
                return;
            }
            showModal(t("modal.error"), "Có lỗi xảy ra trong quá trình tải dữ liệu", "Failed");
        } finally {
            setLoading(false);
        }
    };


    return (
        <SafeAreaView style={commonStyles.container}>
            <View style={commonStyles.containerContent}>
                <View style={styles.header}>
                    <TouchableOpacity style={styles.profileContainer}>
                        <Image
                            source={
                                user?.avatarUrl
                                    ? { uri: user.avatarUrl }
                                    : require("../../assets/images/logo.png")
                            }
                            style={styles.profileImage}
                            resizeMode="cover"
                        />

                        <View style={styles.greetingContainer}>
                            <Text style={styles.greetingText}>{t("welcomeBack")},</Text>
                            <Text style={styles.userName}>{user?.fullName || 'Chef'} </Text>
                        </View>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => router.push("/screen/notificationChef")}>
                        <View style={styles.notificationIconContainer}>
                            <Ionicons name="notifications" size={30} color="#4EA0B7" />
                            {unreadCount > 0 && (
                                <View style={styles.badge}>
                                    <Text style={styles.badgeText}>
                                        {unreadCount > 9 ? "9+" : unreadCount}
                                    </Text>
                                </View>
                            )}
                        </View>
                    </TouchableOpacity>
                </View>
                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 50 }}>
                    {/* {chef?.status === "LOCKED" && (
                        <Text>Your account has been locked. You will not be recommended in customers' search results.</Text>
                    )} */}
                    <View style={styles.orderContainer}>
                        <View style={styles.halfBox}>
                            <Shadow distance={5} startColor={'#00000010'} offset={[0, 2]} style={styles.orderBox}>
                                <LinearGradient colors={['#FF5733', '#FF8D1A']} style={{ width: '100%', alignItems: 'center', padding: 20, borderRadius: 10 }}>
                                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                        <Text style={styles.orderLabel}>{t("reputationPoint")}</Text>
                                        <View style={{ marginLeft: 8 }}>
                                            <Tooltip
                                                popover={
                                                    <View>
                                                        <Text style={{ fontWeight: 'bold', fontFamily: "nunito-bold" }}>{t('repuNoti')}</Text>
                                                        <Text><Text style={{ fontWeight: 'bold', fontFamily: "nunito-bold" }}>{t('below80')} </Text><Text>{t('below802')}</Text></Text>
                                                        <Text><Text style={{ fontWeight: 'bold', fontFamily: "nunito-bold" }}>{t('below60')} </Text> <Text>{t('below602')} <Text style={{ color: 'red', fontWeight: 'bold' }}>{t('LOCKED')}</Text></Text></Text>
                                                        <Text style={{ fontWeight: 'bold', fontFamily: "nunito-bold" }}>{t('repuCanbeIncrease')}</Text>
                                                    </View>
                                                }
                                                backgroundColor="#fff"
                                                width={350}
                                                height={180}
                                                containerStyle={{
                                                    elevation: 4,
                                                    shadowColor: "#000",
                                                    shadowOffset: { width: 0, height: 2 },
                                                    shadowOpacity: 0.3,
                                                    shadowRadius: 6,
                                                    borderRadius: 8,
                                                }}
                                                pointerColor="#fff"
                                                overlayColor="transparent"
                                                skipAndroidStatusBar
                                            >
                                                <AntDesign name="questioncircleo" size={16} color="white" />
                                            </Tooltip>
                                        </View>
                                    </View>
                                    {loading ? (
                                        <ActivityIndicator size={'large'} color={'white'} />
                                    ) : (
                                        <Text style={styles.orderNumber}>{chefInfo?.reputationPoints || 0}</Text>
                                    )}
                                </LinearGradient>
                            </Shadow>
                        </View>

                        <View style={styles.halfBox}>
                            <Shadow distance={5} startColor={'#00000010'} offset={[0, 2]} style={styles.orderBox}>
                                <LinearGradient colors={['#FF5733', '#FF8D1A']} style={{ width: '100%', alignItems: 'center', padding: 20, borderRadius: 10 }}>
                                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                        <Text style={styles.orderLabel}>{t("status")}</Text>
                                        {chefInfo?.status === "LOCKED" && (
                                            <View style={{ marginLeft: 8 }}>
                                                <Tooltip
                                                    popover={
                                                        <View >
                                                            {/* <Text style={{ marginBottom: 4 }}> */}
                                                            <Text style={{ fontWeight: 'bold', fontFamily: "nunito-bold" }}>{t('lock1')}<Text style={{ color: 'red' }}> {t('LOCKED')}</Text>. {t('lock2')}</Text>
                                                            {/* </Text> */}
                                                        </View>
                                                    }
                                                    backgroundColor="#fff"
                                                    width={300}
                                                    height={120}
                                                    containerStyle={{
                                                        elevation: 4,
                                                        shadowColor: "#000",
                                                        shadowOffset: { width: 0, height: 2 },
                                                        shadowOpacity: 0.3,
                                                        shadowRadius: 6,
                                                        borderRadius: 8,
                                                    }}
                                                    pointerColor="#fff"
                                                    overlayColor="transparent"
                                                    skipAndroidStatusBar
                                                >
                                                    <AntDesign name="questioncircleo" size={16} color="white" />
                                                </Tooltip>
                                            </View>
                                        )}

                                    </View>

                                    {loading ? (
                                        <ActivityIndicator size={'large'} color={'white'} />
                                    ) : (
                                        <Text style={[styles.orderNumber, chefInfo?.status === "LOCKED" ? { color: 'red' } : { color: 'green' }]}>{chefInfo?.status}</Text>
                                    )}

                                </LinearGradient>
                            </Shadow>

                        </View>
                    </View>

                    {/* <View style={styles.orderContainer}>
                        <View style={styles.halfBox}>
                            <Shadow distance={5} startColor={'#00000010'} offset={[0, 2]} style={styles.orderBox}>
                                <LinearGradient colors={['#FF5733', '#FF8D1A']} style={{ width: '100%', alignItems: 'center', padding: 20, borderRadius: 10 }}>
                                    {loading ? (
                                        <ActivityIndicator size={'large'} color={'white'} />
                                    ) : (
                                        <Text style={styles.orderNumber}>{schedules || 0}</Text>
                                    )}
                                    <Text style={styles.orderLabel}>{t("runningOrders")}</Text>
                                </LinearGradient>
                            </Shadow>
                        </View>

                        <View style={styles.halfBox}>
                            <Shadow distance={5} startColor={'#00000010'} offset={[0, 2]} style={styles.orderBox}>
                                <LinearGradient colors={['#FF5733', '#FF8D1A']} style={{ width: '100%', alignItems: 'center', padding: 20, borderRadius: 10 }}>
                                    {loading ? (
                                        <ActivityIndicator size={'large'} color={'white'} />
                                    ) : (
                                        <Text style={styles.orderNumber}>{pendings || 0}</Text>
                                    )}
                                    <Text style={styles.orderLabel}>{t("orderRequest")}</Text>
                                </LinearGradient>
                            </Shadow>
                        </View>
                    </View> */}


                    <View style={styles.buttonGrid}>
                        {[
                            { label: t('statistic'), path: '/screen/dashboard' },
                            { label: t('schedule'), path: '/screen/chefSchedule' },
                            { label: t('dishes'), path: '/screen/chefDishes' },
                            { label: t('menu'), path: '/screen/menu' },
                            { label: t('packages'), path: '/screen/packages' },
                            { label: t('review'), path: '/screen/chefReviews' },
                        ].map((item, index) => (
                            <TouchableOpacity
                                key={index}
                                style={styles.button}
                                onPress={() => item.path && router.push(item.path)}
                            >
                                {/* <Shadow distance={4} startColor={'#00000010'} offset={[0, 2]}> */}
                                <LinearGradient
                                    colors={['#FFFFFF', '#F5F5F5']}
                                    style={styles.buttonInner}
                                >
                                    <Text style={styles.buttonText}>{item.label}</Text>
                                </LinearGradient>
                                {/* </Shadow> */}
                            </TouchableOpacity>
                        ))}
                    </View>
                </ScrollView>

            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 25,
        paddingHorizontal: 10,
    },
    profileContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    profileImage: {
        width: 70,
        height: 70,
        borderRadius: 35,
        borderColor: '#FF5733',
        borderWidth: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
    },
    greetingContainer: {
        marginLeft: 15,
    },
    greetingText: {
        fontSize: 16,
        color: '#666',
        fontFamily: "nunito-regular",
    },
    userName: {
        fontSize: 26,
        color: '#333',
        fontFamily: "nunito-bold",
    },
    orderContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 10,
        paddingHorizontal: 5,
    },
    orderContainer1: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        // marginBottom: 10,
        paddingHorizontal: 5,
    },

    orderBox: {
        borderRadius: 15,
        // padding: 20,
        backgroundColor: '#FFF',
        width: '100%'
        // flex: 1,
    },

    halfBox: {
        flex: 1,
        padding: 10,
        paddingHorizontal: 5,
    },

    orderNumber: {
        fontSize: 28,
        fontFamily: "nunito-bold",
        color: '#FFF',
    },
    orderLabel: {
        fontSize: 12,
        color: '#FFF',
        marginTop: 5,
        fontFamily: "nunito-bold",
        letterSpacing: 1,
    },
    buttonGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        paddingHorizontal: 5,
    },
    button: {
        width: '48%',
        marginVertical: 8,
    },
    buttonInner: {
        paddingVertical: 60,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: '#EEE',
    },
    buttonText: {
        fontSize: 18,
        fontFamily: "nunito-bold",
        color: '#FF5733',
    },
    badge: {
        position: "absolute",
        right: -8,
        top: -8,
        backgroundColor: "#A9411D",
        borderRadius: 10,
        minWidth: 20,
        height: 20,
        justifyContent: "center",
        alignItems: "center",
    },
    badgeText: {
        color: "#fff",
        fontSize: 12,
        fontFamily: "nunito-bold",
    },
});

export default Home;