import Button from '@mui/material/Button'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogContentText from '@mui/material/DialogContentText'
import DialogTitle from '@mui/material/DialogTitle'

export default function AlertDialog(props) {
  return (
    <Dialog
      open={props.open}
      onClose={props.handleClose}
      aria-labelledby="alert-dialog-title"
      aria-describedby="alert-dialog-description"
    >
      {
        props.title && (
          <DialogTitle id="alert-dialog-title">
            {props.title}
          </DialogTitle>
        )
      }

      <DialogContent>
        <DialogContentText id="alert-dialog-description">
          {props.body}
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={props.handleClose} autoFocus>
          Close
        </Button>
      </DialogActions>
    </Dialog>
  )
}
