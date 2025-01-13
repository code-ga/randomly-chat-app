import { Static, Type } from "@sinclair/typebox";
import { createSelectSchema } from "drizzle-typebox";
import { DiscriminatedUnionValidator } from "typebox-validators";
import { channelTable, messagesTable, usersTable } from "../database/schema";

export const wsMessages = Type.Union(
  [
    Type.Object({
      type: Type.Literal("match"),
    }),
    Type.Object({
      type: Type.Literal("message"),
      content: Type.String(),
    }),
    Type.Object({
      type: Type.Literal("cancelMatch"),
    }),
    Type.Object({
      type: Type.Literal("joinRoom"),
      roomId: Type.String(),
    }),
    Type.Object({
      type: Type.Literal("authorize"),
      token: Type.String(),
    }),
    Type.Object({
      type: Type.Literal("typing"),
      isTyping: Type.Boolean(),
    })
  ],
  { discriminantKey: "type" }
);

export const unionValidator = new DiscriminatedUnionValidator(wsMessages);

export enum Errors {
  BAD_MESSAGE,
  INVALID_SET,
}

const messageSchema = createSelectSchema(messagesTable);
const userSchema = createSelectSchema(usersTable);
const channelSchema = createSelectSchema(channelTable);
export type Channel = Static<typeof channelSchema>;
export type Message = Static<typeof messageSchema>;
export type User = Static<typeof userSchema>;

export const wsError = Type.Enum(Errors);

export const serverWsMessages = Type.Union(
  [
    Type.Object({
      type: Type.Literal("error"),
      data: Type.Object({
        error: wsError,
        message: Type.String(),
      }),
    }),
    Type.Object({
      type: Type.Literal("matched"),
      roomId: Type.String(),
    }),
    Type.Object({
      type: Type.Literal("message"),
      content: Type.String(),
    }),
    Type.Object({
      type: Type.Literal("cancelMatch"),
    }),
    Type.Object({
      type: Type.Literal("joinRoom"),
      roomId: Type.String(),
      room: channelSchema,
    }),
    Type.Object({
      type: Type.Literal("message"),
      message: messageSchema,
    }),
    Type.Object({
      type: Type.Literal("authorized"),
    }),
    Type.Object({
      type: Type.Literal("userJoined"),
      user: userSchema,
      room: channelSchema,
    }),
    Type.Object({
      type: Type.Literal("typing"),
      isTyping: Type.Boolean(),
      userId: Type.Number(),
    }),
    Type.Object({
      type: Type.Literal("userLeft"),
      userId: Type.Number(),
      roomId: Type.String(),
    }),
  ],
  { discriminantKey: "type" }
);

export const serverUnionValidator = new DiscriminatedUnionValidator(serverWsMessages);