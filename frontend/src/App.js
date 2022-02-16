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
import useInterval from './utils/useInterval'
import API from './api'

export default function App(props) {
  const theme = useSelector(state => state.app.theme)
  const loggedIn = useSelector(state => state.users.user.email)

  useInterval(async () => {
    if (loggedIn) {
      try {
        await API.ping()
      } catch (err) {
        window.location.reload(false)
      }
    }
  }, 1800000)

  const darkTheme = createTheme({
    palette: {
      mode: 'dark',
      background: {
        paper: '#272b30',
        drawer: '#272b30',
        tableHeader: '#272b30',
        tableBody: '#2B3035',
        details: '#272b30',
      },
      secondary: {
        main: '#ffffff',
      },
      success: {
        main: '#62c462',
      },
      error: {
        main: '#ee5f5b',
      },
      warning: {
        main: '#f89406',
      },
    },
    components: {
      MuiDrawer: {
        styleOverrides: {
          paper: {
            backgroundColor: '#272b30',
            color: 'white',
          },
        },
      },
      // MuiDivider: {
      //   styleOverrides: {
      //     root: {
      //       borderColor: 'white',
      //     },
      //   },
      // },
      MuiTableCell: {
        footer: {
          left: 0,
          bottom: 0, // <-- KEY
          zIndex: 2,
          position: 'sticky',
        },
      },
    },
    typography: {
      fontFamily: 'Nunito',
      // fontFamily: 'Varela Round',
      // fontFamily: 'IBM Plex Sans Condensed',
      // fontFamily: 'Roboto',
    },
  })

  const lightTheme = createTheme({
    palette: {
      mode: 'light',
      background: {
        drawer: '#333333',
        header: '#333333',
        tableBody: '#ffffff',
        tableHeader: '#333333',
        details: '#333333',
        detailsContent: '#333333',
      },
      action: {
        // disabledBackground: 'set color of background here',
        // disabled: '#616161',
      },
      primary: {
        main: '#3a3f51',
      },
      secondary: {
        main: '#ffffff',
      },
      success: {
        main: '#16a085',
      },
      error: {
        main: '#e74c3c',
      },
      warning: {
        main: '#ec912e',
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
    },
    typography: {
      fontFamily: 'Nunito',
      // fontFamily: 'Varela Round',
      // fontFamily: 'IBM Plex Sans Condensed',
      // fontFamily: 'Roboto',
    },
  })

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
      <ThemeProvider theme={theme === 'dark' ? darkTheme : lightTheme}>
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
