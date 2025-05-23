import React, { useCallback, useContext, useEffect, useState } from 'react';
import { SafeAreaView, Image, StyleSheet, Text, TouchableOpacity, View, ActivityIndicator } from 'react-native';
import { AuthContext } from '../../config/AuthContext';
import { commonStyles } from '../../style';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Shadow } from 'react-native-shadow-2';
import useAxios from '../../config/AXIOS_API';
import { useFocusEffect } from '@react-navigation/native';
import axios from 'axios';

const Home = () => {
    const { user } = useContext(AuthContext);
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [schedules, setSchedules] = useState([]);
    const [pendings, setPendings] = useState([]);
    const axiosInstance = useAxios();


    useFocusEffect(
        useCallback(() => {
            fetchPending();
            fetchDetails();
        }, [])
    );

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
            showModal("Error", "Có lỗi xảy ra trong quá trình tải dữ liệu", "Failed");
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
            showModal("Error", "Có lỗi xảy ra trong quá trình tải dữ liệu", "Failed");
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
                            <Text style={styles.greetingText}>Welcome back,</Text>
                            <Text style={styles.userName}>{user?.fullName || 'Chef'} </Text>
                        </View>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => router.push("/screen/notificationChef")}>
                        <Ionicons name="notifications-outline" size={28} color="#FF5733" />
                    </TouchableOpacity>
                </View>

                <View style={styles.orderContainer}>
                    <Shadow distance={5} startColor={'#00000010'} offset={[0, 2]}>
                        <LinearGradient
                            colors={['#FF5733', '#FF8D1A']}
                            style={styles.orderBox}
                        >
                            {loading ? (
                                <ActivityIndicator size={'large'} color={'white'} />
                            ) : (
                                <Text style={styles.orderNumber}>{schedules || 0} </Text>
                            )}
                            <Text style={styles.orderLabel}>RUNNING ORDERS</Text>
                        </LinearGradient>
                    </Shadow>
                    <Shadow distance={5} startColor={'#00000010'} offset={[0, 2]}>
                        <LinearGradient
                            colors={['#FF5733', '#FF8D1A']}
                            style={styles.orderBox}
                        >
                            {loading ? (
                                <ActivityIndicator size={'large'} color={'white'} />
                            ) : (
                                <Text style={styles.orderNumber}>{pendings || 0}</Text>
                            )}
                            <Text style={styles.orderLabel}>ORDER REQUEST</Text>
                        </LinearGradient>
                    </Shadow>
                </View>

                <View style={styles.buttonGrid}>
                    {[
                        { label: 'Statistical', path: '/screen/dashboard' },
                        { label: 'Schedules', path: '/screen/chefSchedule' },
                        { label: 'Dishes', path: '/screen/chefDishes' },
                        { label: 'Menu', path: '/screen/menu' },
                        { label: 'Packages', path: '/screen/packages' },
                        { label: 'Review', path: '/screen/reviewsChef' },
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
        fontWeight: '400',
    },
    userName: {
        fontSize: 26,
        color: '#333',
        fontWeight: '700',
    },
    orderContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 30,
        paddingHorizontal: 5,
    },
    orderBox: {
        // flex: 1,
        borderRadius: 15,
        padding: 20,
        alignItems: 'center',
        marginHorizontal: 8,
        backgroundColor: '#FFF',
    },
    orderNumber: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#FFF',
    },
    orderLabel: {
        fontSize: 12,
        color: '#FFF',
        marginTop: 5,
        fontWeight: '500',
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
        fontWeight: '600',
        color: '#FF5733',
    },
});

export default Home;