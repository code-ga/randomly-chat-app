import { relations } from "drizzle-orm";
import { integer, pgTable, serial, text, varchar, pgEnum } from "drizzle-orm/pg-core";
export const userStatus = pgEnum("status", ["pending", "offline", "joined", "online"])
export const usersTable = pgTable("users_table", {
  id: serial("id").primaryKey(),
  username: text().notNull(),
  email: text().notNull().unique(),
  password: text().notNull(),
  status: userStatus().default("offline").notNull(),
});

export const messagesTable = pgTable("messages_table", {
  id: serial("id").primaryKey(),
  chatId: integer("chatId").notNull(),
  content: text().notNull(),
  author: integer("author").notNull().references(() => usersTable.id),
});

export const channelTable = pgTable("chats_table", {
  id: serial("id").primaryKey(),
  name: text().notNull(),
  users: integer("users").notNull().array().default([]),
  owner: integer("owner").notNull().references(() => usersTable.id),
  messages: integer("messages").notNull().array().default([]),
});



