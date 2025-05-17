import React, { useEffect, useState } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import Header from '../../components/header'
import useAxios from '../../config/AXIOS_API'
import { View, ScrollView, TouchableOpacity, StyleSheet, Text, Image, ActivityIndicator } from 'react-native'
import { useNavigation, useRoute } from '@react-navigation/native'
import { useRouter } from 'expo-router'
import { commonStyles } from '../../style'
import Ionicons from '@expo/vector-icons/Ionicons';
import * as ImagePicker from "expo-image-picker";
import useAxiosFormData from '../../config/AXIOS_API_FORM'
import { useCommonNoification } from '../../context/commonNoti'
import axios from 'axios'
import * as Location from "expo-location";


const DetailsBooking = () => {
    const [loading, setLoading] = useState(false);
    const axiosInstance = useAxios();
    const route = useRoute();
    const { bookingId } = route.params;
    const [detail, setDetail] = useState({});
    const [customer, setCustomer] = useState({});
    const [images, setImages] = useState([]);
    const { showModal } = useCommonNoification();
    const axiosInstanceForm = useAxiosFormData();
    const navigation = useNavigation();


    useEffect(() => {
        fetchBooking();
    }, [bookingId]);

    const fetchBooking = async () => {
        try {
            setLoading(true);
            const response = await axiosInstance.get(`/bookings/booking-details/${bookingId}`);
            if (response.status === 200) {
                setDetail(response.data);
                setCustomer(response.data.booking.customer);
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
        }
    }

    const pickImage = async () => {
        if (images.length >= 2) {
            showModal("Warning", "Chỉ được chọn tối đa 2 ảnh.", "Warning");
            return;
        }
        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsMultipleSelection: true,
            quality: 1,
            selectionLimit: 2,
        });

        if (!result.canceled) {
            const selected = result.assets.map((asset) => ({
                id: Date.now() + Math.random(),
                imageUrl: asset.uri,
                entityType: "checkout",
                entityId: detail.id,
            }));

            setImages((prev) => {
                const remainingSlots = 2 - prev.length;
                if (remainingSlots <= 0) {
                    showModal("Warning", "Chỉ được chọn tối đa 2 ảnh.", "Warning");
                    return prev;
                }

                const limitedNewImages = selected.slice(0, remainingSlots);
                return [...prev, ...limitedNewImages];
            });
        }
    };


    const takePhoto = async () => {
        const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
        if (permissionResult.granted === false) {
            showModal("Warning", "Permission to access camera is required!", "Warning");
            return;
        }

        if (images.length >= 2) {
            showModal("Warning", "Chỉ được chọn tối đa 2 ảnh.", "Warning");
            return;
        }

        const result = await ImagePicker.launchCameraAsync({
            quality: 1,
        });

        if (!result.canceled) {
            const photo = {
                id: Date.now() + Math.random(),
                imageUrl: result.assets[0].uri,
                entityType: "checkout",
                entityId: detail.id,
            };
            setImages((prev) => [...prev, photo]);
        }
    };



    const handleSubmit = async () => {
        const formData = new FormData();
        setLoading(true);

        images.forEach((img, index) => {
            const uriParts = img.imageUrl.split(".");
            const fileType = uriParts[uriParts.length - 1];

            formData.append("files", {
                uri: img.imageUrl,
                name: `photo_${index}.${fileType}`,
                type: `image/${fileType}`,
            });
        });
        try {
            let { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== "granted") {
                Alert.alert(
                    "Quyền truy cập vị trí bị từ chối",
                    "Vui lòng cấp quyền để hoafn tat thu tuc checkout."
                );
                return null;
            }
            let currentLocation = await Location.getCurrentPositionAsync({});
            // const response = await axiosInstanceForm.put(`/bookings/booking-details/${detail.id}/complete-chef`, formData);
            const response = await axiosInstanceForm.put(
                `/bookings/booking-details/${detail.id}/complete-chef`,
                formData,
                {
                    params: {
                        chefLat: currentLocation.coords.latitude,
                        chefLng: currentLocation.coords.longitude
                    }
                }
            );

            console.log(response.status);
            if (response.status === 200 || response.status === 204) {
                showModal("Success", "Checkout successfully");
                fetchBooking();
            }
        } catch (error) {
            console.log(error.response.data)
            if (error.response?.status === 401) {
                return;
            }
            if (axios.isCancel(error)) {
                return;
            }
            showModal("Error", error.response.data.message, "Failed");
        } finally {
            setLoading(false);
        }

    }

    return (
        <SafeAreaView style={commonStyles.container}>
            <Header title={"Details order"} />
            <ScrollView style={commonStyles.containerContent} contentContainerStyle={{ paddingBottom: 100 }}>
                <View key={detail.id} style={styles.itemContainer}>
                    <View style={{ gap: 3 }}>
                        <View style={{ flexDirection: "row", justifyContent: 'space-between', alignItems: 'center' }}>
                            <Text >
                                <Text style={styles.itemContentLabel}>Name: </Text>
                                <Text style={{ fontWeight: "bold", fontSize: 16 }}>{customer?.fullName}</Text>
                            </Text>
                            <TouchableOpacity onPress={() => navigation.navigate("screen/message", {
                                contact: {
                                    id: customer.id,
                                    name: customer.fullName,
                                    avatar: customer.avatarUrl
                                }
                            })}>
                                <Ionicons name="chatbubble-ellipses-outline" size={30} color="black" />
                            </TouchableOpacity>
                        </View>
                        <Text >
                            <Text style={styles.itemContentLabel}>Phone: </Text>
                            <Text style={styles.itemContent}>{customer?.phone}</Text>
                        </Text>
                        <View style={{ flexDirection: "row", justifyContent: 'space-between', alignItems: 'center' }}>
                            <Text >
                                <Text style={styles.itemContentLabel}>Session date: </Text>
                                <Text style={styles.itemContent}>{detail.sessionDate}</Text>
                            </Text>
                        </View>
                        <Text >
                            <Text style={styles.itemContentLabel}>Location: </Text>
                            <Text style={styles.itemContent}>{detail.location}</Text>
                        </Text>
                        <Text >
                            <Text style={styles.itemContentLabel}>Guest: </Text>
                            <Text style={styles.itemContent}>{detail.booking?.guestCount}</Text>
                        </Text>
                        <Text >
                            <Text style={styles.itemContentLabel}>Time: </Text>
                            <Text style={styles.itemContent}>{detail.startTime}</Text>
                        </Text>
                        <Text>
                            <Text style={styles.itemContentLabel}>Time to go: </Text>
                            <Text style={styles.itemContent}>{detail.timeBeginTravel}</Text>
                        </Text>
                        <Text>
                            <Text style={styles.itemContentLabel}>Cooking start time: </Text>
                            <Text style={styles.itemContent}>{detail.timeBeginCook}</Text>
                        </Text>
                        <Text>
                            <Text style={styles.itemContentLabel}>Prepare ingredients: </Text>
                            <Text style={styles.itemContent}>{detail.chefBringIngredients ? 'Yes' : 'No'}</Text>
                        </Text>
                        {/* <Text> */}
                        {/* <Text style={styles.itemContentLabel}>Received: </Text> */}
                        {/* </Text> */}
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                            <Text style={{ fontSize: 16, fontWeight: 'bold', }}>Received: ${detail.totalChefFeePrice}</Text>
                            <Text style={{ fontWeight: "bold", fontSize: 18, }}>Total: ${detail.totalPrice}</Text>
                        </View>


                    </View>

                    {/* <View
                        key={detail.id}
                        style={{ borderWidth: 0.5, borderBottomColor: "#333", borderRadius: 6, paddingHorizontal: 8, marginVertical: 10 }}> */}
                </View>

                <View style={styles.itemContainer}>
                    <View>
                        <Text>
                            <Text style={styles.itemContentLabel}>Dishes: </Text>
                            {detail.dishes?.length === 0 && (
                                <Text style={styles.itemContent}>Not yet</Text>
                            )}

                        </Text>
                        {detail.dishes && detail.dishes.map((dish) => (
                            <View key={dish.id} style={{ paddingHorizontal: 10, paddingVertical: 5, flexDirection: "row", alignItems: 'center' }} >
                                <Image source={{ uri: dish.dish.imageUrl }} style={{ width: 40, height: 40, marginRight: 10, borderRadius: 10 }} />
                                <View>
                                    <Text style={{ fontSize: 15 }}>{dish.dish.name}</Text>
                                    {!dish.notes && (
                                        <Text style={{ fontSize: 13, color: '#333' }}>{dish.notes}qqqqqqqq</Text>
                                    )}
                                </View>
                            </View>

                        ))}
                    </View>
                </View>
                {(detail.status === "IN_PROGRESS" || detail.status === "WAITING_FOR_CONFIRMATION" || detail.status === "COMPLETED") && (
                    <View style={styles.itemContainer}>
                        <Text style={{ fontSize: 16, fontWeight: 'bold', marginBottom: 10 }}>
                            Upload checkout receipts
                        </Text>

                        <ScrollView horizontal showsHorizontalScrollIndicator={false}>

                            {(detail.status === "WAITING_FOR_CONFIRMATION" || detail.status === "COMPLETED" && detail.images) ? detail.images.map((img) => (
                                <View key={img.id} style={{ marginRight: 10, position: 'relative' }}>
                                    <Image
                                        source={{ uri: img.imageUrl }}
                                        style={{ width: 100, height: 100, borderRadius: 8 }}
                                    />
                                </View>
                            ))
                                : images.map((img) => (
                                    <View key={img.id} style={{ marginRight: 10, position: 'relative' }}>
                                        <Image
                                            source={{ uri: img.imageUrl }}
                                            style={{ width: 100, height: 100, borderRadius: 8 }}
                                        />
                                        <TouchableOpacity
                                            onPress={() => setImages(images.filter(i => i.id !== img.id))}
                                            style={{
                                                position: 'absolute',
                                                top: -5,
                                                right: -5,
                                                backgroundColor: '#fff',
                                                borderRadius: 20,
                                                padding: 2,
                                            }}
                                        >
                                            <Ionicons name="close-circle" size={20} color="red" />
                                        </TouchableOpacity>
                                    </View>
                                ))
                            }
                        </ScrollView>
                        {(detail.status === "IN_PROGRESS") && (
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 15 }}>
                                <TouchableOpacity
                                    onPress={pickImage}
                                    style={{
                                        flex: 1,
                                        borderWidth: 1,
                                        borderColor: '#ccc',
                                        borderRadius: 8,
                                        padding: 12,
                                        alignItems: 'center',
                                        marginRight: 5,
                                        backgroundColor: '#f0f0f0',
                                    }}
                                >
                                    <Ionicons name="images-outline" size={24} color="#333" />
                                    <Text style={{ marginTop: 5 }}>Choose Image</Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    onPress={takePhoto}
                                    style={{
                                        flex: 1,
                                        borderWidth: 1,
                                        borderColor: '#ccc',
                                        borderRadius: 8,
                                        padding: 12,
                                        alignItems: 'center',
                                        marginLeft: 5,
                                        backgroundColor: '#f0f0f0',
                                    }}
                                >
                                    <Ionicons name="camera-outline" size={24} color="#333" />
                                    <Text style={{ marginTop: 5 }}>Take Photo</Text>
                                </TouchableOpacity>
                            </View>
                        )}

                        {/* </View> */}
                        {detail.status === "IN_PROGRESS" && (
                            <View>
                                <TouchableOpacity
                                    style={{
                                        marginVertical: 10,
                                        backgroundColor: "#A64B2A",
                                        padding: 12,
                                        borderRadius: 10,
                                        alignItems: "center",
                                        elevation: 5,
                                    }}
                                    onPress={() => handleSubmit()}

                                >
                                    {loading ? (
                                        <ActivityIndicator size="small" color="white" />
                                    ) : (
                                        <Text style={{ color: "white", fontWeight: "bold", fontSize: 16 }}>
                                            Complete
                                        </Text>
                                    )}
                                </TouchableOpacity>
                            </View>
                        )}
                    </View>
                )}


                {/* </View> */}
            </ScrollView>
        </SafeAreaView>
    )
}

const styles = StyleSheet.create({
    itemContainer: {
        gap: 5,
        backgroundColor: "#F9F5F0",
        borderColor: '#333',
        borderWidth: 0.5,
        borderRadius: 6,
        padding: 15,
        marginBottom: 10
    },
    detailItem: {
        gap: 5,
        // backgroundColor: "#FFFFFF", 
        // borderBottomWidth: 1,
        borderColor: "#DDD",
        // borderRadius: 5,
        // padding: 10,
        marginVertical: 10
    },
    itemContentLabel: {
        fontWeight: 'bold'
    },
    itemContent: {
        fontSize: 14
    }
});

export default DetailsBooking