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
  const [videoPreview, setVideoPreview] = useState('')

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

    localStorage.setItem(
      'history',
      JSON.stringify(updated)
    )
  }

  const handleLogin = () => {
    if (
      username === USERNAME &&
      password === PASSWORD
    ) {
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

  const uploadFile = async (file) => {
    const formData = new FormData()

    formData.append('file', file)

    const res = await fetch('/api/upload', {
      method: 'POST',
      body: formData
    })

    const data = await res.json()

    if (data.error) {
      throw new Error(data.error)
    }

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

      const imageUrl = await uploadFile(
        imageFile
      )

      setStatus('Uploading video...')

      const videoUrl = await uploadFile(
        videoFile
      )

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

        await new Promise((r) =>
          setTimeout(r, 5000)
        )

        const check = await fetch(
          `${STATUS_URL}/${taskId}`,
          {
            headers: {
              Authorization: `Bearer ${apiKey}`
            }
          }
        )

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
      <div style={loginWrap}>
        <div style={loginBox}>
          <h1>MOTION CONTROL SA AYANA</h1>

          <input
            placeholder='Username'
            value={username}
            onChange={(e) =>
              setUsername(e.target.value)
            }
            style={inputStyle}
          />

          <input
            type='password'
            placeholder='Password'
            value={password}
            onChange={(e) =>
              setPassword(e.target.value)
            }
            style={inputStyle}
          />

          <button
            onClick={handleLogin}
            style={buttonStyle}
          >
            LOGIN
          </button>
        </div>
      </div>
    )
  }

  return (
    <div style={mainStyle}>
      <div style={container}>
        <div style={card}>
          <h1 style={title}>
            MOTION CONTROL SA AYANA
          </h1>

          <button
            onClick={logout}
            style={logoutStyle}
          >
            Logout
          </button>

          <input
            placeholder='Magnific API Key'
            value={apiKey}
            onChange={(e) =>
              setApiKey(e.target.value)
            }
            style={inputStyle}
          />

          <div style={previewWrap}>
            <div style={previewBox}>
              <p>Reference Image</p>

              <input
                type='file'
                accept='image/*'
                onChange={(e) => {
                  const file =
                    e.target.files[0]

                  setImageFile(file)

                  setImagePreview(
                    URL.createObjectURL(file)
                  )
                }}
              />

              {imagePreview && (
                <img
                  src={imagePreview}
                  style={previewImage}
                />
              )}
            </div>

            <div style={previewBox}>
              <p>Reference Motion</p>

              <input
                type='file'
                accept='video/*'
                onChange={(e) => {
                  const file =
                    e.target.files[0]

                  setVideoFile(file)

                  setVideoPreview(
                    URL.createObjectURL(file)
                  )
                }}
              />

              {videoPreview && (
                <video
                  src={videoPreview}
                  controls
                  style={previewImage}
                />
              )}
            </div>
          </div>

          <textarea
            placeholder='Prompt Motion'
            value={prompt}
            onChange={(e) =>
              setPrompt(e.target.value)
            }
            style={textareaStyle}
          />

          <h3>
            CFG Scale: {cfgScale}
          </h3>

          <input
            type='range'
            min='0'
            max='1'
            step='0.1'
            value={cfgScale}
            onChange={(e) =>
              setCfgScale(e.target.value)
            }
            style={{ width: '100%' }}
          />

          <button
            onClick={generateVideo}
            disabled={loading}
            style={buttonStyle}
          >
            {loading
              ? status
              : 'Generate Video'}
          </button>
        </div>

        {resultVideo && (
          <div style={card}>
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

        <div style={card}>
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

const loginWrap = {
  minHeight: '100vh',
  background: '#020617',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  padding: 20
}

const loginBox = {
  width: '100%',
  maxWidth: 400,
  background: '#0f172a',
  padding: 25,
  borderRadius: 25,
  color: 'white'
}

const mainStyle = {
  minHeight: '100vh',
  background: '#020617',
  padding: 20,
  color: 'white'
}

const container = {
  maxWidth: 900,
  margin: '0 auto'
}

const card = {
  background: '#0f172a',
  padding: 20,
  borderRadius: 25,
  marginBottom: 20
}

const title = {
  fontSize: 38,
  marginBottom: 10
}

const inputStyle = {
  width: '100%',
  padding: 15,
  marginTop: 15,
  borderRadius: 15,
  border: '1px solid #334155',
  background: '#1e293b',
  color: 'white'
}

const textareaStyle = {
  width: '100%',
  height: 120,
  marginTop: 20,
  borderRadius: 15,
  border: '1px solid #334155',
  background: '#1e293b',
  color: 'white',
  padding: 15
}

const buttonStyle = {
  width: '100%',
  padding: 15,
  marginTop: 20,
  border: 'none',
  borderRadius: 15,
  background: '#2563eb',
  color: 'white',
  fontWeight: 'bold',
  cursor: 'pointer'
}

const logoutStyle = {
  padding: '10px 20px',
  borderRadius: 15,
  border: 'none',
  background: '#dc2626',
  color: 'white',
  marginBottom: 20
}

const previewWrap = {
  display: 'flex',
  gap: 15,
  marginTop: 20
}

const previewBox = {
  flex: 1
}

const previewImage = {
  width: '100%',
  height: 250,
  objectFit: 'cover',
  borderRadius: 20,
  marginTop: 10
              }
