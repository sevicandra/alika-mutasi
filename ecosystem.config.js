module.exports = {
  apps: [
    {
      name: "main-app",
      script: "npm start",
      watch: false,
      autorestart: true,
      max_restarts: 10,
      restart_delay: 2000,
    },
    {
      name: "bull-worker",
      script: "npm run start:worker",
      watch: false,
      autorestart: true,
      max_restarts: 10,
      restart_delay: 2000,
    },
  ],
};
