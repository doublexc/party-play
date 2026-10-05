// Phase 1: user kept in localStorage. Phase 2 replaces this with Firebase Anonymous Auth.
const KEY = 'pp_user'

export const getUser = () => {
  try { return JSON.parse(localStorage.getItem(KEY)) } catch { return null }
}

export const saveUser = (data) => {
  const old = getUser()
  const user = { ...old, ...data, userId: old?.userId || 'u_' + crypto.randomUUID().slice(0, 8) }
  localStorage.setItem(KEY, JSON.stringify(user))
  return user
}
