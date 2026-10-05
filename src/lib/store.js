// Phase 1: fake database in localStorage. Phase 3-4 replace this with Firestore.
const KEY = 'pp_parties'
const hr = (h) => new Date(Date.now() + h * 36e5).toISOString()

const seed = () => [
  { id: 'a8F29Kx2Qm', creatorId: 'u_demo1', creatorName: 'ABC', title: 'เล่นเกม Monster Hunter',
    datetime: hr(2), description: 'เล่นกันประมาณ 2 ชั่วโมง', maxPlayers: 5, status: 'PLANNING',
    members: [
      { userId: 'u_demo1', name: 'ABC', contact: { email: 'abc@example.com' } },
      { userId: 'u_demo2', name: 'Player01', contact: { email: 'p1@example.com', social1: 'Discord: player01' } },
      { userId: 'u_demo3', name: 'Player02', contact: {} },
    ] },
  { id: 'Zq81LmT0Vd', creatorId: 'u_demo2', creatorName: 'Player01', title: 'ดูหนังวันเสาร์',
    datetime: hr(30), description: '', maxPlayers: 4, status: 'PLANNING',
    members: [{ userId: 'u_demo2', name: 'Player01', contact: { email: 'p1@example.com' } }] },
  { id: 'Kp37Wn5Rhx', creatorId: 'u_demo3', creatorName: 'Player02', title: 'ทำโปรเจกต์กลุ่ม',
    datetime: hr(-1), description: 'นั่งทำงานด้วยกันออนไลน์', maxPlayers: 3, status: 'PLAYING',
    members: [{ userId: 'u_demo3', name: 'Player02', contact: {} }] },
]

export const saveParties = (list) => localStorage.setItem(KEY, JSON.stringify(list))

export const loadParties = () => {
  try {
    const d = JSON.parse(localStorage.getItem(KEY))
    if (Array.isArray(d)) return d
  } catch { /* fall through to seed */ }
  const s = seed()
  saveParties(s)
  return s
}

export const getParty = (id) => loadParties().find((p) => p.id === id) || null

export const addParty = (data) => {
  const party = { ...data, id: crypto.randomUUID().replace(/-/g, '').slice(0, 10), createdAt: new Date().toISOString() }
  saveParties([...loadParties(), party])
  return party
}

// update by function: updateParty(id, (p) => ({ ...p, status: 'PLAYING' }))
export const updateParty = (id, fn) =>
  saveParties(loadParties().map((p) => (p.id === id ? fn(p) : p)))
