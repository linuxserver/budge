import React, { useState } from 'react'
import Drawer from '@mui/material/Drawer';
import List from '@mui/material/List';
import Divider from '@mui/material/Divider';
import ListItem from '@mui/material/ListItem';
import InboxIcon from '@mui/icons-material/MoveToInbox';
import MailIcon from '@mui/icons-material/Mail';
import Toolbar from '@mui/material/Toolbar';
import Box from '@mui/material/Box';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import ExpandLess from '@mui/icons-material/ExpandLess';
import ExpandMore from '@mui/icons-material/ExpandMore';
import Collapse from '@mui/material/Collapse';
import {
  Link,
} from "react-router-dom";
import { useSelector } from 'react-redux'
import { makeStyles } from '@mui/styles'

const useStyles = makeStyles(theme => ({
  navigationDrawer: {
    backgroundColor: 'dark gray',
  }
}))

const drawerWidth = 240;

export default function AppDrawer(props) {
  const menuItems = [
    { name: 'Budget', path: '/'},
    // { name: 'All Accounts', path: '/accounts'},
  ]

  /**
   * State block
   */
  const [accountsOpen, setAccountsOpen] = useState(true)
  const [selectedItem, setSelectedItem] = useState('Budget')

  /**
   * Redux block
   */
  const accounts = useSelector(state => state.accounts.accounts)

  const listItemClicked = (name) => {
    if (name === 'Accounts') {
      setAccountsOpen(!accountsOpen)
      return
    }

    setSelectedItem(name)
  }

  const classes = useStyles()
  return (
    <Drawer
      variant="permanent"
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        [`& .MuiDrawer-paper`]: { width: drawerWidth, boxSizing: 'border-box' },
      }}
    >
      <Toolbar />
      <Box sx={{ overflow: 'auto' }}>
        <List dense={true}>
          {/* Main Menu Options */}
          {menuItems.map((menuItemConfig, index) => (
            <ListItem
              button
              key={menuItemConfig.name}
              component={Link}
              to={menuItemConfig.path}
              onClick={() => listItemClicked(menuItemConfig.name)}
              selected={selectedItem === menuItemConfig.name}
            >
              <ListItemIcon>
                {index % 2 === 0 ? <InboxIcon /> : <MailIcon />}
              </ListItemIcon>
              <ListItemText primary={menuItemConfig.name} />
            </ListItem>
          ))}
        </List>
        <Divider />
        <List dense={true}>
          {/* {['All mail', 'Trash', 'Spam'].map((text, index) => (
            <ListItem button key={text}>
              <ListItemIcon>
                {index % 2 === 0 ? <InboxIcon /> : <MailIcon />}
              </ListItemIcon>
              <ListItemText primary={text} />
            </ListItem>
          ))} */}

          {/* Accounts Section */}
          <ListItemButton onClick={() => listItemClicked('Accounts')}>
            <ListItemIcon>
              <InboxIcon />
            </ListItemIcon>
            <ListItemText primary="Accounts" />
            {accountsOpen ? <ExpandLess /> : <ExpandMore />}
          </ListItemButton>
          <Collapse in={accountsOpen} timeout="auto" unmountOnExit>
            <List dense={true} component="div" disablePadding>
              {accounts.map((account, index) => (
                // Don't display 'payee' account types
                account.type !== 2 &&
                <Link to={`/accounts/${account.id}`}
                  key={`account-${account.id}`}
                  onClick={() => listItemClicked(`account-${account.id}`)}
                  selected={selectedItem === `account-${account.id}`}
                >
                  <ListItemButton sx={{ pl: 4 }}>
                    <ListItemText primary={account.name} />
                  </ListItemButton>
                </Link>
              ))}
            </List>
          </Collapse>
          <ListItemButton>
            <ListItemText primary="Add Account" onClick={() => props.onAddAccountClick()} />
          </ListItemButton>
        </List>
      </Box>
    </Drawer>
  )
}
