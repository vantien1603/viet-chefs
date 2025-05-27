import React, { useContext, useEffect, useRef, useState } from "react";
import {
    Image,
    StyleSheet,
    Text,
    View,
    TouchableOpacity,
    ActivityIndicator,
    TextInput,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import useAxios from "../../config/AXIOS_API";
import { commonStyles } from "../../style";
import { Modalize } from "react-native-modalize";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { Switch } from "react-native";
import { AuthContext } from "../../config/AuthContext";
import { ScrollView } from "react-native";
import { useCommonNoification } from "../../context/commonNoti";
import { useLocalSearchParams, useRouter } from "expo-router";
import axios from "axios";
import { Feather, Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import useAxiosFormData from "../../config/AXIOS_API_FORM";
import * as ImageManipulator from 'expo-image-manipulator';




const MenuDetails = () => {
    // const route = useRoute();
    // const navigation = useNavigation();
    // const { menuId } = route.params;
    const { id } = useLocalSearchParams();

    const axiosInstanceForm = useAxiosFormData();
    const axiosInstance = useAxios();
    const modalizeRef = useRef(null);
    const [menu, setMenu] = useState({});
    const [editedMenu, setEditedMenu] = useState({});
    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(false);
    const [loadingAction, setLoadingAction] = useState(false);
    const [dishes, setDishes] = useState([]);
    const { user } = useContext(AuthContext);
    const [selectedDishes, setSelectedDishes] = useState([]);
    const { showModal } = useCommonNoification();
    const router = useRouter();
    const [image, setImage] = useState(null);
    useEffect(() => {
        fetchMenuDetails();
        fetchDishes();
    }, [id]);

    const fetchMenuDetails = async () => {
        setLoading(true);
        try {
            const response = await axiosInstance.get(`/menus/${id}`);
            setMenu(response.data);
            const selectedDishes = response.data.menuItems ? response.data.menuItems.map(item => item.dishId) : [];
            setSelectedDishes(selectedDishes);
            setEditedMenu(response.data);
        } catch (error) {
            if (error.response?.status === 401) {
                return;
            }
            if (axios.isCancel(error)) {
                return;
            }
            showModal(t("modal.error"), "Có lỗi xảy ra trong quá trình tải dữ liệu.", t("modal.failed"));
        } finally {
            setLoading(false);
        }
    };

    const fetchDishes = async () => {
        setLoading(true);
        try {
            const response = await axiosInstance.get("/dishes", {
                params: { chefId: user.chefId }
            });
            setDishes(response.data.content);

        } catch (error) {
            if (error.response?.status === 401) {
                return;
            }
            if (axios.isCancel(error)) {
                return;
            }
            showModal(t("modal.error"), "Có lỗi xảy ra trong quá trình tải danh sách món ăn.", t("modal.failed"));
        } finally {
            setLoading(false);
        }
    };

    const handleUpdate = async () => {
        setLoadingAction(true);
        try {
            const selectedDishPayload = selectedDishes.map((dishId) => ({ dishId }));

            const formData = new FormData();
            formData.append('name', editedMenu.name || menu.name);
            formData.append('description', editedMenu.description || '');
            formData.append('hasDiscount', editedMenu.hasDiscount);
            formData.append('discountPercentage', editedMenu.discountPercentage || 0);
            formData.append('totalCookTime', (editedMenu.totalCookTime || 0) / 60);

            selectedDishPayload.forEach((item, index) => {
                formData.append(`menuItems[${index}].dishId`, item.dishId);
            });

            if (image) {
                const filename = image.split('/').pop();
                const match = /\.(\w+)$/.exec(filename || '');
                const ext = match?.[1] || 'jpg';
                const mimeType = `image/${ext}`;

                formData.append('file', {
                    uri: image,
                    name: filename,
                    type: mimeType,
                });
            }

            // console.log("payload", payload);
            const response = await axiosInstanceForm.put(`/menus/${id}`, formData);
            if (response.status === 200) {
                showModal(t("modal.success"), "Cập nhật menu hành công", t("modal.success"));
            }

            await fetchMenuDetails();
            setIsEditing(false);
        } catch (error) {
            console.log(error.response.data)
            if (error.response?.status === 401) {
                return;
            }
            if (axios.isCancel(error)) {
                return;
            }
            showModal(t("modal.error"), "Có lỗi xảy ra trong quá trình cập nhật.", t("modal.failed"));
        } finally {
            setLoadingAction(false);
        }
    }



    const toggleDishSelection = (dishId) => {
        setSelectedDishes(prevSelectedDishes => {
            if (prevSelectedDishes.includes(dishId)) {
                return prevSelectedDishes.filter(id => id !== dishId);
            } else {
                return [...prevSelectedDishes, dishId];
            }
        });
    };


    const handleCheckboxToggle = () => {
        setEditedMenu(prev => ({
            ...prev,
            hasDiscount: !prev.hasDiscount
        }));
    };

    const handleDelete = async () => {
        setLoadingAction(true);
        try {
            const response = await axiosInstance.delete(`/menus/${id}`);
            if (response.status === 204) {
                showModal(t("modal.success"), "Delete menu successfully", t("modal.success"));
                router.replace("screen/menu")
            }
        } catch (error) {
            if (error.response?.status === 401) {
                return;
            }
            if (axios.isCancel(error)) {
                return;
            }
            showModal(t("modal.error"), "Có lỗi xảy ra trong quá trình xóa menu.", t("modal.failed"));
        } finally {
            setLoadingAction(false);
        }
    }


    const pickImage = async () => {
        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [4, 4],
            quality: 1,
        });

        if (!result.canceled) {
            const resized = await ImageManipulator.manipulateAsync(
                result.assets[0].uri,
                [{ resize: { width: 800 } }],
                { compress: 0.7 }
            );
            setImage(resized.uri);
        }
    };

    return (
        <GestureHandlerRootView>
            <SafeAreaView style={commonStyles.container}>
                {/* <Header title={!isEditing ? menu.name : "Edit Menu"} /> */}
                {loading ? (
                    <ActivityIndicator size="large" color="white" />
                ) : (
                    <View style={commonStyles.containerContent}>
                        <View style={styles.imageMenuContainer}>
                            {isEditing ? (
                                <TouchableOpacity onPress={() => pickImage()}>
                                    <Image
                                        source={image ? { uri: image } : { uri: editedMenu?.imageUrl }}
                                        style={styles.menuImage}
                                        resizeMode="cover"
                                    />
                                    <Feather
                                        name="camera"
                                        size={32}
                                        color="white"
                                        style={{
                                            position: 'absolute',
                                            top: '50%',
                                            left: '50%',
                                            transform: [{ translateX: -16 }, { translateY: -16 }],
                                            opacity: 0.8,
                                        }}
                                    />
                                </TouchableOpacity>
                            ) : (
                                <Image
                                    source={{ uri: editedMenu?.imageUrl }}
                                    style={styles.menuImage}
                                    resizeMode="cover"
                                />
                            )}
                            <TouchableOpacity
                                style={styles.backButton}
                                onPress={() => router.back()}
                            >
                                <Ionicons name="arrow-back" size={24} color="#fff" />
                            </TouchableOpacity>
                        </View>
                        <View style={{ marginTop: 20 }}>
                            {isEditing ? (
                                <TextInput
                                    placeholder="Menu name"
                                    value={editedMenu.name || ''}
                                    onChangeText={(text) =>
                                        setEditedMenu({ ...editedMenu, name: text || '' })
                                    }
                                    style={commonStyles.input}
                                />
                            ) : (
                                <Text style={{ fontSize: 20, fontFamily: "nunito-bold", marginBottom: 10 }}>{menu.name}</Text>
                            )}
                            {/* {renderPriceSection()} */}
                            {!isEditing ? (
                                <Text >
                                    <Text style={styles.itemContentLabel}>Price: </Text>
                                    {menu.hasDiscount ? (
                                        <>
                                            <Text style={styles.strikeThrough}>${menu.beforePrice}</Text>
                                            <Text style={styles.highlighted}>   ${menu.afterPrice}</Text>
                                        </>
                                    ) : (
                                        `$${menu.afterPrice}`
                                    )}
                                </Text>
                            ) : (
                                <View>
                                    <View style={[styles.checkboxRow, { gap: 10, }]}>
                                        <Text style={styles.itemContentLabel}>Has Discount:</Text>
                                        <Switch
                                            value={editedMenu.hasDiscount}
                                            onValueChange={handleCheckboxToggle}
                                            trackColor={{ false: "#ccc", true: "#4caf50" }}
                                            thumbColor={editedMenu.hasDiscount ? "#fff" : "#f4f3f4"}
                                        />
                                        {editedMenu.hasDiscount && (
                                            <TextInput
                                                placeholder="Discount %"
                                                value={editedMenu.discountPercentage?.toString() || ''}
                                                onChangeText={(text) =>
                                                    setEditedMenu({ ...editedMenu, discountPercentage: parseFloat(text) || 0 })
                                                }
                                                keyboardType="numeric"
                                                style={[commonStyles.input, { width: '30%', textAlign: 'center' }]}
                                            />
                                        )}
                                    </View>

                                </View>
                            )}

                        </View>

                        <TouchableOpacity
                            onPress={() => isEditing && modalizeRef.current?.open()}
                            style={{ marginTop: 15 }}
                        >
                            <Text style={styles.itemContentLabel}>Dishes: {isEditing && '(tap to edit)'}</Text>
                            <Text style={[styles.itemContent, {}]}>
                                {/* {editedMenu.menuItems?.map(dish => dish.dishName).join(", ")} */}
                                {dishes
                                    .filter((dish) => selectedDishes.includes(dish.id))
                                    .map((dish) => dish.name)
                                    .join(", ")}
                            </Text>
                        </TouchableOpacity>

                        {/* {isEditing && (
                            <TextInput
                                placeholder="Total cook time (minutes)"
                                keyboardType="numeric"
                                value={editedMenu.totalCookTime?.toString()}
                                onChangeText={(text) =>
                                    setEditedMenu((prev) => ({ ...prev, totalCookTime: parseInt(text) || 0 }))
                                }
                                style={commonStyles.input}
                            />
                        )} */}
                        <View>

                        </View>
                        <Text style={styles.itemContentLabel}>Total cook time:</Text>
                        {isEditing ? (
                            <TextInput
                                value={editedMenu.description}
                                onChangeText={(text) =>
                                    setEditedMenu({ ...editedMenu, description: text })
                                }
                                style={commonStyles.inputDes}
                                textAlignVertical="top"
                                multiline={true}
                            />
                        ) : (
                            <Text style={styles.itemContent}>{menu.description}</Text>
                        )}

                        <View>
                            <Text style={styles.itemContentLabel}>Description:</Text>
                            {isEditing ? (
                                <TextInput
                                    value={editedMenu.description}
                                    onChangeText={(text) =>
                                        setEditedMenu({ ...editedMenu, description: text })
                                    }
                                    style={commonStyles.inputDes}
                                    textAlignVertical="top"
                                    multiline={true}
                                />
                            ) : (
                                <Text style={styles.itemContent}>{menu.description}</Text>
                            )}
                        </View>
                        {!isEditing ? (
                            <View style={styles.buttonRow}>
                                <TouchableOpacity
                                    style={styles.updateButton}
                                    onPress={() => setIsEditing(true)}
                                >
                                    {loadingAction ? (
                                        <ActivityIndicator size="small" color="#fff" />
                                    ) : (
                                        <Text style={styles.buttonText}>Update</Text>
                                    )}
                                </TouchableOpacity>

                                <TouchableOpacity style={styles.deleteButton} onPress={() => handleDelete()}>
                                    {loadingAction ? (
                                        <ActivityIndicator size="small" color="#fff" />
                                    ) : (
                                        <Text style={styles.buttonText}>Delete</Text>
                                    )}
                                </TouchableOpacity>
                            </View>
                        ) : (
                            <TouchableOpacity
                                style={{
                                    position: "absolute",
                                    bottom: 20,
                                    left: 20,
                                    right: 20,
                                    backgroundColor: "#A64B2A",
                                    padding: 15,
                                    borderRadius: 10,
                                    alignItems: "center",
                                    elevation: 5,
                                }}
                                onPress={() => handleUpdate()}
                                disabled={loadingAction}
                            >
                                {loadingAction ? (
                                    <ActivityIndicator size="small" color="white" />
                                ) : (
                                    <Text style={{ color: "white", fontFamily: "nunito-bold", fontSize: 16 }}>
                                        Save
                                    </Text>
                                )}
                            </TouchableOpacity>
                        )}

                    </View>
                )}
            </SafeAreaView>


            <Modalize ref={modalizeRef} adjustToContentHeight>
                <View style={styles.modalContent}>
                    <ScrollView style={{ padding: 10 }} contentContainerStyle={{ paddingBottom: 50 }}>
                        {dishes && dishes.map((item) => (
                            <TouchableOpacity
                                key={item.id}
                                style={[styles.dishItem, selectedDishes.includes(item.id) && styles.selectedDish]}
                                onPress={() => toggleDishSelection(item.id)}
                            >
                                <View style={styles.imageContainer}>
                                    <Image
                                        source={{ uri: item.imageUrl }}
                                        style={styles.image}
                                        defaultSource={require("../../assets/images/1.jpg")}
                                    />
                                </View>
                                <Text style={styles.dishName}>{item.name}</Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>
            </Modalize>

        </GestureHandlerRootView>
    );
};

export default MenuDetails;

const styles = StyleSheet.create({
    modalContent: {
        minHeight: 700,
        height: 800,
        // padding: 20,
        backgroundColor: '#fff',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        // alignItems: 'center',
    },
    dishItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 15,
        backgroundColor: '#f9f9f9',
        borderRadius: 10,
        padding: 10,
        width: '100%',
        elevation: 5,
    },
    selectedDish: {
        borderWidth: 2,
        borderColor: "#F8BF40",
        borderRadius: 16,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 8,
        elevation: 10,
        transform: [{ scale: 1.03 }],
    },
    imageContainer: {
        width: 60,
        height: 60,
        borderRadius: 10,
        overflow: 'hidden',
        marginRight: 15,
    },

    imageMenuContainer: {
        position: "relative",
        marginBottom: 10
    },
    menuImage: {
        width: "100%",
        height: 250,
        borderRadius: 20,
        // borderBottomLeftRadius: 20,
        // borderBottomRightRadius: 20,
    },
    backButton: {
        position: "absolute",
        top: 16,
        left: 16,
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        borderRadius: 20,
        padding: 8,
    },
    image: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    dishName: {
        fontSize: 16,
        fontFamily: "nunito-bold",
        color: '#333',
        flexShrink: 1,
    },
    itemContentLabel: {
        fontFamily: "nunito-bold",
        fontSize: 15,
        // marginBottom: 5
    },
    itemContent: {
        fontSize: 14,
        color: "#333",
        marginHorizontal: 10, marginVertical: 10,
        fontFamily: "nunito-regular"
    },
    textInput: {
        backgroundColor: "#eee",
        color: "black",
        padding: 8,
        borderRadius: 6,
        marginTop: 4
    },
    strikeThrough: {
        textDecorationLine: "line-through",
        fontSize: 14,
        color: "gray",
        fontFamily: "nunito-regular"
    },
    highlighted: {
        fontSize: 16,
        fontFamily: "nunito-bold",
        color: "green"
    },
    checkboxRow: {
        flexDirection: "row",
        alignItems: "center",
    },
    buttonRow: {
        position: "absolute",
        bottom: 20,
        left: 20,
        right: 20,
        alignItems: "center",
        flexDirection: 'row',
        justifyContent: 'space-around'

    },
    updateButton: {
        backgroundColor: "orange",
        padding: 15,
        borderRadius: 10,
        width: "40%",
        alignItems: "center"
    },
    deleteButton: {
        backgroundColor: "red",
        padding: 15,
        borderRadius: 10,
        width: "40%",
        alignItems: "center"
    },
    buttonText: {
        color: "white",
        fontFamily: "nunito-bold",
        fontSize: 16
    }
});
