import React, { useState } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import Header from '../../components/header'
import { Alert, Text, TouchableOpacity, View } from 'react-native'
import { PasswordInput } from '../../components/PasswordInput/passwordInput';
import { commonStyles } from '../../style';
import { useLocalSearchParams, useRouter } from 'expo-router';
import AXIOS_BASE from '../../config/AXIOS_BASE';
import useActionCheckNetwork from '../../hooks/useAction';

const SetPassword = () => {
    const { username, fullName, phone, mail, mode } = useLocalSearchParams();

    const [rePassword, setRePassword] = useState('');
    const [password, setPassword] = useState('');
    const randomUsername = `user_${Date.now()}`;

    const router = useRouter();
    const handlePasswordChange = (value) => {
        setPassword(value);
    };
    const handleRePasswordChange = (value) => {
        setRePassword(value);
    };

    const handleSetPassword = async () => {
        if (password !== rePassword) {
            Alert.alert('Error', 'Passwords do not match');
            return;
        }

        const setPasswordPayload = {
            email: mail,
            newPassword: password,
        };

        try {
            console.log('data', setPasswordPayload);
            const response = await AXIOS_BASE.post('/set-password', setPasswordPayload);
            if (response.status === 200) {
                Alert.alert('Register success', 'Please login again');
                console.log('Register success');
                router.push('/screen/login')
            } else {
                Alert.alert('Register failed', 'Please try again');
                console.log('Register failed');
            }
        } catch (error) {
            if (error.response) {
                console.error(`Lỗi ${error.response.status}:`, error.response.data);
            }
            else {
                console.error(error.message);
            }
        }
    }
    return (
        <SafeAreaView style={commonStyles.container}>
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

                <TouchableOpacity onPress={() => handleSetPassword} style={{
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