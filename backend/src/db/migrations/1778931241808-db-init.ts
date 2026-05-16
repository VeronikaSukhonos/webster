import { MigrationInterface, QueryRunner } from "typeorm";

export class DbInit1778931241808 implements MigrationInterface {
    name = 'DbInit1778931241808'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."template_type_enum" AS ENUM('other', 'collage', 'instagram-post', 'instagram-story', 'invitation', 'presentation', 'resume')`);
        await queryRunner.query(`CREATE TABLE "templates" ("id" SERIAL NOT NULL, "authorId" integer NOT NULL, "title" character varying(100) NOT NULL, "file" character varying(150) NOT NULL, "preview" character varying(150) NOT NULL DEFAULT '', "width" integer NOT NULL DEFAULT '1080', "height" integer NOT NULL DEFAULT '1080', "createDate" TIMESTAMP NOT NULL DEFAULT now(), "type" "public"."template_type_enum" NOT NULL, "isBuiltIn" boolean NOT NULL DEFAULT false, "projectId" integer, CONSTRAINT "PK_515948649ce0bbbe391de702ae5" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "projects" ("id" SERIAL NOT NULL, "authorId" integer NOT NULL, "title" character varying(100) NOT NULL, "description" character varying(300), "file" character varying(150) NOT NULL, "preview" character varying(150), "width" integer NOT NULL DEFAULT '1080', "height" integer NOT NULL DEFAULT '1080', "isPublic" boolean NOT NULL DEFAULT false, "createDate" TIMESTAMP NOT NULL DEFAULT now(), "editDate" TIMESTAMP NOT NULL DEFAULT now(), "templateId" integer, CONSTRAINT "PK_6271df0a7aed1d6c0691ce6ac50" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."user_social_accounts_provider_enum" AS ENUM('facebook', 'instagram')`);
        await queryRunner.query(`CREATE TABLE "user_social_accounts" ("id" SERIAL NOT NULL, "userId" integer NOT NULL, "provider" "public"."user_social_accounts_provider_enum" NOT NULL, "providerAccountId" character varying(255) NOT NULL, "username" character varying(100), "displayName" character varying(150), "avatar" text, "accessToken" text, "refreshToken" text, "tokenExpiresAt" TIMESTAMP, "scopes" text, CONSTRAINT "PK_efc348b1255524adf7ce51dadee" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_a03a7e924c6d1732767ffa8b60" ON "user_social_accounts" ("userId", "provider") `);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_e5f69c804428c5493340f8dd1a" ON "user_social_accounts" ("provider", "providerAccountId") `);
        await queryRunner.query(`CREATE TABLE "users" ("id" SERIAL NOT NULL, "email" character varying(100) NOT NULL, "username" character varying(25) NOT NULL, "avatar" character varying(150) NOT NULL DEFAULT 'undefined/files/avatars/default-avatar.png', "about" character varying(150), "registerDate" TIMESTAMP NOT NULL DEFAULT now(), "password" character varying(60), "googleId" character varying, "emailToken" character varying(300), "passwordToken" character varying(300), "refreshToken" character varying(300), "deletionToken" character varying(300), "isAdmin" boolean NOT NULL DEFAULT false, CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"), CONSTRAINT "UQ_fe0bb3f6520ee0469504521e710" UNIQUE ("username"), CONSTRAINT "UQ_f382af58ab36057334fb262efd5" UNIQUE ("googleId"), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "document_images" ("id" SERIAL NOT NULL, "localId" character varying(100) NOT NULL, "projectId" integer, "templateId" integer, "url" text NOT NULL, "deletedAt" TIMESTAMP, CONSTRAINT "CHK_document_images_single_owner" CHECK (("projectId" IS NOT NULL AND "templateId" IS NULL) OR ("projectId" IS NULL AND "templateId" IS NOT NULL)), CONSTRAINT "PK_358c18ac979fe7ce0973642f233" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_ad05309e9e0d6ea284c6a385e5" ON "document_images" ("templateId", "localId") `);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_c10da6f8c143197043b112f54c" ON "document_images" ("projectId", "localId") `);
        await queryRunner.query(`ALTER TABLE "templates" ADD CONSTRAINT "FK_04a6649a4b4ef5b5be1bd9a7e52" FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "templates" ADD CONSTRAINT "FK_bc4e60adf345780cba9e3a79023" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "projects" ADD CONSTRAINT "FK_284d88f48163afb6eea98c8b0fc" FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "projects" ADD CONSTRAINT "FK_b6d1d1b6cbe6bd0aea2e95469da" FOREIGN KEY ("templateId") REFERENCES "templates"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "user_social_accounts" ADD CONSTRAINT "FK_e46bb6a19f570578db5b12a081f" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "document_images" ADD CONSTRAINT "FK_b1e65cac0b8b160ae86aa4638a2" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "document_images" ADD CONSTRAINT "FK_aa4df94161ddcf084efd684616c" FOREIGN KEY ("templateId") REFERENCES "templates"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "document_images" DROP CONSTRAINT "FK_aa4df94161ddcf084efd684616c"`);
        await queryRunner.query(`ALTER TABLE "document_images" DROP CONSTRAINT "FK_b1e65cac0b8b160ae86aa4638a2"`);
        await queryRunner.query(`ALTER TABLE "user_social_accounts" DROP CONSTRAINT "FK_e46bb6a19f570578db5b12a081f"`);
        await queryRunner.query(`ALTER TABLE "projects" DROP CONSTRAINT "FK_b6d1d1b6cbe6bd0aea2e95469da"`);
        await queryRunner.query(`ALTER TABLE "projects" DROP CONSTRAINT "FK_284d88f48163afb6eea98c8b0fc"`);
        await queryRunner.query(`ALTER TABLE "templates" DROP CONSTRAINT "FK_bc4e60adf345780cba9e3a79023"`);
        await queryRunner.query(`ALTER TABLE "templates" DROP CONSTRAINT "FK_04a6649a4b4ef5b5be1bd9a7e52"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_c10da6f8c143197043b112f54c"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_ad05309e9e0d6ea284c6a385e5"`);
        await queryRunner.query(`DROP TABLE "document_images"`);
        await queryRunner.query(`DROP TABLE "users"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_e5f69c804428c5493340f8dd1a"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_a03a7e924c6d1732767ffa8b60"`);
        await queryRunner.query(`DROP TABLE "user_social_accounts"`);
        await queryRunner.query(`DROP TYPE "public"."user_social_accounts_provider_enum"`);
        await queryRunner.query(`DROP TABLE "projects"`);
        await queryRunner.query(`DROP TABLE "templates"`);
        await queryRunner.query(`DROP TYPE "public"."template_type_enum"`);
    }

}
