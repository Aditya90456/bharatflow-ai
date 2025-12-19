# MongoDB Cleanup Guide

Since BharatFlow now uses SQLite instead of MongoDB, you can optionally remove MongoDB from your system if you're not using it for other projects.

## Uninstalling MongoDB (Optional)

### Windows
1. Open "Add or Remove Programs"
2. Search for "MongoDB"
3. Uninstall MongoDB Server and MongoDB Compass (if installed)

### macOS (Homebrew)
```bash
brew services stop mongodb-community
brew uninstall mongodb-community
brew cleanup
```

### Ubuntu/Debian
```bash
sudo systemctl stop mongod
sudo apt-get purge mongodb-org*
sudo rm -r /var/log/mongodb
sudo rm -r /var/lib/mongodb
```

## Removing Node.js MongoDB Dependencies

The mongoose dependency has already been removed from package.json. To clean up:

```bash
cd backend
npm install  # This will remove mongoose from node_modules
```

## Benefits of SQLite Migration

✅ **No Server Required** - SQLite runs in-process  
✅ **Zero Configuration** - Database file created automatically  
✅ **Lightweight** - Single file database  
✅ **Fast** - Excellent performance for application needs  
✅ **Portable** - Easy to backup and deploy  
✅ **Reliable** - ACID compliant and battle-tested  

## Database Location

Your SQLite database will be created at:
```
backend/bharatflow.db
```

This file contains all your traffic data, incidents, analytics, and AI analysis logs.