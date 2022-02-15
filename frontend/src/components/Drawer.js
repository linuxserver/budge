import React, { useState } from 'react'
import MuiDrawer from '@mui/material/Drawer'
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
import { inputToDinero, intlFormat, valueToDinero } from '../utils/Currency'
import LogoutIcon from '@mui/icons-material/Logout'
import api from '../api'
import { add, isNegative } from 'dinero.js'
import { styled, useTheme } from '@mui/styles'
import AddCircleIcon from '@mui/icons-material/AddCircle'
import { usePopupState } from 'material-ui-popup-state/hooks'
import { accountsSelectors, editAccount, fetchAccounts } from '../redux/slices/Accounts'
import { setTheme } from '../redux/slices/App'
import { selectActiveBudget } from '../redux/slices/Budgets'
import Brightness4Icon from '@mui/icons-material/Brightness4'
import Brightness7Icon from '@mui/icons-material/Brightness7'
import Settings from './Settings/Settings'
import SettingsIcon from '@mui/icons-material/Settings'
import Box from '@mui/material/Box'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import Avatar from '@mui/material/Avatar'
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import AccountBalanceIcon from '@mui/icons-material/AccountBalance'
import BudgetMonthNavigator from './BudgetMonthNavigator'

const drawerWidth = 300

const openedMixin = theme => ({
  width: drawerWidth,
  transition: theme.transitions.create('width', {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.enteringScreen,
  }),
  overflowX: 'hidden',
})

const closedMixin = theme => ({
  transition: theme.transitions.create('width', {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  overflowX: 'hidden',
  width: `calc(${theme.spacing(9)} + 1px)`,
  [theme.breakpoints.up('sm')]: {
    width: `calc(${theme.spacing(9)} + 1px)`,
  },
})

const Drawer = styled(MuiDrawer, { shouldForwardProp: prop => prop !== 'open' })(({ theme, open }) => ({
  width: drawerWidth,
  flexShrink: 0,
  whiteSpace: 'nowrap',
  boxSizing: 'border-box',
  ...(open && {
    ...openedMixin(theme),
    '& .MuiDrawer-paper': openedMixin(theme),
  }),
  ...(!open && {
    ...closedMixin(theme),
    '& .MuiDrawer-paper': closedMixin(theme),
  }),
}))

export default function AppDrawer(props) {
  const dispatch = useDispatch()
  const theme = useTheme()
  const navigate = useNavigate()

  const currentTheme = useSelector(state => state.app.theme)

  const menuItems = [
    { name: 'Envelopes', path: '/' },
    // { name: 'All Accounts', path: '/accounts'},
  ]

  /**
   * State block
   */
  const [drawerOpen, setDrawerOpen] = useState(true)
  const [accountsListOpen, setAccountsListOpen] = useState({ ON_BUDGET: true, OFF_BUDGET: true })
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
    if (accountsListOpen[name] !== undefined) {
      setAccountsListOpen({
        ...accountsListOpen,
        [name]: !accountsListOpen[name],
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
    const key = label.replace(' ', '_')

    return (
      <List dense={true}>
        <ListItemButton onClick={() => listItemClicked(key)}>
          <Stack container direction="row" justifyContent="space-between" alignItems="center" sx={{ width: '100%' }}>
            <div>
              <Stack container direction="row" justifyContent="space-between" alignItems="center">
                <ListItemIcon size="small" edge="end" style={{ minWidth: '20px' }}>
                  {accountsListOpen[key] ? (
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
              </Stack>
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
          </Stack>
        </ListItemButton>

        <Collapse in={accountsListOpen[key]} timeout="auto" unmountOnExit>
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

  const onAddAccountClick = () => {
    menuPopupState.close()
    props.onAddAccountClick()
  }

  const toggleDrawer = () => {
    setDrawerOpen(!drawerOpen)
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
        <Stack container direction="row" justifyContent="space-between" alignItems="center" sx={{ width: '100%' }}>
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
        </Stack>
      </ListItemButton>
    )
  }

  console.log(theme)

  if (!budget) {
    return <></>
  }

  return (
    <>
      <Settings close={setSettingsOpen} open={settingsOpen} close={closeSettings} />

      <Drawer
        variant="permanent"
        open={drawerOpen}
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          [`& .MuiDrawer-paper`]: { width: drawerWidth, boxSizing: 'border-box' },
        }}
      >
        <List>
          <ListItem button onClick={toggleDrawer}>
            {drawerOpen && <ListItemText primary={budget.name} />}
            <ListItemIcon
              sx={{
                mr: '-30px', // wish there was a better way to position this further right?
              }}
            >
              {drawerOpen === false ? (
                <ChevronRightIcon sx={{ color: theme.palette.secondary.main }} />
              ) : (
                <ChevronLeftIcon sx={{ color: theme.palette.secondary.main }} />
              )}
            </ListItemIcon>
          </ListItem>
        </List>

        <Box sx={{ ...(drawerOpen && { pb: 2 }) }}>
          <BudgetMonthNavigator mini={!drawerOpen} />
        </Box>

        <Divider />

        <List>
          {menuItems.map((menuItemConfig, index) => (
            <ListItem
              button
              key={menuItemConfig.name}
              onClick={() => listItemClicked(menuItemConfig.name, menuItemConfig.path)}
              selected={selectedItem === menuItemConfig.name}
            >
              <ListItemIcon>
                {index % 2 === 0 ? <MailIcon sx={{ color: theme.palette.secondary.main }} /> : <MailIcon />}
              </ListItemIcon>
              <ListItemText primary={menuItemConfig.name} />
            </ListItem>
          ))}
        </List>

        <Divider />

        {budgetAccounts.length > 0 && AccountList('ON BUDGET', budgetAccounts)}

        <Divider />

        {trackingAccounts.length > 0 && AccountList('OFF BUDGET', trackingAccounts)}

        <Divider />

        <List dense={true}>
          <ListItemButton>
            {drawerOpen && (
              <>
                <ListItemIcon size="small" style={{ minWidth: '20px' }}>
                  <AddCircleIcon
                    style={{
                      color: theme.palette.secondary.main,
                      fontSize: theme.typography.subtitle2.fontSize,
                    }}
                  />
                </ListItemIcon>
                <ListItemText primary="Add Account" onClick={props.onAddAccountClick} />
              </>
            )}
            {drawerOpen === false && (
              <>
                <ListItemIcon>
                  <AddCircleIcon
                    onClick={props.onAddAccountClick}
                    style={{
                      color: theme.palette.secondary.main,
                    }}
                  />
                </ListItemIcon>
              </>
            )}
          </ListItemButton>
        </List>

        <List dense={true} style={{ marginTop: 'auto' }}>
          <ListItem disablePadding>
            <ListItemButton onClick={openSettings}>
              <ListItemIcon>
                <SettingsIcon sx={{ color: theme.palette.secondary.main }} />
              </ListItemIcon>
              <ListItemText primary="Settings" />
            </ListItemButton>
          </ListItem>

          {/* <ListItem disablePadding>
            <ListItemButton onClick={toggleTheme}>
              <ListItemIcon>
                {currentTheme === 'dark' ? (
                  <Brightness7Icon sx={{ color: theme.palette.secondary.main }} />
                ) : (
                  <Brightness4Icon sx={{ color: theme.palette.secondary.main }} />
                )}
              </ListItemIcon>
              <ListItemText primary="Toggle Theme" />
            </ListItemButton>
          </ListItem> */}

          <ListItem disablePadding>
            <ListItemButton onClick={logout}>
              <ListItemIcon>
                <LogoutIcon sx={{ color: theme.palette.secondary.main }} />
              </ListItemIcon>
              <ListItemText primary="Log Out" />
            </ListItemButton>
          </ListItem>
        </List>
      </Drawer>
    </>
  )
}
