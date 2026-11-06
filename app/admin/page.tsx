'use client'
import { useState, useEffect } from 'react'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://backend-2048.charchive-2048game.workers.dev'

export default function AdminPage() {
  const [scores, setScores] = useState<any[]>([])

  const fetchScores = async () => {
    try {
      const res = await fetch(`${API_URL}/api/scores`)
      const data = await res.json()
      setScores(data)
    } catch (e) {
      console.error(e)
    }
  }

  useEffect(() => {
    fetchScores()
  }, [])

  const handleDelete = async (id: number) => {
    if (!confirm('Bạn có muốn xóa kỷ lục này?')) return
    await fetch(`${API_URL}/api/scores/${id}`, { method: 'DELETE' })
    fetchScores()
  }

  return (
    <div className="max-w-4xl mx-auto p-6 min-h-screen bg-gray-50">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Trang Quản Lý Điểm Số (Admin)</h1>
        <a href="/" className="bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700">
          &larr; Về trang chơi Game
        </a>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-100 border-b text-gray-700">
              <th className="p-3">ID</th>
              <th className="p-3">Tên người chơi</th>
              <th className="p-3">Điểm số</th>
              <th className="p-3">Thời gian</th>
              <th className="p-3">Hành động</th>
            </tr>
          </thead>
          <tbody>
            {scores.map((item) => (
              <tr key={item.id} className="border-b hover:bg-gray-50">
                <td className="p-3 text-gray-500">{item.id}</td>
                <td className="p-3 font-semibold text-gray-800">{item.player_name}</td>
                <td className="p-3 text-amber-600 font-bold">{item.score}</td>
                <td className="p-3 text-gray-500 text-sm">{item.created_at}</td>
                <td className="p-3">
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600"
                  >
                    Xóa
                  </button>
                </td>
              </tr>
            ))}
            {scores.length === 0 && (
              <tr>
                <td colSpan={5} className="text-center p-6 text-gray-400">Chưa có dữ liệu điểm số.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}