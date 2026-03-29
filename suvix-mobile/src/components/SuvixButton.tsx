import React from 'react';
import { 
  TouchableOpacity, 
  Text, 
  StyleSheet, 
  ActivityIndicator, 
  Animated, 
  ViewStyle, 
  TextStyle,
  View
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '../constants/Colors';

interface SuvixButtonProps {
  title: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  variant?: 'primary' | 'secondary' | 'outline';
}

const SuvixButton: React.FC<SuvixButtonProps> = ({ 
  title, 
  onPress, 
  loading, 
  disabled, 
  style, 
  textStyle,
  variant = 'primary'
}) => {
  const scaleAnim = new Animated.Value(1);

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.97,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 3,
      tension: 40,
      useNativeDriver: true,
    }).start();
  };

  const isBtnDisabled = loading || disabled;

  const renderContent = () => {
    const isBtnDisabled = loading || disabled;

    return (
      <View style={styles.gradientWrapper}>
        <LinearGradient
          colors={isBtnDisabled ? [Colors.dark.border, Colors.dark.border] : Colors.accentGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.gradient}
        >
          {loading ? (
            <ActivityIndicator color={Colors.white} />
          ) : (
            <Text style={[styles.text, textStyle]}>{title}</Text>
          )}
        </LinearGradient>
      </View>
    );
  };

  return (
    <Animated.View style={[styles.container, { transform: [{ scale: scaleAnim }] }, style]}>
      <TouchableOpacity
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={isBtnDisabled}
        activeOpacity={0.8}
        style={styles.touchable}
      >
        {variant === 'primary' ? renderContent() : (
           <View style={[styles.secondaryContainer, variant === 'outline' && styles.outline]}>
             <Text style={[styles.secondaryText, textStyle]}>{title}</Text>
           </View>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: 56,
    borderRadius: 16,
    overflow: 'hidden',
    marginTop: 12,
  },
  touchable: {
    flex: 1,
  },
  gradientWrapper: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
  },
  gradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  secondaryContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.dark.secondary,
    borderRadius: 16,
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: Colors.dark.border,
  },
  text: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  secondaryText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '600',
  }
});

export default SuvixButton;
