import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
} from 'react-native';
import { Calendar } from 'lucide-react-native';
import { Calendar as CalendarComponent } from 'react-native-calendars';
import { useTheme } from './ThemeProvider';
import { FilterPeriod } from '../../utils/dateUtils';

interface DateRangePickerProps {
  selectedPeriod: FilterPeriod;
  customStartDate?: Date;
  customEndDate?: Date;
  onFilterChange: (period: FilterPeriod, customRange?: { startDate: Date; endDate: Date }) => void;
  onQuickFilterPress: () => void;
}

export const DateRangePicker: React.FC<DateRangePickerProps> = ({
  selectedPeriod,
  customStartDate,
  customEndDate,
  onFilterChange,
  onQuickFilterPress,
}) => {
  const { theme } = useTheme();
  const [showCalendarModal, setShowCalendarModal] = useState(false);
  const [calendarStartDate, setCalendarStartDate] = useState<string>('');
  const [calendarEndDate, setCalendarEndDate] = useState<string>('');
  const [markedDates, setMarkedDates] = useState({});

  // Calendar date selection functions
  const formatDateForCalendar = (date: Date): string => {
    return date.toISOString().split('T')[0];
  };

  const onCalendarDayPress = (day: any) => {
    const selectedDate = day.dateString;
    
    if (!calendarStartDate || (calendarStartDate && calendarEndDate)) {
      // Start new selection
      setCalendarStartDate(selectedDate);
      setCalendarEndDate('');
      setMarkedDates({
        [selectedDate]: {
          startingDay: true,
          color: theme.colors.primary,
          textColor: 'white'
        }
      });
    } else {
      // Complete the range
      const start = new Date(calendarStartDate);
      const end = new Date(selectedDate);
      
      if (end < start) {
        // If end date is before start date, swap them
        setCalendarStartDate(selectedDate);
        setCalendarEndDate(calendarStartDate);
      } else {
        setCalendarEndDate(selectedDate);
      }
    }
  };

  // Update marked dates when calendar dates change
  useEffect(() => {
    if (calendarStartDate && calendarEndDate) {
      const start = new Date(calendarStartDate);
      const end = new Date(calendarEndDate);
      const marked: any = {};
      
      const current = new Date(start);
      while (current <= end) {
        const dateString = formatDateForCalendar(current);
        if (dateString === calendarStartDate) {
          marked[dateString] = {
            startingDay: true,
            color: theme.colors.primary,
            textColor: 'white'
          };
        } else if (dateString === calendarEndDate) {
          marked[dateString] = {
            endingDay: true,
            color: theme.colors.primary,
            textColor: 'white'
          };
        } else {
          marked[dateString] = {
            color: theme.colors.primary + '33',
            textColor: theme.colors.primary
          };
        }
        current.setDate(current.getDate() + 1);
      }
      setMarkedDates(marked);
    } else if (calendarStartDate) {
      setMarkedDates({
        [calendarStartDate]: {
          startingDay: true,
          color: theme.colors.primary,
          textColor: 'white'
        }
      });
    }
  }, [calendarStartDate, calendarEndDate, theme.colors.primary]);

  const applyCalendarDateRange = () => {
    if (calendarStartDate && calendarEndDate) {
      const startDate = new Date(calendarStartDate);
      const endDate = new Date(calendarEndDate);
      onFilterChange('custom', { startDate, endDate });
      setShowCalendarModal(false);
    }
  };

  const clearCalendarSelection = () => {
    setCalendarStartDate('');
    setCalendarEndDate('');
    setMarkedDates({});
  };

  const getDisplayText = () => {
    switch (selectedPeriod) {
      case 'today': return 'Today';
      case 'yesterday': return 'Yesterday';
      case 'this_week': return 'This Week';
      case 'last_week': return 'Last Week';
      case 'this_month': return 'This Month';
      case 'last_month': return 'Last Month';
      case 'custom':
        if (customStartDate && customEndDate) {
          return `${customStartDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${customEndDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
        }
        return 'Custom Range';
      default: return 'Today';
    }
  };

  return (
    <>
      {/* Modern Date Filter Card */}
      <View style={[styles.dateFilterCard, { backgroundColor: theme.colors.surface }]}>
        <View style={styles.cardHeader}>
          <Text style={[styles.cardTitle, { color: theme.colors.text }]}>
            Date Range
          </Text>
        </View>
        
        <View style={styles.filterButtonsContainer}>
          <TouchableOpacity
            style={[styles.periodButton, { borderColor: theme.colors.border }]}
            onPress={onQuickFilterPress}
          >
            <Text style={[styles.periodButtonText, { color: theme.colors.text }]}>
              {getDisplayText()}
            </Text>
            <View style={styles.dropdownIcon}>
              <Text style={[styles.dropdownIconText, { color: theme.colors.textSecondary }]}>▼</Text>
            </View>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.calendarButton, { backgroundColor: theme.colors.primary }]}
            onPress={() => setShowCalendarModal(true)}
          >
            <Calendar size={18} color="white" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Calendar Modal */}
      <Modal
        visible={showCalendarModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowCalendarModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContainer, { backgroundColor: theme.colors.surface }]}>
            {/* Modal Header */}
            <View style={[styles.modalHeader, { borderBottomColor: theme.colors.border }]}>
              <Text style={[styles.modalTitle, { color: theme.colors.text }]}>
                Select Date Range
              </Text>
              <TouchableOpacity onPress={() => setShowCalendarModal(false)}>
                <Text style={[styles.modalClose, { color: theme.colors.textSecondary }]}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* Instructions */}
            <View style={[styles.instructionsContainer, { borderBottomColor: theme.colors.border }]}>
              <Text style={[styles.instructionText, { color: theme.colors.textSecondary }]}>
                {!calendarStartDate ? 'Tap a date to start selection' : 
                 !calendarEndDate ? 'Tap another date to complete range' :
                 'Range selected. Tap Apply to filter reports.'}
              </Text>
            </View>

            {/* Calendar */}
            <View style={styles.calendarContainer}>
              <CalendarComponent
                onDayPress={onCalendarDayPress}
                markingType="period"
                markedDates={markedDates}
                theme={{
                  backgroundColor: theme.colors.surface,
                  calendarBackground: theme.colors.surface,
                  textSectionTitleColor: theme.colors.text,
                  dayTextColor: theme.colors.text,
                  todayTextColor: theme.colors.primary,
                  selectedDayTextColor: 'white',
                  monthTextColor: theme.colors.text,
                  selectedDayBackgroundColor: theme.colors.primary,
                  arrowColor: theme.colors.primary,
                  textDisabledColor: theme.colors.textSecondary,
                  dotColor: theme.colors.primary,
                  selectedDotColor: 'white',
                  textDayFontFamily: 'System',
                  textMonthFontFamily: 'System',
                  textDayHeaderFontFamily: 'System',
                  textDayFontWeight: '400',
                  textMonthFontWeight: '600',
                  textDayHeaderFontWeight: '600',
                }}
                style={styles.calendar}
              />
            </View>

            {/* Selected Range Display */}
            {calendarStartDate && (
              <View style={[styles.selectedRangeContainer, { 
                backgroundColor: theme.colors.background,
                borderColor: theme.colors.border 
              }]}>
                <Text style={[styles.selectedRangeLabel, { color: theme.colors.textSecondary }]}>
                  Selected Range
                </Text>
                <Text style={[styles.selectedRangeText, { color: theme.colors.text }]}>
                  {new Date(calendarStartDate).toLocaleDateString('en-US', { 
                    month: 'long', 
                    day: 'numeric',
                    year: 'numeric'
                  })}
                  {calendarEndDate && (
                    ` - ${new Date(calendarEndDate).toLocaleDateString('en-US', { 
                      month: 'long', 
                      day: 'numeric',
                      year: 'numeric'
                    })}`
                  )}
                </Text>
              </View>
            )}

            {/* Modal Footer */}
            <View style={[styles.modalFooter, { borderTopColor: theme.colors.border }]}>
              <TouchableOpacity
                style={[styles.footerButton, styles.clearButton]}
                onPress={clearCalendarSelection}
              >
                <Text style={styles.clearButtonText}>Clear</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.footerButton, 
                  styles.applyButton, 
                  { 
                    backgroundColor: (calendarStartDate && calendarEndDate) ? theme.colors.primary : theme.colors.textSecondary,
                    opacity: (calendarStartDate && calendarEndDate) ? 1 : 0.6
                  }
                ]}
                onPress={applyCalendarDateRange}
                disabled={!(calendarStartDate && calendarEndDate)}
              >
                <Text style={styles.applyButtonText}>Apply Filter</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  // Modern Card Styles
  dateFilterCard: {
    marginBottom: 12,
    borderRadius: 12,
    padding: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  cardHeader: {
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  filterButtonsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  periodButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    minHeight: 40,
  },
  periodButtonText: {
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },
  dropdownIcon: {
    marginLeft: 8,
  },
  dropdownIconText: {
    fontSize: 10,
    fontWeight: '600',
  },
  calendarButton: {
    width: 40,
    height: 40,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    width: '100%',
    maxWidth: 420,
    borderRadius: 20,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  modalClose: {
    fontSize: 22,
    fontWeight: '600',
    padding: 4,
  },
  instructionsContainer: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  instructionText: {
    fontSize: 14,
    textAlign: 'center',
    fontStyle: 'italic',
    lineHeight: 20,
  },
  calendarContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  calendar: {
    borderRadius: 16,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  selectedRangeContainer: {
    marginHorizontal: 24,
    marginVertical: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  selectedRangeLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  selectedRangeText: {
    fontSize: 16,
    fontWeight: '500',
    lineHeight: 22,
  },
  modalFooter: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderTopWidth: 1,
    gap: 12,
  },
  footerButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  clearButton: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: '#ef4444',
  },
  clearButtonText: {
    color: '#ef4444',
    fontSize: 15,
    fontWeight: '600',
  },
  applyButton: {
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  applyButtonText: {
    color: 'white',
    fontSize: 15,
    fontWeight: '600',
  },
});