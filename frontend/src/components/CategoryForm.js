import React, { useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { createCategory, deleteCategory, updateCategory } from '../redux/slices/Categories'
import TextField from '@mui/material/TextField'
import Button from '@mui/material/Button'
import Select from '@mui/material/Select'
import MenuItem from '@mui/material/MenuItem'
import Popover from '@mui/material/Popover'
import Box from '@mui/material/Box'
import { bindPopover } from 'material-ui-popup-state/hooks'
import Stack from '@mui/material/Stack'
import { categoryGroupsSelectors, fetchCategories } from '../redux/slices/CategoryGroups'
import API from '../api'
import DeleteEnvelopeDialog from './DeleteEnvelopeDialog'
import { refreshBudgetCategory } from '../redux/slices/BudgetMonths'

export default function NewCategoryDialog(props) {
  /**
   * Redux block
   */
  const dispatch = useDispatch()
  const categoryGroups = useSelector(categoryGroupsSelectors.selectAll)
  const budgetId = useSelector(state => state.budgets.activeBudgetId)

  /**
   * State block
   */
  const [name, setName] = useState(props.name)
  const [categoryGroup, setCategoryGroup] = useState(props.categoryGroupId)
  const availableMonths = useSelector(state => state.budgets.availableMonths)

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)

  const submit = async () => {
    switch (props.mode) {
      case 'create':
        await dispatch(
          createCategory({
            name: name,
            categoryGroupId: categoryGroup,
          }),
        )
        break
      case 'edit':
        await dispatch(
          updateCategory({
            id: props.categoryId,
            name: name,
            order: props.order,
            categoryGroupId: categoryGroup,
          }),
        )
        break
    }

    props.popupState.close()
  }

  const openDeleteDialog = () => {
    setDeleteDialogOpen(true)
  }

  const closeDeleteDialog = () => {
    setDeleteDialogOpen(false)
  }

  const onCategoryDelete = async newCategory => {
    await dispatch(
      deleteCategory({
        categoryId: props.categoryId,
        newCategoryId: newCategory,
      }),
    )

    dispatch(fetchCategories())
    for (const month of availableMonths) {
      dispatch(refreshBudgetCategory({ month, categoryId: newCategory }))
    }

    setDeleteDialogOpen(false)
    props.popupState.close()
  }

  return (
    <Popover
      id={`popover-category-${props.categoryId}`}
      {...bindPopover(props.popupState)}
      anchorOrigin={{
        vertical: 'bottom',
        horizontal: 'left',
      }}
      BackdropProps={{ onClick: () => props.popupState.close() }}
    >
      <DeleteEnvelopeDialog
        isOpen={deleteDialogOpen}
        submit={onCategoryDelete}
        categoryId={props.categoryId}
        categoryGroups={categoryGroups}
        close={closeDeleteDialog}
      />

      <Box sx={{ px: 2, py: 1 }}>
        <TextField
          autoFocus
          fullWidth
          margin="dense"
          id="name"
          value={name}
          onChange={event => setName(event.target.value)}
          label="Name"
          type="text"
          variant="standard"
        />
        <Select
          fullWidth
          variant="standard"
          id="demo-simple-select-standard"
          value={categoryGroup}
          label="Category Group"
          onChange={event => {
            setCategoryGroup(event.target.value)
          }}
        >
          {categoryGroups.map(group => {
            if (group.locked) {
              return
            }

            const isSelected = group.id === props.categoryGroupId

            return (
              <MenuItem value={group.id} key={group.id} selected={isSelected}>
                {group.name}
              </MenuItem>
            )
          })}
        </Select>
        <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={0} sx={{ pt: 2 }}>
          {props.mode === 'edit' && (
            <Button size="small" onClick={openDeleteDialog}>
              Delete
            </Button>
          )}

          <Button size="small" onClick={submit}>
            {props.mode === 'create' ? 'Create' : 'Save'}
          </Button>
        </Stack>
      </Box>
    </Popover>
  )
}
