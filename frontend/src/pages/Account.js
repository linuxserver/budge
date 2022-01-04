import React, { useState } from "react";
import { useParams } from "react-router";
import AccountTable from '../components/AccountTable/AccountTable'

export default function Account(props) {
  const params = useParams()
  const accountId = params.accountId

  return (
    <div style={{ maxWidth: '100%' }}>
      <AccountTable accountId={accountId} />
    </div>
  )
}
