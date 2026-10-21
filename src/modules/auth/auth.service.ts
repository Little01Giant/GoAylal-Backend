import {
  Injectable,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Model, Types } from 'mongoose';
import { OAuth2Client } from 'google-auth-library';
import { User, UserDocument, UserRole } from './schemas/user.schema.js';
import { GoogleAuthDto } from './dto/google-auth.dto.js';

export interface VerifiedGoogleUser {
  readonly email: string;
  readonly name?: string;
  readonly picture?: string;
  readonly googleId: string;
  readonly emailVerified?: boolean;
}

export interface AuthLoginResult {
  readonly accessToken: string;
  readonly user: {
    readonly id: Types.ObjectId | string;
    readonly email: string;
    readonly name?: string;
    readonly image?: string;
    readonly role: string;
  };
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private googleClient: OAuth2Client;

  constructor(
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {
    const clientId = this.configService.get<string>('google.clientId');
    this.googleClient = new OAuth2Client(clientId);
  }

  /**
   * Google ID Token-ийг баталгаажуулж хэрэглэгчийн мэдээллийг задална
   */
  async verifyGoogleToken(idToken: string): Promise<VerifiedGoogleUser> {
    const clientId = this.configService.get<string>('google.clientId');

    // 1. Google OAuth2Client ашиглан шалгах
    try {
      const ticket = await this.googleClient.verifyIdToken({
        idToken,
        audience: clientId,
      });
      const payload = ticket.getPayload();
      if (payload && payload.email) {
        return {
          email: payload.email,
          name: payload.name ?? (payload.email.split('@')[0] ?? 'Хэрэглэгч'),
          picture: payload.picture,
          googleId: payload.sub ?? '',
          emailVerified: payload.email_verified,
        };
      }
    } catch (err) {
      this.logger.warn(`google-auth-library verification failed: ${err}`);
    }

    // 2. Fallback: Google-ийн албан ёсны tokeninfo API руу шууд хандах
    try {
      const res = await fetch(
        `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken)}`,
      );
      if (res.ok) {
        const payload = (await res.json()) as {
          email?: string;
          name?: string;
          picture?: string;
          sub?: string;
          email_verified?: string | boolean;
        };
        if (payload.email) {
          return {
            email: payload.email,
            name: payload.name ?? (payload.email.split('@')[0] ?? 'Хэрэглэгч'),
            picture: payload.picture,
            googleId: payload.sub ?? '',
            emailVerified: payload.email_verified === 'true' || payload.email_verified === true,
          };
        }
      }
    } catch (err) {
      this.logger.error(`Google tokeninfo endpoint failed: ${err}`);
    }

    throw new UnauthorizedException(
      'Google нэвтрэлтийн токен хүчингүй байна (Invalid Google ID Token)',
    );
  }

  /**
   * Google-ээр нэвтрэх эсвэл шинээр хэрэглэгч үүсгэх
   */
  async loginWithGoogle(dto: GoogleAuthDto): Promise<AuthLoginResult> {
    const googleUser = await this.verifyGoogleToken(dto.idToken);

    // Өгөгдлийн сангаас хэрэглэгчийг имэйл эсвэл googleId-аар хайх
    let user = await this.userModel.findOne({
      $or: [{ email: googleUser.email.toLowerCase() }, { googleId: googleUser.googleId }],
    });

    const superAdminEmail = 'munkhuu.munkhsaihan01@gmail.com';
    const isSuperAdmin = googleUser.email.toLowerCase() === superAdminEmail;

    if (!user) {
      // Шинэ хэрэглэгч бүртгэх
      user = await this.userModel.create({
        email: googleUser.email.toLowerCase(),
        name: dto.name || googleUser.name,
        image: dto.image || googleUser.picture,
        googleId: googleUser.googleId,
        role: isSuperAdmin ? UserRole.ADMIN : UserRole.USER,
        isActive: true,
      });
      this.logger.log(`Шинэ хэрэглэгч Google-ээр бүртгэгдлээ: ${user.email} (эрх: ${user.role})`);
    } else {
      // Мэдээлэл шинэчлэх (googleId эсвэл зураг дутуу байсан бол нөхөж хадгалах)
      let shouldSave = false;
      if (!user.googleId) {
        user.googleId = googleUser.googleId;
        shouldSave = true;
      }
      if (googleUser.picture && !user.image) {
        user.image = googleUser.picture;
        shouldSave = true;
      }
      if (isSuperAdmin && user.role !== UserRole.ADMIN) {
        user.role = UserRole.ADMIN;
        shouldSave = true;
      }
      if (shouldSave) {
        await user.save();
      }
    }

    // Системийн өөрийн JWT Access Token үүсгэх
    const payload = {
      sub: user._id.toString(),
      email: user.email,
      role: user.role,
      name: user.name,
    };

    const accessToken = await this.jwtService.signAsync(payload);

    return {
      accessToken,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        image: user.image,
        role: user.role,
      },
    };
  }

  /**
   * Хэрэглэгчийн ID-аар профайл авах
   */
  async getProfile(userId: string): Promise<UserDocument> {
    const user = await this.userModel.findById(userId).select('-__v');
    if (!user) {
      throw new UnauthorizedException('Хэрэглэгч олдсонгүй');
    }
    return user;
  }
}
