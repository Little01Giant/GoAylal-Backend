import { Injectable, Logger, UnauthorizedException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Model, Types } from 'mongoose';
import { OAuth2Client } from 'google-auth-library';
import { User, UserDocument, UserRole } from './schemas/user.schema.js';
import { GoogleAuthDto } from './dto/google-auth.dto.js';
import type { AuthenticatedUser } from './auth.types.js';

export interface VerifiedGoogleUser {
  readonly email: string;
  readonly name: string;
  readonly picture?: string | undefined;
  readonly googleId: string;
}

export interface AuthLoginResult {
  readonly accessToken: string;
  readonly user: {
    readonly id: Types.ObjectId | string;
    readonly email: string;
    readonly name?: string | undefined;
    readonly image?: string | undefined;
    readonly role: string;
  };
}

export interface ProfileDto {
  readonly id: string;
  /** Transitional: the current frontend reads `_id` from /auth/me; remove once it uses `id`. */
  readonly _id: string;
  readonly email: string;
  readonly name?: string | undefined;
  readonly image?: string | undefined;
  readonly role: UserRole;
  readonly isActive: boolean;
  readonly createdAt?: Date | undefined;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly googleClient: OAuth2Client;

  constructor(
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {
    this.googleClient = new OAuth2Client(this.configService.get<string>('google.clientId'));
  }

  isAdminEmail(email: string): boolean {
    const admins = this.configService.get<string[]>('admin.emails') ?? [];
    return admins.includes(email.toLowerCase());
  }

  /**
   * Verifies a Google ID token with the official library (signature, expiry and audience)
   * and requires a verified email. Identity is taken from the token claims only.
   */
  async verifyGoogleToken(idToken: string): Promise<VerifiedGoogleUser> {
    const audience = this.configService.get<string>('google.clientId');
    try {
      const ticket = await this.googleClient.verifyIdToken({ idToken, audience });
      const payload = ticket.getPayload();
      if (payload?.email && payload.sub && payload.email_verified === true) {
        return {
          email: payload.email.toLowerCase(),
          name: payload.name ?? payload.email.split('@')[0] ?? 'Хэрэглэгч',
          picture: payload.picture,
          googleId: payload.sub,
        };
      }
    } catch (err) {
      this.logger.warn(`Google ID token verification failed: ${err instanceof Error ? err.message : String(err)}`);
    }
    throw new UnauthorizedException('Google нэвтрэлтийн токен хүчингүй байна (Invalid Google ID Token)');
  }

  async loginWithGoogle(dto: GoogleAuthDto): Promise<AuthLoginResult> {
    const googleUser = await this.verifyGoogleToken(dto.idToken);
    const shouldBeAdmin = this.isAdminEmail(googleUser.email);

    let user =
      (await this.userModel.findOne({ googleId: googleUser.googleId })) ??
      (await this.userModel.findOne({ email: googleUser.email }));

    if (user?.googleId && user.googleId !== googleUser.googleId) {
      // Same email, different Google identity: refuse rather than hand the account over.
      throw new UnauthorizedException('Энэ имэйл хаяг өөр Google бүртгэлтэй холбогдсон байна.');
    }

    if (!user) {
      user = await this.userModel.create({
        email: googleUser.email,
        name: googleUser.name,
        image: googleUser.picture,
        googleId: googleUser.googleId,
        role: shouldBeAdmin ? UserRole.ADMIN : UserRole.USER,
        isActive: true,
      });
      this.logger.log(`Шинэ хэрэглэгч Google-ээр бүртгэгдлээ: ${user.email} (эрх: ${user.role})`);
    } else {
      if (!user.isActive) {
        throw new ForbiddenException('Таны бүртгэл идэвхгүй болгогдсон байна.');
      }
      let shouldSave = false;
      if (!user.googleId) {
        user.googleId = googleUser.googleId;
        shouldSave = true;
      }
      if (googleUser.picture && !user.image) {
        user.image = googleUser.picture;
        shouldSave = true;
      }
      if (shouldBeAdmin && user.role !== UserRole.ADMIN) {
        user.role = UserRole.ADMIN;
        shouldSave = true;
      }
      if (shouldSave) {
        await user.save();
      }
    }

    const accessToken = await this.jwtService.signAsync({
      sub: user._id.toString(),
      email: user.email,
      role: user.role,
      name: user.name,
    });

    return {
      accessToken,
      user: { id: user._id, email: user.email, name: user.name, image: user.image, role: user.role },
    };
  }

  /**
   * Verifies a bearer token and loads the current user. Role and active state come from the
   * database so a demoted or deactivated user loses access immediately, not at token expiry.
   */
  async authenticateToken(token: string): Promise<AuthenticatedUser> {
    let sub: string;
    try {
      const payload = await this.jwtService.verifyAsync<{ sub?: string }>(token);
      if (typeof payload.sub !== 'string' || !Types.ObjectId.isValid(payload.sub)) {
        throw new Error('invalid subject');
      }
      sub = payload.sub;
    } catch {
      throw new UnauthorizedException('Токен хүчингүй эсвэл хугацаа нь дууссан байна');
    }

    const user = await this.userModel.findById(sub).lean().exec();
    if (!user || !user.isActive) {
      throw new UnauthorizedException('Хэрэглэгч олдсонгүй эсвэл идэвхгүй байна');
    }
    return { sub, email: user.email, role: user.role, name: user.name };
  }

  async getProfile(userId: string): Promise<ProfileDto> {
    const user = await this.userModel.findById(userId).lean().exec();
    if (!user) {
      throw new UnauthorizedException('Хэрэглэгч олдсонгүй');
    }
    const id = user._id.toString();
    return {
      id,
      _id: id,
      email: user.email,
      name: user.name,
      image: user.image,
      role: user.role,
      isActive: user.isActive,
      createdAt: user.createdAt,
    };
  }
}
