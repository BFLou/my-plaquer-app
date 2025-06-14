// src/components/profile/VisitCalendar.tsx
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  MapPin,
  Clock,
  Star,
  MessageCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  format,
  isValid,
  getMonth,
  getYear,
  addMonths,
  subMonths,
  isSameDay,
  startOfMonth,
  parseISO,
  isToday,
  isSameMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
} from 'date-fns';
import { Plaque } from '@/types/plaque';

interface VisitData {
  id: string;
  plaque_id: number;
  user_id: string;
  visited_at: any; // Can be Date, Firebase Timestamp, or string
  notes?: string;
  rating?: number;
  photos?: string[];
}

interface VisitCalendarProps {
  visits: VisitData[];
  getPlaqueData: (plaqueId: number) => Plaque | null;
  className?: string;
  compact?: boolean; // For mobile/smaller screens
}

interface CalendarDay {
  day: number | null;
  date?: Date;
  hasVisits: boolean;
  isSelected?: boolean;
  isToday?: boolean;
  visitCount: number;
  isCurrentMonth?: boolean;
}

const VisitCalendar: React.FC<VisitCalendarProps> = ({
  visits,
  getPlaqueData,
  className = '',
  compact = false,
}) => {
  const navigate = useNavigate();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [visitsOnSelectedDate, setVisitsOnSelectedDate] = useState<VisitData[]>(
    []
  );
  const [isLoading, setIsLoading] = useState(false);
  const calendarRef = useRef<HTMLDivElement>(null);

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

  // Format time safely
  const formatVisitTime = (dateValue: any): string => {
    const normalizedDate = normalizeDate(dateValue);
    if (!normalizedDate || !isValid(normalizedDate)) {
      return '';
    }
    return format(normalizedDate, 'h:mm a');
  };

  // Group visits by date for efficient lookup
  const getVisitsByDate = () => {
    const visitMap = new Map<string, VisitData[]>();

    visits.forEach((visit) => {
      const visitDate = normalizeDate(visit.visited_at);
      if (visitDate && isValid(visitDate)) {
        // Format as a string key for the map (YYYY-MM-DD format)
        const dateKey = format(visitDate, 'yyyy-MM-dd');

        if (!visitMap.has(dateKey)) {
          visitMap.set(dateKey, []);
        }

        visitMap.get(dateKey)?.push(visit);
      }
    });

    return visitMap;
  };

  // Navigation functions
  const goToPreviousMonth = () => {
    setIsLoading(true);
    setCurrentMonth((prevMonth) => subMonths(prevMonth, 1));
    setSelectedDate(null); // Clear selection when changing months
    setTimeout(() => setIsLoading(false), 150);
  };

  const goToNextMonth = () => {
    setIsLoading(true);
    setCurrentMonth((prevMonth) => addMonths(prevMonth, 1));
    setSelectedDate(null); // Clear selection when changing months
    setTimeout(() => setIsLoading(false), 150);
  };

  const goToCurrentMonth = () => {
    setIsLoading(true);
    setCurrentMonth(new Date());
    setSelectedDate(null);
    setTimeout(() => setIsLoading(false), 150);
  };

  // Handle date selection with haptic feedback
  const handleDateClick = (date: Date, hasVisits: boolean) => {
    if (!hasVisits) return;

    // Haptic feedback for mobile
    if (navigator.vibrate) {
      navigator.vibrate(10);
    }

    setSelectedDate(date);

    // Find visits for this date
    const dateKey = format(date, 'yyyy-MM-dd');
    const visitsMap = getVisitsByDate();
    const visitsForDate = visitsMap.get(dateKey) || [];
    setVisitsOnSelectedDate(visitsForDate);

    // Scroll to details on mobile
    if (window.innerWidth < 768 && visitsForDate.length > 0) {
      setTimeout(() => {
        const detailsElement = document.getElementById('visit-details');
        if (detailsElement) {
          detailsElement.scrollIntoView({
            behavior: 'smooth',
            block: 'nearest',
          });
        }
      }, 100);
    }
  };

  // Build calendar days with proper month boundaries
  const buildCalendarDays = (): CalendarDay[] => {
    const year = getYear(currentMonth);
    const month = getMonth(currentMonth);
    const firstDayOfMonth = startOfMonth(new Date(year, month));

    // Get the start and end of the calendar grid (6 weeks)
    const startOfCalendar = startOfWeek(firstDayOfMonth, { weekStartsOn: 0 });
    const endOfCalendar = endOfWeek(
      new Date(startOfCalendar.getTime() + 41 * 24 * 60 * 60 * 1000)
    );

    const visitMap = getVisitsByDate();
    const days: CalendarDay[] = [];

    // Generate all days in the calendar grid
    const allDays = eachDayOfInterval({
      start: startOfCalendar,
      end: endOfCalendar,
    });

    allDays.forEach((date) => {
      const dayNumber = date.getDate();
      const dateKey = format(date, 'yyyy-MM-dd');
      const hasVisits = visitMap.has(dateKey);
      const isSelectedDay = selectedDate && isSameDay(date, selectedDate);
      const isTodayDate = isToday(date);
      const isCurrentMonthDay = isSameMonth(date, currentMonth);

      days.push({
        day: isCurrentMonthDay ? dayNumber : null,
        date,
        hasVisits,
        isSelected: isSelectedDay || undefined,
        isToday: isTodayDate,
        visitCount: hasVisits ? visitMap.get(dateKey)?.length || 0 : 0,
        isCurrentMonth: isCurrentMonthDay,
      });
    });

    return days;
  };

  // Update visits on selected date when selection or visits change
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

  // Clear selection when month changes
  useEffect(() => {
    setSelectedDate(null);
  }, [currentMonth]);

  const calendarDays = buildCalendarDays();
  const hasVisitsThisMonth = visits.some((visit) => {
    const visitDate = normalizeDate(visit.visited_at);
    return visitDate && isSameMonth(visitDate, currentMonth);
  });

  return (
    <div className={`bg-white rounded-lg shadow-sm border ${className}`}>
      {/* Calendar Header - Mobile Optimized */}
      <div className="flex items-center justify-between p-3 sm:p-4 border-b">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <CalendarIcon size={18} className="text-blue-500 flex-shrink-0" />
          <div className="min-w-0">
            <h3 className="font-medium text-sm sm:text-base truncate">
              {format(currentMonth, 'MMMM yyyy')}
            </h3>
            {!compact && (
              <p className="text-xs text-gray-500">
                {visits.length} total visits
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="sm"
            className="h-8 w-8 p-0 min-w-[32px] min-h-[32px]"
            onClick={goToPreviousMonth}
            disabled={isLoading}
          >
            <ChevronLeft size={14} />
          </Button>

          <Button
            variant="outline"
            size="sm"
            className="h-8 px-2 text-xs min-h-[32px] whitespace-nowrap"
            onClick={goToCurrentMonth}
            disabled={isLoading}
          >
            Today
          </Button>

          <Button
            variant="outline"
            size="sm"
            className="h-8 w-8 p-0 min-w-[32px] min-h-[32px]"
            onClick={goToNextMonth}
            disabled={isLoading}
          >
            <ChevronRight size={14} />
          </Button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="p-2 sm:p-4" ref={calendarRef}>
        {/* Weekday Headers - Mobile Optimized */}
        <div className="grid grid-cols-7 mb-2 text-center">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
            <div key={day} className="text-xs font-medium text-gray-500 py-2">
              <span className="hidden sm:inline">{day}</span>
              <span className="sm:hidden">{day.charAt(0)}</span>
            </div>
          ))}
        </div>

        {/* Calendar Days Grid - Mobile Optimized */}
        <div className="grid grid-cols-7 gap-1">
          {calendarDays.map((day, index) => {
            const isDisabled = !day.day || !day.date;
            const isClickable = day.hasVisits && !isDisabled;

            return (
              <button
                key={index}
                className={`
                  aspect-square p-1 relative text-xs sm:text-sm min-h-[40px] sm:min-h-[44px] 
                  flex flex-col items-center justify-center rounded transition-all duration-200
                  ${
                    isDisabled
                      ? 'bg-gray-50 cursor-default text-gray-300'
                      : day.isSelected
                        ? 'bg-blue-500 text-white ring-2 ring-blue-300 shadow-md transform scale-105'
                        : day.isToday
                          ? 'bg-blue-50 text-blue-700 ring-2 ring-blue-200 font-semibold'
                          : day.hasVisits
                            ? 'bg-green-50 text-green-700 hover:bg-green-100 cursor-pointer border-2 border-green-200 hover:border-green-300'
                            : 'hover:bg-gray-50 cursor-pointer text-gray-600 hover:text-gray-800'
                  }
                  ${isClickable ? 'active:scale-95' : ''}
                  ${!day.isCurrentMonth ? 'opacity-30' : ''}
                `}
                onClick={() =>
                  day.date && handleDateClick(day.date, day.hasVisits)
                }
                disabled={isDisabled || isLoading}
                aria-label={
                  day.date
                    ? `${format(day.date, 'MMMM d, yyyy')}${day.hasVisits ? ` - ${day.visitCount} visit${day.visitCount !== 1 ? 's' : ''}` : ''}`
                    : undefined
                }
              >
                {day.day && (
                  <>
                    <span
                      className={`font-medium ${day.isToday ? 'font-bold' : ''}`}
                    >
                      {day.day}
                    </span>

                    {day.hasVisits && (
                      <div className="absolute bottom-0.5 right-0.5">
                        <div
                          className={`
                          h-2 w-2 sm:h-3 sm:w-3 rounded-full flex items-center justify-center text-white text-[8px] sm:text-[10px] font-bold
                          ${day.isSelected ? 'bg-white text-blue-500' : 'bg-green-500'}
                        `}
                        >
                          <span className="hidden sm:inline">
                            {day.visitCount}
                          </span>
                          <span className="sm:hidden">•</span>
                        </div>
                      </div>
                    )}

                    {day.isToday && !day.hasVisits && (
                      <div className="absolute bottom-0.5 right-0.5">
                        <div className="h-1.5 w-1.5 rounded-full bg-blue-500"></div>
                      </div>
                    )}
                  </>
                )}
              </button>
            );
          })}
        </div>

        {/* Month Stats - Mobile Optimized */}
        {!compact && (
          <div className="mt-4 p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">This month:</span>
              <div className="flex items-center gap-4">
                <span className="font-medium">
                  {
                    visits.filter((visit) => {
                      const visitDate = normalizeDate(visit.visited_at);
                      return visitDate && isSameMonth(visitDate, currentMonth);
                    }).length
                  }{' '}
                  visits
                </span>
                <span className="text-gray-500">
                  {
                    new Set(
                      visits
                        .filter((visit) => {
                          const visitDate = normalizeDate(visit.visited_at);
                          return (
                            visitDate && isSameMonth(visitDate, currentMonth)
                          );
                        })
                        .map((v) => v.plaque_id)
                    ).size
                  }{' '}
                  unique plaques
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Selected Day Details - Mobile Optimized */}
      {selectedDate && visitsOnSelectedDate.length > 0 && (
        <div id="visit-details" className="border-t bg-gray-50">
          <div className="p-3 sm:p-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-medium flex items-center gap-2">
                <CalendarIcon size={14} className="text-blue-500" />
                <span className="truncate">
                  {format(selectedDate, 'EEEE, MMMM d, yyyy')}
                </span>
              </h4>
              <Badge variant="secondary" className="text-xs">
                {visitsOnSelectedDate.length} visit
                {visitsOnSelectedDate.length !== 1 ? 's' : ''}
              </Badge>
            </div>

            <div className="space-y-2 max-h-80 overflow-y-auto">
              {visitsOnSelectedDate.map((visit, index) => {
                const plaque = getPlaqueData(visit.plaque_id);
                const visitTime = formatVisitTime(visit.visited_at);

                return (
                  <button
                    key={visit.id || `${visit.plaque_id}-${index}`}
                    className="w-full p-3 border rounded-lg hover:border-blue-300 hover:bg-white cursor-pointer transition-all text-left group bg-white shadow-sm"
                    onClick={() =>
                      navigate(`/discover/plaque/${visit.plaque_id}`)
                    }
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`
                        w-10 h-10 rounded-lg flex items-center justify-center shrink-0 transition-colors
                        ${plaque?.color ? `bg-${plaque.color}-100 text-${plaque.color}-500` : 'bg-blue-100 text-blue-500'}
                        group-hover:scale-105
                      `}
                      >
                        <MapPin size={16} />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <h5 className="font-medium text-sm sm:text-base line-clamp-2 group-hover:text-blue-600 transition-colors">
                            {plaque?.title || `Plaque #${visit.plaque_id}`}
                          </h5>

                          {visit.rating && (
                            <div className="flex items-center gap-1 flex-shrink-0">
                              <Star
                                size={12}
                                className="fill-amber-400 text-amber-400"
                              />
                              <span className="text-xs text-amber-600 font-medium">
                                {visit.rating}
                              </span>
                            </div>
                          )}
                        </div>

                        {plaque?.location && (
                          <p className="text-xs text-gray-600 mb-1 line-clamp-1">
                            {plaque.location}
                          </p>
                        )}

                        <div className="flex items-center gap-3 text-xs text-gray-500">
                          {visitTime && (
                            <div className="flex items-center gap-1">
                              <Clock size={10} />
                              <span>{visitTime}</span>
                            </div>
                          )}

                          {visit.notes && (
                            <div className="flex items-center gap-1">
                              <MessageCircle size={10} />
                              <span>Has notes</span>
                            </div>
                          )}

                          {visit.photos && visit.photos.length > 0 && (
                            <div className="flex items-center gap-1">
                              <span>📷</span>
                              <span>
                                {visit.photos.length} photo
                                {visit.photos.length !== 1 ? 's' : ''}
                              </span>
                            </div>
                          )}
                        </div>

                        {visit.notes && (
                          <div className="mt-2 p-2 bg-blue-50 rounded text-xs text-blue-800 line-clamp-2">
                            <span className="font-medium">Note:</span> "
                            {visit.notes}"
                          </div>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Quick actions for selected date */}
            <div className="mt-3 pt-3 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">
                  {visitsOnSelectedDate.length} visit
                  {visitsOnSelectedDate.length !== 1 ? 's' : ''} on this day
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedDate(null)}
                  className="text-xs h-6 px-2"
                >
                  Close
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Empty State for Month */}
      {!hasVisitsThisMonth && !isLoading && (
        <div className="p-4 text-center text-gray-500">
          <MapPin className="mx-auto text-gray-300 mb-2" size={24} />
          <p className="text-sm">
            No visits in {format(currentMonth, 'MMMM yyyy')}
          </p>
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center rounded-lg">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-sm text-gray-600">Loading...</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default VisitCalendar;
