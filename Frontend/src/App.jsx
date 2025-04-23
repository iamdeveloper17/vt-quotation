import React, { useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, useNavigate } from "react-router-dom";
import Signup from './components/login/Signup';
import LoginFirst from './components/login/LoginFirst';
import DashBoard from './components/side_link/DashBoard';
import Home from './components/side_link/Home';
import VegoForm from './components/form/VegoForm';
import BRbioForm from './components/form/BRbioForm';
import HanumanForm from './components/form/HanumanForm';
import HHCorpForm from './components/form/HHCorpForm';
import BRbioPage from './components/form/BRbioPage';
import HanumanPage from './components/form/HanumanPage';
import VegoPage from './components/form/VegoPage';
import HHCorpPage from './components/form/HHCorpPage';
import PrivateRoute from './PrivateRoute';
import PublicRoute from './PublicRoute';
import Error from './components/side_link/Error';
import Unauthorized from './components/side_link/Unauthorized';
import AdminUsers from './components/side_link/AdminUsers';
import Quotation from './components/side_link/Quotation';
import Login from './components/login/Login';
import PurchaseOrder from './components/side_link/PurchaseOrder';
import HanumanPurchaseForm from './components/purchase-form/HanumanPurchaseForm'
import HanumanPurchasePage from './components/purchase-form/HanumanPurchasePage';
import HHCorpPurchaseForm from './components/purchase-form/HHCorpPurchaseForm';
import HHCorpPurchasePage from './components/purchase-form/HHCorpPurchasePage';
import BRbioPurchaseForm from './components/purchase-form/BRbioPurchaseForm';
import BRbioPurchasePage from './components/purchase-form/BRbioPurchasePage';
import VegoPurchaseForm from './components/purchase-form/VegoPurchaseForm';
import VegoPurchasePage from './components/purchase-form/VegoPurchasePage';
import AdminItems from './components/side_link/AdminItems';

const App = () => {
  return (
    <div>
      <Router>
        <Routes>
          <Route path='/' element={<PublicRoute><Login /></PublicRoute>} />
          <Route path='/signup' element={<PublicRoute><Signup /></PublicRoute>} />
          <Route path='/login' element={<PublicRoute><LoginFirst /></PublicRoute>} />
          <Route path="/home" element={<PrivateRoute><Home /></PrivateRoute>} >
            <Route path="dashboard" element={<DashBoard />} />
            <Route path='quotation' element={<Quotation />} />
            <Route path="adminusers" element={<AdminUsers />} />
            <Route path="purchase_order" element={<PurchaseOrder />} />
            <Route path="admin_items" element={<AdminItems />} />
          </Route>
          <Route path='/quotation/br' element={<PrivateRoute><BRbioForm /></PrivateRoute>} />
          <Route path='/brbiopage' element={<PrivateRoute><BRbioPage /></PrivateRoute>} />
          <Route path='/quotation/hanuman' element={<PrivateRoute><HanumanForm /></PrivateRoute>} />
          <Route path='/hanumanpage' element={<PrivateRoute><HanumanPage /></PrivateRoute>} />
          <Route path='/quotation/vego' element={<PrivateRoute><VegoForm /></PrivateRoute>} />
          <Route path='/vegopage' element={<PrivateRoute><VegoPage /></PrivateRoute>} />
          <Route path='/quotation/hh' element={<PrivateRoute><HHCorpForm /></PrivateRoute>} />
          <Route path='/hhpage' element={<PrivateRoute><HHCorpPage /></PrivateRoute>} />
          
          <Route path='/purchase_order/br' element={<PrivateRoute><BRbioPurchaseForm /></PrivateRoute>} />
          <Route path='/brpurchasebiopage' element={<PrivateRoute><BRbioPurchasePage /></PrivateRoute>} />
          <Route path='/purchase_order/hanuman' element={<PrivateRoute><HanumanPurchaseForm /></PrivateRoute>} />
          <Route path='/hanumanpurchasepage' element={<PrivateRoute><HanumanPurchasePage /></PrivateRoute>} />
          <Route path='/purchase_order/vego' element={<PrivateRoute><VegoPurchaseForm /></PrivateRoute>} />
          <Route path='/vegopurchasepage' element={<PrivateRoute><VegoPurchasePage /></PrivateRoute>} />
          <Route path='/purchase_order/hh' element={<PrivateRoute><HHCorpPurchaseForm /></PrivateRoute>} />
          <Route path='/hhpurchasepage' element={<PrivateRoute><HHCorpPurchasePage /></PrivateRoute>} />
          <Route path='*' element={<Error />} />
          <Route path="/unauthorized" element={<PrivateRoute><Unauthorized /></PrivateRoute>} />
        </Routes>
      </Router>
    </div>
  )
}

export default App

