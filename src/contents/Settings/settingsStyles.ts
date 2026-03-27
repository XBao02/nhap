import {StyleSheet} from 'react-native';
import {isTablet, isDesktop} from '../../utils';

export const styles = StyleSheet.create({
  container: {flex: 1},
  gradient: {flex: 1},
  keyboardAvoidingView: {flex: 1},
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: isTablet ? 0 : 24,
    justifyContent: isTablet ? 'center' : 'flex-start',
  },
  tabletContainer: {
    flex: 1,
    flexDirection: 'row',
  },
  leftPanel: {
    flex: isDesktop ? 0.6 : 0.5,
  },
  rightPanel: {
    flex: isDesktop ? 0.4 : 0.5,
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  headerContainer: {
    marginBottom: 10,
    alignItems: 'center',
  },
  title: {
    fontSize: isTablet ? 28 : 24,
    fontWeight: 'bold',
  },
  sectionContainer: {
    padding: 16,
    marginVertical: 8,
    borderRadius: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  checkboxLabel: {
    fontSize: 16,
    marginLeft: 8,
  },
  dropdown: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  selectedItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginRight: 8,
    marginVertical: 4,
  },
  selectedItemText: {
    fontSize: 14,
    marginRight: 6,
  },
  selectedText: {
    fontSize: 14,
    marginTop: 8,
  },
  dropdownContainer: {
    marginBottom: 20,
  },
  dropdownButtonStyle: {
    width: 200,
    height: 50,
    backgroundColor: '#E9ECEF',
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  dropdownButtonTxtStyle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '500',
    color: '#151E26',
  },
  dropdownButtonArrowStyle: {
    fontSize: 28,
  },
  dropdownButtonIconStyle: {
    fontSize: 28,
    marginRight: 8,
  },
  dropdownMenuStyle: {
    backgroundColor: '#E9ECEF',
    borderRadius: 8,
  },
  dropdownItemStyle: {
    width: '100%',
    flexDirection: 'row',
    paddingHorizontal: 12,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 8,
  },
  dropdownItemTxtStyle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '500',
    color: '#151E26',
  },
  dropdownItemIconStyle: {
    fontSize: 28,
    marginRight: 8,
  },
  toggleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
  },
  featuresSection: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 20,
    paddingHorizontal: 16,
    flex: 1,
  },
  featuresSectionTablet: {
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
  },
  featuresGrid: {
    flexDirection: isTablet ? 'row' : 'column',
    flexWrap: isTablet ? 'wrap' : 'nowrap',
    justifyContent: 'space-between',
    gap: 16,
    paddingBottom: 20,
  },
  featureCard: {
    width: isTablet ? '47%' : '100%',
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    marginBottom: isTablet ? 0 : 16,
  },
});
