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
        paper: 'rgb(28, 33, 40)',
        drawer: 'rgb(28, 33, 40)',
        tableHeader: 'rgb(28, 33, 40)',
        tableBody: 'rgb(34, 39, 46)',
        details: 'rgb(28, 33, 40)',
      },
      secondary: {
        main: '#ffffff',
      },
      // success: {
      //   main: '#16a085',
      // },
      error: {
        main: '#e74c3c',
      },
      // warning: {
      //   main: '#ffa84a',
      // },
    },
    components: {
      MuiDrawer: {
        styleOverrides: {
          paper: {
            backgroundColor: 'rgb(28, 33, 40)',
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
        header: '#536067',
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
        main: '#333333',
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
