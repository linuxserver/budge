import { useState } from 'react'
import Dialog from '@mui/material/Dialog'
import Modal from '@mui/material/Modal'
import Tabs from '@mui/material/Tabs'
import Tab from '@mui/material/Tab'
import Typography from '@mui/material/Typography'
import Box from '@mui/material/Box'
import Account from './Account'
import Backdrop from '@mui/material/Backdrop'
import { useSelector, useDispatch } from 'react-redux'

function TabPanel(props) {
  const { children, value, index, ...other } = props

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          <Typography>{children}</Typography>
        </Box>
      )}
    </div>
  )
}

function a11yProps(index) {
  return {
    id: `simple-tab-${index}`,
    'aria-controls': `simple-tabpanel-${index}`,
  }
}

export default function Settings({ open, close }) {
  const email = useSelector(state => state.users.user.email)

  const [value, setValue] = useState(0)

  const tabs = [
    {
      name: 'Account',
      Component: Account,
      props: {
        email: email,
      },
    },
  ]

  const handleChange = (event, newValue) => {
    setValue(newValue)
  }

  return (
    <div>
      <Modal open={open} onClose={close} aria-labelledby="modal-modal-title" aria-describedby="modal-modal-description">
        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: 600,
            height: 400,
            bgcolor: 'background.paper',
            boxShadow: 24,
            p: 4,
          }}
        >
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs value={value} onChange={handleChange} aria-label="basic tabs example">
              {tabs.map((config, index) => (
                <Tab label={config.name} {...a11yProps(index)} />
              ))}
            </Tabs>
          </Box>
          {tabs.map((config, index) => {
            return <config.Component {...config.props} value={value} index={index} close={close} />
          })}
        </Box>
      </Modal>
    </div>
  )
}
