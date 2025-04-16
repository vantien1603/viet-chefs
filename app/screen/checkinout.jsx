import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as MediaLibrary from 'expo-media-library';
import { Ionicons } from '@expo/vector-icons'; // Thêm thư viện biểu tượng
import { commonStyles } from '../../style';
import Header from '../../components/header';

const Checkinout = () => {
  const [facing, setFacing] = useState('back');
  const [cameraVisible, setCameraVisible] = useState(false);
  const [images, setImages] = useState([]);
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef(null);

  // Kiểm tra quyền truy cập thư viện ảnh
  const [mediaPermission, requestMediaPermission] = MediaLibrary.usePermissions();

  if (!permission || !mediaPermission) {
    return <Text>Đang yêu cầu quyền truy cập...</Text>;
  }

  if (!permission.granted || !mediaPermission.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.message}>
          Cần cấp quyền truy cập camera và thư viện ảnh
        </Text>
        {!permission.granted && (
          <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
            <Text style={styles.buttonText}>Cấp quyền Camera</Text>
          </TouchableOpacity>
        )}
        {!mediaPermission.granted && (
          <TouchableOpacity style={styles.permissionButton} onPress={requestMediaPermission}>
            <Text style={styles.buttonText}>Cấp quyền Thư viện</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  const toggleCameraFacing = () => {
    setFacing((current) => (current === 'back' ? 'front' : 'back'));
  };

  const takePicture = async () => {
    if (cameraRef.current) {
      const photo = await cameraRef.current.takePictureAsync();
      setImages((prev) => [...prev, photo.uri]);
      await MediaLibrary.saveToLibraryAsync(photo.uri);
      setCameraVisible(false);
    }
  };

  return (
    <SafeAreaView style={commonStyles.containerContent}>
        <Header />
      <Text style={styles.title}>Check-in / Check-out</Text>

      {cameraVisible ? (
        <CameraView style={styles.camera} facing={facing} ref={cameraRef}>
          <View style={styles.buttonContainer}>
            {/* Nút hủy (back) */}
            <TouchableOpacity
              style={styles.iconButton}
              onPress={() => setCameraVisible(false)}
            >
              <Ionicons name="arrow-back" size={30} color="white" />
            </TouchableOpacity>

            {/* Nút chụp ảnh (tròn) */}
            <TouchableOpacity style={styles.captureButton} onPress={takePicture}>
              <View style={styles.innerCircle} />
            </TouchableOpacity>

            {/* Nút đổi camera (xoay) */}
            <TouchableOpacity style={styles.iconButton} onPress={toggleCameraFacing}>
              <Ionicons name="camera-reverse" size={30} color="white" />
            </TouchableOpacity>
          </View>
        </CameraView>
      ) : (
        <>
          <TouchableOpacity
            style={styles.openCameraButton}
            onPress={() => setCameraVisible(true)}
          >
            <Text style={styles.buttonText}>Mở Camera</Text>
          </TouchableOpacity>

          <ScrollView horizontal style={styles.imageScroll}>
            {images.length > 0 ? (
              images.map((uri, index) => (
                <Image
                  key={index}
                  source={{ uri }}
                  style={styles.thumbnail}
                />
              ))
            ) : (
              <Text style={styles.noImagesText}>Chưa có ảnh nào!</Text>
            )}
          </ScrollView>
        </>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  message: {
    textAlign: 'center',
    paddingBottom: 10,
    fontSize: 16,
  },
  permissionButton: {
    backgroundColor: '#007bff',
    padding: 15,
    borderRadius: 10,
    margin: 10,
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    margin: 16,
    textAlign: 'center',
  },
  camera: {
    flex: 1,
    height: 500,
  },
  buttonContainer: {
    position: 'absolute',
    bottom: 30,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'transparent',
    marginBottom: 30,
    paddingHorizontal: 20,
  },
  captureButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: '#ccc',
  },
  innerCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#fff',
  },
  iconButton: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 50,
    height: 50,
  },
  buttonText: {
    fontWeight: 'bold',
    color: '#fff',
    fontSize: 16,
  },
  openCameraButton: {
    backgroundColor: '#007bff',
    margin: 16,
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  imageScroll: {
    marginTop: 10,
    paddingLeft: 16,
  },
  thumbnail: {
    width: 100,
    height: 100,
    marginRight: 10,
    borderRadius: 8,
  },
  noImagesText: {
    fontSize: 16,
    color: '#666',
    padding: 16,
  },
});

export default Checkinout;