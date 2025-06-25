const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const FacebookStrategy = require('passport-facebook').Strategy;
const User = require('../models/User');

// Serialize user for session storage
passport.serializeUser((user, done) => {
  done(null, user._id);
});

// Deserialize user from session
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

// Helper function to generate unique username
const generateUniqueUsername = async (baseUsername) => {
  let username = baseUsername;
  let counter = 1;
  
  while (await User.findOne({ userName: username })) {
    username = `${baseUsername}${counter}`;
    counter++;
    
    // Prevent infinite loop
    if (counter > 1000) {
      username = `${baseUsername}_${Date.now()}`;
      break;
    }
  }
  
  return username;
};

// Google OAuth Strategy - Only initialize if credentials are provided
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: `${process.env.SERVER_URL || 'http://localhost:5000'}/api/auth/google/callback`
  }, async (accessToken, refreshToken, profile, done) => {
    console.log('🔍 Google OAuth Strategy started');
    console.log('Profile ID:', profile.id);
    console.log('Profile email:', profile.emails?.[0]?.value);
    console.log('Profile display name:', profile.displayName);
    
    try {
      // Validate required data
      if (!profile.emails || profile.emails.length === 0) {
        console.error('❌ No email provided by Google OAuth');
        return done(new Error('No email provided by Google'), null);
      }

      const email = profile.emails[0].value;
      
      // Check if user already exists with this Google ID
      console.log('🔍 Checking for existing user with Google ID...');
      let user = await User.findOne({ googleId: profile.id });
      
      if (user) {
        console.log('✅ Found existing user with Google ID:', user._id);
        return done(null, user);
      }
      
      // Check if user exists with the same email
      console.log('🔍 Checking for existing user with email...');
      user = await User.findOne({ email: email });
      
      if (user) {
        console.log('✅ Found existing user with email, linking Google account...');
        // User exists with same email, link the Google account
        user.googleId = profile.id;
        user.provider = 'google';
        if (!user.avatar && profile.photos?.[0]?.value) {
          user.avatar = profile.photos[0].value;
        }
        await user.save();
        console.log('✅ Google account linked successfully');
        return done(null, user);
      }
      
      // Create new user
      console.log('🆕 Creating new user...');
      
      // Generate base username
      const baseUsername = profile.displayName 
        ? profile.displayName.replace(/[^a-zA-Z0-9]/g, '').toLowerCase()
        : email.split('@')[0].replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
      
      console.log('Base username:', baseUsername);
      
      // Generate unique username
      const uniqueUsername = await generateUniqueUsername(baseUsername);
      console.log('Unique username generated:', uniqueUsername);
      
      const newUserData = {
        googleId: profile.id,
        userName: uniqueUsername,
        email: email,
        firstName: profile.name?.givenName || '',
        lastName: profile.name?.familyName || '',
        avatar: profile.photos?.[0]?.value || '',
        provider: 'google',
        isActive: true
      };
      
      console.log('New user data:', newUserData);
      
      const newUser = new User(newUserData);
      await newUser.save();
      
      console.log('✅ New user created successfully:', newUser._id);
      
      return done(null, newUser);
    } catch (error) {
      console.error('❌ Google OAuth Strategy error:', error);
      console.error('Error details:', {
        name: error.name,
        message: error.message,
        code: error.code,
        stack: error.stack
      });
      
      // Provide more specific error information
      if (error.name === 'ValidationError') {
        console.error('User validation error:', error.errors);
      } else if (error.name === 'MongoError' || error.name === 'MongooseError') {
        console.error('Database connection or operation error');
      } else if (error.code === 11000) {
        console.error('Duplicate key error - username or email already exists');
      }
      
      return done(error, null);
    }
  }));
} else {
  console.log('Google OAuth not configured - missing GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET');
}

// Facebook OAuth Strategy - Only initialize if credentials are provided
if (process.env.FACEBOOK_APP_ID && process.env.FACEBOOK_APP_SECRET) {
  passport.use(new FacebookStrategy({
    clientID: process.env.FACEBOOK_APP_ID,
    clientSecret: process.env.FACEBOOK_APP_SECRET,
    callbackURL: `${process.env.SERVER_URL || 'http://localhost:5000'}/api/auth/facebook/callback`,
    profileFields: ['id', 'displayName', 'email', 'photos', 'name']
  }, async (accessToken, refreshToken, profile, done) => {
    try {
      console.log('Facebook OAuth profile:', profile);
      
      // Check if user already exists with this Facebook ID
      let user = await User.findOne({ facebookId: profile.id });
      
      if (user) {
        // User exists, return the user
        return done(null, user);
      }
      
      // Check if user exists with the same email
      if (profile.emails && profile.emails.length > 0) {
        user = await User.findOne({ email: profile.emails[0].value });
        
        if (user) {
          // User exists with same email, link the Facebook account
          user.facebookId = profile.id;
          user.provider = 'facebook';
          if (!user.avatar && profile.photos?.[0]?.value) {
            user.avatar = profile.photos[0].value;
          }
          await user.save();
          return done(null, user);
        }
      }
      
      // Create new user
      const newUser = new User({
        facebookId: profile.id,
        userName: profile.displayName || `user_${profile.id}`,
        email: profile.emails?.[0]?.value || '',
        firstName: profile.name?.givenName || '',
        lastName: profile.name?.familyName || '',
        avatar: profile.photos?.[0]?.value || '',
        provider: 'facebook',
        isActive: true
      });
      
      await newUser.save();
      
      return done(null, newUser);
    } catch (error) {
      console.error('Facebook OAuth error:', error);
      return done(error, null);
    }
  }));
} else {
  console.log('Facebook OAuth not configured - missing FACEBOOK_APP_ID or FACEBOOK_APP_SECRET');
}

module.exports = passport; 