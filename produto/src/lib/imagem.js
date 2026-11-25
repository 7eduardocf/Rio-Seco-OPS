// diminui a foto senao estoura o localStorage
export async function comprimirImagem(arquivo, ladoMax = 720, qualidade = 0.62) {
  if (!arquivo || !arquivo.type?.startsWith('image/')) throw new Error('Escolha um arquivo de imagem (JPG ou PNG).')
  const url = URL.createObjectURL(arquivo)
  try {
    const img = await new Promise((ok, erro) => {
      const i = new Image()
      i.onload = () => ok(i)
      i.onerror = () => erro(new Error('Não foi possível abrir essa imagem. Tente outra foto.'))
      i.src = url
    })
    const escala = Math.min(1, ladoMax / Math.max(img.naturalWidth, img.naturalHeight))
    const canvas = document.createElement('canvas')
    canvas.width = Math.round(img.naturalWidth * escala)
    canvas.height = Math.round(img.naturalHeight * escala)
    canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height)
    return canvas.toDataURL('image/jpeg', qualidade)
  } finally {
    URL.revokeObjectURL(url)
  }
}
