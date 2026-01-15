import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ThemeProvider, createTheme } from '@mui/material/styles'
import CssBaseline from '@mui/material/CssBaseline'
import { TeamProvider } from './contexts/TeamContext'
import { EventProvider } from './contexts/EventContext'
import App from './App.jsx'

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
})

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <TeamProvider>
        <EventProvider>
          <App />
        </EventProvider>
      </TeamProvider>
    </ThemeProvider>
  </StrictMode>,
)
