import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout.jsx'
import Board from './pages/Board.jsx'
import CreateParty from './pages/CreateParty.jsx'
import PartyDetail from './pages/PartyDetail.jsx'
import MyParty from './pages/MyParty.jsx'
import ContactSettings from './pages/ContactSettings.jsx'

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Board />} />
        <Route path="/create" element={<CreateParty />} />
        <Route path="/party/:id" element={<PartyDetail />} />
        <Route path="/party/:id/edit" element={<CreateParty />} />
        <Route path="/my" element={<MyParty />} />
        <Route path="/settings" element={<ContactSettings />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}
