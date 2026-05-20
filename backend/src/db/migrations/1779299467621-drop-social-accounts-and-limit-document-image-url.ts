import { MigrationInterface, QueryRunner } from 'typeorm';

export class DropSocialAccountsAndLimitDocumentImageUrl1779299467621 implements MigrationInterface {
  name = 'DropSocialAccountsAndLimitDocumentImageUrl1779299467621';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "document_images" ALTER COLUMN "url" TYPE character varying(500) USING "url"::character varying(500)`,
    );
    await queryRunner.query(`DROP TABLE IF EXISTS "user_social_accounts"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "public"."user_social_accounts_provider_enum"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."user_social_accounts_provider_enum" AS ENUM('facebook', 'instagram')`,
    );
    await queryRunner.query(
      `CREATE TABLE "user_social_accounts" ("id" SERIAL NOT NULL, "userId" integer NOT NULL, "provider" "public"."user_social_accounts_provider_enum" NOT NULL, "providerAccountId" character varying(255) NOT NULL, "username" character varying(100), "displayName" character varying(150), "avatar" text, "accessToken" text, "refreshToken" text, "tokenExpiresAt" TIMESTAMP, "scopes" text, CONSTRAINT "PK_efc348b1255524adf7ce51dadee" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_a03a7e924c6d1732767ffa8b60" ON "user_social_accounts" ("userId", "provider")`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_e5f69c804428c5493340f8dd1a" ON "user_social_accounts" ("provider", "providerAccountId")`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_social_accounts" ADD CONSTRAINT "FK_e46bb6a19f570578db5b12a081f" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(`ALTER TABLE "document_images" ALTER COLUMN "url" TYPE text`);
  }
}
