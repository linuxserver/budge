import React, { useState } from 'react'
import Button from '@mui/material/Button'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import { useSelector } from 'react-redux'
import MenuItem from '@mui/material/MenuItem'
import { categoriesSelectors } from '../redux/slices/Categories'
import Select from '@mui/material/Select'

export default function DeleteEnvelopeDialog(props) {
  /**
   * State block
   */
  const [newCategory, setNewCategory] = useState('')
  const categories = useSelector(categoriesSelectors.selectAll)

  const handleDeleteEvenlope = async () => {
    props.submit(newCategory)
    props.close()
  }

  return (
    <div>
      <Dialog open={props.isOpen} disableEscapeKeyDown={true} onBackdropClick={() => false} maxWidth="xs">
        <DialogTitle>Delete Envelope</DialogTitle>
        <DialogContent>
          Select a new category for all existing transactions and budgets
          <Select
            fullWidth
            variant="standard"
            id="demo-simple-select-standard"
            value={newCategory}
            label="New Category"
            onChange={event => {
              setNewCategory(event.target.value)
            }}
          >
            {categories.map(category => {
              if (category.locked || category.id === props.categoryId) {
                return
              }

              return (
                <MenuItem value={category.id} key={category.id}>
                  {category.name}
                </MenuItem>
              )
            })}
          </Select>
        </DialogContent>

        <DialogActions>
          <Button onClick={handleDeleteEvenlope}>Delete</Button>
          <Button onClick={props.close}>Cancel</Button>
        </DialogActions>
      </Dialog>
    </div>
  )
}
