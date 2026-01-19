import React, { useState, useEffect, useCallback } from 'react'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'
import { supabase } from '../lib/supabase'
import { Plus, Trash2, Calendar, Clock } from 'lucide-react'

// 데모 모드 확인
const isDemoMode = () => {
  const user = localStorage.getItem('alba_user')
  if (user) {
    const userData = JSON.parse(user)
    return userData.userId?.startsWith('demo-')
  }
  return false
}

interface Schedule {
  id: string
  date: string
  start_time: string
  end_time: string
  user_id: string
}

export default function SchedulePage() {
  const [schedules, setSchedules] = useState<Schedule[]>([])
  const [branchName, setBranchName] = useState('')
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [newSchedule, setNewSchedule] = useState({
    date: format(new Date(), 'yyyy-MM-dd'),
    startTime: '09:00',
    endTime: '18:00',
  })

  const fetchSchedules = useCallback(async () => {
    setLoading(true)
    
    // 데모 모드
    if (isDemoMode()) {
      setBranchName('테스트 지점')
      // 데모 스케줄 생성
      const demoSchedules: Schedule[] = []
      const today = new Date()
      for (let i = 0; i < 7; i++) {
        const date = new Date(today)
        date.setDate(date.getDate() + i)
        if (date.getDay() !== 0 && date.getDay() !== 6) {
          demoSchedules.push({
            id: `demo-schedule-${i}`,
            date: format(date, 'yyyy-MM-dd'),
            start_time: '09:00:00',
            end_time: '18:00:00',
            user_id: 'demo-user',
          })
        }
      }
      setSchedules(demoSchedules)
      setLoading(false)
      return
    }

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Fetch branch name
      const { data: employeeData } = await supabase
        .from('employees')
        .select('branch_code')
        .eq('user_id', user.id)
        .single()

      if (employeeData) {
        const { data: branchData } = await supabase
          .from('branches')
          .select('name')
          .eq('branch_code', employeeData.branch_code)
          .single()

        if (branchData) {
          setBranchName(branchData.name)
        }
      }

      // Fetch schedules
      const { data, error } = await supabase
        .from('schedules')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false })

      if (error) throw error
      setSchedules(data || [])
    } catch (error: any) {
      console.error('Error:', error.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchSchedules()
  }, [fetchSchedules])

  const handleSaveSchedule = async () => {
    // 데모 모드
    if (isDemoMode()) {
      const newItem: Schedule = {
        id: `demo-${Date.now()}`,
        date: newSchedule.date,
        start_time: newSchedule.startTime + ':00',
        end_time: newSchedule.endTime + ':00',
        user_id: 'demo-user',
      }
      setSchedules(prev => [newItem, ...prev])
      setShowModal(false)
      alert('스케줄이 저장되었습니다.')
      return
    }

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { error } = await supabase
        .from('schedules')
        .upsert({
          user_id: user.id,
          date: newSchedule.date,
          start_time: newSchedule.startTime,
          end_time: newSchedule.endTime,
        }, { onConflict: 'user_id, date' })

      if (error) throw error

      setShowModal(false)
      fetchSchedules()
      alert('스케줄이 저장되었습니다.')
    } catch (error: any) {
      alert('저장 실패: ' + error.message)
    }
  }

  const handleDeleteSchedule = async (id: string) => {
    if (!confirm('이 스케줄을 삭제하시겠습니까?')) return

    // 데모 모드
    if (isDemoMode()) {
      setSchedules(prev => prev.filter(s => s.id !== id))
      return
    }

    try {
      const { error } = await supabase
        .from('schedules')
        .delete()
        .eq('id', id)

      if (error) throw error
      fetchSchedules()
    } catch (error: any) {
      alert('삭제 실패: ' + error.message)
    }
  }

  if (loading) {
    return (
      <div className="min-h-full flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  return (
    <div className="min-h-full bg-gradient-to-br from-gray-50 to-blue-50 p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-3xl font-bold text-gray-800">스케줄 관리</h2>
            <p className="text-gray-500 mt-1">근무 일정을 등록하고 관리하세요</p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-indigo-500 text-white px-6 py-3 rounded-xl font-semibold hover:from-blue-600 hover:to-indigo-600 transition shadow-lg shadow-blue-200"
          >
            <Plus size={20} />
            스케줄 추가
          </button>
        </div>

        {branchName && (
          <div className="mb-6 p-5 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl shadow-lg">
            <div className="flex items-center gap-3 text-white">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                <Calendar size={24} />
              </div>
              <div>
                <p className="text-blue-100 text-sm">소속 지점</p>
                <p className="text-xl font-bold">{branchName}</p>
              </div>
            </div>
          </div>
        )}

        {/* Schedule Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-2xl shadow-sm p-5 border border-blue-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Calendar size={20} className="text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">등록된 스케줄</p>
                <p className="text-xl font-bold text-gray-800">{schedules.length}개</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-2xl shadow-sm p-5 border border-green-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <Clock size={20} className="text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">이번 주 근무</p>
                <p className="text-xl font-bold text-gray-800">{schedules.filter(s => {
                  const date = new Date(s.date)
                  const today = new Date()
                  const weekStart = new Date(today.setDate(today.getDate() - today.getDay()))
                  const weekEnd = new Date(today.setDate(today.getDate() + 6))
                  return date >= weekStart && date <= weekEnd
                }).length}일</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-2xl shadow-sm p-5 border border-purple-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <Clock size={20} className="text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">예상 근무시간</p>
                <p className="text-xl font-bold text-gray-800">{schedules.length * 8}시간</p>
              </div>
            </div>
          </div>
        </div>

        {/* Schedule List */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="p-5 border-b border-gray-100">
            <h3 className="font-bold text-lg text-gray-800">내 스케줄</h3>
          </div>

          {schedules.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Calendar size={36} className="text-gray-400" />
              </div>
              <p className="text-gray-600 font-medium mb-2">등록된 스케줄이 없습니다</p>
              <p className="text-sm text-gray-400">위의 '스케줄 추가' 버튼을 눌러 스케줄을 등록하세요.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {schedules.map(schedule => (
                <div key={schedule.id} className="p-5 flex justify-between items-center hover:bg-gray-50 transition">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center">
                      <span className="text-blue-600 font-bold">{new Date(schedule.date).getDate()}</span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-800">
                        {format(new Date(schedule.date), 'yyyy년 MM월 dd일 (EEE)', { locale: ko })}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <Clock size={14} className="text-gray-400" />
                        <p className="text-gray-500">
                          {schedule.start_time.slice(0, 5)} - {schedule.end_time.slice(0, 5)}
                        </p>
                      </div>
                      {branchName && <p className="text-xs text-gray-400 mt-1">{branchName}</p>}
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeleteSchedule(schedule.id)}
                    className="p-3 text-red-500 hover:bg-red-50 rounded-xl transition"
                  >
                    <Trash2 size={20} />
                  </button>
                </div>
              ))}
            </div>
          )}
      </div>

      {/* Add Schedule Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-96 max-w-full mx-4">
            <h3 className="text-xl font-bold mb-6 text-gray-800">스케줄 추가</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">날짜</label>
                <input
                  type="date"
                  value={newSchedule.date}
                  onChange={(e) => setNewSchedule({ ...newSchedule, date: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">시작 시간</label>
                <input
                  type="time"
                  value={newSchedule.startTime}
                  onChange={(e) => setNewSchedule({ ...newSchedule, startTime: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">종료 시간</label>
                <input
                  type="time"
                  value={newSchedule.endTime}
                  onChange={(e) => setNewSchedule({ ...newSchedule, endTime: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 px-4 py-3 border border-gray-200 rounded-xl font-medium hover:bg-gray-50 transition"
              >
                취소
              </button>
              <button
                onClick={handleSaveSchedule}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-xl font-medium hover:from-blue-600 hover:to-indigo-600 transition"
              >
                저장
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  )
}
