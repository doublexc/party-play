// Phase 3-4: parties, members and contacts on Firestore (replaces the localStorage store).
import { useEffect, useState } from 'react'
import {
  collection, doc, getDoc, increment, onSnapshot, limit, orderBy, query,
  serverTimestamp, Timestamp, updateDoc, where, writeBatch,
} from 'firebase/firestore'
import { db } from './firebase.js'
import { pickShown } from './format.js'

const mapParty = (s) => {
  const d = s.data()
  return { ...d, id: s.id, datetime: d.datetime.toDate().toISOString() }
}
const partyRef = (id) => doc(db, 'parties', id)
const msgsCol = (id) => collection(db, 'parties', id, 'messages')
// System log line (join / leave / status). Rules only accept it together with the real change in the same batch.
const sysMsg = (batch, id, type, uid, name, extra = {}) =>
  batch.set(doc(msgsCol(id)), { type, uid, name, ...extra, createdAt: serverTimestamp() })

// ---------- reads (live) ----------
export function useParties() {
  const [state, setState] = useState({ list: null, error: null })
  useEffect(() => onSnapshot(
    query(collection(db, 'parties'), orderBy('datetime')),
    (s) => setState({ list: s.docs.map(mapParty), error: null }),
    (e) => { console.error(e); setState({ list: [], error: e.code || e.message }) }
  ), [])
  return state
}

// Board: only parties whose time is within the last 12h or later (the longest any party can stay visible).
// Single-field range + orderBy on `datetime`, so no composite index is needed.
export function useBoardParties() {
  const [state, setState] = useState({ list: null, error: null })
  useEffect(() => {
    const since = Timestamp.fromMillis(Date.now() - 12 * 36e5)
    return onSnapshot(
      query(collection(db, 'parties'), where('datetime', '>=', since), orderBy('datetime')),
      (s) => setState({ list: s.docs.map(mapParty), error: null }),
      (e) => { console.error(e); setState({ list: [], error: e.code || e.message }) }
    )
  }, [])
  return state
}

// party: undefined = loading, null = not found / no access
export function useParty(id, uid) {
  const [party, setParty] = useState(undefined)
  const [members, setMembers] = useState([])
  const [contacts, setContacts] = useState({})
  const isMember = members.some((m) => m.userId === uid)

  useEffect(() => {
    const u1 = onSnapshot(partyRef(id), (s) => setParty(s.exists() ? mapParty(s) : null), () => setParty(null))
    const u2 = onSnapshot(query(collection(db, 'parties', id, 'members'), orderBy('joinedAt')),
      (s) => setMembers(s.docs.map((d) => ({ userId: d.id, name: d.data().displayName }))),
      (e) => console.error(e))
    return () => { u1(); u2() }
  }, [id])

  // contacts only hold the fields each member chose to reveal; any signed-in user can read them
  useEffect(() => onSnapshot(collection(db, 'parties', id, 'contacts'),
    (s) => setContacts(Object.fromEntries(s.docs.map((d) => [d.id, d.data()]))),
    (e) => console.error(e)), [id])

  return { party, isMember, members: members.map((m) => ({ ...m, contact: contacts[m.userId] || {} })) }
}

// Parties I created + parties I joined (membership checked per party; fine for a small board)
export function useMyParties(uid) {
  const { list } = useParties()
  const [joinedIds, setJoinedIds] = useState(null)
  useEffect(() => {
    if (!list) return
    let off = false
    Promise.all(list.filter((p) => p.creatorId !== uid).map(async (p) =>
      (await getDoc(doc(db, 'parties', p.id, 'members', uid))).exists() ? p.id : null
    )).then((ids) => { if (!off) setJoinedIds(new Set(ids.filter(Boolean))) })
    return () => { off = true }
  }, [list, uid])
  if (!list || !joinedIds) return { loading: true, mine: [], joined: [] }
  return {
    loading: false,
    mine: list.filter((p) => p.creatorId === uid),
    joined: list.filter((p) => joinedIds.has(p.id)),
  }
}

// ---------- writes ----------
// Create = 4 writes in one batch (rules require member + contact docs and the rate-limit stamp)
export async function createParty(user, base, show) {
  const ref = doc(collection(db, 'parties')) // auto-ID: random 20 chars
  const batch = writeBatch(db)
  batch.set(ref, {
    creatorId: user.userId, creatorName: base.creatorName, title: base.title,
    datetime: Timestamp.fromDate(new Date(base.datetime)), description: base.description,
    maxPlayers: base.maxPlayers, status: 'PLANNING', memberCount: 1, createdAt: serverTimestamp(),
  })
  batch.set(doc(ref, 'members', user.userId), { displayName: base.creatorName, joinedAt: serverTimestamp() })
  batch.set(doc(ref, 'contacts', user.userId), pickShown(user, show))
  batch.update(doc(db, 'users', user.userId), { lastCreatedAt: serverTimestamp() })
  sysMsg(batch, ref.id, 'join', user.userId, base.creatorName)
  await batch.commit()
  return ref.id
}

export const editParty = (id, b) => updateDoc(partyRef(id), {
  title: b.title, datetime: Timestamp.fromDate(new Date(b.datetime)),
  description: b.description, maxPlayers: b.maxPlayers,
})

// party: { id, creatorId, creatorName } - the creator's status change is also logged in the chat
export async function setPartyStatus(party, status) {
  const batch = writeBatch(db)
  batch.update(partyRef(party.id), { status })
  sysMsg(batch, party.id, 'status', party.creatorId, party.creatorName, { status })
  await batch.commit()
}

export async function joinParty(id, user, show) {
  const ref = partyRef(id)
  const batch = writeBatch(db)
  batch.set(doc(ref, 'members', user.userId), { displayName: user.displayName, joinedAt: serverTimestamp() })
  batch.set(doc(ref, 'contacts', user.userId), pickShown(user, show))
  batch.update(ref, { memberCount: increment(1) })
  sysMsg(batch, id, 'join', user.userId, user.displayName)
  await batch.commit()
}

export async function leaveParty(id, uid, name) {
  const ref = partyRef(id)
  const batch = writeBatch(db)
  batch.delete(doc(ref, 'members', uid))
  batch.delete(doc(ref, 'contacts', uid))
  batch.update(ref, { memberCount: increment(-1) })
  sysMsg(batch, id, 'leave', uid, name)
  await batch.commit()
}

// ---------- chat log ----------
// Newest `n` lines, returned oldest -> newest. null = loading.
export function useMessages(id, n) {
  const [msgs, setMsgs] = useState(null)
  useEffect(() => onSnapshot(
    query(msgsCol(id), orderBy('createdAt', 'desc'), limit(n)),
    (s) => setMsgs(s.docs.map((d) => {
      const x = d.data({ serverTimestamps: 'estimate' })
      return { ...x, id: d.id, at: x.createdAt.toDate() }
    }).reverse()),
    (e) => { console.error(e); setMsgs([]) }
  ), [id, n])
  return msgs
}

// Chat line + rate-limit stamp on the user doc (rules allow 1 per 5 minutes per user)
export async function sendMessage(id, uid, name, text) {
  const batch = writeBatch(db)
  batch.set(doc(msgsCol(id)), { type: 'chat', uid, name, text, createdAt: serverTimestamp() })
  batch.update(doc(db, 'users', uid), { lastMessageAt: serverTimestamp() })
  await batch.commit()
}
