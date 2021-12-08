import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux"
import Button from '@mui/material/Button';
import BudgetTable from '../components/BudgetTable'
import BudgetDetails from '../components/BudgetDetails'
import CategoryGroupDialog from "../components/CategoryGroupDialog";
import CategoryDialog from "../components/CategoryDialog";
import Grid from '@mui/material/Grid';

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
      <CategoryDialog dialogState={dialogState} closeDialog={closeDialog}/>
      <CategoryGroupDialog dialogState={dialogState} closeDialog={closeDialog}/>

      <Grid container spacing={2}>
        <Grid item xs={9}>
          <BudgetTable
            openCategoryDialog={openCategoryDialog}
            openCategoryGroupDialog={openCategoryGroupDialog}
          />
        </Grid>
        <Grid item xs={3}>
          <BudgetDetails />
        </Grid>
      </Grid>
    </div>
  )
}
