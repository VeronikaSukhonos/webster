import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateTemplateTypeEnum1779547577287 implements MigrationInterface {
  name = 'UpdateTemplateTypeEnum1779547577287';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "templates" ALTER COLUMN "type" TYPE text USING "type"::text`,
    );
    await queryRunner.query(
      `UPDATE "templates" SET "type" = CASE "type"
        WHEN 'instagram-post' THEN 'facebook-post'
        WHEN 'instagram-story' THEN 'facebook-story'
        WHEN 'presentation' THEN 'pinterest-pin'
        ELSE "type"
      END`,
    );
    await queryRunner.query(`DROP TYPE "public"."template_type_enum"`);
    await queryRunner.query(
      `CREATE TYPE "public"."template_type_enum" AS ENUM('other', 'collage', 'facebook-post', 'facebook-story', 'invitation', 'pinterest-pin', 'resume')`,
    );
    await queryRunner.query(
      `ALTER TABLE "templates" ALTER COLUMN "type" TYPE "public"."template_type_enum" USING "type"::"public"."template_type_enum"`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "templates" ALTER COLUMN "type" TYPE text USING "type"::text`,
    );
    await queryRunner.query(
      `UPDATE "templates" SET "type" = CASE "type"
        WHEN 'facebook-post' THEN 'instagram-post'
        WHEN 'facebook-story' THEN 'instagram-story'
        WHEN 'pinterest-pin' THEN 'presentation'
        ELSE "type"
      END`,
    );
    await queryRunner.query(`DROP TYPE "public"."template_type_enum"`);
    await queryRunner.query(
      `CREATE TYPE "public"."template_type_enum" AS ENUM('other', 'collage', 'instagram-post', 'instagram-story', 'invitation', 'presentation', 'resume')`,
    );
    await queryRunner.query(
      `ALTER TABLE "templates" ALTER COLUMN "type" TYPE "public"."template_type_enum" USING "type"::"public"."template_type_enum"`,
    );
  }
}
