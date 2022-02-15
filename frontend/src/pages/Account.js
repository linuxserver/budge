import { useEffect } from 'react'
import { useSelector } from 'react-redux'
import { useParams } from 'react-router'
import AccountTable from '../components/AccountTable/AccountTable'
import { useNavigate } from 'react-router-dom'
import { accountsSelectors } from '../redux/slices/Accounts'
import AccountDetails from '../components/AccountDetails'
import Stack from '@mui/material/Stack'
import Box from '@mui/material/Box'
import { useTheme } from '@mui/styles'

export default function Account(props) {
  const navigate = useNavigate()
  const theme = useTheme()

  const params = useParams()
  const account = useSelector(state => accountsSelectors.selectById(state, params.accountId))

  useEffect(() => {
    if (!account) {
      navigate('/')
    }
  }, [])

  return (
    <Stack
      direction="row"
      justifyContent="space-between"
      alignItems="flex-start"
      sx={{ width: '100%', height: '100%' }}
    >
      <Box
        sx={{
          backgroundColor: theme.palette.background.tableBody,
          width: '100%',
        }}
      >
        {account && <AccountTable accountId={params.accountId} account={account} />}
      </Box>

      <Box
        sx={{
          backgroundColor: theme.palette.background.details,
          borderLeft: `1px solid ${theme.palette.action.disabledBackground}`,
          width: 600,
          height: '100%',
        }}
      >
        <AccountDetails accountId={params.accountId} name={account.name} />
      </Box>
    </Stack>
  )
}
