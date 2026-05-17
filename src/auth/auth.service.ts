import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcryptjs';
import { User, UserDocument } from './schemas/user.schema';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name)
    private userModel: Model<UserDocument>,
    private jwtService: JwtService,
  ) {}

  async validateUser(email: string, password: string): Promise<User | null> {
    const user = await this.userModel.findOne({ email: email.toLowerCase() });
    if (!user || !user.isActive) return null;

    const isPasswordValid = await bcrypt.compare(password, user.password);
    return isPasswordValid ? user : null;
  }

  async login(email: string, password: string): Promise<{ accessToken: string; user: any }> {
    const user = await this.validateUser(email, password);
    if (!user) {
      throw new UnauthorizedException('E-mail ou senha incorretos.');
    }

    const userDoc = user as any;
    const payload = { sub: userDoc._id, email: user.email, role: user.role };
    const accessToken = this.jwtService.sign(payload);

    return {
      accessToken,
      user: {
        id: userDoc._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    };
  }

  async createUser(email: string, password: string, name: string, role?: string): Promise<User> {
    const hashedPassword = await bcrypt.hash(password, 12);
    const user = new this.userModel({
      email,
      password: hashedPassword,
      name,
      role,
    });
    return user.save();
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userModel.findOne({ email: email.toLowerCase() });
  }
}
