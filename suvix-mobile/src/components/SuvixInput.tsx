import React, { useRef, useMemo, memo } from 'react';
import { 
  View, 
  TextInput, 
  StyleSheet, 
  Text, 
  Animated, 
  TextInputProps,
  useColorScheme
} from 'react-native';
import { Colors } from '../constants/Colors';

interface SuvixInputProps extends TextInputProps {
  label?: string;
  icon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  small?: boolean;
}

/**
 * PRODUCTION-GRADE INPUT COMPONENT
 * Optimized with React.memo and useRef to prevent typing lag and character duplication.
 */
const SuvixInput: React.FC<SuvixInputProps> = memo(({ 
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
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? Colors.dark : Colors.light;
  
  // ⚡ PERFORMANCE: Use useRef for Animated values to prevent re-creation on re-renders
  const focusAnim = useRef(new Animated.Value(0)).current;

  const handleFocus = () => {
    Animated.timing(focusAnim, {
      toValue: 1,
      duration: 200, // Slightly faster for snappier feel
      useNativeDriver: false, // Color interpolation doesn't support native driver
    }).start();
  };

  const handleBlur = () => {
    Animated.timing(focusAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  };

  // ⚡ PERFORMANCE: Memoize interpolation to avoid churn during keypresses
  const borderColor = useMemo(() => focusAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [theme.border, theme.accent],
  }), [theme]);

  // Use the native driver compatible colors or fallbacks
  const inputBg = theme.inputBg;

  return (
    <View style={[styles.container, small && styles.compactContainer]}>
      {label && <Text style={[styles.label, small && styles.compactLabel, { color: theme.textSecondary }]}>{label}</Text>}
      <Animated.View style={[
        styles.inputContainer, 
        small && styles.compactInputContainer,
        { borderColor, backgroundColor: inputBg }
      ]}>
        {icon && (
          <View style={styles.iconContainer}>
            {React.cloneElement(icon as React.ReactElement, { 
              size: small ? 16 : 20,
              color: value ? theme.text : theme.textSecondary 
            })}
          </View>
        )}
        <TextInput
          style={[styles.input, small && styles.compactInputText, { color: theme.text }]}
          placeholder={placeholder}
          placeholderTextColor={theme.textSecondary}
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={secureTextEntry}
          onFocus={handleFocus}
          onBlur={handleBlur}
          selectionColor={theme.accent}
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
});

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
    width: '100%',
  },
  compactContainer: {
    marginBottom: 10,
  },
  label: {
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
    fontSize: 16,
    fontWeight: '500',
    height: '100%',
  },
  compactInputText: {
    fontSize: 14,
  },
});

export default SuvixInput;
