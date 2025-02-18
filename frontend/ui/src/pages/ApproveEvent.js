import React, { useEffect, useState } from 'react';
import './ApproveEvent.css';

function ApproveEvent() {
    const [events, setEvents] = useState([]);

    useEffect(() => {
        fetchEvents();
    }, []);

    const fetchEvents = async () => {
        try {
            const response = await fetch('http://localhost:3001/events/');
            const data = await response.json();
            console.log('Fetched events for approval:', data);
            if (Array.isArray(data)) {
                setEvents(data);
            } else {
                console.error('Expected an array but got:', data);
            }
        } catch (error) {
            console.error('Error fetching events:', error);
        }
    };

    const handleApprove = async (event, approved) => {
        const updatedEvent = { ...event, approved };
        try {
            const response = await fetch('http://localhost:3001/approve_event', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(updatedEvent),
            });
            const data = await response.json();
            console.log('Event updated:', data);
            setEvents(events.map(e => e.id === event.id ? updatedEvent : e));
        } catch (error) {
            console.error('Error updating event:', error);
        }
    };

    const handleDelete = async (eventId) => {
        try {
            const response = await fetch(`http://localhost:3001/events/${eventId}`, {
                method: 'DELETE',
            });
            if (response.ok) {
                setEvents(events.filter(event => event.id !== eventId));
                console.log('Event deleted:', eventId);
            } else {
                console.error('Failed to delete event:', eventId);
            }
        } catch (error) {
            console.error('Error deleting event:', error);
        }
    };

    const handleCheckboxChange = (event, e) => {
        handleApprove(event, e.target.checked);
    };

    return (
        <div className="ApproveEvent">
            <h2>Approve Events</h2>
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
                        <th>Actions</th>
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
                            <td>
                                <input
                                    type="checkbox"
                                    checked={event.approved}
                                    onChange={(e) => handleCheckboxChange(event, e)}
                                />
                            </td>
                            <td>{event.created_by}</td>
                            <td>
                                <button
                                    style={{ backgroundColor: 'red', color: 'white' }}
                                    onClick={() => handleDelete(event.id)}
                                >
                                    Delete
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

export default ApproveEvent;