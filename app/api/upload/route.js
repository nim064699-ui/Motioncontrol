export async function POST(req) {
  try {
    const data = await req.formData()

    const file = data.get('file')

    const formData = new FormData()

    formData.append('reqtype', 'fileupload')

    formData.append('fileToUpload', file)

    const res = await fetch(
      'https://catbox.moe/user/api.php',
      {
        method: 'POST',
        body: formData
      }
    )

    const url = await res.text()

    return Response.json({
      url
    })
  } catch (err) {
    return Response.json({
      error: err.message
    })
  }
}
