import React from 'react';
import Side_Navbar from '../navbar/Side_Navbar';
import { Outlet } from 'react-router-dom';

const Home = () => {
  return (
    <div className="min-h-screen w-full bg-[#B5A680] flex flex-col md:flex-row">
      
      {/* Sidebar */}
      <div className="w-full md:w-[30%] lg:w-[22%] bg-[#B5A680] md:h-auto">
        <Side_Navbar />
      </div>

      {/* Main Content */}
      <div className="flex-1 p-4 pt-16 md:p-8 overflow-y-auto bg-[#B5A680] min-h-screen md:w-[70%] lg:w-[78%]">
        <Outlet />
      </div>
    </div>
  );
};

export default Home;
