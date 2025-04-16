import { MaterialIcons } from '@expo/vector-icons';
import React, { useRef } from 'react';
import {
  Animated,
  PanResponder,
  Pressable,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
} from 'react-native';

const screen = Dimensions.get('window');

const FloatingDraggableButton = ({ onPress }) => {
  const pan = useRef(new Animated.ValueXY({ x: screen.width - 80, y: screen.height - 180 })).current;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        pan.setOffset({
          x: pan.x._value,
          y: pan.y._value,
        });
        pan.setValue({ x: 0, y: 0 });
      },
      onPanResponderMove: Animated.event([null, { dx: pan.x, dy: pan.y }], {
        useNativeDriver: false,
      }),
      onPanResponderRelease: () => {
        pan.flattenOffset();
      },
    })
  ).current;

  return (
    <Animated.View
      style={[styles.buttonContainer, pan.getLayout()]}
      {...panResponder.panHandlers}
    >
      <TouchableOpacity style={styles.button} onPress={onPress}>
        <MaterialIcons name="event-busy" size={40} color="white" />
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  buttonContainer: {
    position: 'absolute',
    zIndex: 999,
  },
  button: {
    backgroundColor: '#A9411D',
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    // elevation: 6,
  },
  text: {
    color: '#fff',
    fontSize: 30,
    fontWeight: 'bold',
  },
});

export default FloatingDraggableButton;
