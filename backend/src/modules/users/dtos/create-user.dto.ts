export class CreateUserDto {
  readonly username!: string;
  readonly email!: string;
  readonly password?: string;
  readonly fullName?: string;
  readonly avatar?: string;
  readonly google_id?: string;
}
