import React, { useContext, useState, useEffect } from 'react';
import {
    View,
    Text,
    TextInput,
    FlatList,
    Image,
    StyleSheet,
    TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from "@expo/vector-icons/Ionicons";
import { collection, addDoc, orderBy, query, onSnapshot } from 'firebase/firestore';
import { database } from '../../config/firebase';
import { AuthContext } from '../../config/AuthContext';
import { commonStyles } from '../../style';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import Feather from '@expo/vector-icons/Feather';

const Message = () => {
    const [loading, setLoading] = useState(false);
    const [messages, setMessages] = useState([]);
    const [inputText, setInputText] = useState('');
    const [receiverId, setReceiverId] = useState(null);
    const { user } = useContext(AuthContext);
    const route = useRoute();
    const router = useRouter();
    const navigation = useNavigation();
    const { contact } = route.params;

    console.log("cconascnac", contact);
    useEffect(() => {
        if (!user.userId || !contact.id) return;

        const collectionRef = collection(database, 'chats');
        const q = query(collectionRef, orderBy('createdAt', 'desc'));

        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            setMessages(
                querySnapshot.docs
                    .map(doc => doc.data())
                    .filter(
                        message =>
                            (message.sender === user.userId && message.receiver === contact.id) ||
                            (message.sender === contact.id && message.receiver === user.userId)
                    )
                    .map(doc => ({
                        id: doc._id,
                        text: doc.text,
                        time: doc.createdAt.toDate().toLocaleTimeString(),
                        isSender: doc.sender === user.userId,
                    }))
            );
        });
        return unsubscribe;
    }, [user.userId, contact.id]);

    const sendMessage = async () => {
        if (!inputText.trim()) return;
        const newMessage = {
            text: inputText,
            createdAt: new Date(),
            // sender: "1",
            sender: user.userId,
            user: {
                // _id: "1",
                _id: user.userId,
                name: user.fullName,
                avatar: 'https://i.pravatar.cc/300'
            },
            // receiver: receiverId,
            receiver: contact.id,
            _id: Math.random().toString(36),
        };
        setInputText('');
        await addDoc(collection(database, 'chats'), newMessage);
    };

    const renderMessage = ({ item }) => (
        <View
            style={[
                styles.messageContainer,
                item.isSender ? styles.sender : styles.receiver
            ]}
        >
            <Text style={styles.messageText}>{item.text}</Text>
            <Text style={styles.messageTime}>{item.time}</Text>
        </View>
    );

    return (
        <SafeAreaView style={commonStyles.container}>
            {/* <View style={styles.header}>
                <Image source={{ uri: contact.avatar }} style={styles.avatar} />
                <View style={styles.headerContent}>
                    <Text style={styles.name}>{contact.name}</Text>
                </View>
            </View> */}
            <View style={styles.container}>
                <TouchableOpacity style={styles.iconContainer} onPress={() => router.back()}>
                    <Ionicons name="arrow-back" size={24} color="black" />
                </TouchableOpacity>
                <View style={[styles.textContainer]}>
                    <Text style={styles.title}>{contact.name}</Text>
                </View>
                <View>
                    <Feather name="info" size={28} color="black" />
                </View>
            </View>
            <FlatList
                data={messages}
                keyExtractor={(item) => item.id.toString()}
                renderItem={renderMessage}
                style={styles.chatContainer}
                inverted
            />

            <View style={styles.inputContainer}>
                {/* <Ionicons name="image-outline" size={25} color="#7F7F7F" /> */}
                <TextInput
                    style={styles.input}
                    placeholder="Aa"
                    value={inputText}
                    onChangeText={setInputText}
                />
                <TouchableOpacity onPress={sendMessage}>
                    <Ionicons name="send" size={25} color="#68A7AD" />
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 10,
        paddingLeft: 0,
        borderBottomWidth: 1.5,
        borderBottomColor: '#e0e0e0',
        paddingBottom: 20
    },
    iconContainer: {
        width: 60,
        height: 60,
        borderRadius: 30,
        justifyContent: 'center',
        alignItems: 'center',
    },
    textContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 16,
    },
    title: {
        color: "#000",
        fontSize: 20,
        fontWeight: 'bold',
    },

    avatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        marginRight: 10,
        marginLeft: 15,
    },
    headerContent: {
        flex: 1,
    },

    messageContainer: {
        maxWidth: "75%",
        marginVertical: 5,
        paddingVertical: 12,
        paddingHorizontal: 15,
        borderRadius: 15,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 2.0,
        elevation: 3,
        marginBottom: 20,
    },
    sender: {
        // padding:10,
        marginRight: 20,
        alignSelf: "flex-end",
        backgroundColor: "#D3CBC5",
    },
    receiver: {
        marginLeft: 20,
        alignSelf: "flex-start",
        backgroundColor: "#FFF8E7",
    },
    messageText: {
        fontSize: 18,
        color: "#333",
    },
    messageTime: {
        fontSize: 12,
        color: "#7F7F7F",
        alignSelf: "flex-end",
    },
    inputContainer: {
        flexDirection: "row",
        alignItems: "center",
        padding: 10,
        marginTop: 20,
        borderTopWidth: 1,
        borderTopColor: "#E0E0E0",
        backgroundColor: '#F4EDE4',
    },
    input: {
        flex: 1,
        // marginHorizontal: 10,
        borderRadius: 25,
        paddingHorizontal: 20,
        paddingVertical: 15,
        backgroundColor: "#FFFFFF",
        borderWidth: 1,
        borderColor: '#ddd',
    },
});

export default Message;
