import { View, Text, TextInput, Image, TouchableOpacity, ScrollView, Alert } from 'react-native';
import React, { useState } from 'react';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PasswordInput } from '../../components/PasswordInput/passwordInput'; // Đảm bảo đúng đường dẫn
import { commonStyles } from '../../style';
import AXIOS_BASE from '../../config/AXIOS_BASE';

export default function LoginScreen() {
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [fullName, setFullName] = useState('');
    const [rePassword, setRePassword] = useState('');
    const [password, setPassword] = useState('');
    const router = useRouter();
    const randomUsername = `user_${Date.now()}`;

    const handleSignUp = async () => {
        const registerPayload = {
            username: randomUsername,
            email: email,
            phone: phone,
            fullName: fullName,
            password: password,
            dob: "1999-01-01",
            address: "Ho Chi Minh City",
            gender: "Male",
            rePassword: rePassword,
        };

        try {
            // console.log('data', registerPayload);
            const response = await AXIOS_BASE.post('/register', registerPayload);
            if(response.status === 201) {
                Alert.alert('Register success', 'Please verify your email');
                console.log('Register success');
                router.push(`/screen/verify?email=${encodeURIComponent(email)}`);
            } else {
                Alert.alert('Register failed', 'Please try again');
                console.log('Register failed');
            }
        } catch (error) {
            const message = error.response.data.message;
            Alert.alert('Register failed', message);
            console.log('Register failed', message);
        }
    };

    const handlePasswordChange = (value) => {
        setPassword(value);
    };
    const handleRePasswordChange = (value) => {
        setRePassword(value);
    };



    return (
        <ScrollView style={commonStyles.containerContent}>
            <Image
                source={require('../../assets/images/logo.png')}
                style={{ width: 400, height: 250 }}
                resizeMode="cover"
            />
            <Text style={commonStyles.titleText}>
                VIET CHEFS
            </Text>
            <TextInput
                style={commonStyles.input}
                placeholder="Full name"
                placeholderTextColor="#968B7B"
                keyboardType="default"
                value={fullName}
                onChangeText={setFullName}
            />
            <TextInput
                style={commonStyles.input}
                placeholder="Phone number"
                placeholderTextColor="#968B7B"
                keyboardType="numeric"
                value={phone}
                onChangeText={setPhone}
            />
            <TextInput
                style={commonStyles.input}
                placeholder="Mail address"
                placeholderTextColor="#968B7B"
                keyboardType="email-address"
                value={email}
                onChangeText={setEmail}
            />

            <PasswordInput
                placeholder="Password"
                onPasswordChange={handlePasswordChange}
            />
            <PasswordInput
                placeholder="Re-Password"
                onPasswordChange={handleRePasswordChange}
            />
            

            <View style={{ flex: 1, alignItems: 'center' }}>

                <TouchableOpacity onPress={handleSignUp} style={{
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
                    }}>REGISTER</Text>
                </TouchableOpacity>
            </View>
        </ScrollView>
    );
}
