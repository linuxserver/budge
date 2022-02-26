-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "budgetId" TEXT NOT NULL,
    "transferPayeeId" TEXT,
    "name" TEXT NOT NULL,
    "type" INTEGER NOT NULL,
    "balance" INTEGER NOT NULL DEFAULT 0,
    "cleared" INTEGER NOT NULL DEFAULT 0,
    "uncleared" INTEGER NOT NULL DEFAULT 0,
    "order" INTEGER NOT NULL DEFAULT 0,
    "created" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated" DATETIME NOT NULL,
    CONSTRAINT "Account_budgetId_fkey" FOREIGN KEY ("budgetId") REFERENCES "Budget" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION,
    CONSTRAINT "Account_transferPayeeId_fkey" FOREIGN KEY ("transferPayeeId") REFERENCES "Payee" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION
);

-- CreateTable
CREATE TABLE "BudgetMonth" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "budgetId" TEXT NOT NULL,
    "month" TEXT NOT NULL,
    "income" INTEGER NOT NULL DEFAULT 0,
    "budgeted" INTEGER NOT NULL DEFAULT 0,
    "activity" INTEGER NOT NULL DEFAULT 0,
    "underfunded" INTEGER NOT NULL DEFAULT 0,
    "created" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated" DATETIME NOT NULL,
    CONSTRAINT "BudgetMonth_budgetId_fkey" FOREIGN KEY ("budgetId") REFERENCES "Budget" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION
);

-- CreateTable
CREATE TABLE "Budget" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "toBeBudgeted" INTEGER NOT NULL DEFAULT 0,
    "created" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated" DATETIME NOT NULL,
    CONSTRAINT "Budget_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION
);

-- CreateTable
CREATE TABLE "Category" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "budgetId" TEXT NOT NULL,
    "categoryGroupId" TEXT NOT NULL,
    "trackingAccountId" TEXT,
    "name" TEXT NOT NULL,
    "inflow" BOOLEAN NOT NULL DEFAULT false,
    "locked" BOOLEAN NOT NULL DEFAULT false,
    "order" INTEGER NOT NULL DEFAULT 0,
    "created" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated" DATETIME NOT NULL,
    CONSTRAINT "Category_budgetId_fkey" FOREIGN KEY ("budgetId") REFERENCES "Budget" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION,
    CONSTRAINT "Category_categoryGroupId_fkey" FOREIGN KEY ("categoryGroupId") REFERENCES "CategoryGroup" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION
);

-- CreateTable
CREATE TABLE "CategoryGroup" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "budgetId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "internal" BOOLEAN NOT NULL DEFAULT false,
    "locked" BOOLEAN NOT NULL DEFAULT false,
    "order" INTEGER NOT NULL DEFAULT 0,
    "created" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated" DATETIME NOT NULL,
    CONSTRAINT "CategoryGroup_budgetId_fkey" FOREIGN KEY ("budgetId") REFERENCES "Budget" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION
);

-- CreateTable
CREATE TABLE "CategoryMonth" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "categoryId" TEXT NOT NULL,
    "budgetMonthId" TEXT NOT NULL,
    "month" TEXT NOT NULL,
    "budgeted" INTEGER NOT NULL DEFAULT 0,
    "activity" INTEGER NOT NULL DEFAULT 0,
    "balance" INTEGER NOT NULL DEFAULT 0,
    "created" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated" DATETIME NOT NULL,
    CONSTRAINT "CategoryMonth_budgetMonthId_fkey" FOREIGN KEY ("budgetMonthId") REFERENCES "BudgetMonth" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION,
    CONSTRAINT "CategoryMonth_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION
);

-- CreateTable
CREATE TABLE "Payee" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "budgetId" TEXT NOT NULL,
    "transferAccountId" TEXT,
    "name" TEXT NOT NULL,
    "internal" BOOLEAN NOT NULL DEFAULT false,
    "created" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated" DATETIME NOT NULL,
    CONSTRAINT "Payee_transferAccountId_fkey" FOREIGN KEY ("transferAccountId") REFERENCES "Account" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION,
    CONSTRAINT "Payee_budgetId_fkey" FOREIGN KEY ("budgetId") REFERENCES "Budget" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION
);

-- CreateTable
CREATE TABLE "Transaction" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "budgetId" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "payeeId" TEXT NOT NULL,
    "transferAccountId" TEXT,
    "transferTransactionId" TEXT,
    "categoryId" TEXT,
    "amount" INTEGER NOT NULL DEFAULT 0,
    "date" DATETIME NOT NULL,
    "memo" TEXT NOT NULL DEFAULT '',
    "status" INTEGER NOT NULL DEFAULT 0,
    "created" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated" DATETIME NOT NULL,
    CONSTRAINT "Transaction_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION,
    CONSTRAINT "Transaction_budgetId_fkey" FOREIGN KEY ("budgetId") REFERENCES "Budget" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION,
    CONSTRAINT "Transaction_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION,
    CONSTRAINT "Transaction_payeeId_fkey" FOREIGN KEY ("payeeId") REFERENCES "Payee" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "created" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated" DATETIME NOT NULL
);

-- CreateIndex
Pragma writable_schema=1;
CREATE UNIQUE INDEX "sqlite_autoindex_accounts_2" ON "Account"("transferPayeeId");
Pragma writable_schema=0;

-- CreateIndex
CREATE INDEX "IDX_0c21df54422306fdf78621fc18" ON "BudgetMonth"("month");

-- CreateIndex
CREATE INDEX "IDX_398c07457719d1899ba4f11914" ON "BudgetMonth"("budgetId");

-- CreateIndex
CREATE UNIQUE INDEX "IDX_af173d6048d44da16b00e49e24" ON "Category"("trackingAccountId");

-- CreateIndex
CREATE INDEX "IDX_e6d5be2f8c1fbd283150e043a0" ON "Category"("budgetId");

-- CreateIndex
CREATE INDEX "IDX_0dcceebef7c019bc892be7b5d0" ON "CategoryGroup"("budgetId");

-- CreateIndex
CREATE INDEX "IDX_23f4c8894717fb764a2b88ff29" ON "CategoryMonth"("month");

-- CreateIndex
CREATE INDEX "IDX_de0f1ed5fe7ad4f2254bb815be" ON "CategoryMonth"("budgetMonthId");

-- CreateIndex
CREATE INDEX "IDX_cba488e36ca6ff6eec83e91440" ON "CategoryMonth"("categoryId");

-- CreateIndex
Pragma writable_schema=1;
CREATE UNIQUE INDEX "sqlite_autoindex_payees_2" ON "Payee"("transferAccountId");
Pragma writable_schema=0;

-- CreateIndex
CREATE INDEX "IDX_7098ffeb5373b7d6344f4f1663" ON "Transaction"("transferTransactionId");

-- CreateIndex
CREATE UNIQUE INDEX "IDX_97672ac88f789774dd47f7c8be" ON "User"("email");
