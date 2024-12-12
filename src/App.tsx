import React from 'react';
import { HashRouter as Router, Routes, Route, Link } from 'react-router-dom';
import SignUpHistory from './components/SignUpHistory';

const App: React.FC = () => {
  return (
    <Router>
      <div className="container">
        {/* 现有的 HTML 内容 */}
        
        <div className="nav-menu">
          <Link to="/signup-history" className="nav-item">
            <i className="icon-history"></i>
            报名历史
          </Link>
        </div>

        <Routes>
          <Route path="/signup-history" element={<SignUpHistory />} />
        </Routes>
      </div>
    </Router>
  );
};

export default App; 