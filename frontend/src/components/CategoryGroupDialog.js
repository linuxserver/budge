import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux"
import { createCategory, createCategoryGroup, updateCategory, updateCategoryGroup } from "../redux/slices/Categories";
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
        setHeaderText('Add new category group')
        break
      case 'edit':
        setHeaderText("Edit category group")
        break
    }
  }, [props.dialogState]);

  console.log(props.dialogState)

  const submit = async () => {
    switch (props.dialogState.mode) {
      case 'create':
        await dispatch(createCategoryGroup({
          name: name,
        }))
        break
      case 'edit':
        await dispatch(updateCategoryGroup({
          id: props.dialogState.categoryGroupId,
          name: name,
        }))
        break
    }

    setName('')
    props.closeDialog()
  }

  return (
    <div style={{ maxWidth: '100%' }}>
      <Dialog open={props.dialogState.categoryGroupOpen} onClose={props.closeDialog}>
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
        </DialogContent>
        <DialogActions>
          <Button onClick={props.closeDialog}>Cancel</Button>
          <Button onClick={submit}>Add</Button>
        </DialogActions>
      </Dialog>
    </div>
  )
}
