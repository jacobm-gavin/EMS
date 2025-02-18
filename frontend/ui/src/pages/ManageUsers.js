import React, { useState, useEffect } from 'react';

function ManageUsers() {
  const [users, setUsers] = useState([]);
  const [newUser, setNewUser] = useState({ username: '', password: '', manager: false });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = () => {
    fetch('http://localhost:3001/users', {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    })
      .then(response => response.json())
      .then(data => {
        setUsers(data);
      })
      .catch(error => console.error('Error fetching users:', error));
  };

  const handleCreateUser = () => {
    fetch('http://localhost:3001/users', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify(newUser)
    })
      .then(response => response.json())
      .then(data => {
        setUsers([...users, data]);
        setNewUser({ username: '', password: '', manager: false });
      })
      .catch(error => console.error('Error creating user:', error));
  };

  const handleDeleteUser = (userId) => {
    fetch(`http://localhost:3001/users/${userId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    })
      .then(response => {
        if (response.ok) {
          setUsers(users.filter(user => user.id !== userId));
        } else {
          console.error('Error deleting user:', response.statusText);
        }
      })
      .catch(error => console.error('Error deleting user:', error));
  };

  const handleUpdateManagerStatus = (userId, managerStatus) => {
    fetch(`http://localhost:3001/users/${userId}/manager`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({ manager: managerStatus })
    })
      .then(response => response.json())
      .then(data => {
        setUsers(users.map(user => (user.id === userId ? data : user)));
      })
      .catch(error => console.error('Error updating manager status:', error));
  };

  return (
    <div>
      <h2>Manage Users</h2>
      <div>
        <input
          type="text"
          placeholder="Username"
          value={newUser.username}
          onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
        />
        <input
          type="password"
          placeholder="Password"
          value={newUser.password}
          onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
        />
        <label>
          Manager:
          <input
            type="checkbox"
            checked={newUser.manager}
            onChange={(e) => setNewUser({ ...newUser, manager: e.target.checked })}
          />
        </label>
        <button onClick={handleCreateUser}>Create User</button>
      </div>
      <table>
        <thead>
          <tr>
            <th>Username</th>
            <th>Manager</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map(user => (
            <tr key={user.id}>
              <td>{user.username}</td>
              <td>{user.manager ? 'Yes' : 'No'}</td>
              <td>
                <button onClick={() => handleDeleteUser(user.id)}>Delete</button>
                <button onClick={() => handleUpdateManagerStatus(user.id, !user.manager)}>
                  {user.manager ? 'Revoke Manager' : 'Make Manager'}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default ManageUsers;