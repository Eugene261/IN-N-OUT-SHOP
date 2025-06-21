const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const FacebookStrategy = require('passport-facebook').Strategy;
const TwitterStrategy = require('passport-twitter').Strategy;
const TwitterOAuth2Strategy = require('passport-twitter-oauth2').Strategy;
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

// Google OAuth Strategy - Only initialize if credentials are provided
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: `${process.env.SERVER_URL || 'http://localhost:5000'}/api/auth/google/callback`
  }, async (accessToken, refreshToken, profile, done) => {
    try {
      console.log('Google OAuth profile:', profile);
      
      // Check if user already exists with this Google ID
      let user = await User.findOne({ googleId: profile.id });
      
      if (user) {
        // User exists, return the user
        return done(null, user);
      }
      
      // Check if user exists with the same email
      user = await User.findOne({ email: profile.emails[0].value });
      
      if (user) {
        // User exists with same email, link the Google account
        user.googleId = profile.id;
        user.provider = 'google';
        if (!user.avatar && profile.photos?.[0]?.value) {
          user.avatar = profile.photos[0].value;
        }
        await user.save();
        return done(null, user);
      }
      
      // Create new user
      const newUser = new User({
        googleId: profile.id,
        userName: profile.displayName || profile.emails[0].value.split('@')[0],
        email: profile.emails[0].value,
        firstName: profile.name?.givenName || '',
        lastName: profile.name?.familyName || '',
        avatar: profile.photos?.[0]?.value || '',
        provider: 'google',
        isActive: true
      });
      
      await newUser.save();
      
      return done(null, newUser);
    } catch (error) {
      console.error('Google OAuth error:', error);
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

// Twitter OAuth Strategy - Only initialize if credentials are provided
if (process.env.TWITTER_CONSUMER_KEY && process.env.TWITTER_CONSUMER_SECRET) {
  // Try OAuth 2.0 first (modern Twitter apps)
  passport.use('twitter-oauth2', new TwitterOAuth2Strategy({
    clientID: process.env.TWITTER_CONSUMER_KEY,
    clientSecret: process.env.TWITTER_CONSUMER_SECRET,
    callbackURL: `${process.env.SERVER_URL || 'http://localhost:5000'}/api/auth/twitter/callback`,
    scope: ['tweet.read', 'users.read']
  }, async (accessToken, refreshToken, profile, done) => {
    try {
      console.log('=== Twitter OAuth 2.0 Debug ===');
      console.log('Access Token:', accessToken ? 'Present' : 'Missing');
      console.log('Profile:', JSON.stringify(profile, null, 2));
      console.log('Profile ID:', profile.id);
      console.log('Profile Username:', profile.username);
      console.log('Profile Display Name:', profile.name);
      console.log('=== End Twitter Debug ===');
      
      // Check if user already exists with this Twitter ID
      let user = await User.findOne({ twitterId: profile.id });
      
      if (user) {
        console.log('Found existing user with Twitter ID:', user.userName);
        return done(null, user);
      }
      
      // Check if user exists with the same email (Twitter OAuth 2.0 might not provide email)
      let emailUser = null;
      if (profile.email) {
        console.log('Checking for existing user with email:', profile.email);
        emailUser = await User.findOne({ email: profile.email });
      }
      
      if (emailUser) {
        console.log('Found existing user with email, linking Twitter account');
        emailUser.twitterId = profile.id;
        emailUser.provider = 'twitter';
        if (!emailUser.avatar && profile.profile_image_url) {
          emailUser.avatar = profile.profile_image_url;
        }
        await emailUser.save();
        return done(null, emailUser);
      }
      
      // Create new user
      console.log('Creating new user for Twitter OAuth 2.0');
      const userName = profile.username || profile.name || `twitter_user_${profile.id}`;
      const email = profile.email || `${userName}@twitter-oauth.local`;
      
      const newUser = new User({
        twitterId: profile.id,
        userName: userName,
        email: email,
        firstName: profile.name?.split(' ')[0] || '',
        lastName: profile.name?.split(' ').slice(1).join(' ') || '',
        avatar: profile.profile_image_url || '',
        provider: 'twitter',
        isActive: true
      });
      
      console.log('New user data:', {
        twitterId: newUser.twitterId,
        userName: newUser.userName,
        email: newUser.email
      });
      
      await newUser.save();
      console.log('New Twitter user created successfully');
      
      return done(null, newUser);
    } catch (error) {
      console.error('=== Twitter OAuth 2.0 Error ===');
      console.error('Error type:', error.name);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
      console.error('=== End Twitter Error ===');
      return done(error, null);
    }
  }));
  
  // Fallback to OAuth 1.0a if OAuth 2.0 fails
  passport.use('twitter-oauth1', new TwitterStrategy({
    consumerKey: process.env.TWITTER_CONSUMER_KEY,
    consumerSecret: process.env.TWITTER_CONSUMER_SECRET,
    callbackURL: `${process.env.SERVER_URL || 'http://localhost:5000'}/api/auth/twitter/callback`,
    includeEmail: true
  }, async (token, tokenSecret, profile, done) => {
    try {
      console.log('=== Twitter OAuth Debug ===');
      console.log('Token:', token);
      console.log('Token Secret:', tokenSecret);
      console.log('Profile:', JSON.stringify(profile, null, 2));
      console.log('Profile ID:', profile.id);
      console.log('Profile Username:', profile.username);
      console.log('Profile Display Name:', profile.displayName);
      console.log('Profile Emails:', profile.emails);
      console.log('=== End Twitter Debug ===');
      
      // Check if user already exists with this Twitter ID
      let user = await User.findOne({ twitterId: profile.id });
      
      if (user) {
        console.log('Found existing user with Twitter ID:', user.userName);
        return done(null, user);
      }
      
      // Check if user exists with the same email (Twitter might not provide email)
      let emailUser = null;
      if (profile.emails && profile.emails.length > 0) {
        console.log('Checking for existing user with email:', profile.emails[0].value);
        emailUser = await User.findOne({ email: profile.emails[0].value });
      }
      
      if (emailUser) {
        console.log('Found existing user with email, linking Twitter account');
        // User exists with same email, link the Twitter account
        emailUser.twitterId = profile.id;
        emailUser.provider = 'twitter';
        if (!emailUser.avatar && profile.photos?.[0]?.value) {
          emailUser.avatar = profile.photos[0].value;
        }
        await emailUser.save();
        return done(null, emailUser);
      }
      
      // Create new user
      console.log('Creating new user for Twitter OAuth');
      const userName = profile.username || profile.displayName || `twitter_user_${profile.id}`;
      const email = profile.emails?.[0]?.value || `${userName}@twitter-oauth.local`;
      
      const newUser = new User({
        twitterId: profile.id,
        userName: userName,
        email: email,
        firstName: profile.displayName?.split(' ')[0] || '',
        lastName: profile.displayName?.split(' ').slice(1).join(' ') || '',
        avatar: profile.photos?.[0]?.value || '',
        provider: 'twitter',
        isActive: true
      });
      
      console.log('New user data:', {
        twitterId: newUser.twitterId,
        userName: newUser.userName,
        email: newUser.email
      });
      
      await newUser.save();
      console.log('New Twitter user created successfully');
      
      return done(null, newUser);
    } catch (error) {
      console.error('=== Twitter OAuth 1.0a Error ===');
      console.error('Error type:', error.name);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
      console.error('=== End Twitter Error ===');
      return done(error, null);
    }
  }));
} else {
  console.log('Twitter OAuth not configured - missing TWITTER_CONSUMER_KEY or TWITTER_CONSUMER_SECRET');
}

module.exports = passport; 