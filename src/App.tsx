import { BrowserRouter, Routes, Route } from 'react-router-dom'
import HomePage from './components/home/HomePage'
import ContactPage from './components/contacts/ContactPage'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/contacts" element={<ContactPage />} />
      </Routes>
    </BrowserRouter>
  )
}
