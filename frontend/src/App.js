import React, { useState } from 'react';
import './App.css';
import Box from '@mui/material/Box';
import CssBaseline from '@mui/material/CssBaseline';
import Toolbar from '@mui/material/Toolbar';
import Header from './components/Header'
import Drawer from './components/Drawer'
import Budget from './pages/Budget'
import Account from './pages/Account'
import {
  BrowserRouter as Router,
  Routes,
  Route,
} from "react-router-dom";
import Login from './components/Login'
import { useDispatch, useSelector } from 'react-redux'
import AddAccountDialog from './components/AddAccountDialog'
// import { store } from './redux/store'

export default function App(props) {
  /**
   * State block
   */
  const [newAccountDialogOpen, setNewAccountDialogOpen] = useState(false)

  /**
   * Redux store block
   */
  const initComplete = useSelector(state => state.users.initComplete)

  return (
    <div className="App">
      {
        !initComplete && <Login/>
      }
      {
        initComplete && (
          <Router>
            <Box sx={{ display: 'flex' }}>
              <CssBaseline />
              <Header />
              <Drawer onAddAccountClick={() => setNewAccountDialogOpen(true)}/>
              <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
                <AddAccountDialog isOpen={newAccountDialogOpen} close={() => setNewAccountDialogOpen(false)}/>
                <Toolbar />
                <Routes>
                  <Route path="/" element={<Budget/>} />
                  <Route path="/accounts/:accountId" element={<Account/>} />
                </Routes>
              </Box>
            </Box>
          </Router>
        )
      }
    </div>
  )
}
