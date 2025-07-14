# Running and Sharing Your React App

## Step 1: Start the Development Server

Run one of these commands in your terminal from the project root directory:

```bash
npm start
```

or

```bash
npm run dev
```

This will start the development server, typically on http://localhost:3000

## Step 2: Share Your Local Server with Others

There are several tools you can use to create a public URL for your locally running server:

### Option 1: Using ngrok

1. Install ngrok if you haven't already:

   ```bash
   npm install -g ngrok
   ```

2. Start ngrok pointing to your React app's port:

   ```bash
   ngrok http 3000
   ```

3. ngrok will provide a public URL (like https://a1b2c3d4.ngrok.io) that you can share with others.

### Option 2: Using localtunnel

1. Install localtunnel:

   ```bash
   npm install -g localtunnel
   ```

2. Start localtunnel pointing to your React app's port:

   ```bash
   lt --port 3000
   ```

3. localtunnel will provide a public URL that you can share with others.

### Option 3: Using Vercel or Netlify for Temporary Deployment

If you want a more stable solution, you can quickly deploy your app to Vercel or Netlify:

#### Vercel

```bash
npm install -g vercel
vercel
```

#### Netlify

```bash
npm install -g netlify-cli
netlify deploy
```

## Notes

- These sharing methods are temporary and meant for development/testing purposes
- For production sharing, consider a proper deployment to Vercel, Netlify, or another hosting service
- Remember that your backend services (if any) need to be accessible to the public URL as well
