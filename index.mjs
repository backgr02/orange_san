import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { EventBridgeClient, PutRuleCommand } from "@aws-sdk/client-eventbridge";
import { DynamoDBDocumentClient, GetCommand, PutCommand } from "@aws-sdk/lib-dynamodb";
import * as Misskey from "misskey-js";

const misskeyAPIClient = new Misskey.api.APIClient({
  origin: process.env.MISSKEY_URI,
  credential: process.env.MISSKEY_TOKEN,
});

const dynamo = DynamoDBDocumentClient.from(new DynamoDBClient({}), {
  marshallOptions: {
    removeUndefinedValues: true,
  },
});

const tableName = process.env.DYNAMODB_TABLE_NAME;

function random(min, max) {
  return Math.floor(Math.random() * (max + 1 - min)) + min;
}

async function mention(body) {
  console.log(JSON.stringify(body));

  const note = body.body.note;
  const user = body.body.note.user;

  const host = user?.host ? `@${user.host}` : "";
  return await misskeyAPIClient.request("notes/create", {
    text: `@${user.username}${host} うん`,
    replyId: note.id,
    visibility: note.visibility,
  });
}

async function test(aaa) {
  const response = await dynamo.send(new GetCommand({ TableName: tableName, Key: { id: "orange_san_info" } }));
  await dynamo.send(new PutCommand({ TableName: tableName, Item: await aaa(response.Item) }));
}

async function wakeUp() {
  const nowJst = new Date(Date.now() + (new Date().getTimezoneOffset() + 9 * 60) * 60 * 1000);
  const tomorrowDay = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"][nowJst.getDay()];
  const schedule = `cron(${random(0, 59)} ${random(21, 23)} ? * ${tomorrowDay} *)`;
  await new EventBridgeClient().send(new PutRuleCommand({ Name: "wake-up", ScheduleExpression: schedule }));
  const text = `:_zi::_lyo::_pa::blobcat_frustration: :ohayo:
#口から唾液とIQが溢れ出る音
@LoginBonus@misskey.m544.net ろぐぼ`;
  return await misskeyAPIClient.request("notes/create", { text: text });
}

async function followed(body) {
  return await createFollowing(body.body.user.id);
}

async function renote(body) {
  return await createFollowing(body.body.note.user.id);
}

async function createFollowing(userId) {
  return await misskeyAPIClient.request("following/create", { userId: userId });
}

export const handler = async (event, _context) => {
  try {
    console.log(JSON.stringify(event));
    let response = {};

    if (event.source === "aws.events") {
      if (event.resources.length > 0) {
        if (event.resources[0].endsWith("income_part-time_job")) {
          await test(async (info) => {
            console.log(JSON.stringify(info));
            let money = info?.money == null ? 0 : info.money;
            money += 3000;
            await misskeyAPIClient.request("notes/create", {
              text: `バイト代 ${(3000).toLocaleString()} 円ゲット！\n所持金: ${money.toLocaleString()} 円`,
            });
            return { id: "orange_san_info", money: money };
          });
        } else if (event.resources[0].endsWith("wake-up")) {
          response = await wakeUp();
        }
      } else {
        response = { a: "aws.events" };
      }
    } else if ("body" in event) {
      // response = await post(JSON.parse(event.body));
      const body = JSON.parse(event.body);
      console.log(JSON.stringify(body));
      if (body.type === "mention") {
        // response = await mention(body);
        response = { a: body.type };
      } else if (body.type === "followed") {
        response = await followed(body);
      } else if (body.type === "renote") {
        response = await renote(body);
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
