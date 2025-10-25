# Quiniela Gallera Mobile App 🐓

Mobile application for cockfighting event predictions with real-time updates via polling.

## Features ✨

- 🔐 **User Authentication** - Register and login with Django backend
- 🎫 **Ticket System** - Use tickets to participate in events
- 🎯 **Make Predictions** - Predict winners for each fight in multiple rounds
- 📊 **Real-time Results** - View your predictions and points (auto-updates every 20 seconds)
- 🏆 **Live Rankings** - See top 10 participants (auto-updates every 30 seconds)
- 🔄 **Auto-refresh** - Events update automatically every 15 seconds
- 👤 **User Profile** - View tickets and account information

## Tech Stack 🛠️

- **Frontend**: React Native with Expo
- **Navigation**: React Navigation (Native Stack)
- **Backend**: Django REST API hosted on PythonAnywhere
- **Storage**: AsyncStorage for local user data
- **HTTP Client**: Axios
- **Real-time Updates**: Polling (15-30 second intervals)

## Prerequisites 📋

- Node.js 14+ and npm/yarn
- Expo CLI (`npm install -g expo-cli`)
- Android Studio (for Android) or Xcode (for iOS)
- Django backend running on PythonAnywhere

## Installation 🚀

### 1. Clone and Install Dependencies

```bash
# Clone the repository
git clone <repository-url>
cd QuinielaGallera

# Install dependencies
npm install
```

### 2. Backend Configuration

The app is configured to connect to:
```
https://cognitech.pythonanywhere.com
```

If you need to change the backend URL, edit `src/api/apiService.js`:

```javascript
const BASE_URL = 'https://your-backend-url.com';
```

### 3. Run the App

```bash
# Start Expo development server
npm start

# Or run directly on platform
npm run android  # For Android
npm run ios      # For iOS
```

## Project Structure 📁

```
QuinielaGallera/
├── App.js                          # Main app entry with navigation
├── src/
│   ├── api/
│   │   └── apiService.js          # API calls + polling utilities
│   ├── context/
│   │   └── AuthContext.js         # User authentication context
│   ├── screens/
│   │   ├── LoginScreen.js         # Login screen
│   │   ├── SignUpScreen.js        # Registration screen
│   │   ├── HomeScreen.js          # Main screen with event info
│   │   ├── PredictionsScreen.js   # Make predictions for fights
│   │   ├── ResultsScreen.js       # View prediction results
│   │   ├── RankingsScreen.js      # View rankings
│   │   └── ProfileScreen.js       # User profile
│   └── components/                 # Reusable components
├── assets/                         # Images, fonts, etc.
├── package.json                    # Dependencies
└── app.json                        # Expo configuration
```

## How It Works 🎮

### Admin Workflow (Django Dashboard)

1. **Create Event** - Name, date, location
2. **Register Teams** - Assign numbers to team names
   - Example: #1 = "Los Gallos Rojos"
3. **Create Rounds** - Add multiple rounds
4. **Add Fights** - Enter team numbers (e.g., "1 vs 3")
5. **Activate Event** - Mark as current
6. **Enter Results** - Update fight winners
7. **Toggle Visibility** - Show/hide results and rankings

### User Workflow (Mobile App)

1. **Register/Login** - Create account or sign in
2. **View Active Event** - See current event with all rounds
3. **Use Ticket** - Spend 1 ticket to participate
4. **Make Predictions** - Select winner for each fight
5. **Submit** - Send all predictions
6. **View Results** - Check correct/incorrect predictions (when visible)
7. **Check Rankings** - See top 10 (when visible)

## API Endpoints Used 🔌

### Authentication
- `POST /api/accounts/register/` - Register new user
- `POST /api/accounts/login/` - Login user

### User Management
- `GET /api/accounts/tickets/?user_id=X` - Get user tickets
- `POST /api/accounts/use-ticket/` - Use a ticket

### Events
- `GET /eventos/api/current-event/` - Get active event
- `GET /eventos/api/check-participation/?user_id=X&event_id=Y` - Check if participated

### Predictions
- `POST /eventos/api/submit-predictions/` - Submit user predictions

### Results & Rankings
- `GET /eventos/api/user-results/?user_id=X` - Get user results
- `GET /eventos/api/rankings/<event_id>/` - Get rankings

## Real-time Polling ⏱️

The app uses polling to keep data fresh:

- **Event Updates**: Every 15 seconds
- **User Results**: Every 20 seconds  
- **Rankings**: Every 30 seconds

Polling automatically starts when screens mount and stops when they unmount.

## Building for Production 📱

### Android APK

```bash
# Install EAS CLI
npm install -g eas-cli

# Configure EAS
eas build:configure

# Build APK
eas build --platform android --profile production
```

### iOS App

```bash
# Build iOS
eas build --platform ios --profile production
```

## Environment Variables 🔐

For production, consider using environment variables:

```javascript
// .env file (not in repo)
API_BASE_URL=https://your-production-api.com
```

Then use with expo-constants:

```javascript
import Constants from 'expo-constants';
const BASE_URL = Constants.manifest?.extra?.apiUrl;
```

## Team Number System 🔢

**Important**: Team numbers are EVENT-SPECIFIC!

```
Event 1: "Torneo Navideño"
  #1 → "Los Gallos Rojos"
  #2 → "Las Águilas"

Event 2: "Año Nuevo"
  #1 → "Los Tigres"      ← Different team!
  #2 → "Los Valientes"
```

Admin enters fights by number (1 vs 2), app shows names automatically.

## Troubleshooting 🔧

### "Network request failed"
- Check backend is running
- Verify BASE_URL in `apiService.js`
- Check device/emulator internet connection

### "No active event"
- Admin must activate an event in Django dashboard
- Check `current=True` is set for one event

### Results/Rankings not showing
- Admin must toggle visibility in dashboard
- Check `results_visible` and `ranking_visible` flags

### Polling not working
- Check console for errors
- Verify cleanup functions are running
- Restart app if needed

## Contributing 🤝

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## Support 📧

For issues or questions:
- Check existing issues on GitHub
- Contact: [your-email@example.com]

## License 📄

This project is proprietary software. All rights reserved.

---

**Built with ❤️ for Quiniela Gallera**