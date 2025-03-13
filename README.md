# Medicine Dispenser System

This project is a starter template for building modern web applications using Vite, React, Tailwind CSS, Firebase, Material-UI (MUI), and styled-components. It provides a solid foundation for developing responsive and interactive user interfaces.

## Table of Contents

- [Description](#description)
- [Installation Instructions](#installation-instructions)
- [Usage Examples](#usage-examples)
- [Contribution Guidelines](#contribution-guidelines)
- [Licensing Information](#licensing-information)

## Description

This project leverages the power of Vite for fast development, React for building user interfaces, Tailwind CSS for utility-first styling, Firebase for backend services, and Material-UI for pre-built components. It is designed to help developers quickly set up a modern web application with a clean and responsive design.

## Installation Instructions

To get started with this project, follow these steps:

1. **Clone the repository:**

   ```bash
   git clone https://github.com/maliciousmuffins3/medicine-dispenser-system
    ```

2. **Navigate to the project directory:**

   ```bash
   cd medicine-dispenser-system

3. **Install the dependencies:**
Make sure you have Node.js installed. Then run:

   ```bash
   npm install
   ```

4. **Install additional dependencies:**
Make sure you have Node.js installed. Then run:

   ```bash
   npm install tailwindcss@latest postcss@latest autoprefixer@latest
   npm install @mui/material @emotion/react @emotion/styled @mui/icons-material
   npm install firebase dotenv
   ```


5. **Set up Tailwind CSS:**
Initialize Tailwind CSS by creating the configuration files:

   ```bash
   npx tailwindcss init -p
   ```

Then, add the following paths to the content array in tailwind.config.js:

   ```bash

    module.exports = {
        content: [
        "./index.html",
        "./src/**/*.{js,jsx,ts,tsx}",
    ],
    theme: {
        extend: {},
    },
    plugins: [],
    }

   ```
   Add the Tailwind directives to your CSS file (e.g., src/index.css):

    @tailwind base;
    @tailwind components;
    @tailwind utilities;

5. **Set up Firebase:**

- Create a Firebase project at Firebase Console.
- Add a web app to your Firebase project and copy the Firebase configuration.
- Create a ```env```. file in the root of your project and add your Firebase configuration:

```
VITE_FIREBASE_API_KEY=YOUR_API_KEY
VITE_FIREBASE_AUTH_DOMAIN=YOUR_AUTH_DOMAIN
VITE_FIREBASE_DATABASE_URL=YOUR_DATABASE_URL
VITE_FIREBASE_PROJECT_ID=YOUR_PROJECT_ID
VITE_FIREBASE_STORAGE_BUCKET=YOUR_STORAGE_BUCKET
VITE_FIREBASE_MESSAGING_SENDER_ID=YOUR_MESSAGING_SENDER_ID
VITE_FIREBASE_APP_ID=YOUR_APP_ID
VITE_FIREBASE_MEASUREMENT_ID=YOUR_MEASUREMENT_ID
```

5. **Run the development server:**
```
npm run dev
```
 
You're good to go.


# 💻 My Tech Stack  
✅ **Frontend**: HTML, CSS, JavaScript, React, Redux  
✅ **Backend**: Node.js, Express, MySQL, Firebase, REST APIs  
✅ **Hardware & IoT**: Arduino, ESP32  

## 🎯 About Me  
- 📚 Computer Engineering student  
- 🚀 Passionate about learning new technologies  
- 💡 Interested in building innovative software & hardware solutions  
- 🌱 Currently improving my skills in **full-stack development**  

## 📫 Let's Connect!  
Feel free to reach out and collaborate:  
- 📧 Email: [Matthew Roxas](mailto:matthewroxas29@gmail.com)  
- 🔗 [LinkedIn](https://www.linkedin.com/in/matthew-roxas-943ab42a9/)
- 🐦 [Twitter](#)

Let's build something amazing together! 🚀  
