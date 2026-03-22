function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new window.Image()
    img.onload = () => { URL.revokeObjectURL(url); resolve(img) }
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Failed to load image')) }
    img.src = url
  })
}

function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(blob => {
      if (blob) resolve(blob)
      else reject(new Error('Canvas export failed'))
    }, type, quality)
  })
}

/** Resize + center-crop to 400×400 JPEG at 85% quality. Max raw input: 5 MB. */
export async function processAvatar(file: File): Promise<File> {
  if (!file.type.startsWith('image/')) throw new Error('File must be an image')
  if (file.size > 5 * 1024 * 1024) throw new Error('Image must be under 5 MB')

  const img = await loadImage(file)
  const canvas = document.createElement('canvas')
  canvas.width = 400
  canvas.height = 400
  const ctx = canvas.getContext('2d')!

  // Center-crop: take the largest square from the center
  const size = Math.min(img.naturalWidth, img.naturalHeight)
  const sx = (img.naturalWidth - size) / 2
  const sy = (img.naturalHeight - size) / 2
  ctx.drawImage(img, sx, sy, size, size, 0, 0, 400, 400)

  const blob = await canvasToBlob(canvas, 'image/jpeg', 0.85)
  return new File([blob], 'avatar.jpg', { type: 'image/jpeg' })
}
