import * as Misskey from "misskey-js";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  PutCommand,
  GetCommand,
} from "@aws-sdk/lib-dynamodb";

const misskeyAPIClient = new Misskey.api.APIClient({
  origin: process.env.MISSKEY_URI,
  credential: process.env.MISSKEY_TOKEN,
});

const client = new DynamoDBClient({});

const dynamo = DynamoDBDocumentClient.from(client, {
  marshallOptions: {
    removeUndefinedValues: true,
  },
});

const tableName = process.env.DYNAMODB_TABLE_NAME;

const commentNoTownworkList = [
  { text: "ごめん、タウンページしかない。 (´・_・`)", num: 0 },
  { text: "タウンワーク入荷しました！🚚", num: 5 },
  { text: "タウンワーク入荷しました！🚚🚚", num: 10 },
];

const commentList = [
  { text: "そんな時は、タウンワーク！🐖", num: -1 },
  { text: "かゆみ止めには、タウンワーク！🐖", num: -1 },
  { text: "タウンワークがあるじゃないか！🐖", num: -1 },
  { text: "タウンワーク、多め！🐖🐖", num: -2 },
  { text: "タウンワーク、マシマシ！！🐖🐖🐖🐖", num: -4 },
  { text: "つ「タウンワーク」🐖", num: -1 },
  { text: "TOWNWORK なんだ！🐖", num: -1 },
  { text: "そんな時にタウンワークが便利なんですよ。🐖", num: -1 },
  { text: "ちょうどタウンワーク持ってた。あげる。🐖", num: -1 },
  { text: "掻いてあげる", num: 0 },
  {
    text: "こっちがサンキューって言いたいよ。\nかゆみ止めには、タウンワーク！🐖",
    num: -1,
  },
  { text: "かゆみ止めアプリは、タウンワーク！🐖", num: -1 },
];

async function popTownwork() {
  const info = await dynamo.send(
    new GetCommand({ TableName: tableName, Key: { id: "townwork_info" } })
  );
  let stock = info.Item?.stock == null ? 0 : info.Item.stock;
  let comment = commentList[Math.floor(Math.random() * commentList.length)];
  console.log(JSON.stringify({ stock: stock, num: comment.num }));
  if (stock + comment.num < 0) {
    comment =
      commentNoTownworkList[
        Math.floor(Math.random() * commentNoTownworkList.length)
      ];
    console.log(JSON.stringify({ stock: stock, num: comment.num }));
  }
  stock += comment.num;

  await dynamo.send(
    new PutCommand({
      TableName: tableName,
      Item: { id: "townwork_info", stock: stock },
    })
  );

  return `${comment.text}\n残り： ${stock.toLocaleString()} タウンワーク`;
}

async function mention(body) {
  console.log(JSON.stringify(body));

  const note = body.body.note;
  const user = body.body.note.user;

  if (!note.tags?.includes("痒い")) {
    return {};
  }

  const host = user?.host ? `@${user.host}` : "";

  return await misskeyAPIClient.request("notes/create", {
    text: `@${user.username}${host} ${await popTownwork()}`,
    replyId: note.id,
    visibility: note.visibility,
  });
}

async function test(aaa) {
  const response = await dynamo.send(
    new GetCommand({ TableName: tableName, Key: { id: "orange_san_info" } })
  );
  await dynamo.send(
    new PutCommand({ TableName: tableName, Item: await aaa(response.Item) })
  );
}

export const handler = async (event, _context) => {
  try {
    console.log(JSON.stringify(event));
    let response = {};

    if (event.source === "aws.events") {
      if (
        event.resources.length > 0 &&
        event.resources[0].endsWith("income_part-time_job")
      ) {
        await test(async (info) => {
          console.log(JSON.stringify(info));
          let money = info?.money == null ? 0 : info.money;
          money += 3000;
          await misskeyAPIClient.request("notes/create", {
            text: `バイト代 ${(3000).toLocaleString()} 円ゲット！\n所持金： ${money.toLocaleString()} 円`,
          });
          return { id: "orange_san_info", money: money };
        });
      }
      response = { a: "aws.events" };
    } else if ("body" in event) {
      // response = await post(JSON.parse(event.body));
      const body = JSON.parse(event.body);
      if (body.type === "mention") {
        response = await mention(body);
      } else {
        response = { a: body.type };
      }
    }

    console.log(JSON.stringify(response));
    return {
      statusCode: 200,
      body: JSON.stringify(response, null, 2),
      headers: { "Content-Type": "application/json" },
    };
  } catch (err) {
    return {
      statusCode: 400,
      body: JSON.stringify(err.message, null, 2),
      headers: { "Content-Type": "application/json" },
    };
  }
};
