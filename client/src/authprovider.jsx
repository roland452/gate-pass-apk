import axios from 'axios';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useContext from '../public/context/context';

const Authprovider = ({ children }) => {

  const setToast = useContext((state) => state.setToast)

  const [isAuthenticated, setIsAuthenticated] = useState(null)
  const navigate = useNavigate()
  
  async function fetchAuth() {
    try {
      const res = await axios.get('/api/user-auth', { withCredentials: true })
      let data = res.data
      if(data.authenticated) return setIsAuthenticated(data.authenticated || false)
      navigate('/auth')
      setToast('login to access page')
        
    } catch (error) {
      navigate('/auth')
      setToast('login to access page')
    }
  }

  
  useEffect(() => {
    fetchAuth()
  }, [])

  return isAuthenticated ? children : null
}

export default Authprovider