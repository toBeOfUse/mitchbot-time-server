// app/api/auth/[...auth].ts
import { passportAuth } from "blitz";
import { Strategy as DiscordStrategy } from "passport-discord";
import secrets from "./discordAppInfo";
import db from "db";

export default passportAuth({
  successRedirectUrl: "/",
  errorRedirectUrl: "/",
  strategies: [
    {
      strategy: new DiscordStrategy(
        {
          ...secrets,
          callbackURL: "/api/auth/discord/callback",
          scope: ["identity", "email"],
        },
        async function (_accessToken, _refreshToken, profile, done) {
          if (!profile.email) {
            return done(new Error("discord login didn't work to identify user"));
          }
          const user = await db.user.upsert({
            where: { email: profile.email },
            create: {
              email: profile.email,
              username: profile.username,
              avatarURL: profile.avatar ?? "",
            },
            update: { email: profile.email },
          });
          const publicData = {
            userID: user.id,
            roles: [user.role],
            source: "discord",
          };
          done(undefined, { publicData });
        }
      ),
    },
  ],
});
