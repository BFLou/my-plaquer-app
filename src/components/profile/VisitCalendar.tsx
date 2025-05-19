// src/components/profile/VisitCalendar.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  MapPin, 
  Clock
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format, isValid, getDaysInMonth, getMonth, getYear, 
  addMonths, subMonths, isSameDay, startOfMonth, parseISO, isToday } from 'date-fns';
import { Plaque } from '@/types/plaque';

interface VisitData {
  id: string;
  plaque_id: number;
  user_id: string;
  visited_at: any; // Can be Date, Firebase Timestamp, or string
  notes?: string;
  rating?: number;
}

interface VisitCalendarProps {
  visits: VisitData[];
  getPlaqueData: (plaqueId: number) => Plaque | null;
}

const VisitCalendar: React.FC<VisitCalendarProps> = ({
  visits,
  getPlaqueData
}) => {
  const navigate = useNavigate();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [visitsOnSelectedDate, setVisitsOnSelectedDate] = useState<VisitData[]>([]);

  // Helper function to standardize date handling across different formats
  const normalizeDate = (dateValue: any): Date | null => {
    try {
      // Handle Firebase Timestamp
      if (dateValue && typeof dateValue.toDate === 'function') {
        return dateValue.toDate();
      }
      
      // Handle string date
      if (typeof dateValue === 'string') {
        return parseISO(dateValue);
      }
      
      // Handle Date object
      if (dateValue instanceof Date) {
        return dateValue;
      }
      
      // Handle timestamp number
      if (typeof dateValue === 'number') {
        return new Date(dateValue);
      }
      
      return null;
    } catch (error) {
      console.error('Error normalizing date:', error);
      return null;
    }
  };

  // Format date safely
  const formatVisitDate = (dateValue: any): string => {
    const normalizedDate = normalizeDate(dateValue);
    if (!normalizedDate || !isValid(normalizedDate)) {
      return 'Unknown date';
    }
    return format(normalizedDate, 'MMM d, yyyy');
  };

  // Group visits by date
  const getVisitsByDate = () => {
    const visitMap = new Map<string, VisitData[]>();
    
    visits.forEach(visit => {
      const visitDate = normalizeDate(visit.visited_at);
      if (visitDate && isValid(visitDate)) {
        // Format as a string key for the map
        const dateKey = format(visitDate, 'yyyy-MM-dd');
        
        if (!visitMap.has(dateKey)) {
          visitMap.set(dateKey, []);
        }
        
        visitMap.get(dateKey)?.push(visit);
      }
    });
    
    return visitMap;
  };

  // Navigate to previous month
  const goToPreviousMonth = () => {
    setCurrentMonth(prevMonth => subMonths(prevMonth, 1));
  };

  // Navigate to next month
  const goToNextMonth = () => {
    setCurrentMonth(prevMonth => addMonths(prevMonth, 1));
  };

  // Go to current month
  const goToCurrentMonth = () => {
    setCurrentMonth(new Date());
  };

  // Handle date selection
  const handleDateClick = (date: Date, hasVisits: boolean) => {
    if (!hasVisits) return;
    
    setSelectedDate(date);
    
    // Find visits for this date
    const dateKey = format(date, 'yyyy-MM-dd');
    const visitsMap = getVisitsByDate();
    const visitsForDate = visitsMap.get(dateKey) || [];
    setVisitsOnSelectedDate(visitsForDate);
  };

  // Build calendar days
  const buildCalendarDays = () => {
    const year = getYear(currentMonth);
    const month = getMonth(currentMonth);
    const daysInMonth = getDaysInMonth(new Date(year, month));
    const firstDayOfMonth = startOfMonth(new Date(year, month));
    const firstDayOfWeek = firstDayOfMonth.getDay(); // 0 = Sunday
    
    const visitMap = getVisitsByDate();
    
    // Create array for all days in the month with proper offset for first day
    const days = [];
    
    // Add empty placeholder days for the start of the month
    for (let i = 0; i < firstDayOfWeek; i++) {
      days.push({ day: null, hasVisits: false });
    }
    
    // Add actual days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const dateKey = format(date, 'yyyy-MM-dd');
      const hasVisits = visitMap.has(dateKey);
      const isSelectedDay = selectedDate && isSameDay(date, selectedDate);
      const isTodayDate = isToday(date);
      
      days.push({ 
        day, 
        date,
        hasVisits, 
        isSelected: isSelectedDay,
        isToday: isTodayDate,
        visitCount: hasVisits ? visitMap.get(dateKey)?.length || 0 : 0
      });
    }
    
    return days;
  };

  // Update visits on selected date when it changes
  useEffect(() => {
    if (selectedDate) {
      const dateKey = format(selectedDate, 'yyyy-MM-dd');
      const visitsMap = getVisitsByDate();
      const visitsForDate = visitsMap.get(dateKey) || [];
      setVisitsOnSelectedDate(visitsForDate);
    } else {
      setVisitsOnSelectedDate([]);
    }
  }, [selectedDate, visits]);

  const calendarDays = buildCalendarDays();

  return (
    <div className="bg-white rounded-lg shadow-sm">
      {/* Calendar Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <h3 className="font-medium flex items-center gap-2">
          <CalendarIcon size={18} className="text-blue-500" />
          {format(currentMonth, 'MMMM yyyy')}
        </h3>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            className="h-8 w-8 p-0" 
            onClick={goToPreviousMonth}
          >
            <ChevronLeft size={16} />
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            className="h-8 px-2 text-xs"
            onClick={goToCurrentMonth}
          >
            Today
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            className="h-8 w-8 p-0" 
            onClick={goToNextMonth}
          >
            <ChevronRight size={16} />
          </Button>
        </div>
      </div>
      
      {/* Calendar Grid */}
      <div className="p-4">
        {/* Weekday Headers */}
        <div className="grid grid-cols-7 mb-2 text-center">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="text-xs font-medium text-gray-500 py-2">
              {day}
            </div>
          ))}
        </div>
        
        {/* Calendar Days */}
        <div className="grid grid-cols-7 gap-1">
          {calendarDays.map((day, index) => (
            <div 
              key={index} 
              className={`aspect-square p-1 relative ${
                !day.day ? 'bg-gray-50' : 
                day.isSelected ? 'bg-blue-50 ring-2 ring-blue-500' : 
                day.isToday ? 'bg-amber-50 ring-1 ring-amber-300' : 
                day.hasVisits ? 'bg-blue-50 hover:bg-blue-100 cursor-pointer' : 
                'hover:bg-gray-50'
              }`}
              onClick={() => day.day && handleDateClick(day.date, day.hasVisits)}
            >
              {day.day && (
                <>
                  <div className="text-xs font-medium">
                    {day.day}
                  </div>
                  
                  {day.hasVisits && (
                    <div className="absolute bottom-1 right-1">
                      <Badge 
                        variant="secondary" 
                        className="h-4 min-w-4 p-0 flex items-center justify-center text-[10px] bg-blue-100 text-blue-800"
                      >
                        {day.visitCount}
                      </Badge>
                    </div>
                  )}
                </>
              )}
            </div>
          ))}
        </div>
      </div>
      
      {/* Selected Day Details */}
      {selectedDate && visitsOnSelectedDate.length > 0 && (
        <div className="border-t p-4">
          <h4 className="text-sm font-medium mb-3 flex items-center gap-1">
            <Calendar size={14} className="text-blue-500" />
            Visits on {format(selectedDate, 'MMMM d, yyyy')}
          </h4>
          
          <div className="space-y-3 max-h-80 overflow-y-auto">
            {visitsOnSelectedDate.map(visit => {
              const plaque = getPlaqueData(visit.plaque_id);
              return (
                <div 
                  key={visit.id}
                  className="p-3 border rounded-md hover:border-blue-300 hover:bg-blue-50 cursor-pointer transition-colors"
                  onClick={() => navigate(`/discover/plaque/${visit.plaque_id}`)}
                >
                  <div className="flex items-start gap-3">
                    <div className={`bg-${plaque?.color || 'blue'}-100 text-${plaque?.color || 'blue'}-500 w-10 h-10 rounded-lg flex items-center justify-center shrink-0`}>
                      <MapPin size={18} />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <h5 className="font-medium text-sm">
                        {plaque?.title || `Plaque #${visit.plaque_id}`}
                      </h5>
                      
                      <div className="flex items-center text-xs text-gray-500 mt-1">
                        <Clock size={12} className="mr-1" />
                        {format(normalizeDate(visit.visited_at) || new Date(), 'h:mm a')}
                      </div>
                      
                      {visit.notes && (
                        <p className="text-xs text-gray-600 mt-1 italic">
                          "{visit.notes}"
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default VisitCalendar;