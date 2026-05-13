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

    formData.append('file', file)

    const res = await fetch('/api/upload', {
      method: 'POST',
      body: formData
    })

    const data = await res.json()

    return data.url
  }

  const generateVideo = async () => {
    try {
      if (!imageFile) {
        alert('Upload image dulu')
        return
      }

      if (!videoFile) {
        alert('Upload video dulu')
        return
      }

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
          cfg_scale: Number(cfgScale)
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
      <div
        style={{
          minHeight: '100vh',
          background: '#060b16',
          color: 'white',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          padding: 20
        }}
      >
        <div
          style={{
            width: '100%',
            maxWidth: 400,
            background: '#111827',
            padding: 25,
            borderRadius: 20
          }}
        >
          <h1>Kling Motion Login</h1>

          <input
            placeholder='Username'
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            style={inputStyle}
          />

          <input
            type='password'
            placeholder='Password'
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={inputStyle}
          />

          <button
            onClick={handleLogin}
            style={buttonStyle}
          >
            Login
          </button>
        </div>
      </div>
    )
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#060b16',
        color: 'white',
        padding: 20
      }}
    >
      <div
        style={{
          maxWidth: 700,
          margin: '0 auto'
        }}
      >
        <div
          style={{
            background: '#111827',
            borderRadius: 20,
            padding: 20,
            marginBottom: 20
          }}
        >
          <h1
            style={{
              fontSize: 40,
              marginBottom: 10
            }}
          >
            Kling 2.6 Motion Control
          </h1>

          <button
            onClick={logout}
            style={logoutStyle}
          >
            Logout
          </button>
        </div>

        <div
          style={{
            background: '#111827',
            borderRadius: 20,
            padding: 20
          }}
        >
          <input
            placeholder='Magnific API Key'
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            style={inputStyle}
          />

          <div style={{ marginTop: 20 }}>
            <p>Upload Image</p>

            <input
              type='file'
              accept='image/*'
              onChange={(e) => {
                const file = e.target.files[0]

                setImageFile(file)

                setImagePreview(URL.createObjectURL(file))
              }}
            />
          </div>

          {imagePreview && (
            <img
              src={imagePreview}
              style={{
                width: '100%',
                borderRadius: 20,
                marginTop: 20
              }}
            />
          )}

          <div style={{ marginTop: 20 }}>
            <p>Upload Motion Video</p>

            <input
              type='file'
              accept='video/*'
              onChange={(e) => {
                const file = e.target.files[0]

                setVideoFile(file)
              }}
            />
          </div>

          <textarea
            placeholder='Prompt Motion'
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            style={textareaStyle}
          />

          <div style={{ marginTop: 20 }}>
            <h3>CFG Scale: {cfgScale}</h3>

            <input
              type='range'
              min='0'
              max='1'
              step='0.1'
              value={cfgScale}
              onChange={(e) => setCfgScale(e.target.value)}
              style={{ width: '100%' }}
            />
          </div>

          <button
            onClick={generateVideo}
            disabled={loading}
            style={buttonStyle}
          >
            {loading ? status : 'Generate Video'}
          </button>
        </div>

        {resultVideo && (
          <div
            style={{
              background: '#111827',
              borderRadius: 20,
              padding: 20,
              marginTop: 20
            }}
          >
            <h2>Result Video</h2>

            <video
              src={resultVideo}
              controls
              style={{
                width: '100%',
                borderRadius: 20
              }}
            />
          </div>
        )}

        <div
          style={{
            background: '#111827',
            borderRadius: 20,
            padding: 20,
            marginTop: 20
          }}
        >
          <h1>History Generate</h1>

          {history.map((item, index) => (
            <div
              key={index}
              style={{
                marginTop: 20
              }}
            >
              <video
                src={item.video}
                controls
                style={{
                  width: '100%',
                  borderRadius: 20
                }}
              />

              <p>{item.prompt}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

const inputStyle = {
  width: '100%',
  padding: 15,
  marginTop: 10,
  background: '#1f2937',
  border: '1px solid #374151',
  borderRadius: 12,
  color: 'white'
}

const textareaStyle = {
  width: '100%',
  height: 120,
  marginTop: 20,
  padding: 15,
  background: '#1f2937',
  border: '1px solid #374151',
  borderRadius: 12,
  color: 'white'
}

const buttonStyle = {
  width: '100%',
  padding: 15,
  marginTop: 20,
  border: 'none',
  borderRadius: 12,
  background: '#2563eb',
  color: 'white',
  fontWeight: 'bold',
  cursor: 'pointer'
}

const logoutStyle = {
  padding: '10px 20px',
  border: 'none',
  borderRadius: 12,
  background: '#dc2626',
  color: 'white',
  cursor: 'pointer'
      }
