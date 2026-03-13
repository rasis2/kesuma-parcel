const express = require('express')
const fs = require('fs')
const path = require('path')
const cors = require('cors')

const app = express()
const PORT = process.env.PORT || 3000
const DATA_FILE = path.join(__dirname, 'data.json')

// Middleware
app.use(cors())
app.use(express.json({ limit: '10mb' })) // large limit for base64 images
app.use(express.static(__dirname))        // serve frontend files

// ── Helpers ──────────────────────────────────────────
function readData() {
  return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'))
}

function writeData(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2))
}

// ── Routes ───────────────────────────────────────────

// POST /parcel — dispatcher adds a new parcel
app.post('/parcel', (req, res) => {
  try {
    const { unit, courier, image } = req.body
    if (!unit || !courier || !image) return res.status(400).json({ error: 'Missing fields' })

    const data = readData()
    const owner = data.owners.find(o => o.unit === unit)
    if (!owner) return res.status(404).json({ error: 'Unit not found' })

    if (!owner.parcels) owner.parcels = []

    const newParcel = {
      id: Date.now(),
      courier,
      image,
      status: 'Pending',
      createdAt: new Date().toISOString()
    }

    owner.parcels.push(newParcel)
    writeData(data)
    res.json({ success: true, parcel: newParcel })
  } catch (e) {
    console.error(e)
    res.status(500).json({ error: 'Server error' })
  }
})

// POST /owner/check — owner checks their parcels
app.post('/owner/check', (req, res) => {
  try {
    const { unit, email, phone } = req.body
    if (!unit) return res.status(400).json({ error: 'Unit required' })
    if (!email && !phone) return res.status(400).json({ error: 'Email or phone required' })

    const data = readData()
    const owner = data.owners.find(o => o.unit === unit)
    if (!owner) return res.status(404).json({ error: 'Unit not found' })

    // Verify identity — email OR phone match (case insensitive)
    const emailMatch = email && owner.email.toLowerCase() === email.toLowerCase()
    const phoneMatch = phone && owner.phone === phone
    if (!emailMatch && !phoneMatch) {
      return res.status(403).json({ error: 'Email or phone does not match' })
    }

    res.json({ unit: owner.unit, parcels: owner.parcels || [] })
  } catch (e) {
    console.error(e)
    res.status(500).json({ error: 'Server error' })
  }
})

// PUT /parcel/:id — owner marks parcel as done
app.put('/parcel/:id', (req, res) => {
  try {
    const id = parseInt(req.params.id)
    const data = readData()

    let found = false
    for (const owner of data.owners) {
      const parcel = (owner.parcels || []).find(p => p.id === id)
      if (parcel) {
        parcel.status = 'Done'
        parcel.collectedAt = new Date().toISOString()
        found = true
        break
      }
    }

    if (!found) return res.status(404).json({ error: 'Parcel not found' })
    writeData(data)
    res.json({ success: true })
  } catch (e) {
    console.error(e)
    res.status(500).json({ error: 'Server error' })
  }
})

// GET /admin — admin gets all owners with parcels
app.get('/admin', (req, res) => {
  try {
    const data = readData()
    const result = data.owners.map(o => ({
      unit: o.unit,
      email: o.email,
      phone: o.phone,
      parcels: o.parcels || []
    }))
    res.json(result)
  } catch (e) {
    console.error(e)
    res.status(500).json({ error: 'Server error' })
  }
})

// PUT /owner/:unit — admin updates owner email/phone
app.put('/owner/:unit', (req, res) => {
  try {
    const { unit } = req.params
    const { email, phone } = req.body

    const data = readData()
    const owner = data.owners.find(o => o.unit === unit)
    if (!owner) return res.status(404).json({ error: 'Unit not found' })

    if (email) owner.email = email
    if (phone) owner.phone = phone
    writeData(data)
    res.json({ success: true })
  } catch (e) {
    console.error(e)
    res.status(500).json({ error: 'Server error' })
  }
})

// ── Start ─────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`✅ Kesuma Parcel server running on port ${PORT}`)
})
