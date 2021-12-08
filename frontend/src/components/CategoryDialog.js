import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux"
import { createCategory, createCategoryGroup, updateCategory } from "../redux/slices/Categories";
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import Select from '@mui/material/Select';
import DialogActions from '@mui/material/DialogActions';
import MenuItem from '@mui/material/MenuItem';

export default function NewCategoryDialog(props) {
  /**
   * Redux block
   */
  const dispatch = useDispatch()
  const categoryGroups = useSelector(state => state.categories.categoryGroups)

  /**
   * State block
   */
  const [name, setName] = useState('')
  const [categoryGroup, setCategoryGroup] = useState('')
  const [headerText, setHeaderText] = useState('')

  React.useEffect(() => {
    setName(props.dialogState.name)
    setCategoryGroup(props.dialogState.categoryGroupId)

    switch (props.dialogState.mode) {
      case 'create':
        setHeaderText('Add new category')
        break
      case 'edit':
        setHeaderText("Edit category")
        break
    }
  }, [props.dialogState]);

  const submit = async () => {
    switch (props.dialogState.mode) {
      case 'create':
        await dispatch(createCategory({
          name: name,
          categoryGroupId: categoryGroup,
        }))
        break
      case 'edit':
        await dispatch(updateCategory({
          id: props.dialogState.categoryId,
          name: name,
          categoryGroupId: categoryGroup,
        }))
        break
    }

    setName('')
    props.closeDialog()
  }

  return (
    <div style={{ maxWidth: '100%' }}>
      <Dialog open={props.dialogState.categoryOpen} onClose={props.closeDialog}>
        <DialogTitle>{headerText}</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            fullWidth
            margin="dense"
            id="name"
            value={name}
            onChange={(event) =>
              setName(event.target.value)
            }
            label="title"
            type="text"
            variant="standard"
          />
          <Select
            fullWidth
            variant="standard"
            id="demo-simple-select-standard"
            value={categoryGroup}
            onChange={(event) => {
              console.log(event.target.value)
              setCategoryGroup(event.target.value)
            }}
          >
            {categoryGroups.map(group => {
              if (group.locked) {
                return
              }

              return <MenuItem value={group.id} key={group.id}>{group.name}</MenuItem>
            })}
          </Select>
        </DialogContent>
        <DialogActions>
          <Button onClick={props.closeDialog}>Cancel</Button>
          <Button onClick={submit}>{props.dialogState.mode === 'create' ? 'Add' : 'Edit'}</Button>
        </DialogActions>
      </Dialog>
    </div>
  )
}
