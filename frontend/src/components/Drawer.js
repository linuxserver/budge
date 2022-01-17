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
import PopupState, { bindTrigger, bindMenu } from 'material-ui-popup-state'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import { accountsSelectors, editAccount, fetchAccounts } from '../redux/slices/Accounts'
import { selectActiveBudget } from '../redux/slices/Budgets'

const drawerWidth = 300

export default function AppDrawer(props) {
  const dispatch = useDispatch()
  const theme = useTheme()
  const navigate = useNavigate()

  const menuItems = [
    { name: 'Budget', path: '/' },
    // { name: 'All Accounts', path: '/accounts'},
  ]

  /**
   * State block
   */
  const [accountsListOpen, setAccountsListOpen] = useState({ BUDGET: true, TRACKING: true })
  const [selectedItem, setSelectedItem] = useState('Budget')

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
                    <ExpandMore color="secondary" fontSize="small" />
                  ) : (
                    <ChevronRightIcon color="secondary" fontSize="small" />
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
          {popupState => (
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
            <ListItemIcon style={{ minWidth: '40px' }}>
              {index % 2 === 0 ? <AccountBalanceIcon color="secondary" /> : <MailIcon color="secondary" />}
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
              color="secondary"
              style={{
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
              <LogoutIcon color="secondary" />
            </ListItemIcon>
            <ListItemText primary="Log Out" onClick={logout} />
          </ListItemButton>
        </ListItem>
      </List>
    </Drawer>
  )
}
