import { BrowserRouter, Routes, Route } from 'react-router-dom'
import HomePage from './components/home/HomePage'
import ContactPage from './components/contacts/ContactPage'
import ProjectsPage from './components/projects/ProjectsPage'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/contacts" element={<ContactPage />} />
        <Route path="/projects" element={<ProjectsPage />} />
      </Routes>
    </BrowserRouter>
  )
}
