import React, { useState } from 'react'
import Drawer from '@mui/material/Drawer'
import List from '@mui/material/List'
import Divider from '@mui/material/Divider'
import ListItem from '@mui/material/ListItem'
import MailIcon from '@mui/icons-material/Mail'
import ListItemButton from '@mui/material/ListItemButton'
import ListItemIcon from '@mui/material/ListItemIcon'
import ListItemText from '@mui/material/ListItemText'
import ExpandMore from '@mui/icons-material/ExpandMore'
import Collapse from '@mui/material/Collapse'
import { useNavigate } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import AccountBalanceIcon from '@mui/icons-material/AccountBalance'
import { inputToDinero, intlFormat, valueToDinero } from '../utils/Currency'
import LogoutIcon from '@mui/icons-material/Logout'
import api from '../api'
import Grid from '@mui/material/Grid'
import { add, isNegative } from 'dinero.js'
import { useTheme } from '@mui/styles'
import AddCircleIcon from '@mui/icons-material/AddCircle'
import Menu from '@mui/material/Menu'
import MenuItem from '@mui/material/MenuItem'
import { usePopupState, bindTrigger, bindMenu } from 'material-ui-popup-state/hooks'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import { accountsSelectors, editAccount, fetchAccounts } from '../redux/slices/Accounts'
import { setTheme } from '../redux/slices/App'
import { selectActiveBudget } from '../redux/slices/Budgets'
import Brightness4Icon from '@mui/icons-material/Brightness4'
import Brightness7Icon from '@mui/icons-material/Brightness7'
import Modal from '@mui/material/Modal'
import Box from '@mui/material/Box'
import Settings from './Settings/Settings'

const drawerWidth = 300

export default function AppDrawer(props) {
  const dispatch = useDispatch()
  const theme = useTheme()
  const navigate = useNavigate()

  const currentTheme = useSelector(state => state.app.theme)

  const menuItems = [
    { name: 'Budget', path: '/' },
    // { name: 'All Accounts', path: '/accounts'},
  ]

  /**
   * State block
   */
  const [accountsListOpen, setAccountsListOpen] = useState({ BUDGET: true, TRACKING: true })
  const [selectedItem, setSelectedItem] = useState('Budget')
  const [settingsOpen, setSettingsOpen] = useState(false)

  const menuPopupState = usePopupState({
    variant: 'popover',
    popupId: 'drawer-menu',
  })

  /**
   * Redux block
   */
  const budget = useSelector(selectActiveBudget)
  const accounts = useSelector(accountsSelectors.selectAll)
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

  const toggleTheme = () => {
    dispatch(setTheme(currentTheme === 'dark' ? 'light' : 'dark'))
  }

  const logout = async () => {
    await api.logout()
    navigate('/')
    window.location.reload(false)
  }

  const AccountList = (label, accounts) => {
    const balance = accounts.reduce((total, account) => {
      return add(valueToDinero(account.balance), total)
    }, inputToDinero(0))
    const balanceColor = isNegative(balance) ? theme.palette.error.main : theme.palette.secondary.main

    return (
      <List dense={true}>
        <ListItemButton onClick={() => listItemClicked(label)}>
          <Grid container direction="row" justifyContent="space-between" alignItems="center">
            <div>
              <Grid container direction="row" justifyContent="space-between" alignItems="center">
                <ListItemIcon size="small" edge="end" style={{ minWidth: '20px' }}>
                  {accountsListOpen[label] ? (
                    <ExpandMore sx={{ color: theme.palette.secondary.main }} fontSize="small" />
                  ) : (
                    <ChevronRightIcon sx={{ color: theme.palette.secondary.main }} fontSize="small" />
                  )}
                </ListItemIcon>
                <ListItemText
                  primary={label}
                  primaryTypographyProps={{
                    // variant: 'caption',
                    style: { fontWeight: 'bold' },
                  }}
                />
              </Grid>
            </div>

            <div>
              <ListItemText
                edge="end"
                secondary={intlFormat(balance)}
                secondaryTypographyProps={{
                  fontWeight: 'bold',
                  sx: { color: balanceColor },
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

  const DragState = {
    account: -1,
    dropAccount: -1, // drag target
  }

  const reorderAccounts = async (from, to) => {
    await dispatch(editAccount({ id: from.id, order: to.order + 0.5 }))
    dispatch(fetchAccounts())
  }

  const openSettings = () => {
    menuPopupState.close()
    setSettingsOpen(true)
  }

  const closeSettings = () => {
    setSettingsOpen(false)
  }

  const AccountItem = account => {
    const balance = valueToDinero(account.balance)
    const balanceColor = isNegative(balance) ? theme.palette.error.main : theme.palette.secondary.main
    return (
      <ListItemButton
        key={`account-${account.id}`}
        selected={selectedItem === `account-${account.id}`}
        onClick={() => listItemClicked(`account-${account.id}`, `/accounts/${account.id}`)}
        draggable="true"
        onDragStart={e => {
          DragState.account = account
        }}
        onDragEnter={e => {
          e.preventDefault()
          if (account.id !== DragState.account.id) {
            DragState.dropAccount = account
          }
        }}
        onDragEnd={e => {
          if (DragState.dropAccount !== -1) {
            reorderAccounts(DragState.account, DragState.dropAccount)
          }
          DragState.account = -1
          DragState.dropAccount = -1
        }}
      >
        <Grid container direction="row" justifyContent="space-between" alignItems="center">
          <div>
            <ListItemText
              sx={{ maxWidth: 150 }}
              primary={account.name}
              primaryTypographyProps={{
                style: {
                  fontWeight: 'bold',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                },
              }}
            />
          </div>

          <div>
            <ListItemText
              secondary={intlFormat(balance)}
              secondaryTypographyProps={{
                fontWeight: 'bold',
                color: balanceColor,
              }}
            />
          </div>
        </Grid>
      </ListItemButton>
    )
  }

  if (!budget) {
    return <></>
  }

  return (
    <>
      <Settings close={setSettingsOpen} open={settingsOpen} close={closeSettings} />

      <Drawer
        variant="permanent"
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          [`& .MuiDrawer-paper`]: { width: drawerWidth, boxSizing: 'border-box' },
        }}
      >
        <List>
          <ListItemButton {...bindTrigger(menuPopupState)}>
            <ListItemText primary={budget.name} />
            <ExpandMore sx={{ color: theme.palette.secondary.main }} />
          </ListItemButton>

          <Menu MenuListProps={{ dense: true }} {...bindMenu(menuPopupState)}>
            <MenuItem onClick={openSettings}>Settings</MenuItem>
            <MenuItem onClick={logout}>Log Out</MenuItem>
          </Menu>
        </List>

        <List>
          {menuItems.map((menuItemConfig, index) => (
            <ListItemButton
              key={menuItemConfig.name}
              onClick={() => listItemClicked(menuItemConfig.name, menuItemConfig.path)}
              selected={selectedItem === menuItemConfig.name}
            >
              <ListItemIcon style={{ minWidth: '40px' }}>
                {index % 2 === 0 ? <AccountBalanceIcon sx={{ color: theme.palette.secondary.main }} /> : <MailIcon />}
              </ListItemIcon>
              <ListItemText primary={menuItemConfig.name} />
            </ListItemButton>
          ))}
        </List>

        <Divider />

        {budgetAccounts.length > 0 && AccountList('BUDGET', budgetAccounts)}

        {trackingAccounts.length > 0 && AccountList('TRACKING', trackingAccounts)}

        <List dense={true}>
          <ListItemButton>
            <ListItemIcon size="small" style={{ minWidth: '20px' }}>
              <AddCircleIcon
                style={{
                  color: theme.palette.secondary.main,
                  fontSize: theme.typography.subtitle2.fontSize,
                }}
              />
            </ListItemIcon>
            <ListItemText primary="Add Account" onClick={() => props.onAddAccountClick()} />
          </ListItemButton>
        </List>

        <List dense={true} style={{ marginTop: 'auto' }}>
          <ListItem disablePadding>
            <ListItemButton>
              <ListItemIcon>
                {currentTheme === 'dark' ? (
                  <Brightness7Icon sx={{ color: theme.palette.secondary.main }} />
                ) : (
                  <Brightness4Icon sx={{ color: theme.palette.secondary.main }} />
                )}
              </ListItemIcon>
              <ListItemText primary="Toggle Theme" onClick={toggleTheme} />
            </ListItemButton>
          </ListItem>
          <ListItem disablePadding>
            <ListItemButton>
              <ListItemIcon>
                <LogoutIcon sx={{ color: theme.palette.secondary.main }} />
              </ListItemIcon>
              <ListItemText primary="Log Out" onClick={logout} />
            </ListItemButton>
          </ListItem>
        </List>
      </Drawer>
    </>
  )
}
