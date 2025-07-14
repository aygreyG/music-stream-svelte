import prisma from './prisma';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { getServerSettings } from './serverSettings';
import { ROLE, type RoleType } from '$lib/shared/consts';

export const AUTH_COOKIE = 'access_token';
const TOKEN_VALID_TIME = 7 * 24 * 60 * 60;

interface JwtPayload {
  id: string;
  username: string;
}

export async function login(username: string, password: string) {
  const user = await prisma.user.findUnique({ where: { username } });

  if (!user || !user?.password || !(await bcrypt.compare(password, user.password))) {
    throw new Error('invalid credentials');
  }

  const serverSettings = await getServerSettings();

  if (!serverSettings?.jwtSecret) {
    throw new Error('jwt secret not set');
  }

  const jwtPayload: JwtPayload = {
    id: user.id,
    username: user.username
  };

  const token = jwt.sign(jwtPayload, serverSettings.jwtSecret, {
    expiresIn: TOKEN_VALID_TIME
  });

  return {
    token: 'Bearer ' + token,
    maxAge: TOKEN_VALID_TIME
  };
}

export async function register(
  email: string,
  password: string,
  passwordRepeat: string,
  username: string,
  role: RoleType = ROLE.USER
) {
  const userWithEmail = await prisma.user.findUnique({ where: { email } });
  const userWithUsername = await prisma.user.findUnique({ where: { username } });

  if (userWithEmail || userWithUsername) {
    throw new Error(`user already exists: ${userWithEmail ? 'email' : 'username'}`);
  }

  if (password != passwordRepeat) {
    throw new Error('passwords must match');
  }

  try {
    const passwordHash = await bcrypt.hash(password, 10);
    return prisma.user.create({ data: { email, password: passwordHash, username, role } });
  } catch (err) {
    throw new Error('something went wrong');
  }
}

export async function validateToken(authCookie: string) {
  const cookieSplit = authCookie.split(' ');

  if (cookieSplit.length < 2) {
    throw new Error('bad token');
  }

  const serverSettings = await getServerSettings();

  if (!serverSettings?.jwtSecret) {
    throw new Error('jwt secret not set');
  }

  const token = cookieSplit[1];
  const payload = jwt.verify(token, serverSettings.jwtSecret);

  if (typeof payload === 'string') {
    throw new Error('something went wrong');
  }

  const userInfo = payload as JwtPayload;

  const user = await prisma.user.findFirst({
    where: {
      username: userInfo.username,
      id: userInfo.id
    },
    select: {
      id: true,
      username: true,
      role: true,
      email: true,
      createdAt: true,
      updatedAt: true,
      playlists: {
        include: {
          tracks: true
        },
        orderBy: { createdAt: 'desc' }
      }
    }
  });

  if (!user) {
    throw new Error('user not found');
  }

  return user;
}
