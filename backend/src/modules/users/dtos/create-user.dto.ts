export class CreateUserDto {
  readonly username!: string;
  readonly email!: string;
  readonly password?: string;
  readonly avatar?: string;
  readonly googleId?: string;
}
