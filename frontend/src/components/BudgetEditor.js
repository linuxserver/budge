import * as React from 'react';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import { setUser, login, logout } from '../redux/slices/Users';
import { fetchBudgets } from '../redux/slices/Budgets';
import api from '../api'
import { connect } from 'react-redux'

class LoginDialog extends React.Component {
  constructor(props) {
    super(props)

    this.state = {
      open: false,
      email: '',
      password: '',
    }

    this.handleLogin = this.handleLogin.bind(this);
    this.userCreation = this.userCreation.bind(this);
  }

  async componentDidMount() {
    try {
      const response = await api.ping()
      this.props.setUser(response)
      this.initUser()
    } catch (err) {
      this.props.logout()
      this.setState({
        open: true,
      })
    }
  }

  async initUser() {
    await this.props.fetchBudgets()
    if (store.getState().budgets.budgets.length === 0) {

    }
  }

  async handleLogin() {
    const { email, password } = this.state
    this.props.login({
      email,
      password,
    })
  }

  async userCreation() {
    const { email, password } = this.state
    await api.createUser(
      email,
      password,
    )

    this.props.login({
      email,
      password,
    })
  }

  linkState(key) {
    return event => {
      this.setState({
        [key]: event.target.value
      })
    }
  }

  render() {
    return (
      <div>
        <Dialog open={this.state.open} disableEscapeKeyDown={true} onBackdropClick={() => false}>
          <DialogTitle>Login</DialogTitle>
          <DialogContent>
            <DialogContentText>
              Login to start budgeting!
            </DialogContentText>
            <TextField
              autoFocus
              margin="dense"
              id="email"
              label="Email Address"
              type="email"
              fullWidth
              variant="standard"
              onChange={this.linkState('email')}
            />
            <TextField
              margin="dense"
              id="password"
              label="Password"
              type="password"
              fullWidth
              variant="standard"
              onChange={this.linkState('password')}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={this.handleLogin}>Login</Button>
            <Button onClick={this.userCreation}>Create Account</Button>
          </DialogActions>
        </Dialog>
      </div>
    );
  }
}

export default connect(state => ({
  user: state.user,
}), {
  login,
  logout,
  setUser,
  fetchBudgets,
})(LoginDialog);
