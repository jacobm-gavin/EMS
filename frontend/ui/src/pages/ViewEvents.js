import React, { useEffect, useState } from 'react';

const ViewEvents = ({ isLoggedIn }) => {
    const [events, setEvents] = useState([]);

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

    useEffect(() => {
        if (isLoggedIn) {
            fetchEvents();
            const interval = setInterval(fetchEvents, 5000); // Fetch events every 5 seconds
            return () => clearInterval(interval); // Cleanup interval on component unmount
        }
    }, [isLoggedIn]);

    return (
        <div>
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
        </div>
    );
};

export default ViewEvents;