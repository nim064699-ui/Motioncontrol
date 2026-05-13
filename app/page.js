'use client'

import { useEffect, useState } from 'react'

const USERNAME = 'Juan12'
const PASSWORD = 'klingmotion'

const API_URL =
  'https://api.magnific.com/v1/ai/video/kling-v2-6-motion-control-std'

const STATUS_URL =
  'https://api.magnific.com/v1/ai/image-to-video/kling-v2-6'

export default function Page() {
  const [loggedIn, setLoggedIn] = useState(false)

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')

  const [apiKey, setApiKey] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [videoUrl, setVideoUrl] = useState('')
  const [prompt, setPrompt] = useState('')
  const [cfgScale, setCfgScale] = useState(0.5)

  const [loading, setLoading] = useState(false)
  const [resultVideo, setResultVideo] = useState('')
  const [history, setHistory] = useState([])

  useEffect(() => {
    const savedLogin = localStorage.getItem('loggedIn')
    const savedHistory = localStorage.getItem('history')

    if (savedLogin === 'true') {
      setLoggedIn(true)
    }

    if (savedHistory) {
      setHistory(JSON.parse(savedHistory))
    }
  }, [])

  const login = () => {
    if (username === USERNAME && password === PASSWORD) {
      localStorage.setItem('loggedIn', 'true')
      setLoggedIn(true)
    } else {
      alert('Username atau password salah')
    }
  }

  const logout = () => {
    localStorage.removeItem('loggedIn')
    setLoggedIn(false)
  }

  const saveHistory = (item) => {
    const updated = [item, ...history]
    setHistory(updated)
    localStorage.setItem('history', JSON.stringify(updated))
  }

  const generateVideo = async () => {
    try {
      setLoading(true)
      setResultVideo('')

      const res = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-magnific-api-key': apiKey
        },
        body: JSON.stringify({
          image_url: imageUrl,
          video_url: videoUrl,
          prompt,
          character_orientation: 'video',
          cfg_scale: Number(cfgScale)
        })
      })

      const data = await res.json()

      if (!data.task_id) {
        alert(JSON.stringify(data))
        setLoading(false)
        return
      }

      const taskId = data.task_id

      const interval = setInterval(async () => {
        const check = await fetch(`${STATUS_URL}/${taskId}`, {
          headers: {
            'x-magnific-api-key': apiKey
          }
        })

        const result = await check.json()

        const video =
          result.video_url ||
          result.output_url ||
          result.result_url

        if (video) {
          clearInterval(interval)

          setResultVideo(video)

          setLoading(false)

          saveHistory({
            prompt,
            imageUrl,
            videoUrl,
            resultVideo: video,
            createdAt: new Date().toLocaleString()
          })
        }
      }, 5000)
    } catch (err) {
      setLoading(false)
      alert(err.message)
    }
  }

  if (!loggedIn) {
    return (
      <main className="min-h-screen bg-black text-white flex items-center justify-center p-6">
        <div className="w-full max-w-sm bg-zinc-900 rounded-2xl p-6 space-y-4">
          <h1 className="text-2xl font-bold text-center text-yellow-400">
            Kling Motion Login
          </h1>

          <input
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full p-3 rounded-xl bg-zinc-800"
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-3 rounded-xl bg-zinc-800"
          />

          <button
            onClick={login}
            className="w-full p-3 rounded-xl bg-yellow-400 text-black font-bold"
          >
            Login
          </button>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-black text-white p-6">
      <div className="max-w-2xl mx-auto space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-yellow-400">
            Kling 2.6 Motion Control
          </h1>

          <button
            onClick={logout}
            className="bg-red-500 px-4 py-2 rounded-xl"
          >
            Logout
          </button>
        </div>

        <input
          placeholder="Magnific API Key"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          className="w-full p-3 rounded-xl bg-zinc-900"
        />

        <input
          placeholder="Image URL"
          value={imageUrl}
          onChange={(e) => setImageUrl(e.target.value)}
          className="w-full p-3 rounded-xl bg-zinc-900"
        />

        <input
          placeholder="Video URL"
          value={videoUrl}
          onChange={(e) => setVideoUrl(e.target.value)}
          className="w-full p-3 rounded-xl bg-zinc-900"
        />

        <textarea
          placeholder="Prompt"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          className="w-full p-3 rounded-xl bg-zinc-900 h-32"
        />

        <div>
          <p className="mb-2">CFG Scale: {cfgScale}</p>

          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={cfgScale}
            onChange={(e) => setCfgScale(Number(e.target.value))}
            className="w-full"
          />
        </div>

        <button
          onClick={generateVideo}
          disabled={loading}
          className="w-full p-4 rounded-xl bg-yellow-400 text-black font-bold"
        >
          {loading ? 'Generating...' : 'Generate Video'}
        </button>

        {resultVideo && (
          <div className="space-y-3">
            <video
              src={resultVideo}
              controls
              className="w-full rounded-2xl"
            />

            <a
              href={resultVideo}
              target="_blank"
              className="block text-center bg-zinc-800 p-3 rounded-xl"
            >
              Download Video
            </a>
          </div>
        )}

        <div className="space-y-3">
          <h2 className="text-2xl font-bold text-yellow-400">
            History Generate
          </h2>

          {history.map((item, index) => (
            <div
              key={index}
              className="bg-zinc-900 p-4 rounded-2xl space-y-2"
            >
              <p className="text-sm text-zinc-400">
                {item.createdAt}
              </p>

              <p>{item.prompt}</p>

              <video
                src={item.resultVideo}
                controls
                className="w-full rounded-xl"
              />
            </div>
          ))}
        </div>
      </div>
    </main>
  )
}
