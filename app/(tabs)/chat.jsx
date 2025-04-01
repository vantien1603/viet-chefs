import React, { useContext, useEffect, useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, TextInput, FlatList } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { collection, query, onSnapshot, orderBy, doc, getDoc } from "firebase/firestore";
import { database } from "../../config/firebase";
import { commonStyles } from "../../style";
import { AuthContext } from "../../config/AuthContext";
import Icon from "react-native-vector-icons/MaterialIcons";
import Header from "../../components/header";

const Chat = () => {
  const { user } = useContext(AuthContext);
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState([]);

  async function getUserById(userId) {
    if (typeof userId !== 'string') {
      console.error('Invalid userId');
      return null;
    }
    const userDocRef = doc(database, 'users', userId);
    const userDoc = await getDoc(userDocRef);

    if (userDoc.exists()) {
      const userData = userDoc.data();
      console.log('User Data:', userData);
      return userData;
    } else {
      console.log('No such document!');
      return null;
    }
  }
  useEffect(() => {
    const fetchMessages = () => {
      const collectionRef = collection(database, 'chats');
      const q = query(collectionRef, orderBy('createdAt', 'desc'));

      const unsubscribe = onSnapshot(q, async (querySnapshot) => {
        const messagesData = {};
        const userPromises = [];

        querySnapshot.forEach((doc) => {
          const data = doc.data();
          if (data.sender === user.userId || data.receiver === user.userId) {
            const key = data.sender === user.userId ? data.receiver : data.sender;
            console.log("key", key);
            userPromises.push(getUserById(key).then(userInfo => {
              if (userInfo) {
                const currentTime = new Date(data.createdAt.seconds * 1000);
                if (!messagesData[key]) {
                  messagesData[key] = {
                    id: key,
                    name: userInfo.name,
                    message: data.text,
                    time: currentTime.toLocaleTimeString(),
                    avatar: "https://esx.bigo.sg/eu_live/2u6/2ZuCJH.jpg",
                    read: false,
                  };
                }
              }
            }));
          }
        });

        await Promise.all(userPromises);

        setMessages(Object.values(messagesData));
        console.log("Messages Data:", messagesData);
      });

      return unsubscribe;
    };

    let unsubscribe;

    if (user?.userId != null) {
      unsubscribe = fetchMessages();
    }

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [user?.userId]);

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={styles.messageItem}
      onPress={() => navigation.navigate("screen/chat", {
        contact: {
          id: item.id,
          name: item.name,
          avatar: item.avatar
        }
      })}
    >
      <Image source={{ uri: item.avatar }} style={styles.avatar} />
      <View style={styles.messageContent}>
        <Text style={styles.name}>{item.name}</Text>
        <Text style={styles.message} numberOfLines={1} ellipsizeMode="tail">
          {item.message}
        </Text>
      </View>
      <Text style={styles.time}>{item.time}</Text>

    </TouchableOpacity>
  );
  return (
    <SafeAreaView style={commonStyles.container}>
      <Header title={"Chat"} />
      <View style={commonStyles.containerContent}>
        <View style={commonStyles.searchContainer}>
          <Icon
            name="search"
            size={20}
            color="gray"
            style={commonStyles.searchIcon}
          />
          <TextInput style={commonStyles.searchInput} placeholder="Search" />
        </View>

        <FlatList
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
        />

        {/* <TouchableOpacity
          style={styles.addButton}
          onPress={() => navigation.navigate("screen/newMessage")}
        >
          <Ionicons name="add" size={25} color="white" />
        </TouchableOpacity> */}
      </View>
    </SafeAreaView>

  );
};

const styles = StyleSheet.create({
  messageItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 15,
  },
  messageContent: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: "bold",
  },
  message: {
    fontSize: 14,
    color: "#7F7F7F",
  },
  time: {
    fontSize: 12,
    color: "#7F7F7F",
    marginRight: 10,
  },
  addButton: {
    position: "absolute",
    bottom: 30,
    right: 30,
    backgroundColor: "#4EA0B7",
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    elevation: 5,
  },
});

export default Chat;
