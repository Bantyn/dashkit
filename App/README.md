# Clothify Staff Android UI

Dark-theme Expo React Native app for store staff.

## Structure

* `App.tsx`: entry point
* `src/StaffApp.tsx`: app shell and tab flow
* `src/screens/*`: screen-level UI
* `src/components/*`: reusable cards and headers
* `src/data/mockData.ts`: local mock data only

## Current scope

* UI only
* No backend
* No login API
* No database sync

## Android release path later

This Expo app can later be built into APK/AAB for direct Android install and store distribution such as APKPure.

Example future build flow:

```bash
npm install
npx eas build -p android --profile production
```

## Run locally later

```bash
npm install
npm run android
```


