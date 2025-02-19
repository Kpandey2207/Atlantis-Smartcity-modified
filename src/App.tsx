import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Landing from './components/Landing';
import Home from './components/Home/Home';
import Announcement from './components/Announcement';
import Emergency from './components/Emergency/Emergency';
import Events from './components/Events';
import Transportation from './components/Transportations/Transportation';
import Chatbot from './components/Chatbot';

function App() {
  return (
    <Router>
      <Chatbot />
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/home" element={<Home />} />
        <Route path="/announcements" element={<Announcement />} />
        <Route path="/emergency" element={<Emergency />} />
        <Route path="/events" element={<Events />} />
        <Route path="/transport" element={<Transportation />} />
      </Routes>
    </Router>
  );
}

export default App;