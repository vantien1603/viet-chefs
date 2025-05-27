import { Ionicons } from "@expo/vector-icons";
import { t } from "i18next";
import React, { useState, useEffect, useRef } from "react";
import { StyleSheet, TextInput, ActivityIndicator } from "react-native";
import { TouchableOpacity } from "react-native";
import { Text } from "react-native";
import { ScrollView } from "react-native";
import { View } from "react-native";

const CustomChat = ({ messages, onSendMessage, callApi, onContactAdmin }) => {
  const [inputText, setInputText] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(true);
  const [isBotTyping, setIsBotTyping] = useState(false); // New state for typing indicator
  const scrollViewRef = useRef();

  useEffect(() => {
    const hasUserMessage = messages.some((msg) => msg.role === "customer");
    if (hasUserMessage) {
      setShowSuggestions(false);
    }
  }, [messages]);

  useEffect(() => {
    scrollViewRef.current?.scrollToEnd({ animated: true });
  }, []);

  const handleSend = async () => {
    if (!inputText.trim()) return;

    const userMessage = { role: "customer", content: inputText, suggestContactAdmin: false };
    onSendMessage(userMessage);
    setInputText(""); 
    setIsBotTyping(true);
    try {
      await callApi(inputText);
    } finally {
      setIsBotTyping(false);
    }
  };

  const handleSuggestionPress = async (suggestion) => {
    const userMessage = { role: "customer", content: t(`${suggestion}`), suggestContactAdmin: false };
    onSendMessage(userMessage);
    setInputText(""); 
    setIsBotTyping(true); 
    try {
      await callApi(t(`${suggestion}`));
    } finally {
      setIsBotTyping(false);
    }
  };

  return (
    <View style={customStyles.chatContainer}>
      <ScrollView
        style={customStyles.messageContainer}
        ref={scrollViewRef}
        onContentSizeChange={() => scrollViewRef.current.scrollToEnd({ animated: true })}
      >
        {messages.map((message, index) => (
          message.content ? (
            <View key={index}>
              <View
                style={[
                  customStyles.messageBubble,
                  message.role === "customer"
                    ? customStyles.userMessage
                    : customStyles.botMessage,
                ]}
              >
                {message.role === "customer" ? (
                  <View style={customStyles.messageHeader}>
                    <Text style={customStyles.messageRole}>{t("you")}</Text>
                  </View>
                ) : (
                  <View style={customStyles.messageHeader}>
                    <Text style={customStyles.messageRole}>Bot</Text>
                  </View>
                )}
                <Text style={customStyles.messageText}>{message.content}</Text>
              </View>
              {message.suggestContactAdmin && message.role === "assistant" && (
                <TouchableOpacity
                  style={customStyles.contactAdminButton}
                  onPress={onContactAdmin}
                >
                  <Text style={customStyles.contactAdminText}>{t("contactSupport")}</Text>
                </TouchableOpacity>
              )}
            </View>
          ) : null
        ))}
        {isBotTyping && (
          <View style={[customStyles.messageBubble, customStyles.botMessage]}>
            <View style={customStyles.messageHeader}>
              <Text style={customStyles.messageRole}>Bot</Text>
            </View>
            <ActivityIndicator size="small" color="#333" />
          </View>
        )}
        {showSuggestions && (
          <View style={customStyles.suggestionContainer}>
            <TouchableOpacity
              style={customStyles.suggestionButton}
              onPress={() => handleSuggestionPress("askStaff")}
            >
              <Text style={customStyles.suggestionText}>{t("askStaff")}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={customStyles.suggestionButton}
              onPress={() => handleSuggestionPress("whatIsVietChef")}
            >
              <Text style={customStyles.suggestionText}>{t("whatIsVietChef")}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={customStyles.suggestionButton}
              onPress={() => handleSuggestionPress("guideSingleBooking")}
            >
              <Text style={customStyles.suggestionText}>{t("guideSingleBooking")}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={customStyles.suggestionButton}
              onPress={() => handleSuggestionPress("guideLongTermBooking")}
            >
              <Text style={customStyles.suggestionText}>{t("guideLongTermBooking")}</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
      <View style={customStyles.inputContainer}>
        <TextInput
          style={customStyles.input}
          value={inputText}
          onChangeText={setInputText}
          placeholder={t("inputPlaceholder")}
        />
        <TouchableOpacity onPress={handleSend}>
          <Ionicons name="send" size={24} color="black" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const customStyles = StyleSheet.create({
  chatContainer: {
    flex: 1,
    backgroundColor: "#EBE5DD",
  },
  messageContainer: {
    flex: 1,
    padding: 10,
  },
  messageBubble: {
    padding: 10,
    borderRadius: 10,
    marginVertical: 5,
    maxWidth: "80%",
  },
  userMessage: {
    backgroundColor: "#3498db",
    alignSelf: "flex-end",
  },
  botMessage: {
    backgroundColor: "#e0e0e0",
    alignSelf: "flex-start",
  },
  messageText: {
    color: "black",
    fontFamily: "nunito-regular"
  },
  inputContainer: {
    flexDirection: "row",
    padding: 10,
    borderTopWidth: 1,
    borderTopColor: "#ddd",
  },
  input: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 10,
    marginRight: 10,
    fontFamily: "nunito-regular"
  },
  suggestionContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "flex-start",
    marginTop: 10,
  },
  suggestionButton: {
    backgroundColor: "#e0e0e0",
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 15,
    marginRight: 10,
    marginBottom: 10,
  },
  suggestionText: {
    color: "#333",
    fontSize: 14,
    fontFamily: "nunito-regular"
  },
  messageHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 5,
  },
  messageRole: {
    fontSize: 12,
    fontFamily: "nunito-bold",
    color: "#333",
    marginLeft: 5,
  },
  contactAdminButton: {
    backgroundColor: "#A9411D",
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 15,
    marginTop: 5,
    marginBottom: 10,
    alignSelf: "flex-start",
  },
  contactAdminText: {
    color: "#fff",
    fontSize: 14,
    fontFamily: "nunito-bold",
  },
});

export default CustomChat;