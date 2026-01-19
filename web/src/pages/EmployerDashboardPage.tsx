import React, { useState, useEffect, useCallback } from 'react'
import { format } from 'date-fns'
import { supabase } from '../lib/supabase'
import { Users, UserCheck, Clock, QrCode, CheckCircle, XCircle, UserPlus, Briefcase } from 'lucide-react'

// 데모 모드 확인
const isDemoMode = () => {
  const user = localStorage.getItem('alba_user')
  if (user) {
    const userData = JSON.parse(user)
    return userData.userId?.startsWith('demo-')
  }
  return false
}

interface Employee {
  user_id: string
  name: string
  status: string
  isWorking?: boolean
}

interface Shift {
  time: string
  name: string
}

export default function EmployerDashboardPage() {
  const [loading, setLoading] = useState(true)
  const [summaryData, setSummaryData] = useState({ total: 0, working: 0, pending: 0 })
  const [shifts, setShifts] = useState<Shift[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [branchCode, setBranchCode] = useState('')

  const fetchDashboardData = useCallback(async () => {
    setLoading(true)
    
    // 데모 모드
    if (isDemoMode()) {
      setBranchCode('DEMO01')
      
      const demoEmployees: Employee[] = [
        { user_id: '1', name: '김철수', status: 'approved', isWorking: true },
        { user_id: '2', name: '이영희', status: 'approved', isWorking: true },
        { user_id: '3', name: '박민수', status: 'approved', isWorking: false },
        { user_id: '4', name: '정수진', status: 'pending' },
      ]
      
      const demoShifts: Shift[] = [
        { time: '09:00 - 14:00', name: '김철수' },
        { time: '14:00 - 18:00', name: '이영희' },
        { time: '18:00 - 22:00', name: '박민수' },
      ]
      
      setEmployees(demoEmployees)
      setShifts(demoShifts)
      setSummaryData({ total: 3, working: 2, pending: 1 })
      setLoading(false)
      return
    }

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('로그인이 필요합니다.')

      // Get employer's branch
      const { data: branchData, error: branchError } = await supabase
        .from('branches')
        .select('id, branch_code')
        .eq('employer_id', user.id)
        .single()

      if (branchError) throw branchError
      if (!branchData) throw new Error('지점 정보가 없습니다.')

      const { id: branchId, branch_code } = branchData
      setBranchCode(branch_code)

      // Fetch all employees
      const { data: employeesData, error: employeesError } = await supabase
        .from('employees')
        .select('user_id, name, status')
        .eq('branch_code', branch_code)

      if (employeesError) throw employeesError

      const approvedEmployees = employeesData?.filter(e => e.status === 'approved') || []
      const pendingEmployees = employeesData?.filter(e => e.status === 'pending') || []
      const employeeIds = approvedEmployees.map(e => e.user_id)

      // Fetch today's attendance
      const today = format(new Date(), 'yyyy-MM-dd')
      const { data: attendanceData } = await supabase
        .from('attendance')
        .select('employee_id, clock_in_time, clock_out_time')
        .in('employee_id', employeeIds)
        .gte('clock_in_time', `${today}T00:00:00.000Z`)
        .lte('clock_in_time', `${today}T23:59:59.999Z`)

      const workingEmployeeIds = new Set(
        attendanceData?.filter(att => att.clock_in_time && !att.clock_out_time)
          .map(att => att.employee_id) || []
      )

      const processedEmployees = approvedEmployees.map(emp => ({
        ...emp,
        isWorking: workingEmployeeIds.has(emp.user_id),
      }))
      setEmployees([...processedEmployees, ...pendingEmployees])

      // Fetch today's schedules
      const { data: schedulesData } = await supabase
        .from('schedules')
        .select('start_time, end_time, user_id')
        .in('user_id', employeeIds)
        .eq('date', today)

      const employeeMap = approvedEmployees.reduce((acc: any, emp) => {
        acc[emp.user_id] = emp.name
        return acc
      }, {})

      const processedShifts = schedulesData?.map(sch => ({
        time: `${sch.start_time.slice(0, 5)} - ${sch.end_time.slice(0, 5)}`,
        name: employeeMap[sch.user_id] || '알 수 없는 직원',
      })) || []
      setShifts(processedShifts)

      setSummaryData({
        total: approvedEmployees.length,
        working: workingEmployeeIds.size,
        pending: pendingEmployees.length,
      })
    } catch (error: any) {
      console.error('Error:', error.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchDashboardData()
  }, [fetchDashboardData])

  const handleApprove = async (userId: string) => {
    // 데모 모드
    if (isDemoMode()) {
      setEmployees(prev => prev.map(emp => 
        emp.user_id === userId ? { ...emp, status: 'approved' } : emp
      ))
      setSummaryData(prev => ({ ...prev, pending: prev.pending - 1, total: prev.total + 1 }))
      alert('직원이 승인되었습니다.')
      return
    }

    try {
      const { error } = await supabase
        .from('employees')
        .update({ status: 'approved' })
        .eq('user_id', userId)

      if (error) throw error
      fetchDashboardData()
      alert('직원이 승인되었습니다.')
    } catch (error: any) {
      alert('승인 실패: ' + error.message)
    }
  }

  const handleReject = async (userId: string) => {
    if (!confirm('이 직원 요청을 거절하시겠습니까?')) return

    // 데모 모드
    if (isDemoMode()) {
      setEmployees(prev => prev.filter(emp => emp.user_id !== userId))
      setSummaryData(prev => ({ ...prev, pending: prev.pending - 1 }))
      return
    }

    try {
      const { error } = await supabase
        .from('employees')
        .delete()
        .eq('user_id', userId)

      if (error) throw error
      fetchDashboardData()
    } catch (error: any) {
      alert('거절 실패: ' + error.message)
    }
  }

  if (loading) {
    return (
      <div className="min-h-full flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
      </div>
    )
  }

  return (
    <div className="min-h-full bg-gradient-to-br from-gray-50 to-green-50 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-800">매장 대시보드</h2>
          <p className="text-gray-500 mt-1">직원 현황과 근무 상태를 관리하세요</p>
        </div>

        {/* Branch Code */}
        {branchCode && (
          <div className="mb-6 p-5 bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl shadow-lg shadow-green-200">
            <div className="flex items-center gap-3 text-white">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                <QrCode size={24} />
              </div>
              <div>
                <p className="text-green-100 text-sm">지점 코드</p>
                <p className="text-2xl font-bold tracking-wider">{branchCode}</p>
              </div>
            </div>
            <p className="text-green-100 text-sm mt-3">💡 이 코드를 직원들에게 공유하세요.</p>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-2xl shadow-sm p-6 border border-blue-100 hover:shadow-md transition">
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white w-14 h-14 rounded-xl flex items-center justify-center mb-4 shadow-lg shadow-blue-200">
              <Users size={28} />
            </div>
            <p className="text-gray-500 text-sm mb-1">총 직원</p>
            <p className="text-3xl font-bold text-gray-900">{summaryData.total}명</p>
          </div>
          <div className="bg-white rounded-2xl shadow-sm p-6 border border-green-100 hover:shadow-md transition">
            <div className="bg-gradient-to-br from-green-500 to-emerald-600 text-white w-14 h-14 rounded-xl flex items-center justify-center mb-4 shadow-lg shadow-green-200">
              <UserCheck size={28} />
            </div>
            <p className="text-gray-500 text-sm mb-1">현재 근무 중</p>
            <p className="text-3xl font-bold text-gray-900">{summaryData.working}명</p>
          </div>
          <div className="bg-white rounded-2xl shadow-sm p-6 border border-yellow-100 hover:shadow-md transition">
            <div className="bg-gradient-to-br from-yellow-500 to-orange-500 text-white w-14 h-14 rounded-xl flex items-center justify-center mb-4 shadow-lg shadow-yellow-200">
              <Clock size={28} />
            </div>
            <p className="text-gray-500 text-sm mb-1">승인 대기</p>
            <p className="text-3xl font-bold text-gray-900">{summaryData.pending}명</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Today's Shifts */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-5 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-indigo-50">
              <h3 className="font-bold text-lg text-gray-800 flex items-center gap-2">
                📅 오늘의 근무 시프트
              </h3>
            </div>
            {shifts.length === 0 ? (
              <div className="p-12 text-center">
                <div className="text-4xl mb-3">📭</div>
                <p className="text-gray-500">오늘 예정된 시프트가 없습니다.</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {shifts.map((shift, index) => (
                  <div key={index} className="p-4 flex items-center gap-4 hover:bg-gray-50 transition">
                    <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center font-bold">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-800">{shift.name}</p>
                      <p className="text-sm text-gray-500">{shift.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Employees Status */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-5 border-b border-gray-100 bg-gradient-to-r from-green-50 to-emerald-50">
              <h3 className="font-bold text-lg text-gray-800 flex items-center gap-2">
                👥 전체 직원 현황
              </h3>
            </div>
            {employees.length === 0 ? (
              <div className="p-12 text-center">
                <div className="text-4xl mb-3">👤</div>
                <p className="text-gray-500">등록된 직원이 없습니다.</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100 max-h-96 overflow-y-auto">
                {employees.map((employee, index) => (
                  <div key={index} className="p-4 flex justify-between items-center hover:bg-gray-50 transition">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center font-bold text-gray-600">
                        {employee.name?.charAt(0) || '?'}
                      </div>
                      <div>
                        <p className="font-medium text-gray-800">{employee.name}</p>
                        {employee.status === 'pending' && (
                          <span className="text-xs text-yellow-600 bg-yellow-100 px-2 py-0.5 rounded-full">⏳ 승인 대기 중</span>
                        )}
                      </div>
                    </div>
                    {employee.status === 'pending' ? (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleApprove(employee.user_id)}
                          className="px-3 py-1.5 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition font-medium text-sm flex items-center gap-1"
                        >
                          <CheckCircle size={16} />
                          승인
                        </button>
                        <button
                          onClick={() => handleReject(employee.user_id)}
                          className="px-3 py-1.5 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition font-medium text-sm flex items-center gap-1"
                        >
                          <XCircle size={16} />
                          거절
                        </button>
                      </div>
                    ) : (
                      <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${
                        employee.isWorking 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        <span className={`w-2 h-2 rounded-full ${employee.isWorking ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`} />
                        <span className="text-sm font-medium">
                          {employee.isWorking ? '근무 중' : '퇴근'}
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
