import React, { useState } from 'react';
import { 
  View, 
  TextInput, 
  StyleSheet, 
  Text, 
  Animated, 
  TextInputProps 
} from 'react-native';
import { Colors } from '../constants/Colors';

interface SuvixInputProps extends TextInputProps {
  label?: string;
  icon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  small?: boolean;
}

const SuvixInput: React.FC<SuvixInputProps> = ({ 
  label, 
  placeholder, 
  value, 
  onChangeText, 
  secureTextEntry, 
  icon, 
  rightIcon,
  small,
  ...props 
}) => {
  const [focusAnim] = useState(new Animated.Value(0));

  const handleFocus = () => {
    Animated.timing(focusAnim, {
      toValue: 1,
      duration: 250,
      useNativeDriver: false,
    }).start();
  };

  const handleBlur = () => {
    Animated.timing(focusAnim, {
      toValue: 0,
      duration: 250,
      useNativeDriver: false,
    }).start();
  };

  const borderColor = focusAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [Colors.dark.border, Colors.accent],
  });

  return (
    <View style={[styles.container, small && styles.compactContainer]}>
      {label && <Text style={[styles.label, small && styles.compactLabel]}>{label}</Text>}
      <Animated.View style={[
        styles.inputContainer, 
        small && styles.compactInputContainer,
        { borderColor }
      ]}>
        {icon && (
          <View style={styles.iconContainer}>
            {React.cloneElement(icon as React.ReactElement, { size: small ? 16 : 20 })}
          </View>
        )}
        <TextInput
          style={[styles.input, small && styles.compactInputText]}
          placeholder={placeholder}
          placeholderTextColor={Colors.dark.textSecondary}
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={secureTextEntry}
          onFocus={handleFocus}
          onBlur={handleBlur}
          selectionColor={Colors.accent}
          autoCapitalize="none"
          {...props}
        />
        {rightIcon && (
          <View style={styles.rightIconContainer}>
            {rightIcon}
          </View>
        )}
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
    width: '100%',
  },
  compactContainer: {
    marginBottom: 10,
  },
  label: {
    color: Colors.dark.textSecondary,
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    marginLeft: 4,
  },
  compactLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.dark.inputBg,
    borderRadius: 16,
    borderWidth: 1.5,
    paddingHorizontal: 16,
    height: 56,
  },
  compactInputContainer: {
    height: 48,
    borderRadius: 12,
    paddingHorizontal: 12,
  },
  iconContainer: {
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rightIconContainer: {
    marginLeft: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    color: Colors.white,
    fontSize: 16,
    fontWeight: '500',
    height: '100%',
  },
  compactInputText: {
    fontSize: 14,
  },
});

export default SuvixInput;
