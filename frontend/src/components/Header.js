import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import LogoutIcon from '@mui/icons-material/Logout';

export default function ButtonAppBar() {
  const logout = () => {
    document.cookie = 'jwt=; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
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
