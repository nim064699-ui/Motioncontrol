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

  const [imageFile, setImageFile] = useState(null)
  const [videoFile, setVideoFile] = useState(null)

  const [imagePreview, setImagePreview] = useState('')
  const [prompt, setPrompt] = useState('')

  const [cfgScale, setCfgScale] = useState(0.5)

  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState('')

  const [resultVideo, setResultVideo] = useState('')

  const [history, setHistory] = useState([])

  useEffect(() => {
    const login = localStorage.getItem('login')

    if (login === 'true') {
      setLoggedIn(true)
    }

    const savedHistory = localStorage.getItem('history')

    if (savedHistory) {
      setHistory(JSON.parse(savedHistory))
    }
  }, [])

  const saveHistory = (item) => {
    const updated = [item, ...history]

    setHistory(updated)

    localStorage.setItem('history', JSON.stringify(updated))
  }

  const handleLogin = () => {
    if (username === USERNAME && password === PASSWORD) {
      localStorage.setItem('login', 'true')
      setLoggedIn(true)
    } else {
      alert('Username atau password salah')
    }
  }

  const logout = () => {
    localStorage.removeItem('login')
    setLoggedIn(false)
  }

  const uploadToCatbox = async (file) => {
    const formData = new FormData()

    formData.append('reqtype', 'fileupload')
    formData.append('fileToUpload', file)

    const res = await fetch('https://catbox.moe/user/api.php', {
      method: 'POST',
      body: formData
    })

    return await res.text()
  }

  const generateVideo = async () => {
    try {
      setLoading(true)
      setStatus('Uploading image...')

      const imageUrl = await uploadToCatbox(imageFile)

      setStatus('Uploading video...')

      const videoUrl = await uploadToCatbox(videoFile)

      setStatus('Generating video...')

      const res = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          image_url: imageUrl,
          video_url: videoUrl,
          prompt,
          cfg_scale: cfgScale
        })
      })

      const data = await res.json()

      const taskId = data.task_id

      if (!taskId) {
        alert(JSON.stringify(data))
        return
      }

      let finalVideo = ''

      while (!finalVideo) {
        setStatus('Waiting result...')

        await new Promise((r) => setTimeout(r, 5000))

        const check = await fetch(`${STATUS_URL}/${taskId}`, {
          headers: {
            Authorization: `Bearer ${apiKey}`
          }
        })

        const result = await check.json()

        finalVideo =
          result.video_url ||
          result.output_url ||
          result.result_url ||
          ''

        if (finalVideo) {
          setResultVideo(finalVideo)

          saveHistory({
            video: finalVideo,
            prompt
          })
        }
      }
    } catch (err) {
      alert(err.message)
    } finally {
      setLoading(false)
      setStatus('')
    }
  }

  if (!loggedIn) {
    return (
      <div style={{ padding: 20 }}>
        <h1>Login Kling Motion</h1>

        <input
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />

        <br />
        <br />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <br />
        <br />

        <button onClick={handleLogin}>Login</button>
      </div>
    )
  }

  return (
    <div style={{ padding: 20 }}>
      <h1>Kling 2.6 Motion Control</h1>

      <button onClick={logout}>Logout</button>

      <br />
      <br />

      <input
        placeholder="Magnific API Key"
        value={apiKey}
        onChange={(e) => setApiKey(e.target.value)}
        style={{ width: '100%' }}
      />

      <br />
      <br />

      <input
        type="file"
        accept="image/*"
        onChange={(e) => {
          const file = e.target.files[0]

          setImageFile(file)

          setImagePreview(URL.createObjectURL(file))
        }}
      />

      <br />
      <br />

      {imagePreview && (
        <img
          src={imagePreview}
          width="200"
        />
      )}

      <br />
      <br />

      <input
        type="file"
        accept="video/*"
        onChange={(e) => {
          const file = e.target.files[0]

          setVideoFile(file)
        }}
      />

      <br />
      <br />

      <textarea
        placeholder="Prompt"
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        style={{
          width: '100%',
          height: 100
        }}
      />

      <br />
      <br />

      <h3>CFG Scale: {cfgScale}</h3>

      <input
        type="range"
        min="0"
        max="1"
        step="0.1"
        value={cfgScale}
        onChange={(e) => setCfgScale(e.target.value)}
      />

      <br />
      <br />

      <button
        onClick={generateVideo}
        disabled={loading}
      >
        {loading ? status : 'Generate Video'}
      </button>

      <br />
      <br />

      {resultVideo && (
        <video
          src={resultVideo}
          controls
          width="100%"
        />
      )}

      <h1>History Generate</h1>

      {history.map((item, index) => (
        <div
          key={index}
          style={{
            marginBottom: 30
          }}
        >
          <video
            src={item.video}
            controls
            width="100%"
          />

          <p>{item.prompt}</p>
        </div>
      ))}
    </div>
  )
      }
