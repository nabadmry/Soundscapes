export async function generateRecipe(query) {
  const r = await fetch('http://localhost:8000/api/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query })
  })
  if (!r.ok) throw new Error('API error')
  const data = await r.json()
  return data.recipe
}

export async function fetchTags() {
  const r = await fetch('http://localhost:8000/api/tags')
  const data = await r.json()
  return data.available
}
