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
  useNavigate,
} from "react-router-dom";
import { useSelector } from 'react-redux'
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import { inputToDinero, intlFormat } from '../utils/Currency'
import LogoutIcon from '@mui/icons-material/Logout';
import api from '../api'
import SsidChartIcon from '@mui/icons-material/SsidChart';
import Grid from '@mui/material/Grid';
import { add, isNegative } from 'dinero.js'
import { useTheme } from '@mui/styles'
import Stack from '@mui/material/Stack'
import AddCircleIcon from "@mui/icons-material/AddCircle"
import Menu from '@mui/material/Menu'
import MenuItem from '@mui/material/MenuItem'
import PopupState, { bindTrigger, bindMenu } from 'material-ui-popup-state';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';

const drawerWidth = 300;

export default function AppDrawer(props) {
  const theme = useTheme()
  const navigate = useNavigate()

  const menuItems = [
    { name: 'Budget', path: '/'},
    // { name: 'All Accounts', path: '/accounts'},
  ]

  /**
   * State block
   */
  const [accountsListOpen, setAccountsListOpen] = useState({ BUDGET: true, TRACKING: true })
  const [trackingAccountsOpen, setTrackingAccountsOpen] = useState(true)
  const [selectedItem, setSelectedItem] = useState('Budget')

  /**
   * Redux block
   */
  const budget = useSelector(state => state.budgets.activeBudget)
  const accounts = useSelector(state => state.accounts.accounts)
  const budgetAccounts = accounts.filter(account => account.type !== 2)
  const trackingAccounts = accounts.filter(account => account.type === 2)

  const listItemClicked = (name, url) => {
    if (name === 'BUDGET') {
      setAccountsListOpen({
        ...accountsListOpen,
        BUDGET: !accountsListOpen.BUDGET,
      })
      return
    }

    if (name === 'TRACKING') {
      setAccountsListOpen({
        ...accountsListOpen,
        TRACKING: !accountsListOpen.TRACKING,
      })
      return
    }

    setSelectedItem(name)

    if (url) {
      navigate(url)
    }
  }

  const logout = async () => {
    await api.logout()
    navigate('/')
    window.location.reload(false);
  }

  const AccountList = (label, accounts) => {
    const balance = accounts.reduce((total, account) => {
      return add(account.balance, total)
    }, inputToDinero(0))
    const balanceColor = isNegative(balance) ? theme.palette.error.main : theme.palette.text.secondary

    return (
      <List dense={true}>
        <ListItemButton onClick={() => listItemClicked(label)}>
          <Grid container direction="row" justifyContent="space-between" alignItems="center">
            <div>
              <Grid container direction="row" justifyContent="space-between" alignItems="center">
                <ListItemIcon size="small" edge="end" style={{minWidth: '20px'}}>
                  {accountsListOpen[label] ? <ExpandMore fontSize="small" /> : <ChevronRightIcon fontSize="small" />}
                </ListItemIcon>
                <ListItemText primary={label} primaryTypographyProps={{
                  // variant: 'caption',
                  style: { fontWeight: 'bold' },
                }}/>
              </Grid>
            </div>

            <div>
              <ListItemText
                edge="end"
                secondary={intlFormat(balance)}
                secondaryTypographyProps={{
                  // fontWeight: 'bold',
                  color: balanceColor,
                }}
              />
            </div>
          </Grid>
        </ListItemButton>

        <Collapse in={accountsListOpen[label]} timeout="auto" unmountOnExit>
          <List dense={true} component="div" disablePadding>
            {accounts.map(account => AccountItem(account))}
          </List>
        </Collapse>
      </List>
    )
  }

  const AccountItem = (account) => {
    const balanceColor = isNegative(account.balance) ? theme.palette.error.main : theme.palette.text.secondary
    return (
        <ListItemButton
          key={`account-${account.id}`}
          selected={selectedItem === `account-${account.id}`}
          onClick={() => listItemClicked(`account-${account.id}`, `/accounts/${account.id}`)}
        >
          <Grid container direction="row" justifyContent="space-between" alignItems="center">
            <div>
              <ListItemText
                sx={{ maxWidth: 150 }}
                primary={account.name}
                primaryTypographyProps={{
                  style: {
                    // fontWeight: 'bold',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }
                }}
              />
            </div>

            <div>
              <ListItemText
                secondary={intlFormat(account.balance)}
                secondaryTypographyProps={{
                  // fontWeight: 'bold',
                  color: balanceColor,
                }}
              />
            </div>
          </Grid>
        </ListItemButton>
    )
  }

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        [`& .MuiDrawer-paper`]: { width: drawerWidth, boxSizing: 'border-box' },
      }}
    >
      <List>
        <PopupState variant="popover" popupId="demo-popup-menu">
          {(popupState) => (
            <React.Fragment>
              <ListItemButton {...bindTrigger(popupState)}>
                <ListItemText primary={budget.name} />
                <ExpandMore />
              </ListItemButton>
              <Menu {...bindMenu(popupState)}>
                {/* <MenuItem onClick={popupState.close}>Profile</MenuItem>
                <MenuItem onClick={popupState.close}>My account</MenuItem> */}
                <MenuItem onClick={logout}>Logout</MenuItem>
              </Menu>
            </React.Fragment>
          )}
        </PopupState>
      </List>

      <List>
        {menuItems.map((menuItemConfig, index) => (
          <ListItemButton
            key={menuItemConfig.name}
            onClick={() => listItemClicked(menuItemConfig.name, menuItemConfig.path)}
            selected={selectedItem === menuItemConfig.name}
          >
            <ListItemIcon style={{minWidth: '40px'}}>
              {index % 2 === 0 ? <AccountBalanceIcon /> : <MailIcon />}
            </ListItemIcon>
            <ListItemText primary={menuItemConfig.name} />
          </ListItemButton>
        ))}
      </List>

      <Divider />

      {
        budgetAccounts.length > 0 && AccountList('BUDGET', budgetAccounts)
      }

      {
        trackingAccounts.length > 0 && AccountList('TRACKING', trackingAccounts)
      }

      <List dense={true}>
        <ListItemButton>
          <ListItemIcon size="small" style={{minWidth: '25px'}}>
            <AddCircleIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="Add Account" onClick={() => props.onAddAccountClick()} />
        </ListItemButton>
      </List>

      <List dense={true} style={{ marginTop: "auto" }}>
        <ListItem disablePadding>
          <ListItemButton>
            <ListItemIcon>
              <LogoutIcon />
            </ListItemIcon>
            <ListItemText primary="Log Out" onClick={logout}/>
          </ListItemButton>
        </ListItem>
      </List>

    </Drawer>
  )
}
