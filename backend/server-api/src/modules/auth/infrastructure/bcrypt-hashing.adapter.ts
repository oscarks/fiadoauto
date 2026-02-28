import { Injectable } from '@nestjs/common';
import bcrypt from 'bcrypt';
import { HashingPort } from '../domain/auth.ports';

@Injectable()
export class BcryptHashingAdapter implements HashingPort {
  private readonly rounds = 12;

  hash(plain: string): Promise<string> {
    return bcrypt.hash(plain, this.rounds);
  }

  compare(plain: string, hashed: string): Promise<boolean> {
    return bcrypt.compare(plain, hashed);
  }
}
