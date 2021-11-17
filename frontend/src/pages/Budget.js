import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux"
import Button from '@mui/material/Button';
import BudgetTable from '../components/BudgetTable'
import CategoryGroupDialog from "../components/CategoryGroupDialog";
import CategoryDialog from "../components/CategoryDialog";

export default function Budget(props) {
  /**
   * Redux block
   */
  const dispatch = useDispatch()

  /**
   * State block
   */
  const [dialogState, setDialogState] = useState({
    name: '',
    categoryOpen: false,
    categoryGroupOpen: false,
    mode: '',
    categoryId: '',
    categoryGroupId: '',
  })

  const openCategoryGroupDialog = ({name, categoryGroupId}) => {
    setDialogState({
      name,
      categoryOpen: false,
      categoryGroupOpen: true,
      mode: categoryGroupId ? 'edit' : 'create',
      categoryGroupId,
    })
  }

  const openCategoryDialog = ({name, categoryId, categoryGroupId}) => {
    setDialogState({
      name,
      categoryOpen: true,
      categoryGroupOpen: false,
      mode: categoryId ? 'edit' : 'create',
      categoryId,
      categoryGroupId,
    })
  }

  const closeDialog = () => {
    setDialogState({
      ...dialogState,
      name: '',
      categoryOpen: false,
      categoryGroupOpen: false,
    })
  }

  return (
    <div style={{ maxWidth: '100%' }}>
      <Button aria-describedby="category-group-add" variant="contained" onClick={openCategoryGroupDialog}>
        + Category Group
      </Button>

      <CategoryDialog dialogState={dialogState} closeDialog={closeDialog}/>
      <CategoryGroupDialog dialogState={dialogState} closeDialog={closeDialog}/>

      <BudgetTable
        openCategoryDialog={openCategoryDialog}
        openCategoryGroupDialog={openCategoryGroupDialog}
      />
    </div>
  )
}
