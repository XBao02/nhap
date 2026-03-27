// globalStyles.ts
import { StyleSheet, ViewStyle } from 'react-native';
import { colors } from './colors';
import { useTheme } from './ThemeContext';
import { Theme } from './themes';

const baseStyles = StyleSheet.create({
  // Container styles
  screenContainer: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: 16,
    paddingVertical: 24,
  },
  centeredContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
    paddingHorizontal: 16,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  // Text styles
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
  },
  bodyText: {
    fontSize: 16,
    color: colors.text,
    lineHeight: 24,
  },
  secondaryText: {
    fontSize: 14,
    color: colors.secondaryText,
    lineHeight: 20,
  },
  caption: {
    fontSize: 12,
    color: colors.secondaryText,
    lineHeight: 18,
  },

  // Input styles
  textInput: {
    width: '100%',
    padding: 12,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    fontSize: 16,
    color: colors.text,
    backgroundColor: colors.background,
    marginBottom: 16,
  },

  // Button styles
  primaryButton: {
    backgroundColor: colors.button,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  primaryButtonText: {
    color: colors.buttonText,
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.button,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  secondaryButtonText: {
    color: colors.button,
    fontSize: 16,
    fontWeight: '600',
  },

  // Card styles
  card: {
    backgroundColor: colors.background,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    marginVertical: 8,
    shadowColor: colors.text,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  // Divider
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 8,
  },
});

// Function tạo dynamic styles với theme
export const createGlobalStyles = (theme: Theme) => ({
  screenContainer: {
    ...baseStyles.screenContainer,
    backgroundColor: theme.background,
  } as ViewStyle,
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: (theme: Theme) => theme.text,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 18,
    color: (theme: Theme) => theme.secondary,
    textAlign: 'center',
  },
  bodyText: {
    fontSize: 16,
    color: (theme: Theme) => theme.text,
  },
  secondaryText: {
    fontSize: 14,
    color: (theme: Theme) => theme.secondary,
  },
  primaryButton: {
    backgroundColor: (theme: Theme) => theme.primary,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  primaryButtonText: {
    color: (theme: Theme) => theme.buttonText,
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: (theme: Theme) => theme.secondary,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  secondaryButtonText: {
    color: (theme: Theme) => theme.buttonText,
    fontSize: 16,
    fontWeight: '600',
  },
  card: {
    backgroundColor: (theme: Theme) => theme.cardBackground,
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
});

// Helper function to apply theme to styles
export const withTheme = (style: any) => {
  const { theme } = useTheme();
  return StyleSheet.create({
    ...(typeof style === 'function' ? style(theme) : style),
  }).style;
};

// Export base styles cho những styles không cần theme
export const globalStyles = baseStyles;

export const getGlobalStyles = (theme: Theme) => StyleSheet.create({
  screenContainer: {
    flex: 1,
    backgroundColor: theme.background,
    padding: 16,
  } as ViewStyle,
  // Các styles khác...
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.text,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 18,
    color: theme.secondary,
    textAlign: 'center',
  },
  bodyText: {
    fontSize: 16,
    color: theme.text,
  },
  secondaryText: {
    fontSize: 14,
    color: theme.secondary,
  },
  primaryButton: {
    backgroundColor: theme.primary,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  primaryButtonText: {
    color: theme.buttonText,
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: theme.secondary,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  secondaryButtonText: {
    color: theme.buttonText,
    fontSize: 16,
    fontWeight: '600',
  },
  card: {
    backgroundColor: theme.cardBackground,
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
});