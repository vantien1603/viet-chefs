import React, { useState } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import Header from '../../components/header'
import { Text, TouchableOpacity, View } from 'react-native'
import { PasswordInput } from '../../components/PasswordInput/passwordInput';
import { commonStyles } from '../../style';
import { useLocalSearchParams, useRouter } from 'expo-router';

const SetPassword = () => {
    const { username, fullName, phone, mail, mode } = useLocalSearchParams();

    const [rePassword, setRePassword] = useState('');
    const [password, setPassword] = useState('');

    const router = useRouter();
    const handlePasswordChange = (value) => {
        setPassword(value);
    };
    const handleRePasswordChange = (value) => {
        setRePassword(value);
    };

    const handleSetPassword = async () => {
        const registerPayload = {
            username: randomUsername,
            email: email,
            phone: phone,
            fullName: fullName,
            password: password,
            dob: "1",
            address: "",
            gender: "",
            password: password,
        };
        try {
            console.log(registerPayload);
            const response = await AXIOS_BASE.post('/register', registerPayload);
            if (response.status === 201) {
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
        router.push('screen/login')
    }
    return (
        <SafeAreaView style={commonStyles.containerContent}>
            <Header title={"Set password"} />
            <View>
                <Text style={{ fontSize: 16, fontWeight: '600', marginBottom: 20 }}>
                    Please enter your password. This password will be used for future logins
                </Text>
                <PasswordInput
                    placeholder="Password"
                    onPasswordChange={handlePasswordChange}
                />
                <PasswordInput
                    placeholder="Re-enter password"
                    onPasswordChange={handleRePasswordChange}
                />
            </View>
            <View style={{ flex: 1, alignItems: 'center' }}>

                <TouchableOpacity onPress={handleSetPassword} style={{
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
        </SafeAreaView>
    )
}

export default SetPassword