// screenshare-app/src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Host from './Host';
import Viewer from './Viewer';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/host" element={<Host />} />
        <Route path="/viewer" element={<Viewer />} />
        <Route path="/" element={<div>Welcome to Screen Share</div>} />
      </Routes>
    </Router>
  );
}

export default App;
