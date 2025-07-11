import React from 'react';
import './SignIn.css';

const SignIn = () => {
  return (
    <div className="signin-container">
      <div className="signin-box">
        <h2>Sign In</h2>
        <form>
          <div className="input-group">
            <label htmlFor="email">Email</label>
            <input type="email" id="email" placeholder="Enter your email" required />
          </div>
          <div className="input-group">
            <label htmlFor="password">Password</label>
            <input type="password" id="password" placeholder="Enter your password" required />
          </div>
          <button type="submit" className="signin-button">Sign In</button>
        </form>
      </div>
    </div>
  );
};

export default SignIn;
