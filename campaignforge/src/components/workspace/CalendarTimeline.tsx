import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/useApp';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface CalendarTimelineProps {
  projectId: string;
}

const DAY_LABELS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

function useCalendar(initialYear: number, initialMonth: number) {
  const [year, setYear] = useState(initialYear);
  const [month, setMonth] = useState(initialMonth);

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfWeek = new Date(year, month, 1).getDay();
  const startOffset = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1;

  const days = useMemo(() => {
    const cells: (number | null)[] = [];
    for (let i = 0; i < startOffset; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(d);
    return cells;
  }, [daysInMonth, startOffset]);

  const prevMonth = () => {
    if (month === 0) { setYear(y => y - 1); setMonth(11); }
    else setMonth(m => m - 1);
  };

  const nextMonth = () => {
    if (month === 11) { setYear(y => y + 1); setMonth(0); }
    else setMonth(m => m + 1);
  };

  return { year, month, days, daysInMonth, prevMonth, nextMonth, label: `${MONTH_NAMES[month]} ${year}` };
}

export function CalendarTimeline({ projectId }: CalendarTimelineProps) {
  const { calendarEvents, addCalendarEvent, addToast } = useApp();
  const now = new Date();
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  const [selectedDate, setSelectedDate] = useState<number | null>(now.getDate());
  const [showEventModal, setShowEventModal] = useState(false);
  const [eventTitle, setEventTitle] = useState('');

  const cal = useCalendar(now.getFullYear(), now.getMonth());

  const filteredEvents = calendarEvents.filter((e) => e.projectId === projectId);

  const pad = (n: number) => String(n).padStart(2, '0');
  const dateStr = (day: number) => `${cal.year}-${pad(cal.month + 1)}-${pad(day)}`;

  const isToday = (day: number) => dateStr(day) === todayStr;
  const selectedDateStr = selectedDate ? dateStr(selectedDate) : '';
  const selectedDayEvents = filteredEvents.filter((ev) => ev.date.slice(0, 10) === selectedDateStr);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-black/5 pb-4">
        <div className="flex items-center gap-2">
          <button onClick={cal.prevMonth} className="p-1.5 hover:bg-black/5 rounded-full cursor-pointer"><ChevronLeft size={16} /></button>
          <h3 className="text-base font-bold font-display text-neutral-900 tracking-tight">{cal.label}</h3>
          <button onClick={cal.nextMonth} className="p-1.5 hover:bg-black/5 rounded-full cursor-pointer"><ChevronRight size={16} /></button>
        </div>
        <div className="text-xs font-mono font-bold text-neutral-400">ACTIVE {cal.daysInMonth}-DAY TIMELINE</div>
      </div>

      <div className="border border-black/10 rounded-2xl overflow-hidden shadow-sm bg-white">
        <div className="grid grid-cols-7 border-b border-black/10 text-center bg-[#ECEAE3]/30">
          {DAY_LABELS.map((day) => (
            <div key={day} className="py-2.5 text-[9px] font-mono font-black text-neutral-400 tracking-wider">{day}</div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {cal.days.map((dayNum, idx) => {
            if (dayNum === null) {
              return <div key={`empty-${idx}`} className="min-h-[96px] border-b border-r border-black/5 bg-black/[0.01]" />;
            }
            const dayEvents = filteredEvents.filter((ev) => ev.date.slice(0, 10) === dateStr(dayNum));
            const today = isToday(dayNum);
            return (
              <div key={dayNum} onClick={() => setSelectedDate(dayNum)}
                className={`min-h-[96px] border-b border-r border-black/5 p-2 flex flex-col justify-between transition-all cursor-pointer relative ${
                  today ? 'bg-black/4' : 'hover:bg-black/2'
                } ${selectedDate === dayNum ? 'ring-1 ring-inset ring-neutral-800' : ''}`}>
                <div className="flex justify-between items-start">
                  <span className={`text-[11px] font-mono font-bold ${today ? 'bg-[#1A1A1A] text-white px-1.5 py-0.5 rounded-full' : 'text-neutral-500'}`}>{dayNum}</span>
                  {today && <span className="text-[8px] font-bold font-mono text-[#B45309] uppercase">TODAY</span>}
                </div>
                <div className="space-y-1 mt-2 flex-1 flex flex-col justify-end">
                  {dayEvents.map((ev) => (
                    <div key={ev.id}
                      className={`text-[9px] font-semibold truncate rounded px-1.5 py-0.5 leading-tight ${
                        ev.type === 'content' ? 'bg-neutral-900/10 text-neutral-800 border border-neutral-900/5' : 'bg-[#B45309]/10 text-[#B45309] border border-[#B45309]/5'
                      }`}
                      title={`${ev.title}: ${ev.details}`}>
                      {ev.title}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {selectedDate && (
        <div className="bg-[rgba(255,255,255,0.55)] backdrop-blur-[20px] saturate-[160%] border border-[rgba(255,255,255,0.70)] rounded-[16px] shadow-[0_4px_24px_rgba(17,17,17,0.06)] p-5 rounded-2xl border border-black/5 space-y-3.5">
          <div className="flex justify-between items-center border-b border-black/5 pb-2.5">
            <h4 className="text-xs font-mono font-black text-neutral-400 uppercase">— TIMELINE DETAILS FOR {MONTH_NAMES[cal.month]} {selectedDate}, {cal.year}</h4>
            <button onClick={() => { setEventTitle(''); setShowEventModal(true); }} className="text-xs font-bold text-neutral-500 hover:text-black flex items-center gap-1 hover:underline cursor-pointer">+ Schedule Event</button>
          </div>
          <div className="space-y-2.5">
            {selectedDayEvents.length === 0 ? (
              <div className="text-xs text-neutral-400 italic py-2">No campaign tasks or copy releases scheduled for this date.</div>
            ) : (
              selectedDayEvents.map((ev) => (
                <div key={ev.id} className="p-3 bg-black/4 border border-black/5 rounded-xl flex items-start gap-3 justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded uppercase ${ev.type === 'content' ? 'bg-[#1A1A1A] text-white' : 'bg-[#B45309]/10 text-[#B45309]'}`}>{ev.type}</span>
                      <span className="text-sm font-bold text-neutral-800">{ev.title}</span>
                    </div>
                    <p className="text-xs text-neutral-500 pl-1">{ev.details}</p>
                  </div>
                  <span className="text-[10px] font-mono text-neutral-400">Scheduled</span>
                </div>
              ))
            )}
          </div>
        </div>
      )}
      {showEventModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm" onClick={() => { setShowEventModal(false); setEventTitle(''); }}>
          <div className="bg-white rounded-2xl shadow-2xl border border-black/10 p-6 w-[380px] space-y-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold font-display text-neutral-900">Schedule Event</h3>
              <span className="text-[10px] font-mono text-neutral-400 font-bold">{MONTH_NAMES[cal.month]} {selectedDate}, {cal.year}</span>
            </div>
            <input type="text" value={eventTitle} onChange={(e) => setEventTitle(e.target.value)}
              placeholder="Enter event title..."
              autoFocus
              onKeyDown={(e) => { if (e.key === 'Enter' && eventTitle.trim()) { addCalendarEvent(projectId, eventTitle.trim(), dateStr(selectedDate!), 'task', 'Manually scheduled item.'); setShowEventModal(false); setEventTitle(''); } }}
              className="w-full px-4 py-2.5 rounded-xl border border-black/10 bg-[#F0EEE8]/50 text-xs font-medium text-neutral-900 outline-none focus:border-neutral-400 transition-all placeholder:text-neutral-400" />
            <div className="flex justify-end gap-2">
              <button onClick={() => { setShowEventModal(false); setEventTitle(''); }} className="px-4 py-2 rounded-[9999px] bg-transparent text-neutral-600 text-xs font-medium border border-black/10 hover:bg-black/5 transition-all cursor-pointer">Cancel</button>
              <button onClick={() => { if (eventTitle.trim()) { addCalendarEvent(projectId, eventTitle.trim(), dateStr(selectedDate!), 'task', 'Manually scheduled item.'); setShowEventModal(false); setEventTitle(''); } }} className="px-4 py-2 rounded-[9999px] bg-[#1A1A1A] text-white text-xs font-semibold hover:bg-neutral-800 transition-all cursor-pointer">Schedule</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
