import React, { useEffect, useRef } from 'react'
import { StyleSheet, View, Animated, Dimensions, Easing } from 'react-native'

const { width, height } = Dimensions.get('window')
const SNOWFLAKE_COUNT = 50

interface SnowflakeProps {
  startX: number
  delay: number
  duration: number
  size: number
}

const Snowflake = ({ startX, delay, duration, size }: SnowflakeProps) => {
  const translateY = useRef(new Animated.Value(-50)).current
  const translateX = useRef(new Animated.Value(startX)).current

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(translateY, {
          toValue: height + 50,
          duration: duration,
          delay: delay,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: -50,
          duration: 0,
          useNativeDriver: true,
        }),
      ])
    )
    
    // Add side-to-side sway
    const sway = Animated.loop(
      Animated.sequence([
        Animated.timing(translateX, {
          toValue: startX + 20,
          duration: duration / 2,
          easing: Easing.sin,
          useNativeDriver: true,
        }),
        Animated.timing(translateX, {
          toValue: startX - 20,
          duration: duration / 2,
          easing: Easing.sin,
          useNativeDriver: true,
        })
      ])
    )

    animation.start()
    sway.start()

    return () => {
      animation.stop()
      sway.stop()
    }
  }, [delay, duration, startX, translateY, translateX])

  return (
    <Animated.View
      style={[
        styles.snowflake,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          transform: [{ translateY }, { translateX }],
          opacity: 0.8
        },
      ]}
    />
  )
}

export const SnowFall = () => {
  const snowflakes = useRef(
    Array.from({ length: SNOWFLAKE_COUNT }).map((_, i) => ({
      id: i,
      startX: Math.random() * width,
      delay: Math.random() * 5000,
      duration: 3000 + Math.random() * 5000, // 3-8 seconds fall time
      size: 4 + Math.random() * 4, // 4-8px size
    }))
  ).current

  return (
    <View style={styles.container} pointerEvents="none">
      {snowflakes.map((flake) => (
        <Snowflake
          key={flake.id}
          startX={flake.startX}
          delay={flake.delay}
          duration={flake.duration}
          size={flake.size}
        />
      ))}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 9999,
    elevation: 9999,
  },
  snowflake: {
    position: 'absolute',
    top: 0,
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1,
  },
})
