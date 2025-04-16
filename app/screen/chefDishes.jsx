import {
    View,
    Text,
    Image,
    FlatList,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
} from "react-native";
import React, { useContext, useEffect, useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import Header from "../../components/header";
import useAxios from "../../config/AXIOS_API";
import { AuthContext } from "../../config/AuthContext";
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useRouter } from "expo-router";
import { useCommonNoification } from "../../context/commonNoti";

const ChefDishes = () => {
    const [dishes, setDishes] = useState([]);
    const [filteredDishes, setFilteredDishes] = useState([]);
    const [selectionMode, setSelectionMode] = useState(false);
    const [selectedDishes, setSelectedDishes] = useState([]);
    const [loading, setLoading] = useState(false);
    const router = useRouter();
    const axiosInstance = useAxios();
    const { user } = useContext(AuthContext);
    const [menus, setMenus] = useState([]);
    const [loadingAction, setLoadingAction] = useState(false);
    const { showModal } = useCommonNoification();

    useEffect(() => {
        fetchDishes();
    }, []);

    const fetchDishes = async () => {
        setLoading(true);
        try {
            const response = await axiosInstance.get("/dishes", {
                params: { chefId: user.chefId }
            });
            setDishes(response.data.content);
        } catch (error) {
            if (error.response) {
                console.error(`Lỗi ${error.response.status}:`, error.response.data);
            } else {
                console.error(error.message);
            }
        } finally {
            setLoading(false);
        }
    };

    const fetchMenu = async () => {
        setLoading(true);
        try {
            const response = await axiosInstance.get("/menus", {
                params: { chefId: 1 },
            });
            setMenus(response.data.content);
        } catch (error) {
            if (error.response) {
                console.error(`Lỗi ${error.response.status}:`, error.response.data);
            } else {
                console.error(error.message);
            }
        } finally {
            setLoading(false);
        }
    };

    const toggleSelection = (dishId) => {
        if (selectedDishes.includes(dishId)) {
            setSelectedDishes(selectedDishes.filter((id) => id !== dishId));
        } else {
            setSelectedDishes([...selectedDishes, dishId]);
        }
    };

    const handleLongPress = (dishId) => {
        setSelectionMode(true);
        setSelectedDishes([dishId]);
    };

    const selectAll = () => {
        const allIds = dishes.map((d) => d.id);
        setSelectedDishes(allIds);
    };

    const cancelSelection = () => {
        setSelectionMode(false);
        setSelectedDishes([]);
    };


    const handleDelete = async () => {
        if (selectedDishes.length === 0) return;
        let successCount = 0;
        let errorCount = 0;
        setLoading(true);
        try {
            const promises = selectedDishes.map((item) => axiosInstance.delete(`/dishes/${item}`));
            const results = await Promise.allSettled(promises);

            fetchDishes();
            setSelectedDishes([]);
            console.log(results);
            console.log("statusss", results.length);
            results.forEach((result) => {
                if (result.status === "fulfilled") {
                    successCount++;
                } else {
                    errorCount++;
                }
            });
            if (successCount === results.length) {
                showModal("Success", "All dishes delete successfully.");
            } else if (errorCount === results.length) {
                showModal("Error", "All dishes delete failed.");
            } else {
                showModal("Warning", `Some dishes created failed. Number of dishes success: ${successCount}, Number of dishes failed: ${errorCount}`);
            }
        } catch (error) {
            console.error("Lỗi khi xóa:", error.response?.data || error.message);
            alert("Có lỗi xảy ra khi xóa món ăn.");
        } finally {
            setLoading(false);
        }
    }



    return (
        <SafeAreaView style={styles.container}>
            <Header title="All dishes" rightIcon={"add"} onRightPress={() => router.push("/screen/addFood")} />
            {selectionMode && (
                <View style={styles.floatingActions}>
                    <TouchableOpacity style={[styles.floatingButton, { flexDirection: 'row', alignItems: 'center' }]} onPress={selectAll}>
                        <Text style={[styles.floatingText, { color: "grey" }]}>All ({selectedDishes.length})</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.floatingButton, { backgroundColor: "#FFCDD2", flexDirection: 'row', alignItems: 'center' }]} onPress={() => handleDelete()}>
                        <MaterialIcons name="delete" size={24} color="red" />
                        <Text style={[styles.floatingText, { color: "red" }]}>({selectedDishes.length})</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.floatingButton, { backgroundColor: "#E0E0E0" }]} onPress={cancelSelection}>
                        {/* <Text style={[styles.floatingText, { color: "#333" }]}>Hủy</Text> */}
                        <MaterialIcons name="cancel" size={24} color="black" />
                    </TouchableOpacity>
                </View>
            )}


            <FlatList
                data={dishes}
                keyExtractor={(item) => item.id.toString()}
                numColumns={2}
                // refreshing={refresh}
                // onRefresh={fetchDishes}
                contentContainerStyle={{ padding: 10, gap: 20, paddingVertical: 30 }}
                columnWrapperStyle={{ justifyContent: "space-between", marginBottom: 15 }}
                ListEmptyComponent={
                    // !loading ? (
                    <Text style={{ textAlign: "center", fontSize: 16 }}>No dish available</Text>
                    // ) : (
                    // <ActivityIndicator size="large" color="#6c5ce7" />
                    // )
                }
                ListHeaderComponent={
                    loading && (
                        <View style={styles.loadingContainer}>
                            <ActivityIndicator size="large" color="#6c5ce7" />
                        </View>
                    )
                }
                renderItem={({ item: dish }) => (
                    <TouchableOpacity
                        style={[
                            styles.cardContainer,
                            selectedDishes.includes(dish.id) && styles.selectedCard,
                        ]}
                        onLongPress={() => handleLongPress(dish.id)}
                        onPress={() => {
                            if (selectionMode) {
                                toggleSelection(dish.id);
                            }
                        }}
                    >
                        <View style={styles.card}>
                            <View style={styles.imageContainer}>
                                <Image
                                    source={{ uri: dish.imageUrl }}
                                    style={styles.image}
                                    defaultSource={require("../../assets/images/1.jpg")}
                                />
                            </View>
                            <Text style={styles.title}>{dish.name}</Text>
                            <Text style={styles.description}>{dish.description}</Text>
                            <Text style={styles.cookTime}>~ {dish.cookTime} minutes</Text>
                        </View>
                    </TouchableOpacity>
                )}
            />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#FDFBF6",
    },
    actionButtons: {
        flexDirection: "row",
        justifyContent: "space-between",
        paddingHorizontal: 16,
        paddingVertical: 10,
        backgroundColor: "#FFF",
        borderTopWidth: 1,
        borderTopColor: "#EEE",
    },
    actionText: {
        color: "#007BFF",
        fontSize: 16,
    },
    cardContainer: {
        width: "48%",
        alignItems: "center",
    },
    selectedCard: {
        borderWidth: 3,
        borderColor: "#F8BF40",
        borderRadius: 16,
        backgroundColor: "#A9411D",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 8,
        elevation: 10,
        transform: [{ scale: 1.03 }],
    },

    card: {
        backgroundColor: "#A9411D",
        borderRadius: 16,
        padding: 16,
        paddingTop: 50,
        alignItems: "center",
        width: "100%",
        //   height:'100%',
        maxHeight: 200,
        position: "relative",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        //   elevation: 5,
    },
    imageContainer: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: "#FFF",
        overflow: "hidden",
        position: "absolute",
        top: -30,
        justifyContent: "center",
        alignItems: "center",
    },
    image: {
        width: "100%",
        height: "100%",
        resizeMode: "cover",
    },
    title: {
        fontSize: 16,
        fontWeight: "bold",
        color: "#FFF",
        marginTop: 60,
        textAlign: "center",
        marginBottom: 4,
    },
    description: {
        fontSize: 13,
        color: "#F8BF40",
        textAlign: "center",
        marginBottom: 6,
    },
    cookTime: {
        fontSize: 13,
        color: "#FFFFFFAA",
        textAlign: "center",
    },

    floatingActions: {
        position: "absolute",
        bottom: 20,
        right: 20,
        zIndex: 999,
        gap: 10,
    },

    floatingButton: {
        backgroundColor: "#FFF9C4",
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 20,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 6,
        alignItems: 'center'
    },

    floatingText: {
        fontSize: 16,
        color: "#333",
        fontWeight: "bold",
    },

});

export default ChefDishes;
