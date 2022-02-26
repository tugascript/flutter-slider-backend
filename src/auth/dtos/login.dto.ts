import { IsEmail, IsString } from 'class-validator';

export abstract class LoginDto {
  @IsString()
  @IsEmail()
  public email: string;
}
