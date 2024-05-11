-- CreateEnum
CREATE TYPE "GradientAngle" AS ENUM ('to_bottom', 'to_top', 'to_left', 'to_right');

-- AlterTable
ALTER TABLE "Theme" ADD COLUMN     "gradientAngle" "GradientAngle" NOT NULL DEFAULT 'to_bottom';
