import { Alert } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useRouter } from 'expo-router';

export default function useRequireAuth() {
    const { isGuest } = useAuth();
    const router = useRouter();

    const requireAuth = (callback) => {
        if (isGuest) {
            Alert.alert(
                "Yêu cầu đăng nhập",
                "Bạn cần đăng nhập để sử dụng chức năng này.",
                [
                    { text: "Hủy", style: "cancel" },
                    { text: "Đăng nhập", onPress: () => router.push('/login') }
                ]
            );
        } else {
            callback();
        }
    };

    return requireAuth;
}
