import { useEffect } from 'react'
import { useSelector } from 'react-redux'
import { useParams } from 'react-router'
import AccountTable from '../components/AccountTable/AccountTable'
import { useNavigate } from 'react-router-dom'
import { accountsSelectors } from '../redux/slices/Accounts'
import AccountDetails from '../components/AccountDetails'
import Grid from '@mui/material/Grid'
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
    <Grid container>
      <Grid item xs={9}>
        <div style={{ maxWidth: '100%' }}>
          <Box>{account && <AccountTable accountId={params.accountId} account={account} />}</Box>
        </div>
      </Grid>

      <Grid
        item
        xs={3}
        sx={{
          backgroundColor: theme.palette.background.details,
          borderLeft: `1px solid ${theme.palette.action.disabledBackground}`,
        }}
      >
        <AccountDetails accountId={params.accountId} name={account.name} />
      </Grid>
    </Grid>
  )
}
