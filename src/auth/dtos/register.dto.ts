import { IsEmail, IsString, Length, Matches } from 'class-validator';
import { SLUG_REGEX } from '../../common/constants/regex';

export abstract class RegisterDto {
  @IsString()
  @Length(3, 100, {
    message: 'Name has to be between 3 and 50 characters.',
  })
  @Matches(SLUG_REGEX, {
    message: 'Name can only contain letters, dots, numbers and spaces.',
  })
  public username!: string;

  @IsString()
  @IsEmail()
  public email!: string;
}
