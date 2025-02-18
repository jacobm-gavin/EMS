import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Route, Routes, Link, Navigate } from 'react-router-dom';
import './App.css';
import CreateEvent from './pages/CreateEvent';
import ApproveEvent from './pages/ApproveEvent';
import ManageUsers from './pages/ManageUsers';
import Login from './Login';

function App() {
  const [events, setEvents] = useState([]);
  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem('token'));
  const [isManager, setIsManager] = useState(false);

  const fetchEvents = () => {
    fetch('http://localhost:3001/events/', {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    })
      .then(response => response.json())
      .then(data => {
        console.log('Fetched events:', data);
        if (Array.isArray(data)) {
          const currentDate = new Date();
          const filteredAndSortedEvents = data
            .filter(event => new Date(event.date) >= currentDate) // Filter out past events
            .sort((a, b) => new Date(a.date) - new Date(b.date)); // Sort by date
          setEvents(filteredAndSortedEvents);
        } else {
          console.error('Expected an array but got:', data);
        }
      })
      .catch(error => console.error('Error fetching events:', error));
  };

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
      fetchEvents();
      fetchUserRole();
      const interval = setInterval(fetchEvents, 5000); // Fetch events every 5 seconds
      return () => clearInterval(interval); // Cleanup interval on component unmount
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
            <Link to="/">Home</Link> | <Link to="/create">Create Event</Link> | 
            {isManager && <Link to="/approve">Approve Events</Link>} | 
            {isManager && <Link to="/manage-users">Manage Users</Link>} | {/* Add the new tab */}
            {isLoggedIn ? <button onClick={handleLogout}>Logout</button> : <Link to="/login">Login</Link>}
          </nav>
        </header>
        <main>
          <Routes>
            <Route path="/" element={
              isLoggedIn ? (
                <>
                  <h2>Upcoming Events</h2>
                  <table>
                    <thead>
                      <tr>
                        <th>Event Name</th>
                        <th>Date</th>
                        <th>Time</th>
                        <th>Location</th>
                        <th>Organization</th>
                        <th>Notes</th>
                        <th>Approved</th>
                        <th>Created By</th>
                      </tr>
                    </thead>
                    <tbody>
                      {events.map(event => (
                        <tr key={event.id}>
                          <td>{event.eventName}</td>
                          <td>{event.date}</td>
                          <td>{event.time}</td>
                          <td>{event.location}</td>
                          <td>{event.organization}</td>
                          <td>{event.notes}</td>
                          <td>{event.approved ? 'Yes' : 'No'}</td>
                          <td>{event.created_by}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </>
              ) : (
                <Navigate to="/login" />
              )
            } />
            <Route path="/create" element={isLoggedIn ? <CreateEvent /> : <Navigate to="/login" />} />
            <Route path="/approve" element={isManager ? <ApproveEvent /> : <Navigate to="/" />} />
            <Route path="/manage-users" element={isManager ? <ManageUsers /> : <Navigate to="/" />} /> {/* Add the new route */}
            <Route path="/login" element={<Login onLogin={handleLogin} />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;