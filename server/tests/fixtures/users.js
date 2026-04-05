import bcrypt from "bcryptjs";
import User from "../../modules/user/models/User.js";

/**
 * Seeds standard test users into the in-memory DB.
 * The global setup.js clears the DB before every test, so we use create() directly.
 * User schema uses `name` (unique), `email` (unique). No `username` field.
 */
export const seedUsers = async () => {
  const [editorPass, clientPass, bannedPass] = await Promise.all([
    bcrypt.hash("EditorPass123!", 10),
    bcrypt.hash("ClientPass123!", 10),
    bcrypt.hash("BannedPass123!", 10),
  ]);

  const [editor, client, banned] = await Promise.all([
    User.create({
      _id: "69d245969e9f212dd7ff8af0",
      email: "editor@test.com",
      password: editorPass,
      name: "Test Editor",
      role: "editor",
      isVerified: true,
      country: "IN",
    }),
    User.create({
      _id: "69d2459b9e9f212dd7ff8bc3",
      email: "client@test.com",
      password: clientPass,
      name: "Test Client",
      role: "client",
      isVerified: true,
      country: "IN",
    }),
    User.create({
      _id: "69d245949e9f212dd7ff8acf",
      email: "banned@test.com",
      password: bannedPass,
      name: "Banned User",
      role: "client",
      isVerified: true,
      isBanned: true,
      banReason: "Violation of terms",
      country: "IN",
    }),
  ]);

  return { editor, client, banned };
};
