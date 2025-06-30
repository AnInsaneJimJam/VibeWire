# VibeWire 🌐
### 1st and 2nd-Degree Hangout Planning App

**Authors:** Anand Bansal, Aayush Bhoj

---

## 📱 About

VibeWire is a social networking app designed to help you plan hangouts with your connections. Connect with people in your network through 1st and 2nd-degree connections, visualize your social graph, and organize memorable hangouts with friends and acquaintances.

Perfect for college students, professionals, and anyone looking to expand their social circle and plan engaging activities with their network.

---

## ✨ Features

### 🔐 **Secure Authentication**
- Phone number verification with OTP
- Secure user registration and login
- Password management and security

### 👥 **Smart Connection Management**
- Select and manage your 1st-degree connections
- Discover 2nd-degree connections through mutual friends
- View detailed profiles with education and background info
- Connection recommendations based on mutual networks

### 🗺️ **Interactive Network Visualization**
- Visual graph representation of your social network
- See how you're connected to different people
- Explore connection paths and mutual friends
- Interactive map of your social circle

### 📋 **Hangout Planning**
- Plan and organize hangouts with your connections
- Coordinate activities with multiple people
- Manage your social calendar
- Track upcoming and past events

### 👤 **Rich User Profiles**
- Customizable profile with bio and photo
- Education details (course, year, hostel/bhawan)
- Connection statistics and network insights
- Privacy controls and settings

---

## 🛠️ Tech Stack

- **Frontend:** React Native with Expo
- **Language:** TypeScript
- **Navigation:** Expo Router
- **UI Components:** Custom React Native components
- **Image Handling:** Expo ImagePicker
- **Authentication:** OTP-based phone verification
- **State Management:** React Hooks (useState, useEffect)

---

##  Getting Started

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- Expo CLI
- iOS Simulator or Android Emulator (or physical device)

### Installation

1. **Clone the repository**
   \`\`\`bash
   git clone https://github.com/yourusername/vibewire.git
   cd vibewire
   \`\`\`

2. **Install dependencies**
   Go to frontend/VibeWire and then
   \`\`\`bash
   npm install
   # or
   yarn install
   \`\`\`

4. **Start the development server**
   \`\`\`bash
   npx expo start
   \`\`\`

5. **Run on device/simulator**
   - Press `i` for iOS simulator
   - Press `a` for Android emulator
   - Scan QR code with Expo Go app on your phone

---

## 📱 App Flow

### 1. **Authentication Flow**
\`\`\`
Phone Number Input → OTP Verification → Account Creation
\`\`\`

### 2. **Onboarding Flow**
\`\`\`
OTP Verification → Connection Selection → Profile Setup → Main App
\`\`\`

### 3. **Main App Navigation**
\`\`\`
Profile Tab ← → Map/Graph Tab ← → Hangouts Tab
\`\`\`

---

## 🎯 Key Screens

### **OTP Verification** (`otp-verify.tsx`)
- 6-digit OTP input with auto-focus
- Resend functionality with countdown timer
- Mock OTP generation for development
- Secure verification process

### **Connection Selection** (`connections-select.tsx`)
- Browse and select up to 8 connections
- Filter by 1st-degree connections
- View detailed connection profiles
- Smart selection with connection limits

### **Profile Management** (`profile.tsx`)
- Edit personal information and bio
- View connection statistics
- Manage selected connections
- Password change functionality
- Interactive profile customization

### **Network Visualization** (`Graph.tsx`)
- Visual representation of social network
- Interactive connection mapping
- Degree-based connection filtering

### **Hangout Planning** (`hangouts.tsx`)
- Plan and organize social events
- Coordinate with multiple connections
- Manage hangout calendar

---

## 🏗️ Project Structure

VibeWire/
├── app/
│   ├── (tabs)/                 # Tab-based navigation screens
│   ├── +not-found.tsx         # 404/Not found screen
│   ├── Graph.tsx              # Network visualization screen
│   ├── _layout.tsx            # Root layout configuration
│   ├── connections-select.tsx  # Connection selection screen
│   ├── hangouts.tsx           # Hangout planning screen
│   ├── login.tsx              # User login screen
│   ├── otp-verify.tsx         # OTP verification screen
│   ├── profile.tsx            # User profile screen
│   ├── signup.tsx             # User registration screen
│   └── welcome.tsx            # Welcome/onboarding screen
├── assets/                    # Images and static assets
├── components/                # Reusable components

---

## 🎨 Design Features

- **Modern UI/UX** with clean, intuitive design
- **Responsive layouts** that work on all screen sizes
- **Smooth animations** and transitions
- **Consistent color scheme** with purple accent (#6C5CE7)
- **Accessibility support** with proper labels and navigation

---

## 🔧 Development Features

- **TypeScript** for type safety and better development experience
- **Modular architecture** with reusable components
- **Mock data** for development and testing
- **Console logging** for debugging and development
- **Error handling** with user-friendly alerts
