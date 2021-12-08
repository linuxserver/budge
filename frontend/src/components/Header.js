import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import LogoutIcon from '@mui/icons-material/Logout';
import api from '../api'
import {
  useNavigate,
} from "react-router-dom";

export default function ButtonAppBar() {
  const navigate = useNavigate()

  const logout = async () => {
    await api.logout()
    navigate('/')
    window.location.reload(false);
  }

  return (
    <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
      <Toolbar>
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          BudgE
        </Typography>
          <div>
            <IconButton
              size="large"
              aria-label="logout"
              aria-controls="menu-appbar"
              aria-haspopup="true"
              onClick={logout}
              color="inherit"
            >
              <LogoutIcon />
            </IconButton>
          </div>
      </Toolbar>
    </AppBar>
  );
}
