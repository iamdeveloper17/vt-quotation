import React from 'react';
import Login_Navbar from '../navbar/Login_Navbar';
import invoice_image from '../images/invoice.png';
import { useNavigate } from 'react-router-dom';

const Login = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen w-full bg-[#fff7e6] px-6 md:px-[5%] flex flex-col">
      {/* Navbar */}
      <Login_Navbar />

      {/* Main Section */}
      <div className="flex flex-col-reverse md:flex-row flex-1 items-center justify-around">
        {/* Text Content */}
        <div className="w-full md:w-1/2 text-center md:text-left px-6 md:px-[5%]">
          <h1 className="text-2xl md:text-4xl mb-4 text-[#644e24] font-bold">
            Create quotations with VT quotation
          </h1>
          <h2 className="text-sm md:text-lg leading-5 text-zinc-800">
            Easily create, download, and print quotations for your clients. No more unsurety, just VT quotation It!
          </h2>
          {/* Buttons */}
          <div className="mt-6 justify-center flex md:flex-row items-center md:items-start gap-4 md:justify-start">
            <button
              onClick={() => navigate('/login')}
              className="bg-[#644e24] px-6 py-2 rounded-lg text-white text-sm shadow-md transition-all duration-300 hover:bg-[#443925]"
            >
              Log in
            </button>
          </div>
        </div>

        {/* Image Section */}
        <div className="w-full md:w-1/2 flex justify-center p-6">
          <img src={invoice_image} alt="Invoice Illustration" className="w-full max-w-md md:max-w-lg lg:max-w-xl object-contain" />
        </div>
      </div>
    </div>
  );
};

export default Login;
