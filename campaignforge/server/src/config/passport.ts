import passport from 'passport';
import { Strategy as GoogleStrategy, VerifyCallback } from 'passport-google-oauth20';
import { env } from './env.js';
import { User } from '../models/User.js';

passport.use(
  new GoogleStrategy(
    {
      clientID: env.google.clientId,
      clientSecret: env.google.clientSecret,
      callbackURL: env.google.callbackUrl,
      scope: ['profile', 'email'],
    },
    async (accessToken: string, refreshToken: string, profile: any, done: VerifyCallback) => {
      try {
        const email = profile.emails?.[0]?.value;
        if (!email) {
          return done(new Error('No email returned from Google'), undefined);
        }

        let user = await User.findOne({ email });

        if (user) {
          if (user.authProvider === 'local') {
            user.authProvider = 'google';
            user.googleId = profile.id;
            user.isEmailVerified = true;
            await user.save();
          }
        } else {
          user = await User.create({
            email,
            name: profile.displayName || email.split('@')[0],
            businessName: profile.displayName || email.split('@')[0],
            businessType: 'Services',
            authProvider: 'google',
            googleId: profile.id,
            isEmailVerified: true,
            avatarUrl: profile.photos?.[0]?.value,
          });
        }

        return done(null, user);
      } catch (error) {
        return done(error as Error, undefined);
      }
    }
  )
);

export default passport;
