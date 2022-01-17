import React, { useState } from 'react'
import './App.css'
import Box from '@mui/material/Box'
import CssBaseline from '@mui/material/CssBaseline'
import Drawer from './components/Drawer'
import Budget from './pages/Budget'
import Account from './pages/Account'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Login from './components/Login'
import { useDispatch, useSelector } from 'react-redux'
import AddAccountDialog from './components/AddAccountDialog'
import { ThemeProvider, createTheme } from '@mui/material/styles'

const ColorModeContext = React.createContext({ toggleColorMode: () => {} })

export default function App(props) {
  const theme = createTheme({
    palette: {
      mode: 'light',
      background: {
        drawer: '#333333',
        header: '#505a5e',
      },
      primary: {
        main: '#333333',
      },
      secondary: {
        main: '#ffffff',
      },
      success: {
        main: '#32ae7b',
      },
      error: {
        main: '#d66466',
      },
      warning: {
        main: '#FAEF6E',
      },
      text: {
        primary: '#222222',
      },
    },
    components: {
      MuiDrawer: {
        styleOverrides: {
          paper: {
            backgroundColor: '#333333',
            color: 'white',
          },
        },
      },
      MuiDivider: {
        styleOverrides: {
          root: {
            borderColor: 'white',
          },
        },
      },
    },
    typography: {
      // fontFamily: 'Lato',
      fontFamily: 'Nunito',
      // fontFamily: 'Varela Round',
      // fontFamily: 'IBM Plex Sans Condensed',
      // fontFamily: 'Roboto',
    },
  })
  const colorMode = React.useContext(ColorModeContext)

  /**
   * State block
   */
  const [newAccountDialogOpen, setNewAccountDialogOpen] = useState(false)

  /**
   * Redux store block
   */
  const initComplete = useSelector(state => state.users.initComplete)

  const closeNewAccountDialog = () => {
    setNewAccountDialogOpen(false)
  }

  return (
    <div className="App">
      <ThemeProvider theme={theme}>
        {!initComplete && <Login />}
        {initComplete && (
          <Router>
            <Box sx={{ display: 'flex' }}>
              <CssBaseline />
              {/* <Header /> */}
              <Drawer onAddAccountClick={() => setNewAccountDialogOpen(true)} />
              <Box component="main" sx={{ flexGrow: 1, p: 0 }}>
                <AddAccountDialog isOpen={newAccountDialogOpen} close={closeNewAccountDialog} />
                <Routes>
                  <Route path="/" element={<Budget />} />
                  <Route path="/accounts/:accountId" element={<Account />} />
                </Routes>
              </Box>
            </Box>
          </Router>
        )}
      </ThemeProvider>
    </div>
  )
}
