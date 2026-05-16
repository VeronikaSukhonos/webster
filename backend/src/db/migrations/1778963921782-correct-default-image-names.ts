import { MigrationInterface, QueryRunner } from "typeorm";

export class CorrectDefaultImageNames1778963921782 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "avatar" SET DEFAULT 'https://pub-2ed0de69d03343ee9a8fcf0d76906ca6.r2.dev/files/avatars/default-avatar.png'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "avatar" SET DEFAULT 'undefined/files/avatars/default-avatar.png'`);
    }

}
