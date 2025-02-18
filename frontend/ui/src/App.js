import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Route, Routes, Link, Navigate } from 'react-router-dom';
import './App.css';
import CreateEvent from './pages/CreateEvent';
import ApproveEvent from './pages/ApproveEvent';
import ManageUsers from './pages/ManageUsers';
import Login from './Login';
import ViewEvents from './pages/ViewEvents';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem('token'));
  const [isManager, setIsManager] = useState(false);

  const fetchUserRole = () => {
    fetch('http://localhost:3001/user/role', {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    })
      .then(response => response.json())
      .then(data => {
        console.log('Fetched user role:', data);
        setIsManager(data.isManager);
      })
      .catch(error => console.error('Error fetching user role:', error));
  };

  useEffect(() => {
    if (isLoggedIn) {
      fetchUserRole();
    }
  }, [isLoggedIn]);

  const handleLogin = (token) => {
    localStorage.setItem('token', token);
    setIsLoggedIn(true);
    fetchUserRole();
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setIsLoggedIn(false);
    setIsManager(false);
  };

  return (
    <Router>
      <div className="App">
        <header className="App-header">
          <h1>SCIFC Events Registration</h1>
          <p>Your Event Management System</p>
          <nav>
            <Link to="/" className="nav-button">Home</Link>
            <Link to="/create" className="nav-button">Create Event</Link>
            {isManager && <Link to="/approve" className="nav-button">Approve Events</Link>}
            {isManager && <Link to="/manage-users" className="nav-button">Manage Users</Link>}
            {isLoggedIn ? <button onClick={handleLogout} className="nav-button">Logout</button> : <Link to="/login" className="nav-button">Login</Link>}
          </nav>
        </header>
        <main>
          <Routes>
            <Route path="/" element={isLoggedIn ? <ViewEvents isLoggedIn={isLoggedIn} /> : <Navigate to="/login" />} />
            <Route path="/create" element={isLoggedIn ? <CreateEvent /> : <Navigate to="/login" />} />
            <Route path="/approve" element={isManager ? <ApproveEvent /> : <Navigate to="/" />} />
            <Route path="/manage-users" element={isManager ? <ManageUsers /> : <Navigate to="/" />} />
            <Route path="/login" element={<Login onLogin={handleLogin} />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;