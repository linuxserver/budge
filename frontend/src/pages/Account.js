import { useEffect } from 'react'
import { useSelector } from 'react-redux'
import { useParams } from 'react-router'
import AccountTable from '../components/AccountTable/AccountTable'
import { useNavigate } from 'react-router-dom'
import { accountsSelectors } from '../redux/slices/Accounts'

export default function Account(props) {
  const navigate = useNavigate()

  const params = useParams()
  const account = useSelector(state => accountsSelectors.selectById(state, params.accountId))

  useEffect(() => {
    if (!account) {
      navigate('/')
    }
  }, [])

  return (
    <div style={{ maxWidth: '100%' }}>{account && <AccountTable accountId={params.accountId} account={account} />}</div>
  )
}
