import { useParams } from 'react-router'
import AccountTable from '../components/AccountTable/AccountTable'

export default function Account(props) {
  const params = useParams()

  return (
    <div style={{ maxWidth: '100%' }}>
      <AccountTable accountId={params.accountId} />
    </div>
  )
}
