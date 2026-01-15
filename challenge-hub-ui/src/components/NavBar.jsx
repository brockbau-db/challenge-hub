import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  Chip,
  Menu,
  MenuItem,
  IconButton,
  useMediaQuery,
  useTheme,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
} from '@mui/material';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import EventIcon from '@mui/icons-material/Event';
import LeaderboardIcon from '@mui/icons-material/Leaderboard';
import GroupIcon from '@mui/icons-material/Group';
import MenuIcon from '@mui/icons-material/Menu';
import LogoutIcon from '@mui/icons-material/Logout';
import { useTeam } from '../contexts/TeamContext';

export default function NavBar() {
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const { teamInfo, clearTeam } = useTeam();
  const [anchorEl, setAnchorEl] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const handleTeamMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleTeamMenuClose = () => {
    setAnchorEl(null);
  };

  const handleChangeTeam = () => {
    handleTeamMenuClose();
    clearTeam();
    navigate('/login');
  };

  const navItems = [
    { label: 'Events', path: '/events', icon: <EventIcon /> },
  ];

  const isActive = (path) => location.pathname.startsWith(path);

  const renderNavItems = () => (
    <>
      {navItems.map((item) => (
        <Button
          key={item.path}
          color="inherit"
          onClick={() => navigate(item.path)}
          sx={{
            mx: 1,
            borderBottom: isActive(item.path) ? '2px solid white' : 'none',
            borderRadius: 0,
          }}
        >
          {item.label}
        </Button>
      ))}
    </>
  );

  const renderDrawer = () => (
    <Drawer
      anchor="left"
      open={drawerOpen}
      onClose={() => setDrawerOpen(false)}
    >
      <Box sx={{ width: 250 }} role="presentation">
        <Box sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
          <EmojiEventsIcon color="primary" />
          <Typography variant="h6">Challenge Hub</Typography>
        </Box>
        <Divider />
        <List>
          {navItems.map((item) => (
            <ListItem key={item.path} disablePadding>
              <ListItemButton
                selected={isActive(item.path)}
                onClick={() => {
                  navigate(item.path);
                  setDrawerOpen(false);
                }}
              >
                <ListItemIcon>{item.icon}</ListItemIcon>
                <ListItemText primary={item.label} />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
        <Divider />
        {teamInfo && (
          <List>
            <ListItem>
              <ListItemIcon><GroupIcon /></ListItemIcon>
              <ListItemText
                primary={teamInfo.name}
                secondary={`${teamInfo.members?.length || 0} members`}
              />
            </ListItem>
            <ListItem disablePadding>
              <ListItemButton onClick={handleChangeTeam}>
                <ListItemIcon><LogoutIcon /></ListItemIcon>
                <ListItemText primary="Change Team" />
              </ListItemButton>
            </ListItem>
          </List>
        )}
      </Box>
    </Drawer>
  );

  return (
    <AppBar position="sticky">
      <Toolbar>
        {isMobile && (
          <IconButton
            color="inherit"
            edge="start"
            onClick={() => setDrawerOpen(true)}
            sx={{ mr: 2 }}
          >
            <MenuIcon />
          </IconButton>
        )}

        <EmojiEventsIcon sx={{ mr: 1 }} />
        <Typography
          variant="h6"
          component="div"
          sx={{ cursor: 'pointer' }}
          onClick={() => navigate('/events')}
        >
          Challenge Hub
        </Typography>

        {!isMobile && (
          <Box sx={{ ml: 4, flexGrow: 1 }}>
            {renderNavItems()}
          </Box>
        )}

        {isMobile && <Box sx={{ flexGrow: 1 }} />}

        {teamInfo && !isMobile && (
          <>
            <Chip
              icon={<GroupIcon />}
              label={teamInfo.name}
              onClick={handleTeamMenuOpen}
              color="default"
              sx={{
                bgcolor: 'rgba(255,255,255,0.15)',
                color: 'white',
                '& .MuiChip-icon': { color: 'white' },
                cursor: 'pointer',
              }}
            />
            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={handleTeamMenuClose}
            >
              <MenuItem disabled>
                <Typography variant="body2" color="text.secondary">
                  {teamInfo.members?.join(', ')}
                </Typography>
              </MenuItem>
              <Divider />
              <MenuItem onClick={handleChangeTeam}>
                <LogoutIcon sx={{ mr: 1 }} fontSize="small" />
                Change Team
              </MenuItem>
            </Menu>
          </>
        )}
      </Toolbar>
      {renderDrawer()}
    </AppBar>
  );
}
