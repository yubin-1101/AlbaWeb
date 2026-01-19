import React, { useState, useEffect, useCallback } from 'react'
import { format, parseISO, differenceInMinutes, addDays, subMinutes, addMinutes } from 'date-fns'
import { ko } from 'date-fns/locale'
import { supabase } from '../lib/supabase'
import { ChevronLeft, ChevronRight, Clock, Calendar, TrendingUp, X, Briefcase } from 'lucide-react'

// 데모 모드 확인
const isDemoMode = () => {
  const user = localStorage.getItem('alba_user')
  if (user) {
    const userData = JSON.parse(user)
    return userData.userId?.startsWith('demo-')
  }
  return false
}

interface WorkRecord {
  id: string
  clock_in_time: string
  clock_out_time: string | null
}

interface Schedule {
  date: string
  start_time: string
  end_time: string
}

interface DayWork {
  date: string
  clockIn: string | null
  clockOut: string | null
  scheduledStart: string | null
  scheduledEnd: string | null
}

export default function EmployeeDashboardPage() {
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [workRecords, setWorkRecords] = useState<Record<string, WorkRecord>>({})
  const [schedules, setSchedules] = useState<Record<string, Schedule>>({})
  const [loading, setLoading] = useState(true)
  const [selectedDay, setSelectedDay] = useState<DayWork | null>(null)
  const [totalWorkHours, setTotalWorkHours] = useState('0시간')
  const [totalWorkDays, setTotalWorkDays] = useState(0)
  const [estimatedSalary, setEstimatedSalary] = useState('0')
  const [activeTab, setActiveTab] = useState<'personal' | 'shared'>('personal')

  const fetchData = useCallback(async () => {
    setLoading(true)
    
    // 데모 모드인 경우
    if (isDemoMode()) {
      // 데모 데이터 생성
      const demoRecords: Record<string, WorkRecord> = {}
      const demoSchedules: Record<string, Schedule> = {}
      const today = new Date()
      
      // 이번 달 일부 날짜에 데모 데이터 생성
      for (let i = 1; i <= today.getDate(); i++) {
        const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), i)
        const dateStr = format(date, 'yyyy-MM-dd')
        const dayOfWeek = date.getDay()
        
        // 주말 제외
        if (dayOfWeek !== 0 && dayOfWeek !== 6 && Math.random() > 0.3) {
          demoRecords[dateStr] = {
            id: `demo-${i}`,
            clock_in_time: `${dateStr}T09:00:00.000Z`,
            clock_out_time: `${dateStr}T18:00:00.000Z`,
          }
          demoSchedules[dateStr] = {
            date: dateStr,
            start_time: '09:00',
            end_time: '18:00',
          }
        }
      }
      
      setWorkRecords(demoRecords)
      setSchedules(demoSchedules)
      setTotalWorkHours(`${Object.keys(demoRecords).length * 8}시간`)
      setTotalWorkDays(Object.keys(demoRecords).length)
      setEstimatedSalary((Object.keys(demoRecords).length * 8 * 11000).toLocaleString())
      setLoading(false)
      return
    }

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('로그인이 필요합니다.')

      const monthStart = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).toISOString()
      const monthEnd = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0, 23, 59, 59).toISOString()

      // Fetch attendance records
      const { data: attendance, error: attendanceError } = await supabase
        .from('attendance')
        .select('id, clock_in_time, clock_out_time')
        .eq('employee_id', user.id)
        .gte('clock_in_time', monthStart)
        .lte('clock_in_time', monthEnd)

      if (attendanceError) throw attendanceError

      // Fetch schedules
      const { data: schedulesData, error: schedulesError } = await supabase
        .from('schedules')
        .select('date, start_time, end_time')
        .eq('user_id', user.id)
        .gte('date', monthStart.split('T')[0])
        .lte('date', monthEnd.split('T')[0])

      if (schedulesError) throw schedulesError

      // Process schedules
      const schedulesMap: Record<string, Schedule> = {}
      schedulesData?.forEach(schedule => {
        schedulesMap[schedule.date] = schedule
      })
      setSchedules(schedulesMap)

      // Process attendance
      const records: Record<string, WorkRecord> = {}
      let monthlyTotalMinutes = 0
      const workDays = new Set<string>()
      const gracePeriod = 15

      attendance?.forEach(item => {
        if (!item.clock_in_time) return
        const dateString = format(new Date(item.clock_in_time), 'yyyy-MM-dd')
        
        records[dateString] = {
          id: item.id,
          clock_in_time: item.clock_in_time,
          clock_out_time: item.clock_out_time,
        }

        if (item.clock_in_time && item.clock_out_time) {
          workDays.add(dateString)

          const schedule = schedulesMap[dateString]
          if (schedule) {
            const clockIn = parseISO(item.clock_in_time)
            const clockOut = parseISO(item.clock_out_time)
            
            let scheduledStart = new Date(`${dateString}T${schedule.start_time}`)
            let scheduledEnd = new Date(`${dateString}T${schedule.end_time}`)

            if (scheduledEnd <= scheduledStart) {
              scheduledEnd = addDays(scheduledEnd, 1)
            }

            const validClockInStart = subMinutes(scheduledStart, gracePeriod)
            const validClockInEnd = addMinutes(scheduledStart, gracePeriod)
            const validClockOutStart = subMinutes(scheduledEnd, gracePeriod)
            const validClockOutEnd = addMinutes(scheduledEnd, gracePeriod)

            const isClockInValid = clockIn >= validClockInStart && clockIn <= validClockInEnd
            const isClockOutValid = clockOut >= validClockOutStart && clockOut <= validClockOutEnd

            if (isClockInValid && isClockOutValid) {
              const scheduledMinutes = differenceInMinutes(scheduledEnd, scheduledStart)
              if (scheduledMinutes > 0) {
                monthlyTotalMinutes += scheduledMinutes
              }
            }
          }
        }
      })

      const hours = Math.floor(monthlyTotalMinutes / 60)
      const mins = monthlyTotalMinutes % 60
      setTotalWorkHours(`${hours}시간 ${mins}분`)
      setTotalWorkDays(workDays.size)
      setEstimatedSalary((hours * 11000 + Math.round(mins / 60 * 11000)).toLocaleString())

      setWorkRecords(records)
    } catch (error: any) {
      console.error('Error fetching data:', error.message)
    } finally {
      setLoading(false)
    }
  }, [currentMonth])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const getDaysInMonth = () => {
    const year = currentMonth.getFullYear()
    const month = currentMonth.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const days: Date[] = []

    // Add empty slots for days before first day of month
    for (let i = 0; i < firstDay.getDay(); i++) {
      days.push(new Date(0)) // placeholder
    }

    for (let d = 1; d <= lastDay.getDate(); d++) {
      days.push(new Date(year, month, d))
    }

    return days
  }

  const handleDayClick = (date: Date) => {
    if (date.getTime() === 0) return // placeholder
    
    const dateString = format(date, 'yyyy-MM-dd')
    const record = workRecords[dateString]
    const schedule = schedules[dateString]

    setSelectedDay({
      date: dateString,
      clockIn: record?.clock_in_time || null,
      clockOut: record?.clock_out_time || null,
      scheduledStart: schedule?.start_time || null,
      scheduledEnd: schedule?.end_time || null,
    })
  }

  const prevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))
  }

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))
  }

  const days = getDaysInMonth()
  const today = format(new Date(), 'yyyy-MM-dd')

  if (loading) {
    return (
      <div className="min-h-full flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  return (
    <div className="min-h-full bg-gradient-to-br from-gray-50 to-blue-50 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-800">대시보드</h2>
          <p className="text-gray-500 mt-1">이번 달 근무 현황을 확인하세요</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-2xl shadow-sm p-6 border border-blue-100 hover:shadow-md transition">
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white w-14 h-14 rounded-xl flex items-center justify-center mb-4 shadow-lg shadow-blue-200">
              <Clock size={28} />
            </div>
            <p className="text-gray-500 text-sm mb-1">이달 근무 시간</p>
            <p className="text-3xl font-bold text-gray-900">{totalWorkHours}</p>
          </div>
          <div className="bg-white rounded-2xl shadow-sm p-6 border border-green-100 hover:shadow-md transition">
            <div className="bg-gradient-to-br from-green-500 to-emerald-600 text-white w-14 h-14 rounded-xl flex items-center justify-center mb-4 shadow-lg shadow-green-200">
              <Calendar size={28} />
            </div>
            <p className="text-gray-500 text-sm mb-1">이달 근무 일수</p>
            <p className="text-3xl font-bold text-gray-900">{totalWorkDays}일</p>
          </div>
          <div className="bg-white rounded-2xl shadow-sm p-6 border border-purple-100 hover:shadow-md transition">
            <div className="bg-gradient-to-br from-purple-500 to-indigo-600 text-white w-14 h-14 rounded-xl flex items-center justify-center mb-4 shadow-lg shadow-purple-200">
              <TrendingUp size={28} />
            </div>
            <p className="text-gray-500 text-sm mb-1">이달 예상 급여</p>
            <p className="text-3xl font-bold text-gray-900">₩{estimatedSalary}</p>
          </div>
        </div>

        {/* Tab Buttons */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveTab('personal')}
            className={`px-6 py-3 rounded-xl font-medium transition ${
              activeTab === 'personal' 
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' 
                : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
            }`}
          >
            📅 개인 캘린더
          </button>
          <button
            onClick={() => setActiveTab('shared')}
            className={`px-6 py-3 rounded-xl font-medium transition ${
              activeTab === 'shared' 
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' 
                : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
            }`}
          >
            👥 공유 캘린더
          </button>
        </div>

        {/* Calendar */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-6">
            <button onClick={prevMonth} className="p-3 hover:bg-gray-100 rounded-xl transition">
              <ChevronLeft size={24} />
            </button>
            <h3 className="text-xl font-bold text-gray-800">
              {format(currentMonth, 'yyyy년 MM월', { locale: ko })}
            </h3>
            <button onClick={nextMonth} className="p-3 hover:bg-gray-100 rounded-xl transition">
              <ChevronRight size={24} />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-2 mb-2">
            {['일', '월', '화', '수', '목', '금', '토'].map((day, i) => (
              <div key={day} className={`text-center font-medium py-2 ${i === 0 ? 'text-red-500' : i === 6 ? 'text-blue-500' : 'text-gray-500'}`}>
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-2">
            {days.map((date, index) => {
              if (date.getTime() === 0) {
                return <div key={index} className="h-24" />
              }

              const dateString = format(date, 'yyyy-MM-dd')
              const hasWork = workRecords[dateString]
              const hasSchedule = schedules[dateString]
              const isToday = dateString === today
              const dayOfWeek = date.getDay()

              return (
                <div
                  key={index}
                  onClick={() => handleDayClick(date)}
                  className={`h-24 p-2 rounded-xl cursor-pointer transition ${
                    isToday 
                      ? 'bg-blue-500 text-white shadow-lg shadow-blue-200' 
                      : 'bg-gray-50 hover:bg-gray-100'
                  }`}
                >
                  <div className={`text-sm font-medium ${
                    isToday ? 'text-white' : dayOfWeek === 0 ? 'text-red-500' : dayOfWeek === 6 ? 'text-blue-500' : 'text-gray-700'
                  }`}>
                    {format(date, 'd')}
                  </div>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {hasSchedule && (
                      <div className={`w-2 h-2 rounded-full ${isToday ? 'bg-yellow-300' : 'bg-yellow-400'}`} title="스케줄" />
                    )}
                    {hasWork && (
                      <div className={`w-2 h-2 rounded-full ${
                        hasWork.clock_out_time 
                          ? isToday ? 'bg-green-300' : 'bg-green-500' 
                          : isToday ? 'bg-orange-300' : 'bg-orange-500'
                      }`} title={hasWork.clock_out_time ? '근무 완료' : '근무 중'} />
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          <div className="flex gap-6 mt-6 pt-4 border-t border-gray-100">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <div className="w-3 h-3 bg-yellow-400 rounded-full" />
              <span>스케줄</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <div className="w-3 h-3 bg-green-500 rounded-full" />
              <span>근무 완료</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <div className="w-3 h-3 bg-orange-500 rounded-full" />
              <span>근무 중</span>
            </div>
          </div>
        </div>

        {/* Day Detail Modal */}
        {selectedDay && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl shadow-2xl p-6 w-96 max-w-full mx-4 animate-in zoom-in-95">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-gray-800">
                  {format(parseISO(selectedDay.date), 'yyyy년 MM월 dd일', { locale: ko })}
                </h3>
                <button onClick={() => setSelectedDay(null)} className="p-2 hover:bg-gray-100 rounded-xl transition">
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-4">
                {selectedDay.scheduledStart && (
                  <div className="p-4 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl border border-yellow-200">
                    <p className="text-sm text-yellow-700 font-medium mb-1">📅 예정된 스케줄</p>
                    <p className="text-xl font-bold text-yellow-800">{selectedDay.scheduledStart?.slice(0, 5)} - {selectedDay.scheduledEnd?.slice(0, 5)}</p>
                  </div>
                )}

                {selectedDay.clockIn && (
                  <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
                    <p className="text-sm text-blue-700 font-medium mb-1">🕐 실제 출근</p>
                    <p className="text-xl font-bold text-blue-800">{format(parseISO(selectedDay.clockIn), 'HH:mm')}</p>
                  </div>
                )}

                {selectedDay.clockOut && (
                  <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200">
                    <p className="text-sm text-green-700 font-medium mb-1">🕕 실제 퇴근</p>
                    <p className="text-xl font-bold text-green-800">{format(parseISO(selectedDay.clockOut), 'HH:mm')}</p>
                  </div>
                )}

                {!selectedDay.clockIn && !selectedDay.scheduledStart && (
                  <div className="py-8 text-center">
                    <div className="text-4xl mb-2">📭</div>
                    <p className="text-gray-500">근무 기록이 없습니다.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
