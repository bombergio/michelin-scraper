-- AlterTable
CREATE SEQUENCE error_id_seq;
ALTER TABLE "Error" ALTER COLUMN "id" SET DEFAULT nextval('error_id_seq');
ALTER SEQUENCE error_id_seq OWNED BY "Error"."id";
