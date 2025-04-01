import React, { useContext, useState } from 'react'
import {
    View,
    Text,
    TextInput,
    FlatList,
    Image,
    StyleSheet,
    TouchableOpacity,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import Ionicons from "@expo/vector-icons/Ionicons";
import AntDesign from "@expo/vector-icons/AntDesign";
import { collection, addDoc, orderBy, query, onSnapshot, doc, getDoc } from 'firebase/firestore';
import { database } from '../../config/firebase';
import { AuthContext } from '../../config/AuthContext';
const Message = () => {
    const [loading, setLoading] = useState(false);
    const [messages, setMessages] = useState([]);
    const [inputText, setInputText] = useState('');
    const [receiverId, setReceiverId] = useState(null);
    const { user } = useContext(AuthContext);


    useEffect(() => {
        if (!user.userId || !receiverId) return;

        const collectionRef = collection(database, 'chats');
        const q = query(collectionRef, orderBy('createdAt', 'desc'));

        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            setMessages(
                querySnapshot.docs
                    .map(doc => doc.data())
                    .filter(
                        message =>
                            (message.sender === user.userId && message.receiver === receiverId) ||
                            (message.sender === receiverId && message.receiver === user.userId)
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
    }, [user.userId, receiverId]);

    const sendMessage = async () => {
        if (!inputText.trim()) return;

        const newMessage = {
            text: inputText,
            createdAt: new Date(),
            sender: user.userId,
            user: {
                _id: user.userId,
                name: user.fullName,
                avatar: 'https://i.pravatar.cc/300'
            },
            receiver: receiverId,
            _id: Math.random().toString(36),
        };
        setInputText('');

        await addDoc(collection(database, 'chats'), newMessage);
    };

    const renderMessage = ({ item }) => (
        <View
            style={[
                styles.messageContainer,
                item.isSender ? styles.sender : styles.receiver,
            ]}
        >
            <Text style={styles.messageText}>{item.text}</Text>
            <Text style={styles.messageTime}>{item.time}</Text>
        </View>
    );
    return (
        <SafeAreaView>
            <View>

            </View>
        </SafeAreaView>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "white",
    },
    header: {
        flexDirection: "row",
        alignItems: "center",
        padding: 15,
        borderBottomWidth: 1,
        borderBottomColor: "#E0E0E0",
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
    name: {
        fontSize: 16,
        fontWeight: "bold",
        color: '#222',
    },
    onlineStatus: {
        fontSize: 12,
        color: "#7F7F7F",
    },
    chatContainer: {
        flex: 1,
        padding: 10,
    },
    messageContainer: {
        maxWidth: "75%",
        marginVertical: 5,
        padding: 10,
        borderRadius: 10,
    },
    sender: {
        alignSelf: "flex-end",
        backgroundColor: "#DCF8C6",
    },
    receiver: {
        alignSelf: "flex-start",
        backgroundColor: "#E0E0E0",
    },
    messageText: {
        fontSize: 16,
    },
    messageTime: {
        fontSize: 10,
        color: "#7F7F7F",
        alignSelf: "flex-end",
    },
    inputContainer: {
        flexDirection: "row",
        alignItems: "center",
        padding: 10,
        borderTopWidth: 1,
        borderTopColor: "#E0E0E0",
    },
    input: {
        flex: 1,
        marginHorizontal: 10,
        borderRadius: 20,
        paddingHorizontal: 20,
        paddingVertical: 5,
        backgroundColor: "#F1F1F1",
    },
});

export default Message