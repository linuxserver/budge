import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux"
import { createCategory, createCategoryGroup } from "../redux/slices/Categories";
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogActions from '@mui/material/DialogActions';

export default function NewCategoryDialog(props) {
  /**
   * Redux block
   */
  const dispatch = useDispatch()

  /**
   * State block
   */
  const [value, setValue] = useState('')

  const submitCategoryDialog = async () => {
    if (props.dialogState.mode === 'categoryGroup') {
      await dispatch(createCategoryGroup({
        name: value,
      }))
    } else if (props.dialogState.mode === 'category') {
      console.log(props)
      await dispatch(createCategory({
        name: value,
        categoryGroupId: props.dialogState.categoryGroupId,
      }))
    }

    setValue('')
    props.closeDialog()
  }

  return (
    <div style={{ maxWidth: '100%' }}>
      <Dialog open={props.dialogState.open} onClose={props.closeDialog}>
        <DialogTitle>Add a new {props.dialogState.mode === 'category' ? 'category' : 'category group'}</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            id="name"
            value={value}
            onChange={(event) =>
              setValue(event.target.value)
            }
            label="title"
            type="text"
            variant="standard"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={props.closeDialog}>Cancel</Button>
          <Button onClick={submitCategoryDialog}>Add</Button>
        </DialogActions>
      </Dialog>
    </div>
  )
}
