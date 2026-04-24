module.exports = {
  apps: [{
    name: "supabase-mcp",
    script: "C:\\Kinetic_Core\\supabase-mcp-bridge\\server.js",
    watch: false,
    restart_delay: 5000,
    env: {
      NODE_ENV: "production",
      SUPABASE_URL: "raxpmeltyxmtiihxoxpa.supabase.co",
      SUPABASE_KEY: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJheHBtZWx0eXhtdGlpaHhveHBhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY3ODI5MDIsImV4cCI6MjA5MjM1ODkwMn0.UScReg6BG4pimbjMeIE7NB2glcpdbgUbDLnDhDLURPM"
    }
  }]
};
