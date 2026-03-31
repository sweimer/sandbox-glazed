import { MemoryRouter, Routes, Route } from 'react-router-dom';
import Home from './pages/Home.jsx';

export default function App() {
  return (
    <MemoryRouter>
      <Routes>
        <Route path="/" element={<Home />} />
      </Routes>
    </MemoryRouter>);

}