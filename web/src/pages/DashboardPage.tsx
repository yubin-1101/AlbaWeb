import React, { useState, useEffect } from 'react'
import { Clock, Calendar, TrendingUp } from 'lucide-react'

export default function DashboardPage() {
  const [stats, setStats] = useState({
    todayHours: 0,
    thisMonthHours: 0,
    thisMonthSalary: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadStats()
  }, [])

  const loadStats = async () => {
    try {
      // 임시 데이터
      setStats({
        todayHours: 8,
        thisMonthHours: 120,
        thisMonthSalary: 1200000,
      })
    } catch (error) {
      console.error('데이터 로드 실패:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="p-8">
        <div className="text-xl text-gray-700">로딩 중...</div>
      </div>
    )
  }

  return (
    <div className="p-8">
      <h2 className="text-3xl font-bold mb-8">대시보드</h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <StatCard
          icon={Clock}
          title="오늘 근무 시간"
          value={`${stats.todayHours}시간`}
          color="blue"
        />
        <StatCard
          icon={Calendar}
          title="이달 근무 시간"
          value={`${stats.thisMonthHours}시간`}
          color="green"
        />
        <StatCard
          icon={TrendingUp}
          title="이달 예상 급여"
          value={`₩${stats.thisMonthSalary.toLocaleString()}`}
          color="purple"
        />
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-xl font-bold mb-4">최근 근무 기록</h3>
        <div className="text-gray-500">
          <p>근무 기록이 없습니다.</p>
        </div>
      </div>
    </div>
  )
}

function StatCard({ 
  icon: Icon, 
  title, 
  value, 
  color 
}: { 
  icon: any; 
  title: string; 
  value: string; 
  color: string 
}) {
  const colorClass: { [key: string]: string } = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    purple: 'bg-purple-50 text-purple-600',
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className={`${colorClass[color]} w-12 h-12 rounded-lg flex items-center justify-center mb-4`}>
        <Icon size={24} />
      </div>
      <p className="text-gray-600 text-sm mb-1">{title}</p>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
    </div>
  )
}
