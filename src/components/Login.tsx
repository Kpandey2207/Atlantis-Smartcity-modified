import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { auth, db } from '../firebase/config';
import { doc, getDoc, updateDoc, serverTimestamp, setDoc } from 'firebase/firestore';

interface LoginProps {
  onClose: () => void;
}

const Login: React.FC<LoginProps> = ({ onClose }) => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Updated check admin status function with better logging
  const checkAdminStatus = async (uid: string) => {
    try {
      console.log('Checking admin status for user:', uid);
      const userRef = doc(db, 'users', uid);
      const userDoc = await getDoc(userRef);
      console.log('User document exists:', userDoc.exists());

      if (userDoc.exists()) {
        const userData = userDoc.data();
        console.log('Full user data:', userData);

        if (!userData.hasOwnProperty('isAdmin')) {
          // If isAdmin field doesn't exist, add it
          await updateDoc(userRef, {
            isAdmin: email === 'abhinavpillai92@gmail.com' // Set true for specific admin email
          });
          return email === 'abhinavpillai92@gmail.com';
        }

        return userData.isAdmin === true;
      }

      return false;
    } catch (error) {
      console.error('Error checking admin status:', error);
      return false;
    }
  };

  // Updated create/update user function
  const createOrUpdateUser = async (uid: string, userEmail: string) => {
    try {
      const userRef = doc(db, 'users', uid);
      const userDoc = await getDoc(userRef);

      if (!userDoc.exists()) {
        // Create new user document
        await setDoc(userRef, {
          email: userEmail,
          createdAt: serverTimestamp(),
          lastLogin: serverTimestamp(),
          displayName: userEmail.split('@')[0],
          isAdmin: userEmail === 'abhinavpillai92@gmail.com' // Set true for specific admin email
        });
      } else {
        // Update existing user's login time
        const userData = userDoc.data();
        if (!userData.hasOwnProperty('isAdmin')) {
          // Add isAdmin field if it doesn't exist
          await updateDoc(userRef, {
            lastLogin: serverTimestamp(),
            isAdmin: userEmail === 'abhinavpillai92@gmail.com' // Set true for specific admin email
          });
        } else {
          // Just update login time
          await updateDoc(userRef, {
            lastLogin: serverTimestamp()
          });
        }
      }
    } catch (error) {
      console.error('Error creating/updating user:', error);
    }
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }
    setLoading(true);
    setError('');

    try {
      console.log('Attempting email login for:', email);
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      console.log('User authenticated:', userCredential.user.uid);

      await createOrUpdateUser(userCredential.user.uid, email);
      const isAdmin = await checkAdminStatus(userCredential.user.uid);
      console.log('Is user admin?', isAdmin);

      if (isAdmin) {
        console.log('Redirecting to admin dashboard');
        navigate('/home');
      } else {
        console.log('Regular user login - redirecting to home');
        navigate('/home');
      }
    } catch (err: any) {
      console.error('Login error:', err);
      switch (err.code) {
        case 'auth/invalid-email':
          setError('Invalid email address');
          break;
        case 'auth/user-not-found':
          setError('No account found with this email');
          break;
        case 'auth/wrong-password':
          setError('Incorrect password');
          break;
        default:
          setError('Failed to sign in');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError('');

    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const userEmail = result.user.email || '';

      await createOrUpdateUser(result.user.uid, userEmail);
      const isAdmin = await checkAdminStatus(result.user.uid);

      if (isAdmin) {
        navigate('/admin/dashboard');
      } else {
        navigate('/home');
      }
    } catch (err: any) {
      if (err.code === 'auth/popup-closed-by-user') {
        setError('Sign in cancelled');
      } else {
        setError('Failed to sign in with Google');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-y-0 right-0 w-1/2 z-50" style={{
      animation: 'slideIn 0.5s ease-out forwards',
    }}>
      <style>
        {`
          @keyframes slideIn {
            from {
              transform: translateX(100%);
              opacity: 0;
            }
            to {
              transform: translateX(0);
              opacity: 1;
            }
          }
        `}
      </style>

      <div className="absolute inset-0 bg-gradient-to-br from-black/80 to-black/90 backdrop-blur-xl border-l border-white/10">
        <button
          onClick={onClose}
          className="absolute top-8 right-8 text-2xl text-white/70 hover:text-white transition-colors"
        >
          ×
        </button>

        <div className="relative w-full max-w-md mx-auto px-12 py-16">
          <div className="mb-12 text-center">
            <h2 className="text-4xl font-light text-white mb-3">
              Welcome Back
            </h2>
            <p className="text-white/50">Sign in to continue</p>
          </div>

          {error && (
            <div className="mb-6 p-4 rounded-lg bg-red-500/10 border border-red-500/20">
              <p className="text-red-400 text-center text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleEmailLogin} className="space-y-6">
            <div>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email"
                className="w-full px-6 py-4 bg-white/5 rounded-full text-white placeholder-white/30 outline-none border border-white/10 focus:border-blue-500/50 transition-colors"
                disabled={loading}
              />
            </div>

            <div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                className="w-full px-6 py-4 bg-white/5 rounded-full text-white placeholder-white/30 outline-none border border-white/10 focus:border-blue-500/50 transition-colors"
                disabled={loading}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`
                w-full px-6 py-4 rounded-full text-white font-light
                transition-all duration-300 
                ${loading 
                  ? 'bg-blue-500/30 cursor-not-allowed' 
                  : 'bg-blue-500/50 hover:bg-blue-500/60'
                }
              `}
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div className="mt-6">
            <button
              onClick={handleGoogleLogin}
              disabled={loading}
              className="w-full px-6 py-4 rounded-full text-white font-light bg-white/5 border border-white/10 hover:bg-white/10 transition-all duration-300 flex items-center justify-center gap-3"
            >
              <img 
                src="https://www.google.com/favicon.ico" 
                alt="Google" 
                className="w-5 h-5"
              />
              Sign in with Google
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;