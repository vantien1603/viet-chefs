import { View, Text, TextInput, Image, TouchableOpacity, ScrollView, Linking } from 'react-native';
import React, { useState } from 'react';
import { useRouter } from 'expo-router';
import { commonStyles } from '../../style';
import Header from '../../components/header';
import axios from 'axios';
import useActionCheckNetwork from '../../hooks/useAction';
import { useCommonNoification } from '../../context/commonNoti';
import useAxiosBase from '../../config/AXIOS_BASE';
export default function SignUpScreen() {
    const [phone, setPhone] = useState('');
    const [mail, setMail] = useState('');
    const [fullName, setFullName] = useState('');
    const [username, setUsername] = useState('');
    const router = useRouter();
    const { showModal } = useCommonNoification();
    const [agreeTerms, setAgreeTerms] = useState(false);
    const axiosInstanceBase = useAxiosBase();
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});


    const handleSignUp = async () => {
        const currentErrors = {};
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
        setLoading(true);
        try {
            const signUpPayload = {
                username: username.trim(),
                email: mail.trim(),
                fullName: fullName.trim(),
                dob: "1999-01-01",
                gender: "Male",
                phone: phone.trim(),
            };
            const response = await axiosInstanceBase.post('/register', signUpPayload);
            if (response.status === 201) {
                router.push({
                    pathname: "screen/verify",
                    params: { username, fullName, phone, mail, mode: "register" }
                });
            }

        } catch (error) {
            if (axios.isCancel(error)) {
                return;
            }
            // showModal("Error", "Có lỗi xảy ra trong quá trình đăng ký.", "Failed");
            showModal("Error", error.response.data.message, "Failed");
        }
    };

    return (

        <ScrollView style={commonStyles.container}>
            <Header title="Register" />
            <View style={commonStyles.containerContent}>
                <Text style={{ fontSize: 18, fontWeight: 'bold' }}> Pleasure to be at your service!</Text>
                <Text style={{ fontSize: 16, marginTop: 10, marginBottom: 20 }}> Create an account now to experience our services!</Text>

                <Text style={commonStyles.labelInput}>Username</Text>
                <TextInput
                    style={commonStyles.input}
                    placeholder='User name'
                    value={username}
                    onChangeText={(text) => {
                        setUsername(text);
                        if (errors.username && text.trim() !== "") {
                            setErrors((prev) => ({ ...prev, username: null }));
                        }
                    }} />
                {errors.username && (
                    <Text style={{ color: "red", fontSize: 12 }}>{errors.username}</Text>
                )}
                <Text style={commonStyles.labelInput}>First and last name</Text>
                <TextInput
                    style={commonStyles.input}
                    placeholder='Full name'
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
                    style={commonStyles.input}
                    placeholder="03730xxxxx"
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
                    style={commonStyles.input}
                    placeholder="xxx@gmail.com"
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
                <View style={{ flexDirection: 'row', alignItems: 'center', marginVertical: 10 }}>
                    <TouchableOpacity onPress={() => setAgreeTerms(!agreeTerms)} style={{
                        width: 24,
                        height: 24,
                        borderRadius: 4,
                        borderWidth: 1,
                        borderColor: '#333',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginRight: 10,
                    }}>
                        {agreeTerms && (
                            <View style={{
                                width: 12,
                                height: 12,
                                backgroundColor: '#333',
                                borderRadius: 2,
                            }} />
                        )}
                    </TouchableOpacity>
                    <Text style={{ flex: 1 }}>
                        Tôi đồng ý với{' '}
                        <Text
                            style={{ color: '#007AFF', textDecorationLine: 'underline' }}
                            onPress={() => {
                                Linking.openURL('https://www.termsfeed.com/live/34c3495d-1cd2-4b4c-95f2-cf216da991ed');
                            }}
                        >
                            các điều khoản và điều kiện
                        </Text>
                    </Text>
                </View>

                <View style={{ flex: 1, alignItems: 'center' }}>
                    <TouchableOpacity onPress={() => handleSignUp()} style={{
                        padding: 13,
                        marginTop: 10,
                        borderWidth: 1,
                        backgroundColor: '#383737',
                        borderColor: '#383737',
                        borderRadius: 50,
                        width: 300,
                    }}>
                        <Text style={{
                            textAlign: 'center',
                            fontSize: 18,
                            color: '#fff',
                            fontFamily: 'nunito-bold',
                        }}>Next</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </ScrollView>
    );
}
