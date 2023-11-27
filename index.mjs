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
  const note = body.body.note;
  const user = body.body.note.user;

  if (
    !(
      note.tags?.includes("チンチン大小賭博18大") ||
      note.tags?.includes("チンチン大小賭博18小") ||
      note.tags?.includes("チンチン大小賭博17大") ||
      note.tags?.includes("チンチン大小賭博17小") ||
      note.tags?.includes("チンチン大小賭博16大") ||
      note.tags?.includes("チンチン大小賭博16小") ||
      note.tags?.includes("チンチン大小賭博15大") ||
      note.tags?.includes("チンチン大小賭博15小") ||
      note.tags?.includes("チンチン大小賭博14大") ||
      note.tags?.includes("チンチン大小賭博14小") ||
      note.tags?.includes("チンチン大小賭博13大") ||
      note.tags?.includes("チンチン大小賭博13小") ||
      note.tags?.includes("チンチン大小賭博12大") ||
      note.tags?.includes("チンチン大小賭博12小") ||
      note.tags?.includes("チンチン大小賭博11大") ||
      note.tags?.includes("チンチン大小賭博11小")
    )
  ) {
    console.log(JSON.stringify(note.tags));
    return {};
  }

  const match1 = note.text?.match(/^(.+)の :chinchin:/);
  const match2 = note.text?.match(/^(.+) :chinchin:/);
  const misuhai = (match1 ? match1[1] : match2 ? match2[1] : ":misuhai:").trim();
  console.log(misuhai);

  const size = [random(1, 6), random(1, 6), random(1, 6)];
  const sumSize = size[0] + size[1] + size[2];
  const sizeStr = `(🎲${size[0]}/🎲${size[1]}/🎲${size[2]})`;

  console.log(JSON.stringify(size));

  const baseSize = parseInt(note.tags[0].substr(-3, 2), 10);
  const bet = note.tags[0].substr(-1, 1);
  const host = user?.host ? `@${user.host}` : "";

  console.log(JSON.stringify(baseSize));
  console.log(JSON.stringify(bet));

  /*
  18	  1	215	216.000	1.004	 0.000	-0.140
  17	  4	212	 54.000	1.018	 0.000	-0.184
  16	 10	206	 21.600	1.048	 0.000	-0.112
  15	 20	196	 10.800	1.102	 0.000	-0.008
  14	 35	181	 6.171	1.193	-0.015	-0.067
  13	 56	160	 3.857	1.350	-0.008	 0.000
  12	 81	135	 2.666	1.600	-0.054	 0.000
  11	108	108	 2.000	2.000	 0.000	 0.000
  */

  const magnificationTable = {
    18: { 大: 216.0, 小: 1.004 },
    17: { 大: 54.0, 小: 1.018 },
    16: { 大: 21.6, 小: 1.048 },
    15: { 大: 10.8, 小: 1.102 },
    14: { 大: 6.171, 小: 1.193 },
    13: { 大: 3.857, 小: 1.35 },
    12: { 大: 2.666, 小: 1.6 },
    11: { 大: 2.0, 小: 2.0 },
  };

  const scaleX = sumSize / 10.0;
  const text = `
🍊「勝負!」
$[scale.x=${scaleX},y=1 $[rotate.deg=310 $[flip :_yi:]]]$[position.x=${scaleX - 1.0} ${misuhai} :boron: ${sizeStr}]`;
  if (sumSize >= baseSize) {
    if (bet === "大") {
      const tmp = parseInt(magnificationTable[baseSize][bet] * 1000);
      await test(async (info) => {
        let money = info?.money == null ? 0 : info.money;
        const diff = 1000 - tmp;
        money += diff;
        await misskeyAPIClient.request("notes/create", {
          text: `${text}
 合計: ${sumSize} cm (${baseSize} cm 以上) :superplay:
@${user.username}${host} へ ${tmp.toLocaleString()} 円をリターン!
🍊「このポンコツ! お仕置きだよ!」
$[scale.x=${scaleX},y=1 $[rotate.deg=310 $[flip :_yi:]]]$[position.x=${scaleX - 1.0} ${misuhai}「:uwa_xtu:」]
$[position.x=0,y=-1 :blaze:]
🍊 所持金: ${money.toLocaleString()} 円 (${diff.toLocaleString()} 円)`,
          renoteId: note.id,
          visibility: note.visibility,
        });
        await misskeyAPIClient.request("notes/reactions/create", { noteId: note.id, reaction: ":superplay:" });
        return { id: "orange_san_info", money: money };
      });
    } else if (bet === "小") {
      await test(async (info) => {
        let money = info?.money == null ? 0 : info.money;
        const diff = 1000;
        money += diff;
        await misskeyAPIClient.request("notes/create", {
          text: `${text}
 合計: ${sumSize} cm (${baseSize} cm 以上) :hazure:
@${user.username}${host} から ${diff.toLocaleString()} 円を没収!
🍊 所持金: ${money.toLocaleString()} 円 (+${diff.toLocaleString()} 円)`,
          renoteId: note.id,
          visibility: note.visibility,
        });
        await misskeyAPIClient.request("notes/reactions/create", { noteId: note.id, reaction: ":hazure:" });
        return { id: "orange_san_info", money: money };
      });
    } else {
      return {};
    }
  } else {
    if (bet === "大") {
      await test(async (info) => {
        let money = info?.money == null ? 0 : info.money;
        const diff = 1000;
        money += diff;
        await misskeyAPIClient.request("notes/create", {
          text: `${text}
 合計: ${sumSize} cm (${baseSize} cm 未満) :zantou:
@${user.username}${host} から ${diff.toLocaleString()} 円を没収!
🍊 所持金: ${money.toLocaleString()} 円 (+${diff.toLocaleString()} 円)`,
          renoteId: note.id,
          visibility: note.visibility,
        });
        await misskeyAPIClient.request("notes/reactions/create", { noteId: note.id, reaction: ":zantou:" });
        return { id: "orange_san_info", money: money };
      });
    } else if (bet === "小") {
      const tmp = parseInt(magnificationTable[baseSize][bet] * 1000);
      await test(async (info) => {
        let money = info?.money == null ? 0 : info.money;
        const diff = 1000 - tmp;
        money += diff;
        await misskeyAPIClient.request("notes/create", {
          text: `${text}
 合計: ${sumSize} cm (${baseSize} cm 未満) :atari:
@${user.username}${host} へ ${tmp.toLocaleString()} 円をリターン!
🍊 所持金: ${money.toLocaleString()} 円 (${diff.toLocaleString()} 円)`,
          renoteId: note.id,
          visibility: note.visibility,
        });
        await misskeyAPIClient.request("notes/reactions/create", { noteId: note.id, reaction: ":atari:" });
        return { id: "orange_san_info", money: money };
      });
    } else {
      return {};
    }
  }

  return {};
}

async function test(aaa) {
  const response = await dynamo.send(new GetCommand({ TableName: tableName, Key: { id: "orange_san_info" } }));
  console.log(JSON.stringify(response.Item));
  const item = await aaa(response.Item);
  console.log(JSON.stringify(item));
  await dynamo.send(new PutCommand({ TableName: tableName, Item: item }));
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
              text: `バイト代ゲット!\n🍊 所持金: ${money.toLocaleString()} 円 (+${(3000).toLocaleString()} 円)`,
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
        response = await mention(body);
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
