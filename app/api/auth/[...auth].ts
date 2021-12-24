import { passportAuth } from "blitz";
import { Strategy as DiscordStrategy } from "passport-discord";
import secrets from "./discordAppInfo";
import db from "db";

export default passportAuth({
  successRedirectUrl: "/calendar",
  errorRedirectUrl: "/calendar",
  secureProxy: true,
  strategies: [
    {
      strategy: new DiscordStrategy(
        {
          ...secrets,
          callbackURL: "https://mitchbot.cloud/calendar/api/auth/discord/callback",
          scope: ["identify", "email"],
        },
        async function (_accessToken, _refreshToken, profile, done) {
          if (!profile.email) {
            return done(new Error("discord login didn't work to identify user"));
          }
          const avatarURL = profile.avatar
            ? `https://cdn.discordapp.com/avatars/${profile.id}/${profile.avatar}.png`
            : `https://cdn.discordapp.com/embed/avatars/${parseInt(profile.discriminator) % 5}.png`;
          const user = await db.user.upsert({
            where: { email: profile.email },
            create: {
              email: profile.email,
              username: profile.username,
              avatarURL,
            },
            update: { email: profile.email, avatarURL },
          });
          const publicData = {
            userId: user.id,
            roles: [user.role],
            source: "discord",
          };
          done(undefined, { publicData });
        }
      ),
    },
  ],
});
