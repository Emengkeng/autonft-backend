-- CreateTable
CREATE TABLE `Deployment` (
    `id` VARCHAR(191) NOT NULL,
    `dropletId` INTEGER NULL,
    `serverId` VARCHAR(191) NULL,
    `status` VARCHAR(191) NOT NULL,
    `error` VARCHAR(191) NULL,
    `dropletConfig` JSON NOT NULL,
    `deployConfig` JSON NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
