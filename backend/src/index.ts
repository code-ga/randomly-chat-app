import { Elysia, t } from "elysia";
import { eq, ne, and, or, exists, arrayContained, arrayContains } from 'drizzle-orm';
import { channelTable, messagesTable, usersTable } from "./database/schema";
import { hash, compare } from "bcrypt"
import jwt from "@elysiajs/jwt";
import cors from "@elysiajs/cors";
import { Errors, serverWsMessages, unionValidator, wsMessages } from "./types";
import { Static, Type } from "@sinclair/typebox";
import { v4 as uuidV4 } from "uuid";
const { drizzle } = await import("drizzle-orm/node-postgres");
const { Pool } = await import("pg");
const pool = new Pool({
  connectionString: process.env.DATABASE_URL!,
});
const db = drizzle({ client: pool });;

const PORT = Number(process.env.PORT || 3000);
const websocketInfo = new Map<string, { id: string, user: typeof usersTable.$inferSelect, send: (message: Static<typeof serverWsMessages>) => void, roomId?: string }>();

const app = new Elysia()
  .get("/", () => "Hello Elysia")
  .use(
    jwt({
      name: 'jwt',
      secret: process.env.JWT_SECRET_KEY!,
    })
  )
  .use(
    cors({
      credentials: true,
    })
  )
  .ws("/ws", {
    open: async (ws) => { },
    message: async (ws, message: Object) => {

      try {
        unionValidator.assert(message);
      } catch (error) {
        if (!(error instanceof Error)) return console.error(error);

        return ws.send(
          JSON.stringify({
            type: "error",
            data: {
              error: Errors.BAD_MESSAGE,
              message: error.message,
            },
          })
        );
      }
      const data = message as Static<typeof wsMessages>;

      if (data.type == "authorize") {
        const userId = await ws.data.jwt.verify(data.token);
        if (!userId) {
          ws.close(1008, 'Unauthorized');
          return
        }
        await db.update(usersTable).set({ status: "online" }).where(eq(usersTable.id, Number(userId.id)));
        const user = (await db.select().from(usersTable).where(eq(usersTable.id, Number(userId.id))))[0];
        if (!user) {
          ws.close(1008, 'Unauthorized');
        }
        ws.send(JSON.stringify({ type: "authorized" }));
        websocketInfo.set(ws.id, { id: ws.id, user, send: ws.send.bind(ws) });
      }

      const user = websocketInfo.get(ws.id);
      if (!user) {
        return
      }
      const send = user.send.bind(user);
      const publish = ws.publish as (channel: string, message: Static<typeof serverWsMessages>) => void;

      if (data.type === "match") {
        const opponent = (await db.update(usersTable).set({ status: "pending" }).where(eq(usersTable.id, user.user.id)));
        if (!opponent) {
          ws.send(
            JSON.stringify({
              type: "error",
              data: {
                error: Errors.INVALID_SET,
                message: "Invalid set",
              },
            })
          );
          return;
        }
        const newUser = (await db.select().from(usersTable).where(eq(usersTable.id, user.user.id)))[0];
        websocketInfo.set(ws.id, { id: ws.id, user: newUser, send: ws.send.bind(ws) });

      } else if (data.type == "cancelMatch") {
        const opponent = (await db.update(usersTable).set({ status: "online" }).where(eq(usersTable.id, user.user.id)));
        if (!opponent) {
          ws.send(
            JSON.stringify({
              type: "error",
              data: {
                error: Errors.INVALID_SET,
                message: "Invalid set",
              },
            })
          );
          return;
        }
        const newUser = (await db.select().from(usersTable).where(eq(usersTable.id, user.user.id)))[0];
        websocketInfo.set(ws.id, { id: ws.id, user: newUser, send: ws.send.bind(ws) });
        send({
          type: "cancelMatch",
        });
      } else if (data.type === "joinRoom") {
        const room = (await db.select().from(channelTable).where(eq(channelTable.id, Number(data.roomId))))[0];
        if (!room) {
          ws.send(
            JSON.stringify({
              type: "error",
              data: {
                error: Errors.INVALID_SET,
                message: "Invalid set",
              },
            })
          );
          return;
        }
        const wsContext = websocketInfo.get(ws.id);
        if (!wsContext) {
          ws.close(1008, 'Unauthorized');
          return
        }
        wsContext.roomId = data.roomId;
        ws.subscribe(data.roomId);
        if (room.users?.includes(user.user.id)) {
          return;
        }
        await db.update(channelTable).set({ users: [...(room.users || []), user.user.id] }).where(eq(channelTable.id, Number(data.roomId)));

        publish(data.roomId, { type: "userJoined", user: user.user, room, });

        send({
          type: "joinRoom",
          roomId: data.roomId,
          room: room,

        });
      } else if (data.type === "message") {
        const roomId = websocketInfo.get(ws.id)?.roomId; console.log(data);
        if (!roomId) {
          ws.send(
            JSON.stringify({
              type: "error",
              data: {
                error: Errors.INVALID_SET,
                message: "Invalid set",
              },
            })
          );
          return;
        }
        const room = (await db.select().from(channelTable).where(eq(channelTable.id, Number(roomId))))[0];
        if (!room) {
          ws.send(
            JSON.stringify({
              type: "error",
              data: {
                error: Errors.INVALID_SET,
                message: "Invalid set",
              },
            })
          );
          return;
        }
        ;
        const message = await db.insert(messagesTable).values({ chatId: room.id, author: user.user.id, content: data.content }).returning();
        await db.update(channelTable).set({ messages: [...(room.messages || []), message[0].id] }).where(eq(channelTable.id, Number(roomId)));
        console.log({ message });
        send({
          type: "message",
          message: message[0],
        })
        publish(roomId, {
          type: "message",
          message: message[0],
        });
      } else if (data.type === "typing") {
        const roomId = websocketInfo.get(ws.id)?.roomId; console.log(data);
        if (!roomId) {
          ws.send(
            JSON.stringify({
              type: "error",
              data: {
                error: Errors.INVALID_SET,
                message: "Invalid set",
              },
            })
          );
          return;
        }
        const room = (await db.select().from(channelTable).where(eq(channelTable.id, Number(roomId))))[0];
        if (!room) {
          ws.send(
            JSON.stringify({
              type: "error",
              data: {
                error: Errors.INVALID_SET,
                message: "Invalid set",
              },
            })
          );
          return;
        }
        publish(roomId, {
          type: "typing",
          isTyping: data.isTyping,
          userId: user.user.id
        });
      }
    },
    close: (ws) => {
      const user = websocketInfo.get(ws.id);
      if (user) {
        for (const [id, info] of websocketInfo) {
          if (info.roomId === user.roomId) {
            info.send({
              type: "userLeft",
              userId: user.user.id,
              roomId: String(user.roomId)
            });
          }
        }
        db.update(usersTable).set({ status: "offline" }).where(eq(usersTable.id, user.user.id));
        websocketInfo.delete(ws.id);
        if (user.roomId) ws.unsubscribe(user.roomId);
      }
    },
  })
  .post("/auth/register", async (ctx) => {
    const { username, email, password } = ctx.body;
    const dbUser = await db.select().from(usersTable).where(eq(usersTable.email, email));
    if (dbUser.length > 0) {
      ctx.set.status = 400;
      return {
        status: "error",
        success: false,
        message: "User already exists",
      };
    }
    const hashedPassword = await hash(password, 10);
    await db.insert(usersTable).values({ username, email, password: hashedPassword });
    const user = (await db.select().from(usersTable).where(eq(usersTable.email, email)))[0];
    if (!user) {
      ctx.set.status = 400;
      return {
        status: "error",
        success: false,
        message: "User not found",
      }
    }

    ctx.cookie.auth.set({
      value: await ctx.jwt.sign({ id: user.id }),
    });

    return {
      status: "success",
      success: true,
      message: "User registered successfully",
      data: {
        user,
        token: ctx.cookie.auth.value
      }
    };
  }, {
    body: t.Object({
      username: t.String(),
      email: t.String(),
      password: t.String(),
    }),
  }).post("/auth/login", async (ctx) => {
    const { email, password } = ctx.body;
    const user = (await db.select().from(usersTable).where(eq(usersTable.email, email)))[0];
    if (!user) {
      ctx.set.status = 400;
      return {
        status: "error",
        success: false,
        message: "User not found",
      };
    }
    const isPasswordValid = await compare(password, user.password);
    if (!isPasswordValid) {
      ctx.set.status = 400;
      return {
        status: "error",
        success: false,
        message: "Invalid password",
      };
    }
    ctx.cookie.auth.set({
      value: await ctx.jwt.sign({ id: user.id }),
    });
    // ctx.cookie.auth.value = await ctx.jwt.sign({ id: user.id })

    return {
      status: "success",
      success: true,
      message: "User logged in successfully",
      data: {
        user,
        token: ctx.cookie.auth.value
      }
    };
  },
    {
      body: t.Object({
        email: t.String(),
        password: t.String(),
      }),
    }
  )
  .get("/channel/:id", async (ctx) => {
    const channel = (await db.select().from(channelTable).where(eq(channelTable.id, Number(ctx.params.id))))[0];
    if (!channel) {
      ctx.set.status = 404;
      return {
        status: "error",
        success: false,
        message: "Channel not found",
      };
    }
    return {
      status: "success",
      success: true,
      message: "Channel found",
      data: channel,
    };
  })
  .get("/user/:id", async (ctx) => {
    const user = (await db.select().from(usersTable).where(eq(usersTable.id, Number(ctx.params.id))))[0];
    if (!user) {
      ctx.set.status = 404;
      return {
        status: "error",
        success: false,
        message: "User not found",
      };
    }
    return {
      status: "success",
      success: true,
      message: "User found",
      data: user,
    };
  }).get("/channel/me", async (ctx) => {
    const userId = await ctx.jwt.verify(ctx.headers.authorization);
    if (!userId) {
      ctx.set.status = 401;
      return {
        status: "error",
        success: false,
        message: "Unauthorized",
      };
    }

    const user = (await db.select().from(usersTable).where(eq(usersTable.id, Number(userId.id))))[0];
    if (!user) {
      ctx.set.status = 401;
      return {
        status: "error",
        success: false,
        message: "Unauthorized",
      };
    }
    const channels = (await db.select().from(channelTable).where(arrayContains(channelTable.users, [user.id])));

    return {
      status: "success",
      success: true,
      message: "Channel found",
      data: {
        channels
      },
    };
  })
  .get("/auth/me", async (ctx) => {
    const userId = await ctx.jwt.verify(ctx.headers.authorization);
    if (!userId) {
      ctx.set.status = 401;
      return {
        status: "error",
        success: false,
        message: "Unauthorized",
      };
    }
    const user = (await db.select().from(usersTable).where(eq(usersTable.id, Number(userId.id))))[0];
    if (!user) {
      ctx.set.status = 401;
      return {
        status: "error",
        success: false,
        message: "Unauthorized",
      };
    }
    return {
      status: "success",
      success: true,
      message: "User found",
      data: user,
    };
  }).get("/channel/:id/users", async (ctx) => {
    const channel = (await db.select().from(channelTable).where(eq(channelTable.id, Number(ctx.params.id))))[0];
    if (!channel) {
      ctx.set.status = 404;
      return {
        status: "error",
        success: false,
        message: "Channel not found",
      };
    }
    if (!channel.users) {
      ctx.set.status = 404;
      return {
        status: "error",
        success: false,
        message: "Channel not found",
      };
    }
    const users = []
    for (const user of channel.users) {
      const userInfo = (await db.select().from(usersTable).where(eq(usersTable.id, user)))[0];
      users.push(userInfo);
    }
    const inRoomUsers = []
    for (const [id, info] of websocketInfo) {
      if (channel.users.includes(info.user.id) && Number(info.roomId) === channel.id) {
        inRoomUsers.push(info.user.id);
      }
    }
    return {
      status: "success",
      success: true,
      message: "Channel found",
      data: {
        users,
        inRoomUsers
      },
    };
  }).get("/channel/:id/messages", async (ctx) => {
    const channel = (await db.select().from(channelTable).where(eq(channelTable.id, Number(ctx.params.id))))[0];
    if (!channel) {
      ctx.set.status = 404;
      return {
        status: "error",
        success: false,
        message: "Channel not found",
      };
    }
    if (!channel.messages) {
      ctx.set.status = 404;
      return {
        status: "error",
        success: false,
        message: "Channel not found",
      };
    }
    const messages = []
    for (const message of channel.messages) {
      const messageInfo = (await db.select().from(messagesTable).where(eq(messagesTable.id, message)))[0];
      messages.push(messageInfo);
    }
    return {
      status: "success",
      success: true,
      message: "Channel found",
      data: {
        messages
      },
    };
  }).post("/channel", async (ctx) => {
    const { name } = ctx.body;
    const createRoomResult = (await db.insert(channelTable).values({
      name,
      owner: 1,
      users: [],
      messages: [],
    }).returning())[0];
    return {
      status: "success",
      success: true,
      message: "Room created",
      data: {
        channel: createRoomResult
      },
    };
  }, {
    body: t.Object({
      name: t.String(),
    })
  })
  .listen(PORT);

setInterval(async () => {
  let pendingUsers = await db.select().from(usersTable).where(and(eq(usersTable.status, "pending")));
  for (const user of pendingUsers) {
    const targetUsers = pendingUsers.filter((u) => u.id !== user.id);
    const matchedUser = targetUsers[Math.floor(Math.random() * targetUsers.length)];
    if (!matchedUser) {
      continue;
    }
    const createRoomResult = (await db.insert(channelTable).values({
      name: "random " + uuidV4(),
      owner: user.id,
      users: [user.id, matchedUser.id],
      messages: [],
    }).returning())[0];
    const roomId = String(createRoomResult.id);
    for (const [id, info] of websocketInfo) {
      if (info.user.id === user.id) {
        info.send({
          type: "matched",
          roomId,
        });
      } else if (info.user.id === matchedUser.id) {
        info.send({
          type: "matched",
          roomId,
        });
      }
    }
    await db.update(usersTable).set({ status: "joined" }).where(or(eq(usersTable.id, user.id), eq(usersTable.id, matchedUser.id)));
    pendingUsers = await db.select().from(usersTable).where(and(eq(usersTable.status, "pending")));
  }
}, Math.random() * 5000);
console.log(
  `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`
);
