// ═══════════════════════════════════════
//  Supabase Config
// ═══════════════════════════════════════
const SUPABASE_URL = 'https://zoxrgkiuamxaxysmcgby.supabase.co'
const SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpveHJna2l1YW14YXh5c21jZ2J5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMzNDE1MTEsImV4cCI6MjA4ODkxNzUxMX0.E0x78HYdnLwm9qLbhxnaJNzXwurrRPp2xLALdNpJLCk'

const HEADERS = {
  'Content-Type': 'application/json',
  'apikey': SUPABASE_ANON,
  'Authorization': 'Bearer ' + SUPABASE_ANON
}

function sbFetch(path, options = {}) {
  return fetch(SUPABASE_URL + path, {
    ...options,
    headers: { ...HEADERS, ...(options.headers || {}) }
  })
}

// ═══════════════════════════════════════
//  Upload image to Supabase Storage
// ═══════════════════════════════════════
async function uploadImage(file) {
  const ext = (file.name || 'photo.jpg').split('.').pop() || 'jpg'
  const filename = Date.now() + '-' + Math.random().toString(36).slice(2) + '.' + ext

  const res = await fetch(
    SUPABASE_URL + '/storage/v1/object/parcel-images/' + filename,
    {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_ANON,
        'Authorization': 'Bearer ' + SUPABASE_ANON,
        'Content-Type': file.type || 'image/jpeg',
        'x-upsert': 'true'
      },
      body: file
    }
  )

  if (!res.ok) throw new Error('Image upload failed: ' + await res.text())
  return SUPABASE_URL + '/storage/v1/object/public/parcel-images/' + filename
}

// ═══════════════════════════════════════
//  API Functions
// ═══════════════════════════════════════

// Dispatcher: add new parcel (file = raw File object)
async function apiAddParcel({ unit, courier, file }) {
  const imageUrl = await uploadImage(file)

  const res = await sbFetch('/rest/v1/parcels', {
    method: 'POST',
    headers: { ...HEADERS, 'Prefer': 'return=representation' },
    body: JSON.stringify({ unit, courier, image_url: imageUrl, status: 'Pending' })
  })
  if (!res.ok) throw new Error(await res.text())
  return res.json()
}

// Owner: verify identity then fetch parcels
async function apiCheckOwner({ unit, email, phone }) {
  const ownerRes = await sbFetch('/rest/v1/owners?unit=eq.' + encodeURIComponent(unit) + '&select=unit,email,phone')
  const owners = await ownerRes.json()
  if (!owners.length) return { error: 'Unit not found' }

  const owner = owners[0]
  const emailMatch = email && owner.email.toLowerCase() === email.toLowerCase()
  const phoneMatch = phone && owner.phone === phone
  if (!emailMatch && !phoneMatch) return { error: 'Email or phone does not match' }

  const parcelsRes = await sbFetch('/rest/v1/parcels?unit=eq.' + encodeURIComponent(unit) + '&order=created_at.desc&select=*')
  const parcels = await parcelsRes.json()

  return {
    parcels: parcels.map(p => ({
      id: p.id, courier: p.courier, image: p.image_url,
      status: p.status, createdAt: p.created_at, collectedAt: p.collected_at
    }))
  }
}

// Owner: mark parcel as done
async function apiMarkDone(id) {
  const res = await sbFetch('/rest/v1/parcels?id=eq.' + id, {
    method: 'PATCH',
    headers: { ...HEADERS, 'Prefer': 'return=minimal' },
    body: JSON.stringify({ status: 'Done', collected_at: new Date().toISOString() })
  })
  if (!res.ok) throw new Error(await res.text())
  return true
}

// Admin: get all owners + their parcels
async function apiAdmin() {
  const [ownersRes, parcelsRes] = await Promise.all([
    sbFetch('/rest/v1/owners?select=unit,email,phone&order=unit.asc&limit=1000'),
    sbFetch('/rest/v1/parcels?select=*&order=created_at.desc&limit=10000')
  ])
  const owners = await ownersRes.json()
  const parcels = await parcelsRes.json()

  return owners.map(o => ({
    unit: o.unit, email: o.email, phone: o.phone,
    parcels: parcels
      .filter(p => p.unit === o.unit)
      .map(p => ({
        id: p.id, courier: p.courier, image: p.image_url,
        status: p.status, createdAt: p.created_at, collectedAt: p.collected_at
      }))
  }))
}

// Admin: update owner contact info
async function apiUpdateOwner(unit, { email, phone }) {
  const res = await sbFetch('/rest/v1/owners?unit=eq.' + encodeURIComponent(unit), {
    method: 'PATCH',
    headers: { ...HEADERS, 'Prefer': 'return=minimal' },
    body: JSON.stringify({ email, phone })
  })
  if (!res.ok) throw new Error(await res.text())
  return true
}
