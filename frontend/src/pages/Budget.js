import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux"
import Button from '@mui/material/Button';
import BudgetTable from '../components/BudgetTable'
import NewCategoryDialog from "../components/NewCategoryDialog";

export default function Budget(props) {
  /**
   * Redux block
   */
  const dispatch = useDispatch()

  /**
   * State block
   */
  const [dialogState, setDialogState] = useState({
    open: false,
    mode: '',
    categoryGroupId: '',
  })

  const openCategoryGroupDialog = () => {
    setDialogState({
      open: true,
      mode: 'categoryGroup',
      categoryGroupId: '',
    })
  }

  const openCategoryDialog = (categoryGroupId) => {
    setDialogState({
      open: true,
      mode: 'category',
      categoryGroupId,
    })
  }

  const closeDialog = () => {
    setDialogState({
      ...dialogState,
      open: false,
    })
  }

  return (
    <div style={{ maxWidth: '100%' }}>
      <Button aria-describedby="category-group-add" variant="contained" onClick={openCategoryGroupDialog}>
        + Category Group
      </Button>

      <NewCategoryDialog dialogState={dialogState} closeDialog={closeDialog}/>

      <BudgetTable openCategoryDialog={openCategoryDialog}/>
    </div>
  )
}
