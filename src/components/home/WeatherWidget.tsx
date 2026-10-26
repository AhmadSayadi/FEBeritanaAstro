'use client'

import { useState, useEffect } from 'react'

interface WeatherData {
  temp: number
  description: string
  icon: string
  city: string
}

export function WeatherWidget() {
  const [weather, setWeather] = useState<WeatherData | null>(null)

  useEffect(() => {
    // Try to get weather from a free API (wttr.in — no key needed)
    fetch('https://wttr.in/Jakarta?format=j1')
      .then(res => res.json())
      .then(data => {
        const current = data?.current_condition?.[0]
        if (current) {
          setWeather({
            temp: parseInt(current.temp_C),
            description: current.weatherDesc?.[0]?.value || '',
            icon: getWeatherEmoji(parseInt(current.weatherCode)),
            city: 'Jakarta',
          })
        }
      })
      .catch(() => {})
  }, [])

  if (!weather) return null

  return (
    <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
      <span>{weather.icon}</span>
      <span>{weather.temp}°C</span>
      <span className="hidden sm:inline">{weather.city}</span>
    </div>
  )
}

function getWeatherEmoji(code: number): string {
  if (code === 113) return '☀️'
  if (code === 116) return '⛅'
  if (code === 119 || code === 122) return '☁️'
  if (code >= 176 && code <= 299) return '🌧️'
  if (code >= 300 && code <= 399) return '⛈️'
  if (code >= 600) return '🌫️'
  return '🌤️'
}
