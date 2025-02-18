import os
import psycopg2
from contextlib import contextmanager
import bcrypt
import jwt
import logging

# Get the database URL from the environment variable
DATABASE_URL = os.getenv('DATABASE_URL')
SECRET_KEY = os.getenv('SECRET_KEY')


def add_user(username, password, manager):
    with get_db_connection() as conn:
        with get_db_cursor(conn) as cur:
            hashed_password = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
            cur.execute("""
            INSERT INTO users (username, password, manager)
            VALUES (%s, %s, %s);
            """, (username, hashed_password, manager))
            conn.commit()

@contextmanager
def get_db_connection():
    conn = psycopg2.connect(DATABASE_URL)
    try:
        yield conn
    finally:
        conn.close()

@contextmanager
def get_db_cursor(conn):
    cur = conn.cursor()
    try:
        yield cur
    finally:
        cur.close()

def initdb():
    with get_db_connection() as conn:
        with get_db_cursor(conn) as cur:
            cur.execute("""
            CREATE TABLE IF NOT EXISTS events (
            id SERIAL PRIMARY KEY,
            name TEXT NOT NULL,
            date DATE NOT NULL,
            time TIME NOT NULL,
            location TEXT NOT NULL,
            organization TEXT,
            notes TEXT,
            approved BOOLEAN DEFAULT FALSE,
            created_by TEXT NOT NULL
            );
            """)
            cur.execute("""
            CREATE TABLE IF NOT EXISTS users (
            id SERIAL PRIMARY KEY,
            username TEXT NOT NULL UNIQUE,
            password TEXT NOT NULL,
            manager BOOLEAN DEFAULT FALSE
            );
            """)
            print("Tables created successfully")
            try:
                add_user("ifc", "ifc", True)
            except:
                print("User already exists")
            conn.commit()

def add_event(name, date, time, location, organization, notes, approved, created_by):
    with get_db_connection() as conn:
        with get_db_cursor(conn) as cur:
            cur.execute("""
            INSERT INTO events (name, date, time, location, organization, notes, approved, created_by)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s);
            """, (name, date, time, location, organization, notes, approved, created_by))
            conn.commit()

def get_events():
    with get_db_connection() as conn:
        with get_db_cursor(conn) as cur:
            cur.execute("""
            SELECT id, name, date, time, location, organization, notes, approved, created_by FROM events;
            """)
            rows = cur.fetchall()
            events = []
            for row in rows:
                event = {
                    "id": row[0],
                    "eventName": row[1],
                    "date": row[2].isoformat(),
                    "time": row[3].isoformat(),
                    "location": row[4],
                    "organization": row[5],
                    "notes": row[6],
                    "approved": row[7],
                    "created_by": row[8]
                }
                events.append(event)
            return events

def delete_event(id):
    with get_db_connection() as conn:
        with get_db_cursor(conn) as cur:
            cur.execute("""
            DELETE FROM events WHERE id = %s;
            """, (id,))
            conn.commit()
            return cur.rowcount

def update_event(id, name, date, time, location, organization, notes, approved):
    with get_db_connection() as conn:
        with get_db_cursor(conn) as cur:
            cur.execute("""
            UPDATE events
            SET name = %s, date = %s, time = %s, location = %s, organization = %s, notes = %s, approved = %s
            WHERE id = %s;
            """, (name, date, time, location, organization, notes, approved, id))
            conn.commit()
            return cur.rowcount

def verify_user(username, password):
    with get_db_connection() as conn:
        with get_db_cursor(conn) as cur:
            cur.execute("""
            SELECT id, password FROM users WHERE username = %s;
            """, (username,))
            user = cur.fetchone()
            if user:
                try:
                    if bcrypt.checkpw(password.encode('utf-8'), user[1].encode('utf-8')):
                        token = jwt.encode({'user_id': user[0]}, SECRET_KEY, algorithm='HS256')
                        return token
                except ValueError as e:
                    logging.error(f"Error verifying user {username}: {e}")
            return None

def get_user_role(user_id):
    with get_db_connection() as conn:
        with get_db_cursor(conn) as cur:
            cur.execute("SELECT manager FROM users WHERE id = %s", (user_id,))
            result = cur.fetchone()
            if result:
                return bool(result[0])
            return False