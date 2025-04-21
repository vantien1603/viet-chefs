import React, { useContext, useEffect, useState, useCallback } from "react";
import { View, FlatList, Text, RefreshControl, ActivityIndicator, StyleSheet } from "react-native";
import { collection, query, where, orderBy, limit, startAfter, getDocs } from "firebase/firestore";
import { database } from "../../config/firebase";
import { AuthContext } from "../../config/AuthContext";
import { SafeAreaView } from "react-native-safe-area-context";
import { commonStyles } from "../../style";
import { TouchableOpacity } from "react-native";
import Header from "../../components/header";
import useActionCheckNetwork from "../../hooks/useAction";


const NotificationChef = () => {
    const { user } = useContext(AuthContext);
    const [notifications, setNotifications] = useState([]);
    const [lastVisible, setLastVisible] = useState(null);
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const PAGE_SIZE = 10;
    const requireNetwork = useActionCheckNetwork();

    const fetchNotifications = (refresh = false) => {
        if (loading) return;

        requireNetwork(() => {
            (async () => {
                setLoading(true);
                try {
                    let q = query(
                        collection(database, "notifications"),
                        where("userId", "==", user.userId),
                        orderBy("createdAt", "desc"),
                        limit(PAGE_SIZE)
                    );

                    if (!refresh && lastVisible) {
                        q = query(
                            collection(database, "notifications"),
                            where("userId", "==", user.userId),
                            orderBy("createdAt", "desc"),
                            startAfter(lastVisible),
                            limit(PAGE_SIZE)
                        );
                    }

                    const snapshot = await getDocs(q);

                    const newData = snapshot.docs.map((doc) => ({
                        id: doc.id,
                        ...doc.data(),
                    }));

                    if (refresh) {
                        setNotifications(newData);
                    } else {
                        setNotifications((prev) => [...prev, ...newData]);
                    }

                    setLastVisible(snapshot.docs[snapshot.docs.length - 1]);
                    setHasMore(snapshot.docs.length === PAGE_SIZE);
                } catch (err) {
                    console.error("Error fetching notifications:", err);
                } finally {
                    setLoading(false);
                    if (refresh) setRefreshing(false);
                }
            })();
        });
    };


    const handleRefresh = () => {
        setRefreshing(true);
        setLastVisible(null);
        fetchNotifications(true);
    };

    const handleLoadMore = () => {
        if (!loading && hasMore) {
            fetchNotifications(false);
        }
    };

    const renderItem = ({ item }) => (
        <TouchableOpacity style={[styles.notificationItem, { backgroundColor: !item.read && '#fff' }]}>
            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.message}>{item.body}</Text>
            <Text style={styles.time}>{item.createdAt?.toDate ? item.createdAt.toDate().toLocaleString() : 'Không xác định'} </Text>
            <TouchableOpacity style={styles.readButton}>
                {item.read && <Ionicons name="checkmark-done" size={24} color="#ccc" />}
            </TouchableOpacity>
        </TouchableOpacity>
    );

    useEffect(() => {
        fetchNotifications(true);
    }, [user?.userId]);

    return (
        <SafeAreaView style={commonStyles.container}>
            <Header title={"Notification"} />
            <FlatList
                data={notifications}
                renderItem={renderItem}
                keyExtractor={(item) => item.id}
                style={commonStyles.containerContent}
                contentContainerStyle={{ paddingBottom: 80 }}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
                }
                onEndReached={handleLoadMore}
                onEndReachedThreshold={0.4}
                ListFooterComponent={
                    loading && !refreshing ? <ActivityIndicator size="small" color="#000" /> : null
                }
            />
        </SafeAreaView>
    );
};
const styles = StyleSheet.create({
    notificationItem: {
        // flexDirection: "row",
        backgroundColor: "#F9F5F0",
        padding: 15,
        marginVertical: 5,
        marginHorizontal: 10,
        borderRadius: 8,
        elevation: 2,
        // alignItems: "center",
    },
    notificationContent: {
        // flex: 1,
    },
    title: {
        fontSize: 16,
        fontWeight: "bold",
        marginBottom: 5,
    },
    message: {
        fontSize: 14,
        color: "#333",
        marginBottom: 5,
    },
    time: {
        textAlign: 'right',
        fontSize: 12,
        color: "#666",
    },
    readButton: {
        padding: 5,
        minWidth: 34,
    },

});
export default NotificationChef;
