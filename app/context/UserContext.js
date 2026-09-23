import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY_USER_ID = '@disasteready/userId';
const STORAGE_KEY_USERNAME = '@disasteready/username';

const UserContext = createContext(null);

/**
 * Persistent login: `setUserId`/`setUsername` write straight through to
 * AsyncStorage as well as React state, so every existing call site
 * (LoginScreen, SignupScreen, ProfileScreen's logout) keeps working
 * unchanged — they just call setUserId(id) / setUserId(null) like before,
 * and persistence happens here rather than being scattered across screens.
 *
 * On mount, the stored session is read back and restored before the app
 * renders its real navigator — `isRestoringSession` lets App.js show a
 * loading state for that brief window instead of flashing the Login screen
 * first. Session is only ever cleared by an explicit setUserId(null) (manual
 * logout) — never by anything else.
 */
export function UserProvider({ children }) {
  const [userId, setUserIdState] = useState(null);
  const [username, setUsernameState] = useState(null);
  const [isRestoringSession, setIsRestoringSession] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [storedUserId, storedUsername] = await Promise.all([
          AsyncStorage.getItem(STORAGE_KEY_USER_ID),
          AsyncStorage.getItem(STORAGE_KEY_USERNAME)
        ]);
        if (storedUserId) setUserIdState(storedUserId);
        if (storedUsername) setUsernameState(storedUsername);
      } catch (err) {
        console.log('Session restore error:', err.message);
      } finally {
        setIsRestoringSession(false);
      }
    })();
  }, []);

  const setUserId = (id) => {
    setUserIdState(id);
    const write = id ? AsyncStorage.setItem(STORAGE_KEY_USER_ID, id) : AsyncStorage.removeItem(STORAGE_KEY_USER_ID);
    write.catch((err) => console.log('Session storage error:', err.message));
  };

  const setUsername = (name) => {
    setUsernameState(name);
    const write = name ? AsyncStorage.setItem(STORAGE_KEY_USERNAME, name) : AsyncStorage.removeItem(STORAGE_KEY_USERNAME);
    write.catch((err) => console.log('Session storage error:', err.message));
  };

  return (
    <UserContext.Provider value={{ userId, setUserId, username, setUsername, isRestoringSession }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  return useContext(UserContext);
}
