import {
  View,
  Text,
  TextInput,
  Image,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import React, { useState } from "react";
import { useRouter } from "expo-router";
import { commonStyles } from "../../style";
import Header from "../../components/header";
import AXIOS_BASE from "../../config/AXIOS_BASE";
export default function SignUpScreen() {
  const [phone, setPhone] = useState("");
  const [mail, setMail] = useState("");
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const router = useRouter();
  const [errors, setErrors] = useState({});

  const handleSignUp = async () => {
    const currentErrors = {};
    try {
      const signUpPayload = {
        username: username.trim(),
        email: mail.trim(),
        fullName: fullName.trim(),
        dob: "1999-01-01",
        gender: "Male",
        phone: phone.trim(),
      };

      if (!signUpPayload.username)
        currentErrors.username = "Username is required";
      if (!signUpPayload.fullName)
        currentErrors.fullName = "Full name is required";
      if (!signUpPayload.phone) {
        currentErrors.phone = "Phone is required";
      } else if (!/^0\d{9}$/.test(signUpPayload.phone)) {
        currentErrors.phone =
          "Phone must start with 0 and be exactly 10 digits";
      }

      if (!signUpPayload.email) {
        currentErrors.email = "Email is required";
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(signUpPayload.email)) {
        currentErrors.email = "Invalid email format";
      }

      if (Object.keys(currentErrors).length > 0) {
        setErrors(currentErrors);
        return;
      }

      // Gửi đăng ký nếu hợp lệ
      const response = await AXIOS_BASE.post("/register", signUpPayload);
      console.log(response.data);

      if (response.status === 201) {
        router.push({
          pathname: "screen/verify",
          params: {
            username,
            fullName,
            phone,
            mail,
            mode: "register",
          },
        });
      }
    } catch (error) {
      if (error.response) {
        console.error(`Error ${error.response.status}:`, error.response.data);
        setErrors(error.response.data.message || "Registration failed.");
      } else {
        console.error(error.message);
        setErrors("An unexpected error occurred.");
      }
    }
  };

  return (
    <ScrollView style={commonStyles.containerContent}>
      <Header title="Register" />
      <View>
        <Text style={{ fontSize: 18, fontWeight: "bold" }}>
          Pleasure to be at your service!
        </Text>
        <Text style={{ fontSize: 16, marginTop: 10, marginBottom: 20 }}>
          Create an account now to experience our services!
        </Text>

        <Text style={commonStyles.labelInput}>Username</Text>
        <TextInput
          style={[
            commonStyles.input,
            errors.username && { borderColor: "red", borderWidth: 1 },
          ]}
          placeholder="User name"
          value={username}
          onChangeText={(text) => {
            setUsername(text);
            if (errors.username && text.trim() !== "") {
              setErrors((prev) => ({ ...prev, username: null }));
            }
          }}
        />
        {errors.username && (
          <Text style={{ color: "red", fontSize: 12 }}>{errors.username}</Text>
        )}
        <Text style={commonStyles.labelInput}>First and last name</Text>
        <TextInput
          style={[
            commonStyles.input,
            errors.fullName && { borderColor: "red", borderWidth: 1 },
          ]}
          placeholder="Full name"
          value={fullName}
          onChangeText={(text) => {
            setFullName(text);
            if (errors.fullName && text.trim() !== "") {
              setErrors((prev) => ({ ...prev, fullName: null }));
            }
          }}
        />
        {errors.fullName && (
          <Text style={{ color: "red", fontSize: 12 }}>{errors.fullName}</Text>
        )}
        <Text style={commonStyles.labelInput}>Phone number</Text>
        <TextInput
          style={[
            commonStyles.input,
            errors.phone && { borderColor: "red", borderWidth: 1 },
          ]}
          placeholder="03730xxxxx"
          // placeholderTextColor="#968B7B"
          keyboardType="numeric"
          value={phone}
          onChangeText={(text) => {
            setPhone(text);
            if (errors.phone && text.trim() !== "") {
              setErrors((prev) => ({ ...prev, phone: null }));
            }
          }}
        />
        {errors.phone && (
          <Text style={{ color: "red", fontSize: 12 }}>{errors.phone}</Text>
        )}
        <Text style={commonStyles.labelInput}>Mail address</Text>
        <TextInput
          style={[commonStyles.input, errors.email && { borderColor: "red", borderWidth: 1 }]}
          placeholder="xxx@gmail.com"
          // placeholderTextColor="#968B7B"
          keyboardType="email-address"
          value={mail}
          onChangeText={(text) => {
            setMail(text);
            if (errors.email && text.trim() !== "") {
              setErrors((prev) => ({ ...prev, mail: null }));
            }
          }}
        />
        {errors.email && (
          <Text style={{ color: "red", fontSize: 12 }}>{errors.email}</Text>
        )}

        <View style={{ flex: 1, alignItems: "center" }}>
          <TouchableOpacity
            onPress={handleSignUp}
            style={{
              padding: 13,
              marginTop: 10,
              borderWidth: 1,
              backgroundColor: "#383737",
              borderColor: "#383737",
              borderRadius: 50,
              width: 300,
            }}
          >
            <Text
              style={{
                textAlign: "center",
                fontSize: 18,
                color: "#fff",
                fontFamily: "nunito-bold",
              }}
            >
              Next
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}
