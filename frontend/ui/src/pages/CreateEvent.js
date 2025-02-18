import React, { useState } from 'react';
import './CreateEvent.css';
import { jwtDecode } from 'jwt-decode';

function CreateEvent() {
  const [eventName, setEventName] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [location, setLocation] = useState('');
  const [organization, setOrganization] = useState('');
  const [notes, setNotes] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    const decodedToken = jwtDecode(token);
    const created_by = decodedToken.username;
    console.log(token);
    console.log(decodedToken);
    console.log(created_by);

    const newEvent = {
      eventName,
      date,
      time,
      location,
      organization,
      notes,
      created_by,
    };

    // Send newEvent to the backend
    fetch('http://localhost:3001/events/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(newEvent),
    })
      .then(response => response.json())
      .then(data => {
        console.log('Event created:', data);
        // Reset form fields
        setEventName('');
        setDate('');
        setTime('');
        setLocation('');
        setOrganization('');
        setNotes('');
      })
      .catch(error => console.error('Error creating event:', error));
  };

  return (
    <div className="CreateEvent">
      <h2>Create New Event</h2>
      <form onSubmit={handleSubmit}>
        <label>
          Event Name:
          <input type="text" value={eventName} onChange={(e) => setEventName(e.target.value)} required />
        </label>
        <label>
          Date:
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
        </label>
        <label>
          Time:
          <input type="time" value={time} onChange={(e) => setTime(e.target.value)} required />
        </label>
        <label>
          Location:
          <input type="text" value={location} onChange={(e) => setLocation(e.target.value)} required />
        </label>
        <label>
          Organization:
          <input type="text" value={organization} onChange={(e) => setOrganization(e.target.value)} required />
        </label>
        <label>
          Notes:
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} />
        </label>
        <button type="submit">Create Event</button>
      </form>
    </div>
  );
}

export default CreateEvent;
