'use client'

import { useState, useEffect } from 'react'
import { Card, CardBody, CardHeader } from '../ui/Card'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import Link from 'next/link'

interface TimelineItem {
  id: string
  title: string
  date: string
  type: string
  year: number
}

export default function TimelineClient() {
  const [timeline, setTimeline] = useState<Record<number, TimelineItem[]>>({})
  const [loading, setLoading] = useState(true)
  const [selectedYear, setSelectedYear] = useState<number | null>(null)

  useEffect(() => {
    fetchTimeline()
  }, [])

  const fetchTimeline = async () => {
    try {
      const res = await fetch('/api/timeline')
      if (res.ok) {
        const data = await res.json()
        setTimeline(data.timeline || {})
      }
    } catch (error) {
      console.error('Failed to fetch timeline:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
        <p className="text-gray-600 mt-4">Loading timeline...</p>
      </div>
    )
  }

  const years = Object.keys(timeline).map(Number).sort((a, b) => a - b)

  if (years.length === 0) {
    return (
      <Card className="text-center py-16">
        <CardBody>
          <div className="text-6xl mb-4">📅</div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">No timeline data yet</h3>
          <p className="text-gray-600">Add sources to see your research timeline</p>
        </CardBody>
      </Card>
    )
  }

  const chartData = years.map(year => ({
    year,
    count: timeline[year].length,
    label: year.toString()
  }))

  return (
    <div className="space-y-8">
      <Card className="shadow-lg">
        <CardHeader>
          <h2 className="text-2xl font-bold text-gray-900">Sources Over Time</h2>
        </CardHeader>
        <CardBody>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData} onClick={(data) => data && setSelectedYear(data.activeLabel ? Number(data.activeLabel) : null)}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="label" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#4f46e5" cursor="pointer" />
            </BarChart>
          </ResponsiveContainer>
        </CardBody>
      </Card>

      {years.map(year => (
        <Card key={year} className={`shadow-lg ${selectedYear === year ? 'ring-2 ring-indigo-500' : ''}`}>
          <CardHeader>
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-bold text-gray-900">{year}</h3>
              <span className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm font-semibold">
                {timeline[year].length} sources
              </span>
            </div>
          </CardHeader>
          <CardBody>
            <div className="space-y-3">
              {timeline[year].map(item => (
                <Link key={item.id} href={`/source/${item.id}`}>
                  <div className="p-4 bg-gray-50 rounded-lg hover:bg-indigo-50 transition-colors cursor-pointer border border-gray-200 hover:border-indigo-300">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900 mb-1">{item.title}</h4>
                        <p className="text-sm text-gray-600 capitalize">{item.type}</p>
                      </div>
                      <span className="text-xs text-gray-500">
                        {new Date(item.date).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </CardBody>
        </Card>
      ))}
    </div>
  )
}
