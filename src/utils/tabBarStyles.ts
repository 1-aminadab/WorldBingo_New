import { TabBarStyle } from '@react-navigation/bottom-tabs';

export const TAB_BAR_STYLES = {
  default: {
    backgroundColor: 'rgb(22, 33, 71)',
    borderTopWidth: 0,
    paddingBottom: 4,
    paddingTop: 4,
    height: 54,
    borderRadius: 0,
    elevation: 0,
    shadowOpacity: 0,
  } as TabBarStyle,
  
  hidden: {
    display: 'none' as const,
  } as TabBarStyle,
};

export const TAB_BAR_LABEL_STYLES = {
  fontSize: 10,
  fontWeight: '500' as const,
  marginTop: 2,
};

export const TAB_BAR_COLORS = {
  activeTintColor: '#FFFFFF',
  inactiveTintColor: '#8E8E93',
};

/**
 * Utility function to set tab bar visibility
 * @param navigation - Navigation object
 * @param visible - Whether tab bar should be visible
 */
export const setTabBarVisibility = (navigation: any, visible: boolean) => {
  const parent = navigation.getParent();
  if (parent) {
    parent.setOptions({
      tabBarStyle: visible ? TAB_BAR_STYLES.default : TAB_BAR_STYLES.hidden,
    });
  }
};

/**
 * Utility function to restore tab bar to default state
 * @param navigation - Navigation object
 */
export const restoreTabBar = (navigation: any) => {
  const parent = navigation.getParent();
  if (parent) {
    parent.setOptions({
      tabBarStyle: TAB_BAR_STYLES.default,
      tabBarLabelStyle: TAB_BAR_LABEL_STYLES,
      tabBarActiveTintColor: TAB_BAR_COLORS.activeTintColor,
      tabBarInactiveTintColor: TAB_BAR_COLORS.inactiveTintColor,
    });
  }
};
