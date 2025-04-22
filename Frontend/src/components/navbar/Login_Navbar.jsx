import React from 'react';
import logo from '../images/logo.png';

const Login_Navbar = () => {
  return (
    <div className='w-full flex items-center justify-left py-4'>
      <img 
        src={logo} 
        alt="Logo" 
        className='h-16 sm:h-14 md:h-16 lg:h-20 xl:h-24 object-contain' 
      />
    </div>
  );
};

export default Login_Navbar;
