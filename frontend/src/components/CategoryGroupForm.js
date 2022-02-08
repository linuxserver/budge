import React, { useState } from 'react'
import { useDispatch } from 'react-redux'
import { createCategoryGroup, updateCategoryGroup } from '../redux/slices/CategoryGroups'
import TextField from '@mui/material/TextField'
import Button from '@mui/material/Button'
import { bindPopover } from 'material-ui-popup-state/hooks'
import Popover from '@mui/material/Popover'
import Box from '@mui/material/Box'
import Stack from '@mui/material/Stack'

export default function NewCategoryDialog(props) {
  /**
   * Redux block
   */
  const dispatch = useDispatch()

  /**
   * State block
   */
  const [name, setName] = useState(props.name)

  const submit = async () => {
    switch (props.mode) {
      case 'create':
        await dispatch(
          createCategoryGroup({
            name: name,
          }),
        )
        break
      case 'edit':
        await dispatch(
          updateCategoryGroup({
            id: props.categoryId,
            name: name,
            order: props.order,
          }),
        )
        break
    }

    props.popupState.close()
  }

  return (
    <Popover
      id={`popover-category-group-${props.categoryId}`}
      {...bindPopover(props.popupState)}
      anchorOrigin={{
        vertical: 'bottom',
        horizontal: 'left',
      }}
      BackdropProps={{ onClick: () => props.popupState.close() }}
    >
      <Box sx={{ px: 2, py: 1 }}>
        <TextField
          autoFocus
          fullWidth
          margin="dense"
          id="name"
          value={name}
          onChange={event => setName(event.target.value)}
          label="Group"
          type="text"
          variant="standard"
        />
        <Stack direction="row" justifyContent="flex-end" alignItems="center" spacing={2} sx={{ pt: 2 }}>
          <Button size="small" onClick={submit}>
            {props.mode === 'create' ? 'Create' : 'Save'}
          </Button>
        </Stack>
      </Box>
    </Popover>
  )
}
