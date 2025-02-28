import React, { useRef, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { commonStyles } from "../../style";
import { SafeAreaView } from "react-native-safe-area-context";
import Header from "../../components/header";

const VerifyScreen = () => {
  const router = useRouter();
  const { email } = useLocalSearchParams();
  const [code, setCode] = useState(["", "", "", ""]);
  const inputRefs = useRef([]);

  const handleInputChange = (value, index) => {
    if (/^\d?$/.test(value)) {
      const newCode = [...code];
      newCode[index] = value;
      setCode(newCode);

      
      if (value && index < 3) {
        inputRefs.current[index + 1]?.focus();
      }
    }
  };

  const handleKeyPress = (e, index) => {
    if (e.nativeEvent.key === "Backspace" && code[index] === "" && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = () => {
    const verificationCode = code.join("");
    if (verificationCode.length === 4) {
      router.push("screen/setPassword");
      console.log("Entered code:", verificationCode);
    } else {
      alert("Please enter a 4-digit code.");
    }
  };

  return (
    <SafeAreaView style={commonStyles.container}>
      <Header title={'Verify account'}/>
      <View style={commonStyles.containerContent}>
        {/* <Image
          source={require("../../assets/images/logo.png")}
          style={{ width: 400, height: 250 }}
          resizeMode="cover"
        /> */}
        <Text style={{textAlign:'center', fontSize:16, fontWeight:'600'}}>Please enter the 4-digit verification code that has been sent to the phone number</Text>

        <View style={styles.inputCode}>
          {code.map((digit, index) => (
            <TextInput
              key={index}
              ref={(el) => (inputRefs.current[index] = el)}
              style={styles.box}
              value={digit}
              onChangeText={(value) => handleInputChange(value, index)}
              onKeyPress={(e) => handleKeyPress(e, index)}
              keyboardType="numeric"
              maxLength={1} 
              autoFocus={index === 0} 
            />
          ))}
        </View>

        <TouchableOpacity style={{ alignItems: "center", marginBottom: 10 }}>
          <Text style={{ color: "#383737", fontSize: 16 }}>Not receive code?</Text>
        </TouchableOpacity>
        <View style={commonStyles.mainButtonContainer}>
          <TouchableOpacity onPress={handleVerify} style={commonStyles.mainButton}>
            <Text style={commonStyles.textMainButton}>VERIFY</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  inputCode: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  box: {
    width: 60,
    height: 60,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    fontSize: 24,
    textAlign: "center", 
    fontWeight: "bold",
  },
});

export default VerifyScreen;
