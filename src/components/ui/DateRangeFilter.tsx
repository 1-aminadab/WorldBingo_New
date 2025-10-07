import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  Dimensions,
} from 'react-native';
import { Calendar as CalendarIcon, ChevronDown, Filter, X } from 'lucide-react-native';
import { Calendar } from 'react-native-calendars';
import { useTheme } from './ThemeProvider';

import { FilterPeriod, getDateRange, getFilterDisplayName, getPeriodOptions } from '../../utils/dateUtils';

const { width } = Dimensions.get('window');

interface DateRangeFilterProps {
  selectedPeriod: FilterPeriod;
  customStartDate?: Date;
  customEndDate?: Date;
  onFilterChange: (period: FilterPeriod, customRange?: { startDate: Date; endDate: Date }) => void;
  style?: any;
}

export const DateRangeFilter: React.FC<DateRangeFilterProps> = ({
  selectedPeriod,
  customStartDate,
  customEndDate,
  onFilterChange,
  style,
}) => {
  const { theme } = useTheme();
  const [modalVisible, setModalVisible] = useState(false);
  const [tempStartDate, setTempStartDate] = useState<string>(customStartDate ? customStartDate.toISOString().split('T')[0] : '');
  const [tempEndDate, setTempEndDate] = useState<string>(customEndDate ? customEndDate.toISOString().split('T')[0] : '');
  const [tempSelectedPeriod, setTempSelectedPeriod] = useState<FilterPeriod>(selectedPeriod);
  const [openedViaCalendar, setOpenedViaCalendar] = useState(false);
  const [markedDates, setMarkedDates] = useState<any>({});

  const periodOptions = getPeriodOptions();

  const handlePeriodSelect = (period: FilterPeriod) => {
    setTempSelectedPeriod(period);
    if (period === 'custom') {
      // Switch to calendar view for custom range
      setOpenedViaCalendar(true);
      setTempStartDate('');
      setTempEndDate('');
      setMarkedDates({});
    } else {
      // Apply immediately for preset periods
      onFilterChange(period);
      handleModalClose();
    }
  };

  const handleDayPress = (day: any) => {
    if (!tempStartDate || (tempStartDate && tempEndDate)) {
      // Start new selection
      setTempStartDate(day.dateString);
      setTempEndDate('');
      setMarkedDates({
        [day.dateString]: { selected: true, startingDay: true, color: theme.colors.primary }
      });
    } else if (tempStartDate && !tempEndDate) {
      // Complete the range
      const start = tempStartDate;
      const end = day.dateString;
      
      if (start <= end) {
        setTempEndDate(end);
        updateMarkedDates(start, end);
      } else {
        setTempEndDate(start);
        setTempStartDate(end);
        updateMarkedDates(end, start);
      }
    }
  };

  const updateMarkedDates = (startDate: string, endDate: string) => {
    const marked: any = {};
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const dateString = d.toISOString().split('T')[0];
      marked[dateString] = {
        color: theme.colors.primary,
        textColor: 'white'
      };
    }
    
    // Mark start and end specially
    marked[startDate] = { ...marked[startDate], startingDay: true };
    marked[endDate] = { ...marked[endDate], endingDay: true };
    
    setMarkedDates(marked);
  };

  const handleApplyCustomRange = () => {
    if (tempStartDate && tempEndDate) {
      onFilterChange('custom', {
        startDate: new Date(tempStartDate),
        endDate: new Date(tempEndDate)
      });
      handleModalClose();
    }
  };

  const handleReset = () => {
    onFilterChange('today');
    handleModalClose();
  };

  const displayName = getFilterDisplayName(
    selectedPeriod, 
    customStartDate && customEndDate 
      ? { startDate: customStartDate, endDate: customEndDate } 
      : undefined
  );

  const renderPeriodOption = (option: { value: FilterPeriod; label: string }) => (
    <TouchableOpacity
      key={option.value}
      style={[
        styles.periodOption,
        {
          backgroundColor: tempSelectedPeriod === option.value 
            ? theme.colors.primary + '20' 
            : theme.colors.surface,
          borderColor: tempSelectedPeriod === option.value 
            ? theme.colors.primary 
            : theme.colors.border,
        }
      ]}
      onPress={() => handlePeriodSelect(option.value)}
    >
      <Text style={[
        styles.periodOptionText,
        {
          color: tempSelectedPeriod === option.value 
            ? theme.colors.primary 
            : theme.colors.text,
          fontWeight: tempSelectedPeriod === option.value ? '600' : 'normal',
        }
      ]}>
        {option.label}
      </Text>
      {tempSelectedPeriod === option.value && (
        <Text style={[styles.checkmark, { color: theme.colors.primary }]}>✓</Text>
      )}
    </TouchableOpacity>
  );

  const handleCalendarPress = () => {
    setTempSelectedPeriod('custom');
    setOpenedViaCalendar(true);
    setTempStartDate('');
    setTempEndDate('');
    setMarkedDates({});
    setModalVisible(true);
  };

  const handleModalClose = () => {
    setModalVisible(false);
    setOpenedViaCalendar(false);
  };

  return (
    <View style={[styles.container, style]}>
      <View style={styles.filterRow}>
        <View style={[{ backgroundColor: theme.colors.surface, borderRadius: 8, padding: 16 }]}>
          <TouchableOpacity
            style={[styles.filterButton, { borderColor: theme.colors.border }]}
            onPress={() => {
            setOpenedViaCalendar(false);
            setModalVisible(true);
          }}
          >
            <Filter size={16} color={theme.colors.primary} />
            <Text style={[styles.filterButtonText, { color: theme.colors.text }]}>{displayName}</Text>
            <ChevronDown size={16} color={theme.colors.textSecondary} />
          </TouchableOpacity>
        </View>
        
        <TouchableOpacity
          style={[
            styles.calendarButton, 
            { 
              backgroundColor: selectedPeriod === 'custom' ? theme.colors.success || '#10B981' : theme.colors.primary,
            }
          ]}
          onPress={handleCalendarPress}
        >
          <CalendarIcon size={18} color="white" />
          {selectedPeriod === 'custom' && (
            <View style={styles.activeIndicator}>
              <Text style={styles.activeIndicatorText}>•</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={handleModalClose}
      >
        <View style={styles.modalOverlay}>
          <View style={[{ backgroundColor: theme.colors.surface, borderRadius: 8, padding: 16 }]}>
            <View style={styles.modalContainer}>
            {/* Header */}
            <View style={[styles.modalHeader, { borderBottomColor: theme.colors.border }]}>
              <Text style={[styles.modalTitle, { color: theme.colors.text }]}>
                {openedViaCalendar ? 'Select Custom Date Range' : 'Filter by Date Range'}
              </Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={handleModalClose}
              >
                <X size={24} color={theme.colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
              {/* Period Options - Hide if opened via calendar */}
              {!openedViaCalendar && (
                <View style={styles.section}>
                  <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Quick Filters</Text>
                  <View style={styles.periodGrid}>
                    {periodOptions.map(renderPeriodOption)}
                  </View>
                </View>
              )}

              {/* Calendar for Custom Date Range */}
              {openedViaCalendar && (
                <View style={styles.section}>
                  <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
                    Select Date Range
                  </Text>
                  
                  {tempStartDate && !tempEndDate && (
                    <Text style={[styles.instructionText, { color: theme.colors.textSecondary }]}>
                      Start: {new Date(tempStartDate).toLocaleDateString()} - Now select end date
                    </Text>
                  )}
                  
                  {tempStartDate && tempEndDate && (
                    <Text style={[styles.instructionText, { color: theme.colors.primary }]}>
                      Range: {new Date(tempStartDate).toLocaleDateString()} - {new Date(tempEndDate).toLocaleDateString()}
                    </Text>
                  )}

                  <Calendar
                    theme={{
                      backgroundColor: theme.colors.card,
                      calendarBackground: theme.colors.card,
                      textSectionTitleColor: theme.colors.text,
                      selectedDayBackgroundColor: theme.colors.primary,
                      selectedDayTextColor: 'white',
                      todayTextColor: theme.colors.primary,
                      dayTextColor: theme.colors.text,
                      textDisabledColor: theme.colors.textSecondary,
                      arrowColor: theme.colors.primary,
                      monthTextColor: theme.colors.text,
                      indicatorColor: theme.colors.primary,
                    }}
                    onDayPress={handleDayPress}
                    markedDates={markedDates}
                    markingType="period"
                    maxDate={new Date().toISOString().split('T')[0]}
                  />

                </View>
              )}
            </ScrollView>

            {/* Footer */}
            {openedViaCalendar && (
              <View style={[styles.modalFooter, { borderTopColor: theme.colors.border }]}>
                <TouchableOpacity
                  style={[styles.footerButton, styles.resetButton, { backgroundColor: '#ef4444' }]}
                  onPress={handleReset}
                >
                  <Text style={[styles.footerButtonText, { color: 'white' }]}>Reset to Today</Text>
                </TouchableOpacity>
                
                {tempStartDate && tempEndDate && (
                  <TouchableOpacity
                    style={[styles.footerButton, styles.applyButton, { backgroundColor: theme.colors.primary }]}
                    onPress={handleApplyCustomRange}
                  >
                    <Text style={[styles.footerButtonText, { color: 'white' }]}>Apply Date Range</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
            
            {!openedViaCalendar && (
              <View style={[styles.modalFooter, { borderTopColor: theme.colors.border }]}>
                <TouchableOpacity
                  style={[styles.footerButton, { backgroundColor: '#ef4444' }]}
                  onPress={handleReset}
                >
                  <Text style={[styles.footerButtonText, { color: 'white' }]}>Reset to Today</Text>
                </TouchableOpacity>
              </View>
            )}
            </View>
          </View>
        </View>

      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  filterCard: {
    flex: 1,
    marginVertical: 0,
  },
  filterButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    gap: 8,
    backgroundColor: 'transparent',
  },
  calendarButton: {
    width: 44,
    height: 44,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    position: 'relative',
  },
  activeIndicator: {
    position: 'absolute',
    top: 2,
    right: 2,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  activeIndicatorText: {
    color: '#10B981',
    fontSize: 12,
    fontWeight: 'bold',
    lineHeight: 8,
  },
  filterButtonText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    maxHeight: '80%',
  },
  modalContainer: {
    flex: 1,
    borderRadius: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  closeButton: {
    padding: 4,
  },
  modalContent: {
    maxHeight: 400,
  },
  section: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 16,
  },
  instructionText: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 12,
    textAlign: 'center',
  },
  periodGrid: {
    gap: 8,
  },
  periodOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  periodOptionText: {
    fontSize: 14,
    flex: 1,
  },
  checkmark: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalFooter: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    gap: 12,
  },
  footerButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  resetButton: {
    flex: 0.4,
  },
  applyButton: {
    flex: 0.6,
  },
  footerButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
});