import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import {BrowserRouter, Routes, Route} from 'react-router-dom'
import axios from 'axios';
import './index.css'
import Toast from './assets/toast.jsx'
import AuthPage from  '/public/pages/auth/layout.jsx'
import LandingPage from '/public/pages/landing/layout.jsx'
import QrCodePage from '/public/pages/qrcode/layout.jsx';
import ProfilePage from '/public/pages/profile/layout.jsx';
import Authprovider from './authprovider.jsx';


axios.defaults.baseURL = import.meta.env.VITE_SERVER_URL || 'http://localhost:5000'
axios.defaults.withCredentials = true


createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
    <div className='relative'>
       <Routes>
          <Route path='/' element={ <LandingPage /> } />
          <Route path='/auth' element={ <AuthPage /> } />
          <Route path='/profile' element={ <Authprovider> <ProfilePage /> </Authprovider> } />
          <Route path='/qrcode' element={ <Authprovider> <QrCodePage /> </Authprovider> } />
        </Routes>
        <Toast />
    </div>
    </BrowserRouter>
  </StrictMode>
)
