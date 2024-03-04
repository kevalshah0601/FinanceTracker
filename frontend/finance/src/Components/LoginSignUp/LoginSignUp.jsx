import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom'
import './LoginSignUp.css';
import usericon from '../Assets/person.png';
import emailicon from '../Assets/email.png';
import passwordicon from '../Assets/password.png';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const notify = (message) => toast.success(message);
const errorNotify = (message) => toast.error(message);

export const LoginSignUp = () => {
  const [action, setAction] = useState("Sign Up");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginPossible, setloginPossible] = useState(true);
  const [signUpPossible, setsignUpPossible] = useState(false);
  const navigate = useNavigate();

  const handleAction = async () => {
    if (action === "Sign Up") {
      try {
        const response = await fetch('http://localhost:5000/signup', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ username, email, password }),
        });

        if (response.ok) {
          setUsername("");
          setEmail("");
          setPassword("");
          setAction("Login");
          notify("Signup successful!"); // Show success toast
        } else {
          // Handle registration error
          errorNotify("Signup failed. Please try again."); // Show error toast
        }
      } catch (error) {
        console.error('Error during signup:', error);
      }
    } else {
      try {
        const response = await fetch('http://localhost:5000/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email, password }),
        });

        if (response.ok) {
          const userData = await response.json();
          const { user_id, name } = userData; // Assuming your API response contains user_id and name
          setEmail("");
          setPassword('');
          notify("Login successful!"); // Show success toast
          navigate(`/dashboard/${user_id}`); // Pass the user_id as a route parameter
        } else {
          // Handle login error
          errorNotify("Login failed. Please check your credentials."); // Show error toast
        }
      } catch (error) {
        console.error('Error during login:', error);
      }
    }
  };

  return (
    <div className='container'>
      <div className='header'>
        <div className='text'>{action}</div>
        <div className='underline'></div>
      </div>
      <div className='inputs'>
        {action === "Login" ? null : (
          <div className='input'>
            <img src={usericon} alt="" />
            <input
              type="text"
              placeholder='Name'
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>
        )}
        <div className='input'>
          <img src={emailicon} alt="" />
          <input
            type="email"
            placeholder='Email ID'
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div className='input'>
          <img src={passwordicon} alt="" />
          <input
            type="password"
            placeholder='Password'
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        {action === "Sign Up" ? null : (
          <div className="forgot-password">
            Lost Password ? <span>Click Here!</span>
          </div>
        )}
        <div className="submit-container">
          <div
            className={action === "Login" ? "submit gray" : "submit"}
            onClick={() => {if (signUpPossible) {
              setAction("Sign Up");
              setsignUpPossible(false);
              setloginPossible(true);
            } else {
              handleAction();
            }}}
          >
            Sign Up
          </div>
          <div
            className={action === "Sign Up" ? "submit gray" : "submit"}
            onClick={() => {if (loginPossible) {
              setAction("Login");
              setloginPossible(false);
              setsignUpPossible(true);
            } else {
              handleAction();
            }}}
          >
            LogIn
          </div>
        </div>
      </div>
      <ToastContainer position="bottom-right" autoClose={3000} hideProgressBar />
    </div>
  );
};
